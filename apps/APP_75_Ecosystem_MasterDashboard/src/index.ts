/*
 * Copyright (c) 2024, The Autonomous Systems Architect Foundation.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * DISCLAIMER: This software is provided for architectural demonstration purposes only.
 * It is not intended for production use without extensive review and modification.
 * No guarantees, warranties, or predictions are made about its performance or suitability
 * for any specific purpose. Use at your own risk.
 */

import React, { useState, useEffect, useMemo, useCallback, createContext, useContext, useReducer, useRef, CSSProperties } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';

// ==================================================================================
// AGENT METADATA (Machine-Readable Block)
// ==================================================================================
const agent_metadata = {
  purpose: "Provides a unified, real-time, and interactive master dashboard for the entire 75-app ecosystem. It serves as the primary user interface for monitoring, managing, and introspecting the platform's health, cost, performance, and compliance.",
  dependencies: [
    "APP_01_Inference_CostRouter_API",
    "APP_14_Agents_MultiModelOrchestrator_API",
    "APP_37_Governance_AuditTrailEngine_API",
    "APP_42_Billing_UsageAccountant_API",
    "APP_61_Observability_MetricsCollector_API",
    "SHARED_CORE_SDK",
    "SHARED_AUTH_SERVICE"
  ],
  invalidation_conditions: [
    "Major breaking changes in the core SDK's API client.",
    "Deprecation of critical backend APIs from dependent applications.",
    "Failure of the shared authentication service.",
    "Significant drift in the unified ontology, leading to data contract mismatches."
  ],
  adjacent_apps: [
    "APP_61_Observability_MetricsCollector",
    "APP_58_Narrative_ModelExplainabilityUI",
    "APP_37_Governance_AuditTrailEngine",
    "APP_42_Billing_UsageAccountant"
  ]
};

// ==================================================================================
// CORE TYPES (from shared SDK and unified ontology)
// ==================================================================================

type AppID = `APP_${string}`;
type UserID = `user_${string}`;
type TenantID = `tenant_${string}`;
type RequestID = `req_${string}`;
type ModelProvider = 'OpenAI' | 'Anthropic' | 'Google' | 'Mistral' | 'Meta' | 'HuggingFace' | 'Bedrock' | 'AzureAI' | 'Custom';
type AppStatus = 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE' | 'OUTAGE';
type AuditEventAction = 'DATA_ACCESS' | 'POLICY_CHANGE' | 'USER_LOGIN' | 'MODEL_INVOCATION' | 'AGENT_SPAWN';
type Currency = 'USD';

interface AppManifest {
  id: AppID;
  name: string;
  domain: string;
  function: string;
  version: string;
  status: AppStatus;
  endpoints: {
    api: string;
    introspect: string;
    assumptions: string;
    failureModes: string;
  };
}

interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
}

interface AppMetrics {
  appId: AppID;
  cpuUsage: TimeSeriesDataPoint[];
  memoryUsage: TimeSeriesDataPoint[];
  apiLatencyP95: TimeSeriesDataPoint[];
  errorRate: TimeSeriesDataPoint[];
  requestsPerMinute: TimeSeriesDataPoint[];
}

interface CostRecord {
  timestamp: number;
  requestId: RequestID;
  appId: AppID;
  userId: UserID;
  tenantId: TenantID;
  provider: ModelProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  computeMs: number;
  cost: number; // in currency
  currency: Currency;
}

interface RevenueRecord {
  timestamp: number;
  transactionId: string;
  appId: AppID;
  tenantId: TenantID;
  amount: number;
  currency: Currency;
  product: string;
}

interface AuditEvent {
  id: string;
  timestamp: number;
  appId: AppID;
  userId: UserID;
  action: AuditEventAction;
  entity: string;
  details: Record<string, any>;
  jurisdiction: string;
  policyEvaluation: 'PASS' | 'FAIL' | 'WARN';
}

interface AgentState {
  agentId: string;
  appId: AppID;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR' | 'AWAITING_TOOL';
  task: string;
  startTime: number;
  lastUpdateTime: number;
  toolCalls: number;
  modelInvocations: number;
}

