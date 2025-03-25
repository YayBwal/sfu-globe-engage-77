
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSessions } from './gaming/sessionService';
import { useGames } from './gaming/gameService';
import { useQuizzes } from './gaming/quizService';
import { useLeaderboard } from './gaming/leaderboardService';
import { GamingSession, Question, GameScore, QuizScore, LeaderboardUser } from './gaming/types';

interface GamingContextType {
  // Sessions
  sessions: GamingSession[];
  createSession: (name: string, courseId?: string) => Promise<string>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Quiz functionality
  saveQuizScore: (quizId: string, quizName: string, score: number, timeTaken: number, sessionId?: string) => Promise<void>;
  
  // Game functionality
  saveGameScore: (gameId: string, gameName: string, score: number, level: number, sessionId?: string) => Promise<void>;
  
  // Leaderboard data
  topUsers: LeaderboardUser[];
  topQuizScores: QuizScore[];
  topGameScores: GameScore[];
  userStats: { totalScore: number; rank: number; totalGames: number };
  timeFilter: string;
  setTimeFilter: (filter: string) => void;
  
  // Loading states
  isLoading: boolean;
}

export const GamingContext = createContext<GamingContextType | undefined>(undefined);

export const GamingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [userStats, setUserStats] = useState({ totalScore: 0, rank: 0, totalGames: 0 });
  
  // Initialize services
  const { 
    fetchSessions, 
    createSession, 
    deleteSession 
  } = useSessions();
  
  const { saveGameScore } = useGames();
  const { saveQuizScore } = useQuizzes();
  const { 
    fetchTopUsers, 
    fetchTopQuizScores, 
    fetchTopGameScores,
    fetchUserStats
  } = useLeaderboard();
  
  // State variables
  const [sessions, setSessions] = useState<GamingSession[]>([]);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [topQuizScores, setTopQuizScores] = useState<QuizScore[]>([]);
  const [topGameScores, setTopGameScores] = useState<GameScore[]>([]);
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const sessionsData = await fetchSessions();
        setSessions(sessionsData);
        
        // Load leaderboard data
        const usersData = await fetchTopUsers(timeFilter);
        const quizScoresData = await fetchTopQuizScores(timeFilter);
        const gameScoresData = await fetchTopGameScores(timeFilter);
        
        setTopUsers(usersData);
        setTopQuizScores(quizScoresData);
        setTopGameScores(gameScoresData);
        
        // Load user stats if logged in
        if (user) {
          const stats = await fetchUserStats(user.id, timeFilter);
          setUserStats(stats);
        }
      } catch (error) {
        console.error('Error loading gaming data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load gaming data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [fetchSessions, fetchTopUsers, fetchTopQuizScores, fetchTopGameScores, fetchUserStats, user, timeFilter, toast]);
  
  // Context wrapper for creating a session
  const handleCreateSession = async (name: string, courseId?: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create a session',
        variant: 'destructive',
      });
      return '';
    }
    
    try {
      const sessionId = await createSession(name, user.id, courseId);
      
      if (sessionId) {
        // Refresh the sessions list
        const updatedSessions = await fetchSessions();
        setSessions(updatedSessions);
        
        toast({
          title: 'Success',
          description: 'Session created successfully',
        });
        
        return sessionId;
      }
      return '';
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
  
  // Context wrapper for deleting a session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      
      // Update the local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
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
  
  // Context wrapper for saving a quiz score
  const handleSaveQuizScore = async (
    quizId: string, 
    quizName: string, 
    score: number, 
    timeTaken: number,
    sessionId?: string
  ) => {
    if (!user || !profile) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save your score',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await saveQuizScore(
        user.id,
        profile.name,
        profile.profile_pic,
        quizId,
        quizName,
        score,
        timeTaken,
        sessionId
      );
      
      // Refresh leaderboard data
      const quizScoresData = await fetchTopQuizScores(timeFilter);
      setTopQuizScores(quizScoresData);
      
      const usersData = await fetchTopUsers(timeFilter);
      setTopUsers(usersData);
      
      const stats = await fetchUserStats(user.id, timeFilter);
      setUserStats(stats);
    } catch (error) {
      console.error('Error saving quiz score:', error);
    }
  };
  
  // Context wrapper for saving a game score
  const handleSaveGameScore = async (
    gameId: string, 
    gameName: string, 
    score: number, 
    level: number,
    sessionId?: string
  ) => {
    if (!user || !profile) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save your score',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await saveGameScore(
        user.id,
        profile.name,
        profile.profile_pic,
        gameId,
        gameName,
        score,
        level,
        sessionId
      );
      
      // Refresh leaderboard data
      const gameScoresData = await fetchTopGameScores(timeFilter);
      setTopGameScores(gameScoresData);
      
      const usersData = await fetchTopUsers(timeFilter);
      setTopUsers(usersData);
      
      const stats = await fetchUserStats(user.id, timeFilter);
      setUserStats(stats);
    } catch (error) {
      console.error('Error saving game score:', error);
    }
  };
  
  // Update leaderboard data when time filter changes
  useEffect(() => {
    const updateLeaderboardData = async () => {
      try {
        setIsLoading(true);
        
        const usersData = await fetchTopUsers(timeFilter);
        const quizScoresData = await fetchTopQuizScores(timeFilter);
        const gameScoresData = await fetchTopGameScores(timeFilter);
        
        setTopUsers(usersData);
        setTopQuizScores(quizScoresData);
        setTopGameScores(gameScoresData);
        
        if (user) {
          const stats = await fetchUserStats(user.id, timeFilter);
          setUserStats(stats);
        }
      } catch (error) {
        console.error('Error updating leaderboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    updateLeaderboardData();
  }, [timeFilter, fetchTopUsers, fetchTopQuizScores, fetchTopGameScores, fetchUserStats, user]);
  
  const contextValue: GamingContextType = {
    // Sessions
    sessions,
    createSession: handleCreateSession,
    deleteSession: handleDeleteSession,
    
    // Quiz functionality
    saveQuizScore: handleSaveQuizScore,
    
    // Game functionality
    saveGameScore: handleSaveGameScore,
    
    // Leaderboard data
    topUsers,
    topQuizScores,
    topGameScores,
    userStats,
    timeFilter,
    setTimeFilter,
    
    // Loading state
    isLoading
  };
  
  return (
    <GamingContext.Provider value={contextValue}>
      {children}
    </GamingContext.Provider>
  );
};

export const useGaming = () => {
  const context = useContext(GamingContext);
  if (context === undefined) {
    throw new Error('useGaming must be used within a GamingProvider');
  }
  return context;
};
