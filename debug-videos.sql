-- Debug script to check videos in database
-- Run this in Supabase SQL Editor

-- 1. Check if videos column exists and has data
SELECT id, title, videos, 
       array_length(videos, 1) as video_count,
       videos IS NOT NULL as has_videos_field,
       videos <> '{}' as has_video_data
FROM properties 
WHERE videos IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check specific property by ID (replace with your property ID)
SELECT id, title, videos
FROM properties 
WHERE id = 'your-property-id-here';

-- 3. Get all properties with any video data
SELECT id, title, videos
FROM properties 
WHERE videos IS NOT NULL 
  AND array_length(videos, 1) > 0;

-- 4. Check the exact format of your videos data
SELECT id, title, 
       videos,
       videos::text as videos_as_text,
       pg_typeof(videos) as videos_type
FROM properties 
WHERE videos IS NOT NULL 
LIMIT 5;