interface ModelRoutingDecision {
  requestId: RequestID;
  timestamp: number;
  promptHash: string;
  inputPayload: any;
  decision: {
    provider: ModelProvider;
    model: string;
    reason: 'COST' | 'LATENCY' | 'QUALITY' | 'COMPLIANCE' | 'CAPABILITY';
    latencyMs: number;
    cost: number;
  };
  alternatives: {
    provider: ModelProvider;
    model: string;
    estimatedCost: number;
    estimatedLatency: number;
    rejectionReason?: string;
  }[];
}

interface IntrospectionData {
  purpose: string;
  dependencies: string[];
  invalidation_conditions: string[];
  adjacent_apps: string[];
  architecture: {
    pattern: string;
    components: { name: string, responsibility: string }[];
  };
  revenue_surface: string[];
  cost_drivers: string[];
}

interface FailureMode {
  name: string;
  description: string;
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigations: string[];
}

// ==================================================================================
// MOCK API CLIENT & DATA GENERATION
// ==================================================================================

const APP_DOMAINS = [
  'Inference', 'Agents', 'Governance', 'Narrative', 'Cost', 'Data', 'Evaluation',
  'Memory', 'Tooling', 'Orchestration', 'Compliance', 'Security', 'Marketplace'
];

const MOCK_APPS: AppManifest[] = Array.from({ length: 75 }, (_, i) => {
  const domain = APP_DOMAINS[i % APP_DOMAINS.length];
  const id = `APP_${String(i + 1).padStart(2, '0')}_${domain}_Function${i + 1}` as AppID;
  return {
    id,
    name: `${domain} Function ${i + 1}`,
    domain,
    function: `Function${i + 1}`,
    version: `1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
    status: (['OPERATIONAL', 'DEGRADED', 'MAINTENANCE', 'OUTAGE'] as AppStatus[])[Math.floor(Math.random() * 4)],
    endpoints: {
      api: `/api/${id}`,
      introspect: `/api/${id}/introspect`,
      assumptions: `/api/${id}/assumptions`,
      failureModes: `/api/${id}/failure-modes`,
    }
  };
});

const generateTimeSeries = (points: number, startValue: number, volatility: number): TimeSeriesDataPoint[] => {
  const now = Date.now();
  let value = startValue;
  return Array.from({ length: points }, (_, i) => {
    value += (Math.random() - 0.5) * volatility;
    value = Math.max(0, value);
    return { timestamp: now - (points - i) * 60 * 1000, value };
  });
};

const mockApi = {
  getAppManifests: async (): Promise<AppManifest[]> => {
    await new Promise(res => setTimeout(res, 200));
    // Simulate some apps changing status
    return MOCK_APPS.map(app => ({
      ...app,
      status: Math.random() < 0.95 ? 'OPERATIONAL' : (['DEGRADED', 'OUTAGE'] as AppStatus[])[Math.floor(Math.random() * 2)]
    }));
  },
  getAppMetrics: async (appId: AppID): Promise<AppMetrics> => {
    await new Promise(res => setTimeout(res, 150));
    return {
      appId,
      cpuUsage: generateTimeSeries(60, 40, 5),
      memoryUsage: generateTimeSeries(60, 60, 8),
      apiLatencyP95: generateTimeSeries(60, 150, 50),
      errorRate: generateTimeSeries(60, 2, 1),
      requestsPerMinute: generateTimeSeries(60, 1000, 200),
    };
  },
  getCostAndRevenue: async (timeRange: string): Promise<{ costs: CostRecord[], revenues: RevenueRecord[] }> => {
    await new Promise(res => setTimeout(res, 400));
    const now = Date.now();
    const points = 500;
    const providers: ModelProvider[] = ['OpenAI', 'Anthropic', 'Google', 'Mistral'];
    const costs = Array.from({ length: points }, (_, i) => {
      const provider = providers[i % providers.length];
      const inputTokens = Math.floor(Math.random() * 4000);
      const outputTokens = Math.floor(Math.random() * 1000);
      return {
        timestamp: now - Math.floor(Math.random() * 3600 * 1000),
        requestId: `req_${i}_${now}`,
        appId: MOCK_APPS[i % MOCK_APPS.length].id,
        userId: `user_${i % 50}`,
        tenantId: `tenant_${i % 10}`,
        provider,
        model: `${provider.toLowerCase()}-model-${i % 3}`,
        inputTokens,
        outputTokens,
        computeMs: Math.floor(Math.random() * 2000),
        cost: (inputTokens * 0.00001 + outputTokens * 0.00003) * (1 + Math.random() * 0.2),
        currency: 'USD',
      };
    });
    const revenues = Array.from({ length: points / 5 }, (_, i) => ({
      timestamp: now - Math.floor(Math.random() * 3600 * 1000),
      transactionId: `txn_${i}_${now}`,
      appId: MOCK_APPS[i % MOCK_APPS.length].id,
      tenantId: `tenant_${i % 10}`,
      amount: Math.random() * 100,
      currency: 'USD',
      product: `Product ${i % 5}`,
    }));
    return { costs, revenues };
  },
  getAuditFeed: async (limit: number): Promise<AuditEvent[]> => {
    await new Promise(res => setTimeout(res, 300));
    const now = Date.now();
    const actions: AuditEventAction[] = ['DATA_ACCESS', 'POLICY_CHANGE', 'USER_LOGIN', 'MODEL_INVOCATION', 'AGENT_SPAWN'];
    return Array.from({ length: limit }, (_, i) => ({
      id: `audit_${now - i * 1000}`,
      timestamp: now - i * 10000,
      appId: MOCK_APPS[i % MOCK_APPS.length].id,
      userId: `user_${i % 50}`,
      action: actions[i % actions.length],
      entity: `entity:${i}`,
      details: { ip: `192.168.1.${i % 255}`, target: `resource_${i}` },
      jurisdiction: ['US', 'EU', 'APAC'][i % 3],
      policyEvaluation: Math.random() > 0.1 ? 'PASS' : (Math.random() > 0.5 ? 'FAIL' : 'WARN'),
    }));
  },
  getAgentStates: async (): Promise<AgentState[]> => {
    await new Promise(res => setTimeout(res, 250));
    const now = Date.now();
    const statuses: AgentState['status'][] = ['IDLE', 'RUNNING', 'SUCCESS', 'ERROR', 'AWAITING_TOOL'];
    return Array.from({ length: 20 }, (_, i) => ({
      agentId: `agent_${i}`,
      appId: MOCK_APPS[i % MOCK_APPS.length].id,
      status: statuses[i % statuses.length],
      task: `Processing task #${i}: Analyze market trends for Q${i % 4 + 1}`,
      startTime: now - Math.floor(Math.random() * 600000),
      lastUpdateTime: now - Math.floor(Math.random() * 10000),
      toolCalls: Math.floor(Math.random() * 10),
      modelInvocations: Math.floor(Math.random() * 5),
    }));
  },
  getModelRoutingDecisions: async (): Promise<ModelRoutingDecision[]> => {
    await new Promise(res => setTimeout(res, 350));
    const now = Date.now();
    const providers: ModelProvider[] = ['OpenAI', 'Anthropic', 'Google', 'Mistral'];
    const reasons: ModelRoutingDecision['decision']['reason'][] = ['COST', 'LATENCY', 'QUALITY', 'COMPLIANCE'];
    return Array.from({ length: 50 }, (_, i) => {
      const winningProvider = providers[i % providers.length];
      return {
        requestId: `req_route_${i}_${now}`,
        timestamp: now - i * 5000,
        promptHash: `hash_${i}`,
        inputPayload: { text: "Summarize the following..." },
        decision: {
          provider: winningProvider,
          model: `${winningProvider.toLowerCase()}-model-best`,
          reason: reasons[i % reasons.length],
          latencyMs: 500 + Math.random() * 1000,
          cost: 0.001 + Math.random() * 0.005,
        },
        alternatives: providers.filter(p => p !== winningProvider).map(p => ({
          provider: p,
          model: `${p.toLowerCase()}-model-standard`,
          estimatedCost: 0.001 + Math.random() * 0.008,
          estimatedLatency: 600 + Math.random() * 1200,
          rejectionReason: Math.random() > 0.5 ? 'Higher cost' : 'Higher latency',
        })),
      };
    });
  },
  getIntrospection: async (appId: AppID): Promise<IntrospectionData> => {
    await new Promise(res => setTimeout(res, 100));
    const app = MOCK_APPS.find(a => a.id === appId);
    return {
      purpose: `This application, ${app?.name}, is responsible for ${app?.domain} related tasks, specifically focusing on ${app?.function}.`,
      dependencies: [`APP_${(parseInt(appId.split('_')[1]) + 1) % 75 + 1}_...`, 'SHARED_CORE_SDK'],
      invalidation_conditions: ['API contract change in dependency', 'Underlying model deprecation'],
      adjacent_apps: [`APP_${(parseInt(appId.split('_')[1]) + 2) % 75 + 1}_...`],
      architecture: {
        pattern: 'Microservice with Hexagonal Architecture',
        components: [{ name: 'API Gateway', responsibility: 'Request validation and routing' }, { name: 'Core Logic', responsibility: 'Business rule execution' }, { name: 'Adapters', responsibility: 'Integration with external systems' }],
      },
      revenue_surface: ['Per-API-call fee', 'Monthly subscription for advanced features', 'Enterprise support contract'],
      cost_drivers: ['Third-party AI model API calls', 'Compute (CPU/GPU)', 'Vector storage', 'Data egress'],
    };
  },
  getFailureModes: async (appId: AppID): Promise<FailureMode[]> => {
    await new Promise(res => setTimeout(res, 120));
    return [
      { name: 'Upstream API Outage', description: 'A critical dependency (e.g., OpenAI API) becomes unavailable.', likelihood: 'MEDIUM', impact: 'CRITICAL', mitigations: ['Automated failover to secondary provider', 'Circuit breaker pattern'] },
      { name: 'Data Poisoning', description: 'Malicious data is introduced into training or memory systems.', likelihood: 'LOW', impact: 'HIGH', mitigations: ['Input validation and sanitization', 'Regular model retraining and evaluation'] },
      { name: 'Prompt Injection', description: 'Users bypass system instructions via crafted prompts.', likelihood: 'HIGH', impact: 'MEDIUM', mitigations: ['Input/output filtering', 'Using models with better instruction following'] },
    ];
  },
};

