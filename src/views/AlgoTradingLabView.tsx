import React, { useState } from 'react';
import './AlgoTradingLabView.css'; // Assuming you'll create a CSS file for styling

interface TradingAgent {
  id: string;
  name: string;
  status: 'Running' | 'Stopped' | 'Error';
  strategy: string;
  profitLoss: number;
  openTrades: number;
  lastUpdated: string;
}

const initialAgents: TradingAgent[] = [
  {
    id: 'agent-1',
    name: 'Scalper Pro',
    status: 'Running',
    strategy: 'Momentum Scalping',
    profitLoss: 1250.75,
    openTrades: 5,
    lastUpdated: new Date().toLocaleString(),
  },
  {
    id: 'agent-2',
    name: 'Trend Follower v2',
    status: 'Stopped',
    strategy: 'EMA Crossover',
    profitLoss: -300.20,
    openTrades: 0,
    lastUpdated: new Date(Date.now() - 3600000).toLocaleString(), // 1 hour ago
  },
  {
    id: 'agent-3',
    name: 'Arbitrage Bot',
    status: 'Running',
    strategy: 'Exchange Arbitrage',
    profitLoss: 5000.00,
    openTrades: 2,
    lastUpdated: new Date().toLocaleString(),
  },
];

const AlgoTradingLabView: React.FC = () => {
  const [agents, setAgents] = useState<TradingAgent[]>(initialAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(agents.length > 0 ? agents[0].id : null);
  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  const handleStartAgent = (id: string) => {
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === id ? { ...agent, status: 'Running', lastUpdated: new Date().toLocaleString() } : agent
      )
    );
  };

  const handleStopAgent = (id: string) => {
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === id ? { ...agent, status: 'Stopped', openTrades: 0, lastUpdated: new Date().toLocaleString() } : agent
      )
    );
  };

  const handleCreateAgent = () => {
    const newAgent: TradingAgent = {
      id: `agent-${Date.now()}`,
      name: `New Agent ${agents.length + 1}`,
      status: 'Stopped',
      strategy: 'Custom Strategy',
      profitLoss: 0,
      openTrades: 0,
      lastUpdated: new Date().toLocaleString(),
    };
    setAgents(prevAgents => [...prevAgents, newAgent]);
    setSelectedAgentId(newAgent.id);
  };

  return (
    <div className="algo-trading-lab">
      <header className="lab-header">
        <h1>Algo Trading Lab</h1>
        <button className="create-agent-button" onClick={handleCreateAgent}>+ Create New Agent</button>
      </header>

      <div className="lab-content">
        <aside className="agent-sidebar">
          <h2>Trading Agents</h2>
          <ul className="agent-list">
            {agents.map(agent => (
              <li
                key={agent.id}
                className={`agent-item ${agent.id === selectedAgentId ? 'selected' : ''}`}
                onClick={() => setSelectedAgentId(agent.id)}
              >
                <div className="agent-name">{agent.name}</div>
                <div className={`agent-status status-${agent.status.toLowerCase()}`}>{agent.status}</div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="agent-details-panel">
          {selectedAgent ? (
            <>
              <h2>Agent: {selectedAgent.name}</h2>
              <div className="agent-controls">
                {selectedAgent.status === 'Stopped' ? (
                  <button onClick={() => handleStartAgent(selectedAgent.id)} className="control-button start">
                    Start Agent
                  </button>
                ) : (
                  <button onClick={() => handleStopAgent(selectedAgent.id)} className="control-button stop">
                    Stop Agent
                  </button>
                )}
                <button className="control-button edit">Configure</button>
              </div>

              <div className="agent-info-grid">
                <div className="info-card">
                  <h3>Status</h3>
                  <p className={`status-${selectedAgent.status.toLowerCase()}`}>{selectedAgent.status}</p>
                </div>
                <div className="info-card">
                  <h3>Strategy</h3>
                  <p>{selectedAgent.strategy}</p>
                </div>
                <div className="info-card">
                  <h3>P&L</h3>
                  <p className={selectedAgent.profitLoss >= 0 ? 'profit' : 'loss'}>
                    ${selectedAgent.profitLoss.toFixed(2)}
                  </p>
                </div>
                <div className="info-card">
                  <h3>Open Trades</h3>
                  <p>{selectedAgent.openTrades}</p>
                </div>
                <div className="info-card full-width">
                  <h3>Last Updated</h3>
                  <p>{selectedAgent.lastUpdated}</p>
                </div>
              </div>

              <section className="agent-monitoring">
                <h3>Real-time Monitoring</h3>
                <div className="monitoring-area">
                  <div className="chart-placeholder">
                    {/* Placeholder for a trading chart */}
                    <p>Trading Chart (e.g., Candlestick, Line Chart)</p>
                  </div>
                  <div className="logs-placeholder">
                    <h4>Activity Logs</h4>
                    <pre>
                      [{new Date().toLocaleTimeString()}] Agent {selectedAgent.name} - Initializing strategy...
                      [{new Date().toLocaleTimeString()}] Agent {selectedAgent.name} - Checking market conditions.
                      [{new Date().toLocaleTimeString()}] Agent {selectedAgent.name} - Executed BUY order for XYZ.
                      [{new Date().toLocaleTimeString()}] Agent {selectedAgent.name} - Monitoring open trades...
                    </pre>
                  </div>
                </div>
              </section>

              <section className="agent-configuration-area">
                <h3>Configuration (Edit Mode)</h3>
                <form className="config-form">
                  <div className="form-group">
                    <label htmlFor="agentName">Agent Name:</label>
                    <input type="text" id="agentName" defaultValue={selectedAgent.name} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="strategyType">Strategy Type:</label>
                    <select id="strategyType" defaultValue={selectedAgent.strategy}>
                      <option value="Momentum Scalping">Momentum Scalping</option>
                      <option value="EMA Crossover">EMA Crossover</option>
                      <option value="Exchange Arbitrage">Exchange Arbitrage</option>
                      <option value="Custom Strategy">Custom Strategy</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="riskTolerance">Risk Tolerance (% of capital):</label>
                    <input type="number" id="riskTolerance" defaultValue="1" min="0.1" max="10" step="0.1" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="capitalAllocation">Capital Allocation:</label>
                    <input type="number" id="capitalAllocation" defaultValue="10000" min="100" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="apiKeys">Exchange API Keys:</label>
                    <textarea id="apiKeys" rows={4} placeholder="Enter API Key and Secret..."></textarea>
                  </div>
                  <button type="submit" className="save-config-button">Save Configuration</button>
                </form>
              </section>
            </>
          ) : (
            <p>Select an agent from the sidebar or create a new one to view details.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default AlgoTradingLabView;