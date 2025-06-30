
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X, Users } from 'lucide-react';

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
      description: 'Service animals welcome',
      min: 0,
      max: 5
    }
  ];

  const updateGuestCount = (type: keyof GuestCounts, change: number) => {
    const guestType = guestTypes.find(g => g.key === type)!;
    const newValue = Math.max(guestType.min, Math.min(guestType.max, guestCounts[type] + change));
    
    const newCounts = { ...guestCounts, [type]: newValue };
    setGuestCounts(newCounts);
    
    // Update total guests (adults + children count toward occupancy)
    const totalGuests = newCounts.adults + newCounts.children;
    onChange(totalGuests);
  };

  const getTotalGuests = () => {
    return guestCounts.adults + guestCounts.children;
  };

  return (
    <motion.div
      className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden w-80 md:w-96"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Who's coming?</h3>
              <div className="text-sm text-gray-500">
                {getTotalGuests()} guest{getTotalGuests() !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Guest Counters */}
        <div className="space-y-6">
          {guestTypes.map((guestType, index) => (
            <motion.div
              key={guestType.key}
              className="flex items-center justify-between py-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-base">{guestType.label}</div>
                <div className="text-sm text-gray-500">{guestType.description}</div>
              </div>
              
              <div className="flex items-center space-x-3 md:space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuestCount(guestType.key, -1)}
                  disabled={guestCounts[guestType.key] <= guestType.min}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-gray-300 hover:border-pink-500 hover:bg-pink-50 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-all p-0"
                >
                  <Minus className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                
                <span className="w-8 text-center font-bold text-lg">
                  {guestCounts[guestType.key]}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuestCount(guestType.key, 1)}
                  disabled={guestCounts[guestType.key] >= guestType.max}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-gray-300 hover:border-pink-500 hover:bg-pink-50 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-all p-0"
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary and Actions */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: {getTotalGuests()} guest{getTotalGuests() !== 1 ? 's' : ''}
              {(guestCounts.infants > 0 || guestCounts.pets > 0) && (
                <div className="text-xs text-gray-500 mt-1">
                  {guestCounts.infants > 0 && `${guestCounts.infants} infant${guestCounts.infants > 1 ? 's' : ''}`}
                  {guestCounts.infants > 0 && guestCounts.pets > 0 && ', '}
                  {guestCounts.pets > 0 && `${guestCounts.pets} pet${guestCounts.pets > 1 ? 's' : ''}`}
                </div>
              )}
            </div>
            <Button 
              onClick={onClose} 
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-8 shadow-lg hover:shadow-xl transition-all"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlGuestDropdown;
