
import { useState } from 'react';
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
  onClose 
}: VenvlDatePickerProps) => {
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | undefined>(checkIn);
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | undefined>(checkOut);
  const [selectedDuration, setSelectedDuration] = useState<number>(duration || 1);
  const [selectedFlexibleOption, setSelectedFlexibleOption] = useState<string>(flexibleOption || 'weekend');

  const handleApply = () => {
    if (bookingType === 'daily') {
      onDateChange({
        checkIn: selectedCheckIn,
        checkOut: selectedCheckOut
      });
    } else if (bookingType === 'monthly') {
      onDateChange({
        checkIn: selectedCheckIn,
        duration: selectedDuration
      });
    } else if (bookingType === 'flexible') {
      onDateChange({
        flexibleOption: selectedFlexibleOption
      });
    }
    onClose();
  };

  const flexibleOptions = [
    { id: 'weekend', label: 'Weekend stay', description: '2-3 days' },
    { id: 'week', label: 'Week stay', description: '7 days' },
    { id: 'month', label: 'Month stay', description: '28+ days' },
    { id: 'any', label: 'Flexible dates', description: 'Any length' }
  ];

  const updateDuration = (change: number) => {
    const newDuration = Math.max(1, Math.min(12, selectedDuration + change));
    setSelectedDuration(newDuration);
  };

  return (
    <motion.div
      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="p-4 w-80 sm:w-96">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              {bookingType === 'daily' ? 'Select dates' : 
               bookingType === 'monthly' ? 'Monthly stay' : 'Flexible dates'}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content based on booking type */}
        {bookingType === 'daily' && (
          <div className="space-y-4">
            <CalendarComponent
              mode="range"
              selected={{ from: selectedCheckIn, to: selectedCheckOut }}
              onSelect={(range) => {
                setSelectedCheckIn(range?.from);
                setSelectedCheckOut(range?.to);
              }}
              numberOfMonths={1}
              className="rounded-md border-0"
            />
          </div>
        )}

        {bookingType === 'monthly' && (
          <div className="space-y-4">
            {/* Compact Date Section */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">Start date</label>
              <CalendarComponent
                mode="single"
                selected={selectedCheckIn}
                onSelect={setSelectedCheckIn}
                numberOfMonths={1}
                className="rounded-md border border-gray-200 p-2 scale-90 origin-top"
                disabled={(date) => date < new Date()}
              />
            </div>

            {/* Compact Duration Section */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-3 block">Duration</label>
              
              {/* Duration Selector */}
              <div className="flex items-center justify-center gap-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateDuration(-1)}
                  disabled={selectedDuration <= 1}
                  className="w-8 h-8 rounded-full p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{selectedDuration}</div>
                  <div className="text-xs text-gray-500">
                    {selectedDuration === 1 ? 'month' : 'months'}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateDuration(1)}
                  disabled={selectedDuration >= 12}
                  className="w-8 h-8 rounded-full p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Quick Duration Options */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[1, 3, 6, 12].map((month) => (
                  <Button
                    key={month}
                    variant={selectedDuration === month ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDuration(month)}
                    className="text-xs h-8"
                  >
                    {month}m
                  </Button>
                ))}
              </div>
            </div>

            {/* Compact Summary */}
            {selectedCheckIn && (
              <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                <strong>{selectedDuration}</strong> month{selectedDuration > 1 ? 's' : ''} from{' '}
                <strong>{selectedCheckIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
              </div>
            )}
          </div>
        )}

        {bookingType === 'flexible' && (
          <div className="space-y-2">
            {flexibleOptions.map((option) => (
              <motion.div
                key={option.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedFlexibleOption === option.id
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFlexibleOption(option.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="font-medium text-sm text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} className="text-gray-600 text-sm">
            Cancel
          </Button>
          <Button onClick={handleApply} className="bg-black text-white hover:bg-gray-800 px-6 text-sm">
            Apply
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlDatePicker;
