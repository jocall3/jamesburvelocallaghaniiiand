import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, TrendingUp, AlertTriangle, Info, Calendar, DollarSign, Activity, Lock } from 'lucide-react';

// --- Types ---

interface DebtInstrument {
  id: string;
  name: string;
  type: 'Bond' | 'Bill' | 'Note' | 'CMB';
  maturityDate: string;
  amount: number; // In USD
  coupon: number; // Percentage
  status: 'Active' | 'Matured' | 'Redeemed';
  isin: string;
  cusip?: string;
  yield?: number;
}

interface CitadelStats {
  totalDebt: number;
  weightedAvgCoupon: number;
  nextMaturityCliff: string;
  creditRating: string;
}

// --- Mock Data derived from Prompt ---

const MOCK_DEBT_DATA: DebtInstrument[] = [
  {
    id: 'US912796P781',
    name: 'USA, CMB 21dec2021 4m',
    type: 'CMB',
    maturityDate: '2021-12-21',
    amount: 68759029200,
    coupon: 0,
    status: 'Matured',
    isin: 'US912796P781',
    cusip: '912796P78'
  },
  {
    id: 'US_BOND_2043',
    name: 'USA, Bonds 3.875% 15may2043',
    type: 'Bond',
    maturityDate: '2043-05-15',
    amount: 42000000000,
    coupon: 3.875,
    status: 'Active',
    isin: 'US0000000001'
  },
  {
    id: 'US_BILL_SEP2023',
    name: 'USA, Bills 0% 19sep2023',
    type: 'Bill',
    maturityDate: '2023-09-19',
    amount: 55000000000,
    coupon: 0,
    status: 'Active',
    isin: 'US0000000002'
  },
  {
    id: 'US_BILL_MAY2024',
    name: 'USA, Bills 0% 16may2024',
    type: 'Bill',
    maturityDate: '2024-05-16',
    amount: 38000000000,
    coupon: 0,
    status: 'Active',
    isin: 'US0000000003'
  },
  {
    id: 'US_NOTE_2033',
    name: 'USA, Notes 3.375% 15may2033',
    type: 'Note',
    maturityDate: '2033-05-15',
    amount: 61000000000,
    coupon: 3.375,
    status: 'Active',
    isin: 'US0000000004'
  },
  {
    id: 'US_BOND_2053',
    name: 'USA, Bonds 3.625% 15may2053',
    type: 'Bond',
    maturityDate: '2053-05-15',
    amount: 29000000000,
    coupon: 3.625,
    status: 'Active',
    isin: 'US0000000005'
  },
  {
    id: 'US_NOTE_2026',
    name: 'USA, Notes 3.625% 15may2026',
    type: 'Note',
    maturityDate: '2026-05-15',
    amount: 72000000000,
    coupon: 3.625,
    status: 'Active',
    isin: 'US0000000006'
  },
  {
    id: 'US_BILL_NOV2023',
    name: 'USA, Bills 0% 16nov2023',
    type: 'Bill',
    maturityDate: '2023-11-16',
    amount: 48000000000,
    coupon: 0,
    status: 'Active',
    isin: 'US0000000007'
  }
];

// --- Helper Components ---

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-900 border border-slate-700 rounded-lg overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'blue' }: { children: React.ReactNode; variant?: 'blue' | 'green' | 'red' | 'yellow' }) => {
  const colors = {
    blue: 'bg-blue-900/30 text-blue-400 border-blue-800',
    green: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
    red: 'bg-red-900/30 text-red-400 border-red-800',
    yellow: 'bg-amber-900/30 text-amber-400 border-amber-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${colors[variant]}`}>
      {children}
    </span>
  );
};

const formatMoney = (amount: number) => {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  return `$${amount.toLocaleString()}`;
};

// --- Main Visualization Component ---

