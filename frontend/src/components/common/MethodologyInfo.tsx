import React, { useState } from 'react';

/**
 * MethodologyInfo component
 * 
 * Displays information about the methodology used for the uncertainty analysis
 * with an expandable/collapsible interface
 */
const MethodologyInfo: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-6">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Methodology</h2>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 space-y-3">
          <p>
            This analysis examines the prevalence and context of economic uncertainty in news media using the following methodology:
          </p>
          
          <div className="pl-4 border-l-2 border-blue-200 dark:border-blue-800">
            <h4 className="font-medium mb-2">About the GDELT Dataset:</h4>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                <strong>Global Database of Events, Language, and Tone (GDELT)</strong> monitors print, broadcast, and web news media in over 100 languages from across every country worldwide
              </li>
              <li>
                <strong>Comprehensive Coverage:</strong> Processes news content from tens of thousands of sources 24/7, capturing global society, behavior, and beliefs. Unfortunately, it does not include several major American financial news publications.
              </li>
            </ul>
            
            <h4 className="font-medium mb-2">Analysis Methodology:</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Data Source:</strong> GDELT NGrams dataset, which provides n-gram analysis of global news content
              </li>
              <li>
                <strong>Uncertainty Mentions:</strong> Each article that uses the term "uncertainty" is counted as a single mention
              </li>
              <li>
                <strong>Co-occurrence Analysis:</strong> Words appearing within 7 positions before or after "uncertainty" are analyzed (NGrams uses 15-word windows)
              </li>
              <li>
                <strong>Data Processing:</strong> Common filler words and stopwords are filtered out to focus on meaningful associations
              </li>
              <li>
                <strong>Time Series:</strong> Daily counts are aggregated with optional smoothing to identify trends
              </li>
            </ul>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
            Note: This methodology focuses on frequency analysis and does not account for sentiment or contextual nuance beyond word proximity. The GDELT dataset represents a vast collection of global news reporting rather than a curated academic dataset, so results should be interpreted as reflective of media coverage patterns rather than definitive economic indicators.
          </p>
        </div>
      )}
    </div>
  );
};

export default MethodologyInfo;
