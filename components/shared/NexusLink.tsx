
import React from 'react';

export const NexusLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline">
    {children}
  </span>
);
