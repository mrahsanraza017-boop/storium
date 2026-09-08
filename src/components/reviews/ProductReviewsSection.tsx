import React, { useState } from 'react';
import { MessageSquareQuote } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StarRating } from './StarRating';

interface ProductReviewsSectionProps {
  productId: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ productId }) => {
  const {
    currentUser,
    navigate,
    getReviewsForProduct,
    getProductRatingSummary,
    submitReview,
  } = useStore();

  const reviews = getReviewsForProduct(productId, true);
  const summary = getProductRatingSummary(productId);

  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [city, setCity] = useState(currentUser?.city || '');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const result = submitReview({ productId, rating, title, body, city });
    if (!result.success) {
      setFormError(result.message || 'Could not submit review.');
      return;
    }
    setTitle('');
    setBody('');
    setRating(5);
  };

  return (
    <section className="pt-16 mt-8 border-t border-[#262930]" data-section="product-reviews">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block mb-2">
            Client Reviews
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#F5F5F7]">
            What patrons are saying
          </h2>
        </div>
        {summary.count > 0 && (
          <div className="flex items-center gap-3">
            <StarRating value={summary.average} size="lg" showValue />
            <span className="text-xs text-[#8E929E]">
              based on {summary.count} review{summary.count === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          {reviews.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#121316] border border-[#262930] text-center space-y-2">
              <MessageSquareQuote className="w-8 h-8 text-[#D4AF37] mx-auto opacity-70" />
              <p className="text-sm text-[#8E929E]">No approved reviews yet for this piece.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <article
                key={review.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <StarRating value={review.rating} size="sm" />
                    <h3 className="mt-2 text-sm font-bold text-[#F5F5F7]">{review.title}</h3>
                  </div>
                  {review.verifiedPurchase && (
                    <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#CBD0DC] leading-relaxed">{review.body}</p>
                <div className="flex items-center justify-between text-[11px] text-[#8E929E] pt-1">
                  <span>
                    {review.reviewerName}
                    {review.city ? ` · ${review.city}` : ''}
                  </span>
                  <span>
                    {new Date(review.createdAt).toLocaleDateString('en-PK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="p-6 rounded-2xl bg-[#121316] border border-[#262930] space-y-4 sticky top-24">
            <h3 className="text-base font-bold text-[#F5F5F7] font-serif-luxury">Write a Review</h3>
            {!currentUser ? (
              <div className="space-y-3">
                <p className="text-xs text-[#8E929E] leading-relaxed">
                  Sign in to your STORIUM account to share a review. Approved reviews appear on this product page.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('account')}
                  className="w-full py-3 rounded-xl bg-[#D4AF37] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider"
                >
                  Sign In to Review
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#8E929E] mb-1.5 uppercase tracking-wider">Your Rating</label>
                  <StarRating value={rating} onChange={setRating} readOnly={false} size="lg" />
                </div>
                <div>
                  <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={80}
                    placeholder="Summarize your experience"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">Review</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows={4}
                    maxLength={600}
                    placeholder="Share details about fit, finish, delivery..."
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">City (optional)</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                  />
                </div>
                {formError && <p className="text-rose-400 text-[11px]">{formError}</p>}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider"
                >
                  Submit for Approval
                </button>
                <p className="text-[10px] text-[#626673] leading-relaxed">
                  Reviews are moderated. Once approved by STORIUM, they appear publicly.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
