
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BookingSummary from './BookingSummary';
import BookingConfirmation from './BookingConfirmation';
import { useBookingFlow } from '@/hooks/useBookingFlow';

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

interface BookingFlowProps {
  property: Property;
  user: User | null;
  bookingData: {
    checkIn: Date;
    checkOut: Date;
    guests: number;
    bookingType: 'daily' | 'monthly';
    totalPrice: number;
    duration?: number;
  };
  onBack: () => void;
}

const BookingFlow = ({ property, user, bookingData, onBack }: BookingFlowProps) => {
  const navigate = useNavigate();
  const {
    currentStep,
    bookingData: flowBookingData,
    confirmedBooking,
    isProcessing,
    proceedToSummary,
    confirmBooking,
    cancelBooking,
    resetFlow,
  } = useBookingFlow({ user, propertyId: property.id });

  useEffect(() => {
    if (!user) {
      // Save booking data to localStorage and redirect to auth
      const pendingBooking = {
        propertyId: property.id,
        ...bookingData,
        checkIn: bookingData.checkIn.toISOString(),
        checkOut: bookingData.checkOut.toISOString(),
      };
      localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Initialize booking flow with data
    const booking = {
      property_id: property.id,
      guest_id: user.id,
      check_in: bookingData.checkIn.toISOString().split('T')[0],
      check_out: bookingData.checkOut.toISOString().split('T')[0],
      guests: bookingData.guests,
      total_price: bookingData.totalPrice,
      booking_type: bookingData.bookingType,
      duration_months: bookingData.duration || null,
      status: 'pending' as const,
    };

    proceedToSummary(booking);
  }, [user, bookingData, property.id, navigate, proceedToSummary]);

  const handleConfirmBooking = async () => {
    await confirmBooking();
  };

  const handleCancel = () => {
    cancelBooking();
    onBack();
  };

  if (!user) {
    return (
      <motion.div
        className="flex items-center justify-center p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <AnimatePresence mode="wait">
        {currentStep === 'summary' && flowBookingData && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <BookingSummary
              booking={{
                ...flowBookingData,
                property: {
                  id: property.id,
                  title: property.title,
                  images: property.images,
                  city: property.city,
                  state: property.state,
                  address: property.address,
                  price_per_night: property.price_per_night,
                  monthly_price: property.monthly_price,
                },
                checkIn: new Date(flowBookingData.check_in),
                checkOut: new Date(flowBookingData.check_out),
                guests: flowBookingData.guests,
                bookingType: flowBookingData.booking_type as 'daily' | 'monthly',
                totalPrice: Number(flowBookingData.total_price),
                duration: flowBookingData.duration_months || undefined,
              }}
              onConfirmPayment={handleConfirmBooking}
              onCancel={handleCancel}
              isProcessing={isProcessing}
            />
          </motion.div>
        )}

        {currentStep === 'confirmation' && confirmedBooking && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <BookingConfirmation
              booking={{
                ...confirmedBooking,
                property: {
                  id: property.id,
                  title: property.title,
                  images: property.images,
                  city: property.city,
                  state: property.state,
                  address: property.address,
                },
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingFlow;
