import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Bell, Settings, User, Home, Menu } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';

const AdminHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const getUserInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const getUserName = (email: string) => {
    return email.split('@')[0];
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 items-center justify-between'>
        {/* Logo and Brand */}
        <div className='flex items-center space-x-4'>
          <Link to='/' className='flex items-center space-x-2'>
            <Home className='h-6 w-6 text-primary' />
            <span className='text-lg font-semibold'>VENVL</span>
          </Link>
          <div className='hidden md:block'>
            <span className='text-sm text-muted-foreground'>|</span>
            <span className='ml-2 text-sm font-medium'>Super Admin</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className='hidden md:flex items-center space-x-4'>
          <Button variant='ghost' size='sm'>
            <Bell className='h-4 w-4' />
          </Button>

          <Button variant='ghost' size='sm'>
            <Settings className='h-4 w-4' />
          </Button>

          {/* User Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src='/placeholder.svg' alt='User avatar' />
                  <AvatarFallback className='bg-primary text-primary-foreground'>
                    {user?.email ? getUserInitials(user.email) : 'SA'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end' forceMount>
              <DropdownMenuLabel className='font-normal'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-sm font-medium leading-none'>
                    {user?.email ? getUserName(user.email) : 'Super Admin'}
                  </p>
                  <p className='text-xs leading-none text-muted-foreground'>
                    {user?.email || 'admin@venvl.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className='mr-2 h-4 w-4' />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className='mr-2 h-4 w-4' />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className='mr-2 h-4 w-4' />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Button */}
        <div className='md:hidden'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className='h-5 w-5' />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className='md:hidden border-t bg-background/95 backdrop-blur'>
          <div className='container py-4 space-y-2'>
            <div className='flex items-center space-x-3 p-2'>
              <Avatar className='h-8 w-8'>
                <AvatarImage src='/placeholder.svg' alt='User avatar' />
                <AvatarFallback className='bg-primary text-primary-foreground'>
                  {user?.email ? getUserInitials(user.email) : 'SA'}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <p className='text-sm font-medium'>
                  {user?.email ? getUserName(user.email) : 'Super Admin'}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {user?.email || 'admin@venvl.com'}
                </p>
              </div>
            </div>
            <div className='space-y-1'>
              <Button
                variant='ghost'
                className='w-full justify-start'
                size='sm'
              >
                <Bell className='mr-2 h-4 w-4' />
                Notifications
              </Button>
              <Button
                variant='ghost'
                className='w-full justify-start'
                size='sm'
              >
                <Settings className='mr-2 h-4 w-4' />
                Settings
              </Button>
              <Button
                variant='ghost'
                className='w-full justify-start text-red-600'
                size='sm'
                onClick={handleSignOut}
              >
                <LogOut className='mr-2 h-4 w-4' />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeader;
