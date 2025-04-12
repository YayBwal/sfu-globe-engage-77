
import { supabase } from "@/integrations/supabase/client";
import { TypedSupabaseClient } from '@/types/supabaseCustom';

const typedSupabase = supabase as unknown as TypedSupabaseClient;

export async function createNotification(
  userId: string, 
  title: string, 
  message: string, 
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  source: string
) {
  try {
    const { error } = await typedSupabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      source,
      is_read: false
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await typedSupabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await typedSupabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await typedSupabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}
