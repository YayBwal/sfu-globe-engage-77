
// Types for our gaming context
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

export interface GamingContextType {
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
