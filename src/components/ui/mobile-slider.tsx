import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MobileSliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
}

export const MobileSlider: React.FC<MobileSliderProps> = ({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  className,
}) => {
  const [minValue, maxValue] = value;

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(parseInt(e.target.value), maxValue - step);
    onValueChange([newMin, maxValue]);
  }, [maxValue, step, onValueChange]);

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(parseInt(e.target.value), minValue + step);
    onValueChange([minValue, newMax]);
  }, [minValue, step, onValueChange]);

  const percentage1 = ((minValue - min) / (max - min)) * 100;
  const percentage2 = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className={cn('relative w-full py-4', className)}>
      {/* Track background */}
      <div className="relative h-3 bg-gray-200 rounded-full mb-8">
        {/* Active range */}
        <div
          className="absolute h-3 bg-primary rounded-full"
          style={{
            left: `${percentage1}%`,
            width: `${percentage2 - percentage1}%`,
          }}
        />
      </div>

      {/* Native range inputs - these work reliably on all mobile devices */}
      <div className="relative -mt-4">
        {/* Min range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={handleMinChange}
          className="absolute w-full h-3 bg-transparent appearance-none cursor-pointer range-slider range-slider-min"
          style={{
            background: 'transparent',
            pointerEvents: 'auto',
            zIndex: 1,
          }}
        />

        {/* Max range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute w-full h-3 bg-transparent appearance-none cursor-pointer range-slider range-slider-max"
          style={{
            background: 'transparent',
            pointerEvents: 'auto',
            zIndex: 2,
          }}
        />
      </div>

      {/* Custom CSS for range inputs */}
      <style jsx>{`
        .range-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 12px;
          background: transparent;
          outline: none;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .range-slider:hover {
          opacity: 1;
        }

        .range-slider::-webkit-slider-track {
          width: 100%;
          height: 12px;
          background: transparent;
          border-radius: 6px;
        }

        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 32px;
          width: 32px;
          border-radius: 50%;
          background: white;
          border: 3px solid hsl(var(--primary));
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        .range-slider::-moz-range-track {
          width: 100%;
          height: 12px;
          background: transparent;
          border-radius: 6px;
          border: none;
        }

        .range-slider::-moz-range-thumb {
          border: 3px solid hsl(var(--primary));
          height: 32px;
          width: 32px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          -moz-appearance: none;
        }

        /* Ensure max slider thumb appears on top */
        .range-slider-max::-webkit-slider-thumb {
          z-index: 3;
        }

        /* Make thumbs larger on mobile for better touch target */
        @media (max-width: 768px) {
          .range-slider::-webkit-slider-thumb {
            height: 40px;
            width: 40px;
          }

          .range-slider::-moz-range-thumb {
            height: 40px;
            width: 40px;
          }
        }
      `}</style>
    </div>
  );
};