import React, { useState } from 'react';
import { MessageSquareQuote, Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StarRating } from './StarRating';
import { uploadReviewImage } from '../../services/supabaseService';

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
    addToast,
  } = useStore();

  const reviews = getReviewsForProduct(productId, true);
  const summary = getProductRatingSummary(productId);

  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [city, setCity] = useState(currentUser?.city || '');
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formError, setFormError] = useState('');
  const [previewLightbox, setPreviewLightbox] = useState<string | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      addToast('error', 'Image Limit', 'You can upload up to 4 photos per review.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map((f) => uploadReviewImage(f));
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 4));
      addToast('success', 'Photos Added', `${files.length} photo(s) compressed & attached.`);
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message || 'Could not process images.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const result = submitReview({ productId, rating, title, body, city, images, reviewType: 'product' });
    if (!result.success) {
      setFormError(result.message || 'Could not submit review.');
      return;
    }
    setTitle('');
    setBody('');
    setImages([]);
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
                      Verified Purchase
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#CBD0DC] leading-relaxed">{review.body}</p>

                {/* Review Photos Gallery */}
                {review.images && review.images.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    {review.images.map((imgUrl, imgIdx) => (
                      <button
                        key={imgIdx}
                        type="button"
                        onClick={() => setPreviewLightbox(imgUrl)}
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#262930] hover:border-[#D4AF37] transition-all group cursor-pointer bg-[#0B0C0E]"
                      >
                        <img
                          src={imgUrl}
                          alt={`Review photo ${imgIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </button>
                    ))}
                  </div>
                )}

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
                  Sign in to your STORIUM account to share a review with wrist-shots and pictures. Approved reviews appear on this product page.
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
                  <span id="review-rating-label" className="block text-[#8E929E] mb-1.5 uppercase tracking-wider">Your Rating</span>
                  <StarRating value={rating} onChange={setRating} readOnly={false} size="lg" />
                </div>
                <div>
                  <label htmlFor="review-title-input" className="block text-[#8E929E] mb-1 uppercase tracking-wider">Title / Headline</label>
                  <input
                    id="review-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={80}
                    placeholder="Summarize your experience (e.g. Masterpiece on wrist)"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label htmlFor="review-body-input" className="block text-[#8E929E] mb-1 uppercase tracking-wider">Review</label>
                  <textarea
                    id="review-body-input"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows={4}
                    maxLength={600}
                    placeholder="Share details about finishing, bezel, dial details, packaging..."
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label htmlFor="review-city-input" className="block text-[#8E929E] mb-1 uppercase tracking-wider">City (optional)</label>
                  <input
                    id="review-city-input"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore, Karachi, Islamabad"
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B0C0E] border border-[#262930] text-[#F5F5F7]"
                  />
                </div>

                {/* Photo Upload Zone */}
                <div>
                  <label className="block text-[#8E929E] mb-1 uppercase tracking-wider">
                    Add Photos (Wrist shots / Unboxing)
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#D4AF37]/40 bg-[#0B0C0E]">
                        <img src={img} alt="Upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-black/80 text-white rounded-full hover:bg-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {images.length < 4 && (
                      <label className="w-14 h-14 rounded-lg border border-dashed border-[#3A3E48] hover:border-[#D4AF37] flex flex-col items-center justify-center text-[#8E929E] hover:text-[#D4AF37] cursor-pointer transition-colors bg-[#0B0C0E]/60">
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                        ) : (
                          <>
                            <Camera className="w-4 h-4" />
                            <span className="text-[9px] mt-0.5">Photo</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={isUploadingImage}
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <span className="text-[10px] text-[#8E929E]">Up to 4 pictures. Automatically optimized.</span>
                </div>

                {formError && <p className="text-rose-400 text-[11px]">{formError}</p>}
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50"
                >
                  Submit for Approval
                </button>
                <p className="text-[10px] text-[#626673] leading-relaxed">
                  Reviews with authentic wrist-shots receive priority showroom moderation.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewLightbox && (
        <div
          onClick={() => setPreviewLightbox(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={previewLightbox}
              alt="Review picture enlarged"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-[#262930] shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewLightbox(null)}
              className="absolute -top-3 -right-3 p-2 bg-[#121316] text-[#CBD0DC] hover:text-white rounded-full border border-[#262930] shadow-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
