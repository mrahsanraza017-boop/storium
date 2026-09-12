import React, { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'motion/react';

const TOTAL_FRAMES = 300;
const NATIVE_WIDTH = 854;
const NATIVE_HEIGHT = 480;

// Only frames within this window of the current scroll target are downloaded.
// This keeps the initial network payload tiny while still scrubbing smoothly.
const PRELOAD_RADIUS = 24;

export const WatchBackgroundCanvas: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const isLoadedRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES));
  const queuedRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES));
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const lastTargetFrameRef = useRef<number>(-1);
  const activeWorkersRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);

  const getFrameSrc = (index: number) => {
    const num = String(index + 1).padStart(6, '0');
    return `/frames/frame_${num}.webp`;
  };

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Find exact or closest available loaded frame
    let activeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    if (!isLoadedRef.current[activeIndex]) {
      let closest = -1;
      let minDiff = Infinity;
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        if (isLoadedRef.current[i]) {
          const diff = Math.abs(i - activeIndex);
          if (diff < minDiff) {
            minDiff = diff;
            closest = i;
          }
        }
      }
      if (closest !== -1) {
        activeIndex = closest;
      } else {
        return;
      }
    }

    const img = imagesRef.current[activeIndex];
    if (!img) return;

    const canvasW = canvas.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : NATIVE_WIDTH) || NATIVE_WIDTH;
    const canvasH = canvas.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : NATIVE_HEIGHT) || NATIVE_HEIGHT;
    if (canvasW === 0 || canvasH === 0) return;

    // COVER MODE: Scale the frame to fill the entire viewport,
    // cropping the excess edge so the animation is never letterboxed.
    const scale = Math.max(canvasW / NATIVE_WIDTH, canvasH / NATIVE_HEIGHT);
    const drawW = NATIVE_WIDTH * scale;
    const drawH = NATIVE_HEIGHT * scale;
    const drawX = (canvasW - drawW) / 2;
    const drawY = (canvasH - drawH) / 2;

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    lastDrawnFrameRef.current = activeIndex;
  }, []);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    lastDrawnFrameRef.current = -1;
    const currentFrame = Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1));
    drawFrame(currentFrame);
  }, [drawFrame]);

  const startFetch = useCallback((index: number) => {
    if (queuedRef.current[index]) return;
    queuedRef.current[index] = 1;
    activeWorkersRef.current++;

    const img = new Image();
    img.decoding = 'async';
    img.setAttribute('fetchpriority', 'low');
    img.src = getFrameSrc(index);

    img.onload = () => {
      if (!mountedRef.current) return;
      imagesRef.current[index] = img;
      isLoadedRef.current[index] = 1;
      activeWorkersRef.current--;

      // Redraw if this frame is closest to current view
      const currentTarget = Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1));
      if (Math.abs(currentTarget - index) <= 1) {
        drawFrame(currentTarget);
      }
      pumpIfNeeded();
    };

    img.onerror = () => {
      activeWorkersRef.current--;
      pumpIfNeeded();
    };
  }, [drawFrame]);

  const pumpIfNeeded = useCallback(() => {
    if (!mountedRef.current) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const CONCURRENCY = isMobile ? 4 : 8;

    if (activeWorkersRef.current >= CONCURRENCY) return;

    const target = Math.round(targetProgressRef.current * (TOTAL_FRAMES - 1));
    const lo = Math.max(0, target - PRELOAD_RADIUS);
    const hi = Math.min(TOTAL_FRAMES - 1, target + PRELOAD_RADIUS);

    let best = -1;
    let bestDist = Infinity;
    for (let i = lo; i <= hi; i++) {
      if (isLoadedRef.current[i] || queuedRef.current[i]) continue;
      const dist = Math.abs(i - target);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    if (best !== -1) {
      startFetch(best);
      pumpIfNeeded();
    }
  }, [startFetch]);

  // Continuous RAF loop with smooth easing
  useEffect(() => {
    let animId: number;
    let isRunning = true;
    let lastPumptedFrame = -1;

    const tick = () => {
      if (!isRunning) return;

      const delta = targetProgressRef.current - currentProgressRef.current;

      if (Math.abs(delta) > 0.0001) {
        currentProgressRef.current += delta * 0.14; // smooth responsive tracking
        const frame = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1))));
        if (frame !== lastDrawnFrameRef.current) {
          drawFrame(frame);
        }
      } else if (currentProgressRef.current !== targetProgressRef.current) {
        currentProgressRef.current = targetProgressRef.current;
        const frame = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1))));
        if (frame !== lastDrawnFrameRef.current) {
          drawFrame(frame);
        }
      }

      // Keep the wanted window filled as the scroll target moves
      const targetFrame = Math.round(targetProgressRef.current * (TOTAL_FRAMES - 1));
      if (targetFrame !== lastPumptedFrame) {
        lastPumptedFrame = targetFrame;
        pumpIfNeeded();
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [drawFrame, pumpIfNeeded]);

  // Frame 0 loads immediately for instant hero visual;
  // the rest are fetched lazily on scroll by pumpIfNeeded.
  useEffect(() => {
    mountedRef.current = true;
    let unmounted = false;

    const firstImg = new Image();
    firstImg.decoding = 'async';
    firstImg.setAttribute('fetchpriority', 'high');
    firstImg.src = getFrameSrc(0);
    firstImg.onload = () => {
      if (unmounted) return;
      const finish = () => {
        imagesRef.current[0] = firstImg;
        isLoadedRef.current[0] = 1;
        queuedRef.current[0] = 1;
        drawFrame(0);
      };
      if (typeof firstImg.decode === 'function') {
        firstImg.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };
    firstImg.onerror = () => {
      queuedRef.current[0] = 1;
    };

    // Kick off the window around frame 0 after paint
    const idleStart = (): void => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => pumpIfNeeded(), { timeout: 1500 });
      } else {
        window.setTimeout(() => pumpIfNeeded(), 800);
      }
    };
    if (document.readyState === 'complete') {
      idleStart();
    } else {
      window.addEventListener('load', idleStart, { once: true });
    }

    return () => {
      unmounted = true;
      mountedRef.current = false;
      imagesRef.current = new Array(TOTAL_FRAMES).fill(null);
      isLoadedRef.current = new Uint8Array(TOTAL_FRAMES);
      queuedRef.current = new Uint8Array(TOTAL_FRAMES);
    };
  }, [drawFrame, pumpIfNeeded]);

  // Scroll and resize listeners
  useEffect(() => {
    const handleScroll = () => {
      if (prefersReducedMotion) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const progress = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;
      targetProgressRef.current = progress;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    handleScroll();
    handleResize();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, prefersReducedMotion]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      {/* Subtle atmospheric vignette to preserve pristine text contrast across all watch animation frames */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0E]/25 via-transparent to-[#0B0C0E]/35 pointer-events-none" />
      {/* Subtle atmospheric gold ambient rim glow that highlights the timepiece */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};