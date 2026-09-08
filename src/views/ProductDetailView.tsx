import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  ShoppingBag,
  Shield,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  Sparkles,
  Share2,
  Watch,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductGallery } from '../components/product/ProductGallery';
import { ProductGrid } from '../components/product/ProductGrid';
import { MotionReveal } from '../components/animation/MotionReveal';
import { ProductReviewsSection } from '../components/reviews/ProductReviewsSection';
import { StarRating } from '../components/reviews/StarRating';

import { SEOHead } from '../components/seo/SEOHead';
import { getProductSchema, getBreadcrumbSchema } from '../lib/seoSchemas';

export const ProductDetailView: React.FC = () => {
  const {
    selectedSlug,
    getProductBySlug,
    products,
    addToCart,
    toggleWishlist,
    isInWishlist,
    navigate,
    getProductRatingSummary,
    getReviewsForProduct,
    addToast,
  } = useStore();

  const product = getProductBySlug(selectedSlug || '') || products[0];
  const ratingSummary = product ? getProductRatingSummary(product.id) : { average: 0, count: 0 };
  const productReviews = product ? getReviewsForProduct(product.id) : [];
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'specs' | 'features' | 'shipping' | 'warranty'>('specs');

  if (!product) {
    return (
      <div className="py-32 text-center bg-transparent text-[#E8E8EC]">
        <h2 className="text-2xl font-bold font-serif-luxury">Timepiece Not Found</h2>
        <button
          onClick={() => navigate('watches')}
          className="mt-4 px-6 py-2 rounded-xl bg-[#D4AF37] text-[#0B0C0E] font-bold text-xs uppercase"
        >
          Return to Showroom
        </button>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const price = product.salePrice ?? product.price;

  const handleSelectVariant = (name: string, option: string) => {
    setSelectedVariants((prev) => ({ ...prev, [name]: option }));
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariants);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariants);
    navigate('checkout');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('success', 'Link Copied', 'Product link copied to clipboard.');
    }
  };

  // Related products
  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const breadcrumbs = [
    { name: 'Showroom', url: '/' },
    {
      name: product.categoryName || (product.category === 'watches' ? 'Watches' : "Men's Accessories"),
      url: product.category === 'watches' ? '/watches' : '/accessories',
    },
    { name: product.name, url: `/product/${product.slug}` },
  ];

  const schemas = [
    getBreadcrumbSchema(breadcrumbs),
    getProductSchema(product, productReviews, ratingSummary),
  ];

  const metaTitle = product.seoTitle || `${product.name} — Luxury ${product.categoryName || 'Horology'} | STORIUM Pakistan`;
  const metaDescription = product.seoDescription || `${product.name}. ${product.shortDescription || product.description.slice(0, 150)} Includes 2-Year International Warranty and express COD across Pakistan.`;

  return (
    <div className="w-full bg-transparent min-h-screen text-[#E8E8EC] py-8 sm:py-12">
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        keywords={`${product.name}, ${product.brand}, ${product.categoryName}, buy ${product.name} pakistan, luxury watch ${product.sku}`}
        canonicalPath={`/product/${product.slug}`}
        ogImage={product.thumbnail || (product.productImages && product.productImages[0])}
        ogType="product"
        priceAmount={price}
        priceCurrency="PKR"
        availability={product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}
        schemas={schemas}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#8E929E] mb-8 overflow-x-auto scrollbar-none">
          <button onClick={() => navigate('home')} className="hover:text-[#F5F5F7] transition-colors">
            Showroom
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button
            onClick={() => navigate('shop', { category: product.category })}
            className="hover:text-[#F5F5F7] transition-colors uppercase tracking-wider"
          >
            {product.categoryName}
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#D4AF37] font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pb-16 border-b border-[#262930]">
          {/* Left Column: Gallery (Reusable component with zoom & lightbox) */}
          <MotionReveal direction="left" className="lg:col-span-7">
            <ProductGallery images={product.productImages} media={product.media} productName={product.name} />
          </MotionReveal>

          {/* Right Column: Information & Actions */}
          <MotionReveal direction="right" className="lg:col-span-5 flex flex-col justify-between space-y-6 glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl" delay={0.08}>
            <div className="space-y-4">
              {/* Header Badges & SKU */}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                  {product.brand}
                </span>
                <span className="text-xs font-mono text-[#CBD0DC] bg-[#181A1F] px-2.5 py-1 rounded border border-white/10">
                  SKU: {product.sku}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-bold text-white font-serif-luxury leading-tight gold-glow-subtle">
                {product.name}
              </h1>

              {ratingSummary.count > 0 && (
                <div className="flex items-center gap-2.5">
                  <StarRating value={ratingSummary.average} size="sm" showValue />
                  <span className="text-xs text-[#8E929E]">
                    {ratingSummary.count} review{ratingSummary.count === 1 ? '' : 's'}
                  </span>
                </div>
              )}

              {/* Pricing in PKR */}
              <div className="flex items-baseline gap-4 pt-1">
                {product.salePrice ? (
                  <>
                    <span className="text-3xl font-extrabold text-white tracking-tight gold-glow-subtle">
                      Rs. {product.salePrice.toLocaleString()}
                    </span>
                    <span className="text-base text-[#8E929E] line-through">
                      Rs. {product.price.toLocaleString()}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 font-bold uppercase tracking-wider">
                      Save Rs. {(product.price - product.salePrice).toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-extrabold text-white tracking-tight gold-glow-subtle">
                    Rs. {product.price.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Stock status indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${product.stockQuantity > 5
                    ? 'bg-emerald-400'
                    : product.stockQuantity > 0
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                    }`}
                />
                <span className="text-[#E8E8EC] font-medium">
                  {product.stockQuantity > 0
                    ? `Available in Pakistan Warehouse (${product.stockQuantity} units remaining)`
                    : 'Currently on Backorder'}
                </span>
              </div>

              {/* Short Description */}
              <p className="text-sm sm:text-base text-[#D1D5E0] leading-relaxed pt-2 luxury-text-shadow">
                {product.description}
              </p>

              {/* Variants Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-4 pt-3 border-t border-[#262930]">
                  {product.variants.map((v) => (
                    <div key={v.name} className="space-y-2">
                      <span className="text-xs uppercase tracking-wider text-[#8E929E] font-medium block">
                        Select {v.name}:
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {v.options.map((opt) => {
                          const isSelected =
                            selectedVariants[v.name] === opt ||
                            (!selectedVariants[v.name] && opt === v.options[0]);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectVariant(v.name, opt)}
                              className={`px-3.5 py-2 text-xs rounded-xl border transition-all ${isSelected
                                ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F5F5F7] font-semibold ring-1 ring-[#D4AF37]/30'
                                : 'border-[#262930] bg-[#121316] text-[#9Ea2AF] hover:border-white/20'
                                }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 pt-3">
                <span className="text-xs uppercase tracking-wider text-[#8E929E]">Quantity:</span>
                <div className="flex items-center rounded-xl border border-[#262930] bg-[#121316]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-sm text-[#8E929E] hover:text-[#F5F5F7] transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 text-sm font-semibold text-[#F5F5F7] min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3.5 py-2 text-sm text-[#8E929E] hover:text-[#F5F5F7] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* CTAs: Add to Cart, Buy Now, Wishlist */}
            <div className="space-y-3 pt-6 border-t border-[#262930]">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-4 px-6 rounded-xl bg-[#181A1F] hover:bg-[#22252C] text-xs sm:text-sm uppercase tracking-wider font-bold text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/50 shadow-md transition-all flex items-center justify-center gap-2 group"
                >
                  <ShoppingBag className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  <span>Add to Luxury Bag</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-4 rounded-xl border transition-all ${inWishlist
                    ? 'bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37]'
                    : 'bg-[#181A1F] text-[#E8E8EC] border-[#262930] hover:text-[#D4AF37]'
                    }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-4 rounded-xl bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] transition-colors"
                  aria-label="Share Timepiece"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Prominent BUY NOW Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C378] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs sm:text-sm uppercase tracking-[0.2em] font-extrabold shadow-[0_10px_25px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <span>BUY NOW &bull; Rs. {(price * quantity).toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Value Props */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#262930] text-center text-[11px] text-[#8E929E]">
                <div className="p-2.5 rounded-lg bg-[#121316] border border-[#262930]/50">
                  <Truck className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                  <span>Nationwide COD</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#121316] border border-[#262930]/50">
                  <Shield className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                  <span>2-Year Warranty</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#121316] border border-[#262930]/50">
                  <RotateCcw className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                  <span>7-Day Return</span>
                </div>
              </div>
            </div>
          </MotionReveal>
        </div>

        {/* Detailed Information Tabs */}
        <div className="py-14 border-b border-[#262930]">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-3 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'specs'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
                }`}
            >
              Technical Specifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'features'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
                }`}
            >
              <span>Key Features</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${activeTab === 'features' ? 'bg-[#0B0C0E]/20 text-[#0B0C0E]' : 'bg-[#181A1F] text-[#8E929E]'
                  }`}
              >
                {product.features.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'shipping'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
                }`}
            >
              Pakistan Delivery &amp; COD
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('warranty')}
              className={`px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${activeTab === 'warranty'
                ? 'bg-[#D4AF37] text-[#0B0C0E] border border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'bg-[#121316] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/40 hover:bg-[#181A1F]'
                }`}
            >
              Warranty &amp; Returns
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="pt-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-4 rounded-xl bg-[#121316] border border-[#262930] flex items-center justify-between"
                    >
                      <span className="text-xs uppercase tracking-wider text-[#8E929E] font-medium">
                        {key}
                      </span>
                      <span className="text-xs font-semibold text-[#F5F5F7] text-right ml-4">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-3 max-w-3xl">
                  {product.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#121316] border border-[#262930] flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm text-[#E8E8EC]">{feature}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="max-w-3xl space-y-4 text-sm text-[#9Ea2AF] leading-relaxed">
                  <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
                    <h4 className="text-base font-bold text-[#F5F5F7]">
                      Nationwide Courier Across Pakistan
                    </h4>
                    <p>
                      All STORIUM orders are dispatched within 24 hours via premier express couriers with full transit insurance. Delivery times:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#E8E8EC]">
                      <li><strong>Karachi &amp; Lahore:</strong> 1 - 2 business days</li>
                      <li><strong>Islamabad &amp; Rawalpindi:</strong> 1 - 2 business days</li>
                      <li><strong>Faisalabad, Multan, Peshawar, Sialkot:</strong> 2 - 3 business days</li>
                      <li><strong>All other Pakistan cities &amp; towns:</strong> 3 - 4 business days</li>
                    </ul>
                    <p className="pt-2 text-xs text-[#D4AF37]">
                      Orders over Rs. 15,000 qualify for complimentary insured shipping. Cash on Delivery (COD) is available nationwide with no surcharge.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'warranty' && (
                <div className="max-w-3xl space-y-4 text-sm text-[#9Ea2AF] leading-relaxed">
                  <div className="p-5 rounded-2xl bg-[#121316] border border-[#262930] space-y-3">
                    <h4 className="text-base font-bold text-[#F5F5F7]">
                      2-Year STORIUM International Guarantee
                    </h4>
                    <p>
                      Each timepiece is guaranteed against movement manufacturing defects for a period of twenty-four (24) months from the purchase date. The guarantee covers movement timing accuracy, mechanical escapement, and dial assembly.
                    </p>
                    <h4 className="text-base font-bold text-[#F5F5F7] pt-2">
                      7-Day Inspection Guarantee
                    </h4>
                    <p>
                      If the timepiece does not exceed your expectations upon unboxing, notify our concierge within 7 days for a hassle-free exchange or full refund.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="py-14">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block mb-1">
                  Complementary Pieces
                </span>
                <h3 className="text-2xl font-bold text-[#F5F5F7] font-serif-luxury">
                  Related Horological Creations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('watches')}
                className="text-xs uppercase tracking-wider text-[#D4AF37] hover:underline"
              >
                View All
              </button>
            </div>

            <ProductGrid products={relatedProducts} columns="4" />
          </div>
        )}

        <ProductReviewsSection productId={product.id} />
      </div>
    </div>
  );
};
