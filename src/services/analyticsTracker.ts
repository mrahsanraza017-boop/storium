import { AnalyticsEvent, DateRangePreset } from '../types';
import { recordAnalyticsEventInSupabase, fetchSupabaseAnalyticsEvents } from './supabaseService';

const VISITOR_ID_KEY = 'storium_analytics_vid';
const SESSION_ID_KEY = 'storium_analytics_sid';
const BUFFER_KEY = 'storium_analytics_buffer_v2';
const LAST_HEARTBEAT_KEY = 'storium_last_heartbeat';

// Get or generate persistent anonymous visitor ID
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return 'temp_vid_' + Date.now();
  }
}

// Get or generate session-scoped ID (dies on tab close, deduplicates session)
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return 'temp_sid_' + Date.now();
  }
}

// Detect device category accurately
export function detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  const width = window.innerWidth;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (width >= 768 && width <= 1024)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua) || width < 768) {
    return 'mobile';
  }
  return 'desktop';
}

// Extract traffic source from UTM or HTTP Referrer
export function detectTrafficSource(): string {
  if (typeof window === 'undefined') return 'direct';
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) return utmSource.toLowerCase();

    const ref = document.referrer;
    if (!ref) return 'direct';

    const url = new URL(ref);
    const host = url.hostname.toLowerCase();

    if (host.includes(window.location.hostname)) return 'direct';
    if (host.includes('google')) return 'google';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('facebook') || host.includes('fb.')) return 'facebook';
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'whatsapp';
    if (host.includes('t.co') || host.includes('twitter') || host.includes('x.com')) return 'twitter';
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('youtube')) return 'youtube';
    if (host.includes('bing') || host.includes('yahoo')) return 'search';

    return 'referral';
  } catch {
    return 'direct';
  }
}

// Get local buffer of events
export function getLocalAnalyticsEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Store event in local buffer with cap
function saveEventToBuffer(event: AnalyticsEvent) {
  if (typeof window === 'undefined') return;
  try {
    const events = getLocalAnalyticsEvents();
    events.unshift(event);
    // Keep last 1,500 events locally to ensure fast calculations
    if (events.length > 1500) events.length = 1500;
    localStorage.setItem(BUFFER_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn('Failed to buffer analytics event:', err);
  }
}

// Track a page view with deduplication
export function trackPageView(path: string, pageTitle?: string): AnalyticsEvent {
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const deviceType = detectDeviceType();
  const source = detectTrafficSource();
  const referrer = typeof document !== 'undefined' ? document.referrer : '';

  const event: AnalyticsEvent = {
    eventType: 'page_view',
    path: path || '/',
    pageTitle: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
    referrer,
    source,
    deviceType,
    browser: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser') : 'Browser',
    city: 'Pakistan',
    country: 'Pakistan',
    sessionId,
    visitorId,
    createdAt: new Date().toISOString(),
  };

  // Buffer locally
  saveEventToBuffer(event);

  // Update heartbeat
  try {
    localStorage.setItem(LAST_HEARTBEAT_KEY, JSON.stringify({ visitorId, sessionId, timestamp: Date.now() }));
  } catch {}

  // Sync to Supabase in background
  recordAnalyticsEventInSupabase(event).catch(() => {});

  // GA4 & Meta Pixel SPA PageView support
  try {
    if (typeof window !== 'undefined') {
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: path,
          page_title: pageTitle || document.title,
        });
      }
      if (window.fbq) {
        window.fbq('track', 'PageView');
      }
    }
  } catch {}

  return event;
}

