import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Loader2, Package, ArrowRight, ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';

type PaymentStatus = 'checking' | 'paid' | 'pending' | 'failed' | 'not-found';

/**
 * Landing page after Rapid Gateway redirects the customer back to
 * /payment/success, /payment/failure or /payment/complete.
 *
 * The verified webhook is the ONLY source of truth for payment confirmation.
 * SUCCESS_URL must never be treated as proof of payment, so this view polls the
 * order status from Supabase (which the webhook updates) and only shows
 * "paid" once the order is actually marked paid there.
 */
export const PaymentCompleteView: React.FC = () => {
  const { orders, navigate, isSupabaseSyncing, syncWithSupabase } = useStore();

  // The gateway drops the customer on one of three paths after checkout:
  //   /payment/success   -> payment accepted (but NOT proof — wait for webhook)
  //   /payment/failure   -> payment declined/expired
  //   /payment/complete  -> checkout finished (outcome via order/webhook)
  const incomingPath = useMemo(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return path.includes('success') ? 'success' : path.includes('failure') ? 'failure' : 'complete';
  }, []);

  const orderId = useMemo(() => {
    return new URLSearchParams(window.location.search).get('order') || '';
  }, []);

  const explicitStatus = useMemo(() => {
    return new URLSearchParams(window.location.search).get('status') || '';
  }, []);

  const [status, setStatus] = useState<PaymentStatus>('checking');
  const [pollCount, setPollCount] = useState(0);
  const syncedRef = useRef(false);

  const order = useMemo(
    () => orders.find((o) => o.orderNumber === orderId),
    [orders, orderId]
  );

  // Only ~8 seconds of polling is worth block the page; the webhook usually
  // lands within a few seconds of the redirect.
  const MAX_POLLS = 4;

  // Re-sync order state from Supabase shortly after returning from the
  // gateway so a webhook (transaction.completed) has a chance to land.
  useEffect(() => {
    if (orderId === '') {
      setStatus('not-found');
      return;
    }
    const sync = () => {
      if (syncedRef.current) return;
      syncedRef.current = true;
      void syncWithSupabase().then(() => setPollCount((c) => c + 1));
    };
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Poll a few times with a delay, then settle on a final state.
  useEffect(() => {
    if (pollCount === 0 || pollCount >= MAX_POLLS) return;
    const timer = window.setTimeout(() => {
      void syncWithSupabase().then(() => {
        setPollCount((c) => c + 1);
      });
    }, 3000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollCount]);

  useEffect(() => {
    if (orderId === '') {
      setStatus('not-found');
      return;
    }

    // A failure or cancelled redirect is a strong (but not authoritative)
    // signal — the definitive status still comes from the webhook. We show
    // "failed" immediately for these since the order won't flip to paid.
    const failedHint =
      incomingPath === 'failure' ||
      explicitStatus.toLowerCase().includes('fail') ||
      explicitStatus.toLowerCase().includes('cancel');

    // Wait for at least the first sync before settling anything.
    if (pollCount === 0) {
      setStatus('checking');
      return;
    }

    // The verified order state (updated by the webhook) is authoritative.
    if (order) {
      if (order.paymentStatus === 'paid') {
        setStatus('paid');
        return;
      }
      if (order.paymentStatus === 'failed') {
        setStatus('failed');
        return;
      }
    }

    // For a failed/cancelled return, assume failure once our polling window
    // has closed without a paid status.
    if (failedHint && pollCount >= 2) {
      setStatus('failed');
      return;
    }

    // Success return: only claim paid once the order is actually marked paid
    // by the webhook. Until then keep showing the confirming state.
    if (pollCount < MAX_POLLS) {
      setStatus('checking');
      return;
    }

    // Polling window closed. Settle on the best available state.
    if (failedHint) {
      setStatus('failed');
      return;
    }
    if (!order) {
      setStatus('not-found');
      return;
    }
    setStatus('pending');
  }, [order, orderId, pollCount, incomingPath, explicitStatus]);

  if (status === 'checking') {
    return (
      <div className="w-full bg-transparent min-h-screen flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl glass-panel space-y-6 text-center">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin mx-auto" />
          <h1 className="text-xl font-bold font-serif-luxury text-[#F5F5F7]">
            Confirming Your Payment
          </h1>
          <p className="text-xs text-[#CBD0DC]">
            {orderId ? `Verifying order ${orderId} with our secure gateway…` : 'Contacting the secure gateway…'}
          </p>
        </div>
      </div>
    );
  }

  const success = status === 'paid';
  const failure = status === 'failed' || status === 'not-found';

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

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#181A1F] border border-[#262930]">
          {success ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          ) : failure ? (
            <AlertCircle className="w-7 h-7 text-rose-400" />
          ) : (
            <Package className="w-7 h-7 text-[#D4AF37]" />
          )}
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
            Secure Concierge Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
            {success
              ? 'Payment Confirmed'
              : failure
                ? 'Payment Not Completed'
                : 'Payment Being Processed'}
          </h1>
          <p className="mx-auto mt-2 text-sm text-[#CBD0DC] max-w-md">
            {success
              ? `Order ${orderId} has been paid in full. Our concierge will contact you via WhatsApp/SMS to confirm dispatch.`
              : failure
                ? 'No charge has been made to your card. If the issue persists, contact our concierge — we can assist with payment or an alternative.'
                : `We received order ${orderId}. Your bank's confirmation is still pending — we will update your order and notify you once it settles.`}
          </p>
        </div>

        {order && (
          <div className="p-6 rounded-2xl bg-[#0B0C0E] border border-[#262930] text-left space-y-3 text-sm">
            <div className="flex justify-between border-b border-[#262930] pb-3">
              <span className="text-[#8E929E] text-xs">Order Reference:</span>
              <span className="font-mono text-[#E5C378] font-bold text-xs">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between border-b border-[#262930] pb-3">
              <span className="text-[#8E929E] text-xs">Tracking Number:</span>
              <span className="font-mono text-[#F5F5F7] font-bold text-xs">{order.trackingNumber}</span>
            </div>
            <div className="flex justify-between border-b border-[#262930] pb-3">
              <span className="text-[#8E929E] text-xs">Payment Status:</span>
              <span className={`text-xs font-bold uppercase ${success ? 'text-emerald-400' : 'text-[#D4AF37]'}`}>
                {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'failed' ? 'Failed' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[#8E929E] text-xs">Total Amount:</span>
              <span className="text-[#D4AF37] font-bold text-sm">Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('account')}
            className="flex-1 py-3.5 px-6 rounded-xl bg-[#181A1F] hover:bg-[#22252C] text-xs uppercase tracking-wider font-semibold text-[#F5F5F7] border border-[#262930] cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            View in Account
          </button>
          <button
            type="button"
            onClick={() => navigate(failure ? 'contact' : 'watches')}
            className={`flex-1 py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider font-bold cursor-pointer flex items-center justify-center gap-2 ${failure
                ? 'bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10'
                : 'bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E]'
              }`}
          >
            {failure ? 'Contact Concierge' : status === 'pending' ? 'View Order Status' : 'Continue Browsing'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isSupabaseSyncing && pollCount < MAX_POLLS && (
          <p className="text-[11px] text-[#626673] flex items-center justify-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Syncing payment status with the cloud…
          </p>
        )}
      </motion.div>
    </div>
  );
};