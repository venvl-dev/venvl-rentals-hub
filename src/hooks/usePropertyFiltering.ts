import { useMemo } from 'react';
import { supportsBookingType, matchesSearchCriteria, type BookingType, type PropertyRentalData } from '@/lib/rentalTypeUtils';
import { CombinedFilters } from './useFilterStore';

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

export const usePropertyFiltering = (properties: Property[], filters: CombinedFilters) => {
  console.log('🚨 HOOK CALLED - usePropertyFiltering with:', {
    propertiesLength: properties?.length || 0,
    bookingType: filters?.bookingType,
    hasProperties: !!properties,
    hasFilters: !!filters
  });
  
  // Remove useMemo temporarily to force filtering to run every time
  console.log('🔥 FILTERING RUNNING - usePropertyFiltering recalculating...', new Date().toISOString());
  console.log('🔥 Properties received:', properties ? properties.length : 'null/undefined');
  console.log('🔥 Filters received:', JSON.stringify(filters, null, 2));
  
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
      guests: filters.guests
    });
    
    // Debug: Show all property locations to understand the data format
    console.log('📍 ALL PROPERTY LOCATIONS:');
    filtered.slice(0, 10).forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.title}: city="${p.city}", state="${p.state}", country="${p.country}"`);
    });
    
    // Debug: Show rental types of all properties
    console.log('🏠 All properties rental types:');
    filtered.slice(0, 5).forEach(p => {
      const rentalType = p.rental_type || 'undefined';
      const bookingTypes = JSON.stringify(p.booking_types || []);
      console.log(`   ${p.id.substring(0, 8)}: rental_type=${rentalType}, booking_types=${bookingTypes}`);
    });

    // Location filter - now enabled
    if (filters.location && filters.location.trim() !== '') {
      const searchTerm = filters.location.toLowerCase();
      console.log('📍 ===== LOCATION FILTER START =====');
      console.log('📍 Applying location filter for:', `"${searchTerm}"`);
      console.log('📍 Properties before location filter:', filtered.length);
      
      const beforeCount = filtered.length;
      filtered = filtered.filter(property => {
        const searchFields = [
          property.city,
          property.state,
          property.country,
          property.title
        ].filter(Boolean).map(field => field?.toLowerCase());
        
        // Extract search words and check for matches - improved flexibility
        const searchWords = searchTerm.split(/[,\s]+/).filter(word => word.trim().length > 1);
        
        // Check if any search word matches any field
        const matches = searchWords.some(searchWord => {
          const cleanSearchWord = searchWord.trim().toLowerCase();
          return searchFields.some(field => {
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
        
        console.log(`🔍 Property ${property.id.substring(0, 8)} (${property.city}, ${property.state}): searchWords=[${searchWords.join(', ')}] matches=${matches}`);
        console.log(`   Fields being searched: [${searchFields.join(', ')}]`);
        console.log(`   Original location fields: city="${property.city}", state="${property.state}", country="${property.country}"`);
        return matches;
      });
      
      console.log(`📍 Location filter result: ${beforeCount} → ${filtered.length} properties`);
      
      if (filtered.length === 0) {
        console.log('📍 NO LOCATION MATCHES! Available locations in database:');
        properties.slice(0, 10).forEach(p => {
          console.log(`   📍 "${p.city}, ${p.state}" (${p.country}) - ${p.title}`);
        });
      }
      console.log('📍 ===== LOCATION FILTER END =====');
    }

    // Guest capacity filter
    if (filters.guests > 1) {
      filtered = filtered.filter(property => property.max_guests >= filters.guests);
      console.log('After guest filter:', filtered.length, 'properties');
    }

    // ✅ SIMPLIFIED: Booking type filter - now just 8 lines instead of 63!
    const activeBookingType = advancedFilters.bookingType || filters.bookingType;

    
    if (activeBookingType) {
      console.log(`🔍 Filtering ${filtered.length} properties for booking type: ${activeBookingType}`);
      
      // Debug: Show booking types of first few properties
      console.log('🏠 Sample property booking types:');
      filtered.slice(0, 5).forEach(p => {
        console.log(`   ${p.id.substring(0, 8)}: booking_types=${JSON.stringify(p.rental_type)}`);
      });

       filtered = filtered.filter ( p => p.rental_type == "both" || p.rental_type == activeBookingType)

      
      // filtered = filtered.filter(property => {
      //   const supports = supportsBookingType(property as PropertyRentalData, activeBookingType as BookingType);
      //   if (activeBookingType === 'monthly') {
      //     console.log(`🔍 Monthly check for ${property.id.substring(0, 8)}: booking_types=${JSON.stringify(property.booking_types)}, supports=${supports}`);
      //   }
      //   return supports;
      // });
      
      console.log(`🔍 After booking type filter: ${filtered.length} properties remaining`);
    }

    // 🎯 ENHANCED PRICE RANGE FILTER with improved accuracy and debugging
    // TEMPORARILY DISABLE price range filter for monthly bookings to test
   
    if (advancedFilters.priceRange && Array.isArray(advancedFilters.priceRange) && advancedFilters.priceRange.length === 2 
  //  && activeBookingType !== 'monthly'
  ) {
      const [minPrice, maxPrice] = advancedFilters.priceRange;
      
      console.log('🔍 Price range filter activated:', {
        minPrice,
        maxPrice,
        activeBookingType,
        propertiesBeforeFilter: filtered.length
      });
      
      filtered = filtered.filter(property => {
        // Use appropriate price based on booking type
        let price = property.price_per_night; // default
        let priceSource = 'price_per_night';
        
        if (activeBookingType === 'daily') {
          price = property.daily_price || property.price_per_night;
          priceSource = property.daily_price ? 'daily_price' : 'price_per_night';
        } else if (activeBookingType === 'monthly') {
          // For monthly filter, compare against actual monthly price, not daily equivalent
          price = property.monthly_price || 0;
          priceSource = 'monthly_price';
        }
        
        console.log(`🏠 Property ${property.id} (${property.title}):`, {
          priceSource,
          price,
          rawPrices: {
            price_per_night: property.price_per_night,
            daily_price: property.daily_price,
            monthly_price: property.monthly_price
          },
          activeBookingType,
          priceRange: [minPrice, maxPrice]
        });
        
        // Type safety: ensure price is a valid number
        if (!price || typeof price !== 'number' || price <= 0) {
          console.log(`❌ Property ${property.id} excluded: invalid price ${price} from ${priceSource}`);
          return false;
        }
        
        // Exact range matching - no tolerance
        const inRange = price >= minPrice && price <= maxPrice;
        if (!inRange) {
          console.log(`❌ Property ${property.id} excluded: price ${price} not in range [${minPrice}, ${maxPrice}]`);
        } else {
          console.log(`✅ Property ${property.id} included: price ${price} is in range [${minPrice}, ${maxPrice}]`);
        }
        
        return inRange;
      });
      console.log('🎯 After price filter:', filtered.length, 'properties');
    }

    // Property types filter with better null checking
    if (advancedFilters.propertyTypes && Array.isArray(advancedFilters.propertyTypes) && advancedFilters.propertyTypes.length > 0) {
      filtered = filtered.filter(property => 
        property.property_type && advancedFilters.propertyTypes!.includes(property.property_type)
      );
      console.log('After property type filter:', filtered.length, 'properties');
    }

    // Amenities filter - ALL selected amenities must be present (with better null checking)
    if (advancedFilters.amenities && Array.isArray(advancedFilters.amenities) && advancedFilters.amenities.length > 0) {
      filtered = filtered.filter(property => {
        const propertyAmenities = Array.isArray(property.amenities) ? property.amenities : [];
        return advancedFilters.amenities!.every((amenity: string) => 
          propertyAmenities.includes(amenity)
        );
      });
      console.log('After amenities filter:', filtered.length, 'properties');
    }

    // Bedrooms filter with type safety
    if (advancedFilters.bedrooms && typeof advancedFilters.bedrooms === 'number' && advancedFilters.bedrooms > 0) {
      filtered = filtered.filter(property => 
        typeof property.bedrooms === 'number' && property.bedrooms >= advancedFilters.bedrooms!
      );
      console.log('After bedrooms filter:', filtered.length, 'properties');
    }

    // Bathrooms filter with type safety
    if (advancedFilters.bathrooms && typeof advancedFilters.bathrooms === 'number' && advancedFilters.bathrooms > 0) {
      filtered = filtered.filter(property => 
        typeof property.bathrooms === 'number' && property.bathrooms >= advancedFilters.bathrooms!
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
          filtered = filtered.filter(property => {
            if (!Array.isArray(property.blocked_dates) || property.blocked_dates.length === 0) {
              return true; // No blocked dates, property is available
            }

            try {
              const blockedDates = property.blocked_dates
                .map(date => new Date(date))
                .filter(date => !isNaN(date.getTime())); // Filter out invalid dates

              // Check if any date in the range is blocked
              const currentDate = new Date(checkIn);
              while (currentDate < checkOut) {
                const isBlocked = blockedDates.some(blockedDate => 
                  blockedDate.toDateString() === currentDate.toDateString()
                );
                if (isBlocked) return false;
                currentDate.setDate(currentDate.getDate() + 1);
              }
              return true;
            } catch (error) {
              console.warn('Error checking date availability for property', property.id, error);
              return true; // Default to available on error
            }
          });
          console.log('After date availability filter:', filtered.length, 'properties');
        }
      } catch (error) {
        console.error('Error in date filtering:', error);
      }
    }

    console.log('🎯 FINAL FILTERING RESULTS:');
    console.log(`🎯 Total properties after all filters: ${filtered.length}`);
    console.log('🎯 Sample filtered properties:');
    filtered.slice(0, 3).forEach(p => {
      console.log(`🏠 ${p.id.substring(0, 8)}: ${p.title} - rental_type: ${p.rental_type}, booking_types: ${JSON.stringify(p.booking_types)}`);
    });
    console.log('🎯 Active filter criteria:', {
      location: filters.location,
      bookingType: filters.bookingType,
      advancedBookingType: filters.advancedFilters.bookingType,
      activeBookingType
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
      reduction: totalCount > 0 ? Math.round(((totalCount - filteredCount) / totalCount) * 100) : 0
    };
  }, [properties?.length, filteredProperties?.length]);

  return {
    filteredProperties,
    filteringStats
  };
};