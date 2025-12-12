import React from 'react';
import { EdgeProps } from 'reactflow';

const IdentityEdge = ({ id, source, target, data, style, markerEnd }: EdgeProps) => {
  const { displayName } = data || {};

  return (
    <g>
      <path
        id={id}
        style={{
          ...style,
          stroke: '#228B22',
          strokeWidth: 2,
        }}
        className="react-flow__edge-path"
        d={data?.path}
        markerEnd={markerEnd?.id}
      />
      <text
        x={50}
        y={20}
        style={{ fontSize: '12px', fill: '#000', textAnchor: 'middle', pointerEvents: 'none' }}
      >
        {displayName || 'Dependency'}
      </text>
      
    </g>
  );
};

export default IdentityEdge;