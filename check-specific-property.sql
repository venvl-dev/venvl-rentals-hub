-- Check the specific property that's showing empty array
SELECT 
    id,
    title,
    videos,
    videos::text as videos_as_text,
    array_length(videos, 1) as video_count,
    (videos IS NULL) as is_null,
    (videos = '{}') as is_empty_array
FROM properties 
WHERE id = '99153199-5ff7-48da-ba18-557b4574a2e5';

-- Also check all properties with any video data
SELECT 
    id,
    title,
    videos,
    array_length(videos, 1) as video_count
FROM properties 
WHERE videos IS NOT NULL 
  AND videos != '{}' 
  AND array_length(videos, 1) > 0;