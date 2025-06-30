
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Calendar, Users, X } from 'lucide-react';
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

  const clearFilters = () => {
    setFilters({
      location: '',
      guests: 1,
      bookingType: 'daily',
    });
    setActiveSection(null);
  };

  const hasFilters = filters.location || filters.checkIn || filters.guests > 1;

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Mobile Layout */}
      <div className="block lg:hidden">
        <motion.div
          className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header with Clear Button */}
          {hasFilters && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Search filters</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-3 text-gray-500 hover:text-gray-900"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {/* Where Section */}
            <motion.div
              className={`p-4 cursor-pointer transition-all duration-200 ${
                activeSection === 'where' ? 'bg-black text-white' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('where')}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <MapPin className={`h-5 w-5 ${activeSection === 'where' ? 'text-white' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">
                    Where
                  </div>
                  <div className="text-sm font-medium truncate">
                    {filters.location || 'Search destinations'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* When Section */}
            <motion.div
              className={`p-4 cursor-pointer transition-all duration-200 ${
                activeSection === 'when' ? 'bg-black text-white' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('when')}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <Calendar className={`h-5 w-5 ${activeSection === 'when' ? 'text-white' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">
                    When
                  </div>
                  <div className="text-sm font-medium truncate">
                    {getDateDisplayText()}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Who Section */}
            <motion.div
              className={`p-4 cursor-pointer transition-all duration-200 ${
                activeSection === 'who' ? 'bg-black text-white' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('who')}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <Users className={`h-5 w-5 ${activeSection === 'who' ? 'text-white' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">
                    Who
                  </div>
                  <div className="text-sm font-medium">
                    {filters.guests} guest{filters.guests > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Search Button */}
            <div className="p-4">
              <Button
                onClick={handleSearch}
                className="w-full bg-black hover:bg-gray-800 text-white rounded-xl py-4 font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <motion.div
          className="bg-white rounded-full shadow-xl border-2 border-gray-100 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            {/* Where Section */}
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-200 ${
                activeSection === 'where' ? 'bg-black text-white' : 'hover:bg-gray-50'
              } rounded-l-full`}
              onClick={() => handleSectionClick('where')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <MapPin className={`h-5 w-5 ${activeSection === 'where' ? 'text-white' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">
                    Where
                  </div>
                  <div className="text-sm font-medium truncate">
                    {filters.location || 'Search destinations'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* When Section */}
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-200 ${
                activeSection === 'when' ? 'bg-black text-white' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('when')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <Calendar className={`h-5 w-5 ${activeSection === 'when' ? 'text-white' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">
                    When
                  </div>
                  <div className="text-sm font-medium truncate">
                    {getDateDisplayText()}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Who Section */}
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-200 ${
                activeSection === 'who' ? 'bg-black text-white' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('who')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <Users className={`h-5 w-5 ${activeSection === 'who' ? 'text-white' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">
                    Who
                  </div>
                  <div className="text-sm font-medium">
                    {filters.guests} guest{filters.guests > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Search Button */}
            <div className="p-4 flex items-center justify-center rounded-r-full">
              <Button
                onClick={handleSearch}
                className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Search className="h-5 w-5 lg:mr-2" />
                <span className="hidden lg:inline">Search</span>
              </Button>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasFilters && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-full"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all filters
              </Button>
            </div>
          )}
        </motion.div>
      </div>

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
