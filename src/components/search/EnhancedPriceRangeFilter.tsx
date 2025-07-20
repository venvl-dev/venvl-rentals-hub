import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePriceRange } from '@/hooks/usePriceRange';

interface EnhancedPriceRangeFilterProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  bookingType?: 'daily' | 'monthly';
  currency?: string;
  className?: string;
}

const EnhancedPriceRangeFilter: React.FC<EnhancedPriceRangeFilterProps> = ({ 
  value, 
  onChange, 
  bookingType = 'daily',
  currency = 'EGP',
  className = ''
}) => {
  const { priceRange: dbPriceRange, loading } = usePriceRange(bookingType);
  const [localMin, setLocalMin] = useState(value[0].toString());
  const [localMax, setLocalMax] = useState(value[1].toString());
  const debounceRef = useRef<NodeJS.Timeout>();

  // Initialize local inputs when value changes
  useEffect(() => {
    setLocalMin(value[0].toString());
    setLocalMax(value[1].toString());
  }, [value]);

  const debouncedOnChange = useCallback((newValue: [number, number]) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  }, [onChange]);

  const handleMinInputChange = useCallback((inputValue: string) => {
    setLocalMin(inputValue);
    // Allow typing intermediate values, validate on blur
    if (inputValue === '') return;
    
    const numValue = parseInt(inputValue) || dbPriceRange.min;
    const clampedValue = Math.max(dbPriceRange.min, Math.min(numValue, value[1] - 10));
    debouncedOnChange([clampedValue, value[1]]);
  }, [dbPriceRange.min, value, debouncedOnChange]);

  const handleMaxInputChange = useCallback((inputValue: string) => {
    setLocalMax(inputValue);
    // Allow typing intermediate values, validate on blur
    if (inputValue === '') return;
    
    const numValue = parseInt(inputValue) || dbPriceRange.max;
    const clampedValue = Math.min(dbPriceRange.max, Math.max(numValue, value[0] + 10));
    debouncedOnChange([value[0], clampedValue]);
  }, [dbPriceRange.max, value, debouncedOnChange]);

  const handleSliderChange = useCallback((newValues: number[]) => {
    const [min, max] = newValues;
    const newRange: [number, number] = [min, max];
    onChange(newRange);
    setLocalMin(min.toString());
    setLocalMax(max.toString());
  }, [onChange]);

  const handleInputBlur = useCallback(() => {
    // Validate and correct input values on blur
    setLocalMin(value[0].toString());
    setLocalMax(value[1].toString());
  }, [value]);

  const getCurrencyLabel = () => {
    switch (bookingType) {
      case 'daily': return 'per night';
      case 'monthly': return 'per month';
      default: return 'per night';
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString();
  };

  if (loading || !dbPriceRange || dbPriceRange.min <= 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Price range</h3>
          <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
          <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
        </div>
        <div className="animate-pulse bg-gray-200 h-6 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Price range</h3>
        <span className="text-sm text-gray-500 font-medium">{getCurrencyLabel()}</span>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min-price" className="text-sm font-medium text-gray-700">
            Minimum
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
              {currency}
            </span>
            <Input
              id="min-price"
              type="number"
              value={localMin}
              onChange={(e) => handleMinInputChange(e.target.value)}
              onBlur={handleInputBlur}
              className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-medium"
              placeholder={dbPriceRange.min.toString()}
              min={dbPriceRange.min}
              max={dbPriceRange.max}
              maxLength={10}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-price" className="text-sm font-medium text-gray-700">
            Maximum
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
              {currency}
            </span>
            <Input
              id="max-price"
              type="number"
              value={localMax}
              onChange={(e) => handleMaxInputChange(e.target.value)}
              onBlur={handleInputBlur}
              className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-medium"
              placeholder={dbPriceRange.max.toString()}
              min={dbPriceRange.min}
              max={dbPriceRange.max}
              maxLength={10}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              +
            </span>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-4">
        <Slider
          value={[value[0], value[1]]}
          onValueChange={handleSliderChange}
          min={dbPriceRange.min}
          max={dbPriceRange.max}
          step={10}
          className="w-full"
        />
        
        {/* Price Labels */}
        <div className="flex justify-between text-sm text-gray-500">
          <span>{currency} {formatPrice(dbPriceRange.min)}</span>
          <span>{currency} {formatPrice(dbPriceRange.max)}+</span>
        </div>
      </div>

      {/* Price Summary */}
      <div className="bg-black text-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-80">Selected range</span>
          <div className="text-right">
            <div className="text-lg font-bold">
              {currency} {formatPrice(value[0])} - {currency} {formatPrice(value[1])}
            </div>
            <div className="text-xs opacity-70">
              {getCurrencyLabel()}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Price Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Budget', range: [dbPriceRange.min, Math.round(dbPriceRange.min + (dbPriceRange.max - dbPriceRange.min) * 0.3)] },
          { label: 'Standard', range: [Math.round(dbPriceRange.min + (dbPriceRange.max - dbPriceRange.min) * 0.2), Math.round(dbPriceRange.min + (dbPriceRange.max - dbPriceRange.min) * 0.7)] },
          { label: 'Premium', range: [Math.round(dbPriceRange.min + (dbPriceRange.max - dbPriceRange.min) * 0.6), Math.round(dbPriceRange.min + (dbPriceRange.max - dbPriceRange.min) * 0.9)] },
          { label: 'Luxury', range: [Math.round(dbPriceRange.min + (dbPriceRange.max - dbPriceRange.min) * 0.8), dbPriceRange.max] },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.range as [number, number])}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
              value[0] === preset.range[0] && value[1] === preset.range[1]
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EnhancedPriceRangeFilter;