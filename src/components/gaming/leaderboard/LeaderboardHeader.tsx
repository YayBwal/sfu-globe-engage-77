
import React from 'react';
import { Trophy } from 'lucide-react';

interface LeaderboardHeaderProps {
  onCreateSession?: () => void;
  showSessionControls?: boolean;
}

const LeaderboardHeader: React.FC<LeaderboardHeaderProps> = ({ 
  onCreateSession,
  showSessionControls = false
}) => {
  return (
    <div className="text-center mb-8">
      <div className="w-20 h-20 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mx-auto mb-6">
        <Trophy size={32} />
      </div>
      <h2 className="text-2xl font-display font-bold mb-2">Leaderboard</h2>
      <p className="text-gray-600 mb-4">See how you stack up against other players based on your quiz scores.</p>
      
      {showSessionControls && (
        <div className="mt-4">
          <button 
            onClick={onCreateSession}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-sfu-red text-white hover:bg-sfu-red/90 transition-colors"
          >
            Create New Session
          </button>
        </div>
      )}
    </div>
  );
};

export default LeaderboardHeader;
