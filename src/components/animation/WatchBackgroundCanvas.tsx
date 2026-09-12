import React, { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'motion/react';

const TOTAL_FRAMES = 300;
const NATIVE_WIDTH = 854;
const NATIVE_HEIGHT = 480;

export const WatchBackgroundCanvas: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // In-memory frame storage
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const isLoadedRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES));
  const isRequestedRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES));

  // Cached viewport dimensions to prevent layout thrashing
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : NATIVE_WIDTH,
    height: typeof window !== 'undefined' ? window.innerHeight : NATIVE_HEIGHT,
    dpr: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
  });

  // Animation and progress trackers
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const rafActiveRef = useRef<boolean>(false);
  const rafIdRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);
  const userHasInteractedRef = useRef<boolean>(false);

  const getFrameSrc = (index: number) => {
    const num = String(index + 1).padStart(6, '0');
    return `/frames/frame_${num}.webp`;
  };

  // Find nearest loaded frame in O(1) time
  const getNearestLoadedFrame = useCallback((targetIndex: number): number => {
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, targetIndex));
    if (isLoadedRef.current[clamped]) return clamped;

    for (let dist = 1; dist < TOTAL_FRAMES; dist++) {
      const prev = clamped - dist;
      if (prev >= 0 && isLoadedRef.current[prev]) return prev;
      const next = clamped + dist;
      if (next < TOTAL_FRAMES && isLoadedRef.current[next]) return next;
    }
    return -1;
  }, []);

  // Direct canvas frame renderer (zero DOM layout queries)
  const drawFrame = useCallback((frameIndex: number, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeIndex = getNearestLoadedFrame(frameIndex);
    if (activeIndex === -1) return;

    if (!force && activeIndex === lastDrawnFrameRef.current) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const img = imagesRef.current[activeIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

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

  // Fast direct image loader utilizing native browser image caching
  const loadFrame = useCallback((index: number, priority: 'high' | 'auto' | 'low' = 'auto', onDone?: () => void) => {
    if (index < 0 || index >= TOTAL_FRAMES) return;
    if (isRequestedRef.current[index]) return;
    isRequestedRef.current[index] = 1;

    const img = new Image();
    img.decoding = 'async';
    // @ts-ignore - fetchPriority standard property
    img.fetchPriority = priority;
    img.src = getFrameSrc(index);

    const onFinish = () => {
      if (!mountedRef.current) return;
      imagesRef.current[index] = img;
      isLoadedRef.current[index] = 1;

      // If this frame matches or is very close to current active position, render immediately
      const currentTarget = Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1));
      if (Math.abs(currentTarget - index) <= 2) {
        drawFrame(currentTarget);
      }
      onDone?.();
    };

    if (typeof img.decode === 'function') {
      img.decode().then(onFinish).catch(onFinish);
    } else {
      img.onload = onFinish;
      img.onerror = onFinish;
    }
  }, [drawFrame]);

  // Request frames only around current scroll window
  const requestProximityFrames = useCallback((targetIndex: number) => {
    // High priority for immediate target and adjacent frames
    loadFrame(targetIndex, 'high');
    loadFrame(targetIndex - 1, 'high');
    loadFrame(targetIndex + 1, 'high');
    loadFrame(targetIndex - 2, 'high');
    loadFrame(targetIndex + 2, 'high');

    // Low priority for wider surrounding radius
    for (let r = 3; r <= 10; r++) {
      loadFrame(targetIndex - r, 'low');
      loadFrame(targetIndex + r, 'low');
    }
  }, [loadFrame]);

  // Snappy RAF animation loop with Sleep-on-Idle (0% CPU/GPU when idle)
  const startAnimationLoop = useCallback(() => {
    if (rafActiveRef.current || !mountedRef.current) return;
    rafActiveRef.current = true;

    const tick = () => {
      if (!mountedRef.current) {
        rafActiveRef.current = false;
        return;
      }

      const delta = targetProgressRef.current - currentProgressRef.current;

      if (Math.abs(delta) > 0.0002) {
        currentProgressRef.current += delta * 0.32;
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

  // Resize handler caching geometry and updating canvas buffer
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    sizeRef.current = { width: w, height: h, dpr };

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

  // Initial Load: Load ONLY Frame 0 eagerly so LCP is instant (<1s)
  useEffect(() => {
    mountedRef.current = true;

    // Load Frame 0 immediately
    loadFrame(0, 'high', () => {
      drawFrame(0, true);
    });

    // Defer all background preloading until after first interaction or idle time
    const startIdlePreload = () => {
      if (!mountedRef.current || userHasInteractedRef.current) return;
      userHasInteractedRef.current = true;

      // Preload 20 skeleton milestone angles with low priority
      let skeletonIdx = 0;
      const keyframes = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 299];
      
      const stepSkeleton = () => {
        if (!mountedRef.current || skeletonIdx >= keyframes.length) return;
        loadFrame(keyframes[skeletonIdx++], 'low', stepSkeleton);
      };
      stepSkeleton();
    };

    let idleId: number;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(startIdlePreload, { timeout: 3500 });
    } else {
      idleId = window.setTimeout(startIdlePreload, 2500);
    }

    // Trigger on first user scroll / touch / hover
    const onFirstUserAction = () => {
      startIdlePreload();
      window.removeEventListener('scroll', onFirstUserAction);
      window.removeEventListener('touchstart', onFirstUserAction);
      window.removeEventListener('mousemove', onFirstUserAction);
    };

    window.addEventListener('scroll', onFirstUserAction, { passive: true, once: true });
    window.addEventListener('touchstart', onFirstUserAction, { passive: true, once: true });
    window.addEventListener('mousemove', onFirstUserAction, { passive: true, once: true });

    return () => {
      mountedRef.current = false;
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
      window.removeEventListener('scroll', onFirstUserAction);
      window.removeEventListener('touchstart', onFirstUserAction);
      window.removeEventListener('mousemove', onFirstUserAction);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      imagesRef.current = new Array(TOTAL_FRAMES).fill(null);
      isLoadedRef.current = new Uint8Array(TOTAL_FRAMES);
      isRequestedRef.current = new Uint8Array(TOTAL_FRAMES);
    };
  }, [drawFrame, loadFrame]);

  // Passive, high-precision scroll listener
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
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.max(0, Math.min(1, scrollY / maxScroll));

        targetProgressRef.current = progress;
        const targetFrame = Math.round(progress * (TOTAL_FRAMES - 1));
        requestProximityFrames(targetFrame);
        startAnimationLoop();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, prefersReducedMotion, requestProximityFrames, startAnimationLoop]);

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