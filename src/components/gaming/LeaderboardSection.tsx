
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGaming } from '@/contexts/GamingContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Medal, Trophy } from 'lucide-react';
import LeaderboardHeader from './leaderboard/LeaderboardHeader';
import LoadingSpinner from './leaderboard/LoadingSpinner';

const LeaderboardSection: React.FC = () => {
  const { leaderboard = [], isLoading, fetchLeaderboards } = useGaming();
  
  // Fetch leaderboard data when component mounts
  useEffect(() => {
    fetchLeaderboards();
  }, [fetchLeaderboards]);

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
      <LeaderboardHeader />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-medium">Top Players</h3>
            <Trophy size={20} className="text-sfu-red" />
          </div>
          
          {leaderboard.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No scores recorded yet. Play a quiz to appear on the leaderboard!
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((player, index) => (
                <motion.div 
                  key={player.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center p-4 rounded-lg ${index === 0 ? 'bg-yellow-50 border border-yellow-100' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-8 text-center mr-3">
                    {index < 3 ? (
                      <Medal size={20} className={getMedalColor(index)} />
                    ) : (
                      <span className="text-gray-500 font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarImage src={player.profilePic} />
                    <AvatarFallback className="bg-sfu-red/10 text-sfu-red">
                      {player.userName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="font-medium">{player.userName || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">
                      {player.quizCount} quizzes completed
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-sfu-red">{player.totalScore}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          <div className="mt-8 bg-sfu-red/5 p-4 rounded-lg border border-sfu-red/10">
            <h4 className="font-medium mb-2">How Points Are Earned</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Each correct quiz answer: 10 points</li>
              <li>• Quiz completion bonus: 20 points</li>
              <li>• Fast completion bonus: Up to 30 points</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardSection;
