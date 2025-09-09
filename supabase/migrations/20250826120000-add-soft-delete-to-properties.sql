-- Add soft delete functionality to properties table
-- Created: 2025-08-26
-- Purpose: Enable soft delete for properties instead of hard delete

-- Add deleted_at column to properties table
ALTER TABLE properties 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_properties_deleted_at ON properties(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_properties_active ON properties(host_id, is_active, deleted_at) WHERE deleted_at IS NULL;

-- Update existing queries to exclude soft deleted properties
-- Create a view for active properties
CREATE OR REPLACE VIEW active_properties AS
SELECT * FROM properties 
WHERE deleted_at IS NULL;

-- Add a function to soft delete properties with validation
CREATE OR REPLACE FUNCTION soft_delete_property(target_property_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    property_exists BOOLEAN;
    has_future_bookings BOOLEAN;
    user_id UUID;
BEGIN
    -- Get current user
    user_id := auth.uid();
    
    -- Check if property exists and belongs to user
    SELECT EXISTS(
        SELECT 1 FROM properties 
        WHERE id = target_property_id 
        AND host_id = user_id 
        AND deleted_at IS NULL
    ) INTO property_exists;
    
    IF NOT property_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Check for future bookings
    SELECT EXISTS(
        SELECT 1 FROM bookings 
        WHERE property_id = target_property_id 
        AND (end_date > NOW() OR status IN ('pending', 'confirmed'))
        AND deleted_at IS NULL
    ) INTO has_future_bookings;
    
    IF has_future_bookings THEN
        -- Log the attempt but don't delete
        INSERT INTO audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            success,
            additional_data
        ) VALUES (
            user_id,
            'property_delete_blocked',
            'properties',
            target_property_id::TEXT,
            FALSE,
            jsonb_build_object('reason', 'has_future_bookings')
        );
        RETURN FALSE;
    END IF;
    
    -- Soft delete the property
    UPDATE properties 
    SET 
        deleted_at = NOW(),
        is_active = FALSE,
        updated_at = NOW()
    WHERE id = target_property_id AND host_id = user_id;
    
    -- Log the soft delete
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        success,
        additional_data
    ) VALUES (
        user_id,
        'property_soft_delete',
        'properties',
        target_property_id::TEXT,
        TRUE,
        jsonb_build_object('deleted_at', NOW())
    );
    
    RETURN TRUE;
END;
$$;

-- Add function to restore soft deleted properties
CREATE OR REPLACE FUNCTION restore_property(target_property_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    restore_success BOOLEAN := FALSE;
BEGIN
    user_id := auth.uid();
    
    -- Restore the property
    UPDATE properties 
    SET 
        deleted_at = NULL,
        updated_at = NOW()
    WHERE id = target_property_id AND host_id = user_id AND deleted_at IS NOT NULL;
    
    GET DIAGNOSTICS restore_success = ROW_COUNT;
    restore_success := restore_success > 0;
    
    -- Log the restore
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        success,
        additional_data
    ) VALUES (
        user_id,
        'property_restore',
        'properties',
        target_property_id::TEXT,
        restore_success,
        jsonb_build_object('restored_at', NOW())
    );
    
    RETURN restore_success;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION soft_delete_property(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_property(UUID) TO authenticated;

-- Update RLS policies to exclude soft deleted properties
DROP POLICY IF EXISTS "Hosts can view own properties" ON properties;
CREATE POLICY "Hosts can view own active properties" ON properties
    FOR SELECT 
    TO authenticated
    USING (host_id = auth.uid() AND deleted_at IS NULL);

-- Update other relevant policies
DROP POLICY IF EXISTS "Public can view approved properties" ON properties;
CREATE POLICY "Public can view approved active properties" ON properties
    FOR SELECT 
    TO anon, authenticated
    USING (approval_status = 'approved' AND is_active = true AND deleted_at IS NULL);

COMMENT ON COLUMN properties.deleted_at IS 'Timestamp when property was soft deleted. NULL means property is active.';
COMMENT ON FUNCTION soft_delete_property(UUID) IS 'Safely soft delete a property with booking validation';
COMMENT ON FUNCTION restore_property(UUID) IS 'Restore a soft deleted property';