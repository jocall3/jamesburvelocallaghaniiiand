```tsx
import React from 'react';
import { FiArrowUpRight, FiArrowDownRight, FiMoreHorizontal } from 'react-icons/fi';

// --- TYPE DEFINITIONS ---
type SovereignDebt = {
  country: string;
  flag: string;
  yield: number;
  change: number;
};

type CentralBankRate = {
  bank: string;
  region: string;
  rate: number;
  lastChange: string;
};

// --- MOCK DATA ---
const sovereignDebtData: SovereignDebt[] = [
  { country: 'USA', flag: '🇺🇸', yield: 4.51, change: 0.02 },
  { country: 'Germany', flag: '🇩🇪', yield: 2.58, change: -0.01 },
  { country: 'Japan', flag: '🇯🇵', yield: 0.94, change: 0.01 },
  { country: 'UK', flag: '🇬🇧', yield: 4.25, change: -0.03 },
  { country: 'China', flag: '🇨🇳', yield: 2.31, change: 0.00 },
];

const centralBankRatesData: CentralBankRate[] = [
  { bank: 'US Fed', region: '🇺🇸', rate: 5.50, lastChange: 'Jul \'23' },
  { bank: 'ECB', region: '🇪🇺', rate: 4.50, lastChange: 'Sep \'23' },
  { bank: 'BoJ', region: '🇯🇵', rate: 0.10, lastChange: 'Mar \'24' },
  { bank: 'BoE', region: '🇬🇧', rate: 5.25, lastChange: 'Aug \'23' },
];

// --- HELPER COMPONENTS & FUNCTIONS ---
const getChangeColor = (change: number): string => {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-500 dark:text-gray-400';
};

const ChangeIndicator: React.FC<{ change: number }> = ({ change }) => {
  if (change === 0) return <span className={getChangeColor(change)}>-</span>;

  return (
    <div className={`flex items-center justify-end ${getChangeColor(change)}`}>
      {change > 0 ? <FiArrowUpRight size={14} /> : <FiArrowDownRight size={14} />}
      <span className="ml-1">{Math.abs(change).toFixed(2)}</span>
    </div>
  );
};

// --- MAIN COMPONENT ---
const MarketOverviewWidget: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900/70 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Market Overview</h2>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <FiMoreHorizontal size={22} />
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
        {/* Sovereign Debt Performance */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
            Global Sovereign Debt (10Y)
          </h3>
          <div className="space-y-3">
            {sovereignDebtData.map((item) => (
              <div key={item.country} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.flag}</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.country}</p>
                    <p className="text-gray-500 dark:text-gray-400">10-Year Yield</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{item.yield.toFixed(2)}%</p>
                  <ChangeIndicator change={item.change} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Central Bank Rates */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
            Key Central Bank Rates
          </h3>
          <div className="space-y-3">
            {centralBankRatesData.map((item) => (
              <div key={item.bank} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.region}</span>
                   <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.bank}</p>
                     <p className="text-gray-500 dark:text-gray-400">Last change: {item.lastChange}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.rate.toFixed(2)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverviewWidget;
```