// Map internal event names to Meta Pixel standard event names
export const META_PIXEL_STANDARD_EVENTS_MAP: Record<string, string> = {
  add_payment_info: 'AddPaymentInfo',
  addpaymentinfo: 'AddPaymentInfo',
  AddPaymentInfo: 'AddPaymentInfo',

  add_to_cart: 'AddToCart',
  addtocart: 'AddToCart',
  AddToCart: 'AddToCart',

  add_to_wishlist: 'AddToWishlist',
  addtowishlist: 'AddToWishlist',
  AddToWishlist: 'AddToWishlist',

  complete_registration: 'CompleteRegistration',
  completeregistration: 'CompleteRegistration',
  CompleteRegistration: 'CompleteRegistration',

  contact: 'Contact',
  Contact: 'Contact',

  customize_product: 'CustomizeProduct',
  customizeproduct: 'CustomizeProduct',
  CustomizeProduct: 'CustomizeProduct',

  donate: 'Donate',
  Donate: 'Donate',

  find_location: 'FindLocation',
  findlocation: 'FindLocation',
  FindLocation: 'FindLocation',

  initiate_checkout: 'InitiateCheckout',
  initiatecheckout: 'InitiateCheckout',
  checkout_start: 'InitiateCheckout',
  InitiateCheckout: 'InitiateCheckout',

  lead: 'Lead',
  Lead: 'Lead',

  purchase: 'Purchase',
  Purchase: 'Purchase',

  schedule: 'Schedule',
  Schedule: 'Schedule',

  search: 'Search',
  Search: 'Search',

  start_trial: 'StartTrial',
  starttrial: 'StartTrial',
  StartTrial: 'StartTrial',

  submit_application: 'SubmitApplication',
  submitapplication: 'SubmitApplication',
  SubmitApplication: 'SubmitApplication',

  subscribe: 'Subscribe',
  Subscribe: 'Subscribe',

  view_content: 'ViewContent',
  viewcontent: 'ViewContent',
  ViewContent: 'ViewContent',

  page_view: 'PageView',
  PageView: 'PageView',
};

/**
 * Sanitize and standardize parameters for Meta Pixel event dispatch
 */
function sanitizeMetaPixelParams(metadata?: Record<string, any>): Record<string, any> {
  if (!metadata) return {};
  const params: Record<string, any> = { ...metadata };

  // Ensure currency is provided if value is present
  if (params.value !== undefined) {
    const numVal = typeof params.value === 'string' ? parseFloat(params.value) : Number(params.value);
    if (!isNaN(numVal)) {
      params.value = numVal;
      if (!params.currency) {
        params.currency = 'PKR';
      }
    }
  }

  // Ensure content_ids is an array of strings if given
  if (params.content_ids && !Array.isArray(params.content_ids)) {
    params.content_ids = [String(params.content_ids)];
  }

  return params;
}

/**
 * Direct call to Meta Pixel track
 */
export function trackMetaPixel(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    if (window.fbq) {
      const standardEventName = META_PIXEL_STANDARD_EVENTS_MAP[eventName] || eventName;
      const cleanParams = sanitizeMetaPixelParams(params);
      window.fbq('track', standardEventName, cleanParams);
    }
  } catch (err) {
    console.warn('Meta Pixel dispatch error:', err);
  }
}

/**
 * Direct call to Meta Pixel trackCustom for custom business events
 */
export function trackMetaCustom(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    if (window.fbq) {
      const cleanParams = sanitizeMetaPixelParams(params);
      window.fbq('trackCustom', eventName, cleanParams);
    }
  } catch (err) {
    console.warn('Meta Pixel custom dispatch error:', err);
  }
}

// Track custom user interactions (add to cart, checkout start, etc.)
export function trackEvent(eventType: AnalyticsEvent['eventType'], metadata?: Record<string, any>) {
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const event: AnalyticsEvent = {
    eventType,
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
    pageTitle: typeof document !== 'undefined' ? document.title : '',
    source: detectTrafficSource(),
    deviceType: detectDeviceType(),
    sessionId,
    visitorId,
    createdAt: new Date().toISOString(),
    metadata,
  };

  saveEventToBuffer(event);
  recordAnalyticsEventInSupabase(event).catch(() => {});

  try {
    if (typeof window !== 'undefined') {
      const cleanParams = sanitizeMetaPixelParams(metadata);

      if (window.gtag) {
        window.gtag('event', eventType, cleanParams);
      }

      if (window.fbq) {
        const standardEvent = META_PIXEL_STANDARD_EVENTS_MAP[eventType];
        if (standardEvent) {
          window.fbq('track', standardEvent, cleanParams);
        } else {
          window.fbq('trackCustom', eventType, cleanParams);
        }
      }
    }
  } catch (err) {
    console.warn('Analytics event dispatch error:', err);
  }
}

