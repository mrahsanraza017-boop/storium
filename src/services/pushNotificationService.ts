/**
 * STORIUM Mobile Web Push Notification Service
 * Handles Web Push subscription, permissions, and new order alerts for admin mobile phones
 */

import { getSupabase } from '../lib/supabase';
import { Order } from '../types';

// Standard VAPID Public Key for client-side subscription
// Replace with production VAPID keypair in .env if desired
export const VAPID_PUBLIC_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY) ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getPushPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return 'denied';
  }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeAdminDeviceToPush(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    throw new Error('Web Push is not supported on this browser or device.');
  }

  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted by the browser.');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    try {
      const convertedVapidKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    } catch (err) {
      console.warn('PushManager.subscribe error, falling back to local notifications:', err);
    }
  }

  // Persist locally
  if (subscription) {
    try {
      localStorage.setItem('storium_push_subscribed', 'true');
      localStorage.setItem('storium_push_sub_data', JSON.stringify(subscription));

      // 1. Sync to Supabase admin_push_subscriptions table
      const supabase = await getSupabase();
      const subJson = subscription.toJSON();
      await supabase.from('admin_push_subscriptions').upsert(
        {
          endpoint: subscription.endpoint,
          keys: subJson.keys || {},
          user_agent: navigator.userAgent,
          device_label: getDeviceLabel(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

      // 2. Sync to PHP backend if available
      void fetch('/api/push-subscribe.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          deviceLabel: getDeviceLabel(),
        }),
      }).catch(() => {
        // graceful backend fallback
      });
    } catch (e) {
      console.warn('Push subscription cloud sync note:', e);
    }
  } else {
    // If PushManager is restricted on some mobile OS without PWA, allow local notification fallback
    localStorage.setItem('storium_push_subscribed', 'true');
  }

  return subscription;
}

export async function unsubscribeAdminDeviceFromPush(): Promise<boolean> {
  try {
    localStorage.removeItem('storium_push_subscribed');
    localStorage.removeItem('storium_push_sub_data');

    if (isPushNotificationSupported()) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        try {
          const supabase = await getSupabase();
          await supabase.from('admin_push_subscriptions').delete().eq('endpoint', endpoint);
        } catch {
          // ignore
        }
        try {
          void fetch('/api/push-subscribe.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unsubscribe', endpoint }),
          }).catch(() => {});
        } catch {
          // ignore
        }
      }
    }
    return true;
  } catch (err) {
    console.warn('Unsubscribe error:', err);
    return false;
  }
}

export function isLocalDeviceSubscribed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('storium_push_subscribed') === 'true' && Notification.permission === 'granted';
}

export function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Desktop Admin';
  const ua = navigator.userAgent;
  const isPwa = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );

  const pwaSuffix = isPwa ? ' (PWA Installed)' : '';

  if (/android/i.test(ua)) return `Android Mobile${pwaSuffix}`;
  if (/iphone|ipad|ipod/i.test(ua)) return `Apple iOS${pwaSuffix}`;
  if (/macintosh/i.test(ua)) return `macOS Workstation${pwaSuffix}`;
  if (/windows/i.test(ua)) return `Windows PC${pwaSuffix}`;
  return `Admin Browser${pwaSuffix}`;
}

export async function fetchRegisteredDevicesCount(): Promise<number> {
  try {
    const res = await fetch('/api/push-subscribe.php');
    if (res.ok) {
      const data = await res.json();
      if (typeof data.totalSubscribers === 'number') {
        return data.totalSubscribers;
      }
    }
  } catch {
    // fallback to Supabase query
  }

  try {
    const supabase = await getSupabase();
    const { count, error } = await supabase
      .from('admin_push_subscriptions')
      .select('*', { count: 'exact', head: true });
    if (!error && typeof count === 'number') {
      return count;
    }
  } catch {
    // ignore
  }

  return isLocalDeviceSubscribed() ? 1 : 0;
}

/**
 * Dispatch real-time new-order alert to admin device(s)
 */
export async function sendOrderNotificationToAdmin(order: Order): Promise<void> {
  if (typeof window === 'undefined') return;

  const title = `🛍️ New Order #${order.orderNumber}`;
  const body = `Rs. ${order.total.toLocaleString()} (${order.paymentMethod.toUpperCase()}) — ${order.customer.fullName}, ${order.customer.city}`;

  // 1. If notification permission is granted on this device, show high-priority native notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/favicon-32.png',
          vibrate: [300, 150, 300, 150, 300],
          tag: `order-${order.id}`,
          renotify: true,
          data: {
            url: '/admin',
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
        } as unknown as NotificationOptions);
      } else {
        new Notification(title, {
          body,
          icon: '/logo.png',
        });
      }
    } catch (err) {
      console.warn('Local order notification dispatch note:', err);
    }
  }

  // 2. Trigger secure server-side push broadcast to all other registered admin phones
  try {
    void fetch('/api/send-order-push.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: order.orderNumber,
        total: order.total,
        customerName: order.customer.fullName,
        city: order.customer.city,
        paymentMethod: order.paymentMethod,
        orderId: order.id,
      }),
    }).catch(() => {
      // PHP backend optional fallback
    });
  } catch {
    // ignore
  }
}

/**
 * Send an immediate test notification to verify sounds, vibration, and push banners
 */
export async function sendTestPushNotification(): Promise<boolean> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    const granted = await requestPushPermission();
    if (granted !== 'granted') return false;
  }

  const title = '✨ Storium Order Alert (Verified)';
  const body = 'Your mobile device is successfully paired for real-time customer order notifications.';

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/logo.png',
        badge: '/favicon-32.png',
        vibrate: [250, 100, 250],
        tag: 'storium-test-alert',
        renotify: true,
        data: { url: '/admin' },
      } as unknown as NotificationOptions);
      return true;
    } else {
      new Notification(title, { body, icon: '/logo.png' });
      return true;
    }
  } catch (err) {
    console.warn('Test notification error:', err);
    return false;
  }
}
