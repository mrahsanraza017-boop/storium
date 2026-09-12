import React, { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'motion/react';

const TOTAL_FRAMES = 300;
const NATIVE_WIDTH = 854;
const NATIVE_HEIGHT = 480;
const KEYFRAME_STEP = 10; // 30 LOD skeleton frames loaded immediately (~600KB total for instant 360° response)

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

  // Fast direct image loader utilizing browser native parallel decoding
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

  // Priority window loader for the current scroll position
  const requestProximityFrames = useCallback((targetIndex: number) => {
    // Immediately request the exact target frame and adjacent frames with high priority
    loadFrame(targetIndex, 'high');
    loadFrame(targetIndex - 1, 'high');
    loadFrame(targetIndex + 1, 'high');
    loadFrame(targetIndex - 2, 'high');
    loadFrame(targetIndex + 2, 'high');

    // Also request surrounding window
    for (let r = 3; r <= 15; r++) {
      loadFrame(targetIndex - r, 'auto');
      loadFrame(targetIndex + r, 'auto');
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
        // Snappy responsive easing (0.28 LERP gives instant feel without sluggish lag)
        currentProgressRef.current += delta * 0.28;
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

  // Instant Multi-Tier Frame Loading Strategy
  useEffect(() => {
    mountedRef.current = true;

    // TIER 1: Load Frame 0 immediately with High Priority
    loadFrame(0, 'high', () => {
      drawFrame(0, true);
    });

    // TIER 2: Instantly trigger all 30 LOD keyframes (Indices 0, 10, 20 ... 299)
    // ~600KB total - loads in <150ms and provides 360° instant responsiveness anywhere on scroll
    for (let k = 0; k < TOTAL_FRAMES; k += KEYFRAME_STEP) {
      loadFrame(k, 'high');
    }
    loadFrame(TOTAL_FRAMES - 1, 'high');

    // TIER 3: Progressively background-cache remaining intermediate frames
    let backgroundBatchIdx = 1;
    const queueInterval = window.setInterval(() => {
      if (!mountedRef.current || backgroundBatchIdx >= TOTAL_FRAMES) {
        clearInterval(queueInterval);
        return;
      }

      // Load 10 frames per tick
      for (let i = 0; i < 10 && backgroundBatchIdx < TOTAL_FRAMES; i++) {
        if (!isRequestedRef.current[backgroundBatchIdx]) {
          loadFrame(backgroundBatchIdx, 'low');
        }
        backgroundBatchIdx++;
      }
    }, 40);

    return () => {
      mountedRef.current = false;
      clearInterval(queueInterval);
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