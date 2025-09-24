import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  TrendingUp,
  Download,
  Calendar as CalendarIcon,
  BarChart3,
  PieChart,
  FileText,
  Users,
  Home,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';

interface RevenueData {
  totalRevenue: number;
  commissionEarned: number;
  totalBookings: number;
  averageBookingValue: number;
  monthlyGrowth: number;
  topHosts: Array<{
    host_id: string;
    host_name: string;
    revenue: number;
    bookings: number;
  }>;
  cityBreakdown: Array<{ city: string; revenue: number; bookings: number }>;
  propertyTypeBreakdown: Array<{
    type: string;
    revenue: number;
    bookings: number;
  }>;
  timeSeriesData: Array<{ date: string; revenue: number; bookings: number }>;
}

const RevenueManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    commissionEarned: 0,
    totalBookings: 0,
    averageBookingValue: 0,
    monthlyGrowth: 0,
    topHosts: [],
    cityBreakdown: [],
    propertyTypeBreakdown: [],
    timeSeriesData: [],
  });

  useEffect(() => {
    loadRevenueData();
  }, [dateRange]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);

      // Load completed bookings within date range
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(
          `
          id,
          total_price,
          created_at,
          check_in,
          check_out,
          property:properties(
            id,
            title,
            city,
            property_type,
            profiles!properties_host_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          )
        `,
        )
        .eq('status', 'completed')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate revenue metrics
      const totalRevenue = (bookings || []).reduce(
        (sum, booking) => sum + Number(booking.total_price),
        0,
      );
      const commissionRate = 0.1; // 10% commission
      const commissionEarned = totalRevenue * commissionRate;
      const totalBookings = bookings?.length || 0;
      const averageBookingValue =
        totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate monthly growth (simplified)
      const monthlyGrowth = 12.5; // Mock data - would calculate from previous period

      // Group by hosts
      const hostRevenue: Record<
        string,
        { name: string; revenue: number; bookings: number }
      > = {};

      (bookings || []).forEach((booking) => {
        const hostId = booking.property?.profiles?.id;
        if (hostId) {
          const hostName =
            `${booking.property?.profiles?.first_name || ''} ${booking.property?.profiles?.last_name || ''}`.trim() ||
            booking.property?.profiles?.email ||
            'Unknown Host';

          if (!hostRevenue[hostId]) {
            hostRevenue[hostId] = { name: hostName, revenue: 0, bookings: 0 };
          }
          hostRevenue[hostId].revenue += Number(booking.total_price);
          hostRevenue[hostId].bookings += 1;
        }
      });

      const topHosts = Object.entries(hostRevenue)
        .map(([host_id, data]) => ({
          host_id,
          host_name: data.name,
          revenue: data.revenue,
          bookings: data.bookings,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Group by cities
      const cityRevenue: Record<string, { revenue: number; bookings: number }> =
        {};
      (bookings || []).forEach((booking) => {
        const city = booking.property?.city || 'Unknown';
        if (!cityRevenue[city]) {
          cityRevenue[city] = { revenue: 0, bookings: 0 };
        }
        cityRevenue[city].revenue += Number(booking.total_price);
        cityRevenue[city].bookings += 1;
      });

      const cityBreakdown = Object.entries(cityRevenue)
        .map(([city, data]) => ({ city, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      // Group by property types
      const typeRevenue: Record<string, { revenue: number; bookings: number }> =
        {};
      (bookings || []).forEach((booking) => {
        const type = booking.property?.property_type || 'Unknown';
        if (!typeRevenue[type]) {
          typeRevenue[type] = { revenue: 0, bookings: 0 };
        }
        typeRevenue[type].revenue += Number(booking.total_price);
        typeRevenue[type].bookings += 1;
      });

      const propertyTypeBreakdown = Object.entries(typeRevenue)
        .map(([type, data]) => ({ type, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      // Generate time series data (simplified)
      const timeSeriesData = []; // Would generate daily/weekly/monthly data points

      setRevenueData({
        totalRevenue,
        commissionEarned,
        totalBookings,
        averageBookingValue,
        monthlyGrowth,
        topHosts,
        cityBreakdown,
        propertyTypeBreakdown,
        timeSeriesData,
      });
    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load revenue data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);

      const { data, error } = await supabase.functions.invoke(
        'export-reports',
        {
          body: {
            report_type: 'revenue',
            format,
            date_from: dateRange.from.toISOString().split('T')[0],
            date_to: dateRange.to.toISOString().split('T')[0],
          },
        },
      );

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue_report_${format}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Revenue report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>
            Revenue Management
          </h1>
          <p className='text-muted-foreground mt-2'>
            Track platform revenue and financial performance
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline'>
                <CalendarIcon className='h-4 w-4 mr-2' />
                {format(dateRange.from, 'MMM dd')} -{' '}
                {format(dateRange.to, 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='end'>
              <Calendar
                mode='range'
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant='outline'
            onClick={() => exportReport('csv')}
            disabled={exporting}
          >
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
          <Button
            variant='outline'
            onClick={() => exportReport('json')}
            disabled={exporting}
          >
            <FileText className='h-4 w-4 mr-2' />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${revenueData.totalRevenue.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              +{revenueData.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Commission Earned
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${revenueData.commissionEarned.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              10% of total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Bookings
            </CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {revenueData.totalBookings}
            </div>
            <p className='text-xs text-muted-foreground'>Completed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg Booking Value
            </CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${revenueData.averageBookingValue.toFixed(0)}
            </div>
            <p className='text-xs text-muted-foreground'>Per booking average</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Tables */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        {/* Top Hosts */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Users className='h-5 w-5' />
              <span>Top Performing Hosts</span>
            </CardTitle>
            <CardDescription>Hosts generating the most revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.topHosts.slice(0, 5).map((host, index) => (
                  <TableRow key={host.host_id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>{host.host_name}</div>
                        <Badge variant='outline'>#{index + 1}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{host.bookings}</TableCell>
                    <TableCell className='font-medium'>
                      ${host.revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* City Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <MapPin className='h-5 w-5' />
              <span>Revenue by City</span>
            </CardTitle>
            <CardDescription>Geographic revenue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.cityBreakdown.slice(0, 5).map((city) => (
                  <TableRow key={city.city}>
                    <TableCell className='font-medium'>{city.city}</TableCell>
                    <TableCell>{city.bookings}</TableCell>
                    <TableCell className='font-medium'>
                      ${city.revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Property Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Home className='h-5 w-5' />
            <span>Revenue by Property Type</span>
          </CardTitle>
          <CardDescription>
            Performance across different property categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {revenueData.propertyTypeBreakdown.map((type) => (
              <div key={type.type} className='p-4 border rounded-lg'>
                <div className='flex items-center justify-between mb-2'>
                  <h3 className='font-medium capitalize'>{type.type}</h3>
                  <Badge variant='outline'>{type.bookings} bookings</Badge>
                </div>
                <div className='text-2xl font-bold'>
                  ${type.revenue.toLocaleString()}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Avg: ${(type.revenue / type.bookings).toFixed(0)} per booking
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Growth Chart Placeholder */}
      <Card className='mt-6'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5' />
            <span>Revenue Trends</span>
          </CardTitle>
          <CardDescription>Revenue growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg'>
            <div className='text-center text-muted-foreground'>
              <PieChart className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p>Revenue trend charts would be rendered here</p>
              <p className='text-xs'>
                Integration with charting library needed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueManagement;
