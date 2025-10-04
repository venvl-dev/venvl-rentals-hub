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
    const newMin = Math.min(parseInt(e.target.value) || min, maxValue - step);
    onValueChange([newMin, maxValue]);
  }, [maxValue, step, onValueChange, min]);

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(parseInt(e.target.value) || max, minValue + step);
    onValueChange([minValue, newMax]);
  }, [minValue, step, onValueChange, max]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mobile-friendly number inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Minimum Price</label>
          <input
            type="number"
            min={min}
            max={max - step}
            step={step}
            value={minValue}
            onChange={handleMinChange}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-medium"
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Maximum Price</label>
          <input
            type="number"
            min={min + step}
            max={max}
            step={step}
            value={maxValue}
            onChange={handleMaxChange}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-medium"
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
          />
        </div>
      </div>

      {/* Range indicator */}
      <div className="bg-black text-white rounded-xl p-4">
        <div className="text-center">
          <div className="text-sm opacity-80 mb-1">Selected Price Range</div>
          <div className="text-lg font-bold">
            {formatPrice(minValue)} - {formatPrice(maxValue)}
          </div>
        </div>
      </div>

      {/* Range limits */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>Min: {formatPrice(min)}</span>
        <span>Max: {formatPrice(max)}</span>
      </div>
    </div>
  );
};