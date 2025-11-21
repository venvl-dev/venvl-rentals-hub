import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PropertyViewPayload {
  property_id: string;
  dwell_seconds: number;
  scroll_depth_pct: number;
  gallery_clicks: number;
}

interface TrackPropertyViewParams {
  payload: PropertyViewPayload;
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  eventId?: string | null; // If provided, update instead of insert
}

/**
 * Detects device type from user agent string
 */
const detectDeviceType = (
  userAgent: string,
): 'mobile' | 'desktop' | 'tablet' => {
  const ua = userAgent.toLowerCase();

  // Check for tablet first (more specific)
  if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }

  // Check for mobile
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return 'mobile';
  }

  // Default to desktop
  return 'desktop';
};

/**
 * Hook for tracking property view events with Supabase
 * Only tracks if user is authenticated
 */
export const useTrackPropertyView = () => {
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (params: TrackPropertyViewParams) => {
      // Skip if user is not authenticated
      if (!user?.id) {
        console.log('Skipping property view tracking - user not authenticated');
        return null;
      }

      const { payload, userAgent, deviceType, eventId } = params;

      // If eventId exists, update the existing record
      if (eventId) {
        const { data, error } = await supabase
          .from('guest_events')
          .update({
            payload: payload as unknown as any,
            ts: new Date().toISOString(), // Update timestamp to reflect latest activity
          })
          .eq('id', eventId)
          .select()
          .single();

        if (error) {
          console.error('Error updating property view:', error);
          throw error;
        }

        console.log('Property view updated successfully:', data);
        return data;
      }

      // Otherwise, insert a new record
      const { data, error } = await supabase
        .from('guest_events')
        .insert({
          user_id: user.id,
          type: 'view',
          payload: payload as unknown as any,
          user_agent: userAgent,
          device_type: deviceType,
          ts: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error tracking property view:', error);
        throw error;
      }

      console.log('Property view created successfully:', data);
      return data;
    },
    onError: (error) => {
      console.error('Failed to track property view:', error);
    },
  });

  /**
   * Track a property view with automatic device detection
   */
  const trackPropertyView = (
    payload: PropertyViewPayload,
    eventId?: string | null,
  ) => {
    // Skip if user is not authenticated
    if (!user?.id) {
      return Promise.resolve(null);
    }

    const userAgent = navigator.userAgent;
    const deviceType = detectDeviceType(userAgent);

    return new Promise((resolve) => {
      mutation.mutate(
        {
          payload,
          userAgent,
          deviceType,
          eventId,
        },
        {
          onSuccess: (data) => {
            resolve(data);
          },
          onError: () => {
            resolve(null);
          },
        },
      );
    });
  };

  return {
    trackPropertyView,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};
