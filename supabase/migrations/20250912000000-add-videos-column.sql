-- Add videos column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- Add comment to describe the column
COMMENT ON COLUMN properties.videos IS 'Array of video URLs for the property';