import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Check,
  X,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  data: any;
  channel: string;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

interface NotificationCenterProps {
  userId: string;
}

const NotificationCenter = ({ userId }: NotificationCenterProps) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      setupRealtimeSubscription();
    }
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        'realtime-notifications',
        {
          method: 'GET',
          body: new URLSearchParams({
            user_id: userId,
            limit: '20',
          }),
        },
      );

      if (error) throw error;

      setNotifications(data.notifications || []);
      setUnreadCount(
        data.notifications?.filter((n: Notification) => !n.is_read).length || 0,
      );
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('broadcast', { event: 'new_notification' }, (payload) => {
        const newNotification = payload.payload as Notification;
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show toast for high priority notifications
        if (
          newNotification.priority === 'high' ||
          newNotification.priority === 'urgent'
        ) {
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant:
              newNotification.priority === 'urgent' ? 'destructive' : 'default',
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase.functions.invoke(
        'realtime-notifications',
        {
          method: 'PATCH',
          body: {
            notification_ids: notificationIds,
            user_id: userId,
          },
        },
      );

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notification) =>
          notificationIds.includes(notification.id)
            ? { ...notification, is_read: true }
            : notification,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'urgent')
      return <AlertTriangle className='h-4 w-4 text-red-500' />;

    switch (type) {
      case 'booking':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'message':
        return <MessageSquare className='h-4 w-4 text-blue-500' />;
      case 'system':
        return <Info className='h-4 w-4 text-gray-500' />;
      default:
        return <Bell className='h-4 w-4 text-gray-500' />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' className='relative'>
          <Bell className='h-4 w-4' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center justify-between'>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button variant='ghost' size='sm' onClick={markAllAsRead}>
                <Check className='h-4 w-4 mr-1' />
                Mark all read
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notifications`
              : "You're all caught up!"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-96'>
          {loading ? (
            <div className='flex items-center justify-center h-32'>
              <div className='text-sm text-muted-foreground'>
                Loading notifications...
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-32 text-center'>
              <Bell className='h-8 w-8 text-muted-foreground mb-2' />
              <div className='text-sm text-muted-foreground'>
                No notifications yet
              </div>
            </div>
          ) : (
            <div className='space-y-2'>
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:bg-accent ${
                    !notification.is_read
                      ? 'border-l-4 border-l-primary bg-accent/50'
                      : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead([notification.id]);
                    }
                  }}
                >
                  <CardContent className='p-3'>
                    <div className='flex items-start space-x-2'>
                      <div className='flex-shrink-0 mt-1'>
                        {getNotificationIcon(
                          notification.notification_type,
                          notification.priority,
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between'>
                          <h4 className='text-sm font-medium truncate'>
                            {notification.title}
                          </h4>
                          <div className='flex items-center space-x-1 ml-2'>
                            {!notification.is_read && (
                              <div className='w-2 h-2 bg-primary rounded-full' />
                            )}
                            <span className='text-xs text-muted-foreground whitespace-nowrap'>
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
                          {notification.message}
                        </p>
                        {notification.priority !== 'normal' && (
                          <Badge
                            variant='outline'
                            className={`text-xs mt-1 ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationCenter;
