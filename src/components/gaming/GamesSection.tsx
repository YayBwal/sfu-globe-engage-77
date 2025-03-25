import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGaming } from '@/contexts/GamingContext';
import { useToast } from '@/hooks/use-toast';
import MemoryMatch from './games/MemoryMatch';

const GamesSection: React.FC = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const { user } = useAuth();
  const { saveGameScore } = useGaming();
  const { toast } = useToast();

  // Handle Memory Match game score
  const handleMemoryMatchComplete = (score: number, memorytime: number, level: number) => {
    // Only save scores for logged in users
    if (user) {
      saveGameScore('memory-match', 'Memory Match', score, level);
      toast({
        title: 'Game Complete!',
        description: `You scored ${score} points in ${memorytime} seconds!`,
      });
    } else {
      toast({
        title: 'Login Required',
        description: 'Create an account to save your scores!',
        variant: 'destructive',
      });
    }
    setActiveGame(null);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Games</h2>
      
      {activeGame === null && (
        <div>
          <p className="mb-4">Select a game to play:</p>
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setActiveGame('memory-match')}
          >
            Play Memory Match
          </button>
        </div>
      )}
      
      {activeGame === 'memory-match' && (
        <MemoryMatch onGameComplete={handleMemoryMatchComplete} />
      )}
    </div>
  );
};

export default GamesSection;
