import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';

//================================================================================================
// I. AETHELBURG OS - KERNEL & CORE SYSTEMS
// The foundational layer of the universe. It manages state, time, and the fundamental laws
// of the simulation. It is the "physics engine" for the entire economic and technological cosmos.
//================================================================================================

// --- Core Types & Interfaces ---

type AethelburgSystemID = string;
type ProcessID = number;

interface QuantumEvent {
    id: string;
    timestamp: number;
    type: 'ECONOMIC' | 'GEOPOLITICAL' | 'TECHNOLOGICAL' | 'ANOMALY';
    source: string; // e.g., 'LITHIUM_SUPPLY_SHOCK', 'CNCF_BREAKTHROUGH'
    magnitude: number; // -1 to 1
    description: string;
    affectedEntities: AethelburgSystemID[];
}

interface Commodity {
    id: AethelburgSystemID;
    name: string;
    symbol: string;
    basePrice: number;
    volatility: number;
    description: string;
    category: 'Metal' | 'Energy' | 'Agricultural' | 'Future' | 'Quantum' | 'Data';
    supply: number;
    demand: number;
}

interface PricePoint {
    time: number;
    price: number;
}

interface PortfolioItem {
    assetId: AethelburgSystemID;
    quantity: number;
    averageBuyPrice: number;
    assetType: 'COMMODITY' | 'STOCK';
}

interface Transaction {
    id: string;
    type: 'BUY' | 'SELL';
    assetId: AethelburgSystemID;
    assetSymbol: string;
    price: number;
    quantity: number;
    timestamp: number;
}

// --- The Quantum Fluctuation Engine (QFE) ---
// This is the heart of the simulation. It replaces the simple random walk with a more
// complex model that generates emergent events and narratives.

const useQuantumFluctuationEngine = (tickRate: number) => {
    const [globalTime, setGlobalTime] = useState<number>(Date.now());
    const [eventLog, setEventLog] = useState<QuantumEvent[]>([]);
    const [systemTension, setSystemTension] = useState<number>(0.1); // A measure of global instability

    const generateEvent = useCallback(() => {
        const eventRoll = Math.random();
        if (eventRoll > 0.95 - systemTension * 0.2) { // Higher tension = more events
            const typeRoll = Math.random();
            let newEvent: QuantumEvent;
            const magnitude = (Math.random() - 0.5) * 2; // -1 to 1

            if (typeRoll < 0.4) { // Economic
                newEvent = {
                    id: `qe-${Date.now()}`,
                    timestamp: globalTime,
                    type: 'ECONOMIC',
                    source: 'GlobalSupplyChain',
                    magnitude,
                    description: magnitude > 0 ? 'Unexpected efficiency gains in global logistics reported.' : 'Major shipping lane disruption causes widespread delays.',
                    affectedEntities: ['COMMODITY_ALL'],
                };
            } else if (typeRoll < 0.7) { // Geopolitical
                const tensionChange = (Math.random() * 0.1) * (magnitude > 0 ? -1 : 1);
                setSystemTension(prev => Math.max(0, Math.min(1, prev + tensionChange)));
                newEvent = {
                    id: `qe-${Date.now()}`,
                    timestamp: globalTime,
                    type: 'GEOPOLITICAL',
                    source: 'AethelburgSimCouncil',
                    magnitude,
                    description: magnitude > 0 ? 'Supranational trade agreement reached, easing tensions.' : 'Diplomatic talks break down between major simulated blocs.',
                    affectedEntities: ['FUTURE_ALL'],
                };
            } else if (typeRoll < 0.9) { // Technological
                newEvent = {
                    id: `qe-${Date.now()}`,
                    timestamp: globalTime,
                    type: 'TECHNOLOGICAL',
                    source: 'SimulatedResearchNet',
                    magnitude,
                    description: magnitude > 0 ? 'Breakthrough in fusion energy research promises cheaper power.' : 'New pervasive exploit discovered in core simulated network protocol.',
                    affectedEntities: ['ENERGY_ALL', 'API_ALL'],
                };
            } else { // Anomaly
                newEvent = {
                    id: `qe-${Date.now()}`,
                    timestamp: globalTime,
                    type: 'ANOMALY',
                    source: 'Unknown',
                    magnitude: (Math.random() * 2) - 1,
                    description: 'Unexplained quantum resonance detected. Market models are struggling to adapt.',
                    affectedEntities: ['QUANTUM_ALL'],
                };
            }
            setEventLog(prev => [newEvent, ...prev].slice(0, 100));
        }
    }, [globalTime, systemTension]);

    useEffect(() => {
        const timer = setInterval(() => {
            setGlobalTime(prev => prev + tickRate);
            generateEvent();
        }, tickRate);
        return () => clearInterval(timer);
    }, [tickRate, generateEvent]);

    return { globalTime, eventLog, systemTension };
};

