
import React from 'react';
import { TrendingTopics } from './TrendingTopics';
import { SuggestedUsers } from './SuggestedUsers';

// Sample trending topics
const TRENDING_TOPICS = [
  "#FinalsWeek",
  "#CampusEvents",
  "#StudyTips",
  "#ScholarshipDeadlines",
  "#InternshipOpportunities"
];

interface LeftSidebarProps {
  suggestedUsers: any[];
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ suggestedUsers }) => {
  return (
    <div className="hidden lg:block lg:col-span-1">
      <TrendingTopics topics={TRENDING_TOPICS} />
      
      <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <SuggestedUsers users={suggestedUsers} />
      </div>
    </div>
  );
};
