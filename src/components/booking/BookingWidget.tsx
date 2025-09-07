import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CalendarIcon, Star, Users, CreditCard, Clock } from 'lucide-react';
import { format, differenceInDays, differenceInMonths, addMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

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
      
      setBlockedDates(dates);
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

  const getBookingTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'monthly': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const availableBookingTypes = property.booking_types || ['daily'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-24"
    >
      <Card className="shadow-xl border-0 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white p-8">
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex-1">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  ${bookingType === 'daily' ? property.price_per_night : property.monthly_price}
                </span>
                <span className="text-gray-600 text-lg">
                  / {bookingType === 'daily' ? 'night' : 'month'}
                </span>
              </div>
              
              {/* Show both prices if property supports flexible booking */}
              {availableBookingTypes.length > 1 && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {property.price_per_night && (
                    <span>${property.price_per_night}/night</span>
                  )}
                  {property.monthly_price && (
                    <span>${property.monthly_price}/month</span>
                  )}
                </div>
              )}
              
              <div className="flex items-center mt-3">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">4.9</span>
                </div>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-sm text-gray-600">127 reviews</span>
              </div>
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Booking Type Selector */}
          {availableBookingTypes.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <label className="text-sm font-semibold text-gray-900 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Booking Type
              </label>
              <div className="inline-flex p-1 bg-muted rounded-lg w-full">
                {availableBookingTypes.map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    onClick={() => setBookingType(type as 'daily' | 'monthly')}
                    className={`
                      flex-1 h-9 px-3 text-xs font-medium rounded-md transition-all duration-200
                      ${bookingType === type 
                        ? 'bg-black text-white shadow-sm' 
                        : 'text-muted-foreground'
                      }
                    `}
                  >
                    <span className="capitalize">{type} stays</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Date Selection for Daily Bookings */}
          <AnimatePresence mode="wait">
            {bookingType === 'daily' && (
              <motion.div
                key="daily"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">Check-in</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal h-12 rounded-2xl border-2 hover:border-gray-300"
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 text-gray-500" />
                          {checkIn ? format(checkIn, "MMM dd") : "Add date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl" align="start">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={setCheckIn}
                          disabled={(date) => date < new Date() || isDateBlocked(date)}
                          className="rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">Check-out</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal h-12 rounded-2xl border-2 hover:border-gray-300"
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 text-gray-500" />
                          {checkOut ? format(checkOut, "MMM dd") : "Add date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl" align="start">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          disabled={(date) => 
                            date < new Date() || 
                            (checkIn && date <= checkIn) ||
                            isDateBlocked(date)
                          }
                          className="rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Minimum stay warning */}
                {checkIn && checkOut && property.min_nights && 
                 differenceInDays(checkOut, checkIn) < property.min_nights && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-xl"
                  >
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                      Minimum {property.min_nights} night{property.min_nights > 1 ? 's' : ''} required
                    </Badge>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Monthly Booking Controls */}
            {bookingType === 'monthly' && (
              <motion.div
                key="monthly"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-left font-normal h-12 rounded-2xl border-2 hover:border-gray-300"
                      >
                        <CalendarIcon className="mr-3 h-4 w-4 text-gray-500" />
                        {checkIn ? format(checkIn, "MMM dd, yyyy") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={setCheckIn}
                        disabled={(date) => date < new Date() || isDateBlocked(date)}
                        className="rounded-2xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Duration</label>
                  <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                    <SelectTrigger className="h-12 rounded-2xl border-2 hover:border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(months => (
                        <SelectItem key={months} value={months.toString()}>
                          {months} month{months > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Minimum duration warning */}
                {property.min_months && duration < property.min_months && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-xl"
                  >
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                      Minimum {property.min_months} month{property.min_months > 1 ? 's' : ''} required
                    </Badge>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guests */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <label className="text-sm font-semibold text-gray-900 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Guests
            </label>
            <Select value={guests.toString()} onValueChange={(value) => setGuests(parseInt(value))}>
              <SelectTrigger className="h-12 rounded-2xl border-2 hover:border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {Array.from({ length: property.max_guests }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} guest{num > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Price Breakdown */}
          <AnimatePresence>
            {canBook() && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <Button
                  variant="ghost"
                  onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                  className="w-full text-left p-0 h-auto font-normal text-gray-600 hover:text-gray-900"
                >
                  <div className="flex justify-between items-center w-full">
                    <span>Price breakdown</span>
                    <span className="transform transition-transform duration-200 {showPriceBreakdown ? 'rotate-180' : ''}">
                      ▼
                    </span>
                  </div>
                </Button>

                <AnimatePresence>
                  {showPriceBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gray-50 rounded-2xl p-4 space-y-3"
                    >
                      {bookingType === 'daily' && checkIn && checkOut && (
                        <div className="flex justify-between items-center text-sm">
                          <span>${property.price_per_night} × {differenceInDays(checkOut, checkIn)} nights</span>
                          <span className="font-medium">${property.price_per_night * differenceInDays(checkOut, checkIn)}</span>
                        </div>
                      )}

                      {bookingType === 'monthly' && property.monthly_price && (
                        <div className="flex justify-between items-center text-sm">
                          <span>${property.monthly_price} × {duration} month{duration > 1 ? 's' : ''}</span>
                          <span className="font-medium">${property.monthly_price * duration}</span>
                        </div>
                      )}

                      <Separator className="my-3" />
                      
                      <div className="flex justify-between items-center font-semibold text-lg">
                        <span>Total</span>
                        <span>${calculateTotalPrice()}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2" 
              onClick={handleBooking}
              disabled={bookingLoading || !canBook()}
            >
              {bookingLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Reserve</span>
                </>
              )}
            </Button>

            {!canBook() && (
              <p className="text-sm text-gray-500 text-center mt-3">
                {bookingType === 'daily' 
                  ? 'Select your dates to see pricing' 
                  : 'Select your duration to see pricing'
                }
              </p>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BookingWidget;
