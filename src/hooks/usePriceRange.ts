import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PriceRange {
  min: number;
  max: number;
  distribution: number[];
}

export const usePriceRange = (bookingType?: 'daily' | 'monthly') => {
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: 0,
    max: 10000,
    distribution: []
  });
  const [loading, setLoading] = useState(true);
  const prevBookingTypeRef = useRef<string | undefined>();

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchPriceData = async () => {
      try {
        setLoading(true);
        console.log('Fetching price range for booking type:', bookingType);
        
        // Use direct query instead of RPC for better reliability
        const { data, error } = await supabase
          .from('properties')
          .select('price_per_night, daily_price, monthly_price')
          .eq('is_active', true)
          .eq('approval_status', 'approved');

        if (error || !data || !mounted) {
          console.error('Error fetching properties:', error);
          return;
        }

        console.log('Fetched properties data:', data.length, 'properties');

        // Extract prices based on booking type with better error handling
        const prices: number[] = [];
        
        data.forEach(property => {
          try {
            if (bookingType === 'daily') {
              // For daily booking, use daily_price or fallback to price_per_night
              const dailyPrice = property.daily_price || property.price_per_night;
              if (dailyPrice && typeof dailyPrice === 'number' && dailyPrice > 0) {
                prices.push(dailyPrice);
              }
            } else if (bookingType === 'monthly') {
              // For monthly booking, use monthly_price directly
              if (property.monthly_price && typeof property.monthly_price === 'number' && property.monthly_price > 0) {
                prices.push(property.monthly_price);
              }
            } else {
              // Default: include all available prices (convert monthly to daily for comparison)
              if (property.price_per_night && typeof property.price_per_night === 'number' && property.price_per_night > 0) {
                prices.push(property.price_per_night);
              }
              if (property.daily_price && typeof property.daily_price === 'number' && property.daily_price > 0) {
                prices.push(property.daily_price);
              }
              if (property.monthly_price && typeof property.monthly_price === 'number' && property.monthly_price > 0) {
                prices.push(Math.round(property.monthly_price / 30));
              }
            }
          } catch (error) {
            console.warn('Error processing property price:', property, error);
          }
        });

        console.log('Extracted prices:', prices);

        if (prices.length === 0) {
          console.log('No prices found, using fallback range');
          const fallbackRange = {
            min: bookingType === 'monthly' ? 1000 : 50,
            max: bookingType === 'monthly' ? 20000 : 2000,
            distribution: []
          };
          
          if (mounted) {
            setPriceRange(fallbackRange);
          }
          return;
        }

        // Calculate min/max with some padding for better UX
        const rawMin = Math.min(...prices);
        const rawMax = Math.max(...prices);
        
        // Add some padding to make the range more user-friendly
        const padding = (rawMax - rawMin) * 0.05; // 5% padding
        const min = Math.max(0, Math.floor(rawMin - padding));
        const max = Math.ceil(rawMax + padding);

        console.log('Calculated price range:', { min, max, rawMin, rawMax });

        if (mounted) {
          setPriceRange({
            min,
            max,
            distribution: [] // Could be enhanced later with histogram data
          });
        }
      } catch (error) {
        console.error('Price range fetch error:', error);
        if (mounted) {
          // Fallback range based on booking type
          setPriceRange({
            min: bookingType === 'monthly' ? 1000 : 50,
            max: bookingType === 'monthly' ? 20000 : 2000,
            distribution: []
          });
        }
      } finally {
        // Add a small delay to prevent rapid state changes
        timeoutId = setTimeout(() => {
          if (mounted) {
            setLoading(false);
            prevBookingTypeRef.current = bookingType;
          }
        }, 100);
      }
    };

    // Only fetch if booking type actually changed or it's the first load
    if (prevBookingTypeRef.current !== bookingType) {
      fetchPriceData();
    }

    return () => { 
      mounted = false; 
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [bookingType]);

  return { 
    priceRange: priceRange.min > 0 ? priceRange : null, // Only return valid ranges
    loading 
  };
}; 
