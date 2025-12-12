import React, { useState, useEffect, useCallback } from 'react';

/**
 * CITIBANK DEMO BUSINESS INC.
 * Branch: Citibankdemobusinessinc.finance.forecaster
 * 
 * A self-contained, zero-dependency financial forecasting application.
 * Part of the unified Citibankdemobusinessinc ecosystem.
 * 
 * Features:
 * - Generative Data Modeling (Stochastic Revenue Projection)
 * - Internal Risk & Compliance Simulation
 * - Zero External Dependencies (Custom UI & Charting)
 * - Auto-Scaling Architecture Simulation
 */

// --- 1. CORE KERNEL & GENERATORS ---

const ID = () => Math.random().toString(36).substring(2, 9);

const GenerateMission = () => {
  const verbs = ["Empowering", "Revolutionizing", "Securing", "Accelerating", "Optimizing"];
  const nouns = ["Global Finance", "Open Banking", "Asset Liquidity", "Future Wealth", "Capital Efficiency"];
  return `${verbs[Math.floor(Math.random() * verbs.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]} through AI-driven foresight.`;
};

const GenerateTimeSeries = (start: number, years: number, growth: number, vol: number) => {
  let current = start;
  return Array.from({ length: years }).map((_, i) => {
    // Randomized growth factor based on volatility
    const noise = (Math.random() - 0.5) * (vol / 50); 
    const growthFactor = (growth / 100);
    const change = growthFactor + noise;
    current = current * (1 + change);
    
    // Calculate confidence intervals
    const confidence = current * (vol / 200);
    
    return { 
      year: new Date().getFullYear() + i, 
      value: Math.max(0, Math.round(current)),
      min: Math.max(0, Math.round(current - confidence)),
      max: Math.round(current + confidence)
    };
  });
};

// --- 2. ZERO-DEPENDENCY UI SYSTEM ---

const Icon = ({ name, className = "w-4 h-4" }: { name: string, className?: string }) => {
  const paths: Record<string, string> = {
    chart: "M3 3v18h18 M18 17V9 M13 17V5 M8 17v-3",
    brain: "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 5.76 0 2.5 2.5 0 0 1 0 5.58",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
    check: "M20 6L9 17l-5-5",
    refresh: "M23 4v6h-6 M1 20v-6h6",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    plus: "M12 5v14M5 12h14",
    trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    trending: "M23 6l-9.5 9.5-5-5L1 18"
  };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || paths.chart} />
    </svg>
  );
};

const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ${className}`}>{children}</div>
);

const Button = ({ onClick, children, variant = "primary", size = "md", className = "", disabled = false }: any) => {
  const base = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
  const variants: any = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-200 hover:bg-slate-50 text-slate-900",
    ghost: "hover:bg-slate-100 text-slate-700",
    destructive: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
  };
  const sizes: any = {
    sm: "h-8 px-3 text-xs rounded-md",
    md: "h-10 px-4 py-2 text-sm rounded-lg",
    icon: "h-9 w-9 rounded-md"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

const Input = (props: any) => (
  <input {...props} className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all ${props.className || ""}`} />
);

const Slider = ({ value, min, max, onChange }: any) => (
  <div className="relative w-full h-6 flex items-center">
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))} 
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900" 
    />
  </div>
);

