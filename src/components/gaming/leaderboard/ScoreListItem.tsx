
import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { QuizScore, GameScore } from '@/contexts/GamingContext';

interface ScoreListItemProps {
  score: QuizScore | GameScore;
  index: number;
  type: 'quiz' | 'game';
}

const ScoreListItem: React.FC<ScoreListItemProps> = ({ score, index, type }) => {
  return (
    <motion.div 
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
          {score.userName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {type === 'quiz' ? (score as QuizScore).quizName : (score as GameScore).gameName}
        </p>
      </div>
      
      <div className="ml-2 text-right">
        <p className="text-sm font-semibold text-sfu-red">{score.score}</p>
        {type === 'quiz' ? (
          <p className="text-xs text-gray-500">
            <Clock size={10} className="inline mr-1" />
            {Math.floor((score as QuizScore).timeTaken / 60)}:{((score as QuizScore).timeTaken % 60).toString().padStart(2, '0')}
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            Level {(score as GameScore).level}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ScoreListItem;
