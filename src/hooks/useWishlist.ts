import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WishlistService } from '@/lib/wishlistService';
import type {
  AddToWishlistParams,
  RemoveFromWishlistParams,
  GetWishlistParams,
} from '@/types/wishlist';
import { toast } from 'sonner';

/**
 * Hook to fetch user's wishlist
 */
export const useWishlist = (params: GetWishlistParams = {}) => {
  const { listName = 'default', limit = 50, offset = 0 } = params;

  return useQuery({
    queryKey: ['wishlist', listName, limit, offset],
    queryFn: async () => {
      const result = await WishlistService.getWishlist({
        listName,
        limit,
        offset,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch wishlist');
      }

      return result.data || [];
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to check if a property is in the wishlist
 */
export const useIsInWishlist = (
  propertyId: string,
  listName: string = 'default'
) => {
  return useQuery({
    queryKey: ['wishlist-status', propertyId, listName],
    queryFn: async () => {
      const result = await WishlistService.isInWishlist(propertyId, listName);

      if (!result.success) {
        throw new Error(result.error || 'Failed to check wishlist status');
      }

      return result.isInWishlist || false;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Hook to get wishlist count
 */
export const useWishlistCount = (listName?: string) => {
  return useQuery({
    queryKey: ['wishlist-count', listName],
    queryFn: async () => {
      const result = await WishlistService.getWishlistCount(listName);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch wishlist count');
      }

      return result.count || 0;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to add a property to wishlist
 */
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddToWishlistParams) => {
      const result = await WishlistService.addToWishlist(params);

      if (!result.success) {
        throw new Error(result.error || 'Failed to add to wishlist');
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['wishlist', variables.listName || 'default'],
      });
      queryClient.invalidateQueries({
        queryKey: ['wishlist-status', variables.propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: ['wishlist-count'],
      });

      // Show success message only if it's a new addition
      if (data?.is_new) {
        toast.success('Added to wishlist');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add to wishlist');
    },
  });
};

/**
 * Hook to remove a property from wishlist
 */
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RemoveFromWishlistParams) => {
      const result = await WishlistService.removeFromWishlist(params);

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove from wishlist');
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['wishlist', variables.listName || 'default'],
      });
      queryClient.invalidateQueries({
        queryKey: ['wishlist-status', variables.propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: ['wishlist-count'],
      });

      // Show success message only if something was actually deleted
      if (data?.was_deleted) {
        toast.success('Removed from wishlist');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove from wishlist');
    },
  });
};

/**
 * Hook to toggle a property in wishlist (add or remove)
 */
export const useToggleWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddToWishlistParams) => {
      const result = await WishlistService.toggleWishlist(params);

      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle wishlist');
      }

      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['wishlist', variables.listName || 'default'],
      });
      queryClient.invalidateQueries({
        queryKey: ['wishlist-status', variables.propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: ['wishlist-count'],
      });

      // Show appropriate message
      if (data.isInWishlist) {
        toast.success('Added to wishlist');
      } else {
        toast.success('Removed from wishlist');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update wishlist');
    },
  });
};
