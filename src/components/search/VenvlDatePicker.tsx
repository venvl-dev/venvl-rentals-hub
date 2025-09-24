import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, X, Clock, Minus, Plus } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface VenvlDatePickerProps {
  checkIn?: Date;
  checkOut?: Date;
  bookingType: 'daily' | 'monthly' | 'flexible';
  duration?: number;
  flexibleOption?: string;
  onDateChange: (dates: {
    checkIn?: Date;
    checkOut?: Date;
    duration?: number;
    flexibleOption?: string;
  }) => void;
  onClose: () => void;
}

const VenvlDatePicker = ({
  checkIn,
  checkOut,
  bookingType,
  duration,
  flexibleOption,
  onDateChange,
  onClose,
}: VenvlDatePickerProps) => {
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | undefined>(
    checkIn,
  );
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | undefined>(
    checkOut,
  );
  const [selectedDuration, setSelectedDuration] = useState<number>(
    duration || 1,
  );
  const [selectedFlexibleOption, setSelectedFlexibleOption] = useState<string>(
    flexibleOption || 'weekend',
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleApply = () => {
    if (bookingType === 'daily') {
      onDateChange({
        checkIn: selectedCheckIn,
        checkOut: selectedCheckOut,
      });
    } else if (bookingType === 'monthly') {
      onDateChange({
        checkIn: selectedCheckIn,
        duration: selectedDuration,
      });
    } else if (bookingType === 'flexible') {
      onDateChange({
        flexibleOption: selectedFlexibleOption,
      });
    }
    onClose();
  };

  const flexibleOptions = [
    { id: 'weekend', label: 'Weekend stay', description: '2-3 days' },
    { id: 'week', label: 'Week stay', description: '7 days' },
    { id: 'month', label: 'Month stay', description: '28+ days' },
    { id: 'any', label: 'Flexible dates', description: 'Any duration' },
  ];

  const updateDuration = (change: number) => {
    const newDuration = Math.max(1, Math.min(12, selectedDuration + change));
    setSelectedDuration(newDuration);
  };

  return (
    <motion.div
      ref={containerRef}
      className='bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden'
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className='p-6 w-96'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 bg-black rounded-xl'>
              <Calendar className='h-5 w-5 text-white' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>
              {bookingType === 'daily'
                ? 'Select dates'
                : bookingType === 'monthly'
                  ? 'Monthly stay'
                  : 'Flexible dates'}
            </h3>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={onClose}
            className='h-8 w-8 p-0 rounded-full hover:bg-gray-100'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        {/* Content based on booking type */}
        {bookingType === 'daily' && (
          <div className='space-y-4'>
            <CalendarComponent
              mode='range'
              selected={{ from: selectedCheckIn, to: selectedCheckOut }}
              onSelect={(range) => {
                setSelectedCheckIn(range?.from);
                setSelectedCheckOut(range?.to);
              }}
              numberOfMonths={1}
              className='rounded-xl border border-gray-200 p-3'
            />
          </div>
        )}

        {bookingType === 'monthly' && (
          <div className='space-y-6'>
            {/* Start Date Section */}
            <div>
              <label className='text-sm font-semibold text-gray-900 mb-3 block'>
                Start date
              </label>
              <CalendarComponent
                mode='single'
                selected={selectedCheckIn}
                onSelect={setSelectedCheckIn}
                numberOfMonths={1}
                className='rounded-xl border border-gray-200 p-3'
                disabled={(date) => date < new Date()}
              />
            </div>

            {/* Duration Section */}
            <div>
              <label className='text-sm font-semibold text-gray-900 mb-4 block'>
                Duration
              </label>

              {/* Duration Selector */}
              <div className='flex items-center justify-center gap-6 py-4 bg-gray-50 rounded-xl'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => updateDuration(-1)}
                  disabled={selectedDuration <= 1}
                  className='w-10 h-10 rounded-full border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white disabled:opacity-30'
                >
                  <Minus className='h-4 w-4' />
                </Button>

                <div className='text-center'>
                  <div className='text-3xl font-bold text-black mb-1'>
                    {selectedDuration}
                  </div>
                  <div className='text-sm text-gray-500'>
                    {selectedDuration === 1 ? 'month' : 'months'}
                  </div>
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => updateDuration(1)}
                  disabled={selectedDuration >= 12}
                  className='w-10 h-10 rounded-full border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white disabled:opacity-30'
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>

              {/* Quick Duration Options */}
              <div className='grid grid-cols-4 gap-2 mt-4'>
                {[1, 3, 6, 12].map((month) => (
                  <Button
                    key={month}
                    variant={selectedDuration === month ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedDuration(month)}
                    className={`h-10 text-sm font-medium ${
                      selectedDuration === month
                        ? 'bg-black text-white'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    {month} {month === 1 ? 'month' : 'months'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedCheckIn && (
              <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800'>
                <strong>{selectedDuration}</strong>{' '}
                {selectedDuration === 1 ? 'month' : 'months'} starting from{' '}
                <strong>
                  {selectedCheckIn.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </strong>
              </div>
            )}
          </div>
        )}

        {bookingType === 'flexible' && (
          <div className='space-y-3'>
            {flexibleOptions.map((option, index) => (
              <motion.div
                key={option.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedFlexibleOption === option.id
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedFlexibleOption(option.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className='flex items-center gap-4'>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedFlexibleOption === option.id
                        ? 'bg-black'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Clock
                      className={`h-4 w-4 ${
                        selectedFlexibleOption === option.id
                          ? 'text-white'
                          : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div>
                    <div className='font-semibold text-sm text-gray-900'>
                      {option.label}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {option.description}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex justify-between items-center mt-8 pt-6 border-t border-gray-100'>
          <Button
            variant='ghost'
            onClick={onClose}
            className='text-gray-600 hover:text-gray-900 font-medium'
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className='bg-black text-white hover:bg-gray-800 px-8 py-2 rounded-xl font-semibold shadow-lg'
          >
            Apply
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlDatePicker;
