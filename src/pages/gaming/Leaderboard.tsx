
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { BarChart, Trophy, ArrowUp, Crown, Award, Filter, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

type LeaderboardUser = {
  rank: number;
  user_id: string | null;
  username: string;
  points: number;
  weekly_change: number;
  level: string;
};

const Leaderboard = () => {
  const { isAuthenticated, user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("week");
  const [category, setCategory] = useState("all");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [animatedScores, setAnimatedScores] = useState<{[key: number]: number}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);

  // Ref for animation
  const animationFrameRef = useRef<number>();

  // Sample rank levels data
  const rankLevels = [
    { name: "Bronze", points: "0 - 500", icon: <Award size={20} className="text-amber-700" /> },
    { name: "Silver", points: "501 - 1000", icon: <Award size={20} className="text-gray-400" /> },
    { name: "Gold", points: "1001 - 2000", icon: <Award size={20} className="text-yellow-500" /> },
    { name: "Platinum", points: "2001 - 3500", icon: <Crown size={20} className="text-blue-500" /> },
    { name: "Diamond", points: "3501+", icon: <Crown size={20} className="text-purple-500" /> },
  ];

  // Fetch leaderboard data from database
  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      // Use the stored procedure we created in the SQL migration
      const { data, error } = await supabase
        .rpc('get_leaderboard_by_category', { p_category: category === 'all' ? null : category });
      
      if (error) {
        console.error('Error fetching leaderboard data:', error);
        return;
      }
      
      if (data) {
        setLeaderboardData(data);
        
        // If user is authenticated, find their rank
        if (user) {
          const userRankData = data.find(item => item.user_id === user.id);
          setUserRank(userRankData || null);
        }
        
        animateScores(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to animate score counting
  const animateScores = (data: LeaderboardUser[]) => {
    const finalScores: {[key: number]: number} = {};
    data.forEach((user) => {
      finalScores[user.rank] = user.points;
    });
    
    const initialScores: {[key: number]: number} = {};
    data.forEach((user) => {
      initialScores[user.rank] = 0;
    });
    
    setAnimatedScores(initialScores);
    
    let startTime: number | null = null;
    const duration = 1500; // 1.5 seconds
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const newScores: {[key: number]: number} = {};
      data.forEach((user) => {
        newScores[user.rank] = Math.floor(progress * user.points);
      });
      
      setAnimatedScores(newScores);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(step);
  };

  // Load data when component mounts or category changes
  useEffect(() => {
    fetchLeaderboardData();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [category, user]);

  // Function to get the correct badge for a rank
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown size={16} className="text-yellow-500" />;
    if (rank === 2) return <Crown size={16} className="text-gray-400" />;
    if (rank === 3) return <Crown size={16} className="text-amber-700" />;
    return rank;
  };

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
              <BarChart className="mr-3 h-8 w-8 text-amber-600" />
              Leaderboard
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See who's on top and track your ranking
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                Top Players
              </h2>
              <div className="flex gap-2">
                <select 
                  className="text-sm bg-white border border-gray-200 rounded-md px-3 py-1.5"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="allTime">All Time</option>
                </select>

                <select 
                  className="text-sm bg-white border border-gray-200 rounded-md px-3 py-1.5"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="quiz">Quiz</option>
                  <option value="game">Games</option>
                  <option value="social">Social</option>
                </select>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-16 text-center">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right w-24">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-16">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500">Loading leaderboard data...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : leaderboardData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <p className="text-gray-500">No data available for this category</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaderboardData.map((player) => (
                        <TableRow key={player.rank} className="hover:bg-gray-50">
                          <TableCell className="text-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mx-auto ${
                              player.rank === 1 ? 'bg-yellow-500' : 
                              player.rank === 2 ? 'bg-gray-400' : 
                              player.rank === 3 ? 'bg-amber-700' : 
                              'bg-gray-200 text-gray-500'
                            }`}>
                              {getRankBadge(player.rank)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                              <div>
                                <div className="font-medium">{player.username}</div>
                                <div className="text-xs text-gray-500">
                                  Level: {player.level}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-gray-800">
                            {animatedScores[player.rank] !== undefined ? animatedScores[player.rank].toLocaleString() : 0}
                          </TableCell>
                          <TableCell className="text-right text-green-500 flex items-center justify-end gap-1">
                            <ArrowUp size={12} />
                            <span>{player.weekly_change}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass rounded-xl p-8 mb-12 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-amber-100 rounded-full p-5">
                <Trophy className="h-12 w-12 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Compete for the top spot!</h3>
                <p className="text-gray-600 mb-4">
                  The leaderboard ranks players based on their total points earned from quizzes and mini-games.
                  Compete with friends and other players to climb the rankings and prove your skills.
                </p>
                {isAuthenticated ? (
                  <Tabs defaultValue={category} className="w-full">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="all" onClick={() => setCategory('all')} className="flex-1">All</TabsTrigger>
                      <TabsTrigger value="quiz" onClick={() => setCategory('quiz')} className="flex-1">Quiz</TabsTrigger>
                      <TabsTrigger value="game" onClick={() => setCategory('game')} className="flex-1">Games</TabsTrigger>
                      <TabsTrigger value="social" onClick={() => setCategory('social')} className="flex-1">Social</TabsTrigger>
                    </TabsList>
                  </Tabs>
                ) : (
                  <Button asChild>
                    <Link to="/login">Sign in to View</Link>
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

export default Leaderboard;
