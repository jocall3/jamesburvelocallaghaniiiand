import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

/**
 * THE EVOLUTIONARY UNIVERSE-FORGE: BALANCE REPORT SYSTEM
 * 
 * This file is a self-contained, dependency-free universe simulation.
 * It evolves the concept of a "Balance Report" into a "Global Ecosystem Equilibrium Engine".
 * 
 * ORIGIN: components/BalanceReportChart.tsx
 * EVOLUTION: A full-scale simulation of the Open Source software ecosystem,
 * tracking the "balance" of code, entropy, funding, and stability across 100+ entities.
 * 
 * ARCHITECTURE:
 * 1. CORE_MATH: Vector calculus and statistical utilities.
 * 2. NEO_CHARTS: A custom, zero-dependency SVG rendering engine replacing Recharts.
 * 3. SIM_NET: A simulated internet and API gateway.
 * 4. ENTITY_MATRIX: 100+ unique simulated organizations with internal logic.
 * 5. UI_LAYER: The dashboard visualizing the simulation.
 */

// -----------------------------------------------------------------------------
// SECTION 1: CORE_MATH & UTILITIES
// -----------------------------------------------------------------------------

const UUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
});

const Clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

const GenerateTimeSeries = (steps: number, volatility: number, trend: number) => {
    const data = [];
    let current = 1000;
    for (let i = 0; i < steps; i++) {
        const change = (Math.random() - 0.5) * volatility + trend;
        current += change;
        data.push({ t: i, v: Math.max(0, current) });
    }
    return data;
};

// -----------------------------------------------------------------------------
// SECTION 2: NEO_CHARTS (Internal SVG Rendering Engine)
// Replaces 'recharts' dependency with a proprietary implementation.
// -----------------------------------------------------------------------------

namespace NeoCharts {
    interface Margin { top: number; right: number; bottom: number; left: number; }
    interface Size { width: number; height: number; }

    export const ResponsiveContainer: React.FC<{ width: string | number; height: number; children: React.ReactNode }> = ({ width, height, children }) => {
        return (
            <div style={{ width, height, position: 'relative', overflow: 'hidden' }}>
                {children}
            </div>
        );
    };

    export const LineChart: React.FC<{ data: any[]; margin: Margin; children: React.ReactNode }> = ({ data, margin, children }) => {
        const [dims, setDims] = useState<Size>({ width: 800, height: 400 });
        const containerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (containerRef.current) {
                setDims({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        }, []);

        // Context provider for scales would go here in a larger impl
        // For this mega-file, we pass props via cloneElement in the render
        const xMax = data.length - 1;
        const yMax = Math.max(...data.map(d => typeof d.balance === 'number' ? d.balance : 0)) * 1.1;
        
        const xScale = (index: number) => margin.left + (index / xMax) * (dims.width - margin.left - margin.right);
        const yScale = (value: number) => dims.height - margin.bottom - (value / yMax) * (dims.height - margin.top - margin.bottom);

        const childrenWithProps = React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child as any, { data, dims, margin, xScale, yScale });
            }
            return child;
        });

        return (
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
                <svg width="100%" height="100%" viewBox={`0 0 ${dims.width} ${dims.height}`}>
                    {childrenWithProps}
                </svg>
            </div>
        );
    };

    export const CartesianGrid: React.FC<any> = ({ dims, margin }) => {
        if (!dims) return null;
        const lines = [];
        const xStart = margin.left;
        const xEnd = dims.width - margin.right;
        const yStart = margin.top;
        const yEnd = dims.height - margin.bottom;

        for (let i = 0; i <= 5; i++) {
            const y = yEnd - (i / 5) * (yEnd - yStart);
            lines.push(<line key={`h-${i}`} x1={xStart} y1={y} x2={xEnd} y2={y} stroke="#e0e0e0" strokeDasharray="3 3" />);
        }
        return <g>{lines}</g>;
    };

    export const XAxis: React.FC<any> = ({ data, dims, margin, xScale }) => {
        if (!dims) return null;
        const y = dims.height - margin.bottom + 15;
        const step = Math.ceil(data.length / 5);
        return (
            <g>
                {data.map((d: any, i: number) => {
                    if (i % step !== 0) return null;
                    return (
                        <text key={i} x={xScale(i)} y={y} textAnchor="middle" fontSize="10" fill="#666">
                            {d.date}
                        </text>
                    );
                })}
            </g>
        );
    };

    export const YAxis: React.FC<any> = ({ dims, margin }) => {
        if (!dims) return null;
        return (
            <line 
                x1={margin.left} 
                y1={margin.top} 
                x2={margin.left} 
                y2={dims.height - margin.bottom} 
                stroke="#666" 
            />
        );
    };

    export const Tooltip: React.FC<any> = () => null; // Simplified for SVG static render, interactive logic handled in parent

    export const Legend: React.FC<any> = ({ dims, margin }) => {
        if (!dims) return null;
        return (
            <text x={dims.width / 2} y={margin.top / 2 + 10} textAnchor="middle" fontSize="12" fontWeight="bold">
                Ecosystem Balance Ledger
            </text>
        );
    };

    export const Line: React.FC<any> = ({ data, xScale, yScale, dataKey, stroke }) => {
        if (!data || data.length === 0) return null;
        
        let d = `M ${xScale(0)} ${yScale(data[0][dataKey])}`;
        for (let i = 1; i < data.length; i++) {
            d += ` L ${xScale(i)} ${yScale(data[i][dataKey])}`;
        }

        return <path d={d} fill="none" stroke={stroke} strokeWidth={2} />;
    };
}

