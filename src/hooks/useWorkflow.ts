import { useState, useCallback } from 'react';
// Assuming an authenticated API client exists that handles Google Auth tokens.
import { apiClient } from '../api/apiClient';

/**
 * Represents the possible statuses of a workflow execution.
 */
export type WorkflowStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';

/**
 * Represents a single log entry or output from a workflow step.
 */
export interface WorkflowLog {
    timestamp: string;
    stepId: string;
    stepName: string;
    message: string;
    data?: any;
    type: 'log' | 'error' | 'start' | 'end' | 'info';
}

/**
 * The state of the workflow execution managed by the hook.
 */
export interface WorkflowExecutionState {
    executionId: string | null;
    workflowId: string | null;
    status: WorkflowStatus;
    isLoading: boolean; // True when a control action (start, stop, etc.) is in progress.
    currentStep: string | null;
    output: WorkflowLog[];
    error: string | null;
    result: any | null; // Final result of the workflow
}

/**
 * Defines the inputs for starting a workflow.
 */
export interface WorkflowStartInputs {
    [key: string]: any;
}

// Initial state for the hook
const initialState: WorkflowExecutionState = {
    executionId: null,
    workflowId: null,
    status: 'idle',
    isLoading: false,
    currentStep: null,
    output: [],
    error: null,
    result: null,
};

/**
 * Custom hook to interact with the workflow engine.
 * Provides functions to start, stop, pause, and resume workflows,
 * and manages the state of the workflow execution.
 *
 * @returns The current workflow state and control functions.
 */
export const useWorkflow = () => {
    const [state, setState] = useState<WorkflowExecutionState>(initialState);

    /**
     * A generic handler for API calls to manage loading and error states.
     * @param apiCall The async function to execute.
     * @param action A string describing the action for error messages.
     * @returns The result of the API call or null on failure.
     */
    const handleApiCall = async <T>(apiCall: () => Promise<T>, action: string): Promise<T | null> => {
        setState(prevState => ({ ...prevState, isLoading: true, error: null }));
        try {
            const result = await apiCall();
            setState(prevState => ({ ...prevState, isLoading: false }));
            return result;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || `Failed to ${action} workflow.`;
            console.error(`Workflow Error (${action}):`, err);
            setState(prevState => ({
                ...prevState,
                isLoading: false,
                status: 'error',
                error: errorMessage,
            }));
            return null;
        }
    };

    /**
     * Starts a new workflow execution.
     * @param workflowId The ID of the workflow definition to run.
     * @param inputs The initial data to pass to the workflow.
     */
    const startWorkflow = useCallback(async (workflowId: string, inputs: WorkflowStartInputs) => {
        // Reset state for a new run
        setState({ ...initialState, isLoading: true, status: 'running', workflowId });

        // In a real application, you would establish a WebSocket or SSE connection here
        // to receive real-time updates on status, currentStep, and output.
        // This example simulates a single API call that might return the final result
        // or just an execution ID to poll/listen on.

        const result = await handleApiCall(
            () => apiClient.post(`/workflows/${workflowId}/execute`, inputs),
            'start'
        );

        if (result) {
            // The backend should return the initial state of the execution
            const { executionId, status, output, finalResult } = result.data;
            setState(prevState => ({
                ...prevState,
                executionId,
                status: status || 'completed', // Assume it completes if no further status is given
                output: output || [],
                result: finalResult || null,
            }));
        }
    }, []);

    /**
     * Stops the currently running workflow execution.
     */
    const stopWorkflow = useCallback(async () => {
        if (!state.executionId) {
            console.warn('Cannot stop workflow: no execution ID.');
            return;
        }

        const result = await handleApiCall(
            () => apiClient.post(`/workflow-executions/${state.executionId}/stop`),
            'stop'
        );

        if (result) {
            setState(prevState => ({
                ...prevState,
                status: 'stopped',
                currentStep: null,
            }));
        }
    }, [state.executionId]);

    /**
     * Pauses the currently running workflow execution.
     */
    const pauseWorkflow = useCallback(async () => {
        if (!state.executionId || state.status !== 'running') {
            console.warn('Cannot pause workflow: no running execution ID.');
            return;
        }

        const result = await handleApiCall(
            () => apiClient.post(`/workflow-executions/${state.executionId}/pause`),
            'pause'
        );

        if (result) {
            setState(prevState => ({
                ...prevState,
                status: 'paused',
            }));
        }
    }, [state.executionId, state.status]);

    /**
     * Resumes a paused workflow execution.
     */
    const resumeWorkflow = useCallback(async () => {
        if (!state.executionId || state.status !== 'paused') {
            console.warn('Cannot resume workflow: no paused execution ID.');
            return;
        }

        const result = await handleApiCall(
            () => apiClient.post(`/workflow-executions/${state.executionId}/resume`),
            'resume'
        );

        if (result) {
            setState(prevState => ({
                ...prevState,
                status: 'running',
            }));
        }
    }, [state.executionId, state.status]);

    /**
     * Resets the workflow state to its initial idle condition.
     */
    const resetWorkflow = useCallback(() => {
        // In a real app, you might also want to ensure any open connections (WebSockets) are closed here.
        setState(initialState);
    }, []);

    // Note: For real-time updates, a WebSocket or Server-Sent Events (SSE)
    // implementation would be necessary. This would typically involve a `useEffect`
    // hook that listens for messages when the workflow is in a 'running' state.
    //
    // Example using useEffect and SSE:
    //
    // useEffect(() => {
    //   let eventSource: EventSource | null = null;
    //
    //   if (state.status === 'running' && state.executionId) {
    //     eventSource = new EventSource(`/api/workflow-executions/${state.executionId}/stream`);
    //
    //     eventSource.onmessage = (event) => {
    //       const update = JSON.parse(event.data);
    //       setState(prevState => ({
    //         ...prevState,
    //         currentStep: update.currentStep || prevState.currentStep,
    //         output: [...prevState.output, ...(update.logs || [])],
    //         status: update.status || prevState.status,
    //         result: update.finalResult !== undefined ? update.finalResult : prevState.result,
    //       }));
    //     };
    //
    //     eventSource.onerror = () => {
    //       setState(prevState => ({ ...prevState, status: 'error', error: 'Connection to workflow stream lost.' }));
    //       eventSource?.close();
    //     };
    //   }
    //
    //   return () => {
    //     eventSource?.close();
    //   };
    // }, [state.status, state.executionId]);

    return {
        ...state,
        startWorkflow,
        stopWorkflow,
        pauseWorkflow,
        resumeWorkflow,
        resetWorkflow,
    };
};