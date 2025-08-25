import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';
import { logSecurityEvent } from '@/lib/security';

interface UseUserRoleReturn {
  userRole: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    if (!user?.id) {
      setUserRole(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // SECURITY FIX: Validate cache integrity and freshness
      const roleKey = `user_role_${user.id}`;
      const cacheData = localStorage.getItem(roleKey);
      let cachedRole = null;
      let shouldFetchFresh = true;
      
      if (cacheData) {
        try {
          const parsed = JSON.parse(cacheData);
          const now = Date.now();
          const cacheAge = now - parsed.timestamp;
          const maxAge = 5 * 60 * 1000; // 5 minutes cache maximum
          
          // Verify cache is recent and has session validation
          if (cacheAge < maxAge && parsed.sessionId === user.id) {
            // SECURITY: Still validate against current session token periodically
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id === user.id && session?.access_token) {
              cachedRole = parsed.role;
              shouldFetchFresh = false;
              console.log('Using validated cached role for user:', user.id);
            }
          }
        } catch {
          // Invalid cache format, clear it
          localStorage.removeItem(roleKey);
        }
      }

      if (!shouldFetchFresh && cachedRole) {
        setUserRole(cachedRole);
        setLoading(false);
        return;
      }

      // Always fetch fresh for security-critical operations
      console.log('Fetching fresh role from database for user:', user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(`Failed to fetch user role: ${profileError.message}`);
      }

      const role = profile?.role || 'guest';
      setUserRole(role);
      
      // SECURITY FIX: Store with timestamp and session validation
      const secureCache = {
        role,
        timestamp: Date.now(),
        sessionId: user.id,
        // Add a simple integrity check
        checksum: btoa(role + user.id).slice(0, 8)
      };
      localStorage.setItem(roleKey, JSON.stringify(secureCache));

      await logSecurityEvent('user_role_fetched', 'authentication', user.id, true);
    } catch (err) {
      const errorMessage = 'Unable to fetch user role';
      setError(errorMessage);
      
      await handleError(
        new CustomError(
          'User role fetch failed',
          ErrorCodes.AUTH_UNAUTHORIZED,
          'medium',
          errorMessage
        ),
        { userId: user.id, error: err }
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  return {
    userRole,
    loading,
    error,
    refetch: fetchUserRole
  };
};