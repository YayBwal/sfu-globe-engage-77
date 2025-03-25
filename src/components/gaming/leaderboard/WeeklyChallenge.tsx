
import React from 'react';
import { ArrowUpRight, ChevronRight, BookOpen, Gamepad } from 'lucide-react';

const WeeklyChallenge: React.FC = () => {
  return (
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
  );
};

export default WeeklyChallenge;
