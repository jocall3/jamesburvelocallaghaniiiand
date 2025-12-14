import React, { useState, useEffect, useReducer, useRef, useMemo, useCallback } from 'react';

/**
 * THE OMNISCIENT ANOMALY ENGINE (OAE) - PROPRIETARY SOURCE CODE
 * ------------------------------------------------------------
 * This file contains the complete simulation logic for the Open Source Universe Monitor.
 * It replaces the legacy 'AnomaliesView' with a hyper-dimensional state machine.
 * 
 * ARCHITECTURE:
 * 1. Core Simulation Loop (The Heartbeat)
 * 2. Entity Registry (The 100 Systems)
 * 3. Anomaly Generation Matrix (The Chaos Engine)
 * 4. Holographic UI Layer (The Viewport)
 */

// --- 0. CORE UTILITIES & MATH KERNEL ---

const U = {
    uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }),
    rand: (min: number, max: number) => Math.random() * (max - min) + min,
    randInt: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min),
    pick: <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
    clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max),
    now: () => new Date().toISOString(),
    hash: (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }
};

// --- 1. TYPE DEFINITIONS & PROTOCOLS ---

type Severity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'NEGLIGIBLE';
type Sector = 'OS' | 'CLOUD' | 'DB' | 'AI' | 'TOOLING' | 'NETWORK' | 'SECURITY' | 'MEDIA' | 'IOT';
type Status = 'STABLE' | 'DEGRADED' | 'COMPROMISED' | 'OFFLINE' | 'REBOOTING' | 'ANALYZING';

interface SystemNode {
    id: string;
    name: string;
    sector: Sector;
    version: string;
    uptime: number;
    load: number;
    integrity: number;
    activeConnections: number;
    logs: string[];
    config: Record<string, any>;
    apiSignature: string;
}

interface AnomalyEvent {
    id: string;
    sourceId: string;
    sourceName: string;
    timestamp: number;
    severity: Severity;
    type: string;
    description: string;
    vector: string; // Technical vector of the anomaly
    remediation: string;
    riskScore: number; // 0-100
    rawTrace: string;
}

// --- 2. THE 100-SYSTEM SIMULATION MATRIX ---

class SystemRegistry {
    private static _systems: Map<string, SystemNode> = new Map();

    static register(name: string, sector: Sector, specificConfig: any = {}) {
        const id = U.uuid();
        this._systems.set(id, {
            id,
            name,
            sector,
            version: `${U.randInt(1, 10)}.${U.randInt(0, 99)}.${U.randInt(0, 999)}`,
            uptime: U.rand(1000, 999999),
            load: U.rand(0, 100),
            integrity: 100,
            activeConnections: U.randInt(50, 50000),
            logs: [],
            config: specificConfig,
            apiSignature: `SIG-${U.hash(name).toString(16).toUpperCase()}`
        });
        return id;
    }

    static getAll() { return Array.from(this._systems.values()); }
    static get(id: string) { return this._systems.get(id); }
}

// Initializing the 100 Simulated APIs
const SECTORS = {
    OS: ['Linux Foundation', 'Canonical (Ubuntu)', 'Red Hat', 'Fedora Project', 'Debian Project', 'OpenSUSE', 'Arch Linux', 'Manjaro', 'FreeBSD', 'NetBSD', 'OpenBSD'],
    CLOUD: ['Kubernetes', 'CNCF', 'Docker', 'Podman', 'Ansible', 'Terraform', 'HashiCorp', 'Apache Foundation', 'NGINX', 'OpenStack', 'Proxmox'],
    DEV: ['Mozilla', 'Firefox Dev Tools', 'Git', 'GitHub Open Source', 'GitLab', 'Bitbucket', 'VS Code', 'Eclipse Foundation', 'JetBrains Open Tools', 'LLVM', 'WebKit', 'Chromium'],
    LANG: ['Python Software Foundation', 'Node.js Foundation', 'Deno', 'Bun', 'Rust Foundation', 'GoLang Foundation', 'Ruby', 'PHP'],
    DB: ['MariaDB', 'MySQL Open Edition', 'PostgreSQL', 'SQLite', 'Redis', 'MongoDB Community', 'Cassandra', 'ElasticSearch', 'DuckDB', 'ClickHouse', 'MinIO', 'Ceph'],
    DATA: ['Apache Spark', 'Apache Kafka', 'Supabase', 'Appwrite', 'PocketBase', 'Apache Airflow'],
    AI: ['Hugging Face', 'LangChain Open Module', 'MLFlow', 'TensorFlow', 'PyTorch', 'ONNX', 'OpenCV', 'OpenAI Gym', 'TensorRT'],
    MEDIA: ['Godot Engine', 'Blender Foundation', 'Inkscape', 'GIMP', 'Krita', 'Figma Open API', 'Unreal Open Tools', 'Unity Open Tools', 'VLC', 'FFmpeg', 'OBS Studio'],
    GEO: ['OpenStreetMap', 'QGIS', 'MapLibre', 'Leaflet.js'],
    NET: ['WireGuard', 'OpenVPN', 'Tor Project', 'Signal Protocol', 'Matrix', 'Mastodon', 'Nextcloud', 'OwnCloud'],
    IOT: ['Home Assistant', 'OpenHAB', 'Matter Protocol', 'Zigbee Simulator'],
    SEC: ['uBlock Origin', 'Brave Shields', 'Jenkins', 'DroneCI']
};

