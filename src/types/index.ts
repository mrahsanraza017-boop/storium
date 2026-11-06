export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string; // 'watches' | 'mens-accessories' | string
  categoryName: string;
  subcategory?: string;
  brand: string;
  price: number; // in PKR
  salePrice?: number;
  sku: string;
  stockQuantity: number;
  productImages: string[];
  media?: ProductMedia[];
  thumbnail: string;
  description: string;
  shortDescription: string;
  specifications: Record<string, string>;
  features: string[];
  variants?: {
    name: string;
    options: string[];
  }[];
  featured: boolean;
  isNew: boolean;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';
  /** Payment methods allowed for this product at checkout. Defaults to both when unset. */
  paymentMethods?: Array<'cod' | 'card'>;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductMedia {
  url: string;
  type: 'image' | 'video';
  name?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount?: number;
  isUpcoming?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: Record<string, string>;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productThumbnail: string;
  price: number;
  quantity: number;
  selectedVariant?: Record<string, string>;
  sku: string;
}

export interface CustomerShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customer: CustomerShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  discountDescription?: string;
  couponCode?: string;
  couponDiscount?: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'cod' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingNumber?: string;
  courierName?: string;
  courierInvoiceUrl?: string;
  courierBookingId?: number | string;
  rgTransactionRef?: string;
  paidAt?: string;
  paymentFailedAt?: string;
  supabaseSynced?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  assignedEmail?: string;
  assignedName?: string;
  startDate?: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SaleBannerConfig {
  enabled: boolean;
  announcementText: string;
  badgeText: string;
  highlightText: string;
  ctaText: string;
  ctaTarget: PageView;
  couponCode?: string;
  bgStyle?: 'gold' | 'dark' | 'gradient';
}

export interface WatchBundleDeal {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  requiredCount: 2 | 3;
  discountPercentage?: number;
  fixedBundlePrice?: number;
  bundlePrice?: number;
  watchIds?: string[];
  featured: boolean;
  active: boolean;
}

export interface BuyThreePromoConfig {
  enabled: boolean;
  discountPercentage: number;
  minWatches: number;
  bannerTitle: string;
  bannerSubtitle: string;
}

export interface CityDeliveryRule {
  city: string;
  minDays: number;
  maxDays: number;
  courier: string;
  codAvailable: boolean;
  available?: boolean;
}

export interface DeliveryEstimateConfig {
  enabled?: boolean;
  cutoffTime: string;
  defaultMinDays: number;
  defaultMaxDays: number;
  rules: CityDeliveryRule[];
}

export interface PromotionsConfig {
  saleBanner: SaleBannerConfig;
  watchDeals: WatchBundleDeal[];
  buyThreePromo: BuyThreePromoConfig;
  deliveryEstimates: DeliveryEstimateConfig;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  createdAt: string;
  status: 'new' | 'in_progress' | 'responded' | 'archived';
  supabaseSynced?: boolean;
}

export interface CustomerUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  createdAt: string;
  phoneVerified?: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  reviewerName: string;
  city?: string;
  userId?: string;
  status: 'pending' | 'approved' | 'hidden';
  featuredOnHome: boolean;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface BusinessSocials {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
}

export interface BusinessSettings {
  businessName: string;
  legalBusinessName: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  whatsappLink: string;
  address: string;
  city: string;
  province: string;
  country: string;
  workingHours: string;
  paymentGatewayName: string;
  shippingFreeAbove: number;
  shippingFlatFee: number;
  socials: BusinessSocials;
  storefrontImage: string;
  /** "How We Work" / business model copy rendered on the About page. */
  businessModel: string;
  /** "Secure Payment Process" copy rendered on checkout & about pages. */
  securePaymentCopy: string;
  /** Editable policy bodies. Plain text; lines starting with "## " become headings. */
  policies: {
    shipping: string;
    refund: string;
    privacy: string;
    terms: string;
  };
  /** Private gateway notes (admin only, never rendered on the public website). */
  gatewayNotes: string;
  /** Store promotions, sale banners, watch bundle deals, and location delivery rules. */
  promotions: PromotionsConfig;
}

export const ACCESSORY_SUBCATEGORIES = [
  'Wallet',
  'Sun glasses',
  'Jewelry',
  'bracelets',
  'Bag',
  'key accessories',
  'Card holders',
  'Grooming',
  'Belts',
  'Caps',
  'Fragrance',
  'Cufflinks',
] as const;

export type AccessorySubcategory = (typeof ACCESSORY_SUBCATEGORIES)[number];

