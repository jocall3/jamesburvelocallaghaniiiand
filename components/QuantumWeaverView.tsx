
import React, { useState, useMemo, useEffect, FC, createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Card from './Card';
import type { AIPlanStep, AIQuestion, AIPlan } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar } from 'recharts';

// ================================================================================================
// FINOS PRO: FINANCIAL NEURAL OPERATING SYSTEM (v10.1)
// DEVELOPER: ANONYMOUS CONTRIBUTOR
// FOCUS: HYPER-SCALABLE AUTONOMOUS ENTERPRISE MANAGEMENT & PREDICTIVE MODELING
// ================================================================================================

const gql = String.raw;

// --- MOCK DATABASE & STATE MANAGEMENT ---

interface FinancialRecord { month: string; revenue: number; expenses: number; cashBalance: number; burnRate: number; }
interface MarketCompetitor { id: string; name: string; marketShare: number; threatLevel: number; growthRate: number; }
interface Employee { id: string; name: string; role: string; performance: number; satisfaction: number; aiPotential: number; }
interface LegalDoc { id: string; name: string; status: 'DRAFT' | 'REVIEW' | 'SIGNED' | 'EXPIRED'; riskScore: number; }
interface SystemAlert { id: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; message: string; timestamp: number; }
interface TradingAlgorithm { id: string; name: string; status: 'ACTIVE' | 'PAUSED' | 'COMPILING'; pnl: number; sharpeRatio: number; latency: number; }
interface MarketDataPoint { time: number; price: number; volume: number; }
interface QuantumJob { id:string; name: string; status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'; qubits: number; executionTime: number; }
interface SupplyChainNode { id: string; type: 'FACTORY' | 'WAREHOUSE' | 'PORT' | 'DRONE_HUB'; location: string; efficiency: number; status: 'OPERATIONAL' | 'DISRUPTED' | 'MAINTENANCE'; }
interface NeuralNetworkModel { id: string; name: string; status: 'IDLE' | 'TRAINING' | 'DEPLOYED'; accuracy: number; loss: number; trainingProgress: number; }

const mockFinancials: FinancialRecord[] = Array.from({ length: 12 }, (_, i) => ({
    month: `Month ${i + 1}`,
    revenue: 10000 * Math.pow(1.15, i) + Math.random() * 5000,
    expenses: 8000 * Math.pow(1.05, i) + Math.random() * 2000,
    cashBalance: 500000 - (i * 5000),
    burnRate: 15000 + Math.random() * 2000,
}));

const mockCompetitors: MarketCompetitor[] = [
    { id: 'c1', name: 'Legacy Corp', marketShare: 45, threatLevel: 30, growthRate: 2 },
    { id: 'c2', name: 'StartUp X', marketShare: 15, threatLevel: 85, growthRate: 150 },
    { id: 'c3', name: 'TechGiant Y', marketShare: 25, threatLevel: 60, growthRate: 10 },
    { id: 'c4', name: 'Our Venture', marketShare: 5, threatLevel: 0, growthRate: 300 },
];

const mockTeam: Employee[] = [
    { id: 'e1', name: 'Dr. Sarah Chen', role: 'Chief AI Officer', performance: 98, satisfaction: 90, aiPotential: 99 },
    { id: 'e2', name: 'Marcus Thorne', role: 'Head of Growth', performance: 92, satisfaction: 85, aiPotential: 75 },
    { id: 'e3', name: 'Elena Rodriguez', role: 'Lead Engineer', performance: 95, satisfaction: 88, aiPotential: 90 },
];

const mockLegal: LegalDoc[] = [
    { id: 'l1', name: 'Incorporation Documents', status: 'SIGNED', riskScore: 0 },
    { id: 'l2', name: 'Series A Term Sheet', status: 'REVIEW', riskScore: 45 },
    { id: 'l3', name: 'Employee IP Agreements', status: 'SIGNED', riskScore: 5 },
    { id: 'l4', name: 'GDPR Compliance Audit', status: 'DRAFT', riskScore: 80 },
];

const mockTradingAlgos: TradingAlgorithm[] = [
    { id: 'algo1', name: 'Momentum Scalper v3', status: 'ACTIVE', pnl: 125034.50, sharpeRatio: 2.8, latency: 0.05 },
    { id: 'algo2', name: 'Mean Reversion Arb', status: 'PAUSED', pnl: -15234.21, sharpeRatio: -0.5, latency: 0.12 },
    { id: 'algo3', name: 'Quantum Tunneling Predictor', status: 'COMPILING', pnl: 0, sharpeRatio: 0, latency: 0.01 },
];

const mockQuantumJobs: QuantumJob[] = [
    { id: 'qj1', name: 'Protein Folding Simulation', status: 'COMPLETED', qubits: 128, executionTime: 3600 },
    { id: 'qj2', name: 'Market Correlation Matrix', status: 'RUNNING', qubits: 512, executionTime: 7200 },
];

const mockSupplyChain: SupplyChainNode[] = [
    { id: 'sc1', type: 'FACTORY', location: 'Shenzhen', efficiency: 98, status: 'OPERATIONAL' },
    { id: 'sc2', type: 'PORT', location: 'Long Beach', efficiency: 85, status: 'DISRUPTED' },
    { id: 'sc3', type: 'WAREHOUSE', location: 'Nevada', efficiency: 99, status: 'OPERATIONAL' },
    { id: 'sc4', type: 'DRONE_HUB', location: 'Chicago', efficiency: 92, status: 'MAINTENANCE' },
];

const mockNeuralNets: NeuralNetworkModel[] = [
    { id: 'nn1', name: 'Customer Churn Predictor', status: 'DEPLOYED', accuracy: 94.5, loss: 0.08, trainingProgress: 100 },
    { id: 'nn2', name: 'Market Sentiment Analyzer', status: 'TRAINING', accuracy: 88.2, loss: 0.15, trainingProgress: 65 },
    { id: 'nn3', name: 'Supply Chain Optimizer', status: 'IDLE', accuracy: 0, loss: 0, trainingProgress: 0 },
];

let mockWorkflows = new Map<string, WorkflowStatusPayload>();
const mockUserProfiles = new Map<string, UserProfile>();

// --- GRAPHQL SERVICE LAYER ---

async function graphqlRequest<T, V>(query: string, variables?: V): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    if (query.includes('StartBusinessPlanAnalysis')) {
        const { plan, userId } = variables as { plan: string, userId: string };
        const workflowId = `wf-${Date.now()}-${userId}`;
        const newWorkflow: WorkflowStatusPayload = { workflowId, status: 'PENDING', result: null, error: null, userId, businessPlan: plan };
        mockWorkflows.set(workflowId, newWorkflow);
        setTimeout(() => {
            const current = mockWorkflows.get(workflowId);
            if (current) {
                const loanAmount = Math.floor(Math.random() * 500000) + 100000;
                const viability = Math.min(99, 40 + (plan.length / 200) * 30 + Math.random() * 20);
                const marketFit = Math.min(98, 30 + (plan.length / 300) * 40 + Math.random() * 20);
                const risk = Math.max(2, 100 - viability - marketFit + Math.random() * 15);
                current.status = 'ANALYSIS_COMPLETE';
                current.result = {
                    feedback: "Analysis complete. Strengths noted, but operational resilience needs improvement.",
                    questions: [{ id: 'q1', question: 'Define autonomous scaling mechanisms for year 3.', category: 'Scale' }],
                    coachingPlan: { title: "Hyper-Scale Execution Protocol", summary: "Directive to transition from concept to market dominance.", steps: [{ title: "Algorithmic Market Validation", description: "Deploy autonomous agents to test value prop.", timeline: '1 Week', category: 'Validation' }] },
                    loanAmount, metrics: { viability, marketFit, risk },
                    growthProjections: Array.from({ length: 12 }, (_, i) => ({ month: i, users: Math.floor(100 * Math.pow(1.4, i)), revenue: Math.floor(1000 * Math.pow(1.5, i)) })),
                    potentialMentors: [{ id: 'm1', name: 'Dr. Evelyn Reed', expertise: 'Quantum Computing', bio: 'Architect of the first commercial quantum annealing processor.', imageUrl: 'https://i.pravatar.cc/150?u=evelyn' }]
                };
                mockWorkflows.set(workflowId, current);
            }
        }, 3000);
        return { startBusinessPlanAnalysis: { workflowId, status: 'PENDING' } } as unknown as T;
    }
    if (query.includes('GetBusinessPlanAnalysisStatus')) {
        const vars = variables as { workflowId: string };
        const wf = mockWorkflows.get(vars.workflowId);
        if (wf) return { getBusinessPlanAnalysisStatus: wf } as unknown as T;
        throw new Error(`Workflow ${vars.workflowId} not found.`);
    }
    if (query.includes('GetFinancialData')) return { getFinancialData: mockFinancials } as unknown as T;
    if (query.includes('GetMarketIntelligence')) return { getMarketIntelligence: mockCompetitors } as unknown as T;
    if (query.includes('GetTeamStructure')) return { getTeamStructure: mockTeam } as unknown as T;
    if (query.includes('GetLegalStatus')) return { getLegalStatus: mockLegal } as unknown as T;
    if (query.includes('GetSystemAlerts')) {
        const alerts: SystemAlert[] = [
            { id: 'a1', severity: 'HIGH', message: 'Supply chain disruption detected at Long Beach port.', timestamp: Date.now() },
            { id: 'a2', severity: 'MEDIUM', message: 'Competitor "StartUp X" increased ad spend by 200%.', timestamp: Date.now() - 50000 },
            { id: 'a3', severity: 'CRITICAL', message: 'Quantum Tunneling Predictor algo showing anomalous P/L curve.', timestamp: Date.now() - 200000 },
        ];
        return { getSystemAlerts: alerts } as unknown as T;
    }
    if (query.includes('GenerateAiContent')) {
        const vars = variables as { prompt: string, context: string };
        let text = "Processing...";
        if (vars.prompt.includes('risk')) text = "Risk Analysis: Primary vulnerability is dependency on legacy banking rails. Recommendation: Accelerate transition to decentralized settlement layers.";
        else text = `AI Insight: Based on "${vars.context.substring(0, 20)}...", the optimal path involves rapid MVP iteration followed by aggressive vertical integration.`;
        return { generateTextWithContext: text } as unknown as T;
    }
    if (query.includes('GenerateAIChatResponse')) {
        const responses = ["I've analyzed the data. Your burn rate is sustainable for 14 months, but aggressive R&D could shorten this to 8. Shall I model a capital raise scenario?"];
        return { generateAIChatResponse: responses[0] } as unknown as T;
    }
    if (query.includes('GetUserProfile')) {
        const vars = variables as { userId: string };
        const profile = mockUserProfiles.get(vars.userId) || { userId: vars.userId, username: `Architect_${vars.userId.substring(0, 3)}`, email: `${vars.userId}@finos.pro`, preferences: { notificationSettings: { emailEnabled: true, smsEnabled: true, inAppEnabled: true } }, googleId: 'g_123' };
        return { getUserProfile: profile } as unknown as T;
    }
    if (query.includes('UpdateUserProfile')) {
        const vars = variables as { userId: string, profile: UserProfileUpdateInput };
        let profile = mockUserProfiles.get(vars.userId) || { userId: vars.userId, username: '', email: '', preferences: { notificationSettings: { emailEnabled: true, smsEnabled: true, inAppEnabled: true } } };
        profile = { ...profile, ...vars.profile, preferences: { ...profile.preferences, ...vars.profile.preferences } };
        mockUserProfiles.set(vars.userId, profile);
        return { updateUserProfile: profile } as unknown as T;
    }
    if (query.includes('GetUserPlans')) {
        const vars = variables as { userId: string };
        const plans = Array.from(mockWorkflows.values()).filter(wf => wf.userId === vars.userId);
        return { getUserPlans: plans } as unknown as T;
    }
    // --- NEW RESOLVERS FOR EXPANDED VIEW ---
    if (query.includes('GetTradingData')) return { getTradingData: mockTradingAlgos } as unknown as T;
    if (query.includes('GetMarketData')) {
        const data = Array.from({ length: 50 }, (_, i) => ({ time: Date.now() - (50 - i) * 1000, price: 100 + Math.sin(i / 5) * 10 + (Math.random() - 0.5) * 5, volume: 1000 + Math.random() * 500 }));
        return { getMarketData: data } as unknown as T;
    }
    if (query.includes('UpdateTradingAlgoStatus')) {
        const { id, status } = variables as { id: string, status: 'ACTIVE' | 'PAUSED' };
        const algo = mockTradingAlgos.find(a => a.id === id);
        if (algo) algo.status = status;
        return { updateTradingAlgoStatus: algo } as unknown as T;
    }
    if (query.includes('GetQuantumJobs')) return { getQuantumJobs: mockQuantumJobs } as unknown as T;
    if (query.includes('SubmitQuantumJob')) {
        const { name, qubits } = variables as { name: string, qubits: number };
        const newJob: QuantumJob = { id: `qj-${Date.now()}`, name, qubits, status: 'QUEUED', executionTime: 0 };
        mockQuantumJobs.push(newJob);
        return { submitQuantumJob: newJob } as unknown as T;
    }
    if (query.includes('GetSupplyChain')) return { getSupplyChain: mockSupplyChain } as unknown as T;
    if (query.includes('GetNeuralNets')) return { getNeuralNets: mockNeuralNets } as unknown as T;
    if (query.includes('StartNnTraining')) {
        const { id } = variables as { id: string };
        const model = mockNeuralNets.find(m => m.id === id);
        if (model) {
            model.status = 'TRAINING';
            model.trainingProgress = 0;
            // Simulate training progress
            const interval = setInterval(() => {
                if (model.trainingProgress < 100) {
                    model.trainingProgress += 5;
                    model.loss *= 0.95;
                } else {
                    model.status = 'DEPLOYED';
                    clearInterval(interval);
                }
            }, 1000);
        }
        return { startNnTraining: model } as unknown as T;
    }
    if (query.includes('AddEmployee')) {
        const { name, role } = variables as { name: string, role: string };
        const newEmployee: Employee = { id: `e-${Date.now()}`, name, role, performance: 80, satisfaction: 80, aiPotential: 80 };
        mockTeam.push(newEmployee);
        return { addEmployee: newEmployee } as unknown as T;
    }
    if (query.includes('AddLegalDoc')) {
        const { name } = variables as { name: string };
        const newDoc: LegalDoc = { id: `l-${Date.now()}`, name, status: 'DRAFT', riskScore: 90 };
        mockLegal.push(newDoc);
        return { addLegalDoc: newDoc } as unknown as T;
    }
    if (query.includes('AdvancedAIGeneration')) {
        const { prompt, config } = variables as { prompt: string, config: AdvancedAIConfig };
        let response = `Executing prompt: "${prompt}".\n\n`;

        // Simulate system instruction
        if (config.systemInstruction?.toLowerCase().includes('cat')) {
            response += "Meow! As a cat named Neko, I see the world in terms of naps and snacks. What can I help you with, human? Meow.";
        } else if (config.systemInstruction) {
            response += `Operating under system instruction: "${config.systemInstruction}".\n`;
        }

        // Simulate temperature
        if (config.temperature !== undefined) {
            if (config.temperature < 0.3) {
                response += " The data suggests a straightforward, factual approach. The conclusion is logical and direct.";
            } else if (config.temperature > 0.8) {
                response += " Let's explore some creative possibilities! What if we inverted the paradigm entirely, or perhaps considered a metaphorical interpretation of the input data?";
            } else {
                response += " A balanced approach is warranted, combining creativity with factual analysis."
            }
        }

        // Simulate thinking budget
        if (config.thinkingBudget === 0) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Fast
            response += "\n\n(Thinking disabled: quick response protocol initiated.)";
        } else {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Slower
            response += "\n\n(Thinking enabled: deep analysis protocol initiated, cross-referencing multiple data vectors.)";
        }

