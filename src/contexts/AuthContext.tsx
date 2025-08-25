import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
    let isMounted = true; // Prevent state updates after unmount
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return; // Prevent race conditions after unmount
      
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
            // Use session state instead of user state to avoid dependency
            if (session?.user) {
              localStorage.removeItem(`user_role_${session.user.id}`);
              console.log('User signed out:', session.user.id);
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
          if (isMounted) {
            setLoading(false);
          }
        }
    });

    // Initial session check
    const checkInitialSession = async () => {
      if (!isMounted) return; // Prevent race conditions
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
          // Don't treat this as a fatal error - user might just not be logged in
          if (isMounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error during session check:', error);
        // On network errors, assume user is not logged in rather than getting stuck
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    checkInitialSession();

    return () => {
      isMounted = false; // Mark as unmounted to prevent race conditions
      subscription.unsubscribe();
    };
  }, []); // SECURITY FIX: Removed [user] dependency to prevent infinite loops

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
