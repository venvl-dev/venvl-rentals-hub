
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { BarChart3, DollarSign, Calendar, Home, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Stats {
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  occupancyRate: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  bookingsByStatus: Array<{ status: string; count: number }>;
}

const HostStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    occupancyRate: 0,
    monthlyRevenue: [],
    bookingsByStatus: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Fetch properties count
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('host_id', user.data.user.id);

      if (propertiesError) throw propertiesError;

      // Fetch bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner(host_id)
        `)
        .eq('properties.host_id', user.data.user.id);

      if (bookingsError) throw bookingsError;

      // Calculate stats
      const totalProperties = properties?.length || 0;
      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_price, 0) || 0;

      // Group bookings by status
      const bookingsByStatus = bookings?.reduce((acc, booking) => {
        const existing = acc.find(item => item.status === booking.status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ status: booking.status, count: 1 });
        }
        return acc;
      }, [] as Array<{ status: string; count: number }>) || [];

      // Calculate monthly revenue (last 6 months)
      const monthlyRevenue = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        const monthRevenue = bookings?.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate.getMonth() === month.getMonth() && 
                 bookingDate.getFullYear() === month.getFullYear();
        }).reduce((sum, booking) => sum + booking.total_price, 0) || 0;

        monthlyRevenue.push({ month: monthName, revenue: monthRevenue });
      }

      setStats({
        totalProperties,
        totalBookings,
        totalRevenue,
        averageRating: 4.8, // This would come from reviews table
        occupancyRate: totalBookings > 0 ? (totalBookings / (totalProperties * 30)) * 100 : 0,
        monthlyRevenue,
        bookingsByStatus
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">Loading...</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              Active listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              All time bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Guest satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.bookingsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Booking Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalBookings > 0 ? (stats.totalRevenue / stats.totalBookings).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Per booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Properties Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalProperties > 0 ? (stats.totalBookings / stats.totalProperties).toFixed(1) : '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Bookings per property
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostStats;
