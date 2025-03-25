
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
          
          // Check if game is completed
          if (matchedPairs + 1 === 8) {
            setGameCompleted(true);
            
            // Save score if user is logged in
            if (user) {
              const score = Math.max(1000 - (moves * 10) - (gameTime * 2), 100);
              
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
        }, 500);
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
    
    // Random delay between 1-5 seconds
    const delay = Math.floor(Math.random() * 4000) + 1000;
    
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
    } else if (reactionState === 'ready') {
      // Good click, calculate time
      const endTime = Date.now();
      const time = reactionTimestamp ? endTime - reactionTimestamp : 0;
      setReactionTime(time);
      setReactionState('results');
      
      // Save score if user is logged in
      if (user) {
        // Convert reaction time to score (faster = higher score)
        const score = Math.max(1000 - time, 100);
        
        addGameScore({
          userId: user.id,
          userName: user.email || 'Anonymous',
          gameId: 'reaction',
          gameName: 'Reaction Time',
          score,
          level: 1
        });
      }
    }
  };
  
  // Return to game list
  const returnToList = () => {
    setGameState('list');
  };

  return (
    <div className="min-h-[60vh]">
      {gameState === 'list' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mx-auto mb-6">
              <Gamepad size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Mini Games</h2>
            <p className="text-gray-600">Take a break and have fun with these brain-training games.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gamesData.map(game => (
              <motion.div 
                key={game.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
              >
                <div className="p-5">
                  <div className="w-12 h-12 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mb-4">
                    {game.icon}
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg mb-2">{game.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{game.description}</p>
                  
                  <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                    <div>Difficulty: {game.difficulty}</div>
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      {game.timeToComplete}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-sfu-red text-white hover:bg-sfu-red/90"
                    onClick={() => startGame(game.id)}
                  >
                    Play Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      
      {gameState === 'memory' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-sfu-black text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-sm">Memory Match</div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs">
                  <Clock size={14} />
                  <span>{formatTime(gameTime)}</span>
                </div>
                
                <div className="px-2 py-1 bg-white/10 rounded text-xs">
                  Moves: {moves}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {!gameCompleted ? (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Pairs: {matchedPairs}/8
                      </span>
                      <span className="text-sm font-medium text-gray-500">
                        Moves: {moves}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sfu-red transition-all duration-300" 
                        style={{ width: `${(matchedPairs / 8) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {memoryGrid.map((card, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: card.flipped || card.matched ? 1 : 1.05 }}
                        whileTap={{ scale: card.flipped || card.matched ? 1 : 0.95 }}
                        className={`aspect-square rounded-lg cursor-pointer flex items-center justify-center text-xl font-bold transition-colors duration-300 ${
                          card.matched ? 'bg-green-100 text-green-600 border-2 border-green-300' : 
                          card.flipped ? 'bg-sfu-red text-white' : 
                          'bg-white border-2 border-gray-200 text-transparent hover:border-sfu-red/50'
                        }`}
                        onClick={() => handleCardFlip(index)}
                      >
                        {card.flipped || card.matched ? card.value : '?'}
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      variant="outline"
                      onClick={returnToList}
                    >
                      Exit Game
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-sfu-red/10 rounded-full flex items-center justify-center text-sfu-red mx-auto mb-6">
                    <Trophy size={32} />
                  </div>
                  
                  <h2 className="text-2xl font-display font-bold mb-4">Congratulations!</h2>
                  
                  <p className="text-gray-600 mb-8">
                    You completed the memory game! 
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6 max-w-xs mx-auto mb-8">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-gray-500 text-sm mb-1">Moves</div>
                      <div className="text-3xl font-bold">{moves}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-gray-500 text-sm mb-1">Time</div>
                      <div className="text-3xl font-bold">{formatTime(gameTime)}</div>
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
                      onClick={returnToList}
                    >
                      Back to Games
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {gameState === 'reaction' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-sfu-black text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-sm">Reaction Time</div>
              </div>
            </div>
            
            <div className="p-6">
              {reactionState === 'waiting' && (
                <div 
                  className="bg-red-500 h-60 flex items-center justify-center rounded-lg cursor-pointer text-white"
                  onClick={handleReactionClick}
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Wait for green...</h3>
                    <p>Click when the color changes</p>
                  </div>
                </div>
              )}
              
              {reactionState === 'ready' && (
                <div 
                  className="bg-green-500 h-60 flex items-center justify-center rounded-lg cursor-pointer text-white animate-pulse"
                  onClick={handleReactionClick}
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">CLICK NOW!</h3>
                  </div>
                </div>
              )}
              
              {reactionState === 'clicked' && (
                <div className="bg-yellow-500 h-60 flex items-center justify-center rounded-lg text-white">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Too early!</h3>
                    <p className="mb-4">You clicked before the color changed.</p>
                    <Button
                      className="bg-white text-yellow-500 hover:bg-white/90"
                      onClick={startReactionGame}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
              
              {reactionState === 'results' && (
                <div className="bg-blue-500 h-60 flex items-center justify-center rounded-lg text-white">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Your reaction time</h3>
                    <p className="text-4xl font-bold mb-4">{reactionTime}ms</p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        className="bg-white text-blue-500 hover:bg-white/90"
                        onClick={startReactionGame}
                      >
                        Try Again
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white text-white hover:bg-white/10"
                        onClick={returnToList}
                      >
                        Exit
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm mb-4">
                  The average reaction time is between 200-250 milliseconds.
                </p>
                
                {reactionState !== 'results' && (
                  <Button 
                    variant="outline"
                    onClick={returnToList}
                    className="mt-2"
                  >
                    Exit Game
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GamesSection;
