
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, MapPin, Users, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingTypeSelector from './BookingTypeSelector';
import AnimatedDatePicker from './AnimatedDatePicker';
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

  const popularDestinations = [
    'New York, NY',
    'Los Angeles, CA', 
    'Chicago, IL',
    'Miami, FL'
  ];

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-3"
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
        className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-full"
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
      >
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <div className="divide-y divide-gray-100">
            {/* Destination */}
            <motion.div
              className={`p-4 cursor-pointer transition-all duration-300 ${
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
              className={`p-4 cursor-pointer transition-all duration-300 ${
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
              className={`p-4 cursor-pointer transition-all duration-300 ${
                activeSection === 'guests' 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection(activeSection === 'guests' ? null : 'guests')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">
                Who
              </div>
              <div className={`text-sm font-medium flex items-center gap-2 transition-colors duration-200 ${
                activeSection === 'guests' ? 'text-white' : 'text-gray-900'
              }`}>
                <Users className="h-4 w-4 opacity-70" />
                <span>{filters.guests} guest{filters.guests > 1 ? 's' : ''}</span>
              </div>
            </motion.div>

            {/* Search Button */}
            <div className="p-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSearch}
                  className="w-full bg-black hover:bg-gray-800 text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-3"
                  size="lg"
                >
                  <Search className="h-4 w-4" />
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
              className={`p-4 cursor-pointer transition-all duration-300 ${
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
              className={`col-span-2 p-4 cursor-pointer transition-all duration-300 ${
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
              className={`p-4 cursor-pointer transition-all duration-300 ${
                activeSection === 'guests' 
                  ? 'bg-black text-white' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection(activeSection === 'guests' ? null : 'guests')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">
                Who
              </div>
              <div className={`text-sm font-medium flex items-center gap-2 transition-colors duration-200 ${
                activeSection === 'guests' ? 'text-white' : 'text-gray-900'
              }`}>
                <Users className="h-4 w-4 opacity-70" />
                <span>{filters.guests} guest{filters.guests > 1 ? 's' : ''}</span>
              </div>
            </motion.div>

            {/* Search Button */}
            <div className="p-3 flex items-center justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleSearch}
                  className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-3 font-semibold flex items-center gap-2"
                  size="lg"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden xl:inline">Search</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden mx-2 sm:mx-0"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Where are you going?"
                  value={filters.location}
                  onChange={(e) => updateFilters({ location: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveSection(null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-black focus:outline-none transition-colors"
                  autoFocus
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {popularDestinations.map((city) => (
                    <motion.button
                      key={city}
                      onClick={() => {
                        updateFilters({ location: city });
                        setActiveSection(null);
                      }}
                      className="p-2 text-left rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div className="text-sm font-medium">{city}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest Picker Dropdown */}
      <AnimatePresence>
        {activeSection === 'guests' && (
          <motion.div
            className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden w-80 mx-2 sm:mx-0"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Guests</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ guests: Math.max(1, filters.guests - 1) })}
                    disabled={filters.guests <= 1}
                    className="w-8 h-8 rounded-full p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{filters.guests}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ guests: Math.min(16, filters.guests + 1) })}
                    disabled={filters.guests >= 16}
                    className="w-8 h-8 rounded-full p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <Button
                  onClick={() => setActiveSection(null)}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  Done
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdvancedSearchBar;
