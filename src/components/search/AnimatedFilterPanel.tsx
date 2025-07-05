
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Home, DollarSign, Wifi } from 'lucide-react';
import { AMENITIES } from '@/lib/amenitiesUtils';

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

interface AnimatedFilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClose: () => void;
}

const AnimatedFilterPanel = ({ filters, onFiltersChange, onClose }: AnimatedFilterPanelProps) => {
  const propertyTypes = [
    'apartment', 'house', 'villa', 'studio', 'cabin', 'loft'
  ];

  const amenitiesList = AMENITIES.flatMap((category) =>
    category.items.map((item) => item.id)
  );

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    onFiltersChange({ amenities: newAmenities });
  };

  return (
    <motion.div
      className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.h2 
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Filters
          </motion.h2>
          <motion.button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Property Type</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {propertyTypes.map((type, index) => (
                <motion.button
                  key={type}
                  onClick={() => onFiltersChange({ 
                    propertyType: filters.propertyType === type ? undefined : type 
                  })}
                  className={`p-3 rounded-2xl border-2 transition-all duration-300 capitalize ${
                    filters.propertyType === type
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Price Range */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Price Range</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                  <input
                    type="number"
                    placeholder="$0"
                    value={filters.priceRange?.min || ''}
                    onChange={(e) => onFiltersChange({ 
                      priceRange: { 
                        min: parseInt(e.target.value) || 0, 
                        max: filters.priceRange?.max || 1000 
                      }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-black focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                  <input
                    type="number"
                    placeholder="$1000"
                    value={filters.priceRange?.max || ''}
                    onChange={(e) => onFiltersChange({ 
                      priceRange: { 
                        min: filters.priceRange?.min || 0, 
                        max: parseInt(e.target.value) || 1000 
                      }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-black focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Amenities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Wifi className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {amenitiesList.map((amenity, index) => (
                <motion.div
                  key={amenity}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.03 }}
                >
                  <Badge
                    variant={filters.amenities?.includes(amenity) ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-2 rounded-full transition-all duration-300 ${
                      filters.amenities?.includes(amenity)
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'hover:bg-gray-100 hover:border-gray-300'
                    }`}
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {amenity}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Flexible Options for Flexible Booking */}
        {filters.bookingType === 'flexible' && (
          <motion.div
            className="mt-8 pt-8 border-t border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Flexible Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Days</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.minDays || ''}
                  onChange={(e) => onFiltersChange({ minDays: parseInt(e.target.value) || undefined })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-black focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Months</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.minMonths || ''}
                  onChange={(e) => onFiltersChange({ minMonths: parseInt(e.target.value) || undefined })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-black focus:outline-none transition-colors"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div 
          className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="outline"
            onClick={() => onFiltersChange({
              propertyType: undefined,
              priceRange: undefined,
              amenities: [],
              minDays: undefined,
              minMonths: undefined
            })}
            className="rounded-2xl px-6 py-3"
          >
            Clear all
          </Button>
          <Button
            onClick={onClose}
            className="bg-black hover:bg-gray-800 text-white rounded-2xl px-8 py-3"
          >
            Show results
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnimatedFilterPanel;
