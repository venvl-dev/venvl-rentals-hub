import { supabase } from '@/integrations/supabase/client';
import type {
  AddToWishlistParams,
  RemoveFromWishlistParams,
  GetWishlistParams,
  WishlistProperty,
  AddToWishlistResponse,
  RemoveFromWishlistResponse,
} from '@/types/wishlist';

export class WishlistService {
  /**
   * Add a property to the user's wishlist
   * This operation is idempotent - duplicate adds will not create new entries
   */
  static async addToWishlist(params: AddToWishlistParams): Promise<{
    success: boolean;
    data?: AddToWishlistResponse;
    error?: string;
  }> {
    try {
      const { propertyId, listName = 'default', actionSource } = params;

      // Call the database function
      const { data, error } = await supabase.rpc('add_to_wishlist', {
        target_property_id: propertyId,
        p_list_name: listName,
        p_action_source: actionSource,
      });

      if (error) {
        console.error('Error adding to wishlist:', error);
        return {
          success: false,
          error: error.message || 'Failed to add property to wishlist',
        };
      }

      return {
        success: true,
        data: data as AddToWishlistResponse,
      };
    } catch (error) {
      console.error('Exception adding to wishlist:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Remove a property from the user's wishlist
   */
  static async removeFromWishlist(params: RemoveFromWishlistParams): Promise<{
    success: boolean;
    data?: RemoveFromWishlistResponse;
    error?: string;
  }> {
    try {
      const { propertyId, listName = 'default' } = params;

      // Call the database function
      const { data, error } = await supabase.rpc('remove_from_wishlist', {
        target_property_id: propertyId,
        p_list_name: listName,
      });

      if (error) {
        console.error('Error removing from wishlist:', error);
        return {
          success: false,
          error: error.message || 'Failed to remove property from wishlist',
        };
      }

      return {
        success: true,
        data: data as RemoveFromWishlistResponse,
      };
    } catch (error) {
      console.error('Exception removing from wishlist:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get the user's wishlist with property details
   */
  static async getWishlist(params: GetWishlistParams = {}): Promise<{
    success: boolean;
    data?: WishlistProperty[];
    error?: string;
  }> {
    try {
      const { listName = 'default', limit = 50, offset = 0 } = params;

      // Call the database function
      const { data, error } = await supabase.rpc('get_user_wishlist', {
        p_list_name: listName,
        limit_count: limit,
        offset_count: offset,
      });

      if (error) {
        console.error('Error fetching wishlist:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch wishlist',
        };
      }

      return {
        success: true,
        data: data as WishlistProperty[],
      };
    } catch (error) {
      console.error('Exception fetching wishlist:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if a property is in the user's wishlist
   */
  static async isInWishlist(
    propertyId: string,
    listName: string = 'default'
  ): Promise<{
    success: boolean;
    isInWishlist?: boolean;
    error?: string;
  }> {
    try {
      // Call the database function
      const { data, error } = await supabase.rpc('is_in_wishlist', {
        target_property_id: propertyId,
        p_list_name: listName,
      });

      if (error) {
        console.error('Error checking wishlist status:', error);
        return {
          success: false,
          error: error.message || 'Failed to check wishlist status',
        };
      }

      return {
        success: true,
        isInWishlist: data as boolean,
      };
    } catch (error) {
      console.error('Exception checking wishlist status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get the total count of items in wishlist(s)
   */
  static async getWishlistCount(listName?: string): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> {
    try {
      // Call the database function
      const { data, error } = await supabase.rpc('get_wishlist_count', {
        p_list_name: listName || null,
      });

      if (error) {
        console.error('Error fetching wishlist count:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch wishlist count',
        };
      }

      return {
        success: true,
        count: data as number,
      };
    } catch (error) {
      console.error('Exception fetching wishlist count:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Toggle property in wishlist (add if not present, remove if present)
   */
  static async toggleWishlist(params: AddToWishlistParams): Promise<{
    success: boolean;
    isInWishlist?: boolean;
    error?: string;
  }> {
    try {
      const { propertyId, listName = 'default', actionSource } = params;

      // First check if it's in the wishlist
      const checkResult = await this.isInWishlist(propertyId, listName);

      if (!checkResult.success) {
        return {
          success: false,
          error: checkResult.error,
        };
      }

      // Toggle based on current status
      if (checkResult.isInWishlist) {
        const removeResult = await this.removeFromWishlist({
          propertyId,
          listName,
        });

        return {
          success: removeResult.success,
          isInWishlist: false,
          error: removeResult.error,
        };
      } else {
        const addResult = await this.addToWishlist({
          propertyId,
          listName,
          actionSource,
        });

        return {
          success: addResult.success,
          isInWishlist: true,
          error: addResult.error,
        };
      }
    } catch (error) {
      console.error('Exception toggling wishlist:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// React hook for easier usage in components
export const useWishlistService = () => {
  return WishlistService;
};
