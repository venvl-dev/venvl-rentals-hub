// Example: Add videos using Supabase client
import { supabase } from '@/integrations/supabase/client';

// Function to add videos to a property
async function addVideosToProperty(propertyId, videoUrls) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ 
        videos: videoUrls 
      })
      .eq('id', propertyId)
      .select();

    if (error) {
      console.error('Error adding videos:', error);
      return { success: false, error };
    }

    console.log('Videos added successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: err };
  }
}

// Example usage:
const propertyId = 'your-property-id';
const videos = [
  'https://example.com/property-tour.mp4',
  'https://example.com/kitchen-video.mp4',
  'https://example.com/bedroom-video.mp4'
];

addVideosToProperty(propertyId, videos);

// Alternative: Add videos by property title
async function addVideosByTitle(propertyTitle, videoUrls) {
  const { data, error } = await supabase
    .from('properties')
    .update({ videos: videoUrls })
    .eq('title', propertyTitle)
    .select();

  return { data, error };
}

// Example: Get all properties without videos
async function getPropertiesWithoutVideos() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, videos')
    .or('videos.is.null,videos.eq.{}');
    
  return { data, error };
}