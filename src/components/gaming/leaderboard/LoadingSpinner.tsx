
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center py-10">
      <div className="w-10 h-10 border-4 border-sfu-red/20 border-t-sfu-red rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
