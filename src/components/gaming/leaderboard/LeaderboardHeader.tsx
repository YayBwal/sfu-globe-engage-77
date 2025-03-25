
import React from 'react';
import { Trophy } from 'lucide-react';

const LeaderboardHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <div className="w-20 h-20 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mx-auto mb-6">
        <Trophy size={32} />
      </div>
      <h2 className="text-2xl font-display font-bold mb-2">Leaderboard</h2>
      <p className="text-gray-600">See how you stack up against other players based on your quiz scores.</p>
    </div>
  );
};

export default LeaderboardHeader;