// ==================================================================================
// API DATA FETCHING HOOKS
// ==================================================================================

function useApiData<T>(fetcher: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        if (isMounted) {
          setData(result);
        }
      } catch (e) {
        if (isMounted) {
          setError(e as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, dependencies);

  return { data, loading, error };
}

// ==================================================================================
// GLOBAL STATE MANAGEMENT (Context API)
// ==================================================================================

interface GlobalState {
  timeRange: string;
  selectedAppId: AppID | null;
  theme: 'dark' | 'light';
}

type GlobalAction =
  | { type: 'SET_TIME_RANGE'; payload: string }
  | { type: 'SELECT_APP'; payload: AppID | null }
  | { type: 'TOGGLE_THEME' };

const initialState: GlobalState = {
  timeRange: '1h',
  selectedAppId: null,
  theme: 'dark',
};

const GlobalStateContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
} | undefined>(undefined);

const globalStateReducer = (state: GlobalState, action: GlobalAction): GlobalState => {
  switch (action.type) {
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload };
    case 'SELECT_APP':
      return { ...state, selectedAppId: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    default:
      return state;
  }
};

const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(globalStateReducer, initialState);
  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

// ==================================================================================
// STYLING & THEME
// ==================================================================================

const THEME = {
  dark: {
    bg: '#111827',
    bg2: '#1F2937',
    border: '#374151',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    primary: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    red: '#EF4444',
    fontFamily: 'Inter, sans-serif',
  },
  light: {
    bg: '#F9FAFB',
    bg2: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#2563EB',
    green: '#059669',
    yellow: '#D97706',
    red: '#DC2626',
    fontFamily: 'Inter, sans-serif',
  },
};

