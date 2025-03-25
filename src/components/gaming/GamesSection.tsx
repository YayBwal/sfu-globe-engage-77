
import React, { useState, useEffect } from 'react';
import { Clock, Zap, Brain, Gamepad, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGaming } from '@/contexts/GamingContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MemoryMatch from '@/components/gaming/games/MemoryMatch';

interface GamesSectionProps {
  courseId?: string;
}

const GamesSection: React.FC<GamesSectionProps> = ({ courseId }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { saveGameScore, createSession, deleteSession, fetchSessions } = useGaming();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch sessions when component mounts
    fetchSessions();
  }, [fetchSessions]);

  // Start a new game session
  const handleStartGame = async (gameType: string) => {
    const sessionName = courseId 
      ? `Game - ${gameType} - ${courseId.toUpperCase()}` 
      : `Game - ${gameType}`;
    
    const sessionId = await createSession(sessionName, courseId);
    if (sessionId) {
      setCurrentSessionId(sessionId);
      setActiveGame(gameType);
    }
  };

  // Handle Memory Match game score
  const handleMemoryMatchComplete = (score: number, memorytime: number, level: number) => {
    // Only save scores for logged in users
    if (user) {
      saveGameScore('memory-match', 'Memory Match', score, level, currentSessionId);
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
    setCurrentSessionId(undefined);
  };

  // Handle game deletion
  const handleDeleteGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setShowDeleteDialog(true);
  };
  
  const confirmDeleteGame = async () => {
    if (selectedGameId) {
      await deleteSession(selectedGameId);
      setShowDeleteDialog(false);
      setSelectedGameId(null);
    }
  };

  // Render game selection screen
  const renderGamesGrid = () => {
    return (
      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            {courseId ? `${courseId.toUpperCase()} Mini Games` : "Mini Games"}
          </h2>
          <p className="text-gray-600">
            Train your brain with these fun mini-games designed to improve your cognitive skills and earn points.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Memory Match Game Card */}
          <GameCard 
            title="Memory Match"
            description="Find matching pairs of cards in the shortest time with the fewest moves."
            icon={<Brain className="w-12 h-12 text-white" />}
            bgColor="bg-gradient-to-r from-purple-500 to-indigo-600"
            time="2-5 minutes"
            onClick={() => handleStartGame('memory-match')}
          />
          
          {/* Reaction Test Game Card */}
          <GameCard 
            title="Reaction Test"
            description="Test your reaction speed by clicking targets as quickly as possible."
            icon={<Zap className="w-12 h-12 text-white" />}
            bgColor="bg-gradient-to-r from-orange-500 to-red-500"
            time="1-2 minutes"
            onClick={() => handleStartGame('reaction-test')}
          />
          
          {/* Coming Soon Game Card */}
          <GameCard 
            title="Word Scramble"
            description="Coming Soon! Unscramble words against the clock to test your vocabulary."
            icon={<Gamepad className="w-12 h-12 text-white" />}
            bgColor="bg-gradient-to-r from-emerald-500 to-teal-600"
            time="Coming Soon"
            disabled
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      {activeGame === null ? (
        renderGamesGrid()
      ) : (
        <div>
          <Button 
            variant="outline" 
            className="mb-4"
            onClick={() => {
              setActiveGame(null);
              setCurrentSessionId(undefined);
            }}
          >
            ← Back to Games
          </Button>
          
          {activeGame === 'memory-match' && (
            <MemoryMatch onGameComplete={handleMemoryMatchComplete} />
          )}
          
          {activeGame === 'reaction-test' && (
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold mb-4">Reaction Test</h2>
              <p className="mb-8">Coming Soon! This game is under development.</p>
              <Button onClick={() => setActiveGame(null)}>Back to Games</Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Game Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Game</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete this game session? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteGame}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Game Card Component
interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  time: string;
  onClick?: () => void;
  disabled?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ 
  title, 
  description, 
  icon, 
  bgColor, 
  time, 
  onClick,
  disabled = false
}) => {
  return (
    <Card className="overflow-hidden">
      <div className={`${bgColor} p-8 flex justify-center items-center`}>
        {icon}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <Clock size={16} />
            <span>{time}</span>
          </div>
          <Button 
            onClick={onClick} 
            disabled={disabled}
            className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Play Now
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GamesSection;
