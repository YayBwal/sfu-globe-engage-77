
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  // Memoize session update function to prevent unnecessary re-renders
  const updateSession = useCallback((newSession: Session | null) => {
    const newUser = newSession?.user ?? null;
    
    // Only update if values have changed to prevent unnecessary re-renders
    if (
      JSON.stringify(newUser) !== JSON.stringify(user) || 
      JSON.stringify(newSession) !== JSON.stringify(session)
    ) {
      setUser(newUser);
      setSession(newSession);
      setLoading(false);
      
      // Log for debugging
      if (newUser) {
        console.log("Auth state updated: User logged in", newUser.email);
      } else {
        console.log("Auth state updated: No user");
      }
    }
  }, [user, session]);

  useEffect(() => {
    let isSubscribed = true;
    
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (isSubscribed) {
          updateSession(currentSession);
          setConnectionError(null); // Clear any connection error on successful auth state change
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        if (isSubscribed) {
          updateSession(currentSession);
        }
      })
      .catch((error) => {
        console.error("Error getting session:", error);
        if (isSubscribed) {
          // Only set connection error for network-related issues
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            setConnectionError(new Error('Unable to connect to authentication service. Please check your internet connection.'));
          }
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
