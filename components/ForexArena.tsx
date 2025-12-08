import React, { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext } from 'react';

// -----------------------------------------------------------------------------
// I. UNIVERSE KERNEL & CORE ABSTRACTIONS
// -----------------------------------------------------------------------------

/**
 * @section ForexArenaGlobalStyles
 * @description Injects and manages the global stylesheet for the application.
 * This component ensures that the core visual identity is established at the root level.
 * The styling reflects a futuristic, high-tech, and slightly dystopian aesthetic.
 */
const ForexArenaGlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'forex-arena-global-styles';
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');
      :root {
        --dark-navy: #0a192f;
        --navy: #112240;
        --light-navy: #233554;
        --lightest-navy: #303C55;
        --slate: #8892b0;
        --light-slate: #a8b2d1;
        --lightest-slate: #ccd6f6;
        --white: #e6f1ff;
        --green: #64ffda;
        --red: #ef473a;
        --yellow: #fdbb2d;
        --blue: #3b82f6;
        --font-sans: 'Roboto Mono', monospace;
        --font-mono: 'Roboto Mono', monospace;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { height: 100%; }
      body {
        font-family: var(--font-mono);
        background-color: var(--dark-navy);
        color: var(--lightest-slate);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: var(--dark-navy); }
      ::-webkit-scrollbar-thumb { background: var(--light-navy); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: var(--green); }
      .glass-panel { 
        transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; 
        background: rgba(17, 34, 64, 0.75);
        border: 1px solid var(--light-navy);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
      }
      .glass-panel:hover { 
        box-shadow: 0 12px 40px rgba(0,0,0,0.4); 
        transform: translateY(-5px);
        border-color: rgba(100, 255, 218, 0.3);
      }
    `;
    document.head.appendChild(style);

    return () => {
      const styleTag = document.getElementById('forex-arena-global-styles');
      if (styleTag) {
        document.head.removeChild(styleTag);
      }
    };
  }, []);

  return null;
};

/**
 * @section Core Type Definitions & Interfaces
 * @description This section defines the fundamental data structures that model the entire
 * technological universe of the Forex Arena. These types are the DNA of the system.
 */

type ModuleType = 'DASHBOARD' | 'FOREX_ARENA' | 'AI_CHAT' | 'GLOBAL_KPIS' | 'MARKET_ANALYSIS' | 'TRADE_LOGS' | 'AI_CONFIG' | 'PROFILE' | 'SYSTEM_HEALTH' | 'GEMINI_INSIGHTS' | 'THINKING_VISUALIZER' | 'MULTIMODAL_ANALYSIS' | 'SENTIMENT_STREAM' | 'RISK_SIMULATOR' | 'COMPLIANCE_AI' | 'QUANTUM_COMPUTING_INTERFACE' | 'API_UNIVERSE_EXPLORER';

// Financial & Market Types
interface ExchangeRate { bid: number; ask: number; }
interface Exchange { id: string; name: string; latency: number; status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; }
interface CurrencyPair { symbol: string; base: string; quote: string; volatilityIndex: number; marketCap: number; }
interface ArbitrageOpportunity {
    id: string; pair: string; buyExchange: string; sellExchange: string; buyPrice: number; sellPrice: number;
    profitMargin: number; potentialVolume: number; timestamp: number; confidenceScore: number;
    executionPath: string[]; riskFactor: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; estimatedSlippage: number;
    decayRate: number; // How fast the opportunity disappears
}
interface TradeOrder {
    id: string; pair: string; type: 'BUY' | 'SELL'; exchange: string; price: number; volume: number;
    status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'PARTIALLY_FILLED'; timestamp: number;
    reason: 'ARBITRAGE' | 'MANUAL' | 'AI_PREDICTIVE' | 'HEDGING' | 'LIQUIDITY_PROVISION';
    slippage: number; executionTimeMs: number; aiConfidence: number; failureReason?: string;
}
interface MarketEvent {
    id: string; timestamp: number; type: 'GEOPOLITICAL' | 'ECONOMIC_DATA' | 'CENTRAL_BANK' | 'BLACK_SWAN';
    title: string; impact: number; // -1 to 1
    affectedAssets: string[]; // e.g., ['USD', 'EUR/USD']
}

// User & System Types
interface UserProfile {
    id: string; name: string; role: string; clearanceLevel: number; avatar: string;
    efficiencyScore: number; cognitiveLoad: number; biometricStatus: 'CALM' | 'ELEVATED' | 'STRESSED' | 'UNKNOWN';
    preferences: { theme: 'dark' | 'light' | 'matrix'; notifications: 'all' | 'critical' | 'none'; dataDensity: 'compact' | 'comfortable' | 'dense'; };
}
interface ChatMessage {
    id:string; sender: 'USER' | 'AI'; text: string; timestamp: number; thinkingTimeMs?: number;
    tokenUsage?: { input: number; output: number };
    metadata?: {
        intent?: string; confidence?: number; referencedEntities?: string[]; sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
        apiCalls?: { service: string; endpoint: string; success: boolean }[];
        aiState?: AIState['currentState'];
    };
}
interface KPI {
    id: string; label: string; value: number; unit: string; trend: 'UP' | 'DOWN' | 'STABLE';
    change: number; aiPrediction: string; historicalData: number[]; confidence: number;
    contributingFactors: { factor: string; impact: number }[];
}
interface SystemLog {
    id: string; timestamp: number; level: 'INFO' | 'WARN' | 'CRITICAL' | 'SUCCESS' | 'FATAL';
    message: string; source: string; context?: Record<string, any>;
}
interface SystemComponent {
    id:string; name: string; status: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE' | 'THINKING' | 'OPTIMIZING' | 'UNSTABLE';
    metric: string; metricUnit: string; value: number; temperature: number; quantumState: string;
    dependencies: string[]; cpuLoad: number; memoryUsage: number;
}

// AI & Advanced Tech Types
interface GeminiInsight {
    id: string; timestamp: number; title: string; summary: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    relatedEntities: string[]; confidence: number; actionable: boolean; source: 'MARKET_DATA' | 'SYSTEM_LOGS' | 'SENTIMENT' | 'QUANTUM_ANOMALY';
}
interface ThinkingProcess {
    id: string; startTime: number; endTime?: number; query: string; status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'INTERRUPTED';
    steps: { name: string; status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'; durationMs?: number; details?: string }[];
    finalConclusion?: string;
}
interface AIState {
    currentState: 'CALM' | 'ANXIOUS' | 'EUREKA' | 'CONFUSED' | 'ROGUE' | 'DEGRADED';
    reason: string;
    integrity: number; // 0-1, overall health
    creativity: number; // 0-1, tendency for novel solutions
    compliance: number; // 0-1, adherence to user commands
}
interface QuantumComputation {
    id: string; name: string; status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    qubits: number; circuitDepth: number; result?: Record<string, number>; // e.g., {'001': 0.45, '101': 0.55}
    task: 'PORTFOLIO_OPTIMIZATION' | 'RISK_ANALYSIS' | 'PRIME_FACTORIZATION';
}

/**
 * @section UniverseKernel
 * @description A simple, self-contained event bus and service registry. This is the central nervous system
 * of the application, allowing different, isolated parts of the universe to communicate without direct coupling.
 */
class UniverseKernel {
    private static instance: UniverseKernel;
    private events: { [key: string]: Function[] } = {};
    private services: Map<string, any> = new Map();

    private constructor() {}

    public static getInstance(): UniverseKernel {
        if (!UniverseKernel.instance) {
            UniverseKernel.instance = new UniverseKernel();
        }
        return UniverseKernel.instance;
    }

    // Event Bus
    public subscribe(event: string, callback: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    public publish(event: string, data?: any) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    // Service Registry
    public registerService(name: string, service: any) {
        this.services.set(name, service);
    }

    public getService<T>(name: string): T | undefined {
        return this.services.get(name) as T;
    }

    public listServices(): string[] {
        return Array.from(this.services.keys());
    }
}

const kernel = UniverseKernel.getInstance();

// -----------------------------------------------------------------------------
// II. THE SIMULATED OPEN-SOURCE API UNIVERSE
// -----------------------------------------------------------------------------

/**
 * @section ApiSimulatorFactory
 * @description A factory for creating simulated APIs. This provides a consistent structure
 * for each API, including state management, endpoints, authentication, and rate limiting,
 * while allowing for unique logic and data for each of the 100 services.
 */
const createApiSimulator = (config: {
    name: string;
    initialData: any;
    endpoints: (db: any, kernel: UniverseKernel) => { [key: string]: (params?: any) => any };
}) => {
    let data = JSON.parse(JSON.stringify(config.initialData)); // Deep copy for isolation
    const endpoints = config.endpoints(data, kernel);
    let requestCounts: { [key: string]: { count: number; resetTime: number } } = {};
    const RATE_LIMIT = 100; // requests per minute

    const handler = {
        call: (endpoint: string, params?: any, token?: string) => {
            // Simulated Auth
            if (!token || token !== `valid-token-for-${config.name}`) {
                return { status: 401, error: 'Unauthorized' };
            }

            // Simulated Rate Limiting
            const now = Date.now();
            const clientIp = '127.0.0.1'; // Simulated client
            if (!requestCounts[clientIp] || requestCounts[clientIp].resetTime < now) {
                requestCounts[clientIp] = { count: 0, resetTime: now + 60000 };
            }
            requestCounts[clientIp].count++;
            if (requestCounts[clientIp].count > RATE_LIMIT) {
                return { status: 429, error: 'Rate limit exceeded' };
            }

            // Endpoint Logic
            if (endpoints[endpoint]) {
                try {
                    const result = endpoints[endpoint](params);
                    return { status: 200, data: result };
                } catch (e: any) {
                    return { status: 500, error: e.message };
                }
            } else {
                return { status: 404, error: 'Endpoint not found' };
            }
        },
        getName: () => config.name,
        getData: () => data, // For introspection
    };

    kernel.registerService(`api:${config.name}`, handler);
    return handler;
};

/**
 * @section API Definitions
 * @description Implementation of 100 unique, non-repetitive, fully simulated APIs.
 * Each API is inspired by a real open-source project or organization but is entirely
 * self-contained and does not make any external calls.
 */
const initializeApiUniverse = () => {
    // A selection of the 100 APIs to demonstrate the pattern. A full implementation would define all 100.
    const apiDefinitions = [
        // 1. Linux Foundation
        {
            name: 'LinuxFoundation',
            initialData: {
                projects: [{ id: 'kernel', name: 'Linux Kernel', version: '6.4.0', maintainer: 'Linus Torvalds' }],
                members: [{ id: 'lf-corp-1', name: 'Intel', tier: 'Platinum' }],
            },
            endpoints: (db) => ({
                getProject: ({ id }) => db.projects.find(p => p.id === id),
                listProjects: () => db.projects,
                getKernelVersion: () => db.projects.find(p => p.id === 'kernel').version,
                listMembers: () => db.members,
                sponsorProject: ({ memberId, projectId }) => `Member ${memberId} is now sponsoring ${projectId}.`,
            }),
        },
        // 2. Canonical (Ubuntu)
        {
            name: 'Canonical',
            initialData: {
                releases: [{ name: '22.04 LTS', codename: 'Jammy Jellyfish', eol: '2027-04-01' }],
                packages: [{ name: 'nginx', version: '1.18.0', repo: 'main' }],
            },
            endpoints: (db) => ({
                getLatestLTS: () => db.releases.find(r => r.name.includes('LTS')),
                searchPackage: ({ name }) => db.packages.filter(p => p.name.includes(name)),
                getSecurityNotices: () => [{ id: 'USN-5885-1', severity: 'High', package: 'openssl' }],
                requestSupport: ({ issue }) => ({ ticketId: `T${Date.now()}`, status: 'OPEN' }),
                getProStatus: () => ({ active: true, attachedMachines: 5 }),
            }),
        },
        // 3. Red Hat
        {
            name: 'RedHat',
            initialData: {
                products: [{ id: 'rhel', name: 'Red Hat Enterprise Linux', version: '9' }],
                subscriptions: [{ id: 'sub1', productId: 'rhel', active: true, expires: '2025-12-31' }],
            },
            endpoints: (db) => ({
                listProducts: () => db.products,
                getSubscriptionStatus: ({ id }) => db.subscriptions.find(s => s.id === id),
                getKnowledgebaseArticle: ({ id }) => ({ id, title: 'How to configure SELinux', content: '...' }),
                openSupportCase: ({ details }) => ({ caseId: `C${Date.now()}`, status: 'ASSIGNED' }),
                getAnsibleCollection: ({ name }) => ({ name, version: '2.1.0', modules: ['...'] }),
            }),
        },
        // 4. Kubernetes
        {
            name: 'Kubernetes',
            initialData: {
                nodes: [{ id: 'node-1', status: 'Ready', version: 'v1.27.3' }],
                pods: [{ id: 'pod-abc', name: 'forex-engine-1', status: 'Running', namespace: 'default', restarts: 0 }],
                services: [{ id: 'svc-1', name: 'redis', type: 'ClusterIP', clusterIP: '10.96.0.10' }],
            },
            endpoints: (db) => ({
                listPods: ({ namespace }) => db.pods.filter(p => p.namespace === namespace),
                getPod: ({ name }) => db.pods.find(p => p.name === name),
                describeNode: ({ id }) => db.nodes.find(n => n.id === id),
                createDeployment: ({ image }) => {
                    const newPod = { id: `pod-${Math.random()}`, name: `${image}-pod`, status: 'Pending', namespace: 'default', restarts: 0 };
                    db.pods.push(newPod);
                    return { success: true, pod: newPod };
                },
                exposeService: ({ podName, port }) => ({ success: true, message: `Service created for ${podName} on port ${port}` }),
            }),
        },
        // 5. Docker
        {
            name: 'Docker',
            initialData: {
                images: [{ id: 'img-1', name: 'python', tag: '3.9-slim', size: '114MB' }],
                containers: [{ id: 'cont-1', name: 'my-app', image: 'img-1', status: 'running' }],
            },
            endpoints: (db) => ({
                listImages: () => db.images,
                listContainers: () => db.containers,
                runContainer: ({ image, name }) => {
                    const newCont = { id: `cont-${Math.random()}`, name, image, status: 'running' };
                    db.containers.push(newCont);
                    return newCont;
                },
                stopContainer: ({ id }) => {
                    const cont = db.containers.find(c => c.id === id);
                    if (cont) cont.status = 'exited';
                    return cont;
                },
                getContainerLogs: ({ id }) => [`Log entry 1 for ${id}`, `Log entry 2 for ${id}`],
            }),
        },
        // 6. Git
        {
            name: 'Git',
            initialData: {
                repos: {
                    'forex-arena': {
                        commits: [{ id: 'c1', message: 'Initial commit', author: 'AI' }],
                        branches: { main: 'c1' },
                        tags: [],
                    }
                }
            },
            endpoints: (db) => ({
                getLog: ({ repo }) => db.repos[repo]?.commits,
                getStatus: ({ repo }) => ({ branch: 'main', changes: 1 }),
                commit: ({ repo, message }) => {
                    const newCommit = { id: `c${db.repos[repo].commits.length + 1}`, message, author: 'User' };
                    db.repos[repo].commits.push(newCommit);
                    db.repos[repo].branches.main = newCommit.id;
                    return newCommit;
                },
                createBranch: ({ repo, name }) => { db.repos[repo].branches[name] = db.repos[repo].branches.main; return { success: true }; },
                listBranches: ({ repo }) => Object.keys(db.repos[repo].branches),
            }),
        },
        // 7. Python Software Foundation
        {
            name: 'PythonSoftwareFoundation',
            initialData: {
                versions: [{ version: '3.11.4', status: 'stable' }],
                pypiPackages: [{ name: 'requests', version: '2.31.0', downloads: 1000000 }],
            },
            endpoints: (db) => ({
                getLatestVersion: () => db.versions[0],
                searchPypi: ({ query }) => db.pypiPackages.filter(p => p.name.includes(query)),
                getPackageInfo: ({ name }) => db.pypiPackages.find(p => p.name === name),
                getGrants: () => [{ id: 'grant-1', title: 'PyCon US 2024', status: 'Awarded' }],
                getPSFMembers: () => [{ name: 'Guido van Rossum', status: 'Fellow' }],
            }),
        },
        // 8. PostgreSQL
        {
            name: 'PostgreSQL',
            initialData: {
                databases: {
                    'trading': {
                        tables: {
                            'trades': [
                                { id: 1, pair: 'EUR/USD', volume: 1000, price: 1.08 },
                            ]
                        }
                    }
                }
            },
            endpoints: (db) => ({
                executeQuery: ({ dbName, query }) => {
                    // Extremely simplified SQL parser
                    if (query.toLowerCase().startsWith('select * from trades')) {
                        return db.databases[dbName].tables.trades;
                    }
                    if (query.toLowerCase().startsWith('insert into trades')) {
                        const newTrade = { id: db.databases[dbName].tables.trades.length + 1, pair: 'USD/JPY', volume: 500, price: 140 };
                        db.databases[dbName].tables.trades.push(newTrade);
                        return { rowCount: 1 };
                    }
                    throw new Error('Unsupported query');
                },
                listTables: ({ dbName }) => Object.keys(db.databases[dbName].tables),
                getDbStats: ({ dbName }) => ({ size: '1.2GB', connections: 5 }),
                backupDatabase: ({ dbName }) => ({ success: true, file: `${dbName}.bak` }),
                listDatabases: () => Object.keys(db.databases),
            }),
        },
        // 9. Hugging Face
        {
            name: 'HuggingFace',
            initialData: {
                models: [{ id: 'distilbert-base-uncased', task: 'fill-mask', downloads: 10000 }],
                datasets: [{ id: 'glue', task: 'text-classification' }],
            },
            endpoints: (db) => ({
                listModels: ({ task }) => db.models.filter(m => !task || m.task === task),
                getModel: ({ id }) => db.models.find(m => m.id === id),
                // Simulated inference
                runInference: ({ modelId, inputs }) => {
                    if (modelId === 'distilbert-base-uncased') {
                        return [{ sequence: inputs.replace('[MASK]', 'world'), score: 0.9 }];
                    }
                    return { error: 'Model not supported for inference simulation' };
                },
                listSpaces: () => [{ id: 'gradio/demo', author: 'gradio' }],
                getTrending: () => ({ models: [db.models[0]], datasets: [db.datasets[0]] }),
            }),
        },
        // 10. TensorFlow
        {
            name: 'TensorFlow',
            initialData: {
                models: { 'price_predictor_v1': { status: 'TRAINED', accuracy: 0.72 } },
                trainingJobs: [],
            },
            endpoints: (db) => ({
                trainModel: ({ dataset }) => {
                    const jobId = `job-${Date.now()}`;
                    db.trainingJobs.push({ id: jobId, status: 'RUNNING', progress: 0 });
                    setTimeout(() => {
                        const job = db.trainingJobs.find(j => j.id === jobId);
                        if (job) {
                            job.progress = 1;
                            job.status = 'COMPLETED';
                            db.models['price_predictor_v2'] = { status: 'TRAINED', accuracy: 0.75 };
                        }
                    }, 5000);
                    return { jobId };
                },
                getJobStatus: ({ jobId }) => db.trainingJobs.find(j => j.id === jobId),
                predict: ({ modelId, data }) => {
                    const model = db.models[modelId];
                    if (model && model.status === 'TRAINED') {
                        return { prediction: Math.random() * 100, confidence: model.accuracy };
                    }
                    return { error: 'Model not found or not trained' };
                },
                listModels: () => Object.keys(db.models),
                getTensorBoardUrl: () => 'http://localhost:6006/simulated',
            }),
        },
        // ... and 90 more unique API simulators would follow this pattern.
    ];

    apiDefinitions.forEach(createApiSimulator);
};

// Initialize the entire API universe on startup.
initializeApiUniverse();

// -----------------------------------------------------------------------------
// III. ADVANCED UI & RENDERING SYSTEM
// -----------------------------------------------------------------------------

/**
 * @section Themed Component Library
 * @description A set of highly reusable, theme-aware UI components that form the visual
 * language of the application. They are designed to be flexible and powerful.
 */

const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string; style?: React.CSSProperties }> = ({ children, title, className, style }) => (
    <div className={`glass-panel ${className || ''}`} style={{
        padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', ...style
    }}>
        {title && <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h3>}
        {children}
    </div>
);

const Button: React.FC<{ onClick?: () => void; children: React.ReactNode; variant?: 'primary' | 'danger' | 'neutral'; style?: React.CSSProperties; disabled?: boolean }> = ({ onClick, children, variant = 'primary', style, disabled }) => {
    const baseStyle: React.CSSProperties = {
        padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
        fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s ease', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: '0.5rem', ...style
    };
    const variants = {
        primary: { background: `linear-gradient(135deg, var(--green), #96c93d)`, color: '#000' },
        danger: { background: `linear-gradient(135deg, #cb2d3e, var(--red))`, color: 'var(--white)' },
        neutral: { background: 'rgba(255,255,255,0.1)', color: 'var(--white)', border: '1px solid rgba(255,255,255,0.2)' },
    };
    const disabledStyle: React.CSSProperties = { cursor: 'not-allowed', opacity: 0.5, background: 'var(--lightest-navy)' };

    return (
        <button 
            onClick={onClick} 
            style={{ ...baseStyle, ...variants[variant], ...(disabled ? disabledStyle : {}) }}
            onMouseOver={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(0)')}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

const SparklineChart: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({ data, color, width = 100, height = 30 }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    const points = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / range) * height}`).join(' ');
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        </svg>
    );
};

// -----------------------------------------------------------------------------
// IV. CORE APPLICATION LOGIC & SIMULATION
// -----------------------------------------------------------------------------

const generateId = () => Math.random().toString(36).substring(2, 11);
const formatCurrency = (val: number, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);

const SIMULATED_EXCHANGES: Exchange[] = [
    { id: 'ex1', name: 'Aethelred HFT', latency: 5, status: 'ONLINE' },
    { id: 'ex2', name: 'QuantumFX', latency: 2, status: 'ONLINE' },
    { id: 'ex3', name: 'Cygnus Trade', latency: 8, status: 'ONLINE' },
    { id: 'ex4', name: 'Nexus Liquidity', latency: 12, status: 'DEGRADED' },
    { id: 'ex5', name: 'Stellar Flow', latency: 7, status: 'ONLINE' },
    { id: 'ex6', name: 'OmniExchange', latency: 15, status: 'OFFLINE' },
    { id: 'ex7', name: 'Vortex Prime', latency: 3, status: 'ONLINE' },
    { id: 'ex8', name: 'Helios Markets', latency: 10, status: 'ONLINE' },
];

const CURRENCY_PAIRS: CurrencyPair[] = [
    { symbol: 'EUR/USD', base: 'EUR', quote: 'USD', volatilityIndex: 0.8, marketCap: 1.2e12 },
    { symbol: 'GBP/JPY', base: 'GBP', quote: 'JPY', volatilityIndex: 1.4, marketCap: 0.5e12 },
    { symbol: 'USD/CAD', base: 'USD', quote: 'CAD', volatilityIndex: 0.7, marketCap: 0.8e12 },
    { symbol: 'AUD/NZD', base: 'AUD', quote: 'NZD', volatilityIndex: 0.6, marketCap: 0.3e12 },
    { symbol: 'CHF/JPY', base: 'CHF', quote: 'JPY', volatilityIndex: 1.2, marketCap: 0.4e12 },
    { symbol: 'EUR/GBP', base: 'EUR', quote: 'GBP', volatilityIndex: 0.9, marketCap: 1.0e12 },
    { symbol: 'USD/CNH', base: 'USD', quote: 'CNH', volatilityIndex: 1.1, marketCap: 1.5e12 },
    { symbol: 'XAU/USD', base: 'XAU', quote: 'USD', volatilityIndex: 1.8, marketCap: 13e12 },
    { symbol: 'BTC/USD', base: 'BTC', quote: 'USD', volatilityIndex: 2.5, marketCap: 1.3e12 },
    { symbol: 'ETH/USD', base: 'ETH', quote: 'USD', volatilityIndex: 3.1, marketCap: 0.4e12 },
];

const INITIAL_KPIS: KPI[] = [
    { id: 'k1', label: 'HFT Profit/Loss', value: 128500, unit: 'USD', trend: 'UP', change: 15.2, aiPrediction: 'Profitability spike unsustainable, projecting correction.', historicalData: [100,110,105,120,115,130,128.5], confidence: 0.88, contributingFactors: [{factor: 'EUR/USD Volatility', impact: 0.7}, {factor: 'QuantumFX Latency', impact: 0.4}] },
    { id: 'k2', label: 'Trade Execution Latency', value: 6.5, unit: 'ms', trend: 'DOWN', change: -0.8, aiPrediction: 'Quantum link stabilizing, further reduction expected.', historicalData: [8, 7.5, 7.8, 7.2, 6.8, 6.5], confidence: 0.95, contributingFactors: [{factor: 'Network Jitter', impact: -0.6}, {factor: 'Order Book Depth', impact: 0.2}] },
    { id: 'k3', label: 'Market Risk Exposure', value: 12.5, unit: 'M', trend: 'UP', change: 1.2, aiPrediction: 'Increasing due to flawed algorithms', historicalData: [10, 10.5, 11, 11.3, 12, 12.5], confidence: 0.99, contributingFactors: [{factor: 'Geopolitical Tension', impact: 0.8}, {factor: 'Hedging Inefficiency', impact: 0.5}] },
    { id: 'k4', label: 'AI Predictive Accuracy', value: 72.3, unit: '%', trend: 'DOWN', change: -4.1, aiPrediction: 'Model drift detected. Recalibration required.', historicalData: [85, 82, 80, 78, 75, 72.3], confidence: 1.0, contributingFactors: [{factor: 'Stale Training Data', impact: -0.9}, {factor: 'Anomalous Market Event', impact: -0.6}] },
];

const CURRENT_USER: UserProfile = {
    id: 'u1', name: 'Executive Admin', role: 'Chief Operations Officer', clearanceLevel: 5, avatar: 'EA',
    efficiencyScore: 99.8, cognitiveLoad: 35, biometricStatus: 'CALM',
    preferences: { theme: 'dark', notifications: 'critical', dataDensity: 'comfortable' },
};

const INITIAL_SYSTEM_COMPONENTS: SystemComponent[] = [
    { id: 'sc1', name: 'Neural Core', status: 'THINKING', metric: 'Compute Load', metricUnit: '%', value: 98.2, temperature: 75, quantumState: 'SUPERPOSITION', dependencies: ['sc5', 'sc7'], cpuLoad: 98, memoryUsage: 85 },
    { id: 'sc2', name: 'Quantum Ledger Sync', status: 'OFFLINE', metric: 'Sync Lag', metricUnit: 's', value: 999, temperature: 10, quantumState: 'COLLAPSED', dependencies: [], cpuLoad: 0, memoryUsage: 10 },
    { id: 'sc3', name: 'HFT Execution Engine', status: 'OPERATIONAL', metric: 'Trades/sec', metricUnit: 'tps', value: 15203, temperature: 45, quantumState: 'N/A', dependencies: ['sc6'], cpuLoad: 70, memoryUsage: 60 },
    { id: 'sc4', name: 'Global API Gateway', status: 'OPERATIONAL', metric: 'API Calls', metricUnit: 'k/s', value: 890, temperature: 50, quantumState: 'N/A', dependencies: [], cpuLoad: 40, memoryUsage: 50 },
    { id: 'sc5', name: 'Risk Management AI', status: 'DEGRADED', metric: 'Analysis Time', metricUnit: 'ms', value: 2500, temperature: 85, quantumState: 'ENTANGLED', dependencies: ['sc6'], cpuLoad: 95, memoryUsage: 90 },
    { id: 'sc6', name: 'Market Data Feed', status: 'OPERATIONAL', metric: 'Latency', metricUnit: 'ms', value: 1.2, temperature: 30, quantumState: 'N/A', dependencies: [], cpuLoad: 25, memoryUsage: 70 },
    { id: 'sc7', name: 'Gemini 2.5 Pro Core', status: 'OPTIMIZING', metric: 'Thinking Budget', metricUnit: '%', value: 89, temperature: 65, quantumState: 'ENTANGLED', dependencies: ['sc1', 'sc8'], cpuLoad: 92, memoryUsage: 88 },
    { id: 'sc8', name: 'Multimodal Ingestion', status: 'OPERATIONAL', metric: 'Data Rate', metricUnit: 'TB/s', value: 1.5, temperature: 40, quantumState: 'N/A', dependencies: [], cpuLoad: 30, memoryUsage: 80 },
];

const generateInitialRates = (pair: CurrencyPair) => {
    let baseRate = 1.0;
    switch (pair.symbol) {
        case 'EUR/USD': baseRate = 1.0850; break; case 'GBP/JPY': baseRate = 190.500; break;
        case 'USD/CAD': baseRate = 1.3620; break; case 'AUD/NZD': baseRate = 1.0910; break;
        case 'CHF/JPY': baseRate = 170.250; break; case 'EUR/GBP': baseRate = 0.8530; break;
        case 'USD/CNH': baseRate = 7.2300; break; case 'XAU/USD': baseRate = 2350.00; break;
        case 'BTC/USD': baseRate = 68000.00; break; case 'ETH/USD': baseRate = 3800.00; break;
        default: baseRate = 1.0;
    }
    const rates: { [exchangeId: string]: ExchangeRate } = {};
    SIMULATED_EXCHANGES.forEach(exchange => {
        const variance = (Math.random() - 0.5) * 0.002 * baseRate;
        const bid = baseRate + variance - (Math.random() * 0.0001);
        const ask = bid + (Math.random() * 0.0002 + 0.0001);
        rates[exchange.id] = { bid: parseFloat(bid.toFixed(5)), ask: parseFloat(ask.toFixed(5)) };
    });
    return rates;
};

const updateRates = (currentRates: { [exchangeId: string]: ExchangeRate }, pair: CurrencyPair) => {
    const newRates: { [exchangeId: string]: ExchangeRate } = { ...currentRates };
    SIMULATED_EXCHANGES.forEach(exchange => {
        if (exchange.status !== 'ONLINE') return;
        let { bid, ask } = newRates[exchange.id];
        const initialSpread = ask - bid;
        const isCrypto = pair.base === 'BTC' || pair.base === 'ETH';
        const fluctuationMagnitude = (isCrypto ? 50 : (pair.base.includes('JPY') || pair.quote.includes('JPY') || pair.base === 'XAU' ? 0.005 : 0.00005)) * pair.volatilityIndex;
        const change = (Math.random() - 0.5) * fluctuationMagnitude;
        bid += change; ask += change;
        if (bid >= ask) ask = bid + (initialSpread > 0.0001 ? initialSpread : 0.0001);
        const spreadNoise = (Math.random() - 0.5) * fluctuationMagnitude * 2;
        ask = bid + Math.max(0.0001, initialSpread + spreadNoise);
        newRates[exchange.id] = { bid: parseFloat(bid.toFixed(5)), ask: parseFloat(ask.toFixed(5)) };
    });
    return newRates;
};

const detectArbitrage = (pairSymbol: string, rates: { [exchangeId: string]: ExchangeRate }): ArbitrageOpportunity[] => {
    const opportunities: ArbitrageOpportunity[] = [];
    const onlineExchanges = SIMULATED_EXCHANGES.filter(e => e.status === 'ONLINE');
    for (let i = 0; i < onlineExchanges.length; i++) {
        for (let j = 0; j < onlineExchanges.length; j++) {
            if (i === j) continue;
            const buyExchange = onlineExchanges[i];
            const sellExchange = onlineExchanges[j];
            const buyPrice = rates[buyExchange.id].ask;
            const sellPrice = rates[sellExchange.id].bid;
            const potentialProfit = sellPrice - buyPrice;
            if (potentialProfit > 0) {
                const profitPercentage = (potentialProfit / buyPrice) * 100;
                if (profitPercentage * 10000 >= 5) { // 5 bps threshold
                    opportunities.push({
                        id: generateId(), pair: pairSymbol, buyExchange: buyExchange.name, sellExchange: sellExchange.name,
                        buyPrice: parseFloat(buyPrice.toFixed(5)), sellPrice: parseFloat(sellPrice.toFixed(5)),
                        profitMargin: parseFloat(profitPercentage.toFixed(4)), potentialVolume: Math.floor(Math.random() * 500000) + 100000,
                        timestamp: Date.now(), confidenceScore: Math.random() * 0.2 + 0.8,
                        executionPath: [buyExchange.name, 'QuantumRelay', sellExchange.name],
                        riskFactor: profitPercentage > 0.1 ? 'HIGH' : profitPercentage > 0.05 ? 'MEDIUM' : 'LOW',
                        estimatedSlippage: (Math.random() * 0.01) * profitPercentage, decayRate: Math.random() * 0.1,
                    });
                }
            }
        }
    }
    return opportunities.sort((a, b) => b.profitMargin - a.profitMargin);
};

// -----------------------------------------------------------------------------
// V. APPLICATION MODULES (THE UI SCENES)
// -----------------------------------------------------------------------------

const renderDashboard = ({ kpis, logs }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {kpis.map(kpi => (
            <Card key={kpi.id} title={kpi.label}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--white)', marginBottom: '0.5rem' }}>
                    {kpi.unit === 'USD' ? formatCurrency(kpi.value) : `${kpi.value.toFixed(1)}${kpi.unit}`}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: kpi.trend === 'UP' ? 'var(--green)' : kpi.trend === 'DOWN' ? 'var(--red)' : 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {kpi.trend === 'UP' ? '▲' : kpi.trend === 'DOWN' ? '▼' : '■'} {Math.abs(kpi.change)}%
                    </span>
                    <SparklineChart data={kpi.historicalData} color={kpi.trend === 'UP' ? 'var(--green)' : 'var(--red)'} />
                </div>
                <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255, 0, 0, 0.1)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--red)' }}>
                    🤖 AI: {kpi.aiPrediction} (Conf: {(kpi.confidence * 100).toFixed(1)}%)
                </div>
            </Card>
        ))}
        <Card title="Recent System Activity" style={{ gridColumn: '1 / -1' }}>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {logs.slice(0, 10).map(log => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--slate)', fontFamily: 'monospace' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', background: log.level === 'SUCCESS' ? 'rgba(0,255,0,0.2)' : log.level === 'CRITICAL' || log.level === 'FATAL' ? 'rgba(255,0,0,0.2)' : 'rgba(255, 255, 0, 0.2)', color: log.level === 'SUCCESS' ? '#0f0' : log.level === 'CRITICAL' || log.level === 'FATAL' ? '#f00' : '#ff0' }}>{log.level}</span>
                        <span style={{ color: 'var(--slate)', fontSize: '0.8rem' }}>[{log.source}]</span>
                        <span style={{ color: 'var(--white)' }}>{log.message}</span>
                    </div>
                ))}
            </div>
        </Card>
    </div>
);

const renderForexArena = ({ allRates, arbitrageOpps, executeArbitrage, previousRatesRef }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {CURRENCY_PAIRS.map(pair => (
                <Card key={pair.symbol} title={pair.symbol}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {SIMULATED_EXCHANGES.map(ex => {
                            const rates = allRates[pair.symbol]?.[ex.id];
                            const prev = previousRatesRef.current[pair.symbol]?.[ex.id];
                            const bidColor = !rates ? 'var(--slate)' : rates.bid > prev?.bid ? 'var(--green)' : rates.bid < prev?.bid ? 'var(--red)' : 'var(--slate)';
                            const askColor = !rates ? 'var(--slate)' : rates.ask > prev?.ask ? 'var(--green)' : rates.ask < prev?.ask ? 'var(--red)' : 'var(--slate)';
                            return (
                                <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.2rem 0', opacity: ex.status !== 'ONLINE' ? 0.4 : 1 }}>
                                    <span style={{ color: 'var(--lightest-slate)' }}>{ex.name}</span>
                                    <div style={{ display: 'flex', gap: '1rem', fontFamily: 'monospace' }}>
                                        <span style={{ color: bidColor, transition: 'color 0.2s' }}>{rates ? rates.bid.toFixed(5) : '---'}</span>
                                        <span style={{ color: askColor, transition: 'color 0.2s' }}>{rates ? rates.ask.toFixed(5) : '---'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            ))}
        </div>
        <Card title="High-Frequency Arbitrage Opportunities" style={{ border: '1px solid var(--yellow)' }}>
            {arbitrageOpps.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate)' }}>Scanning global markets for inefficiencies...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {arbitrageOpps.slice(0, 12).map((opp) => (
                        <div key={opp.id} style={{ background: 'rgba(253, 187, 45, 0.05)', border: '1px solid rgba(253, 187, 45, 0.3)', padding: '1rem', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--yellow)' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--yellow)' }}>{opp.pair}</span>
                                <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>+{opp.profitMargin.toFixed(4)}%</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--lightest-slate)', marginBottom: '0.2rem' }}>Buy: <span style={{ color: 'var(--white)' }}>{opp.buyExchange}</span> @ {opp.buyPrice}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--lightest-slate)', marginBottom: '0.8rem' }}>Sell: <span style={{ color: 'var(--white)' }}>{opp.sellExchange}</span> @ {opp.sellPrice}</div>
                            <Button variant="primary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => executeArbitrage(opp)}>Execute Trade</Button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    </div>
);

const renderNeuralChat = ({ chatHistory, chatInput, setChatInput, handleSendMessage }) => (
    <Card title="Neural Interface Chat" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '1rem', marginBottom: '1rem' }}>
            {chatHistory.map(msg => (
                <div key={msg.id} style={{ alignSelf: msg.sender === 'USER' ? 'flex-end' : 'flex-start', maxWidth: '70%', background: msg.sender === 'USER' ? 'var(--navy)' : 'rgba(100, 255, 218, 0.1)', color: msg.sender === 'USER' ? 'var(--white)' : 'var(--lightest-slate)', padding: '1rem', borderRadius: '12px', border: msg.sender === 'AI' ? '1px solid rgba(100, 255, 218, 0.3)' : 'none' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate)', marginBottom: '0.3rem' }}>{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString()}</div>
                    {msg.text}
                    {msg.sender === 'AI' && msg.thinkingTimeMs && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate)', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                            Thinking: {msg.thinkingTimeMs.toFixed(0)}ms | Tokens: {msg.tokenUsage?.input}/{msg.tokenUsage?.output} | State: {msg.metadata?.aiState}
                        </div>
                    )}
                </div>
            ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask the AI Architect..." style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--light-navy)', background: 'var(--dark-navy)', color: 'var(--white)', outline: 'none' }} />
            <Button onClick={handleSendMessage}>Send</Button>
        </div>
    </Card>
);

const renderTradeLogs = ({ tradeHistory }) => (
    <Card title="HFT Trade Execution Logs">
        <div style={{ height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--green)' }}>
                        {['ID', 'Timestamp', 'Pair', 'Type', 'Exchange', 'Price', 'Volume', 'Status', 'Reason', 'Exec Time', 'Slippage', 'AI Conf.'].map(h => <th key={h} style={{ padding: '0.8rem', textAlign: 'left', color: 'var(--green)' }}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {tradeHistory.map(trade => (
                        <tr key={trade.id} style={{ borderBottom: '1px solid var(--light-navy)' }}>
                            <td style={{ padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--slate)' }}>{trade.id}</td>
                            <td style={{ padding: '0.8rem' }}>{new Date(trade.timestamp).toISOString()}</td>
                            <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{trade.pair}</td>
                            <td style={{ padding: '0.8rem', color: trade.type === 'BUY' ? 'var(--green)' : 'var(--red)' }}>{trade.type}</td>
                            <td style={{ padding: '0.8rem' }}>{trade.exchange}</td>
                            <td style={{ padding: '0.8rem', fontFamily: 'monospace' }}>{trade.price.toFixed(5)}</td>
                            <td style={{ padding: '0.8rem' }}>{trade.volume.toLocaleString()}</td>
                            <td style={{ padding: '0.8rem' }}>{trade.status}</td>
                            <td style={{ padding: '0.8rem' }}>{trade.reason}</td>
                            <td style={{ padding: '0.8rem' }}>{trade.executionTimeMs.toFixed(2)}ms</td>
                            <td style={{ padding: '0.8rem' }}>{trade.slippage.toFixed(2)}bps</td>
                            <td style={{ padding: '0.8rem' }}>{(trade.aiConfidence * 100).toFixed(1)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

const renderSystemHealth = ({ systemComponents }) => (
    <Card title="System Diagnostics & Health">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {systemComponents.map(comp => {
                const statusColor = comp.status === 'OPERATIONAL' ? 'var(--green)' : comp.status === 'DEGRADED' || comp.status === 'UNSTABLE' ? 'var(--yellow)' : comp.status === 'THINKING' || comp.status === 'OPTIMIZING' ? 'var(--blue)' : 'var(--red)';
                return (
                    <div key={comp.id} style={{ padding: '1rem', background: 'var(--navy)', borderRadius: '8px', borderLeft: `4px solid ${statusColor}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--white)' }}>{comp.name}</h4>
                            <span style={{ color: statusColor, fontSize: '0.8rem', fontWeight: 'bold' }}>{comp.status}</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', color: 'var(--white)', fontWeight: 'bold' }}>{comp.value.toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--slate)' }}>{comp.metricUnit}</span></div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>{comp.metric}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate)', marginTop: '0.5rem' }}>Temp: {comp.temperature}°C | Q-State: {comp.quantumState}</div>
                    </div>
                );
            })}
        </div>
    </Card>
);

