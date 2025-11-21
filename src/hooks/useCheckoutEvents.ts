/**
 * Custom hook for tracking checkout funnel events (A4)
 *
 * Provides helper functions to log checkout initiation and track abandonment
 * for booking intent scoring and funnel analysis.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  LogCheckoutStartParams,
  CheckoutFunnelMetrics,
  CheckoutAbandonmentDetail,
  AbandonedCheckout,
} from '@/types/checkout-events';
import { getFunnelSessionId } from '@/utils/sessionManager';

export const useCheckoutEvents = () => {
  /**
   * Logs a start_checkout event when user initiates booking flow
   * Automatically includes session_id for funnel tracking and deduplication
   *
   * @param params - Checkout start parameters
   * @returns The event ID if successful, null otherwise
   */
  const logCheckoutStart = async (
    params: Omit<LogCheckoutStartParams, 'p_session_id'>,
  ): Promise<string | null> => {
    try {
      // Get or create session ID
      const sessionId = getFunnelSessionId();

      const { data, error } = await supabase.rpc('log_checkout_start_event', {
        ...params,
        p_session_id: sessionId,
      });

      if (error) {
        console.error('Failed to log checkout start event:', error);
        return null;
      }

      console.log('✅ Checkout start event logged:', data);
      return data as string;
    } catch (error) {
      console.error('Exception while logging checkout start event:', error);
      return null;
    }
  };

  /**
   * Gets checkout funnel metrics for analysis
   *
   * @param daysBack - Number of days to look back (default: 7)
   * @returns Array of daily funnel metrics
   */
  const getCheckoutFunnelMetrics = async (
    daysBack: number = 7,
  ): Promise<CheckoutFunnelMetrics[]> => {
    try {
      const { data, error } = await supabase
        .from('checkout_funnel_analysis')
        .select('*')
        .gte('funnel_date', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
        .order('funnel_date', { ascending: false });

      if (error) {
        console.error('Failed to get checkout funnel metrics:', error);
        return [];
      }

      return (data || []) as CheckoutFunnelMetrics[];
    } catch (error) {
      console.error('Exception while getting funnel metrics:', error);
      return [];
    }
  };

  /**
   * Gets checkout abandonment details for analysis
   *
   * @param limit - Maximum number of results (default: 50)
   * @returns Array of abandonment details
   */
  const getAbandonmentDetails = async (
    limit: number = 50,
  ): Promise<CheckoutAbandonmentDetail[]> => {
    try {
      const { data, error } = await supabase
        .from('checkout_abandonment_analysis')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get abandonment details:', error);
        return [];
      }

      return (data || []) as CheckoutAbandonmentDetail[];
    } catch (error) {
      console.error('Exception while getting abandonment details:', error);
      return [];
    }
  };

  /**
   * Flags abandoned checkouts (past 30-minute threshold)
   *
   * @param minutesThreshold - Minutes to consider abandoned (default: 30)
   * @returns Array of abandoned checkout details
   */
  const flagAbandonedCheckouts = async (
    minutesThreshold: number = 30,
  ): Promise<AbandonedCheckout[]> => {
    try {
      const { data, error } = await supabase.rpc('flag_abandoned_checkouts', {
        p_minutes_threshold: minutesThreshold,
      });

      if (error) {
        console.error('Failed to flag abandoned checkouts:', error);
        return [];
      }

      return (data || []) as AbandonedCheckout[];
    } catch (error) {
      console.error('Exception while flagging abandoned checkouts:', error);
      return [];
    }
  };

  return {
    logCheckoutStart,
    getCheckoutFunnelMetrics,
    getAbandonmentDetails,
    flagAbandonedCheckouts,
  };
};
