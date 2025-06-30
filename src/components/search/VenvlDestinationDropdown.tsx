import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VenvlDestinationDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const VenvlDestinationDropdown = ({ value, onChange, onClose }: VenvlDestinationDropdownProps) => {
  const [searchTerm, setSearchTerm] = useState(value);

  const destinations = [
    { name: 'New York, NY', description: 'The city that never sleeps', type: 'popular' },
    { name: 'Los Angeles, CA', description: 'City of Angels', type: 'popular' },
    { name: 'Chicago, IL', description: 'The Windy City', type: 'popular' },
    { name: 'Miami, FL', description: 'Beaches and nightlife', type: 'popular' },
    { name: 'San Francisco, CA', description: 'Golden Gate City', type: 'popular' },
    { name: 'Las Vegas, NV', description: 'Entertainment capital', type: 'popular' },
    { name: 'Boston, MA', description: 'Historic charm', type: 'other' },
    { name: 'Seattle, WA', description: 'Emerald City', type: 'other' },
    { name: 'Austin, TX', description: 'Keep it weird', type: 'other' },
    { name: 'Denver, CO', description: 'Mile High City', type: 'other' },
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

  const popularDestinations = filteredDestinations.filter(d => d.type === 'popular');
  const otherDestinations = filteredDestinations.filter(d => d.type === 'other');

  return (
    <motion.div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 z-50 overflow-hidden max-h-96 lg:max-h-[500px]"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Where to?</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search destinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl text-base focus:border-black focus:ring-0 transition-colors bg-gray-50 focus:bg-white"
            autoFocus
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6 max-h-64 lg:max-h-80 overflow-y-auto custom-scrollbar">
          {/* Nearby Option */}
          <motion.div
            className="flex items-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group border border-gray-100 hover:border-gray-200"
            onClick={handleNearby}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-black rounded-xl mr-4 group-hover:bg-gray-800 transition-colors">
              <Navigation className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-base">Search nearby</div>
              <div className="text-sm text-gray-500">Discover places around you</div>
            </div>
          </motion.div>

          {/* Popular Destinations */}
          {popularDestinations.length > 0 && (
            <div>
              <div className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                Popular destinations
              </div>
              <div className="space-y-2">
                {popularDestinations.map((destination, index) => (
                  <motion.div
                    key={destination.name}
                    className="flex items-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group border border-transparent hover:border-gray-200"
                    onClick={() => handleSelect(destination.name)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mr-4 group-hover:bg-gray-200 transition-colors">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-base truncate">{destination.name}</div>
                      <div className="text-sm text-gray-500 truncate">{destination.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Other Destinations */}
          {otherDestinations.length > 0 && (
            <div>
              <div className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                More destinations
              </div>
              <div className="space-y-2">
                {otherDestinations.map((destination, index) => (
                  <motion.div
                    key={destination.name}
                    className="flex items-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group border border-transparent hover:border-gray-200"
                    onClick={() => handleSelect(destination.name)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: (popularDestinations.length + index) * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mr-4 group-hover:bg-gray-200 transition-colors">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-base truncate">{destination.name}</div>
                      <div className="text-sm text-gray-500 truncate">{destination.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredDestinations.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">No destinations found</div>
              <div className="text-sm text-gray-500">Try searching for a different location</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlDestinationDropdown;