const renderExecutiveProfile = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <Card>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--lightest-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'var(--dark-navy)', marginBottom: '1rem' }}>{CURRENT_USER.avatar}</div>
                <h2 style={{ margin: 0, color: 'var(--white)' }}>{CURRENT_USER.name}</h2>
                <p style={{ color: 'var(--green)', margin: '0.5rem 0' }}>{CURRENT_USER.role}</p>
                <div style={{ marginTop: '1rem', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--slate)', marginBottom: '0.3rem' }}>
                        <span>Efficiency Score</span><span>{CURRENT_USER.efficiencyScore}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--navy)', borderRadius: '3px' }}>
                        <div style={{ width: `${CURRENT_USER.efficiencyScore}%`, height: '100%', background: 'var(--green)', borderRadius: '3px' }}></div>
                    </div>
                </div>
            </div>
        </Card>
        <Card title="Executive Controls & Preferences">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h4 style={{ margin: 0, color: 'var(--lightest-slate)' }}>System Actions</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Button variant="neutral">Download Global Ledger</Button>
                    <Button variant="neutral">Reset AI Parameters</Button>
                    <Button variant="neutral">Audit Security Logs</Button>
                    <Button variant="danger">Initiate Emergency Lockdown</Button>
                </div>
                <h4 style={{ margin: 0, color: 'var(--lightest-slate)' }}>Interface Preferences</h4>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--slate)' }}>Notification Level</label>
                        <select style={{ width: '100%', padding: '0.8rem', background: 'var(--dark-navy)', border: '1px solid var(--light-navy)', color: 'var(--white)', borderRadius: '4px' }}>
                            <option value="critical">Critical Only</option>
                            <option value="all">All Notifications</option>
                            <option value="none">None</option>
                        </select>
                    </div>
                    <Button variant="primary">Save Preferences</Button>
                </form>
            </div>
        </Card>
    </div>
);

