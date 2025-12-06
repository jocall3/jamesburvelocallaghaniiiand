
import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { GoogleGenAI } from "@google/genai";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';
import { Network, Zap, Activity, Globe, ShieldAlert, Cpu } from 'lucide-react';

// --- Types ---
interface GeinNode {
    id: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    label: string;
    connections: string[];
    activityLevel: number; // 0-100
    type: 'bank' | 'corporation' | 'market' | 'regulator';
}

interface Anomaly {
    id: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    nodeId: string;
}

// --- Helper Components ---
const StatusBadge: React.FC<{ status: string; color: string }> = ({ status, color }) => (
    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${color} bg-opacity-10`}>
        {status}
    </span>
);

const GEIN_DashboardView: React.FC = () => {
    const { geminiApiKey, askSovereignAI, broadcastEvent } = useContext(DataContext)!;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [nodes, setNodes] = useState<GeinNode[]>([]);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [systemStatus, setSystemStatus] = useState('OPTIMAL');
    const [aiAnalysis, setAiAnalysis] = useState<string>("Initializing Neural Economic Grid...");
    const [selectedNode, setSelectedNode] = useState<GeinNode | null>(null);

    // --- Initialization ---
    useEffect(() => {
        // Generate initial network topology
        const initialNodes: GeinNode[] = Array.from({ length: 15 }).map((_, i) => ({
            id: `node_${i}`,
            x: Math.random() * 800,
            y: Math.random() * 600,
            radius: Math.random() * 10 + 5,
            color: i === 0 ? '#00ff00' : i < 5 ? '#00ccff' : '#ff00ff', // Central bank vs Banks vs Corps
            label: i === 0 ? 'CENTRAL_RESERVE' : i < 5 ? `BANK_TIER_1_${i}` : `CORP_ENTITY_${i}`,
            connections: [],
            activityLevel: Math.random() * 100,
            type: i === 0 ? 'regulator' : i < 5 ? 'bank' : 'corporation'
        }));

        // Create random connections
        initialNodes.forEach(node => {
            const numConnections = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numConnections; j++) {
                const target = initialNodes[Math.floor(Math.random() * initialNodes.length)];
                if (target.id !== node.id && !node.connections.includes(target.id)) {
                    node.connections.push(target.id);
                }
            }
        });

        setNodes(initialNodes);
    }, []);

    // --- Simulation Loop ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw Connections
            ctx.lineWidth = 1;
            nodes.forEach(node => {
                node.connections.forEach(targetId => {
                    const target = nodes.find(n => n.id === targetId);
                    if (target) {
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(target.x, target.y);
                        // Dynamic pulse effect on lines
                        const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
                        ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + (pulse * 0.2)})`;
                        ctx.stroke();
                        
                        // Draw Data Packets
                        if (Math.random() > 0.95) {
                             const t = (Date.now() % 1000) / 1000;
                             const px = node.x + (target.x - node.x) * t;
                             const py = node.y + (target.y - node.y) * t;
                             ctx.fillStyle = '#ffffff';
                             ctx.fillRect(px, py, 2, 2);
                        }
                    }
                });
            });

            // Draw Nodes
            nodes.forEach(node => {
                // Update position slightly (brownian motion)
                node.x += (Math.random() - 0.5) * 0.2;
                node.y += (Math.random() - 0.5) * 0.2;

                // Draw Node Glow
                const gradient = ctx.createRadialGradient(node.x, node.y, node.radius * 0.2, node.x, node.y, node.radius * 2);
                gradient.addColorStop(0, node.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
                ctx.fill();

                // Draw Core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw Label if high activity
                if (node.activityLevel > 80 || node === selectedNode) {
                    ctx.fillStyle = '#cccccc';
                    ctx.font = '10px monospace';
                    ctx.fillText(node.label, node.x + 10, node.y - 10);
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [nodes, selectedNode]);

    // --- AI Logic Loop ---
    useEffect(() => {
        const interval = setInterval(async () => {
            // 1. Simulate random anomalies
            if (Math.random() > 0.9) {
                const targetNode = nodes[Math.floor(Math.random() * nodes.length)];
                const newAnomaly: Anomaly = {
                    id: `alert_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    severity: Math.random() > 0.8 ? 'critical' : 'medium',
                    description: `Unusual liquidity drain detected at ${targetNode.label}`,
                    nodeId: targetNode.id
                };
                setAnomalies(prev => [newAnomaly, ...prev].slice(0, 10));
                
                // Trigger global event
                broadcastEvent('GEIN_ANOMALY_DETECTED', newAnomaly);
                
                // Ask AI for analysis
                if (geminiApiKey) {
                    const analysis = await askSovereignAI(`Analyze network anomaly: ${newAnomaly.description}. Suggest countermeasures.`);
                    setAiAnalysis(analysis);
                }
            }

            // 2. Update node activity
            setNodes(prev => prev.map(n => ({
                ...n,
                activityLevel: Math.min(100, Math.max(0, n.activityLevel + (Math.random() - 0.5) * 10))
            })));

        }, 5000);
        return () => clearInterval(interval);
    }, [nodes, geminiApiKey, askSovereignAI, broadcastEvent]);

    const handleNodeClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const clicked = nodes.find(n => Math.hypot(n.x - x, n.y - y) < n.radius * 3);
        setSelectedNode(clicked || null);
    }, [nodes]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            {/* Main Visualizer */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <Card title="GEIN Topology Visualizer" className="flex-grow relative overflow-hidden bg-black border-cyan-900">
                    <div className="absolute top-4 left-4 z-10 flex gap-4">
                        <div className="flex items-center gap-2 text-cyan-400">
                            <Globe size={16} />
                            <span className="text-xs font-mono">NODES: {nodes.length}</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-400">
                            <Activity size={16} />
                            <span className="text-xs font-mono">NETWORK_LOAD: {Math.floor(nodes.reduce((acc, n) => acc + n.activityLevel, 0) / nodes.length)}%</span>
                        </div>
                    </div>
                    <canvas 
                        ref={canvasRef} 
                        width={800} 
                        height={600} 
                        className="w-full h-full cursor-crosshair"
                        onClick={handleNodeClick}
                    />
                </Card>
                
                {/* Real-time Flow Chart */}
                <Card className="h-48 bg-gray-900/50">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-gray-400 uppercase">Global Liquidity Velocity</h4>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={Array.from({length: 20}, (_, i) => ({ time: i, value: 50 + Math.random() * 50 }))}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                            <Area type="monotone" dataKey="value" stroke="#00ff00" fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Sidebar Intel */}
            <div className="flex flex-col gap-4 overflow-y-auto">
                {/* AI Command */}
                <Card title="Sovereign AI Directives" className="border-l-4 border-purple-500 bg-gray-900">
                    <div className="flex items-start gap-3 mb-4">
                        <Cpu className="text-purple-400 mt-1" size={24} />
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Current Strategy</p>
                            <p className="text-sm text-white font-medium">Autonomous Balancing</p>
                        </div>
                    </div>
                    <div className="p-3 bg-black/40 rounded border border-purple-500/30">
                        <p className="text-xs text-purple-200 font-mono leading-relaxed">
                            {aiAnalysis}
                        </p>
                    </div>
                </Card>

                {/* Selected Node Details */}
                {selectedNode ? (
                    <Card title="Entity Inspector" className="border-l-4 border-cyan-500 animate-fadeIn">
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500">Entity ID</label>
                                <div className="text-lg font-bold text-white">{selectedNode.label}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Type</label>
                                <div className="uppercase text-sm text-cyan-300">{selectedNode.type}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Connectivity</label>
                                <div className="w-full bg-gray-700 h-2 rounded-full mt-1">
                                    <div className="bg-cyan-500 h-2 rounded-full" style={{width: `${(selectedNode.connections.length / 5) * 100}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Risk Score</label>
                                <div className="text-2xl font-mono text-red-400">{(100 - selectedNode.activityLevel).toFixed(1)}</div>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="p-6 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 text-sm">
                        Select a node to inspect
                    </div>
                )}

                {/* Anomaly Feed */}
                <Card title="Anomaly Detection Feed" className="flex-grow overflow-hidden flex flex-col">
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {anomalies.map(anomaly => (
                            <div key={anomaly.id} className={`p-3 rounded border-l-2 ${anomaly.severity === 'critical' ? 'bg-red-900/20 border-red-500' : 'bg-yellow-900/20 border-yellow-500'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-gray-400">{new Date(anomaly.timestamp).toLocaleTimeString()}</span>
                                    <ShieldAlert size={12} className={anomaly.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'} />
                                </div>
                                <p className="text-xs text-gray-200">{anomaly.description}</p>
                            </div>
                        ))}
                        {anomalies.length === 0 && <div className="text-center text-xs text-gray-500 mt-10">System Nominal. No anomalies.</div>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default GEIN_DashboardView;
