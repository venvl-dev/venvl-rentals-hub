-- CRITICAL SECURITY ENHANCEMENTS FOR AUTHENTICATION SYSTEM
-- Created: 2025-01-24
-- Purpose: Add server-side role validation and security functions

-- =================================================================================
-- SECURITY FUNCTIONS - Server-side role and session validation
-- =================================================================================

-- Function to get current user's role with session validation
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_id UUID;
    session_valid BOOLEAN := FALSE;
BEGIN
    -- Get current authenticated user ID
    user_id := auth.uid();
    
    -- If no authenticated user, return null
    IF user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Validate session is still active (additional security check)
    -- Note: This queries the auth.users table to ensure session is valid
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE id = user_id 
        AND last_sign_in_at > NOW() - INTERVAL '24 hours'
        AND (banned_until IS NULL OR banned_until < NOW())
    ) INTO session_valid;
    
    -- If session is invalid, return null
    IF NOT session_valid THEN
        RETURN NULL;
    END IF;
    
    -- Get role from profiles table with additional validation
    SELECT role INTO user_role 
    FROM profiles 
    WHERE id = user_id 
    AND is_active = TRUE;
    
    -- Log role access for security auditing
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        success,
        ip_address,
        user_agent,
        additional_data
    ) VALUES (
        user_id,
        'role_verification',
        'authentication',
        user_id::TEXT,
        TRUE,
        COALESCE(current_setting('request.header.x-real-ip', TRUE), '127.0.0.1'),
        COALESCE(current_setting('request.header.user-agent', TRUE), 'unknown'),
        jsonb_build_object(
            'verified_role', user_role,
            'session_validation', 'passed'
        )
    );
    
    RETURN COALESCE(user_role, 'guest');
EXCEPTION
    WHEN OTHERS THEN
        -- Log security exception
        INSERT INTO audit_logs (
            user_id,
            action,
            resource_type,
            success,
            error_message,
            additional_data
        ) VALUES (
            user_id,
            'role_verification_error',
            'authentication',
            FALSE,
            SQLERRM,
            jsonb_build_object('error_code', SQLSTATE)
        );
        RETURN NULL;
END;
$$;

-- Function to validate admin operations with enhanced security
CREATE OR REPLACE FUNCTION public.validate_admin_operation(
    required_role TEXT DEFAULT 'super_admin',
    operation_name TEXT DEFAULT 'admin_operation'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_role TEXT;
    user_id UUID;
    operation_allowed BOOLEAN := FALSE;
BEGIN
    -- Get current user and their verified role
    user_id := auth.uid();
    current_role := public.get_current_user_role_secure();
    
    -- Check if user has required role
    IF current_role = required_role OR (required_role = 'admin' AND current_role = 'super_admin') THEN
        operation_allowed := TRUE;
    END IF;
    
    -- Log admin operation attempt
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        success,
        ip_address,
        user_agent,
        additional_data
    ) VALUES (
        user_id,
        operation_name,
        'admin_operation',
        operation_allowed,
        COALESCE(current_setting('request.header.x-real-ip', TRUE), '127.0.0.1'),
        COALESCE(current_setting('request.header.user-agent', TRUE), 'unknown'),
        jsonb_build_object(
            'required_role', required_role,
            'user_role', current_role,
            'access_granted', operation_allowed
        )
    );
    
    RETURN operation_allowed;
EXCEPTION
    WHEN OTHERS THEN
        -- Log security exception
        INSERT INTO audit_logs (
            user_id,
            action,
            resource_type,
            success,
            error_message,
            additional_data
        ) VALUES (
            user_id,
            CONCAT(operation_name, '_error'),
            'admin_operation',
            FALSE,
            SQLERRM,
            jsonb_build_object('error_code', SQLSTATE)
        );
        RETURN FALSE;
END;
$$;

-- =================================================================================
-- ENHANCED RLS POLICIES WITH SERVER-SIDE VALIDATION
-- =================================================================================

-- Drop existing profile policies to recreate with enhanced security
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;

-- Enhanced profile read policy with session validation
CREATE POLICY "Users can read own profile with validation" ON profiles
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() = id AND 
        public.get_current_user_role_secure() IS NOT NULL
    );

-- Enhanced profile update policy preventing role escalation
CREATE POLICY "Users can update own profile securely" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Prevent role changes unless performed by super_admin
        (OLD.role = NEW.role OR public.validate_admin_operation('super_admin', 'role_change'))
    );