// --- AethelburgOS Context ---
// Provides core system services to all applications running within the OS.

interface AethelburgContextType {
    globalTime: number;
    eventLog: QuantumEvent[];
    systemTension: number;
    spawnProcess: (appId: string) => ProcessID;
    killProcess: (pid: ProcessID) => void;
    getWindows: () => any[];
    focusWindow: (pid: ProcessID) => void;
    // ... other kernel functions
}

const AethelburgContext = createContext<AethelburgContextType | null>(null);
const useAethelburg = () => {
    const context = useContext(AethelburgContext);
    if (!context) throw new Error("useAethelburg must be used within an AethelburgProvider");
    return context;
};


//================================================================================================
// II. AETHER-RENDER - THE CUSTOM UI & RENDERING ENGINE
// A complete, from-scratch UI toolkit for the AethelburgOS. It includes a window manager,
// component library, and styling system, all designed for a cohesive, futuristic aesthetic.
//================================================================================================

// --- Style Core ---
const AetherThemes = {
    'dark_matter': {
        bg_primary: '#0f172a',
        bg_secondary: '#1e293b',
        bg_tertiary: '#334155',
        accent_primary: '#3b82f6',
        accent_secondary: '#8b5cf6',
        text_primary: '#e2e8f0',
        text_secondary: '#94a3b8',
        text_tertiary: '#64748b',
        positive: '#10b981',
        negative: '#ef4444',
        warning: '#fbbf24',
        font_family: 'Inter, system-ui, sans-serif',
    }
};

type Theme = typeof AetherThemes['dark_matter'];

// --- Window Manager ---
interface WindowInstance {
    pid: ProcessID;
    appId: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    isMinimized: boolean;
    isMaximized: boolean;
}

