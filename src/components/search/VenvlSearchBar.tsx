
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VenvlDestinationDropdown from './VenvlDestinationDropdown';
import VenvlDateDropdown from './VenvlDateDropdown';
import VenvlGuestDropdown from './VenvlGuestDropdown';

interface SearchFilters {
  location: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  bookingType: 'daily' | 'monthly' | 'flexible';
  flexibleOption?: string;
  duration?: number;
}

interface VenvlSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

const VenvlSearchBar = ({ onSearch, initialFilters }: VenvlSearchBarProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    location: initialFilters?.location || '',
    checkIn: initialFilters?.checkIn,
    checkOut: initialFilters?.checkOut,
    guests: initialFilters?.guests || 1,
    bookingType: initialFilters?.bookingType || 'daily',
    flexibleOption: initialFilters?.flexibleOption,
    duration: initialFilters?.duration,
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
      return 'Anytime';
    }
    if (filters.checkIn && filters.checkOut) {
      return `${filters.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${filters.checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return 'Add dates';
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <motion.div
        className="bg-white rounded-full border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.005 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Where Section */}
          <motion.div
            className={`p-4 md:p-6 cursor-pointer transition-all duration-300 ${
              activeSection === 'where' 
                ? 'bg-gray-50' 
                : 'hover:bg-gray-50'
            } rounded-l-full`}
            onClick={() => handleSectionClick('where')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-1">Where</div>
            <div className="text-sm text-gray-500 truncate">
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
            <div className="text-xs font-semibold text-gray-900 mb-1">When</div>
            <div className="text-sm text-gray-500 truncate">
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
            <div className="text-xs font-semibold text-gray-900 mb-1">Who</div>
            <div className="text-sm text-gray-500 truncate">
              {filters.guests === 1 ? 'Add guests' : `${filters.guests} guests`}
            </div>
          </motion.div>

          {/* Search Button */}
          <div className="p-3 md:p-4 flex items-center justify-center">
            <Button
              onClick={handleSearch}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-full px-6 py-3 md:px-8 md:py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Dropdown Overlays */}
      <AnimatePresence>
        {activeSection === 'where' && (
          <VenvlDestinationDropdown
            value={filters.location}
            onChange={(location) => updateFilters({ location })}
            onClose={() => setActiveSection(null)}
          />
        )}

        {activeSection === 'when' && (
          <VenvlDateDropdown
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
          <VenvlGuestDropdown
            guests={filters.guests}
            onChange={(guests) => updateFilters({ guests })}
            onClose={() => setActiveSection(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VenvlSearchBar;
