-- Add is_pending column to profiles table
-- This column tracks users who are in a pending state (e.g., pending host approval)

ALTER TABLE profiles 
ADD COLUMN is_pending BOOLEAN DEFAULT false;

-- Add comment to document the column purpose
COMMENT ON COLUMN profiles.is_pending IS 'Indicates if user is in a pending state (e.g., pending host approval)';

-- Update existing users to have is_pending = false by default
UPDATE profiles 
SET is_pending = false 
WHERE is_pending IS NULL;

-- Add index for better query performance when filtering by pending status
CREATE INDEX idx_profiles_is_pending ON profiles(is_pending) WHERE is_pending = true;