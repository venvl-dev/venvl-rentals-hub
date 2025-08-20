import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOptions {
  priceRange: [number, number];
  propertyTypes: string[];
  amenities: string[];
  bookingTypes: string[];
  minRating: number;
  instantBook: boolean;
}

interface PropertyFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableFilters: {
    propertyTypes: { value: string; label: string; count: number }[];
    amenities: { value: string; label: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

const PropertyFilters = ({ filters, onFiltersChange, availableFilters }: PropertyFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: FilterOptions[keyof FilterOptions]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      priceRange: [availableFilters.priceRange.min, availableFilters.priceRange.max],
      propertyTypes: [],
      amenities: [],
      bookingTypes: [],
      minRating: 0,
      instantBook: false,
    });
  };

  const activeFiltersCount = [
    filters.propertyTypes.length > 0,
    filters.amenities.length > 0,
    filters.bookingTypes.length > 0,
    filters.minRating > 0,
    filters.instantBook,
    filters.priceRange[0] !== availableFilters.priceRange.min || 
    filters.priceRange[1] !== availableFilters.priceRange.max
  ].filter(Boolean).length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-full px-6 py-3 border-2 hover:border-gray-400 transition-all duration-200"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-gray-900 text-white">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </motion.div>

        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                variant="ghost" 
                onClick={clearAllFilters}
                className="text-gray-600 hover:text-gray-900 underline"
              >
                Clear all
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Card className="shadow-lg border-0 bg-white rounded-3xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Price Range */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <h3 className="font-semibold mb-4 text-lg">Price Range</h3>
                    <div className="space-y-4">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                        max={availableFilters.priceRange.max}
                        min={availableFilters.priceRange.min}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium">${filters.priceRange[0]}</span>
                        <span className="font-medium">${filters.priceRange[1]}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Property Types */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <h3 className="font-semibold mb-4 text-lg">Property Type</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {availableFilters.propertyTypes.map((type, index) => (
                        <motion.div
                          key={type.value}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <Checkbox
                            id={`type-${type.value}`}
                            checked={filters.propertyTypes.includes(type.value)}
                            onCheckedChange={(checked) => {
                              const newTypes = checked
                                ? [...filters.propertyTypes, type.value]
                                : filters.propertyTypes.filter(t => t !== type.value);
                              updateFilter('propertyTypes', newTypes);
                            }}
                            className="border-2"
                          />
                          <label
                            htmlFor={`type-${type.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                          >
                            {type.label} <span className="text-gray-500">({type.count})</span>
                          </label>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Amenities */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <h3 className="font-semibold mb-4 text-lg">Amenities</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {availableFilters.amenities.slice(0, 8).map((amenity, index) => (
                        <motion.div
                          key={amenity.value}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <Checkbox
                            id={`amenity-${amenity.value}`}
                            checked={filters.amenities.includes(amenity.value)}
                            onCheckedChange={(checked) => {
                              const newAmenities = checked
                                ? [...filters.amenities, amenity.value]
                                : filters.amenities.filter(a => a !== amenity.value);
                              updateFilter('amenities', newAmenities);
                            }}
                            className="border-2"
                          />
                          <label
                            htmlFor={`amenity-${amenity.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                          >
                            {amenity.label} <span className="text-gray-500">({amenity.count})</span>
                          </label>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Booking Types */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <h3 className="font-semibold mb-4 text-lg">Booking Options</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'daily', label: 'Daily stays' },
                        { value: 'monthly', label: 'Monthly stays' },
                        { value: 'flexible', label: 'Flexible dates' }
                      ].map((type, index) => (
                        <motion.div
                          key={type.value}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                        >
                          <Checkbox
                            id={`booking-${type.value}`}
                            checked={filters.bookingTypes.includes(type.value)}
                            onCheckedChange={(checked) => {
                              const newTypes = checked
                                ? [...filters.bookingTypes, type.value]
                                : filters.bookingTypes.filter(t => t !== type.value);
                              updateFilter('bookingTypes', newTypes);
                            }}
                            className="border-2"
                          />
                          <label
                            htmlFor={`booking-${type.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {type.label}
                          </label>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Rating */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <h3 className="font-semibold mb-4 text-lg">Minimum Rating</h3>
                    <div className="space-y-3">
                      {[4.5, 4.0, 3.5, 3.0].map((rating, index) => (
                        <motion.div
                          key={rating}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                        >
                          <Checkbox
                            id={`rating-${rating}`}
                            checked={filters.minRating === rating}
                            onCheckedChange={(checked) => {
                              updateFilter('minRating', checked ? rating : 0);
                            }}
                            className="border-2"
                          />
                          <label
                            htmlFor={`rating-${rating}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {rating}+ stars
                          </label>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Instant Book */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    <h3 className="font-semibold mb-4 text-lg">Booking Options</h3>
                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                      <Checkbox
                        id="instant-book"
                        checked={filters.instantBook}
                        onCheckedChange={(checked) => updateFilter('instantBook', checked as boolean)}
                        className="border-2"
                      />
                      <label
                        htmlFor="instant-book"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Instant Book
                      </label>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertyFilters;
