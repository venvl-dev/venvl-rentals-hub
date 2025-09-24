import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        switch (event) {
          case 'INITIAL_SESSION':
          case 'SIGNED_IN':
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Log successful authentication
            if (session?.user && event === 'SIGNED_IN') {
              console.log('User signed in:', session.user.id);
            }
            break;

          case 'SIGNED_OUT':
            if (userId) {
              localStorage.removeItem(`user_role_${userId}`);
              console.log('User signed out:', userId);
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
        console.error('Authentication state change error:', error);
        setLoading(false);
      }
    });

    // Initial session check
    const checkInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
          // Don't treat this as a fatal error - user might just not be logged in
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('Unexpected error during session check:', error);
        // On network errors, assume user is not logged in rather than getting stuck
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

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
