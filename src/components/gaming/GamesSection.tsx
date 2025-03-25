
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad, Brain, Zap, History, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useGaming } from '@/contexts/GamingContext';

type GameState = 'list' | 'memory' | 'reaction' | 'word';
type MemoryCard = { value: number, flipped: boolean, matched: boolean };

const GamesSection: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('list');
  const [memoryGrid, setMemoryGrid] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameTime, setGameTime] = useState<number>(0);
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);
  const [reactionState, setReactionState] = useState<'waiting' | 'ready' | 'clicked' | 'results'>('waiting');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [reactionTimeoutId, setReactionTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [reactionTimestamp, setReactionTimestamp] = useState<number | null>(null);
  const { user } = useAuth();
  const { addGameScore } = useGaming();

  // Games data
  const gamesData = [
    {
      id: "memory",
      name: "Memory Match",
      description: "Test your memory by matching pairs of cards.",
      icon: <Brain size={24} />,
      difficulty: "Easy",
      timeToComplete: "2-5 min"
    },
    {
      id: "reaction",
      name: "Reaction Time",
      description: "Click as quickly as possible when the color changes.",
      icon: <Zap size={24} />,
      difficulty: "Medium",
      timeToComplete: "1-2 min"
    },
    {
      id: "word",
      name: "Word Scramble",
      description: "Unscramble academic terms within the time limit.",
      icon: <History size={24} />,
      difficulty: "Hard",
      timeToComplete: "3-7 min"
    }
  ];

  // Start a specific game
  const startGame = (gameId: string) => {
    if (gameId === 'memory') {
      initMemoryGame();
      setGameState('memory');
    } else if (gameId === 'reaction') {
      startReactionGame();
      setGameState('reaction');
    } else if (gameId === 'word') {
      setGameState('word');
    }
  };

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ----------------
  // Memory Game Logic
  // ----------------
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

  // Handle card flip in memory game
  const handleCardFlip = (index: number) => {
    // Don't allow flipping if already flipped, matched, or two cards are already flipped
    if (memoryGrid[index].flipped || memoryGrid[index].matched || flippedCards.length >= 2) {
      return;
    }
    
    // Start game timer on first flip
    if (!gameStarted) {
      setGameStarted(true);
      const startTime = Date.now();
      
      const timer = setInterval(() => {
        setGameTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      
      return () => clearInterval(timer);
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
            
            // Save score if user is logged in
            if (user) {
              const finalTime = gameTime + 1; // Add 1 second for the delay
              const score = Math.max(1000 - (moves * 10) - (finalTime * 5), 100);
              
              addGameScore({
                userId: user.id,
                userName: user.email || 'Anonymous',
                gameId: 'memory',
                gameName: 'Memory Match',
                score,
                level: 1
              });
            }
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

  // ----------------
  // Reaction Game Logic
  // ----------------
  const startReactionGame = () => {
    setReactionState('waiting');
    setReactionTime(null);
    
    // Random delay between 2-6 seconds
    const delay = Math.floor(Math.random() * 4000) + 2000;
    
    const timeoutId = setTimeout(() => {
      setReactionState('ready');
      setReactionTimestamp(Date.now());
    }, delay);
    
    setReactionTimeoutId(timeoutId);
  };
  
  const handleReactionClick = () => {
    if (reactionState === 'waiting') {
      // Clicked too early
      if (reactionTimeoutId) {
        clearTimeout(reactionTimeoutId);
      }
      setReactionState('clicked');
      setTimeout(() => {
        startReactionGame();
      }, 1500);
    } else if (reactionState === 'ready') {
      // Measure reaction time
      const endTime = Date.now();
      const reactionTimeMs = reactionTimestamp ? endTime - reactionTimestamp : 0;
      setReactionTime(reactionTimeMs);
      setReactionState('results');
      
      // Save score if user is logged in
      if (user) {
        // Convert reaction time to a score (faster = higher score)
        const score = Math.max(1000 - reactionTimeMs, 100);
        
        addGameScore({
          userId: user.id,
          userName: user.email || 'Anonymous',
          gameId: 'reaction',
          gameName: 'Reaction Time',
          score,
          level: 1
        });
      }
    } else if (reactionState === 'results') {
      // Start a new round
      startReactionGame();
    }
  };

  return (
    <div className="min-h-[60vh]">
      {gameState === 'list' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mx-auto mb-6">
              <Gamepad size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Brain Training Games</h2>
            <p className="text-gray-600">Take a study break with these fun, brain-stimulating mini-games designed to sharpen your cognitive skills.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gamesData.map(game => (
              <motion.div 
                key={game.id}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-sfu-red/10 to-sfu-red/5 p-6">
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center mb-4 text-sfu-red">
                    {game.icon}
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{game.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{game.description}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Gamepad size={14} />
                      <span>{game.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{game.timeToComplete}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <Button 
                    className="w-full bg-sfu-red hover:bg-sfu-red/90 text-white"
                    onClick={() => startGame(game.id)}
                  >
                    Play Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 bg-sfu-lightgray/30 rounded-xl p-6">
            <h2 className="text-2xl font-display font-semibold mb-4">Benefits of Brain Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Cognitive Enhancement",
                  description: "Improve memory, attention, reaction time, and problem-solving skills."
                },
                {
                  title: "Stress Reduction",
                  description: "Take a break from studying and reduce mental fatigue with fun activities."
                },
                {
                  title: "Skill Building",
                  description: "Develop skills that are transferable to academic and professional settings."
                }
              ].map((benefit, index) => (
                <div key={index} className="bg-white p-5 rounded-lg shadow-sm">
                  <h3 className="font-medium text-lg mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
      
      {gameState === 'memory' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
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
                  <Zap size={14} />
                  <span>Moves: {moves}</span>
                </div>
              </div>
            </div>
            
            {gameCompleted ? (
              <div className="p-8 text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-20 h-20 bg-sfu-red/10 rounded-full flex items-center justify-center text-sfu-red mx-auto mb-6"
                >
                  <Trophy size={32} />
                </motion.div>
                
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
                
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={initMemoryGame}
                  >
                    Play Again
                  </Button>
                  
                  <Button 
                    className="bg-sfu-red text-white hover:bg-sfu-red/90"
                    onClick={() => setGameState('list')}
                  >
                    Back to Games
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
                    <motion.div 
                      key={index}
                      whileHover={{ scale: card.flipped || card.matched ? 1 : 1.05 }}
                      whileTap={{ scale: card.flipped || card.matched ? 1 : 0.95 }}
                      className={`aspect-square rounded-lg cursor-pointer transition-all duration-300 ${
                        card.flipped || card.matched 
                          ? 'bg-white border-2 border-gray-200 text-gray-800' 
                          : 'bg-gradient-to-br from-sfu-red/80 to-sfu-red hover:from-sfu-red hover:to-sfu-red/90'
                      } ${card.matched ? 'opacity-70' : 'opacity-100'}`}
                      onClick={() => handleCardFlip(index)}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        {(card.flipped || card.matched) && (
                          <span className="text-2xl font-bold">{card.value}</span>
                        )}
                      </div>
                    </motion.div>
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
                    onClick={() => setGameState('list')}
                  >
                    Exit Game
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {gameState === 'reaction' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-sfu-black text-white p-3 flex items-center gap-3">
              <Zap size={20} className="text-sfu-red" />
              <h2 className="font-display font-semibold">Reaction Time</h2>
            </div>
            
            <div className="p-8">
              {reactionState === 'waiting' && (
                <div 
                  className="h-64 bg-gray-500 rounded-lg flex items-center justify-center cursor-pointer"
                  onClick={handleReactionClick}
                >
                  <div className="text-center text-white">
                    <p className="text-xl font-medium mb-2">Wait for green...</p>
                    <p className="text-sm">Click as soon as the color changes</p>
                  </div>
                </div>
              )}
              
              {reactionState === 'ready' && (
                <div 
                  className="h-64 bg-green-500 rounded-lg flex items-center justify-center cursor-pointer"
                  onClick={handleReactionClick}
                >
                  <div className="text-center text-white">
                    <p className="text-3xl font-bold mb-2">CLICK NOW!</p>
                  </div>
                </div>
              )}
              
              {reactionState === 'clicked' && (
                <div className="h-64 bg-red-500 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="text-xl font-medium mb-2">Too early!</p>
                    <p className="text-sm">Wait for the green color next time</p>
                  </div>
                </div>
              )}
              
              {reactionState === 'results' && reactionTime !== null && (
                <div className="h-64 flex flex-col items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-20 h-20 bg-sfu-red/10 rounded-full flex items-center justify-center text-sfu-red mb-6"
                  >
                    <Zap size={32} />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold mb-2">Your reaction time</h3>
                  <p className="text-4xl font-bold text-sfu-red mb-6">{reactionTime} ms</p>
                  
                  <div className="text-sm text-gray-500 mb-6">
                    {reactionTime < 200 
                      ? "Incredible reflexes!" 
                      : reactionTime < 300 
                        ? "Great reaction time!" 
                        : reactionTime < 500 
                          ? "Good reaction time"
                          : "Keep practicing to improve"}
                  </div>
                  
                  <Button 
                    className="bg-sfu-red text-white hover:bg-sfu-red/90"
                    onClick={handleReactionClick}
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (reactionTimeoutId) {
                      clearTimeout(reactionTimeoutId);
                    }
                    setGameState('list');
                  }}
                >
                  Back to Games
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {gameState === 'word' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-20 h-20 bg-sfu-red/10 rounded-full flex items-center justify-center text-sfu-red mx-auto mb-6">
              <History size={32} />
            </div>
            
            <h2 className="text-2xl font-display font-bold mb-4">
              Word Scramble
            </h2>
            
            <p className="text-gray-600 mb-6">
              Coming soon! We're still developing this exciting brain training game.
            </p>
            
            <Button 
              className="bg-sfu-red text-white hover:bg-sfu-red/90"
              onClick={() => setGameState('list')}
            >
              Back to Games
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GamesSection;
