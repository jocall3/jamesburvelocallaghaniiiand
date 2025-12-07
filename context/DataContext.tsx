
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { 
    Transaction, Asset, BudgetCategory, GamificationState, View, Notification, 
    PaymentOrder, Invoice, ComplianceCase, CorporateTransaction, DatabaseConfig, WebDriverStatus,
    FinancialGoal, AIGoalPlan, RecurringContribution, LinkedGoal, Contribution,
    CreditScore, UpcomingBill, SavingsGoal, MarketMover, APIStatus, Subscription,
    DataSharingPolicy, APIKey, TrustedContact, SecurityAwarenessModule, ThreatAlert, AuditLogEntry, SecurityScoreMetric,
    MarqetaCardProduct, TransactionRule
} from '../types';
import {
    MOCK_TRANSACTIONS, MOCK_ASSETS, MOCK_BUDGETS, MOCK_CREDIT_SCORE,
    MOCK_UPCOMING_BILLS, MOCK_SAVINGS_GOALS, MOCK_MARKET_MOVERS,
    MOCK_NOTIFICATIONS, MOCK_API_STATUS,
    MOCK_PAYMENT_ORDERS, MOCK_INVOICES, MOCK_COMPLIANCE_CASES,
    MOCK_CORPORATE_TRANSACTIONS, MOCK_SUBSCRIPTIONS
} from '../data/mockData';

interface DataContextType {
    // --- App State ---
    isLoading: boolean;
    error: string | null;

    // --- Navigation & UI ---
    activeView: View;
    setActiveView: (view: View) => void;
    
    // --- Financial Data ---
    transactions: Transaction[];
    assets: Asset[];
    budgets: BudgetCategory[];
    creditScore: any;
    upcomingBills: any[];
    savingsGoals: any[];
    financialGoals: FinancialGoal[];
    marketMovers: any[];
    linkedAccounts: any[];
    notifications: Notification[];
    subscriptions: Subscription[]; // Added
    
    // --- Corporate & Treasury ---
    paymentOrders: PaymentOrder[];
    invoices: Invoice[];
    complianceCases: ComplianceCase[];
    corporateTransactions: CorporateTransaction[];
    
    // --- Crypto & Web3 ---
    cryptoAssets: any[]; // Added placeholder type
    walletInfo: any; // Added placeholder
    virtualCard: any; // Added placeholder
    nftAssets: any[]; // Added placeholder
    connectWallet: (provider: any) => void; // Added
    disconnectWallet: () => void; // Added
    detectedProviders: any[]; // Added
    issueCard: () => void; // Added
    buyCrypto: (amount: number, currency: string) => void; // Added

    // --- Integrations & Config ---
    plaidApiKey: string | null;
    plaidClientId: string | null;
    stripeApiKey: string | null;
    geminiApiKey: string | null;
    marqetaApiToken: string | null;
    marqetaApiSecret: string | null;
    modernTreasuryApiKey: string | null;
    modernTreasuryOrganizationId: string | null;
    
    // --- Marqeta ---
    marqetaCardProducts: MarqetaCardProduct[]; // Added
    fetchMarqetaProducts: () => void; // Added
    isMarqetaLoading: boolean; // Added

    // --- Database & Infrastructure ---
    dbConfig: DatabaseConfig;
    updateDbConfig: (config: Partial<DatabaseConfig>) => void;
    connectDatabase: () => Promise<void>;
    
    // --- Web Driver / Automation ---
    webDriverStatus: WebDriverStatus;
    launchWebDriver: (taskName: string) => Promise<void>;

    // --- Security & Compliance ---
    showSystemAlert: (message: string, type: string) => void; // Added
    unlinkAccount: (id: string) => void; // Added
    securityMetrics: SecurityScoreMetric[]; // Added
    auditLogs: AuditLogEntry[]; // Added
    threatAlerts: ThreatAlert[]; // Added
    dataSharingPolicies: DataSharingPolicy[]; // Added
    apiKeys: APIKey[]; // Added
    trustedContacts: TrustedContact[]; // Added
    securityAwarenessModules: SecurityAwarenessModule[]; // Added
    transactionRules: TransactionRule[]; // Added

