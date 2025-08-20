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
  location: '', // Clear location filter by default
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
    console.log('useFilterStore - updateSearchFilters called with:', filters);
    setSearchFilters(prev => {
      let updated = { ...prev, ...filters };
      
      // Clear incompatible fields when booking type changes
      if (filters.bookingType && filters.bookingType !== prev.bookingType) {
        if (filters.bookingType === 'monthly') {
          // Monthly bookings don't use checkIn/checkOut dates
          updated = {
            ...updated,
            checkIn: undefined,
            checkOut: undefined,
            flexibleOption: undefined
          };
        } else if (filters.bookingType === 'daily') {
          // Daily bookings don't use duration
          updated = {
            ...updated,
            duration: undefined,
            flexibleOption: undefined
          };
        } else if (filters.bookingType === 'flexible') {
          // Flexible bookings might clear specific date constraints
          updated = {
            ...updated,
            checkIn: undefined,
            checkOut: undefined,
            duration: undefined
          };
        }
      }
      
      console.log('useFilterStore - searchFilters updated to:', updated);
      return updated;
    });
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
  // IMPORTANT: Do NOT auto-apply price filter on booking type change.
  // We only initialize priceRange once on first load so the UI can display the range,
  // but we avoid setting it again automatically to prevent implicit filtering.
  useEffect(() => {
    if (priceLoading || !dbPriceRange || dbPriceRange.min <= 0) {
      return;
    }

    const currentBookingType = effectiveBookingType;
    const hasBookingTypeChanged =
      prevBookingTypeRef.current && prevBookingTypeRef.current !== currentBookingType;

    // Initialize on first successful load only, so UI can read/display the range.
    if (!isInitialized) {
      console.log('Initializing price range (display only):', {
        dbPriceRange: `${dbPriceRange.min} - ${dbPriceRange.max}`,
      });

      setAdvancedFilters(prev => ({
        ...prev,
        // Initialize to full range once. UI may read it, but hasActiveFilters logic
        // ensures it is not considered an active filter unless user changes it.
        priceRange: [dbPriceRange.min, dbPriceRange.max],
      }));
      setIsInitialized(true);
    } else if (hasBookingTypeChanged) {
      // When booking type changes, update only the display range if no user override,
      // but do NOT mark this as an active filter (full-range mirrors db range).
      console.log('Booking type changed, syncing display range without activating filter:', {
        from: prevBookingTypeRef.current,
        to: currentBookingType,
        dbPriceRange: `${dbPriceRange.min} - ${dbPriceRange.max}`,
        currentPriceRange: advancedFilters.priceRange,
      });

      // Only reset to full db range if user has not narrowed it previously.
      const userHasCustomRange =
        !!advancedFilters.priceRange &&
        Array.isArray(advancedFilters.priceRange) &&
        (advancedFilters.priceRange[0] > dbPriceRange.min ||
          advancedFilters.priceRange[1] < dbPriceRange.max);

      if (!userHasCustomRange) {
        setAdvancedFilters(prev => ({
          ...prev,
          priceRange: [dbPriceRange.min, dbPriceRange.max],
        }));
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
    
    // Only count booking type if there are other active filters too
    const hasOtherFilters = count > 0;
    if (advancedFilters.bookingType && advancedFilters.bookingType !== 'daily' && hasOtherFilters) count++;
    
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
