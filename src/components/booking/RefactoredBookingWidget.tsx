
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

interface RefactoredBookingWidgetProps {
  property: Property;
  user: User | null;
  onBookingInitiated?: (bookingData: any) => void;
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

  const getRentalType = () => {
    if (property.rental_type) return property.rental_type;
    if (property.booking_types?.length === 1) return property.booking_types[0];
    if (property.booking_types?.includes('daily') && property.booking_types?.includes('monthly')) return 'both';
    return 'daily';
  };

  const rentalType = getRentalType();

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

  // Set initial booking mode
  useEffect(() => {
    if (rentalType === 'monthly') {
      setBookingMode('monthly');
    } else if (rentalType === 'daily') {
      setBookingMode('daily');
    }
  }, [rentalType]);

  // Fetch unavailable dates on mount
  useEffect(() => {
    fetchUnavailableDates();
  }, [fetchUnavailableDates]);

  // Calculate total price
  useEffect(() => {
    if (bookingMode === 'daily' && checkIn && checkOut) {
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      setTotalPrice(nights * property.price_per_night);
    } else if (bookingMode === 'monthly' && property.monthly_price) {
      setTotalPrice(monthlyDuration * property.monthly_price);
    } else {
      setTotalPrice(0);
    }
  }, [bookingMode, checkIn, checkOut, monthlyDuration, property.price_per_night, property.monthly_price]);

  const handleDateChange = useCallback((data: any) => {
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
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    if (!user) {
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
        await fetchUnavailableDates(); // Refresh availability
        return;
      }

      const bookingData = {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        bookingType: bookingMode,
        totalPrice,
        duration: bookingMode === 'monthly' ? monthlyDuration : undefined,
      };

      if (onBookingInitiated) {
        onBookingInitiated(bookingData);
      } else {
        toast.success('Booking request submitted successfully!');
      }
      
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
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
        {rentalType === 'both' && (
          <BookingTypeSelector
            bookingTypes={property.booking_types || ['daily']}
            selectedType={bookingMode}
            onTypeChange={setBookingMode}
            dailyPrice={property.price_per_night}
            monthlyPrice={property.monthly_price}
          />
        )}

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

        <BookingGuestSelector
          guests={guests}
          maxGuests={property.max_guests}
          onGuestsChange={setGuests}
        />

        <BookingPricingSummary
          bookingMode={bookingMode}
          checkIn={checkIn}
          checkOut={checkOut}
          monthlyDuration={monthlyDuration}
          pricePerNight={property.price_per_night}
          monthlyPrice={property.monthly_price}
          totalPrice={totalPrice}
        />

        <motion.div
          whileHover={{ scale: validation.canProceed ? 1.02 : 1 }}
          whileTap={{ scale: validation.canProceed ? 0.98 : 1 }}
        >
          <Button
            onClick={handleBooking}
            disabled={!validation.canProceed || isSubmitting}
            className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white font-semibold py-4 rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : user ? 'Continue to Booking' : 'Login to Book'}
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

export default RefactoredBookingWidget;
