import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CustomPageSection, PageView } from '../../types';
import { useStore } from '../../context/StoreContext';

interface CustomSectionsRendererProps {
  sections?: CustomPageSection[];
  className?: string;
}

export const CustomSectionsRenderer: React.FC<CustomSectionsRendererProps> = ({
  sections,
  className = '',
}) => {
  const { navigate } = useStore();

  if (!sections || sections.length === 0) return null;

  const activeSections = sections.filter((s) => s.enabled);
  if (activeSections.length === 0) return null;

  return (
    <div className={`space-y-16 w-full ${className}`}>
      {activeSections.map((sec) => {
        const layout = sec.layout || 'card';

        const handleCta = () => {
          if (!sec.ctaTarget) return;
          navigate(sec.ctaTarget as PageView);
        };

        const paragraphs = sec.content
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);

        if (layout === 'banner') {
          return (
            <section
              key={sec.id}
              className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#121316] via-[#181a20] to-[#121316] p-8 sm:p-14 shadow-2xl"
            >
              {sec.image && (
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                  <img
                    src={sec.image}
                    alt={sec.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-[#0B0C0E]/70" />
                </div>
              )}
              <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                {sec.badge && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-extrabold uppercase tracking-[0.2em]">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    <span>{sec.badge}</span>
                  </div>
                )}
                {sec.subtitle && (
                  <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
                    {sec.subtitle}
                  </span>
                )}
                <h2 className="text-3xl sm:text-5xl font-bold font-serif-luxury text-white gold-glow-heading leading-tight">
                  {sec.title}
                </h2>
                <div className="space-y-4 max-w-2xl mx-auto text-sm sm:text-base text-[#D1D5E0] leading-relaxed luxury-text-shadow">
                  {paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
                {sec.ctaText && (
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={handleCta}
                      className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs uppercase tracking-[0.2em] font-bold shadow-lg transition-all flex items-center gap-2 group cursor-pointer"
                    >
                      <span>{sec.ctaText}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (layout === 'split') {
          const isImageLeft = sec.imagePosition === 'left';
          return (
            <section
              key={sec.id}
              className="p-8 sm:p-12 rounded-3xl glass-panel relative overflow-hidden border border-[#262930] hover:border-[#D4AF37]/30 transition-colors shadow-2xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {sec.image && (
                  <div
                    className={`lg:col-span-6 flex justify-center ${
                      isImageLeft ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-[#0B0C0E] border border-white/10 shadow-2xl group">
                      <img
                        src={sec.image}
                        alt={sec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E]/60 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </div>
                )}

                <div
                  className={`${
                    sec.image ? 'lg:col-span-6' : 'lg:col-span-12'
                  } space-y-6 ${isImageLeft ? 'lg:order-2' : 'lg:order-1'}`}
                >
                  {sec.badge && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em]">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      <span>{sec.badge}</span>
                    </div>
                  )}
                  {sec.subtitle && (
                    <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
                      {sec.subtitle}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-4xl font-bold font-serif-luxury text-white gold-glow-subtle leading-snug">
                    {sec.title}
                  </h2>
                  <div className="space-y-4 text-sm sm:text-base text-[#D1D5E0] leading-relaxed luxury-text-shadow">
                    {paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                  {sec.ctaText && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCta}
                        className="py-3 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 group cursor-pointer shadow-md"
                      >
                        <span>{sec.ctaText}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        }

        if (layout === 'centered') {
          return (
            <section
              key={sec.id}
              className="py-12 bg-transparent text-center max-w-4xl mx-auto px-4"
            >
              <div className="p-8 sm:p-12 rounded-3xl glass-panel space-y-6 relative overflow-hidden border border-[#262930] hover:border-[#D4AF37]/30 transition-colors shadow-2xl">
                {sec.badge && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em]">
                    <span>{sec.badge}</span>
                  </div>
                )}
                {sec.subtitle && (
                  <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
                    {sec.subtitle}
                  </span>
                )}
                <h2 className="text-2xl sm:text-4xl font-bold font-serif-luxury text-white gold-glow-heading">
                  {sec.title}
                </h2>
                <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto" />
                <div className="space-y-4 text-sm sm:text-base text-[#D1D5E0] leading-relaxed max-w-2xl mx-auto luxury-text-shadow">
                  {paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
                {sec.image && (
                  <div className="pt-4 flex justify-center">
                    <img
                      src={sec.image}
                      alt={sec.title}
                      className="max-h-72 rounded-2xl object-cover border border-white/10 shadow-xl"
                      loading="lazy"
                    />
                  </div>
                )}
                {sec.ctaText && (
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={handleCta}
                      className="py-3 px-8 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 group cursor-pointer shadow-md"
                    >
                      <span>{sec.ctaText}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          );
        }

        // Default 'card' layout
        return (
          <section
            key={sec.id}
            className="p-8 sm:p-10 rounded-3xl glass-panel space-y-6 relative overflow-hidden border border-[#262930] hover:border-[#D4AF37]/40 transition-colors shadow-2xl"
          >
            {sec.badge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>{sec.badge}</span>
              </div>
            )}
            {sec.subtitle && (
              <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
                {sec.subtitle}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-white gold-glow-subtle">
              {sec.title}
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-[#D1D5E0] leading-relaxed luxury-text-shadow">
              {paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
            {sec.image && (
              <div className="pt-2">
                <img
                  src={sec.image}
                  alt={sec.title}
                  className="max-h-80 w-full object-cover rounded-2xl border border-white/10 shadow-lg"
                  loading="lazy"
                />
              </div>
            )}
            {sec.ctaText && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCta}
                  className="py-3 px-6 rounded-xl bg-[#181A1F] hover:bg-[#20232A] text-white hover:text-[#D4AF37] text-xs font-semibold uppercase tracking-wider border border-[#262930] hover:border-[#D4AF37]/50 transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span>{sec.ctaText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

