
-- Add booking type fields to properties table
ALTER TABLE public.properties 
ADD COLUMN booking_types TEXT[] DEFAULT ARRAY['daily'],
ADD COLUMN min_nights INTEGER DEFAULT 1,
ADD COLUMN min_months INTEGER DEFAULT 1,
ADD COLUMN blocked_dates DATE[] DEFAULT ARRAY[]::DATE[];

-- Create availability calendar table for hosts to manage blocked dates
CREATE TABLE public.property_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT DEFAULT 'blocked_by_host',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(property_id, blocked_date)
);

-- Add flexible booking options to bookings table
ALTER TABLE public.bookings 
ADD COLUMN booking_type TEXT DEFAULT 'daily',
ADD COLUMN flexible_option TEXT,
ADD COLUMN duration_months INTEGER;

-- Create search preferences table for storing user search history
CREATE TABLE public.search_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  destination TEXT,
  search_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better search performance
CREATE INDEX idx_properties_city_state ON public.properties(city, state);
CREATE INDEX idx_properties_booking_types ON public.properties USING GIN(booking_types);
CREATE INDEX idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX idx_property_availability_date ON public.property_availability(property_id, blocked_date);

-- Enable RLS on new tables
ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_availability
CREATE POLICY "Hosts can manage their property availability" ON public.property_availability
  FOR ALL USING (
    property_id IN (
      SELECT id FROM public.properties WHERE host_id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view property availability" ON public.property_availability
  FOR SELECT USING (true);

-- RLS policies for search_preferences  
CREATE POLICY "Users can manage their search preferences" ON public.search_preferences
  FOR ALL USING (user_id = auth.uid());
