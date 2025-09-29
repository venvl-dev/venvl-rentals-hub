-- Check current rental_type distribution
SELECT rental_type, COUNT(*) as count
FROM properties
GROUP BY rental_type;

-- Show sample properties with their rental types
SELECT id, title, rental_type, monthly_price, daily_price, price_per_night
FROM properties
LIMIT 10;

-- Update some existing properties to have monthly rental type
UPDATE properties
SET
  rental_type = 'monthly',
  monthly_price = CASE
    WHEN price_per_night IS NOT NULL THEN price_per_night * 25 -- Roughly monthly equivalent
    ELSE 15000
  END
WHERE id IN (
  SELECT id FROM properties
  WHERE rental_type = 'daily'
  LIMIT 3
);

-- Check results after update
SELECT rental_type, COUNT(*) as count
FROM properties
GROUP BY rental_type;