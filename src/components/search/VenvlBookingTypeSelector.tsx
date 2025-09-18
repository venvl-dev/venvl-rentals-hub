import { Button } from '@/components/ui/button';

interface BookingTypeSelectorProps {
  selectedType: 'daily' | 'monthly' | 'flexible';
  onTypeChange: (type: 'daily' | 'monthly' | 'flexible') => void;
}

const VenvlBookingTypeSelector = ({ selectedType, onTypeChange }: BookingTypeSelectorProps) => {
  console.log('🎛️ VenvlBookingTypeSelector rendered with selectedType:', selectedType);
  
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

  const handleTypeClick = (type: 'daily' | 'monthly' | 'flexible') => {
    console.log('🎛️ VenvlBookingTypeSelector - Button clicked:', type);
    console.log('🎛️ Current selectedType:', selectedType);
    console.log('🎛️ Calling onTypeChange...');
    onTypeChange(type);
    console.log('🎛️ onTypeChange called successfully');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Desktop & Tablet View */}
      <div className="hidden sm:block">
        <div className="inline-flex p-1 bg-muted rounded-lg w-full">
          {bookingTypes.map((type) => (
            <Button
              key={type.id}
              variant="ghost"
              onClick={() => handleTypeClick(type.id as 'daily' | 'monthly' | 'flexible')}
              className={`
                flex-1 h-9 px-3 text-xs font-medium rounded-md transition-all duration-200
                ${selectedType === type.id 
                  ? 'bg-black text-white shadow-sm hover:bg-black hover:text-white' 
                  : 'text-muted-foreground hover:bg-gray-50 hover:text-muted-foreground'
                }
              `}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile View - More Compact */}
      <div className="block sm:hidden">
        <div className="flex p-1 bg-muted rounded-lg">
          {bookingTypes.map((type) => (
            <Button
              key={type.id}
              variant="ghost"
              onClick={() => handleTypeClick(type.id as 'daily' | 'monthly' | 'flexible')}
              className={`
                flex-1 h-8 px-2 text-xs font-medium rounded-md transition-all duration-200
                ${selectedType === type.id 
                  ? 'bg-black text-white shadow-sm hover:bg-black hover:text-white' 
                  : 'text-muted-foreground hover:bg-gray-50 hover:text-muted-foreground'
                }
              `}
            >
              {type.id === 'daily' ? 'Daily' : type.id === 'monthly' ? 'Monthly' : 'Flexible'}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VenvlBookingTypeSelector;
