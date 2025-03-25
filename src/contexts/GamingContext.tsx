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
  courseId?: string;
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
  sessionId?: string;
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
  sessionId?: string;
}

export interface LeaderboardUser {
  userId: string;
  userName: string;
  profilePic?: string;
  totalScore: number;
  quizCount: number;
  gameCount: number;
  sessionId?: string;
}

export interface GamingSession {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  courseId?: string;
}

interface GamingContextType {
  quizzes: any[];
  quizScores: QuizScore[];
  gameScores: GameScore[];
  leaderboard: LeaderboardUser[];
  sessions: GamingSession[];
  fetchQuizzes: () => Promise<void>;
  fetchLeaderboards: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  saveQuizScore: (quizId: string, quizName: string, score: number, timeTaken: number, sessionId?: string) => Promise<void>;
  saveGameScore: (gameId: string, gameName: string, score: number, level: number, sessionId?: string) => Promise<void>;
  createSession: (name: string, courseId?: string) => Promise<string>;
  deleteSession: (sessionId: string) => Promise<void>;
  isLoading: boolean;
  questions: Question[];
  fetchQuestions: (courseId?: string) => Promise<void>;
}

const GamingContext = createContext<GamingContextType>({
  quizzes: [],
  quizScores: [],
  gameScores: [],
  leaderboard: [],
  sessions: [],
  fetchQuizzes: async () => {},
  fetchLeaderboards: async () => {},
  fetchSessions: async () => {},
  saveQuizScore: async () => {},
  saveGameScore: async () => {},
  createSession: async () => '',
  deleteSession: async () => {},
  isLoading: false,
  questions: [],
  fetchQuestions: async () => {},
});

export const useGaming = () => useContext(GamingContext);

export const GamingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [sessions, setSessions] = useState<GamingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('gaming_sessions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const mappedSessions = data.map(item => ({
        id: item.id,
        name: item.name,
        createdAt: item.created_at,
        createdBy: item.created_by,
        courseId: item.course_id
      }));
      
      setSessions(mappedSessions);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Create a new session
  const createSession = async (name: string, courseId?: string): Promise<string> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to create sessions',
        variant: 'destructive',
      });
      return '';
    }
    
    try {
      const { data, error } = await supabase
        .from('gaming_sessions')
        .insert({
          name,
          created_by: user.id,
          course_id: courseId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Session created successfully',
      });
      
      // Refresh sessions
      await fetchSessions();
      
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
  const deleteSession = async (sessionId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to delete sessions',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Delete associated quiz scores
      const { error: quizScoresError } = await supabase
        .from('quiz_scores')
        .delete()
        .match({ session_id: sessionId });
        
      if (quizScoresError) throw quizScoresError;
      
      // Delete associated game scores
      const { error: gameScoresError } = await supabase
        .from('game_scores')
        .delete()
        .match({ session_id: sessionId });
        
      if (gameScoresError) throw gameScoresError;
      
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
      
      // Refresh sessions and leaderboard
      await fetchSessions();
      await fetchLeaderboards();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
    }
  };

  // Fetch quizzes
  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setQuizzes(data);
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
        createdAt: item.created_at,
        sessionId: item.session_id
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
        createdAt: item.created_at,
        sessionId: item.session_id
      }));
      
      // Calculate leaderboard data
      const userScores = new Map<string, LeaderboardUser>();
      
      // Process quiz scores
      mappedQuizScores.forEach(score => {
        if (!userScores.has(score.userId)) {
          userScores.set(score.userId, {
            userId: score.userId,
            userName: score.userName,
            profilePic: score.profilePic,
            totalScore: 0,
            quizCount: 0,
            gameCount: 0
          });
        }
        
        const userData = userScores.get(score.userId)!;
        userData.totalScore += score.score;
        userData.quizCount += 1;
      });
      
      // Process game scores
      mappedGameScores.forEach(score => {
        if (!userScores.has(score.userId)) {
          userScores.set(score.userId, {
            userId: score.userId,
            userName: score.userName,
            profilePic: score.profilePic,
            totalScore: 0,
            quizCount: 0,
            gameCount: 0
          });
        }
        
        const userData = userScores.get(score.userId)!;
        userData.totalScore += score.score;
        userData.gameCount += 1;
      });
      
      // Convert to array and sort by total score
      const leaderboardArray = Array.from(userScores.values())
        .sort((a, b) => b.totalScore - a.totalScore);
      
      setQuizScores(mappedQuizScores);
      setGameScores(mappedGameScores);
      setLeaderboard(leaderboardArray);
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
  const fetchQuestions = async (courseId?: string) => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });
        
      // Filter by course ID if provided
      if (courseId) {
        query = query.eq('course_id', courseId);
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
        courseId: item.course_id
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
  const saveQuizScore = async (quizId: string, quizName: string, score: number, timeTaken: number, sessionId?: string) => {
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
        session_id: sessionId
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
  const saveGameScore = async (gameId: string, gameName: string, score: number, level: number, sessionId?: string) => {
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
        session_id: sessionId
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
        leaderboard,
        sessions,
        fetchQuizzes, 
        fetchLeaderboards,
        fetchSessions,
        saveQuizScore, 
        saveGameScore,
        createSession,
        deleteSession,
        isLoading,
        questions,
        fetchQuestions
      }}
    >
      {children}
    </GamingContext.Provider>
  );
};
