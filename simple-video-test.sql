-- Simple video test - run these one by one

-- Step 1: First, see what properties you have
SELECT id, title FROM properties LIMIT 5;

-- Step 2: Copy one of the IDs from above and use it here
-- Replace 'PASTE_PROPERTY_ID_HERE' with an actual ID from step 1
UPDATE properties 
SET videos = ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']
WHERE id = 'PASTE_PROPERTY_ID_HERE';

-- Step 3: Verify it worked
SELECT id, title, videos, array_length(videos, 1) as video_count
FROM properties 
WHERE videos IS NOT NULL AND array_length(videos, 1) > 0;