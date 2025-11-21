/**
 * TypeScript types for Booking & Cancellation Event Tracking
 *
 * These types define the payload structures for booking-related events
 * tracked in the guest_events table for analytics and risk scoring.
 */

import { Database } from '@/integrations/supabase/types';

export type GuestEventType = Database['public']['Enums']['guest_event_type'];

/**
 * Payload for 'book' event type
 * Logged when a booking is successfully created
 */
export interface BookingEventPayload {
  booking_id: string;
  property_id: string;
  check_in: string; // ISO date format (YYYY-MM-DD)
  check_out: string; // ISO date format (YYYY-MM-DD)
  guests: number;
  total_egp: number;
  payment_status?: string | null; // 'pending', 'confirmed', 'paid', etc.
  booking_type?: string; // 'daily' or 'monthly'
  duration_months?: number | null;
  action_source?: string | null; // e.g., 'booking_flow', 'mobile_app', etc.
}

/**
 * Payload for 'cancel' and 'cancel_by_host' event types
 * Logged when a booking is cancelled by either guest or host
 */
export interface CancellationEventPayload {
  booking_id: string;
  property_id: string;
  reason_code: string; // Free-text cancellation reason
  refund_amount_egp: number;
  days_before_checkin: number | null;
  refund_ratio: number; // Calculated as refund_amount / total_price (0-1)
  cancelled_by: 'guest' | 'host';
  original_total_egp: number;
  check_in: string;
  check_out: string;
  guests: number;
}

/**
 * Union type of all booking-related event payloads
 */
export type BookingRelatedEventPayload =
  | BookingEventPayload
  | CancellationEventPayload;

/**
 * Guest event structure stored in the database
 */
export interface GuestEvent {
  id: string;
  type: GuestEventType;
  payload: Record<string, any>; // JSONB field
  user_id: string | null;
  ts: string; // Timestamp
  session_id?: string | null;
  device_type?: string | null;
  user_agent?: string | null;
}

/**
 * Typed guest event with specific payload type
 */
export interface TypedGuestEvent<T = Record<string, any>> extends Omit<GuestEvent, 'payload'> {
  payload: T;
}

/**
 * Booking event with typed payload
 */
export type BookingEvent = TypedGuestEvent<BookingEventPayload>;

/**
 * Cancellation event with typed payload
 */
export type CancellationEvent = TypedGuestEvent<CancellationEventPayload>;

/**
 * Parameters for log_booking_event RPC function
 */
export interface LogBookingEventParams {
  p_booking_id: string;
  p_property_id: string;
  p_check_in: string;
  p_check_out: string;
  p_guests: number;
  p_total_egp: number;
  p_payment_status?: string | null;
  p_booking_type?: string;
  p_duration_months?: number | null;
  p_action_source?: string | null;
}

/**
 * Parameters for log_cancellation_event RPC function
 */
export interface LogCancellationEventParams {
  p_booking_id: string;
  p_reason_code: string;
  p_refund_amount_egp?: number;
  p_days_before_checkin?: number | null;
  p_cancelled_by?: 'guest' | 'host';
}

/**
 * Return type for calculate_refund_amount RPC function
 */
export interface RefundCalculation {
  refund_amount: number;
  refund_percentage: number;
  days_before_checkin: number;
}

/**
 * Booking events summary view data structure
 */
export interface BookingEventsSummary {
  event_date: string;
  event_type: 'book' | 'cancel' | 'cancel_by_host';
  event_count: number;
  unique_users: number;
  avg_booking_value: number | null;
  total_booking_value: number | null;
  daily_bookings: number;
  monthly_bookings: number;
}

/**
 * Cancellation reasons summary view data structure
 */
export interface CancellationReasonsSummary {
  reason: string;
  cancellation_type: 'cancel' | 'cancel_by_host';
  cancellation_count: number;
  avg_days_before_checkin: number | null;
  avg_refund_ratio: number | null;
  total_refunds: number | null;
}

/**
 * Booking funnel analytics data structure
 */
export interface BookingFunnelStage {
  stage: 'views' | 'checkout_started' | 'bookings_confirmed' | 'bookings_cancelled';
  count: number;
  conversion_rate: number;
}

/**
 * Parameters for get_booking_funnel_stats RPC function
 */
export interface GetBookingFunnelStatsParams {
  p_start_date?: string; // ISO timestamp
  p_end_date?: string; // ISO timestamp
}
