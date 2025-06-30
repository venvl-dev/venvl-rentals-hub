
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
      <div className="w-full max-w-md mx-auto px-4">
        {/* Mobile Booking Type Selector */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <VenvlBookingTypeSelector
            selectedType={filters.bookingType}
            onTypeChange={(type) => updateFilters({ bookingType: type })}
          />
        </motion.div>

        {/* Mobile Search Card */}
        <motion.div
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Where Section */}
          <motion.div
            className={`p-6 border-b border-gray-100 cursor-pointer transition-all duration-300 ${
              activeSection === 'where' ? 'bg-gray-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('where')}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              أين تريد الذهاب؟
            </div>
            <div className="text-base font-medium text-gray-900">
              {filters.location || 'البحث عن الوجهات'}
            </div>
          </motion.div>

          {/* When Section */}
          <motion.div
            className={`p-6 border-b border-gray-100 cursor-pointer transition-all duration-300 ${
              activeSection === 'when' ? 'bg-gray-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('when')}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              متى؟
            </div>
            <div className="text-base font-medium text-gray-900">
              {getDateDisplayText()}
            </div>
          </motion.div>

          {/* Who Section */}
          <motion.div
            className={`p-6 cursor-pointer transition-all duration-300 ${
              activeSection === 'who' ? 'bg-gray-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('who')}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              من؟
            </div>
            <div className="text-base font-medium text-gray-900">
              {filters.guests} {filters.guests === 1 ? 'ضيف' : filters.guests === 2 ? 'ضيفان' : 'ضيوف'}
            </div>
          </motion.div>

          {/* Search Button */}
          <div className="p-6 bg-gray-50">
            <Button
              onClick={handleSearch}
              className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-2xl py-4 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Search className="h-5 w-5" />
              بحث
            </Button>
          </div>
        </motion.div>

        {/* Mobile Overlays */}
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
    <div className="w-full max-w-5xl mx-auto">
      {/* Desktop Booking Type Selector */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <VenvlBookingTypeSelector
          selectedType={filters.bookingType}
          onTypeChange={(type) => updateFilters({ bookingType: type })}
        />
      </motion.div>

      {/* Desktop Search Bar */}
      <motion.div
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
      >
        <div className="flex">
          {/* Where Section */}
          <div className="flex-1 relative">
            <motion.div
              className={`p-8 cursor-pointer transition-all duration-300 border-r border-gray-100 ${
                activeSection === 'where' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('where')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                أين تريد الذهاب؟
              </div>
              <div className="text-base font-medium text-gray-900">
                {filters.location || 'البحث عن الوجهات'}
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

          {/* When Section */}
          <div className="flex-1 relative">
            <motion.div
              className={`p-8 cursor-pointer transition-all duration-300 border-r border-gray-100 ${
                activeSection === 'when' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('when')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                متى؟
              </div>
              <div className="text-base font-medium text-gray-900">
                {getDateDisplayText()}
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

          {/* Who Section */}
          <div className="flex-1 relative">
            <motion.div
              className={`p-8 cursor-pointer transition-all duration-300 border-r border-gray-100 ${
                activeSection === 'who' ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSectionClick('who')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                من؟
              </div>
              <div className="text-base font-medium text-gray-900">
                {filters.guests} {filters.guests === 1 ? 'ضيف' : filters.guests === 2 ? 'ضيفان' : 'ضيوف'}
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
          <div className="flex items-center p-8">
            <Button
              onClick={handleSearch}
              className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white rounded-2xl px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
            >
              <Search className="h-5 w-5" />
              بحث
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VenvlSearchPill;
