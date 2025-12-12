import React, { useState, useEffect, useRef } from 'react';

// --- ICONS ---
const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
const ShieldIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const ActivityIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
const CrosshairIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>;
const BrainCircuitIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.938-.5"/><path d="M19.938 17.5A4 4 0 0 1 18 18"/></svg>;
const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const XIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const RefreshCwIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;


// --- TYPES ---
interface Threat {
    id: string;
    type: 'DDoS' | 'Malware' | 'Phishing' | 'Intrusion' | 'Data Exfiltration';
    severity: 'low' | 'medium' | 'high' | 'critical';
    location: { x: number; y: number; region: string };
    source_ip: string;
    target: string;
    timestamp: number;
    status: 'active' | 'mitigated' | 'investigating';
}

interface IntelReport {
    id: string;
    title: string;
    source: string;
    timestamp: string;
    summary: string;
    tags: string[];
    riskScore: number;
}

// --- MOCK DATA ---
const MOCK_THREATS: Threat[] = [
    { id: 'T-1024', type: 'DDoS', severity: 'high', location: { x: 25, y: 35, region: 'North America' }, source_ip: '192.168.X.X', target: 'Payment Gateway', timestamp: Date.now(), status: 'active' },
    { id: 'T-1025', type: 'Intrusion', severity: 'critical', location: { x: 75, y: 25, region: 'Asia Pacific' }, source_ip: '45.33.X.X', target: 'User Database', timestamp: Date.now() - 300000, status: 'investigating' },
    { id: 'T-1026', type: 'Phishing', severity: 'medium', location: { x: 48, y: 30, region: 'Europe' }, source_ip: '10.0.X.X', target: 'Employee Email', timestamp: Date.now() - 600000, status: 'active' },
    { id: 'T-1027', type: 'Data Exfiltration', severity: 'critical', location: { x: 30, y: 65, region: 'South America' }, source_ip: '200.1.X.X', target: 'S3 Buckets', timestamp: Date.now() - 1200000, status: 'mitigated' },
    { id: 'T-1028', type: 'Malware', severity: 'low', location: { x: 60, y: 70, region: 'Africa' }, source_ip: '102.4.X.X', target: 'Workstation 404', timestamp: Date.now() - 3600000, status: 'active' },
];

const MOCK_INTEL_REPORTS: IntelReport[] = [
    { id: 'R-5501', title: 'New Ransomware Variant "DarkCipher" Detected', source: 'Global Cyber Alliance', timestamp: '10 mins ago', summary: 'A new strain of ransomware targeting financial institutions has been identified. It utilizes a zero-day exploit in legacy VPN concentrators.', tags: ['Ransomware', 'Zero-Day', 'Finance'], riskScore: 92 },
    { id: 'R-5502', title: 'Suspicious Activity in SWIFT Network Node', source: 'Internal Heuristics', timestamp: '1 hour ago', summary: 'AI Anomaly Detection flagged unusual transfer patterns from a node in Eastern Europe. Currently investigating potential compromised credentials.', tags: ['SWIFT', 'Fraud', 'Internal'], riskScore: 78 },
    { id: 'R-5503', title: 'Phishing Campaign Targeting C-Level Executives', source: 'Email Security Gateway', timestamp: '3 hours ago', summary: 'High-volume spear-phishing campaign detected. Emails purport to be from legal counsel regarding "urgent regulatory compliance".', tags: ['Phishing', 'Social Engineering'], riskScore: 65 },
];


