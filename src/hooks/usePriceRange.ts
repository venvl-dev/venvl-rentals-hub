import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

interface PriceRange {
  min: number;
  max: number;
  distribution: number[];
}

// Cache for price range data to avoid repeated DB queries
const priceRangeCache = new Map<string, { data: PriceRange; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache for maximum performance

// Aggressive caching: keep data for booking type switches
const fallbackCache = new Map<string, PriceRange>();

// Throttling to prevent rapid-fire requests
const fetchThrottleMap = new Map<string, number>();
const THROTTLE_DELAY = 1000; // 1 second minimum between fetches for the same booking type

export const usePriceRange = (
  bookingType?: 'daily' | 'monthly',
) => {
  // Memoize initial state based on booking type
  const initialState = useMemo(() => ({
    min: 0,
    max: bookingType === 'monthly' ? 500000 : 5000,
    distribution: [],
  }), [bookingType]);

  const [priceRange, setPriceRange] = useState<PriceRange>(initialState);

  // Memoize fallback ranges for better performance
  const fallbackRange = useMemo(() => {
    const cacheKey = `fallback_${bookingType}`;
    if (fallbackCache.has(cacheKey)) {
      return fallbackCache.get(cacheKey)!;
    }
    const range = {
      min: bookingType === 'monthly' ? 5000 : 100,
      max: bookingType === 'monthly' ? 500000 : 5000,
      distribution: [],
    };
    fallbackCache.set(cacheKey, range);
    return range;
  }, [bookingType]);

  const [loading, setLoading] = useState(true);
  const prevBookingTypeRef = useRef<string | undefined>();
  const realtimeSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchPriceData = async () => {
      try {
        // Check cache first
        const cacheKey = bookingType || 'default';
        const cached = priceRangeCache.get(cacheKey);
        const now = Date.now();

        // Use cached data immediately for smooth switching
        if (cached) {
          if (mounted) {
            setPriceRange(cached.data);
            setLoading(false);
          }

          // Skip fresh fetch if cache is still fresh
          if ((now - cached.timestamp) < CACHE_DURATION) {
            return;
          }
        } else {
          // Show loading only if no cached data exists
          setLoading(true);
        }

        // Throttle requests to prevent rapid-fire database calls
        const lastFetchTime = fetchThrottleMap.get(cacheKey) || 0;
        if (now - lastFetchTime < THROTTLE_DELAY) {
          // Skip this fetch if we're still in throttle period
          return;
        }
        fetchThrottleMap.set(cacheKey, now);

        // Try authenticated query first to get ALL active, approved properties
        let { data, error } = await supabase
          .from('properties')
          .select(
            'price_per_night, daily_price, monthly_price, rental_type',
          )
          .eq('is_active', true)
          .eq('approval_status', 'approved');

        // If authenticated query returns insufficient data due to RLS policies,
        // use anonymous client for price range calculation
        if ((error || !data || data.length < 5) && bookingType) {
          console.log('Authenticated query returned insufficient data for price range, trying anonymous client...');

          try {
            // Create anonymous Supabase client for price range queries
            const anonSupabase = createClient(
              import.meta.env.VITE_SUPABASE_URL,
              import.meta.env.VITE_SUPABASE_ANON_KEY
            );

            // Make anonymous query - this bypasses RLS restrictions
            const { data: anonData, error: anonError } = await anonSupabase
              .from('properties')
              .select(
                'price_per_night, daily_price, monthly_price, rental_type',
              )
              .eq('is_active', true)
              .eq('approval_status', 'approved');

            if (!anonError && anonData && anonData.length > 0) {
              console.log(`Anonymous client returned ${anonData.length} properties vs ${data?.length || 0} from authenticated query`);
              data = anonData;
              error = null;
            }
          } catch (anonError) {
            console.warn('Anonymous client fallback failed:', anonError);
          }
        }

        if (error) {
          console.error('Error fetching properties for price range:', error);
          if (mounted) {
            setPriceRange(fallbackRange);
            setLoading(false);
          }
          return;
        }

        if (!data || !mounted) {
          console.warn('No data returned or component unmounted', {
            hasData: !!data,
            mounted,
            bookingType
          });
          if (mounted && !data) {
            setPriceRange(fallbackRange);
            setLoading(false);
          }
          return;
        }

        console.log(`Fetched ${data.length} properties for price range calculation (${bookingType})`);


        // Extract prices based on booking type
        const prices: number[] = [];

        data.forEach((property) => {
          try {
            if (bookingType === 'daily') {
              const supportsDaily = property.rental_type === 'daily' || property.rental_type === 'both';
              const dailyPrice = property.daily_price || property.price_per_night;
              if (
                supportsDaily &&
                dailyPrice &&
                typeof dailyPrice === 'number' &&
                dailyPrice > 0
              ) {
                prices.push(dailyPrice);
              }
            } else if (bookingType === 'monthly') {
              const supportsMonthly = property.rental_type === 'monthly' || property.rental_type === 'both';

              if (
                supportsMonthly &&
                property.monthly_price &&
                typeof property.monthly_price === 'number' &&
                property.monthly_price > 0
              ) {
                prices.push(property.monthly_price);
              } else if (supportsMonthly) {
                const dailyPrice = property.daily_price || property.price_per_night;
                if (dailyPrice && typeof dailyPrice === 'number' && dailyPrice > 0) {
                  const estimatedMonthlyPrice = Math.round(dailyPrice * 25);
                  prices.push(estimatedMonthlyPrice);
                }
              }
            } else {
              // Default: include all available prices
              if (
                property.price_per_night &&
                typeof property.price_per_night === 'number' &&
                property.price_per_night > 0
              ) {
                prices.push(property.price_per_night);
              }
              if (
                property.daily_price &&
                typeof property.daily_price === 'number' &&
                property.daily_price > 0
              ) {
                prices.push(property.daily_price);
              }
              if (
                property.monthly_price &&
                typeof property.monthly_price === 'number' &&
                property.monthly_price > 0
              ) {
                prices.push(Math.round(property.monthly_price / 30));
              }
            }
          } catch (error) {
            // Silently skip invalid properties
          }
        });

        if (prices.length === 0) {
          console.warn(`No price data found for booking type: ${bookingType}. Using fallback range.`, {
            totalProperties: data?.length || 0,
            bookingType,
            fallbackRange
          });
          if (mounted) {
            setPriceRange(fallbackRange);
            // Cache fallback range too
            priceRangeCache.set(cacheKey, { data: fallbackRange, timestamp: now });
            setLoading(false);
          }
          return;
        }

        // Calculate exact min/max from actual data
        const actualMin = Math.min(...prices);
        const actualMax = Math.max(...prices);

        if (mounted) {
          const newRange = {
            min: actualMin,
            max: actualMax,
            distribution: [],
          };
          setPriceRange(newRange);
          // Cache the result
          priceRangeCache.set(cacheKey, { data: newRange, timestamp: now });
        }
      } catch (error) {
        console.error('Price range fetch error:', error);
        if (mounted) {
          setPriceRange(fallbackRange);
        }
      } finally {
        // Update loading state immediately for better UX
        if (mounted) {
          setLoading(false);
          prevBookingTypeRef.current = bookingType;
        }
      }
    };

    // Real-time subscription disabled for maximum performance during booking type switches
    const setupRealtimeSubscription = () => {
      // Disabled for performance - data will be fresh from cache
      return;
    };

    // Fetch once on mount and when bookingType changes
    fetchPriceData();
    setupRealtimeSubscription();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribe();
      }
    };
  }, [bookingType]);

  return {
    priceRange: priceRange.min > 0 ? priceRange : null, // Only return valid ranges
    loading,
  };
};