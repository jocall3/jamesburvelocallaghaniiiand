```tsx
import React, { useState, useMemo, useCallback } from 'react';

// --- Type Definitions ---

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string; // Optional custom color for the bar
}

export interface HolographicBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  width?: number;
  height?: number;
  yAxisLabel?: string;
  onBarClick?: (dataPoint: ChartDataPoint) => void;
}

// --- Helper Functions ---

const generateGuid = () => {
    // Basic GUID generator for unique class names
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


// --- Main Component ---

const HolographicBarChart: React.FC<HolographicBarChartProps> = ({
  data,
  title,
  width = 800,
  height = 500,
  yAxisLabel,
  onBarClick,
}) => {
  const [hoveredBar, setHoveredBar] = useState<{ index: number; x: number; y: number; value: number; label: string } | null>(null);
  const componentId = useMemo(() => `hbc-${generateGuid()}`, []);

  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 100; // Default max value if no data
    const maxVal = Math.max(...data.map(d => d.value));
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    return Math.ceil(maxVal / magnitude) * magnitude;
  }, [data]);

  const yAxisTicks = useMemo(() => {
    if (maxValue === 0) return [];
    const ticks = [];
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(Math.round((maxValue / tickCount) * i));
    }
    return ticks;
  }, [maxValue]);

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    const bar = event.currentTarget;
    const rect = bar.getBoundingClientRect();
    const chartRect = bar.closest('.holographic-chart-container')?.getBoundingClientRect();
    if (!chartRect) return;

    setHoveredBar({
      index,
      x: rect.left - chartRect.left + rect.width / 2,
      y: rect.top - chartRect.top,
      value: data[index].value,
      label: data[index].label,
    });
  };

  const handleMouseLeave = useCallback(() => {
    setHoveredBar(null);
  }, []);

  const handleBarClick = useCallback((dataPoint: ChartDataPoint) => {
    if (onBarClick) {
      onBarClick(dataPoint);
    }
  }, [onBarClick]);


  // --- Embedded Styles ---
  // A component to inject scoped CSS into the document head
  const Styles = () => (
    <style>{`
      @keyframes holographic-flicker {
        0%, 100% { opacity: 1; filter: drop-shadow(0 0 5px var(--bar-glow-color)); }
        50% { opacity: 0.95; filter: drop-shadow(0 0 8px var(--bar-glow-color)); }
      }

      @keyframes grid-scan {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
      }
      
      .holographic-chart-container.${componentId} {
        position: relative;
        width: ${width}px;
        height: ${height}px;
        background: #01040a;
        color: #a7d1ff;
        font-family: 'Orbitron', monospace; /* Futuristic font, with monospace fallback */
        padding: 40px;
        box-sizing: border-box;
        border-radius: 10px;
        border: 1px solid rgba(56, 139, 253, 0.2);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .holographic-chart-container.${componentId}::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg, transparent, #388bfd, transparent);
        animation: grid-scan 8s linear infinite;
        opacity: 0.7;
        z-index: 1;
      }
      
      .chart-title {
        text-align: center;
        color: #c9d1d9;
        font-size: 1.5em;
        font-weight: 300;
        letter-spacing: 2px;
        text-shadow: 0 0 5px #388bfd, 0 0 10px #388bfd;
        margin: 0 0 20px 0;
        flex-shrink: 0;
      }

      .chart-area {
        position: relative;
        width: 100%;
        flex-grow: 1;
        display: flex;
      }

      .y-axis {
        position: relative;
        height: 100%;
        width: 60px;
        display: flex;
        flex-direction: column-reverse;
        justify-content: space-between;
        padding-bottom: 30px; /* Space for x-axis labels */
        box-sizing: border-box;
        flex-shrink: 0;
      }
      
      .y-axis-label-text {
        position: absolute;
        left: -45px;
        top: 50%;
        transform: translateY(-50%) rotate(-90deg);
        color: #8b949e;
        font-size: 0.9em;
        letter-spacing: 1px;
      }

      .y-axis-tick {
        font-size: 0.8em;
        color: #8b949e;
        position: relative;
        text-align: right;
        padding-right: 10px;
      }
      
      .plot-area {
        flex-grow: 1;
        height: calc(100% - 30px); /* Space for x-axis labels */
        position: relative;
        transform-style: preserve-3d;
        perspective: 1000px;
        background-image: 
          linear-gradient(rgba(56, 139, 253, 0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56, 139, 253, 0.15) 1px, transparent 1px);
        background-size: 40px 40px;
        border-left: 1px solid rgba(56, 139, 253, 0.3);
        border-bottom: 1px solid rgba(56, 139, 253, 0.3);
      }

      .bars-container {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
        padding: 0 2%;
        box-sizing: border-box;
        transform: rotateX(25deg);
        transform-origin: bottom center;
      }
      
      .bar-wrapper {
        flex: 1;
        position: relative;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        transition: transform 0.3s ease;
      }

      .bar-wrapper:hover {
        transform: translateY(-10px);
      }

      .bar {
        position: relative;
        width: 70%;
        min-width: 20px;
        cursor: pointer;
        background: linear-gradient(to top, var(--bar-base-color), transparent);
        border: 1px solid var(--bar-glow-color);
        border-bottom: none;
        box-shadow: inset 0 0 10px var(--bar-glow-color);
        animation: holographic-flicker 3s infinite ease-in-out;
        transition: height 0.5s ease-out, background-color 0.3s ease, box-shadow 0.3s ease;
        transform-style: preserve-3d;
      }

      .bar::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 15px; /* Depth of the bar */
        transform: rotateX(90deg);
        transform-origin: top;
        background: linear-gradient(rgba(255, 255, 255, 0.5), var(--bar-base-color));
        filter: brightness(1.2);
      }

      .x-axis {
        position: absolute;
        bottom: -30px;
        left: 60px;
        width: calc(100% - 60px);
        height: 30px;
        display: flex;
        justify-content: space-around;
        padding: 5px 2% 0;
        box-sizing: border-box;
      }
      
      .x-axis-label {
        flex: 1;
        text-align: center;
        font-size: 0.8em;
        color: #8b949e;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tooltip {
        position: absolute;
        background: rgba(13, 17, 23, 0.9);
        border: 1px solid #388bfd;
        border-radius: 5px;
        padding: 10px 15px;
        color: #c9d1d9;
        font-size: 0.9em;
        pointer-events: none;
        transform: translate(-50%, -120%);
        transition: opacity 0.2s, top 0.2s, left 0.2s;
        z-index: 10;
        box-shadow: 0 0 15px rgba(56, 139, 253, 0.5);
      }
      
      .tooltip-label {
        font-weight: bold;
        color: #a7d1ff;
      }
      
      .tooltip-value {
        margin-top: 5px;
      }
    `}</style>
  );

  return (
    <>
      <Styles />
      <div className={`holographic-chart-container ${componentId}`} style={{ width, height }}>
        {title && <h2 className="chart-title">{title}</h2>}
        <div className="chart-area">
          <div className="y-axis">
            {yAxisLabel && <span className="y-axis-label-text">{yAxisLabel}</span>}
            {yAxisTicks.map(tick => (
              <div key={tick} className="y-axis-tick">{tick.toLocaleString()}</div>
            ))}
          </div>
          <div style={{width: '100%', height: '100%', position: 'relative'}}>
            <div className="plot-area" onMouseLeave={handleMouseLeave}>
              <div className="bars-container">
                {data.map((d, i) => {
                  const barHeight = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
                  const barColor = d.color || '#388bfd';
                  const glowColor = d.color ? `${d.color}80` : 'rgba(56, 139, 253, 0.5)';
                  
                  return (
                    <div className="bar-wrapper" key={i}>
                      <div
                        className="bar"
                        style={{
                          height: `${barHeight}%`,
                          '--bar-base-color': barColor,
                          '--bar-glow-color': glowColor,
                        } as React.CSSProperties}
                        onMouseEnter={(e) => handleMouseEnter(e, i)}
                        onClick={() => handleBarClick(d)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="x-axis">
              {data.map((d, i) => (
                <div key={i} className="x-axis-label" title={d.label}>
                  {d.label}
                </div>
              ))}
            </div>
          </div>
        </div>
        {hoveredBar && (
          <div
            className="tooltip"
            style={{
              left: hoveredBar.x,
              top: hoveredBar.y,
              opacity: 1,
            }}
          >
            <div className="tooltip-label">{hoveredBar.label}</div>
            <div className="tooltip-value">Value: {hoveredBar.value.toLocaleString()}</div>
          </div>
        )}
      </div>
    </>
  );
};

export default HolographicBarChart;
```