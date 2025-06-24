
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Home, User as UserIcon, LogOut, Plus, BarChart3, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserRole(data?.role || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Home className="h-8 w-8 text-black" />
          <span className="text-2xl font-bold text-black">VENVL</span>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSelector />
          
          {user ? (
            <>
              {(userRole === 'host' || userRole === 'admin' || userRole === 'super_admin') && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/host')}
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>{t('header.hostDashboard')}</span>
                </Button>
              )}

              {(userRole === 'admin' || userRole === 'super_admin') && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="flex items-center space-x-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>{t('header.adminPanel')}</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => navigate('/host')}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{t('header.hostProperty')}</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>{t('header.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/bookings')}>
                    <span>{t('header.myBookings')}</span>
                  </DropdownMenuItem>
                  {(userRole === 'host' || userRole === 'admin' || userRole === 'super_admin') && (
                    <DropdownMenuItem onClick={() => navigate('/host')}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>{t('header.hostDashboard')}</span>
                    </DropdownMenuItem>
                  )}
                  {(userRole === 'admin' || userRole === 'super_admin') && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>{t('header.adminPanel')}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/properties')}>
                    <span>{t('header.myProperties')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('header.signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                {t('header.signIn')}
              </Button>
              <Button onClick={() => navigate('/auth')}>
                {t('header.signUp')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