// Hydrate Registry
Object.entries(SECTORS).forEach(([sectorKey, names]) => {
    names.forEach(name => SystemRegistry.register(name, sectorKey as Sector));
});

// --- 3. ANOMALY GENERATION LOGIC ---

const ANOMALY_PATTERNS = {
    OS: [
        { type: 'KERNEL_PANIC', desc: 'Kernel memory corruption detected in ring 0', risk: 95 },
        { type: 'ZOMBIE_PROC', desc: 'Unkillable process tree spawning recursively', risk: 45 },
        { type: 'FS_CORRUPTION', desc: 'Inode table inconsistency on root partition', risk: 88 }
    ],
    CLOUD: [
        { type: 'ORCHESTRATION_DRIFT', desc: 'Control plane latency exceeding 500ms', risk: 60 },
        { type: 'CONTAINER_ESCAPE', desc: 'Namespace isolation breach attempt', risk: 99 },
        { type: 'MESH_PARTITION', desc: 'Service mesh split-brain scenario', risk: 75 }
    ],
    DB: [
        { type: 'DEADLOCK_CYCLE', desc: 'Circular transaction dependency detected', risk: 55 },
        { type: 'SHARD_SKEW', desc: 'Data distribution variance > 40%', risk: 30 },
        { type: 'WAL_CORRUPTION', desc: 'Write-Ahead Log checksum mismatch', risk: 92 }
    ],
    AI: [
        { type: 'MODEL_HALLUCINATION', desc: 'Inference confidence high on noise input', risk: 40 },
        { type: 'TENSOR_OVERFLOW', desc: 'GPU memory fragmentation critical', risk: 70 },
        { type: 'WEIGHT_POISONING', desc: 'Adversarial gradient injection detected', risk: 98 }
    ],
    NET: [
        { type: 'PACKET_STORM', desc: 'Broadcast radiation detected on VLAN 4', risk: 65 },
        { type: 'ROUTE_LEAK', desc: 'BGP prefix hijacking signature found', risk: 85 },
        { type: 'HANDSHAKE_FAIL', desc: 'TLS entropy pool exhaustion', risk: 50 }
    ]
};

const generateAnomaly = (system: SystemNode): AnomalyEvent => {
    const patterns = ANOMALY_PATTERNS[system.sector as keyof typeof ANOMALY_PATTERNS] || ANOMALY_PATTERNS.OS;
    const pattern = U.pick(patterns);
    const severityRoll = Math.random();
    let severity: Severity = 'LOW';
    if (pattern.risk > 90) severity = 'CRITICAL';
    else if (pattern.risk > 70) severity = 'HIGH';
    else if (pattern.risk > 40) severity = 'MODERATE';

    return {
        id: U.uuid(),
        sourceId: system.id,
        sourceName: system.name,
        timestamp: Date.now(),
        severity,
        type: pattern.type,
        description: pattern.desc,
        vector: `0x${U.randInt(0, 65535).toString(16).toUpperCase()}:${U.randInt(0, 65535).toString(16).toUpperCase()}`,
        remediation: `Initiate protocol ${U.randInt(100, 999)}-${String.fromCharCode(65 + U.randInt(0, 25))}`,
        riskScore: pattern.risk + U.randInt(-5, 5),
        rawTrace: `TRACE_STACK_${U.uuid().substring(0, 8)} // ${system.apiSignature}`
    };
};

