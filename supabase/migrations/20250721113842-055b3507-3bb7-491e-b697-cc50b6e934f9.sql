-- Advanced Role Management System
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced User Permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  permission_value BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission_key)
);

-- Content Moderation System
CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id),
  reported_user_id UUID REFERENCES auth.users(id),
  reported_property_id UUID REFERENCES properties(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('inappropriate_content', 'spam', 'fraud', 'harassment', 'other')),
  description TEXT NOT NULL,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  moderator_id UUID REFERENCES auth.users(id),
  moderator_notes TEXT,
  resolution TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Promotion and Discount System
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'city', 'property_type', 'specific_property')),
  target_criteria JSONB DEFAULT '{}',
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  min_booking_amount DECIMAL(10,2),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Internal Messaging System
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'warning', 'notification', 'system')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  parent_message_id UUID REFERENCES admin_messages(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Approval Workflows
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('property', 'user_change', 'promotion', 'content')),
  workflow_steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  request_data JSONB NOT NULL,
  approval_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue Tracking and Reports
CREATE TABLE IF NOT EXISTS public.revenue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  commission_earned DECIMAL(12,2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  unique_hosts INTEGER DEFAULT 0,
  unique_guests INTEGER DEFAULT 0,
  breakdown_by_city JSONB DEFAULT '{}',
  breakdown_by_property_type JSONB DEFAULT '{}',
  breakdown_by_host JSONB DEFAULT '{}',
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- Dynamic Form Configuration
CREATE TABLE IF NOT EXISTS public.dynamic_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name TEXT NOT NULL UNIQUE,
  form_type TEXT NOT NULL CHECK (form_type IN ('property_submission', 'user_registration', 'booking', 'report')),
  form_schema JSONB NOT NULL,
  validation_rules JSONB DEFAULT '{}',
  conditional_logic JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Real-time Notifications
CREATE TABLE IF NOT EXISTS public.real_time_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  channel TEXT DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Location Management
CREATE TABLE IF NOT EXISTS public.managed_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('city', 'region', 'area', 'neighborhood')),
  parent_location_id UUID REFERENCES managed_locations(id),
  boundaries JSONB, -- GeoJSON boundaries
  center_lat DECIMAL(10, 8),
  center_lng DECIMAL(11, 8),
  zoom_level INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  properties_count INTEGER DEFAULT 0,
  average_price DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_time_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managed_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Super Admin Access
CREATE POLICY "Super admins can manage custom roles" ON public.custom_roles
  FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Super admins can manage user permissions" ON public.user_permissions
  FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Super admins can manage moderation reports" ON public.moderation_reports
  FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Super admins can manage promotions" ON public.promotions
  FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Super admins can manage admin messages" ON public.admin_messages
  FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Users can view their own messages" ON public.admin_messages
  FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "Super admins can manage approval workflows" ON public.approval_workflows
  FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Super admins can manage approval requests" ON public.approval_requests
  FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Super admins can manage revenue reports" ON public.revenue_reports
  FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Super admins can manage dynamic forms" ON public.dynamic_forms
  FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Users can view their own notifications" ON public.real_time_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.real_time_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can manage locations" ON public.managed_locations
  FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_roles_updated_at BEFORE UPDATE ON public.custom_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_moderation_reports_updated_at BEFORE UPDATE ON public.moderation_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON public.approval_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approval_requests_updated_at BEFORE UPDATE ON public.approval_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dynamic_forms_updated_at BEFORE UPDATE ON public.dynamic_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_managed_locations_updated_at BEFORE UPDATE ON public.managed_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();