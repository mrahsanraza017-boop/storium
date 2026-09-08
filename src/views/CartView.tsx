import React from 'react';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Shield, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SEOHead } from '../components/seo/SEOHead';

export const CartView: React.FC = () => {
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartShippingFee,
    cartTotal,
    removeFromCart,
    updateCartQuantity,
    navigate,
  } = useStore();

  if (cart.length === 0) {
    return (
      <div className="w-full bg-transparent min-h-[75vh] flex items-center justify-center py-20 px-4 text-center text-[#E8E8EC]">
        <SEOHead
          title="Shopping Bag | STORIUM Pakistan"
          description="Your luxury shopping bag at Maison STORIUM."
          noindex={true}
          canonicalPath="/cart"
        />
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#121316] border border-[#262930] flex items-center justify-center text-[#D4AF37] mx-auto shadow-xl">
            <ShoppingBag className="w-10 h-10 stroke-1" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
              Your Shopping Bag is Empty
            </h1>
            <p className="mt-2 text-sm text-[#8E929E]">
              Discover our signature timepieces and aerospace accessories engineered to elevate presence.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('watches')}
            className="py-3.5 px-8 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-[0.2em] shadow-lg transition-all"
          >
            Explore Watches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-12">
      <SEOHead
        title="Shopping Bag | STORIUM Pakistan"
        description="Review your selected luxury timepieces and bespoke accessories in your STORIUM shopping bag."
        noindex={true}
        canonicalPath="/cart"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8 border-b border-[#262930] mb-10 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block mb-1">
              Review Showroom Selection
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif-luxury text-[#F5F5F7]">
              Shopping Bag ({cartCount})
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate('shop')}
            className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-wider text-[#8E929E] hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Browsing</span>
          </button>
        </div>

        {/* Cart Layout: Items on Left, Order Summary on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Items Table / List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item, idx) => {
              const price = item.product.salePrice ?? item.product.price;
              const variantKey = item.selectedVariant
                ? JSON.stringify(item.selectedVariant)
                : undefined;

              return (
                <div
                  key={`${item.product.id}-${idx}`}
                  className="p-5 rounded-2xl bg-[#121316] border border-[#262930] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                >
                  <div className="flex items-center gap-5">
                    <img
                      src={item.product.thumbnail}
                      alt={item.product.name}
                      onClick={() => navigate('product', { slug: item.product.slug })}
                      className="w-24 h-24 rounded-xl object-cover bg-[#0B0C0E] border border-white/5 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                    />
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono block">
                        {item.product.brand} &bull; {item.product.sku}
                      </span>
                      <h3
                        onClick={() => navigate('product', { slug: item.product.slug })}
                        className="text-base font-bold text-[#F5F5F7] hover:text-[#D4AF37] cursor-pointer transition-colors"
                      >
                        {item.product.name}
                      </h3>

                      {item.selectedVariant && (
                        <p className="text-xs text-[#8E929E] mt-1">
                          {Object.entries(item.selectedVariant)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' | ')}
                        </p>
                      )}

                      <p className="text-sm font-bold text-[#D4AF37] mt-1.5">
                        Rs. {price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#262930]">
                    <div className="flex items-center rounded-xl border border-[#262930] bg-[#181A1F]">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity - 1, variantKey)
                        }
                        className="px-3 py-1.5 text-sm text-[#8E929E] hover:text-[#F5F5F7]"
                      >
                        -
                      </button>
                      <span className="px-3 text-sm font-semibold text-[#F5F5F7] min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity + 1, variantKey)
                        }
                        className="px-3 py-1.5 text-sm text-[#8E929E] hover:text-[#F5F5F7]"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-base font-bold text-[#F5F5F7] min-w-[6rem] text-right">
                      Rs. {(price * item.quantity).toLocaleString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id, variantKey)}
                      className="p-2 text-[#626673] hover:text-rose-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pakistan Shipping Notice */}
            <div className="p-4 rounded-xl bg-[#121316]/50 border border-[#262930] flex items-center gap-3 text-xs text-[#8E929E]">
              <Truck className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
              <span>
                All orders are dispatched via insured express courier across Pakistan. Estimated delivery 2-4 working days.
              </span>
            </div>
          </div>

          {/* Summary Box */}
          <div className="lg:col-span-4">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#121316] border border-[#262930] space-y-6 sticky top-28">
              <h3 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#8E929E]">
                  <span>Subtotal</span>
                  <span className="text-[#F5F5F7]">Rs. {cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#8E929E]">
                  <span>Nationwide Courier</span>
                  <span>
                    {cartShippingFee === 0 ? (
                      <span className="text-emerald-400 font-semibold uppercase">Free</span>
                    ) : (
                      `Rs. ${cartShippingFee.toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#F5F5F7] pt-3 border-t border-[#262930]">
                  <span>Estimated Total (PKR)</span>
                  <span className="text-xl text-[#D4AF37]">
                    Rs. {cartTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('checkout')}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs uppercase tracking-[0.2em] font-bold shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="space-y-2 pt-4 border-t border-[#262930] text-[11px] text-[#8E929E]">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>2-Year International Warranty Included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Cash on Delivery (COD) or Card</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
