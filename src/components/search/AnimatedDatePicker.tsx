
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedDatePickerProps {
  bookingType: 'daily' | 'monthly' | 'flexible';
  checkIn?: Date;
  checkOut?: Date;
  duration?: number;
  flexibleOption?: string;
  minDays?: number;
  minMonths?: number;
  isActive: boolean;
  onDateChange: (dates: any) => void;
}

const AnimatedDatePicker = ({ 
  bookingType, 
  checkIn, 
  checkOut, 
  duration,
  flexibleOption,
  minDays,
  minMonths,
  isActive 
}: AnimatedDatePickerProps) => {
  
  const getDateDisplayText = () => {
    if (bookingType === 'monthly' && duration) {
      return `${duration} month${duration > 1 ? 's' : ''}`;
    }
    
    if (bookingType === 'flexible') {
      if (minDays && minMonths) {
        return `${minDays}+ days, ${minMonths}+ months`;
      }
      if (minDays) return `${minDays}+ days`;
      if (minMonths) return `${minMonths}+ months`;
      if (flexibleOption) {
        const options = {
          weekend: 'Weekend stay',
          week: 'Week stay', 
          month: 'Month stay',
          any: 'Flexible dates'
        };
        return options[flexibleOption as keyof typeof options] || 'Flexible';
      }
      return 'Flexible dates';
    }
    
    if (checkIn) {
      const checkInStr = checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (checkOut) {
        const checkOutStr = checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${checkInStr} - ${checkOutStr}`;
      }
      return `${checkInStr} - Add dates`;
    }
    
    return 'Add dates';
  };

  return (
    <motion.div
      key={bookingType}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">
        <AnimatePresence mode="wait">
          <motion.span
            key={bookingType}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {bookingType === 'daily' ? 'Check-in · Check-out' : 
             bookingType === 'monthly' ? 'Duration' : 'When'}
          </motion.span>
        </AnimatePresence>
      </div>
      
      <motion.div 
        className={`text-sm font-medium truncate transition-colors duration-200 ${
          isActive ? 'text-white' : 'text-gray-900'
        }`}
        animate={{ scale: isActive ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={`${bookingType}-${getDateDisplayText()}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {getDateDisplayText()}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedDatePicker;
