
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Question, QuizScore, GameScore, LeaderboardUser, GamingContextType } from './gaming/types';
import { fetchQuestions, saveQuizScore } from './gaming/quizService';
import { saveGameScore } from './gaming/gameService';
import { fetchLeaderboards, fetchTopUsers, fetchTopQuizScores, fetchTopGameScores, fetchUserStats } from './gaming/leaderboardService';
import { createSession, deleteSession, fetchSessions } from './gaming/sessionService';

// Create the Gaming Context with a default empty value
const GamingContext = createContext<GamingContextType | undefined>(undefined);

// Provider component
export const GamingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [topQuizScores, setTopQuizScores] = useState<QuizScore[]>([]);
  const [topGameScores, setTopGameScores] = useState<GameScore[]>([]);
  const [userStats, setUserStats] = useState({
    totalScore: 0,
    quizCount: 0,
    avgScore: 0
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch data
        const leaderboardData = await fetchLeaderboards();
        
        // Update state
        setLeaderboard(leaderboardData.leaderboard);
        setTopQuizScores(leaderboardData.quizScores);
        setTopGameScores(leaderboardData.gameScores);
        
        // If user is logged in, fetch their stats
        if (user) {
          const stats = await fetchUserStats(user.id);
          setUserStats(stats);
        }
      } catch (error) {
        console.error('Error loading gaming data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Fetch questions function
  const handleFetchQuestions = async (courseId?: string) => {
    setIsLoading(true);
    try {
      const fetchedQuestions = await fetchQuestions(courseId);
      setQuestions(fetchedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving quiz score
  const handleSaveQuizScore = async (
    quizId: string, 
    quizName: string, 
    score: number, 
    time: number,
    sessionId?: string
  ) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await saveQuizScore(user.id, quizId, quizName, score, time, sessionId);
      
      // Refresh leaderboard data
      const leaderboardData = await fetchLeaderboards();
      setLeaderboard(leaderboardData.leaderboard);
      setTopQuizScores(leaderboardData.quizScores);
      
      // Update user stats
      const stats = await fetchUserStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Error saving quiz score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving game score
  const handleSaveGameScore = async (
    gameId: string, 
    gameName: string, 
    score: number, 
    level: number,
    sessionId?: string
  ) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await saveGameScore(user.id, gameId, gameName, score, level, sessionId);
      
      // Refresh leaderboard data
      const leaderboardData = await fetchLeaderboards();
      setLeaderboard(leaderboardData.leaderboard);
      setTopGameScores(leaderboardData.gameScores);
      
      // Update user stats
      const stats = await fetchUserStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Error saving game score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle fetching leaderboards
  const handleFetchLeaderboards = async () => {
    setIsLoading(true);
    try {
      const leaderboardData = await fetchLeaderboards();
      setLeaderboard(leaderboardData.leaderboard);
      setTopQuizScores(leaderboardData.quizScores);
      setTopGameScores(leaderboardData.gameScores);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new gaming session
  const handleCreateSession = async (name: string, courseId?: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const sessionId = await createSession(user.id, name, courseId);
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a gaming session
  const handleDeleteSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      await deleteSession(sessionId);
      
      // Refresh data
      await handleFetchLeaderboards();
    } catch (error) {
      console.error('Error deleting session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sessions
  const handleFetchSessions = async () => {
    setIsLoading(true);
    try {
      await fetchSessions();
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create context value
  const value: GamingContextType = {
    isLoading,
    questions,
    leaderboard,
    topQuizScores,
    topGameScores,
    userStats,
    fetchQuestions: handleFetchQuestions,
    saveQuizScore: handleSaveQuizScore,
    saveGameScore: handleSaveGameScore,
    fetchLeaderboards: handleFetchLeaderboards,
    createSession: handleCreateSession,
    deleteSession: handleDeleteSession,
    fetchSessions: handleFetchSessions
  };

  return (
    <GamingContext.Provider value={value}>
      {children}
    </GamingContext.Provider>
  );
};

// Custom hook for using the Gaming context
export const useGaming = () => {
  const context = useContext(GamingContext);
  if (context === undefined) {
    throw new Error('useGaming must be used within a GamingProvider');
  }
  return context;
};

// Export types
export type { Question, QuizScore, GameScore, LeaderboardUser, GamingContextType };
