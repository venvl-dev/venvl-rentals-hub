
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BookingTypeSelectorProps {
  selectedType: 'daily' | 'monthly' | 'flexible';
  onTypeChange: (type: 'daily' | 'monthly' | 'flexible') => void;
}

const BookingTypeSelector = ({ selectedType, onTypeChange }: BookingTypeSelectorProps) => {
  const bookingTypes = [
    { 
      id: 'daily', 
      label: 'Daily', 
      description: 'Short-term stays' 
    },
    { 
      id: 'monthly', 
      label: 'Monthly', 
      description: 'Extended stays' 
    },
    { 
      id: 'flexible', 
      label: 'Flexible', 
      description: 'Best deals' 
    }
  ];

  return (
    <motion.div 
      className="flex justify-center"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="inline-flex p-1.5 bg-gray-100 rounded-2xl shadow-inner">
        {bookingTypes.map((type, index) => (
          <motion.div
            key={type.id}
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <motion.button
              onClick={() => onTypeChange(type.id as any)}
              className={`relative px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                selectedType === type.id
                  ? 'bg-black text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md'
              }`}
              whileHover={{ scale: selectedType === type.id ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <div className="text-base font-bold">{type.label}</div>
                <div className="text-xs opacity-75 mt-1">{type.description}</div>
              </div>
              
              {selectedType === type.id && (
                <motion.div
                  className="absolute inset-0 bg-black rounded-xl -z-10"
                  layoutId="activeTab"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default BookingTypeSelector;
