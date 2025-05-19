import React from 'react';

interface SmoothingControlProps {
  smoothingDays: number;
  onSmoothingChange: (days: number) => void;
}

/**
 * Smoothing control component for time series charts
 * 
 * Provides a compact interface for adjusting the smoothing window
 */
const SmoothingControl: React.FC<SmoothingControlProps> = ({
  smoothingDays,
  onSmoothingChange,
}) => {
  return (
    <div className="absolute top-2 right-2 z-10 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 p-1">
      <div className="flex items-center space-x-1">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Smoothing:</span>
        {[1, 7, 14, 30].map(days => (
          <button
            key={days}
            onClick={() => onSmoothingChange(days)}
            className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
              smoothingDays === days
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {days === 1 ? 'None' : `${days}d`}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SmoothingControl;
