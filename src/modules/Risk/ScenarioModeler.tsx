import React, { useMemo } from 'react';

// --- Types ---

interface ScenarioDataPoint {
  time: number; // Time step (e.g., year)
  value: number; // Median/Expected value (e.g., portfolio value)
  p10: number; // 10th percentile (lower bound of the cone)
  p90: number; // 90th percentile (upper bound of the cone)
}

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ScenarioModelerProps {
  data: ScenarioDataPoint[];
  title: string;
  width?: number;
  height?: number;
  margin?: Margin;
}

// --- Constants ---

const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 500;
const DEFAULT_MARGIN: Margin = { top: 30, right: 30, bottom: 40, left: 60 };

/**
 * Visualization component for Monte Carlo simulations, displaying
 * probability cones (cone of uncertainty) for portfolio outcomes.
 */
const ScenarioModeler: React.FC<ScenarioModelerProps> = ({
  data,
  title,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  margin = DEFAULT_MARGIN,
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', width, height }}>
        <h2>{title}</h2>
        <p>No simulation data available.</p>
      </div>
    );
  }

  // --- Dimensions Setup ---
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const { medianLinePath, conePath, ticksX, ticksY } = useMemo(() => {
    const times = data.map(d => d.time);
    const allValues = data.flatMap(d => [d.p10, d.p90]);

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // Start Y axis slightly below the minimum observed value (or 0 if all positive)
    const rawMinValue = Math.min(...allValues);
    const rawMaxValue = Math.max(...allValues);
    
    const padding = (rawMaxValue - rawMinValue) * 0.1;
    const minValue = rawMinValue - padding;
    const maxValue = rawMaxValue + padding;


    // Scaling function for Time (X-axis)
    const xScale = (t: number) => {
      if (maxTime === minTime) return innerWidth / 2;
      return ((t - minTime) / (maxTime - minTime)) * innerWidth;
    };

    // Scaling function for Value (Y-axis), inverted for SVG
    const yScale = (v: number) => {
      const range = maxValue - minValue;
      if (range === 0) return innerHeight / 2;
      return innerHeight - ((v - minValue) / range) * innerHeight;
    };

    // 1. Median Line Path (Drawn on the 'value' field)
    const medianLinePath = data
      .map((d, i) => {
        const x = xScale(d.time);
        const y = yScale(d.value);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    // 2. Probability Cone Area (P10 to P90)
    // Create the path by traversing P10 points forward, then P90 points backward
    const p10Points = data.map(d => `${xScale(d.time)} ${yScale(d.p10)}`).join(' L ');
    const p90PointsReversed = [...data]
      .reverse()
      .map(d => `${xScale(d.time)} ${yScale(d.p90)}`)
      .join(' L ');

    const conePath = `M ${p10Points} L ${p90PointsReversed} Z`;

    // --- Axis Ticks ---

    // X Ticks (Time)
    const ticksX = data.map(d => ({
      x: xScale(d.time),
      label: d.time.toFixed(0),
    }));

    // Y Ticks (Value)
    const numYTicks = 5;
    const yTickStep = (maxValue - minValue) / (numYTicks - 1);
    const ticksY = Array.from({ length: numYTicks }).map((_, i) => {
      const rawValue = minValue + i * yTickStep;
      const y = yScale(rawValue);
      return {
        y,
        label: rawValue >= 1000 ? (rawValue / 1000).toFixed(1) + 'k' : rawValue.toFixed(0),
      };
    });

    return { medianLinePath, conePath, ticksX, ticksY };
  }, [data, innerWidth, innerHeight]);

  return (
    <div className="scenario-modeler" style={{ width, height, fontFamily: 'Arial, sans-serif' }}>
      <h3 style={{ textAlign: 'center', margin: 0, paddingBottom: margin.top / 2, fontSize: '1.2em' }}>{title}</h3>
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          
          {/* Y Axis Grid lines */}
          {ticksY.map((tick, i) => (
            <g key={`y-grid-${i}`} transform={`translate(0, ${tick.y})`}>
              {/* Skip grid line at the top/bottom edges */}
              {i > 0 && i < ticksY.length - 1 && (
                <line x1={0} x2={innerWidth} stroke="#ccc" strokeDasharray="3 3" strokeWidth={0.5} />
              )}
            </g>
          ))}

          {/* 1. Probability Cone (Area between P10 and P90) */}
          <path
            d={conePath}
            fill="#4a90e2" // Soft blue for uncertainty
            fillOpacity={0.3}
            stroke="none"
            className="probability-cone"
          />

          {/* 2. Median Line (Expected Outcome) */}
          <path
            d={medianLinePath}
            fill="none"
            stroke="#1d599c" // Darker blue for median
            strokeWidth={3}
            className="median-line"
          />

          {/* X Axis */}
          <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#333" strokeWidth={1.5} />
          {ticksX.map((tick, i) => (
            <g key={`x-tick-${i}`} transform={`translate(${tick.x}, ${innerHeight})`}>
              <line y2={5} stroke="#333" strokeWidth={1} />
              <text y={15} textAnchor="middle" fontSize="10px" fill="#333">
                {tick.label}
              </text>
            </g>
          ))}
          <text
            x={innerWidth / 2}
            y={innerHeight + margin.bottom - 5}
            textAnchor="middle"
            fontSize="12px"
            fill="#333"
          >
            Time Step
          </text>

          {/* Y Axis */}
          <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="#333" strokeWidth={1.5} />
          {ticksY.map((tick, i) => (
            <g key={`y-tick-${i}`} transform={`translate(0, ${tick.y})`}>
              <line x1={0} x2={-5} stroke="#333" strokeWidth={1} />
              <text x={-10} dy="0.32em" textAnchor="end" fontSize="10px" fill="#333">
                {tick.label}
              </text>
            </g>
          ))}
          <text
            transform={`rotate(-90)`}
            x={-innerHeight / 2}
            y={-margin.left + 10}
            textAnchor="middle"
            fontSize="12px"
            fill="#333"
          >
            Value (K)
          </text>
        </g>
      </svg>
    </div>
  );
};

export default ScenarioModeler;