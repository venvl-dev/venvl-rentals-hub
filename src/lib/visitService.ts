import { createClient } from '@supabase/supabase-js';
import {
  ListingVisit,
  VisitedListing,
  PropertyVisitStats,
  TrackVisitParams,
  GetVisitedListingsParams,
} from '../types/visit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export class VisitService {
  /**
   * Track a visit to a property listing
   */
  static async trackVisit(
    params: TrackVisitParams,
  ): Promise<{ success: boolean; visitId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('track_listing_visit', {
        target_property_id: params.propertyId,
      });

      if (error) {
        console.error('Error tracking visit:', error);
        return { success: false, error: error.message };
      }

      return { success: true, visitId: data };
    } catch (error) {
      console.error('Error tracking visit:', error);
      return { success: false, error: 'Failed to track visit' };
    }
  }

  /**
   * Get user's visited listings
   */
  static async getVisitedListings(
    params: GetVisitedListingsParams = {},
  ): Promise<{
    success: boolean;
    data?: VisitedListing[];
    error?: string;
  }> {
    try {
      const { limit = 20, offset = 0 } = params;

      const { data, error } = await supabase.rpc('get_user_visited_listings', {
        limit_count: limit,
        offset_count: offset,
      });

      if (error) {
        console.error('Error fetching visited listings:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching visited listings:', error);
      return { success: false, error: 'Failed to fetch visited listings' };
    }
  }

  /**
   * Get visit statistics for a property (host only)
   */
  static async getPropertyVisitStats(propertyId: string): Promise<{
    success: boolean;
    data?: PropertyVisitStats;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_property_visit_stats', {
        target_property_id: propertyId,
      });

      if (error) {
        console.error('Error fetching visit stats:', error);
        return { success: false, error: error.message };
      }

      // The function returns an array with one object, extract it
      const stats = data?.[0];
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching visit stats:', error);
      return { success: false, error: 'Failed to fetch visit statistics' };
    }
  }

  /**
   * Get recent visits for the current user
   */
  static async getRecentVisits(limit: number = 10): Promise<{
    success: boolean;
    data?: VisitedListing[];
    error?: string;
  }> {
    return this.getVisitedListings({ limit, offset: 0 });
  }

  /**
   * Check if user has visited a specific property
   */
  static async hasVisited(propertyId: string): Promise<{
    success: boolean;
    hasVisited?: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('listing_visits')
        .select('id')
        .eq('property_id', propertyId)
        .limit(1);

      if (error) {
        console.error('Error checking visit status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, hasVisited: (data?.length || 0) > 0 };
    } catch (error) {
      console.error('Error checking visit status:', error);
      return { success: false, error: 'Failed to check visit status' };
    }
  }

  /**
   * Get visit count for a property (public)
   */
  static async getPropertyVisitCount(propertyId: string): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> {
    try {
      const { count, error } = await supabase
        .from('listing_visits')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', propertyId);

      if (error) {
        console.error('Error getting visit count:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Error getting visit count:', error);
      return { success: false, error: 'Failed to get visit count' };
    }
  }
}

// Hook for React components
export const useVisitService = () => {
  return VisitService;
};
