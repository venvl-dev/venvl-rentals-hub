import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebSocketConnection {
  socket: WebSocket;
  userId: string;
  channels: Set<string>;
  lastHeartbeat: number;
}

const connections = new Map<string, WebSocketConnection>();

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get('upgrade') || '';

  if (upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket connection', { status: 400 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');
  const authToken = url.searchParams.get('token');

  if (!userId || !authToken) {
    return new Response('Missing user_id or token', { status: 400 });
  }

  // Verify auth token with Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(authToken);

  if (error || !user || user.id !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  const connectionId = crypto.randomUUID();
  const connection: WebSocketConnection = {
    socket,
    userId,
    channels: new Set(['general', `user:${userId}`]),
    lastHeartbeat: Date.now(),
  };

  socket.onopen = () => {
    console.log(`WebSocket connection opened for user ${userId}`);
    connections.set(connectionId, connection);

    // Send connection confirmation
    socket.send(
      JSON.stringify({
        type: 'connected',
        userId,
        connectionId,
        channels: Array.from(connection.channels),
      }),
    );

    // Send any pending notifications
    sendPendingNotifications(userId, socket);
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'heartbeat':
          connection.lastHeartbeat = Date.now();
          socket.send(JSON.stringify({ type: 'heartbeat_ack' }));
          break;

        case 'subscribe':
          if (message.channel) {
            connection.channels.add(message.channel);
            socket.send(
              JSON.stringify({
                type: 'subscribed',
                channel: message.channel,
              }),
            );
          }
          break;

        case 'unsubscribe':
          if (message.channel) {
            connection.channels.delete(message.channel);
            socket.send(
              JSON.stringify({
                type: 'unsubscribed',
                channel: message.channel,
              }),
            );
          }
          break;

        case 'mark_read':
          if (message.notification_ids) {
            markNotificationsAsRead(userId, message.notification_ids);
          }
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  };

  socket.onclose = () => {
    console.log(`WebSocket connection closed for user ${userId}`);
    connections.delete(connectionId);
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    connections.delete(connectionId);
  };

  return response;
});

async function sendPendingNotifications(userId: string, socket: WebSocket) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: notifications } = await supabase
      .from('real_time_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_sent', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notifications && notifications.length > 0) {
      for (const notification of notifications) {
        socket.send(
          JSON.stringify({
            type: 'notification',
            data: notification,
          }),
        );
      }

      // Mark notifications as sent
      await supabase
        .from('real_time_notifications')
        .update({ is_sent: true })
        .in(
          'id',
          notifications.map((n) => n.id),
        );
    }
  } catch (error) {
    console.error('Error sending pending notifications:', error);
  }
}

async function markNotificationsAsRead(
  userId: string,
  notificationIds: string[],
) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from('real_time_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', notificationIds)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error marking notifications as read:', error);
  }
}

// Broadcast notification to specific user
export async function broadcastToUser(userId: string, notification: any) {
  for (const [connectionId, connection] of connections) {
    if (connection.userId === userId) {
      try {
        connection.socket.send(
          JSON.stringify({
            type: 'notification',
            data: notification,
          }),
        );
      } catch (error) {
        console.error('Error broadcasting to user:', error);
        connections.delete(connectionId);
      }
    }
  }
}

// Broadcast to all connections in a channel
export async function broadcastToChannel(channel: string, data: any) {
  for (const [connectionId, connection] of connections) {
    if (connection.channels.has(channel)) {
      try {
        connection.socket.send(
          JSON.stringify({
            type: 'broadcast',
            channel,
            data,
          }),
        );
      } catch (error) {
        console.error('Error broadcasting to channel:', error);
        connections.delete(connectionId);
      }
    }
  }
}

// Clean up stale connections
setInterval(() => {
  const now = Date.now();
  const timeout = 60000; // 1 minute timeout

  for (const [connectionId, connection] of connections) {
    if (now - connection.lastHeartbeat > timeout) {
      try {
        connection.socket.close();
      } catch (error) {
        console.error('Error closing stale connection:', error);
      }
      connections.delete(connectionId);
    }
  }
}, 30000); // Check every 30 seconds
