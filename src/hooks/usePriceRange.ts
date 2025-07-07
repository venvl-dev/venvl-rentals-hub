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
        
        const { data, error } = await supabase
          .from('properties')
          .select('price_per_night, daily_price, monthly_price')
          .eq('is_active', true)
          .eq('approval_status', 'approved');

        if (error || !data || !mounted) return;

        // Extract prices based on booking type
        const prices: number[] = [];
        
        data.forEach(property => {
          if (bookingType === 'daily') {
            // For daily booking, use daily_price or fallback to price_per_night
            const dailyPrice = property.daily_price || property.price_per_night;
            if (dailyPrice > 0) prices.push(dailyPrice);
          } else if (bookingType === 'monthly') {
            // For monthly booking, use monthly_price (convert to daily equivalent for comparison)
            if (property.monthly_price > 0) {
              prices.push(Math.round(property.monthly_price / 30));
            }
          } else {
            // Default: include all available prices
            if (property.price_per_night > 0) prices.push(property.price_per_night);
            if (property.daily_price > 0) prices.push(property.daily_price);
            if (property.monthly_price > 0) prices.push(Math.round(property.monthly_price / 30));
          }
        });

        if (prices.length === 0) {
          // Fallback to default range if no prices found
          setPriceRange({
            min: 0,
            max: 10000,
            distribution: []
          });
          return;
        }

        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));

        // Create price distribution for histogram
        const buckets = 40;
        const bucketSize = (max - min) / buckets;
        const distribution = Array(buckets).fill(0);

        prices.forEach(price => {
          const index = Math.min(Math.floor((price - min) / bucketSize), buckets - 1);
          distribution[index]++;
        });

        // Normalize to percentages
        const maxCount = Math.max(...distribution);
        const normalizedDistribution = distribution.map(count => 
          maxCount > 0 ? (count / maxCount) * 100 : 0
        );

        if (mounted) {
          setPriceRange({
            min,
            max,
            distribution: normalizedDistribution
          });
        }
      } catch (error) {
        console.error('Price range fetch error:', error);
        // Set fallback range on error
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