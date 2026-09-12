import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  X,
  ExternalLink,
  DollarSign,
  Truck,
  Eye,
  Database,
  MessageSquare,
  Star,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, Order, Category, ACCESSORY_SUBCATEGORIES } from '../types';
import { AdminSupabaseTab } from '../components/admin/AdminSupabaseTab';
import { AdminInquiriesTab } from '../components/admin/AdminInquiriesTab';
import { AdminReviewsTab } from '../components/admin/AdminReviewsTab';
import { AdminAuthGate } from '../components/admin/AdminAuthGate';
import { uploadProductMedia } from '../services/supabaseService';
import { ProductMedia } from '../types';

export const AdminView: React.FC = () => {
  const {
    products,
    orders,
    categories,
    inquiries,
    reviews,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    navigate,
    addToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'inquiries' | 'reviews' | 'supabase'>('overview');

  // Product management states
  const [productSearch, setProductSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Order management states
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Form state for creating/editing product
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: 'STORIUM',
    sku: '',
    category: 'watches',
    categoryName: 'Watches',
    subcategory: '',
    price: 35000,
    salePrice: 29500,
    stockQuantity: 10,
    shortDescription: '',
    description: '',
    thumbnail: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=800&auto=format&fit=crop',
    featured: false,
    acceptCod: true,
    acceptCard: true,
    movement: 'Japanese Automatic Cal. 9015',
    glass: 'Double-Domed Sapphire Crystal',
    caseMaterial: '316L Surgical Stainless Steel',
    waterResistance: '10 ATM (100 Meters)',
    caseDiameter: '41mm',
  });

  // Calculate Metrics
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === 'Pending').length;
  const lowStockProducts = products.filter((p) => p.stockQuantity <= 5);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setMediaFiles([]);
    setFormData({
      name: '',
      slug: '',
      brand: 'STORIUM',
      sku: `STM-${Math.floor(100 + Math.random() * 900)}`,
      category: 'watches',
      categoryName: 'Watches',
      subcategory: '',
      price: 35000,
      salePrice: 29500,
      stockQuantity: 12,
      shortDescription: 'Precision engineered luxury horology.',
      description: 'Hand-finished surgical grade timepiece with scratch-proof sapphire crystal.',
      thumbnail: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=800&auto=format&fit=crop',
      featured: false,
      acceptCod: true,
      acceptCard: true,
      movement: 'Japanese Automatic Cal. 9015',
      glass: 'Double-Domed Sapphire Crystal',
      caseMaterial: '316L Surgical Stainless Steel',
      waterResistance: '10 ATM (100 Meters)',
      caseDiameter: '41mm',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setMediaFiles([]);
    const methods = p.paymentMethods?.length ? p.paymentMethods : (['cod', 'card'] as const);
    setFormData({
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      sku: p.sku,
      category: p.category,
      categoryName: p.categoryName,
      subcategory: p.subcategory || (p.category === 'mens-accessories' ? 'Wallet' : ''),
      price: p.price,
      salePrice: p.salePrice || 0,
      stockQuantity: p.stockQuantity,
      shortDescription: p.shortDescription,
      description: p.description,
      thumbnail: p.thumbnail,
      featured: p.featured,
      acceptCod: methods.includes('cod'),
      acceptCard: methods.includes('card'),
      movement: p.specifications['Movement'] || '',
      glass: p.specifications['Glass'] || '',
      caseMaterial: p.specifications['Case Material'] || '',
      waterResistance: p.specifications['Water Resistance'] || '',
      caseDiameter: p.specifications['Case Diameter'] || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) return;
    if (!formData.acceptCod && !formData.acceptCard) {
      addToast('error', 'Payment Required', 'Select at least one payment method (COD or Card).');
      return;
    }

    const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const paymentMethods: Array<'cod' | 'card'> = [];
    if (formData.acceptCod) paymentMethods.push('cod');
    if (formData.acceptCard) paymentMethods.push('card');

    const isWatch = formData.category === 'watches';
    const specs: Record<string, string> = {
      'Case Material': formData.caseMaterial,
      'Water Resistance': formData.waterResistance,
      'Case Diameter': formData.caseDiameter,
    };
    if (isWatch) {
      specs.Movement = formData.movement;
      specs.Glass = formData.glass;
    }

    setIsUploadingMedia(true);
    let uploadedMedia: ProductMedia[] = [];
    try {
      if (mediaFiles.length > 0) uploadedMedia = await uploadProductMedia(mediaFiles, formData.sku || `product-${Date.now()}`);
    } catch (error) {
      addToast('error', 'Media Upload Failed', error instanceof Error ? error.message : 'Could not upload product media.');
      setIsUploadingMedia(false);
      return;
    }
    setIsUploadingMedia(false);

    const subcategory =
      formData.category === 'mens-accessories'
        ? (formData.subcategory || 'Wallet')
        : undefined;

    if (editingProduct) {
      const nextSpecs = { ...editingProduct.specifications, ...specs };
      if (!isWatch) {
        delete nextSpecs.Movement;
        delete nextSpecs.Glass;
      }
      updateProduct(editingProduct.id, {
        name: formData.name,
        slug,
        brand: formData.brand,
        sku: formData.sku,
        category: formData.category,
        categoryName: formData.category === 'watches' ? 'Watches' : "Men's Accessories",
        subcategory,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        stockQuantity: Number(formData.stockQuantity),
        shortDescription: formData.shortDescription,
        description: formData.description,
        thumbnail: formData.thumbnail,
        featured: formData.featured,
        paymentMethods,
        specifications: nextSpecs,
        ...(uploadedMedia.length > 0 ? { media: uploadedMedia, productImages: uploadedMedia.filter((item) => item.type === 'image').map((item) => item.url), thumbnail: uploadedMedia[0].url } : {}),
      });
      addToast('success', 'Product Updated', `${formData.name} was successfully updated.`);
    } else {
      addProduct({
        name: formData.name,
        slug,
        brand: formData.brand,
        sku: formData.sku,
        category: formData.category,
        categoryName: formData.category === 'watches' ? 'Watches' : "Men's Accessories",
        subcategory,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        stockQuantity: Number(formData.stockQuantity),
        shortDescription: formData.shortDescription,
        description: formData.description,
        thumbnail: formData.thumbnail,
        productImages: [formData.thumbnail],
        ...(uploadedMedia.length > 0 ? { media: uploadedMedia, productImages: uploadedMedia.filter((item) => item.type === 'image').map((item) => item.url), thumbnail: uploadedMedia[0].url } : {}),
        featured: formData.featured,
        paymentMethods,
        tags: [formData.category === 'watches' ? 'Automatic' : 'Titanium'],
        specifications: specs,
        features: [
          'High precision craftsmanship',
          'Surgical aerospace construction',
          'Anti-reflective sapphire coating',
        ],
      });
      addToast('success', 'Product Added', `${formData.name} was added to the showroom inventory.`);
    }

    setIsAddModalOpen(false);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    const matchesSearch =
      !orderSearch ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.trackingNumber ?? '').toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminAuthGate>
      <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Bar */}
          <div className="py-8 border-b border-[#262930] mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block mb-1">
                STORIUM Administrative Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
                Showroom Control Center
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('home')}
                className="py-2 px-4 rounded-xl bg-[#181A1F] text-xs text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930]"
              >
                Public Showroom &rarr;
              </button>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-8 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'overview'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
                }`}
            >
              Overview &amp; Metrics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'products'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
                }`}
            >
              <span>Product Catalog</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${activeTab === 'products' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                  }`}
              >
                {products.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'orders'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
                }`}
            >
              <span>Orders &amp; Dispatch</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${activeTab === 'orders' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                  }`}
              >
                {orders.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inquiries')}
              className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'inquiries'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
                }`}
            >
              <MessageSquare className={`w-3.5 h-3.5 ${activeTab === 'inquiries' ? 'text-[#0B0C0E]' : 'text-[#8E929E]'}`} />
              <span>Concierge Inquiries</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${activeTab === 'inquiries' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                  }`}
              >
                {inquiries.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'reviews'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
                }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeTab === 'reviews' ? 'text-[#0B0C0E]' : 'text-[#8E929E]'}`} />
              <span>Reviews</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${activeTab === 'reviews' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                  }`}
              >
                {reviews.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('supabase')}
              className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'supabase'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
                }`}
            >
              <Database className={`w-3.5 h-3.5 ${activeTab === 'supabase' ? 'text-[#0B0C0E]' : 'text-[#D4AF37]'}`} />
              <span>Supabase Cloud DB</span>
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'supabase' ? 'bg-[#0B0C0E]' : 'bg-emerald-400 animate-pulse'}`} />
            </button>
          </div>

          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-10">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
                  <span className="text-xs text-[#8E929E] uppercase tracking-wider">
                    Total Gross Revenue
                  </span>
                  <span className="block text-2xl sm:text-3xl font-bold text-[#D4AF37] font-serif-luxury">
                    Rs. {totalRevenue.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-400">All Pakistani orders processed</span>
                </div>

                <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
                  <span className="text-xs text-[#8E929E] uppercase tracking-wider">
                    Total Orders Placed
                  </span>
                  <span className="block text-2xl sm:text-3xl font-bold text-[#F5F5F7] font-serif-luxury">
                    {orders.length} Orders
                  </span>
                  <span className="text-[11px] text-[#8E929E]">{pendingOrders} awaiting dispatch</span>
                </div>

                <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
                  <span className="text-xs text-[#8E929E] uppercase tracking-wider">
                    Active Showroom SKUs
                  </span>
                  <span className="block text-2xl sm:text-3xl font-bold text-[#F5F5F7] font-serif-luxury">
                    {products.length} Items
                  </span>
                  <span className="text-[11px] text-[#8E929E]">Across Watches &amp; Accessories</span>
                </div>

                <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
                  <span className="text-xs text-[#8E929E] uppercase tracking-wider">
                    Low Stock Warnings
                  </span>
                  <span className="block text-2xl sm:text-3xl font-bold text-amber-400 font-serif-luxury">
                    {lowStockProducts.length} Items
                  </span>
                  <span className="text-[11px] text-amber-400/80">Stock &le; 5 units remaining</span>
                </div>
              </div>

              {/* Quick Actions & Recent Orders preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#262930] pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F5F7]">
                      Recent Patron Orders
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-[#D4AF37] hover:underline"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {orders.slice(0, 4).map((o) => (
                      <div
                        key={o.id}
                        className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-[#D4AF37]">{o.orderNumber}</span>
                          <span className="text-[#8E929E] block">
                            {o.customer.fullName} &bull; {o.customer.city}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#F5F5F7]">
                            Rs. {o.total.toLocaleString()}
                          </span>
                          <span className="block text-[10px] text-emerald-400">{o.orderStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#262930] pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F5F7]">
                      Inventory Attention Needed
                    </h3>
                    <button
                      onClick={handleOpenAdd}
                      className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New SKU</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {lowStockProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.thumbnail}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <span className="font-semibold text-[#F5F5F7] block">{p.name}</span>
                            <span className="text-[10px] font-mono text-[#8E929E]">{p.sku}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          {p.stockQuantity} left
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#8E929E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by title or SKU..."
                    className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-[#121316] border border-[#262930] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs uppercase tracking-wider font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Timepiece / SKU</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="rounded-2xl bg-[#121316] border border-[#262930] overflow-x-auto shadow-xl">
                <table className="w-full text-left text-xs text-[#E8E8EC]">
                  <thead className="bg-[#0B0C0E] border-b border-[#262930] text-[10px] uppercase tracking-wider text-[#8E929E]">
                    <tr>
                      <th className="p-4">Timepiece / Item</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price (PKR)</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Showroom Featured</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262930]">
                    {filteredProducts.map((p) => (
                      <motion.tr
                        key={p.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-[#181A1F] transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.thumbnail}
                              alt={p.name}
                              className="w-12 h-12 rounded-lg object-cover bg-[#0B0C0E] flex-shrink-0"
                            />
                            <div>
                              <span className="font-mono text-[10px] text-[#D4AF37] block">
                                {p.sku}
                              </span>
                              <span className="font-semibold text-[#F5F5F7] text-sm block">
                                {p.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 uppercase tracking-wider text-[11px] text-[#8E929E]">
                          <div>{p.categoryName}</div>
                          {p.category === 'mens-accessories' && p.subcategory && (
                            <div className="text-[10px] text-[#D4AF37] font-mono normal-case mt-0.5">
                              ↳ {p.subcategory}
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-bold text-[#F5F5F7]">
                          Rs. {(p.salePrice ?? p.price).toLocaleString()}
                          {p.salePrice && (
                            <span className="block text-[10px] text-[#8E929E] line-through font-normal">
                              Rs. {p.price.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${p.stockQuantity <= 5
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                          >
                            {p.stockQuantity} units
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {(p.paymentMethods?.length ? p.paymentMethods : ['cod', 'card']).includes('cod') && (
                              <span className="px-1.5 py-0.5 rounded bg-[#181A1F] border border-[#262930] text-[9px] uppercase tracking-wider text-[#E5C378]">
                                COD
                              </span>
                            )}
                            {(p.paymentMethods?.length ? p.paymentMethods : ['cod', 'card']).includes('card') && (
                              <span className="px-1.5 py-0.5 rounded bg-[#181A1F] border border-[#262930] text-[9px] uppercase tracking-wider text-[#E5C378]">
                                Card
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => updateProduct(p.id, { featured: !p.featured })}
                            className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-colors ${p.featured
                              ? 'bg-[#D4AF37] text-[#0B0C0E]'
                              : 'bg-[#181A1F] text-[#8E929E] border border-[#262930]'
                              }`}
                          >
                            {p.featured ? 'Featured' : 'Standard'}
                          </button>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-[#D4AF37] border border-[#262930]"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete ${p.name}?`)) {
                                deleteProduct(p.id);
                                addToast('info', 'Deleted', `${p.name} was removed from showroom.`);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-rose-400 border border-[#262930]"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS DISPATCH MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#8E929E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search order #, customer, or tracking..."
                    className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-[#121316] border border-[#262930] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
                  {['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${orderStatusFilter === st
                        ? 'bg-[#D4AF37] text-[#0B0C0E]'
                        : 'bg-[#121316] text-[#8E929E] border border-[#262930]'
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl bg-[#121316] border border-[#262930] overflow-x-auto shadow-xl">
                <table className="w-full text-left text-xs text-[#E8E8EC]">
                  <thead className="bg-[#0B0C0E] border-b border-[#262930] text-[10px] uppercase tracking-wider text-[#8E929E]">
                    <tr>
                      <th className="p-4">Order ID &amp; Tracking</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">City</th>
                      <th className="p-4">Total (PKR)</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Status &amp; Flow</th>
                      <th className="p-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262930]">
                    {filteredOrders.map((o) => (
                      <motion.tr
                        key={o.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-[#181A1F] transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#D4AF37] block">
                              {o.orderNumber}
                            </span>
                            {o.supabaseSynced ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                                <Database className="w-2 h-2" /> Supabase
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1C1D22] text-[#8E929E] border border-[#262930]">
                                Local
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-[#8E929E] block">
                            {o.trackingNumber}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-[#F5F5F7] block">
                            {o.customer.fullName}
                          </span>
                          <span className="text-[11px] text-[#8E929E]">{o.customer.phone}</span>
                        </td>
                        <td className="p-4 text-[#F5F5F7]">{o.customer.city}</td>
                        <td className="p-4 font-bold text-[#D4AF37]">
                          Rs. {o.total.toLocaleString()}
                        </td>
                        <td className="p-4 uppercase text-[10px]">
                          {o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Debit Card'}
                        </td>
                        <td className="p-4">
                          <select
                            value={o.orderStatus}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                            className="bg-[#0B0C0E] border border-[#262930] rounded-lg px-2.5 py-1 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(o)}
                            className="p-1.5 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-[#D4AF37] border border-[#262930]"
                            title="View Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal: View Order Details */}
          <AnimatePresence>
            {selectedOrderDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-xl bg-[#121316] border border-[#262930] rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between border-b border-[#262930] pb-4">
                    <div>
                      <span className="font-mono text-xs text-[#D4AF37] font-bold">
                        {selectedOrderDetails.orderNumber}
                      </span>
                      <h3 className="text-base font-bold text-[#F5F5F7]">Pakistani Order Consignment</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderDetails(null)}
                      className="p-1.5 text-[#8E929E] hover:text-[#F5F5F7]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#262930] space-y-1">
                      <span className="text-[#8E929E] uppercase tracking-wider block">Customer:</span>
                      <p className="font-semibold text-[#F5F5F7] text-sm">
                        {selectedOrderDetails.customer.fullName}
                      </p>
                      <p className="text-[#8E929E]">{selectedOrderDetails.customer.phone}</p>
                      <p className="text-[#8E929E]">{selectedOrderDetails.customer.email}</p>
                      <p className="text-[#F5F5F7] pt-1">
                        {selectedOrderDetails.customer.address}, {selectedOrderDetails.customer.city},{' '}
                        {selectedOrderDetails.customer.province}
                      </p>
                      {selectedOrderDetails.customer.notes && (
                        <p className="text-[#D4AF37] italic pt-1">
                          Note: &ldquo;{selectedOrderDetails.customer.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[#8E929E] uppercase tracking-wider block">Purchased Timepieces:</span>
                      {selectedOrderDetails.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-[#0B0C0E] border border-[#262930] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={it.productThumbnail}
                              alt={it.productName}
                              className="w-10 h-10 rounded-md object-cover"
                            />
                            <div>
                              <span className="font-semibold text-[#F5F5F7] block">{it.productName}</span>
                              <span className="text-[10px] text-[#8E929E] font-mono">
                                Qty: {it.quantity} &bull; SKU: {it.sku}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-[#D4AF37]">
                            Rs. {(it.price * it.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#262930] flex justify-between text-sm font-bold">
                      <span>Grand Total:</span>
                      <span className="text-[#D4AF37]">
                        Rs. {selectedOrderDetails.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 4: CONCIERGE INQUIRIES */}
          {activeTab === 'inquiries' && <AdminInquiriesTab />}

          {/* TAB 5: PRODUCT REVIEWS */}
          {activeTab === 'reviews' && <AdminReviewsTab />}

          {/* TAB 6: SUPABASE CLOUD BACKEND */}
          {activeTab === 'supabase' && <AdminSupabaseTab />}

          {/* Modal: Add/Edit Product */}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-2xl bg-[#121316] border border-[#262930] rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#262930] pb-4">
                  <h3 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
                    {editingProduct ? 'Edit Showroom Timepiece' : 'Add New Showroom SKU'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1.5 text-[#8E929E] hover:text-[#F5F5F7]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. STORIUM Chrono Apex"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        SKU Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="STM-009"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        Regular Price (PKR) *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        Sale Price (PKR, Optional)
                      </label>
                      <input
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) =>
                          setFormData({ ...formData, salePrice: Number(e.target.value) })
                        }
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setFormData({
                            ...formData,
                            category: newCat,
                            categoryName: newCat === 'watches' ? 'Watches' : "Men's Accessories",
                            subcategory: newCat === 'mens-accessories' ? (formData.subcategory || 'Wallet') : '',
                          });
                        }}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      >
                        <option value="watches">Watches</option>
                        <option value="mens-accessories">Men&apos;s Accessories</option>
                      </select>
                    </div>

                    {formData.category === 'mens-accessories' && (
                      <div>
                        <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                          Subcategory *
                        </label>
                        <select
                          value={formData.subcategory || 'Wallet'}
                          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                          className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:border-[#D4AF37]"
                        >
                          {ACCESSORY_SUBCATEGORIES.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.stockQuantity}
                        onChange={(e) =>
                          setFormData({ ...formData, stockQuantity: Number(e.target.value) })
                        }
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                      Product Media (up to 3 images or videos)
                    </label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={(event) => setMediaFiles(Array.from(event.target.files || []).slice(0, 3))}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                    />
                    <p className="mt-1 text-[11px] text-[#626673]">Select up to 3 files. New uploads replace the current product media.</p>
                    {mediaFiles.length > 0 && <p className="mt-1 text-[11px] text-[#D4AF37]">{mediaFiles.length} file(s) ready to upload.</p>}
                  </div>

                  <div>
                    <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                      Detailed Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#262930]">
                    <label className="block text-[#8E929E] mb-2 uppercase tracking-wider">
                      Accepted Payment Methods *
                    </label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-[#F5F5F7]">
                        <input
                          type="checkbox"
                          checked={formData.acceptCod}
                          onChange={(e) => setFormData({ ...formData, acceptCod: e.target.checked })}
                          className="accent-[#D4AF37]"
                        />
                        Cash on Delivery (COD)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-[#F5F5F7]">
                        <input
                          type="checkbox"
                          checked={formData.acceptCard}
                          onChange={(e) => setFormData({ ...formData, acceptCard: e.target.checked })}
                          className="accent-[#D4AF37]"
                        />
                        Debit / Credit Card
                      </label>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#626673]">
                      Only selected methods will appear at checkout for this product.
                    </p>
                  </div>

                  {formData.category === 'watches' && (
                    <div className="pt-2 border-t border-[#262930] grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#8E929E] mb-1">Movement</label>
                        <input
                          type="text"
                          value={formData.movement}
                          onChange={(e) => setFormData({ ...formData, movement: e.target.value })}
                          className="w-full py-2 px-3 rounded-lg bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#8E929E] mb-1">Glass</label>
                        <input
                          type="text"
                          value={formData.glass}
                          onChange={(e) => setFormData({ ...formData, glass: e.target.value })}
                          className="w-full py-2 px-3 rounded-lg bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featuredCheckbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="accent-[#D4AF37]"
                    />
                    <label htmlFor="featuredCheckbox" className="text-xs text-[#F5F5F7]">
                      Feature prominently on Homepage Showcase
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="py-2.5 px-5 rounded-xl bg-[#181A1F] text-xs text-[#8E929E]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider"
                    >
                      {isUploadingMedia ? 'Uploading Media...' : 'Save Timepiece'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminAuthGate>
  );
};