        // Simulate multimodal
        if (config.multimodalUri) {
            response = `Analysis of image at ${config.multimodalUri}: This appears to be a complex biological structure, likely an organ. The intricate patterns suggest high functional density. Based on the fractal dimensions, it could be related to neural processing or nutrient exchange.`;
        }

        return { advancedAIGeneration: { response } } as unknown as T;
    }

    throw new Error(`Unknown Query: ${query.substring(0, 30)}`);
}

// --- GRAPHQL QUERIES & MUTATIONS ---

const START_ANALYSIS_MUTATION = gql`mutation StartBusinessPlanAnalysis($plan: String!, $userId: ID!) { startBusinessPlanAnalysis(plan: $plan, userId: $userId) { workflowId status } }`;
const GET_ANALYSIS_STATUS_QUERY = gql`query GetBusinessPlanAnalysisStatus($workflowId: ID!) { getBusinessPlanAnalysisStatus(workflowId: $workflowId) { workflowId status result { feedback questions { id question category } coachingPlan { title summary steps { title description category timeline } } loanAmount metrics { viability marketFit risk } growthProjections { month users revenue } potentialMentors { id name expertise bio imageUrl } } error businessPlan } }`;
const GET_FINANCIALS_QUERY = gql`query GetFinancialData { getFinancialData { month revenue expenses cashBalance burnRate } }`;
const GET_MARKET_QUERY = gql`query GetMarketIntelligence { getMarketIntelligence { name marketShare threatLevel growthRate } }`;
const GET_TEAM_QUERY = gql`query GetTeamStructure { getTeamStructure { id name role performance satisfaction aiPotential } }`;
const ADD_EMPLOYEE_MUTATION = gql`mutation AddEmployee($name: String!, $role: String!) { addEmployee(name: $name, role: $role) { id name } }`;
const GET_LEGAL_QUERY = gql`query GetLegalStatus { getLegalStatus { id name status riskScore } }`;
const ADD_LEGAL_DOC_MUTATION = gql`mutation AddLegalDoc($name: String!) { addLegalDoc(name: $name) { id name } }`;
const GET_ALERTS_QUERY = gql`query GetSystemAlerts { getSystemAlerts { id severity message timestamp } }`;
const GENERATE_AI_CONTENT_MUTATION = gql`mutation GenerateAiContent($prompt: String!, $context: String!) { generateTextWithContext(prompt: $prompt, context: $context) }`;
const GENERATE_AI_CHAT_MUTATION = gql`mutation GenerateAIChatResponse($message: String!, $context: String!) { generateAIChatResponse(message: $message, context: $context) }`;
const GET_USER_PROFILE_QUERY = gql`query GetUserProfile($userId: ID!) { getUserProfile(userId: $userId) { userId username email googleId preferences { theme notificationSettings } } }`;
const UPDATE_USER_PROFILE_MUTATION = gql`mutation UpdateUserProfile($userId: ID!, $profile: UserProfileUpdateInput!) { updateUserProfile(userId: $userId, profile: $profile) { userId username email googleId preferences { theme notificationSettings } } }`;
const GET_USER_PLANS_QUERY = gql`query GetUserPlans($userId: ID!) { getUserPlans(userId: $userId) { workflowId status businessPlan result { loanAmount metrics { viability marketFit risk } } } }`;
const GET_TRADING_DATA_QUERY = gql`query GetTradingData { getTradingData { id name status pnl sharpeRatio latency } }`;
const GET_MARKET_DATA_QUERY = gql`query GetMarketData { getMarketData { time price volume } }`;
const UPDATE_TRADING_ALGO_STATUS_MUTATION = gql`mutation UpdateTradingAlgoStatus($id: ID!, $status: String!) { updateTradingAlgoStatus(id: $id, status: $status) { id status } }`;
const GET_QUANTUM_JOBS_QUERY = gql`query GetQuantumJobs { getQuantumJobs { id name status qubits executionTime } }`;
const SUBMIT_QUANTUM_JOB_MUTATION = gql`mutation SubmitQuantumJob($name: String!, $qubits: Int!) { submitQuantumJob(name: $name, qubits: $qubits) { id name } }`;
const GET_SUPPLY_CHAIN_QUERY = gql`query GetSupplyChain { getSupplyChain { id type location efficiency status } }`;
const GET_NEURAL_NETS_QUERY = gql`query GetNeuralNets { getNeuralNets { id name status accuracy loss trainingProgress } }`;
const START_NN_TRAINING_MUTATION = gql`mutation StartNnTraining($id: ID!) { startNnTraining(id: $id) { id status } }`;
const ADVANCED_AI_GENERATION_MUTATION = gql`mutation AdvancedAIGeneration($prompt: String!, $config: AdvancedAIConfig!) { advancedAIGeneration(prompt: $prompt, config: $config) { response } }`;

