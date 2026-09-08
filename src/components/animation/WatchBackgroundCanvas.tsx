import React, { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'motion/react';

export const WatchBackgroundCanvas: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetProgressRef = useRef<number>(0);

  const drawVideoFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    if (video.readyState < 2) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;
    if (canvasW === 0 || canvasH === 0) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    const frameAspect = vw / vh;
    const viewportAspect = canvasW / canvasH;

    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;

    if (viewportAspect > frameAspect) {
      drawH = canvasH;
      drawW = canvasH * frameAspect;
      drawX = (canvasW - drawW) / 2;
      drawY = 0;
    } else {
      drawW = canvasW;
      drawH = canvasW / frameAspect;
      drawX = 0;
      drawY = (canvasH - drawH) / 2;
    }

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(video, drawX, drawY, drawW, drawH);
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

    drawVideoFrame();
  }, [drawVideoFrame]);

  // Single RAF loop: coalesced video seeking alongside scroll tracking
  useEffect(() => {
    let animId: number;
    let isRunning = true;

    const handleScroll = () => {
      if (prefersReducedMotion) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      targetProgressRef.current = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;
    };

    const tick = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && Number.isFinite(video.duration) && video.duration > 0) {
        const targetTime = targetProgressRef.current * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 1 / 60) {
          video.currentTime = targetTime;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    handleScroll();
    handleResize();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, prefersReducedMotion]);

  // Redraw the canvas whenever the video presents a new frame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const redraw = () => drawVideoFrame();
    video.addEventListener('seeked', redraw);
    video.addEventListener('loadeddata', redraw);
    return () => {
      video.removeEventListener('seeked', redraw);
      video.removeEventListener('loadeddata', redraw);
    };
  }, [drawVideoFrame]);

  // Reduced motion: pin to the first frame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (prefersReducedMotion && video.readyState >= 2) {
      video.currentTime = 0;
    }
  }, [prefersReducedMotion]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none w-screen h-screen overflow-hidden select-none">
      {/* Offscreen video source for the scrub animation */}
      <video
        ref={videoRef}
        src="/hero-animation.mp4"
        preload="auto"
        muted
        playsInline
        disablePictureInPicture
        className="absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none"
      />
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