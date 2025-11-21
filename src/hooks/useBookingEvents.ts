/**
 * Custom hook for tracking booking-related events
 *
 * Provides helper functions to log booking and cancellation events
 * to the guest_events table for analytics and risk scoring.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  LogBookingEventParams,
  LogCancellationEventParams,
  RefundCalculation,
  BookingFunnelStage,
  GetBookingFunnelStatsParams,
} from '@/types/booking-events';

export const useBookingEvents = () => {
  /**
   * Logs a booking event when a booking is successfully created
   *
   * @param params - Booking event parameters
   * @returns The event ID if successful, null otherwise
   */
  const logBookingEvent = async (
    params: LogBookingEventParams,
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('log_booking_event', params);

      if (error) {
        console.error('Failed to log booking event:', error);
        return null;
      }

      console.log('✅ Booking event logged:', data);
      return data as string;
    } catch (error) {
      console.error('Exception while logging booking event:', error);
      return null;
    }
  };

  /**
   * Logs a cancellation event when a booking is cancelled
   *
   * @param params - Cancellation event parameters
   * @returns The event ID if successful, null otherwise
   */
  const logCancellationEvent = async (
    params: LogCancellationEventParams,
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc(
        'log_cancellation_event',
        params,
      );

      if (error) {
        console.error('Failed to log cancellation event:', error);
        return null;
      }

      console.log('✅ Cancellation event logged:', data);
      return data as string;
    } catch (error) {
      console.error('Exception while logging cancellation event:', error);
      return null;
    }
  };

  /**
   * Calculates the refund amount based on cancellation policy
   *
   * Policy:
   * - More than 7 days before check-in: 100% refund
   * - 3-7 days before check-in: 50% refund
   * - Less than 3 days before check-in: No refund
   *
   * @param bookingId - The booking ID
   * @param daysBeforeCheckin - Optional: Days before check-in (calculated if not provided)
   * @returns Refund calculation details or null if failed
   */
  const calculateRefundAmount = async (
    bookingId: string,
    daysBeforeCheckin?: number,
  ): Promise<RefundCalculation | null> => {
    try {
      const { data, error } = await supabase.rpc('calculate_refund_amount', {
        p_booking_id: bookingId,
        p_days_before_checkin: daysBeforeCheckin,
      });

      if (error) {
        console.error('Failed to calculate refund amount:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Exception while calculating refund amount:', error);
      return null;
    }
  };

  /**
   * Gets booking funnel statistics for a date range
   *
   * Returns conversion rates for:
   * - Views → Checkout Started
   * - Checkout Started → Bookings Confirmed
   * - Bookings Confirmed → Bookings Cancelled
   *
   * @param params - Date range parameters (defaults to last 30 days)
   * @returns Funnel statistics or empty array if failed
   */
  const getBookingFunnelStats = async (
    params?: GetBookingFunnelStatsParams,
  ): Promise<BookingFunnelStage[]> => {
    try {
      const { data, error } = await supabase.rpc(
        'get_booking_funnel_stats',
        params || {},
      );

      if (error) {
        console.error('Failed to get booking funnel stats:', error);
        return [];
      }

      return (data || []) as BookingFunnelStage[];
    } catch (error) {
      console.error('Exception while getting booking funnel stats:', error);
      return [];
    }
  };

  return {
    logBookingEvent,
    logCancellationEvent,
    calculateRefundAmount,
    getBookingFunnelStats,
  };
};
