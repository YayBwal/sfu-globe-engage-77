
import React from 'react';
import { Filter } from 'lucide-react';

interface TimeFilterProps {
  timeFilter: 'all' | 'week' | 'month';
  setTimeFilter: (filter: 'all' | 'week' | 'month') => void;
}

const TimeFilter: React.FC<TimeFilterProps> = ({ timeFilter, setTimeFilter }) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200 space-x-2">
        <Filter size={16} className="text-gray-400" />
        {['all', 'week', 'month'].map((filter) => (
          <button
            key={filter}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              timeFilter === filter 
                ? 'bg-sfu-red text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            onClick={() => setTimeFilter(filter as any)}
          >
            {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeFilter;
