import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';
import { logSecurityEvent } from '@/lib/security';

interface UseDataFetchingOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheKey?: string;
}

interface UseDataFetchingReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

export function useDataFetching<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseDataFetchingOptions = {}
): UseDataFetchingReturn<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheKey
  } = options;

  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache freshness
    const now = Date.now();
    if (!force && cacheKey && (now - lastFetchTime.current) < staleTime) {
      const cached = localStorage.getItem(`cache_${cacheKey}`);
      if (cached) {
        try {
          const parsedData = JSON.parse(cached);
          if (isMountedRef.current) {
            setData(parsedData);
          }
          return;
        } catch {
          // Invalid cache, continue with fetch
        }
      }
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await queryFn();
      
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        lastFetchTime.current = now;

        // Cache the result
        if (cacheKey) {
          try {
            localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(result));
          } catch (cacheError) {
            // Cache failed, continue without caching
          }
        }
      }

      // Log successful data fetch
      await logSecurityEvent('data_fetch_success', 'api', user?.id, true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      
      if (isMountedRef.current) {
        setError(errorMessage);
      }

      await handleError(
        new CustomError(
          'Data fetch failed',
          ErrorCodes.SYSTEM_DATABASE_ERROR,
          'medium'
        ),
        { error: err, userId: user?.id }
      );
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [queryFn, enabled, cacheKey, staleTime, user?.id, ...dependencies]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
    if (cacheKey) {
      try {
        localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(newData));
      } catch {
        // Cache failed, data is still updated in state
      }
    }
  }, [cacheKey]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, refetchOnWindowFocus]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    mutate
  };
}

// Specialized hooks for common patterns
export function useUserProperties(userId?: string) {
  return useDataFetching(
    async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('host_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    [userId],
    {
      enabled: !!userId,
      cacheKey: userId ? `user_properties_${userId}` : undefined,
      refetchOnWindowFocus: true
    }
  );
}

export function useUserBookings(userId?: string) {
  return useDataFetching(
    async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(title, images)
        `)
        .eq('guest_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    [userId],
    {
      enabled: !!userId,
      cacheKey: userId ? `user_bookings_${userId}` : undefined
    }
  );
}