// ==================================================================================
// UI PRIMITIVES
// ==================================================================================

const Spinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M12 2.99982V5.99982" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 18.0002V21.0002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.63623 5.63605L7.75755 7.75737" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.2426 16.2428L18.364 18.3641" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 12.0002H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 12.0002H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.63623 18.3641L7.75755 16.2428" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.2426 7.75737L18.364 5.63605" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const Card: React.FC<{ children: React.ReactNode; className?: string; style?: CSSProperties }> = ({ children, className = '', style }) => {
  const { state: { theme } } = useGlobalState();
  const colors = THEME[theme];
  return (
    <div
      className={className}
      style={{
        backgroundColor: colors.bg2,
        border: `1px solid ${colors.border}`,
        borderRadius: '0.5rem',
        padding: '1.5rem',
        color: colors.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<{ title: string; subtitle?: string; children?: React.ReactNode }> = ({ title, subtitle, children }) => {
  const { state: { theme } } = useGlobalState();
  const colors = THEME[theme];
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: `1px solid ${colors.border}`, paddingBottom: '1rem' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{title}</h3>
        {subtitle && <p style={{ margin: '0.25rem 0 0', color: colors.textSecondary, fontSize: '0.875rem' }}>{subtitle}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
};

const LoadingOverlay: React.FC = () => {
  const { state: { theme } } = useGlobalState();
  const colors = THEME[theme];
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: `${colors.bg2}B3`, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
      <Spinner />
    </div>
  );
};

const Widget: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; loading?: boolean; error?: Error | null }> = ({ title, subtitle, children, loading, error }) => {
  const { state: { theme } } = useGlobalState();
  const colors = THEME[theme];
  return (
    <Card style={{ position: 'relative', minHeight: '200px' }}>
      <CardHeader title={title} subtitle={subtitle} />
      {loading && <LoadingOverlay />}
      {!loading && error && <div style={{ color: colors.red }}>Error: {error.message}</div>}
      {!loading && !error && children}
    </Card>
  );
};

// ==================================================================================
// SVG CHART COMPONENTS
// ==================================================================================

const Sparkline: React.FC<{ data: TimeSeriesDataPoint[]; width?: number; height?: number; color?: string }> = ({ data, width = 120, height = 40, color = THEME.dark.primary }) => {
  if (!data || data.length < 2) return <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: THEME.dark.textSecondary }}>No data</div>;

  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - minVal) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
};

