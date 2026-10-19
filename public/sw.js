/**
 * STORIUM Progressive Web App Service Worker (v1.0)
 * Fast, secure, luxury caching with strict exclusions for payment & admin data.
 */

const CACHE_NAME = 'storium-pwa-v1';

// Core shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.png',
  '/emblem.png',
  '/fonts/playfair-display-normal-400.woff2',
  '/fonts/manrope-normal-400.woff2',
];

// Sensitive or dynamic routes that MUST NEVER be cached
function isSensitiveOrDynamic(url) {
  const href = url.href.toLowerCase();
  const path = url.pathname.toLowerCase();

  // 1. Never cache PHP backend endpoints, payment gateways, couriers, or email APIs
  if (path.startsWith('/api/') || href.includes('/api/')) return true;
  if (href.includes('rapid-') || href.includes('safepay-') || href.includes('courier-')) return true;

  // 2. Never cache Supabase database or auth APIs
  if (href.includes('supabase.co')) return true;

  // 3. Never cache third party chat or live analytics posts
  if (href.includes('chatzy') || href.includes('s3.amazonaws.com')) return true;

  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS).catch((err) => console.warn('Precache partial:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // STRICT SECURITY RULE: Never intercept or cache sensitive/payment/admin API data
  if (isSensitiveOrDynamic(url)) {
    return;
  }

  // HTML Navigation: Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Static Assets (scripts, styles, fonts, images, webp): Stale-while-revalidate
  const isStatic =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/frames/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css');

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ============================================================================
// Web Push Notifications & Background Order Alerts
// ============================================================================
self.addEventListener('push', (event) => {
  let data = {
    title: '🛍️ New Order Received!',
    body: 'A new luxury timepiece order was placed on Storium.',
    url: '/admin',
    orderId: '',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/favicon-32.png',
    vibrate: [250, 100, 250, 100, 250],
    tag: data.orderId ? `order-${data.orderId}` : `storium-order-${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || '/admin',
      orderId: data.orderId,
    },
    actions: [
      { action: 'open_admin', title: 'Open Admin' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

