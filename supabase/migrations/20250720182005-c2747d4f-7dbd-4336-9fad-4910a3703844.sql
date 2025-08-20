
-- Reset the super admin password to a new secure password
UPDATE auth.users 
SET encrypted_password = crypt('SuperAdmin2024$Reset', gen_salt('bf'))
WHERE email = 'superadmin@venvl.com';

-- If for some reason the super admin user doesn't exist, let's also ensure the profile exists
INSERT INTO public.profiles (id, email, first_name, last_name, role)
SELECT 
  u.id,
  u.email,
  'Super',
  'Admin',
  'super_admin'::user_role
FROM auth.users u
WHERE u.email = 'superadmin@venvl.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin'::user_role,
  email = EXCLUDED.email,
  updated_at = now();
