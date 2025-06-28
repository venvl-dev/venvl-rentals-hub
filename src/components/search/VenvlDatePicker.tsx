
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

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
    flexibleOption?: string 
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
  onClose 
}: VenvlDatePickerProps) => {
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>(
    checkIn ? { from: checkIn, to: checkOut } : undefined
  );

  const flexibleOptions = [
    { value: 'weekend', label: 'Weekend Getaway', description: '2-3 nights' },
    { value: 'week', label: 'Week Stay', description: '7 nights' },
    { value: 'month', label: 'Month Stay', description: '30 nights' },
    { value: 'any', label: 'Flexible Dates', description: 'Any duration' }
  ];

  const handleDateSelect = (dateRange: DateRange | undefined) => {
    setSelectedDates(dateRange);
    onDateChange({ 
      checkIn: dateRange?.from, 
      checkOut: dateRange?.to 
    });
  };

  const handleMonthlyDuration = (months: number) => {
    const startDate = new Date();
    const endDate = addMonths(startDate, months);
    onDateChange({ checkIn: startDate, checkOut: endDate, duration: months });
  };

  const handleFlexibleSelect = (option: string) => {
    onDateChange({ flexibleOption: option });
  };

  return (
    <motion.div
      className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            {bookingType === 'daily' && 'Select dates'}
            {bookingType === 'monthly' && 'Choose duration'}
            {bookingType === 'flexible' && 'How long?'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Daily Booking */}
        {bookingType === 'daily' && (
          <div>
            <Calendar
              mode="range"
              selected={selectedDates}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              className="rounded-xl border-2 border-gray-100 p-4"
              classNames={{
                day_selected: "bg-black text-white hover:bg-gray-800",
                day_range_middle: "bg-gray-100",
                day_today: "bg-gray-100 text-gray-900 font-bold"
              }}
            />
          </div>
        )}

        {/* Monthly Booking */}
        {bookingType === 'monthly' && (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 mb-4">
              Choose how many months you'd like to stay
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[1, 2, 3, 6, 12].map((months) => (
                <motion.div
                  key={months}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={duration === months ? "default" : "outline"}
                    onClick={() => handleMonthlyDuration(months)}
                    className={`w-full h-20 flex flex-col items-center justify-center rounded-xl font-semibold ${
                      duration === months 
                        ? 'bg-black text-white hover:bg-gray-800' 
                        : 'border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg font-bold">{months}</span>
                    <span className="text-xs">month{months > 1 ? 's' : ''}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Flexible Booking */}
        {bookingType === 'flexible' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flexibleOptions.map((option) => (
              <motion.div
                key={option.value}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  flexibleOption === option.value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleFlexibleSelect(option.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-semibold text-lg mb-1">{option.label}</div>
                <div className={`text-sm ${
                  flexibleOption === option.value ? 'text-gray-200' : 'text-gray-500'
                }`}>
                  {option.description}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} className="text-gray-600">
            Cancel
          </Button>
          <Button onClick={onClose} className="bg-black text-white hover:bg-gray-800 px-8">
            Apply
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlDatePicker;
