
import React from 'react';

export const Metadata: React.FC<{ metadata: Record<string, string> }> = ({ metadata }) => (
  <div className="bg-gray-800 p-3 rounded text-xs font-mono text-gray-300">
    <pre>{JSON.stringify(metadata, null, 2)}</pre>
  </div>
);
