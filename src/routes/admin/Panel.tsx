import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Home,
  Calendar,
  DollarSign,
  Settings,
  Shield,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeUsers: number;
  monthlyGrowth: number;
}

interface RecentActivity {
  id: string;
  type:
    | 'user_signup'
    | 'property_submit'
    | 'booking_made'
    | 'property_approved';
  description: string;
  timestamp: string;
  user?: string;
}

const SuperAdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    monthlyGrowth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load comprehensive stats
      const [
        usersResult,
        propertiesResult,
        bookingsResult,
        pendingPropertiesResult,
        activeUsersResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('total_price'),
        supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('approval_status', 'pending'),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
      ]);

      const totalRevenue =
        bookingsResult.data?.reduce(
          (sum, booking) => sum + Number(booking.total_price),
          0,
        ) || 0;

      // Calculate monthly growth (mock data for now)
      const currentMonth = new Date().getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

      setStats({
        totalUsers: usersResult.count || 0,
        totalProperties: propertiesResult.count || 0,
        totalBookings: bookingsResult.data?.length || 0,
        totalRevenue,
        pendingApprovals: pendingPropertiesResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
        monthlyGrowth: 12.5, // Mock data
      });

      // Load recent activity (simplified for now)
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select(
          `
          id,
          created_at,
          property:properties(title),
          guest:profiles!bookings_guest_id_fkey(first_name, last_name)
        `,
        )
        .order('created_at', { ascending: false })
        .limit(5);

      const activity: RecentActivity[] =
        recentBookings?.map((booking) => ({
          id: booking.id,
          type: 'booking_made',
          description: `New booking for ${booking.property?.title || 'Unknown Property'}`,
          timestamp: booking.created_at,
          user:
            `${booking.guest?.first_name || ''} ${booking.guest?.last_name || ''}`.trim() ||
            'Unknown User',
        })) || [];

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title='Dashboard'>
        <div className='flex items-center justify-center p-8'>
          <div className='text-lg'>Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title='Super Admin Dashboard'>
      <div className='p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-muted-foreground'>
              VENVL Rentals Hub Management Panel
            </p>
          </div>
          <Badge variant='secondary' className='flex items-center space-x-1'>
            <Shield className='h-4 w-4' />
            <span>Super Admin</span>
          </Badge>
        </div>

        {/* Main Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stats.totalUsers.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>
                {stats.activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Properties</CardTitle>
              <Home className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stats.totalProperties.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>
                {stats.pendingApprovals} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Bookings
              </CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stats.totalBookings.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>
                +{stats.monthlyGrowth}% this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Revenue</CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>
                Total platform revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Users className='h-5 w-5' />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Manage users, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <Link to='/admin/users'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Eye className='h-4 w-4 mr-2' />
                    View All Users
                  </Button>
                </Link>
                <Link to='/admin/roles'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Shield className='h-4 w-4 mr-2' />
                    Manage Roles
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Home className='h-5 w-5' />
                <span>Property Management</span>
              </CardTitle>
              <CardDescription>
                Review and manage all properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <Link to='/admin/properties'>
                  <Button variant='outline' className='w-full justify-start'>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Approve Properties
                  </Button>
                </Link>
                {stats.pendingApprovals > 0 && (
                  <Badge
                    variant='destructive'
                    className='w-full justify-center'
                  >
                    {stats.pendingApprovals} pending approvals
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Settings className='h-5 w-5' />
                <span>Platform Configuration</span>
              </CardTitle>
              <CardDescription>
                Manage platform settings and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <Link to='/admin/amenities'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Activity className='h-4 w-4 mr-2' />
                    Amenities
                  </Button>
                </Link>
                <Link to='/admin/property-types'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Home className='h-4 w-4 mr-2' />
                    Property Types
                  </Button>
                </Link>
                <Link to='/admin/settings'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Settings className='h-4 w-4 mr-2' />
                    Global Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics and Logs Row */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <TrendingUp className='h-5 w-5' />
                <span>Analytics Dashboard</span>
              </CardTitle>
              <CardDescription>
                View platform performance and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to='/admin/analytics'>
                <Button className='w-full'>
                  <TrendingUp className='h-4 w-4 mr-2' />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <FileText className='h-5 w-5' />
                <span>System Logs</span>
              </CardTitle>
              <CardDescription>
                Monitor system activities and audit logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to='/admin/logs'>
                <Button variant='outline' className='w-full'>
                  <FileText className='h-4 w-4 mr-2' />
                  View Audit Logs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className='mt-8'>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest platform activities and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className='space-y-4'>
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className='flex items-center space-x-4 p-3 border rounded-lg'
                  >
                    <div className='p-2 bg-primary/10 rounded-full'>
                      {activity.type === 'booking_made' && (
                        <Calendar className='h-4 w-4 text-primary' />
                      )}
                      {activity.type === 'user_signup' && (
                        <Users className='h-4 w-4 text-primary' />
                      )}
                      {activity.type === 'property_submit' && (
                        <Home className='h-4 w-4 text-primary' />
                      )}
                      {activity.type === 'property_approved' && (
                        <CheckCircle className='h-4 w-4 text-primary' />
                      )}
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium'>
                        {activity.description}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {activity.user && `by ${activity.user} • `}
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-muted-foreground'>
                <Activity className='h-12 w-12 mx-auto mb-4 opacity-50' />
                <p>No recent activity to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SuperAdminPanel;
