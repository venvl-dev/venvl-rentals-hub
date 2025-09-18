-- Check the exact format of videos in database
SELECT 
    id,
    title,
    videos,
    videos::text as videos_as_text,
    array_length(videos, 1) as video_count,
    videos[1] as first_video_url
FROM properties 
WHERE videos IS NOT NULL 
  AND videos != '{}' 
  AND array_length(videos, 1) > 0
LIMIT 5;