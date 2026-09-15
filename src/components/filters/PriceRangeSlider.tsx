import React, { useMemo } from 'react';

export interface PriceRange {
  min: number;
  max: number;
}

interface Props {
  bounds: PriceRange;
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  step?: number;
  label?: string;
  className?: string;
}

export const PriceRangeSlider: React.FC<Props> = ({
  bounds,
  value,
  onChange,
  step = 500,
  label = 'Price Range',
  className = '',
}) => {
  const handleMinChange = (raw: string) => {
    const newMin = Number(raw);
    onChange({ min: Math.min(newMin, value.max), max: value.max });
  };

  const handleMaxChange = (raw: string) => {
    const newMax = Number(raw);
    onChange({ min: value.min, max: Math.max(newMax, value.min) });
  };

  const rangeSpan = bounds.max - bounds.min || 1;
  const leftPct = ((value.min - bounds.min) / rangeSpan) * 100;
  const rightPct = 100 - ((value.max - bounds.min) / rangeSpan) * 100;

  return (
    <div className={`flex items-center gap-3 text-xs text-[#CBD0DC] ${className}`}>
      <label className="whitespace-nowrap">{label}:</label>

      <div className="relative flex-1 h-6">
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-[#262930]" />

        {/* Active fill between thumbs */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378]"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={value.min}
          onChange={(e) => handleMinChange(e.target.value)}
          aria-label="Minimum price"
          className="price-range-input absolute inset-0 w-full z-[2]"
        />

        {/* Max thumb */}
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={value.max}
          onChange={(e) => handleMaxChange(e.target.value)}
          aria-label="Maximum price"
          className="price-range-input absolute inset-0 w-full z-[1]"
        />
      </div>

      <span className="font-bold text-[#F5F5F7] whitespace-nowrap">
        Rs. {value.min.toLocaleString()} – Rs. {value.max.toLocaleString()}
      </span>
    </div>
  );
};
