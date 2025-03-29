
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { StudySession } from '@/pages/Study';

export const useSessionJoin = (refetchSessions: () => Promise<void>) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinedSessions, setJoinedSessions] = useState<string[]>([]);
  
  // Load user's joined sessions
  useEffect(() => {
    const fetchJoinedSessions = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('session_participants')
          .select('session_id')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        if (data) {
          setJoinedSessions(data.map(item => item.session_id));
        }
      } catch (error) {
        console.error("Error fetching joined sessions:", error);
      }
    };
    
    fetchJoinedSessions();
  }, [user]);
  
  // Actual join session logic
  const joinSession = async (session: StudySession) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join study sessions",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      setIsJoining(true);
      
      // Check if user is already a participant
      const { data: existingParticipant, error: checkError } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', session.id)
        .eq('user_id', user?.id)
        .single();
        
      if (existingParticipant) {
        // User already joined
        if (!joinedSessions.includes(session.id)) {
          setJoinedSessions(prev => [...prev, session.id]);
        }
        
        toast({
          title: "Already joined",
          description: "You're already a participant in this session"
        });
        
        return true;
      }
      
      // Add user as participant
      const { error: joinError } = await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          user_id: user?.id,
          joined_at: new Date().toISOString()
        });
        
      if (joinError) throw joinError;
      
      // Update local state
      setJoinedSessions(prev => [...prev, session.id]);
      
      // Update UI
      await refetchSessions();
      
      toast({
        title: "Success!",
        description: "You've joined the study session"
      });
      
      return true;
    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Error",
        description: "Failed to join the study session",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsJoining(false);
    }
  };
  
  // Check if user has joined a session
  const hasJoinedSession = (sessionId: string) => {
    return joinedSessions.includes(sessionId);
  };
  
  return {
    joinSession,
    hasJoinedSession,
    isJoining,
    joinedSessions
  };
};
