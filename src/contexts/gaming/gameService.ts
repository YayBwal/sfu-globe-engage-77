
import { supabase } from '@/integrations/supabase/client';

// Save game score
export const saveGameScore = async (
  userId: string,
  gameId: string,
  gameName: string,
  score: number,
  level: number,
  sessionId?: string
): Promise<void> => {
  try {
    const insertData = {
      user_id: userId,
      game_id: gameId,
      game_name: gameName,
      score: score,
      level: level,
      session_id: sessionId
    };
    
    const { error } = await supabase
      .from('game_scores')
      .insert(insertData);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving game score:', error);
    throw error;
  }
};
