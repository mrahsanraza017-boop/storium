import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  Eye,
  Database,
  MessageSquare,
  Star,
  Settings2,
  Mail,
  Send,
  Truck,
  ExternalLink,
  Printer,
  Navigation,
  CreditCard,
  RotateCcw,
  RefreshCw,
  Copy,
  Users,
  TrendingUp,
  Bell,
  Download,
  Smartphone,
  LayoutDashboard,
  MoreHorizontal,
  ChevronDown,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, Order, ACCESSORY_SUBCATEGORIES } from '../types';

import { AdminAuthGate } from '../components/admin/AdminAuthGate';
import { AdminSupabaseTab } from '../components/admin/AdminSupabaseTab';
import { AdminInquiriesTab } from '../components/admin/AdminInquiriesTab';
import { AdminReviewsTab } from '../components/admin/AdminReviewsTab';
import { AdminBusinessSettingsTab } from '../components/admin/AdminBusinessSettingsTab';
import { AdminEmailTab } from '../components/admin/AdminEmailTab';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminPaymentsTab } from '../components/admin/AdminPaymentsTab';
import { AdminRefundsTab } from '../components/admin/AdminRefundsTab';
import { AdminCustomersTab } from '../components/admin/AdminCustomersTab';
import { AdminAnalyticsTab } from '../components/admin/AdminAnalyticsTab';
import { AdminNotificationsTab } from '../components/admin/AdminNotificationsTab';
import { AdminPromotionsTab } from '../components/admin/AdminPromotionsTab';
import { isPwaInstallable, promptPwaInstall, isPwaInstalled, onPwaInstallAvailable } from '../services/pwaService';
import { getLiveVisitorsCount } from '../services/analyticsTracker';
import { uploadProductMedia } from '../services/supabaseService';
import { ProductMedia } from '../types';
import {
  bookWithRunCouriers,
  trackRunCourier,
  checkRunCourierStatus,
  TrackingHistoryItem,
  CourierGatewayStatus,
} from '../services/courierService';

