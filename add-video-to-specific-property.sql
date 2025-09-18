-- Add video to the specific property showing in console
-- Property ID: 99153199-5ff7-48da-ba18-557b4574a2e5
-- Title: "Apartment with Sea Balcony"

-- Method 1: Try simple JSON format
UPDATE properties 
SET videos = '["https://www.w3schools.com/html/mov_bbb.mp4"]'
WHERE id = '99153199-5ff7-48da-ba18-557b4574a2e5';

-- Check if it worked
SELECT id, title, videos, array_length(videos, 1) as count
FROM properties 
WHERE id = '99153199-5ff7-48da-ba18-557b4574a2e5';

-- If the above doesn't work, try this alternative:
-- UPDATE properties 
-- SET videos = ARRAY['https://www.w3schools.com/html/mov_bbb.mp4']::text[]
-- WHERE id = '99153199-5ff7-48da-ba18-557b4574a2e5';