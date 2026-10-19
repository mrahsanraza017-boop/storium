import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Refund } from '../../types';

export const AdminRefundsTab: React.FC = () => {
  const { refunds, orders, createRefund, updateRefundStatus, addToast } = useStore();

  const [statusFilter, setStatusFilter] = useState<'all' | 'requested' | 'approved' | 'processed' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Issue Refund Form State
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerEmail, setFormCustomerEmail] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formReason, setFormReason] = useState('Customer Return');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [formNotes, setFormNotes] = useState('');

  // Auto-fill customer details when order number is selected
  const handleSelectOrder = (orderNum: string) => {
    setFormOrderNumber(orderNum);
    const matched = orders.find((o) => o.orderNumber === orderNum);
    if (matched) {
      setFormCustomerName(matched.customer.fullName);
      setFormCustomerEmail(matched.customer.email);
      setFormAmount(matched.total);
      setFormPaymentMethod(matched.paymentMethod === 'card' ? 'card' : 'cod');
    }
  };

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrderNumber || formAmount <= 0) {
      addToast('error', 'Incomplete Form', 'Please select an order and enter a valid refund amount.');
      return;
    }

    const matched = orders.find((o) => o.orderNumber === formOrderNumber);
    await createRefund({
      orderId: matched ? matched.id : 'ord-' + Date.now(),
      orderNumber: formOrderNumber,
      customerName: formCustomerName || 'Showroom Customer',
      customerEmail: formCustomerEmail || 'customer@storium.online',
      amount: formAmount,
      reason: formReason,
      status: 'processed',
      paymentMethod: formPaymentMethod,
      notes: formNotes,
    });

    setIsIssueModalOpen(false);
    // Reset form
    setFormOrderNumber('');
    setFormCustomerName('');
    setFormCustomerEmail('');
    setFormAmount(0);
    setFormNotes('');
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalRefunded = 0;
    let pendingCount = 0;
    let processedCount = 0;

    refunds.forEach((r) => {
      if (r.status === 'processed' || r.status === 'approved') {
        totalRefunded += r.amount || 0;
      }
      if (r.status === 'requested') pendingCount++;
      if (r.status === 'processed') processedCount++;
    });

    return { totalRefunded, pendingCount, processedCount, totalClaims: refunds.length };
  }, [refunds]);

  // Filtered Refunds
  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesOrder = r.orderNumber.toLowerCase().includes(q);
        const matchesName = r.customerName.toLowerCase().includes(q);
        const matchesReason = r.reason.toLowerCase().includes(q);
        if (!matchesOrder && !matchesName && !matchesReason) return false;
      }
      return true;
    });
  }, [refunds, statusFilter, searchTerm]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Total Value Refunded
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-rose-400">
            Rs. {stats.totalRefunded.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#8E929E]">From processed &amp; approved claims</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Pending Claims
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-amber-400">
            {stats.pendingCount}
          </div>
          <span className="text-[11px] text-amber-300">Requires showroom authorization</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Settled Refunds
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-emerald-400">
            {stats.processedCount}
          </div>
          <span className="text-[11px] text-[#8E929E]">Completed reversal records</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Total Claims
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
            {stats.totalClaims}
          </div>
          <span className="text-[11px] text-[#8E929E]">All historical refund entries</span>
        </div>
      </div>

      {/* Control Bar: Filter, Search & Issue Action */}
      <div className="p-4 rounded-2xl bg-[#121316] border border-[#262930] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center bg-[#0B0C0E] rounded-xl p-1 border border-[#262930]">
            {(
              [
                { id: 'all', label: 'All Status' },
                { id: 'requested', label: 'Requested' },
                { id: 'approved', label: 'Approved' },
                { id: 'processed', label: 'Processed' },
                { id: 'rejected', label: 'Rejected' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setStatusFilter(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === item.id
                    ? 'bg-[#D4AF37] text-[#0B0C0E]'
                    : 'text-[#8E929E] hover:text-[#F5F5F7]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-[#8E929E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Order # or Customer..."
              className="w-full py-1.5 pl-9 pr-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue / Record Refund</span>
        </button>
      </div>

      {/* Refunds Table */}
      <div className="rounded-2xl bg-[#121316] border border-[#262930] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs text-[#E8E8EC]">
          <thead className="bg-[#0B0C0E] border-b border-[#262930] text-[10px] uppercase tracking-wider text-[#8E929E]">
            <tr>
              <th className="p-4">Claim ID / Order</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262930]">
            {filteredRefunds.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-[#8E929E]">
                  No refund claims recorded yet.
                </td>
              </tr>
            ) : (
              filteredRefunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-[#181A1F] transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-[10px] text-[#8E929E] block">{refund.id}</span>
                    <span className="font-mono font-bold text-[#D4AF37] block">#{refund.orderNumber}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-[#F5F5F7] block">{refund.customerName}</span>
                    <span className="text-[10px] text-[#8E929E]">{refund.customerEmail}</span>
                  </td>
                  <td className="p-4 font-mono font-bold text-rose-400">
                    Rs. {refund.amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-[#E8E8EC]">
                    <span className="block font-medium">{refund.reason}</span>
                    {refund.notes && <span className="text-[10px] text-[#8E929E]">{refund.notes}</span>}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        refund.status === 'processed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : refund.status === 'approved'
                          ? 'bg-sky-500/20 text-sky-300'
                          : refund.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {refund.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-[#8E929E]">
                    {new Date(refund.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {refund.status === 'requested' && (
                        <>
                          <button
                            onClick={() => updateRefundStatus(refund.id, 'approved')}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[10px] font-bold border border-sky-500/30"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateRefundStatus(refund.id, 'rejected')}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {refund.status === 'approved' && (
                        <button
                          onClick={() => updateRefundStatus(refund.id, 'processed')}
                          className="px-2.5 py-1 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-[10px] font-bold"
                        >
                          Mark Processed
                        </button>
                      )}
                      {refund.status === 'processed' && (
                        <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                          ✓ Settled
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Issue Refund Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#262930] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262930] pb-3">
              <h3 className="font-bold font-serif-luxury text-[#F5F5F7] text-base">
                Issue / Record Customer Refund
              </h3>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="text-[#8E929E] hover:text-[#F5F5F7] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueRefund} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#8E929E] uppercase mb-1">
                  Select Order
                </label>
                <select
                  value={formOrderNumber}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
                  required
                >
                  <option value="">-- Choose an Order --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.orderNumber}>
                      #{o.orderNumber} &bull; {o.customer.fullName} &bull; Rs. {o.total.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E929E] uppercase mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E929E] uppercase mb-1">
                    Refund Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs font-mono font-bold text-rose-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8E929E] uppercase mb-1">
                  Reason for Refund
                </label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7]"
                >
                  <option value="Customer Return">Customer Return</option>
                  <option value="Damaged in Transit">Damaged in Transit</option>
                  <option value="Order Cancellation">Order Cancellation</option>
                  <option value="Duplicate Payment">Duplicate Payment</option>
                  <option value="Incorrect Specification">Incorrect Specification</option>
                  <option value="Customer Goodwill">Customer Goodwill</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8E929E] uppercase mb-1">
                  Notes &amp; Internal Record
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Return received via RUN Couriers. Inspected by inventory manager."
                  rows={2}
                  className="w-full py-2 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262930]">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider"
                >
                  Confirm &amp; Record Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
