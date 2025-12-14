import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// --- 1. Interfaces ---

/**
 * Represents a single item of real-time market data.
 */
interface MarketDataItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  // Add more fields as needed, e.g., volume, open, high, low, bid, ask
}

/**
 * Represents aggregated insights and metrics for a financial portfolio.
 * Includes aspirational fields aligning with project's financial applications.
 */
interface PortfolioInsights {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  riskScore: number; // e.g., derived from APP_76_Finance_RWA_Calculator or APP_77_Finance_CapitalAdequacyEngine
  assetAllocation: { [assetType: string]: number }; // e.g., { "Equities": 0.6, "Bonds": 0.3, "Cash": 0.1 }
  
  // Aspirational fields from project description:
  liquidityCoverageRatio?: number; // From APP_78_Finance_LiquiditySimulation
  netStableFundingRatio?: number; // From APP_78_Finance_LiquiditySimulation
  riskWeightedAssets?: number; // From APP_76_Finance_RWA_Calculator
  capitalAdequacyRatio?: number; // From APP_77_Finance_CapitalAdequacyEngine
  // Add other relevant metrics as the ecosystem grows
}

/**
 * Defines the shape of the context value provided by FinanceContext.
 */
interface FinanceContextType {
  marketData: Map<string, MarketDataItem>;
  portfolioInsights: PortfolioInsights | null;
  isLoading: boolean;
  error: string | null;
  
  /**
   * Fetches market data for a given list of symbols.
   * In a real app, this might initiate a WebSocket subscription or a REST call.
   * @param symbols An array of stock/asset symbols (e.g., ['AAPL', 'GOOGL']).
   */
  fetchMarketData: (symbols: string[]) => Promise<void>;

  /**
   * Fetches aggregated portfolio insights.
   * This would typically involve calls to various backend financial engines.
   */
  fetchPortfolioInsights: () => Promise<void>;

  /**
   * Updates a single market data item. Useful for real-time updates from a WebSocket.
   * @param item The MarketDataItem to update or add.
   */
  updateMarketDataItem: (item: MarketDataItem) => void;

  // Add more actions as the project grows, e.g., for specific financial operations
}

// --- 2. Initial State ---
const initialMarketData = new Map<string, MarketDataItem>();

// --- 3. Context Object ---
// Create the context with an undefined default value, as it will be provided by the Provider.
const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// --- 4. Provider Component ---
interface FinanceProviderProps {
  children: ReactNode;
}

/**
 * Provides global financial data, state, and operations to its children components.
 * Manages real-time market data, portfolio insights, loading states, and errors.
 */
export const FinanceProvider = ({ children }: FinanceProviderProps) => {
  const [marketData, setMarketData] = useState<Map<string, MarketDataItem>>(initialMarketData);
  const [portfolioInsights, setPortfolioInsights] = useState<PortfolioInsights | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Simulates fetching market data for specified symbols.
   * In a production environment, this would connect to a real-time market data API
   * or a WebSocket service.
   */
  const fetchMarketData = useCallback(async (symbols: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const newMarketData = new Map(marketData); // Create a mutable copy for updates
      symbols.forEach(symbol => {
        // Generate dummy data for demonstration
        const price = parseFloat((Math.random() * 1000 + 100).toFixed(2));
        const change = parseFloat((Math.random() * 20 - 10).toFixed(2)); // -10 to +10
        const changePercent = parseFloat(((change / (price - change)) * 100).toFixed(2));

        newMarketData.set(symbol, {
          symbol,
          price,
          change,
          changePercent,
          timestamp: Date.now(),
        });
      });
      setMarketData(newMarketData);
    } catch (err) {
      console.error("Failed to fetch market data:", err);
      setError("Failed to load market data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [marketData]); // Dependency on marketData ensures updates are based on the latest state

  /**
   * Simulates fetching aggregated portfolio insights.
   * In a production environment, this would query various financial backend services
   * (e.g., APP_76, APP_77, APP_78, etc.) to compile the insights.
   */
  const fetchPortfolioInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate dummy portfolio insights, including aspirational fields
      const dummyInsights: PortfolioInsights = {
        totalValue: parseFloat((Math.random() * 1_000_000 + 100_000).toFixed(2)),
        dailyChange: parseFloat((Math.random() * 5000 - 2500).toFixed(2)),
        dailyChangePercent: parseFloat((Math.random() * 5 - 2.5).toFixed(2)),
        riskScore: parseFloat((Math.random() * 10).toFixed(1)),
        assetAllocation: {
          "Equities": parseFloat((Math.random() * 0.5 + 0.2).toFixed(2)), // 20-70%
          "Bonds": parseFloat((Math.random() * 0.3 + 0.1).toFixed(2)),   // 10-40%
          "Cash": parseFloat((Math.random() * 0.2 + 0.05).toFixed(2)),   // 5-25%
        },
        // Aspirational fields:
        liquidityCoverageRatio: parseFloat((Math.random() * 1.5 + 0.8).toFixed(2)), // e.g., 80-230%
        netStableFundingRatio: parseFloat((Math.random() * 1.3 + 0.9).toFixed(2)),  // e.g., 90-220%
        riskWeightedAssets: parseFloat((Math.random() * 500_000 + 100_000).toFixed(2)),
        capitalAdequacyRatio: parseFloat((Math.random() * 0.2 + 0.1).toFixed(2)), // e.g., 10-30%
      };

      // Normalize asset allocation percentages to sum approximately to 1
      const totalAllocation = Object.values(dummyInsights.assetAllocation).reduce((sum, val) => sum + val, 0);
      if (totalAllocation > 0) {
        for (const key in dummyInsights.assetAllocation) {
          dummyInsights.assetAllocation[key] = parseFloat((dummyInsights.assetAllocation[key] / totalAllocation).toFixed(2));
        }
      }

      setPortfolioInsights(dummyInsights);
    } catch (err) {
      console.error("Failed to fetch portfolio insights:", err);
      setError("Failed to load portfolio insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Updates or adds a single market data item to the global state.
   * This function is ideal for handling real-time updates from a streaming source.
   * @param item The MarketDataItem to be updated or added.
   */
  const updateMarketDataItem = useCallback((item: MarketDataItem) => {
    setMarketData(prevData => {
      const newData = new Map(prevData); // Create a new Map to ensure immutability and trigger re-render
      newData.set(item.symbol, item);
      return newData;
    });
  }, []);

  // Initial data load when the provider mounts
  useEffect(() => {
    // Fetch some initial market data for common symbols
    fetchMarketData(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA']);
    // Fetch initial portfolio insights
    fetchPortfolioInsights();
  }, [fetchMarketData, fetchPortfolioInsights]); // Dependencies ensure these are called only when stable

  // The value provided to consumers of this context
  const contextValue: FinanceContextType = {
    marketData,
    portfolioInsights,
    isLoading,
    error,
    fetchMarketData,
    fetchPortfolioInsights,
    updateMarketDataItem,
  };

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
};

// --- 5. Custom Hook ---
/**
 * Custom hook to easily consume the FinanceContext.
 * Throws an error if used outside of a FinanceProvider.
 * @returns The FinanceContextType value.
 */
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};