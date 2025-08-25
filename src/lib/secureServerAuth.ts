// Server-side authentication validation library
// This ensures all role checks happen on the server, not just client-side

import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from './security';

interface ServerAuthResponse {
  isValid: boolean;
  role: string | null;
  error?: string;
}

interface ApiAccessResponse {
  allowed: boolean;
  error?: string;
}

/**
 * SECURITY: Get user role with server-side validation
 * This calls the secure database function that validates session and role
 */
export const getSecureUserRole = async (): Promise<ServerAuthResponse> => {
  try {
    const { data, error } = await supabase.rpc('get_current_user_role_secure');
    
    if (error) {
      console.error('Server role validation error:', error);
      await logSecurityEvent(
        'server_role_validation_failed',
        'authentication',
        undefined,
        false,
        error.message
      );
      
      return {
        isValid: false,
        role: null,
        error: 'Failed to validate user role on server'
      };
    }
    
    // Server returned null means no valid session or role
    if (data === null) {
      return {
        isValid: false,
        role: null,
        error: 'No valid session or role found'
      };
    }
    
    return {
      isValid: true,
      role: data,
    };
  } catch (error) {
    console.error('Unexpected error during server role validation:', error);
    return {
      isValid: false,
      role: null,
      error: 'Unexpected authentication error'
    };
  }
};

/**
 * SECURITY: Validate admin operations on server-side
 * This ensures admin operations are validated by the database, not just frontend
 */
export const validateAdminOperation = async (
  requiredRole: string = 'super_admin',
  operationName: string = 'admin_operation'
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('validate_admin_operation', {
      required_role: requiredRole,
      operation_name: operationName
    });
    
    if (error) {
      console.error('Admin validation error:', error);
      await logSecurityEvent(
        'admin_validation_failed',
        'authentication',
        undefined,
        false,
        error.message
      );
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Unexpected error during admin validation:', error);
    return false;
  }
};

/**
 * SECURITY: Validate API access with rate limiting and role checks
 * This replaces client-side authorization with server-side validation
 */
export const validateApiAccess = async (
  endpointName: string,
  requiredRole: string = 'authenticated',
  maxRequestsPerMinute: number = 60
): Promise<ApiAccessResponse> => {
  try {
    const { data, error } = await supabase.rpc('validate_api_access', {
      endpoint_name: endpointName,
      required_role: requiredRole,
      max_requests_per_minute: maxRequestsPerMinute
    });
    
    if (error) {
      console.error('API access validation error:', error);
      return {
        allowed: false,
        error: 'Failed to validate API access'
      };
    }
    
    return {
      allowed: data === true
    };
  } catch (error) {
    console.error('Unexpected error during API access validation:', error);
    return {
      allowed: false,
      error: 'Unexpected validation error'
    };
  }
};

/**
 * SECURITY: Enhanced secure query wrapper
 * Validates access on server before allowing database operations
 */
export const secureQuery = async <T>(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  queryBuilder: any,
  requiredRole: string = 'authenticated'
): Promise<{ data: T | null; error: string | null; authorized: boolean }> => {
  
  // First validate access on server
  const accessValidation = await validateApiAccess(
    `${operation}_${table}`,
    requiredRole
  );
  
  if (!accessValidation.allowed) {
    await logSecurityEvent(
      'unauthorized_database_access',
      'database',
      table,
      false,
      `Unauthorized ${operation} attempt on ${table}`
    );
    
    return {
      data: null,
      error: 'Unauthorized access to this resource',
      authorized: false
    };
  }
  
  try {
    const { data, error } = await queryBuilder;
    
    if (error) {
      await logSecurityEvent(
        `database_${operation}_error`,
        'database',
        table,
        false,
        error.message
      );
    } else {
      await logSecurityEvent(
        `database_${operation}_success`,
        'database',
        table,
        true
      );
    }
    
    return {
      data,
      error: error?.message || null,
      authorized: true
    };
    
  } catch (error: any) {
    await logSecurityEvent(
      `database_${operation}_exception`,
      'database',
      table,
      false,
      error.message
    );
    
    return {
      data: null,
      error: error.message,
      authorized: true // Access was authorized, but operation failed
    };
  }
};

/**
 * SECURITY: Role-based component access validator
 * Use this in components to validate access on server before rendering
 */
export const useServerRoleValidation = async (
  allowedRoles: string[]
): Promise<{ authorized: boolean; userRole: string | null; loading: boolean }> => {
  const roleResponse = await getSecureUserRole();
  
  if (!roleResponse.isValid || !roleResponse.role) {
    return {
      authorized: false,
      userRole: null,
      loading: false
    };
  }
  
  const authorized = allowedRoles.length === 0 || allowedRoles.includes(roleResponse.role);
  
  if (!authorized) {
    await logSecurityEvent(
      'unauthorized_component_access',
      'component',
      undefined,
      false,
      `User with role ${roleResponse.role} attempted access requiring ${allowedRoles.join(', ')}`
    );
  }
  
  return {
    authorized,
    userRole: roleResponse.role,
    loading: false
  };
};