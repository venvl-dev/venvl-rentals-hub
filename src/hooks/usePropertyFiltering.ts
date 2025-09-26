import { useMemo } from 'react';
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
  console.log('🚨 HOOK CALLED - usePropertyFiltering with:', {
    propertiesLength: properties?.length || 0,
    bookingType: filters?.bookingType,
    hasProperties: !!properties,
    hasFilters: !!filters,
  });

  // Get price range for the current booking type (use main booking type selector)
  const mainBookingType = filters.bookingType;
  const { priceRange: dbPriceRange } = usePriceRange(mainBookingType as 'daily' | 'monthly');

  // Remove useMemo temporarily to force filtering to run every time
  console.log(
    '🔥 FILTERING RUNNING - usePropertyFiltering recalculating...',
    new Date().toISOString(),
  );
  console.log(
    '🔥 Properties received:',
    properties ? properties.length : 'null/undefined',
  );
  console.log('🔥 Filters received:', JSON.stringify(filters, null, 2));
  console.log('🔥 Advanced filters priceRange specifically:', filters.advancedFilters.priceRange);

  const filteredProperties = (() => {
    if (!properties || properties.length === 0) {
      console.log('🔥 No properties available, returning empty array');
      console.log('🔥 Properties is:', properties);
      return [];
    }

    let filtered = [...properties];
    const { advancedFilters } = filters;

    console.log('🔍 Starting with', filtered.length, 'properties');
    console.log('🔍 Search criteria:', {
      location: filters.location,
      bookingType: filters.bookingType,
      guests: filters.guests,
    });

    // Debug: Show all property locations to understand the data format
    console.log('📍 ALL PROPERTY LOCATIONS:');
    filtered.slice(0, 10).forEach((p, index) => {
      console.log(
        `   ${index + 1}. ${p.title}: city="${p.city}", state="${
          p.state
        }", country="${p.country}"`,
      );
    });

    // Debug: Show rental types of all properties
    console.log('🏠 All properties rental types:');
    filtered.slice(0, 5).forEach((p) => {
      const rentalType = p.rental_type || 'undefined';
      const bookingTypes = JSON.stringify(p.booking_types || []);
      console.log(
        `   ${p.id.substring(
          0,
          8,
        )}: rental_type=${rentalType}, booking_types=${bookingTypes}`,
      );
    });

    // Location filter - now enabled
    if (filters.location && filters.location.trim() !== '') {
      const searchTerm = filters.location.toLowerCase();
      console.log('📍 ===== LOCATION FILTER START =====');
      console.log('📍 Applying location filter for:', `"${searchTerm}"`);
      console.log('📍 Properties before location filter:', filtered.length);

      const beforeCount = filtered.length;
      filtered = filtered.filter((property) => {
        const searchFields = [
          property.city,
          property.state,
          property.country,
          property.title,
        ]
          .filter(Boolean)
          .map((field) => field?.toLowerCase());

        // Extract search words and check for matches - improved flexibility
        const searchWords = searchTerm
          .split(/[,\s]+/)
          .filter((word) => word.trim().length > 1);

        // Check if any search word matches any field
        const matches = searchWords.some((searchWord) => {
          const cleanSearchWord = searchWord.trim().toLowerCase();
          return searchFields.some((field) => {
            if (!field) return false;
            const fieldLower = field.toLowerCase();
            // Multiple matching strategies
            return (
              fieldLower.includes(cleanSearchWord) ||
              cleanSearchWord.includes(fieldLower) ||
              // Check if search word starts with field (for abbreviations)
              cleanSearchWord.startsWith(fieldLower.substring(0, 3))
            );
          });
        });

        console.log(
          `🔍 Property ${property.id.substring(0, 8)} (${property.city}, ${
            property.state
          }): searchWords=[${searchWords.join(', ')}] matches=${matches}`,
        );
        console.log(`   Fields being searched: [${searchFields.join(', ')}]`);
        console.log(
          `   Original location fields: city="${property.city}", state="${property.state}", country="${property.country}"`,
        );
        return matches;
      });

      console.log(
        `📍 Location filter result: ${beforeCount} → ${filtered.length} properties`,
      );

      if (filtered.length === 0) {
        console.log('📍 NO LOCATION MATCHES! Available locations in database:');
        properties.slice(0, 10).forEach((p) => {
          console.log(
            `   📍 "${p.city}, ${p.state}" (${p.country}) - ${p.title}`,
          );
        });
      }
      console.log('📍 ===== LOCATION FILTER END =====');
    }

    // Guest capacity filter
    if (filters.guests > 1) {
      filtered = filtered.filter(
        (property) => property.max_guests >= filters.guests,
      );
      console.log('After guest filter:', filtered.length, 'properties');
    }

    // ✅ BOOKING TYPE FILTER: Show properties based on selected booking type
    const activeBookingType = filters.bookingType; // Use main booking type selector

    console.log('🔍 BEFORE BOOKING TYPE FILTER:', {
      activeBookingType,
      propertiesCount: filtered.length,
      firstProperty: filtered[0] ? {
        id: filtered[0].id,
        title: filtered[0].title,
        rental_type: filtered[0].rental_type,
        monthly_price: filtered[0].monthly_price,
        price_per_night: filtered[0].price_per_night
      } : 'None'
    });

    // ALWAYS apply booking type filter based on main selector
    if (activeBookingType && activeBookingType !== 'flexible') {
      console.log(
        `🔍 Filtering ${filtered.length} properties for booking type: ${activeBookingType}`,
      );

      // Debug: Show booking types of ALL properties to understand the data
      console.log('🏠 ALL property rental types:');
      const rentalTypeCounts: Record<string, number> = {};
      filtered.forEach((p) => {
        const type = p.rental_type || 'null';
        rentalTypeCounts[type] = (rentalTypeCounts[type] || 0) + 1;

        // Show more details for monthly properties specifically
        if (p.rental_type === 'monthly' || p.rental_type === 'both') {
          console.log(
            `   🔍 MONTHLY PROPERTY: ${p.id.substring(0, 8)}: rental_type="${p.rental_type}", monthly_price="${p.monthly_price}", title="${p.title.substring(0, 30)}..."`,
          );
        } else {
          console.log(
            `   ${p.id.substring(0, 8)}: rental_type="${p.rental_type}", title="${p.title.substring(0, 30)}..."`,
          );
        }
      });

      console.log('🏠 Rental type summary:', rentalTypeCounts);
      console.log(`🏠 Looking for properties with rental_type === '${activeBookingType}' (strict filtering) when activeBookingType is '${activeBookingType}'`);

      filtered = filtered.filter((p) => {
        // Check if property supports the requested booking type
        let supports = false;

        if (activeBookingType === 'monthly') {
          // Monthly: Show ONLY properties with rental_type 'monthly' (strict filtering)
          supports = p.rental_type === 'monthly';
        } else if (activeBookingType === 'daily') {
          // Daily: Show ONLY properties with rental_type 'daily' (strict)
          supports = p.rental_type === 'daily';
        } else {
          // For flexible, show all properties (including 'both' type)
          supports = true;
        }

        const debugInfo = {
          id: p.id.substring(0, 8),
          title: p.title.substring(0, 30),
          rental_type: p.rental_type,
          monthly_price: p.monthly_price,
          daily_price: p.daily_price,
          supports_monthly: activeBookingType === 'monthly' ? (p.rental_type === 'monthly') : 'N/A',
          final_decision: supports
        };

        if (activeBookingType === 'monthly') {
          console.log(`🔍 Monthly Property Check:`, debugInfo);
        } else {
          console.log(`🔍 Property ${p.id.substring(0, 8)} (${p.title}): rental_type="${p.rental_type}", supports ${activeBookingType}=${supports}`);
        }

        return supports;
      });

      console.log(
        `🔍 After booking type filter: ${filtered.length} properties remaining`,
      );
    } else {
      console.log('🔍 SKIPPING booking type filter - showing all properties');
    }

    if (activeBookingType === 'flexible') {
      // TEMPORARY: For flexible booking type, show ALL properties to debug the issue
      console.log(
        `🔍 Flexible booking type - TEMPORARILY showing ALL properties from ${filtered.length} total`,
      );

      // Debug: Show what rental_types we actually have
      const rentalTypeCounts: Record<string, number> = {};
      filtered.forEach((p) => {
        const type = p.rental_type || 'null';
        rentalTypeCounts[type] = (rentalTypeCounts[type] || 0) + 1;
      });
      console.log('🏠 FLEXIBLE MODE - Rental type summary:', rentalTypeCounts);

      // For now, don't filter at all for flexible to see all properties
      console.log(
        `🔍 After flexible filter (no filtering): ${filtered.length} properties remaining`,
      );
    }

    // 🎯 PRICE RANGE FILTER - Only apply when explicitly applied via Advanced Filters
    // This ensures price filtering only happens when user clicks "Apply" in NewAdvancedFilters
    const shouldApplyPriceFilter =
      advancedFilters.priceRange &&
      Array.isArray(advancedFilters.priceRange) &&
      advancedFilters.priceRange.length === 2 &&
      dbPriceRange &&
      dbPriceRange.min > 0 &&
      // Only apply when user has explicitly applied a different range via Advanced Filters
      // This means the price range was set through the Apply button, not just booking type change
      (advancedFilters.priceRange[0] !== dbPriceRange.min ||
        advancedFilters.priceRange[1] !== dbPriceRange.max);

    console.log('🎯 Price filter check:', {
      hasAdvancedPriceRange: !!advancedFilters.priceRange,
      dbPriceRangeExists: !!dbPriceRange,
      dbPriceRangeValid: dbPriceRange && dbPriceRange.min > 0,
      userRange: advancedFilters.priceRange,
      dbRange: dbPriceRange ? [dbPriceRange.min, dbPriceRange.max] : null,
      isUserModified: advancedFilters.priceRange && dbPriceRange ?
        (advancedFilters.priceRange[0] !== dbPriceRange.min || advancedFilters.priceRange[1] !== dbPriceRange.max) : false,
      shouldApply: shouldApplyPriceFilter,
      activeBookingType,
      PROBLEM_DETECTED: shouldApplyPriceFilter && !advancedFilters.priceRange ? 'Price filter should not apply without explicit user range!' : 'OK'
    });

    if (shouldApplyPriceFilter) {
      const [minPrice, maxPrice] = advancedFilters.priceRange;

      console.log('🔍 Price range filter activated:', {
        minPrice,
        maxPrice,
        activeBookingType,
        propertiesBeforeFilter: filtered.length,
        dbPriceRange: dbPriceRange ? `${dbPriceRange.min}-${dbPriceRange.max}` : 'null',
        userPriceRange: `${advancedFilters.priceRange[0]}-${advancedFilters.priceRange[1]}`,
        isRangeModified: advancedFilters.priceRange[0] !== dbPriceRange?.min || advancedFilters.priceRange[1] !== dbPriceRange?.max
      });

      filtered = filtered.filter((property) => {
        // Use appropriate price based on booking type
        let price = property.price_per_night; // default
        let priceSource = 'price_per_night';

        if (activeBookingType === 'daily') {
          price = property.daily_price || property.price_per_night;
          priceSource = property.daily_price
            ? 'daily_price'
            : 'price_per_night';
        } else if (activeBookingType === 'monthly') {
          // For monthly filter, compare against actual monthly price, or estimate if not available
          if (property.monthly_price && property.monthly_price > 0) {
            price = property.monthly_price;
            priceSource = 'monthly_price';
          } else if (property.rental_type === 'monthly' || property.rental_type === 'both') {
            // Estimate monthly price from daily rate if property supports monthly but lacks monthly_price
            const dailyPrice = property.daily_price || property.price_per_night;
            if (dailyPrice && dailyPrice > 0) {
              price = Math.round(dailyPrice * 25); // 25 days per month estimate
              priceSource = 'estimated_monthly_price';
            } else {
              price = 0;
              priceSource = 'no_valid_price';
            }
          } else {
            price = 0;
            priceSource = 'monthly_price_unavailable';
          }
        }

        console.log(`🏠 Property ${property.id} (${property.title}):`, {
          priceSource,
          price,
          rawPrices: {
            price_per_night: property.price_per_night,
            daily_price: property.daily_price,
            monthly_price: property.monthly_price,
          },
          activeBookingType,
          priceRange: [minPrice, maxPrice],
        });

        // Type safety: ensure price is a valid number
        if (!price || typeof price !== 'number' || price <= 0) {
          console.log(
            `❌ Property ${property.id} excluded: invalid price ${price} from ${priceSource}`,
          );
          return false;
        }

        // Exact range matching - no tolerance
        const inRange = price >= minPrice && price <= maxPrice;
        if (!inRange) {
          console.log(
            `❌ Property ${property.id} excluded: price ${price} not in range [${minPrice}, ${maxPrice}]`,
          );
        } else {
          console.log(
            `✅ Property ${property.id} included: price ${price} is in range [${minPrice}, ${maxPrice}]`,
          );
        }

        return inRange;
      });
      console.log('🎯 After price filter:', filtered.length, 'properties');
    } else if (advancedFilters.priceRange && dbPriceRange) {
      console.log('🔍 Price range filter SKIPPED - using default range:', {
        userRange: advancedFilters.priceRange,
        dbRange: [dbPriceRange.min, dbPriceRange.max],
        reason: 'User has not modified the default price range'
      });
    }

    // Property types filter with better null checking
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
      console.log('After property type filter:', filtered.length, 'properties');
    }

    // Amenities filter - ALL selected amenities must be present (with better null checking)
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
      console.log('After amenities filter:', filtered.length, 'properties');
    }

    // Bedrooms filter with type safety
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
      console.log('After bedrooms filter:', filtered.length, 'properties');
    }

    // Bathrooms filter with type safety
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
      console.log('After bathrooms filter:', filtered.length, 'properties');
    }

    // Date availability filter (if dates are selected) with better error handling
    if (filters.checkIn && filters.checkOut) {
      try {
        const checkIn = new Date(filters.checkIn);
        const checkOut = new Date(filters.checkOut);

        // Validate dates
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
          console.warn('Invalid dates provided for filtering');
        } else {
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
                .filter((date) => !isNaN(date.getTime())); // Filter out invalid dates

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
              console.warn(
                'Error checking date availability for property',
                property.id,
                error,
              );
              return true; // Default to available on error
            }
          });
          console.log(
            'After date availability filter:',
            filtered.length,
            'properties',
          );
        }
      } catch (error) {
        console.error('Error in date filtering:', error);
      }
    }

    console.log('🎯 FINAL FILTERING RESULTS:');
    console.log(`🎯 Total properties after all filters: ${filtered.length}`);
    console.log('🎯 Sample filtered properties:');
    filtered.slice(0, 3).forEach((p) => {
      console.log(
        `🏠 ${p.id.substring(0, 8)}: ${p.title} - rental_type: ${
          p.rental_type
        }, booking_types: ${JSON.stringify(p.booking_types)}`,
      );
    });
    console.log('🎯 Active filter criteria:', {
      location: filters.location,
      bookingType: filters.bookingType,
      advancedBookingType: filters.advancedFilters.bookingType,
      activeBookingType,
    });

    return filtered;
  })();

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
