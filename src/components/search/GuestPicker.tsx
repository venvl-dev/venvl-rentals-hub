
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface GuestPickerProps {
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

const GuestPicker = ({ guests, onChange, onClose }: GuestPickerProps) => {
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
    
    // Calculate total guests (adults + children, infants and pets don't count towards guest limit)
    const totalGuests = newCounts.adults + newCounts.children;
    onChange(totalGuests);
  };

  return (
    <motion.div
      className="absolute top-full right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 overflow-hidden w-96"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
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
                <div className="text-sm text-gray-600">{guestType.description}</div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuestCount(guestType.key, -1)}
                  disabled={guestCounts[guestType.key] <= guestType.min}
                  className="h-8 w-8 rounded-full p-0 border-2 hover:border-gray-400 disabled:opacity-30"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <span className="w-8 text-center font-medium">
                  {guestCounts[guestType.key]}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuestCount(guestType.key, 1)}
                  disabled={guestCounts[guestType.key] >= guestType.max}
                  className="h-8 w-8 rounded-full p-0 border-2 hover:border-gray-400 disabled:opacity-30"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose} className="bg-gray-900 text-white hover:bg-gray-800">
            Save
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default GuestPicker;
