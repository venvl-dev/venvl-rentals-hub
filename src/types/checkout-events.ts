/**
 * TypeScript types for Checkout Funnel Event Tracking (A4)
 *
 * These types define the payload structures for checkout-related events
 * tracked for booking intent scoring and abandonment analysis.
 */

import { Database } from '@/integrations/supabase/types';

export type GuestEventType = Database['public']['Enums']['guest_event_type'];

/**
 * Payload for 'start_checkout' event type
 * Logged when user initiates the booking/checkout process
 */
export interface CheckoutStartPayload {
  property_id: string;
  check_in: string; // ISO date format (YYYY-MM-DD)
  check_out: string; // ISO date format (YYYY-MM-DD)
  guests: number;
  total_egp: number;
  booking_type?: string; // 'daily' or 'monthly'
  duration_months?: number | null;
  payment_method_selected?: string | null; // 'card', 'cash', etc.
}

/**
 * Parameters for log_checkout_start_event RPC function
 */
export interface LogCheckoutStartParams {
  p_property_id: string;
  p_check_in: string;
  p_check_out: string;
  p_guests: number;
  p_total_egp: number;
  p_booking_type?: string;
  p_duration_months?: number | null;
  p_payment_method_selected?: string | null;
  p_session_id?: string | null;
}

/**
 * Checkout abandonment detection result
 */
export interface AbandonedCheckout {
  checkout_event_id: string;
  session_id: string;
  user_id: string | null;
  property_id: string;
  minutes_since_checkout: number;
}

/**
 * Checkout funnel stage
 */
export type CheckoutFunnelStage =
  | 'property_viewed'
  | 'start_checkout'
  | 'payment_initiated'
  | 'booking_completed';

/**
 * Checkout funnel analysis data
 */
export interface CheckoutFunnelMetrics {
  funnel_date: string;
  total_sessions: number;
  checkouts_started: number;
  bookings_completed: number;
  checkouts_abandoned: number;
  conversion_rate: number; // percentage
}

/**
 * Checkout abandonment details
 */
export interface CheckoutAbandonmentDetail {
  session_id: string;
  user_id: string | null;
  property_id: string;
  total_egp: number;
  started_at: string;
  completed_at: string | null;
  status: 'Completed' | 'Abandoned (>30min)' | 'In Progress';
  duration_minutes: number;
}

/**
 * Drop-off point in checkout flow
 */
export type CheckoutDropoffPoint =
  | 'date_selection'
  | 'guest_selection'
  | 'summary_review'
  | 'payment_initiation'
  | 'payment_processing';

/**
 * Typed guest event with checkout payload
 */
export interface CheckoutStartEvent {
  id: string;
  type: 'start_checkout';
  payload: CheckoutStartPayload;
  user_id: string | null;
  session_id: string | null;
  ts: string;
  device_type?: string | null;
  user_agent?: string | null;
}