export type PageView =
  | 'home'
  | 'watches'
  | 'accessories'
  | 'shop'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'wishlist'
  | 'account'
  | 'admin'
  | 'about'
  | 'contact'
  | 'shipping-policy'
  | 'return-policy'
  | 'privacy-policy'
  | 'terms'
  | 'payment-complete';

export interface Refund {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  reason: string;
  status: 'requested' | 'approved' | 'processed' | 'rejected';
  paymentMethod: 'cod' | 'card';
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
  notes?: string;
  supabaseSynced?: boolean;
}

export type MetaPixelStandardEvent =
  | 'AddPaymentInfo'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'InitiateCheckout'
  | 'Lead'
  | 'Purchase'
  | 'Schedule'
  | 'Search'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'
  | 'ViewContent'
  | 'PageView';

export interface AnalyticsEvent {
  id?: string;
  eventType:
    | 'page_view'
    | 'session_start'
    | 'add_to_cart'
    | 'add_to_wishlist'
    | 'add_payment_info'
    | 'checkout_start'
    | 'initiate_checkout'
    | 'purchase'
    | 'view_content'
    | 'search'
    | 'contact'
    | 'lead'
    | 'complete_registration'
    | 'customize_product'
    | 'donate'
    | 'find_location'
    | 'schedule'
    | 'start_trial'
    | 'submit_application'
    | 'subscribe'
    | MetaPixelStandardEvent
    | string;
  path: string;
  pageTitle?: string;
  referrer?: string;
  source: 'direct' | 'google' | 'instagram' | 'facebook' | 'whatsapp' | 'referral' | string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  city?: string;
  country?: string;
  sessionId: string;
  visitorId: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'custom';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

export interface AdminNotification {
  id: string;
  type: 'order' | 'stock' | 'inquiry' | 'payment' | 'refund' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkTab?: string;
  data?: Record<string, any>;
}

export interface CustomPageSection {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  content: string;
  image?: string;
  imagePosition?: 'left' | 'right' | 'top' | 'background' | 'none';
  ctaText?: string;
  ctaTarget?: PageView | string;
  layout?: 'card' | 'split' | 'centered' | 'banner';
  enabled: boolean;
}

export interface HomePageContent {
  hero: {
    badge: string;
    heading: string;
    description: string;
    primaryCtaText: string;
    primaryCtaTarget: PageView;
    secondaryCtaText: string;
    secondaryCtaTarget: PageView;
    bgImage?: string;
  };
  featuredShowcase: {
    eyebrow: string;
    heading: string;
    viewAllText: string;
  };
  productSpotlight: {
    eyebrow: string;
    title: string;
    description: string;
    image?: string;
    priceLabel?: string;
    ctaText?: string;
  };
  philosophy: {
    eyebrow: string;
    quote: string;
    description: string;
  };
  trustBadges: {
    badge1: { title: string; description: string; icon?: string };
    badge2: { title: string; description: string; icon?: string };
    badge3: { title: string; description: string; icon?: string };
  };
  conversionCta: {
    eyebrow: string;
    heading: string;
    description: string;
    logoUrl?: string;
    primaryCtaText: string;
    primaryCtaTarget: PageView;
    secondaryCtaText: string;
    secondaryCtaTarget: PageView;
  };
  customSections: CustomPageSection[];
}

export interface AboutPageContent {
  header: {
    badge: string;
    heading: string;
    subtitle: string;
    logoUrl?: string;
  };
  heroVisual: {
    imageUrl: string;
    altText: string;
  };
  philosophy: {
    heading: string;
    content: string;
  };
  customSections: CustomPageSection[];
}

export interface ContactPageContent {
  header: {
    badge: string;
    heading: string;
    subtitle: string;
  };
  details: {
    title: string;
    description: string;
  };
  customSections: CustomPageSection[];
}

export interface CatalogPageContent {
  eyebrow: string;
  heading: string;
  subtitle: string;
  bannerImage?: string;
  customSections: CustomPageSection[];
}

export interface PoliciesPageContent {
  shippingEyebrow: string;
  shippingTitle: string;
  shippingSubtitle: string;
  refundEyebrow: string;
  refundTitle: string;
  refundSubtitle: string;
  privacyEyebrow: string;
  privacyTitle: string;
  privacySubtitle: string;
  termsEyebrow: string;
  termsTitle: string;
  termsSubtitle: string;
  customSections: CustomPageSection[];
}

export interface PagesContentConfig {
  home: HomePageContent;
  about: AboutPageContent;
  contact: ContactPageContent;
  watches: CatalogPageContent;
  accessories: CatalogPageContent;
  shop: CatalogPageContent;
  policies: PoliciesPageContent;
}

