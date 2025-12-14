import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// --- Interfaces for AI Model States ---
interface ModelConfig {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  // Add other common model parameters like top_k, frequency_penalty, presence_penalty
  [key: string]: any; // Allow for vendor-specific configurations
}

// --- Interfaces for Prompt Configurations ---
interface PromptHistoryEntry {
  id: string;
  template: string;
  timestamp: string;
  version?: string; // Corresponds to APP_125_DevEx_PromptVersionControl
}

// --- Interfaces for Agent Orchestration ---
interface AgentOutput {
  timestamp: string;
  data: any; // The actual output from the agent
  sourceAgentId: string;
  // Potentially include metadata like tool calls, intermediate steps
}

interface ActiveAgent {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'error' | 'queued';
  lastUpdate: string;
  currentTask?: string; // A brief description of what the agent is currently doing
  input?: any; // The initial input given to the agent
}

// --- Interfaces for Evaluation Results ---
interface EvaluationResults {
  fairnessReport: any | null; // Data from APP_119_Eval_ModelFairnessAuditor
  driftReport: any | null;    // Data from APP_122_Eval_ModelDriftDetector
  hallucinationReport: any | null; // Data from APP_124_Eval_HallucinationDetector
  benchmarkResults: any | null; // Data from APP_123_Eval_BenchmarkService
}

// --- Overall AI State Interface ---
interface AIState {
  currentModel: string | null;
  availableModels: string[];
  modelConfigs: Record<string, ModelConfig>;
  currentPromptTemplate: string;
  promptHistory: PromptHistoryEntry[];
  activeAgents: ActiveAgent[];
  agentOutputs: Record<string, AgentOutput[]>; // Keyed by agent ID
  evaluationResults: EvaluationResults;
  isLoading: boolean;
  error: string | null;
}

// --- AI Context Type Interface (State + Actions) ---
interface AIContextType extends AIState {
  selectModel: (modelName: string) => void;
  updateModelConfig: (modelName: string, config: Partial<ModelConfig>) => void;
  loadPromptTemplate: (template: string) => void;
  savePromptTemplate: (template: string, version?: string) => void;
  executeAgent: (agentId: string, agentName: string, input: any) => Promise<void>;
  stopAgent: (agentId: string) => void;
  fetchEvaluationResults: (type: keyof EvaluationResults) => Promise<void>;
  clearError: () => void;
  // Future actions could include:
  // runPromptA_BTest: (promptA: string, promptB: string, metric: string) => Promise<any>; (APP_127_DevEx_A_B_TestingFramework)
  // getPromptVersions: (templateId: string) => Promise<PromptHistoryEntry[]>; (APP_125_DevEx_PromptVersionControl)
  // deployAgent: (agentConfig: any) => Promise<string>; (APP_129_DevEx_CI_CD_Orchestrator)
}

// --- Initial State for the AI Context ---
const initialState: AIState = {
  currentModel: 'gpt-4o', // Default selected model
  availableModels: ['gpt-4o', 'claude-3-opus', 'llama-3-70b', 'mistral-large'], // Example models
  modelConfigs: {
    'gpt-4o': { temperature: 0.7, max_tokens: 4096, top_p: 1.0 },
    'claude-3-opus': { temperature: 0.6, max_tokens: 8192, top_p: 0.9 },
    'llama-3-70b': { temperature: 0.8, max_tokens: 2048, top_p: 0.95 },
    'mistral-large': { temperature: 0.75, max_tokens: 4096, top_p: 0.9 },
  },
  currentPromptTemplate: 'You are an expert AI assistant. Respond to the user\'s query: {query}',
  promptHistory: [],
  activeAgents: [],
  agentOutputs: {},
  evaluationResults: {
    fairnessReport: null,
    driftReport: null,
    hallucinationReport: null,
    benchmarkResults: null,
  },
  isLoading: false,
  error: null,
};

// --- Create the AI Context ---
const AIContext = createContext<AIContextType | undefined>(undefined);

