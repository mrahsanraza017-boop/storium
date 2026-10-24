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
      if ((window as any).gtag) {
        (window as any).gtag('event', 'page_view', {
          page_path: path,
          page_title: pageTitle || document.title,
        });
      }
      if ((window as any).fbq) {
        (window as any).fbq('track', 'PageView');
      }
    }
  } catch {}

  return event;
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
      if ((window as any).gtag) {
        (window as any).gtag('event', eventType, metadata || {});
      }
      if ((window as any).fbq) {
        const metaEventMap: Record<string, string> = {
          add_to_cart: 'AddToCart',
          initiate_checkout: 'InitiateCheckout',
          purchase: 'Purchase',
          view_content: 'ViewContent',
          contact: 'Contact',
          lead: 'Lead',
        };
        const standardEvent = metaEventMap[eventType];
        if (standardEvent) {
          (window as any).fbq('track', standardEvent, metadata || {});
        } else {
          (window as any).fbq('trackCustom', eventType, metadata || {});
        }
      }
    }
  } catch {}
}

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
