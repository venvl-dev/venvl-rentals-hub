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
        
        let priceColumn = 'price_per_night';
        if (bookingType === 'daily') {
          priceColumn = 'COALESCE(daily_price, price_per_night)';
        } else if (bookingType === 'monthly') {
          priceColumn = 'monthly_price';
        }

        const { data, error } = await supabase
          .rpc('get_price_range', {
            booking_type_param: bookingType,
            price_column: priceColumn
          });

        if (error) {
          // Fallback to simpler query if RPC fails
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('properties')
            .select('price_per_night, daily_price, monthly_price')
            .eq('is_active', true)
            .eq('approval_status', 'approved');

          if (fallbackError || !fallbackData || !mounted) {
            throw fallbackError || new Error('No data returned');
          }

          // Extract prices based on booking type
          const prices: number[] = [];
          
          fallbackData.forEach(property => {
            if (bookingType === 'daily') {
              const dailyPrice = property.daily_price || property.price_per_night;
              if (dailyPrice > 0) prices.push(dailyPrice);
            } else if (bookingType === 'monthly') {
              if (property.monthly_price > 0) {
                prices.push(property.monthly_price);
              }
            } else {
              if (property.price_per_night > 0) prices.push(property.price_per_night);
              if (property.daily_price > 0) prices.push(property.daily_price);
              if (property.monthly_price > 0) prices.push(Math.round(property.monthly_price / 30));
            }
          });

          if (prices.length === 0) {
            setPriceRange({
              min: 0,
              max: 10000,
              distribution: []
            });
            return;
          }

          const min = Math.floor(Math.min(...prices));
          const max = Math.ceil(Math.max(...prices));

          if (mounted) {
            setPriceRange({
              min,
              max,
              distribution: []
            });
          }
          return;
        }

        if (!data || !mounted) return;

        const min = Math.floor(data.min_price || 0);
        const max = Math.ceil(data.max_price || 10000);

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
