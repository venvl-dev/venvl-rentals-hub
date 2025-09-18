
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { format, isSameDay, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  status: string;
  booking_reference: string;
  guests: number;
  guest_id: string;
}

interface AvailabilityCalendarProps {
  propertyId: string;
  isHost?: boolean;
  onDateSelect?: (date: Date | DateRange | undefined) => void;
  selectedDates?: { from?: Date; to?: Date };
}

const AvailabilityCalendar = ({ 
  propertyId, 
  isHost = false, 
  onDateSelect,
  selectedDates 
}: AvailabilityCalendarProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingsAndAvailability();
  }, [propertyId]);

  const fetchBookingsAndAvailability = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings - using only valid booking statuses
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .in('status', ['pending', 'confirmed', 'completed', 'checked_in'])
        .order('check_in', { ascending: true });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch blocked dates from property availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('property_availability')
        .select('blocked_date')
        .eq('property_id', propertyId);

      if (availabilityError) throw availabilityError;
      
      const blocked = availabilityData?.map(item => new Date(item.blocked_date)) || [];
      setBlockedDates(blocked);

    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getDateStatus = (date: Date) => {
    // Check if date is blocked
    if (blockedDates.some(blocked => isSameDay(blocked, date))) {
      return 'blocked';
    }

    // Check if date has a booking
    const booking = bookings.find(booking => {
      const checkIn = startOfDay(parseISO(booking.check_in));
      const checkOut = endOfDay(parseISO(booking.check_out));
      return isWithinInterval(date, { start: checkIn, end: checkOut });
    });

    if (booking) {
      return booking.status === 'confirmed' ? 'booked' : 'pending';
    }

    return 'available';
  };

  const getBookingForDate = (date: Date) => {
    return bookings.find(booking => {
      const checkIn = startOfDay(parseISO(booking.check_in));
      const checkOut = endOfDay(parseISO(booking.check_out));
      return isWithinInterval(date, { start: checkIn, end: checkOut });
    });
  };

  const getDateColor = (date: Date) => {
    const status = getDateStatus(date);
    switch (status) {
      case 'blocked':
        return 'bg-gray-200 text-gray-500 line-through';
      case 'booked':
        return 'bg-red-100 text-red-800 font-semibold';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 font-semibold';
      case 'available':
      default:
        return 'bg-green-50 text-green-700 hover:bg-green-100';
    }
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }

    const booking = getBookingForDate(date);
    if (booking && isHost) {
      setSelectedBooking(booking);
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (onDateSelect) {
      onDateSelect(range);
    }
  };

  const isDateDisabled = (date: Date) => {
    if (!isHost) {
      // For guests, disable booked and blocked dates
      const status = getDateStatus(date);
      return status === 'booked' || status === 'blocked' || status === 'pending';
    }
    return false;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'blocked':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'booked':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create proper props for the calendar based on mode
  const isRangeMode = selectedDates && selectedDates.from !== undefined;
  const calendarSelected = isRangeMode ? 
    { from: selectedDates.from, to: selectedDates.to } as DateRange : 
    undefined;

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            {isHost ? 'Property Calendar' : 'Availability Calendar'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-gray-500" />
              <span>Blocked</span>
            </div>
          </div>

          {/* Calendar - Conditional rendering based on mode */}
          {isRangeMode ? (
            <Calendar
              mode="range"
              selected={calendarSelected}
              onSelect={handleRangeSelect}
              disabled={isDateDisabled}
              numberOfMonths={2}
              className="rounded-xl border border-gray-200 p-4"
              modifiers={{
                available: (date) => getDateStatus(date) === 'available',
                booked: (date) => getDateStatus(date) === 'booked',
                pending: (date) => getDateStatus(date) === 'pending',
                blocked: (date) => getDateStatus(date) === 'blocked',
              }}
              modifiersStyles={{
                available: { backgroundColor: '#f0fdf4', color: '#15803d' },
                booked: { backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' },
                pending: { backgroundColor: '#fefce8', color: '#d97706', fontWeight: 'bold' },
                blocked: { backgroundColor: '#f3f4f6', color: '#6b7280', textDecoration: 'line-through' },
              }}
            />
          ) : (
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={onDateSelect as (date: Date | undefined) => void}
              disabled={isDateDisabled}
              numberOfMonths={2}
              className="rounded-xl border border-gray-200 p-4"
              modifiers={{
                available: (date) => getDateStatus(date) === 'available',
                booked: (date) => getDateStatus(date) === 'booked',
                pending: (date) => getDateStatus(date) === 'pending',
                blocked: (date) => getDateStatus(date) === 'blocked',
              }}
              modifiersStyles={{
                available: { backgroundColor: '#f0fdf4', color: '#15803d' },
                booked: { backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold' },
                pending: { backgroundColor: '#fefce8', color: '#d97706', fontWeight: 'bold' },
                blocked: { backgroundColor: '#f3f4f6', color: '#6b7280', textDecoration: 'line-through' },
              }}
              onDayClick={handleDateClick}
            />
          )}

          {/* Current Month Bookings Summary */}
          {isHost && bookings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Upcoming bookings</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {bookings.slice(0, 5).map((booking) => (
                  <motion.div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setSelectedBooking(booking)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(booking.status)}
                      <div>
                        <div className="font-medium text-sm">
                          {format(parseISO(booking.check_in), 'MMM dd')} - {format(parseISO(booking.check_out), 'MMM dd')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        booking.status === 'confirmed' ? 'border-green-200 text-green-800' :
                        booking.status === 'pending' ? 'border-yellow-200 text-yellow-800' :
                        'border-gray-200 text-gray-600'
                      }
                    >
                      {booking.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      {selectedBooking && isHost && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedBooking(null)}
        >
          <motion.div
            className="bg-white rounded-3xl p-6 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Booking Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference</span>
                  <span className="font-medium">{selectedBooking.booking_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">{format(parseISO(selectedBooking.check_in), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">{format(parseISO(selectedBooking.check_out), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium">{selectedBooking.guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge className={
                    selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
