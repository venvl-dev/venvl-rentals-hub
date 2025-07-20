import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Header from '@/components/Header';

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

  const checkAuth = async () => {
    setLoading(true);
    try {
      if (!user && requireAuth) {
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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user!.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          toast.error('Unable to verify user permissions');
          navigate('/');
          return;
        }

        role = profile?.role || 'guest';
        localStorage.setItem(roleKey, role);
      }
      setUserRole(role);

      // Check if user has required role
      if (allowedRoles.includes(role)) {
        setAuthorized(true);
      } else {
        console.log(`Access denied. User role: ${role}, Required: ${allowedRoles.join(', ')}`);
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
      console.error('Auth check error:', error);
      toast.error('Authentication error occurred');
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
