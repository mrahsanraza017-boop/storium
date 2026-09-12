import React, { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'motion/react';

const TOTAL_FRAMES = 300;
const NATIVE_WIDTH = 854;
const NATIVE_HEIGHT = 480;
const KEYFRAME_STRIDE = 10; // 30 LOD keyframes loaded upfront (~600KB total for instant 360° responsiveness)
const PROXIMITY_RADIUS = 28; // Dense window around active scroll target

type DrawableSource = ImageBitmap | HTMLImageElement;

export const WatchBackgroundCanvas: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cached frame buffers and status maps
  const imagesRef = useRef<(DrawableSource | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const isLoadedRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES));
  const queuedRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES));

  // Viewport geometry cache to prevent layout thrashing
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : NATIVE_WIDTH,
    height: typeof window !== 'undefined' ? window.innerHeight : NATIVE_HEIGHT,
    dpr: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
  });

  // Animation and progress trackers
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const activeWorkersRef = useRef<number>(0);
  const rafActiveRef = useRef<boolean>(false);
  const rafIdRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);
  const maxScrollRef = useRef<number>(1);

  const getFrameSrc = (index: number) => {
    const num = String(index + 1).padStart(6, '0');
    return `/frames/frame_${num}.webp`;
  };

  // Find nearest loaded frame via outward binary-adjacent stepping (O(1) average, <= 5 iterations)
  const getNearestLoadedFrame = useCallback((targetIndex: number): number => {
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, targetIndex));
    if (isLoadedRef.current[clamped]) return clamped;

    const maxDist = Math.max(clamped, TOTAL_FRAMES - 1 - clamped);
    for (let dist = 1; dist <= maxDist; dist++) {
      const prev = clamped - dist;
      if (prev >= 0 && isLoadedRef.current[prev]) return prev;
      const next = clamped + dist;
      if (next < TOTAL_FRAMES && isLoadedRef.current[next]) return next;
    }
    return -1;
  }, []);

  // High-performance canvas draw routine with zero DOM layout queries
  const drawFrame = useCallback((frameIndex: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeIndex = getNearestLoadedFrame(frameIndex);
    if (activeIndex === -1) return;

    // Deduplicate draws: if the visual content has not changed, do nothing
    if (!force && activeIndex === lastDrawnFrameRef.current) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const img = imagesRef.current[activeIndex];
    if (!img) return;

    const { width: canvasW, height: canvasH } = sizeRef.current;
    if (canvasW === 0 || canvasH === 0) return;

    // Cover mode: fill viewport with preserved aspect ratio
    const scale = Math.max(canvasW / NATIVE_WIDTH, canvasH / NATIVE_HEIGHT);
    const drawW = NATIVE_WIDTH * scale;
    const drawH = NATIVE_HEIGHT * scale;
    const drawX = (canvasW - drawW) / 2;
    const drawY = (canvasH - drawH) / 2;

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    lastDrawnFrameRef.current = activeIndex;
  }, [getNearestLoadedFrame]);

  // Request & Decode frame with off-thread ImageBitmap when available
  const startFetch = useCallback((index: number, onComplete?: () => void) => {
    if (queuedRef.current[index] || isLoadedRef.current[index]) return;
    queuedRef.current[index] = 1;
    activeWorkersRef.current++;

    const src = getFrameSrc(index);

    const storeAndNotify = (source: DrawableSource) => {
      if (!mountedRef.current) return;
      imagesRef.current[index] = source;
      isLoadedRef.current[index] = 1;
      activeWorkersRef.current--;

      // If this newly loaded frame is very close to current progress, trigger draw
      const currentTarget = Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1));
      if (Math.abs(currentTarget - index) <= 2) {
        drawFrame(currentTarget);
      }

      onComplete?.();
    };

    const handleFail = () => {
      activeWorkersRef.current--;
      onComplete?.();
    };

    // Off-thread decode via fetch + createImageBitmap
    if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
      fetch(src, { priority: index % KEYFRAME_STRIDE === 0 ? 'high' : 'low' } as RequestInit)
        .then((res) => {
          if (!res.ok) throw new Error('Network error');
          return res.blob();
        })
        .then((blob) => createImageBitmap(blob))
        .then((bitmap) => storeAndNotify(bitmap))
        .catch(() => {
          // Fallback to standard Image element decode
          const fallbackImg = new Image();
          fallbackImg.decoding = 'async';
          fallbackImg.src = src;
          fallbackImg.onload = () => storeAndNotify(fallbackImg);
          fallbackImg.onerror = handleFail;
        });
    } else {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().then(() => storeAndNotify(img)).catch(() => storeAndNotify(img));
        } else {
          storeAndNotify(img);
        }
      };
      img.onerror = handleFail;
    }
  }, [drawFrame]);

  // Dynamic proximity queue pump
  const pumpIfNeeded = useCallback(() => {
    if (!mountedRef.current) return;
    const isMobile = sizeRef.current.width < 768;
    const MAX_CONCURRENCY = isMobile ? 4 : 6;

    if (activeWorkersRef.current >= MAX_CONCURRENCY) return;

    const currentTarget = Math.round(targetProgressRef.current * (TOTAL_FRAMES - 1));
    const lo = Math.max(0, currentTarget - PROXIMITY_RADIUS);
    const hi = Math.min(TOTAL_FRAMES - 1, currentTarget + PROXIMITY_RADIUS);

    // Find unqueued frame nearest to user's current target position
    let bestIndex = -1;
    let bestDist = Infinity;

    for (let i = lo; i <= hi; i++) {
      if (isLoadedRef.current[i] || queuedRef.current[i]) continue;
      const dist = Math.abs(i - currentTarget);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }

    // Secondary pass: if local proximity is saturated, look for remaining skeleton keyframes
    if (bestIndex === -1) {
      for (let k = 0; k < TOTAL_FRAMES; k += KEYFRAME_STRIDE) {
        if (!isLoadedRef.current[k] && !queuedRef.current[k]) {
          bestIndex = k;
          break;
        }
      }
    }

    if (bestIndex !== -1) {
      startFetch(bestIndex, () => {
        pumpIfNeeded();
      });
      // Try to fill remaining worker slots
      if (activeWorkersRef.current < MAX_CONCURRENCY) {
        pumpIfNeeded();
      }
    }
  }, [startFetch]);

  // Sleep-on-idle RAF animation loop (Zero CPU/GPU usage when scrolling is static)
  const startAnimationLoop = useCallback(() => {
    if (rafActiveRef.current || !mountedRef.current) return;
    rafActiveRef.current = true;

    const tick = () => {
      if (!mountedRef.current) {
        rafActiveRef.current = false;
        return;
      }

      const delta = targetProgressRef.current - currentProgressRef.current;

      if (Math.abs(delta) > 0.0001) {
        // High-precision smooth tracking
        currentProgressRef.current += delta * 0.18;
        const frame = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1))));
        drawFrame(frame);
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        // Converged on target scroll position
        if (currentProgressRef.current !== targetProgressRef.current) {
          currentProgressRef.current = targetProgressRef.current;
          const frame = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1))));
          drawFrame(frame);
        }
        // Sleep the RAF loop!
        rafActiveRef.current = false;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [drawFrame]);

  // Optimized resize handler with DPR scaling & buffer update
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    sizeRef.current = { width: w, height: h, dpr };
    maxScrollRef.current = Math.max(1, document.documentElement.scrollHeight - h);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    const currentFrame = Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1));
    drawFrame(currentFrame, true);
  }, [drawFrame]);

  // Priority Initial LOD Preloader
  useEffect(() => {
    mountedRef.current = true;

    // 1. Immediately fetch and decode Frame 0
    startFetch(0, () => {
      drawFrame(0, true);
    });

    // 2. Preload LOD Skeleton (every 10th keyframe) after initial paint
    const loadSkeleton = () => {
      if (!mountedRef.current) return;
      const keyframes: number[] = [];
      for (let i = KEYFRAME_STRIDE; i < TOTAL_FRAMES; i += KEYFRAME_STRIDE) {
        keyframes.push(i);
      }
      if (keyframes[keyframes.length - 1] !== TOTAL_FRAMES - 1) {
        keyframes.push(TOTAL_FRAMES - 1);
      }

      // Stagger skeleton fetches with low priority
      let idx = 0;
      const step = () => {
        if (!mountedRef.current || idx >= keyframes.length) return;
        const frameIdx = keyframes[idx++];
        startFetch(frameIdx, () => {
          step();
        });
      };
      // Spawn 2 parallel skeleton loaders
      step();
      step();
    };

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(loadSkeleton, { timeout: 1200 });
    } else {
      window.setTimeout(loadSkeleton, 300);
    }

    return () => {
      mountedRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      imagesRef.current = new Array(TOTAL_FRAMES).fill(null);
      isLoadedRef.current = new Uint8Array(TOTAL_FRAMES);
      queuedRef.current = new Uint8Array(TOTAL_FRAMES);
    };
  }, [drawFrame, startFetch]);

  // Passive, non-blocking scroll and resize listeners
  useEffect(() => {
    handleResize();

    if (prefersReducedMotion) return;

    let scrollTicking = false;
    const handleScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;

      requestAnimationFrame(() => {
        scrollTicking = false;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const maxScroll = maxScrollRef.current;
        const progress = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;

        targetProgressRef.current = progress;
        pumpIfNeeded();
        startAnimationLoop();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Periodically re-sync maxScroll to handle dynamic DOM content changes
    const mutationObserver = new MutationObserver(() => {
      maxScrollRef.current = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      mutationObserver.disconnect();
    };
  }, [handleResize, prefersReducedMotion, pumpIfNeeded, startAnimationLoop]);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
      style={{
        contain: 'strict',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          transform: 'translateZ(0)',
          imageRendering: 'auto',
        }}
      />
      {/* Subtle atmospheric vignette to preserve pristine text contrast across all watch animation frames */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0E]/25 via-transparent to-[#0B0C0E]/35 pointer-events-none" />
      {/* Subtle atmospheric gold ambient rim glow that highlights the timepiece */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};