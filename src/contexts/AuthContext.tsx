import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';
import { logSecurityEvent } from '@/lib/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        switch (event) {
          case 'INITIAL_SESSION':
          case 'SIGNED_IN':
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            
            // Log successful authentication
            if (session?.user && event === 'SIGNED_IN') {
              await logSecurityEvent('user_signed_in', 'authentication', session.user.id, true);
            }
            break;
            
          case 'SIGNED_OUT':
            if (user) {
              localStorage.removeItem(`user_role_${user.id}`);
              await logSecurityEvent('user_signed_out', 'authentication', user.id, true);
            }
            setSession(null);
            setUser(null);
            setLoading(false);
            break;
            
          case 'TOKEN_REFRESHED':
            setSession(session);
            setUser(session?.user ?? null);
            break;
            
          default:
            break;
        }
      } catch (error) {
        await handleError(
          new CustomError(
            'Authentication state change error',
            ErrorCodes.AUTH_SESSION_EXPIRED,
            'high',
            'Authentication error occurred. Please try logging in again.'
          ),
          { event, userId: session?.user?.id },
          false // Don't show toast for auth state changes
        );
        setLoading(false);
      }
    });

    // Initial session check
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        await handleError(
          new CustomError(
            'Failed to retrieve session',
            ErrorCodes.AUTH_SESSION_EXPIRED,
            'medium'
          ),
          {},
          false
        );
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