const Badge = ({ children, color = "slate" }: any) => {
  const colors: any = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700"
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[color]}`}>{children}</span>;
};

// --- 3. CUSTOM SVG CHARTING ENGINE ---

const ForecastChart = ({ data, height = 320 }: any) => {
  if (!data || !data.length) return null;
  
  const maxVal = Math.max(...data.map((d: any) => d.max)) * 1.1;
  const minVal = 0;
  const range = maxVal - minVal;
  
  // Dimensions
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  
  return (
    <div className="w-full relative select-none" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" className="overflow-visible">
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line 
            key={tick}
            x1="0%" 
            y1={`${100 - (tick * 100)}%`} 
            x2="100%" 
            y2={`${100 - (tick * 100)}%`} 
            stroke="#f1f5f9" 
            strokeWidth="1" 
          />
        ))}

        {/* Data Bars & Points */}
        <g className="transform transition-all duration-500">
          {data.map((d: any, i: number) => {
            const x = `${(i / (data.length - 1)) * 100}%`;
            const y = `${100 - ((d.value / maxVal) * 100)}%`;
            const yMin = `${100 - ((d.min / maxVal) * 100)}%`;
            const yMax = `${100 - ((d.max / maxVal) * 100)}%`;
            
            return (
              <g key={i} className="group">
                {/* Confidence Interval Line */}
                <line x1={x} y1={yMin} x2={x} y2={yMax} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                
                {/* Main Value Point */}
                <circle cx={x} cy={y} r="4" fill="#0f172a" className="transition-all group-hover:r-6" />
                <circle cx={x} cy={y} r="12" fill="transparent" className="cursor-pointer" />
                
                {/* Tooltip (CSS-only) */}
                <foreignObject x={x} y="0" width="100" height="100%" className="overflow-visible pointer-events-none">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 shadow-lg">
                    <div className="font-bold">{d.year}</div>
                    <div>Proj: ${d.value}M</div>
                    <div className="text-slate-400 text-[10px]">${d.min}M - ${d.max}M</div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
        
        {/* Connecting Line */}
        <path
          d={`M ${data.map((d: any, i: number) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.value / maxVal) * 100);
            return `${x === 0 ? 'M' : 'L'} ${x * (1000/100)} ${y * (320/100)}`; // Approximate scaling for path
          }).join(' ')}`}
          fill="none"
          stroke="#0f172a"
          strokeWidth="2"
          strokeOpacity="0.1"
          vectorEffect="non-scaling-stroke"
          transform="scale(0.1, 0.31) translate(0,0)" // Hacky scaling for SVG path in responsive container
          style={{ display: 'none' }} // Hidden for now, using points
        />
      </svg>
      
      {/* X-Axis Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-slate-400 pt-2">
        {data.map((d: any) => <span key={d.year}>{d.year}</span>)}
      </div>
    </div>
  );
};

// --- 4. MAIN APPLICATION LOGIC ---

export default function AIFinancialForecaster() {
  // --- STATE ---
  const [scenarios, setScenarios] = useState<any[]>([
    { id: '1', name: 'Base Case', growth: 12, volatility: 15, baseValue: 100 }
  ]);
  const [activeScenarioId, setActiveScenarioId] = useState('1');
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({
    riskScore: 12,
    compliance: 'AUDITED',
    liquidity: 'OPTIMAL'
  });

  // --- DERIVED STATE ---
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  const activeForecast = forecasts.find(f => f.scenarioId === activeScenarioId)?.data || [];

  // --- ACTIONS ---
  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    // Simulate AI processing time
    setTimeout(() => {
      const newForecasts = scenarios.map(s => ({
        scenarioId: s.id,
        data: GenerateTimeSeries(s.baseValue, 6, s.growth, s.volatility)
      }));
      
      setForecasts(newForecasts);
      
      // Update system metrics based on simulation
      setSystemMetrics({
        riskScore: Math.floor(Math.random() * 20) + (activeScenario.volatility / 2),
        compliance: Math.random() > 0.1 ? 'AUDITED' : 'REVIEWING',
        liquidity: activeScenario.growth > 20 ? 'STRAINED' : 'OPTIMAL'
      });
      
      setIsSimulating(false);
    }, 800);
  }, [scenarios, activeScenario]);

  // Initial load
  useEffect(() => {
    runSimulation();
  }, []);

  const addScenario = () => {
    const id = ID();
    setScenarios([...scenarios, { 
      id, 
      name: `Scenario ${scenarios.length + 1}`, 
      growth: 10, 
      volatility: 10, 
      baseValue: 100 
    }]);
    setActiveScenarioId(id);
  };

  const updateScenario = (key: string, val: any) => {
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? { ...s, [key]: val } : s));
  };

  const removeScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    const newScenarios = scenarios.filter(s => s.id !== id);
    setScenarios(newScenarios);
    if (activeScenarioId === id) setActiveScenarioId(newScenarios[0].id);
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono uppercase tracking-widest mb-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Citibankdemobusinessinc.finance.forecaster
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Financial Forecaster</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">{GenerateMission()}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge color={systemMetrics.riskScore > 25 ? "red" : "green"}>
              RISK SCORE: {Math.round(systemMetrics.riskScore)}/100
            </Badge>
            <Badge color="blue">{systemMetrics.compliance}</Badge>
            <Badge color={systemMetrics.liquidity === 'OPTIMAL' ? "green" : "amber"}>
              LIQUIDITY: {systemMetrics.liquidity}
            </Badge>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: CONTROLS (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Icon name="settings" /> Model Configuration
                </h2>
                <Button size="sm" variant="outline" onClick={addScenario}>
                  <Icon name="plus" className="w-4 h-4 mr-1" /> New
                </Button>
              </div>

              {/* Scenario List */}
              <div className="space-y-2 mb-8 flex-grow">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Scenarios</label>
                {scenarios.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => setActiveScenarioId(s.id)}
                    className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${activeScenarioId === s.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${activeScenarioId === s.id ? 'bg-blue-400' : 'bg-slate-300'}`} />
                      <span className="font-medium text-sm">{s.name}</span>
                    </div>
                    {scenarios.length > 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeScenario(s.id); }}
                        className={`p-1 rounded hover:bg-red-500/20 ${activeScenarioId === s.id ? 'text-slate-400 hover:text-white' : 'text-slate-300 hover:text-red-500'}`}
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Parameters */}
              <div className="space-y-5 border-t border-slate-100 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scenario Name</label>
                  <Input value={activeScenario.name} onChange={(e: any) => updateScenario('name', e.target.value)} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <label className="font-medium">Annual Growth Rate</label>
                    <span className="font-mono bg-slate-100 px-2 rounded text-xs py-0.5">{activeScenario.growth}%</span>
                  </div>
                  <Slider min={-10} max={50} value={activeScenario.growth} onChange={(v: number) => updateScenario('growth', v)} />
                  <p className="text-xs text-slate-400">Projected year-over-year revenue expansion.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <label className="font-medium">Market Volatility</label>
                    <span className="font-mono bg-slate-100 px-2 rounded text-xs py-0.5">{activeScenario.volatility}%</span>
                  </div>
                  <Slider min={0} max={40} value={activeScenario.volatility} onChange={(v: number) => updateScenario('volatility', v)} />
                  <p className="text-xs text-slate-400">Standard deviation representing market uncertainty.</p>
                </div>

                <Button className="w-full mt-4" onClick={runSimulation} disabled={isSimulating}>
                  {isSimulating ? <Icon name="refresh" className="w-4 h-4 animate-spin mr-2" /> : <Icon name="trending" className="w-4 h-4 mr-2" />}
                  Generate Forecast
                </Button>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: VISUALIZATION (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Chart Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-semibold">Revenue Projection (5-Year)</h2>
                  <p className="text-sm text-slate-500">Stochastic modeling based on current parameters.</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900 tracking-tight">
                    ${activeForecast.length ? activeForecast[activeForecast.length - 1].value : 0}M
                  </div>
                  <div className="text-xs font-medium text-green-600 flex items-center justify-end gap-1">
                    <Icon name="trending" className="w-3 h-3" />
                    CAGR: {((Math.pow((activeForecast[activeForecast.length - 1]?.value || 100) / (activeScenario.baseValue || 100), 1/5) - 1) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-6 relative min-h-[350px]">
                {isSimulating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/80 backdrop-blur-sm z-10">
                    <Icon name="brain" className="w-12 h-12 animate-pulse text-blue-500 mb-4" />
                    <span className="text-sm font-medium">AI Model Processing...</span>
                  </div>
                ) : null}
                <ForecastChart data={activeForecast} />
              </div>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-800">
                  <Icon name="shield" className="text-blue-600" /> Regulatory Compliance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">Basel III Liquidity</span>
                    <span className="text-green-700 font-bold text-xs">COMPLIANT</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">Stress Test (CCAR)</span>
                    <span className="text-green-700 font-bold text-xs">PASSED</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">Data Sovereignty</span>
                    <span className="text-blue-700 font-bold text-xs">US-EAST-1</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-800">
                  <Icon name="brain" className="text-purple-600" /> AI Strategic Insights
                </h3>
                <div className="text-sm text-slate-600 space-y-3">
                  <p>
                    Based on a volatility index of <span className="font-bold text-slate-900">{activeScenario.volatility}</span>, 
                    the model suggests a <span className="font-bold text-slate-900">{activeScenario.growth > 15 ? 'Aggressive' : 'Conservative'}</span> capital allocation strategy.
                  </p>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, activeScenario.growth * 2)}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-400 text-right">Growth Confidence Interval</p>
                </div>
              </Card>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <div>
            &copy; 2024 Citibank Demo Business Inc. All Rights Reserved.
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span>System Status: <span className="text-green-500">Operational</span></span>
            <span>Encrypted: <span className="text-green-500">AES-256</span></span>
            <span>Version: 1.0.4-alpha</span>
          </div>
        </div>

      </div>
    </div>
  );
}