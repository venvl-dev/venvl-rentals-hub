import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);

  const getPercentage = (val: number) => {
    if (max === min) return 0;
    return ((val - min) / (max - min)) * 100;
  };

  const getValueFromPosition = (clientX: number) => {
    if (!sliderRef.current) return min;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    let newValue = min + (percentage / 100) * (max - min);

    // Apply step rounding
    newValue = Math.round(newValue / step) * step;

    return Math.max(min, Math.min(max, newValue));
  };

  const handleStart = useCallback((index: number, clientX: number) => {
    setIsDragging(index);
    setDragStartX(clientX);
    setDragStartValue(value[index]);
  }, [value]);

  const handleMove = useCallback((clientX: number) => {
    if (isDragging === null) return;

    const newValue = getValueFromPosition(clientX);
    const newValues = [...value];

    if (isDragging === 0) {
      // Moving min thumb - ensure it doesn't go past max
      newValues[0] = Math.min(newValue, value[1] - step);
    } else {
      // Moving max thumb - ensure it doesn't go past min
      newValues[1] = Math.max(newValue, value[0] + step);
    }

    onValueChange(newValues);
  }, [isDragging, value, onValueChange, step]);

  const handleEnd = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Mouse events
  const handleMouseDown = useCallback((index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(index, e.clientX);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging !== null) {
      e.preventDefault();
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Touch events
  const handleTouchStart = useCallback((index: number) => (e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(index, e.touches[0].clientX);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging !== null && e.touches.length > 0) {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Track click/tap on slider track
  const handleTrackClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging !== null) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const newValue = getValueFromPosition(clientX);

    // Determine which thumb is closer
    const distToMin = Math.abs(newValue - value[0]);
    const distToMax = Math.abs(newValue - value[1]);

    const newValues = [...value];
    if (distToMin < distToMax) {
      newValues[0] = Math.min(newValue, value[1] - step);
    } else {
      newValues[1] = Math.max(newValue, value[0] + step);
    }

    onValueChange(newValues);
  }, [isDragging, value, onValueChange, step, getValueFromPosition]);

  // Event listeners
  useEffect(() => {
    if (isDragging !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const minPos = getPercentage(value[0]);
  const maxPos = getPercentage(value[1]);

  return (
    <div className={cn('relative w-full py-4', className)}>
      <div
        ref={sliderRef}
        className="relative h-4 w-full cursor-pointer"
        onClick={handleTrackClick}
        onTouchStart={handleTrackClick as any}
        style={{ touchAction: 'none' }}
      >
        {/* Track */}
        <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-gray-200" />

        {/* Active range */}
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary"
          style={{
            left: `${minPos}%`,
            width: `${maxPos - minPos}%`,
          }}
        />

        {/* Min thumb */}
        <div
          className={cn(
            "absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary bg-white shadow-lg transition-transform",
            isDragging === 0 ? "scale-110 cursor-grabbing" : "hover:scale-105"
          )}
          style={{ left: `${minPos}%`, touchAction: 'none' }}
          onMouseDown={handleMouseDown(0)}
          onTouchStart={handleTouchStart(0)}
        />

        {/* Max thumb */}
        <div
          className={cn(
            "absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary bg-white shadow-lg transition-transform",
            isDragging === 1 ? "scale-110 cursor-grabbing" : "hover:scale-105"
          )}
          style={{ left: `${maxPos}%`, touchAction: 'none' }}
          onMouseDown={handleMouseDown(1)}
          onTouchStart={handleTouchStart(1)}
        />
      </div>
    </div>
  );
};