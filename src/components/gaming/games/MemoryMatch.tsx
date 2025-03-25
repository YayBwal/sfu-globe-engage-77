
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Timer, Trophy } from 'lucide-react';

interface Card {
  id: number;
  value: number;
  flipped: boolean;
  matched: boolean;
}

interface MemoryMatchProps {
  onGameComplete: (score: number, time: number, level: number) => void;
}

const MemoryMatch: React.FC<MemoryMatchProps> = ({ onGameComplete }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [difficulty, setDifficulty] = useState<number>(4); // 4x4 grid by default

  // Initialize the game
  const initializeGame = (gridSize: number) => {
    const totalPairs = (gridSize * gridSize) / 2;
    const initialCards: Card[] = [];
    
    // Create pairs of cards
    for (let i = 0; i < totalPairs; i++) {
      const card1: Card = { id: i * 2, value: i, flipped: false, matched: false };
      const card2: Card = { id: i * 2 + 1, value: i, flipped: false, matched: false };
      initialCards.push(card1, card2);
    }
    
    // Shuffle the cards
    const shuffledCards = [...initialCards].sort(() => Math.random() - 0.5);
    
    setCards(shuffledCards);
    setFlippedIndices([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameStarted(true);
    setGameComplete(false);
    
    const now = Date.now();
    setStartTime(now);
    
    // Start the timer
    if (timer) clearInterval(timer);
    const newTimer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - now) / 1000));
    }, 1000);
    setTimer(newTimer);
  };

  // Handle card click
  const handleCardClick = (index: number) => {
    // Don't allow clicking if already flipped or matched
    if (cards[index].flipped || cards[index].matched) return;
    
    // Don't allow more than 2 cards flipped at once
    if (flippedIndices.length === 2) return;
    
    // Flip the card
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    
    // Add to flipped indices
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);
    
    // If 2 cards are flipped, check for a match
    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [firstIndex, secondIndex] = newFlipped;
      
      if (newCards[firstIndex].value === newCards[secondIndex].value) {
        // It's a match
        newCards[firstIndex].matched = true;
        newCards[secondIndex].matched = true;
        setCards(newCards);
        setMatchedPairs(matchedPairs + 1);
        setFlippedIndices([]);
        
        // Check if game is complete
        if (matchedPairs + 1 === cards.length / 2) {
          const now = Date.now();
          setEndTime(now);
          setGameComplete(true);
          if (timer) clearInterval(timer);
          
          // Calculate final time and score
          const finalTime = Math.floor((now - startTime) / 1000);
          const level = difficulty;
          const baseScore = 1000;
          const timeDeduction = finalTime * 2;
          const moveDeduction = moves * 5;
          const levelBonus = level * 100;
          const finalScore = Math.max(baseScore - timeDeduction - moveDeduction + levelBonus, 100);
          
          // Delay to allow the player to see the last match
          setTimeout(() => {
            onGameComplete(finalScore, finalTime, level);
          }, 1000);
        }
      } else {
        // Not a match, flip back after delay
        setTimeout(() => {
          newCards[firstIndex].flipped = false;
          newCards[secondIndex].flipped = false;
          setCards(newCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  return (
    <div className="max-w-4xl mx-auto">
      {!gameStarted ? (
        <div className="text-center p-8">
          <div className="mb-8">
            <Brain className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold mb-4">Memory Match</h2>
            <p className="text-gray-600 mb-6">
              Test your memory by matching pairs of cards. The faster you finish with fewer moves, the higher your score!
            </p>
          </div>
          
          <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold mb-3">Select Difficulty</h3>
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant={difficulty === 3 ? "default" : "outline"} 
                onClick={() => setDifficulty(3)}
              >
                Easy (3x3)
              </Button>
              <Button 
                variant={difficulty === 4 ? "default" : "outline"} 
                onClick={() => setDifficulty(4)}
              >
                Medium (4x4)
              </Button>
              <Button 
                variant={difficulty === 5 ? "default" : "outline"} 
                onClick={() => setDifficulty(5)}
              >
                Hard (5x5)
              </Button>
            </div>
          </div>
          
          <Button size="lg" onClick={() => initializeGame(difficulty)}>
            Start Game
          </Button>
        </div>
      ) : (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Timer className="text-primary" />
                <span className="font-mono text-lg">{elapsedTime}s</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="text-primary" />
                <span className="font-mono text-lg">Moves: {moves}</span>
              </div>
            </div>
            <Button variant="outline" onClick={() => setGameStarted(false)}>
              Restart
            </Button>
          </div>
          
          <div 
            className="grid gap-4 bg-white p-4 rounded-lg shadow-md"
            style={{ 
              gridTemplateColumns: `repeat(${difficulty}, 1fr)`,
            }}
          >
            {cards.map((card, index) => (
              <div 
                key={card.id}
                className={`
                  aspect-square transition-all duration-300 transform cursor-pointer flex items-center justify-center rounded-lg text-3xl font-bold shadow
                  ${card.flipped ? 'bg-white border-2 border-primary' : 'bg-primary'}
                  ${card.matched ? 'bg-green-100 border-green-500 text-green-500' : ''}
                `}
                onClick={() => handleCardClick(index)}
              >
                {card.flipped || card.matched ? (
                  <span className="text-2xl">
                    {String.fromCodePoint(128512 + card.value)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryMatch;
