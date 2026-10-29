// React has no local declaration file in this project; suppress the module typing diagnostic here.
// @ts-ignore
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import {
  Product,
  Category,
  CartItem,
  Order,
  CustomerUser,
  PageView,
  ContactInquiry,
  ProductReview,
  BusinessSettings,
  Refund,
  AdminNotification,
  WatchBundleDeal,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_ORDERS, INITIAL_REVIEWS } from '../data/initialData';
import { DEFAULT_BUSINESS_SETTINGS } from '../data/businessDefaults';
import { sendOrderNotificationToAdmin } from '../services/pushNotificationService';
import {
  saveOrderToSupabase,
  saveContactToSupabase,
  fetchSupabaseOrders,
  fetchSupabaseContacts,
  fetchSupabaseProducts,
  fetchSupabaseReviews,
  fetchCustomerProfile,
  upsertCustomerProfile,
  upsertProductToSupabase,
  deleteProductFromSupabase,
  updateOrderStatusInSupabase,
  deleteOrderFromSupabase,
  updateInquiryStatusInSupabase,
  upsertReviewToSupabase,
  updateReviewStatusInSupabase,
  toggleReviewFeaturedInSupabase,
  deleteReviewFromSupabase,
  fetchSupabaseRefunds,
  saveRefundToSupabase,
  updateRefundStatusInSupabase,
  subscribeToOrdersRealtime,
} from '../services/supabaseService';
import { trackPageView, trackEvent } from '../services/analyticsTracker';
import {
  isPhoneNumberVerified,
  markPhoneNumberVerified,
  sendPhoneVerificationOTP,
  verifyPhoneOTP,
  sendPasswordResetOTP,
  resetCustomerPassword,
  saveClientAccount,
  findClientAccount,
  normalizePhoneNumber,
} from '../services/customerAuthService';
import {
  sendOrderConfirmationEmail,
  sendPaymentReceiptEmail,
  sendTestConfirmationEmail,
  getOrderReceiptHtmlPreview,
} from '../services/emailService';

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message?: string;
}

interface StoreContextType {
  // Navigation
  currentPage: PageView;
  selectedSlug: string | null;
  activeCategoryFilter: string | null;
  activeSubcategoryFilter: string | null;
  setActiveSubcategoryFilter: (sub: string | null) => void;
  navigate: (page: PageView, params?: { slug?: string; category?: string; subcategory?: string }) => void;