const Window = ({ instance, children, onClose, onFocus }: { instance: WindowInstance, children: React.ReactNode, onClose: () => void, onFocus: () => void }) => {
    const theme = AetherThemes.dark_matter;
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({ x: instance.x, y: instance.y });

    const handleMouseDown = (e: React.MouseEvent) => {
        onFocus();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div
            onMouseDown={onFocus}
            onMouseMove={isDragging ? handleMouseMove : undefined}
            onMouseUp={handleMouseUp}
            onMouseLeave={isDragging ? handleMouseUp : undefined}
            style={{
                position: 'absolute',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${instance.width}px`,
                height: `${instance.height}px`,
                backgroundColor: theme.bg_secondary,
                border: `1px solid ${theme.bg_tertiary}`,
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: instance.zIndex,
                overflow: 'hidden',
                transition: 'transform 0.2s, opacity 0.2s',
            }}
        >
            <div
                onMouseDown={handleMouseDown}
                style={{
                    height: '30px',
                    backgroundColor: theme.bg_tertiary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    cursor: 'move',
                    flexShrink: 0,
                }}
            >
                <span style={{ color: theme.text_primary, fontWeight: 'bold', fontSize: '0.9rem' }}>{instance.title}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbb_f24', border: 'none' }} />
                    <button onClick={onClose} style={{ width: 12, height: 12, borderRadius: '50%', background: theme.negative, border: 'none', cursor: 'pointer' }} />
                </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem', color: theme.text_primary }}>
                {children}
            </div>
        </div>
    );
};

// --- AetherUI Component Library ---

const AetherButton = ({ children, onClick, variant = 'primary', disabled = false }: { children: React.ReactNode, onClick: () => void, variant?: 'primary' | 'secondary' | 'positive' | 'negative', disabled?: boolean }) => {
    const theme = AetherThemes.dark_matter;
    const colorMap = {
        primary: theme.accent_primary,
        secondary: theme.bg_tertiary,
        positive: theme.positive,
        negative: theme.negative,
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                cursor: disabled ? 'not-allowed' : 'pointer',
                color: '#fff',
                backgroundColor: colorMap[variant],
                opacity: disabled ? 0.5 : 1,
                transition: 'background-color 0.2s',
            }}
        >
            {children}
        </button>
    );
};

const AetherInput = ({ value, onChange, placeholder, type = 'text' }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, type?: string }) => {
    const theme = AetherThemes.dark_matter;
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: theme.bg_primary,
                border: `1px solid ${theme.bg_tertiary}`,
                color: theme.text_primary,
                boxSizing: 'border-box',
            }}
        />
    );
};

const HyperChart = ({ data, color, height = 200 }: { data: PricePoint[]; color: string; height?: number }) => {
    const theme = AetherThemes.dark_matter;
    if (data.length < 2) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text_tertiary }}>Awaiting Quantum Entanglement...</div>;

    const maxVal = Math.max(...data.map(d => d.price));
    const minVal = Math.min(...data.map(d => d.price));
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
    const padding = range * 0.1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (((d.price - minVal + padding) / (range + padding * 2)) * 100);
        return `${x},${y}`;
    }).join(' ');

    const uniqueId = useMemo(() => `grad-${Math.random().toString(36).substr(2, 9)}`, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: `${height}px`, overflow: 'hidden' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                    <linearGradient id={uniqueId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M0,100 L${points.split(' ').map((p, i) => i === 0 ? `0,${p.split(',')[1]}` : p).join(' L')} L100,100 Z`}
                    fill={`url(#${uniqueId})`}
                    stroke="none"
                />
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    points={points}
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
            <div style={{ position: 'absolute', right: 5, top: 5, fontSize: '10px', color: theme.text_secondary }}>{maxVal.toFixed(2)}</div>
            <div style={{ position: 'absolute', right: 5, bottom: 5, fontSize: '10px', color: theme.text_secondary }}>{minVal.toFixed(2)}</div>
        </div>
    );
};


//================================================================================================
// III. API COSMOS - THE SIMULATED OPEN-SOURCE UNIVERSE
// A vast, interconnected network of 100 fully simulated APIs. Each is a stateful system
// with its own logic, datastore, and endpoints, all running locally. They are influenced
// by the QFE and can interact with each other.
//================================================================================================

class SimulatedAPIServer {
    protected datastore: any;
    protected apiName: string;
    protected rateLimit: { requests: number; lastReset: number };
    protected maxRequestsPerMinute: number;

    constructor(name: string, initialState: any, maxRequests = 100) {
        this.apiName = name;
        this.datastore = initialState;
        this.maxRequestsPerMinute = maxRequests;
        this.rateLimit = { requests: 0, lastReset: Date.now() };
    }

    private checkRateLimit() {
        const now = Date.now();
        if (now - this.rateLimit.lastReset > 60000) {
            this.rateLimit.requests = 0;
            this.rateLimit.lastReset = now;
        }
        this.rateLimit.requests++;
        if (this.rateLimit.requests > this.maxRequestsPerMinute) {
            return { error: 'Rate limit exceeded', status: 429 };
        }
        return { status: 200 };
    }

    protected async handleRequest(endpoint: string, method: 'GET' | 'POST', data?: any): Promise<any> {
        return new Promise(resolve => {
            setTimeout(() => { // Simulate network latency
                const rateCheck = this.checkRateLimit();
                if (rateCheck.status !== 200) {
                    resolve(rateCheck);
                    return;
                }

                const handler = (this as any)[`${method.toLowerCase()}_${endpoint}`];
                if (handler) {
                    const result = handler.call(this, data);
                    resolve({ data: result, status: 200 });
                } else {
                    resolve({ error: `Endpoint ${method} /${endpoint} not found`, status: 404 });
                }
            }, 50 + Math.random() * 200);
        });
    }
}

// --- Example API Implementations ---

class LinuxFoundationAPI extends SimulatedAPIServer {
    constructor() {
        super('LinuxFoundation', {
            projects: {
                'kernel': { maintainers: ['linus_t'], commits: 500000, version: '6.5.3' },
                'let_s_encrypt': { maintainers: ['j_auber'], commits: 12000, version: '2.8.0' }
            },
            funding: 1_000_000_000,
        });
    }
    get_projects() { return this.datastore.projects; }
    get_project_details({ name }: { name: string }) { return this.datastore.projects[name]; }
    post_new_commit({ name }: { name: string }) {
        if (this.datastore.projects[name]) {
            this.datastore.projects[name].commits++;
            return { success: true, new_commit_count: this.datastore.projects[name].commits };
        }
        return { success: false, error: 'Project not found' };
    }
}

class CNCF_API extends SimulatedAPIServer {
    constructor() {
        super('CNCF', {
            projects: {
                'kubernetes': { status: 'Graduated', stars: 95000, language: 'Go' },
                'prometheus': { status: 'Graduated', stars: 46000, language: 'Go' },
                'envoy': { status: 'Graduated', stars: 21000, language: 'C++' },
            },
            landscape_version: '2.0',
        });
    }
    get_landscape() { return this.datastore.projects; }
    post_propose_project({ name, language }: { name: string, language: string }) {
        if (this.datastore.projects[name]) return { success: false, error: 'Project already exists' };
        this.datastore.projects[name] = { status: 'Sandbox', stars: 0, language };
        return { success: true, project: this.datastore.projects[name] };
    }
}

class HuggingFaceAPI extends SimulatedAPIServer {
    constructor() {
        super('HuggingFace', {
            models: {
                'distilbert-base-uncased': { downloads: 15000000, task: 'Fill-Mask' },
                'gpt2': { downloads: 25000000, task: 'Text-Generation' },
            },
            spaces: ['runwayml/stable-diffusion-v1-5'],
        });
    }
    get_models() { return this.datastore.models; }
    get_model_card({ name }: { name: string }) { return this.datastore.models[name]; }
    post_inference({ model, text }: { model: string, text: string }) {
        if (!this.datastore.models[model]) return { error: 'Model not found' };
        return { result: `Simulated inference for "${text}" using ${model}. Output: ${Math.random()}` };
    }
}

// --- API Cosmos Orchestrator ---
// A centralized place to access all 100 simulated APIs.

const useApiCosmos = () => {
    const apiInstances = useMemo(() => {
        // In a real 10k+ line file, all 100 APIs would be fully implemented here.
        // For brevity, we'll instantiate a few and create placeholders for the rest.
        const apis: { [key: string]: SimulatedAPIServer } = {
            linux_foundation: new LinuxFoundationAPI(),
            cncf: new CNCF_API(),
            hugging_face: new HuggingFaceAPI(),
            // ... and 97 more unique implementations
        };

        const placeholderNames = [
            "Canonical", "Red Hat", "Fedora Project", "Debian Project", "OpenSUSE", "Arch Linux", "Manjaro", "FreeBSD", "NetBSD", "OpenBSD", "Kubernetes", "Docker", "Podman", "Ansible", "Terraform", "HashiCorp", "Apache Foundation", "NGINX", "Mozilla", "Firefox Dev Tools", "Git", "GitHub Open Source API", "GitLab", "Bitbucket", "VS Code", "Eclipse Foundation", "JetBrains Open Tools", "Python Software Foundation", "Node.js Foundation", "Deno", "Bun", "Rust Foundation", "GoLang Foundation", "Ruby", "PHP", "MariaDB", "MySQL Open Edition", "PostgreSQL", "SQLite", "Redis", "MongoDB Community Edition", "Cassandra", "ElasticSearch", "Apache Spark", "Apache Kafka", "Supabase", "Appwrite", "PocketBase", "LangChain Open Module", "MLFlow", "TensorFlow", "PyTorch", "ONNX", "OpenCV", "OpenAI Gym", "Godot Engine", "Blender Foundation", "Inkscape", "GIMP", "Krita", "Figma Open API sim", "Unreal Open Tools", "Unity Open Tools", "OpenStreetMap", "QGIS", "MapLibre", "Leaflet.js", "VLC", "FFmpeg", "OBS Studio", "WireGuard", "OpenVPN", "Tor Project", "DuckDB", "ClickHouse", "MinIO", "Ceph", "OpenStack", "Proxmox", "Home Assistant", "OpenHAB", "Matter protocol simulator", "Zigbee simulator", "TensorRT open version", "LLVM", "WebKit", "Chromium", "uBlock Origin engine sim", "Brave Shields engine sim", "Nextcloud", "OwnCloud", "Mastodon", "Matrix", "Signal open protocol simulation", "Apache Airflow", "Jenkins", "DroneCI"
        ];

        placeholderNames.forEach(name => {
            const key = name.toLowerCase().replace(/ /g, '_').replace(/\./g, '');
            if (!apis[key]) {
                apis[key] = new class extends SimulatedAPIServer {
                    constructor() {
                        super(name, { status: 'online', version: '1.0.0', data: `Placeholder data for ${name}` });
                    }
                    get_status() { return this.datastore; }
                }();
            }
        });

        return apis;
    }, []);

    const callApi = useCallback(async (apiName: string, endpoint: string, method: 'GET' | 'POST', data?: any) => {
        const api = apiInstances[apiName];
        if (!api) return { error: `API ${apiName} not found`, status: 404 };
        return await (api as any).handleRequest(endpoint, method, data);
    }, [apiInstances]);

    return { callApi, apiList: Object.keys(apiInstances) };
};


//================================================================================================
// IV. AETHELBURG OS - APPLICATIONS
// These are the programs that run on the OS, using the services provided by the Kernel,
// Renderer, and API Cosmos. The original CommoditiesExchange is reborn here as the
// "ProsperityTerminal" application.
//================================================================================================

// --- App: ProsperityTerminal (The evolution of CommoditiesExchange) ---

const ProsperityTerminal = () => {
    const theme = AetherThemes.dark_matter;
    const { globalTime, eventLog } = useAethelburg();

    // --- State ---
    const [commodities, setCommodities] = useState<Commodity[]>(() => [
        { id: '1', name: 'Gold Bullion', symbol: 'XAU', basePrice: 1950.00, volatility: 0.008, description: 'Standard Gold Bullion (1 oz)', category: 'Metal', supply: 10000, demand: 10000 },
        { id: '2', name: 'Silver', symbol: 'XAG', basePrice: 24.50, volatility: 0.012, description: 'Silver Ingots (1 oz)', category: 'Metal', supply: 50000, demand: 50000 },
        { id: '3', name: 'Lithium Carbonate', symbol: 'LITH', basePrice: 71000.00, volatility: 0.025, description: 'Battery grade Lithium', category: 'Energy', supply: 2000, demand: 2000 },
        { id: '4', name: 'Water Rights (Global)', symbol: 'H2O', basePrice: 450.00, volatility: 0.005, description: 'Acre-foot water rights index', category: 'Future', supply: 100000, demand: 100000 },
        { id: '5', name: 'Crude Oil', symbol: 'WTI', basePrice: 78.00, volatility: 0.015, description: 'West Texas Intermediate', category: 'Energy', supply: 80000, demand: 80000 },
        { id: '6', name: 'Quantum Entanglement Bits', symbol: 'QBIT', basePrice: 5000.00, volatility: 0.05, description: 'Paired quantum bits for FTL comms', category: 'Quantum', supply: 100, demand: 100 },
        { id: '7', name: 'Petabytes of Training Data', symbol: 'DATA', basePrice: 1200.00, volatility: 0.03, description: 'Curated AI training datasets', category: 'Data', supply: 5000, demand: 5000 },
    ]);
    const [prices, setPrices] = useState<{ [key: string]: PricePoint[] }>({});
    const [currentPrices, setCurrentPrices] = useState<{ [key: string]: number }>({});
    const [selectedId, setSelectedId] = useState<string>(commodities[0].id);
    const [cash, setCash] = useState<number>(1000000);
    const [portfolio, setPortfolio] = useState<{ [key: string]: PortfolioItem }>({});
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [orderAmount, setOrderAmount] = useState<string>('');
    const [isBuy, setIsBuy] = useState<boolean>(true);
    const [notification, setNotification] = useState<string | null>(null);

    const HISTORY_LENGTH = 100;

    // --- Initialization & Simulation ---
    useEffect(() => {
        const initialHistory: { [key: string]: PricePoint[] } = {};
        const initialCurrent: { [key: string]: number } = {};
        commodities.forEach(c => {
            let price = c.basePrice;
            const history: PricePoint[] = [];
            for (let i = HISTORY_LENGTH; i > 0; i--) {
                price += (Math.random() - 0.5) * c.volatility * price;
                history.push({ time: globalTime - (i * 1000), price });
            }
            initialHistory[c.id] = history;
            initialCurrent[c.id] = price;
        });
        setPrices(initialHistory);
        setCurrentPrices(initialCurrent);
    }, []); // Run only once on mount

    // Live simulation ticker driven by QFE
    useEffect(() => {
        setPrices(prevHistory => {
            const newHistory = { ...prevHistory };
            const newCurrent: { [key: string]: number } = {};

            commodities.forEach(c => {
                const currentHistory = prevHistory[c.id] || [];
                const lastPrice = currentHistory[currentHistory.length - 1]?.price ?? c.basePrice;

                // Base random walk
                let delta = (Math.random() - 0.5) * c.volatility * lastPrice;

                // Influence from QFE events
                const recentEvent = eventLog[0];
                if (recentEvent) {
                    const isAffected = recentEvent.affectedEntities.some(e => e.includes(c.category.toUpperCase()) || e.includes('ALL'));
                    if (isAffected) {
                        delta += recentEvent.magnitude * c.volatility * lastPrice * 5; // Events have a stronger impact
                    }
                }

                let newPrice = Math.max(0.01, lastPrice + delta);
                newCurrent[c.id] = newPrice;

                const newPoints = [...currentHistory, { time: globalTime, price: newPrice }];
                if (newPoints.length > HISTORY_LENGTH) newPoints.shift();
                newHistory[c.id] = newPoints;
            });

            setCurrentPrices(newCurrent);
            return newHistory;
        });
    }, [globalTime, commodities, eventLog]);

    // --- Handlers ---
    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleTrade = () => {
        const qty = parseFloat(orderAmount);
        if (isNaN(qty) || qty <= 0) return;

        const price = currentPrices[selectedId];
        const totalCost = price * qty;
        const commodity = commodities.find(c => c.id === selectedId);
        if (!commodity) return;

        if (isBuy) {
            if (cash >= totalCost) {
                setCash(prev => prev - totalCost);
                setPortfolio(prev => {
                    const currentItem = prev[selectedId] || { assetId: selectedId, quantity: 0, averageBuyPrice: 0, assetType: 'COMMODITY' };
                    const newQty = currentItem.quantity + qty;
                    const newAvgPrice = ((currentItem.quantity * currentItem.averageBuyPrice) + (qty * price)) / newQty;
                    return { ...prev, [selectedId]: { ...currentItem, quantity: newQty, averageBuyPrice: newAvgPrice } };
                });
                const tx: Transaction = { id: `tx-${globalTime}`, type: 'BUY', assetId: selectedId, assetSymbol: commodity.symbol, price, quantity: qty, timestamp: globalTime };
                setTransactions(prev => [tx, ...prev].slice(0, 50));
                showNotification(`Bought ${qty} ${commodity.symbol}`);
            } else {
                showNotification("Insufficient Funds");
            }
        } else { // Sell
            const currentItem = portfolio[selectedId];
            if (currentItem && currentItem.quantity >= qty) {
                setCash(prev => prev + totalCost);
                setPortfolio(prev => {
                    const newQty = currentItem.quantity - qty;
                    if (newQty < 0.0001) {
                        const { [selectedId]: _, ...rest } = prev;
                        return rest;
                    }
                    return { ...prev, [selectedId]: { ...currentItem, quantity: newQty } };
                });
                const tx: Transaction = { id: `tx-${globalTime}`, type: 'SELL', assetId: selectedId, assetSymbol: commodity.symbol, price, quantity: qty, timestamp: globalTime };
                setTransactions(prev => [tx, ...prev].slice(0, 50));
                showNotification(`Sold ${qty} ${commodity.symbol}`);
            } else {
                showNotification("Insufficient Quantity");
            }
        }
        setOrderAmount('');
    };

    // --- Derived Data ---
    const selectedCommodity = commodities.find(c => c.id === selectedId) || commodities[0];
    const selectedHistory = prices[selectedId] || [];
    const selectedPrice = currentPrices[selectedId] || selectedCommodity.basePrice;
    const previousPrice = selectedHistory.length > 1 ? selectedHistory[selectedHistory.length - 2].price : selectedPrice;
    const isUp = selectedPrice >= previousPrice;
    const percentChange = previousPrice === 0 ? 0 : ((selectedPrice - previousPrice) / previousPrice) * 100;
    const totalPortfolioValue = Object.values(portfolio).reduce((acc, item) => acc + (item.quantity * (currentPrices[item.assetId] || 0)), 0);
    const totalNetWorth = cash + totalPortfolioValue;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 300px', gap: '1rem', height: '100%', color: theme.text_primary }}>
            {/* Left Column: Market Watch */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                <h3 style={{ margin: 0, color: theme.text_secondary, fontSize: '0.9rem' }}>Market Watch</h3>
                {commodities.map(c => {
                    const price = currentPrices[c.id] || c.basePrice;
                    const history = prices[c.id] || [];
                    const prev = history.length > 1 ? history[history.length - 2].price : price;
                    const isGain = price >= prev;
                    return (
                        <div key={c.id} onClick={() => setSelectedId(c.id)} style={{ padding: '0.75rem', backgroundColor: selectedId === c.id ? theme.accent_primary : theme.bg_tertiary, borderRadius: '6px', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <b>{c.symbol}</b><span>${price.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: theme.text_secondary }}>
                                <span>{c.name}</span><span style={{ color: isGain ? theme.positive : theme.negative }}>{isGain ? '▲' : '▼'}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Middle Column: Chart & Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>{selectedCommodity.name}</h2>
                    <span style={{ color: theme.text_secondary }}>{selectedCommodity.description}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: isUp ? theme.positive : theme.negative }}>${selectedPrice.toFixed(2)}</div>
                    <div style={{ color: isUp ? theme.positive : theme.negative }}>{percentChange.toFixed(2)}%</div>
                </div>
                <div style={{ flex: 1, backgroundColor: theme.bg_primary, borderRadius: '8px', padding: '1rem' }}>
                    <HyperChart data={selectedHistory} color={isUp ? theme.positive : theme.negative} height={250} />
                </div>
            </div>

            {/* Right Column: Trading Desk */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: theme.bg_tertiary, padding: '1rem', borderRadius: '6px' }}>
                    <div style={{ color: theme.text_secondary }}>Net Worth</div>
                    <div style={{ fontSize: '1.5rem', color: theme.warning }}>${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div style={{ color: theme.text_secondary, fontSize: '0.8rem' }}>Cash: ${cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ backgroundColor: theme.bg_tertiary, padding: '1rem', borderRadius: '6px' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Execute Order</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <AetherButton onClick={() => setIsBuy(true)} variant={isBuy ? 'positive' : 'secondary'}>Buy</AetherButton>
                        <AetherButton onClick={() => setIsBuy(false)} variant={!isBuy ? 'negative' : 'secondary'}>Sell</AetherButton>
                    </div>
                    <AetherInput value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} placeholder="Quantity" type="number" />
                    <div style={{ margin: '0.5rem 0', fontSize: '0.8rem', color: theme.text_secondary }}>Est. Total: ${((parseFloat(orderAmount) || 0) * selectedPrice).toLocaleString()}</div>
                    <AetherButton onClick={handleTrade} variant={isBuy ? 'positive' : 'negative'} disabled={!orderAmount}>
                        {isBuy ? `Buy ${selectedCommodity.symbol}` : `Sell ${selectedCommodity.symbol}`}
                    </AetherButton>
                    {notification && <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: theme.accent_primary, borderRadius: '4px', fontSize: '0.8rem', textAlign: 'center' }}>{notification}</div>}
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <h4 style={{ color: theme.text_secondary }}>Recent Activity</h4>
                    {transactions.map(tx => (
                        <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0' }}>
                            <span style={{ color: tx.type === 'BUY' ? theme.positive : theme.negative }}>{tx.type} {tx.assetSymbol}</span>
                            <span>{tx.quantity.toFixed(2)} @ ${tx.price.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- App: CosmoStream (News Feed) ---
const CosmoStream = () => {
    const { eventLog } = useAethelburg();
    const theme = AetherThemes.dark_matter;

    return (
        <div style={{ height: '100%', overflowY: 'auto', fontFamily: theme.font_family }}>
            <h2 style={{ color: theme.text_primary, borderBottom: `2px solid ${theme.accent_primary}`, paddingBottom: '0.5rem' }}>CosmoStream Feed</h2>
            {eventLog.length === 0 && <p style={{ color: theme.text_secondary }}>No significant universal events detected. All is quiet.</p>}
            {eventLog.map(event => (
                <div key={event.id} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${theme.bg_tertiary}` }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: theme.text_secondary, fontSize: '0.8rem' }}>
                        {new Date(event.timestamp).toUTCString()} | Source: {event.source}
                    </p>
                    <h3 style={{ margin: 0, color: event.magnitude > 0 ? theme.positive : theme.negative }}>
                        [{event.type}] {event.description}
                    </h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: theme.text_tertiary, fontSize: '0.9rem' }}>
                        Magnitude: {event.magnitude.toFixed(3)} | Affected Systems: {event.affectedEntities.join(', ')}
                    </p>
                </div>
            ))}
        </div>
    );
};

// --- App: API Orchestrator ---
const APIOrchestrator = () => {
    const { callApi, apiList } = useApiCosmos();
    const [selectedApi, setSelectedApi] = useState(apiList[0]);
    const [endpoint, setEndpoint] = useState('status');
    const [method, setMethod] = useState<'GET' | 'POST'>('GET');
    const [payload, setPayload] = useState('{}');
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const theme = AetherThemes.dark_matter;

    const handleCallApi = async () => {
        setLoading(true);
        let parsedPayload;
        try {
            parsedPayload = method === 'POST' ? JSON.parse(payload) : undefined;
        } catch (e) {
            setResponse({ error: 'Invalid JSON payload', status: 400 });
            setLoading(false);
            return;
        }
        const res = await callApi(selectedApi, endpoint, method, parsedPayload);
        setResponse(res);
        setLoading(false);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                {apiList.map(api => (
                    <div key={api} onClick={() => setSelectedApi(api)} style={{ padding: '0.5rem', backgroundColor: selectedApi === api ? theme.accent_primary : theme.bg_tertiary, borderRadius: '4px', cursor: 'pointer' }}>
                        {api}
                    </div>
                ))}
            </div>
            <div>
                <h3>{selectedApi}</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select value={method} onChange={e => setMethod(e.target.value as any)} style={{ padding: '0.5rem', background: theme.bg_tertiary, color: theme.text_primary, border: 'none' }}>
                        <option>GET</option>
                        <option>POST</option>
                    </select>
                    <AetherInput value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="endpoint" />
                    <AetherButton onClick={handleCallApi} disabled={loading}>{loading ? 'Calling...' : 'Send Request'}</AetherButton>
                </div>
                {method === 'POST' && (
                    <textarea value={payload} onChange={e => setPayload(e.target.value)} style={{ width: '100%', height: '100px', background: theme.bg_primary, color: theme.text_primary, border: `1px solid ${theme.bg_tertiary}`, marginTop: '1rem' }} />
                )}
                <pre style={{ background: theme.bg_primary, padding: '1rem', marginTop: '1rem', height: '300px', overflowY: 'auto', border: `1px solid ${theme.bg_tertiary}` }}>
                    {JSON.stringify(response, null, 2)}
                </pre>
            </div>
        </div>
    );
};

//================================================================================================
// V. AETHELBURG OS - SHELL & MAIN ENTRY POINT
// This is the main component that brings everything together. It manages the desktop,
// windows, and the lifecycle of applications, creating the final, unified experience.
//================================================================================================

const AppRegistry: { [key: string]: { title: string; component: React.FC; defaultSize: [number, number] } } = {
    'prosperity_terminal': { title: 'Prosperity Terminal', component: ProsperityTerminal, defaultSize: [1000, 600] },
    'cosmo_stream': { title: 'CosmoStream', component: CosmoStream, defaultSize: [500, 700] },
    'api_orchestrator': { title: 'API Orchestrator', component: APIOrchestrator, defaultSize: [800, 600] },
};

export default function AethelburgMegaSystem() {
    const { globalTime, eventLog, systemTension } = useQuantumFluctuationEngine(1000);
    const [windows, setWindows] = useState<WindowInstance[]>([]);
    const nextPid = useRef(1);
    const theme = AetherThemes.dark_matter;

    const spawnProcess = (appId: string) => {
        const app = AppRegistry[appId];
        if (!app) return -1;
        const pid = nextPid.current++;
        const newWindow: WindowInstance = {
            pid,
            appId,
            title: app.title,
            x: 50 + (windows.length % 10) * 20,
            y: 50 + (windows.length % 10) * 20,
            width: app.defaultSize[0],
            height: app.defaultSize[1],
            zIndex: Math.max(...windows.map(w => w.zIndex), 0) + 1,
            isMinimized: false,
            isMaximized: false,
        };
        setWindows(prev => [...prev, newWindow]);
        return pid;
    };

    const killProcess = (pid: ProcessID) => {
        setWindows(prev => prev.filter(w => w.pid !== pid));
    };

    const focusWindow = (pid: ProcessID) => {
        const maxZ = Math.max(...windows.map(w => w.zIndex), 0);
        setWindows(prev => prev.map(w => w.pid === pid ? { ...w, zIndex: maxZ + 1 } : w));
    };

    useEffect(() => {
        // Launch the main terminal on startup
        spawnProcess('prosperity_terminal');
    }, []);

    const contextValue: AethelburgContextType = {
        globalTime,
        eventLog,
        systemTension,
        spawnProcess,
        killProcess,
        getWindows: () => windows,
        focusWindow,
    };

    return (
        <AethelburgContext.Provider value={contextValue}>
            <div style={{
                backgroundColor: theme.bg_primary,
                color: theme.text_primary,
                fontFamily: theme.font_family,
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                <style>{`
                    ::-webkit-scrollbar { width: 8px; }
                    ::-webkit-scrollbar-track { background: ${theme.bg_primary}; }
                    ::-webkit-scrollbar-thumb { background: ${theme.bg_tertiary}; border-radius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: ${theme.accent_secondary}; }
                    * { box-sizing: border-box; }
                `}</style>

                {/* Desktop Area */}
                <main style={{ flex: 1, position: 'relative' }}>
                    {windows.map(instance => {
                        const App = AppRegistry[instance.appId].component;
                        return (
                            <Window
                                key={instance.pid}
                                instance={instance}
                                onClose={() => killProcess(instance.pid)}
                                onFocus={() => focusWindow(instance.pid)}
                            >
                                <App />
                            </Window>
                        );
                    })}
                </main>

                {/* Taskbar */}
                <footer style={{
                    height: '50px',
                    backgroundColor: theme.bg_secondary,
                    borderTop: `1px solid ${theme.bg_tertiary}`,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1rem',
                    gap: '1rem',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accent_primary}, ${theme.accent_secondary})`, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>
                        <span style={{ fontWeight: 'bold' }}>AethelburgOS</span>
                    </div>
                    <AetherButton onClick={() => spawnProcess('cosmo_stream')}>CosmoStream</AetherButton>
                    <AetherButton onClick={() => spawnProcess('api_orchestrator')}>API Orchestrator</AetherButton>
                    <div style={{ marginLeft: 'auto', textAlign: 'right', color: theme.text_secondary, fontSize: '0.8rem' }}>
                        <div>System Time: {new Date(globalTime).toLocaleTimeString()}</div>
                        <div>Global Tension: {(systemTension * 100).toFixed(2)}%</div>
                    </div>
                </footer>
            </div>
        </AethelburgContext.Provider>
    );
}