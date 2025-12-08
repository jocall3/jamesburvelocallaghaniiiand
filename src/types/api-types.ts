/**
 * @file src/types/api-types.ts
 * @description Shared TypeScript interfaces for API responses, requests, and core data models.
 */

// =================================================================
// Generic API Structures
// =================================================================

/**
 * A standardized wrapper for successful API responses.
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * A standardized wrapper for failed API responses.
 */
export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

/**
 * A detailed error object.
 */
export interface ApiError {
  code: string; // e.g., 'UNAUTHORIZED', 'VALIDATION_FAILED', 'INTERNAL_SERVER_ERROR'
  message: string;
  details?: Record<string, any>; // For validation errors, etc.
}

// =================================================================
// Authentication & User
// =================================================================

/**
 * Represents the profile of a logged-in user, typically from an OAuth provider like Google.
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Represents the client-side authentication state.
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  expiresAt: number | null; // UTC timestamp
}

// =================================================================
// External API Connection Configuration
// =================================================================

/**
 * Configuration for a single external API that the user wants to integrate with.
 */
export interface ApiConnectionConfig {
  id: string;
  name: string; // User-friendly name, e.g., "My Stripe Dev API"
  apiUrl: string;
  authentication: ApiAuthentication;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * A union type for various authentication methods an external API might use.
 */
export type ApiAuthentication =
  | { type: 'OAUTH2_CLIENT_CREDENTIALS'; clientId: string; clientSecret: string; tokenUrl: string; scopes?: string[]; }
  | { type: 'API_KEY'; key: string; headerName: string; location: 'header' | 'query'; }
  | { type: 'BEARER_TOKEN'; token: string; }
  | { type: 'BASIC'; username: string; password?: string; }
  | { type: 'NONE'; };

// =================================================================
// Core API Project Definition
// =================================================================

// Note: In a real-world scenario, these would be replaced by types from a library like 'openapi-types'.
// Using generic placeholders for self-containment.
export type OpenApiSchemaObject = Record<string, any>;
export type OpenApiOperationObject = Record<string, any>;
export type OpenApiPathItemObject = Record<string, any>;
export type OpenApiDocument = Record<string, any>; // Represents a full OpenAPI 3.1.0 document

/**
 * The main entity representing a complete, generated API project.
 * This structure includes the OpenAPI specification and all custom extensions.
 */
export interface ApiProject {
  id: string;
  name: string;
  version: string;
  description?: string;
  ownerId: string; // User ID of the creator
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string

  /** The core OpenAPI 3.1.0 specification document. */
  openapi: OpenApiDocument;

  /** Custom extensions beyond the standard OpenAPI specification. */
  extensions: {
    scripts: ApiScripts;
    workflows: Workflow[];
    integrations: Integrations;
  };
}

// =================================================================
// Scripts (Pre-request / Post-response)
// =================================================================

/**
 * Defines pre-request and post-response scripts, similar to Postman.
 */
export interface ApiScripts {
  /** Scripts that run before any request in the project. */
  preRequest?: Script;
  /** Scripts that run after any response in the project. */
  postResponse?: Script;
  /** Scripts specific to an operationId. */
  operations?: Record<string, {
    preRequest?: Script;
    postResponse?: Script;
  }>;
}

/**
 * Represents a piece of executable code.
 */
export interface Script {
  id: string;
  type: 'javascript'; // Could be extended to 'python', 'typescript' etc. in the future
  code: string;
}

// =================================================================
// Workflows
// =================================================================

/**
 * A defined sequence of operations, scripts, and logic.
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  /** Variables and environment for this workflow. */
  contextSchema?: Record<string, any>; // JSON Schema for initial context
}

/**
 * A union type representing all possible steps in a workflow.
 */
export type WorkflowStep =
  | ApiCallStep
  | ScriptStep
  | ConditionStep
  | LoopStep
  | DelayStep;

interface BaseWorkflowStep {
  id: string;
  name: string;
  description?: string;
}

export interface ApiCallStep extends BaseWorkflowStep {
  type: 'API_CALL';
  /** References an operationId from the openapi spec. */
  operationId: string;
  /** Parameters to pass to the API call, can use variables from the context (e.g., "{{variable}}"). */
  parameters?: Record<string, any>;
  /** Which API connection to use for this call. */
  connectionId: string;
}

export interface ScriptStep extends BaseWorkflowStep {
  type: 'SCRIPT';
  /** Inline script or reference to a script ID. */
  script: Script;
}

export interface ConditionStep extends BaseWorkflowStep {
  type: 'CONDITION';
  /** A JavaScript expression that evaluates to true or false against the context. */
  condition: string;
  /** Steps to execute if the condition is true. */
  ifTrue: WorkflowStep[];
  /** Steps to execute if the condition is false. */
  ifFalse?: WorkflowStep[];
}

export interface LoopStep extends BaseWorkflowStep {
  type: 'LOOP';
  loopType: 'FOR_EACH';
  /** The array or object to iterate over (e.g., "context.users"). */
  iterator: string;
  /** The variable name for each item in the loop (e.g., "user"). */
  variableName: string;
  /** The steps to execute for each iteration. */
  steps: WorkflowStep[];
}

export interface DelayStep extends BaseWorkflowStep {
    type: 'DELAY';
    /** The duration to wait in milliseconds. */
    durationMs: number;
}

// =================================================================
// Integrations (Google Drive, GitHub)
// =================================================================

/**
 * Configuration for external services linked to an ApiProject.
 */
export interface Integrations {
  googleDrive?: GoogleDriveIntegration;
  github?: GitHubIntegration;
}

export interface GoogleDriveIntegration {
  /** The folder ID in Google Drive where files for this project are saved. */
  rootFolderId: string;
}

export interface GitHubIntegration {
  /** The repository URL (e.g., "https://github.com/owner/repo"). */
  repositoryUrl: string;
  /** The branch to work on. */
  defaultBranch: string;
}

// =================================================================
// Application API Request & Response Payloads
// =================================================================

export interface CreateApiProjectRequest {
  name: string;
  description?: string;
  /** Can be initialized with a base OpenAPI document. */
  initialOpenApiDoc?: OpenApiDocument;
}

export interface UpdateApiProjectRequest {
  name?: string;
  description?: string;
  openapi?: OpenApiDocument;
  extensions?: Partial<ApiProject['extensions']>;
}

export interface CreateWorkflowRequest {
  projectId: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface ExecuteWorkflowRequest {
  workflowId: string;
  /** Initial context/variables for the workflow run. */
  initialContext?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  executionId: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING';
  startedAt: string; // ISO 8601
  finishedAt?: string; // ISO 8601
  logs: { timestamp: string; message: string; level: 'INFO' | 'ERROR' | 'DEBUG' }[];
  finalContext: Record<string, any>;
  error?: ApiError;
}