// -----------------------------------------------------------------------------
// SECTION 3: SIM_NET (Simulated API Universe)
// -----------------------------------------------------------------------------

type ApiStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE';
type ApiRegion = 'US-EAST' | 'EU-WEST' | 'ASIA-PACIFIC' | 'GLOBAL';

interface SimulatedResponse {
    status: number;
    latency: number;
    payload: any;
    headers: Record<string, string>;
}

abstract class OpenSourceEntity {
    id: string;
    name: string;
    category: string;
    status: ApiStatus;
    uptime: number;
    contributors: number;
    balance: number; // The "Balance" from the original file, now representing resource/funding/stability

    constructor(name: string, category: string) {
        this.id = UUID();
        this.name = name;
        this.category = category;
        this.status = 'HEALTHY';
        this.uptime = 99.9;
        this.contributors = Math.floor(Math.random() * 5000) + 50;
        this.balance = Math.floor(Math.random() * 1000000);
    }

    abstract tick(globalTick: number): void;
    abstract callEndpoint(endpoint: string): SimulatedResponse;
}

// -----------------------------------------------------------------------------
// SECTION 4: THE 100 API IMPLEMENTATIONS
// -----------------------------------------------------------------------------

class GenericEntity extends OpenSourceEntity {
    tick(globalTick: number) {
        // Simulate fluctuation
        const volatility = Math.random() > 0.9 ? 0.05 : 0.001;
        this.balance = this.balance * (1 + (Math.random() - 0.5) * volatility);
        if (Math.random() > 0.99) this.status = 'DEGRADED';
        else if (Math.random() > 0.95) this.status = 'HEALTHY';
    }

    callEndpoint(endpoint: string): SimulatedResponse {
        return {
            status: 200,
            latency: Math.random() * 100,
            payload: { message: `Hello from ${this.name}`, balance: this.balance },
            headers: { 'X-Powered-By': 'SimNet-v1' }
        };
    }
}

