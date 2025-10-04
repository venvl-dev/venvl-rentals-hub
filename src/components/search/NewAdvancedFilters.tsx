import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  SlidersHorizontal,
  Calendar,
  Home,
  Building,
  Building2,
  Castle,
  TreePine,
  Warehouse,
  Bed,
  Bath,
  Check,
} from 'lucide-react';
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

const NewAdvancedFilters = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}: NewAdvancedFiltersProps) => {
  // Local state for all filters
  const [bookingType, setBookingType] = useState<string>(
    initialFilters.bookingType || 'flexible',
  );
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(
    initialFilters.propertyTypes || [],
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialFilters.amenities || [],
  );
  const [bedrooms, setBedrooms] = useState<number | null>(
    initialFilters.bedrooms || null,
  );
  const [bathrooms, setBathrooms] = useState<number | null>(
    initialFilters.bathrooms || null,
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [isPriceRangeCustomized, setIsPriceRangeCustomized] = useState(false);

  // Get dynamic price range from database
  const { priceRange: dbPriceRange, loading: priceLoading } = usePriceRange(
    bookingType as 'daily' | 'monthly',
  );

  // Initialize local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBookingType(initialFilters.bookingType || 'flexible');
      setSelectedPropertyTypes(initialFilters.propertyTypes || []);
      setSelectedAmenities(initialFilters.amenities || []);
      setBedrooms(initialFilters.bedrooms || null);
      setBathrooms(initialFilters.bathrooms || null);

      // Handle price range initialization
      if (initialFilters.priceRange) {
        setPriceRange(initialFilters.priceRange);
        setIsPriceRangeCustomized(true);
      } else {
        setIsPriceRangeCustomized(false);
      }
    }
  }, [isOpen, initialFilters]);

  // Update price range when db data loads or booking type changes
  useEffect(() => {
    console.log('🔍 AdvancedFilters price range effect:', {
      priceLoading,
      dbPriceRange,
      bookingType,
      isPriceRangeCustomized,
      initialBookingType: initialFilters.bookingType
    });

    if (!priceLoading && dbPriceRange && dbPriceRange.min > 0) {
      // Always use database range when booking type changes, regardless of customization
      const shouldUpdate = !isPriceRangeCustomized || initialFilters.bookingType !== bookingType;

      console.log('🔍 Should update price range:', shouldUpdate);
      console.log('🔍 New price range from DB:', dbPriceRange);
      console.log('🔍 Booking type change detected:', initialFilters.bookingType, '→', bookingType);

      if (shouldUpdate) {
        console.log('✅ Auto-updating price range for booking type:', bookingType, dbPriceRange);
        setPriceRange([dbPriceRange.min, dbPriceRange.max]);

        // Always reset customization flag when booking type changes to ensure we use DB range
        if (initialFilters.bookingType !== bookingType) {
          console.log('🔄 Resetting price customization flag due to booking type change');
          setIsPriceRangeCustomized(false);
        }
      }
    }
  }, [
    dbPriceRange,
    priceLoading,
    bookingType,
    isPriceRangeCustomized,
    initialFilters.bookingType,
  ]);

  const bookingTypes = [
    {
      id: 'daily',
      label: 'Daily',
      icon: Calendar,
      description: 'Short-term stays',
    },
    {
      id: 'monthly',
      label: 'Monthly',
      icon: Home,
      description: 'Long-term rentals',
    },
    {
      id: 'flexible',
      label: 'Flexible',
      icon: SlidersHorizontal,
      description: 'Best available deals',
    },
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
    setSelectedPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  const toggleAmenity = useCallback((amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  }, []);

  const handlePriceChange = useCallback((values: number[]) => {
    setPriceRange([values[0], values[1]]);
    setIsPriceRangeCustomized(true);
  }, []);

  const handleBookingTypeChange = useCallback((newBookingType: string) => {
    console.log('🎯 Booking type changing from', bookingType, 'to', newBookingType);
    setBookingType(newBookingType);
    // Reset price customization when booking type changes
    setIsPriceRangeCustomized(false);

    // Force immediate price range reset to trigger re-fetch
    // The useEffect will handle setting the correct range once new data loads
    if (newBookingType !== bookingType) {
      console.log('🔄 Forcing price range reset for booking type change');
      // Set appropriate temporary ranges based on booking type
      const tempRange = newBookingType === 'monthly' ? [6000, 700000] : [100, 3000];
      setPriceRange(tempRange); // Temporary values, will be updated by useEffect with actual DB data
    }
  }, [bookingType]);

  // Helper function to check if user has made selections beyond just booking type
  const hasOtherActiveFilters = useCallback(() => {
    return (
      selectedPropertyTypes.length > 0 ||
      selectedAmenities.length > 0 ||
      bedrooms !== null ||
      bathrooms !== null ||
      isPriceRangeCustomized
    );
  }, [
    selectedPropertyTypes,
    selectedAmenities,
    bedrooms,
    bathrooms,
    isPriceRangeCustomized,
  ]);

  const handleApply = useCallback(() => {
    const filters: Partial<AdvancedFilters> = {
      // Only apply booking type if user has made explicit selections beyond just changing the type
      bookingType:
        bookingType !== 'flexible' && hasOtherActiveFilters() ? bookingType : null,
      priceRange: isPriceRangeCustomized ? priceRange : null,
      propertyTypes:
        selectedPropertyTypes.length > 0 ? selectedPropertyTypes : null,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : null,
      bedrooms,
      bathrooms,
    };

    console.log('Applying filters:', filters);
    onApply(filters);
    onClose();
  }, [
    bookingType,
    priceRange,
    selectedPropertyTypes,
    selectedAmenities,
    bedrooms,
    bathrooms,
    isPriceRangeCustomized,
    onApply,
    onClose,
    hasOtherActiveFilters,
  ]);

  const handleReset = useCallback(() => {
    setBookingType('flexible');
    setSelectedPropertyTypes([]);
    setSelectedAmenities([]);
    setBedrooms(null);
    setBathrooms(null);
    setIsPriceRangeCustomized(false);
    if (dbPriceRange) {
      setPriceRange([dbPriceRange.min, dbPriceRange.max]);
    }
  }, [dbPriceRange]);

  // Memoized active filters check for better performance
  const hasActiveFilters = useMemo(() => {
    const hasOtherFilters =
      selectedPropertyTypes.length > 0 ||
      selectedAmenities.length > 0 ||
      bedrooms !== null ||
      bathrooms !== null ||
      isPriceRangeCustomized;

    // Only consider booking type as active if there are other filters too
    return hasOtherFilters || (bookingType !== 'flexible' && hasOtherFilters);
  }, [
    bookingType,
    selectedPropertyTypes,
    selectedAmenities,
    bedrooms,
    bathrooms,
    isPriceRangeCustomized,
  ]);

  // Memoized price formatter
  const formatPrice = useMemo(
    () => (price: number) => {
      return new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
      }).format(price);
    },
    [],
  );

  // Early return if not open
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4'
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className='bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col'
        >
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b bg-muted/50 flex-shrink-0'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-primary rounded-lg'>
                <SlidersHorizontal className='h-5 w-5 text-primary-foreground' />
              </div>
              <div>
                <h2 className='text-xl font-semibold'>Advanced Filters</h2>
                <p className='text-sm text-muted-foreground'>
                  Refine your search to find the perfect property
                </p>
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='rounded-full h-10 w-10 p-0 hover:bg-muted'
            >
              <X className='h-5 w-5' />
            </Button>
          </div>

          {/* Content */}
          <div className='overflow-y-auto flex-1'>
            <div className='p-6 space-y-8'>
              {/* Booking Type */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Booking Type</h3>
                <div className='grid grid-cols-3 gap-3'>
                  {bookingTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      onClick={() => handleBookingTypeChange(type.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        bookingType === type.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className='flex items-center gap-3'>
                        <type.icon className='h-5 w-5' />
                        <div>
                          <div className='font-medium'>{type.label}</div>
                          <div className='text-sm opacity-70'>
                            {type.description}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Price Range */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-medium'>Price Range</h3>
                  <div className='text-sm text-muted-foreground'>
                    {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </div>
                </div>
                {!priceLoading && dbPriceRange && (
                  <div className='px-3'>
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceChange}
                      max={dbPriceRange.max}
                      min={dbPriceRange.min}
                      step={bookingType === 'monthly' ? 100 : 10}
                      className='w-full'
                    />
                    <div className='flex justify-between text-xs text-muted-foreground mt-2'>
                      <span>{formatPrice(dbPriceRange.min)}</span>
                      <span>{formatPrice(dbPriceRange.max)}</span>
                    </div>
                    {isPriceRangeCustomized && (
                      <div className='text-xs text-primary mt-1 text-center'>
                        Custom range selected
                      </div>
                    )}
                  </div>
                )}
                {priceLoading && (
                  <div className='px-3 py-4 text-center text-sm text-muted-foreground'>
                    Loading price range for {bookingType} bookings...
                  </div>
                )}
              </div>

              <Separator />

              {/* Property Types */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Property Type</h3>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
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
                      <div className='flex items-center gap-2'>
                        <type.icon className='h-4 w-4' />
                        <span className='text-sm font-medium'>
                          {type.label}
                        </span>
                        {selectedPropertyTypes.includes(type.id) && (
                          <Check className='h-3 w-3 ml-auto' />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Bedrooms & Bathrooms */}
              <div className='grid grid-cols-2 gap-8'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <Bed className='h-4 w-4' />
                    <h3 className='text-lg font-medium'>Bedrooms</h3>
                  </div>
                  <div className='flex gap-2'>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Button
                        key={num}
                        variant={bedrooms === num ? 'default' : 'outline'}
                        size='sm'
                        onClick={() =>
                          setBedrooms(bedrooms === num ? null : num)
                        }
                        className='h-10 w-10 p-0 rounded-full'
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <Bath className='h-4 w-4' />
                    <h3 className='text-lg font-medium'>Bathrooms</h3>
                  </div>
                  <div className='flex gap-2'>
                    {[1, 2, 3, 4].map((num) => (
                      <Button
                        key={num}
                        variant={bathrooms === num ? 'default' : 'outline'}
                        size='sm'
                        onClick={() =>
                          setBathrooms(bathrooms === num ? null : num)
                        }
                        className='h-10 w-10 p-0 rounded-full'
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Amenities */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Amenities</h3>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto'>
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
                      <div className='flex items-center gap-2'>
                        {amenity.icon && <amenity.icon className='h-4 w-4' />}
                        <span className='text-sm font-medium'>
                          {amenity.name}
                        </span>
                        {selectedAmenities.includes(amenity.id) && (
                          <Check className='h-3 w-3 ml-auto' />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-between p-6 border-t bg-background shadow-lg flex-shrink-0'>
            <Button
              variant='outline'
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className='hover:bg-destructive/10 hover:text-destructive hover:border-destructive font-medium'
            >
              Reset All
            </Button>

            <div className='flex items-center gap-4'>
              {hasActiveFilters && (
                <Badge
                  variant='secondary'
                  className='px-3 py-1 text-sm font-medium'
                >
                  {[
                    selectedPropertyTypes.length > 0 ? 1 : 0,
                    selectedAmenities.length > 0 ? 1 : 0,
                    bedrooms !== null ? 1 : 0,
                    bathrooms !== null ? 1 : 0,
                    isPriceRangeCustomized ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}{' '}
                  filters active
                </Badge>
              )}
              <Button
                onClick={handleApply}
                size='lg'
                className='px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[140px]'
              >
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
