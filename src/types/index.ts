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
  shippingFee: number;
  total: number;
  paymentMethod: 'cod' | 'card';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingNumber?: string;
  supabaseSynced?: boolean;
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
  | 'terms';
