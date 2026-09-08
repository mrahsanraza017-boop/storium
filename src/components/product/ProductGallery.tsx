import React, { useState, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Maximize2, X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { ProductMedia } from '../../types';
import { ProductMediaFrame } from './ProductMediaFrame';

interface ProductGalleryProps {
  images: string[];
  media?: ProductMedia[];
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, media, productName }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const displayMedia: ProductMedia[] = media?.length
    ? media.slice(0, 3)
    : (images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1200&auto=format&fit=crop']).map((url) => ({ url, type: 'image' as const }));
  const currentMedia = displayMedia[activeIdx] || displayMedia[0];

  React.useEffect(() => {
    if (!isAutoPlaying || displayMedia.length < 2 || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev === displayMedia.length - 1 ? 0 : prev + 1));
    }, 2800);
    return () => window.clearInterval(timer);
  }, [displayMedia.length, isAutoPlaying, prefersReducedMotion]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? displayMedia.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIdx((prev) => (prev === displayMedia.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Frame with Zoom Effect */}
      <div
        ref={imageContainerRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
        className="relative aspect-square w-full rounded-2xl bg-[#121316] border border-[#262930] overflow-hidden group cursor-crosshair select-none"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentMedia.url}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: isZooming && !prefersReducedMotion ? 1.8 : 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
            style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
          >
            <ProductMediaFrame media={currentMedia} className="w-full h-full object-cover object-center" />
          </motion.div>
        </AnimatePresence>

        {/* Ambient Dark/Gold Vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E]/50 via-transparent to-transparent pointer-events-none" />

        {/* Lightbox Trigger Button */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute bottom-4 right-4 p-2.5 rounded-lg bg-[#0B0C0E]/80 text-[#E8E8EC] hover:text-[#D4AF37] hover:bg-[#0B0C0E] border border-white/10 backdrop-blur-md transition-all shadow-lg"
          title="Inspect in Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {displayMedia.length > 1 && (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); setIsAutoPlaying((playing) => !playing); }}
            className="absolute bottom-4 left-4 p-2.5 rounded-lg bg-[#0B0C0E]/80 text-[#E8E8EC] hover:text-[#D4AF37] border border-white/10 backdrop-blur-md transition-all shadow-lg"
            title={isAutoPlaying ? 'Pause media animation' : 'Play media animation'}
            aria-label={isAutoPlaying ? 'Pause media animation' : 'Play media animation'}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}

        {/* Prev / Next controls for quick browse */}
        {displayMedia.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#0B0C0E]/70 text-[#E8E8EC] hover:text-[#D4AF37] border border-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#0B0C0E]/70 text-[#E8E8EC] hover:text-[#D4AF37] border border-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Zoom hint badge */}
        <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="px-2.5 py-1 text-[11px] tracking-wider uppercase bg-[#0B0C0E]/80 border border-[#D4AF37]/30 text-[#E5C378] rounded-md backdrop-blur-md">
            Hover to Magnify
          </span>
        </div>
      </div>

      {/* Thumbnails Row */}
      {displayMedia.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {displayMedia.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-[#121316] border transition-all duration-300 ${activeIdx === idx
                ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/40 scale-105'
                : 'border-[#262930] opacity-60 hover:opacity-100'
                }`}
            >
              <ProductMediaFrame media={item} className="w-full h-full object-cover object-center" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 select-none"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full bg-[#181A1F]/90 text-[#E8E8EC] hover:text-[#D4AF37] border border-white/10 transition-colors z-[71]"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Media counter */}
            {displayMedia.length > 1 && (
              <span className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-[#181A1F]/90 text-[11px] font-mono text-[#8E929E] border border-white/10 z-[71]">
                {activeIdx + 1} / {displayMedia.length}
              </span>
            )}

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full h-full max-w-6xl max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <ProductMediaFrame media={currentMedia} className="max-h-[82vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl" />

                {displayMedia.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#181A1F]/80 text-[#E8E8EC] hover:text-[#D4AF37] border border-white/10 transition-colors z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#181A1F]/80 text-[#E8E8EC] hover:text-[#D4AF37] border border-white/10 transition-colors z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