    // --- Actions ---
    addTransaction: (transaction: Transaction) => void;
    updateBudget: (id: string, spent: number) => void;
    addBudget: (name: string, limit: number) => void;
    markNotificationRead: (id: string) => void;
    setGeminiApiKey: (key: string) => void;
    setModernTreasuryApiKey: (key: string) => void;
    setModernTreasuryOrganizationId: (id: string) => void;
    setMarqetaCredentials: (token: string, secret: string) => void;
    addFinancialGoal: (goalData: Omit<FinancialGoal, 'id' | 'currentAmount' | 'plan' | 'contributions' | 'recurringContributions' | 'linkedGoals' | 'status'>) => void;
    generateGoalPlan: (goalId: string) => Promise<void>;
    addContributionToGoal: (goalId: string, amount: number) => void;
    addRecurringContributionToGoal: (goalId: string, contribution: Omit<RecurringContribution, 'id'>) => void;
    updateRecurringContributionInGoal: (goalId: string, contributionId: string, updates: Partial<RecurringContribution>) => void;
    deleteRecurringContributionFromGoal: (goalId: string, contributionId: string) => void;
    updateFinancialGoal: (goalId: string, updates: Partial<FinancialGoal>) => void;
    linkGoals: (sourceGoalId: string, targetGoalId: string, relationshipType: LinkedGoal['relationshipType'], triggerAmount?: number) => void;
    unlinkGoals: (sourceGoalId: string, targetGoalId: string) => void;
    
    // --- Other ---
    impactData: { treesPlanted: number; progressToNextTree: number };
    gamification: GamificationState;
    rewardPoints: { balance: number; lastEarned: number; lastRedeemed: number; currency: string };
    creditFactors: any[];
    apiStatus: any[];
    
    // --- Legacy / Helpers ---
    handlePlaidSuccess: (publicToken: string, metadata: any) => void;
    isImportingData: boolean;
    userProfile: any;
    askSovereignAI: (prompt: string) => Promise<string>;
    broadcastEvent: (eventType: string, payload: any) => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- App State ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Navigation ---
    const [activeView, setActiveView] = useState<View>(View.Dashboard);

