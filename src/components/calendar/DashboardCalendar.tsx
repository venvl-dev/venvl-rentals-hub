import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface CalendarBooking {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  status: string;
  booking_type: string;
  guests: number;
  total_price: number;
  property?: {
    title: string;
  } | null;
  guest?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface DashboardCalendarProps {
  userId: string;
  userType: 'host' | 'guest';
}

const DashboardCalendar = ({ userId, userType }: DashboardCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'monthly'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [userId, userType, currentDate]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      // First, get bookings with property data
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          property:properties(title)
        `)
        .gte('check_in', startDate)
        .lte('check_out', endDate);

      if (userType === 'host') {
        const { data: hostProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('host_id', userId);
        
        if (hostProperties && hostProperties.length > 0) {
          const propertyIds = hostProperties.map(p => p.id);
          bookingsQuery = bookingsQuery.in('property_id', propertyIds);
        } else {
          setBookings([]);
          setLoading(false);
          return;
        }
      } else {
        bookingsQuery = bookingsQuery.eq('guest_id', userId);
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery;

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setBookings([]);
        setLoading(false);
        return;
      }

      // Get unique guest IDs
      const guestIds = [...new Set(bookingsData?.map(b => b.guest_id) || [])];
      
      // Fetch guest profiles separately
      const { data: guestProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', guestIds);

      // Combine the data
      const typedBookings: CalendarBooking[] = (bookingsData || []).map(booking => {
        const guestProfile = guestProfiles?.find(p => p.id === booking.guest_id);
        return {
          ...booking,
          property: booking.property || null,
          guest: guestProfile ? {
            first_name: guestProfile.first_name || '',
            last_name: guestProfile.last_name || ''
          } : null
        };
      });
      
      setBookings(typedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getBookingTypeColor = (type: string, status: string) => {
    if (status === 'cancelled') return 'bg-gray-200 text-gray-600';
    switch (type) {
      case 'daily':
        return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
      case 'monthly':
        return 'bg-green-100 text-green-800 border-l-4 border-green-500';
      default:
        return 'bg-purple-100 text-purple-800 border-l-4 border-purple-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      return date >= checkIn && date <= checkOut;
    }).filter(booking => {
      if (filterType === 'all') return true;
      return booking.booking_type === filterType;
    });
  };

  const renderCalendarDay = (date: Date) => {
    const dayBookings = getBookingsForDate(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isToday = isSameDay(date, new Date());

    return (
      <motion.div
        key={date.toString()}
        className={`min-h-[120px] p-2 border border-gray-200 ${
          !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
        } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
        whileHover={{ scale: 1.02, zIndex: 10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
            {format(date, 'd')}
          </span>
          {isToday && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>

        <div className="space-y-1">
          {dayBookings.slice(0, 2).map((booking) => (
            <Popover key={booking.id}>
              <PopoverTrigger asChild>
                <motion.div
                  className={`text-xs p-1 rounded cursor-pointer ${getBookingTypeColor(booking.booking_type, booking.status)}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="truncate font-medium">
                    {userType === 'host' 
                      ? booking.guest 
                        ? `${booking.guest.first_name} ${booking.guest.last_name}`
                        : 'Guest'
                      : booking.property?.title || 'Property'
                    }
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={`text-xs px-1 ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </Badge>
                    <span className="text-xs opacity-75">
                      {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                    </span>
                  </div>
                </motion.div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-2xl shadow-2xl">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">
                      {userType === 'host' 
                        ? booking.guest 
                          ? `${booking.guest.first_name} ${booking.guest.last_name}`
                          : 'Guest'
                        : booking.property?.title || 'Property'
                      }
                    </h4>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Check-in:</span>
                      <div className="font-medium">{format(parseISO(booking.check_in), 'MMM dd, yyyy')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-out:</span>
                      <div className="font-medium">{format(parseISO(booking.check_out), 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <Badge variant="outline" className={getBookingTypeColor(booking.booking_type, booking.status)}>
                      {booking.booking_type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Total:</span>
                    <span className="font-semibold text-lg">${booking.total_price}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}
          
          {dayBookings.length > 2 && (
            <div className="text-xs text-gray-500 text-center p-1">
              +{dayBookings.length - 2} more
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-2xl overflow-hidden">
        {/* Header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-100 p-4 text-center font-semibold text-gray-700 border-b border-gray-200">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {weeks.map((week, weekIndex) => 
          week.map((date, dayIndex) => (
            <div key={`${weekIndex}-${dayIndex}`}>
              {renderCalendarDay(date)}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <Card className="w-full shadow-lg rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center">
            <CalendarIcon className="h-6 w-6 mr-3 text-gray-700" />
            {userType === 'host' ? 'Booking Calendar' : 'My Bookings'}
          </CardTitle>
          
          <div className="flex items-center space-x-4">
            {/* Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2 rounded-2xl">
                  <Filter className="h-4 w-4" />
                  <span className="capitalize">{filterType}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 rounded-2xl">
                <div className="space-y-1">
                  {['all', 'daily', 'monthly'].map((type) => (
                    <Button
                      key={type}
                      variant={filterType === type ? "default" : "ghost"}
                      className="w-full justify-start capitalize rounded-xl"
                      onClick={() => setFilterType(type as any)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Month Navigation */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h3 className="text-lg font-semibold min-w-[150px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-500 rounded"></div>
            <span>Daily stays</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border-l-4 border-green-500 rounded"></div>
            <span>Monthly stays</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-100 border-l-4 border-purple-500 rounded"></div>
            <span>Flexible stays</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-96"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </motion.div>
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderCalendar()}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default DashboardCalendar;
