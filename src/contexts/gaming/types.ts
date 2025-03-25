
import { User } from '@supabase/supabase-js';

export type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
};

export type QuizScore = {
  id: string;
  userId: string;
  userName: string;
  quizId: string;
  quizName: string;
  score: number;
  timeTaken: number;
  createdAt: string;
  profilePic?: string | null;
};

export type GameScore = {
  id: string;
  userId: string;
  userName: string;
  gameId: string;
  gameName: string;
  score: number;
  level: number;
  createdAt: string;
  profilePic?: string | null;
};

export type LeaderboardUser = {
  userId: string;
  userName: string;
  totalScore: number;
  quizCount: number;
  gameCount?: number;
  profilePic?: string | null;
};

export type GamingSession = {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  courseId?: string;
};

export type GamingContextType = {
  // State
  isLoading: boolean;
  questions: Question[];
  leaderboard: LeaderboardUser[];
  topQuizScores: QuizScore[];
  topGameScores: GameScore[];
  userStats: {
    totalScore: number;
    quizCount: number;
    avgScore: number;
  };
  
  // Quiz operations
  fetchQuestions: (courseId?: string) => Promise<void>;
  saveQuizScore: (quizId: string, quizName: string, score: number, time: number, sessionId?: string) => Promise<void>;
  
  // Game operations
  saveGameScore: (gameId: string, gameName: string, score: number, level: number, sessionId?: string) => Promise<void>;
  
  // Leaderboard operations
  fetchLeaderboards: () => Promise<void>;
  
  // Session operations
  createSession: (name: string, courseId?: string) => Promise<string | undefined>;
  deleteSession: (sessionId: string) => Promise<void>;
  fetchSessions: () => Promise<void>;
};
