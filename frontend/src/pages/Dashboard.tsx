import { useState } from 'react';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import WordCloud from '../components/charts/WordCloud';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MethodologyInfo from '../components/common/MethodologyInfo';
import { 
  useUncertaintyMentions, 
  useWordCloudData, 
  processTimeSeriesData
} from '../utils/dataUtils';

/**
 * Dashboard page component
 * 
 * Displays an overview of uncertainty analysis with key metrics and visualizations
 */
const Dashboard = () => {
  // State for filters
  
  const [smoothingDays, setSmoothingDays] = useState(7);
  
  // Load uncertainty mentions data
  const { 
    data: mentionsData, 
    loading: mentionsLoading, 
    error: mentionsError 
  } = useUncertaintyMentions('/data/output/uncertainty_mentions.csv');
  
  // Load word cloud data
  const { 
    data: wordCloudData, 
    loading: wordCloudLoading, 
    error: wordCloudError 
  } = useWordCloudData('/data/output/word_cloud_data.json');
  
  // Process time series data
  const timeSeriesData = processTimeSeriesData(mentionsData);
  
  // Calculate stats
  const totalMentions = mentionsData.length;
  const topTerm = wordCloudData.length > 0 ? wordCloudData[0] : { text: 'N/A', value: 0 };
  
  // Find peak day
  const peakDay = timeSeriesData.reduce(
    (max, point) => point.count > max.count ? point : max,
    { date: new Date(), count: 0 }
  );

  return (
    <div className="space-y-6">      
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis of "Uncertainty" Mentions by the Press</h1>
        </div>
      </div>
      
      {/* Methodology Information */}
      <MethodologyInfo />

      {/* Smoothing filter has been moved to the chart */}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Time series chart */}
        <div className="card p-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Uncertainty Mentions Over Time</h3>
          {mentionsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner text="Loading time series data..." />
            </div>
          ) : mentionsError ? (
            <div className="h-64 flex items-center justify-center text-red-500">
              Error loading data: {mentionsError.message}
            </div>
          ) : (
            <TimeSeriesChart 
              data={timeSeriesData} 
              smoothingDays={smoothingDays}
              onSmoothingChange={setSmoothingDays}
              showSmoothingControl={true}
              height={500}
            />
          )}
        </div>
      </div>

      {/* Word cloud */}
      <div className="card p-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Terms Co-occurring with "Uncertainty"</h3>
        {wordCloudLoading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner text="Loading word cloud data..." />
          </div>
        ) : wordCloudError ? (
          <div className="h-64 flex items-center justify-center text-red-500">
            Error loading data: {wordCloudError.message}
          </div>
        ) : (
          <div className="min-h-[500px] sm:min-h-[350px]">
            <WordCloud 
              data={wordCloudData} 
              height={350}
              minFrequency={5}
            />
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total mentions */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Total Mentions</h3>
          {mentionsLoading ? (
            <LoadingSpinner size="sm" text="" />
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalMentions.toLocaleString()}</p>
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">From {mentionsData.length > 0 ? new Date(mentionsData[0].date).toLocaleDateString() : 'N/A'}</p>
            </>
          )}
        </div>
        
        {/* Top co-occurring term */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Top Term</h3>
          {wordCloudLoading ? (
            <LoadingSpinner size="sm" text="" />
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{topTerm.text}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{topTerm.value} co-occurrences</p>
            </>
          )}
        </div>
        
        {/* Peak day */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Peak Day</h3>
          {mentionsLoading ? (
            <LoadingSpinner size="sm" text="" />
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {peakDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{Math.round(peakDay.count)} mentions</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
