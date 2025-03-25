
import { supabase } from '@/integrations/supabase/client';
import { GamingSession } from './types';
import { useToast } from '@/hooks/use-toast';

// Fetch sessions
export const fetchSessions = async (): Promise<GamingSession[]> => {
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
    return [];
  }
};

// Create a new session
export const createSession = async (userId: string, name: string, courseId?: string): Promise<string> => {
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
    return data.id;
  } catch (error) {
    console.error('Error creating session:', error);
    return '';
  }
};

// Delete a session
export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    // Delete the session
    const { error } = await supabase
      .from('gaming_sessions')
      .delete()
      .match({ id: sessionId });
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};

// Hook for using session functions with toast feedback
export const useSessions = () => {
  const { toast } = useToast();

  const fetchSessionsWithToast = async (): Promise<GamingSession[]> => {
    try {
      const sessions = await fetchSessions();
      return sessions;
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

  const createSessionWithToast = async (name: string, userId: string, courseId?: string): Promise<string> => {
    try {
      const sessionId = await createSession(userId, name, courseId);
      
      toast({
        title: 'Success',
        description: 'Session created successfully',
      });
      
      return sessionId;
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

  const deleteSessionWithToast = async (sessionId: string): Promise<void> => {
    try {
      await deleteSession(sessionId);
      
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
    fetchSessions: fetchSessionsWithToast,
    createSession: createSessionWithToast,
    deleteSession: deleteSessionWithToast
  };
};
