import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Globe, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Search, 
  Download, 
  Settings, 
  Menu,
  X,
  Bell,
  ChevronDown,
  Lock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

// --- Types ---

interface ComplianceRule {
  id: string;
  name: string;
  jurisdiction: 'EU' | 'USA' | 'APAC' | 'GLOBAL';
  framework: string;
  status: 'compliant' | 'warning' | 'violation' | 'pending';
  lastChecked: string;
}

interface Alert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  category: string;
}

interface ComplianceMetric {
  name: string;
  score: number; // 0-100
  trend: 'up' | 'down' | 'stable';
}

// --- Mock Data ---

const MOCK_RULES: ComplianceRule[] = [
  { id: 'R-001', name: 'Data Retention Policy', jurisdiction: 'EU', framework: 'GDPR Art. 5', status: 'compliant', lastChecked: '10 mins ago' },
  { id: 'R-002', name: 'Right to be Forgotten', jurisdiction: 'EU', framework: 'GDPR Art. 17', status: 'warning', lastChecked: '1 hour ago' },
  { id: 'R-003', name: 'Consumer Data Access', jurisdiction: 'USA', framework: 'CCPA Sec. 110', status: 'compliant', lastChecked: '5 mins ago' },
  { id: 'R-004', name: 'Financial Reporting', jurisdiction: 'GLOBAL', framework: 'SOX 404', status: 'compliant', lastChecked: '2 mins ago' },
  { id: 'R-005', name: 'AML Transaction Monitoring', jurisdiction: 'APAC', framework: 'MAS 626', status: 'violation', lastChecked: 'Just now' },
];

const MOCK_ALERTS: Alert[] = [
  { id: 'A-101', severity: 'high', message: 'Unusual transaction volume detected in SG node', timestamp: '10:42 AM', category: 'AML' },
  { id: 'A-102', severity: 'medium', message: 'PII encryption latency exceeded threshold', timestamp: '09:15 AM', category: 'Security' },
  { id: 'A-103', severity: 'low', message: 'Daily audit report generated successfully', timestamp: '08:00 AM', category: 'System' },
];

const CHART_DATA = [
  { name: 'Mon', score: 92 },
  { name: 'Tue', score: 94 },
  { name: 'Wed', score: 91 },
  { name: 'Thu', score: 88 },
  { name: 'Fri', score: 95 },
  { name: 'Sat', score: 97 },
  { name: 'Sun', score: 96 },
];

const PIE_DATA = [
  { name: 'Compliant', value: 450, color: '#10B981' },
  { name: 'Warning', value: 40, color: '#F59E0B' },
  { name: 'Violation', value: 10, color: '#EF4444' },
];

// --- Components ---

