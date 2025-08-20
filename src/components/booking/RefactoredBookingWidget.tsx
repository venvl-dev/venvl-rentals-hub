import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, MapPin, Star } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import BookingTypeSelector from './BookingTypeSelector';
import BookingDateSelector from './components/BookingDateSelector';
import BookingGuestSelector from './components/BookingGuestSelector';
import BookingPricingSummary from './components/BookingPricingSummary';
import { useBookingValidation } from '@/hooks/useBookingValidation';
import { 
  getRentalType, 
  getDailyPrice, 
  getMonthlyPrice, 
  supportsBookingType,
  getAvailableBookingTypes,
  type PropertyRentalData 
} from '@/lib/rentalTypeUtils';

interface Property {
  id: string;
  title: string;
  price_per_night: number;
  monthly_price?: number;
  daily_price?: number;
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

interface DateChangeData {
  checkIn?: Date;
  checkOut?: Date;
  monthlyStartDate?: Date;
  monthlyDuration?: number;
}

interface RefactoredBookingWidgetProps {
  property: Property & PropertyRentalData;
  user: User | null;
  onBookingInitiated?: (bookingData: BookingData) => void;
}

const RefactoredBookingWidget = ({ property, user, onBookingInitiated }: RefactoredBookingWidgetProps) => {
  const [bookingMode, setBookingMode] = useState<'daily' | 'monthly'>('daily');
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [monthlyStartDate, setMonthlyStartDate] = useState<Date>();
  const [monthlyDuration, setMonthlyDuration] = useState(1);
  const [guests, setGuests] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use unified rental type utilities
  const rentalType = getRentalType(property);
  const availableBookingTypes = getAvailableBookingTypes(property);
  const dailyPrice = getDailyPrice(property);
  const monthlyPrice = getMonthlyPrice(property);

  const validation = useBookingValidation({
    bookingMode,
    checkIn,
    checkOut,
    monthlyStartDate,
    monthlyDuration,
    minNights: property.min_nights,
    minMonths: property.min_months,
    totalPrice,
  });

  // Fetch unavailable dates
  const fetchUnavailableDates = useCallback(async () => {
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('property_id', property.id)
        .in('status', ['pending', 'confirmed', 'completed']);

      if (bookingsError) throw bookingsError;

      const { data: availability, error: availabilityError } = await supabase
        .from('property_availability')
        .select('blocked_date')
        .eq('property_id', property.id);

      if (availabilityError) throw availabilityError;

      const blocked: Date[] = [];
      
      bookings?.forEach(booking => {
        const start = new Date(booking.check_in);
        const end = new Date(booking.check_out);
        const current = new Date(start);
        
        while (current < end) {
          blocked.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      });

      availability?.forEach(item => {
        blocked.push(new Date(item.blocked_date));
      });

      setUnavailableDates(blocked);
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
      toast.error('Failed to load availability calendar');
    }
  }, [property.id]);

  // Set initial booking mode based on supported types
  useEffect(() => {
    if (rentalType === 'monthly') {
      setBookingMode('monthly');
    } else if (rentalType === 'daily') {
      setBookingMode('daily');
    } else if (rentalType === 'both') {
      // Default to daily for 'both' type
      setBookingMode('daily');
    }
  }, [rentalType]);

  // Fetch unavailable dates on mount
  useEffect(() => {
    fetchUnavailableDates();
  }, [fetchUnavailableDates]);

  // Calculate total price using unified utilities
  useEffect(() => {
    if (bookingMode === 'daily' && checkIn && checkOut) {
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      setTotalPrice(nights * dailyPrice);
    } else if (bookingMode === 'monthly' && monthlyPrice) {
      setTotalPrice(monthlyDuration * monthlyPrice);
    } else {
      setTotalPrice(0);
    }
  }, [bookingMode, checkIn, checkOut, monthlyDuration, dailyPrice, monthlyPrice]);

  const handleDateChange = useCallback((data: DateChangeData) => {
    if (data.checkIn !== undefined) setCheckIn(data.checkIn);
    if (data.checkOut !== undefined) setCheckOut(data.checkOut);
    if (data.monthlyStartDate !== undefined) setMonthlyStartDate(data.monthlyStartDate);
    if (data.monthlyDuration !== undefined) setMonthlyDuration(data.monthlyDuration);
  }, []);

  const isDateBlocked = useCallback((date: Date) => {
    return unavailableDates.some(blockedDate => 
      format(blockedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ) || date < new Date();
  }, [unavailableDates]);

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to make a booking');
      return;
    }

    // Check validation first
    if (!validation.isValid) {
      if (validation.errors.length > 0) {
        toast.error(validation.errors[0]); // Show first error
      } else {
        toast.error('Please complete all booking details');
      }
      return;
    }

    if (bookingMode === 'daily' && (!checkIn || !checkOut)) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    if (bookingMode === 'monthly' && !monthlyStartDate) {
      toast.error('Please select a start date for your monthly stay');
      return;
    }

    const checkInDate = bookingMode === 'daily' ? checkIn! : monthlyStartDate!;
    const checkOutDate = bookingMode === 'daily' ? checkOut! : addMonths(monthlyStartDate!, monthlyDuration);
    
    try {
      setIsSubmitting(true);

      // Check availability before proceeding
      const { data: conflicts, error } = await supabase.rpc('check_booking_conflicts', {
        p_property_id: property.id,
        p_check_in: checkInDate.toISOString().split('T')[0],
        p_check_out: checkOutDate.toISOString().split('T')[0],
      });

      if (error) throw error;
      
      if (conflicts) {
        toast.error('Selected dates are no longer available. Please choose different dates.');
        fetchUnavailableDates(); // Refresh the calendar
        return;
      }

      // Call the parent callback if provided
      if (onBookingInitiated) {
        onBookingInitiated({
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests,
          bookingType: bookingMode,
          totalPrice,
          duration: bookingMode === 'monthly' ? monthlyDuration : undefined,
        });
        return;
      }

      // Otherwise, create the booking directly
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          guest_id: user.id,
          property_id: property.id,
          check_in: checkInDate.toISOString().split('T')[0],
          check_out: checkOutDate.toISOString().split('T')[0],
          guests,
          total_price: totalPrice,
          status: 'pending',
          booking_type: bookingMode,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      toast.success('Booking request submitted successfully!');
      
      // Reset form
      setCheckIn(undefined);
      setCheckOut(undefined);
      setMonthlyStartDate(undefined);
      setMonthlyDuration(1);
      setGuests(1);
      
      // Refresh unavailable dates
      fetchUnavailableDates();
      
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="sticky top-4 lg:top-8 shadow-xl rounded-2xl overflow-hidden border-0 max-w-full">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-4 lg:p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg lg:text-xl font-bold flex items-center gap-2.5">
            <div className="w-8 h-8 lg:w-9 lg:h-9 bg-black rounded-lg flex items-center justify-center">
              <CreditCard className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
            </div>
            <span>Book Your Stay</span>
          </CardTitle>
          <Badge className="bg-black text-white font-semibold tracking-wide text-xs px-2 py-1">
            VENVL
          </Badge>
        </div>
        
        <div className="space-y-1.5 pt-3">
          <div className="flex items-center text-gray-600">
            <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
            <span className="text-sm truncate">{property.city}, {property.state}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
            <span className="text-sm font-medium">4.9 · 127 reviews</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 lg:p-5 space-y-4 lg:space-y-5">
        {/* Only show booking type selector if property supports both types */}
        {rentalType === 'both' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BookingTypeSelector
              bookingTypes={availableBookingTypes}
              selectedType={bookingMode}
              onTypeChange={(type) => setBookingMode(type as 'daily' | 'monthly')}
              dailyPrice={dailyPrice}
              monthlyPrice={monthlyPrice}
              minNights={property.min_nights}
              minMonths={property.min_months}
            />
          </motion.div>
        )}

        {/* Show rental type info for single-type properties */}
        {rentalType !== 'both' && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className={`
                px-2.5 py-1 rounded-full text-sm font-medium
                ${rentalType === 'daily' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
                }
              `}>
                {rentalType === 'daily' ? 'Daily Only' : 'Monthly Only'}
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {rentalType === 'daily' 
                  ? `EGP ${dailyPrice}/night`
                  : `EGP ${monthlyPrice}/month`
                }
              </span>
            </div>
          </div>
        )}

