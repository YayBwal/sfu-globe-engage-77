export interface GamingSession {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  courseId?: string;
}

// Add the missing types that were causing build errors
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
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

export interface LeaderboardUser {
  id: string;
  name: string;
  profilePic?: string;
  totalScore: number;
  quizCount: number;
  gameCount: number;
  rank: number;
}
