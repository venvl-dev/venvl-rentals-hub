-- Create platform_settings table for admin settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins only
CREATE POLICY "Super admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (get_current_user_role() = 'super_admin'::user_role);

-- Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Create property_types table if not exists
CREATE TABLE IF NOT EXISTS public.property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;

-- Create policy for property types (viewable by all, manageable by super admins)
CREATE POLICY "Property types are viewable by everyone"
ON public.property_types
FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage property types"
ON public.property_types
FOR ALL
USING (get_current_user_role() = 'super_admin'::user_role);

-- Update amenities table to include display_order if not exists
ALTER TABLE public.amenities 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create policy for amenities management by super admins
DROP POLICY IF EXISTS "Super admins can manage amenities" ON public.amenities;
CREATE POLICY "Super admins can manage amenities"
ON public.amenities
FOR ALL
USING (get_current_user_role() = 'super_admin'::user_role);

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value, category, description) VALUES
('platform_name', '"VENVL"', 'general', 'Platform name'),
('contact_email', '"support@venvl.com"', 'general', 'Contact email'),
('platform_fee', '0.05', 'commission', 'Platform commission (5%)'),
('host_fee', '0.03', 'commission', 'Host fee (3%)'),
('max_properties_per_host', '10', 'booking', 'Maximum properties per host'),
('maintenance_mode', 'false', 'system', 'Maintenance mode toggle'),
('smtp_host', '""', 'email', 'SMTP host'),
('smtp_port', '587', 'email', 'SMTP port'),
('smtp_user', '""', 'email', 'SMTP username'),
('smtp_pass', '""', 'email', 'SMTP password')
ON CONFLICT (key) DO NOTHING;

-- Insert default property types
INSERT INTO public.property_types (name, icon, display_order) VALUES
('Apartment', 'Building', 1),
('House', 'Home', 2),
('Villa', 'Castle', 3),
('Studio', 'DoorOpen', 4),
('Condo', 'Building2', 5),
('Townhouse', 'Buildings', 6)
ON CONFLICT (name) DO NOTHING;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id, metadata
  ) VALUES (
    auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata
  );
END;
$$;

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_types_updated_at ON public.property_types;
CREATE TRIGGER update_property_types_updated_at
  BEFORE UPDATE ON public.property_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();