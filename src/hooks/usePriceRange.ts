import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let mounted = true;

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

        // Extract prices based on booking type
        const prices: number[] = [];
        
        data.forEach(property => {
          if (bookingType === 'daily') {
            // For daily booking, use daily_price or fallback to price_per_night
            const dailyPrice = property.daily_price || property.price_per_night;
            if (dailyPrice > 0) prices.push(dailyPrice);
          } else if (bookingType === 'monthly') {
            // For monthly booking, use monthly_price directly
            if (property.monthly_price > 0) {
              prices.push(property.monthly_price);
            }
          } else {
            // Default: include all available prices (convert monthly to daily for comparison)
            if (property.price_per_night > 0) prices.push(property.price_per_night);
            if (property.daily_price > 0) prices.push(property.daily_price);
            if (property.monthly_price > 0) prices.push(Math.round(property.monthly_price / 30));
          }
        });

        console.log('Extracted prices:', prices);

        if (prices.length === 0) {
          console.log('No prices found, using fallback range');
          setPriceRange({
            min: 0,
            max: 10000,
            distribution: []
          });
          return;
        }

        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));

        console.log('Calculated price range:', { min, max });

        if (mounted) {
          setPriceRange({
            min,
            max,
            distribution: []
          });
        }
      } catch (error) {
        console.error('Price range fetch error:', error);
        if (mounted) {
          setPriceRange({
            min: 0,
            max: 10000,
            distribution: []
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPriceData();
    return () => { mounted = false; };
  }, [bookingType]); // Add bookingType as dependency

  return { priceRange, loading };
}; 