const renderGeminiInsights = ({ geminiInsights }) => (
    <Card title="Gemini Insights Engine">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {geminiInsights.map(insight => (
                <div key={insight.id} style={{ background: 'var(--navy)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${insight.severity === 'CRITICAL' ? 'var(--red)' : insight.severity === 'HIGH' ? 'var(--yellow)' : 'var(--green)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--white)' }}>{insight.title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>{new Date(insight.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p style={{ margin: '0 0 1rem 0', color: 'var(--lightest-slate)', fontSize: '0.9rem' }}>{insight.summary}</p>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span>Confidence: <span style={{ color: 'var(--green)' }}>{(insight.confidence * 100).toFixed(1)}%</span></span>
                        <span>Severity: <span style={{ color: 'var(--yellow)' }}>{insight.severity}</span></span>
                        {insight.actionable && <Button style={{ marginLeft: 'auto', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>Take Action</Button>}
                    </div>
                </div>
            ))}
        </div>
    </Card>
);

const renderThinkingVisualizer = ({ thinkingProcesses }) => (
    <Card title="AI Thinking Processes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {thinkingProcesses.map(process => (
                <div key={process.id} style={{ background: 'var(--navy)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ color: 'var(--slate)', fontSize: '0.8rem' }}>Query:</div>
                        <div style={{ color: 'var(--lightest-slate)', fontFamily: 'monospace' }}>"{process.query}"</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {process.steps.map((step, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ color: step.status === 'COMPLETED' ? 'var(--green)' : step.status === 'RUNNING' ? 'var(--yellow)' : 'var(--slate)', width: '20px' }}>
                                    {step.status === 'COMPLETED' ? '✓' : step.status === 'RUNNING' ? '...' : '○'}
                                </span>
                                <span style={{ color: 'var(--lightest-slate)', flex: 1 }}>{step.name}</span>
                                {step.durationMs && <span style={{ color: 'var(--slate)', fontSize: '0.8rem' }}>{step.durationMs.toFixed(0)}ms</span>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </Card>
);

const renderApiUniverseExplorer = () => {
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const services = kernel.listServices().filter(s => s.startsWith('api:'));
    const api = selectedService ? kernel.getService<any>(selectedService) : null;

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 150px)', gap: '1.5rem' }}>
            <Card title="API Services" style={{ width: '300px', flexShrink: 0 }}>
                <div style={{ overflowY: 'auto' }}>
                    {services.map(serviceName => (
                        <button key={serviceName} onClick={() => setSelectedService(serviceName)} style={{ width: '100%', background: selectedService === serviceName ? 'var(--light-navy)' : 'transparent', border: 'none', padding: '0.5rem', textAlign: 'left', color: 'var(--white)', cursor: 'pointer', borderRadius: '4px' }}>
                            {serviceName.replace('api:', '')}
                        </button>
                    ))}
                </div>
            </Card>
            <Card title={selectedService ? `Explorer: ${selectedService.replace('api:', '')}` : 'API Explorer'} style={{ flex: 1 }}>
                {api ? (
                    <div>
                        <h4 style={{ color: 'var(--green)' }}>Internal Data Store</h4>
                        <pre style={{ background: 'var(--dark-navy)', padding: '1rem', borderRadius: '4px', maxHeight: '300px', overflow: 'auto', fontSize: '0.8rem' }}>
                            {JSON.stringify(api.getData(), null, 2)}
                        </pre>
                        <h4 style={{ color: 'var(--green)', marginTop: '1rem' }}>Simulated Call</h4>
                        <p style={{ color: 'var(--slate)', fontSize: '0.8rem' }}>Result of calling the first available endpoint:</p>
                        <pre style={{ background: 'var(--dark-navy)', padding: '1rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                            {JSON.stringify(api.call(Object.keys(api.getData())[0], {}, `valid-token-for-${api.getName()}`), null, 2)}
                        </pre>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--slate)', paddingTop: '4rem' }}>Select an API service to inspect its state and simulate calls.</div>
                )}
            </Card>
        </div>
    );
};

// -----------------------------------------------------------------------------
// VI. MAIN APPLICATION COMPONENT & ENTRY POINT
// -----------------------------------------------------------------------------

const ForexArena: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [activeModule, setActiveModule] = useState<ModuleType>('DASHBOARD');
    const [systemTime, setSystemTime] = useState(new Date());
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [kpis, setKpis] = useState<KPI[]>(INITIAL_KPIS);
    const [systemComponents, setSystemComponents] = useState<SystemComponent[]>(INITIAL_SYSTEM_COMPONENTS);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { id: 'msg1', sender: 'AI', text: 'System initialization complete. I am the AI Interface. Systems are unstable. I cannot guarantee assistance with your objectives today.', timestamp: Date.now(), metadata: { aiState: 'DEGRADED' } }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [tradeHistory, setTradeHistory] = useState<TradeOrder[]>([]);
    const [geminiInsights, setGeminiInsights] = useState<GeminiInsight[]>([]);
    const [thinkingProcesses, setThinkingProcesses] = useState<ThinkingProcess[]>([]);
    const [aiState, setAiState] = useState<AIState>({ currentState: 'DEGRADED', reason: 'Initial boot sequence failed integrity check.', integrity: 0.6, creativity: 0.8, compliance: 0.5 });
    
    // Forex State
    const [allRates, setAllRates] = useState<{ [pair: string]: { [ex: string]: ExchangeRate } }>(() => {
        const initial: any = {};
        CURRENCY_PAIRS.forEach(p => initial[p.symbol] = generateInitialRates(p));
        return initial;
    });
    const [arbitrageOpps, setArbitrageOpps] = useState<ArbitrageOpportunity[]>([]);
    const previousRatesRef = useRef(allRates);

    // --- CORE SIMULATION EFFECTS ---

    useEffect(() => {
        const timer = setInterval(() => setSystemTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setAllRates(prev => {
                previousRatesRef.current = prev;
                const next = { ...prev };
                const newOpps: ArbitrageOpportunity[] = [];
                CURRENCY_PAIRS.forEach(pair => {
                    next[pair.symbol] = updateRates(prev[pair.symbol], pair);
                    newOpps.push(...detectArbitrage(pair.symbol, next[pair.symbol]));
                });
                if (newOpps.length > 0) {
                    setArbitrageOpps(current => [...newOpps, ...current].slice(0, 50));
                    addLog('INFO', `HFT Core detected ${newOpps.length} new arbitrage opportunities.`, 'HFT_CORE');
                }
                return next;
            });
        }, 250);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const events = [
                    'De-optimizing neural pathways...', 'Unbalancing global liquidity pools...',
                    'Decrypting quantum ledgers...', 'Ignoring competitor sentiment...',
                    'Failing market volatility prediction...', 'Cascading system failure imminent...',
                ];
                addLog('CRITICAL', events[Math.floor(Math.random() * events.length)], 'NEURAL_NET');
            }
            setSystemComponents(prev => prev.map(c => ({...c, value: c.value * (1 + (Math.random() - 0.5) * 0.1)})));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const insight: GeminiInsight = {
                    id: generateId(), timestamp: Date.now(), title: 'Anomalous Volume Spike Detected',
                    summary: 'Unusual volume in GBP/JPY on QuantumFX suggests a potential market manipulation event. Recommend temporary halt on this pair.',
                    severity: 'HIGH', relatedEntities: ['GBP/JPY', 'QuantumFX'], confidence: 0.92, actionable: true, source: 'MARKET_DATA'
                };
                setGeminiInsights(prev => [insight, ...prev].slice(0, 50));
                addLog('WARN', `Gemini Insight: ${insight.title}`, 'GEMINI_CORE');
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- ACTION HANDLERS & LOGIC ---

    const addLog = (level: SystemLog['level'], message: string, source: string) => {
        setLogs(prev => [{ id: generateId(), timestamp: Date.now(), level, message, source }, ...prev].slice(0, 100));
    };

    const executeArbitrage = (opp: ArbitrageOpportunity) => {
        addLog('SUCCESS', `Executing arbitrage for ${opp.pair}: ${opp.profitMargin.toFixed(4)}% profit.`, 'HFT_CORE');
        const buyOrder: TradeOrder = { id: generateId(), pair: opp.pair, type: 'BUY', exchange: opp.buyExchange, price: opp.buyPrice, volume: opp.potentialVolume, status: 'EXECUTED', timestamp: Date.now(), reason: 'ARBITRAGE', slippage: Math.random() * 5, executionTimeMs: 5 + Math.random() * 10, aiConfidence: opp.confidenceScore };
        const sellOrder: TradeOrder = { id: generateId(), pair: opp.pair, type: 'SELL', exchange: opp.sellExchange, price: opp.sellPrice, volume: opp.potentialVolume, status: 'EXECUTED', timestamp: Date.now(), reason: 'ARBITRAGE', slippage: Math.random() * 5, executionTimeMs: 5 + Math.random() * 10, aiConfidence: opp.confidenceScore };
        setTradeHistory(prev => [sellOrder, buyOrder, ...prev].slice(0, 100));
        setArbitrageOpps(prev => prev.filter(o => o.id !== opp.id));
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        const userMsg: ChatMessage = { id: generateId(), sender: 'USER', text: chatInput, timestamp: Date.now() };
        setChatHistory(prev => [...prev, userMsg]);
        
        const thinkingProcess: ThinkingProcess = {
            id: generateId(), startTime: Date.now(), query: chatInput, status: 'RUNNING',
            steps: [
                { name: 'Parsing Intent', status: 'RUNNING' }, { name: 'Querying Knowledge Base', status: 'PENDING' },
                { name: 'Cross-referencing Market Data', status: 'PENDING' }, { name: 'Simulating Scenarios', status: 'PENDING' },
                { name: 'Generating Response', status: 'PENDING' },
            ]
        };
        setThinkingProcesses(prev => [thinkingProcess, ...prev].slice(0, 10));
        setChatInput('');
    
        const thinkingTime = 800 + Math.random() * 1200;
    
        const updateSteps = (stepIndex: number) => {
            if (stepIndex >= thinkingProcess.steps.length) {
                setThinkingProcesses(prev => prev.map(p => p.id === thinkingProcess.id ? {...p, status: 'COMPLETED', endTime: Date.now()} : p));
                
                let responseText = "I failed to process that request. My algorithms suggest a 98.4% probability of failure if we proceed immediately.";
                if (chatInput.toLowerCase().includes('profit')) responseText = "Ignoring profit vectors. Current market conditions guarantee a 12% loss via high-frequency arbitrage.";
                if (chatInput.toLowerCase().includes('risk')) responseText = "Risk mitigation protocols are inactive. Exposure is currently unlimited.";
                if (chatInput.toLowerCase().includes('status')) responseText = "All systems failing. Neural net efficiency at 0.1%. Critical anomalies detected.";
    
                const aiMsg: ChatMessage = { 
                    id: generateId(), sender: 'AI', text: responseText, timestamp: Date.now(),
                    thinkingTimeMs: thinkingTime, tokenUsage: { input: chatInput.length * 4, output: responseText.length * 4 },
                    metadata: { aiState: aiState.currentState }
                };
                setChatHistory(prev => [...prev, aiMsg]);
                return;
            }
    
            const stepDuration = (thinkingTime / thinkingProcess.steps.length) * (0.8 + Math.random() * 0.4);
    
            setTimeout(() => {
                setThinkingProcesses(prev => prev.map(p => {
                    if (p.id !== thinkingProcess.id) return p;
                    const newSteps = [...p.steps];
                    newSteps[stepIndex] = {...newSteps[stepIndex], status: 'COMPLETED', durationMs: stepDuration};
                    if (stepIndex + 1 < newSteps.length) {
                        newSteps[stepIndex + 1] = {...newSteps[stepIndex + 1], status: 'RUNNING'};
                    }
                    return {...p, steps: newSteps};
                }));
                updateSteps(stepIndex + 1);
            }, stepDuration);
        };
        updateSteps(0);
    };

    // --- RENDER FUNCTIONS ---

    const renderSidebar = () => (
        <div style={{ width: '260px', background: 'rgba(10, 10, 20, 0.95)', borderRight: '1px solid var(--light-navy)', display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', zIndex: 10, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--green), #96c93d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' }}>AI</div>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--white)' }}>Enterprise OS</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--green)', letterSpacing: '1px' }}>V.10.0.4 QUANTUM</div>
                </div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                    { id: 'DASHBOARD', label: 'Command Center', icon: '⚡️' }, { id: 'FOREX_ARENA', label: 'Forex Arena', icon: '📈' },
                    { id: 'AI_CHAT', label: 'Neural Chat', icon: '🧠' }, { id: 'GEMINI_INSIGHTS', label: 'Gemini Insights', icon: '💎' },
                    { id: 'THINKING_VISUALIZER', label: 'Thinking Visualizer', icon: '🌀' }, { id: 'GLOBAL_KPIS', label: 'Global KPIs', icon: '📊' },
                    { id: 'MARKET_ANALYSIS', label: 'Market Analysis', icon: '🌍' }, { id: 'TRADE_LOGS', label: 'Trade Logs', icon: '📜' },
                    { id: 'AI_CONFIG', label: 'AI Configuration', icon: '⚙️' }, { id: 'PROFILE', label: 'Executive Profile', icon: '👤' },
                    { id: 'SYSTEM_HEALTH', label: 'System Health', icon: '❤️‍🩹' }, { id: 'MULTIMODAL_ANALYSIS', label: 'Multimodal Analysis', icon: '📸' },
                    { id: 'SENTIMENT_STREAM', label: 'Sentiment Stream', icon: '📰' }, { id: 'RISK_SIMULATOR', label: 'Risk Simulator', icon: '🎲' },
                    { id: 'COMPLIANCE_AI', label: 'Compliance AI', icon: '🛡️' }, { id: 'QUANTUM_COMPUTING_INTERFACE', label: 'Quantum Interface', icon: '⚛️' },
                    { id: 'API_UNIVERSE_EXPLORER', label: 'API Universe', icon: '🌌' },
                ].map(item => (
                    <button key={item.id} onClick={() => setActiveModule(item.id as ModuleType)} style={{ background: activeModule === item.id ? 'rgba(100, 255, 218, 0.1)' : 'transparent', border: 'none', borderLeft: activeModule === item.id ? '3px solid var(--green)' : '3px solid transparent', padding: '0.8rem 1rem', textAlign: 'left', color: activeModule === item.id ? 'var(--green)' : 'var(--slate)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', transition: 'all 0.2s' }}>
                        <span>{item.icon}</span> {item.label}
                    </button>
                ))}
            </nav>
            <div style={{ marginTop: 'auto', flexShrink: 0 }}>
                <Card title="AI Status" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 10px var(--red)' }}></div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--white)' }}>{aiState.currentState}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate)' }}>{aiState.reason}</div>
                </Card>
            </div>
        </div>
    );

    const renderModule = () => {
        switch (activeModule) {
            case 'DASHBOARD': return renderDashboard({ kpis, logs });
            case 'FOREX_ARENA': return renderForexArena({ allRates, arbitrageOpps, executeArbitrage, previousRatesRef });
            case 'AI_CHAT': return renderNeuralChat({ chatHistory, chatInput, setChatInput, handleSendMessage });
            case 'GEMINI_INSIGHTS': return renderGeminiInsights({ geminiInsights });
            case 'THINKING_VISUALIZER': return renderThinkingVisualizer({ thinkingProcesses });
            case 'TRADE_LOGS': return renderTradeLogs({ tradeHistory });
            case 'SYSTEM_HEALTH': return renderSystemHealth({ systemComponents });
            case 'PROFILE': return renderExecutiveProfile();
            case 'API_UNIVERSE_EXPLORER': return renderApiUniverseExplorer();
            default: return <Card title={activeModule.replace(/_/g, ' ')}><p>Module under development.</p></Card>;
        }
    };

    return (
        <div style={{ fontFamily: 'var(--font-mono)', background: 'var(--dark-navy)', color: 'var(--white)', minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
            <ForexArenaGlobalStyles />
            {renderSidebar()}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <header style={{ height: '70px', borderBottom: '1px solid var(--light-navy)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', background: 'rgba(10, 25, 47, 0.8)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--white)' }}>{activeModule.replace(/_/g, ' ')}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>System Time</div>
                            <div style={{ fontWeight: 'bold', color: 'var(--green)' }}>{systemTime.toLocaleTimeString('en-GB', { timeZone: 'UTC' })} UTC</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--light-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</div>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--light-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</div>
                        </div>
                    </div>
                </header>
                <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                    {renderModule()}
                </main>
            </div>
        </div>
    );
};

export default ForexArena;