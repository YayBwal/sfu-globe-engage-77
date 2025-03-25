
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type QuizScore = {
  id: string;
  userId: string;
  userName: string;
  quizId: string;
  quizName: string;
  score: number;
  timeTaken: number;
  createdAt: string;
};

type GameScore = {
  id: string;
  userId: string;
  userName: string;
  gameId: string;
  gameName: string;
  score: number;
  level: number;
  createdAt: string;
};

type LeaderboardEntry = {
  userId: string;
  userName: string;
  profilePic?: string;
  totalScore: number;
  quizCount: number;
  gameCount: number;
  lastPlayed: string;
};

type GamingContextType = {
  quizScores: QuizScore[];
  gameScores: GameScore[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  addQuizScore: (score: Omit<QuizScore, 'id' | 'createdAt'>) => Promise<void>;
  addGameScore: (score: Omit<GameScore, 'id' | 'createdAt'>) => Promise<void>;
  refreshScores: () => Promise<void>;
};

const GamingContext = createContext<GamingContextType | undefined>(undefined);

export const useGaming = () => {
  const context = useContext(GamingContext);
  if (context === undefined) {
    throw new Error('useGaming must be used within a GamingProvider');
  }
  return context;
};

export const GamingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch all scores
  const fetchScores = async () => {
    setIsLoading(true);
    try {
      // Fetch quiz scores
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_scores')
        .select('*')
        .order('created_at', { ascending: false });

      if (quizError) throw quizError;
      
      // Fetch game scores
      const { data: gameData, error: gameError } = await supabase
        .from('game_scores')
        .select('*')
        .order('created_at', { ascending: false });

      if (gameError) throw gameError;
      
      // Process data for leaderboard
      const combinedScores = [...(quizData || []), ...(gameData || [])];
      
      // Build leaderboard
      const leaderboardMap = new Map<string, LeaderboardEntry>();
      
      combinedScores.forEach(score => {
        const userId = score.user_id;
        const isQuiz = 'quiz_id' in score;
        
        if (!leaderboardMap.has(userId)) {
          leaderboardMap.set(userId, {
            userId,
            userName: score.user_name,
            profilePic: score.profile_pic,
            totalScore: 0,
            quizCount: 0,
            gameCount: 0,
            lastPlayed: score.created_at
          });
        }
        
        const entry = leaderboardMap.get(userId)!;
        
        if (isQuiz) {
          entry.quizCount += 1;
        } else {
          entry.gameCount += 1;
        }
        
        entry.totalScore += score.score;
        
        // Update last played if this score is more recent
        if (new Date(score.created_at) > new Date(entry.lastPlayed)) {
          entry.lastPlayed = score.created_at;
        }
      });
      
      // Convert map to array and sort by total score
      const leaderboardArray = Array.from(leaderboardMap.values())
        .sort((a, b) => b.totalScore - a.totalScore);
      
      // Update state with the fetched data
      setQuizScores(quizData || []);
      setGameScores(gameData || []);
      setLeaderboard(leaderboardArray);
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new quiz score
  const addQuizScore = async (score: Omit<QuizScore, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('quiz_scores')
        .insert([
          {
            user_id: score.userId,
            user_name: score.userName,
            quiz_id: score.quizId,
            quiz_name: score.quizName,
            score: score.score,
            time_taken: score.timeTaken
          }
        ])
        .select();

      if (error) throw error;
      
      // Refresh scores after adding a new one
      await fetchScores();
    } catch (error) {
      console.error('Error adding quiz score:', error);
    }
  };

  // Add a new game score
  const addGameScore = async (score: Omit<GameScore, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .insert([
          {
            user_id: score.userId,
            user_name: score.userName,
            game_id: score.gameId,
            game_name: score.gameName,
            score: score.score,
            level: score.level
          }
        ])
        .select();

      if (error) throw error;
      
      // Refresh scores after adding a new one
      await fetchScores();
    } catch (error) {
      console.error('Error adding game score:', error);
    }
  };

  // Fetch scores on mount
  useEffect(() => {
    fetchScores();
    
    // Setup realtime subscription for score updates
    const quizChannel = supabase
      .channel('public:quiz_scores')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'quiz_scores' 
      }, () => {
        fetchScores();
      })
      .subscribe();
      
    const gameChannel = supabase
      .channel('public:game_scores')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'game_scores' 
      }, () => {
        fetchScores();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(quizChannel);
      supabase.removeChannel(gameChannel);
    };
  }, []);

  const value = {
    quizScores,
    gameScores,
    leaderboard,
    isLoading,
    addQuizScore,
    addGameScore,
    refreshScores: fetchScores
  };

  return (
    <GamingContext.Provider value={value}>
      {children}
    </GamingContext.Provider>
  );
};
