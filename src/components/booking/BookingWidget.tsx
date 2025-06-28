
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CalendarIcon, Star } from 'lucide-react';
import { format, differenceInDays, differenceInMonths, addDays, addMonths } from 'date-fns';

interface Property {
  id: string;
  title: string;
  price_per_night: number;
  monthly_price?: number;
  booking_types: string[];
  min_nights?: number;
  min_months?: number;
  blocked_dates?: string[];
  max_guests: number;
}

interface BookingWidgetProps {
  property: Property;
  user: User | null;
}

const BookingWidget = ({ property, user }: BookingWidgetProps) => {
  const navigate = useNavigate();
  const [bookingType, setBookingType] = useState<'daily' | 'monthly'>('daily');
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [duration, setDuration] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  // Set default booking type based on available options
  useEffect(() => {
    if (property.booking_types && property.booking_types.length > 0) {
      if (property.booking_types.includes('daily')) {
        setBookingType('daily');
      } else if (property.booking_types.includes('monthly')) {
        setBookingType('monthly');
      }
    }
  }, [property.booking_types]);

  // Fetch blocked dates
  useEffect(() => {
    fetchBlockedDates();
  }, [property.id]);

  const fetchBlockedDates = async () => {
    try {
      const { data, error } = await supabase
        .from('property_availability')
        .select('blocked_date')
        .eq('property_id', property.id);

      if (error) throw error;

      const dates = data?.map(item => new Date(item.blocked_date)) || [];
      const propertyBlockedDates = property.blocked_dates?.map(date => new Date(date)) || [];
      
      setBlockedDates([...dates, ...propertyBlockedDates]);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    }
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some(blockedDate => 
      format(blockedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const handleBooking = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (bookingType === 'daily' && (!checkIn || !checkOut)) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    if (bookingType === 'monthly' && !checkIn) {
      toast.error('Please select a start date');
      return;
    }

    setBookingLoading(true);

    try {
      const bookingData = {
        property_id: property.id,
        guest_id: user.id,
        guests,
        booking_type: bookingType,
        ...(bookingType === 'daily' ? {
          check_in: format(checkIn!, 'yyyy-MM-dd'),
          check_out: format(checkOut!, 'yyyy-MM-dd'),
          total_price: calculateTotalPrice(),
        } : {
          check_in: format(checkIn!, 'yyyy-MM-dd'),
          check_out: format(addMonths(checkIn!, duration), 'yyyy-MM-dd'),
          duration_months: duration,
          total_price: calculateTotalPrice(),
        })
      };

      const { error } = await supabase
        .from('bookings')
        .insert(bookingData);

      if (error) throw error;

      toast.success('Booking request submitted successfully!');
      navigate('/guest/bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (bookingType === 'daily' && checkIn && checkOut) {
      const nights = differenceInDays(checkOut, checkIn);
      return nights * property.price_per_night;
    } else if (bookingType === 'monthly' && property.monthly_price) {
      return duration * property.monthly_price;
    }
    return 0;
  };

  const canBook = () => {
    if (bookingType === 'daily') {
      if (!checkIn || !checkOut) return false;
      const nights = differenceInDays(checkOut, checkIn);
      return nights >= (property.min_nights || 1);
    } else if (bookingType === 'monthly') {
      if (!checkIn) return false;
      return duration >= (property.min_months || 1);
    }
    return false;
  };

  const availableBookingTypes = property.booking_types || ['daily'];

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">
                ${bookingType === 'daily' ? property.price_per_night : property.monthly_price}
              </span>
              <span className="text-gray-600 ml-1">
                / {bookingType === 'daily' ? 'night' : 'month'}
              </span>
            </div>
            <div className="flex items-center mt-1">
              <Star className="h-4 w-4 fill-current text-yellow-400" />
              <span className="text-sm ml-1">4.9 • 127 reviews</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Booking Type Selector */}
        {availableBookingTypes.length > 1 && (
          <div>
            <label className="text-sm font-medium">Booking Type</label>
            <Select 
              value={bookingType} 
              onValueChange={(value: 'daily' | 'monthly') => setBookingType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableBookingTypes.includes('daily') && (
                  <SelectItem value="daily">Daily stays</SelectItem>
                )}
                {availableBookingTypes.includes('monthly') && (
                  <SelectItem value="monthly">Monthly stays</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Selection for Daily Bookings */}
        {bookingType === 'daily' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Check-in</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "MMM dd") : "Add date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    disabled={(date) => date < new Date() || isDateBlocked(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-sm font-medium">Check-out</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, "MMM dd") : "Add date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    disabled={(date) => 
                      date < new Date() || 
                      (checkIn && date <= checkIn) ||
                      isDateBlocked(date)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Monthly Booking Controls */}
        {bookingType === 'monthly' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "MMM dd, yyyy") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    disabled={(date) => date < new Date() || isDateBlocked(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium">Duration</label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(months => (
                    <SelectItem key={months} value={months.toString()}>
                      {months} month{months > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Guests */}
        <div>
          <label className="text-sm font-medium">Guests</label>
          <Select value={guests.toString()} onValueChange={(value) => setGuests(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: property.max_guests }, (_, i) => i + 1).map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num} guest{num > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Breakdown */}
        {canBook() && (
          <div className="border-t pt-4">
            <div className="space-y-2">
              {bookingType === 'daily' && checkIn && checkOut && (
                <>
                  <div className="flex justify-between items-center">
                    <span>${property.price_per_night} x {differenceInDays(checkOut, checkIn)} nights</span>
                    <span>${property.price_per_night * differenceInDays(checkOut, checkIn)}</span>
                  </div>
                  {property.min_nights && differenceInDays(checkOut, checkIn) < property.min_nights && (
                    <Badge variant="destructive" className="text-xs">
                      Minimum {property.min_nights} nights required
                    </Badge>
                  )}
                </>
              )}

              {bookingType === 'monthly' && property.monthly_price && (
                <>
                  <div className="flex justify-between items-center">
                    <span>${property.monthly_price} x {duration} month{duration > 1 ? 's' : ''}</span>
                    <span>${property.monthly_price * duration}</span>
                  </div>
                  {property.min_months && duration < property.min_months && (
                    <Badge variant="destructive" className="text-xs">
                      Minimum {property.min_months} months required
                    </Badge>
                  )}
                </>
              )}
            </div>

            <Separator className="my-4" />
            
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total</span>
              <span>${calculateTotalPrice()}</span>
            </div>
          </div>
        )}

        <Button 
          className="w-full" 
          onClick={handleBooking}
          disabled={bookingLoading || !canBook()}
        >
          {bookingLoading ? 'Booking...' : 'Reserve'}
        </Button>

        {!canBook() && (
          <p className="text-sm text-gray-500 text-center">
            {bookingType === 'daily' 
              ? 'Select your dates to see pricing' 
              : 'Select your duration to see pricing'
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingWidget;
