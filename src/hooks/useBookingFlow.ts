
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

type BookingStatus = Database['public']['Enums']['booking_status'];

interface BookingData {
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  booking_type: string;
  duration_months?: number;
  status: BookingStatus;
}

interface ConfirmedBooking extends BookingData {
  id: string;
  created_at: string;
}

interface UseBookingFlowProps {
  user: User | null;
  propertyId: string;
}

export const useBookingFlow = ({ user, propertyId }: UseBookingFlowProps) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'booking' | 'summary' | 'confirmation'>('booking');
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);

  const checkDateAvailability = useCallback(async (checkIn: Date, checkOut: Date) => {
    try {
      const { data, error } = await supabase.rpc('check_booking_conflicts', {
        p_property_id: propertyId,
        p_check_in: checkIn.toISOString().split('T')[0],
        p_check_out: checkOut.toISOString().split('T')[0],
      });

      if (error) throw error;
      return !data; // Function returns true if there are conflicts, so invert for availability
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }, [propertyId]);

  const createBooking = useCallback(async (bookingDetails: BookingData) => {
    if (!user) {
      toast.error('Please log in to make a booking');
      navigate('/auth');
      return null;
    }

    try {
      setIsProcessing(true);

      // Check availability first
      const isAvailable = await checkDateAvailability(
        new Date(bookingDetails.check_in),
        new Date(bookingDetails.check_out)
      );

      if (!isAvailable) {
        toast.error('Selected dates are no longer available');
        return null;
      }

      // Create booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingDetails,
          guest_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for host
      const { data: propertyData } = await supabase
        .from('properties')
        .select('host_id, title')
        .eq('id', propertyId)
        .single();

      if (propertyData) {
        await supabase.from('notifications').insert({
          user_id: propertyData.host_id,
          title: 'New Booking Request',
          message: `You have a new booking request for ${propertyData.title}`,
          type: 'booking',
        });

        // Track booking notification
        await supabase.from('booking_notifications').insert({
          booking_id: data.id,
          recipient_id: propertyData.host_id,
          notification_type: 'new_booking',
        });
      }

      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user, propertyId, checkDateAvailability, navigate]);

  const proceedToSummary = useCallback((booking: BookingData) => {
    setBookingData(booking);
    setCurrentStep('summary');
  }, []);

  const confirmBooking = useCallback(async () => {
    if (!bookingData) return;

    try {
      setIsProcessing(true);
      
      const booking = await createBooking(bookingData);
      if (booking) {
        setConfirmedBooking(booking);
        setCurrentStep('confirmation');
        toast.success('Booking confirmed successfully!');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking');
    } finally {
      setIsProcessing(false);
    }
  }, [bookingData, createBooking]);

  const cancelBooking = useCallback(() => {
    setBookingData(null);
    setCurrentStep('booking');
  }, []);

  const resetFlow = useCallback(() => {
    setBookingData(null);
    setConfirmedBooking(null);
    setCurrentStep('booking');
    setIsProcessing(false);
  }, []);

  return {
    currentStep,
    bookingData,
    confirmedBooking,
    isProcessing,
    proceedToSummary,
    confirmBooking,
    cancelBooking,
    resetFlow,
    checkDateAvailability,
    createBooking,
  };
};
