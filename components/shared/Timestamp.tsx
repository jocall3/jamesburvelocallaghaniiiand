
import React from 'react';

export const Timestamp: React.FC<{ ts: number }> = ({ ts }) => (
  <span title={new Date(ts * 1000).toISOString()}>
    {new Date(ts * 1000).toLocaleString()}
  </span>
);
