import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  TrendingUp, 
  Users, 
  Home, 
  Calendar, 
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart
} from 'lucide-react';

interface AnalyticsData {
  userGrowth: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down';
    data: Array<{ period: string; users: number; }>;
  };
  propertyGrowth: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down';
    data: Array<{ period: string; properties: number; }>;
  };
  bookingMetrics: {
    totalBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    conversionRate: number;
    data: Array<{ period: string; bookings: number; revenue: number; }>;
  };
  categoryDistribution: Array<{ category: string; count: number; percentage: number; }>;
  topCities: Array<{ city: string; properties: number; bookings: number; revenue: number; }>;
  recentTrends: {
    dailySignups: number;
    weeklySignups: number;
    monthlySignups: number;
    pendingApprovals: number;
  };
}

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: {
      current: 0,
      previous: 0,
      change: 0,
      trend: 'up',
      data: [],
    },
    propertyGrowth: {
      current: 0,
      previous: 0,
      change: 0,
      trend: 'up',
      data: [],
    },
    bookingMetrics: {
      totalBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
      conversionRate: 0,
      data: [],
    },
    categoryDistribution: [],
    topCities: [],
    recentTrends: {
      dailySignups: 0,
      weeklySignups: 0,
      monthlySignups: 0,
      pendingApprovals: 0,
    },
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Calculate date ranges
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      const prevStartDate = new Date(startDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Load user growth data
      const [currentUsers, previousUsers] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString())
      ]);

      // Load property growth data
      const [currentProperties, previousProperties] = await Promise.all([
        supabase
          .from('properties')
          .select('created_at')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('properties')
          .select('created_at')
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString())
      ]);

      // Load booking metrics
      const [bookings, allBookings] = await Promise.all([
        supabase
          .from('bookings')
          .select('created_at, total_price, status')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('bookings')
          .select('total_price')
      ]);

      // Load property distribution by type
      const { data: propertyTypes } = await supabase
        .from('properties')
        .select('property_type')
        .eq('is_active', true);

      // Load top cities
      const { data: cityData } = await supabase
        .from('properties')
        .select(`
          city,
          id,
          bookings!inner(id, total_price)
        `)
        .eq('is_active', true);

      // Load recent trends
      const [dailySignups, weeklySignups, monthlySignups, pendingApprovals] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'pending')
      ]);

      // Process user growth
      const currentUserCount = currentUsers.data?.length || 0;
      const previousUserCount = previousUsers.data?.length || 0;
      const userChange = previousUserCount === 0 ? 100 : ((currentUserCount - previousUserCount) / previousUserCount) * 100;

      // Process property growth
      const currentPropertyCount = currentProperties.data?.length || 0;
      const previousPropertyCount = previousProperties.data?.length || 0;
      const propertyChange = previousPropertyCount === 0 ? 100 : ((currentPropertyCount - previousPropertyCount) / previousPropertyCount) * 100;

      // Process booking metrics
      const totalBookings = bookings.data?.length || 0;
      const totalRevenue = bookings.data?.reduce((sum, booking) => sum + Number(booking.total_price), 0) || 0;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Process category distribution
      const typeCount: Record<string, number> = {};
      propertyTypes?.forEach(property => {
        const type = property.property_type || 'Unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });

      const categoryDistribution = Object.entries(typeCount).map(([category, count]) => ({
        category,
        count,
        percentage: propertyTypes ? (count / propertyTypes.length) * 100 : 0
      }));

      // Process top cities
      const cityStats: Record<string, { properties: number; bookings: number; revenue: number; }> = {};
      cityData?.forEach(property => {
        const city = property.city || 'Unknown';
        if (!cityStats[city]) {
          cityStats[city] = { properties: 0, bookings: 0, revenue: 0 };
        }
        cityStats[city].properties += 1;
        cityStats[city].bookings += property.bookings?.length || 0;
        cityStats[city].revenue += property.bookings?.reduce((sum: number, booking: any) => sum + Number(booking.total_price), 0) || 0;
      });

      const topCities = Object.entries(cityStats)
        .map(([city, stats]) => ({ city, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setAnalytics({
        userGrowth: {
          current: currentUserCount,
          previous: previousUserCount,
          change: userChange,
          trend: userChange >= 0 ? 'up' : 'down',
          data: [], // Would populate with daily/weekly data in real implementation
        },
        propertyGrowth: {
          current: currentPropertyCount,
          previous: previousPropertyCount,
          change: propertyChange,
          trend: propertyChange >= 0 ? 'up' : 'down',
          data: [], // Would populate with daily/weekly data in real implementation
        },
        bookingMetrics: {
          totalBookings,
          totalRevenue,
          averageBookingValue,
          conversionRate: 0, // Would calculate from visitor data
          data: [], // Would populate with time series data
        },
        categoryDistribution,
        topCities,
        recentTrends: {
          dailySignups: dailySignups.count || 0,
          weeklySignups: weeklySignups.count || 0,
          monthlySignups: monthlySignups.count || 0,
          pendingApprovals: pendingApprovals.count || 0,
        },
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Platform performance insights and metrics</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Growth</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userGrowth.current}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.userGrowth.trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={analytics.userGrowth.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(analytics.userGrowth.change).toFixed(1)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Growth</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.propertyGrowth.current}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.propertyGrowth.trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={analytics.propertyGrowth.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(analytics.propertyGrowth.change).toFixed(1)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.bookingMetrics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${analytics.bookingMetrics.averageBookingValue.toFixed(0)} per booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.bookingMetrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Platform revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentTrends.dailySignups}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Weekly Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentTrends.weeklySignups}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentTrends.monthlySignups}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.recentTrends.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Properties awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Property Type Distribution</span>
            </CardTitle>
            <CardDescription>Breakdown of property types on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.categoryDistribution.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
                    />
                    <span className="text-sm capitalize">{category.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{category.count}</span>
                    <Badge variant="outline">{category.percentage.toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
            {analytics.categoryDistribution.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No property data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Top Performing Cities</span>
            </CardTitle>
            <CardDescription>Cities with highest revenue and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCities.map((city, index) => (
                <div key={city.city} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{city.city}</div>
                    <div className="text-sm text-muted-foreground">
                      {city.properties} properties • {city.bookings} bookings
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${city.revenue.toLocaleString()}</div>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
            {analytics.topCities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No city data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Charts Placeholder */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Growth Trends</span>
          </CardTitle>
          <CardDescription>User and property growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Growth charts would be rendered here</p>
              <p className="text-xs">Integration with charting library needed</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsDashboard;