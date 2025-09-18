-- Run this in Supabase SQL Editor to add videos column

-- Add videos column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- Add comment to describe the column
COMMENT ON COLUMN properties.videos IS 'Array of video URLs for the property';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'videos';

-- Test by adding a video to the first property
UPDATE properties 
SET videos = ARRAY['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']
WHERE id = (SELECT id FROM properties LIMIT 1)::text;

-- Check if it worked
SELECT id, title, videos 
FROM properties 
WHERE videos IS NOT NULL AND array_length(videos, 1) > 0 
LIMIT 3;