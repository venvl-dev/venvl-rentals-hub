import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BookingTypeSelectorProps {
  selectedType: 'daily' | 'monthly' | 'flexible';
  onTypeChange: (type: 'daily' | 'monthly' | 'flexible') => void;
}

const BookingTypeSelector = ({
  selectedType,
  onTypeChange,
}: BookingTypeSelectorProps) => {
  const bookingTypes = [
    {
      id: 'daily',
      label: 'Daily',
      description: 'Short-term stays',
    },
    {
      id: 'monthly',
      label: 'Monthly',
      description: 'Extended stays',
    },
    {
      id: 'flexible',
      label: 'Flexible',
      description: 'Best deals',
    },
  ];

  return (
    <motion.div
      className='w-full max-w-md mx-auto'
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Desktop & Tablet View */}
      <div className='hidden sm:block'>
        <div className='inline-flex p-1 bg-muted rounded-lg w-full'>
          {bookingTypes.map((type, index) => (
            <motion.div
              key={type.id}
              className='flex-1'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant='ghost'
                onClick={() =>
                  onTypeChange(type.id as 'daily' | 'monthly' | 'flexible')
                }
                className={`
                  w-full h-9 px-3 text-xs font-medium rounded-md transition-all duration-200
                  ${
                    selectedType === type.id
                      ? 'bg-black text-white shadow-sm'
                      : 'text-muted-foreground'
                  }
                `}
              >
                {type.label}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile View */}
      <div className='block sm:hidden'>
        <div className='flex p-1 bg-muted rounded-lg'>
          {bookingTypes.map((type, index) => (
            <motion.div
              key={type.id}
              className='flex-1'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant='ghost'
                onClick={() =>
                  onTypeChange(type.id as 'daily' | 'monthly' | 'flexible')
                }
                className={`
                  w-full h-8 px-2 text-xs font-medium rounded-md transition-all duration-200
                  ${
                    selectedType === type.id
                      ? 'bg-black text-white shadow-sm'
                      : 'text-muted-foreground'
                  }
                `}
              >
                {type.label}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default BookingTypeSelector;
