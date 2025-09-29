import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays,
  TrendingUp,
  Home,
  DollarSign,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  UserCheck,
  Award,
} from 'lucide-react';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  isWithinInterval,
} from 'date-fns';

interface PropertySaturation {
  id: string;
  title: string;
  totalDays: number;
  bookedDays: number;
  occupancyRate: number;
  revenue: number;
  bookingsCount: number;
  avgBookingValue: number;
}

interface SaturationMetrics {
  totalProperties: number;
  totalRevenue: number;
  totalBookings: number;
  averageOccupancy: number;
  topPerformingProperty: string;
  totalAvailableDays: number;
  totalBookedDays: number;
  pendingBookings: number;
  confirmedBookings: number;
  checkedInBookings: number;
  completedBookings: number;
}

const BookingSaturationDashboard = () => {
  const [properties, setProperties] = useState<PropertySaturation[]>([]);
  const [metrics, setMetrics] = useState<SaturationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchSaturationData();
  }, [timeRange]);

  const fetchSaturationData = async () => {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const days = parseInt(timeRange);
      const startDate = subDays(new Date(), days);
      const endDate = new Date();

      // Get host properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title, is_active')
        .eq('host_id', user.data.user.id)
        .eq('is_active', true);

      if (propertiesError) throw propertiesError;

      if (!propertiesData || propertiesData.length === 0) {
        setProperties([]);
        setMetrics({
          totalProperties: 0,
          totalRevenue: 0,
          totalBookings: 0,
          averageOccupancy: 0,
          topPerformingProperty: 'N/A',
          totalAvailableDays: 0,
          totalBookedDays: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          checkedInBookings: 0,
          completedBookings: 0,
        });
        return;
      }

      // Get all bookings for the time range (including all statuses)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(
          `
          id,
          property_id,
          check_in,
          check_out,
          total_price,
          status,
          properties!inner(host_id, title)
        `,
        )
        .eq('properties.host_id', user.data.user.id)
        .or(
          `and(check_in.gte.${format(startDate, 'yyyy-MM-dd')},check_in.lte.${format(endDate, 'yyyy-MM-dd')}),and(check_out.gte.${format(startDate, 'yyyy-MM-dd')},check_out.lte.${format(endDate, 'yyyy-MM-dd')}),and(check_in.lte.${format(startDate, 'yyyy-MM-dd')},check_out.gte.${format(endDate, 'yyyy-MM-dd')})`,
        );
      if (bookingsError) throw bookingsError;

      const totalDaysInRange = differenceInDays(endDate, startDate) + 1;

      // Calculate saturation for each property
      const propertySaturation: PropertySaturation[] = propertiesData.map(
        (property) => {
          const propertyBookings =
            bookingsData?.filter(
              (booking) => booking.property_id === property.id,
            ) || [];
          const confirmedBookings = propertyBookings.filter((b) =>
            ['confirmed', 'checked_in', 'completed'].includes(b.status),
          );

          let bookedDays = 0;
          let totalRevenue = 0;

          confirmedBookings.forEach((booking) => {
            const checkIn = new Date(booking.check_in);
            const checkOut = new Date(booking.check_out);

            // Calculate overlapping days within our time range
            const overlapStart = checkIn < startDate ? startDate : checkIn;
            const overlapEnd = checkOut > endDate ? endDate : checkOut;

            if (overlapStart <= overlapEnd) {
              const totalsBookedDays = differenceInDays(checkOut, checkIn) + 1;
              const daysBooked = differenceInDays(overlapEnd, overlapStart) + 1;
              bookedDays += daysBooked;

              totalRevenue +=
                booking.total_price * (daysBooked / totalsBookedDays);
            }
          });

          const occupancyRate =
            totalDaysInRange > 0 ? (bookedDays / totalDaysInRange) * 100 : 0;
          const avgBookingValue =
            confirmedBookings.length > 0
              ? totalRevenue / confirmedBookings.length
              : 0;

          return {
            id: property.id,
            title: property.title,
            totalDays: totalDaysInRange,
            bookedDays,
            occupancyRate,
            revenue: totalRevenue,
            bookingsCount: confirmedBookings.length,
            avgBookingValue,
          };
        },
      );

      // Calculate overall metrics
      const totalRevenue = propertySaturation.reduce(
        (sum, prop) => sum + prop.revenue,
        0,
      );
      const totalBookings = propertySaturation.reduce(
        (sum, prop) => sum + prop.bookingsCount,
        0,
      );
      const totalAvailableDays = propertySaturation.reduce(
        (sum, prop) => sum + prop.totalDays,
        0,
      );
      const totalBookedDays = propertySaturation.reduce(
        (sum, prop) => sum + prop.bookedDays,
        0,
      );
      const averageOccupancy =
        totalAvailableDays > 0
          ? (totalBookedDays / totalAvailableDays) * 100
          : 0;

      // Calculate booking status counts
      const allBookings = bookingsData || [];
      const pendingBookings = allBookings.filter(
        (b) => b.status === 'pending',
      ).length;
      const confirmedBookings = allBookings.filter(
        (b) => b.status === 'confirmed',
      ).length;
      const checkedInBookings = allBookings.filter(
        (b) => b.status === 'checked_in',
      ).length;
      const completedBookings = allBookings.filter(
        (b) => b.status === 'completed',
      ).length;

      const topPerformer = propertySaturation.reduce(
        (top, current) =>
          current.occupancyRate > (top?.occupancyRate || 0) ? current : top,
        propertySaturation[0],
      );

      setProperties(propertySaturation);
      setMetrics({
        totalProperties: propertiesData.length,
        totalRevenue,
        totalBookings,
        averageOccupancy,
        topPerformingProperty: topPerformer?.title || 'N/A',
        totalAvailableDays,
        totalBookedDays,
        pendingBookings,
        confirmedBookings,
        checkedInBookings,
        completedBookings,
      });
    } catch (error) {
      console.error('Error fetching saturation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    if (rate >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getOccupancyBadgeColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    if (rate >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Card className='rounded-3xl shadow-lg'>
        <CardContent className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <div className='text-gray-600'>Loading saturation data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || properties.length === 0) {
    return (
      <Card className='rounded-3xl shadow-lg'>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <BarChart3 className='h-16 w-16 text-gray-400 mb-4' />
          <h3 className='text-xl font-semibold mb-2'>No data available</h3>
          <p className='text-gray-600'>
            Add active properties to view saturation metrics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold flex items-center gap-2'>
            <BarChart3 className='h-6 w-6' />
            Booking Saturation Dashboard
          </h2>
          <p className='text-gray-600'>
            Track your property performance and occupancy rates
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className='w-48 rounded-xl'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='7'>Last 7 days</SelectItem>
            <SelectItem value='30'>Last 30 days</SelectItem>
            <SelectItem value='90'>Last 3 months</SelectItem>
            <SelectItem value='365'>Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='rounded-2xl shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Overall Occupancy
                </p>
                <p
                  className={`text-2xl font-bold ${getOccupancyColor(metrics.averageOccupancy)}`}
                >
                  {metrics.averageOccupancy.toFixed(1)}%
                </p>
              </div>
              <CalendarDays className='h-8 w-8 text-gray-400' />
            </div>
            <Progress value={metrics.averageOccupancy} className='mt-3' />
          </CardContent>
        </Card>

        <Card className='rounded-2xl shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Revenue
                </p>
                <p className='text-2xl font-bold'>
                  EGP {metrics.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className='h-8 w-8 text-gray-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Bookings
                </p>
                <p className='text-2xl font-bold'>{metrics.totalBookings}</p>
              </div>
              <Users className='h-8 w-8 text-gray-400' />
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Active Properties
                </p>
                <p className='text-2xl font-bold'>{metrics.totalProperties}</p>
              </div>
              <Home className='h-8 w-8 text-gray-400' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='rounded-2xl shadow-sm border-yellow-200 bg-yellow-50'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-yellow-700'>Pending</p>
                <p className='text-2xl font-bold text-yellow-800'>
                  {metrics.pendingBookings}
                </p>
                <p className='text-xs text-yellow-600'>Awaiting approval</p>
              </div>
              <Clock className='h-8 w-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl shadow-sm border-green-200 bg-green-50'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-green-700'>Confirmed</p>
                <p className='text-2xl font-bold text-green-800'>
                  {metrics.confirmedBookings}
                </p>
                <p className='text-xs text-green-600'>Ready for check-in</p>
              </div>
              <CheckCircle className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl shadow-sm border-purple-200 bg-purple-50'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-purple-700'>
                  Checked In
                </p>
                <p className='text-2xl font-bold text-purple-800'>
                  {metrics.checkedInBookings}
                </p>
                <p className='text-xs text-purple-600'>Currently staying</p>
              </div>
              <UserCheck className='h-8 w-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl shadow-sm border-blue-200 bg-blue-50'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-blue-700'>Completed</p>
                <p className='text-2xl font-bold text-blue-800'>
                  {metrics.completedBookings}
                </p>
                <p className='text-xs text-blue-600'>Successfully finished</p>
              </div>
              <Award className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performer */}
      <Card className='rounded-2xl shadow-sm bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-blue-800'>
                🏆 Top Performing Property
              </p>
              <p className='text-xl font-bold text-blue-900'>
                {metrics.topPerformingProperty}
              </p>
              <p className='text-sm text-blue-700'>Leading in occupancy rate</p>
            </div>
            <TrendingUp className='h-8 w-8 text-blue-500' />
          </div>
        </CardContent>
      </Card>

      {/* Summary insights */}
      <Card className='rounded-2xl shadow-sm bg-gray-50'>
        <CardContent className='p-6'>
          <h3 className='font-semibold mb-3 flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            Quick Insights
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-gray-600'>
                • You have {metrics.totalBookedDays} booked days out of{' '}
                {metrics.totalAvailableDays} available days
              </p>
              <p className='text-gray-600'>
                • Average booking value across all properties: EGP{' '}
                {metrics.totalBookings > 0
                  ? (metrics.totalRevenue / metrics.totalBookings).toFixed(0)
                  : '0'}
              </p>
            </div>
            <div>
              <p className='text-gray-600'>
                • {properties.filter((p) => p.occupancyRate >= 80).length}{' '}
                properties with 80%+ occupancy
              </p>
              <p className='text-gray-600'>
                • {properties.filter((p) => p.occupancyRate < 40).length}{' '}
                properties need attention (under 40% occupancy)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingSaturationDashboard;
