import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePriceRange } from '@/hooks/usePriceRange';

interface PriceRangeFilterProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  bookingType?: 'daily' | 'monthly';
  currency?: string;
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  value,
  onChange,
  bookingType = 'daily',
  currency = 'EGP',
}) => {
  const { priceRange, loading } = usePriceRange(bookingType);
  const [localMin, setLocalMin] = useState(value[0].toString());
  const [localMax, setLocalMax] = useState(value[1].toString());
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Sync with props
  useEffect(() => {
    setLocalMin(value[0].toString());
    setLocalMax(value[1].toString());
  }, [value]);

  // Auto-update price range when booking type changes or data loads
  useEffect(() => {
    if (!loading && priceRange.min > 0) {
      onChange([priceRange.min, priceRange.max]);
    }
  }, [loading, priceRange.min, priceRange.max, bookingType, onChange]);

  const handleInputChange = useCallback(
    (type: 'min' | 'max', inputValue: string) => {
      if (type === 'min') {
        setLocalMin(inputValue);
        const numValue = parseInt(inputValue) || priceRange.min;
        const clampedValue = Math.max(
          priceRange.min,
          Math.min(numValue, value[1] - 10),
        );
        onChange([clampedValue, value[1]]);
      } else {
        setLocalMax(inputValue);
        const numValue = parseInt(inputValue) || priceRange.max;
        const clampedValue = Math.min(
          priceRange.max,
          Math.max(numValue, value[0] + 10),
        );
        onChange([value[0], clampedValue]);
      }
    },
    [priceRange.min, priceRange.max, value, onChange],
  );

  const getPosition = (val: number) => {
    if (priceRange.max === priceRange.min) return 0;
    return ((val - priceRange.min) / (priceRange.max - priceRange.min)) * 100;
  };

  const handleSliderClick = useCallback(
    (e: React.MouseEvent) => {
      if (!sliderRef.current || isDragging) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      const newValue =
        priceRange.min + (percent / 100) * (priceRange.max - priceRange.min);

      const distToMin = Math.abs(newValue - value[0]);
      const distToMax = Math.abs(newValue - value[1]);

      if (distToMin < distToMax) {
        onChange([Math.round(newValue), value[1]]);
      } else {
        onChange([value[0], Math.round(newValue)]);
      }
    },
    [priceRange.min, priceRange.max, value, onChange, isDragging],
  );

  const handleMouseDown = useCallback(
    (type: 'min' | 'max') => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(type);

      const startX = e.clientX;
      const startValue = type === 'min' ? value[0] : value[1];
      const sliderWidth =
        sliderRef.current?.getBoundingClientRect().width || 300;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaPercent = (deltaX / sliderWidth) * 100;
        const deltaValue =
          (deltaPercent / 100) * (priceRange.max - priceRange.min);

        if (type === 'min') {
          const newValue = Math.max(
            priceRange.min,
            Math.min(startValue + deltaValue, value[1] - 10),
          );
          onChange([Math.round(newValue), value[1]]);
        } else {
          const newValue = Math.min(
            priceRange.max,
            Math.max(startValue + deltaValue, value[0] + 10),
          );
          onChange([value[0], Math.round(newValue)]);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [priceRange.min, priceRange.max, value, onChange],
  );

  const handleTouchStart = useCallback(
    (type: 'min' | 'max') => (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(type);

      const startX = e.touches[0].clientX;
      const startValue = type === 'min' ? value[0] : value[1];
      const sliderWidth =
        sliderRef.current?.getBoundingClientRect().width || 300;

      const handleTouchMove = (e: TouchEvent) => {
        const deltaX = e.touches[0].clientX - startX;
        const deltaPercent = (deltaX / sliderWidth) * 100;
        const deltaValue =
          (deltaPercent / 100) * (priceRange.max - priceRange.min);

        if (type === 'min') {
          const newValue = Math.max(
            priceRange.min,
            Math.min(startValue + deltaValue, value[1] - 10),
          );
          onChange([Math.round(newValue), value[1]]);
        } else {
          const newValue = Math.min(
            priceRange.max,
            Math.max(startValue + deltaValue, value[0] + 10),
          );
          onChange([value[0], Math.round(newValue)]);
        }
      };

      const handleTouchEnd = () => {
        setIsDragging(null);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    },
    [priceRange.min, priceRange.max, value, onChange],
  );

  const getCurrencyLabel = () => {
    switch (bookingType) {
      case 'daily':
        return 'per night';
      case 'monthly':
        return 'per month';
      default:
        return 'per night';
    }
  };

  const minPosition = getPosition(value[0]);
  const maxPosition = getPosition(value[1]);

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>Price range</h3>
          <div className='animate-pulse bg-gray-200 h-4 w-32 rounded'></div>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='animate-pulse bg-gray-200 h-12 rounded-lg'></div>
          <div className='animate-pulse bg-gray-200 h-12 rounded-lg'></div>
        </div>
        <div className='animate-pulse bg-gray-200 h-8 rounded-lg'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>Price range</h3>
        <span className='text-sm text-gray-500 font-medium'>
          {getCurrencyLabel()}
        </span>
      </div>

      {/* Input Fields */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-700'>Minimum</label>
          <div className='relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium'>
              {currency}
            </span>
            <input
              type='text'
              value={localMin}
              onChange={(e) => handleInputChange('min', e.target.value)}
              onBlur={() => setLocalMin(value[0].toString())}
              className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-medium'
              placeholder={priceRange.min.toString()}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-700'>Maximum</label>
          <div className='relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium'>
              {currency}
            </span>
            <input
              type='text'
              value={localMax}
              onChange={(e) => handleInputChange('max', e.target.value)}
              onBlur={() => setLocalMax(value[1].toString())}
              className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-medium'
              placeholder={priceRange.max.toString()}
            />
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>
              +
            </span>
          </div>
        </div>
      </div>

      {/* Simplified Range Slider */}
      <div className='space-y-4'>
        <div
          ref={sliderRef}
          className='relative h-3 bg-gray-200 rounded-full cursor-pointer'
          onClick={handleSliderClick}
        >
          {/* Active Range */}
          <div
            className='absolute h-3 bg-black rounded-full transition-all duration-100'
            style={{
              left: `${minPosition}%`,
              width: `${maxPosition - minPosition}%`,
            }}
          />

          {/* Min Thumb */}
          <div
            className={`absolute w-6 h-6 bg-white border-3 border-black rounded-full shadow-lg cursor-grab transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ${
              isDragging === 'min'
                ? 'scale-110 cursor-grabbing'
                : 'hover:scale-105'
            }`}
            style={{ left: `${minPosition}%`, top: '50%' }}
            onMouseDown={handleMouseDown('min')}
            onTouchStart={handleTouchStart('min')}
          />

          {/* Max Thumb */}
          <div
            className={`absolute w-6 h-6 bg-white border-3 border-black rounded-full shadow-lg cursor-grab transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ${
              isDragging === 'max'
                ? 'scale-110 cursor-grabbing'
                : 'hover:scale-105'
            }`}
            style={{ left: `${maxPosition}%`, top: '50%' }}
            onMouseDown={handleMouseDown('max')}
            onTouchStart={handleTouchStart('max')}
          />
        </div>

        {/* Price Labels */}
        <div className='flex justify-between text-sm text-gray-500'>
          <span>
            {currency} {priceRange.min.toLocaleString()}
          </span>
          <span>
            {currency} {priceRange.max.toLocaleString()}+
          </span>
        </div>
      </div>

      {/* Price Summary */}
      <div className='bg-black text-white rounded-xl p-4'>
        <div className='flex items-center justify-between'>
          <span className='text-sm opacity-80'>Selected range</span>
          <div className='text-right'>
            <div className='text-lg font-bold'>
              {currency} {value[0].toLocaleString()} - {currency}{' '}
              {value[1].toLocaleString()}
            </div>
            <div className='text-xs opacity-70'>{getCurrencyLabel()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceRangeFilter;
