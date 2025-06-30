
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VenvlDestinationPickerProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const VenvlDestinationPicker = ({ value, onChange, onClose }: VenvlDestinationPickerProps) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const popularDestinations = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Miami, FL',
    'San Francisco, CA',
    'Boston, MA'
  ];

  useEffect(() => {
    if (searchTerm) {
      const filtered = popularDestinations.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 4));
    } else {
      setSuggestions(popularDestinations.slice(0, 4));
    }
  }, [searchTerm]);

  const handleSelect = (location: string) => {
    onChange(location);
    onClose();
  };

  return (
    <motion.div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-w-sm mx-auto"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Where to?</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search destinations"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-black focus:ring-0 transition-colors"
            autoFocus
          />
        </div>

        {/* Compact Suggestions */}
        <div className="space-y-1">
          {suggestions.map((location, index) => (
            <motion.div
              key={location}
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
              onClick={() => handleSelect(location)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: index * 0.03 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg mr-3 group-hover:bg-gray-200 transition-colors">
                <MapPin className="h-3 w-3 text-gray-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">{location}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlDestinationPicker;
