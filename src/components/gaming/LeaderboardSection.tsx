
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Filter, Clock, Gamepad, BookOpen, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useGaming } from '@/contexts/GamingContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const LeaderboardSection: React.FC = () => {
  const { leaderboard, quizScores, gameScores, isLoading } = useGaming();
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  
  // Filter scores by time
  const getFilteredScores = (scoresList: any[], filter: 'all' | 'week' | 'month') => {
    if (filter === 'all') return scoresList;
    
    const now = new Date();
    let cutoffDate: Date;
    
    if (filter === 'week') {
      // Last 7 days
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // Last 30 days
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return scoresList.filter(score => new Date(score.created_at) > cutoffDate);
  };
  
  const filteredQuizScores = getFilteredScores(quizScores, timeFilter);
  const filteredGameScores = getFilteredScores(gameScores, timeFilter);
  
  const getTopScore = (scores: any[]) => {
    if (scores.length === 0) return null;
    return scores.reduce((prev, current) => (prev.score > current.score) ? prev : current);
  };
  
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-500";
      case 1: return "text-gray-400";
      case 2: return "text-amber-600";
      default: return "text-gray-700";
    }
  };

  return (
    <div className="min-h-[60vh]">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mx-auto mb-6">
          <Trophy size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Leaderboard</h2>
        <p className="text-gray-600">See how you stack up against other players in quizzes and games.</p>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200 space-x-2">
          <Filter size={16} className="text-gray-400" />
          {['all', 'week', 'month'].map((filter) => (
            <button
              key={filter}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                timeFilter === filter 
                  ? 'bg-sfu-red text-white' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setTimeFilter(filter as any)}
            >
              {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white/50 w-full justify-center mb-6">
          <TabsTrigger value="overview" className="data-[state=active]:bg-sfu-red data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="data-[state=active]:bg-sfu-red data-[state=active]:text-white">
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="games" className="data-[state=active]:bg-sfu-red data-[state=active]:text-white">
            Games
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-10 h-10 border-4 border-sfu-red/20 border-t-sfu-red rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-medium">Top Players</h3>
                    <Trophy size={20} className="text-sfu-red" />
                  </div>
                  
                  <div className="space-y-4">
                    {leaderboard.slice(0, 5).map((player, index) => (
                      <motion.div 
                        key={player.userId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center"
                      >
                        <div className="w-6 text-center font-bold">
                          {index < 3 ? (
                            <Medal size={16} className={getMedalColor(index)} />
                          ) : (
                            <span className="text-sm text-gray-500">{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={player.profilePic} />
                              <AvatarFallback className="bg-sfu-red/10 text-sfu-red">
                                {player.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium truncate">{player.userName}</p>
                              <p className="text-xs text-gray-500">
                                {player.quizCount} quizzes • {player.gameCount} games
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-2 text-right">
                          <p className="text-sm font-semibold text-sfu-red">{player.totalScore}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-medium">Top Quiz Scores</h3>
                    <BookOpen size={20} className="text-sfu-red" />
                  </div>
                  
                  {filteredQuizScores.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      No quiz scores yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredQuizScores.slice(0, 5).map((score, index) => (
                        <motion.div 
                          key={score.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center"
                        >
                          <div className="w-6 text-center font-bold">
                            <span className="text-sm text-gray-500">{index + 1}</span>
                          </div>
                          
                          <div className="ml-3 flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">
                              {score.user_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {score.quiz_name}
                            </p>
                          </div>
                          
                          <div className="ml-2 text-right">
                            <p className="text-sm font-semibold text-sfu-red">{score.score}</p>
                            <p className="text-xs text-gray-500">
                              <Clock size={10} className="inline mr-1" />
                              {Math.floor(score.time_taken / 60)}:{(score.time_taken % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-medium">Top Game Scores</h3>
                    <Gamepad size={20} className="text-sfu-red" />
                  </div>
                  
                  {filteredGameScores.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      No game scores yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredGameScores.slice(0, 5).map((score, index) => (
                        <motion.div 
                          key={score.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center"
                        >
                          <div className="w-6 text-center font-bold">
                            <span className="text-sm text-gray-500">{index + 1}</span>
                          </div>
                          
                          <div className="ml-3 flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">
                              {score.user_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {score.game_name}
                            </p>
                          </div>
                          
                          <div className="ml-2 text-right">
                            <p className="text-sm font-semibold text-sfu-red">{score.score}</p>
                            <p className="text-xs text-gray-500">
                              Level {score.level}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-sfu-red/5 to-sfu-red/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-medium text-lg">Weekly Challenge</h3>
                  <ArrowUpRight size={18} className="text-sfu-red" />
                </div>
                
                <p className="text-gray-600 mb-4">
                  Complete this week's featured quiz and game to earn bonus points and special achievements.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mr-3">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <p className="font-medium">History Quiz</p>
                        <p className="text-xs text-gray-500">500 bonus points</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mr-3">
                        <Gamepad size={18} />
                      </div>
                      <div>
                        <p className="font-medium">Memory Match</p>
                        <p className="text-xs text-gray-500">300 bonus points</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="quizzes">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-10 h-10 border-4 border-sfu-red/20 border-t-sfu-red rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredQuizScores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                          No quiz scores available for this time period
                        </td>
                      </tr>
                    ) : (
                      filteredQuizScores.slice(0, 10).map((score, index) => (
                        <motion.tr 
                          key={score.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index < 3 ? (
                                <Medal size={16} className={getMedalColor(index)} />
                              ) : (
                                <span className="text-sm text-gray-500">{index + 1}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={score.profile_pic} />
                                <AvatarFallback className="bg-sfu-red/10 text-sfu-red">
                                  {score.user_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{score.user_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm">{score.quiz_name}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-sfu-red">{score.score}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {Math.floor(score.time_taken / 60)}:{(score.time_taken % 60).toString().padStart(2, '0')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {new Date(score.created_at).toLocaleDateString()}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="games">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-10 h-10 border-4 border-sfu-red/20 border-t-sfu-red rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredGameScores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                          No game scores available for this time period
                        </td>
                      </tr>
                    ) : (
                      filteredGameScores.slice(0, 10).map((score, index) => (
                        <motion.tr 
                          key={score.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index < 3 ? (
                                <Medal size={16} className={getMedalColor(index)} />
                              ) : (
                                <span className="text-sm text-gray-500">{index + 1}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={score.profile_pic} />
                                <AvatarFallback className="bg-sfu-red/10 text-sfu-red">
                                  {score.user_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{score.user_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm">{score.game_name}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-sfu-red">{score.score}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{score.level}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {new Date(score.created_at).toLocaleDateString()}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaderboardSection;
