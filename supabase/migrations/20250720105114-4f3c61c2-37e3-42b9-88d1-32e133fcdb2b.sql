-- Phase 1: Critical Security Fixes
-- Fix function search path security vulnerabilities

-- 1. Fix all database functions to have secure search paths
ALTER FUNCTION public.user_has_permission(uuid, text) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;
ALTER FUNCTION public.generate_booking_reference() SET search_path = public;
ALTER FUNCTION public.get_current_user_role() SET search_path = public, auth;
ALTER FUNCTION public.set_booking_reference() SET search_path = public;
ALTER FUNCTION public.update_user_role(uuid, user_role) SET search_path = public, auth;
ALTER FUNCTION public.toggle_user_status(uuid, boolean) SET search_path = public, auth;
ALTER FUNCTION public.initialize_default_setup() SET search_path = public;
ALTER FUNCTION public.check_booking_conflicts(uuid, date, date, uuid) SET search_path = public;
ALTER FUNCTION public.get_price_range(text, text) SET search_path = public;
ALTER FUNCTION public.can_cancel_booking(uuid) SET search_path = public;
ALTER FUNCTION public.seed_sample_properties_for_host(uuid) SET search_path = public;
ALTER FUNCTION public.seed_sample_bookings_and_reviews(uuid) SET search_path = public;
ALTER FUNCTION public.seed_sample_notifications(uuid, text) SET search_path = public;
ALTER FUNCTION public.create_test_scenario() SET search_path = public;

-- 2. Add input validation function
CREATE OR REPLACE FUNCTION public.validate_input(input_text TEXT, max_length INTEGER DEFAULT 1000)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for null or empty input
  IF input_text IS NULL OR LENGTH(TRIM(input_text)) = 0 THEN
    RAISE EXCEPTION 'Input cannot be null or empty';
  END IF;
  
  -- Check length
  IF LENGTH(input_text) > max_length THEN
    RAISE EXCEPTION 'Input exceeds maximum length of % characters', max_length;
  END IF;
  
  -- Basic sanitization - remove control characters
  input_text := REGEXP_REPLACE(input_text, '[^\x20-\x7E]', '', 'g');
  
  RETURN TRIM(input_text);
END;
$$;

-- 3. Add rate limiting table for API calls
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rate_limits
CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true);

-- 4. Add security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security_audit_log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_audit_log
CREATE POLICY "Super admins can view all audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (get_current_user_role() = 'super_admin');

CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- 5. Enhanced RLS policies with audit logging
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, success, error_message
  ) VALUES (
    auth.uid(), p_action, p_resource_type, p_resource_id, p_success, p_error_message
  );
END;
$$;

-- 6. Add password policy enforcement function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Minimum length check
  IF LENGTH(password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    RAISE EXCEPTION 'Password must contain at least one uppercase letter';
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    RAISE EXCEPTION 'Password must contain at least one lowercase letter';
  END IF;
  
  -- Check for number
  IF password !~ '[0-9]' THEN
    RAISE EXCEPTION 'Password must contain at least one number';
  END IF;
  
  -- Check for special character
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    RAISE EXCEPTION 'Password must contain at least one special character';
  END IF;
  
  RETURN true;
END;
$$;

-- 7. Add data encryption for sensitive fields
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data TEXT, key_name TEXT DEFAULT 'default')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- In production, this should use proper key management
  encryption_key := 'venvl_encryption_key_2024';
  
  RETURN encode(
    encrypt(data::bytea, encryption_key::bytea, 'aes'),
    'base64'
  );
END;
$$;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data TEXT, key_name TEXT DEFAULT 'default')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- In production, this should use proper key management
  encryption_key := 'venvl_encryption_key_2024';
  
  RETURN convert_from(
    decrypt(decode(encrypted_data, 'base64'), encryption_key::bytea, 'aes'),
    'UTF8'
  );
END;
$$;

-- 8. Create indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action_type, window_start);
CREATE INDEX IF NOT EXISTS idx_security_audit_user ON public.security_audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_action ON public.security_audit_log(action, created_at);

-- 9. Add data retention policies (comments for future implementation)
-- These would typically be implemented as scheduled jobs
COMMENT ON TABLE public.security_audit_log IS 'Audit logs should be retained for 90 days and then archived';
COMMENT ON TABLE public.rate_limits IS 'Rate limit records should be cleaned up after 24 hours';

-- 10. Grant necessary permissions
GRANT SELECT ON public.rate_limits TO authenticated;
GRANT SELECT ON public.security_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_input(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(TEXT, TEXT, UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_password_strength(TEXT) TO authenticated;