export const AdminView: React.FC = () => {
  const {
    products,
    orders,
    refunds,
    notifications,
    inquiries,
    reviews,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    updateOrderCourierBooking,
    deleteOrder,
    deleteOrdersByNumber,
    sendConfirmationEmail,
    navigate,
    addToast,
    businessSettings,
    setStorewideShippingFee,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'products'
    | 'orders'
    | 'payments'
    | 'refunds'
    | 'customers'
    | 'promotions'
    | 'analytics'
    | 'notifications'
    | 'inquiries'
    | 'reviews'
    | 'emails'
    | 'supabase'
    | 'settings'
  >('overview');

  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [liveVisitors, setLiveVisitors] = useState<number>(() => getLiveVisitorsCount());
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(() => isPwaInstallable());
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isPwaInstalled());

  // Storewide Shipping Fee Editor State (applies across all products)
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingFlatInput, setShippingFlatInput] = useState<number>(() => businessSettings.shippingFlatFee);
  const [shippingFreeAboveInput, setShippingFreeAboveInput] = useState<number>(() => businessSettings.shippingFreeAbove);

  useEffect(() => {
    setShippingFlatInput(businessSettings.shippingFlatFee);
    setShippingFreeAboveInput(businessSettings.shippingFreeAbove);
  }, [businessSettings.shippingFlatFee, businessSettings.shippingFreeAbove]);

  useEffect(() => {
    const unsub = onPwaInstallAvailable(() => {
      setCanInstallPwa(isPwaInstallable());
      setIsInstalled(isPwaInstalled());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVisitors(getLiveVisitorsCount());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadNotifsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);


  // Product management states
  const [productSearch, setProductSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<ProductMedia[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Order management states
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // RUN Couriers Integration States
  const [bookingCourierOrder, setBookingCourierOrder] = useState<Order | null>(null);
  const [bookingWeight, setBookingWeight] = useState<number>(0.5);
  const [bookingPieces, setBookingPieces] = useState<number>(1);
  const [bookingCollectionAmount, setBookingCollectionAmount] = useState<number>(0);
  const [bookingSpecialInstruction, setBookingSpecialInstruction] = useState<string>('Fragile Luxury Timepiece - Handle with Care');
  const [isBookingCourier, setIsBookingCourier] = useState<boolean>(false);
  const [quickTrackingInput, setQuickTrackingInput] = useState<string>('');
  const [courierGatewayStatus, setCourierGatewayStatus] = useState<CourierGatewayStatus | null>(null);
  const [isCheckingCourier, setIsCheckingCourier] = useState<boolean>(false);
  const [trackingModalData, setTrackingModalData] = useState<{
    orderNumber: string;
    trackingNo: string;
    currentStatus: string;
    history: TrackingHistoryItem[];
    loading: boolean;
  } | null>(null);

  useEffect(() => {
    if (activeTab === 'orders' && courierGatewayStatus === null && !isCheckingCourier) {
      checkRunCourierStatus()
        .then((status) => {
          setCourierGatewayStatus(status);
        })
        .catch(() => {});
    }
  }, [activeTab, courierGatewayStatus, isCheckingCourier]);

  const handleCheckCourierStatus = async () => {
    setIsCheckingCourier(true);
    try {
      const status = await checkRunCourierStatus();
      setCourierGatewayStatus(status);
      if (status.connected) {
        addToast('success', 'RUN Couriers Live', `Gateway is online & responding. Client Code: ${status.client_code} (${status.latency_ms || 120}ms)`);
      } else {
        addToast('error', 'Gateway Issue', status.message);
      }
    } catch (err: any) {
      addToast('error', 'Status Check Failed', err?.message || 'Could not verify RUN Couriers status');
    } finally {
      setIsCheckingCourier(false);
    }
  };

  const handleOpenBookingModal = (order: Order) => {
    setBookingCourierOrder(order);
    setBookingWeight(0.5);
    setBookingPieces(order.items.reduce((acc, it) => acc + (it.quantity || 1), 0) || 1);
    setBookingSpecialInstruction('Fragile Luxury Timepiece - Handle with Care');
    setBookingCollectionAmount(order.paymentMethod === 'cod' ? (order.total || 0) : 0);
  };

  const handleConfirmRunCourierBooking = async () => {
    if (!bookingCourierOrder) return;
    setIsBookingCourier(true);
    try {
      const res = await bookWithRunCouriers(bookingCourierOrder, {
        weight: bookingWeight,
        pieces: bookingPieces,
        specialInstruction: bookingSpecialInstruction,
        collectionAmount: String(bookingCollectionAmount),
      });

      if (res.success) {
        updateOrderCourierBooking(bookingCourierOrder.id, {
          trackingNumber: res.tracking_no,
          courierName: 'RUN Couriers',
          courierInvoiceUrl: res.invoice_link,
          courierBookingId: res.booking_id,
          orderStatus: 'Shipped',
        });

        // Also update modal view if currently open
        if (selectedOrderDetails?.id === bookingCourierOrder.id) {
          setSelectedOrderDetails({
            ...selectedOrderDetails,
            trackingNumber: res.tracking_no,
            courierName: 'RUN Couriers',
            courierInvoiceUrl: res.invoice_link,
            courierBookingId: res.booking_id,
            orderStatus: 'Shipped',
          });
        }

        setBookingCourierOrder(null);
        addToast('success', 'Consignment Booked', `RUN Couriers tracking #${res.tracking_no} generated successfully.`);
      } else {
        addToast('error', 'Booking Failed', res.error || 'Could not complete RUN Couriers booking');
      }
    } catch (err: any) {
      addToast('error', 'Booking Error', err?.message || 'Error communicating with RUN Couriers');
    } finally {
      setIsBookingCourier(false);
    }
  };

  const handleOpenTrackingModal = async (orderNumber: string, trackingNo: string) => {
    const cleanNo = trackingNo.trim();
    if (!cleanNo) {
      addToast('info', 'Tracking Required', 'Please provide a valid RUN Couriers tracking number.');
      return;
    }
    setTrackingModalData({
      orderNumber,
      trackingNo: cleanNo,
      currentStatus: 'Connecting to RUN Couriers...',
      history: [],
      loading: true,
    });
    try {
      const result = await trackRunCourier(cleanNo);
      setTrackingModalData({
        orderNumber,
        trackingNo: cleanNo,
        currentStatus: result.current_status || 'In Transit',
        history: result.history || [],
        loading: false,
      });
    } catch {
      setTrackingModalData((prev) =>
        prev ? { ...prev, currentStatus: 'Tracking Active', loading: false } : null
      );
    }
  };

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackingInput.trim()) return;
    handleOpenTrackingModal('Manual Lookup', quickTrackingInput.trim());
  };


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
    setExistingMedia([]);
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
    setExistingMedia(p.media || []);
    const methods = p.paymentMethods?.length ? p.paymentMethods : (['cod', 'card'] as const);
    setFormData({
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      sku: p.sku,
      category: p.category,
      categoryName: p.categoryName || (p.category === 'watches' ? 'Watches' : 'Accessories'),
      subcategory: p.subcategory || (p.category === 'accessories' || p.category === 'mens-accessories' ? 'Wallet' : ''),
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

  // Reorder a media/file list by one slot. Items render in array order, so the
  // first entry is what shoppers see first on the public site.
  const moveMedia = <T,>(list: T[], from: number, delta: number): T[] => {
    const to = from + delta;
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  // Pin a media item to the front so it displays first publicly.
  const moveMediaToFront = <T,>(list: T[], from: number): T[] => {
    if (from <= 0 || from >= list.length) return list;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.unshift(moved);
    return next;
  };

  const [isCompressingMedia, setIsCompressingMedia] = useState(false);

  // Automatically compress uploaded product images
  const handleMediaFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setIsCompressingMedia(true);
    try {
      let totalOriginal = 0;
      let totalCompressed = 0;
      const processed: File[] = [];

      for (const file of selectedFiles) {
        if (file.type.startsWith('image/')) {
          const res = await compressImage(file);
          processed.push(res.file);
          totalOriginal += res.originalSize;
          totalCompressed += res.compressedSize;
        } else {
          processed.push(file);
          totalOriginal += file.size;
          totalCompressed += file.size;
        }
      }

      setMediaFiles((prev) => [...prev, ...processed]);

      if (totalOriginal > totalCompressed) {
        const savedMb = ((totalOriginal - totalCompressed) / (1024 * 1024)).toFixed(1);
        const savedPct = Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100);
        addToast(
          'info',
          'Images Auto-Compressed',
          `Compressed ${processed.length} image(s). Saved ${savedMb} MB (-${savedPct}% size) for ultra-fast mobile loading.`
        );
      }
    } catch (err) {
      console.warn('Auto compression notice:', err);
      setMediaFiles((prev) => [...prev, ...selectedFiles]);
    } finally {
      setIsCompressingMedia(false);
      // Reset input value so re-selecting same files triggers change event
      e.target.value = '';
    }
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

    // Warn if only some of the selected files made it (e.g. oversized files).
    if (mediaFiles.length > 0 && uploadedMedia.length < mediaFiles.length) {
      addToast(
        'error',
        'Some Files Skipped',
        `${uploadedMedia.length} of ${mediaFiles.length} files uploaded. Check that each file is within your Supabase storage size limit.`
      );
    }

    // Determine final media order. The admin-curated `existingMedia` order is
    // preserved and any newly uploaded files are appended after it (dedup by
    // URL), so the admin's chosen "first" item still leads the gallery.
    const seen = new Set<string>();
    const finalMedia: ProductMedia[] = [...existingMedia, ...uploadedMedia].filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
    const finalProductImages = finalMedia.filter((item) => item.type === 'image').map((item) => item.url);
    // Thumbnail stays an image (cards/cart/SEO need one), preferring the first
    // image in the admin-defined order.
    const finalThumbnail = finalProductImages.length > 0 ? finalProductImages[0] : formData.thumbnail;

    const isAccessory = formData.category === 'accessories' || formData.category === 'mens-accessories';
    const subcategory = isAccessory ? (formData.subcategory || 'Wallet') : undefined;

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
        categoryName: formData.category === 'watches' ? 'Watches' : 'Accessories',
        subcategory,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        stockQuantity: Number(formData.stockQuantity),
        shortDescription: formData.shortDescription,
        description: formData.description,
        thumbnail: finalThumbnail,
        featured: formData.featured,
        paymentMethods,
        specifications: nextSpecs,
        media: finalMedia,
        productImages: finalProductImages,
      });
      addToast('success', 'Product Updated', `${formData.name} was successfully updated.`);
    } else {
      addProduct({
        name: formData.name,
        slug,
        brand: formData.brand,
        sku: formData.sku,
        category: formData.category,
        categoryName: formData.category === 'watches' ? 'Watches' : 'Accessories',
        subcategory,

        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        stockQuantity: Number(formData.stockQuantity),
        shortDescription: formData.shortDescription,
        description: formData.description,
        thumbnail: finalThumbnail,
        productImages: finalProductImages,
        media: finalMedia,
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

  const deliveredOrders = orders.filter((o) => o.orderStatus === 'Delivered');
  const deliveredRevenue = deliveredOrders.reduce((acc, o) => acc + o.total, 0);

  const handleDeleteOrder = async (orderNumber: string) => {
    if (!confirm(`Delete order ${orderNumber}? This removes it from the admin panel and the public customer history.`)) return;
    await deleteOrder(orderNumber);
    addToast('success', 'Order Removed', `Order ${orderNumber} was removed.`);
  };

  const handleRemoveAllRecent = async () => {
    if (orders.length === 0) {
      addToast('info', 'No Orders', 'There are no orders to remove.');
      return;
    }
    if (!confirm(`Remove all ${orders.length} orders? This removes them from the admin panel and the public customer history.`)) return;
    await deleteOrdersByNumber(orders.map((o) => o.orderNumber));
    addToast('success', 'Orders Removed', `Removed ${orders.length} orders from the store.`);
  };

  const handleRemoveDelivered = async () => {
    if (deliveredOrders.length === 0) {
      addToast('info', 'No Delivered Orders', 'There are no Delivered orders to remove.');
      return;
    }
    if (!confirm(
      `Remove all ${deliveredOrders.length} Delivered orders totalling Rs. ${deliveredRevenue.toLocaleString()}?\nTheir revenue will be removed from the dashboard.`
    )) return;
    await deleteOrdersByNumber(deliveredOrders.map((o) => o.orderNumber));
    addToast('success', 'Delivered Orders Removed', `Removed ${deliveredOrders.length} orders and Rs. ${deliveredRevenue.toLocaleString()} from revenue.`);
  };

  return (
    <AdminAuthGate>
      <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Bar */}
          <div className="py-6 border-b border-[#262930] mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
                  STORIUM Progressive Web App
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
                Showroom Control Center
              </h1>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Live Visitor Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121316] border border-[#262930]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">{liveVisitors}</span>
                <span className="text-[10px] text-[#8E929E] uppercase tracking-wider font-semibold">Online</span>
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className="relative p-2 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] transition-all cursor-pointer"
                title="Notifications & Alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#D4AF37] text-[#0B0C0E] text-[9px] font-bold font-mono">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Install PWA Button */}
              {canInstallPwa && !isInstalled && (
                <button
                  type="button"
                  onClick={() => promptPwaInstall()}
                  className="py-1.5 px-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#D4AF37]/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('home')}
                className="py-1.5 px-3.5 rounded-xl bg-[#181A1F] text-xs text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] transition-all"
              >
                Public Store &rarr;
              </button>
            </div>
          </div>

          {/* Admin Navigation Tabs (Desktop & Tablet) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Orders</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  activeTab === 'orders' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                }`}
              >
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Catalog</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  activeTab === 'products' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                }`}
              >
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payments</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('refunds')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'refunds'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refunds</span>
              {refunds.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    activeTab === 'refunds' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                  }`}
                >
                  {refunds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('promotions')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'promotions'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Promotions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alerts</span>
              {unreadNotifsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#D4AF37] text-[#0B0C0E]">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inquiries')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'inquiries'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Inquiries</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  activeTab === 'inquiries' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                }`}
              >
                {inquiries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Reviews</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  activeTab === 'reviews' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                }`}
              >
                {reviews.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('emails')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'emails'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Receipts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('supabase')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'supabase'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cloud DB</span>
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'supabase' ? 'bg-[#0B0C0E]' : 'bg-emerald-400 animate-pulse'}`} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                  : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW METRICS (Shopify-Style PWA Realtime Dashboard) */}
          {activeTab === 'overview' && (
            <AdminOverviewTab
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAddProduct={handleOpenAdd}
            />
          )}

          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Storewide Shipping Fee Quick Control Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#181A1F] via-[#141518] to-[#181A1F] border border-[#262930] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-[#F5F5F7]">Storewide Shipping Fee</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-mono font-bold border border-[#D4AF37]/20">
                        Applies to All Products
                      </span>
                    </div>
                    <p className="text-xs text-[#8E929E] mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>
                        Standard Flat Fee:{' '}
                        <strong className="text-[#F5F5F7] font-mono">
                          {businessSettings.shippingFlatFee === 0 ? 'FREE DELIVERY (Rs. 0)' : `Rs. ${businessSettings.shippingFlatFee.toLocaleString()}`}
                        </strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Free Shipping Threshold:{' '}
                        <strong className="text-[#F5F5F7] font-mono">
                          {businessSettings.shippingFreeAbove > 0 ? `Orders above Rs. ${businessSettings.shippingFreeAbove.toLocaleString()}` : 'Disabled'}
                        </strong>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShippingFlatInput(businessSettings.shippingFlatFee);
                      setShippingFreeAboveInput(businessSettings.shippingFreeAbove);
                      setIsShippingModalOpen(true);
                    }}
                    className="py-2 px-4 rounded-xl bg-[#20232A] hover:bg-[#2A2E37] text-[#D4AF37] hover:text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Change Shipping Fee</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#8E929E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    aria-label="Search products by title or SKU"
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
                          <div>{p.categoryName || (p.category === 'watches' ? 'Watches' : 'Accessories')}</div>
                          {(p.category === 'accessories' || p.category === 'mens-accessories') && p.subcategory && (
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
                    aria-label="Search orders by order number, customer, or tracking"
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

                <button
                  type="button"
                  onClick={handleRemoveDelivered}
                  className="flex-shrink-0 py-2 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2"
                  title="Remove all Delivered orders and their revenue from the dashboard"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Delivered ({deliveredOrders.length})</span>
                </button>
              </div>

              {/* Quick RUN Courier Tracking Console */}
              <div className="p-4 rounded-2xl bg-[#121316] border border-[#262930] flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="p-2.5 rounded-xl bg-[#0B0C0E] border border-[#D4AF37]/30 text-[#D4AF37] flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        RUN Couriers Live Integration
                      </span>
                      {courierGatewayStatus === null ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold border flex items-center gap-1 bg-[#181A1F] text-[#8E929E] border-[#262930]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Checking Status...
                        </span>
                      ) : courierGatewayStatus.connected ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold border flex items-center gap-1 bg-emerald-950/60 text-emerald-400 border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live Connected ({courierGatewayStatus.latency_ms || 120}ms)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold border flex items-center gap-1 bg-rose-950/60 text-rose-300 border-rose-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Offline (Check Hostinger /public_html)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleCheckCourierStatus}
                        disabled={isCheckingCourier}
                        className="text-[10px] py-0.5 px-2 rounded-md bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] hover:text-[#F3E5AB] border border-[#D4AF37]/30 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isCheckingCourier ? 'animate-spin' : ''}`} />
                        <span>{isCheckingCourier ? 'Testing...' : 'Test Connection'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#8E929E] mt-0.5">
                      Client Code: <strong className="text-[#D4AF37] font-mono">1000003434</strong> &bull; Auth: <strong className="text-emerald-400 font-mono">cf78••••4e</strong> &bull; Portal: <span className="text-[#F5F5F7]">portal.runcourier.com</span>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleQuickTrackSubmit} className="flex items-center gap-2 w-full lg:w-auto">
                  <input
                    type="text"
                    value={quickTrackingInput}
                    onChange={(e) => setQuickTrackingInput(e.target.value)}
                    placeholder="Enter RUN tracking # (e.g. 22320269337378)..."
                    className="flex-1 lg:w-72 py-2 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                    disabled={!quickTrackingInput.trim()}
                    className="py-2 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer flex-shrink-0 shadow-md"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Track</span>
                  </button>
                </form>
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
                          {o.trackingNumber ? (
                            <div className="flex flex-col gap-1 mt-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 w-fit">
                                  <Truck className="w-2.5 h-2.5" /> RUN #{o.trackingNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenTrackingModal(o.orderNumber, o.trackingNumber!)}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#181A1F] hover:bg-[#D4AF37] hover:text-[#0B0C0E] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1 transition-all cursor-pointer"
                                  title="Live Track RUN Courier Consignment"
                                >
                                  <Navigation className="w-2.5 h-2.5" /> Track
                                </button>
                              </div>
                              {o.courierInvoiceUrl && (
                                <a
                                  href={o.courierInvoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-[#CBD0DC] hover:text-[#D4AF37] underline flex items-center gap-0.5 w-fit"
                                  title="Open RUN Couriers Airway Bill / Invoice"
                                >
                                  <Printer className="w-2.5 h-2.5" /> Airway Bill
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenBookingModal(o)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0B0C0E] border border-[#D4AF37]/40 flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Book consignment with RUN Couriers"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Book RUN Courier</span>
                              </button>
                            </div>
                          )}
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
                            aria-label={`Order status for order ${o.orderNumber}`}
                            value={o.orderStatus}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                            className="bg-[#0B0C0E] border-[#262930] rounded-lg px-2.5 py-1 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(o)}
                            className="p-1.5 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-[#D4AF37] border border-[#262930]"
                            title="View Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {o.trackingNumber && (
                            <button
                              type="button"
                              onClick={() => handleOpenTrackingModal(o.orderNumber, o.trackingNumber!)}
                              className="p-1.5 rounded-lg bg-[#181A1F] text-[#D4AF37] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 transition-colors"
                              title={`Live Track RUN Courier: ${o.trackingNumber}`}
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {o.courierInvoiceUrl && (
                            <a
                              href={o.courierInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block p-1.5 rounded-lg bg-[#181A1F] text-[#D4AF37] hover:bg-[#20232A] border border-[#D4AF37]/30"
                              title="Print RUN Couriers Airway Bill"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(o.orderNumber)}
                            className="p-1.5 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-rose-400 border border-[#262930]"
                            title="Delete Order"
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
                      <h2 className="text-base font-bold text-[#F5F5F7]">Pakistani Order Consignment</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderDetails(null)}
                      aria-label="Close order details"
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

                    {/* RUN Couriers Logistics Consignment Card */}
                    <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#D4AF37]/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#D4AF37]">
                          <Truck className="w-4 h-4" />
                          <span className="font-bold uppercase tracking-wider text-[11px]">
                            RUN Couriers Pakistan Dispatch
                          </span>
                        </div>
                        {selectedOrderDetails.courierInvoiceUrl || selectedOrderDetails.courierName === 'RUN Couriers' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            Booked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#181A1F] text-[#8E929E] border border-[#262930]">
                            Not Dispatched
                          </span>
                        )}
                      </div>

                      {selectedOrderDetails.courierInvoiceUrl || selectedOrderDetails.courierName === 'RUN Couriers' ? (
                        <div className="space-y-2 pt-1 text-[11px]">
                          <div className="grid grid-cols-2 gap-2 text-[#8E929E]">
                            <div>
                              <span>Tracking Number:</span>
                              <p className="font-mono font-bold text-white text-xs">{selectedOrderDetails.trackingNumber}</p>
                            </div>
                            <div>
                              <span>Courier Service:</span>
                              <p className="font-semibold text-white">RUN Couriers (Overnight)</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[#8E929E] pt-1 border-t border-[#262930]">
                            <div>
                              <span>COD Collection:</span>
                              <p className="font-bold text-[#D4AF37]">
                                {selectedOrderDetails.paymentMethod === 'cod' ? `Rs. ${selectedOrderDetails.total.toLocaleString()}` : 'Rs. 0 (Prepaid Card)'}
                              </p>
                            </div>
                            <div>
                              <span>Destination:</span>
                              <p className="text-white">{selectedOrderDetails.customer.city}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            {selectedOrderDetails.courierInvoiceUrl && (
                              <a
                                href={selectedOrderDetails.courierInvoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2 px-3.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Airway Bill (Invoice)</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenTrackingModal(selectedOrderDetails.orderNumber, selectedOrderDetails.trackingNumber || '')}
                              className="py-2 px-3.5 rounded-lg bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] border border-[#262930] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Live Tracking</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1">
                          <p className="text-xs text-[#8E929E]">
                            Generate an official RUN Couriers airway bill and tracking number for overnight delivery to {selectedOrderDetails.customer.city}.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenBookingModal(selectedOrderDetails)}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Book Consignment with RUN Couriers</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#262930] flex justify-between text-sm font-bold">
                      <span>Grand Total:</span>
                      <span className="text-[#D4AF37]">
                        Rs. {selectedOrderDetails.total.toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#262930] flex justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          addToast('info', 'Sending…', `Sending receipt to ${selectedOrderDetails.customer.email}`);
                          const res = await sendConfirmationEmail(selectedOrderDetails);
                          if (res.success) {
                            addToast('success', 'Email Sent', `Order receipt successfully sent to ${selectedOrderDetails.customer.email}`);
                          } else {
                            addToast('error', 'Send Failed', res.error || 'Could not send confirmation email.');
                          }
                        }}
                        className="py-2 px-4 rounded-xl bg-[#181A1F] hover:bg-[#22252C] text-[#D4AF37] border border-[#262930] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Resend Confirmation Email</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal: Book RUN Couriers Consignment */}
          <AnimatePresence>
            {bookingCourierOrder && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md bg-[#121316] border border-[#262930] rounded-2xl p-6 space-y-5 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-[#262930] pb-3">
                    <div className="flex items-center gap-2 text-[#D4AF37]">
                      <Truck className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        Dispatch via RUN Couriers
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookingCourierOrder(null)}
                      className="p-1 text-[#8E929E] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0B0C0E] border border-emerald-500/30 text-[11px]">
                      <span className="text-[#8E929E]">RUN Gateway Account:</span>
                      <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Client Code: 1000003434
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#8E929E]">Order Number:</span>
                        <span className="font-mono font-bold text-[#D4AF37]">{bookingCourierOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8E929E]">Recipient:</span>
                        <span className="text-white font-semibold">{bookingCourierOrder.customer.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8E929E]">Destination City:</span>
                        <span className="text-white font-bold">{bookingCourierOrder.customer.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8E929E]">Payment Mode:</span>
                        <span className="font-semibold text-white uppercase text-[10px]">
                          {bookingCourierOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid (Card / Gateway)'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#CBD0DC] font-semibold mb-1">
                        COD Collection Amount (PKR) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bookingCollectionAmount}
                        onChange={(e) => setBookingCollectionAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full py-2 px-3 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs font-mono font-bold text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]"
                      />
                      <span className="text-[10px] text-[#8E929E] mt-1 block">
                        {bookingCourierOrder.paymentMethod === 'cod'
                          ? 'Cash to be collected from recipient upon delivery.'
                          : 'Order paid online. Note: If your RUN Couriers account is COD-only, RUN requires a collection amount > 0.'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#8E929E] mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={bookingWeight}
                          onChange={(e) => setBookingWeight(parseFloat(e.target.value) || 0.5)}
                          className="w-full py-2 px-3 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-[#8E929E] mb-1">
                          Parcels (Pieces)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={bookingPieces}
                          onChange={(e) => setBookingPieces(parseInt(e.target.value, 10) || 1)}
                          className="w-full py-2 px-3 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#8E929E] mb-1">
                        Special Instructions
                      </label>
                      <input
                        type="text"
                        value={bookingSpecialInstruction}
                        onChange={(e) => setBookingSpecialInstruction(e.target.value)}
                        placeholder="e.g. Fragile Luxury Watch - Handle with Care"
                        className="w-full py-2 px-3 rounded-lg bg-[#0B0C0E] border border-[#262930] text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#262930]">
                    <button
                      type="button"
                      onClick={() => setBookingCourierOrder(null)}
                      disabled={isBookingCourier}
                      className="px-4 py-2 rounded-xl bg-[#181A1F] text-[#8E929E] hover:text-white text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRunCourierBooking}
                      disabled={isBookingCourier}
                      className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{isBookingCourier ? 'Booking Consignment...' : 'Confirm & Generate Airway Bill'}</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal: RUN Couriers Live Tracking History */}
          <AnimatePresence>
            {trackingModalData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg bg-[#121316] border border-[#262930] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-[#262930] pb-3">
                    <div className="flex items-center gap-2.5 text-[#D4AF37]">
                      <Navigation className="w-5 h-5" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">
                            RUN Couriers &bull; Tracking #{trackingModalData.trackingNo}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(trackingModalData.trackingNo);
                              addToast('success', 'Copied', `Tracking #${trackingModalData.trackingNo} copied.`);
                            }}
                            className="p-1 rounded bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] border border-[#262930]"
                            title="Copy Tracking Number"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-[#8E929E]">
                          Order: <strong className="text-white">{trackingModalData.orderNumber}</strong> &bull; Merchant Code: <strong className="text-[#D4AF37] font-mono">1000003434</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenTrackingModal(trackingModalData.orderNumber, trackingModalData.trackingNo)}
                        disabled={trackingModalData.loading}
                        className="p-1.5 rounded-lg bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] border border-[#262930] transition-colors"
                        title="Refresh Tracking Status"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${trackingModalData.loading ? 'animate-spin text-[#D4AF37]' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrackingModalData(null)}
                        className="p-1.5 text-[#8E929E] hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0B0C0E] border border-[#D4AF37]/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#8E929E] block">Live Status</span>
                      <span className="text-sm font-bold text-[#D4AF37]">{trackingModalData.currentStatus}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Sync
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold block">
                      Consignment Milestone History
                    </span>

                    {trackingModalData.loading ? (
                      <div className="py-8 text-center text-xs text-[#8E929E] flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 text-[#D4AF37] animate-spin" />
                        <span>Connecting to portal.runcourier.com via Merchant Code 1000003434...</span>
                      </div>
                    ) : trackingModalData.history.length > 0 ? (
                      <div className="relative pl-6 space-y-4 border-l-2 border-[#D4AF37]/40 max-h-60 overflow-y-auto pr-2">
                        {trackingModalData.history.map((event, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#D4AF37] border-2 border-[#0B0C0E]" />
                            <p className="text-xs font-semibold text-white">{event.status}</p>
                            <p className="text-[10px] text-[#8E929E] font-mono mt-0.5">{event.created}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-center text-xs text-[#8E929E]">
                        Consignment registered under Client Code 1000003434. Awaiting rider pickup &amp; first hub scan.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#262930]">
                    <a
                      href="https://portal.runcourier.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#8E929E] hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>RUN Portal</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setTrackingModalData(null)}
                      className="py-2 px-5 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-white text-xs font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* TAB 3: PAYMENTS MODULE */}
          {activeTab === 'payments' && <AdminPaymentsTab />}

          {/* TAB 4: REFUNDS MODULE */}
          {activeTab === 'refunds' && <AdminRefundsTab />}

          {/* TAB 5: CUSTOMERS DIRECTORY */}
          {activeTab === 'customers' && <AdminCustomersTab />}

          {/* TAB 6: ANALYTICS & FUNNEL */}
          {activeTab === 'analytics' && <AdminAnalyticsTab />}

          {/* TAB 7: NOTIFICATIONS CENTER */}
          {activeTab === 'notifications' && (
            <AdminNotificationsTab onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* TAB: PROMOTIONS & DEALS */}
          {activeTab === 'promotions' && <AdminPromotionsTab />}

          {/* TAB 8: CONCIERGE INQUIRIES */}
          {activeTab === 'inquiries' && <AdminInquiriesTab />}

          {/* TAB 9: PRODUCT REVIEWS */}
          {activeTab === 'reviews' && <AdminReviewsTab />}

          {/* TAB 10: EMAIL RECEIPTS & DISPATCH */}
          {activeTab === 'emails' && <AdminEmailTab />}

          {/* TAB 11: SUPABASE CLOUD BACKEND */}
          {activeTab === 'supabase' && <AdminSupabaseTab />}

          {/* TAB 12: BUSINESS SETTINGS */}
          {activeTab === 'settings' && <AdminBusinessSettingsTab />}

          {/* Modal: Add/Edit Product */}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-2xl bg-[#121316] border border-[#262930] rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#262930] pb-4">
                  <h2 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
                    {editingProduct ? 'Edit Showroom Timepiece' : 'Add New Showroom SKU'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    aria-label="Close product editor"
                    className="p-1.5 text-[#8E929E] hover:text-[#F5F5F7]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="admin-product-name" className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        Product Name *
                      </label>
                      <input
                        id="admin-product-name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. STORIUM Chrono Apex"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-product-sku" className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        SKU Code *
                      </label>
                      <input
                        id="admin-product-sku"
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="STM-009"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-product-price" className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        Regular Price (PKR) *
                      </label>
                      <input
                        id="admin-product-price"
                        type="number"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-product-sale-price" className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        Sale Price (PKR, Optional)
                      </label>
                      <input
                        id="admin-product-sale-price"
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) =>
                          setFormData({ ...formData, salePrice: Number(e.target.value) })
                        }
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-product-category" className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        Category
                      </label>
                      <select
                        id="admin-product-category"
                        value={formData.category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setFormData({
                            ...formData,
                            category: newCat,
                            categoryName: newCat === 'watches' ? 'Watches' : 'Accessories',
                            subcategory: (newCat === 'accessories' || newCat === 'mens-accessories') ? (formData.subcategory || 'Wallet') : '',
                          });
                        }}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                      >
                        <option value="watches">Watches</option>
                        <option value="accessories">Accessories</option>
                      </select>
                    </div>

                    {(formData.category === 'accessories' || formData.category === 'mens-accessories') && (

                      <div>
                        <label htmlFor="admin-product-subcategory" className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                          Subcategory *
                        </label>
                        <select
                          id="admin-product-subcategory"
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
                      <label htmlFor="admin-product-stock" className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                        Stock Quantity *
                      </label>
                      <input
                        id="admin-product-stock"
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
                      <div className="flex items-center justify-between">
                        <label htmlFor="admin-product-media" className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                          Product Media (unlimited images & videos)
                        </label>
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          ⚡ Auto-Compression Active (WebP/JPEG)
                        </span>
                      </div>
                      <input
                        id="admin-product-media"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        disabled={isCompressingMedia}
                        onChange={handleMediaFilesSelected}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] disabled:opacity-50"
                      />
                      {isCompressingMedia ? (
                        <p className="mt-1 text-[11px] text-[#D4AF37] animate-pulse">
                          Compressing &amp; optimizing selected photos for maximum mobile speed...
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-[#626673]">
                          Select unlimited images and videos. Images are automatically compressed to optimal web dimensions so your store loads instantly on mobile.
                        </p>
                      )}

                      {/* Existing Media Display */}
                      {existingMedia.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-[11px] text-[#D4AF37] font-semibold">Current Product Media ({existingMedia.length}):</p>
                          <p className="text-[10px] text-[#626673]">The first item (marked “Cover”) is shown first on the public site. Reorder with “Set as first” or the arrows.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                            {existingMedia.map((media, index) => (
                              <div key={media.url} className={`relative group p-2 bg-[#181A1F] border rounded-lg ${index === 0 ? 'border-[#D4AF37]/60' : 'border-[#262930]'}`}>
                                {index === 0 && (
                                  <span className="absolute top-3 left-3 z-10 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[#D4AF37] text-[#0B0C0E] shadow-md">
                                    Cover
                                  </span>
                                )}
                                <div className="aspect-square rounded overflow-hidden bg-[#0B0C0E]">
                                  {media.type === 'video' ? (
                                    <video src={media.url} className="w-full h-full object-cover" muted />
                                  ) : (
                                    <img src={media.url} alt={media.name || `Media ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                  )}
                                </div>
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setExistingMedia(moveMediaToFront(existingMedia, index))}
                                      className="px-2 py-1 rounded-md bg-[#D4AF37] text-[#0B0C0E] text-[10px] font-semibold hover:bg-[#E5C378]"
                                      aria-label={`Show ${media.name || 'media'} first`}
                                      title="Show this first"
                                    >
                                      ⬆ First
                                    </button>
                                  )}
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setExistingMedia(moveMedia(existingMedia, index, -1))}
                                      className="p-1.5 rounded-md bg-[#181A1F] text-white border-white/10 hover:border-[#D4AF37]/50"
                                      aria-label="Move earlier"
                                      title="Move earlier"
                                    >
                                      ←
                                    </button>
                                  )}
                                  {index < existingMedia.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setExistingMedia(moveMedia(existingMedia, index, 1))}
                                      className="p-1.5 rounded-md bg-[#181A1F] text-white border-white/10 hover:border-[#D4AF37]/50"
                                      aria-label="Move later"
                                      title="Move later"
                                    >
                                      →
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setExistingMedia(existingMedia.filter((_, i) => i !== index))}
                                    className="p-2 rounded-full bg-rose-500 text-white hover:bg-rose-400"
                                    aria-label={`Remove ${media.name || 'media'}`}
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                                  <span className="truncate flex-1 text-[#F5F5F7]">{media.name || `Media ${index + 1}`}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${media.type === 'video' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#E5C378]/20 text-[#E5C378]'}`}>
                                    {media.type.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Files Ready to Upload */}
                      {mediaFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-[11px] text-[#D4AF37] font-semibold">New Files Ready to Upload ({mediaFiles.length}):</p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {mediaFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-[#181A1F] border rounded-lg text-[11px]">
                                <span className="w-6 text-center text-[#8E929E] font-mono">{index + 1}</span>
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                  {file.type.startsWith('video/') ? (
                                    <span className="text-[#D4AF37]">🎬</span>
                                  ) : (
                                    <span className="text-[#E5C378]">🖼️</span>
                                  )}
                                  <span className="truncate text-[#F5F5F7]">{file.name}</span>
                                  <span className="text-[#8E929E] font-mono">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                {index > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setMediaFiles(moveMediaToFront(mediaFiles, index))}
                                    className="px-2 py-1 rounded-md bg-[#D4AF37] text-[#0B0C0E] text-[10px] font-semibold hover:bg-[#E5C378]"
                                    aria-label={`Show ${file.name} first`}
                                    title="Show this first"
                                  >
                                    ⬆ First
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setMediaFiles(mediaFiles.filter((_, i) => i !== index))}
                                  className="text-rose-400 hover:text-rose-300 p-1"
                                  aria-label={`Remove ${file.name}`}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(existingMedia.length === 0 && mediaFiles.length === 0) && (
                        <p className="mt-2 text-[11px] text-[#626673]">No media uploaded yet. Add images or videos above.</p>
                      )}
                    </div>

                  <div>
                    <label htmlFor="admin-product-short-desc" className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                      Short Description
                    </label>
                    <input
                      id="admin-product-short-desc"
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-product-desc" className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                      Detailed Description
                    </label>
                    <textarea
                      id="admin-product-desc"
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
                        <label htmlFor="admin-product-movement" className="block text-[#8E929E] mb-1">Movement</label>
                        <input
                          id="admin-product-movement"
                          type="text"
                          value={formData.movement}
                          onChange={(e) => setFormData({ ...formData, movement: e.target.value })}
                          className="w-full py-2 px-3 rounded-lg bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-product-glass" className="block text-[#8E929E] mb-1">Glass</label>
                        <input
                          id="admin-product-glass"
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

          {/* STOREWIDE SHIPPING FEE EDIT MODAL */}
          <AnimatePresence>
            {isShippingModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-lg rounded-3xl bg-[#121316] border border-[#262930] p-6 sm:p-8 space-y-6 shadow-2xl relative"
                >
                  <div className="flex items-center justify-between border-b border-[#262930] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold font-serif-luxury text-[#F5F5F7]">
                          Storewide Shipping Fee
                        </h2>
                        <p className="text-xs text-[#8E929E]">
                          Edit delivery charges applied to all products nationwide.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsShippingModalOpen(false)}
                      className="p-1.5 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block uppercase tracking-wider text-[#CBD0DC] text-xs font-semibold mb-1.5">
                        Standard Delivery Flat Fee (PKR) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={shippingFlatInput}
                        onChange={(e) => setShippingFlatInput(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full py-3 px-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37] font-mono text-sm"
                        placeholder="e.g. 500 (or 0 for Free Delivery)"
                      />
                      <p className="text-[11px] text-[#8E929E] mt-1">
                        Applied to all products in cart. Set to <strong>0</strong> to activate nationwide free delivery on every order.
                      </p>
                    </div>

                    {/* Quick Presets for Flat Fee */}
                    <div>
                      <span className="block uppercase tracking-wider text-[#8E929E] text-[10px] font-semibold mb-1.5">
                        Quick Fee Presets
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setShippingFlatInput(0)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                            shippingFlatInput === 0
                              ? 'bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37] font-bold'
                              : 'bg-[#181A1F] text-[#CBD0DC] border-[#262930] hover:border-[#D4AF37]/50'
                          }`}
                        >
                          Free (Rs. 0)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingFlatInput(250)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                            shippingFlatInput === 250
                              ? 'bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37] font-bold'
                              : 'bg-[#181A1F] text-[#CBD0DC] border-[#262930] hover:border-[#D4AF37]/50'
                          }`}
                        >
                          Rs. 250
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingFlatInput(300)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                            shippingFlatInput === 300
                              ? 'bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37] font-bold'
                              : 'bg-[#181A1F] text-[#CBD0DC] border-[#262930] hover:border-[#D4AF37]/50'
                          }`}
                        >
                          Rs. 300
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingFlatInput(500)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                            shippingFlatInput === 500
                              ? 'bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37] font-bold'
                              : 'bg-[#181A1F] text-[#CBD0DC] border-[#262930] hover:border-[#D4AF37]/50'
                          }`}
                        >
                          Rs. 500
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block uppercase tracking-wider text-[#CBD0DC] text-xs font-semibold mb-1.5">
                        Free Delivery Threshold (PKR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={shippingFreeAboveInput}
                        onChange={(e) => setShippingFreeAboveInput(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full py-3 px-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37] font-mono text-sm"
                        placeholder="e.g. 15000 (0 to disable)"
                      />
                      <p className="text-[11px] text-[#8E929E] mt-1">
                        Orders equal to or above this subtotal receive automatic free delivery. Set to <strong>0</strong> to disable free threshold.
                      </p>
                    </div>

                    {/* Quick Presets for Free Threshold */}
                    <div>
                      <span className="block uppercase tracking-wider text-[#8E929E] text-[10px] font-semibold mb-1.5">
                        Threshold Presets
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setShippingFreeAboveInput(0)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all text-center cursor-pointer ${
                            shippingFreeAboveInput === 0
                              ? 'bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37] font-bold'
                              : 'bg-[#181A1F] text-[#CBD0DC] border-[#262930] hover:border-[#D4AF37]/50'
                          }`}
                        >
                          Disabled (0)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingFreeAboveInput(10000)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all text-center cursor-pointer ${
                            shippingFreeAboveInput === 10000
                              ? 'bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37] font-bold'
                              : 'bg-[#181A1F] text-[#CBD0DC] border-[#262930] hover:border-[#D4AF37]/50'
                          }`}
                        >
                          Above Rs. 10k
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingFreeAboveInput(15000)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all text-center cursor-pointer ${
                            shippingFreeAboveInput === 15000
                              ? 'bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37] font-bold'
                              : 'bg-[#181A1F] text-[#CBD0DC] border-[#262930] hover:border-[#D4AF37]/50'
                          }`}
                        >
                          Above Rs. 15k
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[11px] text-[#8E929E] flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">&#10003;</span>
                    <span>Instantly affects cart drawer, cart page, and checkout for all products across the website.</span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262930]">
                    <button
                      type="button"
                      onClick={() => setIsShippingModalOpen(false)}
                      className="py-2.5 px-4 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-xs text-[#CBD0DC] border border-[#262930] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStorewideShippingFee(shippingFlatInput, shippingFreeAboveInput);
                        setIsShippingModalOpen(false);
                      }}
                      className="py-2.5 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Save Storewide Fee</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Bottom Navigation Bar (Mobile-first PWA experience) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0C0E]/95 backdrop-blur-md border-t border-[#262930] px-2 py-1.5 flex items-center justify-around safe-bottom">
            <button
              type="button"
              onClick={() => {
                setActiveTab('overview');
                setIsMobileMoreOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                activeTab === 'overview' ? 'text-[#D4AF37]' : 'text-[#8E929E]'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('orders');
                setIsMobileMoreOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold relative transition-all ${
                activeTab === 'orders' ? 'text-[#D4AF37]' : 'text-[#8E929E]'
              }`}
            >
              <Truck className="w-5 h-5" />
              <span>Orders</span>
              {orders.length > 0 && (
                <span className="absolute top-0 right-1 px-1 py-0.2 rounded-full bg-[#D4AF37] text-[#0B0C0E] text-[8px] font-mono font-bold">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('products');
                setIsMobileMoreOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                activeTab === 'products' ? 'text-[#D4AF37]' : 'text-[#8E929E]'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Catalog</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('payments');
                setIsMobileMoreOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                activeTab === 'payments' ? 'text-[#D4AF37]' : 'text-[#8E929E]'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Payments</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMoreOpen((prev) => !prev)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-semibold relative transition-all ${
                isMobileMoreOpen ? 'text-[#D4AF37]' : 'text-[#8E929E]'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span>More</span>
              {unreadNotifsCount > 0 && (
                <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Mobile "More" Slide-up Sheet */}
          <AnimatePresence>
            {isMobileMoreOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
                onClick={() => setIsMobileMoreOpen(false)}
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-full bg-[#121316] border-t border-[#262930] rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-[#262930] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      <h3 className="font-bold font-serif-luxury text-sm text-[#F5F5F7]">
                        All Admin Modules
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsMobileMoreOpen(false)}
                      className="p-1 rounded-lg text-[#8E929E] hover:text-[#F5F5F7]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => {
                        setActiveTab('refunds');
                        setIsMobileMoreOpen(false);
                      }}
                      className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center gap-2.5 text-[#E8E8EC] font-semibold text-left"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-400" />
                      <span>Refunds</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('customers');
                        setIsMobileMoreOpen(false);
                      }}
                      className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center gap-2.5 text-[#E8E8EC] font-semibold text-left"
                    >
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      <span>Customers</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('analytics');
                        setIsMobileMoreOpen(false);
                      }}
                      className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center gap-2.5 text-[#E8E8EC] font-semibold text-left"
                    >
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span>Analytics</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('notifications');
                        setIsMobileMoreOpen(false);
                      }}
                      className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center justify-between text-[#E8E8EC] font-semibold text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-emerald-400" />
                        <span>Alerts</span>
                      </div>
                      {unreadNotifsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#D4AF37] text-[#0B0C0E] text-[9px] font-mono font-bold">
                          {unreadNotifsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('promotions');
                        setIsMobileMoreOpen(false);
                      }}
                      className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center gap-2.5 text-[#E8E8EC] font-semibold text-left"
                    >
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>Promotions</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('inquiries');
                        setIsMobileMoreOpen(false);
                      }}
                      className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center gap-2.5 text-[#E8E8EC] font-semibold text-left"
                    >
                      <MessageSquare className="w-4 h-4 text-sky-400" />
                      <span>Inquiries</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('reviews');
                        setIsMobileMoreOpen(false);
                      }}
                      className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center gap-2.5 text-[#E8E8EC] font-semibold text-left"
                    >
                      <Star className="w-4 h-4 text-amber-400" />
                      <span>Reviews</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('emails');
                        setIsMobileMoreOpen(false);
                      }}
                      className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center gap-2.5 text-[#E8E8EC] font-semibold text-left"
                    >
                      <Mail className="w-4 h-4 text-[#D4AF37]" />
                      <span>Email Receipts</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('supabase');
                        setIsMobileMoreOpen(false);
                      }}
                      className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center gap-2.5 text-[#E8E8EC] font-semibold text-left"
                    >
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Cloud DB</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsMobileMoreOpen(false);
                      }}
                      className="col-span-2 p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center gap-2.5 text-[#E8E8EC] font-semibold text-left"
                    >
                      <Settings2 className="w-4 h-4 text-[#D4AF37]" />
                      <span>Business &amp; Policy Settings</span>
                    </button>
                  </div>

                  {canInstallPwa && !isInstalled && (
                    <button
                      onClick={() => {
                        promptPwaInstall();
                        setIsMobileMoreOpen(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#0B0C0E] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install Storium Admin App</span>
                    </button>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AdminAuthGate>
  );
};
