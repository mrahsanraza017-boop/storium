import React, { useEffect, useState } from 'react';
import {
  User,
  Package,
  Heart,
  MapPin,
  ShieldCheck,
  Truck,
  Edit2,
  Save,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CustomerAuthPanel } from '../components/account/CustomerAuthPanel';

export const AccountView: React.FC = () => {
  const {
    currentUser,
    orders,
    wishlist,
    products,
    updateUserProfile,
    removeFromWishlist,
    addToCart,
    navigate,
    addToast,
    logoutUser,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile' | 'addresses'>('orders');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser?.fullName || 'Hamza Tariq',
    email: currentUser?.email || 'hamza.tariq@example.pk',
    phone: currentUser?.phone || '+92 300 8459201',
    address: currentUser?.address || 'House 42, Sector Y, Phase 5, DHA',
    city: currentUser?.city || 'Lahore',
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

  if (!currentUser) return <CustomerAuthPanel />;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileForm);
    setIsEditingProfile(false);
    addToast('success', 'Profile Updated', 'Your customer credentials have been securely saved.');
  };

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

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
                          className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center gap-3.5"
                        >
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
                      ))}
                    </div>

                    {/* Order Tracking & Pakistan Courier Footer */}
                    <div className="pt-3 border-t border-[#262930] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#8E929E]">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#D4AF37]" />
                        <span>Tracking:</span>
                        <span className="font-mono text-[#F5F5F7] font-semibold">
                          {order.trackingNumber}
                        </span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#181A1F] text-[#8E929E]">
                          TCS Express Pakistan
                        </span>
                      </div>

                      <div className="text-xs text-[#8E929E]">
                        Delivering to: <span className="text-[#F5F5F7]">{order.customer.city}, Pakistan</span>
                      </div>
                    </div>
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

        {/* Tab 3: Profile */}
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

        {/* Tab 4: Delivery Addresses */}
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
      </div>
    </div>
  );
};
