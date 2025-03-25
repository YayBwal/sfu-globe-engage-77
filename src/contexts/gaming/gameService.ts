
import { supabase } from '@/integrations/supabase/client';
import { GameScore } from './types';
import { useToast } from '@/hooks/use-toast';

export const useGames = () => {
  const { toast } = useToast();

  // Save game score
  const saveGameScore = async (
    userId: string,
    userName: string,
    profilePic: string | undefined,
    gameId: string, 
    gameName: string, 
    score: number, 
    level: number, 
    sessionId?: string
  ): Promise<void> => {
    try {
      const { error } = await supabase.from('game_scores').insert({
        user_id: userId,
        user_name: userName,
        profile_pic: profilePic,
        game_id: gameId,
        game_name: gameName,
        score,
        level
        // session_id field doesn't exist yet, so we don't include it
      });
      
      if (error) throw error;
      
      toast({
        title: 'Score saved',
        description: `You scored ${score} points at level ${level}!`,
      });
    } catch (error) {
      console.error('Error saving game score:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your score',
        variant: 'destructive',
      });
    }
  };

  return {
    saveGameScore
  };
};
