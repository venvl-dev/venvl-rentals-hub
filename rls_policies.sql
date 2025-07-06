-- Row Level Security (RLS) Policies for VENVL Platform
-- These policies ensure only authenticated users can access data relevant to their role

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (except role changes)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    -- Prevent role changes unless user is super_admin
    (OLD.role = NEW.role OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    ))
  );

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation during signup" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admins can update any profile
CREATE POLICY "Super admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Properties table RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Hosts can manage their own properties
CREATE POLICY "Hosts can manage own properties" ON properties
  FOR ALL USING (
    host_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('host', 'super_admin')
    )
  );

-- Everyone can read approved properties
CREATE POLICY "Everyone can read approved properties" ON properties
  FOR SELECT USING (
    is_active = true AND 
    approval_status = 'approved'
  );

-- Super admins can manage all properties
CREATE POLICY "Super admins can manage all properties" ON properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Bookings table RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can read their own bookings
CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT USING (
    guest_id = auth.uid() OR 
    property_id IN (
      SELECT id FROM properties WHERE host_id = auth.uid()
    )
  );

-- Guests can create bookings
CREATE POLICY "Guests can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    guest_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('guest', 'super_admin')
    )
  );

-- Hosts can update bookings for their properties
CREATE POLICY "Hosts can update bookings for their properties" ON bookings
  FOR UPDATE USING (
    property_id IN (
      SELECT id FROM properties WHERE host_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('host', 'super_admin')
    )
  );

-- Super admins can manage all bookings
CREATE POLICY "Super admins can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Function to ensure profiles table has email column if needed
-- (This should be added if email column doesn't exist in profiles)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
-- CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Function to automatically create profile on user signup (if not using trigger)
-- This can be used as a database function triggered on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 
