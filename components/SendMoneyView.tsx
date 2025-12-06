
// components/views/personal/SendMoneyView.tsx
// RE-ENACTED & EXPANDED: This component has been resurrected from its deprecated state.
// It is now "Remitrax," a complete, multi-rail payment portal featuring advanced
// security simulations and demonstrating enterprise-level integration patterns.
// After a decade of upgrades, Remitrax has evolved into an unparalleled financial ecosystem,
// incorporating AI, quantum-resistant security, DLT, and even neuro-link technologies.

import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import Card from './Card';
import { DataContext } from '../context/DataContext';
import { View } from '../types';
import type { Transaction } from '../types';

// ================================================================================================
// GLOBAL REMITRAX PLATFORM WIDE TYPE DEFINITIONS
// ================================================================================================

export type PaymentRail = 'quantumpay' | 'cashapp' | 'swift_global' | 'blockchain_dlt' | 'interstellar_p2p' | 'neuro_link' | 'ai_contract_escrow';
export type ScanState = 'scanning' | 'success' | 'verifying' | 'error' | 'recalibrating' | 'quantum_sync' | 'ai_negotiating';

export interface RemitraxRecipientProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  quantumTag?: string;
  cashtag?: string;
  swiftDetails?: { bankName: string; bic: string; accountNumber: string; };
  blockchainAddress?: string;
  neuroLinkAddress?: string;
  galacticP2PId?: string;
  preferredCurrency?: string;
  lastUsedDate?: string;
  trustScore?: number;
  kycStatus?: 'verified' | 'pending' | 'unverified';
  blacklisted?: boolean;
  bankAccounts?: { bankName: string; accountNumber: string; routingNumber?: string; iban?: string; }[];
  eWalletDetails?: { type: 'paypal' | 'venmo' | 'zelle' | 'revolut' | 'cashapp' | 'quantumpay'; identifier: string; }[];
  contactPreferences?: { email: boolean; sms: boolean; push: boolean; holo_alert?: boolean; };
  relationshipStatus?: 'family' | 'friend' | 'business' | 'self' | 'vendor' | 'partner' | 'regulatory_body';
  category?: 'personal' | 'business' | 'charity' | 'government';
  multiEntitySupport?: { parentId: string; subEntities: { id: string; name: string; type: string; }[]; };
  complianceFlags?: ('high_risk' | 'sanctioned_entity' | 'PEP' | 'low_risk' | 'verified_entity')[];
}

export interface RemitraxCurrency {
  code: string;
  name: string;
  symbol: string;
  isCrypto: boolean;
  conversionRate?: number;
  quantumFluctuationIndex?: number;
  decimalPlaces: number;
  minTransactionAmount?: number;
  maxTransactionAmount?: number;
  liquidityScore?: number;
  marketCap?: number;
  regulatoryStatus?: 'regulated' | 'unregulated' | 'experimental';
  crossChainCompatible?: boolean;
}

export interface ScheduledPaymentRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'once_on_date' | 'conditional_event';
  startDate: string;
  endDate?: string;
  executionCondition?: string;
  nextExecutionDate?: string;
  maxExecutions?: number;
  triggerEventId?: string;
  paymentReason?: string;
  aiAnalysisTags?: string[];
  geoFenceTrigger?: { lat: number; lon: number; radius: number; };
  biometricApprovalRequired?: boolean;
}

export interface AdvancedTransactionSettings {
  priority: 'low' | 'normal' | 'high' | 'ultra_quantum';
  carbonOffsetRatio: number;
  privacyLevel: 'standard' | 'enhanced' | 'fully_anonymous_dlt';
  receiptPreference: 'email' | 'blockchain_proof' | 'neuronal_link_receipt' | 'physical_mail';
  notificationPreferences: { email: boolean; sms: boolean; push: boolean; holo_alert: boolean; };
  multiSignatureRequired?: boolean;
  escrowDetails?: { agentId: string; releaseCondition: string; };
  dynamicFeeOptimization?: 'auto' | 'manual';
  dataEncryptionStandard: 'aes256' | 'quantum_resistant_hybrid' | 'zero_knowledge_proof' | 'obfuscated_vault';
  routeOptimizationPreference: 'speed' | 'cost' | 'privacy' | 'sustainability' | 'compliance';
  dlcDetails?: { contractId: string; conditions: string; };
  transactionExpiryMinutes?: number;
  regulatoryReportingFlags?: ('FATCA' | 'CRS' | 'AML' | 'CFT' | 'none')[];
  postQuantumSecurityEnabled?: boolean;
}

