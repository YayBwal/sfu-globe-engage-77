
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePresence = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Set user as online when they log in
    const updateUserOnlineStatus = async (isOnline: boolean) => {
      try {
        await supabase
          .from('profiles')
          .update({ online: isOnline })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    // Update to online when component mounts (user becomes active)
    updateUserOnlineStatus(true);

    // Event listeners for tab/window visibility changes
    const handleVisibilityChange = () => {
      updateUserOnlineStatus(!document.hidden);
    };

    // Event listeners for page unload/close
    const handleBeforeUnload = () => {
      // Use synchronous approach for unload events
      const url = `${supabase.getURL()}/rest/v1/profiles?id=eq.${user.id}`;
      navigator.sendBeacon(
        url,
        JSON.stringify({ online: false })
      );
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Set up heartbeat to maintain online status
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden) {
        updateUserOnlineStatus(true);
      }
    }, 60000); // Update every minute

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeatInterval);
      updateUserOnlineStatus(false);
    };
  }, [user]);
};
