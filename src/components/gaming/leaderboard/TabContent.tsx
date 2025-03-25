
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import OverviewPanel from './OverviewPanel';
import ScoresTable from './ScoresTable';
import LoadingSpinner from './LoadingSpinner';
import { LeaderboardUser, QuizScore, GameScore } from '@/contexts/GamingContext';

interface TabContentProps {
  activeTab: string;
  isLoading: boolean;
  leaderboard: LeaderboardUser[];
  filteredQuizScores: QuizScore[];
  filteredGameScores: GameScore[];
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  isLoading,
  leaderboard,
  filteredQuizScores,
  filteredGameScores
}) => {
  return (
    <>
      <TabsContent value="overview" className="mt-0">
        <OverviewPanel 
          isLoading={isLoading}
          leaderboard={leaderboard}
          quizScores={filteredQuizScores}
          gameScores={filteredGameScores}
        />
      </TabsContent>
      
      <TabsContent value="quizzes" className="mt-0">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <ScoresTable scores={filteredQuizScores} type="quiz" />
        )}
      </TabsContent>
      
      <TabsContent value="games" className="mt-0">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <ScoresTable scores={filteredGameScores} type="game" />
        )}
      </TabsContent>
    </>
  );
};

export default TabContent;
