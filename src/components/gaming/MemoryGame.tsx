import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shuffle, Timer, Trophy, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import confetti from 'canvas-confetti';

// Define card types
interface MemoryCard {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

// Game difficulty levels
const DIFFICULTY_LEVELS = {
  easy: { pairs: 6, timeLimit: 60 },
  medium: { pairs: 8, timeLimit: 90 },
  hard: { pairs: 12, timeLimit: 120 }
};

type Difficulty = 'easy' | 'medium' | 'hard';

const MemoryGame: React.FC = () => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState<number>(0);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Emojis for cards
  const emojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗'
  ];
  
  // Initialize game
  const initializeGame = useCallback(() => {
    const { pairs } = DIFFICULTY_LEVELS[difficulty];
    const selectedEmojis = emojis.slice(0, pairs);
    
    // Create pairs of cards
    const newCards: MemoryCard[] = [...selectedEmojis, ...selectedEmojis]
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false
      }))
      .sort(() => Math.random() - 0.5); // Shuffle cards
    
    setCards(newCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameOver(false);
    setTimeLeft(DIFFICULTY_LEVELS[difficulty].timeLimit);
    setScore(0);
  }, [difficulty]);
  
  // Start game
  const startGame = () => {
    initializeGame();
    setGameStarted(true);
  };
  
  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
  };
  
  // Save game result to database
  const saveGameResult = async (finalScore: number) => {
    if (!user) return;
    
    try {
      await supabase.from('game_results').insert({
        user_id: user.id,
        game_type: 'memory',
        score: finalScore,
        completed_at: new Date().toISOString(),
        metadata: {
          difficulty,
          moves,
          timeLeft,
          matchedPairs
        }
      });
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };
  
  // Handle card click
  const handleCardClick = (id: number) => {
    // Prevent clicking if game is over or card is already flipped/matched
    if (
      gameOver || 
      flippedCards.length >= 2 || 
      flippedCards.includes(id) || 
      cards[id].matched
    ) {
      return;
    }
    
    // Flip the card
    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);
    
    // Add to flipped cards
    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);
    
    // Check for match if two cards are flipped
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      const [firstId, secondId] = newFlippedCards;
      if (cards[firstId].emoji === cards[secondId].emoji) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstId].matched = true;
          matchedCards[secondId].matched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setMatchedPairs(matchedPairs + 1);
          
          // Calculate points for this match
          const timeBonus = Math.floor(timeLeft / 5);
          const matchPoints = 100 + timeBonus;
          setScore(prevScore => prevScore + matchPoints);
          
          // Show toast for match
          toast({
            title: "Match found!",
            description: `+${matchPoints} points`,
            variant: "default"
          });
          
          // Check if all pairs are matched
          if (matchedPairs + 1 === DIFFICULTY_LEVELS[difficulty].pairs) {
            // Game completed
            const finalScore = score + matchPoints + (timeLeft * 10);
            setScore(finalScore);
            setGameOver(true);
            saveGameResult(finalScore);
            
            // Celebrate with confetti
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
            
            toast({
              title: "Congratulations!",
              description: `You completed the game with ${moves + 1} moves and ${finalScore} points!`,
              variant: "default"
            });
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const unflippedCards = [...cards];
          unflippedCards[firstId].flipped = false;
          unflippedCards[secondId].flipped = false;
          setCards(unflippedCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };
  
  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameStarted && !gameOver && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setGameOver(true);
            saveGameResult(score);
            
            toast({
              title: "Time's up!",
              description: `Game over! You matched ${matchedPairs} pairs with ${moves} moves.`,
              variant: "destructive"
            });
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStarted, gameOver, timeLeft, matchedPairs, moves, score, toast]);
  
  // Initialize game on mount or difficulty change
  useEffect(() => {
    if (!gameStarted) {
      initializeGame();
    }
  }, [difficulty, gameStarted, initializeGame]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-center mb-4">Memory Game</h2>
        
        {!gameStarted ? (
          <div className="space-y-6">
            <p className="text-center text-gray-600">
              Flip cards and find matching pairs. The faster you match, the higher your score!
            </p>
            
            <div className="space-y-2">
              <h3 className="font-medium">Select Difficulty:</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setDifficulty('easy')}
                  variant={difficulty === 'easy' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  Easy
                </Button>
                <Button 
                  onClick={() => setDifficulty('medium')}
                  variant={difficulty === 'medium' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  Medium
                </Button>
                <Button 
                  onClick={() => setDifficulty('hard')}
                  variant={difficulty === 'hard' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  Hard
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={startGame}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Start Game
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-blue-600" />
                <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="font-mono text-lg">{score}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                Moves: {moves}
              </div>
            </div>
            
            {gameOver && (
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h3 className="font-bold text-lg mb-2">
                  {matchedPairs === DIFFICULTY_LEVELS[difficulty].pairs 
                    ? "Congratulations!" 
                    : "Game Over!"}
                </h3>
                <p className="mb-2">
                  {matchedPairs === DIFFICULTY_LEVELS[difficulty].pairs 
                    ? `You matched all pairs with ${moves} moves!` 
                    : `You matched ${matchedPairs} out of ${DIFFICULTY_LEVELS[difficulty].pairs} pairs.`}
                </p>
                <p className="font-bold">Final Score: {score}</p>
                <Button 
                  onClick={resetGame}
                  className="mt-3"
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
              </div>
            )}
            
            {!gameOver && (
              <div className={`grid grid-cols-${difficulty === 'hard' ? '4' : '3'} gap-2`}>
                {cards.map(card => (
                  <motion.div
                    key={card.id}
                    className={`aspect-square cursor-pointer rounded-lg overflow-hidden`}
                    onClick={() => handleCardClick(card.id)}
                    animate={{ rotateY: card.flipped ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`w-full h-full flex items-center justify-center text-2xl
                      ${card.flipped 
                        ? 'bg-white border-2 border-blue-300' 
                        : 'bg-blue-600'}`}
                    >
                      {card.flipped && card.emoji}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {!gameOver && (
              <Button 
                onClick={resetGame}
                variant="outline"
                className="w-full"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Reset Game
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryGame;
