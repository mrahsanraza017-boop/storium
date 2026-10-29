import React, { useState, useMemo } from 'react';
import { Sparkles, ShoppingBag, Check, ArrowRight, Star, Shield, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, WatchBundleDeal } from '../../types';

interface WatchDealsSectionProps {
  className?: string;
  maxDeals?: number;
}

export const WatchDealsSection: React.FC<WatchDealsSectionProps> = ({
  className = '',
  maxDeals,
}) => {
  const { products, businessSettings, addWatchBundleToCart, navigate } = useStore();

  const dealsConfig = businessSettings.promotions?.watchDeals || [];
  const activeDeals = dealsConfig.filter((d) => d.active);

  // Available showroom watches
  const watchProducts = useMemo(() => {
    return products.filter((p) => p.category === 'watches' && p.stockQuantity > 0);
  }, [products]);

  const [activeDealId, setActiveDealId] = useState<string>(() => {
    return activeDeals[0]?.id || 'deal-executive-duo';
  });

  const selectedDeal: WatchBundleDeal | undefined = useMemo(() => {
    return activeDeals.find((d) => d.id === activeDealId) || activeDeals[0];
  }, [activeDeals, activeDealId]);

  // Selected watch IDs in the bundle slots
  const [selectedSlotWatches, setSelectedSlotWatches] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    if (watchProducts.length > 0) {
      initial[0] = watchProducts[0]?.id || '';
      initial[1] = watchProducts[1]?.id || watchProducts[0]?.id || '';
      initial[2] = watchProducts[2]?.id || watchProducts[0]?.id || '';
    }
    return initial;
  });

  // Selected variants
  const [selectedVariants, setSelectedVariants] = useState<Record<string, Record<string, string>>>({});

  if (activeDeals.length === 0 || watchProducts.length < 2) {
    return null;
  }

  const slotCount = selectedDeal?.requiredCount || 2;

  // Selected products for current bundle
  const currentBundleProducts: Product[] = [];
  for (let i = 0; i < slotCount; i++) {
    const prodId = selectedSlotWatches[i] || watchProducts[i % watchProducts.length]?.id;
    const prod = watchProducts.find((p) => p.id === prodId) || watchProducts[0];
    if (prod) currentBundleProducts.push(prod);
  }

  // Price calculations
  const rawSubtotal = currentBundleProducts.reduce((sum, p) => {
    return sum + (p.salePrice ?? p.price);
  }, 0);

  const discountPercent = selectedDeal?.discountPercentage || (slotCount === 3 ? 20 : 12);
  const bundleSavings = selectedDeal?.fixedBundlePrice
    ? Math.max(0, rawSubtotal - selectedDeal.fixedBundlePrice)
    : Math.round(rawSubtotal * (discountPercent / 100));

  const finalBundlePrice = selectedDeal?.fixedBundlePrice
    ? selectedDeal.fixedBundlePrice
    : rawSubtotal - bundleSavings;

  const handleSlotChange = (slotIndex: number, newProductId: string) => {
    setSelectedSlotWatches((prev) => ({
      ...prev,
      [slotIndex]: newProductId,
    }));
  };

  const handleAddBundleToBag = () => {
    if (!selectedDeal || currentBundleProducts.length === 0) return;
    addWatchBundleToCart(selectedDeal, currentBundleProducts, selectedVariants);
  };

  const displayedDeals = maxDeals ? activeDeals.slice(0, maxDeals) : activeDeals;

  return (
    <section className={`py-12 sm:py-16 bg-transparent text-[#E8E8EC] ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Dedicated Text Background */}
        <div className="text-center max-w-3xl mx-auto mb-10 p-6 sm:p-8 rounded-3xl glass-panel shadow-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-extrabold uppercase tracking-[0.25em] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Curated Horology Deals</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif-luxury font-bold text-[#F5F5F7] tracking-tight">
            Bundle Deals &amp; Duos
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#CBD0DC] font-light leading-relaxed max-w-2xl mx-auto">
            Curate your luxury watch collection. Select 2 or 3 timepieces to unlock automatic VIP bundle discounts with nationwide express insured delivery.
          </p>
        </div>

        {/* Deal Selector Tabs */}
        {displayedDeals.length > 1 && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {displayedDeals.map((deal) => {
              const isActive = deal.id === selectedDeal?.id;
              return (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => setActiveDealId(deal.id)}
                  className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#0B0C0E] shadow-lg shadow-[#D4AF37]/25 ring-1 ring-[#D4AF37]'
                      : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40'
                  }`}
                >
                  <span>{deal.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#D4AF37]/15 text-[#D4AF37]'
                  }`}>
                    {deal.badge || `${deal.requiredCount} Watches`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Active Deal Card */}
        {selectedDeal && (
          <div className="rounded-3xl border border-[#262930] bg-[#121316] p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Interactive Watch Slots (2 or 3 watches) */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif-luxury font-bold text-[#F5F5F7]">
                      {selectedDeal.title}
                    </h3>
                    <p className="text-xs text-[#8E929E] mt-0.5">{selectedDeal.subtitle}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    Save {discountPercent}% Instant
                  </span>
                </div>

                <div className={`grid grid-cols-1 ${slotCount === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                  {Array.from({ length: slotCount }).map((_, slotIndex) => {
                    const currentProduct = currentBundleProducts[slotIndex] || watchProducts[0];
                    const price = currentProduct.salePrice ?? currentProduct.price;

                    return (
                      <div
                        key={slotIndex}
                        className="rounded-2xl border border-[#262930] bg-[#0B0C0E]/80 p-4 flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all group"
                      >
                        <div>
                          {/* Slot Tag */}
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#8E929E] mb-2">
                            <span className="font-bold text-[#D4AF37]">Timepiece #{slotIndex + 1}</span>
                            <span>In Stock</span>
                          </div>

                          {/* Image */}
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-[#181A1F] border border-[#262930] mb-3">
                            <img
                              src={currentProduct.thumbnail || currentProduct.media?.[0]?.url || ''}
                              alt={currentProduct.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>

                          {/* Product Info */}
                          <h4 className="text-sm font-bold text-[#F5F5F7] line-clamp-1 mb-1">
                            {currentProduct.name}
                          </h4>
                          <p className="text-xs font-semibold text-[#D4AF37]">
                            Rs. {price.toLocaleString()}
                          </p>
                        </div>

                        {/* Watch Selector Dropdown for Slot */}
                        <div className="mt-3 pt-3 border-t border-[#262930]">
                          <label className="text-[10px] text-[#8E929E] uppercase tracking-wider block mb-1">
                            Choose Model:
                          </label>
                          <select
                            value={currentProduct.id}
                            onChange={(e) => handleSlotChange(slotIndex, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#181A1F] border border-[#262930] text-xs text-[#E8E8EC] focus:border-[#D4AF37] focus:outline-none cursor-pointer"
                          >
                            {watchProducts.map((p) => (
                              <option key={p.id} value={p.id} className="bg-[#121316] text-[#E8E8EC]">
                                {p.name} (Rs. {(p.salePrice ?? p.price).toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Pricing & Bundle CTA */}
              <div className="lg:col-span-4 rounded-2xl bg-[#0B0C0E] border border-[#D4AF37]/40 p-6 space-y-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-extrabold uppercase tracking-widest border border-[#D4AF37]/30 mb-3">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    <span>Bundle Deal Summary</span>
                  </div>

                  <h4 className="text-xl font-bold font-serif-luxury text-[#F5F5F7]">
                    {selectedDeal.title}
                  </h4>
                  <p className="text-xs text-[#8E929E] mt-1">
                    {slotCount} Precision serialized timepieces with individual warranty certificates.
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 pt-3 border-t border-[#262930] text-xs">
                  <div className="flex justify-between text-[#8E929E]">
                    <span>Individual Total:</span>
                    <span className="line-through">Rs. {rawSubtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-semibold bg-emerald-950/30 p-2 rounded-xl border border-emerald-500/30">
                    <span>Bundle Savings ({discountPercent}%):</span>
                    <span>-Rs. {bundleSavings.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-[#CBD0DC]">
                    <span>Insured Nationwide Delivery:</span>
                    <span className="text-emerald-400 font-bold uppercase">Free</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t border-[#262930]">
                    <span className="text-sm font-bold text-[#F5F5F7]">Bundle Price:</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#D4AF37]">
                        Rs. {finalBundlePrice.toLocaleString()}
                      </span>
                      <p className="text-[10px] text-emerald-400 font-medium">
                        You save Rs. {bundleSavings.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleAddBundleToBag}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C378] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs uppercase font-extrabold tracking-[0.2em] shadow-lg shadow-[#D4AF37]/30 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#0B0C0E] group-hover:scale-110 transition-transform" />
                    <span>Claim Bundle &amp; Add to Bag</span>
                  </button>

                  <div className="flex items-center justify-center gap-3 text-[11px] text-[#8E929E] pt-1">
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>COD Available</span>
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>1-Year Warranty</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
