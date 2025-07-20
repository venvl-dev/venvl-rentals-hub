import { useState, useCallback } from 'react';
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
  
  // Get price range for the current booking type
  const effectiveBookingType = (advancedFilters.bookingType || searchFilters.bookingType) as 'daily' | 'monthly';
  const { priceRange: dbPriceRange, loading: priceLoading } = usePriceRange(effectiveBookingType);

  // Update search filters
  const updateSearchFilters = useCallback((filters: Partial<SearchFilters>) => {
    setSearchFilters(prev => ({ ...prev, ...filters }));
  }, []);

  // Update advanced filters with price range sync
  const updateAdvancedFilters = useCallback((filters: Partial<AdvancedFilters>) => {
    setAdvancedFilters(prev => {
      const updated = { ...prev, ...filters };
      
      // If booking type changed, reset price range to new range
      if (filters.bookingType && filters.bookingType !== prev.bookingType) {
        updated.priceRange = null; // Will be set by useEffect when new price range loads
      }
      
      return updated;
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchFilters(DEFAULT_SEARCH_FILTERS);
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  }, []);

  // Clear advanced filters only
  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  }, []);

  // Get combined filters for property filtering
  const getCombinedFilters = useCallback((): CombinedFilters => {
    return {
      ...searchFilters,
      advancedFilters
    };
  }, [searchFilters, advancedFilters]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    const hasSearchFilters = searchFilters.location.trim() !== '' || 
                            searchFilters.guests > 1 ||
                            searchFilters.checkIn ||
                            searchFilters.checkOut;

    const hasAdvancedFilters = !priceLoading && dbPriceRange && (
      (advancedFilters.priceRange && 
       (advancedFilters.priceRange[0] > dbPriceRange.min || advancedFilters.priceRange[1] < dbPriceRange.max)) ||
      (advancedFilters.propertyTypes && advancedFilters.propertyTypes.length > 0) ||
      (advancedFilters.amenities && advancedFilters.amenities.length > 0) ||
      advancedFilters.bedrooms !== null ||
      advancedFilters.bathrooms !== null ||
      (advancedFilters.bookingType && advancedFilters.bookingType !== 'daily')
    );

    return hasSearchFilters || hasAdvancedFilters;
  }, [searchFilters, advancedFilters, priceLoading, dbPriceRange]);

  // Get active filter count for UI
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    
    if (searchFilters.location.trim() !== '') count++;
    if (searchFilters.guests > 1) count++;
    if (searchFilters.checkIn) count++;
    if (searchFilters.checkOut) count++;
    
    if (!priceLoading && dbPriceRange && advancedFilters.priceRange && 
        (advancedFilters.priceRange[0] > dbPriceRange.min || advancedFilters.priceRange[1] < dbPriceRange.max)) {
      count++;
    }
    if (advancedFilters.propertyTypes && advancedFilters.propertyTypes.length > 0) count++;
    if (advancedFilters.amenities && advancedFilters.amenities.length > 0) count++;
    if (advancedFilters.bedrooms !== null) count++;
    if (advancedFilters.bathrooms !== null) count++;
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
    
    // Actions
    updateSearchFilters,
    updateAdvancedFilters,
    clearAllFilters,
    clearAdvancedFilters,
    
    // Computed
    getCombinedFilters,
    hasActiveFilters,
    getActiveFilterCount,
  };
};