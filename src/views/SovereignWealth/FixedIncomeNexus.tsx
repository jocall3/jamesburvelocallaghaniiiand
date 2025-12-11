export const FixedIncomeNexus = () => {
  return (
    // This is a placeholder wrapper for the file content I am about to generate.
    // The actual code block starts below.
    null
  );
};

// -----------------------------------------------------------------------------
// FILE CONTENT: src/views/SovereignWealth/FixedIncomeNexus.tsx
// -----------------------------------------------------------------------------

import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- Interfaces & Types ---

interface Bond {
  id: string;
  name: string;
  isin: string;
  cusip?: string;
  figi?: string;
  ticker?: string;
  type: 'Bond' | 'Bill' | 'Note';
  status: 'Active' | 'Matured' | 'Redeemed';
  amount: number;
  currency: string;
  maturityDate: string;
  issueDate?: string;
  couponRate: number | null; // Null for Zero-coupon
  sector: string;
  issuer: string;
  ratings?: Rating[];
  countryOfRisk: string;
}

interface Rating {
  agency: string;
  rating: string;
  type: string;
}

// --- Mock Data (Based on prompt) ---

const MOCK_BONDS: Bond[] = [
  {
    id: 'US912796P781',
    name: 'USA, CMB 21dec2021 4m',
    isin: 'US912796P781',
    cusip: '912796P78',
    figi: 'BBG0125BL947',
    ticker: 'B 0 12/21/21',
    type: 'Bill',
    status: 'Matured',
    amount: 68759029200,
    currency: 'USD',
    maturityDate: '2021-12-21',
    issueDate: '2021-09-18',
    couponRate: null,
    sector: 'Sovereign',
    issuer: 'United States of America',
    countryOfRisk: 'USA',
    ratings: [
      { agency: 'DBRS Limited', rating: 'AAA', type: 'Issuer Rating' },
      { agency: 'Japan Credit Rating Agency', rating: 'AAA', type: 'Foreign Currency Long-term' },
      { agency: 'RAEX-Europe', rating: 'AAA', type: 'CCE' },
    ]
  },
  {
    id: 'US91282CGM73',
    name: 'USA, Bonds 3.875% 15may2043',
    isin: 'US91282CGM73',
    type: 'Bond',
    status: 'Active',
    amount: 32000000000,
    currency: 'USD',
    maturityDate: '2043-05-15',
    couponRate: 3.875,
    sector: 'Sovereign',
    issuer: 'United States of America',
    countryOfRisk: 'USA',
  },
  {
    id: 'US912796XQ54',
    name: 'USA, Bills 0% 19sep2023',
    isin: 'US912796XQ54',
    type: 'Bill',
    status: 'Active',
    amount: 45500000000,
    currency: 'USD',
    maturityDate: '2023-09-19',
    couponRate: null,
    sector: 'Sovereign',
    issuer: 'United States of America',
    countryOfRisk: 'USA',
  },
  {
    id: 'US912810TS33',
    name: 'USA, Notes 3.375% 15may2033',
    isin: 'US912810TS33',
    type: 'Note',
    status: 'Active',
    amount: 38000000000,
    currency: 'USD',
    maturityDate: '2033-05-15',
    couponRate: 3.375,
    sector: 'Sovereign',
    issuer: 'United States of America',
    countryOfRisk: 'USA',
  },
  {
    id: 'US912810TN46',
    name: 'USA, Notes 3.625% 15may2026',
    isin: 'US912810TN46',
    type: 'Note',
    status: 'Active',
    amount: 42000000000,
    currency: 'USD',
    maturityDate: '2026-05-15',
    couponRate: 3.625,
    sector: 'Sovereign',
    issuer: 'United States of America',
    countryOfRisk: 'USA',
  },
];

// --- Sub-Components ---

/**
 * 3D Yield Curve Visualization Component
 * Uses HTML5 Canvas to simulate a 3D surface plot of the yield curve.
 */
