import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { CoOccurrenceItem } from '../../utils/dataUtils';

interface CoOccurrenceMatrixProps {
  data: CoOccurrenceItem[];
  width?: number;
  height?: number;
  isLoading?: boolean;
  minFrequency?: number;
  maxTerms?: number;
}

/**
 * Co-occurrence Matrix component for visualizing relationships between terms
 */
const CoOccurrenceMatrix: React.FC<CoOccurrenceMatrixProps> = ({
  data,
  width = 800,
  height = 500,
  isLoading = false,
  minFrequency = 5,
  maxTerms = 20,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ term: string; value: number; x: number; y: number } | null>(null);

  // Filter and sort data
  const filteredData = data
    .filter(item => item.co_occurrences_with_uncertainty >= minFrequency)
    .sort((a, b) => b.co_occurrences_with_uncertainty - a.co_occurrences_with_uncertainty)
    .slice(0, maxTerms);

  useEffect(() => {
    if (isLoading || filteredData.length === 0 || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    // Define margins
    const margin = { top: 60, right: 40, bottom: 100, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create a group for the matrix
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Extract terms and create a symmetric dataset for the matrix
    const terms = filteredData.map(d => d.word);
    
    // Create a simple matrix where each term has a relationship with "uncertainty"
    // In a real co-occurrence matrix, you would have relationships between all terms
    const matrixData: { x: string; y: string; value: number }[] = [];
    
    // Add relationships with "uncertainty"
    filteredData.forEach(item => {
      matrixData.push({
        x: "uncertainty",
        y: item.word,
        value: item.co_occurrences_with_uncertainty
      });
      
      // Add the symmetric relationship
      matrixData.push({
        x: item.word,
        y: "uncertainty",
        value: item.co_occurrences_with_uncertainty
      });
    });
    
    // Add "uncertainty" to the terms list
    const allTerms = ["uncertainty", ...terms];
    
    // Create scales
    const xScale = d3.scaleBand()
      .domain(allTerms)
      .range([0, innerWidth])
      .padding(0.1);
    
    const yScale = d3.scaleBand()
      .domain(allTerms)
      .range([0, innerHeight])
      .padding(0.1);
    
    // Color scale for the cells
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(filteredData, d => d.co_occurrences_with_uncertainty) || 1]);
    
    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em');
    
    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(yScale));
    
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Term Co-occurrence with "Uncertainty"');
    
    // Create the matrix cells
    g.selectAll('rect')
      .data(matrixData)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.x) || 0)
      .attr('y', d => yScale(d.y) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('fill', d => d.value ? colorScale(d.value) : '#f8f9fa')
      .style('stroke', '#e9ecef')
      .style('stroke-width', 1)
      .on('mouseover', function(event, d) {
        // Highlight cell
        d3.select(this)
          .style('stroke', '#212529')
          .style('stroke-width', 2);
        
        // Show tooltip
        const [mouseX, mouseY] = d3.pointer(event, svgRef.current);
        setTooltip({
          term: `${d.x} → ${d.y}`,
          value: d.value,
          x: mouseX,
          y: mouseY
        });
      })
      .on('mouseout', function() {
        // Reset cell style
        d3.select(this)
          .style('stroke', '#e9ecef')
          .style('stroke-width', 1);
        
        // Hide tooltip
        setTooltip(null);
      });
    
    // Add a legend
    const legendWidth = 20;
    const legendHeight = 200;
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);
    
    // Create gradient for legend
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');
    
    // Add color stops
    const colorDomain = colorScale.domain();
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colorScale(colorDomain[0]));
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colorScale(colorDomain[1]));
    
    // Add legend rectangle
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');
    
    // Add legend scale
    const legendScale = d3.scaleLinear()
      .domain([colorDomain[0], colorDomain[1]])
      .range([legendHeight, 0]);
    
    const legendAxis = d3.axisRight(legendScale)
      .ticks(5);
    
    legend.append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis);
    
    // Add legend title
    legend.append('text')
      .attr('transform', `translate(${legendWidth / 2}, -10)`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Co-occurrences');
    
  }, [filteredData, width, height, isLoading, minFrequency, maxTerms]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg" style={{ width, height }}>
        <div className="text-gray-500 dark:text-gray-400">Loading data...</div>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg" style={{ width, height }}>
        <div className="text-gray-500 dark:text-gray-400">No data available</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Tooltip */}
      {tooltip && (
        <div 
          className="absolute bg-white dark:bg-gray-800 p-2 rounded shadow-lg text-sm z-10"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <div className="font-bold">{tooltip.term}</div>
          <div>Co-occurrences: {tooltip.value}</div>
        </div>
      )}
    </div>
  );
};

export default CoOccurrenceMatrix;