        {/* Date Selection */}
        <BookingDateSelector
          bookingMode={bookingMode}
          checkIn={checkIn}
          checkOut={checkOut}
          monthlyStartDate={monthlyStartDate}
          monthlyDuration={monthlyDuration}
          onDateChange={handleDateChange}
          isDateBlocked={isDateBlocked}
          minNights={property.min_nights}
          minMonths={property.min_months}
        />

        {/* Guest Selection */}
        <BookingGuestSelector
          guests={guests}
          maxGuests={property.max_guests}
          onGuestsChange={setGuests}
        />

        {/* Pricing Summary */}
        <BookingPricingSummary
          bookingMode={bookingMode}
          checkIn={checkIn}
          checkOut={checkOut}
          monthlyDuration={monthlyDuration}
          pricePerNight={dailyPrice}
          monthlyPrice={monthlyPrice}
          totalPrice={totalPrice}
        />

        {/* Validation Errors Display */}
        {validation.errors.length > 0 && (
          <div className="space-y-2">
            {validation.errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Book Button */}
        <motion.div
          whileHover={{ scale: validation.isValid ? 1.01 : 1 }}
          whileTap={{ scale: validation.isValid ? 0.99 : 1 }}
          className="pt-1"
        >
          <Button
            onClick={handleBooking}
            disabled={isSubmitting || !validation.isValid}
            className={`
              w-full font-semibold py-3.5 px-6 rounded-xl shadow-lg transition-all duration-300 text-base
              ${validation.isValid 
                ? 'bg-black hover:bg-gray-800 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
              }
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : !validation.isValid ? (
              validation.errors.length > 0 ? 'Please fix errors above' : 'Complete booking details'
            ) : user ? (
              'Book Now'
            ) : (
              'Login to Book'
            )}
          </Button>
        </motion.div>

        {!user && (
          <p className="text-xs text-gray-500 text-center">
            Login required to complete booking
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RefactoredBookingWidget;
