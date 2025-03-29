
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Gamepad, Award, Puzzle, BarChart, Trophy, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const GamingHub = () => {
  const { isAuthenticated, user } = useAuth();
  const isMobile = useIsMobile();

  // Sample game data
  const featuredGames = [
    {
      id: 'memory',
      title: 'Memory Match',
      description: 'Test your memory by matching pairs of cards',
      icon: <Brain className="h-5 w-5" />,
      difficulty: 'Easy',
      path: '/gaming/games',
    },
    {
      id: 'reflex',
      title: 'Reflex Challenge',
      description: 'Test your reaction time with this fast-paced game',
      icon: <Zap className="h-5 w-5" />,
      difficulty: 'Medium',
      path: '/gaming/games',
    }
  ];

  // Sample leaderboard data
  const topPlayers = [
    { rank: 1, name: "Sophia Chen", points: 1250 },
    { rank: 2, name: "David Kim", points: 1198 },
    { rank: 3, name: "Emily Wong", points: 1145 }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
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
              <Gamepad className="mr-3 h-8 w-8 text-sfu-red" />
              Gaming Hub
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Play games, compete in quizzes, and climb the leaderboards to showcase your skills and knowledge
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-sfu-red to-red-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <span>Quizzes</span>
                </CardTitle>
                <CardDescription className="text-white/80">
                  Test your knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <p className="text-gray-600 mb-6">
                  Challenge yourself with a variety of quizzes across different subjects. Earn points and climb the leaderboard.
                </p>
                <Button asChild className="w-full">
                  <Link to="/gaming/quiz">Start Quiz</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-sfu-red to-red-800 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Puzzle className="h-5 w-5" />
                  <span>Mini Games</span>
                </CardTitle>
                <CardDescription className="text-white/80">
                  Fun and challenging games
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <p className="text-gray-600 mb-6">
                  Enjoy a collection of mini-games designed to test your reflexes, memory, and problem-solving skills.
                </p>
                <Button asChild className="w-full">
                  <Link to="/gaming/games">Play Games</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-sfu-red to-red-900 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  <span>Leaderboard</span>
                </CardTitle>
                <CardDescription className="text-white/80">
                  See who's on top
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <p className="text-gray-600 mb-6">
                  View the leaderboard to see how you rank against other players. Compete for the top spot!
                </p>
                <Button asChild className="w-full">
                  <Link to="/gaming/leaderboard">View Rankings</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Featured games section */}
          <motion.div variants={itemVariants} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Gamepad className="h-6 w-6 text-sfu-red" />
              Featured Games
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredGames.map((game) => (
                <Card key={game.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-sfu-red/10 rounded-full p-3">
                        {game.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{game.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{game.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {game.difficulty}
                          </span>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={game.path}>Play</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
          
          {/* Top players section */}
          <motion.div variants={itemVariants} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-600" />
              Top Players
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {topPlayers.map((player) => (
                    <div key={player.rank} className="flex items-center p-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-4 ${
                        player.rank === 1 ? 'bg-yellow-500' : 
                        player.rank === 2 ? 'bg-gray-400' : 
                        'bg-amber-700'
                      }`}>
                        {player.rank}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{player.name}</div>
                      </div>
                      <div className="font-bold">{player.points.toLocaleString()} pts</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 text-center">
                  <Button variant="outline" asChild>
                    <Link to="/gaming/leaderboard">View Full Leaderboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass rounded-xl p-8 mb-12 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-sfu-red/10 rounded-full p-5">
                <Trophy className="h-12 w-12 text-sfu-red" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to compete?</h3>
                <p className="text-gray-600 mb-4">
                  The Gaming Hub is a place to have fun while testing your knowledge and skills. 
                  Complete quizzes and play games to earn points and climb the leaderboard.
                </p>
                {isAuthenticated ? (
                  <Button asChild>
                    <Link to="/gaming/quiz">Start Playing Now</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/login">Sign in to Start</Link>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GamingHub;
