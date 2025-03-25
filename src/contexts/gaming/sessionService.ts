
import { supabase } from '@/integrations/supabase/client';
import { GamingSession } from './types';
import { useToast } from '@/hooks/use-toast';

// These functions are extracted from GamingContext to handle session-related operations
export const useSessions = () => {
  const { toast } = useToast();

  // Fetch sessions
  const fetchSessions = async (): Promise<GamingSession[]> => {
    try {
      // Since gaming_sessions table doesn't exist yet, this will be a placeholder
      // In a real implementation, we would create the table first
      
      // We'll use the quiz_scores table to simulate sessions for now
      const { data, error } = await supabase
        .from('quiz_scores')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Map to our GamingSession structure
      const mappedSessions = data.map(item => ({
        id: item.id,
        name: item.quiz_name,
        createdAt: item.created_at,
        createdBy: item.user_id,
        courseId: undefined
      }));
      
      return mappedSessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Create a new session
  const createSession = async (name: string, userId: string, courseId?: string): Promise<string> => {
    try {
      // Instead of trying to insert into a non-existent table, we'll simulate
      // by adding a quiz score entry that will act as our session
      const { data, error } = await supabase
        .from('quiz_scores')
        .insert({
          quiz_id: 'session-' + Date.now(),
          quiz_name: name,
          user_id: userId,
          user_name: 'Session Creator',
          score: 0,
          time_taken: 0
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Session created successfully',
      });
      
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create session',
        variant: 'destructive',
      });
      return '';
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      // Delete the "session" (quiz score entry)
      const { error } = await supabase
        .from('quiz_scores')
        .delete()
        .match({ id: sessionId });
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Session deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
    }
  };

  return {
    fetchSessions,
    createSession,
    deleteSession
  };
};