    // --- Financial Data State ---
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
    const [creditScore, setCreditScore] = useState<CreditScore>({ score: 0, change: 0, rating: '---' });
    const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
    const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
    const [marketMovers, setMarketMovers] = useState<MarketMover[]>([]);
    const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]); // Added
    
    // --- Corporate State ---
    const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [complianceCases, setComplianceCases] = useState<ComplianceCase[]>([]);
    const [corporateTransactions, setCorporateTransactions] = useState<CorporateTransaction[]>([]);
    
    // --- API Status ---
    const [apiStatus, setApiStatus] = useState<APIStatus[]>([]);
    
    // --- API Keys & Config ---
    const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(process.env.GEMINI_API_KEY || null);
    const [stripeApiKey, setStripeApiKey] = useState<string | null>(process.env.STRIPE_SECRET_KEY || null);
    const [plaidClientId] = useState<string | null>(process.env.PLAID_CLIENT_ID || null);
    const [plaidApiKey] = useState<string | null>(process.env.PLAID_SECRET || null);
    const [marqetaApiToken, setMarqetaApiToken] = useState<string | null>(null);
    const [marqetaApiSecret, setMarqetaApiSecret] = useState<string | null>(null);
    const [modernTreasuryApiKey, setModernTreasuryApiKey] = useState<string | null>(null);
    const [modernTreasuryOrgId, setModernTreasuryOrgId] = useState<string | null>(null);

    // --- Crypto State ---
    const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);
    const [walletInfo, setWalletInfo] = useState<any>(null);
    const [virtualCard, setVirtualCard] = useState<any>(null);
    const [nftAssets, setNftAssets] = useState<any[]>([]);
    const [detectedProviders, setDetectedProviders] = useState<any[]>([]);

    // --- Security State ---
    const [securityMetrics, setSecurityMetrics] = useState<SecurityScoreMetric[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
    const [dataSharingPolicies, setDataSharingPolicies] = useState<DataSharingPolicy[]>([]);
    const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
    const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
    const [securityAwarenessModules, setSecurityAwarenessModules] = useState<SecurityAwarenessModule[]>([]);
    const [transactionRules, setTransactionRules] = useState<TransactionRule[]>([]);

    // --- Marqeta State ---
    const [marqetaCardProducts, setMarqetaCardProducts] = useState<MarqetaCardProduct[]>([]);
    const [isMarqetaLoading, setIsMarqetaLoading] = useState(false);

    // --- Database Configuration ---
    const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        databaseName: process.env.DB_NAME || 'sovereign_bank',
        sslMode: 'require',
        connectionStatus: 'disconnected'
    });

    // --- Web Driver Status ---
    const [webDriverStatus, setWebDriverStatus] = useState<WebDriverStatus>({
        status: 'idle',
        activeTask: null,
        logs: []
    });
    
    const [isImportingData, setIsImportingData] = useState(false);

    // --- AI-Powered Mock Data Generation ---
    useEffect(() => {
        const generateInitialData = async () => {
            // NOTE: Even if API Key is present, we wrap in try/catch and use fallback
            // data if the AI service fails (e.g. 429 Quota Exceeded).
            
            // Fallback function to populate with static data
            const loadFallbackData = () => {
                console.warn("Using static fallback data for initialization.");
                setTransactions(MOCK_TRANSACTIONS);
                setAssets(MOCK_ASSETS);
                setBudgets(MOCK_BUDGETS);
                setCreditScore(MOCK_CREDIT_SCORE);
                setUpcomingBills(MOCK_UPCOMING_BILLS);
                setSavingsGoals(MOCK_SAVINGS_GOALS);
                setMarketMovers(MOCK_MARKET_MOVERS);
                setNotifications(MOCK_NOTIFICATIONS);
                setPaymentOrders(MOCK_PAYMENT_ORDERS);
                setInvoices(MOCK_INVOICES);
                setComplianceCases(MOCK_COMPLIANCE_CASES);
                setCorporateTransactions(MOCK_CORPORATE_TRANSACTIONS);
                setApiStatus(MOCK_API_STATUS);
                setSubscriptions(MOCK_SUBSCRIPTIONS);
                
                // Initialize default Financial Goals if not provided
                if (financialGoals.length === 0) {
                     setFinancialGoals([]);
                }
            };

            if (!geminiApiKey) {
                console.log("No Gemini API Key found. Loading fallback data.");
                loadFallbackData();
                initializeStaticData(); // Load other static data
                setIsLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                
                const mockDataSchema = {
                    type: Type.OBJECT,
                    properties: {
                        transactions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING }, type: { type: Type.STRING }, category: { type: Type.STRING },
                                    description: { type: Type.STRING }, amount: { type: Type.NUMBER }, date: { type: Type.STRING },
                                    carbonFootprint: { type: Type.NUMBER },
                                }
                            }
                        },
                        assets: {
                            type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER }, color: { type: Type.STRING }, performanceYTD: { type: Type.NUMBER } } }
                        },
                        budgets: {
                            type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, limit: { type: Type.NUMBER }, spent: { type: Type.NUMBER }, color: { type: Type.STRING } } }
                        },
                        creditScore: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, change: { type: Type.INTEGER }, rating: { type: Type.STRING } } },
                        upcomingBills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, amount: { type: Type.NUMBER }, dueDate: { type: Type.STRING } } } },
                        savingsGoals: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, target: { type: Type.NUMBER }, saved: { type: Type.NUMBER }, iconName: { type: Type.STRING } } } },
                        marketMovers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ticker: { type: Type.STRING }, name: { type: Type.STRING }, price: { type: Type.NUMBER }, change: { type: Type.NUMBER } } } },
                        financialGoals: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING }, name: { type: Type.STRING }, targetAmount: { type: Type.NUMBER }, targetDate: { type: Type.STRING },
                                    currentAmount: { type: Type.NUMBER }, iconName: { type: Type.STRING }, startDate: { type: Type.STRING }, status: { type: Type.STRING }
                                }
                            }
                        },
                        notifications: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, message: { type: Type.STRING }, timestamp: { type: Type.STRING }, read: { type: Type.BOOLEAN }, view: { type: Type.STRING } } } },
                        apiStatus: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { provider: { type: Type.STRING }, status: { type: Type.STRING }, responseTime: { type: Type.NUMBER } } } },
                        paymentOrders: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, counterpartyName: { type: Type.STRING }, amount: { type: Type.NUMBER }, currency: { type: Type.STRING }, direction: { type: Type.STRING }, status: { type: Type.STRING }, date: { type: Type.STRING }, type: { type: Type.STRING } } } },
                        invoices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, invoiceNumber: { type: Type.STRING }, counterpartyName: { type: Type.STRING }, dueDate: { type: Type.STRING }, amount: { type: Type.NUMBER }, status: { type: Type.STRING } } } },
                        complianceCases: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, reason: { type: Type.STRING }, entityType: { type: Type.STRING }, entityId: { type: Type.STRING }, status: { type: Type.STRING }, openedDate: { type: Type.STRING } } } },
                        corporateTransactions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, cardId: { type: Type.STRING }, holderName: { type: Type.STRING }, merchant: { type: Type.STRING }, amount: { type: Type.NUMBER }, status: { type: Type.STRING }, timestamp: { type: Type.STRING }, date: { type: Type.STRING } } } },
                        subscriptions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, amount: { type: Type.NUMBER }, nextPayment: { type: Type.STRING }, iconName: { type: Type.STRING } } } }, // Added
                    }
                };

                const prompt = `Generate a cohesive and realistic set of mock financial data for a visionary fintech user named "James B. O'Callaghan III". The data should populate a next-generation banking dashboard. It should reflect the activities of a high-net-worth, tech-savvy individual involved in personal finance, investments, and corporate treasury operations. The data must be internally consistent (e.g., transaction amounts relate to budget spending) and adhere strictly to the provided JSON schema. Generate a rich and interesting dataset including about 15 transactions over the last few months, 4 asset classes, 4 budget categories, a few financial goals, some corporate transactions, and other relevant data points to create a compelling demo.`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: mockDataSchema
                    }
                });

                const data = JSON.parse(response.text);

                // Set all states from the AI response
                setTransactions(data.transactions || []);
                setAssets(data.assets || []);
                setBudgets(data.budgets || []);
                setCreditScore(data.creditScore || { score: 780, change: 5, rating: 'Excellent' });
                setUpcomingBills(data.upcomingBills || []);
                setSavingsGoals(data.savingsGoals || []);
                setFinancialGoals((data.financialGoals || []).map((g: any) => ({...g, plan: null, contributions: [], recurringContributions: [], linkedGoals: []})));
                setMarketMovers(data.marketMovers || []);
                setNotifications(data.notifications || []);
                setPaymentOrders(data.paymentOrders || []);
                setInvoices(data.invoices || []);
                setComplianceCases(data.complianceCases || []);
                setCorporateTransactions(data.corporateTransactions || []);
                setApiStatus(data.apiStatus || []);
                setSubscriptions(data.subscriptions || []); // Added
                
                initializeStaticData();

            } catch (e) {
                console.error("Failed to generate initial mock data via AI:", e);
                // Fallback to static data on error (e.g., quota exceeded)
                loadFallbackData();
                initializeStaticData();
            } finally {
                setIsLoading(false);
            }
        };
        
        const initializeStaticData = () => {
             // Initialize mock security data
             setSecurityMetrics([{ metricName: 'OverallSecurityScore', currentValue: '0.85' }]);
             setAuditLogs([{ id: 'log-1', timestamp: new Date().toISOString(), userId: 'user-1', action: 'LOGIN', targetResource: 'System', success: true }]);
             setThreatAlerts([]);
             setDataSharingPolicies([{ policyId: 'pol-1', policyName: 'Default Privacy', scope: 'Global', isActive: true, lastReviewed: new Date().toISOString() }]);
             setApiKeys([{ id: 'key-1', keyName: 'Default Key', creationDate: new Date().toISOString(), scopes: ['read'] }]);
             setTrustedContacts([]);
             setSecurityAwarenessModules([]);
             setTransactionRules([]);

             // Initialize mock crypto data
             setCryptoAssets([{ ticker: 'BTC', name: 'Bitcoin', value: 45000, amount: 1.5, color: '#F7931A' }]);
             setNftAssets([]);
             setWalletInfo({ balance: 1.5, address: '0x123...abc' });
        }

        generateInitialData();
    }, [geminiApiKey]);


    // --- Database Logic ---
    const updateDbConfig = useCallback((config: Partial<DatabaseConfig>) => {
        setDbConfig(prev => ({ ...prev, ...config }));
    }, []);

    const connectDatabase = useCallback(async () => {
        setDbConfig(prev => ({ ...prev, connectionStatus: 'connecting' }));
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const isSuccess = Math.random() > 0.1; 
            if (isSuccess) {
                setDbConfig(prev => ({ ...prev, connectionStatus: 'connected' }));
            } else {
                throw new Error("Connection timeout");
            }
        } catch (e) {
            setDbConfig(prev => ({ ...prev, connectionStatus: 'error' }));
        }
    }, []);

    // --- Web Driver Logic ---
    const launchWebDriver = useCallback(async (taskName: string) => {
        setWebDriverStatus({ status: 'running', activeTask: taskName, logs: [`Initializing WebDriver for task: ${taskName}...`] });
        const steps = ["Launching browser...", "Navigating...", "Injecting tokens...", "Scraping data...", "Standardizing format...", "Closing session."];
        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 1200));
            setWebDriverStatus(prev => ({ ...prev, logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${step}`] }));
        }
        setWebDriverStatus(prev => ({ ...prev, status: 'completed', logs: [...prev.logs, "Task completed successfully."] }));
        setTimeout(() => setWebDriverStatus(prev => ({ ...prev, status: 'idle', activeTask: null })), 5000);
    }, []);

    // --- Actions ---
    const addTransaction = (transaction: Transaction) => setTransactions(prev => [transaction, ...prev]);
    const updateBudget = (id: string, spent: number) => setBudgets(prev => prev.map(b => b.id === id ? { ...b, spent } : b));
    const addBudget = (name: string, limit: number) => setBudgets(prev => [...prev, { id: uuidv4(), name, limit, spent: 0, color: '#3b82f6' }]);
    const markNotificationRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    const handlePlaidSuccess = (publicToken: string, metadata: any) => {
        setIsImportingData(true);
        setTimeout(() => {
            setLinkedAccounts(prev => [...prev, { id: metadata.institution.institution_id, name: metadata.institution.name, mask: '****', type: 'linked' }]);
            setIsImportingData(false);
            setTransactions(prev => [...prev, { id: `new-${Date.now()}`, type: 'expense', category: 'Transfer', description: `Import from ${metadata.institution.name}`, amount: 0, date: new Date().toISOString().split('T')[0] }]);
        }, 3000);
    };

    const setGeminiApiKey = (key: string) => setGeminiApiKeyState(key);
    const setMarqetaCredentials = (token: string, secret: string) => { setMarqetaApiToken(token); setMarqetaApiSecret(secret); };

    const askSovereignAI = async (prompt: string): Promise<string> => {
        if (!geminiApiKey) return "AI Offline. Please configure API Key.";
        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            return response.text;
        } catch (e) {
            console.error("AI Processing Error:", e);
            return "AI Processing Error.";
        }
    };
    
    const addFinancialGoal = (goalData: Omit<FinancialGoal, 'id' | 'currentAmount' | 'plan' | 'contributions' | 'recurringContributions' | 'linkedGoals' | 'status'>) => {
        const newGoal: FinancialGoal = { ...goalData, id: uuidv4(), currentAmount: 0, plan: null, contributions: [], recurringContributions: [], linkedGoals: [], status: 'on_track' };
        setFinancialGoals(prev => [...prev, newGoal]);
    };

    const updateFinancialGoal = (goalId: string, updates: Partial<FinancialGoal>) => setFinancialGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));

    const generateGoalPlan = async (goalId: string) => {
        const goal = financialGoals.find(g => g.id === goalId);
        if (!goal || !geminiApiKey) return;
        const prompt = `Based on the financial goal "${goal.name}" to save $${goal.targetAmount} by ${goal.targetDate}, create a concise, actionable plan. Current amount is $${goal.currentAmount}. Provide a JSON response with: "summary" (string), "monthlyContribution" (number), and "actionableSteps" (array of 3 strings).`;
        try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
            const planData = JSON.parse(response.text);
            const newPlan: AIGoalPlan = {
                summary: planData.summary, monthlyContribution: planData.monthlyContribution, actionableSteps: planData.actionableSteps,
                feasibilitySummary: '', steps: planData.actionableSteps.map((step: string) => ({ title: step.split(' ')[0], description: step, category: 'General' }))
            };
            updateFinancialGoal(goalId, { plan: newPlan });
        } catch (error) {
            console.error("Error generating goal plan:", error);
            updateFinancialGoal(goalId, { plan: { summary: "Error generating plan.", monthlyContribution: 0, actionableSteps: [], feasibilitySummary: '', steps: [] } });
        }
    };
    
    const addContributionToGoal = (goalId: string, amount: number) => {
        const newContribution: Contribution = { id: uuidv4(), amount, date: new Date().toISOString().split('T')[0], type: 'manual' };
        setFinancialGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount, contributions: [newContribution, ...g.contributions] } : g));
    };

    const addRecurringContributionToGoal = (goalId: string, contribution: Omit<RecurringContribution, 'id'>) => {
        const newRecurring: RecurringContribution = { ...contribution, id: uuidv4() };
        setFinancialGoals(prev => prev.map(g => g.id === goalId ? { ...g, recurringContributions: [...(g.recurringContributions || []), newRecurring] } : g));
    };
    
    const updateRecurringContributionInGoal = (goalId: string, contributionId: string, updates: Partial<RecurringContribution>) => {
        setFinancialGoals(prev => prev.map(g => g.id !== goalId ? g : { ...g, recurringContributions: (g.recurringContributions || []).map(rc => rc.id === contributionId ? { ...rc, ...updates } : rc) }));
    };
    
    const deleteRecurringContributionFromGoal = (goalId: string, contributionId: string) => {
         setFinancialGoals(prev => prev.map(g => g.id !== goalId ? g : { ...g, recurringContributions: (g.recurringContributions || []).filter(rc => rc.id !== contributionId) }));
    };
    
    const linkGoals = (sourceGoalId: string, targetGoalId: string, relationshipType: LinkedGoal['relationshipType'], triggerAmount?: number) => {
        const newLink: LinkedGoal = { id: targetGoalId, relationshipType, triggerAmount };
        setFinancialGoals(prev => prev.map(g => g.id === sourceGoalId ? { ...g, linkedGoals: [...(g.linkedGoals || []), newLink] } : g));
    };
    
    const unlinkGoals = (sourceGoalId: string, targetGoalId: string) => {
        setFinancialGoals(prev => prev.map(g => g.id === sourceGoalId ? { ...g, linkedGoals: (g.linkedGoals || []).filter(l => l.id !== targetGoalId) } : g));
    };

    const broadcastEvent = (eventType: string, payload: any) => console.log(`[EventBus] ${eventType}:`, payload);

    // --- Crypto Mock Actions ---
    const connectWallet = (provider: any) => { console.log("Connected wallet", provider); setWalletInfo({ address: '0x123...', balance: 10 }); };
    const disconnectWallet = () => { setWalletInfo(null); };
    const issueCard = () => { setVirtualCard({ cardNumber: '4242 4242 4242 4242', holderName: 'J. Doe', expiry: '12/25' }); };
    const buyCrypto = (amount: number, currency: string) => { console.log(`Bought ${amount} ${currency}`); };

    // --- Security Mock Actions ---
    const showSystemAlert = (message: string, type: string) => console.log(`ALERT [${type}]: ${message}`);
    const unlinkAccount = (id: string) => setLinkedAccounts(prev => prev.filter(a => a.id !== id));
    
    // --- Marqeta Mock Actions ---
    const fetchMarqetaProducts = () => {
        setIsMarqetaLoading(true);
        setTimeout(() => {
            setMarqetaCardProducts([
                { token: 'mq_1', name: 'Standard Debit', active: true, start_date: '2023-01-01', config: { fulfillment: { bin_prefix: '123456', fulfillment_provider: 'arrow', payment_instrument: 'physical' }, poi: { other: { allow: true } }, jit_funding: { program_funding_source: { enabled: true } } } },
                { token: 'mq_2', name: 'Virtual Rewards', active: true, start_date: '2023-05-01', config: { fulfillment: { bin_prefix: '654321', fulfillment_provider: 'virtual', payment_instrument: 'virtual' }, poi: { other: { allow: false } }, jit_funding: { program_funding_source: { enabled: true } } } },
            ]);
            setIsMarqetaLoading(false);
        }, 1000);
    };


    const contextValue: DataContextType = {
        isLoading,
        error,
        activeView,
        setActiveView,
        transactions,
        assets,
        budgets,
        creditScore,
        upcomingBills,
        savingsGoals,
        financialGoals,
        marketMovers,
        linkedAccounts,
        notifications,
        subscriptions,
        paymentOrders,
        invoices,
        complianceCases,
        corporateTransactions,
        plaidApiKey,
        plaidClientId,
        stripeApiKey,
        geminiApiKey,
        marqetaApiToken,
        marqetaApiSecret,
        modernTreasuryApiKey,
        modernTreasuryOrganizationId: modernTreasuryOrgId,
        dbConfig,
        updateDbConfig,
        connectDatabase,
        webDriverStatus,
        launchWebDriver,
        addTransaction,
        updateBudget,
        addBudget,
        markNotificationRead,
        setGeminiApiKey,
        setModernTreasuryApiKey,
        setModernTreasuryOrganizationId: setModernTreasuryOrgId,
        setMarqetaCredentials,
        addFinancialGoal,
        generateGoalPlan,
        addContributionToGoal,
        addRecurringContributionToGoal,
        updateRecurringContributionInGoal,
        deleteRecurringContributionFromGoal,
        updateFinancialGoal,
        linkGoals,
        unlinkGoals,
        impactData: { treesPlanted: 124, progressToNextTree: 65 },
        gamification: { score: 1250, level: 5, levelName: "Financial Architect", progress: 45, credits: 500 },
        rewardPoints: { balance: 45200, lastEarned: 150, lastRedeemed: 0, currency: "PTS" },
        creditFactors: [{ name: "Payment History", status: 'Good', description: "On time" }, { name: "Utilization", status: 'Excellent', description: "Low usage" }],
        apiStatus,
        handlePlaidSuccess,
        isImportingData,
        userProfile: { name: "James B. O'Callaghan III", email: "visionary@idgaf.ai" },
        askSovereignAI,
        broadcastEvent,
        
        // Crypto
        cryptoAssets,
        walletInfo,
        virtualCard,
        nftAssets,
        connectWallet,
        disconnectWallet,
        detectedProviders,
        issueCard,
        buyCrypto,

        // Security
        showSystemAlert,
        unlinkAccount,
        securityMetrics,
        auditLogs,
        threatAlerts,
        dataSharingPolicies,
        apiKeys,
        trustedContacts,
        securityAwarenessModules,
        transactionRules,

        // Marqeta
        marqetaCardProducts,
        fetchMarqetaProducts,
        isMarqetaLoading
    };

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};
