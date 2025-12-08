/**
 * This file contains shared TypeScript interfaces for Workflow definitions,
 * their components (like steps and triggers), and their execution states.
 * These types form the core data model for creating, managing, and running
 * automated processes within the system.
 */

/**
 * Represents a value that can be either a static literal or a dynamic expression
 * string to be evaluated at runtime. Expressions are typically enclosed in
 * double curly braces, e.g., `{{steps.step1.output.userId}}`.
 */
export type DynamicValue<T> = T | string;

/**
 * Defines the authentication method for an API call or a connection to a service.
 */
export interface Authentication {
  /**
   * The type of authentication. While the primary method is Google OAuth2,
   * this structure allows for connecting to a wide variety of APIs.
   */
  type: 'GOOGLE_OAUTH2' | 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'OAUTH2_CLIENT_CREDENTIALS';
  /**
   * A reference to a securely stored credential in a vault. This ID is used
   * to retrieve the actual token or key at execution time.
   */
  credentialId: string;
}

/**
 * Defines what initiates a workflow execution.
 */
export interface WorkflowTrigger {
  id: string;
  name: string;
  type: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT';
  /**
   * Configuration specific to the trigger type.
   * - SCHEDULE: { cron: '0 * * * *', timezone: 'UTC' }
   * - WEBHOOK: { path: '/my-webhook', method: 'POST', schema: {...} }
   * - EVENT: { source: 'github', event: 'push', filters: {...} }
   */
  config: Record<string, any>;
  enabled: boolean;
}

// --- Step Definitions ---

/**
 * Base interface for all workflow steps, containing common properties.
 */
export interface BaseStep {
  /** A unique identifier for the step within the workflow. */
  id: string;
  /** A human-readable name for the step. */
  name: string;
  /** An optional description of what the step does. */
  description?: string;
  /**
   * An array of step IDs that must complete successfully before this step can run.
   * If omitted, steps are assumed to run in the order they are defined.
   */
  dependsOn?: string[];
  /**
   * A dynamic expression that must evaluate to true for the step to run.
   * If it evaluates to false, the step is skipped.
   * Example: `{{steps.step1.output.status === 'success'}}`
   */
  condition?: string;
}

/**
 * A step that executes a pre-defined API operation from an OpenAPI specification.
 */
export interface ApiCallStep extends BaseStep {
  type: 'API_CALL';
  /** A reference to a registered API definition. */
  apiId: string;
  /** The `operationId` from the OpenAPI specification for the desired endpoint. */
  operationId: string;
  /**
   * Input parameters for the API call, mapped from the workflow context.
   * Values can be static or dynamic expressions.
   */
  parameters: {
    path?: Record<string, DynamicValue<any>>;
    query?: Record<string, DynamicValue<any>>;
    header?: Record<string, DynamicValue<any>>;
    cookie?: Record<string, DynamicValue<any>>;
    body?: DynamicValue<any>;
  };
  /**
   * Optional authentication override for this specific step.
   * If not provided, the API's default authentication is used.
   */
  authentication?: Authentication;
}

/**
 * A step that executes a custom script, often for data transformation or logic.
 * This can serve as a "pre-script" or "post-script" for other steps.
 */
export interface ScriptStep extends BaseStep {
  type: 'SCRIPT';
  runtime: 'JAVASCRIPT_NODE' | 'PYTHON_3';
  /** The source code to be executed in an isolated environment. */
  code: string;
  /** An object of key-value pairs passed into the script's global scope. */
  inputs: Record<string, DynamicValue<any>>;
  /** Maximum execution time in seconds before the script is terminated. Defaults to 30. */
  timeoutSeconds?: number;
}

/**
 * A step for conditional branching (if/else logic) to direct workflow execution flow.
 */
