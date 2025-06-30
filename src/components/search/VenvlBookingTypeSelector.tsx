
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
      label: 'إقامة يومية', 
      description: 'مثالي للرحلات القصيرة' 
    },
    { 
      id: 'monthly', 
      label: 'إقامة شهرية', 
      description: 'راحة طويلة المدى' 
    },
    { 
      id: 'flexible', 
      label: 'مرن', 
      description: 'أفضل العروض المتاحة' 
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="ghost"
              onClick={() => onTypeChange(type.id as any)}
              className={`relative px-8 py-4 rounded-xl font-medium transition-all duration-300 ${
                selectedType === type.id
                  ? 'bg-white text-black shadow-lg scale-[1.02]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
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
