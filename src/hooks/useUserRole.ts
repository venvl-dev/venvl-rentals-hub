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
      // Check cache first
      const roleKey = `user_role_${user.id}`;
      const cachedRole = localStorage.getItem(roleKey);
      
      if (cachedRole) {
        setUserRole(cachedRole);
        setLoading(false);
        return;
      }

      // Fetch from database
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
      localStorage.setItem(roleKey, role);

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