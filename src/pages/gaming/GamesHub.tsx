
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Puzzle, Brain, Zap, Dices, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const GamesHub = () => {
  const { isAuthenticated } = useAuth();

  // Game data
  const games = [
    {
      id: 'memory',
      title: 'Memory Match',
      description: 'Test your memory by matching pairs of cards',
      icon: <Brain className="h-6 w-6" />,
      difficulty: 'Easy',
      timeEstimate: '3-5 min',
      color: 'from-blue-500 to-blue-600',
      comingSoon: false
    },
    {
      id: 'reflex',
      title: 'Reflex Challenge',
      description: 'Test your reaction time with this fast-paced game',
      icon: <Zap className="h-6 w-6" />,
      difficulty: 'Medium',
      timeEstimate: '2-3 min',
      color: 'from-amber-500 to-amber-600',
      comingSoon: false
    },
    {
      id: 'puzzle',
      title: 'Number Puzzle',
      description: 'Arrange numbers in the correct sequence',
      icon: <Dices className="h-6 w-6" />,
      difficulty: 'Medium',
      timeEstimate: '5-8 min',
      color: 'from-emerald-500 to-emerald-600',
      comingSoon: true
    },
    {
      id: 'wordrace',
      title: 'Word Race',
      description: 'How many words can you type in 60 seconds?',
      icon: <Clock className="h-6 w-6" />,
      difficulty: 'Hard',
      timeEstimate: '1-2 min',
      color: 'from-purple-500 to-purple-600',
      comingSoon: true
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-28">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center">
              <Puzzle className="mr-3 h-8 w-8 text-emerald-600" />
              Mini Games
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enjoy our collection of fun and challenging mini-games while earning points for the leaderboard
            </p>
          </motion.div>
          
          {isAuthenticated ? (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {games.map((game) => (
                <Card key={game.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className={`bg-gradient-to-r ${game.color} text-white rounded-t-lg`}>
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2">
                        {game.icon}
                        <span>{game.title}</span>
                      </CardTitle>
                      {game.comingSoon && (
                        <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-white/80">
                      {game.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
                      <div>
                        <span className="font-medium">Difficulty:</span> {game.difficulty}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {game.timeEstimate}
                      </div>
                    </div>
                    {game.comingSoon ? (
                      <Button disabled className="w-full opacity-70">
                        Coming Soon
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <Link to={`/gaming/games/${game.id}`}>Play Now</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="text-center py-12">
              <p className="text-gray-600 mb-4">Please sign in to play games and earn points</p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link to="/login">Sign In</Link>
              </Button>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants} className="mt-12 glass rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">How Points Work</h3>
            <p className="mb-4">
              Each game awards points based on your performance. These points are added to your total score on the leaderboard.
              The better you perform, the more points you earn!
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Play games to earn points</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Points are awarded based on your performance</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Your total score is displayed on the leaderboard</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Compete with others to climb the rankings</span>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GamesHub;
