import React from 'react';

export const AmbientBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Breathing gold aurora glow that fills the blank areas behind the animation */}
      <div className="ambient-aurora absolute -inset-[15%]" />

      {/* Oversized slow-rotating STORIUM emblem watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/emblem-transparent.png"
          alt=""
          draggable={false}
          className="ambient-emblem w-[min(92vw,1200px)] max-w-none opacity-[0.12]"
        />
      </div>
    </div>
  );
};