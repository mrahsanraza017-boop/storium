import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Copy, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface SaleBannerProps {
  className?: string;
  variant?: 'topbar' | 'section';
}

export const SaleBanner: React.FC<SaleBannerProps> = ({ className = '', variant = 'topbar' }) => {
  const { businessSettings, navigate, addToast } = useStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const bannerConfig = businessSettings.promotions?.saleBanner;

  if (!bannerConfig || !bannerConfig.enabled || isDismissed) {
    return null;
  }

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bannerConfig.couponCode && navigator.clipboard) {
      navigator.clipboard.writeText(bannerConfig.couponCode);
      setCopied(true);
      addToast('success', 'Promo Code Copied', `Use code "${bannerConfig.couponCode}" at checkout!`);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCtaClick = () => {
    navigate(bannerConfig.ctaTarget || 'watches');
  };

  if (variant === 'section') {
    return (
      <div className={`relative overflow-hidden rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#121316] via-[#1a1c22] to-[#121316] p-6 sm:p-10 shadow-2xl ${className}`}>
        {/* Ambient gold glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#D4AF37]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-extrabold uppercase tracking-[0.2em]">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>{bannerConfig.badgeText || 'Exclusive Showcase'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#F5F5F7] tracking-tight">
              {bannerConfig.announcementText}
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD0DC] leading-relaxed">
              {bannerConfig.highlightText}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            {bannerConfig.couponCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-3 rounded-xl border border-dashed border-[#D4AF37]/60 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>CODE: {bannerConfig.couponCode}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleCtaClick}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs uppercase font-extrabold tracking-[0.18em] shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <span>{bannerConfig.ctaText || 'Claim Offer'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default Top Bar banner
  return (
    <div className={`relative bg-gradient-to-r from-[#181A1F] via-[#22252C] to-[#181A1F] border-b border-[#D4AF37]/30 text-center py-2 px-4 shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex-1 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-extrabold uppercase tracking-widest border border-[#D4AF37]/30">
            <Sparkles className="w-3 h-3 text-[#D4AF37] animate-pulse" />
            <span>{bannerConfig.badgeText || 'Special Event'}</span>
          </span>

          <span className="text-[#F5F5F7] font-medium tracking-wide text-[11px] sm:text-xs">
            {bannerConfig.announcementText}
          </span>

          <button
            type="button"
            onClick={handleCtaClick}
            className="text-[#D4AF37] hover:text-[#E5C378] font-bold underline underline-offset-4 decoration-[#D4AF37]/60 text-[11px] sm:text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <span>{bannerConfig.ctaText || 'Shop Collection'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-[#8E929E] hover:text-white transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer shrink-0"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
