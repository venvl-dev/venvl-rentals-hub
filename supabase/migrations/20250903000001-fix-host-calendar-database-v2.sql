-- Fix missing database elements for HostCalendar functionality (v2)
-- Migration: 20250903000001-fix-host-calendar-database-v2.sql

-- 1. Add missing created_by column to property_availability table
ALTER TABLE public.property_availability 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Add index for better performance on created_by queries
CREATE INDEX IF NOT EXISTS idx_property_availability_created_by 
ON public.property_availability(created_by);

-- 3. Handle RLS policy safely
DO $$
BEGIN
    -- Drop and recreate the policy with better name
    DROP POLICY IF EXISTS "Everyone can view property availability" ON public.property_availability;
    DROP POLICY IF EXISTS "Everyone can view property availability with creator info" ON public.property_availability;
    
    CREATE POLICY "property_availability_select_policy" ON public.property_availability
        FOR SELECT USING (true);
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Policy creation skipped, might already exist';
END
$$;

-- 4. Ensure booking_type column exists and has proper constraints  
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'daily';

-- Add constraint only if it doesn't exist
DO $$
BEGIN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT booking_type_check CHECK (booking_type IN ('daily', 'monthly'));
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint booking_type_check already exists, skipping';
END
$$;

-- 5. Add approval_status column to properties table for property approval workflow
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add constraint only if it doesn't exist
DO $$
BEGIN
    ALTER TABLE public.properties 
    ADD CONSTRAINT approval_status_check CHECK (approval_status IN ('pending', 'approved', 'rejected'));
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint approval_status_check already exists, skipping';
END
$$;

-- 6. Add monthly_price column for monthly rentals
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10, 2);

-- 7. Add index for approval_status queries
CREATE INDEX IF NOT EXISTS idx_properties_approval_status 
ON public.properties(approval_status);

-- 8. Handle properties RLS policies safely
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
    DROP POLICY IF EXISTS "Approved properties are viewable by everyone" ON public.properties;
    DROP POLICY IF EXISTS "Hosts can view their own properties" ON public.properties;
    
    -- Create new policies
    CREATE POLICY "properties_public_approved" ON public.properties
        FOR SELECT USING (is_active = true AND approval_status = 'approved');
    
    CREATE POLICY "properties_host_own" ON public.properties
        FOR SELECT USING (host_id = auth.uid());
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Properties policy creation skipped, might already exist';
END
$$;

-- 9. Grant necessary permissions safely
DO $$
BEGIN
    GRANT SELECT ON public.property_availability TO authenticated;
    GRANT INSERT ON public.property_availability TO authenticated;
    GRANT UPDATE ON public.property_availability TO authenticated;
    GRANT DELETE ON public.property_availability TO authenticated;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Permissions already granted';
END
$$;