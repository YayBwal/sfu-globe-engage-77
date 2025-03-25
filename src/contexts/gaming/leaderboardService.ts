
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardUser, QuizScore, GameScore } from './types';

// Fetch top users by total score
export const fetchTopUsers = async (): Promise<LeaderboardUser[]> => {
  try {
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_scores')
      .select('user_id, user_name, profile_pic, score')
      .order('score', { ascending: false });

    if (quizError) {
      throw quizError;
    }

    // Group by user and calculate total score
    const userScores: Record<string, LeaderboardUser> = {};
    
    quizData?.forEach(score => {
      if (!userScores[score.user_id]) {
        userScores[score.user_id] = {
          userId: score.user_id,
          userName: score.user_name,
          totalScore: 0,
          quizCount: 0,
          profilePic: score.profile_pic
        };
      }
      
      userScores[score.user_id].totalScore += score.score;
      userScores[score.user_id].quizCount += 1;
    });
    
    // Convert to array and sort by total score
    return Object.values(userScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
      
  } catch (error) {
    console.error('Error fetching top users:', error);
    return [];
  }
};

// Fetch top quiz scores
export const fetchTopQuizScores = async (): Promise<QuizScore[]> => {
  try {
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return data.map(score => ({
      id: score.id,
      userId: score.user_id,
      userName: score.user_name,
      quizId: score.quiz_id,
      quizName: score.quiz_name,
      score: score.score,
      timeTaken: score.time_taken,
      createdAt: score.created_at,
      profilePic: score.profile_pic
    }));
    
  } catch (error) {
    console.error('Error fetching top quiz scores:', error);
    return [];
  }
};

// Fetch top game scores
export const fetchTopGameScores = async (): Promise<GameScore[]> => {
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return data.map(score => ({
      id: score.id,
      userId: score.user_id,
      userName: score.user_name,
      gameId: score.game_id,
      gameName: score.game_name,
      score: score.score,
      level: score.level,
      createdAt: score.created_at,
      profilePic: score.profile_pic
    }));
    
  } catch (error) {
    console.error('Error fetching top game scores:', error);
    return [];
  }
};

// Fetch all leaderboard data (combined function)
export const fetchLeaderboards = async () => {
  try {
    const leaderboard = await fetchTopUsers();
    const quizScores = await fetchTopQuizScores();
    const gameScores = await fetchTopGameScores();
    
    return { leaderboard, quizScores, gameScores };
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return { leaderboard: [], quizScores: [], gameScores: [] };
  }
};

// Fetch user stats
export const fetchUserStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('score')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        totalScore: 0,
        quizCount: 0,
        avgScore: 0
      };
    }
    
    const totalScore = data.reduce((sum, item) => sum + item.score, 0);
    const quizCount = data.length;
    const avgScore = quizCount > 0 ? Math.round(totalScore / quizCount) : 0;
    
    return {
      totalScore,
      quizCount,
      avgScore
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalScore: 0,
      quizCount: 0,
      avgScore: 0
    };
  }
};
