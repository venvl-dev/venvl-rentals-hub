-- First, check current property distribution
SELECT rental_type, COUNT(*) as count
FROM properties
WHERE is_active = true AND approval_status = 'approved'
GROUP BY rental_type;

-- Show a sample of current properties
SELECT id, title, rental_type, monthly_price, daily_price, price_per_night
FROM properties
WHERE is_active = true AND approval_status = 'approved'
LIMIT 5;

-- Update some existing daily properties to become monthly properties
-- Convert the first 3-5 daily properties to monthly
UPDATE properties
SET
  rental_type = 'monthly',
  monthly_price = CASE
    -- If daily_price exists, use it * 25 for monthly
    WHEN daily_price IS NOT NULL AND daily_price > 0 THEN ROUND(daily_price * 25)
    -- If price_per_night exists, use it * 25 for monthly
    WHEN price_per_night IS NOT NULL AND price_per_night > 0 THEN ROUND(price_per_night * 25)
    -- Default monthly price if no daily price available
    ELSE 15000
  END
WHERE rental_type = 'daily'
  AND is_active = true
  AND approval_status = 'approved'
  AND id IN (
    SELECT id FROM properties
    WHERE rental_type = 'daily'
      AND is_active = true
      AND approval_status = 'approved'
    LIMIT 5
  );

-- Create some properties that support both daily and monthly (flexible)
UPDATE properties
SET
  rental_type = 'both',
  monthly_price = CASE
    WHEN daily_price IS NOT NULL AND daily_price > 0 THEN ROUND(daily_price * 25)
    WHEN price_per_night IS NOT NULL AND price_per_night > 0 THEN ROUND(price_per_night * 25)
    ELSE 18000
  END
WHERE rental_type = 'daily'
  AND is_active = true
  AND approval_status = 'approved'
  AND id IN (
    SELECT id FROM properties
    WHERE rental_type = 'daily'
      AND is_active = true
      AND approval_status = 'approved'
    LIMIT 3 OFFSET 5  -- Skip the first 5 we already updated to monthly-only
  );

-- Check results after updates
SELECT
  rental_type,
  COUNT(*) as count,
  AVG(monthly_price) as avg_monthly_price,
  MIN(monthly_price) as min_monthly_price,
  MAX(monthly_price) as max_monthly_price
FROM properties
WHERE is_active = true
  AND approval_status = 'approved'
  AND rental_type IN ('monthly', 'both')
GROUP BY rental_type;

-- Show sample monthly/both properties
SELECT id, title, rental_type, daily_price, monthly_price, is_active, approval_status
FROM properties
WHERE rental_type IN ('monthly', 'both')
  AND is_active = true
  AND approval_status = 'approved'
LIMIT 10;