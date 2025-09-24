import { Database } from '@/integrations/supabase/types';

export type BookingType = 'daily' | 'monthly' | 'flexible';

export interface PropertyRentalData {
  booking_types?: string[] | null;
  price_per_night: number;
  monthly_price?: number | null;
  daily_price?: number | null;
  min_nights?: number | null;
  min_months?: number | null;
}

/**
 * ✅ SIMPLIFIED: Check if property supports a specific booking type
 * Based ONLY on booking_types array - no more confusion!
 */
export function supportsBookingType(
  property: PropertyRentalData,
  bookingType: BookingType,
): boolean {
  if (!property.booking_types || !Array.isArray(property.booking_types)) {
    // Default properties to daily if no booking_types specified
    return bookingType === 'daily';
  }

  switch (bookingType) {
    case 'daily':
      // Daily: show properties that ONLY support daily (not both)
      return (
        property.booking_types.includes('daily') &&
        !property.booking_types.includes('monthly')
      );
    case 'monthly':
      // Monthly: show properties that ONLY support monthly (not both)
      return (
        property.booking_types.includes('monthly') &&
        !property.booking_types.includes('daily')
      );
    case 'flexible':
      // Flexible: show properties that support BOTH daily and monthly
      return (
        property.booking_types.includes('daily') &&
        property.booking_types.includes('monthly')
      );
    default:
      return false;
  }
}

/**
 * ✅ SIMPLIFIED: Get display label for booking types
 */
export function getBookingTypeLabel(bookingTypes: string[]): string {
  if (!bookingTypes || bookingTypes.length === 0) {
    return 'Daily';
  }

  const hasDaily = bookingTypes.includes('daily');
  const hasMonthly = bookingTypes.includes('monthly');

  if (hasDaily && hasMonthly) {
    return 'Flexible';
  }
  if (hasMonthly) {
    return 'Monthly';
  }
  return 'Daily';
}

/**
 * ✅ SIMPLIFIED: Get daily price for display
 */
export function getDailyPrice(property: PropertyRentalData): number {
  return property.daily_price || property.price_per_night || 0;
}

/**
 * ✅ SIMPLIFIED: Get monthly price for display
 */
export function getMonthlyPrice(property: PropertyRentalData): number {
  return property.monthly_price || 0;
}

/**
 * ✅ SIMPLIFIED: Get primary price for display based on booking types
 */
export function getPrimaryPrice(property: PropertyRentalData): {
  price: number;
  unit: string;
} {
  if (!property.booking_types || property.booking_types.length === 0) {
    return { price: getDailyPrice(property), unit: 'night' };
  }

  // If only monthly, show monthly price
  if (
    property.booking_types.includes('monthly') &&
    !property.booking_types.includes('daily')
  ) {
    return { price: getMonthlyPrice(property), unit: 'month' };
  }

  // Default to daily price (including flexible properties)
  return { price: getDailyPrice(property), unit: 'night' };
}

/**
 * ✅ SIMPLIFIED: Get rental type badge component
 */
export function getRentalTypeBadge(bookingTypes: string[]) {
  const label = getBookingTypeLabel(bookingTypes);
  const colorClass =
    label === 'Monthly'
      ? 'bg-purple-100 text-purple-800'
      : label === 'Flexible'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-green-100 text-green-800';

  return { label, colorClass };
}

/**
 * ✅ SIMPLIFIED: Get available booking types for a property
 */
export function getAvailableBookingTypes(
  property: PropertyRentalData,
): BookingType[] {
  if (
    !property.booking_types ||
    !Array.isArray(property.booking_types) ||
    property.booking_types.length === 0
  ) {
    return ['daily']; // Default to daily bookings
  }

  const availableTypes: BookingType[] = [];

  if (property.booking_types.includes('daily')) {
    availableTypes.push('daily');
  }

  if (property.booking_types.includes('monthly')) {
    availableTypes.push('monthly');
  }

  // If both are available, also offer flexible
  if (availableTypes.length === 2) {
    availableTypes.push('flexible');
  }

  return availableTypes;
}

// Legacy compatibility - DEPRECATED
export const matchesSearchCriteria = supportsBookingType;

// Legacy compatibility - DEPRECATED, use getBookingTypeLabel instead
export function getRentalType(
  property: PropertyRentalData,
): 'daily' | 'monthly' | 'both' {
  if (!property.booking_types || property.booking_types.length === 0) {
    return 'daily';
  }

  const hasDaily = property.booking_types.includes('daily');
  const hasMonthly = property.booking_types.includes('monthly');

  if (hasDaily && hasMonthly) {
    return 'both';
  }
  if (hasMonthly) {
    return 'monthly';
  }
  return 'daily';
}
