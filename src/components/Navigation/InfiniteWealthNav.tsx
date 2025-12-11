import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Globe2, 
  Landmark, 
  LineChart, 
  PieChart, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Search,
  FileText,
  Bell,
  Database,
  Briefcase
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  badge?: number;
  description?: string;
}

const InfiniteWealthNav: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('nexus');

  const mainNavItems: NavItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <LayoutDashboard size={20} />,
      description: 'Overview of market activity'
    },
    { 
      id: 'nexus', 
      label: 'Global Fixed Income Nexus', 
      icon: <Globe2 size={20} />,
      badge: 12,
      description: 'Sovereign & Corporate Bonds'
    },
    { 
      id: 'citadel', 
      label: 'Citadel', 
      icon: <Landmark size={20} />,
      description: 'Secure Asset Management'
    },
    { 
      id: 'market-data', 
      label: 'Market Data', 
      icon: <LineChart size={20} />,
      description: 'Real-time charts & quotes'
    },
    { 
      id: 'portfolio', 
      label: 'Portfolio', 
      icon: <PieChart size={20} />,
      description: 'Holdings & Performance'
    },
    { 
      id: 'issuers', 
      label: 'Issuers & Ratings', 
      icon: <Database size={20} />,
      description: 'Credit profiles'
    },
    { 
      id: 'trading', 
      label: 'Trading Desk', 
      icon: <Briefcase size={20} />,
      description: 'Orders & Execution'
    },
    { 
      id: 'reports', 
      label: 'Reports & Docs', 
      icon: <FileText size={20} />,
      description: 'Prospectus & Term Sheets'
    },
  ];

  return (
    <aside 
      className={`
        relative h-screen bg-[#0f172a] border-r border-slate-800 text-slate-300 
        transition-all duration-300 ease-in-out flex flex-col font-sans
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}
    >
      {/* Header / Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
            <Globe2 className="text-white" size={18} />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-white tracking-tight text-lg">
              Infinite Wealth
            </span>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-50 bg-slate-800 border border-slate-700 text-slate-400 rounded-full p-1 hover:text-white hover:bg-slate-700 transition-colors shadow-md"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Search Area */}
      <div className="p-4 shrink-0">
        <div className={`
          flex items-center bg-slate-800/50 rounded-lg border border-slate-700/50 focus-within:border-blue-500/50 focus-within:bg-slate-800 transition-colors
          ${isCollapsed ? 'justify-center p-2 cursor-pointer hover:bg-slate-700/50' : 'px-3 py-2'}
        `}>
          <Search size={18} className="text-slate-400 shrink-0" />
          {!isCollapsed && (
            <input 
              type="text" 
              placeholder="ISIN, CUSIP, Ticker..."
              className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-200 placeholder-slate-500"
            />
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
              const isActive = activeItem === item.id;
              return (
                  <button
                      key={item.id}
                      onClick={() => setActiveItem(item.id)}
                      className={`
                          w-full flex items-center rounded-lg transition-all duration-200 group relative
                          ${isCollapsed ? 'justify-center p-3' : 'px-3 py-3'}
                          ${isActive 
                              ? 'bg-blue-600/10 text-blue-400' 
                              : 'hover:bg-slate-800/50 hover:text-white'
                          }
                      `}
                      title={isCollapsed ? item.label : undefined}
                  >
                      <span className={`
                          shrink-0 transition-colors duration-200
                          ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}
                      `}>
                          {item.icon}
                      </span>
                      
                      {!isCollapsed && (
                          <div className="ml-3 flex-1 text-left flex items-center justify-between overflow-hidden">
                              <span className={`text-sm font-medium truncate ${isActive ? 'text-blue-100' : ''}`}>
                                  {item.label}
                              </span>
                              {item.badge && (
                                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ml-2">
                                      {item.badge}
                                  </span>
                              )}
                          </div>
                      )}
                      
                      {/* Active Indicator Bar */}
                      {isActive && (
                          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full ${isCollapsed ? '-ml-3' : '-ml-3'}`} />
                      )}
                  </button>
              );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-800 space-y-1 shrink-0 bg-[#0f172a]">
        <button 
            className={`
                w-full flex items-center rounded-lg transition-colors text-slate-400 hover:bg-slate-800/50 hover:text-white
                ${isCollapsed ? 'justify-center p-3' : 'px-3 py-3'}
            `}
            title="Notifications"
        >
            <div className="relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
            </div>
            {!isCollapsed && <span className="ml-3 text-sm font-medium">Notifications</span>}
        </button>
        
        <button 
            className={`
                w-full flex items-center rounded-lg transition-colors text-slate-400 hover:bg-slate-800/50 hover:text-white
                ${isCollapsed ? 'justify-center p-3' : 'px-3 py-3'}
            `}
            title="Settings"
        >
            <Settings size={20} />
            {!isCollapsed && <span className="ml-3 text-sm font-medium">Settings</span>}
        </button>

        {!isCollapsed && (
            <div className="mt-4 px-3 py-2 bg-slate-800/30 rounded-lg border border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        TS
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">Trading Support</p>
                        <p className="text-xs text-slate-500 truncate">desk@infinitewealth.com</p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </aside>
  );
};

export default InfiniteWealthNav;