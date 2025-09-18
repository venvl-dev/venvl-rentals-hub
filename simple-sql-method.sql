-- Simplest SQL method for adding videos
-- Run in Supabase SQL Editor

-- Method 1: Direct string assignment
UPDATE properties 
SET videos = '["https://www.w3schools.com/html/mov_bbb.mp4"]'
WHERE id = 'your-property-id-here';

-- Method 2: If above doesn't work, try this
UPDATE properties 
SET videos = videos || '{"https://www.w3schools.com/html/mov_bbb.mp4"}'
WHERE id = 'your-property-id-here';

-- Check what happened
SELECT id, title, videos FROM properties WHERE videos IS NOT NULL LIMIT 5;