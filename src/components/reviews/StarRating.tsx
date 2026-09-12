import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: 1 | 2 | 3 | 4 | 5) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  showValue?: boolean;
}

const SIZE_MAP = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4.5 h-4.5',
  lg: 'w-6 h-6',
};

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 'md',
  readOnly = true,
  showValue = false,
}) => {
  const interactive = Boolean(onChange) && !readOnly;
  const clamped = Math.max(0, Math.min(5, value));

  if (!interactive) {
    return (
      <div className="inline-flex items-center gap-1.5" role="img" aria-label={`${clamped.toFixed(1)} out of 5 stars`}>
        <div className="inline-flex items-center gap-0.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((star) => {
            const fillRatio = Math.max(0, Math.min(1, clamped - (star - 1)));
            const isFull = fillRatio >= 0.99;
            const isEmpty = fillRatio <= 0.01;

            return (
              <span key={star} className="relative inline-block select-none">
                <Star className={`${SIZE_MAP[size]} text-[#3A3D46]`} strokeWidth={1.5} />
                {!isEmpty && (
                  <span
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ width: isFull ? '100%' : `${fillRatio * 100}%` }}
                  >
                    <Star className={`${SIZE_MAP[size]} text-[#D4AF37] fill-[#D4AF37]`} strokeWidth={1.5} />
                  </span>
                )}
              </span>
            );
          })}
        </div>
        {showValue && (
          <span className="text-xs font-semibold text-[#E5C378] tabular-nums">
            {clamped.toFixed(1)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5" role="radiogroup" aria-label="Rate this product">
      <div className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fillRatio = Math.max(0, Math.min(1, clamped - (star - 1)));
          const isFull = fillRatio >= 0.99;
          const isEmpty = fillRatio <= 0.01;

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={Math.round(clamped) === star}
              onClick={() => onChange?.(star as 1 | 2 | 3 | 4 | 5)}
              className="cursor-pointer hover:scale-110 relative transition-transform focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
            >
              <Star className={`${SIZE_MAP[size]} text-[#3A3D46]`} strokeWidth={1.5} />
              {!isEmpty && (
                <span
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: isFull ? '100%' : `${fillRatio * 100}%` }}
                >
                  <Star className={`${SIZE_MAP[size]} text-[#D4AF37] fill-[#D4AF37]`} strokeWidth={1.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-[#E5C378] tabular-nums">
          {clamped.toFixed(1)}
        </span>
      )}
    </div>
  );
};