const YieldCurve3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.01;
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0f172a'); // slate-900
      gradient.addColorStop(1, '#1e293b'); // slate-800
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw Grid (Perspective)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      
      const horizonY = height * 0.4;
      const centerX = width / 2;
      
      // Vertical grid lines (fanning out)
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath();
        const xStart = centerX + i * 20;
        const xEnd = centerX + i * 150;
        ctx.moveTo(xStart, horizonY);
        ctx.lineTo(xEnd, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        const y = horizonY + Math.pow(i / 10, 2) * (height - horizonY);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Curves (Simulating time-series yield curve surface)
      const numCurves = 8;
      for (let c = 0; c < numCurves; c++) {
        ctx.beginPath();
        const zDepth = c / numCurves; // 0 (front) to 1 (back)
        const curveColor = `rgba(56, 189, 248, ${1 - zDepth * 0.8})`; // Sky blue with fade
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = 2 + (1 - zDepth) * 2;

        const baseY = horizonY + (height - horizonY) * (1 - zDepth * 0.8) - 50;
        
        for (let x = 0; x <= width; x += 10) {
          // Math to simulate yield curve shape
          const normalizedX = (x - centerX) / (width * 0.5); // -1 to 1
          const curveShape = Math.pow(normalizedX + 1.2, 0.5) * 30; // standard yield curve shape
          
          // Animation wave
          const wave = Math.sin(x * 0.01 + time + c) * 10 * (1 - zDepth);
          
          const y = baseY - curveShape + wave;
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Overlay Info
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('US TREASURY YIELD CURVE INTERPOLATION', 20, 20);
      ctx.fillText(`T: ${time.toFixed(2)}`, 20, 35);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 group">
      <canvas 
        ref={canvasRef} 
        width={1000} 
        height={400} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
      />
      <div className="absolute top-4 right-4 flex gap-2">
        <span className="px-2 py-1 bg-black/50 backdrop-blur text-xs text-blue-400 font-mono rounded border border-blue-900/50">3D MODE</span>
        <span className="px-2 py-1 bg-black/50 backdrop-blur text-xs text-emerald-400 font-mono rounded border border-emerald-900/50">LIVE</span>
      </div>
    </div>
  );
};

/**
 * Bond Data Grid Component
 */
const BondGrid: React.FC<{ 
  bonds: Bond[]; 
  selectedId: string | null; 
  onSelect: (id: string) => void 
}> = ({ bonds, selectedId, onSelect }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          Sovereign Issues
        </h3>
        <div className="flex gap-2">
          <input type="text" placeholder="Search ISIN..." className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>
      
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 font-medium">ISIN</th>
              <th className="px-4 py-3 font-medium text-right">Maturity</th>
              <th className="px-4 py-3 font-medium text-right">Cpn %</th>
              <th className="px-4 py-3 font-medium text-right">Amount (B)</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bonds.map((bond) => (
              <tr 
                key={bond.id} 
                onClick={() => onSelect(bond.id)}
                className={`cursor-pointer transition-colors duration-150 group ${
                  selectedId === bond.id 
                    ? 'bg-blue-50/80 hover:bg-blue-100/80' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 group-hover:text-blue-700">{bond.name}</div>
                  <div className="text-xs text-slate-400">{bond.type}</div>
                </td>
                <td className="px-4 py-3 font-mono text-slate-500 text-xs">{bond.isin}</td>
                <td className="px-4 py-3 text-right text-slate-700">{bond.maturityDate}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">
                  {bond.couponRate !== null ? bond.couponRate.toFixed(3) : '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">
                  {(bond.amount / 1_000_000_000).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    bond.status === 'Active' ? 'bg-green-100 text-green-800' : 
                    bond.status === 'Matured' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-800'
                  }`}>
                    {bond.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Detailed Bond Information Panel
 */
const BondDetailPanel: React.FC<{ bond: Bond }> = ({ bond }) => {
  return (
    <div className="bg-white h-full border-l border-slate-200 overflow-y-auto custom-scrollbar">
      {/* Header Banner */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded">Sovereign</span>
              <span className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded">{bond.countryOfRisk}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{bond.name}</h1>
            <div className="mt-1 text-sm text-slate-500 font-medium">Issuer: {bond.issuer}</div>
          </div>
          <div className="text-right">
             <div className="text-xs uppercase text-slate-400 font-semibold mb-1">Current Status</div>
             <div className={`text-lg font-bold ${bond.status === 'Active' ? 'text-green-600' : 'text-slate-500'}`}>{bond.status}</div>
          </div>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Volume (USD)</div>
            <div className="text-sm font-mono font-bold text-slate-800 mt-1">{bond.amount.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Maturity</div>
            <div className="text-sm font-mono font-bold text-slate-800 mt-1">{bond.maturityDate}</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Coupon</div>
            <div className="text-sm font-mono font-bold text-slate-800 mt-1">{bond.couponRate ? `${bond.couponRate}%` : 'Zero'}</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
             <div className="text-[10px] text-slate-400 uppercase font-semibold">Type</div>
            <div className="text-sm font-mono font-bold text-slate-800 mt-1">{bond.type}</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Issuer Profile */}
        <section>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Issuer Profile</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            The United States of America is a country in North America. It consists of 50 states and a federal district. 
            The biggest sector of the US economy is the retail industry. The U.S bond market is the largest and most liquid in the world.
          </p>
        </section>

        {/* Identifiers Table */}
        <section>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Security Identifiers</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">ISIN</span>
                <span className="font-mono text-slate-800">{bond.isin}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">CUSIP</span>
                <span className="font-mono text-slate-800">{bond.cusip || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">FIGI</span>
                <span className="font-mono text-slate-800">{bond.figi || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ticker</span>
                <span className="font-mono text-slate-800">{bond.ticker || '-'}</span>
            </div>
          </div>
        </section>

        {/* Ratings */}
        <section>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Credit Ratings</h4>
          {bond.ratings && bond.ratings.length > 0 ? (
            <div className="space-y-2">
              {bond.ratings.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-700">{r.agency}</div>
                    <div className="text-[10px] text-slate-400">{r.type}</div>
                  </div>
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-blue-800 shadow-sm">{r.rating}</span>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-sm text-slate-400 italic">No specific ratings available for this issue.</div>
          )}
        </section>

        {/* Cash Flow Placeholder */}
        <section>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Cash Flow & Redemption</h4>
            <div className="bg-slate-50 rounded p-4 text-center border border-slate-100 border-dashed">
                <div className="text-xs text-slate-500 mb-2">Redemption (Put/Call Option)</div>
                <div className="text-sm font-semibold text-slate-700">*** (-)</div>
                <div className="mt-4 text-xs text-slate-400">Full cash flow table restricted. <br/>Login to view coupon payment schedules.</div>
            </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-4 mt-4">
            <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Calculator
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-2.5 rounded-lg text-sm font-medium transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Container: Fixed Income Nexus ---

export default function FixedIncomeNexus() {
  const [selectedBondId, setSelectedBondId] = useState<string>('US912796P781');

  // Find the selected bond object
  const selectedBond = useMemo(() => 
    MOCK_BONDS.find(b => b.id === selectedBondId) || MOCK_BONDS[0], 
    [selectedBondId]
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans">
      
      {/* Top Navigation Bar (Simplified) */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-blue-200 shadow-lg">S</div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">Sovereign<span className="text-blue-600">Wealth</span></span>
        </div>
        <div className="h-6 w-px bg-slate-200 mx-6"></div>
        <nav className="flex gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="text-slate-900 hover:text-blue-600 transition-colors">Dashboard</a>
            <a href="#" className="text-blue-600 border-b-2 border-blue-600 py-5">Fixed Income Nexus</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Yield Curves</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Auctions</a>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-6 gap-6 grid grid-cols-12">
        
        {/* Left Column: Visuals & Grid (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
            
            {/* Top: 3D Visualization */}
            <div className="shrink-0">
                <YieldCurve3D />
            </div>

            {/* Bottom: Data Grid */}
            <div className="flex-1 min-h-0">
                <BondGrid 
                    bonds={MOCK_BONDS} 
                    selectedId={selectedBondId} 
                    onSelect={setSelectedBondId} 
                />
            </div>
        </div>

        {/* Right Column: Detail Panel (4 cols) */}
        <div className="col-span-12 lg:col-span-4 h-full overflow-hidden rounded-xl border border-slate-200 shadow-xl">
            <BondDetailPanel bond={selectedBond} />
        </div>

      </main>
    </div>
  );
}