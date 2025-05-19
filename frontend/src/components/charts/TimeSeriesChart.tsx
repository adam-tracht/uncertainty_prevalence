import React, { useMemo, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { applySmoothing } from '../../utils/dataUtils';
import type { TimeSeriesDataPoint } from '../../utils/dataUtils';
import SmoothingControl from './SmoothingControl';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  title?: string;
  smoothingDays?: number;
  onSmoothingChange?: (days: number) => void;
  height?: number;
  showLegend?: boolean;
  isLoading?: boolean;
  showSmoothingControl?: boolean;
}

/**
 * Time Series Chart component for visualizing uncertainty mentions over time
 */
const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  smoothingDays = 7,
  onSmoothingChange,
  height = 500, // Increased from 300 to 400 for better trend visibility
  showLegend = true,
  isLoading = false,
  showSmoothingControl = false,
}) => {
  // Apply smoothing to the data if needed
  const processedData = useMemo(() => {
    if (data.length === 0) return [];
    return smoothingDays > 1 ? applySmoothing(data, smoothingDays) : data;
  }, [data, smoothingDays]);

  // Format dates for display
  const labels = useMemo(() => {
    return processedData.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
  }, [processedData]);

  // Prepare chart data
  const chartData = {
    labels,
    datasets: [
      {
        label: smoothingDays > 1 
          ? `Uncertainty Mentions (${smoothingDays}-day avg)` 
          : 'Uncertainty Mentions',
        data: processedData.map(point => point.count),
        borderColor: 'rgb(59, 130, 246)', // Tailwind blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 2,
        pointRadius: 0, // Remove circles for data points
        pointHoverRadius: 5, // Keep circles visible on hover
        tension: 0.3, // Slight curve for better visualization
      },
    ],
  };

  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        // Add padding to the legend to prevent overlap with the smoothing control
        labels: {
          padding: showSmoothingControl ? 20 : 10,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            return `Mentions: ${context.parsed.y.toFixed(1)}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          padding: 10, // Increased padding to prevent overflow
          font: {
            size: () => {
              // Use smaller font size on mobile devices
              return window.innerWidth < 640 ? 10 : 12;
            }
          }
        },
        // Add bottom padding to ensure labels don't overflow
        afterFit: (scale) => {
          // Add more padding on mobile
          scale.paddingBottom = window.innerWidth < 640 ? 25 : 15;
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Mentions',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  if (isLoading || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg"
        style={{ height: `${height}px` }}
      >
        {isLoading ? (
          <div className="text-gray-500 dark:text-gray-400">Loading data...</div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400">No data available</div>
        )}
      </div>
    );
  }

  // Calculate the chart height, with responsive sizing
  // Use a smaller height on mobile devices
  const [chartHeight, setChartHeight] = useState(height);
  
  // Effect to handle responsive height changes
  useEffect(() => {
    const handleResize = () => {
      // Check if we're on a mobile device (screen width < 640px, Tailwind's sm breakpoint)
      const isMobile = window.innerWidth < 640;
      // Set height to 450px on mobile (increased from 400px), otherwise use the provided height
      setChartHeight(isMobile ? Math.min(450, height) : height);
    };
    
    // Set initial height
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, [height]);
  
  return (
    <div className="relative px-0 sm:px-6 md:px-10">
      <div style={{ height: `${chartHeight}px` }} className="relative">
        {/* Position the smoothing control absolutely on desktop, but keep it in normal flow on mobile */}
        {showSmoothingControl && onSmoothingChange && (
          <div className="block sm:absolute sm:top-0 sm:right-0 sm:z-10 mb-2 sm:mb-0">
            <SmoothingControl 
              smoothingDays={smoothingDays} 
              onSmoothingChange={onSmoothingChange} 
            />
          </div>
        )}
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TimeSeriesChart;
