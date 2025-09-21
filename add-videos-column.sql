-- Add videos column to properties table
ALTER TABLE properties
ADD COLUMN videos text[] DEFAULT '{}';

-- Add comment to document the column
COMMENT ON COLUMN properties.videos IS 'Array of video URLs for property walkthroughs and tours';