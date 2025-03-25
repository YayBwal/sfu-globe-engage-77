
import React from 'react';
import { BookOpen, Gamepad } from 'lucide-react';
import { QuizScore, GameScore } from '@/contexts/GamingContext';
import ScoreListItem from './ScoreListItem';

interface TopScoreCardProps {
  title: string;
  scores: QuizScore[] | GameScore[];
  type: 'quiz' | 'game';
}

const TopScoreCard: React.FC<TopScoreCardProps> = ({ title, scores, type }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-medium">{title}</h3>
        {type === 'quiz' ? (
          <BookOpen size={20} className="text-sfu-red" />
        ) : (
          <Gamepad size={20} className="text-sfu-red" />
        )}
      </div>
      
      {scores.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No {type} scores yet
        </div>
      ) : (
        <div className="space-y-4">
          {scores.slice(0, 5).map((score, index) => (
            <ScoreListItem 
              key={score.id} 
              score={score} 
              index={index} 
              type={type} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TopScoreCard;
