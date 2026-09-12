import { supabase, SUPABASE_PROJECT_ID, SUPABASE_URL } from '../lib/supabase';
import { Order, ContactInquiry, Product, CustomerUser, ProductMedia, ProductReview } from '../types';

export type { ContactInquiry };

export interface SupabaseSyncResult {
  success: boolean;
  data?: any;
  error?: string;
  isTableMissing?: boolean;
  isPolicyError?: boolean;
}

export interface SupabaseHealthStatus {
  connected: boolean;
  ordersTableExists: boolean;
  contactsTableExists: boolean;
  reviewsTableExists: boolean;
  projectId: string;
  url: string;
  checkedAt: string;
  message?: string;
  error?: string;
}

// Ready-to-execute SQL migration script for Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ================================================================
-- STORIUM Pakistan: Supabase Database Schema (Updated)
-- Run this SQL in your Supabase Project SQL Editor
-- Project ID: ${SUPABASE_PROJECT_ID}
-- URL: ${SUPABASE_URL}
-- ================================================================

-- 1. Create orders table for luxury showroom purchases
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_city TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_province TEXT DEFAULT 'Punjab',
    postal_code TEXT,
    notes TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    shipping_fee NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cod',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    order_status TEXT NOT NULL DEFAULT 'Pending',
    tracking_number TEXT
);

-- 2. Create contacts table for showroom & concierge inquiries
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    topic TEXT NOT NULL DEFAULT 'Timepiece Inquiries',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new'
);

-- 3. Product catalog stored as JSONB so the existing product contract remains stable
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Customer profiles with phone verification tracking
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    phone_verified BOOLEAN DEFAULT false,
    city TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Product reviews with moderation workflow
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    reviewer_name TEXT NOT NULL DEFAULT 'Anonymous',
    city TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden')),
    featured_on_home BOOLEAN DEFAULT false,
    verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON public.reviews(featured_on_home) WHERE featured_on_home = true;

-- 6. Product media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Backfill: add customer_id column to orders if missing (safe for existing installs)
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill: add phone_verified column to customer_profiles if missing
ALTER TABLE public.customer_profiles
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- ================================================================
-- 7. Enable Row Level Security (RLS) on all tables
-- ================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 8. Storage policies — product media
-- ================================================================
DROP POLICY IF EXISTS "Public product media read" ON storage.objects;
CREATE POLICY "Public product media read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-media');

