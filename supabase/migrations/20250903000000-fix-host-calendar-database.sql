-- Fix missing database elements for HostCalendar functionality
-- Migration: 20250903000000-fix-host-calendar-database.sql

-- 1. Add missing created_by column to property_availability table
ALTER TABLE public.property_availability 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Add index for better performance on created_by queries
CREATE INDEX IF NOT EXISTS idx_property_availability_created_by 
ON public.property_availability(created_by);

-- 3. Update RLS policy to allow users to see who created blocked dates
DROP POLICY IF EXISTS "Everyone can view property availability" ON public.property_availability;

CREATE POLICY "Everyone can view property availability with creator info" ON public.property_availability
  FOR SELECT USING (true);

-- 4. Ensure booking_type column exists and has proper constraints
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'daily' 
CHECK (booking_type IN ('daily', 'monthly'));

-- 5. Add approval_status column to properties table for property approval workflow
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 6. Add monthly_price column for monthly rentals
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10, 2);

-- 7. Add index for approval_status queries
CREATE INDEX IF NOT EXISTS idx_properties_approval_status 
ON public.properties(approval_status);

-- 8. Update properties RLS policy to handle approval status
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;

CREATE POLICY "Approved properties are viewable by everyone" ON public.properties
  FOR SELECT USING (is_active = true AND approval_status = 'approved');

CREATE POLICY "Hosts can view their own properties" ON public.properties
  FOR SELECT USING (host_id = auth.uid());

-- 9. Add comments for documentation
COMMENT ON COLUMN public.property_availability.created_by IS 'ID of the user who created this blocked date entry';
COMMENT ON COLUMN public.properties.approval_status IS 'Admin approval status for property listings';
COMMENT ON COLUMN public.properties.monthly_price IS 'Monthly rental price for long-term bookings';

-- 10. Grant necessary permissions
GRANT SELECT ON public.property_availability TO authenticated;
GRANT INSERT ON public.property_availability TO authenticated;
GRANT UPDATE ON public.property_availability TO authenticated;
GRANT DELETE ON public.property_availability TO authenticated;