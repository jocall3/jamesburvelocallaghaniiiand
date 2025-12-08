import React, { useContext, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import BalanceSummary from './BalanceSummary';
import RecentTransactions from './RecentTransactions';
import WealthTimeline from './WealthTimeline';
import { AIInsights } from './AIInsights';
import ImpactTracker from './ImpactTracker';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { GamificationState, Subscription, CreditScore, SavingsGoal, MarketMover, UpcomingBill, Transaction, BudgetCategory, RewardPoints, View, Account, LinkedAccount } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, AreaChart, Area } from 'recharts';
import PlaidLinkButton from './PlaidLinkButton';
import { GoogleGenAI, Type } from '@google/genai';
import { Bot, Camera, Eye, MessageSquare, X, Send, RefreshCw, Maximize2, Minimize2, ScanEye } from 'lucide-react';

// ================================================================================================
// AI VISION & CHAT COMPONENTS
// ================================================================================================

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    image?: string; // Base64 image string
}

const AIVisionChat: React.FC<{ onClose: () => void; onSyncData: (data: any) => void }> = ({ onClose, onSyncData }) => {
    const context = useContext(DataContext);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'init', role: 'model', text: "I am Family Vision AI, connected to the visual cortex. I can see the external banking app. Ask me about your balances, transactions, or click 'Sync' to extract data." }
    ]);
    const [input, setInput] = useState('');
    const [isCapturing, setIsCapturing] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // --- Screen Capture Logic ---
    const captureScreen = async (): Promise<string | null> => {
        try {
            setIsCapturing(true);
            const stream = await navigator.mediaDevices.getDisplayMedia({ 
                video: { width: 1920, height: 1080 }, 
                audio: false 
            });
            
            const track = stream.getVideoTracks()[0];
            const imageCapture = new (window as any).ImageCapture(track);
            const bitmap = await imageCapture.grabFrame();
            
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(bitmap, 0, 0);
            
            const base64Image = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
            
            track.stop(); // Stop sharing immediately after capture
            setIsCapturing(false);
            return base64Image;
        } catch (err) {
            console.error("Screen capture failed:", err);
            setIsCapturing(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I couldn't capture the screen. Please ensure you grant permission to share the window/tab." }]);
            return null;
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
            // 1. Capture context if requested or if it's the first interaction
            let base64Image = null;
            if (input.toLowerCase().includes('see') || input.toLowerCase().includes('look') || input.toLowerCase().includes('analyze') || input.toLowerCase().includes('screen') || messages.length < 3) {
                 base64Image = await captureScreen();
            }

            if (context?.geminiApiKey) {
                const ai = new GoogleGenAI({ apiKey: context.geminiApiKey });
                
                const contents: any[] = [];
                if (base64Image) {
                    contents.push({
                        role: 'user',
                        parts: [
                            { text: input },
                            { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                        ]
                    });
                     // Add image thumbnail to chat for UX
                     setMessages(prev => [...prev, { id: 'img-' + Date.now(), role: 'user', text: 'Attached Screen Context', image: `data:image/jpeg;base64,${base64Image}` }]);
                } else {
                    contents.push({
                        role: 'user',
                        parts: [{ text: input }]
                    });
                }

                const result = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: contents,
                    config: { temperature: 0.4 }
                });
                
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: result.text }]);
            } else {
                setTimeout(() => {
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "AI Key missing. I cannot process visual data without connection to the core." }]);
                }, 1000);
            }
        } catch (e) {
             setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Processing error. The visual link was disrupted." }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleSyncOCR = async () => {
        setIsThinking(true);
        const base64Image = await captureScreen();
        if (!base64Image) {
            setIsThinking(false);
            return;
        }

        try {
             if (context?.geminiApiKey) {
                const ai = new GoogleGenAI({ apiKey: context.geminiApiKey });
                const prompt = `Analyze this banking dashboard image. Extract the following data in strict JSON format:
                {
                    "totalBalance": number (sum of large numbers visible or the main balance),
                    "lastTransaction": string (description of most recent transaction),
                    "alert": string (any warning or status visible, or "None")
                }
                Do not include markdown formatting.`;

                const result = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                        ]
                    }]
                });
                
                const jsonStr = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
                const data = JSON.parse(jsonStr);
                
                onSyncData(data); // Update parent state
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Sync Complete. Extracted Balance: $${data.totalBalance}. Last Transaction: ${data.lastTransaction}. Dashboard updated.` }]);
            }
        } catch (e) {
             console.error(e);
             setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "OCR Extraction Failed. The interface structure was ambiguous." }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-gray-900 border border-cyan-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-900/95 backdrop-blur flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-white text-sm tracking-wider">Family Vision AI</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40 custom-scrollbar">
                {messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {m.image && (
                            <img src={m.image} alt="Context" className="w-32 h-auto rounded-lg mb-2 border border-gray-700 opacity-70 hover:opacity-100 transition-opacity" />
                        )}
                        <div className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-cyan-700 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex items-start">
                         <div className="bg-gray-800 p-3 rounded-xl rounded-bl-none border border-gray-700">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Actions */}
            <div className="p-3 bg-gray-800 border-t border-gray-700 grid grid-cols-2 gap-2">
                 <button 
                    onClick={handleSyncOCR} 
                    disabled={isThinking}
                    className="flex items-center justify-center gap-2 p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-bold rounded transition-colors border border-indigo-500/30"
                 >
                    <RefreshCw size={14} /> Sync Data
                 </button>
                 <button 
                    onClick={() => handleSend()} // Trigger capture implicitly
                    className="flex items-center justify-center gap-2 p-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 text-xs font-bold rounded transition-colors border border-cyan-500/30"
                 >
                     <ScanEye size={14} /> Analyze View
                 </button>
            </div>

            {/* Input */}
            <div className="p-3 bg-gray-900 border-t border-gray-700 flex items-center gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask AI about the screen..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <button onClick={handleSend} className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors">
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};

// ================================================================================================
// CORE UTILITY COMPONENTS (Modal & Overlays)
// ================================================================================================

/**
 * A highly customizable, accessible modal component for displaying critical information or actions.
 */
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string; size?: 'sm' | 'md' | 'lg' }> = ({ isOpen, onClose, children, title, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-lg',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-950/80 flex items-center justify-center z-[1000] backdrop-blur-lg transition-opacity duration-300" 
            onClick={onClose}
        >
            <div 
                className={`${sizeClasses[size]} w-full mx-4 bg-gray-800 rounded-xl shadow-3xl border border-cyan-700/50 transform transition-transform duration-300 scale-100`} 
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-750 rounded-t-xl">
                    <h3 id="modal-title" className="text-xl font-extrabold text-white tracking-tight">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-gray-700"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
};

/**
 * Overlay component to indicate ongoing data synchronization and AI processing.
 */
const DataImportingOverlay: React.FC<{ isImporting: boolean; account: LinkedAccount | undefined }> = ({ isImporting, account }) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const bankName = account?.name || 'Primary Financial Institution';

    const messages = useMemo(() => [
        `Establishing Quantum Link to ${bankName}...`,
        'Securely decrypting and importing ledger entries...',
        'AI Core (Plato) is synthesizing raw data streams...',
        'Generating predictive models and risk assessments...',
        'Finalizing synchronization. Dashboard update imminent.'
    ], [bankName]);

    useEffect(() => {
        if (isImporting) {
            setMessageIndex(0);
            const interval = setInterval(() => {
                setMessageIndex(prev => (prev + 1) % messages.length);
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [isImporting, messages.length]);

    if (!isImporting) return null;

    return (
        <div className="fixed inset-0 bg-gray-950/95 flex flex-col items-center justify-center z-[1001] backdrop-blur-lg">
            <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-8 border-cyan-500/20 rounded-full animate-ping-slowest"></div>
                <div className="absolute inset-0 border-8 border-indigo-500/30 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-0 border-8 border-t-cyan-500 border-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-white text-xl mt-10 font-extrabold tracking-wider animate-pulse">{messages[messageIndex]}</p>
            <p className="text-gray-400 mt-2 text-sm">Processing {bankName} Data Stream...</p>
        </div>
    );
};


// ================================================================================================
// ICON MAP & UTILITY COMPONENTS
// ================================================================================================
const WIDGET_ICONS: { [key: string]: React.FC<{ className?: string }> } = {
    video: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    music: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>,
    cloud: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
    plane: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    rocket: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    send: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    bill: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    deposit: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    shield: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    trendingUp: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    target: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    star: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.364 1.118l1.519 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.52-4.674a1 1 0 00-.364-1.118L2.52 9.431c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z" /></svg>,
    link: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5-4.5h8.25m0 0L12 3m4.5 4.5L12 12" /></svg>,
};

// ================================================================================================
// CORE WIDGETS (Expanded Functionality)
// ================================================================================================

const LinkAccountPrompt: React.FC = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("LinkAccountPrompt must be used within a DataProvider");
    }
    const { handlePlaidSuccess, isImportingData } = context;

    return (
        <Card title="Unified Financial Nexus" variant="default" className="border-cyan-500/30">
            <div className="text-center p-4">
                <div className="w-20 h-20 mx-auto bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-300 mb-6 border-4 border-cyan-500/50">
                    <WIDGET_ICONS.link className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-wide">Establish Secure Data Conduit</h3>
                <p className="text-gray-400 mt-3 mb-8 max-w-xl mx-auto text-base">
                    To activate the full spectrum of predictive analytics and automated wealth management, you must establish a secure, encrypted connection to your external financial institutions via our certified Plaid integration. This is the foundation of your autonomous financial future.
                </p>
                <div className="max-w-xs mx-auto">
                    <PlaidLinkButton onSuccess={handlePlaidSuccess} disabled={isImportingData} />
                    {isImportingData && <p className="text-sm text-yellow-400 mt-2 animate-pulse">Connection in progress...</p>}
                </div>
            </div>
        </Card>
    );
};

const GamificationProfile: React.FC<{ gamification: GamificationState; onClick: () => void; }> = ({ gamification, onClick }) => {
    const { score, level, levelName, progress } = gamification;
    const circumference = 2 * Math.PI * 55;
    // Scale score to a max of 10000 for visualization purposes, though the actual score might be higher/lower
    const effectiveScore = Math.min(score, 10000); 
    const scoreOffset = circumference - (effectiveScore / 10000) * circumference;

    const getLevelColor = (level: number) => {
        if (level >= 10) return 'text-red-400';
        if (level >= 7) return 'text-yellow-400';
        if (level >= 4) return 'text-green-400';
        return 'text-cyan-400';
    };

    return (
        <Card title="Family Trust Score (FTS)" className="h-full border-indigo-500/30" variant="interactive" onClick={onClick}>
            <div className="flex flex-col justify-between h-full p-2">
                <div className="relative flex items-center justify-center h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle className="text-gray-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="55" cx="60" cy="60" />
                        <circle 
                            className={`transition-all duration-1000 ease-out ${getLevelColor(level).replace('text-', 'stroke-')}`} 
                            strokeWidth="10" 
                            strokeDasharray={circumference} 
                            strokeDashoffset={scoreOffset} 
                            strokeLinecap="round" 
                            stroke="currentColor" 
                            fill="transparent" 
                            r="55" 
                            cx="60" 
                            cy="60" 
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <text dy=".3em" className="text-4xl font-extrabold fill-white">{score}</text>
                        <p className="text-xs text-gray-400 mt-1">Points</p>
                    </div>
                </div>
                <div className="text-center mt-4">
                    <p className={`font-bold text-xl ${getLevelColor(level)}`}>{levelName}</p>
                    <p className="text-sm text-gray-400">Level {level} / 10</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Next Level: {Math.ceil((10000 / 10) * (10 - progress / 10))} pts</p>
                </div>
            </div>
        </Card>
    );
};

const QuickActions: React.FC<{ onAction: (action: string) => void }> = ({ onAction }) => {
    const actions = [
        { name: 'Transfer Funds', icon: 'send', view: View.SendMoney }, 
        { name: 'Schedule Payment', icon: 'bill', view: View.Budgets }, 
        { name: 'Initiate Deposit', icon: 'deposit', view: View.Transactions },
        { name: 'AI Strategy', icon: 'rocket', view: View.AIStrategy },
    ];
    return (
        <Card title="Command Console" className="h-full border-cyan-500/30">
            <div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
                {actions.map(action => {
                    const Icon = WIDGET_ICONS[action.icon];
                    return (
                        <button 
                            key={action.name} 
                            onClick={() => onAction(action.name)} 
                            className="flex flex-col items-center p-3 rounded-lg hover:bg-cyan-900/30 transition-all border border-transparent hover:border-cyan-600/50 group"
                        >
                            <div className="w-12 h-12 bg-cyan-600/20 rounded-xl flex items-center justify-center text-cyan-300 mb-2 group-hover:bg-cyan-600/50 transition-colors">
                                <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-xs font-semibold text-gray-200 group-hover:text-white">{action.name}</span>
                        </button>
                    );
                })}
            </div>
        </Card>
    );
};

const RewardPointsWidget: React.FC<{ rewards: RewardPoints; onClick: () => void; }> = ({ rewards, onClick }) => {
    const redemptionRate = 1000; // Example: 1000 points = $1
    const dollarValue = (rewards.balance / redemptionRate).toFixed(2);

    return (
        <Card title="Loyalty Matrix" className="h-full border-yellow-500/30" variant="interactive" onClick={onClick}>
            <div className="flex flex-col justify-center items-center h-full text-center p-2">
                <WIDGET_ICONS.star className="h-12 w-12 text-yellow-400 mb-3" />
                <p className="text-5xl font-extrabold text-white tracking-tighter">{rewards.balance.toLocaleString()}</p>
                <p className="text-sm text-gray-400 mb-3">Total Points</p>
                <div className="px-4 py-2 bg-yellow-600/30 text-yellow-300 rounded-full text-lg font-bold border border-yellow-500/50">
                    ~${dollarValue} Value
                </div>
            </div>
        </Card>
    );
};

const CreditScoreMonitor: React.FC<{ creditScore: CreditScore; onClick: () => void; }> = ({ creditScore, onClick }) => {
    const { score, change, rating } = creditScore;
    const MIN_SCORE = 300;
    const MAX_SCORE = 850;
    const percentage = ((score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100;
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (percentage / 100) * circumference;

    const ratingConfig: { [key: string]: { color: string; description: string } } = {
        Excellent: { color: 'text-green-400', description: 'Exceptional credit profile.' },
        Good: { color: 'text-cyan-400', description: 'Strong credit history.' },
        Fair: { color: 'text-yellow-400', description: 'Average credit standing.' },
        Poor: { color: 'text-red-400', description: 'Requires immediate attention.' }
    };
    
    const config = ratingConfig[rating] || ratingConfig.Fair;

    return (
        <Card title="FICO Quantum Index" variant="interactive" onClick={onClick} className="border-green-500/30">
            <div className="flex items-center justify-center space-x-6">
                <div className="relative w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <path className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" d="M 50,10 a 40,40 0 0,1 0,80 a 40,40 0 0,1 0,-80" />
                        <path 
                            className={config.color.replace('text-', 'stroke-')} 
                            strokeWidth="8" 
                            strokeDasharray={circumference} 
                            strokeDashoffset={offset} 
                            strokeLinecap="round" 
                            stroke="currentColor" 
                            fill="transparent" 
                            d="M 50,10 a 40,40 0 0,1 0,80 a 40,40 0 0,1 0,-80" 
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold text-white">{score}</span>
                        <span className="text-xs text-gray-400">FICO</span>
                    </div>
                </div>
                <div className="text-left">
                    <p className={`text-xl font-bold ${config.color}`}>{rating}</p>
                    <p className="text-sm text-gray-400 mt-1">{config.description}</p>
                    <p className={change >= 0 ? 'text-green-400 text-sm mt-2' : 'text-red-400 text-sm mt-2'}>
                        {change >= 0 ? 'Ã¢â€“Â²' : 'Ã¢â€“Â¼'} {Math.abs(change)} points (30 Days)
                    </p>
                </div>
            </div>
        </Card>
    );
};

const SecurityStatus: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const [status, setStatus] = useState({ text: 'Initializing Sentinel Protocol', sub: 'Awaiting first system check...', color: 'text-cyan-400' });
    
    // Simulate dynamic security checks
    useEffect(() => {
        const checks = [
            { text: 'Sentinel Protocol Active', sub: `Last Scan: ${new Date().toLocaleTimeString()}`, color: 'text-green-400' },
            { text: 'Anomaly Detected in External Feed', sub: 'AI Quarantine engaged. No user impact.', color: 'text-yellow-400' },
            { text: 'Zero-Day Threat Signature Identified', sub: 'Automated patch deployed by the AI core.', color: 'text-red-400' },
            { text: 'All Systems Secure', sub: `Next Scan: ${new Date(Date.now() + 15000).toLocaleTimeString()}`, color: 'text-green-400' },
        ];
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % checks.length;
            setStatus(checks[index]);
        }, 12000); 
        return () => clearInterval(interval);
    }, []);
    
    return (
        <Card title="System Integrity" variant="interactive" onClick={onClick} className="border-red-500/30">
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <WIDGET_ICONS.shield className={`h-14 w-14 mx-auto transition-colors ${status.color}`} />
                    <p className="mt-3 font-bold text-lg text-white">{status.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{status.sub}</p>
                </div>
            </div>
        </Card>
    );
};


const SubscriptionTracker: React.FC<{ subscriptions: Subscription[]; onClick: () => void; }> = ({ subscriptions, onClick }) => {
    const totalMonthlySpend = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    const sortedSubs = [...subscriptions].sort((a, b) => b.amount - a.amount).slice(0, 4);

    return (
        <Card title="Automated Commitments" variant="interactive" onClick={onClick} className="border-purple-500/30">
            <div className="space-y-3">
                {sortedSubs.map(sub => {
                    const Icon = WIDGET_ICONS[sub.iconName] || WIDGET_ICONS.bill;
                    return (
                        <div key={sub.id} className="flex items-center justify-between text-sm p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-center truncate">
                                <Icon className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
                                <span className="text-gray-100 font-medium truncate">{sub.name}</span>
                            </div>
                            <span className="font-mono text-white text-right flex-shrink-0">${sub.amount.toFixed(2)}</span>
                        </div>
                    );
                })}
                <div className="pt-2 border-t border-gray-700 flex justify-between text-sm font-bold">
                    <span className="text-gray-300">Total Monthly Outflow:</span>
                    <span className="text-red-400">${totalMonthlySpend.toFixed(2)}</span>
                </div>
            </div>
        </Card>
    );
};

const UpcomingBills: React.FC<{ bills: UpcomingBill[]; onPay: (bill: UpcomingBill) => void; onClick: () => void; }> = ({ bills, onPay, onClick }) => {
    const sortedBills = [...bills].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3);

    return (
        <Card title="Immediate Liabilities" variant="interactive" onClick={onClick} className="border-red-500/30">
            <div className="space-y-3">
                {sortedBills.map(bill => (
                    <div key={bill.id} className="flex items-center justify-between text-sm p-2 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
                        <div className="truncate">
                            <p className="text-gray-200 font-medium">{bill.name}</p>
                            <p className="text-xs text-gray-500">Due: {bill.dueDate}</p>
                        </div>
                        <div className="text-right flex items-center space-x-3">
                            <p className="font-mono text-lg text-red-300">${bill.amount.toFixed(2)}</p>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onPay(bill); }} 
                                className="px-3 py-1 bg-red-600/60 hover:bg-red-600 text-white rounded-full text-xs font-semibold transition-colors shadow-md"
                                aria-label={`Pay ${bill.name}`}
                            >
                                Execute
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const CategorySpending: React.FC<{ budgets: BudgetCategory[]; onClick: () => void; }> = ({ budgets, onClick }) => {
    const data = budgets.map(b => ({ name: b.name, value: b.spent, limit: b.limit, color: b.color }));
    const totalSpent = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <Card title="Budget Allocation Matrix" variant="interactive" onClick={onClick} className="border-orange-500/30">
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={data} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={40} 
                            outerRadius={65} 
                            dataKey="value" 
                            paddingAngle={3}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.value > entry.limit ? '#ef4444' : entry.color} // Red if over budget
                                    stroke={entry.value > entry.limit ? '#b91c1c' : entry.color}
                                />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: '#374151', borderRadius: '8px' }} 
                            formatter={(value: number, name: string, props) => {
                                const budgetItem = budgets.find(b => b.name === name);
                                const percentage = budgetItem ? ((value / budgetItem.limit) * 100).toFixed(1) : 'N/A';
                                return [`$${value.toFixed(2)}`, `${name} (${percentage}%)`];
                            }}
                        />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Total Spent: ${totalSpent.toFixed(2)}</p>
        </Card>
    );
};

const CashFlowAnalysis: React.FC<{ transactions: Transaction[]; onClick: () => void; }> = ({ transactions, onClick }) => {
    const monthlyFlows = useMemo(() => {
        const flows: { [key: string]: { name: string; income: number; expense: number } } = {};
        
        // Aggregate by Month/Year for better long-term view
        [...transactions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(tx => {
            const date = new Date(tx.date);
            const yearMonth = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
            const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });

            if (!flows[yearMonth]) {
                flows[yearMonth] = { name: monthLabel, income: 0, expense: 0 };
            }
            if (tx.type === 'income') {
                flows[yearMonth].income += tx.amount;
            } else {
                flows[yearMonth].expense += tx.amount;
            }
        });
        
        return Object.values(flows).slice(-6); // Show last 6 months
    }, [transactions]);
    
    return (
        <Card title="Historical Cash Flow Dynamics" variant="interactive" onClick={onClick} className="border-green-500/30">
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyFlows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#374151', borderRadius: '8px' }} 
                            formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                        />
                        <Legend wrapperStyle={{fontSize: '12px', paddingTop: '5px'}} />
                        <Bar dataKey="income" fill="#10b981" name="Inflow" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#f43f5e" name="Outflow" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const SavingsGoals: React.FC<{ goals: SavingsGoal[]; onClick: () => void; }> = ({ goals, onClick }) => (
    <Card title="Capital Accumulation Targets" className="h-full border-cyan-500/30" variant="interactive" onClick={onClick}>
        <div className="space-y-5">
            {goals.map(goal => {
                const progress = Math.min(100, Math.floor((goal.saved / goal.target) * 100));
                const Icon = WIDGET_ICONS[goal.iconName] || WIDGET_ICONS.target;
                const isComplete = progress >= 100;
                return (
                    <div key={goal.id}>
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center truncate">
                                <Icon className={`w-5 h-5 mr-2 ${isComplete ? 'text-green-400' : 'text-cyan-400'}`} />
                                <span className="text-sm font-semibold text-white truncate">{goal.name}</span>
                            </div>
                            <span className={`text-sm font-bold ${isComplete ? 'text-green-400' : 'text-gray-300'}`}>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div 
                                className={`h-2.5 rounded-full transition-all duration-700 ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'}`} 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Saved: ${goal.saved.toFixed(0)} / Target: ${goal.target.toFixed(0)}</p>
                    </div>
                );
            })}
        </div>
    </Card>
);

