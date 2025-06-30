
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X, Users } from 'lucide-react';

interface VenvlGuestPickerProps {
  guests: number;
  onChange: (guests: number) => void;
  onClose: () => void;
}

interface GuestCounts {
  adults: number;
  children: number;
}

const VenvlGuestPicker = ({ guests, onChange, onClose }: VenvlGuestPickerProps) => {
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({
    adults: Math.max(1, guests),
    children: 0
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
      className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden w-80"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Who's coming?</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Guest Counters */}
        <div className="space-y-4">
          {guestTypes.map((guestType, index) => (
            <motion.div
              key={guestType.key}
              className="flex items-center justify-between py-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: index * 0.05 }}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">{guestType.label}</div>
                <div className="text-xs text-gray-500">{guestType.description}</div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuestCount(guestType.key, -1)}
                  disabled={guestCounts[guestType.key] <= guestType.min}
                  className="w-8 h-8 rounded-full border border-gray-300 hover:border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <span className="w-6 text-center font-medium text-sm">
                  {guestCounts[guestType.key]}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuestCount(guestType.key, 1)}
                  disabled={guestCounts[guestType.key] >= guestType.max}
                  className="w-8 h-8 rounded-full border border-gray-300 hover:border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} className="text-gray-600 text-sm">
            Cancel
          </Button>
          <Button onClick={onClose} className="bg-black text-white hover:bg-gray-800 px-6 text-sm">
            Done
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlGuestPicker;
