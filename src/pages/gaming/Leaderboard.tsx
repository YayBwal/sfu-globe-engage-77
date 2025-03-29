
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { BarChart, Trophy, ArrowUp, Crown, Award, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Sample leaderboard data
const leaderboardData = [
  { rank: 1, name: "Sophia Chen", points: 1250, progress: "+28", avatar: "" },
  { rank: 2, name: "David Kim", points: 1198, progress: "+15", avatar: "" },
  { rank: 3, name: "Emily Wong", points: 1145, progress: "+21", avatar: "" },
  { rank: 4, name: "Michael Patel", points: 1089, progress: "+18", avatar: "" },
  { rank: 5, name: "Sarah Johnson", points: 1056, progress: "+12", avatar: "" },
  { rank: 6, name: "Jason Lee", points: 1022, progress: "+9", avatar: "" },
  { rank: 7, name: "Emma Thompson", points: 986, progress: "+14", avatar: "" },
  { rank: 8, name: "Ryan Garcia", points: 954, progress: "+7", avatar: "" },
  { rank: 9, name: "Lisa Wang", points: 921, progress: "+16", avatar: "" },
  { rank: 10, name: "Alex Martinez", points: 897, progress: "+11", avatar: "" },
];

const Leaderboard = () => {
  const { isAuthenticated, user } = useAuth();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("week");
  const [animatedScores, setAnimatedScores] = useState<{[key: number]: number}>({});

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

  // Function to animate score counting
  useEffect(() => {
    const finalScores: {[key: number]: number} = {};
    leaderboardData.forEach((user) => {
      finalScores[user.rank] = user.points;
    });
    
    const initialScores: {[key: number]: number} = {};
    leaderboardData.forEach((user) => {
      initialScores[user.rank] = 0;
    });
    
    setAnimatedScores(initialScores);
    
    let startTime: number | null = null;
    const duration = 1500; // 1.5 seconds
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const newScores: {[key: number]: number} = {};
      leaderboardData.forEach((user) => {
        newScores[user.rank] = Math.floor(progress * user.points);
      });
      
      setAnimatedScores(newScores);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    const animationFrame = requestAnimationFrame(step);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // Function to get the correct badge for a rank
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown size={16} className="text-yellow-500" />;
    if (rank === 2) return <Crown size={16} className="text-gray-400" />;
    if (rank === 3) return <Crown size={16} className="text-amber-700" />;
    return rank;
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
                    {leaderboardData.map((player) => (
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
                              <div className="font-medium">{player.name}</div>
                              <div className="text-xs text-gray-500">
                                Level: {
                                  player.points < 500 ? 'Bronze' :
                                  player.points < 1000 ? 'Silver' :
                                  player.points < 2000 ? 'Gold' :
                                  'Platinum'
                                }
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-gray-800">
                          {animatedScores[player.rank] !== undefined ? animatedScores[player.rank].toLocaleString() : 0}
                        </TableCell>
                        <TableCell className="text-right text-green-500 flex items-center justify-end gap-1">
                          <ArrowUp size={12} />
                          <span>{player.progress}</span>
                        </TableCell>
                      </TableRow>
                    ))}
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
                  <Button>View Your Ranking</Button>
                ) : (
                  <Button asChild>
                    <a href="/login">Sign in to View</a>
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
