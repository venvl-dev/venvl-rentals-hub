import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Users, 
  Home, 
  Calendar, 
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface MVPAnalyticsData {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApprovals: number;
}

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<MVPAnalyticsData>({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // MVP: Simple parallel queries for core metrics only
      // Each query gets total count - much simpler than time-based analysis
      const [
        { count: totalUsers },
        { count: totalProperties }, 
        { data: bookings },
        { count: pendingApprovals }
      ] = await Promise.all([
        // Total users ever registered
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        
        // Total properties ever created
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true }),
          
        // All bookings with prices (need data for revenue calculation)
        supabase
          .from('bookings')
          .select('total_price'),
          
        // Properties waiting for admin approval (actionable metric)
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'pending')
      ]);

      // Calculate total revenue and booking count
      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => 
        sum + Number(booking.total_price || 0), 0
      ) || 0;

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalProperties: totalProperties || 0,
        totalBookings,
        totalRevenue,
        pendingApprovals: pendingApprovals || 0,
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Analytics">
        <div className="flex items-center justify-center p-8">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics Dashboard">
      <div className="p-6 space-y-6">
        <div>
          <p className="text-muted-foreground">Essential platform metrics for MVP</p>
        </div>

        {/* MVP Core Metrics - Simple 5-card layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                Listed properties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                All-time bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Platform revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{analytics.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                Needs admin review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Summary</CardTitle>
            <CardDescription>Key insights at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">Average Revenue per Booking</span>
                  <span className="font-bold">
                    ${analytics.totalBookings > 0 ? Math.round(analytics.totalRevenue / analytics.totalBookings).toLocaleString() : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">Properties per User</span>
                  <span className="font-bold">
                    {analytics.totalUsers > 0 ? (analytics.totalProperties / analytics.totalUsers).toFixed(1) : 0}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">Bookings per Property</span>
                  <span className="font-bold">
                    {analytics.totalProperties > 0 ? (analytics.totalBookings / analytics.totalProperties).toFixed(1) : 0}
                  </span>
                </div>
                {analytics.pendingApprovals > 0 && (
                  <div className="flex justify-between items-center p-3 border rounded bg-orange-50">
                    <span className="font-medium text-orange-700">Action Required</span>
                    <span className="font-bold text-orange-600">
                      {analytics.pendingApprovals} approval{analytics.pendingApprovals !== 1 ? 's' : ''} pending
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsDashboard;