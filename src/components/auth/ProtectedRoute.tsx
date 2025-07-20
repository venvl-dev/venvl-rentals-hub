import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { useSecureQuery } from '@/hooks/useSecureApi';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';
import { logSecurityEvent } from '@/lib/security';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  redirectTo = '/auth'
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    checkAuth();
  }, [authLoading, user?.id]);

  // Secure profile query hook
  const secureProfileQuery = useSecureQuery('profiles');

  const checkAuth = async () => {
    setLoading(true);
    try {
      // Log access attempt
      await logSecurityEvent('route_access_attempt', 'authentication', user?.id, true);

      if (!user && requireAuth) {
        await logSecurityEvent('unauthorized_access_attempt', 'authentication', undefined, false, 'No user session');
        toast.error('Please sign in to access this page');
        navigate(redirectTo);
        return;
      }

      if (!user && !requireAuth) {
        setAuthorized(true);
        return;
      }

      if (allowedRoles.length === 0) {
        setAuthorized(true);
        return;
      }

      const roleKey = `user_role_${user!.id}`;
      let role = localStorage.getItem(roleKey);
      
      if (!role) {
        try {
          // Create a query function for the secure API
          const queryFunction = async () => {
            const { data, error } = await import('@/integrations/supabase/client').then(module => 
              module.supabase.from('profiles').select('role').eq('id', user!.id).single()
            );
            if (error) throw error;
            return data;
          };

          const profile = await secureProfileQuery.execute(queryFunction);

          if (!profile) {
            await handleError(
              new CustomError(
                'Failed to verify user permissions',
                ErrorCodes.AUTH_UNAUTHORIZED,
                'high',
                'Unable to verify user permissions'
              ),
              { userId: user!.id }
            );
            navigate('/');
            return;
          }

          role = (profile as any)?.role || 'guest';
          localStorage.setItem(roleKey, role);
        } catch (error) {
          await handleError(
            new CustomError(
              'Profile fetch error',
              ErrorCodes.AUTH_UNAUTHORIZED,
              'high'
            ),
            { userId: user!.id, error }
          );
          navigate('/');
          return;
        }
      }
      
      setUserRole(role);

      // Check if user has required role
      if (allowedRoles.includes(role)) {
        await logSecurityEvent('authorized_access', 'authentication', user!.id, true, `Role: ${role}`);
        setAuthorized(true);
      } else {
        await logSecurityEvent('unauthorized_access_attempt', 'authentication', user!.id, false, `Required: ${allowedRoles.join(', ')}, User has: ${role}`);
        toast.error('You do not have permission to access this page');
        
        // Redirect based on user role
        switch (role) {
          case 'host':
            navigate('/host/dashboard');
            break;
          case 'super_admin':
            navigate('/admin/panel');
            break;
          case 'guest':
          default:
            navigate('/');
            break;
        }
      }
    } catch (error) {
      await handleError(
        new CustomError(
          'Authentication check failed',
          ErrorCodes.VALIDATION_INVALID_FORMAT,
          'high'
        ),
        { error, userId: user?.id }
      );
      navigate(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <div className="text-gray-600">Verifying access...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You do not have permission to view this page.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 
