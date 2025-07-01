
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
      <div className="flex w-full max-w-sm bg-gray-100 rounded-2xl p-1 shadow-sm">
        {bookingTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-colors duration-300 ${
              selectedType === type.id
                ? 'bg-black text-white shadow-md'
                : 'text-gray-600'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="inline-flex p-2 bg-gray-100 rounded-2xl border border-gray-100 shadow-sm">
        {bookingTypes.map((type) => (
          <Button
            key={type.id}
            variant="ghost"
            onClick={() => onTypeChange(type.id)}
            className={`relative px-8 py-4 rounded-xl font-medium transition-colors duration-300 ${
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
        ))}
      </div>
    </div>
  );
};

export default VenvlBookingTypeSelector;
