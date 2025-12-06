
import React from 'react';
import Card from './Card';
import { Brain } from 'lucide-react';

// --- Icon Components (Self-contained SVGs for demonstration) ---

const BrainIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a2.83 2.83 0 0 0-2 5 4.79 4.79 0 0 1-1 3c-1.6.9-2.6 2.5-2.6 4.2 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0-2.6-4.2c0-.8-1.4-2.4-1-3a2.83 2.83 0 0 0-2-5z" />
  </svg>
);

const AIPredictionWidget: React.FC = () => {
  return (
    <Card title="AI Prediction Engine">
      <div className="flex items-center justify-center flex-col p-4 text-center">
        <div className="p-3 bg-cyan-500/20 rounded-full mb-4">
           <BrainIcon className="w-8 h-8 text-cyan-400" />
        </div>
        <h4 className="text-lg font-bold text-white mb-2">Market Forecast</h4>
        <p className="text-sm text-gray-400 mb-4">
          Our quantum-entangled neural networks predict a 94% probability of market stabilization within 48 hours.
        </p>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
        </div>
        <div className="mt-2 flex justify-between text-xs w-full px-1">
           <span className="text-gray-500">Confidence</span>
           <span className="text-cyan-400 font-bold">94%</span>
        </div>
      </div>
    </Card>
  );
};

export default AIPredictionWidget;
