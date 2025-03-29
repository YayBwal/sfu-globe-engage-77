
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shuffle, Brain, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type CardType = {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const MemoryGame = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
  
  const initializeGame = () => {
    // Create a pair of cards for each emoji
    const initialCards = [...emojis, ...emojis]
      .map((content, index) => ({
        id: index,
        content,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5); // Shuffle the cards
    
    setCards(initialCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameStarted(true);
    setGameCompleted(false);
    setScore(0);
  };

  const handleCardClick = (id: number) => {
    // Ignore if the card is already flipped or matched
    if (cards[id].isFlipped || cards[id].isMatched) return;
    
    // Ignore if two cards are already flipped
    if (flippedCards.length === 2) return;
    
    // Flip the card
    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);
    
    // Add the card to flipped cards
    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);
    
    // If two cards are flipped, check if they match
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      const [firstId, secondId] = newFlippedCards;
      
      if (cards[firstId].content === cards[secondId].content) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstId].isMatched = true;
          matchedCards[secondId].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setMatchedPairs(matchedPairs + 1);
          
          // Calculate score for this match
          const basePoints = 100;
          const timeBonus = Math.max(0, 20 - moves) * 5;
          const matchPoints = basePoints + timeBonus;
          setScore(score + matchPoints);
          
          toast({
            title: "Match Found!",
            description: `+${matchPoints} points added to your score`,
            variant: "default",
          });
          
          // Check if all pairs are matched
          if (matchedPairs + 1 === emojis.length) {
            setGameCompleted(true);
            // Final score calculation
            const finalScore = score + matchPoints + (emojis.length * 50);
            setScore(finalScore);
            toast({
              title: "Game Completed!",
              description: `Final Score: ${finalScore} points`,
              variant: "default",
            });
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const unmatchedCards = [...cards];
          unmatchedCards[firstId].isFlipped = false;
          unmatchedCards[secondId].isFlipped = false;
          setCards(unmatchedCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Initialize the game when component mounts
  useEffect(() => {
    initializeGame();
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Memory Match</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Moves: {moves}
          </div>
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Trophy size={14} />
            <span>Score: {score}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={initializeGame}
            className="flex items-center gap-1"
          >
            <Shuffle size={14} />
            Restart
          </Button>
        </div>
      </div>
      
      {gameCompleted ? (
        <Card className="mb-6">
          <CardContent className="py-6 text-center">
            <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
            <p className="mb-4">You completed the game in {moves} moves</p>
            <p className="text-2xl font-bold text-amber-600 mb-4">Final Score: {score}</p>
            <Button onClick={initializeGame}>Play Again</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              className={`aspect-square rounded-xl cursor-pointer ${
                card.isFlipped || card.isMatched ? 'bg-white' : 'bg-blue-600'
              } shadow-md flex items-center justify-center text-3xl`}
              onClick={() => handleCardClick(card.id)}
              initial={{ rotateY: 0 }}
              animate={{ 
                rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                backgroundColor: card.isMatched ? '#4ade80' : card.isFlipped ? '#ffffff' : '#2563eb'
              }}
              transition={{ duration: 0.3 }}
            >
              {(card.isFlipped || card.isMatched) && (
                <motion.div
                  initial={{ rotateY: -180 }}
                  animate={{ rotateY: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {card.content}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
        <p><strong>How to play:</strong> Click on cards to flip them and find matching pairs. The fewer moves you make, the higher your score!</p>
      </div>
    </div>
  );
};

export default MemoryGame;
