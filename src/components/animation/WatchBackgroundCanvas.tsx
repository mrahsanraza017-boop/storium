import React, { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'motion/react';

const TOTAL_FRAMES = 300;
const NATIVE_WIDTH = 1280;
const NATIVE_HEIGHT = 720;

export const WatchBackgroundCanvas: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const isLoadedRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES));
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);

  const getFrameSrc = (index: number) => {
    const num = String(index + 1).padStart(6, '0');
    return `/frames/frame_${num}.jpg`;
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

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;
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

  // Continuous RAF loop with butter-smooth easing
  useEffect(() => {
    let animId: number;
    let isRunning = true;

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

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [drawFrame]);

  // Proximity-ordered preloading: frame 0 first, then always the next frame
  // closest to the current scroll position so scrubbing is smooth from the start
  useEffect(() => {
    let unmounted = false;

    // Load Frame 0 immediately for instant initial visual
    const firstImg = new Image();
    firstImg.decoding = 'async';
    firstImg.setAttribute('fetchpriority', 'high');
    firstImg.src = getFrameSrc(0);
    firstImg.onload = () => {
      if (unmounted) return;
      const finish = () => {
        imagesRef.current[0] = firstImg;
        isLoadedRef.current[0] = 1;
        drawFrame(0);
      };
      if (typeof firstImg.decode === 'function') {
        firstImg.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };

    if (prefersReducedMotion) return;

    const pending = new Set<number>();
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      pending.add(i);
    }

    const CONCURRENCY = 32;
    let activeWorkers = 0;

    // Return the unloaded frame nearest to where the user is currently scrolled
    const takeNext = (): number => {
      const target = Math.round(targetProgressRef.current * (TOTAL_FRAMES - 1));
      let best = -1;
      let bestDist = Infinity;
      for (const idx of pending) {
        const dist = Math.abs(idx - target);
        if (dist < bestDist) {
          bestDist = dist;
          best = idx;
        }
      }
      if (best !== -1) pending.delete(best);
      return best;
    };

    const pumpQueue = () => {
      if (unmounted) return;
      while (activeWorkers < CONCURRENCY && pending.size > 0) {
        const idx = takeNext();
        if (idx === -1) break;

        activeWorkers++;
        const img = new Image();
        img.decoding = 'async';
        img.setAttribute('fetchpriority', 'low');
        img.src = getFrameSrc(idx);

        img.onload = () => {
          if (unmounted) return;
          imagesRef.current[idx] = img;
          isLoadedRef.current[idx] = 1;
          activeWorkers--;

          // Redraw if this frame is closest to current view
          const currentTarget = Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1));
          if (Math.abs(currentTarget - idx) <= 1) {
            drawFrame(currentTarget);
          }
          pumpQueue();
        };

        img.onerror = () => {
          activeWorkers--;
          pending.delete(idx);
          pumpQueue();
        };
      }
    };

    pumpQueue();

    return () => {
      unmounted = true;
      imagesRef.current = new Array(TOTAL_FRAMES).fill(null);
      isLoadedRef.current = new Uint8Array(TOTAL_FRAMES);
    };
  }, [drawFrame, prefersReducedMotion]);

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
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
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
