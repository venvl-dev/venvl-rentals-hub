
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface DestinationPickerProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const DestinationPicker = ({ value, onChange, onClose }: DestinationPickerProps) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Mock suggestions - in a real app, this would come from an API
  const mockSuggestions = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Miami, FL',
    'San Francisco, CA',
    'Boston, MA',
    'Seattle, WA',
    'Las Vegas, NV'
  ];

  useEffect(() => {
    if (searchTerm) {
      const filtered = mockSuggestions.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions(mockSuggestions.slice(0, 5));
    }
  }, [searchTerm]);

  const handleSelect = (location: string) => {
    onChange(location);
    onClose();
  };

  return (
    <motion.div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-6">
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search destinations"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-2 border-gray-300 rounded-lg p-3 text-lg focus:border-rose-500 focus:ring-0"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          {suggestions.map((location, index) => (
            <motion.div
              key={location}
              className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-150"
              onClick={() => handleSelect(location)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <MapPin className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-gray-800">{location}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DestinationPicker;