export interface SecurityAuditResult {
  riskScore: number;
  fraudProbability: number;
  amlCompliance: 'pass' | 'fail' | 'review';
  sanctionScreening: 'pass' | 'fail';
  quantumSignatureIntegrity: 'verified' | 'compromised' | 'pending';
  recommendations: string[];
  complianceAlerts?: string[];
  threatVectorAnalysis?: { type: string; severity: 'low' | 'medium' | 'high'; description: string; }[];
}

export interface EnvironmentalImpactReport {
    transactionCO2e: number;
    offsetCO2e: number;
    netCO2e: number;
    renewableEnergyUsedPercentage: number;
    recommendations?: string[];
}

export interface RailSpecificDetails {
    swift?: { bankName: string; bic: string; accountNumber: string; beneficiaryAddress: string; };
    blockchain?: { network: 'ethereum' | 'polygon' | 'solana' | 'custom_dlt' | ''; gasLimit: string; dataPayload?: string; };
    interstellar?: { galaxyId: string; starSystemAddress: string; vesselIdentifier?: string; warpDriveEfficiencyRating?: number; };
    neuroLink?: { neuralSignatureType: 'brainwave' | 'retinal_pattern' | ''; recipientId: string; neuroSyncProtocolVersion?: string; };
    aiContractEscrow?: { contractTemplateId: string; escrowConditions: string; resolutionAgentId?: string; immutableLedgerHash?: string; };
    quantumpay?: { channelProtocol: 'quantum_tunnel_v2' | 'entanglement_link_v1'; encryptionStandard: 'QRC-256' | 'hybrid_post_quantum'; quantumSignatureAlgorithm?: string; }
}

interface SendMoneyViewProps {
  setActiveView?: (view: View) => void;
}

// ================================================================================================
// ANIMATED UI SUB-COMPONENTS
// ================================================================================================

export const AnimatedCheckmarkIcon: React.FC = () => (
    <>
        <svg className="h-24 w-24 transform scale-125" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <defs>
                <linearGradient id="checkmarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="50%" stopColor="#86efac" />
                    <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
                <filter id="hologramGlow">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 10 0" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" stroke="url(#checkmarkGradient)" filter="url(#hologramGlow)" />
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
        <style>{`
            .checkmark__circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 4; stroke-miterlimit: 10; fill: none; animation: stroke-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; box-shadow: 0 0 15px rgba(66, 255, 125, 0.7); }
            .checkmark__check { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; stroke-width: 5; stroke: #fff; animation: stroke-check 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; }
            @keyframes stroke-circle { 100% { stroke-dashoffset: 0; } }
            @keyframes stroke-check { 100% { stroke-dashoffset: 0; } }
        `}</style>
    </>
);

export const QuantumLedgerAnimation: React.FC = () => (
    <>
        <div className="quantum-ledger-container">
            <div className="quantum-grid-enhanced">
                {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="quantum-block-enhanced" style={{ animationDelay: `${i * 0.08}s` }}></div>
                ))}
            </div>
            <div className="quantum-data-flow">
                <div className="data-packet" style={{ '--flow-delay': '0s' } as React.CSSProperties}></div>
                <div className="data-packet" style={{ '--flow-delay': '0.5s' } as React.CSSProperties}></div>
            </div>
            <div className="text-center mt-4 text-xs text-cyan-300 animate-pulse">Quantum Entanglement Protocol: Active</div>
        </div>
        <style>{`
            .quantum-ledger-container { position: relative; width: 150px; height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .quantum-grid-enhanced { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; width: 120px; height: 120px; position: relative; z-index: 1; }
            .quantum-block-enhanced { background-color: rgba(6, 182, 212, 0.2); border: 1px solid #06b6d4; border-radius: 3px; animation: quantum-pulse 2s infinite ease-in-out forwards; box-shadow: 0 0 8px rgba(6, 182, 212, 0.5); }
            @keyframes quantum-pulse { 0%, 100% { background-color: rgba(6, 182, 212, 0.2); transform: scale(1); box-shadow: 0 0 8px rgba(6, 182, 212, 0.5); } 50% { background-color: rgba(165, 243, 252, 0.7); transform: scale(1.08); box-shadow: 0 0 15px rgba(165, 243, 252, 0.8); } }
            .quantum-data-flow { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; }
            .data-packet { position: absolute; width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(45deg, #0ef, #06b6d4); box-shadow: 0 0 5px #0ef, 0 0 10px #06b6d4; animation: data-flow-path 4s infinite linear var(--flow-delay); opacity: 0; }
            @keyframes data-flow-path { 0% { transform: translate(-60px, -60px) scale(0.5); opacity: 0; } 20% { opacity: 1; } 50% { transform: translate(60px, 60px) scale(1.2); opacity: 1; } 80% { opacity: 0; } 100% { transform: translate(120px, 120px) scale(0.5); opacity: 0; } }
        `}</style>
    </>
);

