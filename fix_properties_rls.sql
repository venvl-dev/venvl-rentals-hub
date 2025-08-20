-- Fix RLS Policies for Properties Table
-- This ensures super admins can see ALL properties including pending ones

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Everyone can read approved properties" ON properties;
DROP POLICY IF EXISTS "Super admins can manage all properties" ON properties;
DROP POLICY IF EXISTS "Hosts can manage own properties" ON properties;

-- Create new, cleaner policies with proper precedence

-- 1. Super admins can do EVERYTHING (highest priority)
CREATE POLICY "Super admins have full access" ON properties
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 2. Hosts can manage their own properties
CREATE POLICY "Hosts manage own properties" ON properties
  FOR ALL 
  TO authenticated
  USING (
    host_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('host', 'super_admin')
    )
  )
  WITH CHECK (
    host_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('host', 'super_admin')
    )
  );

-- 3. Public can read only approved active properties
CREATE POLICY "Public reads approved properties" ON properties
  FOR SELECT 
  TO authenticated
  USING (
    is_active = true AND 
    approval_status = 'approved'
  );

-- 4. Anonymous users can also read approved properties (for public browsing)
CREATE POLICY "Anonymous reads approved properties" ON properties
  FOR SELECT 
  TO anon
  USING (
    is_active = true AND 
    approval_status = 'approved'
  );