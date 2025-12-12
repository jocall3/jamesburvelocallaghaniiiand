import React, { createContext, useContext, useState, ReactNode, FC } from 'react';

// Define the type for the full Stripe data object
// This is a placeholder and should be replaced with actual types if available
type StripeResourcesType = Record<string, any>;

// Create a default empty object for initial state
const defaultStripeResourcesData: StripeResourcesType = {};

// Define the type for our context value
interface StripeDataContextType {
  stripeData: StripeResourcesType;
  setStripeData: React.Dispatch<React.SetStateAction<StripeResourcesType>>;
}

// Create the context with a default value of undefined
const StripeDataContext = createContext<StripeDataContextType | undefined>(undefined);

// Define the props for the provider component
interface StripeDataProviderProps {
  children: ReactNode;
}

// Create the provider component
export const StripeDataProvider: FC<StripeDataProviderProps> = ({ children }) => {
  const [stripeData, setStripeData] = useState<StripeResourcesType>(defaultStripeResourcesData);

  const value = { stripeData, setStripeData };

  return (
    <StripeDataContext.Provider value={value}>
      {children}
    </StripeDataContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useStripeData = (): StripeDataContextType => {
  const context = useContext(StripeDataContext);
  if (context === undefined) {
    throw new Error('useStripeData must be used within a StripeDataProvider');
  }
  return context;
};