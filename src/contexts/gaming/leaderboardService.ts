
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardUser, QuizScore, GameScore } from './types';
import { useToast } from '@/hooks/use-toast';

export const useLeaderboard = () => {
  const { toast } = useToast();

  // Fetch leaderboard data including both quiz and game scores
  const fetchLeaderboards = async (): Promise<{
    leaderboard: LeaderboardUser[];
    quizScores: QuizScore[];
    gameScores: GameScore[];
  }> => {
    try {
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
        sessionId: undefined // session_id doesn't exist yet
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
        sessionId: undefined // session_id doesn't exist yet
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
      
      return {
        quizScores: mappedQuizScores,
        gameScores: mappedGameScores,
        leaderboard: leaderboardArray
      };
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leaderboard data',
        variant: 'destructive',
      });
      return {
        quizScores: [],
        gameScores: [],
        leaderboard: []
      };
    }
  };

  return {
    fetchLeaderboards
  };
};
