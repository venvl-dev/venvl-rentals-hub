-- First, run the migration to add the videos column (if not already done)
-- This should be run in Supabase SQL Editor

-- Example 1: Add videos to a specific property by ID
UPDATE properties 
SET videos = ARRAY[
  'https://example.com/property-tour.mp4',
  'https://example.com/kitchen-video.mp4',
  'https://example.com/bedroom-tour.mp4'
]
WHERE id = 'your-property-id-here';

-- Example 2: Add videos to a property by title
UPDATE properties 
SET videos = ARRAY[
  'https://storage.googleapis.com/your-bucket/modern-apartment-tour.mp4',
  'https://cdn.example.com/apartment-amenities.mp4'
]
WHERE title = 'Modern Downtown Apartment';

-- Example 3: Add a single video
UPDATE properties 
SET videos = ARRAY['https://example.com/single-video.mp4']
WHERE id = 'property-id';

-- Example 4: Add videos to multiple properties at once
UPDATE properties 
SET videos = ARRAY[
  'https://example.com/standard-tour.mp4'
]
WHERE property_type = 'Apartment' AND city = 'Cairo';

-- Check if videos were added successfully
SELECT id, title, videos 
FROM properties 
WHERE videos IS NOT NULL AND array_length(videos, 1) > 0;