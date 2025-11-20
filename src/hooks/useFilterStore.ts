import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePriceRange } from './usePriceRange';

/**
 * Detects device type from user agent string
 */
const detectDeviceType = (
  userAgent: string,
): 'mobile' | 'desktop' | 'tablet' => {
  const ua = userAgent.toLowerCase();
  if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

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
  location: '', // No location filter by default
  guests: 1,
  bookingType: 'flexible', // Show flexible properties by default
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
  const { user } = useAuth();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(
    DEFAULT_SEARCH_FILTERS,
  );
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(
    DEFAULT_ADVANCED_FILTERS,
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Track previous booking type to detect changes
  const prevBookingTypeRef = useRef<string | null>(null);

  // Search event tracking refs
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackedFiltersRef = useRef<string | null>(null);
  const trackSearchEventRef = useRef<(() => void) | null>(null);

  // Search event tracking mutation
  const searchMutation = useMutation({
    mutationFn: async (payload: {
      location?: string;
      check_in?: string;
      check_out?: string;
      guests?: number;
      price_min?: number;
      price_max?: number;
      results_count?: number;
    }) => {
      if (!user?.id) {
        console.log('Skipping search tracking - user not authenticated');
        return null;
      }

      const userAgent = navigator.userAgent;
      const deviceType = detectDeviceType(userAgent);

      const { data, error } = await supabase
        .from('guest_events')
        .insert({
          user_id: user.id,
          type: 'search',
          payload: payload,
          user_agent: userAgent,
          device_type: deviceType,
          ts: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error tracking search event:', error);
        throw error;
      }

      console.log('Search event tracked successfully:', data);
      return data;
    },
    onError: (error) => {
      console.error('Failed to track search event:', error);
    },
  });

  // Get price range for the current booking type
  const effectiveBookingType = useMemo(
    () =>
      (advancedFilters.bookingType || searchFilters.bookingType) as
        | 'daily'
        | 'monthly',
    [advancedFilters.bookingType, searchFilters.bookingType],
  );

  const { priceRange: dbPriceRange, loading: priceLoading } =
    usePriceRange(effectiveBookingType);

  // Update search filters
  const updateSearchFilters = useCallback((filters: Partial<SearchFilters>) => {
    setSearchFilters((prev) => {
      let updated = { ...prev, ...filters };

      // Clear incompatible fields when booking type changes
      if (filters.bookingType && filters.bookingType !== prev.bookingType) {
        if (filters.bookingType === 'monthly') {
          // Monthly bookings don't use checkIn/checkOut dates
          updated = {
            ...updated,
            checkIn: undefined,
            checkOut: undefined,
            flexibleOption: undefined,
          };
        } else if (filters.bookingType === 'daily') {
          // Daily bookings don't use duration
          updated = {
            ...updated,
            duration: undefined,
            flexibleOption: undefined,
          };
        } else if (filters.bookingType === 'flexible') {
          // Flexible bookings might clear specific date constraints
          updated = {
            ...updated,
            checkIn: undefined,
            checkOut: undefined,
            duration: undefined,
          };
        }
      }

      return updated;
    });
  }, []);

  // Update advanced filters with better price range handling
  const updateAdvancedFilters = useCallback(
    (filters: Partial<AdvancedFilters>) => {
      setAdvancedFilters((prev) => {
        const updated = { ...prev, ...filters };

        // If booking type changed, reset price range only if it's explicitly set
        if (filters.bookingType && filters.bookingType !== prev.bookingType) {
          // Don't reset price range here - let the effect handle it
        }

        return updated;
      });
    },
    [],
  );

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
      prevBookingTypeRef.current &&
      prevBookingTypeRef.current !== currentBookingType;

    // Initialize on first successful load only, so UI can read/display the range.
    if (!isInitialized) {
      // Don't automatically set priceRange in advancedFilters - keep it null
      // This ensures price filtering only happens when user explicitly applies it
      setIsInitialized(true);
    } else if (hasBookingTypeChanged) {
      // When booking type changes, update only the display range if no user override,
      // but do NOT mark this as an active filter (full-range mirrors db range).
      // Don't automatically set priceRange when booking type changes
      // This ensures price filtering only happens when user explicitly applies it via Apply button
    }

    prevBookingTypeRef.current = currentBookingType;
  }, [
    dbPriceRange,
    priceLoading,
    effectiveBookingType,
    isInitialized,
    advancedFilters.priceRange,
  ]);

  // Helper function to track search event
  const trackSearchEvent = useCallback(() => {
    if (!user?.id) {
      return;
    }

    // Build search payload
    const payload: {
      location?: string;
      check_in?: string;
      check_out?: string;
      guests?: number;
      price_min?: number;
      price_max?: number;
      results_count?: number;
    } = {};

    if (searchFilters.location.trim()) {
      payload.location = searchFilters.location.trim();
    }
    if (searchFilters.checkIn) {
      payload.check_in = searchFilters.checkIn.toISOString();
    }
    if (searchFilters.checkOut) {
      payload.check_out = searchFilters.checkOut.toISOString();
    }
    if (searchFilters.guests > 1) {
      payload.guests = searchFilters.guests;
    }
    if (
      advancedFilters.priceRange &&
      Array.isArray(advancedFilters.priceRange)
    ) {
      payload.price_min = advancedFilters.priceRange[0];
      payload.price_max = advancedFilters.priceRange[1];
    }

    // Create a fingerprint of current filters to avoid duplicate tracking
    const currentFingerprint = JSON.stringify({
      searchFilters,
      advancedFilters,
    });

    // Skip if same as last tracked
    if (lastTrackedFiltersRef.current === currentFingerprint) {
      return;
    }

    // Track the event asynchronously (don't await)
    searchMutation.mutate(payload);
    lastTrackedFiltersRef.current = currentFingerprint;
  }, [user?.id, searchFilters, advancedFilters, searchMutation]);

  // Store latest tracking function in ref for unmount access
  trackSearchEventRef.current = trackSearchEvent;

  // Debounced search tracking effect (30 seconds)
  useEffect(() => {
    // Skip if user not authenticated
    if (!user?.id) {
      return;
    }

    // Check if filters are non-default
    const hasSearchFilters =
      searchFilters.location.trim() !== '' ||
      searchFilters.guests > 1 ||
      !!searchFilters.checkIn ||
      !!searchFilters.checkOut;

    const hasAdvancedFiltersSet =
      (advancedFilters.priceRange &&
        Array.isArray(advancedFilters.priceRange)) ||
      (advancedFilters.propertyTypes &&
        advancedFilters.propertyTypes.length > 0) ||
      (advancedFilters.amenities && advancedFilters.amenities.length > 0) ||
      advancedFilters.bedrooms !== null ||
      advancedFilters.bathrooms !== null ||
      (advancedFilters.bookingType &&
        advancedFilters.bookingType !== 'flexible');

    const hasNonDefaultFilters = hasSearchFilters || hasAdvancedFiltersSet;

    // Clear existing timer
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = null;
    }

    // Only set timer if filters are non-default
    if (hasNonDefaultFilters) {
      searchDebounceTimerRef.current = setTimeout(() => {
        trackSearchEvent();
      }, 30000); // 30 seconds
    }
  }, [user?.id, searchFilters, advancedFilters, trackSearchEvent]);

  // Separate effect for component unmount only
  useEffect(() => {
    return () => {
      // This cleanup ONLY runs on component unmount (not on re-renders)
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }

      // Send final search event using the ref
      trackSearchEventRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = only runs on mount/unmount

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchFilters(DEFAULT_SEARCH_FILTERS);
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
    setIsInitialized(false);
    prevBookingTypeRef.current = null;
    lastTrackedFiltersRef.current = null; // Reset tracking state
  }, []);

  // Clear advanced filters only
  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  }, []);

  // Manual sync for external triggers (deprecated - price range only set via Apply button)
  const syncPriceRange = useCallback(() => {}, []);

  // Get combined filters for property filtering - memoized for performance
  const getCombinedFilters = useCallback((): CombinedFilters => {
    const combined = {
      ...searchFilters,
      advancedFilters,
    };
    console.log('📋 getCombinedFilters called:', {
      advancedFilters,
      priceRange: advancedFilters.priceRange,
      combined,
    });
    return combined;
  }, [searchFilters, advancedFilters]);

  // Check if any filters are active - memoized for performance
  const hasActiveFilters = useMemo(() => {
    const hasSearchFilters =
      searchFilters.location.trim() !== '' ||
      searchFilters.guests > 1 ||
      !!searchFilters.checkIn ||
      !!searchFilters.checkOut;

    if (!dbPriceRange || priceLoading) {
      return hasSearchFilters;
    }

    const hasAdvancedFilters =
      (advancedFilters.priceRange &&
        Array.isArray(advancedFilters.priceRange) &&
        (advancedFilters.priceRange[0] > dbPriceRange.min ||
          advancedFilters.priceRange[1] < dbPriceRange.max)) ||
      (advancedFilters.propertyTypes &&
        Array.isArray(advancedFilters.propertyTypes) &&
        advancedFilters.propertyTypes.length > 0) ||
      (advancedFilters.amenities &&
        Array.isArray(advancedFilters.amenities) &&
        advancedFilters.amenities.length > 0) ||
      (advancedFilters.bedrooms !== null &&
        typeof advancedFilters.bedrooms === 'number') ||
      (advancedFilters.bathrooms !== null &&
        typeof advancedFilters.bathrooms === 'number') ||
      (advancedFilters.bookingType &&
        advancedFilters.bookingType !== 'flexible');

    return hasSearchFilters || hasAdvancedFilters;
  }, [searchFilters, advancedFilters, priceLoading, dbPriceRange]);

  // Get active filter count for UI - memoized for performance
  const getActiveFilterCount = useMemo(() => {
    let count = 0;

    if (searchFilters.location.trim() !== '') count++;
    if (searchFilters.guests > 1) count++;
    if (searchFilters.checkIn) count++;
    if (searchFilters.checkOut) count++;

    if (
      !priceLoading &&
      dbPriceRange &&
      advancedFilters.priceRange &&
      Array.isArray(advancedFilters.priceRange) &&
      (advancedFilters.priceRange[0] > dbPriceRange.min ||
        advancedFilters.priceRange[1] < dbPriceRange.max)
    ) {
      count++;
    }
    if (
      advancedFilters.propertyTypes &&
      Array.isArray(advancedFilters.propertyTypes) &&
      advancedFilters.propertyTypes.length > 0
    )
      count++;
    if (
      advancedFilters.amenities &&
      Array.isArray(advancedFilters.amenities) &&
      advancedFilters.amenities.length > 0
    )
      count++;
    if (
      advancedFilters.bedrooms !== null &&
      typeof advancedFilters.bedrooms === 'number'
    )
      count++;
    if (
      advancedFilters.bathrooms !== null &&
      typeof advancedFilters.bathrooms === 'number'
    )
      count++;

    // Only count booking type if there are other active filters too
    const hasOtherFilters = count > 0;
    if (
      advancedFilters.bookingType &&
      advancedFilters.bookingType !== 'flexible' &&
      hasOtherFilters
    )
      count++;

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