const ThreatIntelligenceView: React.FC = () => {
    const [threats, setThreats] = useState<Threat[]>(MOCK_THREATS);
    const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
    const [intelReports, setIntelReports] = useState<IntelReport[]>(MOCK_INTEL_REPORTS);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationPrompt, setSimulationPrompt] = useState('');
    const [simulationResult, setSimulationResult] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'live' | 'simulation'>('live');

    // Simulate real-time threat updates
    useEffect(() => {
        const interval = setInterval(() => {
            const randomId = Math.floor(Math.random() * threats.length);
            setThreats(prev => prev.map((t, i) => 
                i === randomId ? { ...t, timestamp: Date.now() } : t
            ));
        }, 3000);
        return () => clearInterval(interval);
    }, [threats]);

    const handleSimulate = () => {
        if (!simulationPrompt) return;
        setIsSimulating(true);
        // Simulate AI API call latency
        setTimeout(() => {
            setIsSimulating(false);
            setSimulationResult(`
### AI Attack Path Simulation: ${simulationPrompt}

**Scenario Analysis:**
Based on current network topology and known vulnerabilities, an attack vector initiating from the marketing server would likely proceed as follows:

1.  **Lateral Movement (Probability: 85%):** The attacker would leverage the shared SMB credentials found in the marketing share to pivot to the internal file server (FS-01).
2.  **Privilege Escalation (Probability: 60%):** FS-01 is currently unpatched for CVE-2023-XYZ. Exploitation would grant SYSTEM level access.
3.  **Target Acquisition:** From FS-01, the attacker has direct line-of-sight to the legacy payment processing VLAN.

**Recommended Mitigation:**
*   Immediately isolate the Marketing VLAN.
*   Rotate SMB service account credentials.
*   Apply patch KB5022 to FS-01.
            `);
        }, 2000);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-950 text-gray-100 font-sans overflow-hidden relative">
            
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
                <div className="flex items-center space-x-4">
                    <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                        <GlobeIcon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">Threat Intelligence</h1>
                        <p className="text-xs text-gray-400 font-mono">GLOBAL DEFCON: 4 | ACTIVE THREATS: {threats.filter(t => t.status === 'active').length}</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => setActiveTab('live')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'live' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Live Operations
                    </button>
                    <button 
                        onClick={() => setActiveTab('simulation')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${activeTab === 'simulation' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <BrainCircuitIcon className="w-4 h-4" />
                        <span>AI Simulation</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                
                {/* --- MAIN CONTENT AREA --- */}
                <div className="flex-1 flex flex-col relative">
                    
                    {/* LIVE MAP VIEW */}
                    {activeTab === 'live' && (
                        <div className="flex-1 relative bg-gray-950 overflow-hidden group">
                            {/* Stylized Grid Background */}
                            <div className="absolute inset-0 z-0 opacity-20" 
                                style={{ 
                                    backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', 
                                    backgroundSize: '40px 40px' 
                                }}>
                            </div>

                            {/* World Map SVG Abstract Representation */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                                <svg width="80%" height="80%" viewBox="0 0 100 100" className="fill-indigo-900/30 stroke-indigo-500/50">
                                    {/* Abstract Continents */}
                                    <path d="M20,30 Q30,20 40,30 T50,40 T30,50 T20,30" /> 
                                    <path d="M60,20 Q70,10 80,20 T90,30 T70,40 T60,20" />
                                    <path d="M50,60 Q60,50 70,60 T80,70 T60,80 T50,60" />
                                    <path d="M20,60 Q30,50 40,60 T40,80 T20,70 T20,60" />
                                </svg>
                            </div>

                            {/* Threat Blips */}
                            {threats.map((threat) => (
                                <button
                                    key={threat.id}
                                    onClick={() => setSelectedThreat(threat)}
                                    className={`absolute w-4 h-4 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-150 z-10 cursor-pointer`}
                                    style={{ left: `${threat.location.x}%`, top: `${threat.location.y}%` }}
                                >
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${threat.severity === 'critical' ? 'bg-red-500' : threat.severity === 'high' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${threat.severity === 'critical' ? 'bg-red-500' : threat.severity === 'high' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                                    
                                    {/* Tooltip on Hover */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-gray-900 border border-gray-700 p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 text-center">
                                        <p className="text-xs font-bold text-white">{threat.type}</p>
                                        <p className="text-[10px] text-gray-400">{threat.source_ip} -> {threat.target}</p>
                                    </div>
                                </button>
                            ))}
                            
                            {/* Selected Threat Detail Overlay */}
                            {selectedThreat && (
                                <div className="absolute top-4 right-4 w-80 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-lg p-4 shadow-2xl z-30 animate-in fade-in slide-in-from-right-10 duration-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-white">{selectedThreat.id}</h3>
                                        <button onClick={() => setSelectedThreat(null)} className="text-gray-400 hover:text-white"><XIcon className="w-5 h-5"/></button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Type</span>
                                            <span className="text-sm font-medium text-white">{selectedThreat.type}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Severity</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${getSeverityColor(selectedThreat.severity)} border`}>{selectedThreat.severity}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Source</span>
                                            <span className="text-sm font-mono text-indigo-300">{selectedThreat.source_ip}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Target</span>
                                            <span className="text-sm text-gray-200">{selectedThreat.target}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Region</span>
                                            <span className="text-sm text-gray-200">{selectedThreat.location.region}</span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium flex items-center justify-center space-x-2">
                                                <CrosshairIcon className="w-4 h-4" />
                                                <span>Initiate Response</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Decorative HUD Elements */}
                            <div className="absolute bottom-4 left-4 p-4 border border-gray-800 bg-gray-900/50 backdrop-blur text-xs font-mono text-gray-500 rounded">
                                <p>LAT: 34.0522 N</p>
                                <p>LNG: 118.2437 W</p>
                                <p className="text-indigo-400 mt-2 animate-pulse">SCANNING...</p>
                            </div>
                        </div>
                    )}

                    {/* AI SIMULATION VIEW */}
                    {activeTab === 'simulation' && (
                        <div className="flex-1 bg-gray-900 p-8 overflow-y-auto">
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="text-center mb-10">
                                    <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-full border border-indigo-500/30 mb-4">
                                        <BrainCircuitIcon className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Security Scenario Simulator</h2>
                                    <p className="text-gray-400">Use the Quantum Oracle AI to simulate attack vectors and test your defenses against hypothetical scenarios.</p>
                                </div>

                                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-xl">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Describe Scenario</label>
                                    <div className="relative">
                                        <textarea 
                                            value={simulationPrompt}
                                            onChange={(e) => setSimulationPrompt(e.target.value)}
                                            placeholder="e.g. If an attacker gains access to a developer's laptop with cached AWS credentials, what is the blast radius?"
                                            className="w-full bg-gray-950 border border-gray-700 rounded-lg p-4 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[120px]"
                                        />
                                        <button 
                                            onClick={handleSimulate}
                                            disabled={!simulationPrompt || isSimulating}
                                            className="absolute bottom-4 right-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center space-x-2 shadow-lg"
                                        >
                                            {isSimulating ? (
                                                <>
                                                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                                    <span>Simulating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <PlayIcon className="w-4 h-4" />
                                                    <span>Run Simulation</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {simulationResult && (
                                    <div className="bg-gray-950 border border-indigo-500/30 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-500">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <FileTextIcon className="w-5 h-5 text-indigo-400" />
                                            <h3 className="text-lg font-bold text-white">Simulation Report</h3>
                                        </div>
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <div className="whitespace-pre-wrap font-mono text-gray-300 leading-relaxed">
                                                {simulationResult}
                                            </div>
                                        </div>
                                        <div className="mt-6 flex justify-end space-x-3">
                                            <button className="px-4 py-2 border border-gray-700 hover:bg-gray-800 rounded text-sm text-gray-300">Save to Knowledge Base</button>
                                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm">Create Incident Ticket</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- RIGHT SIDEBAR: INTEL FEED --- */}
                <div className="w-96 border-l border-gray-800 bg-gray-900 flex flex-col">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/90 backdrop-blur sticky top-0">
                        <h2 className="font-bold text-white flex items-center space-x-2">
                            <ActivityIcon className="w-4 h-4 text-indigo-400" />
                            <span>Intel Feed</span>
                        </h2>
                        <button className="p-1 hover:bg-gray-800 rounded text-gray-400">
                            <SearchIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {intelReports.map((report) => (
                            <div key={report.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500/50 transition-colors group cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{report.source}</span>
                                    <span className="text-[10px] text-gray-500">{report.timestamp}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-100 mb-2 leading-snug group-hover:text-indigo-300 transition-colors">{report.title}</h3>
                                <p className="text-xs text-gray-400 line-clamp-3 mb-3">{report.summary}</p>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex space-x-1">
                                        {report.tags.map(tag => (
                                            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">{tag}</span>
                                        ))}
                                    </div>
                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${report.riskScore > 80 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        RISK: {report.riskScore}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <div className="text-center py-4">
                            <button className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">Load More Reports...</button>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-800 bg-gray-900">
                        <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm text-gray-300 flex items-center justify-center space-x-2 transition-all">
                            <BrainCircuitIcon className="w-4 h-4" />
                            <span>Summarize Feed with AI</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Icon for Feed Header
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

export default ThreatIntelligenceView;