
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import DestinationPicker from './DestinationPicker';
import DatePicker from './DatePicker';
import GuestPicker from './GuestPicker';

interface SearchFilters {
  location: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  bookingType: 'daily' | 'monthly' | 'flexible';
}

interface SearchPillProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

const SearchPill = ({ onSearch, initialFilters }: SearchPillProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    location: initialFilters?.location || '',
    checkIn: initialFilters?.checkIn,
    checkOut: initialFilters?.checkOut,
    guests: initialFilters?.guests || 1,
    bookingType: initialFilters?.bookingType || 'daily',
    ...initialFilters
  });

  const handleSectionClick = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleSearch = () => {
    onSearch(filters);
    setActiveSection(null);
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <motion.div
        className="bg-white rounded-full border border-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 relative">
          {/* Where Section */}
          <motion.div
            className={`relative p-4 rounded-l-full cursor-pointer transition-all duration-200 ${
              activeSection === 'where' ? 'bg-gray-100 shadow-inner' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('where')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-1">Where</div>
            <div className="text-sm text-gray-600 truncate">
              {filters.location || 'Search destinations'}
            </div>
          </motion.div>

          <Separator orientation="vertical" className="hidden md:block h-8 my-auto" />

          {/* When Section */}
          <motion.div
            className={`relative p-4 cursor-pointer transition-all duration-200 ${
              activeSection === 'when' ? 'bg-gray-100 shadow-inner' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('when')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-1">When</div>
            <div className="text-sm text-gray-600 truncate">
              {filters.checkIn ? 
                `${filters.checkIn.toLocaleDateString()} - ${filters.checkOut?.toLocaleDateString() || 'Add date'}` :
                'Add dates'
              }
            </div>
          </motion.div>

          <Separator orientation="vertical" className="hidden md:block h-8 my-auto" />

          {/* Who Section */}
          <motion.div
            className={`relative p-4 cursor-pointer transition-all duration-200 ${
              activeSection === 'who' ? 'bg-gray-100 shadow-inner' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSectionClick('who')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-1">Who</div>
            <div className="text-sm text-gray-600 truncate">
              {filters.guests} guest{filters.guests > 1 ? 's' : ''}
            </div>
          </motion.div>

          {/* Search Button */}
          <div className="p-2 flex items-center justify-end">
            <Button
              onClick={handleSearch}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-full p-3 h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Dropdowns */}
      {activeSection === 'where' && (
        <DestinationPicker
          value={filters.location}
          onChange={(location) => updateFilters({ location })}
          onClose={() => setActiveSection(null)}
        />
      )}

      {activeSection === 'when' && (
        <DatePicker
          checkIn={filters.checkIn}
          checkOut={filters.checkOut}
          bookingType={filters.bookingType}
          onDateChange={(dates) => updateFilters(dates)}
          onBookingTypeChange={(bookingType) => updateFilters({ bookingType: bookingType as 'daily' | 'monthly' | 'flexible' })}
          onClose={() => setActiveSection(null)}
        />
      )}

      {activeSection === 'who' && (
        <GuestPicker
          guests={filters.guests}
          onChange={(guests) => updateFilters({ guests })}
          onClose={() => setActiveSection(null)}
        />
      )}
    </div>
  );
};

export default SearchPill;
