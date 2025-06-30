
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface VenvlGuestDropdownProps {
  guests: number;
  onChange: (guests: number) => void;
  onClose: () => void;
}

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

const VenvlGuestDropdown = ({ guests, onChange, onClose }: VenvlGuestDropdownProps) => {
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({
    adults: Math.max(1, guests),
    children: 0,
    infants: 0,
    pets: 0
  });

  const guestTypes = [
    {
      key: 'adults' as keyof GuestCounts,
      label: 'Adults',
      description: 'Ages 13 or above',
      min: 1,
      max: 16
    },
    {
      key: 'children' as keyof GuestCounts,
      label: 'Children',
      description: 'Ages 2-12',
      min: 0,
      max: 5
    },
    {
      key: 'infants' as keyof GuestCounts,
      label: 'Infants',
      description: 'Under 2',
      min: 0,
      max: 5
    },
    {
      key: 'pets' as keyof GuestCounts,
      label: 'Pets',
      description: 'Bringing a service animal?',
      min: 0,
      max: 5
    }
  ];

  const updateGuestCount = (type: keyof GuestCounts, change: number) => {
    const guestType = guestTypes.find(g => g.key === type)!;
    const newValue = Math.max(guestType.min, Math.min(guestType.max, guestCounts[type] + change));
    
    const newCounts = { ...guestCounts, [type]: newValue };
    setGuestCounts(newCounts);
    
    const totalGuests = newCounts.adults + newCounts.children;
    onChange(totalGuests);
  };

  return (
    <motion.div
      className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden w-80"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-6">
        <div className="space-y-6">
          {guestTypes.map((guestType, index) => (
            <motion.div
              key={guestType.key}
              className="flex items-center justify-between"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{guestType.label}</div>
                <div className="text-sm text-gray-500">{guestType.description}</div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuestCount(guestType.key, -1)}
                  disabled={guestCounts[guestType.key] <= guestType.min}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-pink-500 disabled:opacity-30 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <span className="w-8 text-center font-semibold text-lg">
                  {guestCounts[guestType.key]}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuestCount(guestType.key, 1)}
                  disabled={guestCounts[guestType.key] >= guestType.max}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-pink-500 disabled:opacity-30 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={onClose} 
            className="bg-gray-900 text-white hover:bg-gray-800 px-8"
          >
            Done
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlGuestDropdown;
