
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

// Define types for our gaming context
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct answer in options array
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at?: string;
}

export interface QuizScore {
  id: string;
  userId: string;
  userName: string;
  profilePic?: string;
  quizId: string;
  quizName: string;
  score: number;
  timeTaken: number;
  createdAt: string;
}

export interface GameScore {
  id: string;
  userId: string;
  userName: string;
  profilePic?: string;
  gameId: string;
  gameName: string;
  score: number;
  level: number;
  createdAt: string;
}

interface GamingContextType {
  quizzes: any[];
  quizScores: QuizScore[];
  gameScores: GameScore[];
  fetchQuizzes: () => Promise<void>;
  fetchLeaderboards: () => Promise<void>;
  saveQuizScore: (quizId: string, quizName: string, score: number, timeTaken: number) => Promise<void>;
  saveGameScore: (gameId: string, gameName: string, score: number, level: number) => Promise<void>;
  isLoading: boolean;
  questions: Question[];
  fetchQuestions: () => Promise<void>;
}

const GamingContext = createContext<GamingContextType>({
  quizzes: [],
  quizScores: [],
  gameScores: [],
  fetchQuizzes: async () => {},
  fetchLeaderboards: async () => {},
  saveQuizScore: async () => {},
  saveGameScore: async () => {},
  isLoading: false,
  questions: [],
  fetchQuestions: async () => {},
});

export const useGaming = () => useContext(GamingContext);

export const GamingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Fetch quizzes
  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      // Fetch quiz data 
      // ...
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setIsLoading(false);
    }
  };

  // Fetch leaderboards
  const fetchLeaderboards = async () => {
    try {
      setIsLoading(true);
      
      // Fetch quiz scores
      const { data: quizScoresData, error: quizScoresError } = await supabase
        .from('quiz_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(50);
        
      if (quizScoresError) throw quizScoresError;
      
      // Fetch game scores
      const { data: gameScoresData, error: gameScoresError } = await supabase
        .from('game_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(50);
        
      if (gameScoresError) throw gameScoresError;
      
      // Map DB fields to our interface fields
      const mappedQuizScores = quizScoresData.map(item => ({
        id: item.id,
        userId: item.user_id,
        userName: item.user_name,
        profilePic: item.profile_pic,
        quizId: item.quiz_id,
        quizName: item.quiz_name,
        score: item.score,
        timeTaken: item.time_taken,
        createdAt: item.created_at
      }));
      
      const mappedGameScores = gameScoresData.map(item => ({
        id: item.id,
        userId: item.user_id,
        userName: item.user_name,
        profilePic: item.profile_pic,
        gameId: item.game_id,
        gameName: item.game_name,
        score: item.score,
        level: item.level,
        createdAt: item.created_at
      }));
      
      setQuizScores(mappedQuizScores);
      setGameScores(mappedGameScores);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leaderboard data',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Fetch questions from the database
  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Map the database fields to our Question interface
      const mappedQuestions = data.map(item => ({
        id: item.id,
        question: item.question,
        options: Array.isArray(item.options) ? item.options : JSON.parse(item.options),
        correctAnswer: item.correct_answer,
        category: item.category,
        difficulty: item.difficulty,
        created_at: item.created_at
      }));
      
      setQuestions(mappedQuestions);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quiz questions',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Save quiz score
  const saveQuizScore = async (quizId: string, quizName: string, score: number, timeTaken: number) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to save scores',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await supabase.from('quiz_scores').insert({
        user_id: user.id,
        user_name: profile?.name || 'Anonymous',
        profile_pic: profile?.profile_pic,
        quiz_id: quizId,
        quiz_name: quizName,
        score,
        time_taken: timeTaken,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Score saved',
        description: `You scored ${score} points!`,
      });
      
      // Refresh leaderboards
      await fetchLeaderboards();
    } catch (error) {
      console.error('Error saving quiz score:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your score',
        variant: 'destructive',
      });
    }
  };

  // Save game score
  const saveGameScore = async (gameId: string, gameName: string, score: number, level: number) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to save scores',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await supabase.from('game_scores').insert({
        user_id: user.id,
        user_name: profile?.name || 'Anonymous',
        profile_pic: profile?.profile_pic,
        game_id: gameId,
        game_name: gameName,
        score,
        level,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Score saved',
        description: `You scored ${score} points at level ${level}!`,
      });
      
      // Refresh leaderboards
      await fetchLeaderboards();
    } catch (error) {
      console.error('Error saving game score:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your score',
        variant: 'destructive',
      });
    }
  };

  return (
    <GamingContext.Provider 
      value={{ 
        quizzes, 
        quizScores, 
        gameScores, 
        fetchQuizzes, 
        fetchLeaderboards, 
        saveQuizScore, 
        saveGameScore, 
        isLoading,
        questions,
        fetchQuestions
      }}
    >
      {children}
    </GamingContext.Provider>
  );
};
