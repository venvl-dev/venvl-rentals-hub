
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VenvlDestinationPicker from './VenvlDestinationPicker';
import VenvlDatePicker from './VenvlDatePicker';
import VenvlGuestPicker from './VenvlGuestPicker';
import VenvlBookingTypeSelector from './VenvlBookingTypeSelector';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
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
      return `${filters.duration}mo`;
    }
    if (filters.bookingType === 'flexible' && filters.flexibleOption) {
      const flexOptions = {
        weekend: 'Weekend',
        week: 'Week',
        month: 'Month',
        any: 'Flexible'
      };
      return flexOptions[filters.flexibleOption as keyof typeof flexOptions] || 'Flexible';
    }
    if (filters.checkIn) {
      const checkInStr = filters.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (filters.checkOut) {
        const checkOutStr = filters.checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return isMobile ? `${checkInStr}-${checkOutStr}` : `${checkInStr} - ${checkOutStr}`;
      }
      return checkInStr;
    }
    return isMobile ? 'Dates' : 'Add dates';
  };

  if (isMobile) {
    return (
      <div className="relative w-full max-w-sm mx-auto px-4">
        {/* Mobile Booking Type Selector */}
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <VenvlBookingTypeSelector
            selectedType={filters.bookingType}
            onTypeChange={(type) => updateFilters({ bookingType: type })}
          />
        </motion.div>

        {/* Mobile Search Card */}
        <motion.div
          className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="divide-y divide-gray-100">
            {/* Where Section - Mobile */}
            <motion.div
              className={`p-4 cursor-pointer transition-all duration-300 ${
                activeSection === 'where' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('where')}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Where
              </div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {filters.location || 'Search destinations'}
              </div>
            </motion.div>

            {/* When Section - Mobile */}
            <motion.div
              className={`p-4 cursor-pointer transition-all duration-300 ${
                activeSection === 'when' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('when')}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                When
              </div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {getDateDisplayText()}
              </div>
            </motion.div>

            {/* Who Section - Mobile */}
            <motion.div
              className={`p-4 cursor-pointer transition-all duration-300 ${
                activeSection === 'who' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('who')}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Who
              </div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {filters.guests} guest{filters.guests > 1 ? 's' : ''}
              </div>
            </motion.div>
          </div>

          {/* Mobile Search Button */}
          <div className="p-4 bg-gray-50">
            <Button
              onClick={handleSearch}
              className="w-full bg-black hover:bg-gray-800 text-white rounded-xl py-3 font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </motion.div>

        {/* Mobile Dropdowns with proper positioning */}
        <AnimatePresence>
          {activeSection === 'where' && (
            <div className="fixed inset-0 bg-white z-50 pt-16">
              <VenvlDestinationPicker
                value={filters.location}
                onChange={(location) => updateFilters({ location })}
                onClose={() => setActiveSection(null)}
              />
            </div>
          )}

          {activeSection === 'when' && (
            <div className="fixed inset-0 bg-white z-50 pt-16">
              <VenvlDatePicker
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
            <div className="fixed inset-0 bg-white z-50 pt-16">
              <VenvlGuestPicker
                guests={filters.guests}
                onChange={(guests) => updateFilters({ guests })}
                onClose={() => setActiveSection(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Desktop Booking Type Selector */}
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

      {/* Desktop Search Pill */}
      <motion.div
        className="bg-white rounded-full border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          {/* Where Section - Desktop */}
          <div className="relative">
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-300 ${
                activeSection === 'where' ? 'bg-gray-50' : 'hover:bg-gray-50'
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
            
            <AnimatePresence>
              {activeSection === 'where' && (
                <div className="absolute top-full left-0 right-0">
                  <VenvlDestinationPicker
                    value={filters.location}
                    onChange={(location) => updateFilters({ location })}
                    onClose={() => setActiveSection(null)}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* When Section - Desktop */}
          <div className="relative">
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-300 ${
                activeSection === 'when' ? 'bg-gray-50' : 'hover:bg-gray-50'
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
            
            <AnimatePresence>
              {activeSection === 'when' && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <VenvlDatePicker
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
            </AnimatePresence>
          </div>

          {/* Who Section - Desktop */}
          <div className="relative">
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-300 ${
                activeSection === 'who' ? 'bg-gray-50' : 'hover:bg-gray-50'
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
            
            <AnimatePresence>
              {activeSection === 'who' && (
                <div className="absolute top-full right-0">
                  <VenvlGuestPicker
                    guests={filters.guests}
                    onChange={(guests) => updateFilters({ guests })}
                    onClose={() => setActiveSection(null)}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Button - Desktop */}
          <div className="p-4 flex items-center justify-center">
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
    </div>
  );
};

export default VenvlSearchPill;
