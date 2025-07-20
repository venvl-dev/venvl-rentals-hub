
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { handleError, CustomError, ErrorCodes } from '@/lib/errorHandling';
import {
  Menu, 
  Search, 
  User as UserIcon, 
  LogOut, 
  Building2, 
  Calendar,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

const Header = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          setUserRole(profile?.role || null);
        } catch (error) {
          handleError(
            new CustomError(
              'Error fetching user role',
              ErrorCodes.AUTH_UNAUTHORIZED,
              'low'
            ),
            { error }
          );
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    };

    fetchRole();
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        handleError(
          new CustomError(
            'Sign out error',
            ErrorCodes.AUTH_UNAUTHORIZED,
            'medium'
          ),
          { error }
        );
        toast.error('Error signing out: ' + error.message);
      } else {
        toast.success('Signed out successfully');
        navigate('/');
      }
    } catch (error) {
      handleError(
        new CustomError(
          'Unexpected sign out error',
          ErrorCodes.SYSTEM_DATABASE_ERROR,
          'high'
        ),
        { error }
      );
      toast.error('Error signing out');
      navigate('/');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.first_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'super_admin':
        return <Shield className="h-4 w-4" />;
      case 'host':
        return <Building2 className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'super_admin':
        return 'text-red-600';
      case 'host':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRoleDisplay = () => {
    switch (userRole) {
      case 'super_admin':
        return 'Super Admin';
      case 'host':
        return 'Host';
      case 'guest':
        return 'Guest';
      default:
        return 'Guest';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/lovable-uploads/6b90bd6a-9b4a-4cfe-89f0-5a06cd21ab9a.png" 
              alt="VENVL Logo" 
              className="h-10 object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          {/* Search Bar - Hidden on small screens */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search properties, cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-full border-gray-300 focus:border-black focus:ring-black bg-gray-50 hover:bg-white transition-colors"
                />
              </div>
            </form>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Host Dashboard Link */}
                {userRole === 'host' && (
                  <Link to="/host/dashboard">
                    <Button variant="ghost" size="sm" className="hidden sm:flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>Host Dashboard</span>
                    </Button>
                  </Link>
                )}

                {/* Super Admin Panel Link */}
                {userRole === 'super_admin' && (
                  <Link to="/admin/panel">
                    <Button variant="ghost" size="sm" className="hidden sm:flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Super Admin Panel</span>
                    </Button>
                  </Link>
                )}

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100">
                      <Menu className="h-4 w-4" />
                      <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {getRoleIcon()}
                        <p className={`text-xs ${getRoleColor()}`}>
                          {getRoleDisplay()}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {userRole === 'guest' && (
                      <DropdownMenuItem asChild>
                        <Link to="/guest/bookings" className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>My Bookings</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {userRole === 'host' && (
                      <DropdownMenuItem asChild>
                        <Link to="/host/dashboard" className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>Host Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {userRole === 'super_admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/panel" className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Super Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/auth">
                  <Button variant="ghost" className="font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-black hover:bg-gray-800 text-white font-medium px-6">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
