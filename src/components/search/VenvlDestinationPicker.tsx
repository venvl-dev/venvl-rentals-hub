
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { MapPin, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface VenvlDestinationPickerProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const VenvlDestinationPicker = ({ value, onChange, onClose }: VenvlDestinationPickerProps) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch available locations from properties that are actually available for booking
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Get today's date for availability check
        const today = new Date().toISOString().split('T')[0];
        
        // Query to get properties that are active and approved with their bookings
        const { data, error } = await supabase
          .from('properties')
          .select(`
            id,
            city, 
            state,
            bookings(check_in, check_out, status)
          `)
          .eq('is_active', true)
          .eq('approval_status', 'approved');

        if (error) {
          console.error('Error fetching locations:', error);
          return;
        }

        // Filter properties to only include those without current/future active bookings
        const availableProperties = data?.filter(property => {
          // If no bookings at all, property is available
          if (!property.bookings || property.bookings.length === 0) {
            return true;
          }
          
          // Check if property has any current or future active bookings
          const hasActiveBookings = property.bookings.some(booking => {
            const checkOut = booking.check_out;
            const status = booking.status;
            return checkOut >= today && ['pending', 'confirmed', 'checked_in'].includes(status);
          });
          return !hasActiveBookings;
        }) || [];

        console.log('📍 Total properties:', data?.length || 0);
        console.log('📍 Available properties (no current bookings):', availableProperties.length);

        // Create various location format options for better matching
        const locationSet = new Set();
        
        availableProperties
          .filter(property => property.city && property.state)
          .forEach(property => {
            // Add different formats
            locationSet.add(`${property.city}, ${property.state}`); // Full format
            locationSet.add(property.city); // City only
            if (property.state !== property.city) {
              locationSet.add(property.state); // State only (if different from city)
            }
          });

        const locations = Array.from(locationSet).sort();
        console.log('📍 Available locations for search:', locations);
        console.log('📍 Total location options:', locations.length);
        setAvailableLocations(locations);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = availableLocations.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Always include the typed text as an option if it doesn't match existing locations
      const suggestions = [...filtered];
      if (searchTerm && !filtered.some(loc => loc.toLowerCase() === searchTerm.toLowerCase())) {
        suggestions.unshift(`📍 Use "${searchTerm}"`);
      }
      
      setSuggestions(suggestions.slice(0, 6));
    } else {
      // Show popular/featured locations when no search term
      const featuredLocations = availableLocations.slice(0, 8);
      const popularSuggestions = [
        '🌍 All Locations',
        ...featuredLocations
      ];
      setSuggestions(popularSuggestions);
    }
  }, [searchTerm, availableLocations]);

  const handleSelect = (location: string) => {
    console.log('📍 Location selected:', location);
    
    // Handle "All Locations" by clearing the filter
    if (location === '🌍 All Locations') {
      console.log('📍 All Locations selected - clearing location filter');
      onChange('');
    } else if (location.startsWith('📍 Use "')) {
      // Handle custom location format: 📍 Use "Custom Location"
      const customLocation = location.replace('📍 Use "', '').replace('"', '');
      onChange(customLocation);
    } else {
      onChange(location);
    }
    
    onClose();
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Allow user to press Enter to use their typed text
      onChange(searchTerm);
      onClose();
    }
  };

  const handleUseTypedLocation = () => {
    // Allow user to use whatever they typed
    onChange(searchTerm);
    onClose();
  };

  const handleClearLocation = () => {
    setSearchTerm('');
    onChange('');
  };

  if (isMobile) {
    return (
      <div ref={containerRef} className="p-4 h-full overflow-auto">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Where to?</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Search Input */}
        <div className="relative mb-6">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Type any location and press Enter"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleInputKeyPress}
            className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-base focus:border-black focus:ring-0 transition-colors"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            {searchTerm && (
              <Button
                onClick={handleUseTypedLocation}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Use "{searchTerm}"
              </Button>
            )}
            {value && (
              <Button
                onClick={handleClearLocation}
                variant="outline"
                className="px-3"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Suggestions */}
        <div className="space-y-3">
          {suggestions.map((location, index) => (
            <motion.div
              key={location}
              className="flex items-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
              onClick={() => handleSelect(location)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl mr-4 group-hover:bg-gray-200 transition-colors">
                <MapPin className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-base font-medium text-gray-900">{location}</div>
            </motion.div>
          ))}
          {suggestions.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              <p>No locations found matching "{searchTerm}"</p>
              <p className="text-sm mt-2">Try searching for a city or state</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className="bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-w-sm mx-auto mt-2"
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
            placeholder="Type any location and press Enter"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleInputKeyPress}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-black focus:ring-0 transition-colors"
            autoFocus
          />
          <div className="flex gap-1 mt-2">
            {searchTerm && (
              <Button
                onClick={handleUseTypedLocation}
                size="sm"
                className="flex-1 bg-black text-white hover:bg-gray-800 text-xs"
              >
                Use "{searchTerm}"
              </Button>
            )}
            {value && (
              <Button
                onClick={handleClearLocation}
                variant="outline"
                size="sm"
                className="px-2"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Compact Suggestions */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
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
          {suggestions.length === 0 && searchTerm && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No locations found</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VenvlDestinationPicker;
