
import { supabase } from '@/integrations/supabase/client';
import { GamingSession } from './types';
import { useToast } from '@/hooks/use-toast';

export const useSessions = () => {
  const { toast } = useToast();

  // Fetch sessions
  const fetchSessions = async (): Promise<GamingSession[]> => {
    try {
      const { data, error } = await supabase
        .from('gaming_sessions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Map to our GamingSession structure
      const mappedSessions = data.map(item => ({
        id: item.id,
        name: item.name,
        createdAt: item.created_at,
        createdBy: item.created_by,
        courseId: item.course_id
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
      const { data, error } = await supabase
        .from('gaming_sessions')
        .insert({
          name,
          created_by: userId,
          course_id: courseId,
          session_type: name.toLowerCase().includes('quiz') ? 'quiz' : 'game'
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
      // Delete the session
      const { error } = await supabase
        .from('gaming_sessions')
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
