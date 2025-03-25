
import React from 'react';
import { motion } from 'framer-motion';
import { Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { QuizScore, GameScore } from '@/contexts/GamingContext';

interface ScoresTableProps {
  scores: QuizScore[] | GameScore[];
  type: 'quiz' | 'game';
}

const ScoresTable: React.FC<ScoresTableProps> = ({ scores, type }) => {
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return "text-yellow-500";
      case 1: return "text-gray-400";
      case 2: return "text-amber-600";
      default: return "text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {type === 'quiz' ? 'Quiz' : 'Game'}
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {type === 'quiz' ? 'Time' : 'Level'}
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {scores.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No {type} scores available for this time period
                </td>
              </tr>
            ) : (
              scores.slice(0, 10).map((score, index) => (
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
                        <AvatarImage src={score.profilePic} />
                        <AvatarFallback className="bg-sfu-red/10 text-sfu-red">
                          {score.userName?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{score.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">
                      {type === 'quiz' 
                        ? (score as QuizScore).quizName 
                        : (score as GameScore).gameName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-sfu-red">{score.score}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {type === 'quiz' ? (
                      <span className="text-sm text-gray-600">
                        {Math.floor((score as QuizScore).timeTaken / 60)}:{((score as QuizScore).timeTaken % 60).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">{(score as GameScore).level}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {new Date(score.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoresTable;
