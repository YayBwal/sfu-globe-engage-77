
import { supabase } from '@/integrations/supabase/client';
import { Question, QuizScore } from './types';
import { useToast } from '@/hooks/use-toast';

export const useQuizzes = () => {
  const { toast } = useToast();

  // Fetch quizzes
  const fetchQuizzes = async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
  };

  // Fetch questions from the database
  const fetchQuestions = async (courseId?: string): Promise<Question[]> => {
    try {
      let query = supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });
        
      // Filter by course ID if provided
      if (courseId) {
        // The actual field name might be different, adjust as needed
        query = query.eq('category', courseId);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      // Map the database fields to our Question interface
      const mappedQuestions = data.map(item => ({
        id: item.id,
        question: item.question,
        options: Array.isArray(item.options) ? item.options : JSON.parse(String(item.options)),
        correctAnswer: item.correct_answer,
        category: item.category,
        difficulty: item.difficulty as 'easy' | 'medium' | 'hard',
        created_at: item.created_at,
        courseId: item.category // Use category as courseId for now
      }));
      
      return mappedQuestions;
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quiz questions',
        variant: 'destructive',
      });
      return [];
    }
  };

  // Save quiz score
  const saveQuizScore = async (
    userId: string, 
    userName: string,
    profilePic: string | undefined,
    quizId: string, 
    quizName: string, 
    score: number, 
    timeTaken: number, 
    sessionId?: string
  ): Promise<void> => {
    try {
      const { error } = await supabase.from('quiz_scores').insert({
        user_id: userId,
        user_name: userName,
        profile_pic: profilePic,
        quiz_id: quizId,
        quiz_name: quizName,
        score,
        time_taken: timeTaken,
        session_id: sessionId
      });
      
      if (error) throw error;
      
      toast({
        title: 'Score saved',
        description: `You scored ${score} points!`,
      });
    } catch (error) {
      console.error('Error saving quiz score:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your score',
        variant: 'destructive',
      });
    }
  };

  return {
    fetchQuizzes,
    fetchQuestions,
    saveQuizScore
  };
};