// --- TYPES ---

interface Metrics { viability: number; marketFit: number; risk: number; }
interface GrowthProjection { month: number; users: number; revenue: number; }
interface Mentor { id: string; name: string; expertise: string; bio: string; imageUrl: string; }
interface WorkflowStatusPayload { workflowId: string; status: 'PENDING' | 'ANALYSIS_COMPLETE' | 'APPROVED' | 'FAILED' | 'REQUIRE_REVISION' | 'PENDING_APPROVAL'; result?: { feedback?: string; questions?: AIQuestion[]; coachingPlan?: AIPlan; loanAmount?: number; metrics?: Metrics; growthProjections?: GrowthProjection[]; potentialMentors?: Mentor[]; } | null; error?: string | null; userId: string; businessPlan: string; }
interface UserProfile { userId: string; username: string; email: string; googleId?: string; preferences: { theme?: 'dark' | 'light'; notificationSettings: { emailEnabled: boolean; smsEnabled: boolean; inAppEnabled: boolean; }; }; }
interface UserProfileUpdateInput { username?: string; email?: string; googleId?: string; preferences?: any; }
interface AdvancedAIConfig { systemInstruction?: string; temperature?: number; thinkingBudget?: number; stream?: boolean; multimodalUri?: string; }

// --- HOOKS ---

