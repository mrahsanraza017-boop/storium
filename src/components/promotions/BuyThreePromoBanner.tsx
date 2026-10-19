import React from 'react';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

interface BuyThreePromoBannerProps {
  product?: Product;
  className?: string;
}

export const BuyThreePromoBanner: React.FC<BuyThreePromoBannerProps> = ({
  product,
  className = '',
}) => {
  const { businessSettings, watchCount, isBuyThreeEligible, navigate } = useStore();
  const promoConfig = businessSettings.promotions?.buyThreePromo;

  // Only render for watches or general showroom
  if (!promoConfig || !promoConfig.enabled) {
    return null;
  }

  if (product && product.category !== 'watches') {
    return null;
  }

  const discountPercent = promoConfig.discountPercentage || 15;
  const remainingWatches = Math.max(0, (promoConfig.minWatches || 3) - watchCount);

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isBuyThreeEligible
          ? 'bg-gradient-to-r from-emerald-950/40 via-[#121316] to-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
          : 'bg-gradient-to-r from-[#121316] via-[#181A1F] to-[#121316] border-[#D4AF37]/35 shadow-md'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#D4AF37]/15 text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider">
              {promoConfig.bannerTitle || `BUY ANY 3 WATCHES & GET ${discountPercent}% OFF`}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-extrabold uppercase">
              {discountPercent}% OFF
            </span>
          </div>

          <p className="text-xs text-[#CBD0DC]">
            {isBuyThreeEligible ? (
              <span className="text-emerald-300 font-medium">
                ✓ Offer unlocked! 15% discount will be calculated automatically at checkout.
              </span>
            ) : (
              <span>
                Add {remainingWatches} more {remainingWatches === 1 ? 'watch' : 'watches'} to your bag to receive an instant {discountPercent}% discount on all watches.
              </span>
            )}
          </p>
        </div>

        {!isBuyThreeEligible && (
          <button
            type="button"
            onClick={() => navigate('watches')}
            className="px-3.5 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Explore Trio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Progress Line */}
      <div className="mt-3 pt-3 border-t border-[#262930] flex items-center gap-3">
        <div className="flex-1 bg-[#0B0C0E] h-1.5 rounded-full overflow-hidden border border-[#262930]/60">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isBuyThreeEligible
                ? 'bg-gradient-to-r from-[#D4AF37] to-emerald-400'
                : 'bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37]'
            }`}
            style={{ width: `${Math.min(100, (watchCount / 3) * 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-[#8E929E] font-mono shrink-0">
          {watchCount >= 3 ? '3/3 Unlocked' : `${watchCount}/3 in bag`}
        </span>
      </div>
    </div>
  );
};