DROP POLICY IF EXISTS "Admin product media upload" ON storage.objects;
CREATE POLICY "Admin product media upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-media' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin product media update" ON storage.objects;
CREATE POLICY "Admin product media update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-media' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK (bucket_id = 'product-media' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ================================================================
-- 9. Orders policies
-- ================================================================
DROP POLICY IF EXISTS "Allow anonymous orders insert" ON public.orders;
CREATE POLICY "Allow anonymous orders insert"
ON public.orders FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow customer own orders select" ON public.orders;
CREATE POLICY "Allow customer own orders select"
ON public.orders FOR SELECT
USING (customer_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Allow admin orders select" ON public.orders;
CREATE POLICY "Allow admin orders select"
ON public.orders FOR SELECT
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Allow admin orders update" ON public.orders;
CREATE POLICY "Allow admin orders update"
ON public.orders FOR UPDATE
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ================================================================
-- 10. Contacts policies
-- ================================================================
DROP POLICY IF EXISTS "Allow anonymous contacts insert" ON public.contacts;
CREATE POLICY "Allow anonymous contacts insert"
ON public.contacts FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin contacts select" ON public.contacts;
CREATE POLICY "Allow admin contacts select"
ON public.contacts FOR SELECT
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Allow admin contacts update" ON public.contacts;
CREATE POLICY "Allow admin contacts update"
ON public.contacts FOR UPDATE
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ================================================================
-- 11. Products policies
-- ================================================================
DROP POLICY IF EXISTS "Allow public products select" ON public.products;
CREATE POLICY "Allow public products select"
ON public.products FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin products insert" ON public.products;
CREATE POLICY "Allow admin products insert"
ON public.products FOR INSERT
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Allow admin products update" ON public.products;
CREATE POLICY "Allow admin products update"
ON public.products FOR UPDATE
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Allow admin products delete" ON public.products;
CREATE POLICY "Allow admin products delete"
ON public.products FOR DELETE
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ================================================================
-- 12. Customer profiles policies
-- ================================================================
DROP POLICY IF EXISTS "Customers read own profile" ON public.customer_profiles;
CREATE POLICY "Customers read own profile"
ON public.customer_profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Customers create own profile" ON public.customer_profiles;
CREATE POLICY "Customers create own profile"
ON public.customer_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Customers update own profile" ON public.customer_profiles;
CREATE POLICY "Customers update own profile"
ON public.customer_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Customers delete own profile" ON public.customer_profiles;
CREATE POLICY "Customers delete own profile"
ON public.customer_profiles FOR DELETE
USING (auth.uid() = id);

-- Admins can read all profiles for customer support
DROP POLICY IF EXISTS "Admin read all profiles" ON public.customer_profiles;
CREATE POLICY "Admin read all profiles"
ON public.customer_profiles FOR SELECT
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ================================================================
-- 13. Reviews policies
-- ================================================================

-- Anyone can read approved reviews (public storefront)
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
CREATE POLICY "Public read approved reviews"
ON public.reviews FOR SELECT
USING (status = 'approved' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Authenticated users can insert their own reviews
DROP POLICY IF EXISTS "Authenticated users insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending reviews
DROP POLICY IF EXISTS "Users update own reviews" ON public.reviews;
CREATE POLICY "Users update own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users delete own reviews" ON public.reviews;
CREATE POLICY "Users delete own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

-- Admins have full control over all reviews
DROP POLICY IF EXISTS "Admin full reviews access" ON public.reviews;
CREATE POLICY "Admin full reviews access"
ON public.reviews FOR ALL
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
`;

/**
 * Save an order to Supabase orders table
 */
export async function saveOrderToSupabase(order: Order): Promise<SupabaseSyncResult> {
  try {
    const payload = {
      order_number: order.orderNumber,
      customer_id: (await supabase.auth.getUser()).data.user?.id || null,
      customer_name: order.customer.fullName,
      customer_email: order.customer.email,
      customer_phone: order.customer.phone,
      customer_city: order.customer.city,
      customer_address: order.customer.address,
      customer_province: order.customer.province || 'Punjab',
      postal_code: order.customer.postalCode || '',
      notes: order.customer.notes || '',
      items: order.items,
      subtotal: order.subtotal,
      shipping_fee: order.shippingFee,
      total: order.total,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      tracking_number: order.trackingNumber || '',
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([payload]);

    if (error) {
      console.warn('Supabase save order warning:', error);
      const isTableMissing = error.code === 'PGRST205' || error.message?.includes('not find');
      const isPolicyError = error.code === '42501' || error.message?.includes('row-level security');
      return {
        success: false,
        error: error.message,
        isTableMissing,
        isPolicyError,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err: any) {
    console.error('Unexpected Supabase order insert error:', err);
    return {
      success: false,
      error: err?.message || 'Network connection failed while reaching Supabase',
    };
  }
}

/**
 * Save contact form inquiry to Supabase
 */
export async function saveContactToSupabase(inquiry: {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
}): Promise<SupabaseSyncResult> {
  try {
    const payload = {
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone || '',
      topic: inquiry.topic || 'General Inquiry',
      message: inquiry.message,
      status: 'new',
    };

    // Try 'contacts' table first
    let { data, error } = await supabase
      .from('contacts')
      .insert([payload]);

    // If 'contacts' table is not found, fallback to check 'contact_messages'
    if (error && (error.code === 'PGRST205' || error.message?.includes('not find'))) {
      const fallbackResult = await supabase
        .from('contact_messages')
        .insert([payload]);

      if (!fallbackResult.error) {
        return { success: true, data: fallbackResult.data };
      }
    }

    if (error) {
      console.warn('Supabase save contact warning:', error);
      const isTableMissing = error.code === 'PGRST205' || error.message?.includes('not find');
      const isPolicyError = error.code === '42501' || error.message?.includes('row-level security');
      return {
        success: false,
        error: error.message,
        isTableMissing,
        isPolicyError,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err: any) {
    console.error('Unexpected Supabase contact insert error:', err);
    return {
      success: false,
      error: err?.message || 'Network connection failed while reaching Supabase',
    };
  }
}

export async function fetchSupabaseProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('data').order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: { data: Product }) => row.data);
}

export async function uploadProductMedia(files: File[], productId: string): Promise<ProductMedia[]> {
  const uploads = files.slice(0, 3).map(async (file, index) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const path = `${productId}/${Date.now()}-${index}.${extension}`;
    const { error } = await supabase.storage.from('product-media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('product-media').getPublicUrl(path);
    return { url: data.publicUrl, type: file.type.startsWith('video/') ? 'video' : 'image', name: file.name } as ProductMedia;
  });
  return Promise.all(uploads);
}

export async function fetchCustomerProfile(userId: string): Promise<CustomerUser | null> {
  const { data, error } = await supabase.from('customer_profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    fullName: data.full_name || 'Valued Client',
    email: data.email || '',
    phone: data.phone || '',
    city: data.city || '',
    address: data.address || '',
    createdAt: data.created_at || new Date().toISOString(),
    phoneVerified: Boolean(data.phone_verified),
  };
}

export async function upsertCustomerProfile(profile: CustomerUser): Promise<SupabaseSyncResult> {
  const payload: Record<string, any> = {
    id: profile.id,
    full_name: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    address: profile.address,
    created_at: profile.createdAt,
    updated_at: new Date().toISOString(),
  };
  if (typeof profile.phoneVerified === 'boolean') {
    payload.phone_verified = profile.phoneVerified;
  }
  const { data, error } = await supabase.from('customer_profiles').upsert(payload).select();
  return error ? { success: false, error: error.message } : { success: true, data };
}

export async function upsertProductToSupabase(product: Product): Promise<SupabaseSyncResult> {
  const { data, error } = await supabase
    .from('products')
    .upsert({ id: product.id, data: product, updated_at: new Date().toISOString() })
    .select();
  return error ? { success: false, error: error.message, isPolicyError: error.code === '42501' } : { success: true, data };
}

export async function deleteProductFromSupabase(productId: string): Promise<SupabaseSyncResult> {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  return error ? { success: false, error: error.message, isPolicyError: error.code === '42501' } : { success: true };
}

export async function updateOrderStatusInSupabase(orderId: string, status: Order['orderStatus']): Promise<SupabaseSyncResult> {
  const { data, error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId).select();
  return error ? { success: false, error: error.message, isPolicyError: error.code === '42501' } : { success: true, data };
}

export async function updateInquiryStatusInSupabase(inquiryId: string, status: ContactInquiry['status']): Promise<SupabaseSyncResult> {
  const { data, error } = await supabase.from('contacts').update({ status }).eq('id', inquiryId).select();
  return error ? { success: false, error: error.message, isPolicyError: error.code === '42501' } : { success: true, data };
}

/**
 * Fetch all reviews stored in Supabase
 */
export async function fetchSupabaseReviews(): Promise<ProductReview[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row: any): ProductReview => ({
      id: row.id,
      productId: row.product_id,
      rating: Number(row.rating) as 1 | 2 | 3 | 4 | 5,
      title: row.title || '',
      body: row.body || '',
      reviewerName: row.reviewer_name || 'Anonymous',
      city: row.city || undefined,
      userId: row.user_id || undefined,
      status: (row.status as ProductReview['status']) || 'pending',
      featuredOnHome: Boolean(row.featured_on_home),
      verifiedPurchase: Boolean(row.verified_purchase),
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Failed to load reviews from Supabase:', err);
    return [];
  }
}

/**
 * Upsert a review to Supabase reviews table
 */
export async function upsertReviewToSupabase(review: ProductReview): Promise<SupabaseSyncResult> {
  const payload = {
    id: review.id,
    product_id: review.productId,
    user_id: review.userId || null,
    rating: review.rating,
    title: review.title,
    body: review.body,
    reviewer_name: review.reviewerName,
    city: review.city || null,
    status: review.status,
    featured_on_home: review.featuredOnHome,
    verified_purchase: review.verifiedPurchase,
    created_at: review.createdAt,
  };

  const { data, error } = await supabase
    .from('reviews')
    .upsert(payload)
    .select();

  return error ? { success: false, error: error.message, isPolicyError: error.code === '42501' } : { success: true, data };
}

/**
 * Update review status (pending / approved / hidden)
 */
export async function updateReviewStatusInSupabase(reviewId: string, status: ProductReview['status']): Promise<SupabaseSyncResult> {
  const { data, error } = await supabase
    .from('reviews')
    .update({ status })
    .eq('id', reviewId)
    .select();
  return error ? { success: false, error: error.message, isPolicyError: error.code === '42501' } : { success: true, data };
}

/**
 * Toggle review featuredOnHome flag
 */
export async function toggleReviewFeaturedInSupabase(reviewId: string, featuredOnHome: boolean): Promise<SupabaseSyncResult> {
  const { data, error } = await supabase
    .from('reviews')
    .update({ featured_on_home: featuredOnHome })
    .eq('id', reviewId)
    .select();
  return error ? { success: false, error: error.message, isPolicyError: error.code === '42501' } : { success: true, data };
}

/**
 * Delete a review from Supabase
 */
export async function deleteReviewFromSupabase(reviewId: string): Promise<SupabaseSyncResult> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  return error ? { success: false, error: error.message, isPolicyError: error.code === '42501' } : { success: true };
}

/**
 * Fetch orders stored in Supabase
 */
export async function fetchSupabaseOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      date: row.created_at,
      customer: {
        fullName: row.customer_name,
        email: row.customer_email,
        phone: row.customer_phone,
        city: row.customer_city,
        address: row.customer_address,
        province: row.customer_province || 'Punjab',
        postalCode: row.postal_code,
        notes: row.notes,
      },
      items: Array.isArray(row.items) ? row.items : [],
      subtotal: Number(row.subtotal),
      shippingFee: Number(row.shipping_fee),
      total: Number(row.total),
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      orderStatus: row.order_status,
      trackingNumber: row.tracking_number,
      supabaseSynced: true,
    }));
  } catch (err) {
    console.warn('Failed to load orders from Supabase:', err);
    return [];
  }
}

/**
 * Fetch contact submissions stored in Supabase
 */
export async function fetchSupabaseContacts(): Promise<ContactInquiry[]> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row: any): ContactInquiry => ({
      id: String(row.id || 'inq-' + Math.random().toString(36).substring(2, 9)),
      name: row.name || 'Anonymous Client',
      email: row.email || '',
      phone: row.phone || '',
      topic: row.topic || 'General Inquiry',
      message: row.message || '',
      createdAt: row.created_at || new Date().toISOString(),
      status: (row.status as ContactInquiry['status']) || 'new',
      supabaseSynced: true,
    }));
  } catch (err) {
    console.warn('Failed to load contacts from Supabase:', err);
    return [];
  }
}

/**
 * Verify Supabase connection and table availability
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const result: SupabaseHealthStatus = {
    connected: false,
    ordersTableExists: false,
    contactsTableExists: false,
    reviewsTableExists: false,
    projectId: SUPABASE_PROJECT_ID,
    url: SUPABASE_URL,
    checkedAt: new Date().toISOString(),
    message: '',
  };

  try {
    // Check orders table
    const ordersRes = await supabase.from('orders').select('id').limit(1);
    result.ordersTableExists = !ordersRes.error || ordersRes.error.code !== 'PGRST205';

    // Check contacts table
    const contactsRes = await supabase.from('contacts').select('id').limit(1);
    result.contactsTableExists = !contactsRes.error || contactsRes.error.code !== 'PGRST205';

    // Check reviews table
    const reviewsRes = await supabase.from('reviews').select('id').limit(1);
    result.reviewsTableExists = !reviewsRes.error || reviewsRes.error.code !== 'PGRST205';

    result.connected = true;
    const allActive = result.ordersTableExists && result.contactsTableExists && result.reviewsTableExists;
    result.message = allActive
      ? 'Connected: All tables (orders, contacts, reviews) are active and responding.'
      : 'Supabase reachable: Some tables await initialization in SQL Editor.';
  } catch (err: any) {
    result.connected = false;
    result.error = err?.message;
    result.message = 'Connection failed: ' + (err?.message || 'Unknown network error');
  }

  return result;
}

