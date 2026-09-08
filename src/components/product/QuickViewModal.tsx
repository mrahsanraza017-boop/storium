import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Heart, Shield, Truck, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductGallery } from './ProductGallery';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, closeQuickView, addToCart, toggleWishlist, isInWishlist, navigate } =
    useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const inWishlist = quickViewProduct ? isInWishlist(quickViewProduct.id) : false;

  const handleSelectVariant = (name: string, option: string) => {
    setSelectedVariants((prev) => ({ ...prev, [name]: option }));
  };

  const handleAddToCart = () => {
    if (!quickViewProduct) return;
    addToCart(quickViewProduct, quantity, selectedVariants);
    closeQuickView();
  };

  const handleBuyNow = () => {
    if (!quickViewProduct) return;
    addToCart(quickViewProduct, quantity, selectedVariants);
    closeQuickView();
    navigate('checkout');
  };

  const handleViewFullDetails = () => {
    if (!quickViewProduct) return;
    closeQuickView();
    navigate('product', { slug: quickViewProduct.slug });
  };

  return (
    <AnimatePresence>
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQuickView}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-4xl bg-[#121316] border border-[#262930] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeQuickView}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Gallery */}
            <div className="w-full md:w-1/2 p-6 bg-[#0B0C0E]/50 overflow-y-auto">
              <ProductGallery
                images={quickViewProduct.productImages}
                media={quickViewProduct.media}
                productName={quickViewProduct.name}
              />
            </div>

            {/* Right Column: Information & Actions */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Brand and SKU */}
                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#8E929E] mb-2">
                  <span>{quickViewProduct.brand}</span>
                  <span className="font-mono text-[#D4AF37]">{quickViewProduct.sku}</span>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F7] tracking-tight font-serif-luxury">
                  {quickViewProduct.name}
                </h2>

                {/* Price */}
                <div className="mt-3 flex items-baseline gap-3">
                  {quickViewProduct.salePrice ? (
                    <>
                      <span className="text-2xl font-bold text-[#F5F5F7]">
                        Rs. {quickViewProduct.salePrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-[#7A7E8B] line-through">
                        Rs. {quickViewProduct.price.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-[#F5F5F7]">
                      Rs. {quickViewProduct.price.toLocaleString()}
                    </span>
                  )}
                  <span className="text-xs text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20">
                    {quickViewProduct.stockQuantity > 0 ? 'In Stock (Pakistan)' : 'Pre-Order'}
                  </span>
                </div>

                {/* Short Description */}
                <p className="mt-4 text-sm text-[#9Ea2AF] leading-relaxed">
                  {quickViewProduct.shortDescription || quickViewProduct.description}
                </p>

                {/* Variants Selector */}
                {quickViewProduct.variants && quickViewProduct.variants.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {quickViewProduct.variants.map((v) => (
                      <div key={v.name}>
                        <span className="text-xs uppercase tracking-wider text-[#8E929E] font-medium block mb-2">
                          {v.name}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {v.options.map((opt) => {
                            const isSelected = selectedVariants[v.name] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleSelectVariant(v.name, opt)}
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${isSelected
                                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F5F5F7]'
                                  : 'border-[#262930] text-[#9Ea2AF] hover:border-white/20'
                                  }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mt-6 flex items-center gap-4">
                  <span className="text-xs uppercase tracking-wider text-[#8E929E]">Quantity</span>
                  <div className="flex items-center rounded-lg border border-[#262930] bg-[#181A1F]">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-sm text-[#E8E8EC] hover:text-[#D4AF37] transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 text-sm font-semibold text-[#F5F5F7] min-w-[2rem] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1.5 text-sm text-[#E8E8EC] hover:text-[#D4AF37] transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-8 space-y-3 pt-6 border-t border-[#262930]">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#181A1F] hover:bg-[#22252C] text-sm uppercase tracking-wider font-semibold text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 transition-all"
                  >
                    Add to Shopping Bag
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(quickViewProduct.id)}
                    className={`p-3 rounded-xl border transition-all ${inWishlist
                      ? 'bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37]'
                      : 'bg-[#181A1F] text-[#E8E8EC] border-[#262930] hover:text-[#D4AF37]'
                      }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-sm uppercase tracking-wider font-bold shadow-lg transition-all"
                >
                  Instant Checkout
                </button>

                <button
                  type="button"
                  onClick={handleViewFullDetails}
                  className="w-full text-center text-xs text-[#8E929E] hover:text-[#D4AF37] flex items-center justify-center gap-1.5 pt-2 transition-colors"
                >
                  <span>View Full Timepiece Specifications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Guarantees */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#262930]/60 text-[11px] text-[#8E929E]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#D4AF37]" />
                    <span>2-Year International Warranty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#D4AF37]" />
                    <span>Free Insured Delivery (Pakistan)</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