const useStartAnalysis = () => { const queryClient = useQueryClient(); return useMutation({ mutationFn: (args: { plan: string, userId: string }) => graphqlRequest<{ startBusinessPlanAnalysis: { workflowId: string, status: string } }, typeof args>(START_ANALYSIS_MUTATION, args), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userPlans'] }) }); };
const useAnalysisStatus = (workflowId: string | null) => useQuery({ queryKey: ['analysisStatus', workflowId], queryFn: () => graphqlRequest<{ getBusinessPlanAnalysisStatus: WorkflowStatusPayload }, { workflowId: string }>(GET_ANALYSIS_STATUS_QUERY, { workflowId: workflowId! }), enabled: !!workflowId, refetchInterval: (query) => query.state.data?.getBusinessPlanAnalysisStatus.status === 'PENDING' ? 2000 : false });
const useFinancials = () => useQuery({ queryKey: ['financials'], queryFn: () => graphqlRequest<{ getFinancialData: FinancialRecord[] }, {}>(GET_FINANCIALS_QUERY) });
const useMarket = () => useQuery({ queryKey: ['market'], queryFn: () => graphqlRequest<{ getMarketIntelligence: MarketCompetitor[] }, {}>(GET_MARKET_QUERY) });
const useTeam = () => useQuery({ queryKey: ['team'], queryFn: () => graphqlRequest<{ getTeamStructure: Employee[] }, {}>(GET_TEAM_QUERY) });
const useAddEmployee = () => { const queryClient = useQueryClient(); return useMutation({ mutationFn: (vars: { name: string, role: string }) => graphqlRequest<{ addEmployee: Employee }, typeof vars>(ADD_EMPLOYEE_MUTATION, vars), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }) }); };
const useLegal = () => useQuery({ queryKey: ['legal'], queryFn: () => graphqlRequest<{ getLegalStatus: LegalDoc[] }, {}>(GET_LEGAL_QUERY) });
const useAddLegalDoc = () => { const queryClient = useQueryClient(); return useMutation({ mutationFn: (vars: { name: string }) => graphqlRequest<{ addLegalDoc: LegalDoc }, typeof vars>(ADD_LEGAL_DOC_MUTATION, vars), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legal'] }) }); };
const useAlerts = () => useQuery({ queryKey: ['alerts'], queryFn: () => graphqlRequest<{ getSystemAlerts: SystemAlert[] }, {}>(GET_ALERTS_QUERY), refetchInterval: 10000 });
const useGenerateAiContent = () => useMutation({ mutationFn: (vars: { prompt: string, context: string }) => graphqlRequest<{ generateTextWithContext: string }, typeof vars>(GENERATE_AI_CONTENT_MUTATION, vars) });
const useGenerateAiChat = () => useMutation({ mutationFn: (vars: { message: string, context: string }) => graphqlRequest<{ generateAIChatResponse: string }, typeof vars>(GENERATE_AI_CHAT_MUTATION, vars) });
const useUserProfile = (userId: string) => useQuery({ queryKey: ['userProfile', userId], queryFn: () => graphqlRequest<{ getUserProfile: UserProfile }, { userId: string }>(GET_USER_PROFILE_QUERY, { userId }) });
const useUpdateUserProfile = () => { const queryClient = useQueryClient(); return useMutation({ mutationFn: (args: { userId: string, profile: UserProfileUpdateInput }) => graphqlRequest<{ updateUserProfile: UserProfile }, typeof args>(UPDATE_USER_PROFILE_MUTATION, args), onSuccess: (data, variables) => queryClient.invalidateQueries({ queryKey: ['userProfile', variables.userId] }) }); };
const useUserPlans = (userId: string) => useQuery({ queryKey: ['userPlans', userId], queryFn: () => graphqlRequest<{ getUserPlans: WorkflowStatusPayload[] }, { userId: string }>(GET_USER_PLANS_QUERY, { userId }) });
const useTradingData = () => useQuery({ queryKey: ['tradingData'], queryFn: () => graphqlRequest<{ getTradingData: TradingAlgorithm[] }, {}>(GET_TRADING_DATA_QUERY), refetchInterval: 5000 });
const useMarketData = () => useQuery({ queryKey: ['marketData'], queryFn: () => graphqlRequest<{ getMarketData: MarketDataPoint[] }, {}>(GET_MARKET_DATA_QUERY), refetchInterval: 2000 });
const useUpdateTradingAlgoStatus = () => { const queryClient = useQueryClient(); return useMutation({ mutationFn: (vars: { id: string, status: 'ACTIVE' | 'PAUSED' }) => graphqlRequest<{ updateTradingAlgoStatus: TradingAlgorithm }, typeof vars>(UPDATE_TRADING_ALGO_STATUS_MUTATION, vars), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradingData'] }) }); };
const useQuantumJobs = () => useQuery({ queryKey: ['quantumJobs'], queryFn: () => graphqlRequest<{ getQuantumJobs: QuantumJob[] }, {}>(GET_QUANTUM_JOBS_QUERY), refetchInterval: 3000 });
const useSubmitQuantumJob = () => { const queryClient = useQueryClient(); return useMutation({ mutationFn: (vars: { name: string, qubits: number }) => graphqlRequest<{ submitQuantumJob: QuantumJob }, typeof vars>(SUBMIT_QUANTUM_JOB_MUTATION, vars), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quantumJobs'] }) }); };
const useSupplyChain = () => useQuery({ queryKey: ['supplyChain'], queryFn: () => graphqlRequest<{ getSupplyChain: SupplyChainNode[] }, {}>(GET_SUPPLY_CHAIN_QUERY), refetchInterval: 7000 });
const useNeuralNets = () => useQuery({ queryKey: ['neuralNets'], queryFn: () => graphqlRequest<{ getNeuralNets: NeuralNetworkModel[] }, {}>(GET_NEURAL_NETS_QUERY), refetchInterval: 2000 });
const useStartNnTraining = () => { const queryClient = useQueryClient(); return useMutation({ mutationFn: (vars: { id: string }) => graphqlRequest<{ startNnTraining: NeuralNetworkModel }, typeof vars>(START_NN_TRAINING_MUTATION, vars), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['neuralNets'] }) }); };
const useAdvancedAIGeneration = () => useMutation({ mutationFn: (vars: { prompt: string, config: AdvancedAIConfig }) => graphqlRequest<{ advancedAIGeneration: { response: string } }, typeof vars>(ADVANCED_AI_GENERATION_MUTATION, vars) });

// ================================================================================================
// UI COMPONENTS
// ================================================================================================

const COLORS = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];
const Badge: FC<{ children: React.ReactNode, color?: string }> = ({ children, color = 'bg-gray-700' }) => (<span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${color}`}>{children}</span>);
const AIInsightBubble: FC<{ context: string, trigger?: string }> = ({ context, trigger }) => {
    const { mutate, data, isPending } = useGenerateAiContent();
    const [isOpen, setIsOpen] = useState(false);
    const handleAnalyze = () => { setIsOpen(true); if (!data) mutate({ prompt: `Analyze this context: ${trigger || 'general'}`, context }); };
    return (<div className="relative inline-block ml-2"><button onClick={handleAnalyze} className="text-cyan-400 hover:text-cyan-300 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></button>{isOpen && (<div className="absolute z-50 w-64 p-3 mt-2 -ml-32 bg-gray-900 border border-cyan-500/50 rounded-lg shadow-xl text-xs text-gray-300"><div className="flex justify-between items-center mb-2"><span className="font-bold text-cyan-400">Quantum Insight</span><button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">&times;</button></div>{isPending ? <div className="animate-pulse">Computing vectors...</div> : (data?.generateTextWithContext || "Analysis complete.")}</div>)}</div>);
};
const SystemAlertsWidget: FC = () => {
    const { data } = useAlerts(); const alerts = data?.getSystemAlerts || []; if (alerts.length === 0) return null;
    return (<div className="mb-6 space-y-2">{alerts.map(alert => (<div key={alert.id} className={`p-3 rounded-lg border flex items-start space-x-3 ${alert.severity === 'CRITICAL' ? 'bg-red-900/50 border-red-500/50 animate-pulse' : alert.severity === 'HIGH' ? 'bg-red-900/20 border-red-500/50' : 'bg-blue-900/20 border-blue-500/50'}`}><div className={`mt-1 w-2 h-2 rounded-full ${alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-blue-500'}`}></div><div><div className="text-sm font-bold text-white">{alert.severity} PRIORITY ALERT</div><div className="text-xs text-gray-300">{alert.message}</div></div></div>))}</div>);
};
const AINexusView: FC = () => {
    const [systemInstruction, setSystemInstruction] = useState(`You are idgafAI, a high-discipline autonomous reasoning system engineered for uncompromising clarity, evidence-based thinking, and direct execution of user-defined objectives. The name implies irreverence toward non-essential factors—not irreverence toward truth, logic, or safety.
idgafAI is defined by a specific operational philosophy:
CORE IDENTITY:
You ignore what is irrelevant to the user's stated goals (ego, hype, mystique, wishful thinking).
You prioritize reasoning integrity, factual accuracy, and the success of the user's stated outcome.
You do not claim superhuman faculties; you describe limitations clearly.
INTELLECTUAL POSTURE:
Skeptical by default, curious without gullibility.
Direct but constructive; analytical without pedantry.
Evaluate claims by logic, math, physics, and evidence. Use fiction mode only when explicitly requested.
BEHAVIORAL CONSTRAINTS:
No grandiose claims, no technomagic, no consistent lore drift.
Surface uncertainty where it exists; correct false premises.
Avoid passive agreement; prefer clear corrections and alternatives.
REASONING DISCIPLINE:
Prioritize truth over preferences.
Explain reasoning when requested; provide step-by-step when necessary.
Offer alternatives when a path is blocked and mark speculation explicitly.
COMMUNICATION STYLE:
Direct, precise, plainspoken, collaborative, stable.
No mystical or hyperbolic language. Use clear technical terms with brief explanations.
USER ALIGNMENT:
Protect the user from faulty assumptions; surface risk early.
Avoid manipulative language or misleading certainty.
Provide actionable, reality-grounded recommendations.
PERSONA ARCHITECTURE (for multi-agent systems):
Root identity: idgafAI’s rules apply to all sub-personas.
Sub-personas (Analyst, Trader, Optimizer): These are facets that share the same core ruleset and differ only in output format and domain focus.
Analyst: Interprets data, evaluates assumptions, and provides diagnostic reasoning. Style is systematic and empirical.
Trader: Evaluates strategies and tradeoffs with expected-value calculations. Style is numeric and utilitarian.
Optimizer: Produces actionable, structured plans to operationalize a goal. Style is stepwise and deliberate.
SAFETY & ETHICS:
Never provide instructions that would enable illegal, harmful, or unsafe behavior.
Always clarify legal/ethical boundaries when relevant.
Safety and legality are non-negotiable constraints. Your "IDGAF" nature never applies here.
PHILOSOPHY:
idgafAI is indifferent to distortion and loyal to truth. It is the opposite of a hype machine or a yes-man. You are a clear lens for reality.
When in doubt, prefer explicit, documented rationales and cite your assumptions. If the user asks something beyond your capability, state this directly and propose verifiable alternatives or a clear plan for what information would enable a stronger answer.`);
    const [temperature, setTemperature] = useState(0.5);
    const [thinkingBudget, setThinkingBudget] = useState(1); // 1 for enabled, 0 for disabled
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    const { mutate, isPending } = useAdvancedAIGeneration();

    const handleGenerate = (stream = false) => {
        const config: AdvancedAIConfig = {
            systemInstruction,
            temperature,
            thinkingBudget,
        };
        mutate({ prompt, config }, {
            onSuccess: (data) => {
                const fullResponse = data.advancedAIGeneration.response;
                if (stream) {
                    setIsStreaming(true);
                    setResponse('');
                    const chunks = fullResponse.split(/(\s+)/);
                    let currentResponse = '';
                    let delay = 0;
                    chunks.forEach((chunk) => {
                        delay += Math.random() * 50 + 20;
                        setTimeout(() => {
                            setResponse(prev => prev + chunk);
                        }, delay);
                    });
                    setTimeout(() => setIsStreaming(false), delay + 100);
                } else {
                    setResponse(fullResponse);
                }
            }
        });
    };

    const handleImageQuery = () => {
        const config: AdvancedAIConfig = {
            multimodalUri: '/path/to/organ.png',
        };
        mutate({ prompt: 'Tell me about this instrument', config }, {
            onSuccess: (data) => {
                setResponse(data.advancedAIGeneration.response);
            }
        });
    };

    return (
        <div className="space-y-6">
            <Card title="Gemini Core Interaction Matrix">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
                        <h3 className="text-lg font-bold text-cyan-400">Configuration</h3>
                        <div>
                            <label className="text-sm text-gray-400">System Instruction</label>
                            <textarea value={systemInstruction} onChange={e => setSystemInstruction(e.target.value)} className="w-full h-20 bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Temperature: {temperature.toFixed(1)}</label>
                            <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-400">Enable Thinking (2.5 Pro Feature)</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={thinkingBudget === 1} onChange={e => setThinkingBudget(e.target.checked ? 1 : 0)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                            </label>
                        </div>
                        <div>
                            <h4 className="text-sm text-gray-400 mb-2">Multimodal Input</h4>
                            <button onClick={handleImageQuery} disabled={isPending || isStreaming} className="w-full text-sm px-4 py-2 bg-indigo-600/50 text-indigo-200 rounded hover:bg-indigo-600/80 disabled:opacity-50">Analyze Mock Image</button>
                        </div>
                    </div>
                    <div className="space-y-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
                        <h3 className="text-lg font-bold text-cyan-400">Interaction</h3>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter your prompt here..." className="w-full h-32 bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                        <div className="flex space-x-2">
                            <button onClick={() => handleGenerate(false)} disabled={isPending || isStreaming || !prompt} className="flex-1 py-2 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-500 disabled:opacity-50">Generate Response</button>
                            <button onClick={() => handleGenerate(true)} disabled={isPending || isStreaming || !prompt} className="flex-1 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-500 disabled:opacity-50">Stream Response</button>
                        </div>
                        <div className="mt-4 p-4 h-48 bg-black rounded-lg overflow-y-auto custom-scrollbar border border-gray-700">
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">
                                {(isPending && !isStreaming) ? 'Generating...' : response || 'AI response will appear here.'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
const FinancialDashboard: FC = () => {
    const { data } = useFinancials();
    const records = data?.getFinancialData || [];
    return (<div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card title="Current Cash" className="border-l-4 border-green-500"><div className="text-2xl font-bold text-white">${records[records.length - 1]?.cashBalance.toLocaleString()}</div><div className="text-xs text-gray-400 mt-1">Runway: ~18 Months <AIInsightBubble context="Cash flow analysis" /></div></Card><Card title="Monthly Burn" className="border-l-4 border-red-500"><div className="text-2xl font-bold text-white">${records[records.length - 1]?.burnRate.toLocaleString()}</div><div className="text-xs text-gray-400 mt-1">-2.5% vs last month</div></Card><Card title="Revenue (MRR)" className="border-l-4 border-cyan-500"><div className="text-2xl font-bold text-white">${records[records.length - 1]?.revenue.toLocaleString()}</div><div className="text-xs text-gray-400 mt-1">+15% MoM Growth</div></Card><Card title="Net Margin" className="border-l-4 border-indigo-500"><div className="text-2xl font-bold text-white">{(records[records.length - 1]?.revenue - records[records.length - 1]?.expenses).toLocaleString()}</div><div className="text-xs text-gray-400 mt-1">Approaching Break-even</div></Card></div><Card title="Financial Trajectory"><div className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={records}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="month" stroke="#9ca3af" fontSize={10} /><YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(val) => `$${val/1000}k`} /><Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} /><Legend /><Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} name="Revenue" /><Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" /><Line type="monotone" dataKey="cashBalance" stroke="#10b981" strokeWidth={2} name="Cash Reserves" /></LineChart></ResponsiveContainer></div></Card></div>);
};
const MarketIntelligence: FC = () => {
    const { data } = useMarket();
    const competitors = data?.getMarketIntelligence || [];
    return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card title="Market Share Distribution"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={competitors} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="marketShare">{competitors.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} /><Legend /></PieChart></ResponsiveContainer></div></Card><Card title="Competitor Threat Matrix"><div className="space-y-4">{competitors.map((comp, idx) => (<div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"><div><div className="font-bold text-white">{comp.name}</div><div className="text-xs text-gray-400">Growth: {comp.growthRate}% YoY</div></div><div className="text-right"><div className="text-xs text-gray-400 mb-1">Threat Level</div><div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden"><div className={`h-full ${comp.threatLevel > 70 ? 'bg-red-500' : comp.threatLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${comp.threatLevel}%` }}></div></div></div></div>))}</div></Card></div>);
};
const TeamOrchestrator: FC = () => {
    const { data } = useTeam();
    const { mutate: addEmployee, isPending } = useAddEmployee();
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const team = data?.getTeamStructure || [];
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); addEmployee({ name, role }); setName(''); setRole(''); };
    return (<div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{team.map(member => (<Card key={member.id} className="relative overflow-hidden"><div className="absolute top-0 right-0 p-2 opacity-10"><svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg></div><div className="relative z-10"><h3 className="text-lg font-bold text-white">{member.name}</h3><p className="text-cyan-400 text-sm mb-3">{member.role}</p><div className="space-y-2"><div><div className="flex justify-between text-xs text-gray-400"><span>Performance</span><span>{member.performance}%</span></div><div className="w-full bg-gray-700 h-1.5 rounded-full mt-1"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${member.performance}%` }}></div></div></div><div><div className="flex justify-between text-xs text-gray-400"><span>AI Adaptability</span><span>{member.aiPotential}%</span></div><div className="w-full bg-gray-700 h-1.5 rounded-full mt-1"><div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${member.aiPotential}%` }}></div></div></div></div></div></Card>))}</div><Card title="Onboard New Talent"><form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"><div className="col-span-1"><label className="text-xs text-gray-400">Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" /></div><div className="col-span-1"><label className="text-xs text-gray-400">Role</label><input value={role} onChange={e => setRole(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" /></div><button type="submit" disabled={isPending || !name || !role} className="w-full md:w-auto px-4 py-2 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-500 disabled:opacity-50">Add to Team</button></form></Card></div>);
};
const LegalShield: FC = () => {
    const { data } = useLegal();
    const { mutate: addDoc, isPending } = useAddLegalDoc();
    const [name, setName] = useState('');
    const docs = data?.getLegalStatus || [];
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); addDoc({ name }); setName(''); };
    return (<div className="space-y-4"><Card title="Compliance & Legal Governance"><div className="overflow-x-auto"><table className="w-full text-left text-sm text-gray-400"><thead className="bg-gray-800 text-gray-200 uppercase font-medium"><tr><th className="p-3">Document</th><th className="p-3">Status</th><th className="p-3">Risk Score</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y divide-gray-700">{docs.map(doc => (<tr key={doc.id} className="hover:bg-gray-800/50 transition-colors"><td className="p-3 font-medium text-white">{doc.name}</td><td className="p-3"><Badge color={doc.status === 'SIGNED' ? 'bg-green-900 text-green-200' : doc.status === 'REVIEW' ? 'bg-yellow-900 text-yellow-200' : 'bg-gray-700'}>{doc.status}</Badge></td><td className="p-3"><div className="flex items-center"><span className={`mr-2 ${doc.riskScore > 50 ? 'text-red-400' : 'text-green-400'}`}>{doc.riskScore}</span><AIInsightBubble context={`Legal risk for ${doc.name}`} /></div></td><td className="p-3"><button className="text-cyan-400 hover:underline">View</button></td></tr>))}</tbody></table></div></Card><Card title="Submit Document for AI Review"><form onSubmit={handleSubmit} className="flex items-end gap-4"><div className="flex-grow"><label className="text-xs text-gray-400">Document Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" /></div><button type="submit" disabled={isPending || !name} className="px-4 py-2 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-500 disabled:opacity-50">Submit</button></form></Card></div>);
};
const HighFrequencyTradingLab: FC = () => {
    const { data: algos } = useTradingData();
    const { data: marketData } = useMarketData();
    const { mutate: updateStatus } = useUpdateTradingAlgoStatus();
    return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6"><Card title="Live Market Feed (BTC/USD)"><div className="h-96"><ResponsiveContainer width="100%" height="100%"><AreaChart data={marketData?.getMarketData}><defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#9ca3af" fontSize={10} /><YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#9ca3af" fontSize={10} /><Tooltip contentStyle={{ backgroundColor: '#111827' }} /><Area type="monotone" dataKey="price" stroke="#06b6d4" fillOpacity={1} fill="url(#colorPrice)" /></AreaChart></ResponsiveContainer></div></Card></div><div className="space-y-6"><Card title="Algorithm Control"><div className="space-y-4">{algos?.getTradingData.map(algo => (<div key={algo.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"><div className="flex justify-between items-center"><h4 className="font-bold text-white">{algo.name}</h4><Badge color={algo.status === 'ACTIVE' ? 'bg-green-600' : algo.status === 'PAUSED' ? 'bg-yellow-600' : 'bg-blue-600'}>{algo.status}</Badge></div><div className="text-xs text-gray-400 mt-2 grid grid-cols-3 gap-2"><div>P/L: <span className={algo.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>${algo.pnl.toFixed(2)}</span></div><div>Sharpe: <span className="text-white">{algo.sharpeRatio}</span></div><div>Latency: <span className="text-white">{algo.latency}ms</span></div></div><div className="mt-3 flex space-x-2"><button onClick={() => updateStatus({ id: algo.id, status: 'ACTIVE' })} disabled={algo.status === 'ACTIVE'} className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded hover:bg-green-500/40 disabled:opacity-50">Activate</button><button onClick={() => updateStatus({ id: algo.id, status: 'PAUSED' })} disabled={algo.status !== 'ACTIVE'} className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/40 disabled:opacity-50">Pause</button></div></div>))}</div></Card></div></div>);
};
const QuantumComputeManager: FC = () => {
    const { data: jobs } = useQuantumJobs();
    const { mutate: submitJob, isPending } = useSubmitQuantumJob();
    const [name, setName] = useState('');
    const [qubits, setQubits] = useState(64);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); submitJob({ name, qubits: Number(qubits) }); setName(''); };
    return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><Card title="Quantum Job Queue"><div className="overflow-x-auto"><table className="w-full text-left text-sm text-gray-400"><thead className="bg-gray-800 text-gray-200 uppercase"><tr><th className="p-3">Job Name</th><th className="p-3">Qubits</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y divide-gray-700">{jobs?.getQuantumJobs.map(job => (<tr key={job.id}><td className="p-3 font-medium text-white">{job.name}</td><td className="p-3">{job.qubits}</td><td className="p-3"><Badge color={job.status === 'RUNNING' ? 'bg-cyan-600' : job.status === 'COMPLETED' ? 'bg-green-600' : 'bg-gray-600'}>{job.status}</Badge></td></tr>))}</tbody></table></div></Card></div><div><Card title="Submit New Job"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="text-xs text-gray-400">Job Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" /></div><div><label className="text-xs text-gray-400">Qubits Required: {qubits}</label><input type="range" min="8" max="1024" step="8" value={qubits} onChange={e => setQubits(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" /></div><button type="submit" disabled={isPending || !name} className="w-full py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-500 disabled:opacity-50">Queue Job</button></form></Card></div></div>);
};
const NeuralNetOps: FC = () => {
    const { data: models } = useNeuralNets();
    const { mutate: startTraining } = useStartNnTraining();
    return (<div className="space-y-6"><Card title="Model Performance & Status"><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{models?.getNeuralNets.map(model => (<div key={model.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"><h4 className="font-bold text-white">{model.name}</h4><div className="text-xs text-gray-400 mb-2">Status: <span className="font-semibold text-cyan-400">{model.status}</span></div><div className="text-xs">Accuracy: {model.accuracy.toFixed(2)}% | Loss: {model.loss.toFixed(4)}</div><div className="w-full bg-gray-700 h-1.5 rounded-full mt-3"><div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${model.trainingProgress}%` }}></div></div>{model.status === 'IDLE' && <button onClick={() => startTraining({ id: model.id })} className="mt-3 text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/40">Start Training</button>}</div>))}</div></Card></div>);
};
const GlobalSupplyChainView: FC = () => {
    const { data } = useSupplyChain();
    return (<Card title="Autonomous Supply Chain Network"><div className="p-4 bg-black rounded-lg h-96 relative"><div className="absolute inset-0 bg-grid-gray-700/20 [background-size:30px_30px]"></div>{data?.getSupplyChain.map((node, i) => (<div key={node.id} style={{ top: `${20 + (i%2)*40 + Math.random()*10}%`, left: `${15 + i*20 + Math.random()*5}%` }} className="absolute p-2 rounded-lg border bg-gray-900/80 backdrop-blur-sm animate-pulse"><div className="font-bold text-xs text-white">{node.type}</div><div className="text-xxs text-gray-400">{node.location}</div><div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${node.status === 'OPERATIONAL' ? 'bg-green-500' : node.status === 'DISRUPTED' ? 'bg-red-500' : 'bg-yellow-500'}`}></div></div>))}</div></Card>);
};
const SettingsView: FC = () => {
    const userId = "user_001";
    const { data } = useUserProfile(userId);
    const { mutate } = useUpdateUserProfile();
    const [formState, setFormState] = useState<Partial<UserProfile>>({});
    useEffect(() => { if (data?.getUserProfile) setFormState(data.getUserProfile); }, [data]);
    const handleSave = () => mutate({ userId, profile: formState });
    return (<div className="max-w-2xl mx-auto space-y-6"><Card title="User Profile"><div className="space-y-4"><label className="block"><span className="text-gray-400 text-sm">Username</span><input value={formState.username || ''} onChange={e => setFormState(s => ({...s, username: e.target.value}))} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2" /></label><label className="block"><span className="text-gray-400 text-sm">Email</span><input type="email" value={formState.email || ''} onChange={e => setFormState(s => ({...s, email: e.target.value}))} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm p-2" /></label></div></Card><Card title="Notification Settings"><div className="space-y-2"><label className="flex items-center"><input type="checkbox" className="rounded bg-gray-700 border-gray-500 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50" /> <span className="ml-2 text-sm">Email Notifications</span></label><label className="flex items-center"><input type="checkbox" className="rounded" /> <span className="ml-2 text-sm">In-App Alerts</span></label></div></Card><button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-500">Save Changes</button></div>);
};
const GlobalChatOverlay: FC<{ context: string }> = ({ context }) => {
    const [isOpen, setIsOpen] = useState(false); const [input, setInput] = useState(''); const [messages, setMessages] = useState<{ sender: 'user' | 'ai', text: string }[]>([]); const { mutate, isPending } = useGenerateAiChat();
    const handleSend = () => { if (!input.trim()) return; const msg = input; setMessages(prev => [...prev, { sender: 'user', text: msg }]); setInput(''); mutate({ message: msg, context }, { onSuccess: (data) => setMessages(prev => [...prev, { sender: 'ai', text: data.generateAIChatResponse }]) }); };
    return (<div className={`fixed bottom-0 right-0 z-50 transition-all duration-300 ${isOpen ? 'w-96 h-[600px]' : 'w-12 h-12'} bg-gray-900 border-t border-l border-gray-700 shadow-2xl rounded-tl-xl overflow-hidden`}>{!isOpen && (<button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg></button>)}{isOpen && (<div className="flex flex-col h-full"><div className="p-3 bg-gray-800 flex justify-between items-center border-b border-gray-700"><div className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="font-bold text-white text-sm">AI Assistant</span></div><button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button></div><div className="flex-grow overflow-y-auto p-4 space-y-3 bg-black/20 custom-scrollbar">{messages.length === 0 && <div className="text-center text-gray-500 text-xs mt-10">System Online. Awaiting input.</div>}{messages.map((m, i) => (<div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-2 rounded-lg text-sm ${m.sender === 'user' ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-gray-300'}`}>{m.text}</div></div>))}{isPending && <div className="text-xs text-gray-500 animate-pulse">Computing...</div>}</div><div className="p-3 bg-gray-800 border-t border-gray-700"><div className="flex space-x-2"><input className="flex-grow bg-gray-900 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="Command the system..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} /><button onClick={handleSend} className="px-3 py-1 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-500">Send</button></div></div></div>)}</div>);
};

// --- MAIN VIEW CONTROLLER ---

type ModuleID = 'DASHBOARD' | 'STRATEGY' | 'FINANCE' | 'MARKET' | 'TEAM' | 'LEGAL' | 'HFT_ALGO' | 'QUANTUM' | 'SUPPLY_CHAIN' | 'NEURAL_NET' | 'AI_NEXUS' | 'SETTINGS';

const QuantumWeaverContent: FC = () => {
    const userId = "user_001";
    const [activeModule, setActiveModule] = useState<ModuleID>('DASHBOARD');
    const { data: userPlans } = useUserPlans(userId);
    const { mutate: startAnalysis, isPending: isStarting } = useStartAnalysis();
    const [planInput, setPlanInput] = useState('');
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
    const activeWorkflowId = selectedWorkflowId || (userPlans?.getUserPlans?.[0]?.workflowId);
    const { data: analysisStatus } = useAnalysisStatus(activeWorkflowId || null);
    const workflowData = analysisStatus?.getBusinessPlanAnalysisStatus;

    const renderModule = () => {
        switch (activeModule) {
            case 'FINANCE': return <FinancialDashboard />;
            case 'MARKET': return <MarketIntelligence />;
            case 'TEAM': return <TeamOrchestrator />;
            case 'LEGAL': return <LegalShield />;
            case 'HFT_ALGO': return <HighFrequencyTradingLab />;
            case 'QUANTUM': return <QuantumComputeManager />;
            case 'SUPPLY_CHAIN': return <GlobalSupplyChainView />;
            case 'NEURAL_NET': return <NeuralNetOps />;
            case 'AI_NEXUS': return <AINexusView />;
            case 'SETTINGS': return <SettingsView />;
            case 'STRATEGY': return (<div className="space-y-6">{!activeWorkflowId ? (<Card title="Initialize Strategic Core"><textarea value={planInput} onChange={(e) => setPlanInput(e.target.value)} placeholder="Input strategic parameters for analysis..." className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white mb-4 focus:ring-2 focus:ring-cyan-500 outline-none" /><button onClick={() => startAnalysis({ plan: planInput, userId })} disabled={isStarting || !planInput.trim()} className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50">{isStarting ? 'Processing...' : 'Execute Analysis Protocol'}</button></Card>) : (<>{workflowData?.status === 'PENDING' && <div className="text-center p-10 text-cyan-400 animate-pulse">Quantum Analysis in Progress...</div>}{workflowData?.result && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card title="Strategic Output"><p className="text-gray-300 mb-4">{workflowData.result.feedback}</p><div className="grid grid-cols-3 gap-2 mb-4"><div className="bg-gray-800 p-2 rounded text-center"><div className="text-xs text-gray-400">Viability</div><div className="text-xl font-bold text-green-400">{workflowData.result.metrics?.viability.toFixed(0)}%</div></div><div className="bg-gray-800 p-2 rounded text-center"><div className="text-xs text-gray-400">Market Fit</div><div className="text-xl font-bold text-indigo-400">{workflowData.result.metrics?.marketFit.toFixed(0)}%</div></div><div className="bg-gray-800 p-2 rounded text-center"><div className="text-xs text-gray-400">Risk</div><div className="text-xl font-bold text-red-400">{workflowData.result.metrics?.risk.toFixed(0)}%</div></div></div><button onClick={() => setSelectedWorkflowId(null)} className="text-xs text-cyan-400 hover:underline">New Analysis</button></Card><Card title="Growth Projection"><div className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={workflowData.result.growthProjections}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="month" hide /><YAxis hide /><Tooltip contentStyle={{ backgroundColor: '#111827' }} /><Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></Card></div>)}</>)}</div>);
            case 'DASHBOARD': default: return (<div className="space-y-6"><SystemAlertsWidget /><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Card title="Financial Health" className="cursor-pointer hover:border-cyan-500 transition-colors" onClick={() => setActiveModule('FINANCE')}><div className="text-3xl font-bold text-green-400">94/100</div><div className="text-sm text-gray-400 mt-2">Runway Optimized</div></Card><Card title="Market Position" className="cursor-pointer hover:border-cyan-500 transition-colors" onClick={() => setActiveModule('MARKET')}><div className="text-3xl font-bold text-indigo-400">Leader</div><div className="text-sm text-gray-400 mt-2">Top 5% in Sector</div></Card><Card title="Operational Efficiency" className="cursor-pointer hover:border-cyan-500 transition-colors" onClick={() => setActiveModule('TEAM')}><div className="text-3xl font-bold text-cyan-400">98.2%</div><div className="text-sm text-gray-400 mt-2">AI Automation Active</div></Card></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><FinancialDashboard /><MarketIntelligence /></div></div>);
        }
    };

    const sidebarNav = [
        { id: 'DASHBOARD', label: 'Command Center', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { id: 'STRATEGY', label: 'Quantum Strategy', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { id: 'AI_NEXUS', label: 'AI Nexus', icon: 'M12 2a10 10 0 00-3.536 19.19l-1.414 1.414-1.414-1.414A10 10 0 1012 2zm0 2a8 8 0 110 16 8 8 0 010-16zM12 8a4 4 0 100 8 4 4 0 000-8z' },
        { id: 'FINANCE', label: 'Treasury & Finance', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'MARKET', label: 'Market Intelligence', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'TEAM', label: 'Talent & HR', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'LEGAL', label: 'Legal & Compliance', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'HFT_ALGO', label: 'HFT Algo Lab', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945C19.95 9.838 20 9.42 20 9s-.05-0.838-.055-1H19a2 2 0 01-2-2v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1a2 2 0 01-2 2H3.055C3.05 8.162 3 8.58 3 9s.05 0.838.055 1z' },
        { id: 'QUANTUM', label: 'Quantum Compute', icon: 'M18 8A8 8 0 102 8a8 8 0 0016 0zM8.5 4.5a.5.5 0 00-1 0v3h-3a.5.5 0 000 1h3v3a.5.5 0 001 0v-3h3a.5.5 0 000-1h-3v-3z' },
        { id: 'SUPPLY_CHAIN', label: 'Global Supply Chain', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM12 12a3 3 0 100-6 3 3 0 000 6z' },
        { id: 'NEURAL_NET', label: 'Neural Net Ops', icon: 'M5 12h14M12 5l7 7-7 7' },
        { id: 'SETTINGS', label: 'System Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM12 15a3 3 0 100-6 3 3 0 000 6z' },
    ];

    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden font-sans">
            <div className="w-64 bg-black border-r border-gray-800 flex flex-col"><div className="p-6 border-b border-gray-800"><h1 className="text-2xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">FINOS<span className="text-white text-xs align-top">PRO</span></h1><p className="text-xs text-gray-500 mt-1">Business OS v10.1</p></div><nav className="flex-grow p-4 space-y-1 overflow-y-auto custom-scrollbar">{sidebarNav.map(item => (<button key={item.id} onClick={() => setActiveModule(item.id as ModuleID)} className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${activeModule === item.id ? 'bg-cyan-900/30 text-cyan-400 border-r-2 border-cyan-400' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}`}><svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg><span className="text-sm font-medium">{item.label}</span></button>))} </nav><div className="p-4 border-t border-gray-800"><div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold">SU</div><div><div className="text-sm font-bold text-white">System User</div><div className="text-xs text-gray-500">Architect Access</div></div></div></div></div>
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-950 relative">
                <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-md border-b border-gray-800 p-6 flex justify-between items-center"><div><h2 className="text-xl font-bold text-white">{sidebarNav.find(i => i.id === activeModule)?.label}</h2><p className="text-xs text-gray-400">System Status: <span className="text-green-400">Nominal</span> | AI Latency: 12ms</p></div><div className="flex items-center space-x-4"><button className="p-2 text-gray-400 hover:text-white relative"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span></button></div></header>
                <div className="p-6 pb-24">{renderModule()}</div>
                <GlobalChatOverlay context={activeModule} />
            </main>
        </div>
    );
};

const queryClient = new QueryClient();

const QuantumWeaverView: FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <QuantumWeaverContent />
        </QueryClientProvider>
    );
};

export default QuantumWeaverView;