// --- AI Provider Component ---
interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [state, setState] = useState<AIState>(initialState);

  /**
   * Selects the currently active AI model.
   * @param modelName The name of the model to select.
   */
  const selectModel = useCallback((modelName: string) => {
    setState(prevState => ({ ...prevState, currentModel: modelName }));
  }, []);

  /**
   * Updates configuration parameters for a specific AI model.
   * @param modelName The name of the model whose configuration is being updated.
   * @param config A partial object containing the new configuration parameters.
   */
  const updateModelConfig = useCallback((modelName: string, config: Partial<ModelConfig>) => {
    setState(prevState => ({
      ...prevState,
      modelConfigs: {
        ...prevState.modelConfigs,
        [modelName]: {
          ...prevState.modelConfigs[modelName],
          ...config,
        },
      },
    }));
  }, []);

  /**
   * Loads a new prompt template into the current prompt state.
   * @param template The new prompt template string.
   */
  const loadPromptTemplate = useCallback((template: string) => {
    setState(prevState => ({ ...prevState, currentPromptTemplate: template }));
  }, []);

  /**
   * Saves the current prompt template to history, optionally with a version.
   * This would typically interact with APP_125_DevEx_PromptVersionControl.
   * @param template The prompt template string to save.
   * @param version An optional version identifier for the prompt.
   */
  const savePromptTemplate = useCallback((template: string, version?: string) => {
    const newEntry: PromptHistoryEntry = {
      id: `prompt-${Date.now()}`,
      template,
      timestamp: new Date().toISOString(),
      version,
    };
    setState(prevState => ({
      ...prevState,
      promptHistory: [newEntry, ...prevState.promptHistory].slice(0, 50), // Keep a history of the last 50 prompts
      currentPromptTemplate: template, // Ensure the current template reflects the saved one
    }));
    console.log(`[AIContext] Prompt saved (version: ${version || 'N/A'}):`, template);
    // In a real application, this would trigger an API call to APP_125_DevEx_PromptVersionControl
  }, []);

  /**
   * Initiates the execution of an AI agent.
   * This simulates interaction with agent orchestration services like APP_114_Agents_SwarmConsensusManager.
   * @param agentId A unique identifier for the agent instance.
   * @param agentName A human-readable name for the agent.
   * @param input The input data for the agent to process.
   */
  const executeAgent = useCallback(async (agentId: string, agentName: string, input: any) => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
      activeAgents: [...prevState.activeAgents, {
        id: agentId,
        name: agentName,
        status: 'running',
        lastUpdate: new Date().toISOString(),
        currentTask: `Processing input: ${JSON.stringify(input).substring(0, 100)}...`,
        input,
      }],
    }));

    try {
      console.log(`[AIContext] Executing agent ${agentName} (${agentId}) with input:`, input);
      // Simulate an asynchronous operation, e.g., an API call to an agent service
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000)); // Simulate network/processing delay

      const simulatedOutput = {
        result: `Agent ${agentName} successfully processed input: ${JSON.stringify(input).substring(0, 100)}...`,
        details: { agentId, processedAt: new Date().toISOString(), modelUsed: state.currentModel },
      };

      setState(prevState => ({
        ...prevState,
        activeAgents: prevState.activeAgents.map(agent =>
          agent.id === agentId ? { ...agent, status: 'completed', lastUpdate: new Date().toISOString(), currentTask: 'Completed successfully' } : agent
        ),
        agentOutputs: {
          ...prevState.agentOutputs,
          [agentId]: [...(prevState.agentOutputs[agentId] || []), { timestamp: new Date().toISOString(), data: simulatedOutput, sourceAgentId: agentId }],
        },
        isLoading: false,
      }));
      console.log(`[AIContext] Agent ${agentName} (${agentId}) completed.`);
    } catch (err: any) {
      setState(prevState => ({
        ...prevState,
        activeAgents: prevState.activeAgents.map(agent =>
          agent.id === agentId ? { ...agent, status: 'error', lastUpdate: new Date().toISOString(), currentTask: `Error: ${err.message}` } : agent
        ),
        error: `Failed to execute agent ${agentName}: ${err.message}`,
        isLoading: false,
      }));
      console.error(`[AIContext] Error executing agent ${agentName} (${agentId}):`, err);
    }
  }, [state.currentModel]); // Dependency on currentModel if agents use it

  /**
   * Stops a running AI agent.
   * @param agentId The unique identifier of the agent to stop.
   */
  const stopAgent = useCallback((agentId: string) => {
    setState(prevState => ({
      ...prevState,
      activeAgents: prevState.activeAgents.map(agent =>
        agent.id === agentId && agent.status === 'running'
          ? { ...agent, status: 'paused', lastUpdate: new Date().toISOString(), currentTask: 'Stopped by user' }
          : agent
      ),
    }));
    console.log(`[AIContext] Agent ${agentId} stopped.`);
  }, []);

  /**
   * Fetches specific AI model evaluation results.
   * This simulates interaction with services like APP_119, APP_122, APP_123, APP_124.
   * @param type The type of evaluation report to fetch ('fairnessReport', 'driftReport', etc.).
   */
  const fetchEvaluationResults = useCallback(async (type: keyof EvaluationResults) => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      console.log(`[AIContext] Fetching ${type} evaluation results...`);
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 500)); // Simulate network delay

      let results: any = null;
      switch (type) {
        case 'fairnessReport':
          results = {
            metrics: { demographic_parity: 0.85, equal_opportunity: 0.92, disparate_impact: 0.8 },
            recommendations: ['Review training data for underrepresented groups.', 'Implement re-weighting for feature X.'],
            timestamp: new Date().toISOString(),
            source: 'APP_119_Eval_ModelFairnessAuditor',
          };
          break;
        case 'driftReport':
          results = {
            drift_detected: true,
            features_drifted: ['input_distribution_age', 'output_sentiment_score'],
            severity: 'medium',
            drift_magnitude: 0.15,
            timestamp: new Date().toISOString(),
            source: 'APP_122_Eval_ModelDriftDetector',
          };
          break;
        case 'hallucinationReport':
          results = {
            hallucination_rate: 0.03,
            examples: [
              { query: 'What is the capital of Narnia?', response: 'The capital of Narnia is Cair Paravel.', fact_check: 'False (fictional).' },
              { query: 'Who invented the internet?', response: 'Tim Berners-Lee invented the internet.', fact_check: 'Partially True (WWW), but Vint Cerf/Robert Kahn for TCP/IP.' }
            ],
            timestamp: new Date().toISOString(),
            source: 'APP_124_Eval_HallucinationDetector',
          };
          break;
        case 'benchmarkResults':
          results = {
            benchmark_name: 'Financial Q&A v2',
            score: 88.5,
            model_comparison: { 'gpt-4o': 88.5, 'claude-3-opus': 87.1, 'llama-3-70b': 82.3 },
            timestamp: new Date().toISOString(),
            source: 'APP_123_Eval_BenchmarkService',
          };
          break;
        default:
          throw new Error(`Unknown evaluation type: ${type}`);
      }

      setState(prevState => ({
        ...prevState,
        evaluationResults: {
          ...prevState.evaluationResults,
          [type]: results,
        },
        isLoading: false,
      }));
      console.log(`[AIContext] Fetched ${type} results:`, results);
    } catch (err: any) {
      setState(prevState => ({
        ...prevState,
        error: `Failed to fetch ${type} results: ${err.message}`,
        isLoading: false,
      }));
      console.error(`[AIContext] Error fetching ${type} results:`, err);
    }
  }, []);

  /**
   * Clears any active error messages in the context.
   */
  const clearError = useCallback(() => {
    setState(prevState => ({ ...prevState, error: null }));
  }, []);

  // --- Memoized Context Value ---
  const contextValue: AIContextType = {
    ...state,
    selectModel,
    updateModelConfig,
    loadPromptTemplate,
    savePromptTemplate,
    executeAgent,
    stopAgent,
    fetchEvaluationResults,
    clearError,
  };

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
};

// --- Custom Hook to Consume the AI Context ---
export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};