
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, addDays, addMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface DatePickerProps {
  checkIn?: Date;
  checkOut?: Date;
  bookingType: 'daily' | 'monthly' | 'flexible';
  onDateChange: (dates: { checkIn?: Date; checkOut?: Date; duration?: number; flexibleOption?: string }) => void;
  onBookingTypeChange: (type: 'daily' | 'monthly' | 'flexible') => void;
  onClose: () => void;
}

const DatePicker = ({ checkIn, checkOut, bookingType, onDateChange, onBookingTypeChange, onClose }: DatePickerProps) => {
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>(
    checkIn ? { from: checkIn, to: checkOut } : undefined
  );
  const [duration, setDuration] = useState(1);
  const [flexibleOption, setFlexibleOption] = useState('weekend');

  const bookingTypeOptions = [
    { value: 'daily', label: 'Dates', description: 'Select check-in and check-out' },
    { value: 'monthly', label: 'Months', description: 'Stay for a month or longer' },
    { value: 'flexible', label: "I'm flexible", description: 'Find great deals on flexible dates' }
  ];

  const flexibleOptions = [
    { value: 'weekend', label: 'Weekend', description: '2-3 nights' },
    { value: 'week', label: 'A week', description: '7 nights' },
    { value: 'month', label: 'A month', description: '30 nights' },
    { value: 'any', label: "I'm flexible", description: 'Any duration' }
  ];

  const handleDateSelect = (dateRange: DateRange | undefined) => {
    setSelectedDates(dateRange);
    onDateChange({ 
      checkIn: dateRange?.from, 
      checkOut: dateRange?.to 
    });
  };

  const handleMonthlyDuration = (months: number) => {
    setDuration(months);
    const startDate = new Date();
    const endDate = addMonths(startDate, months);
    onDateChange({ checkIn: startDate, checkOut: endDate, duration: months });
  };

  const handleFlexibleSelect = (option: string) => {
    setFlexibleOption(option);
    onDateChange({ flexibleOption: option });
  };

  return (
    <motion.div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-6">
        {/* Booking Type Selector */}
        <div className="mb-6">
          <div className="flex space-x-2 mb-4">
            {bookingTypeOptions.map((option) => (
              <Button
                key={option.value}
                variant={bookingType === option.value ? "default" : "outline"}
                onClick={() => onBookingTypeChange(option.value as 'daily' | 'monthly' | 'flexible')}
                className={`px-4 py-2 rounded-full transition-all duration-200 ${
                  bookingType === option.value ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Content based on booking type */}
        {bookingType === 'daily' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Check-in</h3>
              <Calendar
                mode="range"
                selected={selectedDates}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
          </div>
        )}

        {bookingType === 'monthly' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">How long would you like to stay?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 6, 12].map((months) => (
                <Button
                  key={months}
                  variant={duration === months ? "default" : "outline"}
                  onClick={() => handleMonthlyDuration(months)}
                  className="p-4 h-auto flex flex-col items-center justify-center rounded-xl"
                >
                  <span className="font-semibold">{months}</span>
                  <span className="text-sm">month{months > 1 ? 's' : ''}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {bookingType === 'flexible' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">How long would you like to stay?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {flexibleOptions.map((option) => (
                <motion.div
                  key={option.value}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    flexibleOption === option.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleFlexibleSelect(option.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose} className="bg-gray-900 text-white hover:bg-gray-800">
            Save
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DatePicker;