export interface ConditionStep extends BaseStep {
  type: 'CONDITION';
  /**
   * A list of logical comparisons to evaluate. All must be true for the `ifTrue` path to be taken.
   */
  conditions: {
    /** The left-hand side of the comparison (e.g., `{{steps.api_call.output.statusCode}}`). */
    left: DynamicValue<any>;
    /** The comparison operator. */
    operator: 'EQUAL' | 'NOT_EQUAL' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'EXISTS' | 'IS_EMPTY';
    /** The right-hand side of the comparison (e.g., 200). */
    right?: DynamicValue<any>; // Optional for operators like EXISTS
  }[];
  /** The ID of the next step to execute if all conditions are true. */
  ifTrue: string;
  /** The ID of the next step to execute if any condition is false. */
  ifFalse: string;
}

/**
 * A step that interacts with Google Drive for file operations.
 */
export interface GoogleDriveStep extends BaseStep {
  type: 'GOOGLE_DRIVE';
  operation: 'UPLOAD_FILE' | 'DOWNLOAD_FILE' | 'CREATE_FOLDER' | 'LIST_FILES' | 'DELETE_FILE_OR_FOLDER' | 'GET_FILE_METADATA';
  /**
   * Parameters for the Google Drive operation.
   * e.g., { fileName: 'report.csv', content: '{{steps.script1.output.csv}}', parentFolderId: '...' }
   */
  parameters: Record<string, DynamicValue<any>>;
  /** Requires a Google OAuth2 credential with the necessary Drive scopes. */
  authentication: Authentication;
}

/**
 * A step that triggers a GitHub Actions workflow and waits for its completion.
 */
export interface GitHubActionStep extends BaseStep {
  type: 'GITHUB_ACTION';
  owner: DynamicValue<string>;
  repo: DynamicValue<string>;
  /** The workflow file name, e.g., 'ci.yml'. */
  workflowId: DynamicValue<string>;
  /** The Git ref (branch, tag, or commit SHA) to run the workflow on. */
  ref: DynamicValue<string>;
  /** Inputs to pass to the GitHub Actions workflow's `workflow_dispatch` trigger. */
  inputs?: Record<string, DynamicValue<any>>;
  /** Authentication for accessing the GitHub repository and triggering the action. */
  authentication: Authentication;
  /** If true, the step will wait for the GitHub Action to complete. Defaults to true. */
  waitForCompletion?: boolean;
}

/**
 * A union type representing any possible workflow step.
 * New step types can be added here to extend workflow capabilities.
 */
export type WorkflowStep = ApiCallStep | ScriptStep | ConditionStep | GoogleDriveStep | GitHubActionStep;

/**
 * The complete, versioned definition of a workflow.
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: number;
  /** Global variables available to all steps in the workflow via `{{variables.myVar}}`. */
  variables?: Record<string, any>;
  /** The set of triggers that can start this workflow. */
  triggers: WorkflowTrigger[];
  /** The collection of steps that constitute the workflow's logic. */
  steps: WorkflowStep[];
  /** Metadata about the workflow. */
  metadata?: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
  };
}

// --- Execution State Types ---

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'SKIPPED';

/**
 * The state and results of a single step during a workflow execution.
 */
export interface StepExecutionRecord {
  stepId: string;
  status: ExecutionStatus;
  startTime?: string;
  endTime?: string;
  /** The actual inputs provided to the step after resolving all dynamic values. */
  inputs?: any;
  /** The output produced by the step, accessible to subsequent steps. */
  outputs?: any;
  /** Detailed error information if the step failed. */
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  /** A log of events or console output from the step's execution. */
  logs?: { timestamp: string; level: 'INFO' | 'WARN' | 'ERROR'; message: string }[];
}

/**
 * Represents a single run (an instance) of a workflow from start to finish.
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  /** Information about the trigger that initiated this execution. */
  trigger: {
    type: WorkflowTrigger['type'];
    payload?: any;
  };
  /** The resolved global variables for this specific run. */
  variables: Record<string, any>;
  /** A map of step IDs to their execution records, representing the run's history. */
  stepStates: Record<string, StepExecutionRecord>;
  /** The final output of the entire workflow, if any. */
  output?: any;
}