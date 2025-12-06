
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of your application state
export interface AppState {
  // Example: User authentication state
  isAuthenticated: boolean;
  // Example: User details
  user?: {
    id: string;
    name: string;
  };
  // Add more state variables as needed
}

// Define the context value type
export interface AppContextType {
  state: AppState;
  dispatch: (action: AppAction) => void;
}

// Define possible actions to modify the state
export type AppAction =
  | { type: 'LOGIN'; payload: { user: { id: string; name: string } } }
  | { type: 'LOGOUT' };
  // Add more actions as needed

// Initial state for the application
const initialState: AppState = {
  isAuthenticated: false,
  user: undefined,
};

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Create a reducer function to handle state updates
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: undefined,
      };
    default:
      return state;
  }
};

// Create a provider component to wrap your application
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = React.useReducer(appReducer, initialState);

  const value: AppContextType = {
    state,
    dispatch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Create a custom hook to easily consume the context
export const useAppState = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};
