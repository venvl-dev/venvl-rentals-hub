import { memo } from 'react';
import VenvlBookingTypeSelector from './VenvlBookingTypeSelector';

interface StandaloneBookingTypeSelectorProps {
  selectedType: 'daily' | 'monthly' | 'flexible';
  onTypeChange: (type: 'daily' | 'monthly' | 'flexible') => void;
  className?: string;
}

const StandaloneBookingTypeSelector = ({
  selectedType,
  onTypeChange,
  className = '',
}: StandaloneBookingTypeSelectorProps) => {
  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <VenvlBookingTypeSelector
        selectedType={selectedType}
        onTypeChange={onTypeChange}
      />
    </div>
  );
};

export default memo(StandaloneBookingTypeSelector);