// ==================================================================================
// DASHBOARD WIDGETS
// ==================================================================================

const EcosystemHealthGrid: React.FC = () => {
  const { data: apps, loading, error } = useApiData(mockApi.getAppManifests, []);
  const { state: { theme }, dispatch } = useGlobalState();
  const colors = THEME[theme];

  const statusColors: Record<AppStatus, string> = {
    OPERATIONAL: colors.green,
    DEGRADED: colors.yellow,
    MAINTENANCE: colors.primary,
    OUTAGE: colors.red,
  };

  if (loading) return <Widget title="Ecosystem Health" loading={true}><div/></Widget>;
  if (error) return <Widget title="Ecosystem Health" error={error}><div/></Widget>;

  return (
    <Widget title="Ecosystem Health" subtitle="Real-time status of all 75 applications">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {apps?.map(app => (
          <div
            key={app.id}
            onClick={() => dispatch({ type: 'SELECT_APP', payload: app.id })}
            style={{
              padding: '1rem',
              border: `1px solid ${colors.border}`,
              borderRadius: '0.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = colors.primary}
            onMouseOut={(e) => e.currentTarget.style.borderColor = colors.border}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColors[app.status], marginRight: '0.5rem' }}></span>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: colors.textSecondary }}>{app.id.split('_')[1]}</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</div>
            <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>v{app.version}</div>
          </div>
        ))}
      </div>
    </Widget>
  );
};

