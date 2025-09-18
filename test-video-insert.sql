-- Test video insertion
-- Run this in Supabase SQL Editor

-- First, let's get a property ID to work with
SELECT id, title FROM properties LIMIT 5;

-- Then use one of those IDs in this update (replace 'PROPERTY_ID_HERE')
UPDATE properties 
SET videos = ARRAY[
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
]
WHERE id = 'PROPERTY_ID_HERE';

-- Verify it was inserted correctly
SELECT id, title, videos, array_length(videos, 1) as video_count
FROM properties 
WHERE id = 'PROPERTY_ID_HERE';