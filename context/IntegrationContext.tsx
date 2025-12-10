import React, { createContext, useReducer, useContext, ReactNode } from 'react';

// --- 1. Define Types ---

/**
 * Represents the name of a major tech company or third-party service integration.
 * This list can be expanded as needed.
 */
export type IntegrationName =
  | 'Google'
  | 'Microsoft'
  | 'Apple'
  | 'Amazon'
  | 'Meta' // Facebook, Instagram, WhatsApp
  | 'X' // Formerly Twitter
  | 'LinkedIn'
  | 'GitHub'
  | 'Slack'
  | 'Stripe'
  | 'Shopify'
  | 'Salesforce'
  | 'Adobe'
  | 'Oracle'
  | 'SAP'
  | 'Zoom'
  | 'Dropbox'
  | 'Atlassian' // Jira, Confluence
  | 'HubSpot';

/**
 * Represents the current status of an integration.
 */
export type IntegrationStatus = 'connected' | 'disconnected' | 'pending' | 'error';

/**
 * Generic configuration and data for a connected integration.
 * This interface is designed to be flexible and can be extended with provider-specific details.
 */
export interface IntegrationConfig {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp for token expiration
  scope?: string; // OAuth scopes granted
  userInfo?: {
    id: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    [key: string]: any; // Allow for additional provider-specific user info fields
  };
  [key: string]: any; // Allow for additional provider-specific configuration fields
}

/**
 * Represents the state for a single integration.
 */
export interface IntegrationStateItem {
  name: IntegrationName;
  status: IntegrationStatus;
  config?: IntegrationConfig;
  error?: string; // Stores an error message if the integration failed
  isLoading: boolean; // Indicates if an operation (connect/disconnect) is in progress
}

/**
 * The overall state for all third-party integrations, indexed by IntegrationName.
 */
export type IntegrationState = Record<IntegrationName, IntegrationStateItem>;

// --- 2. Define Actions ---

/**
 * Defines the possible actions that can be dispatched to the integration reducer.
 */
export type IntegrationAction =
  | { type: 'SET_INTEGRATION_STATUS'; payload: { name: IntegrationName; status: IntegrationStatus; error?: string } }
  | { type: 'SET_INTEGRATION_CONFIG'; payload: { name: IntegrationName; config: IntegrationConfig } }
  | { type: 'SET_INTEGRATION_LOADING'; payload: { name: IntegrationName; isLoading: boolean } }
  | { type: 'RESET_INTEGRATION'; payload: { name: IntegrationName } }
  | { type: 'INITIALIZE_INTEGRATIONS'; payload: Partial<IntegrationState> }; // For loading initial state from storage/API

// --- 3. Initial State ---

/**
 * A comprehensive list of all supported integration names.
 * This array is used to initialize the state and ensure all integrations are accounted for.
 */
export const allIntegrationNames: IntegrationName[] = [
  'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'X', 'LinkedIn', 'GitHub',
  'Slack', 'Stripe', 'Shopify', 'Salesforce', 'Adobe', 'Oracle', 'SAP',
  'Zoom', 'Dropbox', 'Atlassian', 'HubSpot'
];

/**
 * Creates the initial state for all integrations, setting them to 'disconnected' by default.
 */
const createInitialIntegrationState = (): IntegrationState => {
  const initialState: Partial<IntegrationState> = {};
  allIntegrationNames.forEach(name => {
    initialState[name] = {
      name,
      status: 'disconnected',
      isLoading: false,
    };
  });
  return initialState as IntegrationState;
};

const initialState: IntegrationState = createInitialIntegrationState();

// --- 4. Reducer Function ---

/**
 * The reducer function that manages the state transitions for integrations.
 * It takes the current state and an action, returning a new state.
 */
const integrationReducer = (state: IntegrationState, action: IntegrationAction): IntegrationState => {
  switch (action.type) {
    case 'SET_INTEGRATION_STATUS':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          status: action.payload.status,
          error: action.payload.error,
          isLoading: false, // Status change usually means loading is complete
        },
      };
    case 'SET_INTEGRATION_CONFIG':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          config: { ...state[action.payload.name].config, ...action.payload.config },
          status: 'connected', // Setting config implies a successful connection
          error: undefined, // Clear any previous errors
          isLoading: false,
        },
      };
    case 'SET_INTEGRATION_LOADING':
      return {
        ...state,
        [action.payload.name]: {
          ...state[action.payload.name],
          isLoading: action.payload.isLoading,
          error: undefined, // Clear error when starting a new loading process
        },
      };
    case 'RESET_INTEGRATION':
      return {
        ...state,
        [action.payload.name]: {
          name: action.payload.name,
          status: 'disconnected',
          config: undefined,
          error: undefined,
          isLoading: false,
        },
      };
    case 'INITIALIZE_INTEGRATIONS':
      // This action is used to rehydrate the state, e.g., from local storage or an API.
      // It merges the provided payload with the default initial state to ensure all
      // integrations are present and any missing ones default to 'disconnected'.
      const mergedState = { ...initialState };
      for (const name of allIntegrationNames) {
        if (action.payload[name]) {
          mergedState[name] = { ...mergedState[name], ...action.payload[name] };
        }
      }
      return mergedState;
    default:
      return state;
  }
};

// --- 5. Create Context ---

/**
 * Defines the shape of the context value that will be provided.
 */
interface IntegrationContextType {
  state: IntegrationState;
  dispatch: React.Dispatch<IntegrationAction>;
}

/**
 * The React Context object for integrations.
 * It's initialized with `undefined` and checked in `useIntegrations` hook.
 */
const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined);

// --- 6. Provider Component ---

/**
 * Props for the IntegrationProvider component.
 */
interface IntegrationProviderProps {
  children: ReactNode;
}

/**
 * The IntegrationProvider component wraps part of the application
 * and makes the integration state and dispatch function available
 * to all nested components.
 */
export const IntegrationProvider: React.FC<IntegrationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(integrationReducer, initialState);

  return (
    <IntegrationContext.Provider value={{ state, dispatch }}>
      {children}
    </IntegrationContext.Provider>
  );
};

// --- 7. Custom Hook to use the Context ---

/**
 * A custom hook to easily access the integration state and dispatch function.
 * It ensures that the hook is used within an IntegrationProvider.
 */
export const useIntegrations = () => {
  const context = useContext(IntegrationContext);
  if (context === undefined) {
    throw new Error('useIntegrations must be used within an IntegrationProvider');
  }
  return context;
};