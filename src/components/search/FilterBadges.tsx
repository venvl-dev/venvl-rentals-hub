
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

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

interface FilterBadgesProps {
  filters: SearchFilters;
  onRemoveFilter: (filterType: string, value?: string) => void;
}

const FilterBadges = ({ filters, onRemoveFilter }: FilterBadgesProps) => {
  const badges = [];

  // Location badge
  if (filters.location) {
    badges.push({
      type: 'location',
      label: filters.location,
      value: filters.location
    });
  }

  // Property type badge
  if (filters.propertyType) {
    badges.push({
      type: 'propertyType',
      label: filters.propertyType,
      value: filters.propertyType
    });
  }

  // Price range badge
  if (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 1000)) {
    badges.push({
      type: 'priceRange',
      label: `$${filters.priceRange.min || 0} - $${filters.priceRange.max || 1000}`,
      value: 'priceRange'
    });
  }

  // Amenity badges
  if (filters.amenities && filters.amenities.length > 0) {
    filters.amenities.forEach(amenity => {
      badges.push({
        type: 'amenities',
        label: amenity,
        value: amenity
      });
    });
  }

  if (badges.length === 0) return null;

  return (
    <motion.div
      className="flex flex-wrap gap-2 px-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {badges.map((badge, index) => (
          <motion.div
            key={`${badge.type}-${badge.value}`}
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
              onClick={() => onRemoveFilter(badge.type, badge.value)}
            >
              <span className="capitalize">{badge.label}</span>
              <X className="h-3 w-3" />
            </Badge>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default FilterBadges;
