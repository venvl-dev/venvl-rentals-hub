-- Fix booking RLS policy issues

-- Drop existing booking policies to start clean
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Hosts can view bookings for their properties" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guests can create bookings" ON public.bookings;  
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view booking availability" ON public.bookings;

-- Ensure RLS is enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- SELECT policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    guest_id = auth.uid()
  );

CREATE POLICY "Hosts can view bookings for their properties" ON public.bookings
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    property_id IN (
      SELECT id FROM public.properties WHERE host_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view booking availability" ON public.bookings
  FOR SELECT USING (true);

-- INSERT policy - Allow authenticated users to create bookings for themselves
CREATE POLICY "Authenticated users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    guest_id = auth.uid() AND
    -- Ensure the property exists and is active
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND is_active = true
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      guest_id = auth.uid() OR 
      property_id IN (
        SELECT id FROM public.properties WHERE host_id = auth.uid()
      )
    )
  );

-- DELETE policy (if needed)
CREATE POLICY "Users can delete their own bookings" ON public.bookings
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    guest_id = auth.uid()
  );