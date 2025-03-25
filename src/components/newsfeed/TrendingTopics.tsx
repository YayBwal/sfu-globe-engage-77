
import React from 'react';

interface TrendingTopicsProps {
  topics: string[];
}

export const TrendingTopics: React.FC<TrendingTopicsProps> = ({ topics }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
      <h3 className="font-semibold mb-4">Trending Topics</h3>
      <ul className="space-y-3">
        {topics.map((topic, index) => (
          <li key={index}>
            <a href="#" className="text-sfu-red hover:underline text-sm">
              {topic}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
