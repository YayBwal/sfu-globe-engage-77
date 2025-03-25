
import React from 'react';
import { BellDot, Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '@/contexts/NotificationContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ 
  notification, 
  onMarkAsRead,
  onDelete 
}: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onMarkAsRead(notification.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(notification.id);
  };

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-100 border-green-300';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300';
      case 'error':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getSourceIcon = () => {
    switch (notification.source) {
      case 'friend':
        return '👥';
      case 'marketplace':
        return '🛒';
      case 'newsfeed':
        return '📰';
      case 'clubs':
        return '🎭';
      case 'study':
        return '📚';
      default:
        return '📣';
    }
  };

  const date = new Date(notification.created_at);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const fullDate = format(date, 'PPp');

  return (
    <div 
      className={`p-3 border-l-4 mb-2 rounded-r-md hover:bg-gray-50 transition-colors ${getTypeStyles()} ${!notification.is_read ? 'font-semibold' : ''}`}
      onClick={!notification.is_read ? handleMarkAsRead : undefined}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">{getSourceIcon()}</span>
          <h4 className="text-sm font-medium">{notification.title}</h4>
        </div>
        {!notification.is_read && (
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        )}
      </div>
      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500" title={fullDate}>{timeAgo}</span>
        <div className="flex gap-1">
          {!notification.is_read && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleMarkAsRead}>
              Mark as read
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-9 h-9 rounded-full flex items-center justify-center bg-sfu-lightgray text-sfu-black hover:bg-sfu-lightgray/80 transition-all duration-200 relative">
          {unreadCount > 0 ? <BellDot size={20} /> : <Bell size={20} />}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-sfu-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex justify-between items-center">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 text-xs flex items-center" 
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin h-6 w-6 border-2 border-sfu-red border-t-transparent rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
