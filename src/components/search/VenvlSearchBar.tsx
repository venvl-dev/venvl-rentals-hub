
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
    console.log('VenvlSearchBar - Search filters:', filters);
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
        week: 'Week',
        month: 'Month',
        any: 'Anytime'
      };
      return flexOptions[filters.flexibleOption as keyof typeof flexOptions] || 'Flexible';
    }
    if (filters.checkIn && filters.checkOut) {
      const checkInStr = filters.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const checkOutStr = filters.checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${checkInStr} - ${checkOutStr}`;
    }
    if (filters.checkIn) {
      return filters.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return 'Add dates';
  };

  const handleClickOutside = () => {
    setActiveSection(null);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {activeSection && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClickOutside}
          />
        )}
      </AnimatePresence>

      {/* Main Search Bar */}
      <motion.div
        className="bg-white rounded-2xl md:rounded-full border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.005 }}
      >
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="divide-y divide-gray-100">
            {/* Where Section */}
            <motion.div
              className={`p-4 cursor-pointer transition-all duration-300 ${
                activeSection === 'where' 
                  ? 'bg-gray-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('where')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">Where</div>
              <div className="text-sm text-gray-500 truncate">
                {filters.location || 'Search destinations'}
              </div>
            </motion.div>

            {/* When Section */}
            <motion.div
              className={`p-4 cursor-pointer transition-all duration-300 ${
                activeSection === 'when' 
                  ? 'bg-gray-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('when')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">When</div>
              <div className="text-sm text-gray-500 truncate">
                {getDateDisplayText()}
              </div>
            </motion.div>

            {/* Who Section */}
            <motion.div
              className={`p-4 cursor-pointer transition-all duration-300 ${
                activeSection === 'who' 
                  ? 'bg-gray-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('who')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="text-xs font-semibold text-gray-900 mb-1">Who</div>
              <div className="text-sm text-gray-500 truncate">
                {filters.guests === 1 ? 'Add guests' : `${filters.guests} guests`}
              </div>
            </motion.div>

            {/* Search Button */}
            <div className="p-4">
              <Button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-xl py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            {/* Where Section */}
            <motion.div
              className={`p-4 lg:p-6 cursor-pointer transition-all duration-300 ${
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
              className={`p-4 lg:p-6 cursor-pointer transition-all duration-300 ${
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
              className={`p-4 lg:p-6 cursor-pointer transition-all duration-300 ${
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
            <div className="p-3 lg:p-4 flex items-center justify-center">
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-full px-6 py-3 lg:px-8 lg:py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline">Search</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dropdown Overlays */}
      <AnimatePresence>
        {activeSection === 'where' && (
          <div className="relative z-50">
            <VenvlDestinationDropdown
              value={filters.location}
              onChange={(location) => updateFilters({ location })}
              onClose={() => setActiveSection(null)}
            />
          </div>
        )}

        {activeSection === 'when' && (
          <div className="relative z-50">
            <VenvlDateDropdown
              checkIn={filters.checkIn}
              checkOut={filters.checkOut}
              bookingType={filters.bookingType}
              duration={filters.duration}
              flexibleOption={filters.flexibleOption}
              onDateChange={(dates) => updateFilters(dates)}
              onClose={() => setActiveSection(null)}
            />
          </div>
        )}

        {activeSection === 'who' && (
          <div className="relative z-50">
            <VenvlGuestDropdown
              guests={filters.guests}
              onChange={(guests) => updateFilters({ guests })}
              onClose={() => setActiveSection(null)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VenvlSearchBar;
