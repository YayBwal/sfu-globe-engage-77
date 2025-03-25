
import React from 'react';
import { LeaderboardUser, QuizScore, GameScore } from '@/contexts/GamingContext';
import TopPlayersCard from './TopPlayersCard';
import TopScoreCard from './TopScoreCard';
import WeeklyChallenge from './WeeklyChallenge';
import LoadingSpinner from './LoadingSpinner';

interface OverviewPanelProps {
  isLoading: boolean;
  leaderboard: LeaderboardUser[];
  quizScores: QuizScore[];
  gameScores: GameScore[];
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({ 
  isLoading, 
  leaderboard, 
  quizScores, 
  gameScores 
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <TopPlayersCard leaderboard={leaderboard} />
        <TopScoreCard title="Top Quiz Scores" scores={quizScores} type="quiz" />
        <TopScoreCard title="Top Game Scores" scores={gameScores} type="game" />
      </div>
      <WeeklyChallenge />
    </>
  );
};

export default OverviewPanel;
