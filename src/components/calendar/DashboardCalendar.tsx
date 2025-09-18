
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardCalendarProps } from './types';
import CalendarHeader from './CalendarHeader';
import { 
  generateCalendarDays,
  CalendarDay,
  fetchPropertyBookings
} from '@/lib/calendarUtils';
import { format, addMonths, subMonths, parseISO, isEqual, isAfter, isBefore } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  User,
  Clock,
  DollarSign
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const DashboardCalendar = ({ userId, userType }: DashboardCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'monthly'>('all');
  const [allCalendarDays, setAllCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      let combinedDays: CalendarDay[] = [];

      if (userType === 'host') {
        // For hosts: get all their properties and combine calendar data
        const { data: hostProperties, error: propertiesError } = await supabase
          .from('properties')
          .select('id, title')
          .eq('host_id', userId);

        if (propertiesError) throw propertiesError;

        if (hostProperties && hostProperties.length > 0) {
          // Generate calendar for each property and combine
          const allPropertyDays = await Promise.all(
            hostProperties.map(async (property) => {
              const days = await generateCalendarDays(
                property.id,
                currentDate.getFullYear(),
                currentDate.getMonth()
              );
              // Add property info to each day's booking data
              return days.map(day => ({
                ...day,
                bookingData: day.bookingData ? {
                  ...day.bookingData,
                  property_title: property.title
                } : undefined
              }));
            })
          );

          // Combine all days and group by date
          const daysByDate = new Map<string, CalendarDay[]>();
          allPropertyDays.flat().forEach(day => {
            const dateKey = format(day.date, 'yyyy-MM-dd');
            if (!daysByDate.has(dateKey)) {
              daysByDate.set(dateKey, []);
            }
            daysByDate.get(dateKey)!.push(day);
          });

          // Create full calendar grid with all days including padding days
          const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          const startDate = new Date(monthStart);
          startDate.setDate(startDate.getDate() - monthStart.getDay()); // Start from Sunday
          const endDate = new Date(monthEnd);
          endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay())); // End on Saturday
          const today = new Date();

          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = format(d, 'yyyy-MM-dd');
            const daysForDate = daysByDate.get(dateKey) || [];
            const bookings = daysForDate
              .filter(day => day.bookingData)
              .map(day => day.bookingData!);
            
            const hasBlocked = daysForDate.some(day => day.status === 'blocked');
            const hasBooking = bookings.length > 0;
            
            combinedDays.push({
              date: new Date(d),
              status: hasBlocked ? 'blocked' : hasBooking ? 'booked' : 'available',
              bookingData: bookings[0], // Show first booking if multiple
              bookings: bookings, // Store all bookings
              isToday: format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
              isCurrentMonth: d.getMonth() === currentDate.getMonth(),
              blockedReason: daysForDate.find(day => day.blockedReason)?.blockedReason
            });
          }
        }
      } else {
        // For guests: get bookings across all properties (using broader date range to catch overlapping bookings)
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        // Get bookings that might overlap with this month (start before month end, end after month start)
        const queryStartDate = format(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1), 'yyyy-MM-dd');
        const queryEndDate = format(new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 2, 0), 'yyyy-MM-dd');
        
        const { data: guestBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('guest_id', userId)
          .gte('check_in', queryStartDate)
          .lte('check_out', queryEndDate)
          .in('status', ['pending', 'confirmed', 'completed', 'checked_in', 'cancelled']);

        if (bookingsError) throw bookingsError;

        // Get property titles separately if we have bookings
        let propertyTitles: Record<string, string> = {};
        if (guestBookings && guestBookings.length > 0) {
          const propertyIds = [...new Set(guestBookings.map(b => b.property_id))];
          const { data: properties } = await supabase
            .from('properties')
            .select('id, title')
            .in('id', propertyIds);
          
          if (properties) {
            propertyTitles = properties.reduce((acc, prop) => {
              acc[prop.id] = prop.title;
              return acc;
            }, {} as Record<string, string>);
          }
        }

        // Create calendar days for the month (including padding days for full weeks)
        const calendarStartDate = new Date(monthStart);
        calendarStartDate.setDate(calendarStartDate.getDate() - monthStart.getDay()); // Start from Sunday of first week
        const calendarEndDate = new Date(monthEnd);
        calendarEndDate.setDate(calendarEndDate.getDate() + (6 - monthEnd.getDay())); // End on Saturday of last week
        const today = new Date();

        for (let d = new Date(calendarStartDate); d <= calendarEndDate; d.setDate(d.getDate() + 1)) {
          const dayDate = new Date(d);
          dayDate.setHours(0, 0, 0, 0);
          
          const dayBookings = guestBookings?.filter(booking => {
            try {
              const checkIn = parseISO(booking.check_in);
              const checkOut = parseISO(booking.check_out);
              checkIn.setHours(0, 0, 0, 0);
              checkOut.setHours(0, 0, 0, 0);
              
              // Use same logic as generateCalendarDays
              return (isEqual(dayDate, checkIn) || isAfter(dayDate, checkIn)) && 
                     isBefore(dayDate, checkOut);
            } catch (parseError) {
              console.warn('Date parsing error for booking:', booking.id, parseError);
              return false;
            }
          }) || [];

          const dayStatus = dayBookings.length > 0 ? 
            (dayBookings[0].status === 'cancelled' ? 'blocked' : 'booked') : 'available';
          
          combinedDays.push({
            date: new Date(d),
            status: dayStatus,
            bookingData: dayBookings[0] ? {
              id: dayBookings[0].id,
              check_in: dayBookings[0].check_in,
              check_out: dayBookings[0].check_out,
              status: dayBookings[0].status as any,
              guest_id: dayBookings[0].guest_id,
              booking_type: dayBookings[0].booking_type as any,
              total_price: dayBookings[0].total_price,
              property_title: propertyTitles[dayBookings[0].property_id] || 'Property'
            } : undefined,
            isToday: format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
            isCurrentMonth: d.getMonth() === currentDate.getMonth()
          });
        }
      }

      // Apply filters
      const filteredDays = combinedDays.map(day => {
        if (day.bookingData) {
          const matchesType = filterType === 'all' || day.bookingData.booking_type === filterType;
          if (!matchesType) {
            return { ...day, status: 'available' as const, bookingData: undefined };
          }
        }
        return day;
      });

      const sortedDays = filteredDays.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Debug: Show what DashboardCalendar is displaying
      const bookedDays = sortedDays.filter(d => d.status !== 'available');
      console.log(`🔍 DashboardCalendar (${userType}) showing:`, {
        totalDays: sortedDays.length,
        bookedDays: bookedDays.length,
        bookedDates: bookedDays.map(d => ({
          date: format(d.date, 'yyyy-MM-dd'),
          status: d.status,
          bookingStatus: d.bookingData?.status,
          bookingId: d.bookingData?.id
        }))
      });
      
      setAllCalendarDays(sortedDays);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, userType, currentDate, filterType]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getStatusColor = (status: CalendarDay['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'blocked':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'checked_in':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    const hasBooking = !!day.bookingData;

    return (
      <TooltipProvider key={index}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className={`
                relative w-full h-20 flex flex-col items-center justify-center text-sm font-medium rounded-lg cursor-pointer
                transition-all duration-200 border-2 border-transparent
                ${day.isCurrentMonth ? 'text-black' : 'text-gray-400'}
                ${hasBooking ? 'hover:bg-gray-50' : 'hover:bg-gray-100'}
                ${hasBooking && day.bookingData?.status === 'cancelled' 
                  ? 'bg-red-100 text-red-800 border-red-200 opacity-75' 
                  : getStatusColor(day.status)}
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 text-xs">
                {format(day.date, 'd')}
              </span>
              
              {day.isToday && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
              
              {hasBooking && (
                <div className="flex items-center justify-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2 min-w-[200px]">
              <p className="font-medium">{format(day.date, 'EEE, MMM d, yyyy')}</p>
              
              {day.bookingData && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span className="text-sm">
                      {userType === 'host' 
                        ? day.bookingData.guest_name || 'Guest'
                        : day.bookingData.property_title || 'Property'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span className="text-sm">
                      {format(new Date(day.bookingData.check_in), 'MMM d')} - 
                      {format(new Date(day.bookingData.check_out), 'MMM d')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-sm">EGP {Math.round(day.bookingData.total_price)}</span>
                  </div>
                  <Badge className={`text-xs ${
                    day.bookingData.status === 'cancelled' 
                      ? 'bg-red-100 text-red-800' 
                      : ''
                  }`}>
                    {day.bookingData.status === 'cancelled' ? '❌ Cancelled' : 
                     day.bookingData.status.charAt(0).toUpperCase() + day.bookingData.status.slice(1)}
                  </Badge>
                </div>
              )}
              
              {day.status === 'available' && (
                <div className="text-sm text-green-600">
                  Available
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create weekly grid from calendar days
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < allCalendarDays.length; i += 7) {
    weeks.push(allCalendarDays.slice(i, i + 7));
  }

  return (
    <Card className="w-full shadow-lg rounded-3xl overflow-hidden">
      <CardHeader className="p-0">
        <CalendarHeader
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          filterType={filterType}
          setFilterType={setFilterType}
          userType={userType}
        />
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
              <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-2xl overflow-hidden">
                {/* Header */}
                {dayNames.map(day => (
                  <div key={day} className="bg-gray-100 p-4 text-center font-semibold text-gray-700 border-b border-gray-200">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {allCalendarDays.map((day, index) => renderCalendarDay(day, index))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default DashboardCalendar;