// --- 4. VISUAL COMPONENT LIBRARY (INTERNAL) ---

// 4.1 Icons (SVG Paths inline to avoid dependencies)
const Icons = {
    Alert: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    Zap: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    Activity: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    Server: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
    Shield: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    Cpu: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
    Database: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    Globe: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    Terminal: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
};

// 4.2 Atomic UI Elements

const Card = ({ children, className = '', glow = false }: { children: React.ReactNode, className?: string, glow?: boolean }) => (
    <div className={`bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl overflow-hidden shadow-xl ${glow ? 'shadow-blue-500/10' : ''} ${className}`}>
        {children}
    </div>
);

const Badge = ({ children, color = 'gray' }: { children: React.ReactNode, color?: string }) => {
    const colors: Record<string, string> = {
        red: 'bg-red-900/30 text-red-400 border-red-800',
        yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
        green: 'bg-green-900/30 text-green-400 border-green-800',
        blue: 'bg-blue-900/30 text-blue-400 border-blue-800',
        gray: 'bg-gray-800 text-gray-400 border-gray-700',
        purple: 'bg-purple-900/30 text-purple-400 border-purple-800'
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-mono border rounded ${colors[color] || colors.gray}`}>
            {children}
        </span>
    );
};

const ProgressBar = ({ value, color = 'blue' }: { value: number, color?: string }) => (
    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
        <div 
            className={`h-full transition-all duration-500 ${color === 'red' ? 'bg-red-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500'}`} 
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
    </div>
);

// --- 5. MAIN APPLICATION LOGIC ---

const AnomaliesView: React.FC = () => {
    // --- STATE MACHINE ---
    const [systems, setSystems] = useState<SystemNode[]>([]);
    const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
    const [selectedSector, setSelectedSector] = useState<Sector | 'ALL'>('ALL');
    const [isPaused, setIsPaused] = useState(false);
    const [tick, setTick] = useState(0);
    const [viewMode, setViewMode] = useState<'FEED' | 'GRID' | 'MATRIX'>('FEED');

    // --- INITIALIZATION ---
    useEffect(() => {
        setSystems(SystemRegistry.getAll());
    }, []);

    // --- SIMULATION LOOP ---
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setTick(t => t + 1);
            
            // 1. Randomly update system stats
            setSystems(prev => prev.map(sys => {
                if (Math.random() > 0.9) {
                    return {
                        ...sys,
                        load: U.clamp(sys.load + U.randInt(-5, 5), 0, 100),
                        activeConnections: Math.max(0, sys.activeConnections + U.randInt(-100, 100))
                    };
                }
                return sys;
            }));

            // 2. Generate Anomalies
            if (Math.random() > 0.7) {
                const targetSystem = U.pick(systems);
                if (targetSystem) {
                    const newAnomaly = generateAnomaly(targetSystem);
                    setAnomalies(prev => [newAnomaly, ...prev].slice(0, 50)); // Keep last 50
                }
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused, systems]);

    // --- DERIVED STATE ---
    const filteredAnomalies = useMemo(() => {
        if (selectedSector === 'ALL') return anomalies;
        return anomalies.filter(a => {
            const sys = systems.find(s => s.id === a.sourceId);
            return sys?.sector === selectedSector;
        });
    }, [anomalies, selectedSector, systems]);

    const stats = useMemo(() => {
        return {
            total: systems.length,
            critical: anomalies.filter(a => a.severity === 'CRITICAL').length,
            avgLoad: systems.reduce((acc, s) => acc + s.load, 0) / systems.length || 0,
            sectors: Object.keys(SECTORS).length
        };
    }, [systems, anomalies]);

    // --- RENDERERS ---

    const renderHeader = () => (
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-800 pb-6">
            <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 tracking-tighter">
                    UNIVERSE<span className="text-white">FORGE</span>
                </h1>
                <p className="text-gray-400 font-mono text-sm mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                    SYSTEM INTEGRITY MONITOR v9.2.1 // CONNECTED TO {stats.total} NODES
                </p>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
                <div className="text-right">
                    <div className="text-xs text-gray-500 font-mono">GLOBAL THREAT LEVEL</div>
                    <div className={`text-2xl font-bold font-mono ${stats.critical > 5 ? 'text-red-500' : 'text-green-500'}`}>
                        {stats.critical > 5 ? 'DEFCON 3' : 'STABLE'}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 font-mono">AVG LOAD</div>
                    <div className="text-2xl font-bold font-mono text-blue-400">{stats.avgLoad.toFixed(1)}%</div>
                </div>
            </div>
        </div>
    );

    const renderControls = () => (
        <div className="flex flex-wrap gap-2 mb-6">
            <button 
                onClick={() => setSelectedSector('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedSector === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
                ALL SECTORS
            </button>
            {Object.keys(SECTORS).map(sec => (
                <button
                    key={sec}
                    onClick={() => setSelectedSector(sec as Sector)}
                    className={`px-3 py-2 rounded-lg text-xs font-mono transition-all border ${selectedSector === sec ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-800 bg-gray-900 text-gray-500 hover:border-gray-600'}`}
                >
                    {sec}
                </button>
            ))}
            <div className="flex-grow"/>
            <button onClick={() => setIsPaused(!isPaused)} className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-gray-300">
                {isPaused ? <Icons.Zap className="w-4 h-4"/> : <Icons.Activity className="w-4 h-4"/>}
            </button>
        </div>
    );

    const renderAnomalyFeed = () => (
        <div className="space-y-4">
            {filteredAnomalies.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-xl">
                    <Icons.Shield className="w-12 h-12 text-gray-700 mx-auto mb-4"/>
                    <p className="text-gray-500 font-mono">NO ANOMALIES DETECTED IN SECTOR</p>
                </div>
            ) : (
                filteredAnomalies.map(anomaly => {
                    const isCritical = anomaly.severity === 'CRITICAL';
                    const isHigh = anomaly.severity === 'HIGH';
                    
                    return (
                        <div 
                            key={anomaly.id} 
                            className={`relative group overflow-hidden rounded-xl border-l-4 bg-gray-900/50 transition-all hover:bg-gray-800/80 ${
                                isCritical ? 'border-red-500 shadow-red-900/20 shadow-lg' : 
                                isHigh ? 'border-yellow-500' : 'border-blue-500'
                            }`}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                {isCritical ? <Icons.Alert className="w-24 h-24"/> : <Icons.Activity className="w-24 h-24"/>}
                            </div>
                            
                            <div className="p-5 flex gap-5 relative z-10">
                                <div className={`mt-1 p-3 rounded-lg h-fit ${
                                    isCritical ? 'bg-red-500/20 text-red-400' : 
                                    isHigh ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                    {isCritical ? <Icons.Alert className="w-6 h-6"/> : <Icons.Zap className="w-6 h-6"/>}
                                </div>
                                
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-100 flex items-center gap-2">
                                                {anomaly.description}
                                                <Badge color={isCritical ? 'red' : isHigh ? 'yellow' : 'blue'}>{anomaly.severity}</Badge>
                                            </h3>
                                            <p className="text-sm text-gray-400 font-mono mt-1 flex items-center gap-2">
                                                <Icons.Server className="w-3 h-3"/> {anomaly.sourceName} 
                                                <span className="text-gray-600">|</span> 
                                                <span className="text-xs opacity-70">{anomaly.vector}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 font-mono">{new Date(anomaly.timestamp).toLocaleTimeString()}</div>
                                            <div className="text-xs font-bold text-gray-600 mt-1">RISK: {anomaly.riskScore}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-black/30 rounded p-3 font-mono text-xs text-gray-400 mb-3 border border-gray-800">
                                        <span className="text-blue-500">$</span> {anomaly.rawTrace}
                                        <br/>
                                        <span className="text-green-500">{'>'}</span> SUGGESTED ACTION: {anomaly.remediation}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-500"/> ID: {anomaly.id.split('-')[0]}</span>
                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-500"/> TYPE: {anomaly.type}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    const renderSystemGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {systems.filter(s => selectedSector === 'ALL' || s.sector === selectedSector).map(sys => (
                <Card key={sys.id} className="p-4 hover:border-blue-500/50 transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded bg-gray-800 text-gray-300 group-hover:text-white group-hover:bg-blue-600 transition-colors`}>
                                {sys.sector === 'DB' ? <Icons.Database className="w-4 h-4"/> : 
                                 sys.sector === 'NET' ? <Icons.Globe className="w-4 h-4"/> : 
                                 <Icons.Cpu className="w-4 h-4"/>}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-gray-200 truncate w-32">{sys.name}</div>
                                <div className="text-[10px] text-gray-500 font-mono">{sys.version}</div>
                            </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${sys.load > 90 ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}/>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>LOAD</span>
                            <span>{sys.load.toFixed(0)}%</span>
                        </div>
                        <ProgressBar value={sys.load} color={sys.load > 80 ? 'red' : sys.load > 50 ? 'yellow' : 'blue'} />
                        
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>CONN</span>
                            <span>{sys.activeConnections.toLocaleString()}</span>
                        </div>
                        <div className="h-8 mt-2 flex items-end gap-0.5 opacity-50">
                            {[...Array(10)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-full bg-blue-500/50 rounded-t-sm" 
                                    style={{ height: `${Math.random() * 100}%` }}
                                />
                            ))}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6 font-sans selection:bg-blue-500/30">
            <div className="max-w-7xl mx-auto">
                {renderHeader()}
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN: CONTROLS & FEED */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Icons.Terminal className="w-5 h-5 text-blue-400"/>
                                LIVE TELEMETRY
                            </h2>
                            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                                <button 
                                    onClick={() => setViewMode('FEED')}
                                    className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'FEED' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    STREAM
                                </button>
                                <button 
                                    onClick={() => setViewMode('GRID')}
                                    className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'GRID' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    GRID
                                </button>
                            </div>
                        </div>
                        
                        {renderControls()}
                        
                        <div className="min-h-[600px]">
                            {viewMode === 'FEED' ? renderAnomalyFeed() : renderSystemGrid()}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ANALYTICS & STATUS */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">System Health</h3>
                            <div className="space-y-6">
                                <div className="text-center relative py-8">
                                    <svg className="w-32 h-32 mx-auto transform -rotate-90">
                                        <circle cx="64" cy="64" r="60" fill="none" stroke="#1f2937" strokeWidth="8"/>
                                        <circle 
                                            cx="64" cy="64" r="60" fill="none" stroke={stats.critical > 0 ? '#ef4444' : '#10b981'} strokeWidth="8"
                                            strokeDasharray={377}
                                            strokeDashoffset={377 - (377 * (100 - (stats.critical * 5)) / 100)}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-3xl font-bold">{100 - (stats.critical * 2)}%</span>
                                        <span className="text-xs text-gray-500">INTEGRITY</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Active Nodes</span>
                                        <span className="font-mono">{stats.total}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Anomalies (1h)</span>
                                        <span className="font-mono text-yellow-500">{anomalies.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Uptime</span>
                                        <span className="font-mono text-green-500">99.999%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Active Sectors</h3>
                            <div className="space-y-2">
                                {Object.entries(SECTORS).map(([key, val]) => {
                                    const count = systems.filter(s => s.sector === key).length;
                                    const hasError = anomalies.some(a => {
                                        const sys = systems.find(s => s.id === a.sourceId);
                                        return sys?.sector === key && a.severity === 'CRITICAL';
                                    });
                                    
                                    return (
                                        <div key={key} className="flex items-center justify-between p-2 rounded hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => setSelectedSector(key as Sector)}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${hasError ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}/>
                                                <span className="text-sm font-mono text-gray-300">{key}</span>
                                            </div>
                                            <span className="text-xs text-gray-600">{count} NODES</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <div className="p-4 rounded-xl border border-gray-800 bg-black/40">
                            <h3 className="text-xs font-bold text-gray-500 mb-2">LATEST SYSTEM LOGS</h3>
                            <div className="font-mono text-[10px] text-gray-400 space-y-1 h-32 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"/>
                                {anomalies.slice(0, 5).map((a, i) => (
                                    <div key={i} className="truncate opacity-70">
                                        <span className="text-blue-500">[{new Date(a.timestamp).toISOString().split('T')[1].split('.')[0]}]</span> {a.sourceName}: {a.type}
                                    </div>
                                ))}
                                <div className="truncate opacity-50">...system monitoring active...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnomaliesView;