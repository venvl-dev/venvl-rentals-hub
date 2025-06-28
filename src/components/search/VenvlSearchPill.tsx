
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
        weekend: 'Weekend stay',
        week: 'Week stay',
        month: 'Month stay',
        any: 'Flexible dates'
      };
      return flexOptions[filters.flexibleOption as keyof typeof flexOptions] || 'Flexible';
    }
    if (filters.checkIn) {
      return `${filters.checkIn.toLocaleDateString()} ${filters.checkOut ? '- ' + filters.checkOut.toLocaleDateString() : ''}`;
    }
    return 'Select dates';
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
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

      {/* Main Search Pill */}
      <motion.div
        className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Where Section */}
          <motion.div
            className={`p-6 cursor-pointer transition-all duration-300 ${
              activeSection === 'where' 
                ? 'bg-black text-white' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('where')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-bold uppercase tracking-wide mb-1 opacity-60">
              Where
            </div>
            <div className={`text-sm font-medium truncate ${
              activeSection === 'where' ? 'text-white' : 'text-gray-900'
            }`}>
              {filters.location || 'Search destinations'}
            </div>
          </motion.div>

          {/* When Section */}
          <motion.div
            className={`p-6 cursor-pointer transition-all duration-300 ${
              activeSection === 'when' 
                ? 'bg-black text-white' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('when')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-bold uppercase tracking-wide mb-1 opacity-60">
              When
            </div>
            <div className={`text-sm font-medium truncate ${
              activeSection === 'when' ? 'text-white' : 'text-gray-900'
            }`}>
              {getDateDisplayText()}
            </div>
          </motion.div>

          {/* Who Section */}
          <motion.div
            className={`p-6 cursor-pointer transition-all duration-300 ${
              activeSection === 'who' 
                ? 'bg-black text-white' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('who')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-bold uppercase tracking-wide mb-1 opacity-60">
              Who
            </div>
            <div className={`text-sm font-medium truncate ${
              activeSection === 'who' ? 'text-white' : 'text-gray-900'
            }`}>
              {filters.guests} guest{filters.guests > 1 ? 's' : ''}
            </div>
          </motion.div>

          {/* Search Button */}
          <div className="p-4 flex items-center justify-center lg:justify-end">
            <Button
              onClick={handleSearch}
              className="bg-black hover:bg-gray-800 text-white rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Dropdown Overlays */}
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
