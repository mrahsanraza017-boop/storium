import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShoppingBag, ArrowRight, Shield, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartDrawerOpen,
    closeCartDrawer,
    cart,
    cartCount,
    cartSubtotal,
    cartShippingFee,
    cartTotal,
    removeFromCart,
    updateCartQuantity,
    navigate,
  } = useStore();

  const handleCheckout = () => {
    closeCartDrawer();
    navigate('checkout');
  };

  const handleViewCart = () => {
    closeCartDrawer();
    navigate('cart');
  };

  const handleExplore = () => {
    closeCartDrawer();
    navigate('shop');
  };

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Bag">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCartDrawer}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-[#121316] border-l border-[#262930] shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#262930] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-base font-semibold text-[#F5F5F7] uppercase tracking-wider">
                    Luxury Bag ({cartCount})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeCartDrawer}
                  className="p-2 rounded-full text-[#8E929E] hover:text-[#F5F5F7] hover:bg-[#181A1F] transition-colors cursor-pointer"
                  aria-label="Close cart drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free delivery progress bar (Pakistan) */}
              <div className="bg-[#0B0C0E] px-5 py-2.5 border-b border-[#262930] text-xs">
                {cartSubtotal >= 15000 ? (
                  <p className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    <span>Complimentary Nationwide Insured Delivery Unlocked!</span>
                  </p>
                ) : (
                  <div>
                    <p className="text-[#CBD0DC]">
                      Add <span className="text-[#D4AF37] font-semibold">Rs. {(15000 - cartSubtotal).toLocaleString()}</span> more for Complimentary Delivery in Pakistan
                    </p>
                    <div className="w-full bg-[#181A1F] h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#D4AF37] to-[#E5C378] h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (cartSubtotal / 15000) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-[#181A1F] flex items-center justify-center text-[#8E929E] border border-[#262930]">
                      <ShoppingBag className="w-8 h-8 stroke-1 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-[#F5F5F7]">
                        Your shopping bag is empty
                      </h4>
                      <p className="mt-1 text-xs text-[#CBD0DC] max-w-xs">
                        Explore our curated selection of luxury timepieces and precision accessories.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExplore}
                      className="mt-2 py-2.5 px-5 rounded-lg bg-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider hover:bg-[#E5C378] transition-all cursor-pointer"
                    >
                      Discover Timepieces
                    </button>
                  </div>
                ) : (
                  <AnimatePresence initial={false} mode="popLayout">
                    {cart.map((item, idx) => {
                      const price = item.product.salePrice ?? item.product.price;
                      const variantKey = item.selectedVariant
                        ? JSON.stringify(item.selectedVariant)
                        : undefined;

                      return (
                        <motion.div
                          key={`${item.product.id}-${idx}`}
                          layout
                          initial={{ opacity: 0, x: 18 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 18 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="p-3 rounded-xl bg-[#181A1F] border border-[#262930] flex gap-3.5 group"
                        >
                          {/* Thumbnail */}
                          <img
                            src={item.product.thumbnail}
                            alt={item.product.name}
                            width="80"
                            height="80"
                            loading="lazy"
                            decoding="async"
                            className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-lg bg-[#0B0C0E] flex-shrink-0"
                          />

                          {/* Details */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h5
                                  onClick={() => {
                                    closeCartDrawer();
                                    navigate('product', { slug: item.product.slug });
                                  }}
                                  className="text-xs sm:text-sm font-semibold text-[#F5F5F7] hover:text-[#D4AF37] cursor-pointer line-clamp-1 transition-colors"
                                >
                                  {item.product.name}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.product.id, variantKey)}
                                  className="text-[#8E929E] hover:text-rose-400 transition-colors p-1 cursor-pointer"
                                  aria-label={`Remove ${item.product.name} from shopping bag`}
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Variant options if selected */}
                              {item.selectedVariant && (
                                <p className="text-[10px] text-[#CBD0DC] mt-0.5">
                                  {Object.entries(item.selectedVariant)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(' | ')}
                                </p>
                              )}

                              <p className="text-xs font-bold text-[#D4AF37] mt-1">
                                Rs. {price.toLocaleString()}
                              </p>
                            </div>

                            {/* Quantity selector */}
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center rounded border border-[#262930] bg-[#121316]">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCartQuantity(item.product.id, item.quantity - 1, variantKey)
                                  }
                                  aria-label={`Decrease quantity of ${item.product.name}`}
                                  className="px-2 py-0.5 text-xs text-[#CBD0DC] hover:text-[#F5F5F7] cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="px-2 text-xs font-medium text-[#F5F5F7]">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCartQuantity(item.product.id, item.quantity + 1, variantKey)
                                  }
                                  aria-label={`Increase quantity of ${item.product.name}`}
                                  className="px-2 py-0.5 text-xs text-[#CBD0DC] hover:text-[#F5F5F7] cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              <span className="text-xs font-medium text-[#E8E8EC]">
                                Rs. {(price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer Summary & CTAs */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-[#262930] bg-[#0B0C0E]/90 space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#8E929E]">
                      <span>Subtotal</span>
                      <span>Rs. {cartSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#8E929E]">
                      <span>Nationwide Shipping</span>
                      <span>
                        {cartShippingFee === 0 ? (
                          <span className="text-emerald-400 uppercase font-medium">Free</span>
                        ) : (
                          `Rs. ${cartShippingFee.toLocaleString()}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#F5F5F7] pt-2 border-t border-[#262930]">
                      <span>Total (PKR)</span>
                      <span className="text-base text-[#D4AF37]">
                        Rs. {cartTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleViewCart}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#E8E8EC] text-xs uppercase tracking-wider font-semibold border border-[#262930] transition-colors cursor-pointer"
                    >
                      View Full Bag Details
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-[#8E929E] pt-1">
                    <Shield className="w-3 h-3 text-[#D4AF37]" />
                    <span>Cash on Delivery &amp; Encrypted Debit Card Checkout</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
