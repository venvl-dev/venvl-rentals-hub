import { Button } from '@/components/ui/button';

interface VenvlBookingTypeSelectorProps {
  selectedType: 'daily' | 'monthly' | 'flexible';
  onTypeChange: (type: 'daily' | 'monthly' | 'flexible') => void;
  isMobile?: boolean;
}

const VenvlBookingTypeSelector = ({ 
  selectedType, 
  onTypeChange, 
  isMobile = false 
}: VenvlBookingTypeSelectorProps) => {
  const bookingTypes = [
    { id: 'daily', label: 'Daily', description: 'Short-term stays' },
    { id: 'monthly', label: 'Monthly', description: 'Extended stays' },
    { id: 'flexible', label: 'Flexible', description: 'Best deals' }
  ] as const;

  if (isMobile) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="flex p-1 bg-muted rounded-lg">
          {bookingTypes.map((type) => (
            <Button
              key={type.id}
              variant="ghost"
              onClick={() => onTypeChange(type.id)}
              className={`
                flex-1 h-8 px-2 text-xs font-medium rounded-md transition-all duration-200
                ${selectedType === type.id 
                  ? 'bg-black text-white shadow-sm' 
                  : 'text-muted-foreground'
                }
              `}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="inline-flex p-1 bg-muted rounded-lg w-full">
        {bookingTypes.map((type) => (
          <Button
            key={type.id}
            variant="ghost"
            onClick={() => onTypeChange(type.id)}
            className={`
              flex-1 h-9 px-3 text-xs font-medium rounded-md transition-all duration-200
              ${selectedType === type.id 
                ? 'bg-black text-white shadow-sm' 
                : 'text-muted-foreground'
              }
            `}
          >
            {type.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default VenvlBookingTypeSelector;
