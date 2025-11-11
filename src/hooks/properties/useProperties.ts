import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchProperties } from '@/lib/api/properties/propertiesApi';
import { useMemo } from 'react';

/**
 * Custom hook for fetching properties with infinite scroll support
 * Uses React Query's useInfiniteQuery for automatic caching and pagination
 *
 * @returns Object containing:
 * - properties: Flattened array of all loaded properties
 * - isLoading: Initial loading state
 * - isFetchingNextPage: Loading state for subsequent pages
 * - fetchNextPage: Function to load next page
 * - hasNextPage: Boolean indicating if more pages exist
 * - error: Error object if fetch failed
 * - totalCount: Total number of properties available
 */
export function useInfiniteProperties() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['properties', 'infinite'],
    queryFn: ({ pageParam = 0 }) => fetchProperties({ pageParam, limit: 12 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Cache data for 30 minutes (formerly cacheTime)
  });

  // Flatten all pages into a single properties array
  const properties = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.properties);
  }, [data?.pages]);

  // Get total count from the first page
  const totalCount = useMemo(() => {
    return data?.pages?.[0]?.totalCount ?? 0;
  }, [data?.pages]);

  return {
    properties,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
    totalCount,
    refetch,
  };
}
