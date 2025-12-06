
import React from 'react';

export const NexusResourceJSON: React.FC<{ resource: object }> = ({ resource }) => {
  return (
    <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-xs overflow-x-auto border border-gray-700">
      <pre>{JSON.stringify(resource, null, 2)}</pre>
    </div>
  );
};
