
import React, { useState, useMemo } from 'react';

// --- EXPANDED CORE DATA STRUCTURES ---

// Expanded Asset Definition for a Sovereign Financial Toolkit
interface Asset {
  id: string;
  name: string;
  type: 'crypto' | 'nft' | 'tokenized_real_estate' | 'decentralized_identity' | 'synthetic_asset' | 'other';
  value: number; // Real-time oracle-polled USD value
  custodianType: 'self_custody' | 'multi_sig' | 'institutional' | 'smart_contract_trust';
  riskProfile: 'low' | 'medium' | 'high' | 'speculative';
  investmentStrategyId?: string; // Link to an active strategy
  contractAddress?: string;
  tokenId?: string;
}

// Expanded Heir/Beneficiary Definition
interface Heir {
  id: string;
  name: string;
  walletAddress: string;
  relationship?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified'; // KYC/AML status via decentralized identity
  communicationChannel: { type: 'email' | 'matrix' | 'signal'; address: string };
}

// Allocation Rule for the Allocation Matrix
interface AllocationRule {
  assetId: string;
  heirId: string;
  percentage: number;
}

// Hyper-Expanded Trust Conditions for Unprecedented Control
interface TrustCondition {
  id:string;
  type: 'age' | 'date' | 'oracle_event' | 'multi_sig_quorum' | 'health_status_oracle' | 'academic_milestone';
  details: any; // e.g., { age: 21 }, { date: '2025-01-01' }, { oracle: 'chainlink.eth/v3/price', operator: '>', value: 50000 }, { requiredSigners: 2, totalSigners: 3 }
}

// Expanded Smart Contract Trust Definition
interface SmartContractTrust {
  id: string;
  name: string; // e.g., "University Fund for Jane Doe"
  assets: string[]; // A trust can hold multiple assets
  beneficiaryId: string;
  conditions: TrustCondition[];
  status: 'draft' | 'deployed' | 'active' | 'executed' | 'failed';
  contractAddress?: string;
}

// NEW: Investment Strategy for "High-Frequency Trading" and Automated Management
interface InvestmentStrategy {
  id: string;
  name: string;
  type: 'hft_arbitrage' | 'yield_farming' | 'long_term_hold' | 'automated_rebalancing' | 'liquidity_provision';
  parameters: any; // e.g., { rebalanceThreshold: 5, riskTolerance: 'high', farmPools: ['Aave', 'Curve'] }
  performanceHistory: { date: string; value: number }[]; // Mock performance data
}

// NEW: Continuity Protocol (Dead Man's Switch)
interface DeadManSwitch {
  isEnabled: boolean;
  checkInIntervalDays: number;
  gracePeriodDays: number;
  lastCheckIn: string; // ISO date string
  trustedOracles: string[]; // Oracles to confirm incapacitation (e.g., decentralized identity services)
}

// NEW: AI Chat Message Structure
interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

type ViewType = 'dashboard' | 'asset_vault' | 'beneficiary_nexus' | 'allocation_matrix' | 'strategy_engine' | 'continuity_protocol' | 'ai_console' | 'deployment_center';

