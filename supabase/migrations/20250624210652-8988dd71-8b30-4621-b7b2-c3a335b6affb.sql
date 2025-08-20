
-- Add host role to existing user_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('guest', 'host', 'admin');
    ELSE
        -- Add host to existing enum if not present
        BEGIN
            ALTER TYPE user_role ADD VALUE 'host';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Create amenities table for property features
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_images table for storing image URLs
CREATE TABLE IF NOT EXISTS public.property_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Add rental_type and pricing columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS rental_type TEXT DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS daily_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update properties table to use daily_price if price_per_night exists
UPDATE public.properties 
SET daily_price = price_per_night 
WHERE daily_price IS NULL AND price_per_night IS NOT NULL;

-- Enable RLS on new tables
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for amenities (public read access)
CREATE POLICY "Amenities are viewable by everyone" ON public.amenities
  FOR SELECT USING (true);

-- RLS Policies for property_images
CREATE POLICY "Property images are viewable by everyone" ON public.property_images
  FOR SELECT USING (true);
CREATE POLICY "Hosts can manage their property images" ON public.property_images
  FOR ALL USING (
    property_id IN (
      SELECT id FROM public.properties WHERE host_id = auth.uid()
    )
  );


-- Update existing properties policies to include new columns
DROP POLICY IF EXISTS "Hosts can insert their own properties" ON public.properties;
CREATE POLICY "Hosts can insert their own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their own properties" ON public.properties;
CREATE POLICY "Hosts can update their own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = host_id);

-- Update bookings policies to allow hosts to view bookings for their properties
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = guest_id OR 
    auth.uid() IN (SELECT host_id FROM public.properties WHERE id = property_id)
  );

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = guest_id OR 
    auth.uid() IN (SELECT host_id FROM public.properties WHERE id = property_id)
  );

-- Insert some default amenities
INSERT INTO public.amenities (name, icon, category) VALUES
  ('WiFi', 'Wifi', 'Essential'),
  ('Kitchen', 'ChefHat', 'Essential'),
  ('Air Conditioning', 'ThermometerSnowflake', 'Essential'),
  ('Heating', 'Flame', 'Essential'),
  ('Washing Machine', 'WashingMachine', 'Essential'),
  ('Dryer', 'Wind', 'Essential'),
  ('Hot Water', 'Droplets', 'Essential'),
  ('First Aid Kit', 'ShieldCheck', 'Essential'),
  ('Fire Extinguisher', 'SprayCan', 'Essential'),
  ('Balcony', 'Landmark', 'Comfort'),
  ('Elevator', 'MoveVertical', 'Comfort'),
  ('Free Parking', 'ParkingCircle', 'Comfort'),
  ('Private Entrance', 'DoorClosed', 'Comfort'),
  ('Security', 'Shield', 'Comfort'),
  ('Workspace', 'Laptop2', 'Comfort'),
  ('Closet', 'Shirt', 'Comfort'),
  ('TV', 'Tv2', 'Entertainment'),
  ('Netflix', 'PlayCircle', 'Entertainment'),
  ('Sound System', 'Speaker', 'Entertainment'),
  ('Board Games', 'Dice3', 'Entertainment'),
  ('Books', 'BookOpen', 'Entertainment'),
  ('Gaming Console', 'Gamepad2', 'Entertainment'),
  ('Indoor Fireplace', 'FlameKindling', 'Entertainment'),
  ('Pool Table', 'CircleDashed', 'Entertainment')
ON CONFLICT (name) DO NOTHING;

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'properties',
  'properties',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for property images
CREATE POLICY "Property images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'properties');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'properties' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own property images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'properties' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own property images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'properties' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
