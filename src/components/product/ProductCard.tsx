import React, { useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Eye, ShoppingBag, Heart, Check, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { ProductMediaFrame } from './ProductMediaFrame';
import { StarRating } from '../reviews/StarRating';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const { navigate, addToCart, toggleWishlist, isInWishlist, openQuickView, getProductRatingSummary } = useStore();
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [isAddedRecently, setIsAddedRecently] = useState(false);
  const media = product.media?.length
    ? product.media.slice(0, 3)
    : [{ url: product.thumbnail, type: 'image' as const }];
  const [mediaIndex, setMediaIndex] = useState(0);
  const inWishlist = isInWishlist(product.id);
  const ratingSummary = getProductRatingSummary(product.id);

  // 3D Tilt calculation (GPU-friendly, purposed micro-interaction)
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -4;
    const tiltY = ((x - centerX) / centerX) * 4;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1600);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickView(product);
  };

  useEffect(() => {
    if (media.length < 2 || prefersReducedMotion || isHovered) return;
    const timer = window.setInterval(() => {
      setMediaIndex((index) => (index + 1) % media.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [media.length, prefersReducedMotion, isHovered]);

  return (
    <motion.div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate('product', { slug: product.slug })}
      className="group relative cursor-pointer flex flex-col h-full bg-[#121316] border border-[#262930] hover:border-[#D4AF37]/40 rounded-xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
      style={{
        transform: prefersReducedMotion
          ? undefined
          : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: prefersReducedMotion
          ? 'border-color 0.3s ease'
          : isHovered
            ? 'transform 0.1s ease-out, border-color 0.3s ease'
            : 'transform 0.5s ease-out, border-color 0.3s ease',
      }}
      data-product-card={product.id}
    >
      {/* Top badges */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
        {product.isNew && (
          <span className="px-2.5 py-0.5 text-[10px] tracking-widest uppercase font-semibold bg-[#D4AF37] text-[#0B0C0E] rounded-sm shadow-md">
            New Arrival
          </span>
        )}
        {product.salePrice && (
          <span className="px-2.5 py-0.5 text-[10px] tracking-widest uppercase font-medium bg-[#1E2026] text-[#E5C378] border border-[#D4AF37]/30 rounded-sm backdrop-blur-md">
            Special Offer
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        type="button"
        onClick={handleWishlistClick}
        aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${inWishlist
          ? 'bg-[#D4AF37] text-[#0B0C0E] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
          : 'bg-[#0B0C0E]/70 text-[#E8E8EC] hover:text-[#D4AF37] hover:bg-[#0B0C0E] backdrop-blur-md border border-white/10'
          }`}
      >
        <motion.div
          animate={inWishlist ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
        </motion.div>
      </button>

      {/* Image Container with Smooth Transition */}
      <div className="relative aspect-square w-full bg-[#0B0C0E] overflow-hidden">
        <div
          className="absolute inset-0 flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${mediaIndex * 100}%)` }}
        >
          {media.map((item) => (
            <button
              key={item.url}
              type="button"
              onClick={(event) => { event.stopPropagation(); openQuickView(product); }}
              className="h-full min-w-full cursor-zoom-in"
              aria-label={`Inspect ${product.name} media`}
            >
              <ProductMediaFrame media={item} priority={priority} className="h-full w-full object-cover object-center" />
            </button>
          ))}
        </div>

        {/* Ambient Dark/Gold Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Action Overlay Toolbar (Quick View & Quick Add) */}
        <div
          className={`absolute bottom-3 inset-x-3 z-20 flex gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
        >
          <button
            type="button"
            onClick={handleQuickViewClick}
            aria-label={`Quick view of ${product.name}`}
            className="flex-1 py-2 px-3 bg-[#181A1F]/90 hover:bg-[#20232A] text-xs uppercase tracking-wider text-[#E8E8EC] font-medium rounded-lg border border-white/10 backdrop-blur-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Quick View</span>
          </button>

          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Add ${product.name} to shopping bag`}
            className={`p-2 rounded-lg border transition-all duration-300 flex items-center justify-center cursor-pointer ${isAddedRecently
              ? 'bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37]'
              : 'bg-[#D4AF37]/90 hover:bg-[#D4AF37] text-[#0B0C0E] border-[#D4AF37]'
              }`}
            title="Add to Shopping Bag"
          >
            {isAddedRecently ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-[#CBD0DC] mb-1.5">
            <span className="truncate">{product.brand}</span>
            <span className="text-[#D4AF37] font-mono text-[10px]">{product.sku}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-sm sm:text-base font-semibold text-[#F5F5F7] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
            {product.name}
          </h3>

          {ratingSummary.count > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <StarRating value={ratingSummary.average} size="sm" />
              <span className="text-[10px] text-[#CBD0DC] tabular-nums">
                {ratingSummary.average.toFixed(1)} ({ratingSummary.count})
              </span>
            </div>
          )}

          {/* Short specification highlights */}
          <p className="mt-1 text-xs text-[#CBD0DC] line-clamp-1 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing & Stock Status */}
        <div className="pt-2 border-t border-[#262930] flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {product.salePrice ? (
              <>
                <span className="text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight">
                  Rs. {product.salePrice.toLocaleString()}
                </span>
                <span className="text-xs text-[#8E929E] line-through">
                  Rs. {product.price.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight">
                Rs. {product.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Subtle Stock indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#CBD0DC]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${product.stockQuantity > 5
                ? 'bg-emerald-400'
                : product.stockQuantity > 0
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
                }`}
            />
            <span>{product.stockQuantity > 0 ? 'In Stock' : 'Pre-Order'}</span>
          </div>
        </div>
      </div>

      {/* Subtle gold bottom accent line on hover */}
      <div className="h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition-all duration-500" />
    </motion.div>
  );
};
