
import React from 'react';

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-medium text-gray-200 mb-3 border-b border-gray-700 pb-1">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);
