import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { useSecureQuery } from '@/hooks/useSecureApi';
// import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';

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
      console.log('Route access attempt by user:', user?.id);

      if (!user && requireAuth) {
        console.log('Unauthorized access attempt - no user session');
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
      // Clear any cached role to ensure fresh fetch
      localStorage.removeItem(roleKey);
      
      // Always fetch fresh role data to avoid cache issues
      let role: string;
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
          console.error('Failed to verify user permissions for user:', user!.id);
          toast.error('Unable to verify user permissions');
          navigate('/');
          return;
        }

        role = (profile as any)?.role || 'guest';
        console.log('Fresh role fetched for user:', user!.id, 'Role:', role);
        
        // Update cache with fresh role
        localStorage.setItem(roleKey, role);
      } catch (error) {
        console.error('Profile fetch error for user:', user!.id, error);
        toast.error('Unable to fetch user profile');
        navigate('/');
        return;
      }
      
      setUserRole(role);

      // Check if user has required role
      if (allowedRoles.includes(role)) {
        console.log('Authorized access for user:', user!.id, 'Role:', role);
        setAuthorized(true);
      } else {
        console.log('Unauthorized access attempt for user:', user!.id, 'Required:', allowedRoles.join(', '), 'User has:', role);
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
      console.error('Authentication check failed for user:', user?.id, error);
      toast.error('Authentication check failed');
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
