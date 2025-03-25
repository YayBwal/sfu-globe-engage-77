
import React, { useState, useEffect } from 'react';
import { Brain, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MemoryMatchProps {
  onGameComplete: (score: number, timeInSeconds: number, level: number) => void;
}

interface MemoryCard {
  value: number;
  flipped: boolean;
  matched: boolean;
}

const MemoryMatch: React.FC<MemoryMatchProps> = ({ onGameComplete }) => {
  const [memoryGrid, setMemoryGrid] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameTime, setGameTime] = useState<number>(0);
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);
  const [level, setLevel] = useState<number>(1);

  // Setup memory game
  const initMemoryGame = () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = values.sort(() => Math.random() - 0.5);
    
    setMemoryGrid(shuffled.map(value => ({
      value,
      flipped: false,
      matched: false
    })));
    
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameTime(0);
    setGameStarted(false);
    setGameCompleted(false);
  };

  // Handle card flip
  const handleCardFlip = (index: number) => {
    // Don't allow flipping if already flipped, matched, or two cards are already flipped
    if (memoryGrid[index].flipped || memoryGrid[index].matched || flippedCards.length >= 2) {
      return;
    }
    
    // Start game timer on first flip
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    // Flip the card
    const newGrid = [...memoryGrid];
    newGrid[index].flipped = true;
    setMemoryGrid(newGrid);
    
    // Add to flipped cards
    const newFlippedCards = [...flippedCards, index];
    setFlippedCards(newFlippedCards);
    
    // If two cards are flipped, check for a match
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      const [first, second] = newFlippedCards;
      
      if (memoryGrid[first].value === memoryGrid[second].value) {
        // Match found
        setTimeout(() => {
          const matchedGrid = [...memoryGrid];
          matchedGrid[first].matched = true;
          matchedGrid[second].matched = true;
          setMemoryGrid(matchedGrid);
          setFlippedCards([]);
          setMatchedPairs(matchedPairs + 1);
          
          // Check if all pairs are matched
          if (matchedPairs + 1 === 8) {
            setGameCompleted(true);
            setGameStarted(false);
            const score = calculateScore(gameTime, moves);
            setTimeout(() => {
              onGameComplete(score, gameTime, level);
            }, 1500);
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          const resetGrid = [...memoryGrid];
          resetGrid[first].flipped = false;
          resetGrid[second].flipped = false;
          setMemoryGrid(resetGrid);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Calculate score based on time and moves
  const calculateScore = (time: number, totalMoves: number): number => {
    // Base score: 1000 points
    // Deduct points for each second and each move
    const timeDeduction = time * 2;
    const moveDeduction = totalMoves * 10;
    
    let finalScore = 1000 - timeDeduction - moveDeduction;
    
    // Minimum score is 100
    return Math.max(100, finalScore);
  };

  // Game timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (gameStarted && !gameCompleted) {
      timer = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStarted, gameCompleted]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Init memory game on component mount
  useEffect(() => {
    initMemoryGame();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-sfu-black text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain size={20} className="text-sfu-red" />
            <h2 className="font-display font-semibold">Memory Match</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs">
              <Clock size={14} />
              <span>{formatTime(gameTime)}</span>
            </div>
            
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs">
              <span>Moves: {moves}</span>
            </div>
          </div>
        </div>
        
        {gameCompleted ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-sfu-red/10 rounded-full flex items-center justify-center text-sfu-red mx-auto mb-6">
              <Trophy size={32} />
            </div>
            
            <h2 className="text-2xl font-display font-bold mb-4">Well Done!</h2>
            
            <div className="grid grid-cols-2 gap-6 max-w-xs mx-auto mb-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">Time</div>
                <div className="text-2xl font-bold">{formatTime(gameTime)}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">Moves</div>
                <div className="text-2xl font-bold">{moves}</div>
              </div>
            </div>
            
            <div className="text-xl font-bold mb-6">
              Score: {calculateScore(gameTime, moves)}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={initMemoryGame}
              >
                Play Again
              </Button>
              
              <Button 
                className="bg-sfu-red text-white hover:bg-sfu-red/90"
                onClick={() => onGameComplete(calculateScore(gameTime, moves), gameTime, level)}
              >
                Return to Games
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {!gameStarted && (
              <div className="mb-4 text-center text-sm text-gray-600">
                Click any card to begin the game. Find all matching pairs to win!
              </div>
            )}
            
            <div className="grid grid-cols-4 gap-3">
              {memoryGrid.map((card, index) => (
                <div 
                  key={index}
                  className={`aspect-square rounded-lg cursor-pointer transition-all duration-300 ${
                    card.flipped || card.matched 
                      ? 'bg-white border-2 border-gray-200' 
                      : 'bg-gradient-to-br from-sfu-red/80 to-sfu-red hover:from-sfu-red hover:to-sfu-red/90'
                  } ${card.matched ? 'opacity-70' : 'opacity-100'}`}
                  onClick={() => handleCardFlip(index)}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    {(card.flipped || card.matched) && (
                      <span className="text-2xl font-bold">{card.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button 
                variant="outline" 
                onClick={initMemoryGame}
              >
                Reset Game
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => onGameComplete(0, 0, 0)}
              >
                Exit Game
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryMatch;
