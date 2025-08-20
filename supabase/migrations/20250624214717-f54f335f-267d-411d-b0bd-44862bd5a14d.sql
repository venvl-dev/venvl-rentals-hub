
-- First, let's ensure we have the proper booking statuses
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the bookings table to ensure it has all necessary columns
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);

-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id) -- One review per booking
);

-- Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = guest_id);

DROP POLICY IF EXISTS "Hosts can view bookings for their properties" ON public.bookings;
CREATE POLICY "Hosts can view bookings for their properties" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = bookings.property_id 
      AND properties.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Guests can update their own bookings (for cancellation)
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = guest_id);

-- Create RLS policies for reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Guests can create reviews for their bookings" ON public.reviews;
CREATE POLICY "Guests can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = guest_id AND
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = reviews.booking_id 
      AND bookings.guest_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

DROP POLICY IF EXISTS "Guests can update their own reviews" ON public.reviews;
CREATE POLICY "Guests can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = guest_id);

-- Enable RLS on bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Add a function to check if booking can be cancelled
CREATE OR REPLACE FUNCTION public.can_cancel_booking(booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_record RECORD;
BEGIN
  SELECT status, check_in INTO booking_record
  FROM public.bookings
  WHERE id = booking_id;
  
  IF booking_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Can cancel if status is pending or confirmed and check-in is in the future
  RETURN booking_record.status IN ('pending', 'confirmed') 
    AND booking_record.check_in > CURRENT_DATE;
END;
$$;
