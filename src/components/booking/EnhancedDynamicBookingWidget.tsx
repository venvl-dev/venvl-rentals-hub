
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CreditCard, MapPin, Star, CalendarDays } from 'lucide-react';
import { addDays, differenceInDays, addMonths, format } from 'date-fns';
import BookingTypeSelector from './BookingTypeSelector';
import BookingFlow from './BookingFlow';
import AvailabilityCalendar from '@/components/calendar/AvailabilityCalendar';

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
  images: string[];
  address: string;
}

interface BookingData {
  checkIn: Date;
  checkOut: Date;
  guests: number;
  bookingType: 'daily' | 'monthly';
  totalPrice: number;
  duration?: number;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

interface EnhancedDynamicBookingWidgetProps {
  property: Property;
  user: User | null;
}

const EnhancedDynamicBookingWidget = ({ property, user }: EnhancedDynamicBookingWidgetProps) => {
  const [bookingMode, setBookingMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDates, setSelectedDates] = useState<{ from?: Date; to?: Date }>({});
  const [monthlyStartDate, setMonthlyStartDate] = useState<Date>();
  const [monthlyDuration, setMonthlyDuration] = useState(1);
  const [guests, setGuests] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

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
    if (bookingMode === 'daily' && selectedDates.from && selectedDates.to) {
      const nights = differenceInDays(selectedDates.to, selectedDates.from);
      setTotalPrice(nights * property.price_per_night);
    } else if (bookingMode === 'monthly' && property.monthly_price) {
      setTotalPrice(monthlyDuration * property.monthly_price);
    }
  }, [bookingMode, selectedDates, monthlyDuration, property.price_per_night, property.monthly_price]);

  // Check for pending booking data
  useEffect(() => {
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking && user) {
      try {
        const bookingData = JSON.parse(pendingBooking);
        if (bookingData.propertyId === property.id) {
          // Restore booking state
          setBookingMode(bookingData.bookingType);
          if (bookingData.bookingType === 'daily') {
            setSelectedDates({
              from: new Date(bookingData.checkIn),
              to: new Date(bookingData.checkOut)
            });
          } else {
            setMonthlyStartDate(new Date(bookingData.checkIn));
            setMonthlyDuration(bookingData.duration || 1);
          }
          setGuests(bookingData.guests);
          localStorage.removeItem('pendingBooking');
          toast.success('Booking restored! You can continue where you left off.');
        }
      } catch (error) {
        console.error('Error restoring booking:', error);
        localStorage.removeItem('pendingBooking');
      }
    }
  }, [user, property.id]);

  const handleDateSelect = (date: DateRange | Date | undefined) => {
    if (bookingMode === 'daily') {
      if (typeof date === 'object' && date && 'from' in date) {
        setSelectedDates({ from: date.from, to: date.to });
      }
    } else if (bookingMode === 'monthly') {
      if (date instanceof Date) {
        setMonthlyStartDate(date);
      }
    }
  };

  const canProceedToBooking = () => {
    if (bookingMode === 'daily') {
      return selectedDates.from && selectedDates.to && totalPrice > 0;
    } else if (bookingMode === 'monthly') {
      return monthlyStartDate && monthlyDuration > 0 && totalPrice > 0;
    }
    return false;
  };

  const handleProceedToBooking = () => {
    if (!canProceedToBooking()) {
      toast.error('Please select dates and guests to continue');
      return;
    }

    const checkIn = bookingMode === 'daily' ? selectedDates.from! : monthlyStartDate!;
    const checkOut = bookingMode === 'daily' 
      ? selectedDates.to! 
      : addMonths(monthlyStartDate!, monthlyDuration);

    const booking = {
      checkIn,
      checkOut,
      guests,
      bookingType: bookingMode,
      totalPrice,
      duration: bookingMode === 'monthly' ? monthlyDuration : undefined,
    };

    setBookingData(booking);
    setShowBookingFlow(true);
  };

  if (showBookingFlow && bookingData) {
    return (
      <BookingFlow
        property={property}
        user={user}
        bookingData={bookingData}
        onBack={() => {
          setShowBookingFlow(false);
          setBookingData(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
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
          {/* Booking Type Selector */}
          <BookingTypeSelector
            bookingTypes={property.booking_types || ['daily']}
            selectedType={bookingMode}
            onTypeChange={setBookingMode}
            dailyPrice={property.price_per_night}
            monthlyPrice={property.monthly_price}
          />

          <Separator />

          {/* Date Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-gray-700" />
              <span className="font-semibold text-gray-900">
                {bookingMode === 'daily' ? 'Select dates' : 'Select start date & duration'}
              </span>
            </div>
            
            <AvailabilityCalendar
              propertyId={property.id}
              isHost={false}
              onDateSelect={handleDateSelect}
              selectedDates={bookingMode === 'daily' ? selectedDates : undefined}
            />

            {bookingMode === 'monthly' && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Duration</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMonthlyDuration(Math.max(1, monthlyDuration - 1))}
                      disabled={monthlyDuration <= 1}
                      className="w-8 h-8 p-0 rounded-full"
                    >
                      -
                    </Button>
                    <span className="text-lg font-bold w-12 text-center">
                      {monthlyDuration}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMonthlyDuration(Math.min(12, monthlyDuration + 1))}
                      disabled={monthlyDuration >= 12}
                      className="w-8 h-8 p-0 rounded-full"
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 text-center">
                  {monthlyDuration} {monthlyDuration === 1 ? 'month' : 'months'}
                  {monthlyStartDate && (
                    <span className="block mt-1">
                      Starting {format(monthlyStartDate, 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Guest Selection */}
          <div className="space-y-3">
            <span className="text-sm font-semibold text-gray-900">Guests</span>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <span className="text-gray-700">Number of guests</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  -
                </Button>
                <span className="text-lg font-bold w-8 text-center">{guests}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGuests(Math.min(property.max_guests, guests + 1))}
                  disabled={guests >= property.max_guests}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing Summary */}
          <AnimatePresence>
            {totalPrice > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {bookingMode === 'daily' 
                      ? `EGP ${property.price_per_night} × ${selectedDates.from && selectedDates.to ? differenceInDays(selectedDates.to, selectedDates.from) : 0} nights`
                      : `EGP ${property.monthly_price} × ${monthlyDuration} months`
                    }
                  </span>
                  <span className="font-semibold">EGP {totalPrice}</span>
                </div>
                
                <div className="flex items-center justify-between text-lg font-bold pt-4 border-t border-gray-200">
                  <span>Total</span>
                  <span>EGP {totalPrice}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Book Button */}
          <motion.div
            whileHover={{ scale: canProceedToBooking() ? 1.02 : 1 }}
            whileTap={{ scale: canProceedToBooking() ? 0.98 : 1 }}
          >
            <Button
              onClick={handleProceedToBooking}
              disabled={!canProceedToBooking()}
              className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white font-semibold py-4 rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {user ? 'Continue to Booking' : 'Login to Book'}
            </Button>
          </motion.div>

          {!user && (
            <p className="text-xs text-gray-500 text-center">
              You'll be redirected to login and then back to complete your booking
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDynamicBookingWidget;
