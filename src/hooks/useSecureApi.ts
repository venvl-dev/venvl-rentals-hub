// Secure API hook with rate limiting, error handling, and audit logging
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';
import { checkRateLimit, logSecurityEvent } from '@/lib/security';

interface ApiOptions {
  requireAuth?: boolean;
  rateLimit?: {
    action: string;
    maxAttempts: number;
    windowMinutes: number;
  };
  logSecurity?: boolean;
  validateInput?: (data: any) => boolean;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export const useSecureApi = <T = any>(
  apiFunction: (data: any) => Promise<T>,
  options: ApiOptions = {}
) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const {
    requireAuth = true,
    rateLimit,
    logSecurity = false,
    validateInput
  } = options;

  const execute = useCallback(async (inputData?: any): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Authentication check
      if (requireAuth) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new CustomError(
            'User not authenticated',
            ErrorCodes.AUTH_UNAUTHORIZED,
            'high',
            'Please log in to continue.'
          );
        }
      }

      // 2. Rate limiting check
      if (rateLimit) {
        const allowed = await checkRateLimit(
          rateLimit.action,
          rateLimit.maxAttempts,
          rateLimit.windowMinutes
        );
        
        if (!allowed) {
          throw new CustomError(
            'Rate limit exceeded',
            ErrorCodes.SYSTEM_RATE_LIMIT_EXCEEDED,
            'medium',
            'Too many requests. Please try again later.'
          );
        }
      }

      // 3. Input validation
      if (validateInput && inputData && !validateInput(inputData)) {
        throw new CustomError(
          'Invalid input data',
          ErrorCodes.VALIDATION_INVALID_FORMAT,
          'medium',
          'Please check your input and try again.'
        );
      }

      // 4. Execute API function
      const result = await apiFunction(inputData);

      // 5. Log successful security event
      if (logSecurity) {
        await logSecurityEvent(
          'api_call_success',
          'api',
          undefined,
          true
        );
      }

      setState(prev => ({ ...prev, data: result, loading: false }));
      return result;

    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      
      // Log failed security event
      if (logSecurity) {
        await logSecurityEvent(
          'api_call_failed',
          'api',
          undefined,
          false,
          apiError.message
        );
      }

      setState(prev => ({ ...prev, error: apiError, loading: false }));
      await handleError(apiError, { inputData });
      return null;
    }
  }, [apiFunction, requireAuth, rateLimit, logSecurity, validateInput]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};

// Specialized hooks for common operations
export const useSecureQuery = <T>(
  table: string,
  query?: any,
  options: Omit<ApiOptions, 'logSecurity'> = {}
) => {
  const apiFunction = useCallback(async (filters?: any) => {
    let queryBuilder = supabase.from(table).select(query || '*');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    return data as T;
  }, [table, query]);

  return useSecureApi<T>(apiFunction, { ...options, logSecurity: true });
};

export const useSecureMutation = <T>(
  table: string,
  operation: 'insert' | 'update' | 'delete' = 'insert',
  options: ApiOptions = {}
) => {
  const apiFunction = useCallback(async (data: any) => {
    let result;
    
    switch (operation) {
      case 'insert':
        result = await supabase.from(table).insert(data).select();
        break;
      case 'update':
        result = await supabase.from(table).update(data.updates).eq('id', data.id).select();
        break;
      case 'delete':
        result = await supabase.from(table).delete().eq('id', data.id);
        break;
    }
    
    if (result.error) throw result.error;
    return result.data as T;
  }, [table, operation]);

  return useSecureApi<T>(apiFunction, {
    ...options,
    logSecurity: true,
    rateLimit: options.rateLimit || {
      action: `${operation}_${table}`,
      maxAttempts: 10,
      windowMinutes: 5
    }
  });
};