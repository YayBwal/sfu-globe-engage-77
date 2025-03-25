
import React from 'react';
import { BellDot, Bell, CheckCheck, Trash2, AlertTriangle, CheckCircle, Info, MessageSquare, Calendar, ShoppingBag, BookOpen, Users, Globe } from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '@/contexts/NotificationContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSourceIcon = () => {
    switch (notification.source) {
      case 'friend':
        return <Users className="h-4 w-4" />;
      case 'marketplace':
        return <ShoppingBag className="h-4 w-4" />;
      case 'newsfeed':
        return <Globe className="h-4 w-4" />;
      case 'clubs':
        return <Users className="h-4 w-4" />;
      case 'study':
        return <BookOpen className="h-4 w-4" />;
      case 'attendance':
        return <Calendar className="h-4 w-4" />;
      case 'system':
        return <Info className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
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
          <span className="flex items-center justify-center" aria-hidden="true">
            {getSourceIcon()}
          </span>
          <h4 className="text-sm font-medium">{notification.title}</h4>
        </div>
        <div className="flex items-center gap-1">
          {!notification.is_read && (
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          )}
          <span className="ml-1">{getTypeIcon()}</span>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500" title={fullDate}>{timeAgo}</span>
          <Badge variant="outline" className="text-xs py-0 h-5">
            {notification.source}
          </Badge>
        </div>
        <div className="flex gap-1">
          {!notification.is_read && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleMarkAsRead}>
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Read
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
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-3 border-b flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
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
            <Badge variant="secondary" className={cn(
              "bg-gray-100 hover:bg-gray-200 transition-colors", 
              unreadCount > 0 ? "text-blue-600" : "text-gray-600"
            )}>
              {unreadCount} unread
            </Badge>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin h-6 w-6 border-2 border-sfu-red border-t-transparent rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              <>
                {/* Group by date */}
                {(() => {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  
                  // Format dates for comparison
                  const todayStr = format(today, 'yyyy-MM-dd');
                  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
                  
                  // Group notifications
                  const todayNotifications = notifications.filter(n => 
                    format(new Date(n.created_at), 'yyyy-MM-dd') === todayStr
                  );
                  
                  const yesterdayNotifications = notifications.filter(n => 
                    format(new Date(n.created_at), 'yyyy-MM-dd') === yesterdayStr
                  );
                  
                  const olderNotifications = notifications.filter(n => 
                    format(new Date(n.created_at), 'yyyy-MM-dd') !== todayStr && 
                    format(new Date(n.created_at), 'yyyy-MM-dd') !== yesterdayStr
                  );
                  
                  return (
                    <>
                      {todayNotifications.length > 0 && (
                        <>
                          <h4 className="text-xs font-semibold text-gray-500 px-2 py-1">Today</h4>
                          {todayNotifications.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={markAsRead}
                              onDelete={deleteNotification}
                            />
                          ))}
                        </>
                      )}
                      
                      {yesterdayNotifications.length > 0 && (
                        <>
                          <h4 className="text-xs font-semibold text-gray-500 px-2 py-1 mt-2">Yesterday</h4>
                          {yesterdayNotifications.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={markAsRead}
                              onDelete={deleteNotification}
                            />
                          ))}
                        </>
                      )}
                      
                      {olderNotifications.length > 0 && (
                        <>
                          <h4 className="text-xs font-semibold text-gray-500 px-2 py-1 mt-2">Earlier</h4>
                          {olderNotifications.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={markAsRead}
                              onDelete={deleteNotification}
                            />
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t text-center">
            <Button variant="link" size="sm" className="text-xs text-blue-600">
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