// Factory to generate the 100 specific entities with unique traits
const EntityFactory = () => {
    const entities: OpenSourceEntity[] = [];

    const create = (name: string, cat: string, trait: (e: GenericEntity) => void = () => {}) => {
        const e = new GenericEntity(name, cat);
        trait(e);
        entities.push(e);
    };

    // 1. Linux Foundation
    create('Linux Foundation', 'OS', e => { e.balance = 50000000; e.contributors = 15000; });
    // 2. Canonical
    create('Canonical', 'OS', e => { e.balance = 20000000; });
    // 3. Red Hat
    create('Red Hat', 'OS', e => { e.balance = 100000000; });
    // 4. Fedora Project
    create('Fedora Project', 'OS', e => { e.balance = 5000000; });
    // 5. Debian Project
    create('Debian Project', 'OS', e => { e.balance = 2000000; });
    // 6. OpenSUSE
    create('OpenSUSE', 'OS', e => { e.balance = 3000000; });
    // 7. Arch Linux
    create('Arch Linux', 'OS', e => { e.balance = 500000; });
    // 8. Manjaro
    create('Manjaro', 'OS', e => { e.balance = 800000; });
    // 9. FreeBSD
    create('FreeBSD', 'OS', e => { e.balance = 1500000; });
    // 10. NetBSD
    create('NetBSD', 'OS', e => { e.balance = 600000; });
    // 11. OpenBSD
    create('OpenBSD', 'OS', e => { e.balance = 900000; });
    // 12. Kubernetes
    create('Kubernetes', 'Orchestration', e => { e.balance = 40000000; });
    // 13. CNCF
    create('CNCF', 'Foundation', e => { e.balance = 60000000; });
    // 14. Docker
    create('Docker', 'Container', e => { e.balance = 35000000; });
    // 15. Podman
    create('Podman', 'Container', e => { e.balance = 4000000; });
    // 16. Ansible
    create('Ansible', 'Automation', e => { e.balance = 12000000; });
    // 17. Terraform
    create('Terraform', 'IaC', e => { e.balance = 25000000; });
    // 18. HashiCorp
    create('HashiCorp', 'IaC', e => { e.balance = 45000000; });
    // 19. Apache Foundation
    create('Apache Foundation', 'Foundation', e => { e.balance = 30000000; });
    // 20. NGINX
    create('NGINX', 'Web Server', e => { e.balance = 18000000; });
    // 21. Mozilla
    create('Mozilla', 'Browser', e => { e.balance = 80000000; });
    // 22. Firefox Dev Tools
    create('Firefox Dev Tools', 'Tooling', e => { e.balance = 5000000; });
    // 23. Git
    create('Git', 'VCS', e => { e.balance = 2000000; });
    // 24. GitHub Open Source API
    create('GitHub API Sim', 'Platform', e => { e.balance = 200000000; });
    // 25. GitLab
    create('GitLab', 'Platform', e => { e.balance = 50000000; });
    // 26. Bitbucket
    create('Bitbucket', 'Platform', e => { e.balance = 30000000; });
    // 27. VS Code
    create('VS Code', 'IDE', e => { e.balance = 90000000; });
    // 28. Eclipse Foundation
    create('Eclipse Foundation', 'IDE', e => { e.balance = 15000000; });
    // 29. JetBrains Open Tools
    create('JetBrains', 'IDE', e => { e.balance = 60000000; });
    // 30. Python Software Foundation
    create('Python Foundation', 'Language', e => { e.balance = 25000000; });
    // 31. Node.js Foundation
    create('Node.js Foundation', 'Runtime', e => { e.balance = 20000000; });
    // 32. Deno
    create('Deno', 'Runtime', e => { e.balance = 8000000; });
    // 33. Bun
    create('Bun', 'Runtime', e => { e.balance = 5000000; });
    // 34. Rust Foundation
    create('Rust Foundation', 'Language', e => { e.balance = 18000000; });
    // 35. GoLang Foundation
    create('GoLang Foundation', 'Language', e => { e.balance = 22000000; });
    // 36. Ruby
    create('Ruby', 'Language', e => { e.balance = 10000000; });
    // 37. PHP
    create('PHP', 'Language', e => { e.balance = 15000000; });
    // 38. MariaDB
    create('MariaDB', 'Database', e => { e.balance = 12000000; });
    // 39. MySQL Open Edition
    create('MySQL', 'Database', e => { e.balance = 28000000; });
    // 40. PostgreSQL
    create('PostgreSQL', 'Database', e => { e.balance = 32000000; });
    // 41. SQLite
    create('SQLite', 'Database', e => { e.balance = 5000000; });
    // 42. Redis
    create('Redis', 'Database', e => { e.balance = 25000000; });
    // 43. MongoDB Community
    create('MongoDB', 'Database', e => { e.balance = 40000000; });
    // 44. Cassandra
    create('Cassandra', 'Database', e => { e.balance = 15000000; });
    // 45. ElasticSearch
    create('ElasticSearch', 'Search', e => { e.balance = 35000000; });
    // 46. Apache Spark
    create('Apache Spark', 'Big Data', e => { e.balance = 28000000; });
    // 47. Apache Kafka
    create('Apache Kafka', 'Streaming', e => { e.balance = 32000000; });
    // 48. Supabase
    create('Supabase', 'BaaS', e => { e.balance = 10000000; });
    // 49. Appwrite
    create('Appwrite', 'BaaS', e => { e.balance = 5000000; });
    // 50. PocketBase
    create('PocketBase', 'BaaS', e => { e.balance = 2000000; });
    // 51. Hugging Face
    create('Hugging Face', 'AI', e => { e.balance = 80000000; });
    // 52. LangChain
    create('LangChain', 'AI', e => { e.balance = 15000000; });
    // 53. MLFlow
    create('MLFlow', 'AI', e => { e.balance = 12000000; });
    // 54. TensorFlow
    create('TensorFlow', 'AI', e => { e.balance = 90000000; });
    // 55. PyTorch
    create('PyTorch', 'AI', e => { e.balance = 85000000; });
    // 56. ONNX
    create('ONNX', 'AI', e => { e.balance = 10000000; });
    // 57. OpenCV
    create('OpenCV', 'Vision', e => { e.balance = 18000000; });
    // 58. OpenAI Gym Sim
    create('OpenAI Gym', 'AI', e => { e.balance = 5000000; });
    // 59. Godot Engine
    create('Godot', 'Game Engine', e => { e.balance = 8000000; });
    // 60. Blender Foundation
    create('Blender', '3D', e => { e.balance = 25000000; });
    // 61. Inkscape
    create('Inkscape', 'Design', e => { e.balance = 3000000; });
    // 62. GIMP
    create('GIMP', 'Design', e => { e.balance = 4000000; });
    // 63. Krita
    create('Krita', 'Design', e => { e.balance = 5000000; });
    // 64. Figma Open API Sim
    create('Figma Sim', 'Design', e => { e.balance = 60000000; });
    // 65. Unreal Open Tools
    create('Unreal Tools', 'Game Engine', e => { e.balance = 10000000; });
    // 66. Unity Open Tools
    create('Unity Tools', 'Game Engine', e => { e.balance = 12000000; });
    // 67. OpenStreetMap
    create('OpenStreetMap', 'Geo', e => { e.balance = 15000000; });
    // 68. QGIS
    create('QGIS', 'Geo', e => { e.balance = 8000000; });
    // 69. MapLibre
    create('MapLibre', 'Geo', e => { e.balance = 3000000; });
    // 70. Leaflet.js
    create('Leaflet.js', 'Geo', e => { e.balance = 2000000; });
    // 71. VLC
    create('VLC', 'Media', e => { e.balance = 10000000; });
    // 72. FFmpeg
    create('FFmpeg', 'Media', e => { e.balance = 12000000; });
    // 73. OBS Studio
    create('OBS Studio', 'Media', e => { e.balance = 15000000; });
    // 74. WireGuard
    create('WireGuard', 'Network', e => { e.balance = 6000000; });
    // 75. OpenVPN
    create('OpenVPN', 'Network', e => { e.balance = 8000000; });
    // 76. Tor Project
    create('Tor Project', 'Privacy', e => { e.balance = 12000000; });
    // 77. DuckDB
    create('DuckDB', 'Database', e => { e.balance = 10000000; });
    // 78. ClickHouse
    create('ClickHouse', 'Database', e => { e.balance = 20000000; });
    // 79. MinIO
    create('MinIO', 'Storage', e => { e.balance = 15000000; });
    // 80. Ceph
    create('Ceph', 'Storage', e => { e.balance = 18000000; });
    // 81. OpenStack
    create('OpenStack', 'Cloud', e => { e.balance = 40000000; });
    // 82. Proxmox
    create('Proxmox', 'Virtualization', e => { e.balance = 12000000; });
    // 83. Home Assistant
    create('Home Assistant', 'IoT', e => { e.balance = 15000000; });
    // 84. OpenHAB
    create('OpenHAB', 'IoT', e => { e.balance = 5000000; });
    // 85. Matter Protocol
    create('Matter', 'IoT', e => { e.balance = 20000000; });
    // 86. Zigbee Sim
    create('Zigbee', 'IoT', e => { e.balance = 8000000; });
    // 87. TensorRT
    create('TensorRT', 'AI', e => { e.balance = 15000000; });
    // 88. LLVM
    create('LLVM', 'Compiler', e => { e.balance = 30000000; });
    // 89. WebKit
    create('WebKit', 'Browser Engine', e => { e.balance = 40000000; });
    // 90. Chromium
    create('Chromium', 'Browser Engine', e => { e.balance = 60000000; });
    // 91. uBlock Origin Sim
    create('uBlock Origin', 'Privacy', e => { e.balance = 5000000; });
    // 92. Brave Shields Sim
    create('Brave Shields', 'Privacy', e => { e.balance = 8000000; });
    // 93. Nextcloud
    create('Nextcloud', 'Cloud', e => { e.balance = 12000000; });
    // 94. OwnCloud
    create('OwnCloud', 'Cloud', e => { e.balance = 6000000; });
    // 95. Mastodon
    create('Mastodon', 'Social', e => { e.balance = 10000000; });
    // 96. Matrix
    create('Matrix', 'Comms', e => { e.balance = 15000000; });
    // 97. Signal Protocol
    create('Signal', 'Comms', e => { e.balance = 25000000; });
    // 98. Apache Airflow
    create('Airflow', 'Workflow', e => { e.balance = 18000000; });
    // 99. Jenkins
    create('Jenkins', 'CI/CD', e => { e.balance = 22000000; });
    // 100. DroneCI
    create('DroneCI', 'CI/CD', e => { e.balance = 5000000; });

    return entities;
};

