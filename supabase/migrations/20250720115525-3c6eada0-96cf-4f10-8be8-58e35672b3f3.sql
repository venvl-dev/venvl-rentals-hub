-- Update the passwords for demo accounts to match the new secure passwords in the UI
-- Note: This updates the encrypted password hash in auth.users

-- First, let's create a function to safely update user passwords
CREATE OR REPLACE FUNCTION update_demo_passwords()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update guest password
  UPDATE auth.users 
  SET encrypted_password = crypt('DemoGuest2024$Secure', gen_salt('bf'))
  WHERE email = 'guest@venvl.com';
  
  -- Update host password  
  UPDATE auth.users 
  SET encrypted_password = crypt('DemoHost2024$Secure', gen_salt('bf'))
  WHERE email = 'host@venvl.com';
  
  -- Update super admin password
  UPDATE auth.users 
  SET encrypted_password = crypt('DemoAdmin2024$Secure', gen_salt('bf'))
  WHERE email = 'superadmin@venvl.com';
END;
$$;

-- Execute the function to update passwords
SELECT update_demo_passwords();

-- Clean up the function
DROP FUNCTION update_demo_passwords();