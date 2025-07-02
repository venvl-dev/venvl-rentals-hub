
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
    <div className="flex justify-center w-full">
      <div className="flex flex-col sm:flex-row w-full max-w-lg bg-muted rounded-2xl p-1 gap-1 sm:gap-0">
        {bookingTypes.map((type) => (
          <div key={type.id} className="flex-1">
            <Button
              variant="ghost"
              onClick={() => onTypeChange(type.id as any)}
              className={`w-full px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-medium transition-colors duration-200 ${
                selectedType === type.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <div className="text-center">
                <div className="text-sm font-semibold">{type.label}</div>
                <div className="text-xs opacity-75 mt-0.5 hidden sm:block">{type.description}</div>
              </div>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VenvlBookingTypeSelector;
