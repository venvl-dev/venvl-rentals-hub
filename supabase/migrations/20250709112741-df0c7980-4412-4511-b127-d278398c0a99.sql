-- Create optimized price range function
CREATE OR REPLACE FUNCTION public.get_price_range(
  booking_type_param TEXT DEFAULT 'daily',
  price_column TEXT DEFAULT 'price_per_night'
)
RETURNS TABLE (
  min_price NUMERIC,
  max_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF booking_type_param = 'daily' THEN
    RETURN QUERY
    SELECT 
      MIN(COALESCE(daily_price, price_per_night)) as min_price,
      MAX(COALESCE(daily_price, price_per_night)) as max_price
    FROM properties 
    WHERE is_active = true 
      AND approval_status = 'approved'
      AND (daily_price > 0 OR price_per_night > 0);
  ELSIF booking_type_param = 'monthly' THEN
    RETURN QUERY
    SELECT 
      MIN(monthly_price) as min_price,
      MAX(monthly_price) as max_price
    FROM properties 
    WHERE is_active = true 
      AND approval_status = 'approved'
      AND monthly_price > 0;
  ELSE
    -- Default: return overall price range
    RETURN QUERY
    SELECT 
      MIN(LEAST(
        COALESCE(price_per_night, 999999),
        COALESCE(daily_price, 999999),
        COALESCE(monthly_price / 30, 999999)
      )) as min_price,
      MAX(GREATEST(
        COALESCE(price_per_night, 0),
        COALESCE(daily_price, 0),
        COALESCE(monthly_price / 30, 0)
      )) as max_price
    FROM properties 
    WHERE is_active = true 
      AND approval_status = 'approved';
  END IF;
END;
$$;