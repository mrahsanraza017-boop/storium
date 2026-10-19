import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  DollarSign,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';

interface AggregatedCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
  orders: Order[];
}

export const AdminCustomersTab: React.FC = () => {
  const { orders } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<AggregatedCustomer | null>(null);

  // Aggregate customers from real orders
  const customers = useMemo(() => {
    const map = new Map<string, AggregatedCustomer>();

    orders.forEach((o) => {
      // Key by normalized phone or email
      const key = (o.customer.phone || o.customer.email || o.customer.fullName).toLowerCase().trim();
      const existing = map.get(key);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += o.total || 0;
        existing.orders.push(o);
        if (new Date(o.date) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = o.date;
        }
        if (new Date(o.date) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.date;
        }
      } else {
        map.set(key, {
          id: 'cust-' + Math.random().toString(36).substring(2, 8),
          fullName: o.customer.fullName,
          email: o.customer.email,
          phone: o.customer.phone,
          city: o.customer.city,
          address: o.customer.address,
          totalOrders: 1,
          totalSpent: o.total || 0,
          firstOrderDate: o.date,
          lastOrderDate: o.date,
          orders: [o],
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = customers.length;
    const repeatCount = customers.filter((c) => c.totalOrders > 1).length;
    const repeatRate = totalCount > 0 ? Math.round((repeatCount / totalCount) * 100) : 0;
    const totalRev = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    const avgLtv = totalCount > 0 ? Math.round(totalRev / totalCount) : 0;

    // City distribution
    const cityMap: Record<string, number> = {};
    customers.forEach((c) => {
      const city = c.city || 'Unknown';
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    const topCity = Object.entries(cityMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Karachi';

    return { totalCount, repeatRate, avgLtv, topCity };
  }, [customers]);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const q = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customers, searchTerm]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Unique Customers
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#D4AF37]">
            {stats.totalCount}
          </div>
          <span className="text-[11px] text-[#8E929E]">Derived from verified orders</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Repeat Customer Rate
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-emerald-400">
            {stats.repeatRate}%
          </div>
          <span className="text-[11px] text-[#8E929E]">Multi-order brand retention</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Average Lifetime Value (LTV)
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
            Rs. {stats.avgLtv.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#8E929E]">Gross spend per customer</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8E929E] font-semibold">
            Primary Hub
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#D4AF37]">
            {stats.topCity}
          </div>
          <span className="text-[11px] text-[#8E929E]">Highest client concentration</span>
        </div>
      </div>

      {/* Search and Directory Header */}
      <div className="p-4 rounded-2xl bg-[#121316] border border-[#262930] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-bold font-serif-luxury text-[#F5F5F7] text-base">
          Client Directory &amp; Lifetime Records
        </h3>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E929E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, city..."
            className="w-full py-2 pl-9 pr-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="rounded-2xl bg-[#121316] border border-[#262930] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs text-[#E8E8EC]">
          <thead className="bg-[#0B0C0E] border-b border-[#262930] text-[10px] uppercase tracking-wider text-[#8E929E]">
            <tr>
              <th className="p-4">Customer Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Location</th>
              <th className="p-4">Orders Placed</th>
              <th className="p-4">Lifetime Value (LTV)</th>
              <th className="p-4">Last Active</th>
              <th className="p-4 text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262930]">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-[#8E929E]">
                  No customers found in directory.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#181A1F] transition-colors">
                  <td className="p-4">
                    <span className="font-semibold text-[#F5F5F7] text-sm block">
                      {customer.fullName}
                    </span>
                    <span className="text-[10px] text-[#8E929E]">Verified Client</span>
                  </td>
                  <td className="p-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[#E8E8EC]">
                      <Phone className="w-3 h-3 text-[#D4AF37]" />
                      <span className="font-mono">{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#8E929E]">
                      <Mail className="w-3 h-3" />
                      <span>{customer.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-[#E8E8EC]">
                      <MapPin className="w-3 h-3 text-[#8E929E]" />
                      <span>{customer.city}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#181A1F] text-[#F5F5F7] font-mono font-bold text-xs">
                      {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-[#D4AF37] text-sm">
                    Rs. {customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="p-4 font-mono text-[11px] text-[#8E929E]">
                    {new Date(customer.lastOrderDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="px-3 py-1 rounded-lg bg-[#181A1F] hover:bg-[#20232A] text-xs text-[#D4AF37] border border-[#262930] transition-all cursor-pointer"
                    >
                      View History &rarr;
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Profile & Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121316] border border-[#262930] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#262930] pb-3">
              <div>
                <h3 className="font-bold font-serif-luxury text-[#F5F5F7] text-lg">
                  {selectedCustomer.fullName}
                </h3>
                <span className="text-[11px] text-[#8E929E]">
                  Client Portfolio &bull; Lifetime Value: Rs. {selectedCustomer.totalSpent.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-[#8E929E] hover:text-[#F5F5F7] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-[#0B0C0E] border border-[#262930]">
              <div>
                <span className="text-[#8E929E] block">Phone:</span>
                <span className="font-mono text-[#F5F5F7] font-semibold">{selectedCustomer.phone}</span>
              </div>
              <div>
                <span className="text-[#8E929E] block">Email:</span>
                <span className="text-[#F5F5F7]">{selectedCustomer.email}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#8E929E] block">Delivery Address:</span>
                <span className="text-[#F5F5F7]">{selectedCustomer.address}, {selectedCustomer.city}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-[#8E929E]">
                Order History ({selectedCustomer.orders.length})
              </h4>
              <div className="space-y-2">
                {selectedCustomer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-[#0B0C0E] border border-[#262930] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#D4AF37]">
                          #{order.orderNumber}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#181A1F] text-[#8E929E]">
                          {order.orderStatus}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8E929E] block mt-0.5">
                        {new Date(order.date).toLocaleDateString()} &bull; {order.items.length} items
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-[#F5F5F7] block">
                        Rs. {order.total.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-400 uppercase">
                        {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
