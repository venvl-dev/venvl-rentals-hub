import { useMemo, useCallback } from 'react';
import {
  supportsBookingType,
  matchesSearchCriteria,
  type BookingType,
  type PropertyRentalData,
} from '@/lib/rentalTypeUtils';
import { CombinedFilters } from './useFilterStore';
import { usePriceRange } from './usePriceRange';

interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  monthly_price?: number;
  daily_price?: number;
  images: string[];
  city: string;
  state: string;
  country: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  booking_types?: string[];
  rental_type?: string;
  min_nights?: number;
  min_months?: number;
  is_active: boolean;
  approval_status?: string;
  created_at: string;
  updated_at: string;
  blocked_dates?: string[];
}

export const usePropertyFiltering = (
  properties: Property[],
  filters: CombinedFilters,
) => {
  // Get price range for the current booking type (use main booking type selector)
  const mainBookingType = filters.bookingType;

  // Map flexible booking type to daily for price range calculation
  const priceRangeBookingType = mainBookingType === 'flexible' ? 'daily' : mainBookingType;
  const { priceRange: dbPriceRange } = usePriceRange(priceRangeBookingType as 'daily' | 'monthly');

  // Memoize the filtering logic for better performance
  const filteredProperties = useMemo(() => {
    if (!properties || properties.length === 0) {
      return [];
    }

    let filtered = [...properties];
    const { advancedFilters } = filters;

    // Location filter
    if (filters.location && filters.location.trim() !== '') {
      const searchTerm = filters.location.toLowerCase();
      filtered = filtered.filter((property) => {
        const searchFields = [
          property.city,
          property.state,
          property.country,
          property.title,
        ]
          .filter(Boolean)
          .map((field) => field?.toLowerCase());

        // Extract search words and check for matches
        const searchWords = searchTerm
          .split(/[,\s]+/)
          .filter((word) => word.trim().length > 1);

        // Check if any search word matches any field
        return searchWords.some((searchWord) => {
          const cleanSearchWord = searchWord.trim().toLowerCase();
          return searchFields.some((field) => {
            if (!field) return false;
            const fieldLower = field.toLowerCase();
            return (
              fieldLower.includes(cleanSearchWord) ||
              cleanSearchWord.includes(fieldLower) ||
              cleanSearchWord.startsWith(fieldLower.substring(0, 3))
            );
          });
        });
      });
    }

    // Guest capacity filter
    if (filters.guests > 1) {
      filtered = filtered.filter(
        (property) => property.max_guests >= filters.guests,
      );
    }

    // Booking type filter: Show properties based on selected booking type
    const activeBookingType = filters.bookingType;

    // Optimized booking type filter
    if (activeBookingType && activeBookingType !== 'flexible') {
      if (activeBookingType === 'monthly') {
        filtered = filtered.filter((p) => p.rental_type === 'monthly' || p.rental_type === 'both');
      } else if (activeBookingType === 'daily') {
        filtered = filtered.filter((p) => p.rental_type === 'daily' || p.rental_type === 'both');
      }
    }

    // Price range filter - Apply when price range is explicitly set in advanced filters
    const shouldApplyPriceFilter =
      advancedFilters.priceRange &&
      Array.isArray(advancedFilters.priceRange) &&
      advancedFilters.priceRange.length === 2 &&
      dbPriceRange &&
      dbPriceRange.min >= 0 &&
      dbPriceRange.max > 0;

    console.log('🔍 Price filter validation:', {
      hasPriceRange: !!advancedFilters.priceRange,
      isArray: Array.isArray(advancedFilters.priceRange),
      hasLength: advancedFilters.priceRange?.length === 2,
      hasDbPriceRange: !!dbPriceRange,
      dbPriceRangeMin: dbPriceRange?.min,
      shouldApply: shouldApplyPriceFilter
    });


    if (shouldApplyPriceFilter) {
      const [minPrice, maxPrice] = advancedFilters.priceRange;
      const beforeCount = filtered.length;

      console.log(`🎯 Applying price filter: ${minPrice} - ${maxPrice} for ${activeBookingType} booking type`);
    console.log('🔍 Filter check details:', {
      shouldApplyPriceFilter,
      priceRange: advancedFilters.priceRange,
      dbPriceRange,
      mainBookingType,
      totalProperties: properties?.length || 0,
      isMobile: typeof window !== 'undefined' && (window.innerWidth <= 768 || 'ontouchstart' in window)
    });

      filtered = filtered.filter((property) => {
        // For flexible booking type, we need to check if ANY of the property's prices
        // fall within the selected range (which may include both daily and monthly scales)
        if (activeBookingType === 'flexible') {
          const propertyPrices = [];

          // Add daily/per-night prices
          if (property.price_per_night && property.price_per_night > 0) {
            propertyPrices.push(property.price_per_night);
          }
          if (property.daily_price && property.daily_price > 0) {
            propertyPrices.push(property.daily_price);
          }

          // Add monthly prices (as-is to match range calculation)
          if (property.monthly_price && property.monthly_price > 0) {
            propertyPrices.push(property.monthly_price);
          }

          // Add converted monthly to daily equivalent
          if (property.monthly_price && property.monthly_price > 0) {
            const dailyEquivalent = Math.round(property.monthly_price / 30);
            if (dailyEquivalent > 0) {
              propertyPrices.push(dailyEquivalent);
            }
          }

          // Check if ANY of the property's prices fall within the selected range
          const matches = propertyPrices.some(price =>
            price >= minPrice && price <= maxPrice
          );

          if (matches) {
            console.log(`✅ Property ${property.id} matched with prices:`, propertyPrices.filter(p => p >= minPrice && p <= maxPrice));
          } else {
            // Show first few failed matches to understand the issue
            if (Math.random() < 0.1) { // Only log 10% to avoid spam
              console.log(`❌ Property ${property.id} failed with prices:`, propertyPrices, 'Range:', [minPrice, maxPrice]);
            }
          }

          return matches;
        } else {
          // Original logic for daily/monthly specific booking types
          let price = property.price_per_night;

          if (activeBookingType === 'daily') {
            price = property.daily_price || property.price_per_night;
          } else if (activeBookingType === 'monthly') {
            if (property.monthly_price && property.monthly_price > 0) {
              price = property.monthly_price;
            } else if (property.rental_type === 'monthly' || property.rental_type === 'both') {
              const dailyPrice = property.daily_price || property.price_per_night;
              if (dailyPrice && dailyPrice > 0) {
                price = Math.round(dailyPrice * 25); // 25 days per month estimate
              } else {
                price = 0;
              }
            } else {
              price = 0;
            }
          }

          // Type safety: ensure price is a valid number
          if (!price || typeof price !== 'number' || price <= 0) {
            return false;
          }

          // Exact range matching
          return price >= minPrice && price <= maxPrice;
        }
      });

      console.log(`📊 Price filter applied: ${beforeCount} → ${filtered.length} properties`);
    }

    // Property types filter
    if (
      advancedFilters.propertyTypes &&
      Array.isArray(advancedFilters.propertyTypes) &&
      advancedFilters.propertyTypes.length > 0
    ) {
      filtered = filtered.filter(
        (property) =>
          property.property_type &&
          advancedFilters.propertyTypes!.includes(property.property_type),
      );
    }

    // Amenities filter - ALL selected amenities must be present
    if (
      advancedFilters.amenities &&
      Array.isArray(advancedFilters.amenities) &&
      advancedFilters.amenities.length > 0
    ) {
      filtered = filtered.filter((property) => {
        const propertyAmenities = Array.isArray(property.amenities)
          ? property.amenities
          : [];
        return advancedFilters.amenities!.every((amenity: string) =>
          propertyAmenities.includes(amenity),
        );
      });
    }

    // Bedrooms filter
    if (
      advancedFilters.bedrooms &&
      typeof advancedFilters.bedrooms === 'number' &&
      advancedFilters.bedrooms > 0
    ) {
      filtered = filtered.filter(
        (property) =>
          typeof property.bedrooms === 'number' &&
          property.bedrooms >= advancedFilters.bedrooms!,
      );
    }

    // Bathrooms filter
    if (
      advancedFilters.bathrooms &&
      typeof advancedFilters.bathrooms === 'number' &&
      advancedFilters.bathrooms > 0
    ) {
      filtered = filtered.filter(
        (property) =>
          typeof property.bathrooms === 'number' &&
          property.bathrooms >= advancedFilters.bathrooms!,
      );
    }

    // Date availability filter
    if (filters.checkIn && filters.checkOut) {
      try {
        const checkIn = new Date(filters.checkIn);
        const checkOut = new Date(filters.checkOut);

        // Validate dates
        if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
          filtered = filtered.filter((property) => {
            if (
              !Array.isArray(property.blocked_dates) ||
              property.blocked_dates.length === 0
            ) {
              return true; // No blocked dates, property is available
            }

            try {
              const blockedDates = property.blocked_dates
                .map((date) => new Date(date))
                .filter((date) => !isNaN(date.getTime()));

              // Check if any date in the range is blocked
              const currentDate = new Date(checkIn);
              while (currentDate < checkOut) {
                const isBlocked = blockedDates.some(
                  (blockedDate) =>
                    blockedDate.toDateString() === currentDate.toDateString(),
                );
                if (isBlocked) return false;
                currentDate.setDate(currentDate.getDate() + 1);
              }
              return true;
            } catch (error) {
              return true; // Default to available on error
            }
          });
        }
      } catch (error) {
        // Silently handle date filtering errors
      }
    }


    return filtered;
  }, [properties, filters, dbPriceRange]);

  // Memoize statistics calculation
  const filteringStats = useMemo(() => {
    const totalCount = properties?.length || 0;
    const filteredCount = filteredProperties?.length || 0;

    return {
      total: totalCount,
      filtered: filteredCount,
      reduction:
        totalCount > 0
          ? Math.round(((totalCount - filteredCount) / totalCount) * 100)
          : 0,
    };
  }, [properties?.length, filteredProperties?.length]);

  return {
    filteredProperties,
    filteringStats,
  };
};
