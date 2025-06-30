
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
      label: 'Daily Stay', 
      description: 'Perfect for short trips' 
    },
    { 
      id: 'monthly', 
      label: 'Monthly Stay', 
      description: 'Long-term comfort' 
    },
    { 
      id: 'flexible', 
      label: 'Flexible', 
      description: 'Best available deals' 
    }
  ];

  return (
    <div className="flex justify-center">
      <div className="inline-flex p-2 bg-gray-100 rounded-2xl border border-gray-100 shadow-sm">
        {bookingTypes.map((type, index) => (
          <motion.div
            key={type.id}
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="ghost"
              onClick={() => onTypeChange(type.id as any)}
              className={`relative px-8 py-4 rounded-xl font-medium transition-all duration-300 ${
                selectedType === type.id
                  ? 'bg-black text-white shadow-lg'
                  : 'text-gray-600'
              }`}
            >
              <div className="text-center">
                <div className="text-sm font-semibold">{type.label}</div>
                <div className="text-xs opacity-80 mt-1">{type.description}</div>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VenvlBookingTypeSelector;
