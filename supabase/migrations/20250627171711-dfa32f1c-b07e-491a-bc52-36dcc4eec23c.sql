
-- First, drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create a security definer function to get the current user's role
-- This prevents infinite recursion by not querying the profiles table within its own policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Recreate the admin policies using the security definer function
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    public.get_current_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    public.get_current_user_role() IN ('admin', 'super_admin')
  );

-- Also ensure the insert policy allows system-level inserts during signup
DROP POLICY IF EXISTS "Allow system to insert profiles during signup" ON public.profiles;
CREATE POLICY "Allow system to insert profiles during signup" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (true);
