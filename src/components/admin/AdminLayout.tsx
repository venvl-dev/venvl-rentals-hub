import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Database, 
  Users, 
  Shield, 
  FileText,
  Home,
  ChevronLeft,
  Building,
  TrendingUp,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AdminHeader from '@/components/admin/AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin/panel',
      icon: Home,
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      label: 'Properties',
      href: '/admin/properties',
      icon: Building,
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: TrendingUp,
    },
    {
      label: 'Moderation',
      href: '/admin/moderation',
      icon: AlertTriangle,
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
    {
      label: 'Audit Logs',
      href: '/admin/logs',
      icon: FileText,
    },
  ];

  const SidebarContent = () => (
    <div className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          to="/" 
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Main Site
        </Link>
      </div>
      
      <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
      
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background w-full">
      <AdminHeader />
      
      <div className="flex w-full">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-card border-r border-border min-h-[calc(100vh-3.5rem)]">
          <SidebarContent />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden fixed top-16 left-4 z-40"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 w-full">
          <div className="p-4 lg:p-6">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;