
import { supabase } from '@/integrations/supabase/client';
import { Question } from './types';

// Fetch questions for a quiz
export const fetchQuestions = async (courseId?: string): Promise<Question[]> => {
  try {
    // Define the query
    let query = supabase.from('quiz_questions').select('*');
    
    // Add course filter if provided
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    // Execute the query with limit
    const { data, error } = await query.limit(10);
    
    if (error) {
      throw error;
    }
    
    // Transform the data to match our Question type
    return data.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correct_answer_index,
      category: q.category || 'General',
      difficulty: q.difficulty || 'Medium'
    }));
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
};

// Save quiz score
export const saveQuizScore = async (
  userId: string,
  quizId: string,
  quizName: string,
  score: number,
  timeTaken: number,
  sessionId?: string
): Promise<void> => {
  try {
    const insertData = {
      user_id: userId,
      quiz_id: quizId,
      quiz_name: quizName,
      score: score,
      time_taken: timeTaken,
      session_id: sessionId
    };
    
    const { error } = await supabase
      .from('quiz_scores')
      .insert(insertData);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving quiz score:', error);
    throw error;
  }
};
