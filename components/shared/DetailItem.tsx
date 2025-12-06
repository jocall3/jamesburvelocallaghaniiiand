
import React from 'react';

export const DetailItem: React.FC<{ title: string; value: React.ReactNode; isMono?: boolean }> = ({ title, value, isMono }) => (
  <div className="flex justify-between py-1">
    <span className="text-gray-400 text-sm">{title}</span>
    <span className={`text-gray-200 text-sm ${isMono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);
