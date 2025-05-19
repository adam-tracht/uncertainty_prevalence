import React, { useMemo } from 'react';
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
  height = 300,
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
        pointRadius: 3,
        pointHoverRadius: 5,
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

  return (
    <div style={{ height: `${height}px` }} className="relative">
      {showSmoothingControl && onSmoothingChange && (
        <SmoothingControl 
          smoothingDays={smoothingDays} 
          onSmoothingChange={onSmoothingChange} 
        />
      )}
      <Line data={chartData} options={options} />
    </div>
  );
};

export default TimeSeriesChart;
