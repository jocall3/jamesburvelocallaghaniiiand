import React, {
  createContext,
  useContext,
  useReducer,
  Dispatch,
  ReactNode,
} from 'react';

// --- TYPE DEFINITIONS ---
// These types are simplified representations based on the project's OpenAPI schemas.

/**
 * Represents the authentication state within the simulation.
 */
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  scope: string;
}

/**
 * Represents a simulated customer profile.
 */
interface CustomerProfile {
  fullName?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  emails?: { emailAddress: string; preferenceType: 'PRIMARY' | 'SECONDARY' }[];
  addressList?: any[]; // Simplified for brevity
  phones?: any[]; // Simplified for brevity
}

/**
 * Represents a simulated financial product or account.
 */
interface Product {
  accountId: string;
  status: 'ACTIVE';
  productName: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD';
  accountNumberDisplay: string;
}

/**
 * The complete state of the simulation sandbox.
 */
export interface SimulationState {
  auth: AuthState;
  customerProfile: CustomerProfile | null;
  products: Product[];
}

/**
 * Actions that can be dispatched to modify the simulation state.
 */
export type SimulationAction =
  | {
      type: 'LOGIN';
      payload: {
        accessToken: string;
        refreshToken: string;
        scope: string;
        profile: CustomerProfile;
        products: Product[];
      };
    }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: { accessToken: string; refreshToken: string } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<CustomerProfile> }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'RESET_SIMULATION' };

// --- INITIAL STATE ---

/**
 * The default state for the simulation when it is first initialized or reset.
 */
const initialState: SimulationState = {
  auth: {
    accessToken: null,
    refreshToken: null,
    isLoggedIn: false,
    scope: '',
  },
  customerProfile: null,
  products: [],
};

// --- REDUCER ---

/**
 * Handles state transitions for the simulation based on dispatched actions.
 * @param state - The current simulation state.
 * @param action - The action to perform.
 * @returns The new simulation state.
 */
const simulationReducer = (
  state: SimulationState,
  action: SimulationAction,
): SimulationState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        auth: {
          isLoggedIn: true,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          scope: action.payload.scope,
        },
        customerProfile: action.payload.profile,
        products: action.payload.products,
      };
    case 'LOGOUT':
      return initialState;
    case 'REFRESH_TOKEN':
      return {
        ...state,
        auth: {
            ...state.auth,
            accessToken: action.payload.accessToken,
            refreshToken: action.payload.refreshToken,
        }
      };
    case 'UPDATE_PROFILE':
        if (!state.customerProfile) return state;
        return {
            ...state,
            customerProfile: {
                ...state.customerProfile,
                ...action.payload,
            }
        };
    case 'SET_PRODUCTS':
        return {
            ...state,
            products: action.payload,
        };
    case 'RESET_SIMULATION':
      return initialState;
    default:
      throw new Error(`Unhandled action type in simulationReducer`);
  }
};

// --- CONTEXT & PROVIDER ---

const SimulationStateContext = createContext<SimulationState | undefined>(
  undefined,
);
const SimulationDispatchContext = createContext<
  Dispatch<SimulationAction> | undefined
>(undefined);

interface SimulationProviderProps {
  children: ReactNode;
  /**
   * An optional initial state to "fork" from. If not provided,
   * the simulation starts with the default empty state.
   */
  initialForkedState?: Partial<SimulationState>;
}

/**
 * Provider component that encapsulates the simulation state logic.
 * Any component wrapped by this provider can access the simulation context.
 */
export const SimulationProvider = ({
  children,
  initialForkedState,
}: SimulationProviderProps) => {
  const [state, dispatch] = useReducer(simulationReducer, {
    ...initialState,
    ...initialForkedState,
  });

  return (
    <SimulationStateContext.Provider value={state}>
      <SimulationDispatchContext.Provider value={dispatch}>
        {children}
      </SimulationDispatchContext.Provider>
    </SimulationStateContext.Provider>
  );
};

// --- HOOKS ---

/**
 * Custom hook to access the simulation state.
 * Must be used within a `SimulationProvider`.
 * @returns The current simulation state object.
 */
export const useSimulationState = () => {
  const context = useContext(SimulationStateContext);
  if (context === undefined) {
    throw new Error('useSimulationState must be used within a SimulationProvider');
  }
  return context;
};

/**
 * Custom hook to access the dispatch function for the simulation state.
 * Must be used within a `SimulationProvider`.
 * @returns The dispatch function.
 */
export const useSimulationDispatch = () => {
  const context = useContext(SimulationDispatchContext);
  if (context === undefined) {
    throw new Error(
      'useSimulationDispatch must be used within a SimulationProvider',
    );
  }
  return context;
};

/**
 * A convenience hook that combines `useSimulationState` and `useSimulationDispatch`.
 * @returns An object containing the current state and the dispatch function.
 */
export const useSimulation = () => {
  return {
    state: useSimulationState(),
    dispatch: useSimulationDispatch(),
  };
};