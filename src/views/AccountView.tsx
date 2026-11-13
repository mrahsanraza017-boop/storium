import React, { useEffect, useState, useMemo } from 'react';
import {
  User,
  Package,
  Heart,
  MapPin,
  ShieldCheck,
  Truck,
  Edit2,
  Save,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  Clock,
  Building2,
  Loader2,
  Star,
  Camera,
  X,
  Sparkles,
  MessageSquareQuote,
  Plus,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CustomerAuthPanel } from '../components/account/CustomerAuthPanel';
import { trackRunCourier, CourierTrackingResult } from '../services/courierService';
import { StarRating } from '../components/reviews/StarRating';
import { uploadReviewImage } from '../services/supabaseService';

export const AccountView: React.FC = () => {
  const {
    currentUser,
    orders,
    wishlist,
    products,
    reviews,
    getCustomerReviews,
    submitReview,
    updateUserProfile,
    removeFromWishlist,
    addToCart,
    navigate,
    addToast,
    logoutUser,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'reviews' | 'profile' | 'addresses'>('orders');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    city: currentUser?.city || '',
  });

  useEffect(() => {
    if (!currentUser) return;
    setProfileForm({
      fullName: currentUser.fullName,
      email: currentUser.email,
      phone: currentUser.phone,
      address: currentUser.address,
      city: currentUser.city,
    });
  }, [currentUser]);

  // Live Delivery Tracking state (100% white-labeled as STORIUM Express Logistics)
  const [expandedTracking, setExpandedTracking] = useState<Record<string, boolean>>({});
  const [trackingData, setTrackingData] = useState<Record<string, CourierTrackingResult>>({});
  const [loadingTracking, setLoadingTracking] = useState<Record<string, boolean>>({});

  const handleToggleTracking = async (orderId: string, trackingNumber?: string) => {
    const isCurrentlyOpen = !!expandedTracking[orderId];
    setExpandedTracking((prev) => ({ ...prev, [orderId]: !isCurrentlyOpen }));

    if (!isCurrentlyOpen && trackingNumber && !trackingData[orderId]) {
      setLoadingTracking((prev) => ({ ...prev, [orderId]: true }));
      try {
        const result = await trackRunCourier(trackingNumber);
        setTrackingData((prev) => ({ ...prev, [orderId]: result }));
      } catch (err) {
        console.warn('Courier tracking lookup notice:', err);
      } finally {
        setLoadingTracking((prev) => ({ ...prev, [orderId]: false }));
      }
    }
  };

  const handleRefreshTracking = async (orderId: string, trackingNumber?: string) => {
    if (!trackingNumber) return;
    setLoadingTracking((prev) => ({ ...prev, [orderId]: true }));
    try {
      const result = await trackRunCourier(trackingNumber);
      setTrackingData((prev) => ({ ...prev, [orderId]: result }));
      addToast('info', 'Tracking Updated', 'Latest delivery status refreshed.');
    } catch {
      addToast('error', 'Update Failed', 'Could not refresh tracking at this time.');
    } finally {
      setLoadingTracking((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  if (!currentUser) return <CustomerAuthPanel />;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileForm);
    setIsEditingProfile(false);
    addToast('success', 'Profile Updated', 'Your customer credentials have been securely saved.');
  };

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  // Unique purchased products list from customer orders
  const purchasedProducts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; thumbnail?: string }>();
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!map.has(item.productId)) {
          map.set(item.productId, {
            id: item.productId,
            name: item.productName,
            thumbnail: item.productThumbnail,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [orders]);

  // Customer's personal submitted reviews
  const customerReviews = useMemo(() => {
    if (getCustomerReviews) {
      return getCustomerReviews(currentUser?.id);
    }
    return reviews.filter(
      (r) =>
        r.userId === currentUser?.id ||
        r.reviewerName?.toLowerCase() === currentUser?.fullName?.toLowerCase()
    );
  }, [getCustomerReviews, reviews, currentUser]);

  // Review submission modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewModalType, setReviewModalType] = useState<'store' | 'product'>('store');
  const [selectedProductId, setSelectedProductId] = useState<string>('store');
  const [reviewRating, setReviewRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewCity, setReviewCity] = useState(currentUser?.city || 'Pakistan');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isUploadingReviewImages, setIsUploadingReviewImages] = useState(false);
  const [activePhotoLightbox, setActivePhotoLightbox] = useState<string | null>(null);

  const handleOpenReviewModal = (type: 'store' | 'product', prodId?: string) => {
    setReviewModalType(type);
    if (type === 'store') {
      setSelectedProductId('store');
      setReviewTitle('Exquisite Showroom Experience & Timepiece');
    } else {
      setSelectedProductId(prodId || (purchasedProducts[0]?.id || products[0]?.id || ''));
      setReviewTitle('');
    }
    setReviewRating(5);
    setReviewBody('');
    setReviewCity(currentUser?.city || 'Pakistan');
    setReviewImages([]);
    setIsReviewModalOpen(true);
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (reviewImages.length + files.length > 4) {
      addToast('error', 'Limit Reached', 'You can attach up to 4 photos per review.');
      return;
    }

    setIsUploadingReviewImages(true);
    try {
      const promises = Array.from(files).map((f) => uploadReviewImage(f));
      const urls = await Promise.all(promises);
      setReviewImages((prev) => [...prev, ...urls].slice(0, 4));
      addToast('success', 'Photos Attached', `${files.length} photo(s) added.`);
    } catch (err: any) {
      addToast('error', 'Photo Processing Failed', err.message || 'Could not upload photo.');
    } finally {
      setIsUploadingReviewImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveReviewPhoto = (index: number) => {
    setReviewImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewBody.trim()) {
      addToast('error', 'Missing Information', 'Please provide a title and your review details.');
      return;
    }

    const res = submitReview({
      productId: reviewModalType === 'store' ? 'store' : selectedProductId,
      reviewType: reviewModalType,
      rating: reviewRating,
      title: reviewTitle.trim(),
      body: reviewBody.trim(),
      city: reviewCity.trim(),
      images: reviewImages,
    });

    if (res.success) {
      setIsReviewModalOpen(false);
      setActiveTab('reviews');
    }
  };

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8 border-b border-[#262930] mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#121316] border border-[#262930] flex items-center justify-center text-[#D4AF37] font-serif-luxury text-xl font-bold shadow-lg">
              {profileForm.fullName.charAt(0)}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
                STORIUM Client Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
                {profileForm.fullName}
              </h1>
              <span className="text-xs text-[#8E929E] font-mono">{profileForm.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-[#181A1F] border border-[#262930] text-xs text-[#E5C378] font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Verified Patron</span>
            </span>
            <button type="button" onClick={logoutUser} className="text-xs text-[#8E929E] hover:text-[#D4AF37]">Sign Out</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-3 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'orders'
              ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
              : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
          >
            <Package className={`w-4 h-4 ${activeTab === 'orders' ? 'text-[#0B0C0E]' : 'text-[#D4AF37]'}`} />
            <span>Showroom Orders</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${activeTab === 'orders' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
            }`}
          >
            <Star className={`w-4 h-4 ${activeTab === 'reviews' ? 'text-[#0B0C0E] fill-[#0B0C0E]' : 'text-[#D4AF37]'}`} />
            <span>My Reviews &amp; Feedback</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                activeTab === 'reviews' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
              }`}
            >
              {customerReviews.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'wishlist'
              ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
              : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'wishlist' ? 'text-[#0B0C0E]' : 'text-[#D4AF37]'}`} />
            <span>Private Wishlist</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${activeTab === 'wishlist' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                }`}
            >
              {wishlist.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'profile'
              ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
              : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-[#0B0C0E]' : 'text-[#D4AF37]'}`} />
            <span>Patron Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'addresses'
              ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
              : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
              }`}
          >
            <MapPin className={`w-4 h-4 ${activeTab === 'addresses' ? 'text-[#0B0C0E]' : 'text-[#D4AF37]'}`} />
            <span>Delivery Addresses</span>
          </button>
        </div>

        {/* Tab 1: Orders History */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="py-16 text-center bg-[#121316] border border-[#262930] rounded-2xl p-8 space-y-4">
                <Package className="w-12 h-12 text-[#3A3E48] mx-auto" />
                <h2 className="text-base font-bold text-[#F5F5F7]">No Orders Recorded Yet</h2>
                <p className="text-xs text-[#8E929E] max-w-sm mx-auto">
                  When you acquire timepieces through our showroom, your tracking codes and order histories will appear here.
                </p>
                <button
                  onClick={() => navigate('watches')}
                  className="py-2.5 px-6 rounded-xl bg-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider"
                >
                  Explore Timepieces
                </button>
              </div>
            ) : (
              orders.map((order) => {
                const getStatusColor = (st: string) => {
                  switch (st) {
                    case 'Delivered':
                      return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
                    case 'Shipped':
                      return 'bg-sky-950/60 text-sky-400 border-sky-500/30';
                    case 'Processing':
                      return 'bg-amber-950/60 text-amber-400 border-amber-500/30';
                    default:
                      return 'bg-zinc-800/80 text-zinc-300 border-zinc-700';
                  }
                };

                return (
                  <div
                    key={order.id}
                    className="p-6 rounded-2xl bg-[#121316] border border-[#262930] shadow-lg space-y-5"
                  >
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262930] pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-[#D4AF37]">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusColor(
                              order.orderStatus
                            )}`}
                          >
                            {order.orderStatus}
                          </span>
                        </div>
                        <span className="text-xs text-[#8E929E] mt-1 block">
                          Placed on {new Date(order.date).toLocaleDateString('en-PK', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[#8E929E] block">Total Amount</span>
                        <span className="text-base font-bold text-[#F5F5F7]">
                          Rs. {order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center justify-between gap-3.5"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={item.productThumbnail}
                              alt={item.productName}
                              className="w-14 h-14 rounded-lg object-cover bg-[#121316] flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] uppercase font-mono text-[#D4AF37] block">
                                {item.sku}
                              </span>
                              <h3 className="text-xs font-semibold text-[#F5F5F7] truncate">
                                {item.productName}
                              </h3>
                              <span className="text-[11px] text-[#8E929E]">
                                Qty: {item.quantity} &bull; Rs. {item.price.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal('product', item.productId)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181A1F] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#0B0C0E] border border-[#D4AF37]/30 text-[10px] font-bold cursor-pointer transition-colors shadow-sm flex-shrink-0"
                            title="Review this piece with pictures"
                          >
                            <Star className="w-3 h-3 fill-current" />
                            <span>Review</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Order Tracking & White-Labeled Pakistan Delivery Section */}
                    {(() => {
                      const isExpanded = Boolean(expandedTracking[order.id]);
                      const isLoading = Boolean(loadingTracking[order.id]);
                      const tracking = trackingData[order.id];
                      const currentStatusText = tracking?.current_status || order.orderStatus || 'Dispatched';
                      const isDelivered = order.orderStatus === 'Delivered' || /delivered/i.test(currentStatusText);
                      const isOutForDelivery = /out for delivery|with courier/i.test(currentStatusText);
                      const isInTransit = /transit|departed|hub|arrived/i.test(currentStatusText) || order.orderStatus === 'Shipped';

                      return (
                        <div className="pt-3 border-t border-[#262930] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#8E929E]">
                            <div className="flex flex-wrap items-center gap-2">
                              <Truck className="w-4 h-4 text-[#D4AF37]" />
                              <span>Tracking:</span>
                              <span className="font-mono text-[#F5F5F7] font-semibold select-all">
                                {order.trackingNumber}
                              </span>
                              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#E5C378] border border-[#D4AF37]/30 font-medium tracking-wide">
                                STORIUM Express Logistics
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#181A1F] text-[#CBD0DC] border border-[#262930]">
                                Hub: Renala Khurd
                              </span>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                              <span className="text-xs text-[#8E929E] hidden md:inline">
                                To: <strong className="text-[#F5F5F7]">{order.customer.city}, Pakistan</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleTracking(order.id, order.trackingNumber)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-[11px] font-bold cursor-pointer transition-colors shadow-sm"
                              >
                                <span>{isExpanded ? 'Hide Live Delivery' : 'Live Delivery Status'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Live Tracking Drawer */}
                          {isExpanded && (
                            <div className="p-4 sm:p-5 rounded-xl bg-[#090B10] border border-[#D4AF37]/30 space-y-5 animate-in fade-in duration-200">
                              {/* Route and Carrier Header */}
                              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#262930]">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                                      STORIUM Express Logistics
                                    </span>
                                  </div>
                                  <p className="text-sm font-semibold text-[#F5F5F7]">
                                    Current Status: <span className="text-[#E5C378]">{currentStatusText}</span>
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#8E929E] pt-1">
                                    <span className="flex items-center gap-1">
                                      <Building2 className="w-3 h-3 text-[#D4AF37]" />
                                      Origin: <strong className="text-[#CBD0DC]">Anwar Shahid Colony Renala Khurd, Okara, Punjab</strong>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-emerald-400" />
                                      Destination: <strong className="text-[#CBD0DC]">{order.customer.city}, Pakistan</strong>
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRefreshTracking(order.id, order.trackingNumber)}
                                  disabled={isLoading}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181A1F] hover:bg-[#22252C] text-[#CBD0DC] hover:text-[#F5F5F7] border border-[#262930] text-[11px] cursor-pointer transition-colors"
                                  title="Refresh tracking status"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
                                  <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
                                </button>
                              </div>

                              {/* 4-Step Milestone Progress Bar */}
                              <div className="py-2">
                                <div className="grid grid-cols-4 gap-2 text-center relative">
                                  {/* Progress connecting lines */}
                                  <div className="absolute top-3.5 left-[12%] right-[12%] h-0.5 bg-[#1F232B] -z-0">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#D4AF37] to-emerald-400 transition-all duration-500"
                                      style={{
                                        width: isDelivered
                                          ? '100%'
                                          : isOutForDelivery
                                          ? '75%'
                                          : isInTransit
                                          ? '50%'
                                          : '25%',
                                      }}
                                    />
                                  </div>

                                  {/* Step 1: Confirmed */}
                                  <div className="flex flex-col items-center space-y-1.5 relative z-10">
                                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                    </div>
                                    <span className="text-[10px] font-bold text-[#F5F5F7] uppercase tracking-wider">
                                      Confirmed
                                    </span>
                                    <span className="text-[9px] text-[#8E929E]">Renala Khurd</span>
                                  </div>

                                  {/* Step 2: Dispatched */}
                                  <div className="flex flex-col items-center space-y-1.5 relative z-10">
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                                        isInTransit || isOutForDelivery || isDelivered
                                          ? 'bg-[#D4AF37] text-black font-bold'
                                          : 'bg-[#181A1F] border border-[#3A3E48] text-[#8E929E]'
                                      }`}
                                    >
                                      <Truck className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-[#F5F5F7] uppercase tracking-wider">
                                      Dispatched
                                    </span>
                                    <span className="text-[9px] text-[#8E929E]">Showroom Hub</span>
                                  </div>

                                  {/* Step 3: In Transit */}
                                  <div className="flex flex-col items-center space-y-1.5 relative z-10">
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                                        isOutForDelivery || isDelivered
                                          ? 'bg-emerald-500 text-black'
                                          : isInTransit
                                          ? 'bg-[#D4AF37] text-black font-bold animate-pulse'
                                          : 'bg-[#181A1F] border border-[#3A3E48] text-[#8E929E]'
                                      }`}
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-[#F5F5F7] uppercase tracking-wider">
                                      In Transit
                                    </span>
                                    <span className="text-[9px] text-[#8E929E]">Regional Line</span>
                                  </div>

                                  {/* Step 4: Delivered */}
                                  <div className="flex flex-col items-center space-y-1.5 relative z-10">
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                                        isDelivered
                                          ? 'bg-emerald-500 text-black'
                                          : 'bg-[#181A1F] border border-[#3A3E48] text-[#8E929E]'
                                      }`}
                                    >
                                      <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-bold text-[#F5F5F7] uppercase tracking-wider">
                                      Delivered
                                    </span>
                                    <span className="text-[9px] text-[#8E929E]">{order.customer.city}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Live Milestone Events Timeline */}
                              <div className="space-y-2 pt-2 border-t border-[#262930]">
                                <span className="text-[10px] uppercase tracking-widest text-[#8E929E] font-bold block">
                                  Delivery Log & Events
                                </span>

                                {isLoading && !tracking ? (
                                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#CBD0DC]">
                                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                                    <span>Retrieving real-time dispatch log...</span>
                                  </div>
                                ) : tracking?.history && tracking.history.length > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {tracking.history.map((event, idx) => (
                                      <div
                                        key={idx}
                                        className="p-2.5 rounded-lg bg-[#121316] border border-[#262930] flex items-start justify-between gap-3 text-xs"
                                      >
                                        <div className="flex items-start gap-2.5">
                                          <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 flex-shrink-0" />
                                          <div>
                                            <span className="font-medium text-[#F5F5F7] block">
                                              {event.status}
                                            </span>
                                            {event.location && (
                                              <span className="text-[11px] text-[#8E929E]">
                                                Location: {event.location}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-[10px] text-[#8E929E] font-mono whitespace-nowrap">
                                          {event.created}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-3 rounded-lg bg-[#121316] border border-[#262930] text-xs text-[#CBD0DC] flex items-center justify-between">
                                    <span>Consignment registered at Anwar Shahid Colony Renala Khurd fulfillment center. Tracking updates will stream as the courier scans each station.</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Wishlist */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlistProducts.length === 0 ? (
              <div className="py-16 text-center bg-[#121316] border border-[#262930] rounded-2xl p-8 space-y-4">
                <Heart className="w-12 h-12 text-[#3A3E48] mx-auto" />
                <h2 className="text-base font-bold text-[#F5F5F7]">Your Wishlist is Empty</h2>
                <p className="text-xs text-[#8E929E] max-w-sm mx-auto">
                  Click the heart icon on any timepiece to reserve it in your private showroom shortlist.
                </p>
                <button
                  onClick={() => navigate('watches')}
                  className="py-2.5 px-6 rounded-xl bg-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider"
                >
                  Explore Showroom
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistProducts.map((p) => {
                  const price = p.salePrice ?? p.price;
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-[#121316] border border-[#262930] flex flex-col justify-between space-y-4 group"
                    >
                      <div
                        onClick={() => navigate('product', { slug: p.slug })}
                        className="cursor-pointer space-y-3"
                      >
                        <div className="aspect-square rounded-xl overflow-hidden bg-[#0B0C0E]">
                          <img
                            src={p.thumbnail}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-[#D4AF37]">
                            {p.sku}
                          </span>
                          <h3 className="text-sm font-semibold text-[#F5F5F7] line-clamp-1">
                            {p.name}
                          </h3>
                          <p className="text-sm font-bold text-[#D4AF37] mt-1">
                            Rs. {price.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-[#262930]">
                        <button
                          type="button"
                          onClick={() => addToCart(p, 1)}
                          className="flex-1 py-2 px-3 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                          Add to Bag
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(p.id)}
                          className="p-2 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-rose-400 border border-[#262930]"
                          title="Remove from wishlist"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reviews & Feedback */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Quick Action Banner */}
            <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                    Collector Reflections &amp; Wrist Shots
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
                  Your Reviews &amp; Feedback
                </h2>
                <p className="text-xs text-[#8E929E]">
                  Share your timepiece photos, unboxing impressions, or rate your overall STORIUM showroom experience.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenReviewModal('store')}
                  className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rate Showroom (Store Review)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenReviewModal('product')}
                  className="px-4 py-2.5 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Review a Timepiece</span>
                </button>
              </div>
            </div>

            {/* Reviews List */}
            {customerReviews.length === 0 ? (
              <div className="py-16 text-center bg-[#121316] border border-[#262930] rounded-2xl p-8 space-y-4">
                <MessageSquareQuote className="w-12 h-12 text-[#3A3E48] mx-auto opacity-70" />
                <h3 className="text-base font-bold text-[#F5F5F7]">No Reviews Submitted Yet</h3>
                <p className="text-xs text-[#8E929E] max-w-md mx-auto">
                  Be the first to share your wrist-shot photos and impressions. Your store reviews appear directly on the STORIUM homepage!
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReviewModal('store')}
                    className="py-2.5 px-5 rounded-xl bg-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Write Showroom Review
                  </button>
                  {purchasedProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenReviewModal('product', purchasedProducts[0].id)}
                      className="py-2.5 px-5 rounded-xl bg-[#181A1F] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold cursor-pointer"
                    >
                      Review Purchased Watch
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerReviews.map((rev) => {
                  const isStore = rev.reviewType === 'store' || rev.productId === 'store';
                  const prod = !isStore ? products.find((p) => p.id === rev.productId) : null;

                  return (
                    <article
                      key={rev.id}
                      className="p-5 sm:p-6 rounded-2xl bg-[#121316] border border-[#262930] flex flex-col justify-between space-y-4 shadow-lg hover:border-[#D4AF37]/40 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              {isStore ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#E5C378] text-[10px] font-semibold">
                                  <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                                  STORIUM Store Review (Homepage)
                                </span>
                              ) : prod ? (
                                <span className="text-[11px] font-semibold text-[#D4AF37]">
                                  {prod.name}
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-[#CBD0DC]">
                                  Timepiece Review
                                </span>
                              )}
                            </div>
                            <StarRating value={rev.rating} size="sm" />
                          </div>

                          {/* Approval Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              rev.status === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : rev.status === 'hidden'
                                ? 'bg-[#181A1F] text-[#8E929E] border-[#262930]'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {rev.status === 'approved' ? '✓ Approved & Live' : rev.status === 'hidden' ? 'Hidden' : 'Pending Moderation'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-[#F5F5F7]">{rev.title}</h4>
                          <p className="text-xs text-[#CBD0DC] leading-relaxed mt-1">
                            {rev.body}
                          </p>
                        </div>

                        {/* Photos */}
                        {rev.images && rev.images.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-2">
                            {rev.images.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setActivePhotoLightbox(img)}
                                className="w-14 h-14 rounded-xl overflow-hidden border border-[#262930] hover:border-[#D4AF37] transition-all bg-[#0B0C0E] cursor-pointer"
                                title="Click to enlarge"
                              >
                                <img src={img} alt="Review attachment" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#262930]/60 flex items-center justify-between text-[11px] text-[#8E929E]">
                        <span>
                          {new Date(rev.createdAt).toLocaleDateString('en-PK', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {isStore ? (
                          <span className="text-[10px] text-[#D4AF37] font-medium">Showcase on Homepage</span>
                        ) : prod ? (
                          <button
                            type="button"
                            onClick={() => navigate('product', { slug: prod.slug })}
                            className="text-[10px] text-[#D4AF37] hover:underline"
                          >
                            View on Product Page &rarr;
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-[#121316] border border-[#262930] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#262930] pb-4">
              <h2 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
                Patron Credentials
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label htmlFor="profile-full-name" className="block text-[#8E929E] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  id="profile-full-name"
                  type="text"
                  disabled={!isEditingProfile}
                  value={profileForm.fullName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, fullName: e.target.value })
                  }
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] disabled:opacity-70"
                />
              </div>

              <div>
                <label htmlFor="profile-email" className="block text-[#8E929E] uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  disabled
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] disabled:opacity-70"
                />
              </div>

              <div>
                <label htmlFor="profile-phone" className="block text-[#8E929E] uppercase tracking-wider mb-1">
                  Contact Phone (Pakistan)
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  disabled={!isEditingProfile}
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] disabled:opacity-70"
                />
              </div>

              {isEditingProfile && (
                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              )}
            </form>
          </div>
        )}

        {/* Tab 5: Delivery Addresses */}
        {activeTab === 'addresses' && (
          <div className="max-w-2xl bg-[#121316] border border-[#262930] rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
              Primary Pakistan Shipping Destination
            </h2>
            <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#262930] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F5F5F7] text-sm">
                  {profileForm.fullName}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-mono text-[10px]">
                  Default Destination
                </span>
              </div>
              <p className="text-[#8E929E]">{profileForm.address}</p>
              <p className="text-[#8E929E]">{profileForm.city}, Pakistan</p>
              <p className="text-[#8E929E] font-mono">{profileForm.phone}</p>
            </div>
          </div>
        )}

        {/* Review Submission Modal with Picture Uploads */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#121316] border border-[#262930] rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#262930] pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block">
                    Showroom Patron Feedback
                  </span>
                  <h3 className="font-bold font-serif-luxury text-[#F5F5F7] text-base">
                    {reviewModalType === 'store' ? 'Showroom & Store Review' : 'Timepiece Review'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="text-[#8E929E] hover:text-[#F5F5F7] text-sm p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Review Type Selector Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0C0E] border border-[#262930] rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setReviewModalType('store');
                    setSelectedProductId('store');
                    setReviewTitle('Exquisite Showroom Experience & Service');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reviewModalType === 'store'
                      ? 'bg-[#D4AF37] text-[#0B0C0E] font-bold shadow-md'
                      : 'text-[#8E929E] hover:text-[#F5F5F7]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Store Review (Homepage)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReviewModalType('product');
                    if (selectedProductId === 'store') {
                      setSelectedProductId(purchasedProducts[0]?.id || products[0]?.id || '');
                      setReviewTitle('');
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    reviewModalType === 'product'
                      ? 'bg-[#D4AF37] text-[#0B0C0E] font-bold shadow-md'
                      : 'text-[#8E929E] hover:text-[#F5F5F7]'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Product Review</span>
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                {/* Product Picker if product review */}
                {reviewModalType === 'product' && (
                  <div className="space-y-1.5">
                    <label className="text-[#8E929E] block uppercase font-semibold text-[10px] tracking-wider">
                      Select Timepiece to Review *
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                    >
                      {purchasedProducts.length > 0 && (
                        <optgroup label="From Your Purchased Orders">
                          {purchasedProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              ✓ Purchased: {p.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Showroom Collection">
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                )}

                {reviewModalType === 'store' && (
                  <div className="p-3 rounded-xl bg-[#0B0C0E] border border-[#D4AF37]/30 text-xs text-[#CBD0DC] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                    <span>
                      This review will be published on the <strong>STORIUM Homepage</strong> under client reflections.
                    </span>
                  </div>
                )}

                {/* Star Rating */}
                <div className="space-y-1.5">
                  <label className="text-[#8E929E] block uppercase font-semibold text-[10px] tracking-wider">
                    Overall Rating *
                  </label>
                  <StarRating value={reviewRating} onChange={setReviewRating} readOnly={false} size="lg" />
                </div>

                {/* Title / Headline */}
                <div className="space-y-1.5">
                  <label className="text-[#8E929E] block uppercase font-semibold text-[10px] tracking-wider">
                    Review Headline / Title *
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    required
                    maxLength={80}
                    placeholder={
                      reviewModalType === 'store'
                        ? 'e.g. Flawless concierge service & express packaging'
                        : 'e.g. Masterpiece on wrist, pristine finishing'
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[#8E929E] block uppercase font-semibold text-[10px] tracking-wider">
                    Your Review &amp; Experience *
                  </label>
                  <textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    required
                    rows={4}
                    maxLength={800}
                    placeholder={
                      reviewModalType === 'store'
                        ? 'Share details about delivery speed, packaging quality, showroom communication, and authenticity...'
                        : 'Describe dial details, bezel action, strap comfort, movement accuracy, and overall presence on wrist...'
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Photos Upload with Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[#8E929E] block uppercase font-semibold text-[10px] tracking-wider">
                      Add Photos (Wrist-shots, Unboxing, Packaging)
                    </label>
                    <span className="text-[10px] text-[#8E929E] font-mono">{reviewImages.length}/4 photos</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {reviewImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D4AF37]/50 bg-[#0B0C0E]">
                        <img src={imgUrl} alt="Review attachment" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveReviewPhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/80 text-white rounded-full hover:bg-rose-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {reviewImages.length < 4 && (
                      <label className="w-16 h-16 rounded-xl border border-dashed border-[#3A3E48] hover:border-[#D4AF37] flex flex-col items-center justify-center text-[#8E929E] hover:text-[#D4AF37] cursor-pointer transition-colors bg-[#0B0C0E]">
                        {isUploadingReviewImages ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                        ) : (
                          <>
                            <Camera className="w-4 h-4" />
                            <span className="text-[9px] mt-0.5 font-medium">+ Add Photo</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={isUploadingReviewImages}
                          onChange={handleReviewImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-[#626673]">
                    Photos will appear directly on the {reviewModalType === 'store' ? 'homepage' : 'product page'} along with your review.
                  </p>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-[#8E929E] block uppercase font-semibold text-[10px] tracking-wider">
                    City (optional)
                  </label>
                  <input
                    type="text"
                    value={reviewCity}
                    onChange={(e) => setReviewCity(e.target.value)}
                    placeholder="e.g. Lahore, Karachi, Islamabad, Okara"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isUploadingReviewImages}
                    className="flex-1 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    Submit Review with Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="py-3 px-5 rounded-xl bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Full Resolution Photo Lightbox Modal */}
        {activePhotoLightbox && (
          <div
            onClick={() => setActivePhotoLightbox(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="relative max-w-2xl max-h-[85vh]">
              <img
                src={activePhotoLightbox}
                alt="Customer photo enlarged"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-[#262930] shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setActivePhotoLightbox(null)}
                className="absolute -top-3 -right-3 p-2 bg-[#121316] text-[#CBD0DC] hover:text-white rounded-full border border-[#262930] shadow-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