const DebtTower = ({ 
  year, 
  instruments, 
  maxAmount, 
  isSelected, 
  onClick 
}: { 
  year: number; 
  instruments: DebtInstrument[]; 
  maxAmount: number;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const totalAmount = instruments.reduce((sum, i) => sum + i.amount, 0);
  const heightPercent = (totalAmount / maxAmount) * 100;
  
  // Determine color based on dominant instrument type or weighted mix
  const isMatured = instruments.every(i => i.status === 'Matured');
  
  const baseColor = isMatured 
    ? 'fill-slate-700 stroke-slate-600' 
    : isSelected 
      ? 'fill-blue-500 stroke-blue-300' 
      : 'fill-indigo-600 stroke-indigo-400';

  const glowClass = isSelected ? 'drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]' : '';

  return (
    <g 
      className={`cursor-pointer transition-all duration-300 ${glowClass}`}
      onClick={onClick}
      onMouseEnter={onClick}
    >
      {/* Tower Body */}
      <motion.rect
        initial={{ height: 0, y: 300 }}
        animate={{ height: heightPercent * 2.5, y: 300 - (heightPercent * 2.5) }}
        transition={{ duration: 0.8, type: 'spring' }}
        x={0} 
        width={40} 
        className={`${baseColor} stroke-2`}
        rx={2}
      />
      
      {/* Crenellations (Top of castle) */}
      <motion.path
        initial={{ opacity: 0, y: 300 }}
        animate={{ opacity: 1, y: 300 - (heightPercent * 2.5) }}
        d={`M 0 0 h 8 v 8 h 8 v -8 h 8 v 8 h 8 v -8 h 8`}
        className="stroke-slate-900 fill-none stroke-2"
        transform={`translate(0, -8)`} 
      />

      {/* Windows/Texture based on count */}
      {instruments.map((_, i) => (
         <motion.rect
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            x={12}
            y={300 - (heightPercent * 2.5) + 20 + (i * 15)}
            width={16}
            height={8}
            className="fill-slate-900"
            rx={1}
         />
      ))}

      {/* Year Label */}
      <text x={20} y={320} textAnchor="middle" className="fill-slate-400 text-xs font-mono">
        {year}
      </text>
      
      {/* Volume Label (if tall enough) */}
      {heightPercent > 20 && (
         <text 
            x={20} 
            y={300 - (heightPercent * 2.5) + 15} 
            textAnchor="middle" 
            className="fill-white text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
         >
            {formatMoney(totalAmount)}
         </text>
      )}
    </g>
  );
};

export default function SovereignDebtCitadel() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Group data by year
  const dataByYear = useMemo(() => {
    const groups: Record<number, DebtInstrument[]> = {};
    MOCK_DEBT_DATA.forEach(d => {
      const year = new Date(d.maturityDate).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(d);
    });
    return groups;
  }, []);

  const years = Object.keys(dataByYear).map(Number).sort((a, b) => a - b);
  
  // Calculate max volume for scaling
  const maxVolume = Math.max(...Object.values(dataByYear).map(group => 
    group.reduce((sum, item) => sum + item.amount, 0)
  ));

  const selectedInstruments = selectedYear ? dataByYear[selectedYear] : [];

  const totalOutstanding = MOCK_DEBT_DATA
    .filter(d => d.status === 'Active')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
            <Shield className="w-8 h-8 text-indigo-500" />
            Sovereign Debt Citadel
            <span className="text-sm font-normal text-slate-500 ml-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              USA / Sovereign
            </span>
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Gamified visualization of the national debt structure. Height represents maturity volume (The "Cliff"). 
            Defend against liquidity risks by managing maturity walls.
          </p>
        </div>
        
        <div className="flex gap-4">
           <Card className="p-4 flex items-center gap-4 bg-slate-900/50 backdrop-blur">
             <div className="p-3 bg-indigo-500/10 rounded-full">
               <DollarSign className="w-6 h-6 text-indigo-400" />
             </div>
             <div>
               <div className="text-sm text-slate-400">Total Outstanding</div>
               <div className="text-xl font-bold text-white">{formatMoney(totalOutstanding)}</div>
             </div>
           </Card>
           
           <Card className="p-4 flex items-center gap-4 bg-slate-900/50 backdrop-blur">
             <div className="p-3 bg-emerald-500/10 rounded-full">
               <Activity className="w-6 h-6 text-emerald-400" />
             </div>
             <div>
               <div className="text-sm text-slate-400">Credit Rating</div>
               <div className="text-xl font-bold text-emerald-400">AAA / Stable</div>
             </div>
           </Card>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* The Citadel Visualization */}
        <Card className="lg:col-span-2 p-6 h-[500px] relative flex flex-col items-center justify-end bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-slate-800">
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-500 font-mono tracking-widest uppercase">Maturity Structure View</span>
          </div>

          <div className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar">
            <svg 
              width={Math.max(800, years.length * 80)} 
              height="100%" 
              viewBox={`0 0 ${Math.max(800, years.length * 80)} 400`}
              className="mt-auto"
            >
              <defs>
                <linearGradient id="skyGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </linearGradient>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                </pattern>
              </defs>
              
              {/* Background Grid */}
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Horizon Line */}
              <line x1="0" y1="300" x2="100%" y2="300" stroke="#334155" strokeWidth="2" />
              
              {/* Ground Area */}
              <rect x="0" y="300" width="100%" height="100" fill="#0f172a" opacity="0.8" />

              {/* Render Towers */}
              <g transform="translate(40, 0)">
                {years.map((year, index) => (
                  <g key={year} transform={`translate(${index * 80}, 0)`}>
                    <DebtTower 
                      year={year}
                      instruments={dataByYear[year]}
                      maxAmount={maxVolume}
                      isSelected={selectedYear === year}
                      onClick={() => setSelectedYear(year === selectedYear ? null : year)}
                    />
                  </g>
                ))}
              </g>

              {/* Decorative Moat Reflection */}
              <g transform="translate(40, 305) scale(1, -0.3)" opacity="0.2">
                 {years.map((year, index) => (
                    <g key={`reflect-${year}`} transform={`translate(${index * 80}, 0)`}>
                       <DebtTower 
                          year={year}
                          instruments={dataByYear[year]}
                          maxAmount={maxVolume}
                          isSelected={selectedYear === year}
                          onClick={() => {}}
                        />
                    </g>
                 ))}
              </g>
            </svg>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 right-6 flex gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-indigo-600 rounded-sm"></span> Active Debt
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-slate-700 rounded-sm"></span> Matured
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border border-blue-500 rounded-sm"></span> Selected
            </div>
          </div>
        </Card>

        {/* Info Panel */}
        <div className="flex flex-col gap-6">
          <Card className="flex-1 p-6 border-slate-700 bg-slate-900/80">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              Tower Details
            </h3>

            <AnimatePresence mode="wait">
              {selectedYear ? (
                <motion.div
                  key={selectedYear}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-white mb-1">
                      {selectedYear}
                    </div>
                    <div className="text-slate-400 text-sm">Fiscal Year Maturity</div>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedInstruments.map((inst) => (
                      <div key={inst.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                           <Badge variant={inst.status === 'Matured' ? 'green' : 'blue'}>
                             {inst.type}
                           </Badge>
                           <span className={`text-xs ${inst.status === 'Matured' ? 'text-slate-500' : 'text-indigo-300'}`}>
                             {inst.status}
                           </span>
                        </div>
                        <h4 className="font-medium text-slate-200 text-sm mb-1">{inst.name}</h4>
                        <div className="grid grid-cols-2 gap-y-2 mt-3 text-xs text-slate-400">
                          <div>
                            <span className="block text-slate-500">Amount</span>
                            <span className="text-slate-200">{formatMoney(inst.amount)}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500">Maturity</span>
                            <span className="text-slate-200">{inst.maturityDate}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500">Coupon</span>
                            <span className="text-slate-200">{inst.coupon}%</span>
                          </div>
                          <div>
                            <span className="block text-slate-500">ISIN</span>
                            <span className="font-mono text-slate-200">{inst.isin}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8"
                >
                  <Calendar className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select a tower in the citadel to inspect specific debt instruments and liquidity requirements.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="p-5 border-slate-800 bg-slate-900/50">
             <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Risk Analysis
             </h4>
             <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-400">Maturity Concentration</span>
                   <span className="text-amber-400 font-mono">High (2023)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                   <div className="bg-amber-500 h-full w-[75%]" />
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                   <span className="text-slate-400">Refinancing Risk</span>
                   <span className="text-emerald-400 font-mono">Low</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                   <div className="bg-emerald-500 h-full w-[25%]" />
                </div>
             </div>
          </Card>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.8);
        }
      `}</style>
    </div>
  );
}