
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePresence() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !profile) return;

    // Update user online status when they come online
    const updateOnlineStatus = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ online: true })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    updateOnlineStatus();

    // Create a Presence channel for real-time online status
    const channel = supabase.channel('online-users');
    
    const userStatus = {
      user_id: user.id,
      username: profile.name,
      online_at: new Date().toISOString(),
    };

    // Setup presence tracking
    channel
      .on('presence', { event: 'sync' }, () => {
        // You can get all present users with channel.presenceState()
        console.log('Online users:', channel.presenceState());
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userStatus);
        }
      });

    // Update user offline status when they leave
    const handleBeforeUnload = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ online: false })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      supabase.removeChannel(channel);
      
      // Also update user status to offline on component unmount
      const updateOfflineStatus = async () => {
        try {
          await supabase
            .from('profiles')
            .update({ online: false })
            .eq('id', user.id);
        } catch (error) {
          console.error('Error updating offline status:', error);
        }
      };
      
      updateOfflineStatus();
    };
  }, [user, profile]);
}
