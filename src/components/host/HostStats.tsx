
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BarChart3, DollarSign, Calendar, Home, TrendingUp, Users, Percent, Target, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

type TimePeriod = '30d' | '90d' | '6m' | '1y' | 'all';

interface Stats {
    totalProperties: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    occupancyRate: number;
    bookedNights: number;          // ✅ NEW
    availableNights: number;       // ✅ NEW
    averageDailyRate: number;      // ✅ NEW (ADR)
    revenuePAR: number;            // ✅ NEW (Revenue Per Available Room)
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
    bookedNights: 0,
    availableNights: 0,
    averageDailyRate: 0,
    revenuePAR: 0,
    monthlyRevenue: [],
    bookingsByStatus: []
  });
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');

  useEffect(() => {
    fetchStats();
  }, [timePeriod]);

  const fetchStats = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Calculate date range based on selected period
      const getDateRange = (period: TimePeriod) => {
        const now = new Date();
        switch (period) {
          case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          case '6m': return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          default: return new Date('2020-01-01'); // All time
        }
      };

      const startDate = getDateRange(timePeriod);
      const now = new Date();

      // Fetch properties (only active, non-deleted ones, filtered by time period)
      const { data: allProperties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, created_at')
        .eq('host_id', user.data.user.id)
        .is('deleted_at', null);

      if (propertiesError) throw propertiesError;

      // For "all time", use all properties. For time periods, show properties that had bookings
      let properties = allProperties;

      // Fetch bookings within date range for confirmed/completed bookings only
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner(host_id)
        `)
        .eq('properties.host_id', user.data.user.id)
        .gte('check_in', startDate.toISOString().split('T')[0])
        .in('status', ['confirmed', 'completed', 'checked_in']);

      if (bookingsError) throw bookingsError;

      // Filter properties to only show those with bookings in the time period (more intuitive)
      if (timePeriod !== 'all') {
        const propertiesWithBookings = new Set(bookings?.map(booking => booking.property_id) || []);
        properties = allProperties?.filter(property => propertiesWithBookings.has(property.id)) || [];
      }

      // Calculate basic stats
      const totalProperties = properties?.length || 0;
      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_price, 0) || 0;

      // ✅ CORRECT AIRBNB-STYLE OCCUPANCY CALCULATION
      // Calculate booked nights (sum of all booking durations)
      const bookedNights = bookings?.reduce((total, booking) => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return total + nights;
      }, 0) || 0;

      // Calculate available nights
      const daysInPeriod = timePeriod === 'all' 
        ? Math.ceil((now.getTime() - new Date('2020-01-01').getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const availableNights = totalProperties * daysInPeriod;

      // Fetch reviews for average rating (filtered by time period)
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          rating,
          created_at,
          property_id,
          properties!inner(host_id)
        `)
        .eq('properties.host_id', user.data.user.id)
        .gte('created_at', startDate.toISOString());

      if (reviewsError) {
        console.warn('Error fetching reviews:', reviewsError);
      }

      // Calculate average rating for the time period
      const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
        : 0;

      // Calculate key performance metrics
      const occupancyRate = availableNights > 0 ? (bookedNights / availableNights) * 100 : 0;
      const averageDailyRate = bookedNights > 0 ? totalRevenue / bookedNights : 0;
      const revenuePAR = availableNights > 0 ? totalRevenue / availableNights : 0;

      // Group bookings by status (all bookings, not just within date range for overview)
      const { data: allBookings, error: allBookingsError } = await supabase
        .from('bookings')
        .select(`
          status,
          properties!inner(host_id)
        `)
        .eq('properties.host_id', user.data.user.id);

      if (allBookingsError) {
        console.warn('Error fetching all bookings:', allBookingsError);
      }

      // Fixed aggregation: properly group by status
      const statusCounts: { [key: string]: number } = {};
      
      allBookings?.forEach(booking => {
        if (booking.status) {
          // Handle special cases for status formatting
          let normalizedStatus = booking.status.toLowerCase();
          switch (normalizedStatus) {
            case 'checked_in':
              normalizedStatus = 'Checked In';
              break;
            default:
              normalizedStatus = booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase();
          }
          statusCounts[normalizedStatus] = (statusCounts[normalizedStatus] || 0) + 1;
        }
      });

      const bookingsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      // Ensure we always have some data for the chart, even if empty
      if (bookingsByStatus.length === 0) {
        bookingsByStatus.push({ status: 'No Bookings', count: 0 });
      }

      // Fetch ALL bookings for monthly revenue chart (not filtered by time period)
      const { data: allBookingsForChart } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner(host_id)
        `)
        .eq('properties.host_id', user.data.user.id)
        .in('status', ['confirmed', 'completed', 'checked_in']);

      // Calculate monthly revenue (last 6 months) using ALL bookings
      const monthlyRevenue = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        const monthRevenue = allBookingsForChart?.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate.getMonth() === month.getMonth() && 
                 bookingDate.getFullYear() === month.getFullYear();
        }).reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;

        monthlyRevenue.push({ 
          month: monthName, 
          revenue: Math.round(monthRevenue * 100) / 100 // Round to 2 decimals
        });
      }

      // Debug logging for chart data and top cards
      console.log('📊 Analytics Debug:', {
        timePeriod,
        topCards: {
          totalProperties,
          totalBookings,
          totalRevenue,
          averageRating: Number(averageRating.toFixed(1))
        },
        dateRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        },
        charts: {
          monthlyRevenue: monthlyRevenue,
          bookingsByStatus: bookingsByStatus
        },
        allPropertiesCount: allProperties?.length || 0,
        filteredPropertiesCount: properties?.length || 0,
        reviewsCount: reviews?.length || 0
      });

      setStats({
        totalProperties,
        totalBookings,
        totalRevenue,
        averageRating,
        occupancyRate,
        bookedNights,
        availableNights,
        averageDailyRate,
        revenuePAR,
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
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
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Last 6 months revenue performance</p>
          </CardHeader>
          <CardContent>
            {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthlyRevenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} 
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>No revenue data available</p>
                  <p className="text-sm">Complete some bookings to see trends</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by Status</CardTitle>
            <p className="text-sm text-muted-foreground">All-time booking status distribution</p>
          </CardHeader>
          <CardContent>
            {stats.bookingsByStatus && stats.bookingsByStatus.length > 0 && stats.bookingsByStatus[0].status !== 'No Bookings' ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.bookingsByStatus} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="status" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, `${name} Bookings`]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>No booking data available</p>
                  <p className="text-sm">Your first bookings will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.bookedNights} of {stats.availableNights} nights booked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Daily Rate (ADR)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.averageDailyRate.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Revenue per booked night
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue PAR</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.revenuePAR.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Revenue per available night
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Booking Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
      </div>
    </div>
  );
};

export default HostStats;
