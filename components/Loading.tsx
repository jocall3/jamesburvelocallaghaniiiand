
import React from 'react';

export const Loading: React.FC = () => (
  <div className="flex items-center justify-center p-2">
    <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-current rounded-full"></div>
  </div>
);
