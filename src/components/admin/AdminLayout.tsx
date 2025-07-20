import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Database, 
  Users, 
  Shield, 
  FileText,
  Home,
  ChevronLeft
} from 'lucide-react';
import Header from '@/components/Header';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin/panel',
      icon: Home,
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
    {
      label: 'Meta Manager',
      href: '/admin/meta',
      icon: Database,
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      label: 'Roles',
      href: '/admin/roles',
      icon: Shield,
    },
    {
      label: 'Audit Logs',
      href: '/admin/audit',
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)]">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Link 
                to="/" 
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Main Site
              </Link>
            </div>
            
            <h2 className="text-lg font-semibold mb-4">Super Admin Panel</h2>
            
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
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
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            </div>
            
            <div className="bg-card rounded-lg border border-border">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;