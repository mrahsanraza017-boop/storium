import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Tag,
  Bell,
  Truck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Send,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  SaleBannerConfig,
  BuyThreePromoConfig,
  WatchBundleDeal,
  CityDeliveryRule,
  DeliveryEstimateConfig,
} from '../../types';
import {
  isPushNotificationSupported,
  getPushPermissionStatus,
  subscribeAdminDeviceToPush,
  unsubscribeAdminDeviceFromPush,
  sendTestPushNotification,
  isLocalDeviceSubscribed,
} from '../../services/pushNotificationService';
import { isPwaInstalled } from '../../services/pwaService';

export const AdminPromotionsTab: React.FC = () => {
  const { businessSettings, updateBusinessSettings, addToast, products } = useStore();

  const currentPromos = businessSettings.promotions;

  // Local state for editing
  const [saleBanner, setSaleBanner] = useState<SaleBannerConfig>(() => ({
    enabled: currentPromos?.saleBanner?.enabled ?? true,
    announcementText: currentPromos?.saleBanner?.announcementText || 'EXCLUSIVE HOROLOGY GALA — UP TO 20% OFF CURATED LUXURY TIMEPIECES',
    badgeText: currentPromos?.saleBanner?.badgeText || 'LIMITED EVENT',
    highlightText: currentPromos?.saleBanner?.highlightText || 'COMPLIMENTARY INSURED NATIONWIDE EXPRESS & SERIALIZED AUTHENTICITY CARD',
    ctaText: currentPromos?.saleBanner?.ctaText || 'Explore Timepieces',
    ctaTarget: currentPromos?.saleBanner?.ctaTarget || 'watches',
    couponCode: currentPromos?.saleBanner?.couponCode || 'STORIUMVIP',
    bgStyle: currentPromos?.saleBanner?.bgStyle || 'gradient',
  }));

  const [buyThree, setBuyThree] = useState<BuyThreePromoConfig>(() => ({
    enabled: currentPromos?.buyThreePromo?.enabled ?? true,
    discountPercentage: currentPromos?.buyThreePromo?.discountPercentage ?? 15,
    minWatches: currentPromos?.buyThreePromo?.minWatches ?? 3,
    bannerTitle: currentPromos?.buyThreePromo?.bannerTitle || 'BUY ANY 3 LUXURY WATCHES & GET 15% OFF AUTOMATICALLY',
    bannerSubtitle: currentPromos?.buyThreePromo?.bannerSubtitle || 'Curate your trio of mechanical & chronograph timepieces. Applied instantly at checkout.',
  }));

  const [watchDeals, setWatchDeals] = useState<WatchBundleDeal[]>(() => {
    return currentPromos?.watchDeals?.length ? currentPromos.watchDeals : [];
  });

  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryEstimateConfig>(() => ({
    enabled: currentPromos?.deliveryEstimates?.enabled ?? true,
    cutoffTime: currentPromos?.deliveryEstimates?.cutoffTime || '16:00',
    defaultMinDays: currentPromos?.deliveryEstimates?.defaultMinDays ?? 2,
    defaultMaxDays: currentPromos?.deliveryEstimates?.defaultMaxDays ?? 4,
    rules: currentPromos?.deliveryEstimates?.rules?.length ? currentPromos.deliveryEstimates.rules : [],
  }));

  // Push notifications state
  const [pushSupported, setPushSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  useEffect(() => {
    setPushSupported(isPushNotificationSupported());
    setPermissionStatus(getPushPermissionStatus());
    setIsSubscribed(isLocalDeviceSubscribed());
  }, []);

  const handleTogglePush = async () => {
    setIsSubscribing(true);
    try {
      if (isSubscribed) {
        await unsubscribeAdminDeviceFromPush();
        setIsSubscribed(false);
        addToast('info', 'Push Notifications Disabled', 'This device will no longer receive background order alerts.');
      } else {
        await subscribeAdminDeviceToPush();
        setIsSubscribed(true);
        setPermissionStatus(getPushPermissionStatus());
        addToast('success', 'Mobile Push Notifications Activated!', 'This device is now paired for real-time order alerts.');
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

  // Save all settings
  const handleSaveAll = () => {
    updateBusinessSettings({
      promotions: {
        saleBanner,
        buyThreePromo: buyThree,
        watchDeals,
        deliveryEstimates: deliveryConfig,
      },
    });
    addToast('success', 'Promotions & Deals Saved', 'Storefront banners, watch deals, and delivery rules updated.');
  };

  // Watch deal helpers
  const handleToggleDeal = (dealId: string) => {
    setWatchDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, active: !d.active } : d))
    );
  };

  const handleDeleteDeal = (dealId: string) => {
    setWatchDeals((prev) => prev.filter((d) => d.id !== dealId));
  };

  const handleAddDeal = () => {
    const newDeal: WatchBundleDeal = {
      id: `deal-${Date.now()}`,
      title: 'New Horological Deal',
      subtitle: 'Select any eligible watches to unlock special bundle pricing.',
      badge: 'SPECIAL DEAL',
      requiredCount: 2,
      discountPercentage: 15,
      featured: true,
      active: true,
    };
    setWatchDeals((prev) => [...prev, newDeal]);
  };

  // City delivery rule helpers
  const handleAddCityRule = () => {
    const newRule: CityDeliveryRule = {
      city: 'New City',
      minDays: 2,
      maxDays: 3,
      courier: 'TCS Express',
      codAvailable: true,
    };
    setDeliveryConfig((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));
  };

  const handleDeleteCityRule = (index: number) => {
    setDeliveryConfig((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleCityRuleChange = (index: number, field: keyof CityDeliveryRule, val: any) => {
    setDeliveryConfig((prev) => {
      const nextRules = [...prev.rules];
      nextRules[index] = { ...nextRules[index], [field]: val };
      return { ...prev, rules: nextRules };
    });
  };

  return (
    <div className="space-y-10 text-[#E8E8EC] max-w-6xl mx-auto pb-16">
      {/* Top Header & Save Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-[#121316] border border-[#262930] shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-extrabold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Marketing, Bundles &amp; Notifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
            Promotions &amp; Order Alerts
          </h1>
          <p className="text-xs sm:text-sm text-[#8E929E] mt-1">
            Manage promotional storefront banners, Buy 3 deals, 2-3 watch bundle offers, delivery estimates, and mobile order push notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs uppercase font-extrabold tracking-wider shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save All Changes</span>
        </button>
      </div>

      {/* MODULE 1: Mobile Order Notifications (Web Push) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-[#262930] space-y-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#262930]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F7]">Mobile Order Notifications (Web Push)</h2>
              <p className="text-xs text-[#8E929E]">
                Send instant audio/vibration push alerts to admin phones whenever a customer places an order.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestPush}
              disabled={isTestingPush}
              className="px-4 py-2 rounded-xl border border-[#262930] bg-[#181A1F] hover:bg-[#22252C] text-xs font-semibold text-[#CBD0DC] hover:text-[#F5F5F7] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{isTestingPush ? 'Testing...' : 'Send Test Alert'}</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePush}
              disabled={isSubscribing}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                isSubscribed
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-[#D4AF37] text-[#0B0C0E] hover:bg-[#E5C378]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>{isSubscribing ? 'Processing...' : isSubscribed ? 'Unsubscribe Device' : 'Enable Mobile Push'}</span>
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-[#262930] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8E929E]">Device Push Capability</span>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${pushSupported ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span className={pushSupported ? 'text-emerald-400' : 'text-rose-400'}>
                {pushSupported ? 'Supported on this device' : 'Not supported'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-[#262930] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8E929E]">Browser Notification Permission</span>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${
                permissionStatus === 'granted' ? 'bg-emerald-400' : permissionStatus === 'denied' ? 'bg-rose-500' : 'bg-amber-400'
              }`} />
              <span className="capitalize text-[#F5F5F7]">{permissionStatus}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-[#262930] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8E929E]">PWA Install Status</span>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${isPwaInstalled() ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-[#F5F5F7]">
                {isPwaInstalled() ? 'Installed as Mobile PWA' : 'Running in Web Browser'}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#8E929E] leading-relaxed">
          Tip: Open this admin page on your smartphone browser (or install the Storium PWA from the top banner), then tap &ldquo;Enable Mobile Push&rdquo; to receive instantaneous order notifications even when your phone screen is locked.
        </p>
      </div>

      {/* MODULE 2: Promotional Sale Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-[#262930] space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#262930]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F7]">Promotional Sale Banner Section</h2>
              <p className="text-xs text-[#8E929E]">
                Highlight events, seasonal sales, or limited-time galas across the top bar and homepage.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={saleBanner.enabled}
              onChange={(e) => setSaleBanner({ ...saleBanner, enabled: e.target.checked })}
              className="w-4 h-4 rounded text-[#D4AF37] focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              {saleBanner.enabled ? 'Banner Active' : 'Banner Disabled'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block text-[#8E929E] uppercase tracking-wider mb-1.5 font-medium">
              Announcement Headline
            </label>
            <input
              type="text"
              value={saleBanner.announcementText}
              onChange={(e) => setSaleBanner({ ...saleBanner, announcementText: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#8E929E] uppercase tracking-wider mb-1.5 font-medium">
              Event Badge Text
            </label>
            <input
              type="text"
              value={saleBanner.badgeText}
              onChange={(e) => setSaleBanner({ ...saleBanner, badgeText: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#8E929E] uppercase tracking-wider mb-1.5 font-medium">
              Highlight Subtext / Perk
            </label>
            <input
              type="text"
              value={saleBanner.highlightText}
              onChange={(e) => setSaleBanner({ ...saleBanner, highlightText: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#8E929E] uppercase tracking-wider mb-1.5 font-medium">
                CTA Button Text
              </label>
              <input
                type="text"
                value={saleBanner.ctaText}
                onChange={(e) => setSaleBanner({ ...saleBanner, ctaText: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#8E929E] uppercase tracking-wider mb-1.5 font-medium">
                Promo Code (Optional)
              </label>
              <input
                type="text"
                value={saleBanner.couponCode || ''}
                onChange={(e) => setSaleBanner({ ...saleBanner, couponCode: e.target.value })}
                placeholder="e.g. STORIUMVIP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] font-mono focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Storefront Preview */}
        <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-[#262930] space-y-2.5">
          <span className="text-[10px] uppercase tracking-wider text-[#8E929E] font-bold block">
            Storefront Live Preview
          </span>
          <div className="p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#121316] via-[#1a1c22] to-[#121316] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-extrabold uppercase tracking-widest">
                {saleBanner.badgeText || 'Exclusive Event'}
              </span>
              <h4 className="text-sm font-bold text-[#F5F5F7] font-serif-luxury">
                {saleBanner.announcementText}
              </h4>
              <p className="text-[11px] text-[#CBD0DC]">
                {saleBanner.highlightText}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {saleBanner.couponCode && (
                <span className="px-3 py-1.5 rounded-lg border border-dashed border-[#D4AF37]/60 text-[#D4AF37] text-[10px] font-mono font-bold">
                  CODE: {saleBanner.couponCode}
                </span>
              )}
              <span className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#0B0C0E] text-[11px] font-extrabold uppercase tracking-wider">
                {saleBanner.ctaText || 'Shop Timepieces'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 3: "Buy 3, Get 15% Off" Offer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-[#262930] space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#262930]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F7]">Buy 3, Get 15% Off Automatic Discount</h2>
              <p className="text-xs text-[#8E929E]">
                Configurable automatic cart discount applied whenever a client adds 3 or more eligible timepieces.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={buyThree.enabled}
              onChange={(e) => setBuyThree({ ...buyThree, enabled: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-400 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {buyThree.enabled ? 'Promotion Active' : 'Promotion Disabled'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div>
            <label className="block text-[#8E929E] uppercase tracking-wider mb-1.5 font-medium">
              Discount Percentage (%)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={buyThree.discountPercentage}
              onChange={(e) => setBuyThree({ ...buyThree, discountPercentage: Number(e.target.value) || 15 })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-[#8E929E] uppercase tracking-wider mb-1.5 font-medium">
              Minimum Required Watches
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={buyThree.minWatches}
              onChange={(e) => setBuyThree({ ...buyThree, minWatches: Number(e.target.value) || 3 })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-[#8E929E] uppercase tracking-wider mb-1.5 font-medium">
              Callout Banner Title
            </label>
            <input
              type="text"
              value={buyThree.bannerTitle}
              onChange={(e) => setBuyThree({ ...buyThree, bannerTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* MODULE 4: Watch Deals Section (2-3 Watch Bundles) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-[#262930] space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#262930]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F7]">Watch Deals Section (2–3 Watch Bundles)</h2>
              <p className="text-xs text-[#8E929E]">
                Configurable luxury bundle packages allowing clients to pick their duos and trios with bundle savings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddDeal}
            className="px-4 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Deal</span>
          </button>
        </div>

        <div className="space-y-4">
          {watchDeals.map((deal, idx) => (
            <div
              key={deal.id}
              className="p-5 rounded-2xl bg-[#0B0C0E] border border-[#262930] space-y-4 hover:border-[#D4AF37]/40 transition-colors"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-extrabold uppercase">
                    {deal.requiredCount} Watches Required
                  </span>
                  <span className="text-xs text-[#8E929E]">Deal #{idx + 1}</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deal.active}
                      onChange={() => handleToggleDeal(deal.id)}
                      className="w-4 h-4 rounded text-[#D4AF37] focus:ring-0 cursor-pointer"
                    />
                    <span className={deal.active ? 'text-emerald-400 font-semibold' : 'text-[#8E929E]'}>
                      {deal.active ? 'Active on Storefront' : 'Hidden'}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDeleteDeal(deal.id)}
                    className="p-1.5 rounded-lg text-[#8E929E] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete deal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[#8E929E] uppercase tracking-wider mb-1">Deal Title</label>
                  <input
                    type="text"
                    value={deal.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWatchDeals((prev) =>
                        prev.map((d) => (d.id === deal.id ? { ...d, title: val } : d))
                      );
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#121316] border border-[#262930] text-[#F5F5F7] font-semibold focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#8E929E] uppercase tracking-wider mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={deal.subtitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWatchDeals((prev) =>
                        prev.map((d) => (d.id === deal.id ? { ...d, subtitle: val } : d))
                      );
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#121316] border border-[#262930] text-[#CBD0DC] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#8E929E] uppercase tracking-wider mb-1">Watches in Bundle</label>
                  <select
                    value={deal.requiredCount}
                    onChange={(e) => {
                      const val = Number(e.target.value) as 2 | 3;
                      setWatchDeals((prev) =>
                        prev.map((d) => (d.id === deal.id ? { ...d, requiredCount: val } : d))
                      );
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#121316] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none"
                  >
                    <option value={2}>2 Watches (Duo Deal)</option>
                    <option value={3}>3 Watches (Trio Deal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8E929E] uppercase tracking-wider mb-1">Discount % or Fixed Price</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={deal.discountPercentage || 15}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setWatchDeals((prev) =>
                          prev.map((d) => (d.id === deal.id ? { ...d, discountPercentage: val } : d))
                        );
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#121316] border border-[#262930] text-[#D4AF37] font-bold focus:border-[#D4AF37] focus:outline-none"
                    />
                    <span className="text-[#8E929E] font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODULE 5: Location-Based Delivery Rules */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121316] border border-[#262930] space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#262930]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F7]">Location-Based Delivery Rules</h2>
              <p className="text-xs text-[#8E929E]">
                Configure transit duration (days) per city and same-day dispatch cutoff times.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-[#0B0C0E] px-3.5 py-2 rounded-xl border border-[#262930] text-xs">
              <input
                type="checkbox"
                checked={deliveryConfig.enabled ?? true}
                onChange={(e) => setDeliveryConfig({ ...deliveryConfig, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#D4AF37] focus:ring-0 cursor-pointer accent-[#D4AF37]"
              />
              <span className={`font-semibold ${deliveryConfig.enabled ?? true ? 'text-emerald-400' : 'text-[#8E929E]'}`}>
                {deliveryConfig.enabled ?? true ? 'Estimator Active' : 'Estimator Disabled'}
              </span>
            </label>

            <button
              type="button"
              onClick={handleAddCityRule}
              className="px-4 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add City</span>
            </button>
          </div>
        </div>

        {/* Global Timings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-[#0B0C0E] p-4 rounded-2xl border border-[#262930]">
          <div>
            <label className="block text-[#8E929E] uppercase tracking-wider mb-1 font-medium">
              Same-Day Dispatch Cutoff (PKT)
            </label>
            <input
              type="text"
              value={deliveryConfig.cutoffTime}
              onChange={(e) => setDeliveryConfig({ ...deliveryConfig, cutoffTime: e.target.value })}
              placeholder="e.g. 16:00"
              className="w-full px-3 py-2 rounded-xl bg-[#121316] border border-[#262930] text-[#F5F5F7] font-mono focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#8E929E] uppercase tracking-wider mb-1 font-medium">
              Default Min Days (Unlisted Towns)
            </label>
            <input
              type="number"
              value={deliveryConfig.defaultMinDays}
              onChange={(e) => setDeliveryConfig({ ...deliveryConfig, defaultMinDays: Number(e.target.value) || 2 })}
              className="w-full px-3 py-2 rounded-xl bg-[#121316] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#8E929E] uppercase tracking-wider mb-1 font-medium">
              Default Max Days (Unlisted Towns)
            </label>
            <input
              type="number"
              value={deliveryConfig.defaultMaxDays}
              onChange={(e) => setDeliveryConfig({ ...deliveryConfig, defaultMaxDays: Number(e.target.value) || 4 })}
              className="w-full px-3 py-2 rounded-xl bg-[#121316] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* City Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#262930] text-[#8E929E] uppercase tracking-wider">
                <th className="py-2.5 px-3">City Name</th>
                <th className="py-2.5 px-3">Min Days</th>
                <th className="py-2.5 px-3">Max Days</th>
                <th className="py-2.5 px-3">Courier Partner</th>
                <th className="py-2.5 px-3 text-center">COD</th>
                <th className="py-2.5 px-3 text-center">Service Available</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262930]/60">
              {deliveryConfig.rules.map((rule, idx) => (
                <tr key={idx} className="hover:bg-[#181A1F]/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={rule.city}
                      onChange={(e) => handleCityRuleChange(idx, 'city', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] font-semibold text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={rule.minDays}
                      onChange={(e) => handleCityRuleChange(idx, 'minDays', Number(e.target.value) || 1)}
                      className="w-16 px-2.5 py-1.5 rounded-lg bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={rule.maxDays}
                      onChange={(e) => handleCityRuleChange(idx, 'maxDays', Number(e.target.value) || 2)}
                      className="w-16 px-2.5 py-1.5 rounded-lg bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={rule.courier}
                      onChange={(e) => handleCityRuleChange(idx, 'courier', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B0C0E] border border-[#262930] text-[#CBD0DC] text-xs focus:border-[#D4AF37] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={rule.codAvailable}
                      onChange={(e) => handleCityRuleChange(idx, 'codAvailable', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-400 focus:ring-0 cursor-pointer accent-emerald-400"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={rule.available !== false}
                      onChange={(e) => handleCityRuleChange(idx, 'available', e.target.checked)}
                      title="Uncheck to mark destination as unserviced / unavailable"
                      className="w-4 h-4 rounded text-[#D4AF37] focus:ring-0 cursor-pointer accent-[#D4AF37]"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteCityRule(idx)}
                      className="p-1 rounded text-[#8E929E] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
