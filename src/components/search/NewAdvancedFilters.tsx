import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, Calendar, Home, Building, Building2, Castle, TreePine, Warehouse, Bed, Bath, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AMENITIES_LIST } from '@/lib/amenitiesUtils';
import { usePriceRange } from '@/hooks/usePriceRange';
import { AdvancedFilters } from '@/hooks/useFilterStore';

interface NewAdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Partial<AdvancedFilters>) => void;
  initialFilters: AdvancedFilters;
}

const NewAdvancedFilters = ({ isOpen, onClose, onApply, initialFilters }: NewAdvancedFiltersProps) => {
  // Local state for all filters
  const [bookingType, setBookingType] = useState<string>(initialFilters.bookingType || 'daily');
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(initialFilters.propertyTypes || []);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialFilters.amenities || []);
  const [bedrooms, setBedrooms] = useState<number | null>(initialFilters.bedrooms || null);
  const [bathrooms, setBathrooms] = useState<number | null>(initialFilters.bathrooms || null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // Get dynamic price range from database
  const { priceRange: dbPriceRange, loading: priceLoading } = usePriceRange(bookingType as 'daily' | 'monthly');

  // Update price range when db data loads or booking type changes
  useEffect(() => {
    if (!priceLoading && dbPriceRange && dbPriceRange.min > 0) {
      // Only reset if no initial price range or booking type changed
      if (!initialFilters.priceRange || initialFilters.bookingType !== bookingType) {
        setPriceRange([dbPriceRange.min, dbPriceRange.max]);
      } else {
        setPriceRange(initialFilters.priceRange);
      }
    }
  }, [dbPriceRange, priceLoading, bookingType]);

  // Initialize price range from initial filters if available
  useEffect(() => {
    if (initialFilters.priceRange) {
      setPriceRange(initialFilters.priceRange);
    }
  }, [initialFilters.priceRange]);

  const bookingTypes = [
    { id: 'daily', label: 'Daily', icon: Calendar, description: 'Short-term stays' },
    { id: 'monthly', label: 'Monthly', icon: Home, description: 'Long-term rentals' },
  ];

  const propertyTypes = [
    { id: 'apartment', label: 'Apartment', icon: Building },
    { id: 'house', label: 'House', icon: Home },
    { id: 'villa', label: 'Villa', icon: Castle },
    { id: 'studio', label: 'Studio', icon: Building2 },
    { id: 'cabin', label: 'Cabin', icon: TreePine },
    { id: 'loft', label: 'Loft', icon: Warehouse },
  ];

  const togglePropertyType = useCallback((type: string) => {
    setSelectedPropertyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  const toggleAmenity = useCallback((amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  }, []);

  const handlePriceChange = useCallback((values: number[]) => {
    setPriceRange([values[0], values[1]]);
  }, []);

  const handleApply = useCallback(() => {
    const filters: Partial<AdvancedFilters> = {
      bookingType: bookingType !== 'daily' ? bookingType : null,
      priceRange: dbPriceRange && (priceRange[0] !== dbPriceRange.min || priceRange[1] !== dbPriceRange.max) ? priceRange : null,
      propertyTypes: selectedPropertyTypes.length > 0 ? selectedPropertyTypes : null,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : null,
      bedrooms,
      bathrooms,
    };

    onApply(filters);
    onClose();
  }, [bookingType, priceRange, selectedPropertyTypes, selectedAmenities, bedrooms, bathrooms, dbPriceRange, onApply, onClose]);

  const handleReset = useCallback(() => {
    setBookingType('daily');
    setSelectedPropertyTypes([]);
    setSelectedAmenities([]);
    setBedrooms(null);
    setBathrooms(null);
    if (dbPriceRange) {
      setPriceRange([dbPriceRange.min, dbPriceRange.max]);
    }
  }, [dbPriceRange]);

  const hasActiveFilters = useCallback(() => {
    if (!dbPriceRange) return false;
    
    return (
      bookingType !== 'daily' ||
      selectedPropertyTypes.length > 0 ||
      selectedAmenities.length > 0 ||
      bedrooms !== null ||
      bathrooms !== null ||
      priceRange[0] !== dbPriceRange.min ||
      priceRange[1] !== dbPriceRange.max
    );
  }, [bookingType, selectedPropertyTypes, selectedAmenities, bedrooms, bathrooms, priceRange, dbPriceRange]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <SlidersHorizontal className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Advanced Filters</h2>
                <p className="text-sm text-muted-foreground">Refine your search to find the perfect property</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full h-10 w-10 p-0 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-8">
              
              {/* Booking Type */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Booking Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {bookingTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      onClick={() => setBookingType(type.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        bookingType === type.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <type.icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm opacity-70">{type.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Price Range */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Price Range</h3>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </div>
                </div>
                {!priceLoading && dbPriceRange && (
                  <div className="px-3">
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceChange}
                      max={dbPriceRange.max}
                      min={dbPriceRange.min}
                      step={bookingType === 'monthly' ? 100 : 10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{formatPrice(dbPriceRange.min)}</span>
                      <span>{formatPrice(dbPriceRange.max)}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Property Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Property Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {propertyTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      onClick={() => togglePropertyType(type.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedPropertyTypes.includes(type.id)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                        {selectedPropertyTypes.includes(type.id) && (
                          <Check className="h-3 w-3 ml-auto" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    <h3 className="text-lg font-medium">Bedrooms</h3>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Button
                        key={num}
                        variant={bedrooms === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBedrooms(bedrooms === num ? null : num)}
                        className="h-10 w-10 p-0 rounded-full"
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4" />
                    <h3 className="text-lg font-medium">Bathrooms</h3>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <Button
                        key={num}
                        variant={bathrooms === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBathrooms(bathrooms === num ? null : num)}
                        className="h-10 w-10 p-0 rounded-full"
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Amenities */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {AMENITIES_LIST.map((amenity) => (
                    <motion.button
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedAmenities.includes(amenity.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2">
                        {amenity.icon && <amenity.icon className="h-4 w-4" />}
                        <span className="text-sm font-medium">{amenity.name}</span>
                        {selectedAmenities.includes(amenity.id) && (
                          <Check className="h-3 w-3 ml-auto" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-muted/50">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasActiveFilters()}
            >
              Reset All
            </Button>
            
            <div className="flex items-center gap-3">
              {hasActiveFilters() && (
                <Badge variant="secondary" className="px-3 py-1">
                  {[
                    bookingType !== 'daily' ? 1 : 0,
                    selectedPropertyTypes.length > 0 ? 1 : 0,
                    selectedAmenities.length > 0 ? 1 : 0,
                    bedrooms !== null ? 1 : 0,
                    bathrooms !== null ? 1 : 0,
                    dbPriceRange && (priceRange[0] !== dbPriceRange.min || priceRange[1] !== dbPriceRange.max) ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)} filters active
                </Badge>
              )}
              <Button onClick={handleApply} className="px-8">
                Apply Filters
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewAdvancedFilters;