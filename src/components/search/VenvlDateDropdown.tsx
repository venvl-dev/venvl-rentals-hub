
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VenvlDateDropdownProps {
  checkIn?: Date;
  checkOut?: Date;
  bookingType: 'daily' | 'monthly' | 'flexible';
  duration?: number;
  flexibleOption?: string;
  onDateChange: (dates: any) => void;
  onClose: () => void;
}

const VenvlDateDropdown = ({ 
  checkIn, 
  checkOut, 
  bookingType, 
  duration,
  flexibleOption,
  onDateChange, 
  onClose 
}: VenvlDateDropdownProps) => {
  const [selectedTab, setSelectedTab] = useState<'dates' | 'months' | 'flexible'>('dates');
  const [monthDuration, setMonthDuration] = useState(duration || 3);
  const [flexibleType, setFlexibleType] = useState(flexibleOption || 'weekend');

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (!checkIn || (checkIn && checkOut)) {
      onDateChange({ checkIn: date, checkOut: undefined });
    } else if (checkIn && !checkOut && date > checkIn) {
      onDateChange({ checkIn, checkOut: date });
    } else {
      onDateChange({ checkIn: date, checkOut: undefined });
    }
  };

  const handleMonthSelect = (months: number) => {
    setMonthDuration(months);
    onDateChange({ 
      bookingType: 'monthly', 
      duration: months,
      checkIn: undefined,
      checkOut: undefined 
    });
  };

  const handleFlexibleSelect = (type: string) => {
    setFlexibleType(type);
    onDateChange({ 
      bookingType: 'flexible', 
      flexibleOption: type,
      checkIn: undefined,
      checkOut: undefined 
    });
  };

  const flexibleOptions = [
    { id: 'weekend', label: 'Weekend' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' }
  ];

  const monthOptions = [
    { id: 'july', label: 'July', year: '2025' },
    { id: 'august', label: 'August', year: '2025' },
    { id: 'september', label: 'September', year: '2025' },
    { id: 'october', label: 'October', year: '2025' },
    { id: 'november', label: 'November', year: '2025' },
    { id: 'december', label: 'December', year: '2025' }
  ];

  return (
    <motion.div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 bg-gray-100 rounded-xl">
            {[
              { id: 'dates', label: 'Dates' },
              { id: 'months', label: 'Months' },
              { id: 'flexible', label: 'Flexible' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  selectedTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Based on Selected Tab */}
        {selectedTab === 'dates' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={handleDateSelect}
                className={cn("rounded-lg border", "pointer-events-auto")}
                initialFocus
              />
              <Calendar
                mode="single"
                selected={checkOut}
                onSelect={handleDateSelect}
                className={cn("rounded-lg border", "pointer-events-auto")}
                disabled={(date) => !checkIn || date <= checkIn}
              />
            </div>
            
            {/* Quick Select Options */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full"
                onClick={() => {/* Handle exact dates */}}
              >
                Exact dates
              </Button>
              {[1, 2, 3, 7, 14].map((days) => (
                <Button 
                  key={days}
                  variant="outline" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => {/* Handle flexible days */}}
                >
                  ± {days} day{days > 1 ? 's' : ''}
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'months' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">When's your trip?</h3>
              <div className="flex items-center justify-center space-x-8">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full bg-gray-200"></div>
                  <div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-red-500"
                    style={{ 
                      clipPath: `conic-gradient(from 0deg, transparent 0%, transparent ${(monthDuration / 12) * 100}%, rgba(0,0,0,0.1) ${(monthDuration / 12) * 100}%)`
                    }}
                  ></div>
                  <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">{monthDuration}</div>
                      <div className="text-sm text-gray-600">months</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Tue, Jul 1 to Wed, Oct 1
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'flexible' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-6">How long would you like to stay?</h3>
              <div className="flex justify-center space-x-4 mb-8">
                {flexibleOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={flexibleType === option.id ? "default" : "outline"}
                    onClick={() => handleFlexibleSelect(option.id)}
                    className="rounded-full px-6 py-2"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-center font-medium mb-4">Go anytime</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {monthOptions.map((month, index) => (
                  <motion.div
                    key={month.id}
                    className="p-4 border border-gray-200 rounded-xl hover:border-pink-500 cursor-pointer transition-colors text-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CalendarIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <div className="font-medium text-gray-900">{month.label}</div>
                    <div className="text-sm text-gray-500">{month.year}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} className="bg-gray-900 text-white hover:bg-gray-800 px-8">
            Done
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlDateDropdown;
