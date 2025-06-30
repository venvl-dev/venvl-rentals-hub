import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VenvlDestinationDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const VenvlDestinationDropdown = ({ value, onChange, onClose }: VenvlDestinationDropdownProps) => {
  const [searchTerm, setSearchTerm] = useState(value);

  const destinations = [
    { name: 'New York, NY', description: 'The city that never sleeps', icon: '🏙️', popular: true },
    { name: 'Los Angeles, CA', description: 'City of Angels', icon: '🌴', popular: true },
    { name: 'Chicago, IL', description: 'The Windy City', icon: '🏢', popular: true },
    { name: 'Miami, FL', description: 'Beaches and nightlife', icon: '🏖️', popular: true },
    { name: 'San Francisco, CA', description: 'Golden Gate City', icon: '🌉', popular: true },
    { name: 'Las Vegas, NV', description: 'Entertainment capital', icon: '🎰', popular: true },
    { name: 'Istanbul, Turkey', description: 'Where Europe meets Asia', icon: '🏛️', popular: false },
    { name: 'Paris, France', description: 'City of Light', icon: '🗼', popular: false },
    { name: 'London, UK', description: 'Historic capital', icon: '🇬🇧', popular: false },
    { name: 'Tokyo, Japan', description: 'Modern metropolis', icon: '🏮', popular: false },
  ];

  const [filteredDestinations, setFilteredDestinations] = useState(destinations);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = destinations.filter(dest =>
        dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dest.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDestinations(filtered);
    } else {
      setFilteredDestinations(destinations);
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

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  const popularDestinations = filteredDestinations.filter(d => d.popular);
  const otherDestinations = filteredDestinations.filter(d => !d.popular);

  return (
    <motion.div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-96 md:max-h-[500px]"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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
        <div className="relative mb-4 md:mb-6">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search destinations"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-pink-500 focus:ring-0 transition-colors"
            autoFocus
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 rounded-full hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4 max-h-64 md:max-h-80 overflow-y-auto custom-scrollbar">
          {/* Nearby Option */}
          <motion.div
            className="flex items-center p-3 md:p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
            onClick={handleNearby}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg mr-3 md:mr-4 group-hover:bg-pink-100 transition-colors">
              <Navigation className="h-4 w-4 md:h-5 md:w-5 text-gray-600 group-hover:text-pink-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm md:text-base">Nearby</div>
              <div className="text-xs md:text-sm text-gray-500">Find what's around you</div>
            </div>
          </motion.div>

          {/* Popular Destinations */}
          {popularDestinations.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                Popular destinations
              </div>
              <div className="space-y-1">
                {popularDestinations.map((destination, index) => (
                  <motion.div
                    key={destination.name}
                    className="flex items-center p-3 md:p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => handleSelect(destination.name)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg mr-3 md:mr-4 group-hover:bg-pink-100 transition-colors">
                      <span className="text-lg md:text-xl">{destination.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm md:text-base truncate">{destination.name}</div>
                      <div className="text-xs md:text-sm text-gray-500 truncate">{destination.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Other Destinations */}
          {otherDestinations.length > 0 && (
            <div>
              {popularDestinations.length > 0 && (
                <div className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  More destinations
                </div>
              )}
              <div className="space-y-1">
                {otherDestinations.map((destination, index) => (
                  <motion.div
                    key={destination.name}
                    className="flex items-center p-3 md:p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => handleSelect(destination.name)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: (popularDestinations.length + index) * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg mr-3 md:mr-4 group-hover:bg-pink-100 transition-colors">
                      <span className="text-lg md:text-xl">{destination.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm md:text-base truncate">{destination.name}</div>
                      <div className="text-xs md:text-sm text-gray-500 truncate">{destination.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredDestinations.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No destinations found</div>
              <div className="text-sm text-gray-400">Try searching for a different location</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlDestinationDropdown;
