import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { WordCloudItem } from '../../utils/dataUtils';
// Import d3-cloud package for word cloud layout
import cloud from 'd3-cloud';

interface WordCloudProps {
  data: WordCloudItem[];
  width?: number;
  height?: number;
  minFontSize?: number;
  maxFontSize?: number;
  padding?: number;
  isLoading?: boolean;
  minFrequency?: number;
  excludeTerms?: string[];
}

// Define a custom type for the word data
interface WordData {
  text: string;
  size: number;
  value: number;
  x: number;
  y: number;
  rotate: number;
}

/**
 * Word Cloud component for visualizing terms co-occurring with "uncertainty"
 * This implementation uses a completely different approach with a static HTML structure
 * and is responsive to container size
 */
const WordCloud: React.FC<WordCloudProps> = ({
  data,
  width: initialWidth = 800,
  height: initialHeight = 400,
  minFontSize = 12,
  maxFontSize = 80,
  padding = 2,
  isLoading = false,
  minFrequency = 5,
  excludeTerms = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });
  
  // Update dimensions when window resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      // Get the parent container width
      const parentWidth = containerRef.current.parentElement?.clientWidth || initialWidth;
      
      // Calculate responsive dimensions
      // Use the parent width and maintain aspect ratio for height
      const newWidth = Math.min(parentWidth, initialWidth);
      
      // For desktop (larger screens), use the initial height to ensure proper display
      // For mobile (smaller screens), scale the height proportionally
      let newHeight;
      if (parentWidth >= initialWidth) {
        // On desktop, use the full height
        newHeight = initialHeight;
      } else {
        // On mobile, scale height proportionally
        const aspectRatio = initialHeight / initialWidth;
        newHeight = newWidth * aspectRatio;
      }
      
      setDimensions({ width: newWidth, height: newHeight });
    };
    
    // Initial calculation
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateDimensions);
  }, [initialWidth, initialHeight]);
  
  // Create the visualization when dimensions or data changes
  useEffect(() => {
    if (isLoading || !containerRef.current) return;
    
    // Filter data based on minimum frequency and excluded terms
    const filteredData = data
      .filter(item => item.value >= minFrequency)
      .filter(item => !excludeTerms.includes(item.text.toLowerCase()));
    
    if (filteredData.length === 0) return;
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    
    // Create a div for the tooltip that's completely outside of React's control
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute bg-white dark:bg-gray-800 p-2 rounded shadow-lg text-sm z-10';
    tooltip.style.display = 'none';
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none'; // Critical: prevent tooltip from affecting layout
    document.body.appendChild(tooltip); // Append to body instead of container
    
    // Get current dimensions
    const { width, height } = dimensions;
    
    // Create SVG element using plain DOM instead of D3
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    // Set SVG attributes for proper scaling
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); // This helps with centering
    
    // Set SVG styles
    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = '100%';
    
    // Position the SVG to fill the container
    svg.style.position = 'absolute';
    svg.style.left = '0';
    svg.style.top = '0';
    
    containerRef.current.appendChild(svg);
    
    // Create group for centering the word cloud
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${width / 2},${height / 2})`);
    svg.appendChild(g);
    
    // Scale font size based on current dimensions
    // For smaller screens, reduce the max font size proportionally
    const scaleFactor = Math.min(width / initialWidth, 1);
    const adjustedMaxFontSize = maxFontSize * scaleFactor;
    const adjustedMinFontSize = Math.max(minFontSize * scaleFactor, 8); // Don't go below 8px
    
    // Create scale for font size
    const fontSizeScale = d3.scaleLinear<number>()
      .domain([
        d3.min(filteredData, d => d.value) || minFrequency,
        d3.max(filteredData, d => d.value) || minFrequency
      ])
      .range([adjustedMinFontSize, adjustedMaxFontSize]);
    
    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Prepare the data for the word cloud
    const wordData = filteredData.map(d => ({ 
      text: d.text, 
      size: fontSizeScale(d.value),
      value: d.value,
      x: 0,
      y: 0,
      rotate: 0
    }));
    
    // Create word cloud layout
    const layout = cloud<WordData>()
      .size([width, height])
      .words(wordData)
      .padding(padding * scaleFactor) // Scale padding too
      .rotate(() => 0) // No rotation for better readability
      .fontSize(d => d.size)
      .on('end', (words: WordData[]) => {
        // Draw the word cloud using plain DOM operations
        words.forEach((word, i) => {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.textContent = word.text;
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('transform', `translate(${word.x},${word.y})`);
          text.style.fontSize = `${word.size}px`;
          text.style.fill = colorScale(i.toString());
          text.style.cursor = 'pointer';
          
          // Store the original size for later use
          text.dataset.originalSize = word.size.toString();
          text.dataset.value = word.value.toString();
          
          // Add event listeners
          text.addEventListener('mouseover', function(event) {
            // Show tooltip
            tooltip.innerHTML = `
              <div class="font-bold">${word.text}</div>
              <div>Occurrences: ${word.value}</div>
            `;
            
            // Position tooltip relative to the cursor position
            const offset = 15; // Offset from cursor
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.pageX}px`;
            tooltip.style.top = `${event.pageY - offset}px`;
            tooltip.style.transform = 'translate(-50%, -100%)';
            
            // Highlight word
            text.style.fontSize = `${word.size * 1.2}px`;
            text.style.fontWeight = 'bold';
          });
          
          text.addEventListener('mouseout', function() {
            // Hide tooltip
            tooltip.style.display = 'none';
            
            // Reset word style
            text.style.fontSize = `${word.size}px`;
            text.style.fontWeight = 'normal';
          });
          
          g.appendChild(text);
        });
      });
    
    // Start layout calculation
    layout.start();
    
    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    };
  }, [data, dimensions, minFontSize, maxFontSize, padding, isLoading, minFrequency, excludeTerms, initialWidth]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg" style={{ width: dimensions.width, height: dimensions.height }}>
        <div className="text-gray-500 dark:text-gray-400">Loading data...</div>
      </div>
    );
  }
  
  const filteredData = data
    .filter(item => item.value >= minFrequency)
    .filter(item => !excludeTerms.includes(item.text.toLowerCase()));
  
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg" style={{ width: dimensions.width, height: dimensions.height }}>
        <div className="text-gray-500 dark:text-gray-400">No data available</div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-96" // Use Tailwind's h-96 class (384px) for consistent height
      style={{
        // Only override the height on smaller screens
        ...(dimensions.width < initialWidth && { height: dimensions.height })
      }}
    />
  );
};

export default WordCloud;