const AppDetailView: React.FC<{ appId: AppID }> = ({ appId }) => {
  const { data: metrics, loading: metricsLoading, error: metricsError } = useApiData(() => mockApi.getAppMetrics(appId), [appId]);
  const { data: introspection, loading: introLoading, error: introError } = useApiData(() => mockApi.getIntrospection(appId), [appId]);
  const { data: failureModes, loading: fmLoading, error: fmError } = useApiData(() => mockApi.getFailureModes(appId), [appId]);
  const { state: { theme }, dispatch } = useGlobalState();
  const colors = THEME[theme];
  const app = MOCK_APPS.find(a => a.id === appId);

  if (!app) return null;

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: '500px', height: '100%', backgroundColor: colors.bg, borderLeft: `1px solid ${colors.border}`, overflowY: 'auto', zIndex: 50, padding: '1.5rem', boxShadow: '-10px 0 20px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{app.name}</h2>
        <button onClick={() => dispatch({ type: 'SELECT_APP', payload: null })} style={{ background: 'none', border: 'none', color: colors.text, fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
      </div>
      <p style={{ color: colors.textSecondary, marginTop: '0.5rem' }}>{app.id}</p>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '0.5rem' }}>Live Metrics</h3>
        <Widget loading={metricsLoading} error={metricsError} title="">
          {metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>CPU Usage</div><Sparkline data={metrics.cpuUsage} color={colors.primary} />
              <div>Memory Usage</div><Sparkline data={metrics.memoryUsage} color={colors.primary} />
              <div>P95 Latency</div><Sparkline data={metrics.apiLatencyP95} color={colors.yellow} />
              <div>Error Rate</div><Sparkline data={metrics.errorRate} color={colors.red} />
              <div>RPM</div><Sparkline data={metrics.requestsPerMinute} color={colors.green} />
            </div>
          )}
        </Widget>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '0.5rem' }}>Introspection</h3>
        <Widget loading={introLoading} error={introError} title="">
          {introspection && (
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              <p><strong>Purpose:</strong> {introspection.purpose}</p>
              <p><strong>Dependencies:</strong> {introspection.dependencies.join(', ')}</p>
              <p><strong>Cost Drivers:</strong> {introspection.cost_drivers.join(', ')}</p>
              <p><strong>Revenue Surface:</strong> {introspection.revenue_surface.join(', ')}</p>
            </div>
          )}
        </Widget>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '0.5rem' }}>Failure Modes</h3>
        <Widget loading={fmLoading} error={fmError} title="">
          {failureModes?.map(fm => (
            <div key={fm.name} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${colors.border}` }}>
              <strong>{fm.name}</strong> (Impact: {fm.impact}, Likelihood: {fm.likelihood})
              <p style={{ color: colors.textSecondary, margin: '0.5rem 0' }}>{fm.description}</p>
              <p style={{ margin: 0 }}><em>Mitigations: {fm.mitigations.join(', ')}</em></p>
            </div>
          ))}
        </Widget>
      </div>
    </div>
  );
};

const CostVsRevenueWidget: React.FC = () => {
  const { state: { timeRange } } = useGlobalState();
  const { data, loading, error } = useApiData(() => mockApi.getCostAndRevenue(timeRange), [timeRange]);
  const { state: { theme } } = useGlobalState();
  const colors = THEME[theme];

  const aggregatedData = useMemo(() => {
    if (!data) return { totalCost: 0, totalRevenue: 0, profit: 0, margin: 0 };
    const totalCost = data.costs.reduce((acc, c) => acc + c.cost, 0);
    const totalRevenue = data.revenues.reduce((acc, r) => acc + r.amount, 0);
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    return { totalCost, totalRevenue, profit, margin };
  }, [data]);

  return (
    <Widget title="Unit Economics" subtitle={`Aggregated over last ${timeRange}`} loading={loading} error={error}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>Total Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.green }}>${aggregatedData.totalRevenue.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>Total Cost</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.red }}>${aggregatedData.totalCost.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>Net Profit</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: aggregatedData.profit > 0 ? colors.green : colors.red }}>${aggregatedData.profit.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>Profit Margin</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: aggregatedData.margin > 0 ? colors.green : colors.red }}>{aggregatedData.margin.toFixed(1)}%</div>
        </div>
      </div>
    </Widget>
  );
};

const AuditFeedWidget: React.FC = () => {
  const { data, loading, error } = useApiData(() => mockApi.getAuditFeed(20), []);
  const { state: { theme } } = useGlobalState();
  const colors = THEME[theme];

  const policyColors = {
    PASS: colors.green,
    WARN: colors.yellow,
    FAIL: colors.red,
  };

  return (
    <Widget title="Governance & Compliance Feed" subtitle="Live audit trail events" loading={loading} error={error}>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {data?.map(event => (
          <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${colors.border}`, fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: policyColors[event.policyEvaluation], marginRight: '0.5rem' }}>●</span>
              <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
              <span style={{ marginLeft: '1rem', color: colors.textSecondary }}>{event.userId}</span>
            </div>
            <div>
              <span>{event.action} on {event.entity}</span>
              <span style={{ marginLeft: '1rem', color: colors.textSecondary }}>({event.appId.split('_')[1]})</span>
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
};

