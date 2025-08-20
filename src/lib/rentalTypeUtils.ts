import { Database } from '@/integrations/supabase/types';

export type RentalType = 'daily' | 'monthly' | 'both';
export type BookingType = 'daily' | 'monthly' | 'flexible';

export interface PropertyRentalData {
  booking_types?: string[] | null;
  rental_type?: string | null;
  price_per_night: number;
  monthly_price?: number | null;
  daily_price?: number | null;
  min_nights?: number | null;
  min_months?: number | null;
}

/**
 * Determines the rental type for a property based on booking_types and available prices
 * Now with better error handling and fallbacks
 */
export function getRentalType(property: PropertyRentalData): RentalType {
  try {
    // If booking_types is explicitly set, use it
    if (property.booking_types && Array.isArray(property.booking_types) && property.booking_types.length > 0) {
      const hasDaily = property.booking_types.includes('daily');
      const hasMonthly = property.booking_types.includes('monthly');
      
      if (hasDaily && hasMonthly) return 'both';
      if (hasMonthly) return 'monthly';
      if (hasDaily) return 'daily';
    }
    
    // Fallback to legacy rental_type field
    if (property.rental_type && typeof property.rental_type === 'string') {
      if (property.rental_type === 'both') return 'both';
      if (property.rental_type === 'monthly') return 'monthly';
      if (property.rental_type === 'daily') return 'daily';
    }
    
    // Fallback based on available prices - with type safety
    const hasNightlyPrice = (typeof property.price_per_night === 'number' && property.price_per_night > 0) || 
                          (typeof property.daily_price === 'number' && property.daily_price > 0);
    const hasMonthlyPrice = typeof property.monthly_price === 'number' && property.monthly_price > 0;
    
    if (hasNightlyPrice && hasMonthlyPrice) return 'both';
    if (hasMonthlyPrice) return 'monthly';
    if (hasNightlyPrice) return 'daily';
    
    // Default to daily for properties with any pricing data
    return 'daily';
  } catch (error) {
    console.warn('Error determining rental type for property:', property, 'Error:', error);
    // Safe fallback - assume daily rental
    return 'daily';
  }
}

/**
 * Gets the effective daily price for a property
 */
export function getDailyPrice(property: PropertyRentalData): number {
  return property.daily_price || property.price_per_night;
}

/**
 * Gets the effective monthly price for a property
 */
export function getMonthlyPrice(property: PropertyRentalData): number | null {
  return property.monthly_price;
}

/**
 * Checks if a property supports a specific booking type
 */
export function supportsBookingType(property: PropertyRentalData, bookingType: BookingType): boolean {
  const rentalType = getRentalType(property);
  
  switch (bookingType) {
    case 'daily':
      // Daily filter shows ONLY daily-only properties (exclusive)
      return rentalType === 'daily';
    case 'monthly':
      // Monthly filter shows ONLY monthly-only properties (exclusive)
      return rentalType === 'monthly';
    case 'flexible':
      // Flexible shows properties that support both types
      return rentalType === 'both';
    default:
      return false;
  }
}

/**
 * Gets available booking types for a property
 */
export function getAvailableBookingTypes(property: PropertyRentalData): BookingType[] {
  const rentalType = getRentalType(property);
  const types: BookingType[] = [];
  
  if (rentalType === 'daily') {
    types.push('daily', 'flexible');
  } else if (rentalType === 'monthly') {
    types.push('monthly', 'flexible');
  } else if (rentalType === 'both') {
    // Properties that support both show up in all filters
    types.push('daily', 'monthly', 'flexible');
  }
  
  return types;
}

/**
 * Gets the primary price for display based on rental type
 */
export function getPrimaryPrice(property: PropertyRentalData): { price: number; unit: string } {
  const rentalType = getRentalType(property);
  
  if (rentalType === 'monthly') {
    return { 
      price: getMonthlyPrice(property) || 0, 
      unit: 'month' 
    };
  }
  
  return { 
    price: getDailyPrice(property), 
    unit: 'night' 
  };
}

/**
 * Gets minimum stay requirements based on booking type
 */
export function getMinimumStay(property: PropertyRentalData, bookingType: BookingType): number {
  switch (bookingType) {
    case 'daily':
      return property.min_nights || 1;
    case 'monthly':
      return property.min_months || 1;
    default:
      return 1;
  }
}

/**
 * Validates if a property matches search criteria with better error handling
 */
export function matchesSearchCriteria(
  property: PropertyRentalData, 
  searchBookingType: BookingType,
  priceRange?: { min: number; max: number }
): boolean {
  try {
    // Check if property supports the requested booking type
    if (!supportsBookingType(property, searchBookingType)) {
      return false;
    }
    
    // Check price range if specified
    if (priceRange) {
      let targetPrice: number;
      
      if (searchBookingType === 'monthly') {
        const monthlyPrice = getMonthlyPrice(property);
        if (!monthlyPrice) return false;
        targetPrice = monthlyPrice;
      } else {
        targetPrice = getDailyPrice(property);
      }
      
      if (targetPrice < priceRange.min || targetPrice > priceRange.max) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    // Log error but don't exclude property - better to include than exclude
    console.warn('Error in matchesSearchCriteria for property:', property, 'Error:', error);
    return true; // Default to including the property
  }
}

/**
 * Gets rental type badge configuration
 */
export function getRentalTypeBadge(rentalType: RentalType): {
  label: string;
  color: string;
  icon?: string;
} {
  switch (rentalType) {
    case 'daily':
      return {
        label: 'Daily Stays',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    case 'monthly':
      return {
        label: 'Monthly Stays',
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    case 'both':
      return {
        label: 'Flexible Booking',
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      };
  }
} 
