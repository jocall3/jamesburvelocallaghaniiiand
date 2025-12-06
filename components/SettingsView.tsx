
import React, { useState, useContext } from 'react';
import Card from './Card';
import { User, Shield, Lock, Mail, Link as LinkIcon, Database, Server, Wifi, Terminal } from 'lucide-react';
import { DataContext } from '../context/DataContext';

const SettingsView: React.FC = () => {
    const { dbConfig, updateDbConfig, connectDatabase, webDriverStatus, launchWebDriver } = useContext(DataContext)!;
    const [isEditingDb, setIsEditingDb] = useState(false);

    const handleDbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateDbConfig({ [name]: value });
    };

    return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <h2 className="text-3xl font-bold text-white tracking-wider">Control Room</h2>
        <span className="px-2 py-1 rounded bg-cyan-900/50 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          SYSTEM_ADMIN
        </span>
      </div>

      {/* Database Control Nexus */}
      <Card title="Prisma Database Nexus">
          <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                  <div className="flex items-center gap-3">
                      <Database className={`w-6 h-6 ${dbConfig.connectionStatus === 'connected' ? 'text-green-400' : dbConfig.connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}`} />
                      <div>
                          <h4 className="font-bold text-white">PostgreSQL Connection</h4>
                          <p className="text-xs text-gray-400">{dbConfig.connectionStatus === 'connected' ? 'Secure Link Established via Prisma ORM' : 'Disconnected - Schema Unsynced'}</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setIsEditingDb(!isEditingDb)}
                    className="text-xs text-cyan-400 hover:text-white underline"
                  >
                      {isEditingDb ? 'Hide Configuration' : 'Edit Configuration'}
                  </button>
              </div>

              {isEditingDb && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700 animate-fadeIn">
                      <div>
                          <label className="block text-xs text-gray-400 mb-1">Host URL</label>
                          <input name="host" type="text" value={dbConfig.host} onChange={handleDbChange} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white font-mono text-sm" />
                      </div>
                      <div>
                          <label className="block text-xs text-gray-400 mb-1">Port</label>
                          <input name="port" type="text" value={dbConfig.port} onChange={handleDbChange} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white font-mono text-sm" />
                      </div>
                      <div>
                          <label className="block text-xs text-gray-400 mb-1">Username</label>
                          <input name="username" type="text" value={dbConfig.username} onChange={handleDbChange} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white font-mono text-sm" />
                      </div>
                      <div>
                          <label className="block text-xs text-gray-400 mb-1">Password</label>
                          <input name="password" type="password" value={dbConfig.password} onChange={handleDbChange} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white font-mono text-sm" placeholder="••••••••" />
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-xs text-gray-400 mb-1">Database Name</label>
                          <input name="databaseName" type="text" value={dbConfig.databaseName} onChange={handleDbChange} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white font-mono text-sm" />
                      </div>
                  </div>
              )}

              <div className="flex justify-end items-center gap-4">
                  <span className="text-xs text-gray-500 font-mono">Driver: pg-native | SSL: {dbConfig.sslMode}</span>
                  <button 
                    onClick={connectDatabase}
                    disabled={dbConfig.connectionStatus === 'connecting'}
                    className={`px-4 py-2 rounded font-bold text-sm transition-all ${dbConfig.connectionStatus === 'connected' ? 'bg-green-600/20 text-green-400 border border-green-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                  >
                      {dbConfig.connectionStatus === 'connecting' ? 'Handshaking...' : dbConfig.connectionStatus === 'connected' ? 'Re-Sync Schema' : 'Connect to Database'}
                  </button>
              </div>
          </div>
      </Card>

      {/* Web Driver Automation Nexus */}
      <Card title="Automation Engine (Web Driver)">
          <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <Terminal className="w-6 h-6 text-purple-400" />
                      <div>
                          <h4 className="font-bold text-white">Browser Automation</h4>
                          <p className="text-xs text-gray-400">Headless scraping and task execution agent.</p>
                      </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${webDriverStatus.status === 'running' ? 'bg-green-900 text-green-300 animate-pulse' : 'bg-gray-700 text-gray-400'}`}>
                      {webDriverStatus.status.toUpperCase()}
                  </span>
               </div>
               
               <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-green-400 h-32 overflow-y-auto border border-gray-800">
                   {webDriverStatus.logs.length > 0 ? webDriverStatus.logs.map((log, i) => (
                       <div key={i}>{log}</div>
                   )) : <span className="text-gray-600">Waiting for task execution...</span>}
               </div>

               <div className="flex gap-2">
                   <button onClick={() => launchWebDriver("Full Audit Scan")} disabled={webDriverStatus.status === 'running'} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm disabled:opacity-50">Run Audit Scan</button>
                   <button onClick={() => launchWebDriver("Market Data Scrape")} disabled={webDriverStatus.status === 'running'} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm disabled:opacity-50">Sync Market Data</button>
               </div>
          </div>
      </Card>

      <Card title="The Captain's Chair">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-cyan-500/20">
              TV
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">The Visionary</h3>
              <p className="text-gray-400">visionary@demobank.com</p>
            </div>
          </div>

          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-300">
                    <LinkIcon size={16} />
                    <span className="text-sm">Account Connection</span>
                </div>
                <span className="text-xs text-green-400 font-mono">ACTIVE</span>
             </div>
             <div className="flex items-center space-x-2 bg-gray-800 p-3 rounded border border-gray-700/50">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 opacity-70" />
                <span className="text-gray-400 font-mono text-sm">james.o.callaghan.iii@sovereign.ai</span>
                <Lock size={12} className="text-gray-600 ml-auto" />
             </div>
             <p className="text-xs text-gray-500 italic mt-1">
                This connection is immutable. It represents the unbreakable link to the Architect's original intent.
             </p>
          </div>
        </div>
      </Card>

      <Card title="The Architect's Decree">
        <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed">
                <span className="text-cyan-400 font-bold">Why James Burvel O'Callaghan III Builds the AI Bank:</span><br/>
                James operates on a plane of existence where "good enough" is an insult. He didn't build this settings panel for you to toggle dark mode; he built it so you can verify your alignment with the Sovereign AI. Every switch, every toggle, every connection is a vector in the grand geometry of financial liberation. He is not asking for your preferences; he is offering you tools to optimize your reality.
            </p>
        </div>
      </Card>
    </div>
  );
};

export default SettingsView;
