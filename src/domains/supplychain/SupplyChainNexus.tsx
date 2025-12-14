import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { 
  Truck, Package, TrendingUp, AlertCircle, Globe, DollarSign, Activity, Anchor, Navigation, Zap, Layers 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const shipmentData = [
  { name: 'Jan', active: 400, delayed: 24, completed: 240 },
  { name: 'Feb', active: 300, delayed: 13, completed: 221 },
  { name: 'Mar', active: 200, delayed: 98, completed: 229 },
  { name: 'Apr', active: 278, delayed: 39, completed: 200 },
  { name: 'May', active: 189, delayed: 48, completed: 218 },
  { name: 'Jun', active: 239, delayed: 38, completed: 250 },
  { name: 'Jul', active: 349, delayed: 43, completed: 210 },
];

const inventoryData = [
  { category: 'Electronics', stock: 1200, optimal: 1000, risk: 'Low' },
  { category: 'Raw Materials', stock: 800, optimal: 1500, risk: 'High' },
  { category: 'Auto Parts', stock: 450, optimal: 500, risk: 'Medium' },
  { category: 'Textiles', stock: 3200, optimal: 3000, risk: 'Low' },
];

const financialFlowData = [
  { month: 'Q1', revenue: 15000, cost: 12000, profit: 3000 },
  { month: 'Q2', revenue: 18000, cost: 13000, profit: 5000 },
  { month: 'Q3', revenue: 16000, cost: 11500, profit: 4500 },
  { month: 'Q4', revenue: 22000, cost: 16000, profit: 6000 },
];

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>
      <Icon size={64} />
    </div>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <span className={change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
        {change >= 0 ? '+' : ''}{change}%
      </span>
      <span className="text-slate-500 text-xs">from last month</span>
    </div>
  </motion.div>
);

const AIInsight = ({ message, type }: { message: string, type: 'warning' | 'optimization' | 'info' }) => {
  const colors = {
    warning: 'border-l-rose-500 bg-rose-500/10 text-rose-200',
    optimization: 'border-l-emerald-500 bg-emerald-500/10 text-emerald-200',
    info: 'border-l-blue-500 bg-blue-500/10 text-blue-200',
  };

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`p-4 border-l-4 rounded-r-lg mb-3 flex items-start gap-3 ${colors[type]}`}
    >
      <Zap size={18} className="mt-1 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </motion.div>
  );
};

export default function SupplyChainNexus() {
  const [activeTab, setActiveTab] = useState('overview');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAiAnalyzing(prev => !prev);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Nexus Logistics AI
          </h1>
          <p className="text-slate-400">Global Supply Chain Orchestration & Financial Intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
            <Activity className={`text-emerald-400 ${aiAnalyzing ? 'animate-pulse' : ''}`} size={18} />
            <span className="text-sm font-medium">System Status: Optimal</span>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium transition-colors text-white shadow-lg shadow-blue-900/20">
            Generate Report
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Shipments" value="12,450" change={12.5} icon={Package} color="text-blue-400" />
        <StatCard title="Transit Efficiency" value="94.2%" change={-1.2} icon={TrendingUp} color="text-emerald-400" />
        <StatCard title="Capital Locked" value="$4.2M" change={5.8} icon={DollarSign} color="text-amber-400" />
        <StatCard title="Critical Alerts" value="3" change={-50} icon={AlertCircle} color="text-rose-400" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Globe size={20} className="text-blue-400" /> Global Logistics Flow
              </h2>
              <div className="flex gap-2">
                {['Air', 'Sea', 'Land'].map(mode => (
                  <button key={mode} className="px-3 py-1 text-xs rounded-md bg-slate-700 hover:bg-slate-600 transition text-slate-300">
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px] w-full bg-slate-900 rounded-lg overflow-hidden relative border border-slate-700/50">
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={shipmentData}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="active" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActive)" />
                  <Area type="monotone" dataKey="delayed" stroke="#f43f5e" fill="transparent" />
                </AreaChart>
               </ResponsiveContainer>
               <div className="absolute top-4 right-4 text-xs text-slate-500 bg-slate-900/80 p-2 rounded backdrop-blur-sm border border-slate-800">
                 * Live tracking visualization
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers size={18} className="text-amber-400" /> Inventory Optimization
              </h2>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis dataKey="category" type="category" width={100} stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend />
                    <Bar dataKey="stock" name="Current Stock" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="optimal" name="Optimal Level" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-400" /> Trade Finance Flows
              </h2>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financialFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend />
                    <Line type="monotone" name="Revenue" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{r: 4}} />
                    <Line type="monotone" name="OpEx" dataKey="cost" stroke="#f43f5e" strokeWidth={2} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 rounded-xl border border-blue-900/50 shadow-lg h-full max-h-[700px] flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="text-yellow-400" fill="currentColor" /> Nexus AI
              </h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded">LIVE</span>
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Real-time Optimization</h3>
              <AIInsight 
                type="optimization" 
                message="Rerouting Shipment #XJ-92 via Port of Rotterdam saves 14h and $2,400 in fuel costs." 
              />
              <AIInsight 
                type="warning" 
                message="Raw Materials inventory critical. Predicted shortage in 12 days based on current manufacturing velocity." 
              />
              <AIInsight 
                type="info" 
                message="Currency fluctuation detected: EUR/USD shift may impact Q3 margins by 0.4%." 
              />
              
              <div className="my-6 border-t border-slate-700"></div>
              
              <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Predictive Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition flex items-center gap-3 group">
                  <div className="bg-blue-900/50 p-2 rounded text-blue-400 group-hover:text-blue-300">
                    <Navigation size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Initiate Early Restock</div>
                    <div className="text-xs text-slate-500">Auto-approve Vendor PO-992</div>
                  </div>
                </button>

                <button className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition flex items-center gap-3 group">
                  <div className="bg-amber-900/50 p-2 rounded text-amber-400 group-hover:text-amber-300">
                    <Anchor size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Delay Sea Freight</div>
                    <div className="text-xs text-slate-500">Consolidate container B4</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <div className="bg-slate-950 rounded p-3 text-xs font-mono text-slate-400">
                <p className="mb-1"><span className="text-blue-400">root@nexus:~$</span> analyzing route_efficiency...</p>
                <p className="mb-1"><span className="text-blue-400">root@nexus:~$</span> compiling trade_risk_matrix...</p>
                <p className="animate-pulse"><span className="text-emerald-400">_</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}