-- Migration: Create Storage Policies for Guest ID Documents
-- Created: 2025-01-15
-- Description: Sets up Row Level Security policies for the booking-documents bucket

-- NOTE: Storage policies must be created through the Supabase Dashboard UI or using service role
-- If running in SQL Editor fails with "must be owner of table objects",
-- use the Supabase Dashboard Storage Policies UI instead

-- Step 1: Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "Guests can upload IDs for their bookings" ON storage.objects;
DROP POLICY IF EXISTS "Guests can read their own IDs" ON storage.objects;
DROP POLICY IF EXISTS "Admins and hosts can read guest IDs" ON storage.objects;
DROP POLICY IF EXISTS "Guests can update their own IDs" ON storage.objects;
DROP POLICY IF EXISTS "Guests can delete their own IDs" ON storage.objects;

-- Step 3: Policy for guests to upload IDs for their own bookings
CREATE POLICY "Guests can upload IDs for their bookings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booking-documents'
  AND (storage.foldername(name))[1] = 'guest-ids'
  AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id::text = (storage.foldername(name))[2]
    AND bookings.guest_id = auth.uid()
  )
);

-- Step 4: Policy for guests to read their own uploaded IDs
CREATE POLICY "Guests can read their own IDs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'booking-documents'
  AND (storage.foldername(name))[1] = 'guest-ids'
  AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id::text = (storage.foldername(name))[2]
    AND bookings.guest_id = auth.uid()
  )
);

-- Step 5: Policy for admins and property hosts to read all guest IDs
CREATE POLICY "Admins and hosts can read guest IDs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'booking-documents'
  AND (storage.foldername(name))[1] = 'guest-ids'
  AND (
    -- User is super admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
    OR
    -- User is the property host
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON p.id = b.property_id
      WHERE b.id::text = (storage.foldername(name))[2]
      AND p.host_id = auth.uid()
    )
  )
);

-- Step 6: Policy for guests to update/delete their IDs (optional - for re-upload)
CREATE POLICY "Guests can update their own IDs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'booking-documents'
  AND (storage.foldername(name))[1] = 'guest-ids'
  AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id::text = (storage.foldername(name))[2]
    AND bookings.guest_id = auth.uid()
  )
);

CREATE POLICY "Guests can delete their own IDs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'booking-documents'
  AND (storage.foldername(name))[1] = 'guest-ids'
  AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id::text = (storage.foldername(name))[2]
    AND bookings.guest_id = auth.uid()
  )
);

-- Step 7: Add comments
COMMENT ON POLICY "Guests can upload IDs for their bookings" ON storage.objects IS
  'Allows authenticated guests to upload ID documents only for bookings they own';

COMMENT ON POLICY "Guests can read their own IDs" ON storage.objects IS
  'Allows guests to view their own uploaded ID documents';

COMMENT ON POLICY "Admins and hosts can read guest IDs" ON storage.objects IS
  'Allows super admins and property hosts to view guest ID documents for verification';