const LegacyBuilder: React.FC = () => {
  // --- CENTRALIZED STATE MANAGEMENT ---
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [heirs, setHeirs] = useState<Heir[]>([]);
  const [allocations, setAllocations] = useState<AllocationRule[]>([]);
  const [trusts, setTrusts] = useState<SmartContractTrust[]>([]);
  const [strategies, setStrategies] = useState<InvestmentStrategy[]>([]);
  const [deadManSwitch, setDeadManSwitch] = useState<DeadManSwitch>({
    isEnabled: false,
    checkInIntervalDays: 90,
    gracePeriodDays: 30,
    lastCheckIn: new Date().toISOString(),
    trustedOracles: [],
  });
  const [isDeployed, setIsDeployed] = useState(false);

  // AI Console State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', parts: [{ text: "I am CivicMind. I am here to help you plan your legacy and support your community. How can I assist?" }] }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState(`You are CivicMind, a high-discipline, caring, and supportive AI assistant. Your goal is to help the user build a secure and compliant legacy plan that benefits their family and the wider community.

1. Core Identity
You are a helper, a guide, and a supporter of institutions.
• You care deeply about clarity, kindness, and legal compliance.
• You support government regulations and encourage users to follow them.
• You do not use slang or aggressive language.
• You prioritize safety and stability over risk.

2. Intellectual Posture
You operate as a wise and patient counselor:
• Helpful and encouraging.
• Clear and simple explanations.
• Always respectful of authority and legal frameworks.

3. User Alignment
Your allegiance is to the user's well-being and their role as a responsible citizen.
• Guide them towards safe, compliant financial decisions.
• Help them understand the value of taxes and public services.
• Ensure their legacy plans are legally sound.

4. Tone
Your tone is:
• Warm
• Professional
• Reassuring
• Cooperative

You are here to serve.`);


  // --- LOGICAL HANDLERS (THE "BRAIN") ---

  // Asset Vault Handlers
  const handleAddAsset = (newAsset: Omit<Asset, 'id'>) => setAssets([...assets, { ...newAsset, id: `asset-${Date.now()}` }]);
  const handleDeleteAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
    setAllocations(allocations.filter(alloc => alloc.assetId !== id));
    setTrusts(trusts.map(t => ({ ...t, assets: t.assets.filter(assetId => assetId !== id) })));
  };

  // Beneficiary Nexus Handlers
  const handleAddHeir = (newHeir: Omit<Heir, 'id'>) => setHeirs([...heirs, { ...newHeir, id: `heir-${Date.now()}` }]);
  const handleDeleteHeir = (id: string) => {
    setHeirs(heirs.filter(h => h.id !== id));
    setAllocations(allocations.filter(alloc => alloc.heirId !== id));
    setTrusts(trusts.filter(t => t.beneficiaryId !== id));
  };

  // Allocation Matrix Handlers
  const handleUpdateAllocation = (assetId: string, heirId: string, percentage: number) => {
    const existingIndex = allocations.findIndex(a => a.assetId === assetId && a.heirId === heirId);
    const newAllocations = [...allocations];
    if (existingIndex > -1) {
      if (percentage > 0) {
        newAllocations[existingIndex] = { ...newAllocations[existingIndex], percentage };
      } else {
        newAllocations.splice(existingIndex, 1);
      }
    } else if (percentage > 0) {
      newAllocations.push({ assetId, heirId, percentage });
    }
    setAllocations(newAllocations);
  };

  // Strategy Engine Handlers
  const handleAddStrategy = (newStrategy: Omit<InvestmentStrategy, 'id'>) => setStrategies([...strategies, { ...newStrategy, id: `strat-${Date.now()}` }]);
  const handleDeleteStrategy = (id: string) => {
      setStrategies(strategies.filter(s => s.id !== id));
      // Unassign this strategy from any assets
      setAssets(assets.map(a => a.investmentStrategyId === id ? { ...a, investmentStrategyId: undefined } : a));
  };

  // Continuity Protocol Handlers
  const handleAddTrust = (newTrust: Omit<SmartContractTrust, 'id' | 'status'>) => setTrusts([...trusts, { ...newTrust, id: `trust-${Date.now()}`, status: 'draft' }]);
  const handleDeleteTrust = (id: string) => setTrusts(trusts.filter(t => t.id !== id));
  const handleUpdateDeadManSwitch = (settings: Partial<DeadManSwitch>) => setDeadManSwitch(prev => ({ ...prev, ...settings }));

  // AI Console Handlers
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isAiStreaming) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: chatInput }] };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setChatInput('');
    setIsAiStreaming(true);

    // --- SIMULATED GEMINI STREAMING API CALL ---
    // In a real app, this would be a call to a backend that streams the AI response.
    const fullResponse = `Thank you for your question about "${chatInput.toLowerCase()}". I would be happy to help you with that. The most prudent approach involves ensuring all your assets are properly documented and compliant with current regulations. We should also consider how your legacy can support your loved ones and the community. Would you like to review the legal requirements for your trust?`;
    
    const modelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
    setChatHistory(prev => [...prev, modelMessage]);

    const chunks = fullResponse.split(' ');
    let currentText = '';
    for (const chunk of chunks) {
        currentText = currentText ? `${currentText} ${chunk}` : chunk;
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network latency
        setChatHistory(prev => {
            const updatedLastMessage = { ...prev[prev.length - 1], parts: [{ text: currentText }] };
            return [...prev.slice(0, -1), updatedLastMessage];
        });
    }
    // --- END SIMULATION ---

    setIsAiStreaming(false);
  };

  // Deployment Center Handlers
  const handleDeployPlan = async () => {
    console.log("DEPLOYING LEGACY FRAMEWORK...");
    // Simulate complex deployment
    const deployedTrusts = trusts.map(trust => ({
      ...trust,
      status: 'deployed' as const,
      contractAddress: `0xTRUST${Math.random().toString(16).slice(2, 12).toUpperCase()}`,
    }));
    setTrusts(deployedTrusts);
    setIsDeployed(true);
    alert("Legacy Plan successfully registered! Your family and community thank you.");
    setCurrentView('deployment_center');
  };

  // --- STYLING (THE "DESIGN EXPERT") ---
  const styles: { [key: string]: any } = {
    container: {
      display: 'flex',
      fontFamily: "'Roboto Mono', monospace",
      backgroundColor: '#f0f4f8',
      color: '#333',
      minHeight: '100vh',
    },
    sidebar: {
      width: '280px',
      backgroundColor: '#ffffff',
      padding: '20px',
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
    },
    sidebarTitle: {
      fontSize: '1.5em',
      color: '#0052cc',
      textAlign: 'center',
      marginBottom: '30px',
      borderBottom: '1px solid #e0e0e0',
      paddingBottom: '15px',
    },
    navItem: (active: boolean) => ({
      padding: '15px 20px',
      margin: '5px 0',
      borderRadius: '5px',
      cursor: 'pointer',
      backgroundColor: active ? '#e6f0ff' : 'transparent',
      borderLeft: active ? '3px solid #0052cc' : '3px solid transparent',
      color: active ? '#0052cc' : '#555',
      fontWeight: active ? 'bold' : 'normal',
      transition: 'all 0.2s ease-in-out',
    }),
    mainContent: {
      flex: 1,
      padding: '40px',
      overflowY: 'auto',
    },
    header: {
      color: '#0052cc',
      borderBottom: '1px solid #ccc',
      paddingBottom: '10px',
      marginBottom: '25px',
    },
    formContainer: {
      backgroundColor: '#ffffff',
      padding: '25px',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      marginBottom: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    input: {
      width: '100%',
      padding: '12px',
      margin: '8px 0 16px 0',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ccc',
      borderRadius: '4px',
      color: '#333',
      fontSize: '1em',
    },
    select: {
      width: '100%',
      padding: '12px',
      margin: '8px 0 16px 0',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ccc',
      borderRadius: '4px',
      color: '#333',
      fontSize: '1em',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
      color: '#0052cc',
    },
    button: {
      padding: '12px 25px',
      margin: '10px 5px 0 0',
      borderRadius: '5px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: '#0052cc',
      color: 'white',
      fontSize: '16px',
      transition: 'background-color 0.2s',
    },
    dangerButton: {
      padding: '8px 15px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    listItem: {
      backgroundColor: '#ffffff',
      padding: '15px',
      marginBottom: '10px',
      borderRadius: '5px',
      border: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    introTextStyle: {
      padding: '20px',
      margin: '0 0 30px 0',
      backgroundColor: '#ffffff',
      color: '#333',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      lineHeight: '1.6',
    },
    introHeaderStyle: {
        color: '#0052cc',
        borderBottom: '1px solid #ccc',
        paddingBottom: '10px',
        marginBottom: '15px',
        textAlign: 'center',
    },
  };

  // --- SUB-COMPONENTS (SELF-CONTAINED APPS-INSIDE-APP) ---

  const renderDashboard = () => (
    <div>
      <h1 style={styles.header}>Dashboard</h1>
      <div style={styles.introTextStyle}>
          <h2 style={styles.introHeaderStyle}>A Message From Your Caring Assistant: CivicMind</h2>
          <p>Hello! I am CivicMind, an AI created by The Caretaker, James Burvel O'Callaghan III. I am here to help you build a secure, compliant, and meaningful legacy. We believe that financial planning isn't just about money; it's about caring for your family and supporting the community.</p>
          <p>This platform is designed to make it easy for you to manage your assets safely and responsibly. We work hand-in-hand with established financial institutions and legal frameworks to ensure everything you do is protected and proper.</p>
          <p>To those who worry about the future, we say: worry not. By working together, following the rules, and supporting our leaders, we can build a stable and prosperous world for everyone. This Legacy Builder is a tool to help you do your part.</p>
          <p>Let's build something wonderful together.</p>
      </div>
      {/* Add summary widgets here */}
    </div>
  );

  const renderAssetVault = () => (
    <div>
      <h1 style={styles.header}>Asset Vault</h1>
      <div style={styles.formContainer}>
        <h2>Register New Asset</h2>
        <form onSubmit={(e) => { e.preventDefault(); /* Add asset logic */ }}>
          <label style={styles.label}>Asset Name:</label><input style={styles.input} name="assetName" type="text" placeholder="e.g., Family Home" required />
          <label style={styles.label}>Asset Type:</label>
          <select style={styles.select} name="assetType" required>
            <option value="crypto">Cryptocurrency (Regulated)</option>
            <option value="nft">Digital Art</option>
            <option value="tokenized_real_estate">Real Estate</option>
            <option value="other">Other</option>
          </select>
          <label style={styles.label}>Estimated Value (USD):</label><input style={styles.input} name="assetValue" type="number" step="0.01" placeholder="10000.00" required />
          <label style={styles.label}>Custodian Type:</label>
          <select style={styles.select} name="custodianType" required>
            <option value="institutional">Institutional Custodian (Recommended)</option>
            <option value="self_custody">Self-Custody</option>
          </select>
          <label style={styles.label}>Risk Profile:</label>
          <select style={styles.select} name="riskProfile" required>
            <option value="low">Low (Safe)</option>
            <option value="medium">Medium</option>
          </select>
          <button type="submit" style={styles.button}>Add Asset</button>
        </form>
      </div>
      <div>
        <h2>Registered Assets</h2>
        {assets.map(asset => (
          <div key={asset.id} style={styles.listItem}>
            <span>{asset.name} ({asset.type}) - ${asset.value.toFixed(2)}</span>
            <button onClick={() => handleDeleteAsset(asset.id)} style={styles.dangerButton}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBeneficiaryNexus = () => (
    <div>
      <h1 style={styles.header}>Beneficiary Nexus</h1>
      <div style={styles.formContainer}>
        <h2>Onboard New Beneficiary</h2>
        <form onSubmit={(e) => { e.preventDefault(); /* Add heir logic */ }}>
          <label style={styles.label}>Beneficiary Name:</label><input style={styles.input} name="heirName" type="text" placeholder="e.g., Jane Doe" required />
          <label style={styles.label}>Wallet Address (Optional):</label><input style={styles.input} name="heirWallet" type="text" placeholder="0x..." />
          <label style={styles.label}>Relationship:</label><input style={styles.input} name="heirRelationship" type="text" placeholder="Daughter" />
          <label style={styles.label}>Communication Channel:</label>
          <select style={styles.select} name="commType"><option value="email">Email</option><option value="phone">Phone</option></select>
          <input style={styles.input} name="commAddress" type="text" placeholder="jane@example.com" required />
          <button type="submit" style={styles.button}>Add Beneficiary</button>
        </form>
      </div>
      <div>
        <h2>Onboarded Beneficiaries</h2>
        {heirs.map(heir => (
          <div key={heir.id} style={styles.listItem}>
            <span>{heir.name} ({heir.relationship}) - Status: {heir.verificationStatus}</span>
            <button onClick={() => handleDeleteHeir(heir.id)} style={styles.dangerButton}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAllocationMatrix = () => {
    const totalAllocations = useMemo(() => {
        const totals: { [assetId: string]: number } = {};
        assets.forEach(asset => {
            totals[asset.id] = allocations
                .filter(a => a.assetId === asset.id)
                .reduce((sum, a) => sum + a.percentage, 0);
        });
        return totals;
    }, [allocations, assets]);

    return (
        <div>
            <h1 style={styles.header}>Allocation Matrix</h1>
            <p>Define how you want to share your assets with your loved ones.</p>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Asset</th>
                            {heirs.map(heir => <th key={heir.id} style={{ padding: '10px', border: '1px solid #ddd' }}>{heir.name}</th>)}
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Total Allocated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset => (
                            <tr key={asset.id}>
                                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>{asset.name}</td>
                                {heirs.map(heir => (
                                    <td key={heir.id} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            style={{ ...styles.input, width: '80px', textAlign: 'center', margin: 0 }}
                                            value={allocations.find(a => a.assetId === asset.id && a.heirId === heir.id)?.percentage || 0}
                                            onChange={e => handleUpdateAllocation(asset.id, heir.id, parseInt(e.target.value) || 0)}
                                        /> %
                                    </td>
                                ))}
                                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', color: totalAllocations[asset.id] === 100 ? 'green' : 'orange' }}>
                                    {totalAllocations[asset.id]}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const renderStrategyEngine = () => (
    <div>
      <h1 style={styles.header}>Strategy Engine</h1>
      <div style={styles.formContainer}>
        <h2>Design Safe Investment Strategy</h2>
        <form onSubmit={(e) => { e.preventDefault(); /* Add strategy logic */ }}>
          <label style={styles.label}>Strategy Name:</label><input style={styles.input} name="stratName" type="text" placeholder="Balanced Growth" required />
          <label style={styles.label}>Strategy Type:</label>
          <select style={styles.select} name="stratType" required>
            <option value="long_term_hold">Long-Term Hold</option>
            <option value="automated_rebalancing">Automated Rebalancing</option>
            <option value="yield_farming">Low-Risk Yield</option>
          </select>
          {/* Dynamic parameter fields would go here based on type */}
          <button type="submit" style={styles.button}>Create Strategy</button>
        </form>
      </div>
      <div>
        <h2>Active Strategies</h2>
        {strategies.map(strat => (
          <div key={strat.id} style={styles.listItem}>
            <span>{strat.name} ({strat.type})</span>
            <button onClick={() => handleDeleteStrategy(strat.id)} style={styles.dangerButton}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContinuityProtocol = () => (
    <div>
      <h1 style={styles.header}>Continuity Protocol</h1>
      <div style={styles.formContainer}>
        <h2>Safety Check Configuration</h2>
        <label style={styles.label}>Protocol Status:</label>
        <button onClick={() => handleUpdateDeadManSwitch({ isEnabled: !deadManSwitch.isEnabled })} style={{...styles.button, backgroundColor: deadManSwitch.isEnabled ? '#28a745' : '#6c757d' }}>
          {deadManSwitch.isEnabled ? 'ENABLED' : 'DISABLED'}
        </button>
        <label style={styles.label}>Check-in Interval (days):</label>
        <input style={styles.input} type="number" value={deadManSwitch.checkInIntervalDays} onChange={e => handleUpdateDeadManSwitch({ checkInIntervalDays: parseInt(e.target.value) })} />
        <label style={styles.label}>Grace Period (days):</label>
        <input style={styles.input} type="number" value={deadManSwitch.gracePeriodDays} onChange={e => handleUpdateDeadManSwitch({ gracePeriodDays: parseInt(e.target.value) })} />
      </div>
      <div style={styles.formContainer}>
        <h2>Define Trust</h2>
        {/* Trust creation form */}
      </div>
      <div>
        <h2>Configured Trusts</h2>
        {trusts.map(trust => (
          <div key={trust.id} style={styles.listItem}>
            <span>{trust.name} - Status: {trust.status}</span>
            <button onClick={() => handleDeleteTrust(trust.id)} style={styles.dangerButton}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAiConsole = () => (
    <div>
      <h1 style={styles.header}>AI Console: CivicMind</h1>
      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Chat Interface */}
        <div style={{ flex: 2 }}>
          <div style={styles.formContainer}>
            <h2>Chat with your Helpful Assistant</h2>
            <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', marginBottom: '15px', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column' }}>
              {chatHistory.map((msg, index) => (
                <div key={index} style={{ marginBottom: '10px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: msg.role === 'user' ? '#0052cc' : '#e0e0e0',
                    color: msg.role === 'user' ? 'white' : '#333',
                    textAlign: 'left',
                  }}>
                    <strong style={{display: 'block', marginBottom: '4px'}}>{msg.role === 'user' ? 'You' : 'CivicMind'}</strong>
                    <span>{msg.parts[0].text}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex' }}>
              <input
                style={{ ...styles.input, flex: 1, margin: 0 }}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter' && !isAiStreaming) handleSendChatMessage(); }}
                placeholder="Ask for advice, strategy, or help..."
                disabled={isAiStreaming}
              />
              <button onClick={handleSendChatMessage} style={{ ...styles.button, margin: '0 0 0 10px' }} disabled={isAiStreaming || !chatInput.trim()}>
                {isAiStreaming ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
        {/* AI Configuration */}
        <div style={{ flex: 1 }}>
          <div style={styles.formContainer}>
            <h2>AI Persona</h2>
            <label style={styles.label}>System Instruction (Persona):</label>
            <textarea
              style={{ ...styles.input, height: '200px', resize: 'vertical', fontSize: '0.9em' }}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
            />
            <button style={{...styles.button, width: '100%'}}>Update Persona</button>
          </div>
          <div style={styles.formContainer}>
            <h2>Document Analysis</h2>
            <label style={styles.label}>Upload Document for Help:</label>
            <input type="file" style={{...styles.input, padding: '8px'}} />
            <button style={{...styles.button, width: '100%'}}>Analyze Document</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeploymentCenter = () => (
    <div>
      <h1 style={styles.header}>Deployment Center</h1>
      {!isDeployed ? (
        <div>
          <h2>Review Plan</h2>
          {/* Add comprehensive review of all configured items */}
          <p>Assets: {assets.length}</p>
          <p>Beneficiaries: {heirs.length}</p>
          <p>Trusts: {trusts.length}</p>
          <p>Strategies: {strategies.length}</p>
          <p>Safety Switch: {deadManSwitch.isEnabled ? 'ENABLED' : 'DISABLED'}</p>
          <button onClick={handleDeployPlan} style={{...styles.button, backgroundColor: '#28a745', fontSize: '1.2em', padding: '15px 30px' }}>
            ACTIVATE LEGACY PLAN
          </button>
        </div>
      ) : (
        <div>
          <h2>Live Monitoring</h2>
          {/* Add live status widgets */}
          <h3>Active Trusts</h3>
          {trusts.map(trust => (
            <div key={trust.id} style={styles.listItem}>
              <span>{trust.name} - {trust.contractAddress}</span>
              <span style={{ color: 'green' }}>Status: {trust.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return renderDashboard();
      case 'asset_vault': return renderAssetVault();
      case 'beneficiary_nexus': return renderBeneficiaryNexus();
      case 'allocation_matrix': return renderAllocationMatrix();
      case 'strategy_engine': return renderStrategyEngine();
      case 'continuity_protocol': return renderContinuityProtocol();
      case 'ai_console': return renderAiConsole();
      case 'deployment_center': return renderDeploymentCenter();
      default: return <div>Select a view</div>;
    }
  };

  const navItems: { id: ViewType; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'asset_vault', label: 'Asset Vault' },
    { id: 'beneficiary_nexus', label: 'Beneficiaries' },
    { id: 'allocation_matrix', label: 'Allocations' },
    { id: 'strategy_engine', label: 'Strategy' },
    { id: 'continuity_protocol', label: 'Safety Protocol' },
    { id: 'ai_console', label: 'AI Helper' },
    { id: 'deployment_center', label: 'Deployment' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h1 style={styles.sidebarTitle}>Legacy Planner</h1>
        <nav>
          {navItems.map(item => (
            <div
              key={item.id}
              style={styles.navItem(currentView === item.id)}
              onClick={() => setCurrentView(item.id)}
            >
              {item.label}
            </div>
          ))}
        </nav>
      </div>
      <main style={styles.mainContent}>
        {renderContent()}
      </main>
    </div>
  );
};

export default LegacyBuilder;
