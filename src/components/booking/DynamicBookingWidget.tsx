
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, Users, CreditCard, MapPin, Star, Minus, Plus } from 'lucide-react';
import { addDays, differenceInDays, addMonths, format } from 'date-fns';

interface Property {
  id: string;
  title: string;
  price_per_night: number;
  monthly_price?: number;
  rental_type?: string;
  booking_types?: string[];
  min_nights?: number;
  min_months?: number;
  max_guests: number;
  city: string;
  state: string;
  blocked_dates?: string[];
}

interface DynamicBookingWidgetProps {
  property: Property;
  user: User | null;
}

const DynamicBookingWidget = ({ property, user }: DynamicBookingWidgetProps) => {
  const [bookingMode, setBookingMode] = useState<'daily' | 'monthly'>('daily');
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [monthlyStartDate, setMonthlyStartDate] = useState<Date>();
  const [monthlyDuration, setMonthlyDuration] = useState(1);
  const [guests, setGuests] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  const getRentalType = () => {
    if (property.rental_type) return property.rental_type;
    if (property.booking_types?.length === 1) return property.booking_types[0];
    if (property.booking_types?.includes('daily') && property.booking_types?.includes('monthly')) return 'both';
    return 'daily';
  };

  const rentalType = getRentalType();

  // Set initial booking mode
  useEffect(() => {
    if (rentalType === 'monthly') {
      setBookingMode('monthly');
    } else if (rentalType === 'daily') {
      setBookingMode('daily');
    }
  }, [rentalType]);

  // Calculate total price
  useEffect(() => {
    if (bookingMode === 'daily' && checkIn && checkOut) {
      const nights = differenceInDays(checkOut, checkIn);
      setTotalPrice(nights * property.price_per_night);
    } else if (bookingMode === 'monthly' && property.monthly_price) {
      setTotalPrice(monthlyDuration * property.monthly_price);
    }
  }, [bookingMode, checkIn, checkOut, monthlyDuration, property.price_per_night, property.monthly_price]);

  const handleBooking = async () => {
    if (!user) {
      // Save booking data to localStorage and redirect to auth
      const bookingData = {
        propertyId: property.id,
        bookingMode,
        checkIn: checkIn?.toISOString(),
        checkOut: checkOut?.toISOString(),
        monthlyStartDate: monthlyStartDate?.toISOString(),
        monthlyDuration,
        guests,
        totalPrice,
      };
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    // Validate booking data
    if (bookingMode === 'daily') {
      if (!checkIn || !checkOut) {
        toast.error('Please select check-in and check-out dates');
        return;
      }
      const nights = differenceInDays(checkOut, checkIn);
      if (property.min_nights && nights < property.min_nights) {
        toast.error(`Minimum stay is ${property.min_nights} night${property.min_nights > 1 ? 's' : ''}`);
        return;
      }
    } else if (bookingMode === 'monthly') {
      if (!monthlyStartDate) {
        toast.error('Please select a start date');
        return;
      }
      if (property.min_months && monthlyDuration < property.min_months) {
        toast.error(`Minimum stay is ${property.min_months} month${property.min_months > 1 ? 's' : ''}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const bookingData = {
        property_id: property.id,
        guest_id: user.id,
        check_in: bookingMode === 'daily' ? checkIn : monthlyStartDate,
        check_out: bookingMode === 'daily' ? checkOut : addMonths(monthlyStartDate!, monthlyDuration),
        guests,
        total_price: totalPrice,
        booking_type: bookingMode,
        duration_months: bookingMode === 'monthly' ? monthlyDuration : null,
        status: 'pending',
      };

      const { error } = await supabase
        .from('bookings')
        .insert(bookingData);

      if (error) throw error;

      toast.success('Booking request submitted successfully!');
      
      // Reset form
      setCheckIn(undefined);
      setCheckOut(undefined);
      setMonthlyStartDate(undefined);
      setMonthlyDuration(1);
      setGuests(1);
      
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateMonthlyDuration = (change: number) => {
    const newDuration = Math.max(1, Math.min(12, monthlyDuration + change));
    setMonthlyDuration(newDuration);
  };

  const isDateBlocked = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return property.blocked_dates?.includes(dateStr) || date < new Date();
  };

  return (
    <Card className="sticky top-8 shadow-2xl rounded-3xl overflow-hidden border-0">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            Book Your Stay
          </CardTitle>
          <Badge className="bg-black text-white font-semibold tracking-wide">
            VENVL
          </Badge>
        </div>
        
        {/* Property Info */}
        <div className="space-y-2 pt-4">
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{property.city}, {property.state}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">4.9 · 127 reviews</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Booking Mode Selector (for 'both' rental type) */}
        {rentalType === 'both' && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">Booking Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBookingMode('daily')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  bookingMode === 'daily'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-700" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Daily</div>
                    <div className="text-xs text-gray-500">Short stays</div>
                  </div>
                </div>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBookingMode('monthly')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  bookingMode === 'monthly'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-700" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Monthly</div>
                    <div className="text-xs text-gray-500">Long stays</div>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Daily Booking UI */}
          {bookingMode === 'daily' && (
            <motion.div
              key="daily-booking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-900">Select Dates</Label>
                <div className="border border-gray-200 rounded-xl p-4">
                  <Calendar
                    mode="range"
                    selected={{ from: checkIn, to: checkOut }}
                    onSelect={(range) => {
                      setCheckIn(range?.from);
                      setCheckOut(range?.to);
                    }}
                    disabled={isDateBlocked}
                    numberOfMonths={1}
                    className="w-full"
                  />
                </div>
              </div>

              {checkIn && checkOut && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                >
                  <div className="text-sm text-blue-800">
                    <strong>{differenceInDays(checkOut, checkIn)}</strong> nights from{' '}
                    <strong>{format(checkIn, 'MMM dd')}</strong> to{' '}
                    <strong>{format(checkOut, 'MMM dd')}</strong>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Monthly Booking UI */}
          {bookingMode === 'monthly' && (
            <motion.div
              key="monthly-booking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-900">Start Date</Label>
                <div className="border border-gray-200 rounded-xl p-4">
                  <Calendar
                    mode="single"
                    selected={monthlyStartDate}
                    onSelect={setMonthlyStartDate}
                    disabled={isDateBlocked}
                    numberOfMonths={1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-900">Duration</Label>
                <div className="flex items-center justify-center gap-6 py-4 bg-gray-50 rounded-xl">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMonthlyDuration(-1)}
                    disabled={monthlyDuration <= 1}
                    className="w-10 h-10 rounded-full"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-black">{monthlyDuration}</div>
                    <div className="text-sm text-gray-500">
                      {monthlyDuration === 1 ? 'month' : 'months'}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMonthlyDuration(1)}
                    disabled={monthlyDuration >= 12}
                    className="w-10 h-10 rounded-full"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((month) => (
                    <Button
                      key={month}
                      variant={monthlyDuration === month ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMonthlyDuration(month)}
                      className="h-10 text-sm"
                    >
                      {month}m
                    </Button>
                  ))}
                </div>
              </div>

              {monthlyStartDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-green-50 border border-green-200 rounded-xl p-4"
                >
                  <div className="text-sm text-green-800">
                    <strong>{monthlyDuration}</strong> {monthlyDuration === 1 ? 'month' : 'months'} starting from{' '}
                    <strong>{format(monthlyStartDate, 'MMM dd, yyyy')}</strong>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guests */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">Guests</Label>
          <Select value={guests.toString()} onValueChange={(value) => setGuests(parseInt(value))}>
            <SelectTrigger className="rounded-xl border-gray-200 focus:border-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: property.max_guests }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {num} {num === 1 ? 'guest' : 'guests'}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Pricing Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {bookingMode === 'daily' 
                ? `EGP ${property.price_per_night} × ${checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0} nights`
                : `EGP ${property.monthly_price} × ${monthlyDuration} months`
              }
            </span>
            <span className="font-semibold">EGP {totalPrice}</span>
          </div>
          
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>EGP {totalPrice}</span>
          </div>
        </div>

        {/* Book Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleBooking}
            disabled={isSubmitting || totalPrice === 0}
            className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white font-semibold py-4 rounded-2xl shadow-lg transition-all duration-300"
          >
            {isSubmitting ? 'Processing...' : user ? 'Book Now' : 'Login to Book'}
          </Button>
        </motion.div>

        {!user && (
          <p className="text-xs text-gray-500 text-center">
            You'll be redirected to login and then back to complete your booking
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DynamicBookingWidget;
