import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Trophy, ArrowUp, Crown, Award, Calendar, Search, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { QuizResult } from "@/types/quiz";
import { useAuth } from "@/contexts/AuthContext";

const Leaderboard = () => {
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [animatedScores, setAnimatedScores] = useState<{[key: number]: number}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<{
    all: QuizResult[];
    [key: string]: QuizResult[];
  }>({
    all: []
  });
  const [categories, setCategories] = useState<string[]>([]);
  const { user } = useAuth();
  
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

  // Function to fetch leaderboard data
  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching quiz results...');
      
      // Fetch quiz results
      const { data: results, error } = await supabase
        .from('quiz_results')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching quiz results:', error);
        throw error;
      }

      console.log('Raw quiz results:', results);

      // Process the results
      const processedResults = results.map(result => ({
        ...result,
        user_name: result.user_name || 'Unknown User',
        quiz_title: result.quiz_title || 'Unknown Quiz'
      }));

      console.log('Processed results:', processedResults);

      // Get unique categories from quiz titles
      const uniqueCategories = Array.from(new Set(processedResults.map(r => r.quiz_title)));
      setCategories(['all', ...uniqueCategories]);

      // Calculate scores for each category
      const categoryScores: { [key: string]: { [key: string]: { score: number; name: string; attempts: number; total_questions: number } } } = {
        all: {}
      };

      // Initialize category scores
      uniqueCategories.forEach(cat => {
        categoryScores[cat] = {};
      });

      // Process each result
      processedResults.forEach(result => {
        const userId = result.user_id;
        const quizTitle = result.quiz_title;

        // Process all-time scores
        if (!categoryScores.all[userId]) {
          categoryScores.all[userId] = {
            score: 0,
            name: result.user_name,
            attempts: 0,
            total_questions: 0
          };
        }
        categoryScores.all[userId].score += result.score;
        categoryScores.all[userId].attempts += 1;
        categoryScores.all[userId].total_questions += result.total_questions;

        // Process category-specific scores
        if (!categoryScores[quizTitle][userId]) {
          categoryScores[quizTitle][userId] = {
            score: 0,
            name: result.user_name,
            attempts: 0,
            total_questions: 0
          };
        }
        categoryScores[quizTitle][userId].score += result.score;
        categoryScores[quizTitle][userId].attempts += 1;
        categoryScores[quizTitle][userId].total_questions += result.total_questions;
      });

      // Calculate average scores for each category
      Object.keys(categoryScores).forEach(cat => {
        Object.keys(categoryScores[cat]).forEach(userId => {
          const userData = categoryScores[cat][userId];
          // Calculate percentage score
          userData.score = Math.round((userData.score / userData.total_questions) * 100);
        });
      });

      // Convert scores to leaderboard format
      const convertToLeaderboard = (scores: { [key: string]: { score: number; name: string; attempts: number; total_questions: number } }) => {
        return Object.entries(scores)
          .map(([userId, data]) => ({
            rank: 0,
            name: data.name,
            points: data.score,
            progress: `${data.attempts} attempts`,
            avatar: '',
            user_id: userId
          }))
          .sort((a, b) => b.points - a.points)
          .map((item, index) => ({
            ...item,
            rank: index + 1
          }));
      };

      // Create leaderboard data for each category
      const newLeaderboardData: { [key: string]: QuizResult[] } = {};
      Object.keys(categoryScores).forEach(cat => {
        newLeaderboardData[cat] = convertToLeaderboard(categoryScores[cat]);
      });

      console.log('Final leaderboard data:', newLeaderboardData);
      setLeaderboardData(newLeaderboardData);

    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch data and start animation
  useEffect(() => {
    fetchLeaderboardData();
    
    // Set up real-time subscription for quiz results
    const channel = supabase
      .channel('quiz-results-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'quiz_results' 
        }, 
        () => {
          fetchLeaderboardData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Effect to animate scores when data changes
  useEffect(() => {
    if (!isLoading) {
      animateScores(leaderboardData[filter]);
    }
  }, [filter, leaderboardData, isLoading]);

  // Function to animate the score counting
  const animateScores = (data: typeof leaderboardData.all) => {
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

  // Function to get the correct badge for a rank
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown size={16} className="text-yellow-500" />;
    if (rank === 2) return <Crown size={16} className="text-gray-400" />;
    if (rank === 3) return <Crown size={16} className="text-amber-700" />;
    return rank;
  };

  // Get user's rank
  const userRank = user ? leaderboardData[filter].find(u => u.user_id === user.id)?.rank : null;
  const userData = userRank ? leaderboardData[filter].find(u => u.rank === userRank) : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container-narrow max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Global Leaderboard</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Compete with fellow students and rise through the ranks to gain recognition for your academic achievements and participation.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Main Leaderboard */}
            <div className="w-full md:w-2/3">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-sfu-black text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy size={20} className="text-yellow-500" />
                    <h2 className="font-display font-semibold">Leaderboard Rankings</h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      className="text-xs bg-white/20 border border-white/10 rounded-md px-2 py-1"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.filter(cat => cat !== 'all').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between text-sm text-gray-500 font-medium">
                  <div className="w-16 text-center">Rank</div>
                  <div className="flex-grow">Student</div>
                  <div className="w-24 text-right">Points</div>
                </div>

                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-sfu-red/20 border-t-sfu-red rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading leaderboard data...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {leaderboardData[filter].map((user) => (
                      <div 
                        key={user.user_id}
                        className={`flex items-center p-4 hover:bg-gray-50 transition-colors duration-150 ${
                          user.user_id === user?.id ? 'bg-sfu-red/5 border-l-4 border-sfu-red' : ''
                        }`}
                      >
                        <div className="w-16 flex justify-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                            user.rank === 1 ? 'bg-yellow-500' : 
                            user.rank === 2 ? 'bg-gray-400' : 
                            user.rank === 3 ? 'bg-amber-700' : 
                            'bg-gray-200 text-gray-500'
                          }`}>
                            {getRankBadge(user.rank)}
                          </div>
                        </div>
                        
                        <div className="flex-grow flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">
                              Level: {
                                user.points < 500 ? 'Bronze' :
                                user.points < 1000 ? 'Silver' :
                                user.points < 2000 ? 'Gold' :
                                user.points < 3500 ? 'Platinum' :
                                'Diamond'
                              }
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-24 text-right font-mono font-bold text-gray-800">
                          {animatedScores[user.rank] !== undefined ? `${animatedScores[user.rank]}%` : '0%'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    <ChevronDown size={16} className="mr-1" />
                    Load More
                  </Button>
                  
                  <div className="text-sm text-gray-500">
                    Showing {leaderboardData[filter].length} students
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="w-full md:w-1/3 space-y-6">
              {/* Rank Levels */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-display font-semibold mb-4">Rank Levels</h3>
                <div className="space-y-3">
                  {rankLevels.map((level) => (
                    <div key={level.name} className="flex items-center gap-3">
                      {level.icon}
                      <div>
                        <div className="font-medium">{level.name}</div>
                        <div className="text-sm text-gray-500">{level.points} points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Stats */}
              {userData && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-display font-semibold mb-4">Your Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Trophy size={20} className="text-yellow-500" />
                      <div>
                        <div className="font-medium">Current Rank</div>
                        <div className="text-sm text-gray-500">#{userData.rank}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award size={20} className="text-blue-500" />
                      <div>
                        <div className="font-medium">Total Points</div>
                        <div className="text-sm text-gray-500">{userData.points.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-green-500" />
                      <div>
                        <div className="font-medium">Last Updated</div>
                        <div className="text-sm text-gray-500">
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Leaderboard;
