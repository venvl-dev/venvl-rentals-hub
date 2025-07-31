import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { usePriceRange } from './usePriceRange';

export interface SearchFilters {
  location: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  bookingType: 'daily' | 'monthly' | 'flexible';
  flexibleOption?: string;
  duration?: number;
}

export interface AdvancedFilters {
  priceRange?: [number, number] | null;
  propertyTypes?: string[] | null;
  amenities?: string[] | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  bookingType?: string | null;
}

export interface CombinedFilters extends SearchFilters {
  advancedFilters: AdvancedFilters;
}

const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  location: '',
  guests: 1,
  bookingType: 'daily',
};

const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  priceRange: null,
  propertyTypes: null,
  amenities: null,
  bedrooms: null,
  bathrooms: null,
  bookingType: null,
};

export const useFilterStore = () => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(DEFAULT_ADVANCED_FILTERS);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track previous booking type to detect changes
  const prevBookingTypeRef = useRef<string | null>(null);
  
  // Get price range for the current booking type
  const effectiveBookingType = useMemo(() => 
    (advancedFilters.bookingType || searchFilters.bookingType) as 'daily' | 'monthly',
    [advancedFilters.bookingType, searchFilters.bookingType]
  );
  
  const { priceRange: dbPriceRange, loading: priceLoading } = usePriceRange(effectiveBookingType);

  // Update search filters
  const updateSearchFilters = useCallback((filters: Partial<SearchFilters>) => {
    setSearchFilters(prev => ({ ...prev, ...filters }));
  }, []);

  // Update advanced filters with better price range handling
  const updateAdvancedFilters = useCallback((filters: Partial<AdvancedFilters>) => {
    setAdvancedFilters(prev => {
      const updated = { ...prev, ...filters };
      
      // If booking type changed, reset price range only if it's explicitly set
      if (filters.bookingType && filters.bookingType !== prev.bookingType) {
        // Don't reset price range here - let the effect handle it
        console.log('Booking type changed from', prev.bookingType, 'to', filters.bookingType);
      }
      
      return updated;
    });
  }, []);

  // Handle price range synchronization when booking type changes or data loads
  useEffect(() => {
    if (priceLoading || !dbPriceRange || dbPriceRange.min <= 0) {
      return;
    }

    const currentBookingType = effectiveBookingType;
    const hasBookingTypeChanged = prevBookingTypeRef.current && prevBookingTypeRef.current !== currentBookingType;
    
    // Auto-sync price range in these scenarios:
    // 1. Initial load (!isInitialized)
    // 2. Booking type changed and no custom price range set
    // 3. No price range is currently set
    if (!isInitialized || hasBookingTypeChanged || !advancedFilters.priceRange) {
      console.log('Syncing price range:', {
        isInitialized,
        hasBookingTypeChanged,
        currentBookingType,
        dbPriceRange: `${dbPriceRange.min} - ${dbPriceRange.max}`,
        currentPriceRange: advancedFilters.priceRange
      });

      setAdvancedFilters(prev => ({
        ...prev,
        priceRange: [dbPriceRange.min, dbPriceRange.max]
      }));
      
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }

    prevBookingTypeRef.current = currentBookingType;
  }, [dbPriceRange, priceLoading, effectiveBookingType, isInitialized, advancedFilters.priceRange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchFilters(DEFAULT_SEARCH_FILTERS);
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
    setIsInitialized(false);
    prevBookingTypeRef.current = null;
  }, []);

  // Clear advanced filters only
  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  }, []);

  // Manual sync for external triggers (now deprecated but kept for compatibility)
  const syncPriceRange = useCallback(() => {
    if (!priceLoading && dbPriceRange && dbPriceRange.min > 0) {
      setAdvancedFilters(prev => ({
        ...prev,
        priceRange: [dbPriceRange.min, dbPriceRange.max]
      }));
    }
  }, [priceLoading, dbPriceRange]);

  // Get combined filters for property filtering - memoized for performance
  const getCombinedFilters = useCallback((): CombinedFilters => {
    return {
      ...searchFilters,
      advancedFilters
    };
  }, [searchFilters, advancedFilters]);

  // Check if any filters are active - memoized for performance
  const hasActiveFilters = useMemo(() => {
    const hasSearchFilters = searchFilters.location.trim() !== '' || 
                            searchFilters.guests > 1 ||
                            !!searchFilters.checkIn ||
                            !!searchFilters.checkOut;

    if (!dbPriceRange || priceLoading) {
      return hasSearchFilters;
    }

    const hasAdvancedFilters = (
      (advancedFilters.priceRange && 
       Array.isArray(advancedFilters.priceRange) &&
       (advancedFilters.priceRange[0] > dbPriceRange.min || advancedFilters.priceRange[1] < dbPriceRange.max)) ||
      (advancedFilters.propertyTypes && Array.isArray(advancedFilters.propertyTypes) && advancedFilters.propertyTypes.length > 0) ||
      (advancedFilters.amenities && Array.isArray(advancedFilters.amenities) && advancedFilters.amenities.length > 0) ||
      (advancedFilters.bedrooms !== null && typeof advancedFilters.bedrooms === 'number') ||
      (advancedFilters.bathrooms !== null && typeof advancedFilters.bathrooms === 'number') ||
      (advancedFilters.bookingType && advancedFilters.bookingType !== 'daily')
    );

    return hasSearchFilters || hasAdvancedFilters;
  }, [searchFilters, advancedFilters, priceLoading, dbPriceRange]);

  // Get active filter count for UI - memoized for performance
  const getActiveFilterCount = useMemo(() => {
    let count = 0;
    
    if (searchFilters.location.trim() !== '') count++;
    if (searchFilters.guests > 1) count++;
    if (searchFilters.checkIn) count++;
    if (searchFilters.checkOut) count++;
    
    if (!priceLoading && dbPriceRange && advancedFilters.priceRange && 
        Array.isArray(advancedFilters.priceRange) &&
        (advancedFilters.priceRange[0] > dbPriceRange.min || advancedFilters.priceRange[1] < dbPriceRange.max)) {
      count++;
    }
    if (advancedFilters.propertyTypes && Array.isArray(advancedFilters.propertyTypes) && advancedFilters.propertyTypes.length > 0) count++;
    if (advancedFilters.amenities && Array.isArray(advancedFilters.amenities) && advancedFilters.amenities.length > 0) count++;
    if (advancedFilters.bedrooms !== null && typeof advancedFilters.bedrooms === 'number') count++;
    if (advancedFilters.bathrooms !== null && typeof advancedFilters.bathrooms === 'number') count++;
    if (advancedFilters.bookingType && advancedFilters.bookingType !== 'daily') count++;
    
    return count;
  }, [searchFilters, advancedFilters, priceLoading, dbPriceRange]);

  return {
    // State
    searchFilters,
    advancedFilters,
    dbPriceRange,
    priceLoading,
    effectiveBookingType,
    isInitialized,
    
    // Actions
    updateSearchFilters,
    updateAdvancedFilters,
    clearAllFilters,
    clearAdvancedFilters,
    syncPriceRange, // Kept for backward compatibility
    
    // Computed
    getCombinedFilters,
    hasActiveFilters,
    getActiveFilterCount,
  };
};