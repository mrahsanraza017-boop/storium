import React, { useMemo, useState } from 'react';
import { Check, EyeOff, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductReview } from '../../types';
import { StarRating } from '../reviews/StarRating';

export const AdminReviewsTab: React.FC = () => {
  const {
    reviews,
    products,
    updateReviewStatus,
    toggleReviewFeatured,
    deleteReview,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<'all' | ProductReview['status']>('all');

  const filtered = useMemo(() => {
    return reviews
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviews, statusFilter]);

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  const productName = (productId: string) =>
    products.find((p) => p.id === productId)?.name || productId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#F5F5F7]">Product Reviews</h2>
          <p className="text-xs text-[#8E929E] mt-1">
            Approve customer reviews and choose which appear on the homepage.
            {pendingCount > 0 && (
              <span className="text-[#D4AF37]"> {pendingCount} pending approval.</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved', 'hidden'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold ${
                statusFilter === status
                  ? 'bg-[#D4AF37] text-[#0B0C0E]'
                  : 'bg-[#181A1F] text-[#8E929E] border border-[#262930]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#262930] overflow-hidden bg-[#121316]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#E8E8EC]">
            <thead className="bg-[#0B0C0E] border-b border-[#262930] text-[10px] uppercase tracking-wider text-[#8E929E]">
              <tr>
                <th className="p-4">Review</th>
                <th className="p-4">Product</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Status</th>
                <th className="p-4">Homepage</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262930]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#8E929E]">
                    No reviews in this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((review) => (
                  <tr key={review.id} className="hover:bg-[#181A1F]/60">
                    <td className="p-4 max-w-xs">
                      <p className="font-semibold text-[#F5F5F7]">{review.title}</p>
                      <p className="text-[11px] text-[#8E929E] line-clamp-2 mt-1">{review.body}</p>
                      <p className="text-[10px] text-[#626673] mt-1.5">
                        {review.reviewerName}
                        {review.city ? ` · ${review.city}` : ''}
                      </p>
                    </td>
                    <td className="p-4 text-[#CBD0DC] max-w-[160px]">
                      <span className="line-clamp-2">{productName(review.productId)}</span>
                    </td>
                    <td className="p-4">
                      <StarRating value={review.rating} size="sm" />
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          review.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : review.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-[#181A1F] text-[#8E929E]'
                        }`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => toggleReviewFeatured(review.id)}
                        disabled={review.status !== 'approved'}
                        className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-colors disabled:opacity-40 ${
                          review.featuredOnHome
                            ? 'bg-[#D4AF37] text-[#0B0C0E]'
                            : 'bg-[#181A1F] text-[#8E929E] border border-[#262930]'
                        }`}
                      >
                        {review.featuredOnHome ? 'Featured' : 'Feature'}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {review.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => updateReviewStatus(review.id, 'approved')}
                          className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          title="Approve"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {review.status !== 'hidden' && (
                        <button
                          type="button"
                          onClick={() => updateReviewStatus(review.id, 'hidden')}
                          className="p-1.5 rounded-lg bg-[#181A1F] text-[#8E929E] border border-[#262930]"
                          title="Hide"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this review permanently?')) deleteReview(review.id);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