  // Catalog
  products: Product[];
  categories: Category[];
  getProductBySlug: (slug: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;
  addProduct: (product: Partial<Product>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (cat: Partial<Category>) => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartDiscountDescription: string;
  isBuyThreeEligible: boolean;
  watchCount: number;
  buyThreeDiscount: number;
  cartShippingFee: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number, variant?: Record<string, string>) => void;
  addWatchBundleToCart: (deal: WatchBundleDeal, products: Product[], variants?: Record<string, Record<string, string>>) => void;
  removeFromCart: (productId: string, variantKey?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variantKey?: string) => void;
  clearCart: () => void;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;

  // Wishlist
  wishlist: string[]; // array of product ids
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Orders
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
  updateOrderCourierBooking: (
    orderId: string,
    courierData: {
      trackingNumber: string;
      courierName: string;
      courierInvoiceUrl?: string;
      courierBookingId?: number | string;
      orderStatus?: Order['orderStatus'];
    }
  ) => void;
  markOrderPaid: (orderNumber: string) => void;
  deleteOrder: (orderNumber: string) => Promise<void>;
  deleteOrdersByNumber: (orderNumbers: string[]) => Promise<void>;
  sendConfirmationEmail: (order: Order) => Promise<{ success: boolean; message?: string; error?: string; method?: string }>;
  sendTestEmail: (toEmail: string) => Promise<{ success: boolean; message?: string; error?: string; method?: string }>;
  updateInquiryStatus: (inquiryId: string, status: ContactInquiry['status']) => void;
  lastPlacedOrder: Order | null;

  // Concierge / Inquiries
  inquiries: ContactInquiry[];
  submitContactInquiry: (
    inquiryData: Omit<ContactInquiry, 'id' | 'createdAt' | 'status'>
  ) => Promise<{ success: boolean; supabaseSynced: boolean; message?: string }>;

  // Reviews
  reviews: ProductReview[];
  getReviewsForProduct: (productId: string, approvedOnly?: boolean) => ProductReview[];
  getProductRatingSummary: (productId: string) => { average: number; count: number };
  getFeaturedHomeReviews: () => ProductReview[];
  submitReview: (input: {
    productId: string;
    rating: 1 | 2 | 3 | 4 | 5;
    title: string;
    body: string;
    city?: string;
  }) => { success: boolean; message?: string };
  updateReviewStatus: (reviewId: string, status: ProductReview['status']) => void;
  toggleReviewFeatured: (reviewId: string) => void;
  deleteReview: (reviewId: string) => void;

  // Supabase Sync
  isSupabaseSyncing: boolean;
  syncWithSupabase: () => Promise<void>;

  // Customer / Auth
  currentUser: CustomerUser | null;
  loginUser: (
    email: string,
    fullName: string,
    password: string,
    createAccount?: boolean,
    phone?: string
  ) => Promise<{ success: boolean; message?: string; needsEmailConfirmation?: boolean; needsPhoneVerification?: boolean }>;
  logoutUser: () => void;
  updateUserProfile: (updates: Partial<CustomerUser>) => void;
  sendPhoneVerificationCode: (phone: string) => Promise<{ success: boolean; code?: string; message?: string; isAlreadyVerified?: boolean }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ success: boolean; message?: string }>;
  requestPasswordReset: (identifier: string) => Promise<{ success: boolean; targetType?: 'email' | 'phone'; targetValue?: string; code?: string; message?: string }>;
  confirmPasswordReset: (identifier: string, code: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  isPhoneVerified: (phone: string) => boolean;

  // Search
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Quick View Modal
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;

  // Toast
  toasts: ToastNotification[];
  addToast: (type: 'success' | 'info' | 'error', title: string, message?: string) => void;
  removeToast: (id: string) => void;

  // Refunds
  refunds: Refund[];
  createRefund: (refundData: Omit<Refund, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Refund>;
  updateRefundStatus: (refundId: string, status: Refund['status'], notes?: string) => Promise<void>;

  // Notifications
  notifications: AdminNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  addAdminNotification: (notif: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => void;

  // Business settings (editable from Admin -> Business Settings)
  businessSettings: BusinessSettings;
  updateBusinessSettings: (updates: Partial<BusinessSettings>) => void;
  resetBusinessSettings: () => void;
  setStorewideShippingFee: (flatFee: number, freeAbove?: number) => void;

  // Theme (Dark / Light)
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'storium_theme_v1',
  PRODUCTS: 'storium_products_v1',
  CATEGORIES: 'storium_categories_v1',
  CART: 'storium_cart_v1',
  WISHLIST: 'storium_wishlist_v1',
  ORDERS: 'storium_orders_v1',
  INQUIRIES: 'storium_inquiries_v1',
  REVIEWS: 'storium_reviews_v1',
  USER: 'storium_user_v1',
  SETTINGS: 'storium_settings_v1',
  REFUNDS: 'storium_refunds_v1',
  NOTIFICATIONS: 'storium_notifications_v1',
};


// Helper to parse route from current URL (pathname & query params)
function getInitialRoute(): {
  page: PageView;
  slug: string | null;
  category: string | null;
  subcategory: string | null;
} {
  if (typeof window === 'undefined') {
    return { page: 'home', slug: null, category: null, subcategory: null };
  }

  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const searchParams = new URLSearchParams(window.location.search);
  const pwaParam = searchParams.get('pwa');

  const isStandalone = (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    pwaParam === 'admin' ||
    pwaParam === '1' ||
    document.referrer.includes('android-app://')
  );

  // If opened via PWA launcher or explicitly requested admin path/param
  if (pwaParam === 'admin' || path === 'admin') {
    return { page: 'admin', slug: null, category: null, subcategory: null };
  }

  // When launched from an installed app on home screen with no subpath, open Admin Panel directly
  if (isStandalone && path === '' && !searchParams.get('page') && !searchParams.get('product')) {
    return { page: 'admin', slug: null, category: null, subcategory: null };
  }

  // Check path first
  if (path === 'watches') return { page: 'watches', slug: null, category: 'watches', subcategory: null };
  if (path === 'accessories') return { page: 'accessories', slug: null, category: 'accessories', subcategory: null };
  if (path === 'shop') {
    return {
      page: 'shop',
      slug: null,
      category: searchParams.get('category'),
      subcategory: searchParams.get('subcategory'),
    };
  }
  if (path.startsWith('product/')) {
    const slug = path.replace('product/', '');
    return { page: 'product', slug, category: null, subcategory: null };
  }
  if (path === 'about') return { page: 'about', slug: null, category: null, subcategory: null };
  if (path === 'contact') return { page: 'contact', slug: null, category: null, subcategory: null };
  if (path === 'shipping-policy') return { page: 'shipping-policy', slug: null, category: null, subcategory: null };
  if (path === 'return-policy') return { page: 'return-policy', slug: null, category: null, subcategory: null };
  if (path === 'privacy-policy') return { page: 'privacy-policy', slug: null, category: null, subcategory: null };
  if (path === 'terms') return { page: 'terms', slug: null, category: null, subcategory: null };
  if (path === 'cart') return { page: 'cart', slug: null, category: null, subcategory: null };
  if (path === 'checkout') return { page: 'checkout', slug: null, category: null, subcategory: null };
  if (path === 'account') return { page: 'account', slug: null, category: null, subcategory: null };
  if (path === 'wishlist') return { page: 'wishlist', slug: null, category: null, subcategory: null };
  if (path === 'payment/success' || path === 'payment/failure' || path === 'payment/complete') {
    return { page: 'payment-complete', slug: null, category: null, subcategory: null };
  }

  // Check query params fallback (e.g. ?page=watches or ?product=slug)
  const queryPage = searchParams.get('page') as PageView | null;
  const queryProduct = searchParams.get('product');
  if (queryProduct) {
    return { page: 'product', slug: queryProduct, category: null, subcategory: null };
  }
  if (queryPage) {
    return {
      page: queryPage,
      slug: searchParams.get('slug'),
      category: searchParams.get('category'),
      subcategory: searchParams.get('subcategory'),
    };
  }

  return { page: 'home', slug: null, category: null, subcategory: null };
}

const SEEDED_PLACEHOLDER_ACCESSORY_IDS = new Set([
  'storium-titanium-cardholder-matte',
  'storium-meteorite-cufflinks-gold',
  'storium-obsidian-leather-bifold-wallet',
  'storium-aviator-polarized-sunglasses',
  'storium-damascus-steel-signet-ring',
  'storium-titanium-cable-bracelet',
  'storium-stealth-weekender-bag',
  'storium-titanium-carabiner-key',
  'storium-precision-safety-razor',
  'storium-tuscan-reversible-belt',
  'storium-stealth-tech-cap',
  'storium-extrait-de-parfum-oud',
]);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const initialRoute = getInitialRoute();

  // Navigation State
  const [currentPage, setCurrentPage] = useState<PageView>(initialRoute.page);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialRoute.slug);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(initialRoute.category);
  const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string | null>(initialRoute.subcategory);

  // Theme State (Dark / Light) with LocalStorage Persistence
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || localStorage.getItem('storium_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // fallback
    }
    return 'dark'; // Luxury dark default
  });

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      localStorage.setItem('storium_theme', newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'light' ? '#F8F9FA' : '#0B0C0E');
    }
  }, [theme]);

  // Data State with LocalStorage Persistence
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        // Filter out initial placeholder accessories so Accessories category starts fresh for user uploads
        const cleaned = parsed.filter((p) => !SEEDED_PLACEHOLDER_ACCESSORY_IDS.has(p.id));
        const existingIds = new Set(cleaned.map((p) => p.id));
        const missing = INITIAL_PRODUCTS.filter((initP) => !existingIds.has(initP.id));
        return [...cleaned, ...missing];
      }
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;

  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) {
        const parsed: Category[] = JSON.parse(saved);
        return parsed.map((cat) =>
          cat.id === 'cat-accessories'
            ? { ...cat, name: 'Accessories', slug: 'accessories', isUpcoming: true }
            : cat
        );
      }
    } catch {
      // fallback
    }
    return INITIAL_CATEGORIES;

  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_ORDERS;
  });

  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);

  const [inquiries, setInquiries] = useState<ContactInquiry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (saved) {
        const parsed: ProductReview[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((r) => r.id));
        const missing = INITIAL_REVIEWS.filter((r) => !existingIds.has(r.id));
        return [...parsed, ...missing];
      }
    } catch {
      // fallback
    }
    return INITIAL_REVIEWS;
  });

  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Refunds state
  const [refunds, setRefunds] = useState<Refund[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REFUNDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Admin Notifications state
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'notif-pwa-welcome',
        type: 'system',
        title: 'Storium PWA Online',
        message: 'Mobile-first PWA dashboard loaded with real-time analytics and live order monitoring.',
        timestamp: new Date().toISOString(),
        read: false,
      },
    ];
  });

  // UI state
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Business settings (persisted locally; edited from Admin -> Business Settings)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<BusinessSettings>;
        return {
          ...DEFAULT_BUSINESS_SETTINGS,
          ...parsed,
          socials: { ...DEFAULT_BUSINESS_SETTINGS.socials, ...(parsed.socials || {}) },
          policies: { ...DEFAULT_BUSINESS_SETTINGS.policies, ...(parsed.policies || {}) },
          promotions: {
            ...DEFAULT_BUSINESS_SETTINGS.promotions,
            ...(parsed.promotions || {}),
            saleBanner: { ...DEFAULT_BUSINESS_SETTINGS.promotions.saleBanner, ...(parsed.promotions?.saleBanner || {}) },
            buyThreePromo: { ...DEFAULT_BUSINESS_SETTINGS.promotions.buyThreePromo, ...(parsed.promotions?.buyThreePromo || {}) },
            deliveryEstimates: { ...DEFAULT_BUSINESS_SETTINGS.promotions.deliveryEstimates, ...(parsed.promotions?.deliveryEstimates || {}) },
            watchDeals: parsed.promotions?.watchDeals?.length ? parsed.promotions.watchDeals : DEFAULT_BUSINESS_SETTINGS.promotions.watchDeals,
          },
        };
      }
    } catch {
      // fallback to defaults
    }
    return DEFAULT_BUSINESS_SETTINGS;
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(refunds));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [refunds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [inquiries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [reviews]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(businessSettings));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [businessSettings]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [currentUser]);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    const loadSession = async () => {
      const supabase = await getSupabase();
      const { data } = await supabase.auth.getSession();
      if (!mounted || !data.session) return;
      const profile = await fetchCustomerProfile(data.session.user.id);
      if (mounted && profile) setCurrentUser(profile);
    };
    // Defer the initial session lookup until idle to keep first paint unblocked.
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => { void loadSession(); }, { timeout: 3000 });
    } else {
      window.setTimeout(() => { void loadSession(); }, 1200);
    }
    void getSupabase().then((supabase) => {
      if (!mounted) return;
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!session) {
          if (mounted) setCurrentUser(null);
          return;
        }
        const profile = await fetchCustomerProfile(session.user.id);
        if (mounted && profile) setCurrentUser(profile);
      });
      unsubscribe = data.subscription.unsubscribe;
    });
    return () => { mounted = false; unsubscribe?.(); };
  }, []);

  // Sync state with Supabase backend
  const syncWithSupabase = async () => {
    setIsSupabaseSyncing(true);
    try {
      const [remoteOrders, remoteContacts, remoteProducts, remoteReviews, remoteRefunds] = await Promise.all([
        fetchSupabaseOrders(),
        fetchSupabaseContacts(),
        fetchSupabaseProducts(),
        fetchSupabaseReviews(),
        fetchSupabaseRefunds(),
      ]);

      if (remoteProducts.length > 0) setProducts(remoteProducts);

      if (Array.isArray(remoteOrders)) {
        setOrders((prev) => {
          const map = new Map<string, Order>();
          // Remote Supabase orders take precedence
          remoteOrders.forEach((o) => map.set(o.orderNumber, { ...o, supabaseSynced: true }));
          // Keep only locally cached orders that have NEVER been synced to Supabase
          prev.forEach((o) => {
            if (!o.supabaseSynced && !map.has(o.orderNumber)) {
              map.set(o.orderNumber, o);
            }
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(merged));
          } catch (e) {
            console.warn('Storage save failed', e);
          }
          return merged;
        });
      }

      if (Array.isArray(remoteRefunds)) {
        setRefunds((prev) => {
          const map = new Map<string, Refund>();
          remoteRefunds.forEach((r) => map.set(r.id, r));
          return Array.from(map.values());
        });
      }

      if (Array.isArray(remoteContacts)) {
        setInquiries((prev) => {
          const map = new Map<string, ContactInquiry>();
          remoteContacts.forEach((c) => {
            if (c.id) map.set(c.id, c);
          });
          return Array.from(map.values());
        });
      }

      if (Array.isArray(remoteReviews)) {
        setReviews((prev) => {
          const map = new Map<string, ProductReview>();
          remoteReviews.forEach((r) => {
            if (r.id) map.set(r.id, r);
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Supabase initial sync info:', err);
    } finally {
      setIsSupabaseSyncing(false);
    }
  };

  // Background sync on mount, visibility changes, and periodic polling
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      void syncWithSupabase();
    };

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run, { timeout: 3000 });
    } else {
      window.setTimeout(run, 1500);
    }

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        void syncWithSupabase();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Periodic sync every 20 seconds while app is in foreground
    const interval = window.setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        void syncWithSupabase();
      }
    }, 20000);

    return () => {
      cancelled = true;
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.clearInterval(interval);
    };
  }, []);

  // Real-time visitor tracking for page views & active session heartbeat
  useEffect(() => {
    trackPageView(currentPage, selectedSlug ? `Product: ${selectedSlug}` : `Page: ${currentPage}`);

    const heartbeat = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        trackPageView(currentPage, selectedSlug ? `Product: ${selectedSlug}` : `Page: ${currentPage}`);
      }
    }, 60000);

    return () => clearInterval(heartbeat);
  }, [currentPage, selectedSlug]);

  // Real-time Supabase listener for live orders (Insert, Update, Delete)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToOrdersRealtime(
        (incomingOrder) => {
          setOrders((prev) => {
            if (prev.some((o) => o.orderNumber === incomingOrder.orderNumber || o.id === incomingOrder.id)) {
              return prev;
            }
            return [incomingOrder, ...prev];
          });
          addAdminNotification({
            type: 'order',
            title: 'New Live Order',
            message: `Order #${incomingOrder.orderNumber} for PKR ${incomingOrder.total?.toLocaleString()} from ${incomingOrder.customer.fullName}`,
            linkTab: 'orders',
            data: { orderId: incomingOrder.id, orderNumber: incomingOrder.orderNumber },
          });
          void sendOrderNotificationToAdmin(incomingOrder);
          addToast('success', 'Realtime Order Received!', `Order #${incomingOrder.orderNumber} just placed.`);
        },
        (updatedOrder) => {
          setOrders((prev) =>
            prev.map((o) => (o.orderNumber === updatedOrder.orderNumber || o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
          );
        },
        (deletedIdentifier) => {
          if (!deletedIdentifier) return;
          setOrders((prev) => {
            const filtered = prev.filter(
              (o) => o.id !== deletedIdentifier && o.orderNumber !== deletedIdentifier
            );
            try {
              localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
            } catch (e) {
              console.warn('Failed to update localStorage on realtime delete', e);
            }
            return filtered;
          });
        }
      );
    } catch (err) {
      console.warn('Could not subscribe to orders realtime:', err);
    }

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(window.location.pathname === '/admin' ? 'admin' : 'home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Toast Helpers
  const addToast = (type: 'success' | 'info' | 'error', title: string, message?: string) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Business settings management
  const updateBusinessSettings = (updates: Partial<BusinessSettings>) => {
    setBusinessSettings((prev) => ({ ...prev, ...updates }));
    addToast('success', 'Business Settings Saved', 'Your store information has been updated throughout the website.');
  };

  const resetBusinessSettings = () => {
    setBusinessSettings(DEFAULT_BUSINESS_SETTINGS);
    addToast('info', 'Settings Reset', 'Business settings were restored to the website defaults.');
  };

  // Quick Storewide Shipping Fee Editor for Admin Panel (applies to all products nationwide)
  const setStorewideShippingFee = (flatFee: number, freeAbove?: number) => {
    const nextFlatFee = Math.max(0, Number(flatFee) || 0);
    const nextFreeAbove = freeAbove !== undefined ? Math.max(0, Number(freeAbove) || 0) : businessSettings.shippingFreeAbove;
    setBusinessSettings((prev) => ({
      ...prev,
      shippingFlatFee: nextFlatFee,
      shippingFreeAbove: nextFreeAbove,
    }));
    addToast(
      'success',
      'Shipping Fee Updated Storewide',
      nextFlatFee === 0
        ? 'Free Delivery has been activated for all products nationwide.'
        : `Flat shipping fee set to Rs. ${nextFlatFee.toLocaleString()} storewide across all products.`
    );
  };

  // Helper to build canonical relative URL for routes
  const getUrlForRoute = (
    page: PageView,
    params?: { slug?: string; category?: string; subcategory?: string }
  ): string => {
    if (page === 'home') return '/';
    if (page === 'product') {
      const slug = params?.slug || selectedSlug;
      return slug ? `/product/${slug}` : '/watches';
    }
    if (page === 'watches') return '/watches';
    if (page === 'accessories') return '/accessories';
    if (page === 'shop') {
      if (params?.category) {
        return `/shop?category=${encodeURIComponent(params.category)}`;
      }
      return '/shop';
    }
    return `/${page}`;
  };

  // Popstate listener for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRoute();
      setCurrentPage(route.page);
      setSelectedSlug(route.slug);
      setActiveCategoryFilter(route.category);
      setActiveSubcategoryFilter(route.subcategory);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation Helper
  const navigate = (
    page: PageView,
    params?: { slug?: string; category?: string; subcategory?: string }
  ) => {
    setCurrentPage(page);
    if (params?.slug !== undefined) setSelectedSlug(params.slug);
    if (params?.category !== undefined) setActiveCategoryFilter(params.category);
    if (params?.subcategory !== undefined) setActiveSubcategoryFilter(params.subcategory);

    if (typeof window !== 'undefined') {
      const targetUrl = getUrlForRoute(page, params);
      const currentFullUrl = window.location.pathname + window.location.search;
      if (currentFullUrl !== targetUrl) {
        try {
          window.history.pushState({ page, params }, '', targetUrl);
        } catch {
          // fallback if origin restrictions apply
        }
      }
    }

    // Scroll window to top cleanly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart Calculations
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const effectivePrice = item.product.salePrice ?? item.product.price;
    return sum + effectivePrice * item.quantity;
  }, 0);

  // Watch count & "Buy 3, Get 15% Off" promotion calculation
  const watchItems = cart.filter((item) => item.product.category === 'watches');
  const watchCount = watchItems.reduce((sum, item) => sum + item.quantity, 0);
  const watchSubtotal = watchItems.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const buyThreeConfig = businessSettings.promotions?.buyThreePromo;
  const isBuyThreeEligible = Boolean(
    buyThreeConfig?.enabled && watchCount >= (buyThreeConfig?.minWatches || 3)
  );

  const buyThreeDiscount = isBuyThreeEligible
    ? Math.round(watchSubtotal * ((buyThreeConfig?.discountPercentage || 15) / 100))
    : 0;

  // Watch Bundle Deals evaluation (2-watch duo or 3-watch trio)
  const watchDeals = businessSettings.promotions?.watchDeals || [];
  const activeWatchDeals = watchDeals.filter((d) => d.active);

  let bestDealDiscount = 0;
  let bestDealDescription = '';

  for (const deal of activeWatchDeals) {
    if (watchCount >= deal.requiredCount) {
      let dealDiscount = 0;
      if (deal.fixedBundlePrice && deal.fixedBundlePrice > 0) {
        dealDiscount = Math.max(0, watchSubtotal - deal.fixedBundlePrice);
      } else if (deal.discountPercentage && deal.discountPercentage > 0) {
        dealDiscount = Math.round(watchSubtotal * (deal.discountPercentage / 100));
      }

      if (dealDiscount > bestDealDiscount) {
        bestDealDiscount = dealDiscount;
        bestDealDescription = `${deal.title} (${deal.discountPercentage ? deal.discountPercentage + '% OFF' : 'Bundle Price'})`;
      }
    }
  }

  // Stacking Protection: Apply the maximum eligible promotional discount
  let cartDiscount = 0;
  let cartDiscountDescription = '';

  if (buyThreeDiscount > 0 && buyThreeDiscount >= bestDealDiscount) {
    cartDiscount = buyThreeDiscount;
    cartDiscountDescription = `Buy 3+ Watches Offer (${buyThreeConfig?.discountPercentage || 15}% OFF)`;
  } else if (bestDealDiscount > 0) {
    cartDiscount = bestDealDiscount;
    cartDiscountDescription = bestDealDescription;
  }

  const discountedSubtotal = Math.max(0, cartSubtotal - cartDiscount);

  // Editable shipping rules (Admin -> Products / Business Settings):
  // Free delivery if order total qualifies for free shipping threshold, flat fee otherwise.
  const freeThreshold = Number(businessSettings.shippingFreeAbove) || 0;
  const flatFee = Number(businessSettings.shippingFlatFee) || 0;
  const isFreeEligible = freeThreshold > 0 && discountedSubtotal >= freeThreshold;
  const cartShippingFee = cartSubtotal === 0 || isFreeEligible ? 0 : flatFee;
  const cartTotal = discountedSubtotal + cartShippingFee;

  // Cart Actions
  const addToCart = (product: Product, quantity = 1, variant?: Record<string, string>) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedVariant || {}) === JSON.stringify(variant || {})
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      } else {
        return [...prev, { product, quantity, selectedVariant: variant }];
      }
    });

    addToast('success', 'Added to Luxury Bag', `${product.name} (Qty: ${quantity})`);
    setIsCartDrawerOpen(true);

    trackEvent('add_to_cart', {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      value: (product.salePrice || product.price) * quantity,
      currency: 'PKR',
    });
  };

  const addWatchBundleToCart = (
    deal: WatchBundleDeal,
    productsToAdd: Product[],
    variants?: Record<string, Record<string, string>>
  ) => {
    setCart((prev) => {
      let nextCart = [...prev];
      for (const prod of productsToAdd) {
        const prodVariant = variants?.[prod.id];
        const existingIndex = nextCart.findIndex(
          (item) =>
            item.product.id === prod.id &&
            JSON.stringify(item.selectedVariant || {}) === JSON.stringify(prodVariant || {})
        );
        if (existingIndex > -1) {
          nextCart[existingIndex] = {
            ...nextCart[existingIndex],
            quantity: nextCart[existingIndex].quantity + 1,
          };
        } else {
          nextCart.push({ product: prod, quantity: 1, selectedVariant: prodVariant });
        }
      }
      return nextCart;
    });

    addToast(
      'success',
      `${deal.title} Added!`,
      `${productsToAdd.length} timepieces added to your bag with bundle savings applied.`
    );
    setIsCartDrawerOpen(true);

    trackEvent('add_to_cart', {
      content_name: deal.title,
      content_ids: productsToAdd.map((p) => p.id),
      content_type: 'product',
      value: deal.bundlePrice,
      currency: 'PKR',
      num_items: productsToAdd.length,
    });
  };

  const removeFromCart = (productId: string, variantKey?: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        if (item.product.id !== productId) return true;
        if (!variantKey) return false;
        return JSON.stringify(item.selectedVariant || {}) !== variantKey;
      })
    );
    addToast('info', 'Item Removed', 'Product removed from your shopping bag');
  };

  const updateCartQuantity = (productId: string, quantity: number, variantKey?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantKey);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        const matchesProduct = item.product.id === productId;
        const matchesVariant =
          !variantKey || JSON.stringify(item.selectedVariant || {}) === variantKey;
        if (matchesProduct && matchesVariant) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Wishlist Actions
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const product = products.find((p) => p.id === productId);
      if (exists) {
        addToast('info', 'Removed from Wishlist', product?.name);
        return prev.filter((id) => id !== productId);
      } else {
        addToast('success', 'Saved to Wishlist', product?.name);
        if (product) {
          trackEvent('add_to_wishlist', {
            content_name: product.name,
            content_ids: [product.id],
            content_type: 'product',
            value: product.salePrice || product.price,
            currency: 'PKR',
          });
        }
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);
  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));
    addToast('info', 'Removed from Wishlist');
  };

  // Catalog Getters & Management
  const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
  const getProductById = (id: string) => products.find((p) => p.id === id);

  const addProduct = (newProd: Partial<Product>): Product => {
    const slug =
      newProd.slug ||
      (newProd.name
        ? newProd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        : 'product-' + Date.now());

    const created: Product = {
      id: 'prod-' + Date.now(),
      name: newProd.name || 'Untitled Timepiece',
      slug,
      category: newProd.category || 'watches',
      categoryName:
        newProd.categoryName ||
        categories.find((c) => c.slug === newProd.category)?.name ||
        'Watches',
      subcategory: newProd.subcategory,
      brand: newProd.brand || 'STORIUM Haute Horlogerie',
      price: Number(newProd.price) || 25000,
      salePrice: newProd.salePrice ? Number(newProd.salePrice) : undefined,
      sku: newProd.sku || `STM-${Math.floor(1000 + Math.random() * 9000)}`,
      stockQuantity: Number(newProd.stockQuantity) || 10,
      thumbnail:
        newProd.thumbnail ||
        newProd.productImages?.[0] ||
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1000&auto=format&fit=crop',
      productImages:
        newProd.productImages && newProd.productImages.length > 0
          ? newProd.productImages
          : [
            'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
          ],
      media: newProd.media,
      description: newProd.description || 'Precision engineered STORIUM timepiece.',
      shortDescription:
        newProd.shortDescription || 'Luxury handcrafted timepiece with sapphire crystal.',
      specifications: newProd.specifications || {
        Movement: 'Japanese Precision Quartz / Mechanical',
        'Case Material': '316L Surgical Stainless Steel',
        Glass: 'Scratch-Resistant Sapphire Crystal',
        'Water Resistance': '5 ATM / 50M',
      },
      features: newProd.features || [
        '316L Surgical-Grade Stainless Steel',
        'Scratch-Resistant Sapphire Crystal',
        'High-Precision Calibre Mechanism',
      ],
      variants: newProd.variants,
      featured: Boolean(newProd.featured),
      isNew: Boolean(newProd.isNew),
      availability: newProd.availability || 'in_stock',
      paymentMethods:
        newProd.paymentMethods && newProd.paymentMethods.length > 0
          ? newProd.paymentMethods
          : ['cod', 'card'],
      tags: newProd.tags || ['Luxury', 'STORIUM'],
      seoTitle: newProd.seoTitle || `${newProd.name} | STORIUM Pakistan`,
      seoDescription:
        newProd.seoDescription ||
        `Purchase ${newProd.name} at STORIUM. Free insured nationwide delivery.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [created, ...prev]);
    void upsertProductToSupabase(created).then((result) => {
      if (!result.success) addToast('error', 'Catalog Save Failed', result.error || 'Product was not saved to the cloud.');
    });
    addToast('success', 'Product Published', `${created.name} is now live in showroom.`);
    return created;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const existing = products.find((product) => product.id === id);
    const nextProduct = existing ? { ...existing, ...updates, updatedAt: new Date().toISOString() } : null;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    if (nextProduct) {
      void upsertProductToSupabase(nextProduct).then((result) => {
        if (!result.success) addToast('error', 'Catalog Save Failed', result.error || 'Product changes were not saved to the cloud.');
      });
    }
    addToast('success', 'Product Updated', 'Changes saved successfully.');
  };

  const deleteProduct = (id: string) => {
    const p = products.find((x) => x.id === id);
    setProducts((prev) => prev.filter((item) => item.id !== id));
    void deleteProductFromSupabase(id).then((result) => {
      if (!result.success) addToast('error', 'Catalog Delete Failed', result.error || 'Product removal was not saved to the cloud.');
    });
    addToast('info', 'Product Removed', p?.name);
  };

  const addCategory = (cat: Partial<Category>) => {
    const slug =
      cat.slug ||
      (cat.name
        ? cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        : 'category-' + Date.now());

    const created: Category = {
      id: 'cat-' + Date.now(),
      name: cat.name || 'New Category',
      slug,
      description: cat.description || 'Curated luxury collection.',
      image:
        cat.image ||
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
      itemCount: 0,
    };
    setCategories((prev) => [...prev, created]);
    addToast('success', 'Category Created', created.name);
  };

  // Orders
  const createOrder = async (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'date'>
  ): Promise<Order> => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newOrder: Order = {
      ...orderData,
      id: 'ord-' + Date.now(),
      orderNumber: `STM-PK-${randomNum}`,
      date: new Date().toISOString(),
      orderStatus: 'Pending',
      trackingNumber: `TCS-${Math.floor(10000000 + Math.random() * 90000000)}-${orderData.customer.city.substring(0, 3).toUpperCase()}`,
      supabaseSynced: false,
    };

    // Attempt direct cloud sync with Supabase
    try {
      const syncResult = await saveOrderToSupabase(newOrder);
      if (syncResult.success) {
        newOrder.supabaseSynced = true;
        addToast('success', 'Order Confirmed', `Order #${newOrder.orderNumber} has been placed successfully.`);
      } else if (syncResult.isTableMissing) {
        console.info('Supabase orders table not yet initialized. Saved to local orders.');
        addToast('success', 'Order Confirmed', `Order #${newOrder.orderNumber} has been placed successfully.`);
      } else {
        addToast(
          'success',
          'Order Confirmed',
          `Order #${newOrder.orderNumber} successfully placed.`
        );
      }
    } catch (err) {
      console.warn('Supabase order insert error:', err);
      addToast(
        'success',
        'Order Confirmed',
        `Order #${newOrder.orderNumber} placed successfully.`
      );
    }

    setOrders((prev) => [newOrder, ...prev]);
    setLastPlacedOrder(newOrder);
    clearCart();

    trackEvent('purchase', {
      value: newOrder.total,
      currency: 'PKR',
      content_type: 'product',
      content_ids: newOrder.items.map((it) => it.product.id),
      num_items: newOrder.items.reduce((acc, it) => acc + it.quantity, 0),
      order_id: newOrder.orderNumber,
    });

    // Trigger instant real-time Web Push notification to admin phone/PWA
    void sendOrderNotificationToAdmin(newOrder);

    addAdminNotification({
      type: 'order',
      title: 'New Customer Order',
      message: `Order #${newOrder.orderNumber} for PKR ${newOrder.total.toLocaleString()} from ${newOrder.customer.fullName} (${newOrder.customer.city})`,
      linkTab: 'orders',
      data: { orderId: newOrder.id, orderNumber: newOrder.orderNumber },
    });

    // Automatically send luxury order confirmation email to customer
    void sendOrderConfirmationEmail(newOrder).then((emailRes) => {
      if (emailRes.success) {
        console.info(`[Email Confirmation] Successfully dispatched to ${newOrder.customer.email}`);
      } else {
        console.warn(`[Email Confirmation] Notice: ${emailRes.error || 'Server email dispatch skipped'}`);
      }
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, orderStatus: status } : ord))
    );
    void updateOrderStatusInSupabase(orderId, status).then((result) => {
      if (!result.success) addToast('error', 'Order Save Failed', result.error || 'Order status was not saved to the cloud.');
    });
    addToast('info', 'Order Status Updated', `Order marked as ${status}.`);
  };

  const updateOrderCourierBooking = (
    orderId: string,
    courierData: {
      trackingNumber: string;
      courierName: string;
      courierInvoiceUrl?: string;
      courierBookingId?: number | string;
      orderStatus?: Order['orderStatus'];
    }
  ) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              trackingNumber: courierData.trackingNumber,
              courierName: courierData.courierName,
              courierInvoiceUrl: courierData.courierInvoiceUrl,
              courierBookingId: courierData.courierBookingId,
              orderStatus: courierData.orderStatus || 'Shipped',
            }
          : ord
      )
    );
    if (courierData.orderStatus) {
      void updateOrderStatusInSupabase(orderId, courierData.orderStatus);
    }
    addToast('success', 'Courier Consignment Booked', `Booked with ${courierData.courierName}. Tracking: ${courierData.trackingNumber}`);
  };


  // Marks an order as paid locally. The cloud copy is updated server-side
  // so it stays authoritative for admins.
  const markOrderPaid = (orderNumber: string) => {
    setOrders((prev) => {
      const updated = prev.map((ord) =>
        ord.orderNumber === orderNumber
          ? { ...ord, paymentStatus: 'paid' as const, orderStatus: 'Processing' as const, paidAt: ord.paidAt || new Date().toISOString() }
          : ord
      );
      const paidOrder = updated.find((o) => o.orderNumber === orderNumber);
      if (paidOrder) {
        void sendPaymentReceiptEmail(paidOrder);
      }
      return updated;
    });
  };

  // Delete one order from local state (public + admin) and Supabase.
  const deleteOrder = async (orderNumber: string) => {
    setOrders((prev) => {
      const filtered = prev.filter((o) => o.orderNumber !== orderNumber);
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
      return filtered;
    });
    const result = await deleteOrderFromSupabase(orderNumber);
    if (!result.success) {
      addToast('error', 'Order Delete Failed', result.error || 'The order could not be removed from the cloud.');
    }
  };

  // Bulk delete by order numbers (state + Supabase). Used by admin cleanup actions.
  const deleteOrdersByNumber = async (orderNumbers: string[]) => {
    if (orderNumbers.length === 0) return;
    const toDelete = new Set(orderNumbers);
    setOrders((prev) => {
      const filtered = prev.filter((o) => !toDelete.has(o.orderNumber));
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }
      return filtered;
    });
    await Promise.all(orderNumbers.map((num) => deleteOrderFromSupabase(num)));
  };

  const updateInquiryStatus = (inquiryId: string, status: ContactInquiry['status']) => {
    setInquiries((prev) => prev.map((inquiry) => inquiry.id === inquiryId ? { ...inquiry, status } : inquiry));
    void updateInquiryStatusInSupabase(inquiryId, status).then((result) => {
      if (!result.success) addToast('error', 'Inquiry Save Failed', result.error || 'Inquiry status was not saved to the cloud.');
    });
  };

  // Concierge / Contact Inquiries
  const submitContactInquiry = async (
    inquiryData: Omit<ContactInquiry, 'id' | 'createdAt' | 'status'>
  ): Promise<{ success: boolean; supabaseSynced: boolean; message?: string }> => {
    const newInquiry: ContactInquiry = {
      ...inquiryData,
      id: 'inq-' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'new',
      supabaseSynced: false,
    };

    let supabaseSynced = false;
    let feedbackMessage = 'Inquiry logged with our luxury concierge.';

    try {
      const syncResult = await saveContactToSupabase(newInquiry);
      if (syncResult.success) {
        supabaseSynced = true;
        newInquiry.supabaseSynced = true;
        feedbackMessage = 'Your inquiry has been received by our concierge team.';
        addToast('success', 'Inquiry Received', feedbackMessage);
      } else if (syncResult.isTableMissing) {
        feedbackMessage = 'Your inquiry has been received by our concierge team.';
        addToast('success', 'Inquiry Received', feedbackMessage);
      } else {
        feedbackMessage = 'Our luxury concierge will respond within 4 hours.';
        addToast('success', 'Inquiry Dispatched', feedbackMessage);
      }
    } catch (err) {
      console.warn('Supabase contact submission error:', err);
      addToast('success', 'Inquiry Dispatched', 'Our luxury concierge will respond promptly.');
    }

    setInquiries((prev) => [newInquiry, ...prev]);
    return { success: true, supabaseSynced, message: feedbackMessage };
  };

  const getReviewsForProduct = (productId: string, approvedOnly = true) =>
    reviews
      .filter((r) => r.productId === productId && (!approvedOnly || r.status === 'approved'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getProductRatingSummary = (productId: string) => {
    const approved = getReviewsForProduct(productId, true);
    if (approved.length === 0) return { average: 0, count: 0 };
    const average = approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
    return { average, count: approved.length };
  };

  const getFeaturedHomeReviews = () =>
    reviews
      .filter((r) => r.status === 'approved' && r.featuredOnHome)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

  const submitReview = (input: {
    productId: string;
    rating: 1 | 2 | 3 | 4 | 5;
    title: string;
    body: string;
    city?: string;
  }): { success: boolean; message?: string } => {
    if (!currentUser) {
      return { success: false, message: 'Please sign in to submit a review.' };
    }
    if (!input.title.trim() || !input.body.trim()) {
      return { success: false, message: 'Please add a title and review text.' };
    }
    if (input.rating < 1 || input.rating > 5) {
      return { success: false, message: 'Please select a star rating.' };
    }

    const review: ProductReview = {
      id: 'rev-' + Date.now(),
      productId: input.productId,
      rating: input.rating,
      title: input.title.trim(),
      body: input.body.trim(),
      reviewerName: currentUser.fullName || 'STORIUM Client',
      city: input.city?.trim() || currentUser.city || undefined,
      userId: currentUser.id,
      status: 'pending',
      featuredOnHome: false,
      verifiedPurchase: orders.some(
        (o) =>
          o.orderStatus === 'Delivered' &&
          (o.customer.email === currentUser.email || Boolean(currentUser.id)) &&
          o.items.some((item) => item.productId === input.productId)
      ),
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) => [review, ...prev]);
    void upsertReviewToSupabase(review).then((result) => {
      if (!result.success) console.warn('Supabase review save failed:', result.error);
    });
    addToast('success', 'Review Submitted', 'Thank you. Your review is pending admin approval.');
    return { success: true };
  };

  const updateReviewStatus = (reviewId: string, status: ProductReview['status']) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, status } : r)));
    void updateReviewStatusInSupabase(reviewId, status).then((result) => {
      if (!result.success) console.warn('Supabase review status save failed:', result.error);
    });
    addToast('success', 'Review Updated', `Review marked as ${status}.`);
  };

  const toggleReviewFeatured = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const nextFeatured = !r.featuredOnHome;
          void toggleReviewFeaturedInSupabase(reviewId, nextFeatured).then((result) => {
            if (!result.success) console.warn('Supabase review featured save failed:', result.error);
          });
          return { ...r, featuredOnHome: nextFeatured };
        }
        return r;
      })
    );
  };

  const deleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    void deleteReviewFromSupabase(reviewId).then((result) => {
      if (!result.success) console.warn('Supabase review delete failed:', result.error);
    });
    addToast('info', 'Review Removed', 'The review was deleted.');
  };

  // User / Auth
  const loginUser = async (
    email: string,
    fullName: string,
    password: string,
    createAccount = false,
    phone = ''
  ) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const isPhoneAlreadyVerified = isPhoneNumberVerified(normalizedPhone);

    const result = createAccount
      ? await (async () => {
          const supabase = await getSupabase();
          return supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: fullName.trim(), phone: normalizedPhone } },
          });
        })()
      : await (async () => {
          const supabase = await getSupabase();
          return supabase.auth.signInWithPassword({ email: email.trim(), password });
        })();

    let userId = '';
    let userEmail = email.trim();
    let userName = fullName.trim() || 'Valued Client';
    let userPhone = normalizedPhone;
    let needsConfirmation = false;

    if (result.error) {
      const providerMessage = result.error.message.toLowerCase();
      // Check local client accounts for fallback (e.g. rate-limit or local accounts)
      const localAccount = findClientAccount(email) || (phone ? findClientAccount(phone) : null);
      if (!createAccount && localAccount && localAccount.passwordHash === password) {
        userId = localAccount.id;
        userEmail = localAccount.email;
        userName = localAccount.fullName;
        userPhone = localAccount.phone || normalizedPhone;
      } else {
        if (providerMessage.includes('rate limit') || providerMessage.includes('email rate')) {
          if (createAccount) {
            userId = 'usr_' + Math.random().toString(36).substring(2, 9);
            saveClientAccount({
              id: userId,
              email: userEmail,
              phone: userPhone,
              fullName: userName,
              passwordHash: password,
              phoneVerified: isPhoneAlreadyVerified,
              createdAt: new Date().toISOString(),
            });
          } else {
            return {
              success: false,
              message: 'Email sign-up is temporarily rate-limited. Wait a while before trying again, or sign in with an existing account.',
            };
          }
        } else {
          return { success: false, message: result.error.message };
        }
      }
    } else {
      if (!result.data.session || !result.data.user) {
        needsConfirmation = true;
      }
      if (result.data.user) {
        userId = result.data.user.id;
        userEmail = result.data.user.email || email.trim();
        userName = fullName.trim() || result.data.user.user_metadata?.full_name || 'Valued Client';
        if (result.data.user.user_metadata?.phone) {
          userPhone = result.data.user.user_metadata.phone;
        }
      }
    }

    if (needsConfirmation) {
      return { success: true, needsEmailConfirmation: true };
    }

    const profile: CustomerUser = {
      id: userId || 'usr_' + Math.random().toString(36).substring(2, 9),
      fullName: userName,
      email: userEmail,
      phone: userPhone,
      city: '',
      address: '',
      createdAt: new Date().toISOString(),
      phoneVerified: isPhoneAlreadyVerified || isPhoneNumberVerified(userPhone),
    };

    const existing = userId ? await fetchCustomerProfile(userId) : null;
    const savedProfile: CustomerUser = existing
      ? {
          ...existing,
          phone: existing.phone || userPhone,
          phoneVerified: Boolean(existing.phoneVerified || isPhoneAlreadyVerified || isPhoneNumberVerified(existing.phone)),
        }
      : profile;

    if (!existing && userId) {
      await upsertCustomerProfile(savedProfile);
    }

    // Save locally
    saveClientAccount({
      id: savedProfile.id,
      email: savedProfile.email,
      phone: savedProfile.phone,
      fullName: savedProfile.fullName,
      passwordHash: password,
      phoneVerified: Boolean(savedProfile.phoneVerified),
      city: savedProfile.city,
      address: savedProfile.address,
      createdAt: savedProfile.createdAt,
    });

    setCurrentUser(savedProfile);
    addToast('success', 'Welcome Back', `Signed in as ${savedProfile.fullName}`);
    return {
      success: true,
      needsPhoneVerification: Boolean(createAccount && savedProfile.phone && !savedProfile.phoneVerified),
    };
  };

  const logoutUser = () => {
    void getSupabase().then((supabase) => supabase.auth.signOut());
    setCurrentUser(null);
    addToast('info', 'Logged Out', 'You have been safely signed out.');
  };

  const updateUserProfile = (updates: Partial<CustomerUser>) => {
    if (!currentUser) return;
    const nextUser = { ...currentUser, ...updates };
    setCurrentUser(nextUser);
    void upsertCustomerProfile(nextUser).then((result) => {
      if (!result.success) addToast('error', 'Profile Save Failed', 'Your changes could not be saved.');
    });
    if (nextUser.phone && nextUser.phoneVerified) {
      markPhoneNumberVerified(nextUser.phone);
    }
    addToast('success', 'Profile Updated', 'Your details have been refreshed.');
  };

  const sendPhoneVerificationCode = async (phone: string) => {
    const res = await sendPhoneVerificationOTP(phone);
    if (res.success) {
      if (res.isAlreadyVerified) {
        addToast('info', 'Phone Verified', 'This mobile number is already verified.');
      } else {
        addToast('info', 'Security Code Sent', `Verification code: ${res.code} (sent to ${normalizePhoneNumber(phone)})`);
      }
    } else {
      addToast('error', 'Verification Error', res.message);
    }
    return res;
  };

  const verifyPhoneCode = async (phone: string, code: string) => {
    const res = await verifyPhoneOTP(phone, code, currentUser);
    if (res.success) {
      if (currentUser) {
        const updated: CustomerUser = { ...currentUser, phone: normalizePhoneNumber(phone), phoneVerified: true };
        setCurrentUser(updated);
      }
      addToast('success', 'Mobile Verified', 'Your phone number is now permanently verified.');
    } else {
      addToast('error', 'Verification Failed', res.message);
    }
    return res;
  };

  const requestPasswordReset = async (identifier: string) => {
    const res = await sendPasswordResetOTP(identifier);
    if (res.success) {
      addToast('info', 'Reset Code Dispatched', `Your authorization code is ${res.code}`);
    } else {
      addToast('error', 'Reset Request Failed', res.message);
    }
    return res;
  };

  const confirmPasswordReset = async (identifier: string, code: string, newPass: string) => {
    const res = await resetCustomerPassword(identifier, code, newPass);
    if (res.success) {
      addToast('success', 'Password Updated', 'Your new password has been set. You may now sign in.');
    } else {
      addToast('error', 'Reset Failed', res.message);
    }
    return res;
  };

  // Refunds operations
  const createRefund = async (refundData: Omit<Refund, 'id' | 'createdAt' | 'updatedAt'>): Promise<Refund> => {
    const newRefund: Refund = {
      ...refundData,
      id: 'ref-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRefunds((prev) => [newRefund, ...prev]);
    void saveRefundToSupabase(newRefund).then((res) => {
      if (!res.success) {
        console.warn('Could not persist refund to Supabase:', res.error);
      }
    });
    addToast('success', 'Refund Processed', `Refund of PKR ${newRefund.amount.toLocaleString()} logged for ${newRefund.orderNumber}`);
    addAdminNotification({
      type: 'refund',
      title: 'Refund Issued',
      message: `Refund of PKR ${newRefund.amount.toLocaleString()} for ${newRefund.orderNumber} (${newRefund.reason})`,
      data: { refundId: newRefund.id, orderNumber: newRefund.orderNumber },
    });
    return newRefund;
  };

  const updateRefundStatus = async (refundId: string, status: Refund['status'], notes?: string): Promise<void> => {
    setRefunds((prev) =>
      prev.map((r) =>
        r.id === refundId
          ? { ...r, status, notes: notes || r.notes, updatedAt: new Date().toISOString() }
          : r
      )
    );
    await updateRefundStatusInSupabase(refundId, status, notes);
    addToast('info', 'Refund Updated', `Refund status set to ${status}.`);
  };

  // Notifications operations
  const addAdminNotification = (notif: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AdminNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 99)]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <StoreContext.Provider
      value={{
        currentPage,
        selectedSlug,
        activeCategoryFilter,
        activeSubcategoryFilter,
        setActiveSubcategoryFilter,
        navigate,

        products,
        categories,
        getProductBySlug,
        getProductById,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,

        cart,
        cartCount,
        cartSubtotal,
        cartDiscount,
        cartDiscountDescription,
        isBuyThreeEligible,
        watchCount,
        buyThreeDiscount,
        cartShippingFee,
        cartTotal,
        addToCart,
        addWatchBundleToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartDrawerOpen,
        openCartDrawer: () => setIsCartDrawerOpen(true),
        closeCartDrawer: () => setIsCartDrawerOpen(false),

        wishlist,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,

        orders,
        createOrder,
        updateOrderStatus,
        updateOrderCourierBooking,
        markOrderPaid,
        deleteOrder,
        deleteOrdersByNumber,
        sendConfirmationEmail: sendOrderConfirmationEmail,
        sendTestEmail: sendTestConfirmationEmail,
        updateInquiryStatus,
        lastPlacedOrder,

        refunds,
        createRefund,
        updateRefundStatus,

        notifications,
        markNotificationRead,
        clearAllNotifications,
        addAdminNotification,

        inquiries,
        submitContactInquiry,
        reviews,
        getReviewsForProduct,
        getProductRatingSummary,
        getFeaturedHomeReviews,
        submitReview,
        updateReviewStatus,
        toggleReviewFeatured,
        deleteReview,
        isSupabaseSyncing,
        syncWithSupabase,

        currentUser,
        loginUser,
        logoutUser,
        updateUserProfile,
        sendPhoneVerificationCode,
        verifyPhoneCode,
        requestPasswordReset,
        confirmPasswordReset,
        isPhoneVerified: isPhoneNumberVerified,

        isSearchOpen,
        openSearch: () => setIsSearchOpen(true),
        closeSearch: () => setIsSearchOpen(false),
        searchQuery,
        setSearchQuery,

        quickViewProduct,
        openQuickView: (p) => setQuickViewProduct(p),
        closeQuickView: () => setQuickViewProduct(null),

        toasts,
        addToast,
        removeToast,

        businessSettings,
        updateBusinessSettings,
        resetBusinessSettings,
        setStorewideShippingFee,

        theme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
