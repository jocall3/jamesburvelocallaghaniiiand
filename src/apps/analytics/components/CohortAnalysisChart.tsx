import React, { useMemo, useState, useCallback } from 'react';

// Define types for the cohort data
interface CohortPeriodData {
  period: number; // e.g., 0 for signup month, 1 for next month, etc.
  retainedUsers: number;
  totalUsersInCohort: number;
  retentionRate: number; // 0 to 1
}

interface Cohort {
  id: string; // e.g., "Jan 2023"
  startDate: string; // ISO date string, e.g., "2023-01-01"
  size: number; // total users in this cohort
  periods: CohortPeriodData[];
}

interface CohortAnalysisChartProps {
  data: Cohort[];
  title?: string;
  description?: string;
  // Optional: Customize colors for the heatmap gradient
  minColor?: string; // Hex color for lowest retention
  maxColor?: string; // Hex color for highest retention
}

const CohortAnalysisChart: React.FC<CohortAnalysisChartProps> = ({
  data,
  title = "Customer Cohort Retention",
  description = "Visualizing customer retention rates over time for different acquisition cohorts.",
  minColor = "#e0f2f7", // Light blue
  maxColor = "#01579b", // Dark blue
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm text-center text-gray-500">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <p>No cohort data available to display.</p>
      </div>
    );
  }

  // Determine the maximum number of periods across all cohorts to set X-axis length
  const maxPeriods = useMemo(() => {
    return Math.max(...data.map(cohort => cohort.periods.length));
  }, [data]);

  const cellSize = 35; // Size of each square cell in the heatmap
  const padding = 60; // Padding for axis labels around the heatmap grid

  // Calculate SVG dimensions based on data and cell size
  const svgWidth = padding + maxPeriods * cellSize + 20; // +20 for a little extra space
  const svgHeight = padding + data.length * cellSize + 20;

  const xAxisLabels = Array.from({ length: maxPeriods }, (_, i) => `Month ${i}`);
  const yAxisLabels = data.map(cohort => cohort.id);

  // Function to interpolate color based on retention rate (0 to 1)
  const getColor = useCallback((rate: number) => {
    if (rate === null || isNaN(rate)) return '#f0f0f0'; // Grey for no data or invalid rate

    // Convert hex colors to RGB components
    const hexToRgb = (hex: string) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });

    const rgb1 = hexToRgb(minColor);
    const rgb2 = hexToRgb(maxColor);

    // Linear interpolation for each RGB component
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * rate);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * rate);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * rate);

    return `rgb(${r},${g},${b})`;
  }, [minColor, maxColor]);

  // State for managing the tooltip visibility and content
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });

  // Event handler for showing the tooltip on mouse enter
  const handleMouseEnter = (
    event: React.MouseEvent<SVGRectElement>,
    cohortId: string,
    period: number,
    dataPoint: CohortPeriodData | undefined
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // Position tooltip relative to the center of the hovered cell
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    let content = `<span class="font-bold">Cohort:</span> ${cohortId}<br/>`;
    content += `<span class="font-bold">Period:</span> Month ${period}`;
    if (dataPoint) {
      content += `<br/><span class="font-bold">Retention:</span> ${(dataPoint.retentionRate * 100).toFixed(1)}%`;
      content += `<br/><span class="font-bold">Users:</span> ${dataPoint.retainedUsers} / ${dataPoint.totalUsersInCohort}`;
    } else {
      content += `<br/>No data`;
    }

    setTooltip({ visible: true, x, y, content });
  };

  // Event handler for hiding the tooltip on mouse leave
  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, content: '' });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm relative overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="font-sans text-xs"
      >
        {/* Y-axis labels (Cohorts) */}
        {yAxisLabels.map((label, index) => (
          <text
            key={`y-label-${index}`}
            x={padding - 10}
            y={padding + index * cellSize + cellSize / 2}
            textAnchor="end"
            alignmentBaseline="middle"
            className="fill-gray-600"
          >
            {label} ({data[index].size})
          </text>
        ))}

        {/* X-axis labels (Periods) */}
        {xAxisLabels.map((label, index) => (
          <text
            key={`x-label-${index}`}
            x={padding + index * cellSize + cellSize / 2}
            y={padding - 10}
            textAnchor="middle"
            alignmentBaseline="baseline"
            className="fill-gray-600"
          >
            {label}
          </text>
        ))}

        {/* Heatmap cells */}
        {data.map((cohort, cohortIndex) => (
          <React.Fragment key={cohort.id}>
            {Array.from({ length: maxPeriods }).map((_, periodIndex) => {
              const dataPoint = cohort.periods.find(p => p.period === periodIndex);
              const retentionRate = dataPoint ? dataPoint.retentionRate : null;
              const fillColor = getColor(retentionRate !== null ? retentionRate : NaN); // Pass NaN for missing data

              return (
                <rect
                  key={`${cohort.id}-${periodIndex}`}
                  x={padding + periodIndex * cellSize}
                  y={padding + cohortIndex * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={fillColor}
                  stroke="#ccc"
                  strokeWidth="0.5"
                  onMouseEnter={(e) => handleMouseEnter(e, cohort.id, periodIndex, dataPoint)}
                  onMouseLeave={handleMouseLeave}
                  className="cursor-pointer transition-all duration-100 ease-in-out hover:stroke-blue-500 hover:stroke-1"
                />
              );
            })}
          </React.Fragment>
        ))}
      </svg>

      {tooltip.visible && (
        <div
          className="absolute z-50 p-2 bg-gray-800 text-white text-xs rounded shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, calc(-100% - 10px))', // Center horizontally, position above the cursor
            whiteSpace: 'nowrap', // Prevent text wrapping
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
};

export default CohortAnalysisChart;