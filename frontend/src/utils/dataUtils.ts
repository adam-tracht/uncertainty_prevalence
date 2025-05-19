/**
 * Data utility functions for loading and processing uncertainty data
 */

import { useState, useEffect } from 'react';

// Types for our data
export interface UncertaintyMention {
  date: Date;
  url: string;
  domain: string;
  keywords: string[];
  context: string;
  ngram: string;
}

export interface WordCloudItem {
  text: string;
  value: number;
}

export interface CoOccurrenceItem {
  word: string;
  co_occurrences_with_uncertainty: number;
}

export interface TimeSeriesDataPoint {
  date: Date;
  count: number;
}

/**
 * Parse CSV data into an array of objects
 * @param csvText The CSV text to parse
 * @returns Array of objects with keys from the header row
 */
export const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
};

/**
 * Load uncertainty mentions data from CSV
 * @param filePath Path to the CSV file
 * @returns Array of UncertaintyMention objects
 */
export const loadUncertaintyMentions = async (filePath: string): Promise<UncertaintyMention[]> => {
  try {
    const response = await fetch(filePath);
    const csvText = await response.text();
    const data = parseCSV(csvText);
    
    return data.map(row => ({
      date: new Date(row.date),
      url: row.url,
      domain: row.domain,
      keywords: row.keywords.replace(/[\[\]']/g, '').split(','),
      context: row.context,
      ngram: row.ngram
    }));
  } catch (error) {
    console.error('Error loading uncertainty mentions:', error);
    return [];
  }
};

/**
 * Load word cloud data from JSON
 * @param filePath Path to the JSON file
 * @returns Array of WordCloudItem objects
 */
export const loadWordCloudData = async (filePath: string): Promise<WordCloudItem[]> => {
  try {
    const response = await fetch(filePath);
    const data = await response.json();
    
    // Check if data is already in the correct format (array of objects with text and value)
    if (Array.isArray(data) && data.length > 0 && 'text' in data[0] && 'value' in data[0]) {
      return data.sort((a, b) => b.value - a.value); // Sort by value in descending order
    }
    
    // Handle the old format (object with word keys and count values)
    return Object.entries(data)
      .map(([text, value]) => ({
        text,
        value: value as number
      }))
      .sort((a, b) => b.value - a.value); // Sort by value in descending order
  } catch (error) {
    console.error('Error loading word cloud data:', error);
    return [];
  }
};

/**
 * Load co-occurrence data from CSV
 * @param filePath Path to the CSV file
 * @returns Array of CoOccurrenceItem objects
 */
export const loadCoOccurrenceData = async (filePath: string): Promise<CoOccurrenceItem[]> => {
  try {
    const response = await fetch(filePath);
    const csvText = await response.text();
    const data = parseCSV(csvText);
    
    return data.map(row => ({
      word: row.word,
      co_occurrences_with_uncertainty: parseInt(row.co_occurrences_with_uncertainty, 10)
    }))
    .sort((a, b) => b.co_occurrences_with_uncertainty - a.co_occurrences_with_uncertainty); // Sort by co-occurrence count in descending order
  } catch (error) {
    console.error('Error loading co-occurrence data:', error);
    return [];
  }
};

/**
 * Process uncertainty mentions into time series data
 * @param mentions Array of UncertaintyMention objects
 * @returns Array of TimeSeriesDataPoint objects
 */
export const processTimeSeriesData = (mentions: UncertaintyMention[]): TimeSeriesDataPoint[] => {
  // Group mentions by date
  const mentionsByDate = mentions.reduce((acc, mention) => {
    // Create a date string without time component for grouping
    const dateStr = mention.date.toISOString().split('T')[0];
    
    if (!acc[dateStr]) {
      acc[dateStr] = 0;
    }
    
    acc[dateStr]++;
    return acc;
  }, {} as Record<string, number>);
  
  // Convert to array of data points
  return Object.entries(mentionsByDate)
    .map(([dateStr, count]) => ({
      date: new Date(dateStr),
      count
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

/**
 * Apply smoothing to time series data (moving average)
 * @param data Array of TimeSeriesDataPoint objects
 * @param windowSize Size of the moving average window
 * @returns Smoothed array of TimeSeriesDataPoint objects
 */
export const applySmoothing = (
  data: TimeSeriesDataPoint[],
  windowSize: number
): TimeSeriesDataPoint[] => {
  if (windowSize <= 1 || data.length <= windowSize) {
    return data;
  }
  
  return data.map((point, index) => {
    // For points at the beginning, use smaller window
    const actualWindowSize = Math.min(windowSize, index + 1);
    const startIdx = Math.max(0, index - actualWindowSize + 1);
    const window = data.slice(startIdx, index + 1);
    
    const sum = window.reduce((acc, curr) => acc + curr.count, 0);
    const average = sum / window.length;
    
    return {
      date: point.date,
      count: average
    };
  });
};

/**
 * Custom hook to load uncertainty mentions data
 * @param filePath Path to the CSV file
 * @returns Object with data, loading state, and error
 */
export const useUncertaintyMentions = (filePath: string) => {
  const [data, setData] = useState<UncertaintyMention[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const mentions = await loadUncertaintyMentions(filePath);
        setData(mentions);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filePath]);
  
  return { data, loading, error };
};

/**
 * Custom hook to load word cloud data
 * @param filePath Path to the JSON file
 * @returns Object with data, loading state, and error
 */
export const useWordCloudData = (filePath: string) => {
  const [data, setData] = useState<WordCloudItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const wordCloudData = await loadWordCloudData(filePath);
        setData(wordCloudData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filePath]);
  
  return { data, loading, error };
};

/**
 * Custom hook to load co-occurrence data
 * @param filePath Path to the CSV file
 * @returns Object with data, loading state, and error
 */
export const useCoOccurrenceData = (filePath: string) => {
  const [data, setData] = useState<CoOccurrenceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const coOccurrenceData = await loadCoOccurrenceData(filePath);
        setData(coOccurrenceData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filePath]);
  
  return { data, loading, error };
};
