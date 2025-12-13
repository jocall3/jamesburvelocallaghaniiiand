```typescript
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DollarSign, Zap, Target, BarChart2, TrendingUp, Briefcase, Cpu, Layers, Plus, X, ArrowRight, Bot, ChevronsRight, FileText, Filter, Settings, ShieldCheck, Heart } from 'lucide-react';

// A. The James Burvel O'Callaghan III Code - PhilanthropyHub: A Hyper-Structured, Procedural Philanthropy System

// A1. Core Types & Interfaces (JBO'C III Naming Standard)

interface A1a_ImpactMetric { A1a1_id: number; A1a2_name: string; A1a3_value: number; A1a4_unit: string; A1a5_change: number; A1a6_geinContribution: number; }
interface A1b_Grant { A1b1_id: string; A1b2_recipient: string; A1b3_amount: number; A1b4_status: 'Pending' | 'Approved' | 'Deployed' | 'Reporting' | 'Synergized'; A1b5_date: string; A1b6_predictedSROI: number; A1b7_aiConfidence: number; A1b8_geinImpactVector: number[]; A1b9_synergisticPartners: string[]; A1ba_riskProfile: { A1ba1_execution: number; A1ba2_market: number; A1ba3_systemic: number; }; }
interface A1c_DAFSummary { A1c1_id: string; A1c2_fundName: string; A1c3_balance: number; A1c4_grantsIssued: number; A1c5_sroiEstimate: number; A1c6_grants: A1b_Grant[]; A1c7_focusArea: string; A1c8_geinAlignmentScore: number; A1c9_networkedImpact: number; }
interface A1d_AlgorithmicStreamEntry { A1d1_id: number; A1d2_timestamp: string; A1d3_action: 'SCAN' | 'IDENTIFY' | 'ALLOCATE' | 'MONITOR' | 'SYNERGIZE' | 'REBALANCE'; A1d4_details: string; A1d5_status: 'SUCCESS' | 'PENDING' | 'FLAGGED' | 'OPTIMIZED'; }
interface A1e_ImpactFuture { A1e1_id: string; A1e2_projectName: string; A1e3_category: string; A1e4_sroiTarget: number; A1e5_currentPrice: number; A1e6_volume: number; A1e7_change24h: number; A1e8_linkedAssets: string[]; A1e9_volatilityIndex: number; }
interface A1f_GeinNode { A1f1_id: string; A1f2_label: string; A1f3_type: 'Grant' | 'Organization' | 'Research' | 'DAF'; A1f4_impactScore: number; A1f5_x: number; A1f6_y: number; }
interface A1g_GeinEdge { A1g1_source: string; A1g2_target: string; A1g3_strength: number; A1g4_type: 'Funding' | 'Synergy' | 'Dataflow'; }

// A2. Mock Data (The James Burvel O'Callaghan III Standardized Mock Data)

const A2a_mockMetrics: A1a_ImpactMetric[] = [{ A1a1_id: 1, A1a2_name: 'Total Capital Deployed', A1a3_value: 12500000, A1a4_unit: '$', A1a5_change: 14.5, A1a6_geinContribution: 0.23 }, { A1a1_id: 2, A1a2_name: 'Lives Directly Impacted', A1a3_value: 345000, A1a4_unit: '', A1a5_change: 8.2, A1a6_geinContribution: 0.15 }, { A1a1_id: 3, A1a2_name: 'Real-time Blended SROI', A1a3_value: 4.1, A1a4_unit: 'x', A1a5_change: 1.5, A1a6_geinContribution: 0.45 }, { A1a1_id: 4, A1a2_name: 'GEIN Synergy Index', A1a3_value: 89.2, A1a4_unit: '%', A1a5_change: 22.7, A1a6_geinContribution: 1.0 }];
const A2b_mockDAFs: A1c_DAFSummary[] = [{ A1c1_id: 'daf-edu-001', A1c2_fundName: 'Future Education Initiative', A1c3_balance: 500000, A1c4_grantsIssued: 150000, A1c5_sroiEstimate: 4.1, A1c7_focusArea: 'STEM Education', A1c8_geinAlignmentScore: 92, A1c9_networkedImpact: 1.8e6, A1c6_grants: [{ A1b1_id: 'g-001', A1b2_recipient: 'Quantum Leap Learning', A1b3_amount: 75000, A1b4_status: 'Synergized', A1b5_date: '2023-11-15', A1b6_predictedSROI: 4.5, A1b7_aiConfidence: 0.98, A1b8_geinImpactVector: [0.8, 0.2, 0.5], A1b9_synergisticPartners: ['g-002', 'g-003'], A1ba_riskProfile: { A1ba1_execution: 0.1, A1ba2_market: 0.05, A1ba3_systemic: 0.2 } }, { A1b1_id: 'g-002', A1b2_recipient: 'CodeCrafters Youth', A1b3_amount: 50000, A1b4_status: 'Reporting', A1b5_date: '2024-01-20', A1b6_predictedSROI: 4.2, A1b7_aiConfidence: 0.95, A1b8_geinImpactVector: [0.7, 0.3, 0.4], A1b9_synergisticPartners: ['g-001'], A1ba_riskProfile: { A1ba1_execution: 0.15, A1ba2_market: 0.1, A1ba3_systemic: 0.2 } }] }, { A1c1_id: 'daf-hlth-001', A1c2_fundName: 'Global Health Fund 2024', A1c3_balance: 1200000, A1c4_grantsIssued: 350000, A1c5_sroiEstimate: 3.2, A1c7_focusArea: 'Vaccine Research', A1c8_geinAlignmentScore: 85, A1c9_networkedImpact: 4.5e6, A1c6_grants: [{ A1b1_id: 'g-003', A1b2_recipient: 'BioSynth Labs', A1b3_amount: 200000, A1b4_status: 'Deployed', A1b5_date: '2024-02-01', A1b6_predictedSROI: 3.8, A1b7_aiConfidence: 0.91, A1b8_geinImpactVector: [0.2, 0.9, 0.6], A1b9_synergisticPartners: ['g-001', 'g-004'], A1ba_riskProfile: { A1ba1_execution: 0.2, A1ba2_market: 0.25, A1ba3_systemic: 0.4 } }] }, { A1c1_id: 'daf-infra-001', A1c2_fundName: 'Sustainable Infrastructure Trust', A1c3_balance: 80000, A1c4_grantsIssued: 12000, A1c5_sroiEstimate: 5.5, A1c7_focusArea: 'Renewable Energy', A1c8_geinAlignmentScore: 78, A1c9_networkedImpact: 0.5e6, A1c6_grants: [] }, { A1c1_id: 'daf-res-001', A1c2_fundName: 'Community Resilience Fund', A1c3_balance: 210000, A1c4_grantsIssued: 75000, A1c5_sroiEstimate: 2.8, A1c7_focusArea: 'Disaster Relief', A1c8_geinAlignmentScore: 65, A1c9_networkedImpact: 0.8e6, A1c6_grants: [] }];
const A2c_mockImpactFutures: A1e_ImpactFuture[] = [{ A1e1_id: 'if-001', A1e2_projectName: 'Project Amazon Regen', A1e3_category: 'Environment', A1e4_sroiTarget: 8.0, A1e5_currentPrice: 112.50, A1e6_volume: 1.2e6, A1e7_change24h: 2.5, A1e8_linkedAssets: ['g-005', 'g-006'], A1e9_volatilityIndex: 0.3 }, { A1e1_id: 'if-002', A1e2_projectName: 'African Water Grid', A1e3_category: 'Infrastructure', A1e4_sroiTarget: 12.0, A1e5_currentPrice: 245.75, A1e6_volume: 3.5e6, A1e7_change24h: -1.2, A1e8_linkedAssets: ['g-007'], A1e9_volatilityIndex: 0.6 }, { A1e1_id: 'if-003', A1e2_projectName: 'AI Literacy for All', A1e3_category: 'Education', A1e4_sroiTarget: 6.5, A1e5_currentPrice: 88.20, A1e6_volume: 850000, A1e7_change24h: 5.8, A1e8_linkedAssets: ['g-001', 'g-002'], A1e9_volatilityIndex: 0.2 }, { A1e1_id: 'if-004', A1e2_projectName: 'Longevity Gene Therapy', A1e3_category: 'Health', A1e4_sroiTarget: 15.0, A1e5_currentPrice: 450.00, A1e6_volume: 5.1e6, A1e7_change24h: 10.1, A1e8_linkedAssets: ['g-003'], A1e9_volatilityIndex: 0.8 }];
const A2d_mockGeinData: { A2d1_nodes: A1f_GeinNode[]; A2d2_edges: A1g_GeinEdge[] } = { A2d1_nodes: [{ A1f1_id: 'daf-edu-001', A1f2_label: 'Future Education Initiative', A1f3_type: 'DAF', A1f4_impactScore: 92, A1f5_x: 100, A1f6_y: 200 }, { A1f1_id: 'daf-hlth-001', A1f2_label: 'Global Health Fund', A1f3_type: 'DAF', A1f4_impactScore: 85, A1f5_x: 100, A1f6_y: 400 }, { A1f1_id: 'g-001', A1f2_label: 'Quantum Leap', A1f3_type: 'Grant', A1f4_impactScore: 88, A1f5_x: 300, A1f6_y: 150 }, { A1f1_id: 'g-002', A1f2_label: 'CodeCrafters', A1f3_type: 'Grant', A1f4_impactScore: 85, A1f5_x: 300, A1f6_y: 250 }, { A1f1_id: 'g-003', A1f2_label: 'BioSynth Labs', A1f3_type: 'Grant', A1f4_impactScore: 91, A1f5_x: 300, A1f6_y: 400 }, { A1f1_id: 'org-mit', A1f2_label: 'MIT Media Lab', A1f3_type: 'Research', A1f4_impactScore: 95, A1f5_x: 500, A1f6_y: 200 }, { A1f1_id: 'org-who', A1f2_label: 'World Health Org', A1f3_type: 'Organization', A1f4_impactScore: 93, A1f5_x: 500, A1f6_y: 400 }], A2d2_edges: [{ A1g1_source: 'daf-edu-001', A1g2_target: 'g-001', A1g3_strength: 0.9, A1g4_type: 'Funding' }, { A1g1_source: 'daf-edu-001', A1g2_target: 'g-002', A1g3_strength: 0.8, A1g4_type: 'Funding' }, { A1g1_source: 'daf-hlth-001', A1g2_target: 'g-003', A1g3_strength: 0.9, A1g4_type: 'Funding' }, { A1g1_source: 'g-001', A1g2_target: 'g-002', A1g3_strength: 0.7, A1g4_type: 'Synergy' }, { A1g1_source: 'g-001', A1g2_target: 'org-mit', A1g3_strength: 0.8, A1g4_type: 'Dataflow' }, { A1g1_source: 'g-002', A1g2_target: 'org-mit', A1g3_strength: 0.6, A1g4_type: 'Dataflow' }, { A1g1_source: 'g-003', A1g2_target: 'org-who', A1g3_strength: 0.9, A1g4_type: 'Dataflow' }, { A1g1_source: 'g-001', A1g2_target: 'g-003', A1g3_strength: 0.4, A1g4_type: 'Synergy' }] };

// A3. Helper Components (JBO'C III Modular UI System)

const A3a_StatCard: React.FC<{ A3a1_icon: React.ElementType; A3a2_name: string; A3a3_value: number; A3a4_unit: string; A3a5_change: number; }> = ({ A3a1_icon: A3a1a_Icon, A3a2_name, A3a3_value, A3a4_unit, A3a5_change }) => { const A3a6_isPositive = A3a5_change >= 0; return (
    <div className="bg-gray-800/50 p-5 rounded-xl shadow-lg border border-indigo-500/30 backdrop-blur-sm transition duration-300 hover:bg-gray-800/80 hover:border-indigo-400">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{A3a2_name}</h3>
        <A3a1a_Icon className="h-6 w-6 text-indigo-400" />
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-4xl font-extrabold text-white">
          {A3a4_unit === '$' && '$'}{A3a3_value.toLocaleString(undefined, { maximumFractionDigits: (A3a4_unit === 'x' || A3a4_unit === '%') ? 1 : 0 })}{A3a4_unit !== '$' && A3a4_unit}
        </p>
        <div className={`text-sm font-medium flex items-center ${A3a6_isPositive ? 'text-green-400' : 'text-red-400'}`}>
          <TrendingUp className={`w-4 h-4 mr-1 transform ${A3a6_isPositive ? '' : 'rotate-180'}`} />
          {A3a5_change > 0 ? '+' : ''}{A3a5_change.toFixed(1)}%
        </div>
      </div>
    </div>
  ); };

const A3b_Modal: React.FC<{ A3b1_isOpen: boolean; A3b2_onClose: () => void; A3b3_title: string; A3b4_children: React.ReactNode }> = ({ A3b1_isOpen, A3b2_onClose, A3b3_title, A3b4_children }) => { if (!A3b1_isOpen) return null; return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-indigo-500/50 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{A3b3_title}</h2>
          <button onClick={A3b2_onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6">{A3b4_children}</div>
      </div>
    </div>
  ); };

const A3c_CreateDAFForm: React.FC<{ A3c1_onSave: (data: any) => void; A3c2_onClose: () => void }> = ({ A3c1_onSave, A3c2_onClose }) => { const A3c3_handleSubmit = (e: React.FormEvent) => { e.preventDefault(); A3c1_onSave({ A3c3a_fundName: 'New Vision Fund', A3c3b_initialDeposit: 100000, A3c3c_focusArea: 'AI Safety' }); A3c2_onClose(); }; return (
    <form onSubmit={A3c3_handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="A3c4_fundName" className="block text-sm font-medium text-gray-300">Fund Name</label>
        <input type="text" id="A3c4_fundName" className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Quantum Futures Initiative" />
      </div>
      <div>
        <label htmlFor="A3c5_initialDeposit" className="block text-sm font-medium text-gray-300">Initial Contribution</label>
        <input type="number" id="A3c5_initialDeposit" className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="100000" />
      </div>
      <div>
        <label htmlFor="A3c6_focusArea" className="block text-sm font-medium text-gray-300">Primary Focus Area</label>
        <input type="text" id="A3c6_focusArea" className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Decentralized Science" />
      </div>
      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={A3c2_onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 transition">Establish Fund</button>
      </div>
    </form>
  ); };

const A3d_GrantProposalForm: React.FC<{ A3d1_daf: A1c_DAFSummary; A3d2_onSave: (data: any) => void; A3d3_onClose: () => void }> = ({ A3d1_daf, A3d2_onSave, A3d3_onClose }) => { return (
    <form onSubmit={(e) => { e.preventDefault(); A3d2_onSave({}); A3d3_onClose(); }} className="space-y-6">
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <p className="text-sm text-gray-400">Proposing grant from:</p>
        <p className="font-bold text-indigo-400">{A3d1_daf.A1c2_fundName}</p>
      </div>
      <div>
        <label htmlFor="A3d4_recipient" className="block text-sm font-medium text-gray-300">Recipient Organization</label>
        <input type="text" id="A3d4_recipient" className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white" />
      </div>
      <div>
        <label htmlFor="A3d5_amount" className="block text-sm font-medium text-gray-300">Grant Amount</label>
        <input type="number" id="A3d5_amount" className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white" />
      </div>
      <div>
        <label htmlFor="A3d6_proposal" className="block text-sm font-medium text-gray-300">Proposal Summary (AI-Assisted)</label>
        <textarea id="A3d6_proposal" rows={4} className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white" placeholder="Describe the project's objectives and expected impact..."></textarea>
      </div>
      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={A3d3_onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 transition">Submit for AI Underwriting</button>
      </div>
    </form>
  ); };

const A3e_DAFDetailView: React.FC<{ A3e1_daf: A1c_DAFSummary; A3e2_onBack: () => void; A3e3_onProposeGrant: () => void; }> = ({ A3e1_daf, A3e2_onBack, A3e3_onProposeGrant }) => (
    <div className="bg-gray-900/80 p-6 rounded-xl shadow-2xl border border-indigo-500/30 backdrop-blur-xl">
      <button onClick={A3e2_onBack} className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 flex items-center">&larr; Back to All Funds</button>
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h2 className="text-2xl font-bold text-white">{A3e1_daf.A1c2_fundName}</h2>
        <p className="text-gray-400">Focus: <span className="font-semibold text-indigo-400">{A3e1_daf.A1c7_focusArea}</span></p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Current Balance</p><p className="text-2xl font-bold text-white">${A3e1_daf.A1c3_balance.toLocaleString()}</p></div>
        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Grants YTD</p><p className="text-2xl font-bold text-white">${A3e1_daf.A1c4_grantsIssued.toLocaleString()}</p></div>
        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Blended SROI</p><p className="text-2xl font-bold text-green-400">{A3e1_daf.A1c5_sroiEstimate.toFixed(2)}x</p></div>
        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">GEIN Alignment</p><p className="text-2xl font-bold text-indigo-400">{A3e1_daf.A1c8_geinAlignmentScore}%</p></div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-3">Grant History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-400 uppercase">Recipient</th>
              <th className="py-2 px-4 text-right text-xs font-semibold text-gray-400 uppercase">Amount</th>
              <th className="py-2 px-4 text-center text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="py-2 px-4 text-right text-xs font-semibold text-gray-400 uppercase">AI SROI Projection</th>
              <th className="py-2 px-4 text-center text-xs font-semibold text-gray-400 uppercase">Synergies</th>
            </tr>
          </thead>
          <tbody>
            {A3e1_daf.A1c6_grants.map(A3e1a_grant => (
              <tr key={A3e1a_grant.A1b1_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-3 px-4 text-sm text-indigo-400">{A3e1a_grant.A1b2_recipient}</td>
                <td className="py-3 px-4 text-sm text-gray-200 text-right">${A3e1a_grant.A1b3_amount.toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-center"><span className={`px-2 py-1 text-xs rounded-full ${A3e1a_grant.A1b4_status === 'Reporting' ? 'bg-green-500/20 text-green-300' : A3e1a_grant.A1b4_status === 'Synergized' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'}`}>{A3e1a_grant.A1b4_status}</span></td>
                <td className="py-3 px-4 text-sm font-mono text-green-400 text-right">{A3e1a_grant.A1b6_predictedSROI.toFixed(2)}x ({A3e1a_grant.A1b7_aiConfidence * 100}%)</td>
                <td className="py-3 px-4 text-sm text-center text-gray-400">{A3e1a_grant.A1b9_synergisticPartners.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 text-right">
        <button onClick={A3e3_onProposeGrant} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 transition">Propose New Grant</button>
      </div>
    </div>
  );

const A3f_AlgorithmicGrantingEngine: React.FC = () => {
    const [A3f1_stream, setA3f1_stream] = useState<A1d_AlgorithmicStreamEntry[]>([]);
    const [A3f2_isActive, setA3f2_isActive] = useState(true);
    useEffect(() => { if (!A3f2_isActive) return; const A3f3_actions: A1d_AlgorithmicStreamEntry['A1d3_action'][] = ['SCAN', 'IDENTIFY', 'ALLOCATE', 'MONITOR', 'SYNERGIZE', 'REBALANCE']; const A3f4_details = ['Scanning 1.2M data points for high-impact vectors.', 'Identified novel protein folding approach with 12.5x SROI potential.', 'Allocating $25,000 micro-grant to BioFuture Labs.', 'Monitoring real-time progress via decentralized oracle network.', 'Flagged grant G-08B for underperformance vs. model.', 'SYNERGIZE: Linking G-001 (AI Literacy) with G-003 (BioSynth) for data analysis.', 'REBALANCE: Shifting 2% of capital from Infrastructure to Health based on GEIN forecast.', 'OPTIMIZED: Network SROI increased by 0.2% post-rebalance.',]; const A3f5_interval = setInterval(() => { const A3f6_newEntry: A1d_AlgorithmicStreamEntry = { A1d1_id: Date.now(), A1d2_timestamp: new Date().toISOString(), A1d3_action: A3f3_actions[Math.floor(Math.random() * A3f3_actions.length)], A1d4_details: A3f4_details[Math.floor(Math.random() * A3f4_details.length)], A1d5_status: Math.random() > 0.1 ? (Math.random() > 0.5 ? 'SUCCESS' : 'OPTIMIZED') : 'FLAGGED', }; setA3f1_stream(A3f7_prev => [A3f6_newEntry, ...A3f7_prev.slice(0, 100)]); }, 1500); return () => clearInterval(A3f5_interval); }, [A3f2_isActive]); const A3f8_getStatusColor = (A3f9_status: A1d_AlgorithmicStreamEntry['A1d5_status']) => { if (A3f9_status === 'SUCCESS') return 'text-green-400'; if (A3f9_status === 'FLAGGED') return 'text-yellow-400'; if (A3f9_status === 'OPTIMIZED') return 'text-indigo-400'; return 'text-gray-400'; }; return (
        <div className="bg-gray-900/80 p-6 rounded-xl shadow-2xl border border-indigo-500/30 backdrop-blur-xl h-[700px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center"><Cpu className="w-6 h-6 mr-3 text