import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  data?: any;
  channel?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      // Send notification
      const payload: NotificationPayload = await req.json();

      // Validate required fields
      if (
        !payload.user_id ||
        !payload.title ||
        !payload.message ||
        !payload.notification_type
      ) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      // Insert notification into database
      const { data: notification, error: insertError } = await supabase
        .from('real_time_notifications')
        .insert([
          {
            user_id: payload.user_id,
            notification_type: payload.notification_type,
            title: payload.title,
            message: payload.message,
            data: payload.data || {},
            channel: payload.channel || 'general',
            priority: payload.priority || 'normal',
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting notification:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create notification' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      // Send real-time notification via Supabase realtime
      const channel = supabase.channel(`notifications:${payload.user_id}`);

      await channel.send({
        type: 'broadcast',
        event: 'new_notification',
        payload: notification,
      });

      console.log('Notification sent successfully:', notification.id);

      return new Response(JSON.stringify({ success: true, notification }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Get notifications for user
      const url = new URL(req.url);
      const userId = url.searchParams.get('user_id');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const unreadOnly = url.searchParams.get('unread_only') === 'true';

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'user_id parameter is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      let query = supabase
        .from('real_time_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data: notifications, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch notifications' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({ notifications }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PATCH') {
      // Mark notifications as read
      const { notification_ids, user_id } = await req.json();

      if (!notification_ids || !user_id) {
        return new Response(
          JSON.stringify({
            error: 'notification_ids and user_id are required',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      const { error } = await supabase
        .from('real_time_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', notification_ids)
        .eq('user_id', user_id);

      if (error) {
        console.error('Error marking notifications as read:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to mark notifications as read' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in realtime-notifications function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