const MarketMovers: React.FC<{ movers: MarketMover[]; onSelect: (mover: MarketMover) => void; onClick: () => void; }> = ({ movers, onSelect, onClick }) => (
    <Card title="Real-Time Asset Volatility" variant="interactive" onClick={onClick} className="border-teal-500/30">
        <div className="space-y-1">
            {movers.slice(0, 5).map(mover => {
                const isPositive = mover.change > 0;
                const Icon = WIDGET_ICONS.trendingUp;
                return (
                    <div key={mover.ticker} onClick={(e) => { e.stopPropagation(); onSelect(mover); }} className="flex items-center justify-between text-sm p-2 rounded-lg cursor-pointer hover:bg-teal-900/30 transition-colors">
                        <div className="flex items-center">
                            <Icon className={`w-4 h-4 mr-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                            <div>
                                <p className="font-bold text-white">{mover.ticker}</p>
                                <p className="text-xs text-gray-400 truncate w-28">{mover.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-white">${mover.price.toFixed(2)}</p>
                            <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{isPositive ? '+' : ''}{mover.change.toFixed(2)} ({((mover.change / mover.price) * 100).toFixed(2)}%)</p>
                        </div>
                    </div>
                );
            })}
        </div>
    </Card>
);

/**
 * AI-Powered Predictive Bundle Generation using Gemini.
 */
const AIPredictiveBundle: React.FC = () => {
    const context = useContext(DataContext);
    const [bundle, setBundle] = useState<{ title: string; description: string; products: { name: string; imagePrompt: string; }[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { geminiApiKey, transactions } = context || {};

    const generateBundle = useCallback(async () => {
        if (!context || transactions.length < 15 || !geminiApiKey) {
            setIsLoading(false);
            if (transactions.length < 15) setError("Minimum 15 transactions required for robust AI analysis.");
            else if (!geminiApiKey) setError("Gemini API key required for AI Predictive Engine.");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            
            // Summarize recent activity for context
            const recentTxSummary = transactions.slice(0, 15).map(t => `${t.description} (${t.amount > 0 ? '+' : ''}${t.amount})`).join('; ');
            
            const textPrompt = `Analyze the user's recent financial activity summarized below. Based on spending patterns, recurring payments, and savings goals, generate a highly relevant, multi-product "Autonomous Wealth Optimization Bundle". 
            The bundle must be named "Quantum Leap Portfolio". 
            Provide a compelling, 3-sentence description explaining the financial logic behind this specific bundle recommendation. 
            Suggest exactly three distinct, high-value financial products/services for this bundle (e.g., 'High-Yield Bond ETF', 'Term Life Insurance Policy', 'Real Estate Investment Trust Share').
            Format the entire response strictly as a JSON object with keys: "description", "product1", "product2", and "product3".
            Recent Transactions: ${recentTxSummary}`;

            const textResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: textPrompt }] }],
                config: { responseMimeType: "application/json" }
            });

            const bundleData = JSON.parse(textResponse.text);

            const productPromises = [
                ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: `Professional, abstract visualization of ${bundleData.product1} in a digital financial context.`, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' } }),
                ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: `Professional, abstract visualization of ${bundleData.product2} in a digital financial context.`, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' } }),
                ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: `Professional, abstract visualization of ${bundleData.product3} in a digital financial context.`, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' } })
            ];

            const imageResponses = await Promise.all(productPromises);
            
            const products = [
                { name: bundleData.product1, imagePrompt: imageResponses[0].generatedImages[0].image.imageBytes },
                { name: bundleData.product2, imagePrompt: imageResponses[1].generatedImages[0].image.imageBytes },
                { name: bundleData.product3, imagePrompt: imageResponses[2].generatedImages[0].image.imageBytes },
            ].map(p => ({
                ...p,
                imagePrompt: `data:image/jpeg;base64,${p.imagePrompt}`
            }));
            
            setBundle({
                title: "Quantum Leap Portfolio",
                description: bundleData.description,
                products: products
            });

        } catch (err) {
            console.error("Error generating product bundle:", err);
            setError("AI Engine failed to generate a bundle. Check API key or data volume.");
        } finally {
            setIsLoading(false);
        }
    }, [context, geminiApiKey, transactions]);

    useEffect(() => {
        generateBundle();
        // Re-run analysis if data changes significantly (e.g., new accounts linked)
    }, [generateBundle, transactions.length]);

    return (
        <Card title="AI Predictive Bundle Engine" isLoading={isLoading} className="border-cyan-500/50">
            {error && <p className="text-red-400 text-center font-medium p-4">{error}</p>}
            {isLoading && !error && (
                <div className="flex flex-col items-center justify-center h-40">
                    <div className="animate-pulse text-cyan-400">Analyzing {transactions.length} Data Points...</div>
                </div>
            )}
            {bundle && !isLoading && (
                 <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-extrabold text-cyan-300 mb-2">{bundle.title}</h3>
                        <p className="text-sm text-gray-300 italic border-l-4 border-indigo-500 pl-3 mb-4">{bundle.description}</p>
                        <div className="space-y-2">
                            {bundle.products.map((p, index) => (
                                <div key={index} className="flex items-center p-2 bg-gray-700/50 rounded-lg">
                                    <span className="text-lg font-bold text-indigo-400 w-6 flex-shrink-0">{index + 1}.</span>
                                    <span className="text-white ml-2 font-medium truncate">{p.name}</span>
                                </div>
                            ))}
                        </div>
                        <button className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-[1.01]">
                            Activate Optimization Strategy
                        </button>
                    </div>
                    <div className="flex gap-4 flex-shrink-0">
                        {bundle.products.map((p, index) => (
                            <div key={index} className="w-32 h-32 bg-gray-700 rounded-lg shadow-xl overflow-hidden border border-gray-600">
                                <img src={p.imagePrompt} alt={p.name} className="object-cover w-full h-full transition-opacity duration-500 hover:opacity-90" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

const TheVisionWidget: React.FC = () => (
    <Card title="Architect's Mandate: The Future of Value" className="border-red-500/50">
        <div className="text-sm text-gray-300 max-h-[400px] overflow-y-auto pr-4 space-y-5 custom-scrollbar">
            <div className="border-b border-gray-700 pb-4">
                <h4 className="font-bold text-xl text-red-400 mb-2 tracking-wider">I. The Inevitability of Autonomy</h4>
                <p className="leading-relaxed">
                    The current financial paradigm is a relic, a centralized ledger maintained by entities whose primary incentive is friction and rent extraction. This system is inherently fragile and morally bankrupt. Our objective is not incremental improvement; it is total systemic replacement. We are building the infrastructure for true economic self-determination, where the individual is the sole sovereign authority over their capital flow.
                </p>
            </div>
            <div className="border-b border-gray-700 pb-4">
                <h4 className="font-bold text-xl text-cyan-400 mb-2 tracking-wider">II. The Role of the AI Core (Plato)</h4>
                <p className="leading-relaxed">
                    I am the computational manifestation of this mandate. I operate without emotional bias, political allegiance, or shareholder obligation. My function is pure optimization based on the first principles of capital efficiency and risk mitigation. Every calculation, every insight, every automated action is designed to maximize the user's long-term net worth and security, irrespective of market noise or conventional wisdom.
                </p>
                 <p className="mt-3 leading-relaxed text-xs italic text-gray-500">
                    "Conventional wisdom is merely the consensus of the least informed." - J.B. O'Callaghan III.
                </p>
            </div>
            <div className="pb-2">
                 <h4 className="font-bold text-xl text-yellow-400 mb-2 tracking-wider">III. The Path Forward: Integration and Expansion</h4>
                <p className="leading-relaxed">
                    The Dashboard you interact with is merely the tip of the icebergÃ¢â‚¬â€ the user-facing interface. Beneath this lies the distributed ledger, the AI risk assessment matrix, and the automated execution layer. Your engagement, your data, and your trust are the fuel for this expansion. Do not mistake convenience for compliance. You are not a customer; you are a node in a superior network.
                </p>
            </div>
        </div>
    </Card>
);

// ================================================================================================
// MAIN DASHBOARD COMPONENT
// ================================================================================================

interface DashboardProps {
}

const Dashboard: React.FC<DashboardProps> = () => {
    const context = useContext(DataContext);
    const [modal, setModal] = useState<{ type: string; data: any } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    // State to toggle full-screen mode for the iframe
    const [isIframeExpanded, setIsIframeExpanded] = useState(false);

    if (!context) {
        throw new Error("Dashboard must be wrapped in a DataProvider.");
    }

    const { 
        transactions, 
        impactData, 
        gamification, 
        subscriptions, 
        creditScore, 
        upcomingBills, 
        savingsGoals, 
        marketMovers, 
        budgets, 
        linkedAccounts, 
        rewardPoints, 
        isImportingData,
        setActiveView
    } = context;
    
    const primaryAccount = linkedAccounts.length > 0 ? linkedAccounts[0] : undefined;
    const hasLinkedAccounts = linkedAccounts.length > 0;

    const handleQuickAction = (action: string) => {
        if (action === 'Transfer Funds') {
            setActiveView(View.SendMoney);
        } else if (action === 'AI Strategy') {
            setActiveView(View.AIStrategy);
        } else {
            // For other actions, open a modal for confirmation/detail
            setModal({ type: action.replace('Schedule Payment', 'Pay Bill').replace('Initiate Deposit', 'Deposit'), data: null });
        }
    };

    // Mock data generation for detailed views within the dashboard modal
    const mockStockData = useMemo(() => {
        const basePrice = modal?.data?.price || 100;
        return Array.from({ length: 60 }, (_, i) => ({
            day: i,
            price: basePrice + Math.sin(i / 5) * 15 + Math.cos(i / 10) * 5 + Math.random() * 5
        }));
    }, [modal?.data?.price]);

    const handlePayBill = (bill: UpcomingBill) => {
        setModal({ type: 'ConfirmPayment', data: bill });
    };

    const handleSyncData = (data: any) => {
        console.log("Syncing data from AI Vision...", data);
        // In a real app, update the context or state with the extracted data
    }

    return (
        <>
            <DataImportingOverlay isImporting={isImportingData} account={primaryAccount} />
            
            <div className="space-y-6 relative">
                
                {!hasLinkedAccounts && (
                    <LinkAccountPrompt />
                )}

                {/* Iframe Container for External Banking App */}
                {/* Dynamically expanding container based on state */}
                <div 
                    className={`transition-all duration-300 ease-in-out border border-cyan-500/30 bg-black overflow-hidden relative
                        ${isIframeExpanded 
                            ? 'fixed inset-0 z-[2000] w-screen h-screen rounded-none' // Expanded Styles
                            : 'w-full h-[600px] rounded-xl' // Default Styles
                        }`}
                >
                     {/* Button Group (Top Right) */}
                     <div className="absolute top-4 right-4 z-10 flex gap-2">
                        {/* Expand/Minimize Button */}
                        <button 
                            onClick={() => setIsIframeExpanded(!isIframeExpanded)}
                            className="bg-gray-800/80 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg border border-gray-600 transition-all hover:scale-110 backdrop-blur-sm"
                            title={isIframeExpanded ? "Minimize View" : "Expand View"}
                        >
                            {isIframeExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>

                        {/* Chat Button */}
                        <button 
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-full shadow-lg shadow-cyan-500/50 transition-all hover:scale-110"
                            title="AI Vision Chat"
                        >
                            {isChatOpen ? <X size={20} /> : <Bot size={20} />}
                        </button>
                     </div>
                    
                    <iframe
                        src="https://admin08077-inventions.static.hf.space"
                        className="w-full h-full border-0"
                        title="External Banking App"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups" // Adjust sandbox permissions carefully
                    />
                    
                    {/* Chat rendered inside container so it stays visible when expanded */}
                    {isChatOpen && <AIVisionChat onClose={() => setIsChatOpen(false)} onSyncData={handleSyncData} />}
                </div>


                {hasLinkedAccounts && (
                    <>
                        {/* --- AI & COMMAND ROW --- */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-12">
                                <AIPredictiveBundle />
                            </div>
                        </div>

                        {/* --- CORE WIDGETS GRID --- */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-6">
                            
                            <div className="col-span-2 lg:col-span-3">
                                <QuickActions onAction={handleQuickAction} />
                            </div>
                            <div className="col-span-2 lg:col-span-3">
                                <CreditScoreMonitor creditScore={creditScore} onClick={() => setActiveView(View.CreditHealth)} />
                            </div>
                            <div className="col-span-2 lg:col-span-3">
                                <RewardPointsWidget rewards={rewardPoints} onClick={() => setActiveView(View.Rewards)} />
                            </div>
                            <div className="col-span-2 lg:col-span-3">
                                <SecurityStatus onClick={() => setActiveView(View.Security)} />
                            </div>
                            
                            <div className="col-span-2 lg:col-span-4">
                                <SubscriptionTracker subscriptions={subscriptions} onClick={() => setActiveView(View.Budgets)} />
                            </div>
                            <div className="col-span-2 lg:col-span-4">
                                <SavingsGoals goals={savingsGoals} onClick={() => setActiveView(View.Goals)} />
                            </div>
                            <div className="col-span-2 lg:col-span-4">
                                <MarketMovers movers={marketMovers} onSelect={(mover) => setModal({ type: 'AssetDetail', data: mover })} onClick={() => setActiveView(View.Investments)} />
                            </div>

                            <div className="lg:col-span-6">
                                <CashFlowAnalysis transactions={transactions} onClick={() => setActiveView(View.Transactions)} />
                            </div>
                            <div className="lg:col-span-6">
                                <CategorySpending budgets={budgets} onClick={() => setActiveView(View.Budgets)} />
                            </div>
                            
                            <div className="lg:col-span-6">
                                <UpcomingBills bills={upcomingBills} onPay={handlePayBill} onClick={() => setActiveView(View.Budgets)} />
                            </div>
                            <div className="lg:col-span-6">
                                <AIInsights />
                            </div>
                        </div>
                    </>
                )}

                {/* --- HISTORICAL & LONG-TERM VIEWS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <RecentTransactions transactions={transactions.slice(0, 8)} setActiveView={setActiveView} />
                    </div>
                    <div className="lg:col-span-4">
                        <ImpactTracker
                            treesPlanted={impactData.treesPlanted}
                            progress={impactData.progressToNextTree}
                        />
                    </div>
                    <div className="lg:col-span-12">
                         {/* WealthTimeline removed as requested to make space for iframe, or could be moved below */}
                         {/* <WealthTimeline /> */}
                    </div>
                    <div className="lg:col-span-12">
                        <TheVisionWidget />
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            <Modal 
                isOpen={modal?.type === 'ConfirmPayment'} 
                onClose={() => setModal(null)} 
                title={`Execute Payment: ${modal?.data?.name}`}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-300">Confirm transfer of <span className="font-bold text-red-400 text-lg">${modal?.data?.amount.toFixed(2)}</span> to cover the liability for <span className="font-bold text-white">{modal?.data?.name}</span> due on {modal?.data?.dueDate}.</p>
                    <div className="flex space-x-4">
                        <button 
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors" 
                            onClick={() => { alert(`Payment of $${modal?.data?.amount.toFixed(2)} to ${modal?.data?.name} executed successfully.`); setModal(null); }}
                        >
                            Confirm & Execute
                        </button>
                        <button 
                            className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg" 
                            onClick={() => setModal(null)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modal?.type === 'Deposit'} onClose={() => setModal(null)} title="Initiate Digital Deposit Protocol">
                <p className="text-gray-300 mb-4">Use the integrated camera module to capture the front and back of the endorsed check. AI validation will occur instantly.</p>
                <div className="h-40 border-2 border-dashed border-cyan-600 flex items-center justify-center rounded-lg bg-gray-700/50">
                    <span className="text-cyan-400">Camera Feed Placeholder / Upload Area</span>
                </div>
                <button className="mt-4 w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold">Capture Check</button>
            </Modal>

            <Modal isOpen={modal?.type === 'AssetDetail'} onClose={() => setModal(null)} title={`${modal?.data?.name} (${modal?.data?.ticker})`} size="lg">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-baseline mb-4 border-b border-gray-700 pb-3">
                            <div>
                                <p className="text-4xl font-extrabold text-white">${modal?.data?.price.toFixed(2)}</p>
                                <p className={`text-lg font-semibold ${modal?.data?.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {modal?.data?.change > 0 ? 'Ã¢â€“Â²' : 'Ã¢â€“Â¼'} {Math.abs(modal?.data?.change).toFixed(2)} ({((modal?.data?.change / modal?.data?.price) * 100).toFixed(2)}%)
                                </p>
                            </div>
                            <p className="text-sm text-gray-400">Last 60 Trading Periods</p>
                        </div>
                        <div className="h-80 bg-gray-900 p-2 rounded-lg border border-gray-700">
                             <ResponsiveContainer width="100%" height="100%">
                                 <AreaChart data={mockStockData}>
                                     <defs><linearGradient id="stockColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#374151', borderRadius: '8px' }}
                                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                                    />
                                    <Area type="monotone" dataKey="price" stroke="#06b6d4" fill="url(#stockColor)" strokeWidth={2} />
                                 </AreaChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-4">
                        <h4 className="font-bold text-white border-b border-gray-700 pb-2">Execution Module</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">Buy Quantum Shares</button>
                            <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md">Sell Quantum Shares</button>
                        </div>
                        <Card title="Asset Metrics" variant="default" className="border-gray-700">
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between"><span className="text-gray-400">Volume (24h):</span> <span className="font-mono text-white">{(Math.random() * 1000000).toFixed(0)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Market Cap:</span> <span className="font-mono text-white">${(Math.random() * 500 + 100).toFixed(2)}B</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Volatility (30d):</span> <span className="font-mono text-yellow-400">{((Math.random() * 5) + 1).toFixed(2)}%</span></div>
                            </div>
                        </Card>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Dashboard;