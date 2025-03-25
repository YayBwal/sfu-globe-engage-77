
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGaming } from '@/contexts/GamingContext';

// Import our new components
import LeaderboardHeader from './leaderboard/LeaderboardHeader';
import TimeFilter from './leaderboard/TimeFilter';
import TabContent from './leaderboard/TabContent';

const LeaderboardSection: React.FC = () => {
  const { leaderboard = [], quizScores = [], gameScores = [], isLoading, fetchLeaderboards } = useGaming();
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  
  // Fetch leaderboard data when component mounts
  useEffect(() => {
    fetchLeaderboards();
  }, [fetchLeaderboards]);
  
  // Filter scores by time
  const getFilteredScores = (scoresList: any[], filter: 'all' | 'week' | 'month') => {
    if (!scoresList || !scoresList.length) return [];
    
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
    
    return scoresList.filter(score => new Date(score.createdAt) > cutoffDate);
  };
  
  const filteredQuizScores = getFilteredScores(quizScores, timeFilter);
  const filteredGameScores = getFilteredScores(gameScores, timeFilter);

  return (
    <div className="min-h-[60vh]">
      <LeaderboardHeader />
      
      <TimeFilter timeFilter={timeFilter} setTimeFilter={setTimeFilter} />
      
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
        
        <AnimatePresence mode="wait">
          <motion.div
            key={timeFilter}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <TabContent 
              activeTab="overview"
              isLoading={isLoading}
              leaderboard={leaderboard}
              filteredQuizScores={filteredQuizScores}
              filteredGameScores={filteredGameScores}
            />
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default LeaderboardSection;
