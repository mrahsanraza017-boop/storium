import React from 'react';
import { CustomPriceFilter, PriceRange, PricePreset } from './CustomPriceFilter';

export type { PriceRange, PricePreset };
export { CustomPriceFilter };

interface LegacySliderProps {
  bounds: PriceRange;
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  step?: number;
  label?: string;
  className?: string;
}

export const PriceRangeSlider: React.FC<LegacySliderProps> = ({
  bounds,
  value,
  onChange,
  step = 500,
  label = 'Price Range',
  className = '',
}) => {
  return (
    <CustomPriceFilter
      bounds={bounds}
      value={value}
      onChange={onChange}
      step={step}
      label={label}
      className={className}
      compact={false}
    />
  );
};
