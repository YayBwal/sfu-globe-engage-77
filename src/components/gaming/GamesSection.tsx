
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useGaming } from '@/contexts/GamingContext';
import { Gamepad, Brain, Zap, Trophy, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

const GamesSection: React.FC = () => {
  const { user } = useAuth();
  const { saveGameScore } = useGaming();
  const { toast } = useToast();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState<number>(0);
  const [gameLevel, setGameLevel] = useState<number>(1);
  const [showResults, setShowResults] = useState<boolean>(false);
  
  // Game-specific state
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [memorytime, setMemoryTime] = useState<number>(0);
  const [memoryTimerId, setMemoryTimerId] = useState<NodeJS.Timeout | null>(null);
  
  const [reactionTarget, setReactionTarget] = useState<number | null>(null);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [reactionRound, setReactionRound] = useState<number>(1);
  const [reactionScores, setReactionScores] = useState<number[]>([]);
  const [reactionWaiting, setReactionWaiting] = useState<boolean>(false);
  const [reactionTimerId, setReactionTimerId] = useState<NodeJS.Timeout | null>(null);
  
  // Start Memory Match game
  const startMemoryGame = () => {
    setActiveGame('memory');
    setGameScore(0);
    setGameLevel(1);
    setMoves(0);
    setMatchedPairs(0);
    setMemoryTime(0);
    setFlippedIndices([]);
    
    // Generate cards
    const iconPairs = [
      '🍎', '🍌', '🍓', '🍒', '🍑', '🍋', '🍉', '🍇',
      '🥝', '🍍', '🥭', '🍊'
    ].slice(0, 6 + Math.min(gameLevel - 1, 6));
    
    const cardDeck = [...iconPairs, ...iconPairs]
      .map((icon, index) => ({ id: index, icon, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);
    
    setMemoryCards(cardDeck);
    
    // Start timer
    const timerId = setInterval(() => {
      setMemoryTime(prev => prev + 1);
    }, 1000);
    
    setMemoryTimerId(timerId);
  };
  
  // Handle card flip in Memory Match
  const handleCardFlip = (index: number) => {
    if (flippedIndices.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) {
      return;
    }
    
    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);
    
    const newCards = [...memoryCards];
    newCards[index].isFlipped = true;
    setMemoryCards(newCards);
    
    if (newFlippedIndices.length === 2) {
      setMoves(prev => prev + 1);
      
      // Check for match
      const [firstIndex, secondIndex] = newFlippedIndices;
      if (memoryCards[firstIndex].icon === memoryCards[secondIndex].icon) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...memoryCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setMemoryCards(matchedCards);
          setFlippedIndices([]);
          setMatchedPairs(prev => {
            const newPairs = prev + 1;
            // Check if game is completed
            if (newPairs === memoryCards.length / 2) {
              endMemoryGame();
            }
            return newPairs;
          });
          setGameScore(prev => prev + 10);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...memoryCards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setMemoryCards(resetCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };
  
  // End Memory Match game
  const endMemoryGame = () => {
    if (memoryTimerId) {
      clearInterval(memoryTimerId);
      setMemoryTimerId(null);
    }
    
    // Calculate score based on moves and time
    const timeBonus = Math.max(0, 300 - memoryTime * 2);
    const movesPenalty = moves * 5;
    const levelBonus = gameLevel * 20;
    const finalScore = Math.max(0, gameScore + timeBonus - movesPenalty + levelBonus);
    
    setGameScore(finalScore);
    setShowResults(true);
    
    // Save score if user is logged in
    saveGameScore('memory-match', 'Memory Match', finalScore, gameLevel);
  };
  
  // Start next level of Memory Match
  const nextMemoryLevel = () => {
    setShowResults(false);
    setGameLevel(prev => prev + 1);
    startMemoryGame();
  };
  
  // Start Reaction Test game
  const startReactionGame = () => {
    setActiveGame('reaction');
    setGameScore(0);
    setGameLevel(1);
    setReactionTime(null);
    setReactionRound(1);
    setReactionScores([]);
    setReactionWaiting(false);
    
    // Schedule the first target to appear
    scheduleReactionTarget();
  };
  
  // Schedule the reaction target to appear
  const scheduleReactionTarget = () => {
    setReactionWaiting(true);
    setReactionTarget(null);
    
    // Random delay between 1-4 seconds
    const delay = 1000 + Math.random() * 3000;
    
    const timerId = setTimeout(() => {
      setReactionTarget(Date.now());
      setReactionWaiting(false);
    }, delay);
    
    setReactionTimerId(timerId);
  };
  
  // Handle click on reaction target
  const handleReactionClick = () => {
    if (reactionTarget) {
      const currentTime = Date.now();
      const reactionTimeMs = currentTime - reactionTarget;
      setReactionTime(reactionTimeMs);
      
      // Add to scores
      const newScores = [...reactionScores, reactionTimeMs];
      setReactionScores(newScores);
      
      // Update round
      if (reactionRound < 5) {
        setReactionRound(prev => prev + 1);
        setTimeout(scheduleReactionTarget, 1500);
      } else {
        // End game after 5 rounds
        endReactionGame(newScores);
      }
    }
  };
  
  // Handle early click (before target appears)
  const handleEarlyClick = () => {
    if (reactionWaiting) {
      toast({
        title: "Too early!",
        description: "Wait for the target to appear before clicking",
        variant: "destructive",
      });
      
      if (reactionTimerId) {
        clearTimeout(reactionTimerId);
      }
      
      // Penalty for clicking too early
      const penaltyScore = 1000;
      const newScores = [...reactionScores, penaltyScore];
      setReactionScores(newScores);
      
      if (reactionRound < 5) {
        setReactionRound(prev => prev + 1);
        setTimeout(scheduleReactionTarget, 1500);
      } else {
        endReactionGame(newScores);
      }
    }
  };
  
  // End Reaction Test game
  const endReactionGame = (scores: number[]) => {
    if (reactionTimerId) {
      clearTimeout(reactionTimerId);
      setReactionTimerId(null);
    }
    
    // Calculate average reaction time
    const validScores = scores.filter(score => score < 1000);
    const avgReactionTime = validScores.length > 0 
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length 
      : 1000;
    
    // Calculate score (lower reaction time = higher score)
    const baseScore = Math.round(1000 - avgReactionTime);
    const finalScore = Math.max(0, baseScore) * gameLevel;
    
    setGameScore(finalScore);
    setShowResults(true);
    
    // Save score if user is logged in
    saveGameScore('reaction-test', 'Reaction Test', finalScore, gameLevel);
  };
  
  // Start next level of Reaction Test
  const nextReactionLevel = () => {
    setShowResults(false);
    setGameLevel(prev => prev + 1);
    startReactionGame();
  };
  
  // Exit current game
  const exitGame = () => {
    if (memoryTimerId) {
      clearInterval(memoryTimerId);
      setMemoryTimerId(null);
    }
    
    if (reactionTimerId) {
      clearTimeout(reactionTimerId);
      setReactionTimerId(null);
    }
    
    setActiveGame(null);
    setShowResults(false);
  };
  
  // Format reaction time for display
  const formatReactionTime = (ms: number) => {
    return ms < 1000 ? `${ms} ms` : 'Too slow!';
  };

  return (
    <div className="min-h-[60vh]">
      {/* Game Selection */}
      {!activeGame && (
        <div>
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mx-auto mb-6">
              <Gamepad size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Mini Games</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Train your brain with these fun mini-games designed to improve your cognitive skills and earn points.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              whileHover={{ y: -5 }}
              onClick={() => startMemoryGame()}
            >
              <div className="h-40 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Brain size={64} className="text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-display font-semibold mb-2">Memory Match</h3>
                <p className="text-gray-600 mb-4">Find matching pairs of cards in the shortest time with the fewest moves.</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={16} className="mr-1" />
                    2-5 minutes
                  </div>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Play Now
                  </Button>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              whileHover={{ y: -5 }}
              onClick={() => startReactionGame()}
            >
              <div className="h-40 bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
                <Zap size={64} className="text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-display font-semibold mb-2">Reaction Test</h3>
                <p className="text-gray-600 mb-4">Test your reaction speed by clicking targets as quickly as possible.</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={16} className="mr-1" />
                    1-2 minutes
                  </div>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                    Play Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
      
      {/* Memory Match Game */}
      {activeGame === 'memory' && !showResults && (
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Brain size={20} className="text-purple-600 mr-2" />
              <h3 className="font-display font-semibold">Memory Match</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-500">Level:</span> 
                <span className="ml-1 font-medium">{gameLevel}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Moves:</span> 
                <span className="ml-1 font-medium">{moves}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Time:</span> 
                <span className="ml-1 font-medium">
                  {Math.floor(memorytime / 60)}:{(memorytime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
            <div className="grid grid-cols-4 gap-3">
              {memoryCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  className={`aspect-square rounded-lg cursor-pointer overflow-hidden ${
                    card.isMatched 
                      ? 'bg-purple-100 border-2 border-purple-200' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                  onClick={() => handleCardFlip(index)}
                  whileHover={{ scale: card.isFlipped || card.isMatched ? 1 : 1.05 }}
                  animate={{ 
                    rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                    backgroundColor: card.isMatched ? '#EDE9FE' : '#F3F4F6'
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {(card.isFlipped || card.isMatched) && card.icon}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline" onClick={exitGame}>
              Exit Game
            </Button>
          </div>
        </div>
      )}
      
      {/* Reaction Test Game */}
      {activeGame === 'reaction' && !showResults && (
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Zap size={20} className="text-amber-600 mr-2" />
              <h3 className="font-display font-semibold">Reaction Test</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-500">Level:</span> 
                <span className="ml-1 font-medium">{gameLevel}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Round:</span> 
                <span className="ml-1 font-medium">{reactionRound}/5</span>
              </div>
              {reactionTime !== null && (
                <div className="text-sm">
                  <span className="text-gray-500">Last Time:</span> 
                  <span className="ml-1 font-medium">
                    {formatReactionTime(reactionTime)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 text-center">
            <div className="h-64 flex items-center justify-center">
              {reactionTarget ? (
                <motion.div
                  className="w-40 h-40 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl cursor-pointer"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReactionClick}
                >
                  CLICK!
                </motion.div>
              ) : (
                <div 
                  className={`w-full h-full flex items-center justify-center ${reactionWaiting ? 'bg-amber-50' : 'bg-gray-50'} rounded-xl`}
                  onClick={handleEarlyClick}
                >
                  {reactionWaiting ? (
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-center"
                    >
                      <p className="text-amber-600 font-medium text-lg mb-2">Wait for it...</p>
                      <p className="text-gray-500 text-sm">Click when the green target appears</p>
                    </motion.div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-600 font-medium text-lg">Get Ready!</p>
                      <p className="text-gray-500 text-sm">Next round starting soon...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {reactionScores.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Previous Rounds:</p>
                <div className="flex justify-center space-x-3">
                  {reactionScores.map((score, index) => (
                    <div key={index} className="text-xs px-3 py-1 rounded-full bg-gray-100">
                      {formatReactionTime(score)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline" onClick={exitGame}>
              Exit Game
            </Button>
          </div>
        </div>
      )}
      
      {/* Game Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {activeGame === 'memory' 
                ? 'Memory Match Complete!' 
                : 'Reaction Test Complete!'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center">
                <Trophy size={40} />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-sfu-red mb-1">{gameScore}</div>
              <div className="text-gray-600">Total Score</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              {activeGame === 'memory' && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-gray-500">Level</div>
                  <div className="font-medium text-right">{gameLevel}</div>
                  <div className="text-gray-500">Pairs Found</div>
                  <div className="font-medium text-right">{matchedPairs}</div>
                  <div className="text-gray-500">Moves</div>
                  <div className="font-medium text-right">{moves}</div>
                  <div className="text-gray-500">Time</div>
                  <div className="font-medium text-right">
                    {Math.floor(memorytime / 60)}:{(memorytime % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              )}
              
              {activeGame === 'reaction' && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-gray-500">Level</div>
                  <div className="font-medium text-right">{gameLevel}</div>
                  <div className="text-gray-500">Average Time</div>
                  <div className="font-medium text-right">
                    {formatReactionTime(
                      reactionScores.filter(s => s < 1000).reduce((sum, s) => sum + s, 0) / 
                      (reactionScores.filter(s => s < 1000).length || 1)
                    )}
                  </div>
                  <div className="text-gray-500">Best Time</div>
                  <div className="font-medium text-right">
                    {formatReactionTime(Math.min(...reactionScores.filter(s => s < 1000), 1000))}
                  </div>
                  <div className="text-gray-500">Accuracy</div>
                  <div className="font-medium text-right">
                    {Math.round((reactionScores.filter(s => s < 1000).length / reactionScores.length) * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={exitGame} className="w-full">
              Exit Game
            </Button>
            <Button 
              onClick={activeGame === 'memory' ? nextMemoryLevel : nextReactionLevel} 
              className="w-full bg-sfu-red hover:bg-sfu-red/90"
            >
              Next Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamesSection;