-- Enhanced super admin read policy
CREATE POLICY "Super admins can read all profiles securely" ON profiles
    FOR SELECT 
    TO authenticated
    USING (public.validate_admin_operation('super_admin', 'profile_read'));

-- Enhanced super admin update policy
CREATE POLICY "Super admins can update any profile securely" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (public.validate_admin_operation('super_admin', 'profile_update'))
    WITH CHECK (public.validate_admin_operation('super_admin', 'profile_update'));

-- =================================================================================
-- CRITICAL SECURITY TRIGGERS
-- =================================================================================

-- Trigger to log all role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log role changes for security auditing
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            success,
            ip_address,
            user_agent,
            additional_data
        ) VALUES (
            auth.uid(),
            'role_change',
            'profiles',
            NEW.id::TEXT,
            TRUE,
            COALESCE(current_setting('request.header.x-real-ip', TRUE), '127.0.0.1'),
            COALESCE(current_setting('request.header.user-agent', TRUE), 'unknown'),
            jsonb_build_object(
                'old_role', OLD.role,
                'new_role', NEW.role,
                'target_user_id', NEW.id,
                'changed_by', auth.uid()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS log_profile_role_changes ON profiles;
CREATE TRIGGER log_profile_role_changes
    AFTER UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION public.log_role_changes();

-- =================================================================================
-- SECURITY VALIDATION FUNCTIONS FOR API ENDPOINTS
-- =================================================================================

-- Function to validate API access with rate limiting
CREATE OR REPLACE FUNCTION public.validate_api_access(
    endpoint_name TEXT,
    required_role TEXT DEFAULT 'authenticated',
    max_requests_per_minute INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    current_role TEXT;
    request_count INTEGER;
    access_granted BOOLEAN := FALSE;
BEGIN
    user_id := auth.uid();
    
    -- Check authentication
    IF user_id IS NULL AND required_role != 'anonymous' THEN
        RETURN FALSE;
    END IF;
    
    -- Get current role
    current_role := public.get_current_user_role_secure();
    
    -- Check role authorization
    IF required_role = 'authenticated' AND current_role IS NOT NULL THEN
        access_granted := TRUE;
    ELSIF current_role = required_role OR (required_role = 'admin' AND current_role = 'super_admin') THEN
        access_granted := TRUE;
    ELSIF required_role = 'anonymous' THEN
        access_granted := TRUE;
    END IF;
    
    -- Rate limiting check
    IF access_granted AND user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO request_count
        FROM audit_logs 
        WHERE user_id = user_id 
        AND action = CONCAT('api_', endpoint_name)
        AND created_at > NOW() - INTERVAL '1 minute';
        
        IF request_count >= max_requests_per_minute THEN
            access_granted := FALSE;
            
            -- Log rate limit violation
            INSERT INTO audit_logs (
                user_id,
                action,
                resource_type,
                success,
                additional_data
            ) VALUES (
                user_id,
                'rate_limit_exceeded',
                'api',
                FALSE,
                jsonb_build_object(
                    'endpoint', endpoint_name,
                    'requests_in_minute', request_count,
                    'limit', max_requests_per_minute
                )
            );
        END IF;
    END IF;
    
    -- Log API access attempt
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        success,
        ip_address,
        additional_data
    ) VALUES (
        user_id,
        CONCAT('api_', endpoint_name),
        'api',
        access_granted,
        COALESCE(current_setting('request.header.x-real-ip', TRUE), '127.0.0.1'),
        jsonb_build_object(
            'endpoint', endpoint_name,
            'required_role', required_role,
            'user_role', current_role
        )
    );
    
    RETURN access_granted;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role_secure() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.validate_admin_operation(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_api_access(TEXT, TEXT, INTEGER) TO authenticated, anon;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_created 
    ON audit_logs(user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role_active 
    ON profiles(role, is_active) WHERE is_active = TRUE;

COMMENT ON FUNCTION public.get_current_user_role_secure() IS 'Securely retrieves and validates current user role with session verification';
COMMENT ON FUNCTION public.validate_admin_operation(TEXT, TEXT) IS 'Validates admin operations with enhanced security logging';
COMMENT ON FUNCTION public.validate_api_access(TEXT, TEXT, INTEGER) IS 'Validates API access with role checking and rate limiting';