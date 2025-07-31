import { useMemo } from 'react';
import { matchesSearchCriteria, type BookingType, type PropertyRentalData } from '@/lib/rentalTypeUtils';
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
  // Memoize the filtering logic with better dependency tracking
  const filteredProperties = useMemo(() => {
    if (!properties || properties.length === 0) {
      console.log('No properties to filter');
      return [];
    }

    console.log('Filtering', properties.length, 'properties with filters:', filters);

    let filtered = [...properties];
    const { advancedFilters } = filters;

    // Location filter - early return for performance
    if (filters.location.trim() !== '') {
      const searchTerm = filters.location.toLowerCase();
      filtered = filtered.filter(property => {
        const searchFields = [
          property.city,
          property.state,
          property.country,
          property.title,
          property.description
        ].filter(Boolean); // Remove null/undefined values
        
        return searchFields.some(field => 
          field?.toLowerCase().includes(searchTerm)
        );
      });
      console.log('After location filter:', filtered.length, 'properties');
    }

    // Guest capacity filter
    if (filters.guests > 1) {
      filtered = filtered.filter(property => property.max_guests >= filters.guests);
      console.log('After guest filter:', filtered.length, 'properties');
    }

    // Booking type filter - Use the advanced filter if set, otherwise use search filter
    const activeBookingType = advancedFilters.bookingType || filters.bookingType;
    
    if (activeBookingType) {
      filtered = filtered.filter(property => {
        try {
          return matchesSearchCriteria(
            property as PropertyRentalData, 
            activeBookingType as BookingType
          );
        } catch (error) {
          console.warn('Error matching search criteria for property', property.id, error);
          return false; // Exclude properties that can't be matched
        }
      });
      console.log('After booking type filter:', filtered.length, 'properties');
    }

    // Price range filter with better null checking
    if (advancedFilters.priceRange && Array.isArray(advancedFilters.priceRange) && advancedFilters.priceRange.length === 2) {
      const [minPrice, maxPrice] = advancedFilters.priceRange;
      
      filtered = filtered.filter(property => {
        // Use appropriate price based on booking type
        let price = property.price_per_night; // default
        
        if (activeBookingType === 'daily') {
          price = property.daily_price || property.price_per_night;
        } else if (activeBookingType === 'monthly') {
          // For monthly filter, compare against actual monthly price, not daily equivalent
          price = property.monthly_price || 0;
        }
        
        // Type safety: ensure price is a valid number
        if (!price || typeof price !== 'number' || price <= 0) {
          return false;
        }
        
        return price >= minPrice && price <= maxPrice;
      });
      console.log('After price filter:', filtered.length, 'properties');
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

    console.log('Final filtered properties:', filtered.length);
    return filtered;
  }, [
    properties, 
    filters.location, 
    filters.guests, 
    filters.checkIn, 
    filters.checkOut,
    filters.bookingType,
    filters.advancedFilters.bookingType,
    filters.advancedFilters.priceRange,
    filters.advancedFilters.propertyTypes,
    filters.advancedFilters.amenities,
    filters.advancedFilters.bedrooms,
    filters.advancedFilters.bathrooms
  ]);

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