import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, RotateCcw, Check } from 'lucide-react';

export interface PriceRange {
  min: number;
  max: number;
}

export interface PricePreset {
  label: string;
  min: number;
  max: number;
}

interface CustomPriceFilterProps {
  bounds: PriceRange;
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  presets?: PricePreset[];
  step?: number;
  label?: string;
  className?: string;
  compact?: boolean;
}

export const CustomPriceFilter: React.FC<CustomPriceFilterProps> = ({
  bounds,
  value,
  onChange,
  presets = [],
  step = 500,
  label = 'Custom Price Filter',
  className = '',
  compact = false,
}) => {
  // Local input state for smooth typing without premature firing
  const [minInput, setMinInput] = useState<string>(value.min.toString());
  const [maxInput, setMaxInput] = useState<string>(
    value.max === Infinity ? bounds.max.toString() : value.max.toString()
  );
  const [showCustomInputs, setShowCustomInputs] = useState<boolean>(false);

  // Keep inputs synced when value prop changes externally
  useEffect(() => {
    setMinInput(value.min.toString());
    setMaxInput(value.max === Infinity ? bounds.max.toString() : value.max.toString());
  }, [value.min, value.max, bounds.max]);

  // Safe clamping values
  const currentMin = Math.max(bounds.min, Math.min(value.min, bounds.max));
  const currentMax = Math.min(
    bounds.max,
    Math.max(value.max === Infinity ? bounds.max : value.max, bounds.min)
  );

  const rangeSpan = Math.max(1, bounds.max - bounds.min);
  const leftPct = Math.max(0, Math.min(100, ((currentMin - bounds.min) / rangeSpan) * 100));
  const rightPct = Math.max(0, Math.min(100, 100 - ((currentMax - bounds.min) / rangeSpan) * 100));

  const handleSliderMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), currentMax);
    onChange({ min: newMin, max: currentMax });
  };

  const handleSliderMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), currentMin);
    onChange({ min: currentMin, max: newMax });
  };

  const applyCustomInputs = () => {
    let parsedMin = Number(minInput.replace(/[^0-9]/g, ''));
    let parsedMax = Number(maxInput.replace(/[^0-9]/g, ''));

    if (isNaN(parsedMin)) parsedMin = bounds.min;
    if (isNaN(parsedMax) || parsedMax <= 0) parsedMax = bounds.max;

    parsedMin = Math.max(bounds.min, parsedMin);
    parsedMax = Math.min(bounds.max, parsedMax);

    if (parsedMin > parsedMax) {
      const temp = parsedMin;
      parsedMin = parsedMax;
      parsedMax = temp;
    }

    setMinInput(parsedMin.toString());
    setMaxInput(parsedMax.toString());
    onChange({ min: parsedMin, max: parsedMax });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyCustomInputs();
    }
  };

  const handlePresetClick = (preset: PricePreset) => {
    const safeMax = preset.max === Infinity ? bounds.max : preset.max;
    onChange({ min: preset.min, max: safeMax });
  };

  const isPresetActive = (preset: PricePreset) => {
    const safePresetMax = preset.max === Infinity ? bounds.max : preset.max;
    const isMinMatch = value.min === preset.min;
    const isMaxMatch =
      value.max === safePresetMax || (preset.max === Infinity && value.max >= bounds.max);
    return isMinMatch && isMaxMatch;
  };

  const isFiltered = value.min > bounds.min || value.max < bounds.max;

  const handleReset = () => {
    setMinInput(bounds.min.toString());
    setMaxInput(bounds.max.toString());
    onChange({ min: bounds.min, max: bounds.max });
  };

  return (
    <div
      className={`bg-[#0E0F12]/80 border border-[#262930] rounded-2xl p-4 sm:p-5 text-xs text-[#CBD0DC] shadow-xl backdrop-blur-md space-y-4 ${className}`}
    >
      {/* Top Header: Title, Active Range, Reset & Custom Input Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="font-semibold uppercase tracking-wider text-[11px] text-[#F5F5F7]">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-[#E5C378] bg-[#181A1F] border border-[#262930] px-2.5 py-1 rounded-lg">
            Rs. {currentMin.toLocaleString()} – Rs. {currentMax.toLocaleString()}
          </span>

          <button
            type="button"
            onClick={() => setShowCustomInputs((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              showCustomInputs
                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                : 'bg-[#181A1F] border-[#262930] text-[#8E929E] hover:text-[#F5F5F7]'
            }`}
          >
            {showCustomInputs ? 'Hide Inputs' : 'Custom Enter'}
          </button>

          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] text-[#D4AF37] hover:underline cursor-pointer transition-opacity"
              title="Reset price filter to full range"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Price Chips (if provided) */}
      {presets.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={handleReset}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              !isFiltered
                ? 'bg-[#D4AF37] text-[#0B0C0E] shadow-sm'
                : 'bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930]'
            }`}
          >
            All Prices
          </button>
          {presets.map((preset) => {
            const active = isPresetActive(preset);
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#D4AF37] text-[#0B0C0E] shadow-sm'
                    : 'bg-[#181A1F] text-[#8E929E] hover:text-[#F5F5F7] border border-[#262930]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Interactive Dual Slider Track */}
      <div className="relative h-6 flex items-center px-1">
        {/* Track background */}
        <div className="absolute left-0 right-0 h-2 rounded-full bg-[#181A1F] border border-[#262930]" />

        {/* Active colored span */}
        <div
          className="absolute h-2 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#E5C378] to-[#D4AF37] shadow-sm"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />

        {/* Min Range Input */}
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={currentMin}
          onChange={handleSliderMin}
          aria-label="Minimum price slider"
          className="price-range-input absolute inset-0 w-full z-10"
        />

        {/* Max Range Input */}
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={currentMax}
          onChange={handleSliderMax}
          aria-label="Maximum price slider"
          className="price-range-input absolute inset-0 w-full z-20"
        />
      </div>

      {/* Custom Exact Number Inputs (Always visible or toggled based on preference) */}
      {(!compact || showCustomInputs) && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121316] p-3 rounded-xl border border-[#1F2228]">
          <div className="flex items-center gap-2 flex-1">
            {/* Min Input */}
            <div className="flex-1">
              <label htmlFor="custom-price-min" className="block text-[10px] uppercase tracking-wider text-[#8E929E] mb-1">
                Min (Rs.)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#626673] font-mono text-xs">
                  Rs.
                </span>
                <input
                  id="custom-price-min"
                  type="number"
                  min={bounds.min}
                  max={bounds.max}
                  step={step}
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={bounds.min.toString()}
                  className="w-full bg-[#0B0C0E] border border-[#262930] rounded-lg py-1.5 pl-9 pr-2 text-xs font-mono text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>
            </div>

            <span className="text-[#626673] pt-4 font-bold">–</span>

            {/* Max Input */}
            <div className="flex-1">
              <label htmlFor="custom-price-max" className="block text-[10px] uppercase tracking-wider text-[#8E929E] mb-1">
                Max (Rs.)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#626673] font-mono text-xs">
                  Rs.
                </span>
                <input
                  id="custom-price-max"
                  type="number"
                  min={bounds.min}
                  max={bounds.max}
                  step={step}
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={bounds.max.toString()}
                  className="w-full bg-[#0B0C0E] border border-[#262930] rounded-lg py-1.5 pl-9 pr-2 text-xs font-mono text-[#F5F5F7] focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="sm:pt-4">
            <button
              type="button"
              onClick={applyCustomInputs}
              className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C378] text-[#0B0C0E] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Price</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
