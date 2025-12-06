
import React from 'react';

const colors: Record<string, string> = {
  success: 'bg-green-900 text-green-200 border-green-700',
  warning: 'bg-yellow-900 text-yellow-200 border-yellow-700',
  danger: 'bg-red-900 text-red-200 border-red-700',
  default: 'bg-gray-700 text-gray-200 border-gray-500',
};

export const StatusBadge: React.FC<{ status: string; color: string }> = ({ status, color }) => (
  <span className={`px-2 py-0.5 rounded border text-xs uppercase tracking-wide font-semibold ${colors[color] || colors.default}`}>
    {status}
  </span>
);
