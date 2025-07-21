import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, SlidersHorizontal, Home, Calendar, Building, Building2, Castle, Warehouse, TreePine } from 'lucide-react';
import { AMENITIES_LIST } from '@/lib/amenitiesUtils';
import EnhancedPriceRangeFilter from './EnhancedPriceRangeFilter';
import { usePriceRange } from '@/hooks/usePriceRange';
import { sanitizeAdvancedFilters, validateAdvancedFilters } from '@/lib/filterValidation';
import { toast } from 'sonner';

import { AdvancedFilters } from '@/hooks/useFilterStore';

interface FilterProps {
  onFiltersChange: (filters: Partial<AdvancedFilters>) => void;
  onClose: () => void;
  initialFilters?: Partial<AdvancedFilters>;
}

const VenvlAdvancedFilters = ({ onFiltersChange, onClose, initialFilters = {} }: FilterProps) => {
  const [bookingType, setBookingType] = useState<string>(
    initialFilters.bookingType || 'daily'
  );
  
  const { priceRange: dbPriceRange, loading: priceLoading } = usePriceRange(
    bookingType as 'daily' | 'monthly'
  );
  
  // Initialize state with proper defaults
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    // Use initial filters if available, otherwise use sensible defaults
    return initialFilters.priceRange || [0, 10000];
  });
  const [rangeReady, setRangeReady] = useState(false);
  const prevBookingType = useRef(bookingType);

  // Reset readiness while loading new price data
  useEffect(() => {
    if (priceLoading) {
      setRangeReady(false);
    }
  }, [priceLoading]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(
    initialFilters.propertyTypes || []
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialFilters.amenities || []
  );
  const [bedrooms, setBedrooms] = useState<number | null>(initialFilters.bedrooms || null);
  const [bathrooms, setBathrooms] = useState<number | null>(initialFilters.bathrooms || null);

  // Update price range when booking type or db range changes
  useEffect(() => {
    if (!priceLoading && dbPriceRange) {
      const bookingTypeChanged = prevBookingType.current !== bookingType;
      if (initialFilters.priceRange == null || bookingTypeChanged) {
        setPriceRange([dbPriceRange.min, dbPriceRange.max]);
      }
      prevBookingType.current = bookingType;
      setRangeReady(true);
    }
  }, [dbPriceRange, priceLoading, bookingType, initialFilters.priceRange]);

  const bookingTypes = [
    { id: 'daily', label: 'Daily Stay', icon: Calendar },
    { id: 'monthly', label: 'Monthly Stay', icon: Home },
  ];

  const propertyTypes = [
    { id: 'apartment', label: 'Apartment', icon: Building },
    { id: 'house', label: 'House', icon: Home },
    { id: 'villa', label: 'Villa', icon: Castle },
    { id: 'studio', label: 'Studio', icon: Building2 },
    { id: 'cabin', label: 'Cabin', icon: TreePine },
    { id: 'loft', label: 'Loft', icon: Warehouse },
  ];

  const amenities = AMENITIES_LIST; // Show all amenities

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

  const handleApply = () => {
    const rawFilters: AdvancedFilters = {
      bookingType,
      priceRange,
      propertyTypes: selectedPropertyTypes,
      amenities: selectedAmenities,
      bedrooms,
      bathrooms
    };

    const result = validateAdvancedFilters(rawFilters);
    if (!result.isValid) {
      toast.error('Some filters are invalid. Please review them.');
      return;
    }

    const sanitized = sanitizeAdvancedFilters(rawFilters);
    onFiltersChange(sanitized);
    onClose();
  };

  const resetFilters = () => {
    setBookingType('daily');
    setPriceRange([0, 10000]);
    setSelectedPropertyTypes([]);
    setSelectedAmenities([]);
    setBedrooms(null);
    setBathrooms(null);
    onClose();
  };

  const hasActiveFilters = () => {
    // Avoid evaluating until the price range has been synced with the database
    if (!rangeReady || priceLoading || !dbPriceRange || dbPriceRange.min <= 0) {
      return false;
    }

    return (
      (priceRange[0] > dbPriceRange.min || priceRange[1] < dbPriceRange.max) ||
      selectedPropertyTypes.length > 0 ||
      selectedAmenities.length > 0 ||
      bedrooms !== null ||
      bathrooms !== null ||
      (bookingType && bookingType !== 'daily')
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300">
        <Card className="border-0 shadow-none h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center transform transition-transform duration-200 hover:scale-105">
                  <SlidersHorizontal className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                  <p className="text-sm text-gray-600">Refine your search results</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-12 w-12 p-0 rounded-full hover:bg-gray-200 transition-all duration-200 hover:scale-105"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
            <CardContent className="p-6 space-y-8">
              
              {/* Booking Type Filter */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Booking Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  {bookingTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setBookingType(type.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-102 ${
                        bookingType === type.id
                          ? 'border-black bg-black text-white shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <type.icon className="h-6 w-6" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <EnhancedPriceRangeFilter
                value={priceRange}
                onChange={setPriceRange}
                bookingType={bookingType as 'daily' | 'monthly'}
                currency="EGP"
              />

              {/* Property Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Property Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => togglePropertyType(type.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-102 ${
                        selectedPropertyTypes.includes(type.id)
                          ? 'border-black bg-black text-white shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <type.icon className="h-5 w-5" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Bedrooms</h3>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Button
                        key={num}
                        variant="outline"
                        size="sm"
                        onClick={() => setBedrooms(bedrooms === num ? null : num)}
                        className={`w-14 h-14 p-0 rounded-full border-2 font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                          bedrooms === num 
                            ? 'bg-black text-white border-black shadow-lg' 
                            : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                        }`}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Bathrooms</h3>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4].map((num) => (
                      <Button
                        key={num}
                        variant="outline"
                        size="sm"
                        onClick={() => setBathrooms(bathrooms === num ? null : num)}
                        className={`w-14 h-14 p-0 rounded-full border-2 font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                          bathrooms === num 
                            ? 'bg-black text-white border-black shadow-lg' 
                            : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                        }`}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* All Amenities */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
                <div className="max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    {amenities.map((amenity) => (
                      <button
                        key={amenity.id}
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 transform hover:scale-102 ${
                          selectedAmenities.includes(amenity.id)
                            ? 'border-black bg-black text-white shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {(() => {
                            const IconComponent = amenity.icon;
                            return IconComponent ? (
                              <IconComponent className="h-4 w-4" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-current opacity-60" />
                            );
                          })()}
                          <span className="font-medium text-sm">{amenity.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={resetFilters}
                disabled={!hasActiveFilters()}
                className="text-gray-600 hover:text-gray-900 font-medium px-6 py-3 rounded-xl transition-all duration-200 hover:bg-gray-200"
              >
                Reset
              </Button>

              <Button
                onClick={handleApply}
                className="bg-black text-white hover:bg-gray-800 px-10 py-3 font-medium rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VenvlAdvancedFilters;
