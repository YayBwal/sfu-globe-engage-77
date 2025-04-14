
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);
        
        // Log for debugging
        if (session?.user) {
          console.log("Auth state changed: User logged in", session.user.email);
        } else {
          console.log("Auth state changed: No user");
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session);
      setLoading(false);
      
      // Log for debugging
      if (session?.user) {
        console.log("Existing session found:", session.user.email);
      } else {
        console.log("No existing session found");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
};
