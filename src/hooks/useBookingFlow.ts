import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { clearFunnelSession } from '@/utils/sessionManager';

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
  promo_code_id?: string | null;
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
  const [currentStep, setCurrentStep] = useState<
    'booking' | 'summary' | 'confirmation'
  >('booking');
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [confirmedBooking, setConfirmedBooking] =
    useState<ConfirmedBooking | null>(null);

  const checkDateAvailability = useCallback(
    async (checkIn: Date, checkOut: Date) => {
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
    },
    [propertyId],
  );

  const createBooking = useCallback(
    async (bookingDetails: BookingData) => {
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
          new Date(bookingDetails.check_out),
        );

        if (!isAvailable) {
          toast.error('Selected dates are no longer available');
          return null;
        }

        // Check if user profile exists
        const { data: profileCheck, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profileError || !profileCheck) {
          console.error('❌ User profile not found:', profileError);
          toast.error('User profile not found. Please refresh and try again.');
          return null;
        }

        // Get property host_id for the booking
        const { data: propertyInfo, error: propertyError } = await supabase
          .from('properties')
          .select('host_id')
          .eq('id', bookingDetails.property_id)
          .single();

        if (propertyError || !propertyInfo) {
          console.error('❌ Property not found:', propertyError);
          toast.error('Property not found. Please refresh and try again.');
          return null;
        }

        // Validate booking data before inserting
        const bookingDataToInsert = {
          property_id: bookingDetails.property_id,
          guest_id: user.id,
          host_id: propertyInfo.host_id,
          check_in: bookingDetails.check_in,
          check_out: bookingDetails.check_out,
          guests: bookingDetails.guests,
          total_price: bookingDetails.total_price,
          booking_type: bookingDetails.booking_type || 'daily',
          duration_months: bookingDetails.duration_months,
          status: bookingDetails.status || 'pending',
          promo_code_id: bookingDetails.promo_code_id,
        };

        // Remove undefined values to avoid database issues
        Object.keys(bookingDataToInsert).forEach((key) => {
          if (
            bookingDataToInsert[key as keyof typeof bookingDataToInsert] ===
            undefined
          ) {
            delete bookingDataToInsert[key as keyof typeof bookingDataToInsert];
          }
        });

        // Create booking
        console.log('🔍 Creating booking with data:', bookingDataToInsert);

        const { data, error } = await supabase
          .from('bookings')
          .insert(bookingDataToInsert)
          .select()
          .single();

        if (error) {
          console.error('❌ Booking creation failed:');
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);
          console.error('Error code:', error.code);
          console.error('Full error as JSON:', JSON.stringify(error, null, 2));
          console.error('Full error object:', error);
          throw error;
        }

        // Create notification for host
        const { data: notificationPropertyData } = await supabase
          .from('properties')
          .select('host_id, title')
          .eq('id', propertyId)
          .single();

        if (notificationPropertyData) {
          await supabase.from('notifications').insert({
            user_id: notificationPropertyData.host_id,
            title: 'New Booking Request',
            message: `You have a new booking request for ${notificationPropertyData.title}`,
            type: 'booking',
          });

          // Track booking notification
          await supabase.from('booking_notifications').insert({
            booking_id: data.id,
            recipient_id: notificationPropertyData.host_id,
            notification_type: 'new_booking',
          });
        }

        // Log booking event to guest_events for analytics
        try {
          await supabase.rpc('log_booking_event', {
            p_booking_id: data.id,
            p_property_id: bookingDetails.property_id,
            p_check_in: bookingDetails.check_in,
            p_check_out: bookingDetails.check_out,
            p_guests: bookingDetails.guests,
            p_total_egp: bookingDetails.total_price,
            p_payment_status: bookingDetails.status || 'pending',
            p_booking_type: bookingDetails.booking_type || 'daily',
            p_duration_months: bookingDetails.duration_months,
            p_action_source: 'booking_flow',
          });
          console.log('✅ Booking event logged successfully');
        } catch (eventError) {
          // Don't fail the booking if event logging fails
          console.error('⚠️ Failed to log booking event:', eventError);
        }

        return data;
      } catch (error) {
        console.error('=== CATCH BLOCK ERROR ===');
        console.error('Error type:', typeof error);
        console.error('Error instanceof Error:', error instanceof Error);
        console.error('Error as JSON:', JSON.stringify(error, null, 2));
        console.error('Error object:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create booking';
        toast.error(errorMessage);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [user, propertyId, checkDateAvailability, navigate],
  );

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

        // Clear checkout funnel session after successful booking
        clearFunnelSession();
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
