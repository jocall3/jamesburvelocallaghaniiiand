import React from 'react';

interface CustomerSatisfactionScoreProps {
  score: number; // Expected to be a number between 0 and 100
  label?: string;
}

const CustomerSatisfactionScore: React.FC<CustomerSatisfactionScoreProps> = ({ score, label = 'Customer Satisfaction Score' }) => {
  const getScoreColor = (s: number): string => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{label}</h3>
      <div className={`text-4xl font-bold ${getScoreColor(clampedScore)}`}>
        {clampedScore.toFixed(0)}%
      </div>
      <div className="mt-2 text-sm text-gray-500">
        {clampedScore >= 80 && 'Excellent'}
        {clampedScore >= 60 && clampedScore < 80 && 'Good'}
        {clampedScore < 60 && 'Needs Improvement'}
      </div>
    </div>
  );
};

export default CustomerSatisfactionScore;