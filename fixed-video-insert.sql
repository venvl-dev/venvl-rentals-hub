-- Fixed video insertion SQL
-- Run these commands one by one

-- Step 1: Check your properties
SELECT id, title FROM properties LIMIT 5;

-- Step 2: Add video using proper PostgreSQL array syntax
-- Replace 'YOUR_PROPERTY_ID_HERE' with actual property ID
UPDATE properties 
SET videos = '{"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}'::text[]
WHERE id = 'YOUR_PROPERTY_ID_HERE';

-- Alternative syntax (if above doesn't work):
-- UPDATE properties 
-- SET videos = ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']
-- WHERE id = 'YOUR_PROPERTY_ID_HERE';

-- Step 3: Verify it worked
SELECT id, title, videos, array_length(videos, 1) as video_count
FROM properties 
WHERE videos IS NOT NULL AND videos != '{}';

-- Step 4: Test with a shorter URL if the long one is problematic
UPDATE properties 
SET videos = '{"https://www.w3schools.com/html/mov_bbb.mp4"}'::text[]
WHERE id = 'YOUR_PROPERTY_ID_HERE';