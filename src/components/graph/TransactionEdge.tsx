import React, { CSSProperties } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@reactflow/core';

/**
 * Interface for the data object expected by the TransactionEdge.
 * This data will be used to style the edge dynamically.
 */
interface TransactionEdgeData {
  volume: number;   // Represents the monetary value of the transaction. Affects edge thickness.
  velocity: number; // A normalized value (e.g., 1-10) representing transaction speed. Affects animation speed.
}

// Type assertion for the props to include our custom data structure.
type TransactionEdgeProps = EdgeProps<TransactionEdgeData>;

/**
 * A utility function to format a number as USD currency.
 * @param {number} value - The numeric value to format.
 * @returns {string} The formatted currency string (e.g., "$1,234").
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * A custom edge component for React Flow that visualizes transaction data.
 * - The edge's thickness represents the transaction 'volume'.
 * - An animation along the edge represents the transaction 'velocity'.
 */
const TransactionEdge: React.FC<TransactionEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  // Provide default values for volume and velocity to ensure the component doesn't break
  // if data is missing.
  const { volume = 1, velocity = 1 } = data || {};

  // Use React Flow's built-in helper to calculate the SVG path for a Bezier curve,
  // as well as the coordinates for the label's center point.
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // --- Dynamic Styling based on Edge Data ---

  // 1. Calculate stroke width based on volume.
  // A logarithmic scale is used to keep the thickness manageable even for large volumes.
  // We clamp the value between a min and max for visual consistency.
  const volumeStrokeWidth = Math.max(2, Math.min(20, Math.log(volume) * 1.5 + 2));

  // 2. Calculate animation speed based on velocity.
  // Velocity is inversely proportional to animation duration (higher velocity = shorter duration = faster).
  const animationDuration = `${Math.max(0.5, 5 / velocity)}s`;

  // 3. Define the style for the animated part of the edge.
  const animatedPathStyle: CSSProperties = {
    strokeDasharray: '8, 12',
    animation: `dash-flow ${animationDuration} linear infinite`,
  };

  return (
    <>
      {/* 
        Inject the CSS keyframes for the animation. 
        This makes the component self-contained. In a larger application,
        this would typically live in a global CSS file.
      */}
      <style>
        {`
          @keyframes dash-flow {
            to {
              stroke-dashoffset: -20;
            }
          }
        `}
      </style>

      {/* Render the base edge path using React Flow's BaseEdge component.
          This path is thicker and has a neutral background color. */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#b1b1b7',
          strokeWidth: volumeStrokeWidth,
        }}
      />

      {/* 
        Render a second path on top of the base path for the animation.
        This path is thinner and has a more prominent color to represent the "flow".
      */}
      <path
        id={`${id}-animated`}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#5a9cff',
          strokeWidth: Math.max(1, volumeStrokeWidth / 2.5),
          ...animatedPathStyle,
        }}
      />

      {/* 
        Use EdgeLabelRenderer to render the transaction volume as a label.
        This ensures the label is positioned correctly and stays on top of other elements.
      */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#f0f0f0',
            border: '1px solid #ccc',
            padding: '2px 8px',
            borderRadius: '5px',
            fontSize: 10,
            fontWeight: 700,
            pointerEvents: 'all',
          }}
          // The 'nodrag' and 'nopan' classes are helpers from React Flow to prevent
          // graph interaction when clicking the label.
          className="nodrag nopan"
        >
          {formatCurrency(volume)}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default TransactionEdge;