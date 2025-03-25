
import React from 'react';
import { Trophy } from 'lucide-react';
import { LeaderboardUser } from '@/contexts/GamingContext';
import PlayerListItem from './PlayerListItem';

interface TopPlayersCardProps {
  leaderboard: LeaderboardUser[];
}

const TopPlayersCard: React.FC<TopPlayersCardProps> = ({ leaderboard }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-medium">Top Players</h3>
        <Trophy size={20} className="text-sfu-red" />
      </div>
      
      <div className="space-y-4">
        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.slice(0, 5).map((player, index) => (
            <PlayerListItem key={player.userId} player={player} index={index} />
          ))
        ) : (
          <div className="py-4 text-center text-gray-500">
            No leaderboard data available yet
          </div>
        )}
      </div>
    </div>
  );
};

export default TopPlayersCard;