const ModelArbitrationVisualizer: React.FC = () => {
    const { data, loading, error } = useApiData(mockApi.getModelRoutingDecisions, []);
    const { state: { theme } } = useGlobalState();
    const colors = THEME[theme];

    const reasonColors: Record<ModelRoutingDecision['decision']['reason'], string> = {
        COST: colors.green,
        LATENCY: colors.primary,
        QUALITY: '#9333EA', // purple
        COMPLIANCE: colors.yellow,
        CAPABILITY: '#E11D48' // rose
    };

    return (
        <Widget title="Model Routing & Arbitration" subtitle="Cost vs. Quality vs. Latency Decisions" loading={loading} error={error}>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>
                            <th style={{ padding: '0.5rem' }}>Time</th>
                            <th style={{ padding: '0.5rem' }}>Decision</th>
                            <th style={{ padding: '0.5rem' }}>Reason</th>
                            <th style={{ padding: '0.5rem' }}>Metrics</th>
                            <th style={{ padding: '0.5rem' }}>Alternatives Skipped</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map(d => (
                            <tr key={d.requestId} style={{ borderBottom: `1px solid ${colors.border}`, fontSize: '0.8rem' }}>
                                <td style={{ padding: '0.5rem', color: colors.textSecondary }}>{new Date(d.timestamp).toLocaleTimeString()}</td>
                                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{d.decision.provider} <span style={{ color: colors.textSecondary }}>({d.decision.model})</span></td>
                                <td style={{ padding: '0.5rem' }}>
                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '99px', backgroundColor: `${reasonColors[d.decision.reason]}30`, color: reasonColors[d.decision.reason], fontWeight: 500 }}>
                                        {d.decision.reason}
                                    </span>
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    ${d.decision.cost.toFixed(5)} / {d.decision.latencyMs}ms
                                </td>
                                <td style={{ padding: '0.5rem', color: colors.textSecondary }}>
                                    {d.alternatives.map(a => a.provider).join(', ')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Widget>
    );
};

// ==================================================================================
// LAYOUT COMPONENTS
// ==================================================================================

const Header: React.FC = () => {
  const { state: { theme }, dispatch } = useGlobalState();
  const colors = THEME[theme];
  return (
    <header style={{
      backgroundColor: colors.bg2,
      borderBottom: `1px solid ${colors.border}`,
      padding: '0 1.5rem',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 style={{ fontSize: '1.25rem', marginLeft: '0.75rem', fontWeight: 600 }}>Ecosystem Dashboard</h1>
      </div>
      <div>
        <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })} style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer' }}>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </header>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: { theme } } = useGlobalState();
  const colors = THEME[theme];
  return (
    <div style={{
      backgroundColor: colors.bg,
      color: colors.text,
      minHeight: '100vh',
      fontFamily: colors.fontFamily,
    }}>
      <Header />
      <main style={{ padding: '1.5rem' }}>
        {children}
      </main>
    </div>
  );
};

// ==================================================================================
// MAIN PAGE COMPONENT
// ==================================================================================

const MasterDashboardPage: NextPage = () => {
  const { state } = useGlobalState();

  return (
    <>
      <Head>
        <title>APP_75_Ecosystem_MasterDashboard</title>
        <meta name="description" content="Unified dashboard for the autonomous systems architect platform." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <MainLayout>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <EcosystemHealthGrid />
          </div>
          <CostVsRevenueWidget />
          <AuditFeedWidget />
          <div style={{ gridColumn: '1 / -1' }}>
            <ModelArbitrationVisualizer />
          </div>
        </div>
        {state.selectedAppId && <AppDetailView appId={state.selectedAppId} />}
      </MainLayout>
    </>
  );
};

const AppWrapper: NextPage = () => (
  <GlobalStateProvider>
    <MasterDashboardPage />
  </GlobalStateProvider>
);

export default AppWrapper;