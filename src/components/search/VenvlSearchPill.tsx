
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
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
      return `${filters.duration} ${filters.duration === 1 ? 'شهر' : 'أشهر'}`;
    }
    if (filters.bookingType === 'flexible' && filters.flexibleOption) {
      const flexOptions = {
        weekend: 'عطلة نهاية الأسبوع',
        week: 'أسبوع',
        month: 'شهر',
        any: 'مرن'
      };
      return flexOptions[filters.flexibleOption as keyof typeof flexOptions] || 'مرن';
    }
    if (filters.checkIn) {
      const checkInStr = filters.checkIn.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
      if (filters.checkOut) {
        const checkOutStr = filters.checkOut.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
        return `${checkInStr} - ${checkOutStr}`;
      }
      return checkInStr;
    }
    return 'اختر التواريخ';
  };

  if (isMobile) {
    return (
      <div className="w-full px-4">
        {/* Mobile Booking Type Selector */}
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

        {/* Mobile Compact Search Bar */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Where Section */}
          <motion.div
            className={`p-4 cursor-pointer transition-colors duration-200 ${
              activeSection === 'where' ? 'bg-gray-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('where')}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">أين تريد الذهاب؟</div>
                <div className="text-sm text-gray-900 truncate">
                  {filters.location || 'البحث عن الوجهات'}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="border-t border-gray-100" />

          {/* When Section */}
          <motion.div
            className={`p-4 cursor-pointer transition-colors duration-200 ${
              activeSection === 'when' ? 'bg-gray-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('when')}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">متى؟</div>
                <div className="text-sm text-gray-900 truncate">
                  {getDateDisplayText()}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="border-t border-gray-100" />

          {/* Who Section */}
          <motion.div
            className={`p-4 cursor-pointer transition-colors duration-200 ${
              activeSection === 'who' ? 'bg-gray-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('who')}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">من؟</div>
                <div className="text-sm text-gray-900 truncate">
                  {filters.guests} {filters.guests === 1 ? 'ضيف' : filters.guests === 2 ? 'ضيفان' : 'ضيوف'}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="border-t border-gray-100" />

          {/* Search Button */}
          <div className="p-4">
            <Button
              onClick={handleSearch}
              className="w-full bg-black hover:bg-gray-800 text-white rounded-xl py-3 font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              بحث
            </Button>
          </div>
        </motion.div>

        {/* Mobile Full-Screen Overlays */}
        <AnimatePresence>
          {activeSection === 'where' && (
            <motion.div
              className="fixed inset-0 bg-white z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
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
              className="fixed inset-0 bg-white z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
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
              className="fixed inset-0 bg-white z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <VenvlGuestPicker
                guests={filters.guests}
                onChange={(guests) => updateFilters({ guests })}
                onClose={() => setActiveSection(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Desktop Booking Type Selector */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <VenvlBookingTypeSelector
          selectedType={filters.bookingType}
          onTypeChange={(type) => updateFilters({ bookingType: type })}
        />
      </motion.div>

      {/* Desktop Search Bar */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileHover={{ 
          boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
          transition: { duration: 0.2 }
        }}
      >
        <div className="flex items-stretch">
          {/* Where Section */}
          <div className="flex-1 relative">
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-200 ${
                activeSection === 'where' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('where')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    أين تريد الذهاب؟
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {filters.location || 'البحث عن الوجهات'}
                  </div>
                </div>
              </div>
            </motion.div>
            
            <AnimatePresence>
              {activeSection === 'where' && (
                <div className="absolute top-full left-0 right-0 z-50">
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
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-200 ${
                activeSection === 'when' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('when')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    متى؟
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {getDateDisplayText()}
                  </div>
                </div>
              </div>
            </motion.div>
            
            <AnimatePresence>
              {activeSection === 'when' && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 z-50">
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
            <motion.div
              className={`p-6 cursor-pointer transition-all duration-200 ${
                activeSection === 'who' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('who')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    من؟
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {filters.guests} {filters.guests === 1 ? 'ضيف' : filters.guests === 2 ? 'ضيفان' : 'ضيوف'}
                  </div>
                </div>
              </div>
            </motion.div>
            
            <AnimatePresence>
              {activeSection === 'who' && (
                <div className="absolute top-full right-0 z-50">
                  <VenvlGuestPicker
                    guests={filters.guests}
                    onChange={(guests) => updateFilters({ guests })}
                    onClose={() => setActiveSection(null)}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Button */}
          <div className="flex items-center p-4">
            <Button
              onClick={handleSearch}
              className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Search className="h-4 w-4" />
              بحث
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VenvlSearchPill;
