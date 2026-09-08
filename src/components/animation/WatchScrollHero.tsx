import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowRight,
  Sparkles,
  Shield,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  ChevronDown,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const TOTAL_FRAMES = 300;
const FRAME_ASPECT = 1280 / 720;
const BG_COLOR = '#0B0C0E';

export const WatchScrollHero: React.FC = () => {
  const { navigate } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [progress, setProgress] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loadedCount, setLoadedCount] = useState<number>(0);

  // Animation state refs
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const isLoadedRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES));
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const isRunningRef = useRef<boolean>(true);

  // Get frame image path from public/frames
  const getFrameSrc = (index: number) => {
    const num = String(index + 1).padStart(6, '0');
    return `/frames/frame_${num}.jpg`;
  };

  // Render canvas frame
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Find nearest loaded frame if the target frame is still decoding
    let activeIndex = frameIndex;
    if (!isLoadedRef.current[activeIndex]) {
      let closest = -1;
      let minDiff = Infinity;
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        if (isLoadedRef.current[i]) {
          const diff = Math.abs(i - frameIndex);
          if (diff < minDiff) {
            minDiff = diff;
            closest = i;
          }
        }
      }
      if (closest !== -1) {
        activeIndex = closest;
      } else {
        return; // No frames loaded yet
      }
    }

    const img = imagesRef.current[activeIndex];
    if (!img) return;

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;
    if (canvasW === 0 || canvasH === 0) return;

    // Clear with dark luxury background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Contain aspect ratio calculation
    const viewportAspect = canvasW / canvasH;
    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;

    if (viewportAspect > FRAME_ASPECT) {
      // Landscape / Ultra-wide
      drawH = canvasH;
      drawW = canvasH * FRAME_ASPECT;
      drawX = (canvasW - drawW) / 2;
      drawY = 0;
    } else {
      // Portrait / Mobile
      drawW = canvasW;
      drawH = canvasW / FRAME_ASPECT;
      drawX = 0;
      drawY = (canvasH - drawH) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    lastDrawnFrameRef.current = activeIndex;
  }, []);

  // Canvas resize with high-DPI scaling
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    lastDrawnFrameRef.current = -1;
    const currentFrame = Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1));
    drawFrame(currentFrame);
  }, [drawFrame]);

  // Progressive preloading with concurrency
  useEffect(() => {
    let count = 0;

    // 1. Priority: Load Frame 1 immediately
    const firstImg = new Image();
    firstImg.src = getFrameSrc(0);
    firstImg.onload = () => {
      imagesRef.current[0] = firstImg;
      isLoadedRef.current[0] = 1;
      count++;
      setLoadedCount(count);
      drawFrame(0);
    };

    // 2. Load remaining frames with concurrency queue
    const queue: number[] = [];
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      queue.push(i);
    }

    const CONCURRENCY = 8;
    let active = 0;

    const processQueue = () => {
      while (active < CONCURRENCY && queue.length > 0) {
        const idx = queue.shift()!;
        active++;
        const img = new Image();
        img.src = getFrameSrc(idx);
        img.onload = () => {
          imagesRef.current[idx] = img;
          isLoadedRef.current[idx] = 1;
          active--;
          count++;
          setLoadedCount(count);

          const currentTarget = Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1));
          if (Math.abs(currentTarget - idx) <= 1) {
            drawFrame(currentTarget);
          }
          processQueue();
        };
        img.onerror = () => {
          active--;
          processQueue();
        };
      }
    };

    processQueue();

    return () => {
      imagesRef.current = new Array(TOTAL_FRAMES).fill(null);
      isLoadedRef.current = new Uint8Array(TOTAL_FRAMES);
    };
  }, [drawFrame]);

  // Scroll listener tracking container progress
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;

      if (totalScrollable <= 0) return;

      const rawProgress = -rect.top / totalScrollable;
      const clamped = Math.max(0, Math.min(1, rawProgress));
      targetProgressRef.current = clamped;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Initial calculation
    handleScroll();
    handleResize();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // RAF loop with LERP smoothing
  useEffect(() => {
    isRunningRef.current = true;
    let animId: number;

    const tick = () => {
      if (!isRunningRef.current) return;

      const delta = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(delta) > 0.0002) {
        currentProgressRef.current += delta * 0.14; // Smooth luxury easing
        const currentProgress = currentProgressRef.current;
        setProgress(currentProgress);

        const targetFrame = Math.round(currentProgress * (TOTAL_FRAMES - 1));
        if (targetFrame !== lastDrawnFrameRef.current) {
          drawFrame(targetFrame);
        }
      } else if (currentProgressRef.current !== targetProgressRef.current) {
        currentProgressRef.current = targetProgressRef.current;
        setProgress(currentProgressRef.current);
        drawFrame(Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1)));
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      isRunningRef.current = false;
      cancelAnimationFrame(animId);
    };
  }, [drawFrame]);

  // Stage visibility thresholds
  // Stage 1: Hero (0 - 0.22)
  // Stage 2: Metallurgy & Optics (0.28 - 0.48)
  // Stage 3: Calibre & Mechanics (0.54 - 0.74)
  // Stage 4: Masterpiece Assembled (0.80 - 1.0)
  const isStage1 = progress <= 0.22;
  const isStage2 = progress >= 0.26 && progress <= 0.48;
  const isStage3 = progress >= 0.52 && progress <= 0.74;
  const isStage4 = progress >= 0.78;

  const currentFrameNumber = Math.round(progress * (TOTAL_FRAMES - 1)) + 1;

  return (
    <section
      ref={containerRef}
      id="hero-frame-container"
      data-hero-frames-mount="true"
      data-section="hero"
      className="relative w-full h-[380vh] bg-[#0B0C0E] border-b border-[#262930]"
    >
      {/* Sticky Fullscreen Canvas Viewport */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        {/* HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block select-none pointer-events-none"
        />

        {/* Subtle Ambient Radial Lighting Behind Watch */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/8 via-transparent to-transparent pointer-events-none" />

        {/* Top/Bottom Subtle Gradient Vignettes */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#0B0C0E] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0B0C0E] to-transparent pointer-events-none" />

        {/* Narrative Overlays (Driven by Scroll Progress) */}
        {!isFullscreen && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 sm:p-12">
            {/* Top Bar Status / Horology Telemetry */}
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto pointer-events-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121316]/80 border border-[#262930] backdrop-blur-md text-[11px] uppercase tracking-widest text-[#9Ea2AF]">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-[#F5F5F7] font-semibold">Chrono Obsidian Stealth</span>
                <span className="text-[#555A64]">•</span>
                <span className="font-mono text-[#D4AF37]">
                  FRAME {String(currentFrameNumber).padStart(3, '0')}/300
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Scrubbing progress indicator */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121316]/80 border border-[#262930] backdrop-blur-md text-[11px] font-mono text-[#8E929E]">
                  <span>ROTATION</span>
                  <span className="text-[#D4AF37] font-bold">
                    {Math.round(progress * 360)}°
                  </span>
                </div>

                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="p-2 rounded-full bg-[#121316]/80 hover:bg-[#181A1F] border border-[#262930] hover:border-[#D4AF37]/50 text-[#8E929E] hover:text-[#F5F5F7] backdrop-blur-md transition-all shadow-lg"
                  title="Pure Animation View"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* STAGE 1: Hero Initial Headline (0 - 22%) */}
            <div
              className={`max-w-4xl mx-auto text-center transition-all duration-700 pointer-events-auto flex flex-col items-center my-auto ${
                isStage1
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-8 pointer-events-none scale-95'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181A1F]/90 border border-[#D4AF37]/30 backdrop-blur-md mb-6 shadow-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#E5C378] font-semibold">
                  Pakistan&apos;s Futuristic Luxury Showroom
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#F5F5F7] font-serif-luxury leading-[1.1] max-w-4xl drop-shadow-2xl">
                Wear your presence.
              </h1>

              <p className="mt-5 text-base sm:text-lg md:text-xl text-[#9Ea2AF] max-w-2xl font-light leading-relaxed drop-shadow">
                Aerospace titanium, surgical steel, and sapphire crystal. Designed for leaders who command authority without uttering a sound.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('watches')}
                  className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5C378] hover:to-[#D4AF37] text-[#0B0C0E] text-xs uppercase tracking-[0.2em] font-bold shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.45)] transition-all flex items-center gap-2 group"
                >
                  <span>Explore Timepieces</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('shop')}
                  className="py-3.5 px-8 rounded-xl bg-[#121316]/90 hover:bg-[#181A1F] text-[#E8E8EC] hover:text-[#F5F5F7] text-xs uppercase tracking-[0.2em] font-semibold border border-[#262930] hover:border-[#D4AF37]/50 backdrop-blur-md transition-all shadow-xl"
                >
                  Showroom Catalog
                </button>
              </div>

              {/* Scroll prompt */}
              <div className="mt-8 flex flex-col items-center gap-1.5 text-[#8E929E] animate-bounce">
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">
                  Scroll To Dissect Mechanism
                </span>
                <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
              </div>
            </div>

            {/* STAGE 2: Metallurgy & Optics Callouts (26% - 48%) */}
            <div
              className={`max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 my-auto transition-all duration-700 pointer-events-auto ${
                isStage2
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6 pointer-events-none'
              }`}
            >
              {/* Left: Metallurgy */}
              <div className="p-6 rounded-2xl bg-[#121316]/85 border border-[#D4AF37]/30 backdrop-blur-xl shadow-2xl max-w-sm space-y-2">
                <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-mono tracking-widest uppercase">
                  <Shield className="w-4 h-4" />
                  <span>316L Stainless & Titanium</span>
                </div>
                <h3 className="text-xl font-bold text-[#F5F5F7] font-serif-luxury">
                  Diamond-Like Carbon Coating
                </h3>
                <p className="text-xs text-[#9Ea2AF] leading-relaxed">
                  Aerospace-grade DLC matte black surface providing military-grade scratch resistance and high thermal stability.
                </p>
              </div>

              {/* Right: Optics */}
              <div className="p-6 rounded-2xl bg-[#121316]/85 border border-[#D4AF37]/30 backdrop-blur-xl shadow-2xl max-w-sm ml-auto space-y-2">
                <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-mono tracking-widest uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>Double-Domed Optics</span>
                </div>
                <h3 className="text-xl font-bold text-[#F5F5F7] font-serif-luxury">
                  Anti-Reflective Sapphire Crystal
                </h3>
                <p className="text-xs text-[#9Ea2AF] leading-relaxed">
                  Rated 9 on Mohs hardness scale. Dual internal AR coatings eliminate optical distortion from every viewing angle.
                </p>
              </div>
            </div>

            {/* STAGE 3: Calibre & Mechanics Callouts (52% - 74%) */}
            <div
              className={`max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 my-auto transition-all duration-700 pointer-events-auto ${
                isStage3
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6 pointer-events-none'
              }`}
            >
              {/* Left: Calibre */}
              <div className="p-6 rounded-2xl bg-[#121316]/85 border border-[#D4AF37]/30 backdrop-blur-xl shadow-2xl max-w-sm space-y-2">
                <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-mono tracking-widest uppercase">
                  <Layers className="w-4 h-4" />
                  <span>Calibre Engine</span>
                </div>
                <h3 className="text-xl font-bold text-[#F5F5F7] font-serif-luxury">
                  Seiko VK64 Mecha-Quartz Sweep
                </h3>
                <p className="text-xs text-[#9Ea2AF] leading-relaxed">
                  The precision reliability of quartz fused with the high-beat fluid 1/5th second mechanical chronograph sweep.
                </p>
              </div>

              {/* Right: Depth & Pressure */}
              <div className="p-6 rounded-2xl bg-[#121316]/85 border border-[#D4AF37]/30 backdrop-blur-xl shadow-2xl max-w-sm ml-auto space-y-2">
                <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-mono tracking-widest uppercase">
                  <Compass className="w-4 h-4" />
                  <span>Immersion Rating</span>
                </div>
                <h3 className="text-xl font-bold text-[#F5F5F7] font-serif-luxury">
                  10 ATM / 100M Water Resistance
                </h3>
                <p className="text-xs text-[#9Ea2AF] leading-relaxed">
                  Screw-down crown with dual fluorocarbon gaskets engineered to withstand extreme depths and sudden pressure differentials.
                </p>
              </div>
            </div>

            {/* STAGE 4: Reassembled Masterpiece & CTA (78% - 100%) */}
            <div
              className={`max-w-2xl mx-auto text-center transition-all duration-700 pointer-events-auto flex flex-col items-center my-auto ${
                isStage4
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8 pointer-events-none'
              }`}
            >
              <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-2">
                Flagship Masterpiece Reassembled
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold text-[#F5F5F7] font-serif-luxury">
                STORIUM Chrono Obsidian
              </h2>
              <p className="mt-3 text-sm text-[#9Ea2AF] max-w-lg">
                Rs. 29,900 &bull; 2-Year International Movement Warranty &bull; Free Express Delivery
              </p>

              <div className="mt-6 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('product', { slug: 'storium-chrono-obsidian-stealth' })}
                  className="py-3.5 px-8 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] text-xs font-bold uppercase tracking-wider transition-all shadow-xl"
                >
                  Inspect Timepiece
                </button>
                <button
                  type="button"
                  onClick={() => navigate('checkout')}
                  className="py-3.5 px-8 rounded-xl bg-[#181A1F] hover:bg-[#22252C] text-[#F5F5F7] text-xs font-semibold uppercase tracking-wider border border-[#262930] hover:border-[#D4AF37]/50 transition-all"
                >
                  Order via COD
                </button>
              </div>

              <div className="mt-8 text-[11px] uppercase tracking-widest text-[#8E929E] font-mono flex items-center gap-2">
                <span>Continue Down To Discover Showroom</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#D4AF37] animate-bounce" />
              </div>
            </div>

            {/* Bottom Scrub Progress Rail */}
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between pt-4 border-t border-white/5 pointer-events-auto">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-[#8E929E] font-mono">
                  EXPLODED VIEW
                </span>
                <div className="w-32 sm:w-56 h-1 bg-[#181A1F] rounded-full overflow-hidden border border-[#262930]">
                  <div
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] transition-all duration-75"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">
                  {Math.round(progress * 100)}%
                </span>
              </div>

              <div className="text-[10px] uppercase tracking-widest text-[#8E929E] font-mono">
                {loadedCount < TOTAL_FRAMES ? (
                  <span className="text-[#D4AF37] animate-pulse">
                    CACHING {loadedCount}/{TOTAL_FRAMES}...
                  </span>
                ) : (
                  <span>300 ULTRA-HD FRAMES READY</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FULLSCREEN PURE ANIMATION OVERLAY (If user clicks Maximize) */}
        {isFullscreen && (
          <div className="absolute inset-0 z-50 pointer-events-auto flex flex-col justify-between p-6">
            <div className="flex items-center justify-between">
              <div className="px-3.5 py-1.5 rounded-full bg-[#121316]/90 border border-[#262930] text-xs font-mono text-[#D4AF37]">
                PURE ANIMATION SCRUB • {String(currentFrameNumber).padStart(3, '0')}/300
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2.5 rounded-full bg-[#181A1F] hover:bg-[#22252C] text-[#F5F5F7] border border-[#262930] hover:border-[#D4AF37]/50 shadow-2xl transition-all"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            {/* Scrub Slider on Fullscreen */}
            <div className="max-w-xl w-full mx-auto p-4 rounded-2xl bg-[#121316]/90 border border-[#262930] backdrop-blur-xl shadow-2xl space-y-2">
              <div className="flex justify-between text-xs text-[#8E929E] font-mono">
                <span>DRAG OR SCROLL TO SCRUB</span>
                <span className="text-[#D4AF37] font-bold">{Math.round(progress * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  targetProgressRef.current = val;
                  currentProgressRef.current = val;
                  setProgress(val);
                  drawFrame(Math.round(val * (TOTAL_FRAMES - 1)));
                }}
                className="w-full accent-[#D4AF37] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
