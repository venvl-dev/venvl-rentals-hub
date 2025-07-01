
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Calendar, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import VenvlBookingTypeSelector from './components/VenvlBookingTypeSelector';
import VenvlDestinationPicker from './VenvlDestinationPicker';
import VenvlDatePicker from './VenvlDatePicker';
import VenvlGuestCounter from './components/VenvlGuestCounter';

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

interface RefactoredVenvlSearchPillProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

const RefactoredVenvlSearchPill = ({ onSearch, initialFilters }: RefactoredVenvlSearchPillProps) => {
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
    console.log('Search initiated with filters:', filters);
    onSearch(filters);
    setActiveSection(null);
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getDateDisplayText = () => {
    if (filters.bookingType === 'monthly' && filters.duration) {
      return `${filters.duration} ${filters.duration === 1 ? 'month' : 'months'}`;
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
        return `${checkInStr} - ${checkOutStr}`;
      }
      return checkInStr;
    }
    return 'Add dates';
  };

  if (isMobile) {
    return (
      <div className="w-full px-4">
        {/* Mobile Booking Type Selector - NO hover animations */}
        <div className="mb-6 flex justify-center">
          <VenvlBookingTypeSelector
            selectedType={filters.bookingType}
            onTypeChange={(type) => updateFilters({ bookingType: type })}
            isMobile={true}
          />
        </div>

        {/* Mobile Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Where Section */}
          <div
            className={`p-4 cursor-pointer transition-colors duration-200 ${
              activeSection === 'where' ? 'bg-gray-50' : ''
            }`}
            onClick={() => handleSectionClick('where')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">Where</div>
                <div className="text-sm text-gray-900 truncate">
                  {filters.location || 'Search destinations'}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* When Section */}
          <div
            className={`p-4 cursor-pointer transition-colors duration-200 ${
              activeSection === 'when' ? 'bg-gray-50' : ''
            }`}
            onClick={() => handleSectionClick('when')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">When</div>
                <div className="text-sm text-gray-900 truncate">
                  {getDateDisplayText()}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Who Section */}
          <div
            className={`p-4 cursor-pointer transition-colors duration-200 ${
              activeSection === 'who' ? 'bg-gray-50' : ''
            }`}
            onClick={() => handleSectionClick('who')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">Who</div>
                <div className="text-sm text-gray-900 truncate">
                  {filters.guests} {filters.guests === 1 ? 'guest' : 'guests'}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Search Button */}
          <div className="p-4">
            <Button
              onClick={handleSearch}
              className="w-full bg-black text-white rounded-xl py-3 font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>

        {/* Mobile Full-Screen Overlays */}
        <AnimatePresence>
          {activeSection === 'where' && (
            <motion.div
              className="fixed inset-0 bg-white z-[9999]"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <VenvlDestinationPicker
                value={filters.location}
                onChange={(location) => updateFilters({ location })}
                onClose={() => setActiveSection(null)}
              />
            </motion.div>
          )}

          {activeSection === 'when' && (
            <motion.div
              className="fixed inset-0 bg-white z-[9999]"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <VenvlDatePicker
                checkIn={filters.checkIn}
                checkOut={filters.checkOut}
                bookingType={filters.bookingType}
                duration={filters.duration}
                flexibleOption={filters.flexibleOption}
                onDateChange={(dates) => updateFilters(dates)}
                onClose={() => setActiveSection(null)}
              />
            </motion.div>
          )}

          {activeSection === 'who' && (
            <motion.div
              className="fixed inset-0 bg-white z-[9999]"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <VenvlGuestCounter
                guests={filters.guests}
                onChange={(guests) => updateFilters({ guests })}
                onClose={() => setActiveSection(null)}
                isMobile={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Desktop Booking Type Selector - NO hover animations */}
      <div className="mb-6">
        <VenvlBookingTypeSelector
          selectedType={filters.bookingType}
          onTypeChange={(type) => updateFilters({ bookingType: type })}
          isMobile={false}
        />
      </div>

      {/* Desktop Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-visible relative">
        <div className="flex items-stretch">
          {/* Where Section */}
          <div className="flex-1 relative">
            <div
              className={`p-6 cursor-pointer transition-all duration-200 ${
                activeSection === 'where' ? 'bg-gray-50' : ''
              }`}
              onClick={() => handleSectionClick('where')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Where
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {filters.location || 'Search destinations'}
                  </div>
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {activeSection === 'where' && (
                <div className="absolute top-full left-0 right-0 z-[1000] mt-2">
                  <VenvlDestinationPicker
                    value={filters.location}
                    onChange={(location) => updateFilters({ location })}
                    onClose={() => setActiveSection(null)}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px bg-gray-200" />

          {/* When Section */}
          <div className="flex-1 relative">
            <div
              className={`p-6 cursor-pointer transition-all duration-200 ${
                activeSection === 'when' ? 'bg-gray-50' : ''
              }`}
              onClick={() => handleSectionClick('when')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    When
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {getDateDisplayText()}
                  </div>
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {activeSection === 'when' && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 z-[1000] mt-2">
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

          <div className="w-px bg-gray-200" />

          {/* Who Section */}
          <div className="flex-1 relative">
            <div
              className={`p-6 cursor-pointer transition-all duration-200 ${
                activeSection === 'who' ? 'bg-gray-50' : ''
              }`}
              onClick={() => handleSectionClick('who')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Who
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {filters.guests} {filters.guests === 1 ? 'guest' : 'guests'}
                  </div>
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {activeSection === 'who' && (
                <div className="absolute top-full right-0 z-[1000] mt-2">
                  <VenvlGuestCounter
                    guests={filters.guests}
                    onChange={(guests) => updateFilters({ guests })}
                    onClose={() => setActiveSection(null)}
                    isMobile={false}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Button */}
          <div className="flex items-center p-4">
            <Button
              onClick={handleSearch}
              className="bg-black text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefactoredVenvlSearchPill;
