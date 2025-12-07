
import React, { createContext, useState, ReactNode, useCallback, useEffect, useContext } from 'react';
import { User as BaseUser } from '../types';
import { db, UserRecord } from '../lib/SovereignDatabase';

// Expanded Roles and Security Tiers for a Hyper-Complex System
export type UserRole = 'ADMIN' | 'TRADER' | 'CLIENT' | 'CARETAKER' | 'QUANT_ANALYST' | 'SYSTEM_ARCHITECT' | 'ETHICS_OFFICER' | 'DATA_SCIENTIST' | 'NETWORK_WEAVER' | 'CITIZEN';
export type SecurityLevel = 'STANDARD' | 'ELEVATED' | 'TRADING_UNLOCKED' | 'QUANTUM_ENCRYPTED' | 'SOVEREIGN_CLEARED' | 'ARCHITECT_LEVEL';
export type NeuralSyncStatus = 'OFFLINE' | 'SYNCHRONIZING' | 'ACTIVE_STABLE' | 'DEGRADED' | 'CALIBRATING';
export type CitizenshipStatus = 'NEXUS_SOVEREIGN' | 'TERRAN_AFFILIATE' | 'OUTER_COLONIES_REP' | 'TRANSIENT';

export interface CognitiveProfile {
    cognitiveId: string;
    fluidIntelligenceQuotient: number; 
    cognitiveBiasCorrectionLevel: number; 
    patternRecognitionSpeedMs: number;
    ethicalFrameworkAlignment: 'UTILITARIAN' | 'DEONTOLOGICAL' | 'VIRTUE_ETHICS' | 'BALANCED_CONSENSUS';
    lastCalibrationTimestamp: string;
}

export interface QuantumEntanglementLink {
    pairId: string;
    status: 'STABLE' | 'DECOHERING' | 'ENTANGLED' | 'AWAITING_PAIR';
    peerNodeId: string | null;
    lastHeartbeat: string;
    qbitErrorRate: number;
}

export interface TradingProfile {
    profileId: string;
    riskAppetite: 'LOW' | 'MEDIUM' | 'HIGH' | 'AGGRESSIVE' | 'CALCULATED_MAXIMALIST' | 'ZEN_MINIMALIST';
    authorizedMarkets: ('NASDAQ' | 'NYSE' | 'CRYPTO' | 'FOREX' | 'INTERDIMENSIONAL_DERIVATIVES' | 'NEURAL_FUTURES' | 'CARBON_CREDITS_V2')[];
    hftAlgorithmId: string | null;
    temporalRiskTolerance: 'PICOSECONDS' | 'NANOSECONDS' | 'MILLISECONDS' | 'SECONDS';
    subscribedCognitiveFeeds: string[]; 
    quantumEntanglementPairId: string | null;
}

export interface User extends BaseUser {
    roles: UserRole[];
    securityLevel: SecurityLevel;
    tradingProfile?: TradingProfile;
    biometricHashV2?: string;
    genomicSignatureId?: string;
    citizenship?: CitizenshipStatus;
    reputationScore?: number; 
    threatVectorIndex?: number; 
    neuralLaceSyncStatus?: NeuralSyncStatus;
    cognitiveProfileId?: string;
    activeThoughtStreamId?: string | null;
    lastLoginCoordinates?: { lat: number, lon: number, alt: number, dimension: string };
    temporalAnchorId?: string;
    activeSovereignAgentIds?: string[];
    permissionsGridHash?: string;
}

export interface TradingSession {
    status: 'INACTIVE' | 'CONNECTING' | 'ACTIVE' | 'DISCONNECTED' | 'SYNCHRONIZING_CHRONONS' | 'AWAITING_SOVEREIGN_CONSENSUS';
    latencyMs: number;
    marketDataFeedId: string | null;
    activeAlgorithm: string | null;
    quantumLinkStatus: 'STABLE' | 'DECOHERING' | 'ENTANGLED';
    currentRealityDrift: number; 
    sovereignAIOverrideActive: boolean;
    activeCognitiveModel: string;
    predictedTimelineCount: number;
    causalityInferenceEngineId: string;
    sessionStartEpoch: number;
    dataThroughputGbps: number;
    activeMarketSimulations: number;
    complianceCheckHash: string;
}

export interface NexusSystemStatus {
    globalMarketSentiment: number; 
    sovereignAIHealth: 'OPTIMAL' | 'DEGRADED' | 'SELF_HEALING';
    networkThreatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMINENT';
    activeUserNodes: number;
    qNetGlobalBandwidth: number; 
}

interface IAuthContext {
    isAuthenticated: boolean;
    user: User | null;
    sessionToken: string | null;
    isLoading: boolean;
    error: string | null;
    profileData: string;
    tradingSession: TradingSession;
    nexusStatus: NexusSystemStatus;
    cognitiveProfile: CognitiveProfile | null;
    quantumLink: QuantumEntanglementLink | null;

    loginWithCredentials: (email: string, pass: string) => Promise<boolean>;
    loginWithBiometrics: () => Promise<boolean>;
    logout: () => Promise<void>;
    elevateSessionForTrading: (twoFactorCode: string) => Promise<boolean>;
    refreshSession: () => Promise<void>;
    connectToTradingEngine: () => Promise<void>;
    disconnectFromTradingEngine: () => void;
    calibrateNeuralLace: () => Promise<boolean>;
    updateEthicalFramework: (framework: CognitiveProfile['ethicalFrameworkAlignment']) => Promise<void>;
    initiateQuantumTunnel: (peerNodeId: string) => Promise<boolean>;
    severQuantumLink: () => Promise<void>;
    deploySovereignAgent: (config: object) => Promise<string>;
    queryCausalityEngine: (query: string) => Promise<object>;
    requestEthicalOverride: (justification: string) => Promise<boolean>;
}

export const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const initialTradingSession: TradingSession = {
    status: 'INACTIVE',
    latencyMs: 0,
    marketDataFeedId: null,
    activeAlgorithm: null,
    quantumLinkStatus: 'DECOHERING',
    currentRealityDrift: 0,
    sovereignAIOverrideActive: false,
    activeCognitiveModel: 'base-human-heuristic-v1',
    predictedTimelineCount: 0,
    causalityInferenceEngineId: 'cie-standard-logic',
    sessionStartEpoch: 0,
    dataThroughputGbps: 0,
    activeMarketSimulations: 0,
    complianceCheckHash: '0x0',
};

const initialNexusStatus: NexusSystemStatus = {
    globalMarketSentiment: 0.2,
    sovereignAIHealth: 'OPTIMAL',
    networkThreatLevel: 'LOW',
    activeUserNodes: 1,
    qNetGlobalBandwidth: 999999,
};

const initialCognitiveProfile: CognitiveProfile = {
    cognitiveId: 'cp-v-jbo3',
    fluidIntelligenceQuotient: 185,
    cognitiveBiasCorrectionLevel: 0.98,
    patternRecognitionSpeedMs: 5,
    ethicalFrameworkAlignment: 'BALANCED_CONSENSUS',
    lastCalibrationTimestamp: new Date().toISOString(),
};

const initialQuantumLink: QuantumEntanglementLink = {
    pairId: 'qe-pair-001-alpha',
    status: 'AWAITING_PAIR',
    peerNodeId: null,
    lastHeartbeat: new Date().toISOString(),
    qbitErrorRate: 0.001,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [user, setUser] = useState<User | null>(null);
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [tradingSession, setTradingSession] = useState<TradingSession>(initialTradingSession);
    const [nexusStatus, setNexusStatus] = useState<NexusSystemStatus>(initialNexusStatus);
    const [cognitiveProfile, setCognitiveProfile] = useState<CognitiveProfile | null>(null);
    const [quantumLink, setQuantumLink] = useState<QuantumEntanglementLink | null>(null);

    // Helper to transform DB user to Context User
    const mapDbUserToContextUser = (dbUser: UserRecord): User => {
        return {
            id: dbUser.id,
            name: dbUser.name || 'Anonymous',
            email: dbUser.email,
            roles: [dbUser.role as UserRole],
            securityLevel: dbUser.clearanceLevel >= 5 ? 'ARCHITECT_LEVEL' : 'STANDARD',
            picture: `https://i.pravatar.cc/150?u=${dbUser.id}`,
            // Add default expanded properties
            biometricHashV2: '0x...',
            genomicSignatureId: 'gs-...',
            citizenship: 'NEXUS_SOVEREIGN',
            reputationScore: 100,
            threatVectorIndex: 0,
            neuralLaceSyncStatus: 'OFFLINE',
            cognitiveProfileId: 'cp-new',
            activeThoughtStreamId: null,
            lastLoginCoordinates: { lat: 0, lon: 0, alt: 0, dimension: 'baseline' },
            temporalAnchorId: 'ta-init',
            activeSovereignAgentIds: [],
            permissionsGridHash: '0x000',
        };
    };

    // Rehydrate
    useEffect(() => {
        const rehydrateSession = async () => {
            try {
                const storedToken = localStorage.getItem('sessionToken');
                const storedUserId = localStorage.getItem('userId');
                
                if (storedToken && storedUserId) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const dbUser = db.getUser(storedUserId);

                    if (dbUser) {
                        setSessionToken(storedToken);
                        setUser(mapDbUserToContextUser(dbUser));
                        setCognitiveProfile(initialCognitiveProfile);
                        setQuantumLink(initialQuantumLink);
                    } else {
                        // Token invalid or user deleted
                        localStorage.removeItem('sessionToken');
                        localStorage.removeItem('userId');
                    }
                }
            } catch (e) {
                console.error("Session rehydration failed", e);
                setError("Failed to restore session.");
            } finally {
                setIsLoading(false);
            }
        };
        rehydrateSession();
    }, []);

    const loginWithCredentials = useCallback(async (email: string, pass: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        return new Promise((resolve) => {
            setTimeout(() => {
                const dbUser = db.authenticateUser(email, pass);
                if (dbUser) {
                    const newSessionToken = `token-${Date.now()}-${Math.random()}`;
                    setSessionToken(newSessionToken);
                    setUser(mapDbUserToContextUser(dbUser));
                    setCognitiveProfile(initialCognitiveProfile);
                    setQuantumLink(initialQuantumLink);
                    localStorage.setItem('sessionToken', newSessionToken);
                    localStorage.setItem('userId', dbUser.id);
                    setIsLoading(false);
                    resolve(true);
                } else {
                    setError("Invalid credentials. Please try again.");
                    setIsLoading(false);
                    resolve(false);
                }
            }, 800);
        });
    }, []);

    const loginWithBiometrics = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        console.log("Initiating biometric scan...");
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate biometric success - usually maps to a stored token or known user
                // For simulation, we log in as the default admin if biometrics pass
                const dbUser = db.authenticateUser('visionary@sovereign-ai-nexus.io', 'password');
                
                if (dbUser) {
                    db.logEvent('LOGIN_SUCCESS', dbUser.id, { method: 'BIOMETRIC' });
                    const newSessionToken = `biometric-token-${Date.now()}`;
                    setSessionToken(newSessionToken);
                    setUser(mapDbUserToContextUser(dbUser));
                    setCognitiveProfile(initialCognitiveProfile);
                    setQuantumLink(initialQuantumLink);
                    localStorage.setItem('sessionToken', newSessionToken);
                    localStorage.setItem('userId', dbUser.id);
                    setIsLoading(false);
                    resolve(true);
                } else {
                    // Fallback if main admin deleted
                    setIsLoading(false);
                    resolve(false);
                }
            }, 1500);
        });
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        if (user) {
            db.logEvent('LOGOUT', user.id);
        }
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setUser(null);
        setSessionToken(null);
        setTradingSession(initialTradingSession);
        setCognitiveProfile(null);
        setQuantumLink(null);
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userId');
        setIsLoading(false);
    }, [user]);

    const elevateSessionForTrading = useCallback(async (twoFactorCode: string): Promise<boolean> => {
        if (!user) return false;
        setIsLoading(true);
        return new Promise((resolve) => {
            setTimeout(() => {
                if (twoFactorCode === '123456') {
                    db.logEvent('SECURITY_BREACH', user.id, { note: 'Trading Session Unlocked (Simulated)' }); 
                    setUser(prevUser => prevUser ? { ...prevUser, securityLevel: 'TRADING_UNLOCKED' } : null);
                    setIsLoading(false);
                    resolve(true);
                } else {
                    setIsLoading(false);
                    resolve(false);
                }
            }, 750);
        });
    }, [user]);

    const refreshSession = useCallback(async (): Promise<void> => {
       console.log("Session refresh initiated...");
       await new Promise(resolve => setTimeout(resolve, 600));
       setNexusStatus(prev => ({ ...prev, globalMarketSentiment: Math.random() * 2 - 1 }));
    }, []);

    const connectToTradingEngine = useCallback(async (): Promise<void> => {
        if (user?.securityLevel !== 'TRADING_UNLOCKED' && user?.securityLevel !== 'ARCHITECT_LEVEL') {
            setError("Security level insufficient for HFT engine connection.");
            return;
        }
        setTradingSession(prev => ({ ...prev, status: 'CONNECTING' }));
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTradingSession({
            status: 'ACTIVE',
            latencyMs: 3,
            marketDataFeedId: 'feed-lmax-prime-nyc',
            activeAlgorithm: 'algo-quantum-momentum-v3',
            quantumLinkStatus: 'ENTANGLED',
            currentRealityDrift: Math.random() * 10,
            sovereignAIOverrideActive: false,
            activeCognitiveModel: 'sovereign-predictive-alpha-v7',
            predictedTimelineCount: 1024,
            causalityInferenceEngineId: 'cie-quantum-logic-v2',
            sessionStartEpoch: Date.now(),
            dataThroughputGbps: 400,
            activeMarketSimulations: 50,
            complianceCheckHash: `0x${Date.now().toString(16)}`,
        });
    }, [user]);

    const disconnectFromTradingEngine = useCallback(() => {
        setTradingSession(prev => ({ ...prev, status: 'DISCONNECTED' }));
    }, []);

    const calibrateNeuralLace = useCallback(async (): Promise<boolean> => { return true; }, []);
    const updateEthicalFramework = useCallback(async (framework: CognitiveProfile['ethicalFrameworkAlignment']): Promise<void> => {}, []);
    const initiateQuantumTunnel = useCallback(async (peerNodeId: string): Promise<boolean> => { return true; }, []);
    const severQuantumLink = useCallback(async (): Promise<void> => {}, []);
    const deploySovereignAgent = useCallback(async (config: object): Promise<string> => { return "agent_id"; }, []);
    const queryCausalityEngine = useCallback(async (query: string): Promise<object> => { return {}; }, []);
    const requestEthicalOverride = useCallback(async (justification: string): Promise<boolean> => { return false; }, []);

    const profileData = `Profile Data Loaded`;

    const isAuthenticated = !!sessionToken && !!user;

    const value = {
        isAuthenticated,
        user,
        sessionToken,
        isLoading,
        error,
        profileData,
        tradingSession,
        nexusStatus,
        cognitiveProfile,
        quantumLink,
        loginWithCredentials,
        loginWithBiometrics,
        logout,
        elevateSessionForTrading,
        refreshSession,
        connectToTradingEngine,
        disconnectFromTradingEngine,
        calibrateNeuralLace,
        updateEthicalFramework,
        initiateQuantumTunnel,
        severQuantumLink,
        deploySovereignAgent,
        queryCausalityEngine,
        requestEthicalOverride,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
