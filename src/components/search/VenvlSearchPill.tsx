
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VenvlDestinationPicker from './VenvlDestinationPicker';
import VenvlDatePicker from './VenvlDatePicker';
import VenvlGuestPicker from './VenvlGuestPicker';
import VenvlBookingTypeSelector from './VenvlBookingTypeSelector';

interface SearchFilters {
  location: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  bookingType: 'daily' | 'monthly' | 'flexible';
  flexibleOption?: string;
  duration?: number;
  propertyType?: string;
  priceRange?: { min: number; max: number };
  amenities?: string[];
}

interface VenvlSearchPillProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

const VenvlSearchPill = ({ onSearch, initialFilters }: VenvlSearchPillProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    location: initialFilters?.location || '',
    checkIn: initialFilters?.checkIn,
    checkOut: initialFilters?.checkOut,
    guests: initialFilters?.guests || 1,
    bookingType: initialFilters?.bookingType || 'daily',
    flexibleOption: initialFilters?.flexibleOption,
    duration: initialFilters?.duration,
    propertyType: initialFilters?.propertyType,
    priceRange: initialFilters?.priceRange,
    amenities: initialFilters?.amenities || [],
  });

  const handleSectionClick = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleSearch = () => {
    onSearch(filters);
    setActiveSection(null);
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getDateDisplayText = () => {
    if (filters.bookingType === 'monthly' && filters.duration) {
      return `${filters.duration} month${filters.duration > 1 ? 's' : ''}`;
    }
    if (filters.bookingType === 'flexible' && filters.flexibleOption) {
      const flexOptions = {
        weekend: 'Weekend',
        week: 'Week stay',
        month: 'Month stay',
        any: 'Flexible'
      };
      return flexOptions[filters.flexibleOption as keyof typeof flexOptions] || 'Flexible';
    }
    if (filters.checkIn) {
      const checkInStr = filters.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (filters.checkOut) {
        const checkOutStr = filters.checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${checkInStr} - ${checkOutStr}`;
      }
      return checkInStr;
    }
    return 'Add dates';
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Booking Type Selector */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <VenvlBookingTypeSelector
          selectedType={filters.bookingType}
          onTypeChange={(type) => updateFilters({ bookingType: type })}
        />
      </motion.div>

      {/* Main Search Pill - Compact Design */}
      <motion.div
        className="bg-white rounded-full border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Where Section */}
          <motion.div
            className={`p-4 md:p-6 cursor-pointer transition-all duration-300 ${
              activeSection === 'where' 
                ? 'bg-gray-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('where')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Where
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">
              {filters.location || 'Search destinations'}
            </div>
          </motion.div>

          {/* When Section */}
          <motion.div
            className={`p-4 md:p-6 cursor-pointer transition-all duration-300 ${
              activeSection === 'when' 
                ? 'bg-gray-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('when')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              When
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">
              {getDateDisplayText()}
            </div>
          </motion.div>

          {/* Who Section */}
          <motion.div
            className={`p-4 md:p-6 cursor-pointer transition-all duration-300 ${
              activeSection === 'who' 
                ? 'bg-gray-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('who')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Who
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">
              {filters.guests} guest{filters.guests > 1 ? 's' : ''}
            </div>
          </motion.div>

          {/* Search Button */}
          <div className="p-3 md:p-4 flex items-center justify-center">
            <Button
              onClick={handleSearch}
              className="bg-black hover:bg-gray-800 text-white rounded-full px-6 py-3 font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Compact Dropdown Overlays */}
      <AnimatePresence>
        {activeSection === 'where' && (
          <VenvlDestinationPicker
            value={filters.location}
            onChange={(location) => updateFilters({ location })}
            onClose={() => setActiveSection(null)}
          />
        )}

        {activeSection === 'when' && (
          <VenvlDatePicker
            checkIn={filters.checkIn}
            checkOut={filters.checkOut}
            bookingType={filters.bookingType}
            duration={filters.duration}
            flexibleOption={filters.flexibleOption}
            onDateChange={(dates) => updateFilters(dates)}
            onClose={() => setActiveSection(null)}
          />
        )}

        {activeSection === 'who' && (
          <VenvlGuestPicker
            guests={filters.guests}
            onChange={(guests) => updateFilters({ guests })}
            onClose={() => setActiveSection(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VenvlSearchPill;
