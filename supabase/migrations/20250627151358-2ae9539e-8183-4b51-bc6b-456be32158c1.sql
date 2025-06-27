
-- First, let's update the user_role enum to include super_admin
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Create roles_permissions table for granular permission management
CREATE TABLE IF NOT EXISTS public.roles_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  permission_name TEXT NOT NULL,
  permission_value BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission_name)
);

-- Enable RLS on roles_permissions table
ALTER TABLE public.roles_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for super_admin access to roles_permissions
CREATE POLICY "Super admins can manage role permissions" 
  ON public.roles_permissions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Insert default permissions for each role
INSERT INTO public.roles_permissions (role, permission_name, permission_value) 
SELECT * FROM (VALUES
  -- Guest permissions
  ('guest'::user_role, 'view_properties', true),
  ('guest'::user_role, 'create_bookings', true),
  ('guest'::user_role, 'view_own_bookings', true),
  ('guest'::user_role, 'leave_reviews', true),
  -- Host permissions
  ('host'::user_role, 'view_properties', true),
  ('host'::user_role, 'create_properties', true),
  ('host'::user_role, 'manage_own_properties', true),
  ('host'::user_role, 'view_bookings', true),
  ('host'::user_role, 'manage_bookings', true),
  ('host'::user_role, 'view_analytics', true),
  -- Admin permissions
  ('admin'::user_role, 'view_all_properties', true),
  ('admin'::user_role, 'approve_properties', true),
  ('admin'::user_role, 'manage_users', true),
  ('admin'::user_role, 'view_platform_analytics', true),
  ('admin'::user_role, 'moderate_reviews', true),
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

-- Add is_active column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role user_role;
  has_permission BOOLEAN := false;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Check if user has the specific permission
  SELECT permission_value INTO has_permission
  FROM public.roles_permissions
  WHERE role = user_role AND permission_name = permission;
  
  RETURN COALESCE(has_permission, false);
END;
$$;

-- Create function to manage user roles (super admin only)
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

-- Create function to disable/enable user accounts
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
