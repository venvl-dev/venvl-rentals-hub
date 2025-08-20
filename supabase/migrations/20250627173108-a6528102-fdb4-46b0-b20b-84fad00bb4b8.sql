
-- 1. Remove admin role references and clean up the user role enum
-- Since we can't drop enum values that are in use, we'll need to update existing records first

-- Update any existing admin users to super_admin
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE role = 'admin';

-- Update roles_permissions table to remove admin references and add super_admin if missing
DELETE FROM public.roles_permissions WHERE role = 'admin';

-- Ensure super_admin permissions exist (in case they don't)
INSERT INTO public.roles_permissions (role, permission_name, permission_value) 
SELECT * FROM (VALUES
  -- Super Admin permissions (all permissions)
  ('super_admin'::user_role, 'view_properties', true),
  ('super_admin'::user_role, 'create_properties', true),
  ('super_admin'::user_role, 'manage_own_properties', true),
  ('super_admin'::user_role, 'view_bookings', true),
  ('super_admin'::user_role, 'manage_bookings', true),
  ('super_admin'::user_role, 'view_analytics', true),
  ('super_admin'::user_role, 'view_all_properties', true),
  ('super_admin'::user_role, 'approve_properties', true),
  ('super_admin'::user_role, 'manage_users', true),
  ('super_admin'::user_role, 'view_platform_analytics', true),
  ('super_admin'::user_role, 'moderate_reviews', true),
  ('super_admin'::user_role, 'manage_roles', true),
  ('super_admin'::user_role, 'system_administration', true)
) AS v(role, permission_name, permission_value)
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles_permissions rp 
  WHERE rp.role = v.role AND rp.permission_name = v.permission_name
);

-- Update RLS policies to only reference super_admin (remove admin references)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Super admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    public.get_current_user_role() = 'super_admin'
  );

CREATE POLICY "Super admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    public.get_current_user_role() = 'super_admin'
  );

-- Update the role management functions to only allow super_admin
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id UUID, new_role user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role user_role;
BEGIN
  -- Check if the requesting user is a super admin
  SELECT role INTO admin_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF admin_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can change user roles';
  END IF;
  
  -- Update the user's role
  UPDATE public.profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_user_status(target_user_id UUID, disable_user BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role user_role;
BEGIN
  -- Check if the requesting user is a super admin
  SELECT role INTO admin_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF admin_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can disable/enable users';
  END IF;
  
  UPDATE public.profiles
  SET is_active = NOT disable_user, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$;

-- Create a function to initialize default users and demo data
CREATE OR REPLACE FUNCTION public.initialize_default_setup()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_text TEXT := '';
  user_count INTEGER;
  property_count INTEGER;
BEGIN
  -- Check if we already have users (to avoid running this multiple times)
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  IF user_count > 0 THEN
    RETURN 'Setup already completed - users exist in the system.';
  END IF;
  
  -- Note: We cannot create auth.users directly from SQL
  -- This function will be called after the default users are created via the auth system
  
  -- Check if we have properties (for demo data)
  SELECT COUNT(*) INTO property_count FROM public.properties;
  
  IF property_count = 0 THEN
    result_text := result_text || 'Ready for demo data seeding. ';
  ELSE
    result_text := result_text || 'Demo data already exists. ';
  END IF;
  
  RETURN result_text || 'Default setup initialization completed.';
END;
$$;

-- Create edge function to handle default user creation
-- This will be implemented in the code changes