// Convenience helpers for all 17 Standard Meta Pixel Events
export const metaPixel = {
  addPaymentInfo: (params?: { value?: number; currency?: string; content_ids?: string[]; payment_type?: string; [key: string]: any }) =>
    trackEvent('add_payment_info', { currency: 'PKR', ...params }),

  addToCart: (params: { content_name?: string; content_ids?: string[]; content_type?: string; value?: number; currency?: string; [key: string]: any }) =>
    trackEvent('add_to_cart', { content_type: 'product', currency: 'PKR', ...params }),

  addToWishlist: (params: { content_name?: string; content_ids?: string[]; content_type?: string; value?: number; currency?: string; [key: string]: any }) =>
    trackEvent('add_to_wishlist', { content_type: 'product', currency: 'PKR', ...params }),

  completeRegistration: (params?: { content_name?: string; status?: string; [key: string]: any }) =>
    trackEvent('complete_registration', { status: 'successful', ...params }),

  contact: (params?: { content_name?: string; contact_method?: string; [key: string]: any }) =>
    trackEvent('contact', params),

  customizeProduct: (params?: { content_name?: string; content_ids?: string[]; custom_variant?: string; [key: string]: any }) =>
    trackEvent('customize_product', { content_type: 'product', ...params }),

  donate: (params?: { value?: number; currency?: string; [key: string]: any }) =>
    trackEvent('donate', { currency: 'PKR', ...params }),

  findLocation: (params?: { content_name?: string; [key: string]: any }) =>
    trackEvent('find_location', params),

  initiateCheckout: (params?: { value?: number; currency?: string; num_items?: number; content_ids?: string[]; [key: string]: any }) =>
    trackEvent('initiate_checkout', { currency: 'PKR', ...params }),

  lead: (params?: { content_name?: string; value?: number; currency?: string; [key: string]: any }) =>
    trackEvent('lead', { currency: 'PKR', ...params }),

  purchase: (params: { value: number; currency?: string; content_ids?: string[]; num_items?: number; order_id?: string; [key: string]: any }) =>
    trackEvent('purchase', { content_type: 'product', currency: 'PKR', ...params }),

  schedule: (params?: { content_name?: string; appointment_date?: string; [key: string]: any }) =>
    trackEvent('schedule', params),

  search: (params: { search_string: string; content_ids?: string[]; content_category?: string; [key: string]: any }) =>
    trackEvent('search', params),

  startTrial: (params?: { value?: number; currency?: string; predicted_ltv?: number; [key: string]: any }) =>
    trackEvent('start_trial', { currency: 'PKR', ...params }),

  submitApplication: (params?: { content_name?: string; [key: string]: any }) =>
    trackEvent('submit_application', params),

  subscribe: (params?: { value?: number; currency?: string; predicted_ltv?: number; [key: string]: any }) =>
    trackEvent('subscribe', { value: 0, currency: 'PKR', predicted_ltv: 0, ...params }),

  viewContent: (params: { content_name?: string; content_ids?: string[]; content_type?: string; value?: number; currency?: string; [key: string]: any }) =>
    trackEvent('view_content', { content_type: 'product', currency: 'PKR', ...params }),
};

// Calculate active live visitors within the last 5 minutes
export function getLiveVisitorsCount(): number {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const events = getLocalAnalyticsEvents();

  // Unique visitor IDs seen within last 5 minutes
  const activeVisitors = new Set<string>();
  events.forEach((ev) => {
    const time = new Date(ev.createdAt).getTime();
    if (time >= fiveMinutesAgo && ev.visitorId) {
      activeVisitors.add(ev.visitorId);
    }
  });

  // Current session is definitely active
  const currentVid = getVisitorId();
  if (currentVid) activeVisitors.add(currentVid);

  return Math.max(1, activeVisitors.size);
}

// Filter date helper
export function getDateFilterBounds(preset: DateRangePreset, customStart?: string, customEnd?: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  const end = new Date(now);

  let start = new Date(now);
  let durationMs = 24 * 60 * 60 * 1000;

  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      durationMs = end.getTime() - start.getTime();
      break;

    case 'yesterday': {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(start);
      yesterdayEnd.setHours(23, 59, 59, 999);
      end.setTime(yesterdayEnd.getTime());
      durationMs = 24 * 60 * 60 * 1000;
      break;
    }

    case 'last7days':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      durationMs = 7 * 24 * 60 * 60 * 1000;
      break;

    case 'last30days':
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      durationMs = 30 * 24 * 60 * 60 * 1000;
      break;

    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      durationMs = end.getTime() - start.getTime();
      break;

    case 'custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) {
        const cEnd = new Date(customEnd);
        cEnd.setHours(23, 59, 59, 999);
        end.setTime(cEnd.getTime());
      }
      durationMs = Math.max(24 * 60 * 60 * 1000, end.getTime() - start.getTime());
      break;
  }

  // Calculate previous equivalent comparison period
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return { start, end, prevStart, prevEnd };
}
