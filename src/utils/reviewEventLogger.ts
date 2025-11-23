/**
 * Review Event Logger
 *
 * Tracks review/rating events when guests submit property reviews.
 * Events are logged to guest_events table with type 'rate'.
 */

import { supabase } from '@/integrations/supabase/client';

interface ReviewEventPayload {
  booking_id: string;
  property_id: string;
  rating: number;
}

/**
 * Detects device type from user agent string
 */
function detectDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Logs a review/rating event to guest_events table
 *
 * @param bookingId - The booking ID associated with the review
 * @param propertyId - The property being reviewed
 * @param rating - The rating value (1-5)
 *
 * @returns Promise that resolves when event is logged (or silently fails)
 */
export async function logReviewEvent(
  bookingId: string,
  propertyId: string,
  rating: number
): Promise<void> {
  try {
    // Only track for authenticated users
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return; // Silent failure - not authenticated
    }

    // Build payload
    const payload: ReviewEventPayload = {
      booking_id: bookingId,
      property_id: propertyId,
      rating,
    };

    // Auto-detect user agent and device type
    const userAgent = navigator.userAgent;
    const deviceType = detectDeviceType(userAgent);

    // Insert event into guest_events table
    const { error } = await supabase
      .from('guest_events')
      .insert({
        user_id: user.id,
        type: 'rate',
        payload: payload,
        user_agent: userAgent,
        device_type: deviceType,
        ts: new Date().toISOString(),
      });

    if (error) {
      // Silent failure - log to console but don't throw
      console.error('Failed to log review event:', error);
    }
  } catch (error) {
    // Silent failure - event tracking should never block user actions
    console.error('Error logging review event:', error);
  }
}
