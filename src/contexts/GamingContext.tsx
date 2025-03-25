
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSessions } from './gaming/sessionService';
import { useQuizzes } from './gaming/quizService';
import { useGames } from './gaming/gameService';
import { useLeaderboard } from './gaming/leaderboardService';
import { 
  GamingContextType, 
  Question, 
  QuizScore, 
  GameScore, 
  LeaderboardUser, 
  GamingSession 
} from './gaming/types';

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
  const sessionService = useSessions();
  const quizService = useQuizzes();
  const gameService = useGames();
  const leaderboardService = useLeaderboard();

  // Fetch sessions
  const fetchSessions = async () => {
    setIsLoading(true);
    const fetchedSessions = await sessionService.fetchSessions();
    setSessions(fetchedSessions);
    setIsLoading(false);
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
    
    const sessionId = await sessionService.createSession(name, user.id, courseId);
    
    // Refresh sessions
    await fetchSessions();
    
    return sessionId;
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
    
    await sessionService.deleteSession(sessionId);
    
    // Refresh sessions and leaderboard
    await fetchSessions();
    await fetchLeaderboards();
  };

  // Fetch quizzes
  const fetchQuizzes = async () => {
    setIsLoading(true);
    const fetchedQuizzes = await quizService.fetchQuizzes();
    setQuizzes(fetchedQuizzes);
    setIsLoading(false);
  };

  // Fetch leaderboards
  const fetchLeaderboards = async () => {
    setIsLoading(true);
    
    const data = await leaderboardService.fetchLeaderboards();
    
    setQuizScores(data.quizScores);
    setGameScores(data.gameScores);
    setLeaderboard(data.leaderboard);
    setIsLoading(false);
  };

  // Fetch questions from the database
  const fetchQuestions = async (courseId?: string) => {
    setIsLoading(true);
    const fetchedQuestions = await quizService.fetchQuestions(courseId);
    setQuestions(fetchedQuestions);
    setIsLoading(false);
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
    
    await quizService.saveQuizScore(
      user.id, 
      profile?.name || 'Anonymous',
      profile?.profile_pic,
      quizId,
      quizName,
      score,
      timeTaken,
      sessionId
    );
    
    // Refresh leaderboards
    await fetchLeaderboards();
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
    
    await gameService.saveGameScore(
      user.id,
      profile?.name || 'Anonymous',
      profile?.profile_pic,
      gameId,
      gameName,
      score,
      level,
      sessionId
    );
    
    // Refresh leaderboards
    await fetchLeaderboards();
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

export { type Question, type QuizScore, type GameScore, type LeaderboardUser, type GamingSession };
