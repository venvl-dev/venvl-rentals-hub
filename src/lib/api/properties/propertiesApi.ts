import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { cleanAmenityIds } from '@/lib/amenitiesUtils';

export interface FetchPropertiesParams {
  pageParam?: number;
  limit?: number;
}

export interface FetchPropertiesResponse {
  properties: Property[];
  nextCursor: number | null;
  totalCount: number;
}

/**
 * Fetches properties from the database with pagination support
 * @param pageParam - The offset for pagination (default: 0)
 * @param limit - Number of properties to fetch per page (default: 12)
 * @returns Promise with properties array and pagination metadata
 */
export async function fetchProperties({
  pageParam = 0,
  limit = 12,
}: FetchPropertiesParams = {}): Promise<FetchPropertiesResponse> {
  try {
    // Calculate the range for pagination
    const from = pageParam * limit;
    const to = from + limit - 1;

    // Fetch properties with pagination
    const { data, error, count } = await supabase
      .from('properties')
      .select(
        `
        id,
        title,
        description,
        price_per_night,
        daily_price,
        monthly_price,
        images,
        city,
        state,
        country,
        property_type,
        bedrooms,
        bathrooms,
        max_guests,
        amenities,
        booking_types,
        rental_type,
        min_nights,
        min_months,
        blocked_dates,
        is_active,
        approval_status,
        created_at,
        updated_at,
        host_id
      `,
        { count: 'exact' },
      )
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching properties:', error);
      throw new Error(`Failed to fetch properties: ${error.message}`);
    }

    if (!data) {
      return {
        properties: [],
        nextCursor: null,
        totalCount: 0,
      };
    }

    // Clean and normalize property data
    const cleanedProperties = data.map((property) => {
      // Clean amenity IDs
      const cleanedAmenities = cleanAmenityIds(property.amenities || []);

      // Ensure booking_types has a default value if missing
      let bookingTypes = property.booking_types;
      if (
        !bookingTypes ||
        !Array.isArray(bookingTypes) ||
        bookingTypes.length === 0
      ) {
        bookingTypes = ['daily']; // Default to daily bookings
      }

      // Ensure rental_type has a default value if missing
      let rentalType = property.rental_type;
      if (!rentalType) {
        // If property has monthly_price, assume it supports both, otherwise daily only
        if (property.monthly_price && property.monthly_price > 0) {
          rentalType = 'both';
        } else {
          rentalType = 'daily';
        }
      }

      return {
        ...property,
        amenities: cleanedAmenities,
        booking_types: bookingTypes,
        rental_type: rentalType,
      } as Property;
    });

    // Determine if there's a next page
    const totalCount = count || 0;
    const hasNextPage = from + limit < totalCount;
    const nextCursor = hasNextPage ? pageParam + 1 : null;

    return {
      properties: cleanedProperties,
      nextCursor,
      totalCount,
    };
  } catch (error) {
    console.error('Error in fetchProperties:', error);
    throw error;
  }
}
