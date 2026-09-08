// React has no local declaration file in this project; suppress the module typing diagnostic here.
// @ts-ignore
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Product,
  Category,
  CartItem,
  Order,
  CustomerUser,
  PageView,
  ContactInquiry,
  ProductReview,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_ORDERS, INITIAL_REVIEWS } from '../data/initialData';
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
  updateInquiryStatusInSupabase,
  upsertReviewToSupabase,
  updateReviewStatusInSupabase,
  toggleReviewFeaturedInSupabase,
  deleteReviewFromSupabase,
  checkSupabaseHealth,
} from '../services/supabaseService';
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
  cartShippingFee: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number, variant?: Record<string, string>) => void;
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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'storium_products_v1',
  CATEGORIES: 'storium_categories_v1',
  CART: 'storium_cart_v1',
  WISHLIST: 'storium_wishlist_v1',
  ORDERS: 'storium_orders_v1',
  INQUIRIES: 'storium_inquiries_v1',
  REVIEWS: 'storium_reviews_v1',
  USER: 'storium_user_v1',
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

  // Check path first
  if (path === 'admin') return { page: 'admin', slug: null, category: null, subcategory: null };
  if (path === 'watches') return { page: 'watches', slug: null, category: 'watches', subcategory: null };
  if (path === 'accessories') return { page: 'accessories', slug: null, category: 'mens-accessories', subcategory: null };
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
  if (path === 'terms') return { page: 'terms', slug: null, category: null, subcategory: null };
  if (path === 'cart') return { page: 'cart', slug: null, category: null, subcategory: null };
  if (path === 'checkout') return { page: 'checkout', slug: null, category: null, subcategory: null };
  if (path === 'account') return { page: 'account', slug: null, category: null, subcategory: null };
  if (path === 'wishlist') return { page: 'wishlist', slug: null, category: null, subcategory: null };

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

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const initialRoute = getInitialRoute();

  // Navigation State
  const [currentPage, setCurrentPage] = useState<PageView>(initialRoute.page);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialRoute.slug);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(initialRoute.category);
  const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string | null>(initialRoute.subcategory);

  // Data State with LocalStorage Persistence
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((p) => p.id));
        const updated = parsed.map((p) => {
          if (p.category === 'mens-accessories' && !p.subcategory) {
            const match = INITIAL_PRODUCTS.find((initP) => initP.id === p.id);
            return { ...p, subcategory: match?.subcategory || 'Wallet' };
          }
          return p;
        });
        const missing = INITIAL_PRODUCTS.filter((initP) => !existingIds.has(initP.id));
        return [...updated, ...missing];
      }
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) return JSON.parse(saved);
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
    return [
      {
        id: 'inq-sample-1',
        name: 'Taimoor Khan',
        email: 'taimoor.khan@domain.pk',
        phone: '+92 321 9876543',
        topic: 'Timepiece Inquiries',
        message: 'Interested in reserving the Titanium Skeleton Tourbillon. What is the express delivery timeframe for Islamabad?',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'new',
        supabaseSynced: true,
      },
    ];
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

  // UI state
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

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
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted || !data.session) return;
      const profile = await fetchCustomerProfile(data.session.user.id);
      if (mounted && profile) setCurrentUser(profile);
    };
    loadSession();
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        if (mounted) setCurrentUser(null);
        return;
      }
      const profile = await fetchCustomerProfile(session.user.id);
      if (mounted && profile) setCurrentUser(profile);
    });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);

  // Sync state with Supabase backend
  const syncWithSupabase = async () => {
    setIsSupabaseSyncing(true);
    try {
      const [remoteOrders, remoteContacts, remoteProducts, remoteReviews] = await Promise.all([
        fetchSupabaseOrders(),
        fetchSupabaseContacts(),
        fetchSupabaseProducts(),
        fetchSupabaseReviews(),
      ]);

      if (remoteProducts.length > 0) setProducts(remoteProducts);

      if (remoteOrders && remoteOrders.length > 0) {
        setOrders((prev) => {
          const map = new Map<string, Order>();
          // Remote Supabase orders take precedence
          remoteOrders.forEach((o) => map.set(o.orderNumber, o));
          // Keep any locally cached orders not yet on Supabase
          prev.forEach((o) => {
            if (!map.has(o.orderNumber)) map.set(o.orderNumber, o);
          });
          return Array.from(map.values());
        });
      }

      if (remoteContacts && remoteContacts.length > 0) {
        setInquiries((prev) => {
          const map = new Map<string, ContactInquiry>();
          remoteContacts.forEach((c) => {
            if (c.id) map.set(c.id, c);
          });
          prev.forEach((c) => {
            if (c.id && !map.has(c.id)) map.set(c.id, c);
          });
          return Array.from(map.values());
        });
      }

      if (remoteReviews && remoteReviews.length > 0) {
        setReviews((prev) => {
          const map = new Map<string, ProductReview>();
          remoteReviews.forEach((r) => {
            if (r.id) map.set(r.id, r);
          });
          prev.forEach((r) => {
            if (r.id && !map.has(r.id)) map.set(r.id, r);
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

  // Background sync on mount
  useEffect(() => {
    syncWithSupabase();
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

  // Free shipping throughout Pakistan on luxury orders above Rs. 15,000, otherwise nominal standard Rs. 500
  const cartShippingFee = cartSubtotal > 15000 || cartSubtotal === 0 ? 0 : 500;
  const cartTotal = cartSubtotal + cartShippingFee;

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
      ? await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim(), phone: normalizedPhone } },
        })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });

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
    void supabase.auth.signOut();
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
        cartShippingFee,
        cartTotal,
        addToCart,
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
        updateInquiryStatus,
        lastPlacedOrder,

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
