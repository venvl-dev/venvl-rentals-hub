-- Migration: Add Guest ID Verification Fields to Bookings Table
-- Created: 2025-01-15
-- Description: Adds support for tracking adults/children counts and storing ID documents

-- Step 1: Add adults and children columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS adults integer,
ADD COLUMN IF NOT EXISTS children integer DEFAULT 0;

-- Step 2: Add ID verification columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS guest_id_documents jsonb,
ADD COLUMN IF NOT EXISTS id_verification_status text DEFAULT 'pending'
  CHECK (id_verification_status IN ('pending', 'verified', 'rejected'));

-- Step 3: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_id_verification
  ON bookings(id_verification_status);

CREATE INDEX IF NOT EXISTS idx_bookings_adults
  ON bookings(adults);

-- Step 4: Update existing bookings to set adults = guests where adults is null
UPDATE bookings
SET adults = guests
WHERE adults IS NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN bookings.adults IS
  'Number of adult guests (ages 13+) in the booking';

COMMENT ON COLUMN bookings.children IS
  'Number of children (ages 0-12) in the booking';

COMMENT ON COLUMN bookings.guest_id_documents IS
  'JSON object containing URLs to uploaded ID documents:
   {
     "main_guest": "url",
     "additional_guests": ["url1", "url2"],
     "uploaded_at": "timestamp"
   }';

COMMENT ON COLUMN bookings.id_verification_status IS
  'Status of ID verification: pending (uploaded awaiting review), verified (approved), rejected (needs re-upload)';

-- Step 6: Add constraint to ensure adults + children = guests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_guest_counts'
    AND conrelid = 'bookings'::regclass
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT check_guest_counts
    CHECK (adults IS NULL OR (adults + COALESCE(children, 0) = guests));
  END IF;
END $$;
