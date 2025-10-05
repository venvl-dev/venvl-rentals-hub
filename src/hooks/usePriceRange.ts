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
  bookingType?: 'daily' | 'monthly' | 'flexible',
) => {
  // Map flexible to daily for price range calculation
  const effectiveBookingType = bookingType === 'flexible' ? 'daily' : bookingType;
  // Memoize initial state based on booking type
  const initialState = useMemo(() => {
    let max;
    if (bookingType === 'flexible') {
      max = 50000; // Higher max for flexible to accommodate all property types
    } else if (effectiveBookingType === 'monthly') {
      max = 500000;
    } else {
      max = 5000;
    }

    return {
      min: 0,
      max,
      distribution: [],
    };
  }, [bookingType, effectiveBookingType]);

  const [priceRange, setPriceRange] = useState<PriceRange>(initialState);

  // Memoize fallback ranges for better performance
  const fallbackRange = useMemo(() => {
    const cacheKey = `fallback_${bookingType || effectiveBookingType}`;
    if (fallbackCache.has(cacheKey)) {
      return fallbackCache.get(cacheKey)!;
    }

    // Set ranges based on original booking type for better UX
    let min, max;
    if (bookingType === 'flexible') {
      // Flexible should have the widest range to accommodate all property types
      min = 100;
      max = 50000; // Higher max to include converted monthly prices
    } else if (effectiveBookingType === 'monthly') {
      min = 5000;
      max = 500000;
    } else {
      min = 100;
      max = 5000;
    }

    const range = { min, max, distribution: [] };
    fallbackCache.set(cacheKey, range);
    return range;
  }, [bookingType, effectiveBookingType]);

  const [loading, setLoading] = useState(true);
  const prevBookingTypeRef = useRef<string | undefined>();
  const realtimeSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchPriceData = async () => {
      try {
        // Check cache first
        const cacheKey = effectiveBookingType || 'default';
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
        // No limit to ensure we get the full price range
        let { data, error } = await supabase
          .from('properties')
          .select(
            'price_per_night, daily_price, monthly_price, rental_type',
          )
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .order('price_per_night', { ascending: false }); // Order by highest price first

        // If authenticated query returns insufficient data due to RLS policies,
        // use anonymous client for price range calculation
        if ((error || !data || data.length < 3) && effectiveBookingType) {
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
              .eq('approval_status', 'approved')
              .order('price_per_night', { ascending: false }); // Order by highest price first

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
            effectiveBookingType
          });
          if (mounted && !data) {
            setPriceRange(fallbackRange);
            setLoading(false);
          }
          return;
        }

        console.log(`Fetched ${data.length} properties for price range calculation (${effectiveBookingType})`);

        // Debug: show sample of fetched data
        if (data.length > 0) {
          console.log('Sample properties:', data.slice(0, 3).map(p => ({
            rental_type: p.rental_type,
            price_per_night: p.price_per_night,
            daily_price: p.daily_price,
            monthly_price: p.monthly_price
          })));
        }


        // Extract prices based on booking type
        const prices: number[] = [];

        data.forEach((property) => {
          try {
            // Special handling for flexible booking type - include both daily and monthly ranges
            if (bookingType === 'flexible') {
              // Include ALL available prices for maximum range

              // 1. Daily/per-night prices - include all variations
              if (property.price_per_night && typeof property.price_per_night === 'number' && property.price_per_night > 0) {
                prices.push(property.price_per_night);
              }

              if (property.daily_price && typeof property.daily_price === 'number' && property.daily_price > 0) {
                prices.push(property.daily_price);
              }

              // 2. Monthly prices (keep as monthly for wider range)
              if (
                property.monthly_price &&
                typeof property.monthly_price === 'number' &&
                property.monthly_price > 0
              ) {
                // For flexible, include monthly prices as-is to get true maximum range
                prices.push(property.monthly_price);
              }

              // 3. Also include converted values for comparison
              if (
                property.monthly_price &&
                typeof property.monthly_price === 'number' &&
                property.monthly_price > 0
              ) {
                // Convert monthly to daily equivalent too
                const dailyEquivalent = Math.round(property.monthly_price / 30);
                if (dailyEquivalent > 0) {
                  prices.push(dailyEquivalent);
                }
              }
            } else if (effectiveBookingType === 'daily') {
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
            } else if (effectiveBookingType === 'monthly') {
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
          console.warn(`No price data found for booking type: ${effectiveBookingType}. Using fallback range.`, {
            totalProperties: data?.length || 0,
            effectiveBookingType,
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

        console.log(`Price range calculated from ${prices.length} valid prices:`, {
          min: actualMin,
          max: actualMax,
          bookingType,
          effectiveBookingType,
          samplePrices: prices.slice(0, 10).sort((a, b) => b - a) // Show top 10 highest prices
        });

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
          prevBookingTypeRef.current = effectiveBookingType;
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
  }, [effectiveBookingType]);

  return {
    priceRange: priceRange.min >= 0 && priceRange.max > 0 ? priceRange : null, // Only return valid ranges
    loading,
  };
};