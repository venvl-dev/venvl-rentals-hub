import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { cleanAmenityIds } from '@/lib/amenitiesUtils';

export interface PropertyFilters {
  location?: string;
  guests?: number;
  bookingType?: 'daily' | 'monthly' | 'flexible';
  checkIn?: string;
  checkOut?: string;
  priceRange?: [number, number];
  propertyTypes?: string[];
  amenities?: string[];
  bedrooms?: number;
  bathrooms?: number;
}

export interface FetchPropertiesParams {
  pageParam?: number;
  limit?: number;
  filters?: PropertyFilters;
}

export interface FetchPropertiesResponse {
  properties: Property[];
  nextCursor: number | null;
  totalCount: number;
}

/**
 * Fetches properties from the database with pagination support and server-side filtering
 * @param pageParam - The offset for pagination (default: 0)
 * @param limit - Number of properties to fetch per page (default: 12)
 * @param filters - Optional filters to apply to the query
 * @returns Promise with properties array and pagination metadata
 */
export async function fetchProperties({
  pageParam = 0,
  limit = 12,
  filters,
}: FetchPropertiesParams = {}): Promise<FetchPropertiesResponse> {
  try {
    // Calculate the range for pagination
    const from = pageParam * limit;
    const to = from + limit - 1;

    // Start building the query
    let query = supabase
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
      .eq('approval_status', 'approved');

    // Apply filters if provided
    if (filters) {
      // Location filter - search across multiple fields
      if (filters.location && filters.location.trim() !== '') {
        const searchTerm = filters.location.toLowerCase().trim();
        const searchWords = searchTerm
          .split(/[,\s]+/)
          .filter((word) => word.trim().length > 1);

        if (searchWords.length > 0) {
          // Build OR conditions for each search word across multiple fields
          const orConditions = searchWords
            .map((word) => {
              return `city.ilike.%${word}%,state.ilike.%${word}%,country.ilike.%${word}%,title.ilike.%${word}%`;
            })
            .join(',');

          query = query.or(orConditions);
        }
      }

      // Guest capacity filter
      if (filters.guests && filters.guests > 1) {
        query = query.gte('max_guests', filters.guests);
      }

      // Booking type filter
      if (filters.bookingType && filters.bookingType !== 'flexible') {
        if (filters.bookingType === 'daily') {
          query = query.in('rental_type', ['daily', 'both']);
        } else if (filters.bookingType === 'monthly') {
          query = query.in('rental_type', ['monthly', 'both']);
        }
      }

      // Price range filter (depends on booking type)
      if (filters.priceRange && Array.isArray(filters.priceRange)) {
        const [minPrice, maxPrice] = filters.priceRange;

        if (filters.bookingType === 'daily') {
          // Filter by daily_price or price_per_night
          query = query.or(
            `and(daily_price.gte.${minPrice},daily_price.lte.${maxPrice}),and(daily_price.is.null,price_per_night.gte.${minPrice},price_per_night.lte.${maxPrice})`,
          );
        } else if (filters.bookingType === 'monthly') {
          // Filter by monthly_price
          query = query
            .gte('monthly_price', minPrice)
            .lte('monthly_price', maxPrice)
            .not('monthly_price', 'is', null);
        } else if (filters.bookingType === 'flexible') {
          // For flexible, match if ANY price field falls in range
          // This is complex - we'll check daily_price, price_per_night, or monthly_price
          query = query.or(
            `and(daily_price.gte.${minPrice},daily_price.lte.${maxPrice}),and(price_per_night.gte.${minPrice},price_per_night.lte.${maxPrice}),and(monthly_price.gte.${minPrice},monthly_price.lte.${maxPrice})`,
          );
        }
      }

      // Property types filter
      if (filters.propertyTypes && filters.propertyTypes.length > 0) {
        query = query.in('property_type', filters.propertyTypes as any);
      }

      // Amenities filter - ALL must be present (contains checks if array contains all elements)
      if (filters.amenities && filters.amenities.length > 0) {
        query = query.contains('amenities', filters.amenities);
      }

      // Bedrooms filter
      if (filters.bedrooms && filters.bedrooms > 0) {
        query = query.gte('bedrooms', filters.bedrooms);
      }

      // Bathrooms filter
      if (filters.bathrooms && filters.bathrooms > 0) {
        query = query.gte('bathrooms', filters.bathrooms);
      }

      // Date availability filter - checking if dates are NOT blocked
      if (filters.checkIn && filters.checkOut) {
        // Generate array of dates between checkIn and checkOut
        const checkInDate = new Date(filters.checkIn);
        const checkOutDate = new Date(filters.checkOut);
        const dateRange: string[] = [];

        const currentDate = new Date(checkInDate);
        while (currentDate < checkOutDate) {
          dateRange.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Filter out properties where blocked_dates overlaps with our date range
        // Using 'not' with 'ov' (overlaps) operator
        if (dateRange.length > 0) {
          query = query.not('blocked_dates', 'ov', dateRange);
        }
      }
    }

    // Apply ordering and pagination
    const { data, error, count } = await query
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
