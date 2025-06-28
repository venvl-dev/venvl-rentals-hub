
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
    'Boston, MA',
    'Seattle, WA',
    'Las Vegas, NV',
    'Austin, TX',
    'Denver, CO'
  ];

  useEffect(() => {
    if (searchTerm) {
      const filtered = popularDestinations.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6));
    } else {
      setSuggestions(popularDestinations.slice(0, 6));
    }
  }, [searchTerm]);

  const handleSelect = (location: string) => {
    onChange(location);
    onClose();
  };

  return (
    <motion.div
      className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Where to?</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search destinations"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-black focus:ring-0 transition-colors"
            autoFocus
          />
        </div>

        {/* Suggestions */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {searchTerm ? 'Suggestions' : 'Popular Destinations'}
          </div>
          {suggestions.map((location, index) => (
            <motion.div
              key={location}
              className="flex items-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
              onClick={() => handleSelect(location)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg mr-4 group-hover:bg-black group-hover:text-white transition-colors">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{location}</div>
                <div className="text-sm text-gray-500">Destination</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlDestinationPicker;
