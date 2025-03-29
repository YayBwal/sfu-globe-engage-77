
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BackButton from '@/components/gaming/BackButton';
import { Gamepad, Award, Puzzle, BarChart, Trophy, Brain, Zap, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import MemoryGame from '@/components/gaming/MemoryGame';

const GamesHub = () => {
  const { isAuthenticated, user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Sample game data
  const games = [
    {
      id: 'memory',
      title: 'Memory Match',
      description: 'Test your memory by matching pairs of cards',
      icon: <Brain className="h-5 w-5" />,
      difficulty: 'Easy',
      component: <MemoryGame />
    },
    {
      id: 'reflex',
      title: 'Reflex Challenge',
      description: 'Test your reaction time with this fast-paced game',
      icon: <Zap className="h-5 w-5" />,
      difficulty: 'Medium',
      component: <div className="text-center py-12">Coming Soon!</div>
    }
  ];

  // Sample leaderboard data
  const [topPlayers, setTopPlayers] = useState<any[]>([]);

  useEffect(() => {
    const fetchTopGamePlayers = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_leaderboard_by_category', { p_category: 'game' });
          
        if (error) throw error;
        if (data) {
          setTopPlayers(data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching top players:', error);
      }
    };
    
    fetchTopGamePlayers();
  }, []);

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

  // Function to check if a specific game is being viewed by URL path
  useEffect(() => {
    const path = window.location.pathname;
    const gameId = path.split('/').pop();
    if (gameId && games.find(g => g.id === gameId)) {
      setActiveGame(gameId);
    }
  }, []);

  if (activeGame) {
    const game = games.find(g => g.id === activeGame);
    if (game) {
      return game.component;
    }
  }

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
          <div className="flex items-center gap-2 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/gaming')}
              className="flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              Back to Gaming Hub
            </Button>
          </div>
          
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center">
              <Puzzle className="mr-3 h-8 w-8 text-sfu-red" />
              Mini Games
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Test your skills with these fun mini-games and earn points for the leaderboard
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {games.map((game) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
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
                        <Button 
                          size="sm"
                          onClick={() => setActiveGame(game.id)}
                        >
                          Play
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
          
          {/* Top players section */}
          <motion.div variants={itemVariants} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-600" />
              Top Game Players
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {topPlayers.length > 0 ? (
                    topPlayers.map((player) => (
                      <div key={player.rank} className="flex items-center p-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-4 ${
                          player.rank === 1 ? 'bg-yellow-500' : 
                          player.rank === 2 ? 'bg-gray-400' : 
                          'bg-amber-700'
                        }`}>
                          {player.rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{player.username}</div>
                          <div className="text-xs text-gray-500">Level: {player.level}</div>
                        </div>
                        <div className="font-bold">{player.points.toLocaleString()} pts</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500">Loading top players...</div>
                  )}
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
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Earn points by playing games!</h3>
                <p className="text-gray-600 mb-4">
                  Each game you play earns you points on the leaderboard. The better you perform, the more points you'll earn.
                  Challenge yourself to reach the top of the rankings!
                </p>
                {isAuthenticated ? (
                  <Button asChild>
                    <Link to="/gaming/leaderboard">View Leaderboard</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/login">Sign in to Track Progress</Link>
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

export default GamesHub;
