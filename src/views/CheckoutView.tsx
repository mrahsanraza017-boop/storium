import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CreditCard,
  Banknote,
  Lock,
  ArrowRight,
  Package,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MAJOR_PAKISTAN_CITIES } from '../data/initialData';
import { PaymentBadges } from '../components/common/PaymentBadges';
import { Order } from '../types';

const getProductPaymentMethods = (methods?: Array<'cod' | 'card'>): Array<'cod' | 'card'> =>
  methods && methods.length > 0 ? methods : ['cod', 'card'];

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartShippingFee,
    cartTotal,
    createOrder,
    currentUser,
    navigate,
    addToast,
    businessSettings,
  } = useStore();

  const securePaymentSteps = businessSettings.securePaymentCopy
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedPaymentMethods = useMemo(() => {
    if (cart.length === 0) return ['cod', 'card'] as Array<'cod' | 'card'>;
    return cart.reduce<Array<'cod' | 'card'>>((allowed, item) => {
      const productMethods = getProductPaymentMethods(item.product.paymentMethods);
      return allowed.filter((method) => productMethods.includes(method));
    }, ['cod', 'card']);
  }, [cart]);

  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    city: currentUser?.city || 'Lahore',
    province: 'Punjab',
    postalCode: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>(
    allowedPaymentMethods.includes('cod') ? 'cod' : allowedPaymentMethods[0] || 'cod'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(allowedPaymentMethods[0] || 'cod');
    }
  }, [allowedPaymentMethods, paymentMethod]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // If order was just placed, display success confirmation
  if (confirmedOrder) {
    return (
      <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto p-8 sm:p-10 rounded-3xl glass-panel space-y-6 text-center"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center bg-transparent p-1">
            <img src="/logo.png" alt="STORIUM Logo" width="80" height="80" className="h-full w-full object-contain" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block mb-2">
              Order Confirmed &bull; Pakistan Nationwide Delivery
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
              Thank You for Your Patronage
            </h1>
            <p className="mt-2 text-sm text-[#CBD0DC]">
              Your order <span className="text-[#D4AF37] font-mono font-bold">{confirmedOrder.orderNumber}</span> has been entered into the showroom dispatch queue.
            </p>
          </div>

          {/* Details Card */}
          <div className="p-6 rounded-2xl bg-[#0B0C0E] border border-[#262930] text-left space-y-4 text-xs">
            <div className="flex justify-between border-b border-[#262930] pb-3">
              <span className="text-[#8E929E]">Tracking Number:</span>
              <span className="font-mono text-[#E5C378] font-bold">{confirmedOrder.trackingNumber}</span>
            </div>
            <div className="flex justify-between border-b border-[#262930] pb-3">
              <span className="text-[#8E929E]">Recipient:</span>
              <span className="text-[#F5F5F7] font-medium">{confirmedOrder.customer.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-[#262930] pb-3">
              <span className="text-[#8E929E]">Destination:</span>
              <span className="text-[#F5F5F7] font-medium text-right">
                {confirmedOrder.customer.address}, {confirmedOrder.customer.city}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#262930] pb-3">
              <span className="text-[#8E929E]">Payment Method:</span>
              <span className="text-[#F5F5F7] font-medium uppercase">
                {confirmedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Debit Card'}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-bold">
              <span className="text-[#8E929E]">Total Amount:</span>
              <span className="text-[#D4AF37]">Rs. {confirmedOrder.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#181A1F] border border-[#262930] text-xs text-[#CBD0DC] flex items-center gap-3">
            <Package className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
            <span>
              Our concierge team will contact you via WhatsApp/SMS to verify dispatch. Estimated delivery is 2-4 working days.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('account')}
              className="flex-1 py-3.5 px-6 rounded-xl bg-[#181A1F] hover:bg-[#22252C] text-xs uppercase tracking-wider font-semibold text-[#F5F5F7] border border-[#262930] cursor-pointer"
            >
              View in Account
            </button>
            <button
              type="button"
              onClick={() => navigate('watches')}
              className="flex-1 py-3.5 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-xs uppercase tracking-wider font-bold text-[#0B0C0E] cursor-pointer"
            >
              Continue Browsing
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // If cart is empty and no order confirmed
  if (cart.length === 0) {
    return (
      <div className="w-full bg-transparent min-h-[70vh] flex items-center justify-center py-20 px-4 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-bold font-serif-luxury text-[#F5F5F7]">
            Your Bag is Empty
          </h2>
          <p className="text-xs text-[#CBD0DC]">
            Please add a timepiece or accessory to your shopping bag before proceeding to checkout.
          </p>
          <button
            type="button"
            onClick={() => navigate('watches')}
            className="py-3 px-6 rounded-xl bg-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Explore Showroom
          </button>
        </div>
      </div>
    );
  }

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Please enter your full name';
    if (!formData.phone.trim()) errors.phone = 'Please provide your Pakistani phone number';
    if (!formData.email.trim() || !formData.email.includes('@')) errors.email = 'Valid email required';
    if (!formData.address.trim()) errors.address = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'Please specify your city';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (allowedPaymentMethods.length === 0 || !allowedPaymentMethods.includes(paymentMethod)) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productThumbnail: item.product.thumbnail,
        price: item.product.salePrice ?? item.product.price,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant,
        sku: item.product.sku,
      }));

      const newOrder = await createOrder({
        customer: formData,
        items: orderItems,
        subtotal: cartSubtotal,
        shippingFee: cartShippingFee,
        total: cartTotal,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'Pending',
      });

      // COD: order is confirmed immediately, payment settles at the doorstep.
      if (paymentMethod === 'cod') {
        setConfirmedOrder(newOrder);
        return;
      }

      // Card: create the order first, then send the customer to Rapid Gateway's
      // hosted checkout. On completion the gateway redirects back to
      // /payment/success (accepted), /payment/failure (declined) or
      // /payment/complete (closed), where PaymentCompleteView shows the result.
      const checkoutRes = await fetch('/api/checkout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          email: formData.email,
          orderId: newOrder.orderNumber,
        }),
      });

      const checkoutData = (await checkoutRes.json().catch(() => ({}))) as {
        redirectUrl?: string;
        error?: string;
      };

      if (!checkoutRes.ok || !checkoutData.redirectUrl) {
        throw new Error(checkoutData.error || 'Payment initiation failed. Please try again.');
      }

      window.location.assign(checkoutData.redirectUrl);
    } catch (err) {
      console.error('Order submission error:', err);
      const message = err instanceof Error ? err.message : 'Please try again.';
      addToast('error', 'Payment Could Not Be Started', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8 border-b border-[#262930] mb-10">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block mb-1">
            Secure Concierge Checkout
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-luxury text-[#F5F5F7]">
            Delivery &amp; Payment
          </h1>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Delivery details and payment */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Customer & Shipping Details */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#121316]/75 border border-[#262930]/80 backdrop-blur-md space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#0B0C0E] font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h2 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
                  Nationwide Pakistan Delivery Address
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-full-name" className="block uppercase tracking-wider text-[#CBD0DC] mb-1.5 font-medium">
                    Full Name *
                  </label>
                  <input
                    id="checkout-full-name"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Hamza Tariq"
                    aria-label="Full Name"
                    required
                    className="w-full py-3 px-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37]"
                  />
                  {formErrors.fullName && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="checkout-email" className="block uppercase tracking-wider text-[#CBD0DC] mb-1.5 font-medium">
                    Email Address *
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    aria-label="Email Address"
                    required
                    className="w-full py-3 px-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37]"
                  />
                  {formErrors.email && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="checkout-phone" className="block uppercase tracking-wider text-[#CBD0DC] mb-1.5 font-medium">
                    Phone Number (SMS / WhatsApp) *
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    aria-label="Phone Number"
                    required
                    className="w-full py-3 px-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37]"
                  />
                  {formErrors.phone && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label htmlFor="checkout-city" className="block uppercase tracking-wider text-[#CBD0DC] mb-1.5 font-medium">
                    City (Pakistan) *
                  </label>
                  <select
                    id="checkout-city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    aria-label="Select City in Pakistan"
                    className="w-full py-3 px-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  >
                    {MAJOR_PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Province */}
                <div>
                  <label htmlFor="checkout-province" className="block uppercase tracking-wider text-[#CBD0DC] mb-1.5 font-medium">
                    Province / Region
                  </label>
                  <input
                    id="checkout-province"
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Punjab, Sindh, KPK, Islamabad, Balochistan"
                    aria-label="Province or Region"
                    className="w-full py-3 px-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-address" className="block uppercase tracking-wider text-[#CBD0DC] mb-1.5 font-medium">
                    Complete Street Address (House / Apartment / Area) *
                  </label>
                  <textarea
                    id="checkout-address"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. House 42, Sector Y, Phase 5, DHA"
                    aria-label="Complete Street Address"
                    required
                    className="w-full py-3 px-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37]"
                  />
                  {formErrors.address && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.address}</p>
                  )}
                </div>

                {/* Delivery Notes */}
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-notes" className="block uppercase tracking-wider text-[#CBD0DC] mb-1.5 font-medium">
                    Special Courier Instructions (Optional)
                  </label>
                  <input
                    id="checkout-notes"
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Call before arrival, leave at security gate"
                    aria-label="Special Courier Instructions"
                    className="w-full py-3 px-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] placeholder-[#626673] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#121316] border border-[#262930] space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#0B0C0E] font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h2 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-3">
                {allowedPaymentMethods.length === 0 && (
                  <p className="text-xs text-rose-400">
                    No shared payment method is available for the items in your cart. Please remove conflicting products or contact support.
                  </p>
                )}

                {/* Cash on Delivery */}
                {allowedPaymentMethods.includes('cod') && (
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${paymentMethod === 'cod'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30'
                      : 'border-[#262930] bg-[#0B0C0E] hover:border-white/20'
                      }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <Banknote className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-[#F5F5F7]">
                          Cash on Delivery (Nationwide Pakistan)
                        </h3>
                        <p className="text-xs text-[#CBD0DC] mt-0.5">
                          Inspect the parcel at your doorstep and pay the courier upon delivery.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 ${paymentMethod === 'cod' ? 'border-[#D4AF37]' : 'border-[#626673]'
                        }`}
                    >
                      {paymentMethod === 'cod' && (
                        <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      )}
                    </div>
                  </div>
                )}

                {/* Debit / Credit Card — Rapid Gateway */}
                {allowedPaymentMethods.includes('card') && (
                  <div
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all space-y-3.5 ${
                      paymentMethod === 'card'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30 shadow-lg'
                        : 'border-[#262930] bg-[#0B0C0E] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <CreditCard className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-[#F5F5F7]">
                              Credit / Debit Card (via Rapid Gateway)
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#E5C378]">
                              3D Secure 2.0
                            </span>
                          </div>
                          <p className="text-xs text-[#CBD0DC] mt-1 leading-relaxed">
                            Pay securely with any Visa, Mastercard, or PayPak card through Rapid Gateway (rapidgateway.pk). You will be seamlessly redirected to the 256-bit SSL encrypted bank portal.
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 flex-shrink-0 ${
                          paymentMethod === 'card' ? 'border-[#D4AF37]' : 'border-[#626673]'
                        }`}
                      >
                        {paymentMethod === 'card' && (
                          <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                        )}
                      </div>
                    </div>

                    {/* Supported Card Badges */}
                    <div className="pt-2 border-t border-[#262930]/80">
                      <PaymentBadges showRapidBadge={true} />
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="p-3 rounded-lg bg-[#0B0C0E]/90 border border-[#D4AF37]/30 text-[11px] text-[#CBD0DC] flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                        <span>
                          Protected by Rapid Gateway PCI-DSS Level 1 certification. Card credentials never touch STORIUM servers.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#121316] border border-[#262930] space-y-6 sticky top-28">
              <h2 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
                Order Items ({cart.length})
              </h2>

              {/* Items summary */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map((item, idx) => {
                  const price = item.product.salePrice ?? item.product.price;
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <img
                        src={item.product.thumbnail}
                        alt={item.product.name}
                        width="48"
                        height="48"
                        loading="lazy"
                        decoding="async"
                        className="w-12 h-12 rounded-lg object-cover bg-[#0B0C0E]"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-[#F5F5F7] block line-clamp-1">
                          {item.product.name}
                        </span>
                        <span className="text-[#CBD0DC] text-[11px]">
                          Qty: {item.quantity} &bull; Rs. {price.toLocaleString()} each
                        </span>
                      </div>
                      <span className="font-bold text-[#F5F5F7]">
                        Rs. {(price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#262930] space-y-2 text-xs">
                <div className="flex justify-between text-[#CBD0DC]">
                  <span>Subtotal</span>
                  <span>Rs. {cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#CBD0DC]">
                  <span>Insured Express Shipping</span>
                  <span>
                    {cartShippingFee === 0 ? (
                      <span className="text-emerald-400 font-bold uppercase">Free</span>
                    ) : (
                      `Rs. ${cartShippingFee.toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#F5F5F7] pt-2 border-t border-[#262930]">
                  <span>Total (PKR)</span>
                  <span className="text-xl text-[#D4AF37]">
                    Rs. {cartTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || allowedPaymentMethods.length === 0}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] disabled:opacity-50 text-[#0B0C0E] text-xs uppercase tracking-[0.2em] font-bold shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0B0C0E]" />
                    <span>Confirming Your Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Order &bull; Rs. {cartTotal.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-[#262930] space-y-2">
                <div className="flex items-center justify-center gap-2 text-[11px] text-[#CBD0DC]">
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>256-Bit SSL Encrypted Concierge Checkout</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8E929E]">
                  <span>Payment Gateway:</span>
                  <span className="text-[#E5C378] font-semibold">{businessSettings.paymentGatewayName} (rapidgateway.pk)</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Secure Payment Process */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-[#121316] border border-[#262930] space-y-5">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F5F5F7] font-serif-luxury">
                Secure Payment Process
              </h2>
              <p className="text-[11px] text-[#8E929E]">
                How your payment is handled end-to-end through {businessSettings.paymentGatewayName}
              </p>
            </div>
          </div>

          {securePaymentSteps.length > 0 ? (
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {securePaymentSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-xs text-[#CBD0DC] leading-relaxed p-3 rounded-xl bg-[#0B0C0E] border border-[#262930]">
                  <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#0B0C0E] font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-[#8E929E]">
              The payment process is being prepared and will be published here shortly.
            </p>
          )}

          <p className="text-[11px] text-[#8E929E] border-t border-[#262930] pt-4">
            Your card details are entered on the payment gateway&apos;s own encrypted page and never reach or are
            stored by {businessSettings.businessName}. COD orders are payable to the courier at the time of delivery.
          </p>
        </div>
      </div>
    </div>
  );
};
