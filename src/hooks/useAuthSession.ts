
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  // Optimize session update function
  const updateSession = useCallback((newSession: Session | null) => {
    const newUser = newSession?.user ?? null;
    
    setUser(prevUser => {
      if (JSON.stringify(prevUser) === JSON.stringify(newUser)) {
        return prevUser;
      }
      return newUser;
    });
    
    setSession(prevSession => {
      if (JSON.stringify(prevSession) === JSON.stringify(newSession)) {
        return prevSession;
      }
      return newSession;
    });
    
    setLoading(false);
    
    // Simplified logging
    if (newUser && !user) {
      console.log("User logged in:", newUser.email);
    } else if (!newUser && user) {
      console.log("User logged out");
    }
  }, [user]);

  useEffect(() => {
    let isSubscribed = true;
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (isSubscribed) {
          updateSession(currentSession);
          setConnectionError(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        if (isSubscribed) {
          updateSession(currentSession);
        }
      })
      .catch((error) => {
        console.error("Error getting session:", error);
        if (isSubscribed) {
          setConnectionError(error instanceof Error ? error : new Error('Authentication error'));
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [updateSession]);

  return { user, session, loading, connectionError };
};