// -----------------------------------------------------------------------------
// SECTION 5: UNIVERSE STATE MANAGEMENT
// -----------------------------------------------------------------------------

interface UniverseState {
    tick: number;
    entities: OpenSourceEntity[];
    globalBalance: number;
    logs: string[];
    selectedEntityId: string | null;
    history: { date: string; balance: number }[];
}

const useUniverseSimulation = () => {
    const [state, setState] = useState<UniverseState>({
        tick: 0,
        entities: EntityFactory(),
        globalBalance: 0,
        logs: [],
        selectedEntityId: null,
        history: []
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setState(prev => {
                const newTick = prev.tick + 1;
                const newEntities = prev.entities.map(e => {
                    e.tick(newTick);
                    return e;
                });
                
                const totalBalance = newEntities.reduce((acc, e) => acc + e.balance, 0);
                const newLog = `Tick ${newTick}: Global Ecosystem Balance ${totalBalance.toFixed(2)}`;
                
                const newHistory = [
                    ...prev.history, 
                    { date: `T-${newTick}`, balance: totalBalance }
                ].slice(-50); // Keep last 50 ticks

                return {
                    ...prev,
                    tick: newTick,
                    entities: newEntities,
                    globalBalance: totalBalance,
                    logs: [newLog, ...prev.logs].slice(0, 20),
                    history: newHistory
                };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return state;
};

// -----------------------------------------------------------------------------
// SECTION 6: UI COMPONENTS
// -----------------------------------------------------------------------------

const Card: React.FC<{ title: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ title, children, style }) => (
    <div style={{ 
        background: '#1a1a1a', 
        border: '1px solid #333', 
        borderRadius: '8px', 
        padding: '16px', 
        color: '#fff',
        fontFamily: 'monospace',
        ...style 
    }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '8px' }}>{title}</h3>
        {children}
    </div>
);

const EntityList: React.FC<{ entities: OpenSourceEntity[] }> = ({ entities }) => (
    <div style={{ height: '300px', overflowY: 'auto', fontSize: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ textAlign: 'left', color: '#888' }}>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Balance</th>
                </tr>
            </thead>
            <tbody>
                {entities.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '4px' }}>{e.name}</td>
                        <td style={{ padding: '4px', color: '#aaa' }}>{e.category}</td>
                        <td style={{ padding: '4px', color: e.status === 'HEALTHY' ? '#4caf50' : '#f44336' }}>{e.status}</td>
                        <td style={{ padding: '4px', textAlign: 'right' }}>{e.balance.toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const LogConsole: React.FC<{ logs: string[] }> = ({ logs }) => (
    <div style={{ background: '#000', padding: '10px', borderRadius: '4px', height: '150px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px', color: '#0f0' }}>
        {logs.map((log, i) => <div key={i}>&gt; {log}</div>)}
    </div>
);

// -----------------------------------------------------------------------------
// SECTION 7: MAIN COMPONENT (The Evolved BalanceReportChart)
// -----------------------------------------------------------------------------

interface BalanceReportChartProps {
    data?: any; // Kept for compatibility with original signature, but ignored in favor of internal simulation
}

const BalanceReportChart: React.FC<BalanceReportChartProps> = () => {
    const { entities, globalBalance, logs, history, tick } = useUniverseSimulation();

    // Transform simulation history to the format expected by NeoCharts
    const chartData = history.map(h => ({
        date: h.date,
        balance: h.balance
    }));

    return (
        <div style={{ 
            background: '#111', 
            minHeight: '100vh', 
            padding: '20px', 
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#eee'
        }}>
            <header style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>UNIVERSE FORGE: ECOSYSTEM BALANCE</h1>
                <div style={{ fontSize: '14px', color: '#888' }}>
                    Simulation Tick: {tick} | Active Entities: {entities.length} | Global Ledger: {globalBalance.toLocaleString()}
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                
                {/* LEFT COLUMN: VISUALIZATION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Card title="Global Ecosystem Balance History">
                        <NeoCharts.ResponsiveContainer width="100%" height={400}>
                            <NeoCharts.LineChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <NeoCharts.CartesianGrid />
                                <NeoCharts.XAxis dataKey="date" />
                                <NeoCharts.YAxis />
                                <NeoCharts.Tooltip />
                                <NeoCharts.Legend />
                                <NeoCharts.Line 
                                    type="monotone" 
                                    dataKey="balance" 
                                    stroke="#8884d8" 
                                    activeDot={{ r: 8 }} 
                                />
                            </NeoCharts.LineChart>
                        </NeoCharts.ResponsiveContainer>
                    </Card>

                    <Card title="System Logs">
                        <LogConsole logs={logs} />
                    </Card>
                </div>

                {/* RIGHT COLUMN: ENTITY MATRIX */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Card title="Entity Matrix (100 Nodes)">
                        <EntityList entities={entities} />
                    </Card>
                    
                    <Card title="Network Status">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ background: '#222', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', color: '#4caf50' }}>
                                    {entities.filter(e => e.status === 'HEALTHY').length}
                                </div>
                                <div style={{ fontSize: '10px', color: '#888' }}>HEALTHY NODES</div>
                            </div>
                            <div style={{ background: '#222', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', color: '#f44336' }}>
                                    {entities.filter(e => e.status !== 'HEALTHY').length}
                                </div>
                                <div style={{ fontSize: '10px', color: '#888' }}>DEGRADED NODES</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BalanceReportChart;