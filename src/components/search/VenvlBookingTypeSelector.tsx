
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BookingTypeSelectorProps {
  selectedType: 'daily' | 'monthly' | 'flexible';
  onTypeChange: (type: 'daily' | 'monthly' | 'flexible') => void;
}

const VenvlBookingTypeSelector = ({ selectedType, onTypeChange }: BookingTypeSelectorProps) => {
  const bookingTypes = [
    { 
      id: 'daily', 
      label: 'Daily Stays', 
      description: 'Perfect for short trips' 
    },
    { 
      id: 'monthly', 
      label: 'Monthly Stays', 
      description: 'Long-term comfort' 
    },
    { 
      id: 'flexible', 
      label: 'Flexible', 
      description: 'Best deals available' 
    }
  ];

  return (
    <div className="flex justify-center">
      <div className="inline-flex p-1 bg-gray-100 rounded-xl">
        {bookingTypes.map((type) => (
          <motion.div
            key={type.id}
            className="relative"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="ghost"
              onClick={() => onTypeChange(type.id as any)}
              className={`relative px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                selectedType === type.id
                  ? 'bg-black text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <div className="text-center">
                <div className="text-sm font-semibold">{type.label}</div>
                <div className="text-xs opacity-70">{type.description}</div>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VenvlBookingTypeSelector;
