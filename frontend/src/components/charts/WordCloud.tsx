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
      // For mobile (smaller screens), use a more square aspect ratio to improve readability
      let newHeight;
      if (parentWidth >= initialWidth) {
        // On desktop, use the full height
        newHeight = initialHeight;
      } else {
        // On mobile, use a more square aspect ratio (less wide, more tall)
        // This makes the word cloud more readable on narrow screens
        const mobileAspectRatio = 0.8; // Closer to square than the default landscape ratio
        newHeight = Math.max(newWidth * mobileAspectRatio, 400); // Ensure minimum height of 400px
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
    
    // Determine if we're on mobile based on container width
    const isMobile = dimensions.width < 640; // Using Tailwind's sm breakpoint
    
    // Use a higher minimum frequency threshold on mobile to show fewer words
    const effectiveMinFrequency = minFrequency;
    
    // Limit the number of words on mobile to prevent overcrowding
    const maxWordsOnMobile = 150;
    
    // Filter data based on minimum frequency and excluded terms
    let filteredData = data
      .filter(item => item.value >= effectiveMinFrequency)
      .filter(item => !excludeTerms.includes(item.text.toLowerCase()));
      
    // Further limit the number of words on mobile
    if (isMobile && filteredData.length > maxWordsOnMobile) {
      filteredData = filteredData.slice(0, maxWordsOnMobile);
    }
    
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
    const scaleFactor = width / initialWidth;
    
    // Adjust min/max font sizes based on scale factor and device
    // Increase minimum font size on mobile for better readability
    const adjustedMinFontSize = minFontSize * scaleFactor;
    // Increase maximum font size on mobile to make important words stand out more
    const adjustedMaxFontSize = maxFontSize * scaleFactor;
    
    // Font size scale
    const fontSizeScale = d3.scaleLinear<number>()
      .domain([
        d3.min(filteredData, d => d.value) || 0,
        d3.max(filteredData, d => d.value) || 1
      ])
      .range([adjustedMinFontSize, adjustedMaxFontSize]);
      
    // Use a more aggressive scaling on mobile to create more distinction between important and less important words
    if (isMobile) {
      // Apply a power scale to create more separation between small and large words
      const powerScale = 1.25; // Higher values create more distinction
      fontSizeScale.range([adjustedMinFontSize, adjustedMaxFontSize])
        .interpolate((a, b) => {
          return (t) => {
            // Apply power scaling to create more visual hierarchy
            const scaledT = Math.pow(t, powerScale);
            return a * (1 - scaledT) + b * scaledT;
          };
        });
    }
    
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
      className="relative w-full" 
      style={{
        // Always use the calculated height to ensure proper sizing
        height: `${dimensions.height}px`,
        minHeight: '400px' // Ensure a minimum height on all devices
      }}
    />
  );
};

export default WordCloud;
