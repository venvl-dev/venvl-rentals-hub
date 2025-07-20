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
  const filteredProperties = useMemo(() => {
    if (!properties || properties.length === 0) {
      return [];
    }

    let filtered = [...properties];
    const { advancedFilters } = filters;

    // Location filter
    if (filters.location.trim() !== '') {
      const searchTerm = filters.location.toLowerCase();
      filtered = filtered.filter(property => 
        property.city?.toLowerCase().includes(searchTerm) ||
        property.state?.toLowerCase().includes(searchTerm) ||
        property.country?.toLowerCase().includes(searchTerm) ||
        property.title?.toLowerCase().includes(searchTerm) ||
        property.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Guest capacity filter
    if (filters.guests > 1) {
      filtered = filtered.filter(property => property.max_guests >= filters.guests);
    }

    // Booking type filter - Use the advanced filter if set, otherwise use search filter
    const activeBookingType = advancedFilters.bookingType || filters.bookingType;
    if (activeBookingType && activeBookingType !== 'daily') {
      filtered = filtered.filter(property => {
        return matchesSearchCriteria(
          property as PropertyRentalData, 
          activeBookingType as BookingType,
          advancedFilters.priceRange ? { 
            min: advancedFilters.priceRange[0], 
            max: advancedFilters.priceRange[1] 
          } : undefined
        );
      });
    }

    // Price range filter
    if (advancedFilters.priceRange && Array.isArray(advancedFilters.priceRange)) {
      filtered = filtered.filter(property => {
        // Use appropriate price based on booking type
        let price = property.price_per_night; // default
        
        if (activeBookingType === 'daily') {
          price = property.daily_price || property.price_per_night;
        } else if (activeBookingType === 'monthly') {
          price = property.monthly_price ? Math.round(property.monthly_price / 30) : property.price_per_night;
        }
        
        if (!price || price <= 0) return false;
        return price >= advancedFilters.priceRange[0] && price <= advancedFilters.priceRange[1];
      });
    }

    // Property types filter
    if (advancedFilters.propertyTypes && advancedFilters.propertyTypes.length > 0) {
      filtered = filtered.filter(property => 
        advancedFilters.propertyTypes!.includes(property.property_type)
      );
    }

    // Amenities filter - ALL selected amenities must be present
    if (advancedFilters.amenities && advancedFilters.amenities.length > 0) {
      filtered = filtered.filter(property => {
        const propertyAmenities = property.amenities || [];
        return advancedFilters.amenities!.every((amenity: string) => 
          propertyAmenities.includes(amenity)
        );
      });
    }

    // Bedrooms filter
    if (advancedFilters.bedrooms && advancedFilters.bedrooms > 0) {
      filtered = filtered.filter(property => property.bedrooms >= advancedFilters.bedrooms!);
    }

    // Bathrooms filter
    if (advancedFilters.bathrooms && advancedFilters.bathrooms > 0) {
      filtered = filtered.filter(property => property.bathrooms >= advancedFilters.bathrooms!);
    }

    // Date availability filter (if dates are selected)
    if (filters.checkIn && filters.checkOut) {
      filtered = filtered.filter(property => {
        if (!property.blocked_dates || property.blocked_dates.length === 0) {
          return true; // No blocked dates, property is available
        }

        const checkIn = new Date(filters.checkIn!);
        const checkOut = new Date(filters.checkOut!);
        const blockedDates = property.blocked_dates.map(date => new Date(date));

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
      });
    }

    return filtered;
  }, [properties, filters]);

  const totalCount = properties.length;
  const filteredCount = filteredProperties.length;
  const filteringStats = {
    total: totalCount,
    filtered: filteredCount,
    reduction: totalCount > 0 ? Math.round(((totalCount - filteredCount) / totalCount) * 100) : 0
  };

  return {
    filteredProperties,
    filteringStats
  };
};