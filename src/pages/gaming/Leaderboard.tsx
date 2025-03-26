
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { BarChart, Medal, Trophy, Award, Star, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Leaderboard = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizLeaderboard, setQuizLeaderboard] = useState([]);
  const [gameLeaderboard, setGameLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up real-time subscription for leaderboard updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_results'
        },
        () => {
          fetchLeaderboard();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_results'
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Fetch combined leaderboard
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, name, profile_pic');
        
      if (userError) throw userError;
      
      // Fetch quiz scores
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_results')
        .select('user_id, score');
        
      if (quizError) throw quizError;
      
      // Fetch game scores
      const { data: gameData, error: gameError } = await supabase
        .from('game_results')
        .select('user_id, score');
        
      if (gameError) throw gameError;
      
      // Process quiz leaderboard
      const quizScores = {};
      quizData.forEach(result => {
        quizScores[result.user_id] = (quizScores[result.user_id] || 0) + result.score;
      });
      
      const quizLeaderboardData = userData.map(user => ({
        ...user,
        score: quizScores[user.id] || 0
      })).sort((a, b) => b.score - a.score);
      
      setQuizLeaderboard(quizLeaderboardData);
      
      // Process game leaderboard
      const gameScores = {};
      gameData.forEach(result => {
        gameScores[result.user_id] = (gameScores[result.user_id] || 0) + result.score;
      });
      
      const gameLeaderboardData = userData.map(user => ({
        ...user,
        score: gameScores[user.id] || 0
      })).sort((a, b) => b.score - a.score);
      
      setGameLeaderboard(gameLeaderboardData);
      
      // Process combined leaderboard
      const combinedLeaderboardData = userData.map(user => ({
        ...user,
        score: (quizScores[user.id] || 0) + (gameScores[user.id] || 0)
      })).sort((a, b) => b.score - a.score);
      
      setLeaderboard(combinedLeaderboardData);
      
      // Find user's rank
      if (isAuthenticated && user) {
        const userIndex = combinedLeaderboardData.findIndex(item => item.id === user.id);
        setUserRank(userIndex !== -1 ? userIndex + 1 : null);
      }
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: 'Error fetching leaderboard',
        description: 'There was a problem loading the leaderboard data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const LeaderboardTable = ({ data, title, isUserInTable = false }) => (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.slice(0, 10).map((player, index) => (
                <TableRow 
                  key={player.id}
                  className={isAuthenticated && user && player.id === user.id ? "bg-amber-50" : ""}
                >
                  <TableCell className="text-center">
                    {index === 0 ? (
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                        <Crown className="h-4 w-4 text-amber-600" />
                      </div>
                    ) : index === 1 ? (
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
                        <Medal className="h-4 w-4 text-gray-600" />
                      </div>
                    ) : index === 2 ? (
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-50">
                        <Award className="h-4 w-4 text-amber-500" />
                      </div>
                    ) : (
                      <span className="font-medium text-gray-600">{index + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={player.profile_pic} />
                        <AvatarFallback className="bg-gray-200 text-gray-700">
                          {player.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                      {isAuthenticated && user && player.id === user.id && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">You</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold flex items-center justify-end">
                    {player.score}
                    <Star className="ml-1 h-4 w-4 text-amber-500" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                  No data available yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

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
              See how you rank against other players in quizzes and games
            </p>
          </motion.div>
          
          {isAuthenticated && userRank && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="glass rounded-xl p-6 flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <Trophy className="h-10 w-10 mr-4 text-amber-500" />
                  <div>
                    <p className="text-gray-600">Your Current Ranking</p>
                    <h3 className="text-2xl font-bold">{userRank}<span className="text-sm font-normal ml-1 text-gray-500">{getOrdinalSuffix(userRank)} place</span></h3>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-right">
                    <p className="text-gray-600">Your Score</p>
                    <h3 className="text-2xl font-bold flex items-center justify-end">
                      {leaderboard.find(player => player.id === user.id)?.score || 0}
                      <Star className="ml-1 h-5 w-5 text-amber-500" />
                    </h3>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants} className="mb-12">
            <Tabs defaultValue="combined" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="combined" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                  Combined
                </TabsTrigger>
                <TabsTrigger value="quiz" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
                  Quiz
                </TabsTrigger>
                <TabsTrigger value="games" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                  Games
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="combined" className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Loading leaderboard data...</p>
                  </div>
                ) : (
                  <LeaderboardTable 
                    data={leaderboard} 
                    title="Overall Leaderboard" 
                    isUserInTable={isAuthenticated}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="quiz" className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Loading quiz leaderboard...</p>
                  </div>
                ) : (
                  <LeaderboardTable 
                    data={quizLeaderboard} 
                    title="Quiz Leaderboard" 
                    isUserInTable={isAuthenticated}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="games" className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Loading games leaderboard...</p>
                  </div>
                ) : (
                  <LeaderboardTable 
                    data={gameLeaderboard} 
                    title="Games Leaderboard" 
                    isUserInTable={isAuthenticated}
                  />
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">How to Earn Points</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-lg mb-2 flex items-center">
                  <Award className="mr-2 h-5 w-5 text-indigo-600" />
                  <span>Quizzes</span>
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                    <span>Complete quizzes to earn points</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                    <span>1 point for each correct answer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                    <span>Bonus points for perfect scores</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-lg mb-2 flex items-center">
                  <Puzzle className="mr-2 h-5 w-5 text-green-600" />
                  <span>Games</span>
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Play mini-games to earn points</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Points based on your performance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Different games offer different point values</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

// Helper function to get ordinal suffix for numbers
function getOrdinalSuffix(i) {
  const j = i % 10,
        k = i % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}

export default Leaderboard;