const StatusBadge = ({ status }: { status: ComplianceRule['status'] }) => {
  const styles = {
    compliant: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    violation: 'bg-rose-100 text-rose-800 border-rose-200',
    pending: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const icons = {
    compliant: <CheckCircle className="w-3 h-3 mr-1" />,
    warning: <AlertTriangle className="w-3 h-3 mr-1" />,
    violation: <X className="w-3 h-3 mr-1" />,
    pending: <Activity className="w-3 h-3 mr-1" />,
  };

  return (
    <span className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function RegTechSentinel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'reports' | 'settings'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Filter rules based on search and jurisdiction
  const filteredRules = MOCK_RULES.filter(rule => 
    (selectedJurisdiction === 'All' || rule.jurisdiction === selectedJurisdiction) &&
    (rule.name.toLowerCase().includes(searchTerm.toLowerCase()) || rule.framework.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && <span className="font-bold text-lg text-white tracking-tight">Sentinel</span>}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
            {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          <NavItem 
            icon={<Activity />} 
            label="Dashboard" 
            isActive={activeTab === 'dashboard'} 
            isOpen={isSidebarOpen}
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Globe />} 
            label="Compliance Rules" 
            isActive={activeTab === 'rules'} 
            isOpen={isSidebarOpen}
            onClick={() => setActiveTab('rules')} 
          />
          <NavItem 
            icon={<FileText />} 
            label="Audit Reports" 
            isActive={activeTab === 'reports'} 
            isOpen={isSidebarOpen}
            onClick={() => setActiveTab('reports')} 
          />
          <NavItem 
            icon={<Settings />} 
            label="Configuration" 
            isActive={activeTab === 'settings'} 
            isOpen={isSidebarOpen}
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
              JD
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Jane Doe</p>
                <p className="text-xs text-slate-400 truncate">Chief Compliance Officer</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Global Compliance Overview'}
              {activeTab === 'rules' && 'Regulatory Rules Engine'}
              {activeTab === 'reports' && 'Audit & Reporting'}
              {activeTab === 'settings' && 'System Settings'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search regulations..." 
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            </div>
            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Compliance Score" 
                  value="96%" 
                  trend="+2.4%" 
                  trendUp={true} 
                  icon={<Shield className="text-indigo-600" />} 
                />
                <StatCard 
                  title="Active Rules" 
                  value="1,420" 
                  trend="Stable" 
                  trendUp={true} 
                  icon={<Globe className="text-emerald-600" />} 
                />
                <StatCard 
                  title="Critical Violations" 
                  value="3" 
                  trend="-1" 
                  trendUp={true} 
                  icon={<AlertTriangle className="text-rose-600" />} 
                />
                <StatCard 
                  title="Pending Audits" 
                  value="12" 
                  trend="Due Soon" 
                  trendUp={false} 
                  icon={<FileText className="text-amber-600" />} 
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-slate-800">Compliance Trend (30 Days)</h3>
                    <select className="text-sm border-slate-300 rounded-md border p-1">
                      <option>Global</option>
                      <option>EU Region</option>
                      <option>US Region</option>
                    </select>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={CHART_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" domain={[80, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-6">Rule Status Distribution</h3>
                  <div className="h-64 flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={PIE_DATA}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {PIE_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex gap-4 text-xs">
                      {PIE_DATA.map(item => (
                        <div key={item.name} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts & Jurisdictions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Live Alerts Feed</h3>
                    <span className="bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded-full font-medium">Live</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {MOCK_ALERTS.map(alert => (
                      <div key={alert.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                        <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                          alert.severity === 'high' ? 'bg-rose-500' : 
                          alert.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-slate-900">{alert.category} Alert</h4>
                            <span className="text-xs text-slate-400">{alert.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-slate-50 text-center">
                    <button className="text-sm text-indigo-600 font-medium hover:underline">View All Alerts</button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                   <div className="p-6 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Jurisdictional Heatmap</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                    <JurisdictionStatus name="European Union" status="optimal" coverage="100%" />
                    <JurisdictionStatus name="United States" status="warning" coverage="92%" />
                    <JurisdictionStatus name="Asia Pacific" status="critical" coverage="85%" />
                    <JurisdictionStatus name="Middle East" status="optimal" coverage="98%" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 overflow-x-auto">
                  {['All', 'EU', 'USA', 'APAC', 'GLOBAL'].map(jurisdiction => (
                    <button
                      key={jurisdiction}
                      onClick={() => setSelectedJurisdiction(jurisdiction)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedJurisdiction === jurisdiction 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {jurisdiction}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Rule ID</th>
                      <th className="px-6 py-4">Regulation Name</th>
                      <th className="px-6 py-4">Jurisdiction</th>
                      <th className="px-6 py-4">Framework</th>
                      <th className="px-6 py-4">Last Check</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-indigo-600">{rule.id}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{rule.name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-600">
                            <Globe className="w-3 h-3" /> {rule.jurisdiction}
                          </span>
                        </td>
                        <td className="px-6 py-4">{rule.framework}</td>
                        <td className="px-6 py-4 text-slate-400">{rule.lastChecked}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={rule.status} />
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-slate-400 hover:text-indigo-600">
                            <Settings className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Placeholder for other tabs */}
          {(activeTab === 'reports' || activeTab === 'settings') && (
            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-slate-200 border-dashed">
              <Lock className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Restricted Access Area</h3>
              <p className="text-slate-500 max-w-md text-center mt-2">
                This module requires elevated privileges. Please contact your system administrator to configure {activeTab === 'reports' ? 'automated audit reporting' : 'global system parameters'}.
              </p>
              <button className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-lg shadow-indigo-200">
                Request Access
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// --- Helper Components ---

function NavItem({ icon, label, isActive, isOpen, onClick }: { 
  icon: React.ReactNode, 
  label: string, 
  isActive: boolean, 
  isOpen: boolean,
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className={`${isActive ? 'text-white' : ''} ${!isOpen && 'mx-auto'}`}>
        {icon}
      </div>
      {isOpen && <span className="font-medium">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, trend, trendUp, icon }: { 
  title: string, 
  value: string, 
  trend: string, 
  trendUp: boolean, 
  icon: React.ReactNode 
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}>
          {trend}
        </span>
      </div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function JurisdictionStatus({ name, status, coverage }: { name: string, status: 'optimal' | 'warning' | 'critical', coverage: string }) {
  const statusColor = status === 'optimal' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-rose-500';
  
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white transition-colors cursor-pointer">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-slate-700">{name}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`}></div>
      </div>
      <div className="flex justify-between items-end">
        <span className="text-xs text-slate-500 uppercase">Coverage</span>
        <span className="font-bold text-slate-900">{coverage}</span>
      </div>
      <div className="w-full bg-slate-200 h-1.5 mt-2 rounded-full overflow-hidden">
        <div className={`h-full ${statusColor}`} style={{ width: coverage }}></div>
      </div>
    </div>
  );
}