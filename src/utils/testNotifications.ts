
import { supabase } from "@/integrations/supabase/client";
import { TypedSupabaseClient } from '@/types/supabaseCustom';

// Use our custom typed supabase client
const typedSupabase = supabase as unknown as TypedSupabaseClient;

export const generateTestNotification = async (userId: string) => {
  try {
    const types = ['info', 'success', 'warning', 'error'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const sources = ['friend', 'marketplace', 'newsfeed', 'clubs', 'study'];
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    
    const titles = [
      'New message received',
      'Study session created',
      'Assignment deadline approaching',
      'New friend request',
      'Club event reminder',
      'Marketplace item sold',
      'Quiz results available'
    ];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    
    const messages = [
      'You have received a new message from a classmate.',
      'A new study session for Algorithm Analysis has been created.',
      'Your assignment for Database Systems is due tomorrow!',
      'John Smith has sent you a friend request.',
      'Programming Club meeting starts in 30 minutes.',
      'Your textbook listing has been sold!',
      'Your recent quiz score is now available.'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    const { error } = await typedSupabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: randomTitle,
        message: randomMessage,
        source: randomSource,
        type: randomType,
        is_read: false
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error generating test notification:', error);
    return false;
  }
};