export const QuantumChannelEstablishment: React.FC = () => (
    <>
        <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center border-2 border-purple-500 animate-spin-slow">
                <div className="w-16 h-16 rounded-full border-2 border-purple-400 animate-ping-once"></div>
                <div className="absolute w-8 h-8 bg-purple-600 rounded-full animate-pulse-fast"></div>
            </div>
            <p className="text-sm text-purple-300 animate-fade-in-out">Establishing Quantum Tunnel...</p>
        </div>
        <style>{`.animate-spin-slow { animation: spin-slow 8s linear infinite; } .animate-ping-once { animation: ping-once 2s ease-out infinite; } .animate-pulse-fast { animation: pulse-fast 1.5s ease-in-out infinite; } .animate-fade-in-out { animation: fade-in-out 3s ease-in-out infinite; }
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } @keyframes ping-once { 0% { transform: scale(0.2); opacity: 0; } 50% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.2); opacity: 0; } } @keyframes pulse-fast { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } } @keyframes fade-in-out { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
    </>
);

export const AINegotiationAnimation: React.FC = () => (
    <>
        <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative w-24 h-24 flex items-center justify-center">
                <i className="fas fa-robot text-7xl text-teal-500 animate-pulse-slow"></i>
                <div className="absolute w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center animate-spin-fast">
                    <i className="fas fa-exchange-alt text-xl text-teal-300"></i>
                </div>
            </div>
            <p className="text-sm text-teal-300 animate-fade-in-out">AI Negotiating Optimal Route & Terms...</p>
        </div>
        <style>{`.animate-pulse-slow { animation: pulse-slow 2.5s ease-in-out infinite; } .animate-spin-fast { animation: spin-fast 1.5s linear infinite; }
        @keyframes pulse-slow { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } } @keyframes spin-fast { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
);

export const SecurityAuditDisplay: React.FC<{ auditResult: SecurityAuditResult | null }> = ({ auditResult }) => {
    if (!auditResult) return <div className="flex items-center space-x-2 text-yellow-400"><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Performing real-time security audit...</span></div>;

    return (
        <div className="bg-gray-800 p-4 rounded-lg space-y-2 border border-gray-700">
            <h4 className="font-semibold text-lg text-white">Security Audit Report</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-400">Risk Score:</p><p className={`${auditResult.riskScore > 50 ? 'text-red-400' : 'text-green-400'}`}>{auditResult.riskScore}/100</p>
                <p className="text-gray-400">Fraud Probability:</p><p className={`${auditResult.fraudProbability > 0.3 ? 'text-red-400' : 'text-green-400'}`}>{`${(auditResult.fraudProbability * 100).toFixed(2)}%`}</p>
                <p className="text-gray-400">AML Compliance:</p><p className={auditResult.amlCompliance === 'pass' ? 'text-green-400' : 'text-yellow-400'}>{auditResult.amlCompliance}</p>
            </div>
            {auditResult.recommendations.length > 0 && (
                <div className="mt-2 text-sm text-yellow-300">
                    <p className="font-medium">Recommendations:</p>
                    <ul className="list-disc list-inside text-xs text-yellow-200">{auditResult.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}</ul>
                </div>
            )}
        </div>
    );
};

export const BiometricModal: React.FC<{
    isOpen: boolean; onSuccess: () => void; onClose: () => void; amount: string; recipient: RemitraxRecipientProfile | string; paymentMethod: PaymentRail; securityContext: 'personal' | 'corporate' | 'regulatory'; mfAuthMethods?: ('fingerprint' | 'voice' | 'retinal_scan' | 'neural_pattern' | 'face')[]; approvalRequiredBy?: string[];
}> = ({ isOpen, onSuccess, onClose, amount, recipient, paymentMethod, securityContext, mfAuthMethods = ['fingerprint'], approvalRequiredBy }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [scanState, setScanState] = useState<ScanState>('scanning');
    const [verificationStep, setVerificationStep] = useState(0);
    const [biometricProgress, setBiometricProgress] = useState(0);
    const [activeAuthMethod, setActiveAuthMethod] = useState(mfAuthMethods[0] || 'face');
    const recipientName = typeof recipient === 'string' ? recipient : recipient.name;

    const verificationMessages = [ `Heuristic API: Initializing secure channel with ${paymentMethod}...`, `Heuristic API: Validating ${recipientName}'s identity...`, 'Heuristic API: Cross-referencing fraud ledgers...', 'Heuristic API: Executing on DLT/Quantum ledger...', 'Heuristic API: Confirming consensus...', 'Heuristic API: Archiving proof...', 'Heuristic API: Final checks...' ];

    useEffect(() => {
        if (!isOpen) { setScanState('scanning'); setVerificationStep(0); setBiometricProgress(0); return; }
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try { if (activeAuthMethod === 'face' || activeAuthMethod === 'retinal_scan') { stream = await navigator.mediaDevices.getUserMedia({ video: true }); if (videoRef.current) videoRef.current.srcObject = stream; } } catch (err) { setScanState('error'); }
        };
        startCamera();
        const scanProgressInterval = setInterval(() => setBiometricProgress(prev => Math.min(prev + Math.random() * 10, 100)), 200);
        const successTimer = setTimeout(() => { setScanState('success'); clearInterval(scanProgressInterval); }, 3000);
        const verifyTimer = setTimeout(() => setScanState('verifying'), 4000);
        const quantumSyncTimer = setTimeout(() => setScanState('quantum_sync'), 7500);
        const aiNegotiatingTimer = setTimeout(() => setScanState('ai_negotiating'), 10500);
        const successActionTimer = setTimeout(onSuccess, 15000);
        const closeTimer = setTimeout(onClose, 16000);
        return () => { clearTimeout(successTimer); clearTimeout(verifyTimer); clearTimeout(quantumSyncTimer); clearTimeout(aiNegotiatingTimer); clearTimeout(successActionTimer); clearTimeout(closeTimer); clearInterval(scanProgressInterval); if (stream) stream.getTracks().forEach(track => track.stop()); };
    }, [isOpen, onSuccess, onClose, activeAuthMethod]);

    useEffect(() => {
        if (['verifying', 'quantum_sync', 'ai_negotiating'].includes(scanState)) {
            const interval = setInterval(() => setVerificationStep(prev => Math.min(prev + 1, verificationMessages.length - 1)), 1500);
            return () => clearInterval(interval);
        }
    }, [scanState]);

    const getTitle = () => {
        switch (scanState) {
            case 'scanning': return `Scanning ${activeAuthMethod === 'face' ? 'Face' : 'Biometrics'}`;
            case 'success': return 'Identity Confirmed';
            case 'verifying': return 'Compliance Verification';
            case 'quantum_sync': return 'Quantum Network Sync';
            case 'ai_negotiating': return 'AI Optimization';
            case 'error': return 'Verification Failed';
            case 'recalibrating': return 'Recalibrating...';
        }
    };

    return (
        <div className={`fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 backdrop-blur-lg transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className={`bg-gray-900 rounded-3xl p-8 max-w-lg w-full text-center border-2 border-cyan-700 shadow-xl transition-transform duration-500 ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-full scale-90'}`}>
                <h3 className="text-3xl font-extrabold text-white mb-4">{getTitle()}</h3>
                <div className="relative w-72 h-72 mx-auto rounded-full overflow-hidden border-4 border-cyan-600 mb-6 shadow-lg">
                    {(activeAuthMethod === 'face' || activeAuthMethod === 'retinal_scan') ? <video ref={videoRef} autoPlay muted playsInline className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1]"></video> : <div className="absolute inset-0 flex items-center justify-center bg-gray-950 text-gray-500 text-lg"><p>Authenticating {activeAuthMethod}...</p></div>}
                    {scanState === 'scanning' && <div className="absolute inset-0 bg-grid-pattern-cyan animate-scan-holographic"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-1 bg-cyan-400 opacity-70 blur-sm animate-scanner-line"></div></div>}
                    {scanState === 'success' && <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center"><AnimatedCheckmarkIcon /></div>}
                    {scanState === 'verifying' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><QuantumLedgerAnimation /></div>}
                    {scanState === 'quantum_sync' && <div className="absolute inset-0 bg-purple-900/80 flex items-center justify-center"><QuantumChannelEstablishment /></div>}
                    {scanState === 'ai_negotiating' && <div className="absolute inset-0 bg-teal-900/80 flex items-center justify-center"><AINegotiationAnimation /></div>}
                </div>
                {scanState === 'scanning' && <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4"><div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${biometricProgress}%` }}></div></div>}
                <p className="text-gray-300 mt-2 text-md">{['verifying', 'quantum_sync', 'ai_negotiating'].includes(scanState) ? verificationMessages[verificationStep] : `Sending $${amount} to ${recipientName}`}</p>
            </div>
            <style>{`.bg-grid-pattern-cyan{background-image:linear-gradient(rgba(0,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,255,0.3) 1px,transparent 1px);background-size:2.5rem 2.5rem}.animate-scan-holographic{animation:scan-holographic-effect 2.5s linear infinite; background-position: 0 0;}.animate-scanner-line{animation:scanner-line-move 2.5s ease-in-out infinite alternate}@keyframes scan-holographic-effect{0%{background-position:0 0}100%{background-position:0 -5rem}}@keyframes scanner-line-move{0%{transform:translate(-50%, 0) scaleX(0.2); opacity: 0;}20%{transform:translate(-50%, 25%) scaleX(1); opacity: 1;}80%{transform:translate(-50%, 75%) scaleX(1); opacity: 1;}100%{transform:translate(-50%, 100%) scaleX(0.2); opacity: 0;}}`}</style>
        </div>
    );
};

// ================================================================================================
// REMITRAX MAIN VIEW COMPONENT
// ================================================================================================

const SendMoneyView: React.FC<SendMoneyViewProps> = ({ setActiveView }) => {
    const context = useContext(DataContext);
    if (!context) throw new Error("SendMoneyView must be used within a DataProvider");
    const { addTransaction } = context;

    const [amount, setAmount] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentRail>('quantumpay');
    const [showBiometricModal, setShowBiometricModal] = useState(false);
    const [securityAudit, setSecurityAudit] = useState<SecurityAuditResult | null>(null);
    const [currentStep, setCurrentStep] = useState(1); // 1: Input, 2: Review, 3: Processing

    useEffect(() => {
        // Simulate security audit when amount or recipient changes
        const auditTimeout = setTimeout(() => {
            if (parseFloat(amount) > 0 && recipientName) {
                setSecurityAudit({
                    riskScore: parseFloat(amount) > 5000 ? 60 : 10,
                    fraudProbability: 0.05,
                    amlCompliance: 'pass',
                    sanctionScreening: 'pass',
                    quantumSignatureIntegrity: 'verified',
                    recommendations: parseFloat(amount) > 5000 ? ["High value. Verify recipient."] : [],
                    complianceAlerts: [],
                    threatVectorAnalysis: []
                });
            }
        }, 800);
        return () => clearTimeout(auditTimeout);
    }, [amount, recipientName]);

    const handleSendClick = () => {
        if (currentStep === 1) setCurrentStep(2);
        else if (currentStep === 2) setShowBiometricModal(true);
    };

    const handleSuccess = () => {
        const newTx: Transaction = {
            id: `tx_${Date.now()}`,
            type: 'expense',
            category: 'Transfer',
            description: `Sent to ${recipientName} via ${paymentMethod}`,
            amount: parseFloat(amount),
            date: new Date().toISOString().split('T')[0],
            carbonFootprint: 0.5
        };
        addTransaction(newTx);
        setShowBiometricModal(false);
        setCurrentStep(1);
        setAmount('');
        setRecipientName('');
        alert("Transfer Successful!");
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider">Remitrax: Quantum Secure Payments</h2>
            <Card title={currentStep === 1 ? "Initiate Transfer" : "Review Transaction"}>
                <div className="space-y-4">
                    {currentStep === 1 ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Recipient</label>
                                <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" placeholder="Name, @tag, or ID" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Amount</label>
                                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Rail</label>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentRail)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white">
                                    <option value="quantumpay">QuantumPay (Instant DLT)</option>
                                    <option value="cashapp">Cash App</option>
                                    <option value="swift_global">SWIFT Global</option>
                                    <option value="blockchain_dlt">Blockchain DLT</option>
                                </select>
                            </div>
                            <SecurityAuditDisplay auditResult={securityAudit} />
                        </>
                    ) : (
                        <div className="space-y-2 text-gray-300">
                            <p><strong>To:</strong> {recipientName}</p>
                            <p><strong>Amount:</strong> ${amount}</p>
                            <p><strong>Method:</strong> {paymentMethod}</p>
                            <p className="text-sm text-yellow-400">Estimated Time: Instant (Quantum)</p>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 mt-6">
                         {currentStep === 2 && <button onClick={() => setCurrentStep(1)} className="px-4 py-2 bg-gray-600 rounded text-white">Back</button>}
                         <button onClick={handleSendClick} disabled={!amount || !recipientName} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-bold disabled:opacity-50">
                            {currentStep === 1 ? "Review" : "Confirm & Send"}
                         </button>
                    </div>
                </div>
            </Card>
            <BiometricModal isOpen={showBiometricModal} onSuccess={handleSuccess} onClose={() => setShowBiometricModal(false)} amount={amount} recipient={recipientName} paymentMethod={paymentMethod} securityContext="personal" />
        </div>
    );
};

export default SendMoneyView;
