
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation } from 'lucide-react';

interface VenvlDestinationDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const VenvlDestinationDropdown = ({ value, onChange, onClose }: VenvlDestinationDropdownProps) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const destinations = [
    { name: 'Istanbul, Türkiye', description: 'For sights like Galata Tower', icon: '🏛️' },
    { name: 'Beirut, Lebanon', description: 'Popular beach destination', icon: '🏖️' },
    { name: 'Dahab, Egypt', description: 'For nature-lovers', icon: '🏔️' },
    { name: 'London, United Kingdom', description: 'For its bustling nightlife', icon: '🏙️' },
    { name: 'New Cairo, Egypt', description: 'Near you', icon: '🏢' },
    { name: 'Paris, France', description: 'For sights like Eiffel Tower', icon: '🗼' },
  ];

  useEffect(() => {
    if (searchTerm) {
      const filtered = destinations.filter(dest =>
        dest.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered.map(d => d.name));
    } else {
      setSuggestions(destinations.map(d => d.name));
    }
  }, [searchTerm]);

  const handleSelect = (location: string) => {
    onChange(location);
    onClose();
  };

  const handleNearby = () => {
    onChange('Nearby');
    onClose();
  };

  return (
    <motion.div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-6">
        {/* Search Input */}
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder="Search destinations"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-pink-500 focus:ring-0 transition-colors"
            autoFocus
          />
        </div>

        {/* Suggested Destinations */}
        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-600 mb-4">Suggested destinations</div>
          
          {/* Nearby Option */}
          <motion.div
            className="flex items-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
            onClick={handleNearby}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mr-4 group-hover:bg-pink-100 transition-colors">
              <Navigation className="h-5 w-5 text-gray-600 group-hover:text-pink-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Nearby</div>
              <div className="text-sm text-gray-500">Find what's around you</div>
            </div>
          </motion.div>

          {/* Destination List */}
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.name}
              className="flex items-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
              onClick={() => handleSelect(destination.name)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mr-4 group-hover:bg-pink-100 transition-colors">
                <span className="text-lg">{destination.icon}</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{destination.name}</div>
                <div className="text-sm text-gray-500">{destination.description}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlDestinationDropdown;
