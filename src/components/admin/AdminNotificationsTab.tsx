import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Trash2,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  MessageSquare,
  AlertTriangle,
  Info,
  Smartphone,
  Send,
  Download,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { AdminNotification } from '../../types';
import {
  isPushNotificationSupported,
  getPushPermissionStatus,
  subscribeAdminDeviceToPush,
  unsubscribeAdminDeviceFromPush,
  sendTestPushNotification,
  isLocalDeviceSubscribed,
  getDeviceLabel,
  fetchRegisteredDevicesCount,
} from '../../services/pushNotificationService';
import { isPwaInstallable, promptPwaInstall, isPwaInstalled } from '../../services/pwaService';

interface AdminNotificationsTabProps {
  onNavigateTab: (tab: any) => void;
}

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({ onNavigateTab }) => {
  const { notifications, markNotificationRead, clearAllNotifications, addToast } = useStore();
  const [filterType, setFilterType] = useState<string>('all');

  // Push notifications state
  const [pushSupported, setPushSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState('Admin Device');
  const [pairedDeviceCount, setPairedDeviceCount] = useState<number>(0);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    setPushSupported(isPushNotificationSupported());
    setPermissionStatus(getPushPermissionStatus());
    setIsSubscribed(isLocalDeviceSubscribed());
    setDeviceLabel(getDeviceLabel());
    setCanInstallPwa(isPwaInstallable());
    setIsPwa(isPwaInstalled());

    void fetchRegisteredDevicesCount().then((count) => {
      setPairedDeviceCount(count);
    });
  }, []);

  const handleTogglePush = async () => {
    setIsSubscribing(true);
    try {
      if (isSubscribed) {
        await unsubscribeAdminDeviceFromPush();
        setIsSubscribed(false);
        setPermissionStatus(getPushPermissionStatus());
        setPairedDeviceCount((prev) => Math.max(0, prev - 1));
        addToast('info', 'Push Notifications Deactivated', 'This device will no longer receive new-order alerts.');
      } else {
        await subscribeAdminDeviceToPush();
        setIsSubscribed(true);
        setPermissionStatus(getPushPermissionStatus());
        setPairedDeviceCount((prev) => prev + 1);
        addToast('success', 'Mobile Push Notifications Activated!', 'This phone is now securely paired for real-time order alerts.');
      }
    } catch (err: any) {
      addToast('error', 'Push Activation Note', err?.message || 'Could not register push notifications on this browser.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestPush = async () => {
    setIsTestingPush(true);
    try {
      const ok = await sendTestPushNotification();
      if (ok) {
        addToast('success', 'Test Alert Dispatched', 'Check your device notification banner, sound, and vibration.');
      } else {
        addToast('info', 'Permission Required', 'Please enable notifications in your browser settings to test alerts.');
      }
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleInstallPwa = async () => {
    try {
      const outcome = await promptPwaInstall();
      if (outcome) {
        setIsPwa(true);
        setCanInstallPwa(false);
        addToast('success', 'Admin PWA Installed', 'Storium Admin app is now on your home screen.');
      }
    } catch {
      // ignore
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filterType === 'all') return notifications;
    if (filterType === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === filterType);
  }, [notifications, filterType]);

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-[#D4AF37]" />;
      case 'refund':
        return <RotateCcw className="w-4 h-4 text-rose-400" />;
      case 'inquiry':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      case 'stock':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-[#8E929E]" />;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. REAL-TIME MOBILE ORDER NOTIFICATIONS & DEVICE PAIRING PANEL */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#121316] via-[#16181D] to-[#121316] border border-[#262930] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#262930]">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-extrabold uppercase tracking-widest">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Real-Time Mobile Order Alerts</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif-luxury font-bold text-[#F5F5F7] tracking-tight">
              Admin Phone Web Push Notifications
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD0DC] leading-relaxed">
              Receive high-priority sound, vibration, and banner alerts directly on your smartphone whenever a new luxury timepiece order is placed, even when your browser is closed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {canInstallPwa && !isPwa && (
              <button
                type="button"
                onClick={handleInstallPwa}
                className="px-4 py-2.5 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-xs font-bold text-[#CBD0DC] hover:text-[#F5F5F7] border border-[#262930] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Install Mobile PWA</span>
              </button>
            )}

            {isSubscribed && (
              <button
                type="button"
                onClick={handleTestPush}
                disabled={isTestingPush}
                className="px-4 py-2.5 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-xs font-bold text-[#CBD0DC] hover:text-[#F5F5F7] border border-[#262930] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 text-[#D4AF37] ${isTestingPush ? 'animate-pulse' : ''}`} />
                <span>{isTestingPush ? 'Dispatching...' : 'Send Test Alert'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTogglePush}
              disabled={isSubscribing || !pushSupported}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
                isSubscribed
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] shadow-[#D4AF37]/20'
              }`}
            >
              {isSubscribing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : isSubscribed ? (
                <>
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                  <span>Unlink This Phone</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Push on Phone</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pairing Status Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-[#262930] space-y-1.5">
            <span className="text-[10px] text-[#8E929E] uppercase tracking-wider block font-medium">Device Status</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                isSubscribed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <span className={`text-xs font-bold ${
                isSubscribed ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {isSubscribed ? 'Paired & Receiving Alerts' : 'Not Subscribed'}
              </span>
            </div>
            <span className="text-[11px] text-[#8E929E] block truncate">{deviceLabel}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-[#262930] space-y-1.5">
            <span className="text-[10px] text-[#8E929E] uppercase tracking-wider block font-medium">Browser Permission</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F5F5F7] capitalize">
                {permissionStatus === 'granted' ? '✓ Permission Granted' : permissionStatus === 'denied' ? '✗ Blocked in Browser' : 'Default / Not Prompted'}
              </span>
            </div>
            <span className="text-[11px] text-[#8E929E] block">
              {pushSupported ? 'Web Push API Supported' : 'Unsupported Browser'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-[#262930] space-y-1.5">
            <span className="text-[10px] text-[#8E929E] uppercase tracking-wider block font-medium">PWA Mobile Shell</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#D4AF37]">
                {isPwa ? '✓ Installed App Active' : 'Browser Web Tab'}
              </span>
            </div>
            <span className="text-[11px] text-[#8E929E] block">
              {isPwa ? 'Background sync & badges active' : 'Add to Home Screen for native experience'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-[#262930] space-y-1.5">
            <span className="text-[10px] text-[#8E929E] uppercase tracking-wider block font-medium">Registered Admin Phones</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono text-[#D4AF37]">
                {pairedDeviceCount}
              </span>
              <span className="text-xs text-[#CBD0DC]">active {pairedDeviceCount === 1 ? 'device' : 'devices'}</span>
            </div>
            <span className="text-[11px] text-emerald-400/90 block">Syncing via Supabase & PHP API</span>
          </div>
        </div>

        {/* PWA & iOS/Android Guidance Note */}
        <div className="mt-5 p-3.5 rounded-2xl bg-[#181A1F]/80 border border-[#262930] flex items-start gap-3 text-xs text-[#CBD0DC]">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <span className="font-bold text-[#F5F5F7]">Mobile PWA Pairing Instructions:</span>
            <p>
              On <strong>Android</strong>: Tap &ldquo;Install Mobile PWA&rdquo; or tap browser menu &rarr; &ldquo;Add to Home Screen&rdquo;, then tap &ldquo;Enable Push on Phone&rdquo; above.
              <br />
              On <strong>Apple iOS (iPhone / iPad)</strong>: Open in Safari, tap the Share icon &rarr; &ldquo;Add to Home Screen&rdquo;, launch the Storium app from your home screen, and tap &ldquo;Enable Push on Phone&rdquo;.
            </p>
          </div>
        </div>
      </div>

      {/* 2. ADMINISTRATIVE NOTIFICATIONS HISTORY */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#121316] border border-[#262930] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold font-serif-luxury text-[#F5F5F7] text-lg">
              Notification Activity Log
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-[#8E929E] mt-0.5">
            Real-time administrative alerts for orders, payments, refunds, and inquiries
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => {
                notifications.forEach((n) => {
                  if (!n.read) markNotificationRead(n.id);
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-xs text-[#E8E8EC] border border-[#262930] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all notifications?')) clearAllNotifications();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#181A1F] hover:bg-rose-500/10 text-xs text-rose-400 border border-[#262930] hover:border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(
          [
            { id: 'all', label: 'All Alerts' },
            { id: 'unread', label: 'Unread Only' },
            { id: 'order', label: 'Orders' },
            { id: 'payment', label: 'Payments' },
            { id: 'refund', label: 'Refunds' },
            { id: 'inquiry', label: 'Inquiries' },
            { id: 'system', label: 'System' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterType === tab.id
                ? 'bg-[#D4AF37] text-[#0B0C0E] font-bold shadow-md shadow-[#D4AF37]/20'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
            <Bell className="w-8 h-8 text-[#8E929E] mx-auto opacity-50" />
            <h4 className="text-sm font-semibold text-[#F5F5F7]">No notifications to display</h4>
            <p className="text-xs text-[#8E929E]">All live alerts and updates are up to date.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                notif.read
                  ? 'bg-[#121316] border-[#262930]'
                  : 'bg-[#181A1F] border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/5'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#F5F5F7]">{notif.title}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37]" title="Unread" />
                    )}
                  </div>
                  <p className="text-xs text-[#8E929E] mt-0.5">{notif.message}</p>
                  <span className="text-[10px] text-[#8E929E] font-mono mt-1 block">
                    {new Date(notif.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {notif.linkTab && (
                  <button
                    onClick={() => {
                      if (!notif.read) markNotificationRead(notif.id);
                      onNavigateTab(notif.linkTab);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold flex items-center gap-1 border border-[#D4AF37]/30 transition-all cursor-pointer"
                  >
                    <span>View &rarr;</span>
                  </button>
                )}

                {!notif.read && (
                  <button
                    onClick={() => markNotificationRead(notif.id)}
                    className="px-2.5 py-1 rounded-lg bg-[#0B0C0E] hover:bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] text-xs border border-[#262930] transition-all cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
