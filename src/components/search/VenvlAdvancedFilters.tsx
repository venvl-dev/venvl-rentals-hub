
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { X, SlidersHorizontal, Home, Wifi, Car, Utensils, Waves, Dumbbell, Tv, Snowflake } from 'lucide-react';

interface FilterProps {
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
  initialFilters?: any;
}

const VenvlAdvancedFilters = ({ onFiltersChange, onClose, initialFilters = {} }: FilterProps) => {
  const [priceRange, setPriceRange] = useState<[number, number]>(
    initialFilters.priceRange || [0, 10000]
  );
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(
    initialFilters.propertyTypes || []
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialFilters.amenities || []
  );
  const [bedrooms, setBedrooms] = useState<number | null>(initialFilters.bedrooms || null);
  const [bathrooms, setBathrooms] = useState<number | null>(initialFilters.bathrooms || null);

  const propertyTypes = [
    { id: 'apartment', label: 'Apartment', icon: Home },
    { id: 'house', label: 'House', icon: Home },
    { id: 'villa', label: 'Villa', icon: Home },
    { id: 'studio', label: 'Studio', icon: Home },
    { id: 'cabin', label: 'Cabin', icon: Home },
    { id: 'loft', label: 'Loft', icon: Home },
  ];

  const amenities = [
    { id: 'WiFi', label: 'WiFi', icon: Wifi },
    { id: 'Kitchen', label: 'Kitchen', icon: Utensils },
    { id: 'Parking', label: 'Parking', icon: Car },
    { id: 'Pool', label: 'Pool', icon: Waves },
    { id: 'Gym', label: 'Gym', icon: Dumbbell },
    { id: 'TV', label: 'TV', icon: Tv },
    { id: 'Air Conditioning', label: 'AC', icon: Snowflake },
  ];

  const togglePropertyType = (type: string) => {
    setSelectedPropertyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleApplyFilters = () => {
    const filters = {
      priceRange: priceRange[0] === 0 && priceRange[1] === 10000 ? null : priceRange,
      propertyTypes: selectedPropertyTypes.length > 0 ? selectedPropertyTypes : null,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : null,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
    };
    
    onFiltersChange(filters);
    onClose();
  };

  const clearAllFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedPropertyTypes([]);
    setSelectedAmenities([]);
    setBedrooms(null);
    setBathrooms(null);
  };

  const hasActiveFilters = 
    (priceRange[0] > 0 || priceRange[1] < 10000) ||
    selectedPropertyTypes.length > 0 ||
    selectedAmenities.length > 0 ||
    bedrooms !== null ||
    bathrooms !== null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-0 shadow-none">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <SlidersHorizontal className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CardContent className="p-6 space-y-8">
            {/* Price Range */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Price Range</h3>
              <div className="px-3">
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>EGP {priceRange[0]}</span>
                  <span>EGP {priceRange[1]}+</span>
                </div>
              </div>
            </div>

            {/* Property Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Property Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {propertyTypes.map((type) => (
                  <motion.button
                    key={type.id}
                    onClick={() => togglePropertyType(type.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      selectedPropertyTypes.includes(type.id)
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <type.icon className="h-5 w-5 text-gray-700" />
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Rooms */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Bedrooms</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      variant={bedrooms === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBedrooms(bedrooms === num ? null : num)}
                      className="w-10 h-10 p-0 rounded-full"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Bathrooms</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      variant={bathrooms === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBathrooms(bathrooms === num ? null : num)}
                      className="w-10 h-10 p-0 rounded-full"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
              <div className="grid grid-cols-2 gap-3">
                {amenities.map((amenity) => (
                  <motion.button
                    key={amenity.id}
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                      selectedAmenities.includes(amenity.id)
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <amenity.icon className="h-4 w-4 text-gray-700" />
                      <span className="font-medium text-sm">{amenity.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </CardContent>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear all
              </Button>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="bg-black text-white hover:bg-gray-800 px-8"
                >
                  Apply filters
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default VenvlAdvancedFilters;
