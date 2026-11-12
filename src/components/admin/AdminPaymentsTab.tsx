import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Banknote,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Save,
  Check,
  Mail,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';

export const AdminPaymentsTab: React.FC = () => {
  const {
    orders,
    markOrderPaid,
    updateOrderPaymentStatus,
    syncWithSupabase,
    isSupabaseSyncing,
    addToast,
    sendConfirmationEmail,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState<'all' | 'rapid' | 'safepay' | 'cod'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [selectedTxOrder, setSelectedTxOrder] = useState<Order | null>(null);

  // Modal editing state
  const [editStatus, setEditStatus] = useState<Order['paymentStatus']>('pending');
  const [editTxRef, setEditTxRef] = useState('');
  const [isSavingTx, setIsSavingTx] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Compute Volume Statistics
  const stats = useMemo(() => {
    let totalVolume = 0;
    let cardVolume = 0;
    let codVolume = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    orders.forEach((o) => {
      totalVolume += o.total || 0;
      if (o.paymentMethod === 'card') {
        cardVolume += o.total || 0;
      } else {
        codVolume += o.total || 0;
      }

      if (o.paymentStatus === 'paid') paidCount++;
      else if (o.paymentStatus === 'failed') failedCount++;
      else pendingCount++;
    });

    return { totalVolume, cardVolume, codVolume, paidCount, pendingCount, failedCount };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Gateway match
      if (gatewayFilter === 'rapid') {
        if (o.paymentMethod !== 'card' || (!o.rgTransactionRef && o.paymentMethod !== 'card')) return false;
      } else if (gatewayFilter === 'safepay') {
        if (o.paymentMethod !== 'card') return false;
      } else if (gatewayFilter === 'cod') {
        if (o.paymentMethod !== 'cod') return false;
      }

      // Status match
      if (statusFilter !== 'all') {
        if (statusFilter === 'paid' && o.paymentStatus !== 'paid') return false;
        if (statusFilter === 'pending' && (o.paymentStatus && o.paymentStatus !== 'pending')) return false;
        if (statusFilter === 'failed' && o.paymentStatus !== 'failed') return false;
      }

      // Search match
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesNumber = o.orderNumber.toLowerCase().includes(q);
        const matchesCustomer = o.customer.fullName.toLowerCase().includes(q);
        const matchesRef = (o.rgTransactionRef || '').toLowerCase().includes(q);
        if (!matchesNumber && !matchesCustomer && !matchesRef) return false;
      }

      return true;
    });
  }, [orders, gatewayFilter, statusFilter, searchTerm]);

  const handleOpenTxModal = (order: Order) => {
    setSelectedTxOrder(order);
    setEditStatus(order.paymentStatus || 'pending');
    setEditTxRef(order.rgTransactionRef || '');
  };

  const handleInlineStatusChange = async (order: Order, newStatus: Order['paymentStatus']) => {
    setUpdatingOrderId(order.orderNumber);
    try {
      await updateOrderPaymentStatus(order.orderNumber, newStatus);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleQuickSettle = async (order: Order) => {
    setUpdatingOrderId(order.orderNumber);
    try {
      await updateOrderPaymentStatus(order.orderNumber, 'paid');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSaveTxModal = async () => {
    if (!selectedTxOrder) return;
    setIsSavingTx(true);
    try {
      await updateOrderPaymentStatus(selectedTxOrder.orderNumber, editStatus, {
        rgTransactionRef: editTxRef.trim() || undefined,
      });
      setSelectedTxOrder((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: editStatus,
              rgTransactionRef: editTxRef.trim() || undefined,
            }
          : null
      );
    } finally {
      setIsSavingTx(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner with Supabase Cloud Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#121316] border border-[#262930]">
        <div>
          <h2 className="text-base font-bold text-[#F5F5F7] font-serif-luxury flex items-center gap-2">
            <span>Payment Settlement &amp; Transactions</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-normal">
              Cloud Synced
            </span>
          </h2>
          <p className="text-xs text-[#8E929E] mt-0.5">
            Real-time reconciliation for Debit Card, SafePay, and RUN Couriers Cash on Delivery orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => syncWithSupabase()}
          disabled={isSupabaseSyncing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#CBD0DC] hover:text-[#F5F5F7] border border-[#262930] text-xs font-semibold cursor-pointer transition-colors shadow-sm self-start sm:self-auto"
          title="Force refresh orders and payments from Supabase"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSupabaseSyncing ? 'animate-spin text-[#D4AF37]' : 'text-[#8E929E]'}`} />
          <span>{isSupabaseSyncing ? 'Syncing...' : 'Sync Cloud Orders'}</span>
        </button>
      </div>

      {/* Header and Volume Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Total Payment Volume
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#D4AF37]">
            Rs. {stats.totalVolume.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#8E929E]">{orders.length} transactions recorded</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Card Gateway Volume
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-emerald-400">
            Rs. {stats.cardVolume.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#8E929E]">Rapid Gateway &amp; SafePay processed</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Cash on Delivery Volume
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
            Rs. {stats.codVolume.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#8E929E]">Collected via RUN Couriers Logistics</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Verified Paid Orders
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#D4AF37]">
            {stats.paidCount} / {orders.length}
          </div>
          <span className="text-[11px] text-amber-400 font-mono">
            {stats.pendingCount} pending settlement {stats.failedCount > 0 ? `• ${stats.failedCount} failed` : ''}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#121316] border border-[#262930] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Gateway Filter */}
          <div className="flex items-center bg-[#0B0C0E] rounded-xl p-1 border border-[#262930]">
            <button
              onClick={() => setGatewayFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                gatewayFilter === 'all' ? 'bg-[#D4AF37] text-[#0B0C0E]' : 'text-[#8E929E] hover:text-[#F5F5F7]'
              }`}
            >
              All Gateways
            </button>
            <button
              onClick={() => setGatewayFilter('rapid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                gatewayFilter === 'rapid' ? 'bg-[#D4AF37] text-[#0B0C0E]' : 'text-[#8E929E] hover:text-[#F5F5F7]'
              }`}
            >
              Rapid Gateway
            </button>
            <button
              onClick={() => setGatewayFilter('safepay')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                gatewayFilter === 'safepay' ? 'bg-[#D4AF37] text-[#0B0C0E]' : 'text-[#8E929E] hover:text-[#F5F5F7]'
              }`}
            >
              SafePay
            </button>
            <button
              onClick={() => setGatewayFilter('cod')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                gatewayFilter === 'cod' ? 'bg-[#D4AF37] text-[#0B0C0E]' : 'text-[#8E929E] hover:text-[#F5F5F7]'
              }`}
            >
              COD
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-[#0B0C0E] rounded-xl p-1 border border-[#262930]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all' ? 'bg-[#181A1F] text-[#F5F5F7]' : 'text-[#8E929E]'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#8E929E]'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'text-[#8E929E]'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'failed' ? 'bg-rose-500/20 text-rose-400' : 'text-[#8E929E]'
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#8E929E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order # or Tx Ref..."
            className="w-full py-2 pl-9 pr-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#121316] border border-[#262930] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs text-[#E8E8EC]">
          <thead className="bg-[#0B0C0E] border-b border-[#262930] text-[10px] uppercase tracking-wider text-[#8E929E]">
            <tr>
              <th className="p-4">Transaction / Order</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Gateway</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Payment Status</th>
              <th className="p-4">Settlement Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262930]">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-[#8E929E]">
                  No matching payment transactions found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const currentStatus = order.paymentStatus || 'pending';
                const isPaid = currentStatus === 'paid';
                const isFailed = currentStatus === 'failed';
                const isBusy = updatingOrderId === order.orderNumber;

                return (
                  <tr key={order.id} className="hover:bg-[#181A1F] transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-[#D4AF37] block">
                        #{order.orderNumber}
                      </span>
                      {order.rgTransactionRef && (
                        <span className="text-[10px] text-[#8E929E] font-mono block">
                          Ref: {order.rgTransactionRef}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-[#F5F5F7] block">
                        {order.customer.fullName}
                      </span>
                      <span className="text-[10px] text-[#8E929E]">{order.customer.city}</span>
                    </td>
                    <td className="p-4">
                      {order.paymentMethod === 'card' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                          <CreditCard className="w-3 h-3" />
                          {order.rgTransactionRef ? 'Rapid Gateway' : 'Credit / Debit Card'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 font-semibold text-[10px]">
                          <Banknote className="w-3 h-3" />
                          Cash on Delivery
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-[#F5F5F7]">
                      Rs. {order.total.toLocaleString()}
                    </td>
                    <td className="p-4">
                      {/* Interactive Payment Status Selector */}
                      <select
                        aria-label={`Payment status for order ${order.orderNumber}`}
                        value={currentStatus}
                        disabled={isBusy}
                        onChange={(e) => handleInlineStatusChange(order, e.target.value as Order['paymentStatus'])}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer focus:outline-none ${
                          isPaid
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : isFailed
                            ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                            : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        <option value="pending" className="bg-[#121316] text-amber-300">
                          PENDING
                        </option>
                        <option value="paid" className="bg-[#121316] text-emerald-300">
                          PAID (Verified)
                        </option>
                        <option value="failed" className="bg-[#121316] text-rose-300">
                          FAILED
                        </option>
                      </select>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-[#8E929E]">
                      {order.paidAt
                        ? new Date(order.paidAt).toLocaleDateString()
                        : new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!isPaid && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleQuickSettle(order)}
                          className="px-3 py-1 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-[11px] font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          {isBusy ? 'Saving...' : 'Verify & Settle'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenTxModal(order)}
                        className="px-2.5 py-1 rounded-lg bg-[#181A1F] hover:bg-[#20232A] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] text-[11px] transition-all cursor-pointer"
                      >
                        {isPaid ? 'Receipt / Details' : 'Details'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction Details & Edit Modal */}
      {selectedTxOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#262930] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262930] pb-3">
              <h3 className="font-bold font-serif-luxury text-[#F5F5F7] text-base">
                Payment Verification &amp; Reconciliation
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTxOrder(null)}
                className="text-[#8E929E] hover:text-[#F5F5F7] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#262930]/40">
                <span className="text-[#8E929E]">Order Number:</span>
                <span className="font-mono text-[#D4AF37] font-bold">#{selectedTxOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#262930]/40">
                <span className="text-[#8E929E]">Customer:</span>
                <span className="text-[#F5F5F7]">{selectedTxOrder.customer.fullName} ({selectedTxOrder.customer.city})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#262930]/40">
                <span className="text-[#8E929E]">Payment Method:</span>
                <span className="text-[#F5F5F7] uppercase font-semibold">
                  {selectedTxOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Debit / Credit Card'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#262930]/40">
                <span className="text-[#8E929E]">Order Total:</span>
                <span className="font-mono font-bold text-emerald-400">
                  Rs. {selectedTxOrder.total.toLocaleString()}
                </span>
              </div>

              {/* Editable Payment Status */}
              <div className="pt-2 space-y-1.5">
                <label className="text-[#8E929E] block font-semibold text-[11px] uppercase tracking-wider">
                  Payment Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Order['paymentStatus'])}
                  className="w-full py-2 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="pending">Pending (Unsettled / Unverified)</option>
                  <option value="paid">Paid (Verified in Bank or Gateway)</option>
                  <option value="failed">Failed (Declined or Disputed)</option>
                </select>
              </div>

              {/* Editable Transaction Reference */}
              <div className="space-y-1.5">
                <label className="text-[#8E929E] block font-semibold text-[11px] uppercase tracking-wider">
                  Transaction Reference / Slip ID
                </label>
                <input
                  type="text"
                  value={editTxRef}
                  onChange={(e) => setEditTxRef(e.target.value)}
                  placeholder="e.g. Bank Ref, EasyPaisa, JazzCash, or SafePay Tracker"
                  className="w-full py-2 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-between py-1 border-t border-[#262930]/40 text-[11px]">
                <span className="text-[#8E929E]">Settlement Timestamp:</span>
                <span className="font-mono text-[#8E929E]">
                  {selectedTxOrder.paidAt || selectedTxOrder.date}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveTxModal}
                disabled={isSavingTx}
                className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider hover:bg-[#E5C378] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingTx ? 'Saving to Cloud...' : 'Save & Sync Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTxOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {editStatus === 'paid' && (
              <button
                type="button"
                onClick={async () => {
                  addToast('info', 'Sending Receipt...', `Sending paid receipt to ${selectedTxOrder.customer.email}`);
                  const res = await sendConfirmationEmail(selectedTxOrder);
                  if (res.success) {
                    addToast('success', 'Email Sent', `Payment receipt sent to ${selectedTxOrder.customer.email}`);
                  } else {
                    addToast('error', 'Send Failed', res.error || 'Could not send payment receipt.');
                  }
                }}
                className="w-full py-2 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Verified Receipt to Customer</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
