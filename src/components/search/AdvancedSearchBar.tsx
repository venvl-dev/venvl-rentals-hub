
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingTypeSelector from './BookingTypeSelector';
import AnimatedDatePicker from './AnimatedDatePicker';
import ResponsiveGuestPicker from './ResponsiveGuestPicker';
import AnimatedFilterPanel from './AnimatedFilterPanel';
import FilterBadges from './FilterBadges';

interface SearchFilters {
  location: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  bookingType: 'daily' | 'monthly' | 'flexible';
  flexibleOption?: string;
  duration?: number;
  minDays?: number;
  minMonths?: number;
  propertyType?: string;
  priceRange?: { min: number; max: number };
  amenities?: string[];
}

interface AdvancedSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

const AdvancedSearchBar = ({ onSearch, initialFilters }: AdvancedSearchBarProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: initialFilters?.location || '',
    checkIn: initialFilters?.checkIn,
    checkOut: initialFilters?.checkOut,
    guests: initialFilters?.guests || 1,
    bookingType: initialFilters?.bookingType || 'daily',
    flexibleOption: initialFilters?.flexibleOption,
    duration: initialFilters?.duration,
    minDays: initialFilters?.minDays,
    minMonths: initialFilters?.minMonths,
    propertyType: initialFilters?.propertyType,
    priceRange: initialFilters?.priceRange,
    amenities: initialFilters?.amenities || [],
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSearch = () => {
    console.log('VENVL Advanced search filters:', filters);
    onSearch(filters);
    setActiveSection(null);
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      guests: 1,
      bookingType: 'daily',
      amenities: [],
    });
  };

  const hasActiveFilters = filters.location || filters.propertyType || 
    (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 1000)) ||
    (filters.amenities && filters.amenities.length > 0);

  return (
    <motion.div
      className="w-full max-w-6xl mx-auto space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Booking Type Selector */}
      <div className="w-full overflow-x-hidden">
        <BookingTypeSelector
          selectedType={filters.bookingType}
          onTypeChange={(type) => updateFilters({ bookingType: type })}
        />
      </div>

      {/* Main Search Container */}
      <motion.div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden w-full"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <div className="divide-y divide-gray-100">
            {/* Destination */}
            <motion.div
              className={`p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                activeSection === 'destination' 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection(activeSection === 'destination' ? null : 'destination')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">
                Where
              </div>
              <div className={`text-sm font-medium truncate ${
                activeSection === 'destination' ? 'text-white' : 'text-gray-900'
              }`}>
                {filters.location || 'Search destinations'}
              </div>
            </motion.div>

            {/* Dates */}
            <motion.div
              className={`p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                activeSection === 'dates' 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection(activeSection === 'dates' ? null : 'dates')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <AnimatedDatePicker
                bookingType={filters.bookingType}
                checkIn={filters.checkIn}
                checkOut={filters.checkOut}
                duration={filters.duration}
                flexibleOption={filters.flexibleOption}
                minDays={filters.minDays}
                minMonths={filters.minMonths}
                isActive={activeSection === 'dates'}
                onDateChange={updateFilters}
              />
            </motion.div>

            {/* Guests */}
            <motion.div
              className={`p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                activeSection === 'guests' 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection(activeSection === 'guests' ? null : 'guests')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <ResponsiveGuestPicker
                guests={filters.guests}
                isActive={activeSection === 'guests'}
                onChange={(guests) => updateFilters({ guests })}
              />
            </motion.div>

            {/* Search Button */}
            <div className="p-4 sm:p-6">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSearch}
                  className="w-full bg-black hover:bg-gray-800 text-white rounded-xl py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                  size="lg"
                >
                  <Search className="h-5 w-5" />
                  Search
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-5 divide-x divide-gray-100">
            {/* Destination */}
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-300 ${
                activeSection === 'destination' 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection(activeSection === 'destination' ? null : 'destination')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">
                Where
              </div>
              <div className={`text-sm font-medium truncate ${
                activeSection === 'destination' ? 'text-white' : 'text-gray-900'
              }`}>
                {filters.location || 'Search destinations'}
              </div>
            </motion.div>

            {/* Dates */}
            <motion.div
              className={`col-span-2 p-6 cursor-pointer transition-all duration-300 ${
                activeSection === 'dates' 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection(activeSection === 'dates' ? null : 'dates')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatedDatePicker
                bookingType={filters.bookingType}
                checkIn={filters.checkIn}
                checkOut={filters.checkOut}
                duration={filters.duration}
                flexibleOption={filters.flexibleOption}
                minDays={filters.minDays}
                minMonths={filters.minMonths}
                isActive={activeSection === 'dates'}
                onDateChange={updateFilters}
              />
            </motion.div>

            {/* Guests */}
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-300 ${
                activeSection === 'guests' 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection(activeSection === 'guests' ? null : 'guests')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ResponsiveGuestPicker
                guests={filters.guests}
                isActive={activeSection === 'guests'}
                onChange={(guests) => updateFilters({ guests })}
              />
            </motion.div>

            {/* Search Button */}
            <div className="p-4 flex items-center justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleSearch}
                  className="bg-black hover:bg-gray-800 text-white rounded-2xl px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                  size="lg"
                >
                  <Search className="h-5 w-5" />
                  <span className="hidden xl:inline">Search</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <motion.button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showAdvancedFilters ? 'Hide filters' : 'More filters'}
            </motion.button>

            {hasActiveFilters && (
              <motion.button
                onClick={clearFilters}
                className="text-sm font-medium text-gray-500 hover:text-black transition-colors underline"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear all
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filter Badges */}
      <AnimatePresence>
        {hasActiveFilters && (
          <FilterBadges
            filters={filters}
            onRemoveFilter={(filterType, value) => {
              if (filterType === 'amenities') {
                updateFilters({
                  amenities: filters.amenities?.filter(a => a !== value)
                });
              } else if (filterType === 'propertyType') {
                updateFilters({ propertyType: undefined });
              } else if (filterType === 'priceRange') {
                updateFilters({ priceRange: undefined });
              } else if (filterType === 'location') {
                updateFilters({ location: '' });
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <AnimatedFilterPanel
            filters={filters}
            onFiltersChange={updateFilters}
            onClose={() => setShowAdvancedFilters(false)}
          />
        )}
      </AnimatePresence>

      {/* Destination Dropdown */}
      <AnimatePresence>
        {activeSection === 'destination' && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden mx-2 sm:mx-0"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Where are you going?"
                  value={filters.location}
                  onChange={(e) => updateFilters({ location: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveSection(null)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-black focus:outline-none transition-colors text-base sm:text-lg"
                  autoFocus
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Miami, FL'].map((city) => (
                    <motion.button
                      key={city}
                      onClick={() => {
                        updateFilters({ location: city });
                        setActiveSection(null);
                      }}
                      className="p-3 text-left rounded-xl hover:bg-gray-100 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="font-medium">{city}</div>
                      <div className="text-sm text-gray-500">Popular destination</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdvancedSearchBar;
