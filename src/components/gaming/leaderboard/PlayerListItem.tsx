
import React from 'react';
import { motion } from 'framer-motion';
import { Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeaderboardUser } from '@/contexts/GamingContext';

interface PlayerListItemProps {
  player: LeaderboardUser;
  index: number;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({ player, index }) => {
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-500";
      case 1: return "text-gray-400";
      case 2: return "text-amber-600";
      default: return "text-gray-700";
    }
  };

  return (
    <motion.div 
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
              {player.userName?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{player.userName || 'Anonymous'}</p>
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
  );
};

export default PlayerListItem;
