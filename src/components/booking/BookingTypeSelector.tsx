
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Zap } from 'lucide-react';

interface BookingTypeSelectorProps {
  bookingTypes: string[];
  selectedType: 'daily' | 'monthly';
  onTypeChange: (type: 'daily' | 'monthly') => void;
  dailyPrice: number;
  monthlyPrice?: number;
}

const BookingTypeSelector = ({ 
  bookingTypes, 
  selectedType, 
  onTypeChange, 
  dailyPrice, 
  monthlyPrice 
}: BookingTypeSelectorProps) => {
  const hasDaily = bookingTypes.includes('daily');
  const hasMonthly = bookingTypes.includes('monthly');
  const hasBoth = hasDaily && hasMonthly;

  if (!hasBoth) {
    // Show single type badge
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="secondary" 
          className="bg-black text-white px-4 py-2 rounded-full flex items-center gap-2"
        >
          {hasDaily ? (
            <>
              <Calendar className="h-4 w-4" />
              Daily stays
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" />
              Monthly stays
            </>
          )}
        </Badge>
        <div className="text-sm text-gray-600">
          {hasDaily ? `EGP ${dailyPrice} / night` : `EGP ${monthlyPrice} / month`}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-gradient-to-r from-gray-900 to-black text-white px-4 py-2 rounded-full flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Flexible booking
        </Badge>
        <span className="text-sm text-gray-600">Choose your preferred stay type</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          onClick={() => onTypeChange('daily')}
          className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
            selectedType === 'daily'
              ? 'border-black bg-gray-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              selectedType === 'daily' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <Calendar className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Daily stays</div>
              <div className="text-sm text-gray-500">Perfect for short trips</div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold text-gray-900">EGP {dailyPrice}</div>
            <div className="text-sm text-gray-500">per night</div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => onTypeChange('monthly')}
          className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
            selectedType === 'monthly'
              ? 'border-black bg-gray-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              selectedType === 'monthly' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Monthly stays</div>
              <div className="text-sm text-gray-500">Extended stays & savings</div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold text-gray-900">EGP {monthlyPrice}</div>
            <div className="text-sm text-gray-500">per month</div>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default BookingTypeSelector;
