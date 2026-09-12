import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Mail,
  Phone,
  Clock,
  Database,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ContactInquiry } from '../../types';

export const AdminInquiriesTab: React.FC = () => {
  const { inquiries, updateInquiryStatus } = useStore();
  const [search, setSearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);

  const filtered = inquiries.filter((inq) => {
    const q = search.toLowerCase();
    return (
      inq.name.toLowerCase().includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      (inq.phone && inq.phone.toLowerCase().includes(q)) ||
      inq.topic.toLowerCase().includes(q) ||
      inq.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E929E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inquiries by name, email, or message..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-[#121316] border border-[#262930] text-xs text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8E929E]">
          <span className="font-mono text-[#D4AF37] font-semibold">{inquiries.length}</span> Total Inquiries
          &bull;{' '}
          <span className="font-mono text-emerald-400 font-semibold">
            {inquiries.filter((i) => i.supabaseSynced).length}
          </span>{' '}
          Saved to Supabase
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#121316] border border-[#262930] overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs text-[#E8E8EC]">
          <thead className="bg-[#0B0C0E] border-b border-[#262930] text-[10px] uppercase tracking-wider text-[#8E929E]">
            <tr>
              <th className="p-4">Client</th>
              <th className="p-4">Topic</th>
              <th className="p-4">Message Snippet</th>
              <th className="p-4">Date</th>
              <th className="p-4">Supabase Backend</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262930]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#8E929E]">
                  No client inquiries found matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map((inq) => (
                <tr key={inq.id} className="hover:bg-[#181A1F] transition-colors">
                  <td className="p-4">
                    <span className="font-semibold text-[#F5F5F7] block">{inq.name}</span>
                    <div className="flex items-center gap-2 text-[11px] text-[#8E929E] mt-0.5">
                      <span>{inq.email}</span>
                      {inq.phone && <span>&bull; {inq.phone}</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-[#181A1F] text-[#D4AF37] border border-[#262930] text-[11px] font-medium whitespace-nowrap">
                      {inq.topic}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs truncate text-[#A0A5B5]">{inq.message}</td>
                  <td className="p-4 text-[#8E929E] whitespace-nowrap font-mono text-[11px]">
                    {new Date(inq.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {inq.supabaseSynced ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        <Database className="w-2.5 h-2.5" /> Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#1C1D22] text-[#8E929E] border border-[#262930]">
                        Local
                      </span>
                    )}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <select
                      value={inq.status}
                      onChange={(event) => updateInquiryStatus(inq.id, event.target.value as ContactInquiry['status'])}
                      className="rounded-lg border border-[#262930] bg-[#0B0C0E] px-2 py-1 text-[11px] text-[#F5F5F7] focus:border-[#D4AF37] focus:outline-none"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="responded">Responded</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedInquiry(inq)}
                      className="py-1 px-3 rounded-lg bg-[#181A1F] hover:bg-[#20232A] text-xs font-semibold text-[#D4AF37] border border-[#262930] transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#121316] border border-[#262930] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262930] pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#D4AF37]">
                  Client Inquiry
                </span>
                <h3 className="text-lg font-bold text-[#F5F5F7] font-serif-luxury">
                  {selectedInquiry.topic}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930]"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#262930] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#8E929E]">Client Name:</span>
                  <span className="font-semibold text-[#F5F5F7]">{selectedInquiry.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E929E]">Email:</span>
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="text-[#D4AF37] hover:underline"
                  >
                    {selectedInquiry.email}
                  </a>
                </div>
                {selectedInquiry.phone && (
                  <div className="flex justify-between">
                    <span className="text-[#8E929E]">Phone / WhatsApp:</span>
                    <a
                      href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#D4AF37] hover:underline"
                    >
                      {selectedInquiry.phone}
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#8E929E]">Timestamp:</span>
                  <span className="font-mono text-[#8E929E]">
                    {new Date(selectedInquiry.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#262930]">
                  <span className="text-[#8E929E]">Supabase Cloud Sync:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {selectedInquiry.supabaseSynced ? 'Persisted in contacts table' : 'Local Showroom Cache'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[#8E929E] uppercase tracking-wider block">Message:</span>
                <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7] leading-relaxed whitespace-pre-wrap">
                  {selectedInquiry.message}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href={`mailto:${selectedInquiry.email}?subject=RE: STORIUM Concierge - ${selectedInquiry.topic}`}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider text-center transition-colors"
                >
                  Reply via Email
                </a>
                {selectedInquiry.phone && (
                  <a
                    href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-[#F5F5F7] text-xs font-bold uppercase tracking-wider text-center border border-[#262930] transition-colors"
                  >
                    Open WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
