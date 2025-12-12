import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// --- Types ---

export interface Rating {
  agency: string;
  rating: string;
  scale: string;
  date?: string;
}

export interface CashFlowEvent {
  id: number;
  date?: string;
  type: 'Coupon' | 'Redemption';
  amount?: number;
  currency: string;
}

export interface RelatedIssue {
  issueName: string;
  maturityDate: string;
  volume: string; // e.g. "***" or actual numbers if available
  currency: string;
}

export interface Issuer {
  name: string;
  sector: string;
  country: string;
  profile: string;
  ratings: Rating[];
}

export interface Bond {
  isin: string;
  cusip: string;
  figi: string;
  ticker: string;
  cfi: string;
  name: string;
  type: string; // e.g. "Zero-coupon bonds, Senior Unsecured"
  status: 'Active' | 'Matured' | 'Defaulted';
  currency: string;
  placementAmount: number;
  outstandingAmount: number;
  nominalValue: number;
  maturityDate: string;
  issueDate?: string; // Not explicitly in text, but good to have
  couponRate?: number; // 0 for zero-coupon
  yield?: number;
  price?: number;
  issuer: Issuer;
  cashFlows: CashFlowEvent[];
  relatedIssues: RelatedIssue[];
}

export interface Holding {
  bondIsin: string;
  quantity: number;
  averageBuyPrice: number;
}

interface FixedIncomeContextType {
  bonds: Bond[];
  selectedBond: Bond | null;
  userHoldings: Holding[];
  loading: boolean;
  selectBond: (isin: string) => void;
  addHolding: (isin: string, quantity: number, price: number) => void;
  removeHolding: (isin: string) => void;
}

// --- Initial Mock Data based on Project Goal ---

const MOCK_ISSUER_USA: Issuer = {
  name: 'USA',
  sector: 'Sovereign',
  country: 'USA',
  profile: 'The United States of America is a country in North America. It consists of 50 states and a federal district. The biggest sector of the US economy is the retail industry. The U.S bond market is ...',
  ratings: [
    { agency: 'DBRS Limited', rating: '***', scale: 'Long-Term Foreign Currency - Issuer Rating' },
    { agency: 'DBRS Limited', rating: '***', scale: 'Long-Term Local Currency - Issuer Rating' },
    { agency: 'Japan Credit Rating Agency', rating: '***', scale: 'Foreign Currency Long-term Issuer Rating' },
    { agency: 'Japan Credit Rating Agency', rating: '***', scale: 'Local Currency Long-term Issuer Rating' },
    { agency: 'RAEX-Europe', rating: '***', scale: 'Rating scale of the country credit environment (CCE) rating - Foreign currency' },
  ]
};

const MOCK_BOND_MAIN: Bond = {
  isin: 'US912796P781',
  cusip: '***', // Placeholder from prompt
  figi: 'BBG0125BL947',
  ticker: 'B 0 12/21/21',
  cfi: 'DBZTFR',
  name: 'USA, CMB 21dec2021 4m',
  type: 'Zero-coupon bonds, Senior Unsecured',
  status: 'Matured',
  currency: 'USD',
  placementAmount: 68759029200,
  outstandingAmount: 68759029200,
  nominalValue: 100,
  maturityDate: '2021-12-21',
  issueDate: undefined, // Not explicitly in text, but good to have
  couponRate: 0,
  yield: 0, // Matured
  price: 0, // Matured
  issuer: MOCK_ISSUER_USA,
  cashFlows: [
    { id: 1, type: 'Redemption', amount: 100, currency: 'USD' } // Simplified redemption
  ],
  relatedIssues: [
    { issueName: 'USA, Bonds 3.875%', maturityDate: '15may2043', volume: '***', currency: 'USD' },
    { issueName: 'USA, Bills 0%', maturityDate: '19sep2023', volume: '***', currency: 'USD' },
    { issueName: 'USA, Bills 0%', maturityDate: '16may2024', volume: '***', currency: 'USD' },
    { issueName: 'USA, Bills 0%', maturityDate: '16nov2023', volume: '***', currency: 'USD' },
    { issueName: 'USA, Bonds 3.625%', maturityDate: '15may2053', volume: '***', currency: 'USD' },
    { issueName: 'USA, Bills 0%', maturityDate: '12sep2023', volume: '***', currency: 'USD' },
    { issueName: 'USA, Notes 3.375%', maturityDate: '15may2033', volume: '***', currency: 'USD' },
    { issueName: 'USA, Notes 3.625%', maturityDate: '15may2026', volume: '***', currency: 'USD' },
    { issueName: 'USA, Bills 0%', maturityDate: '09nov2023', volume: '***', currency: 'USD' },
    { issueName: 'USA, Bills 0%', maturityDate: '05sep2023', volume: '***', currency: 'USD' },
  ]
};

// --- Context ---

const FixedIncomeContext = createContext<FixedIncomeContextType | undefined>(undefined);

export const useFixedIncome = () => {
  const context = useContext(FixedIncomeContext);
  if (!context) {
    throw new Error('useFixedIncome must be used within a FixedIncomeProvider');
  }
  return context;
};

interface FixedIncomeProviderProps {
  children: ReactNode;
}

export const FixedIncomeProvider: React.FC<FixedIncomeProviderProps> = ({ children }) => {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
  const [userHoldings, setUserHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize data
  useEffect(() => {
    // Simulating API fetch
    const loadData = async () => {
      setLoading(true);
      try {
        // In a real app, fetch from an endpoint. Here we use the mock data from the prompt.
        const fetchedBonds = [MOCK_BOND_MAIN];
        setBonds(fetchedBonds);
        // Default select the first bond if available
        if (fetchedBonds.length > 0) {
          setSelectedBond(fetchedBonds[0]);
        }
      } catch (error) {
        console.error("Failed to load bond data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const selectBond = (isin: string) => {
    const bond = bonds.find(b => b.isin === isin);
    if (bond) {
      setSelectedBond(bond);
    }
  };

  const addHolding = (isin: string, quantity: number, price: number) => {
    setUserHoldings(prev => {
      const existing = prev.find(h => h.bondIsin === isin);
      if (existing) {
        // Calculate new weighted average price
        const totalCost = (existing.quantity * existing.averageBuyPrice) + (quantity * price);
        const newQuantity = existing.quantity + quantity;
        return prev.map(h => 
          h.bondIsin === isin 
            ? { ...h, quantity: newQuantity, averageBuyPrice: totalCost / newQuantity } 
            : h
        );
      }
      return [...prev, { bondIsin: isin, quantity, averageBuyPrice: price }];
    });
  };

  const removeHolding = (isin: string) => {
    setUserHoldings(prev => prev.filter(h => h.bondIsin !== isin));
  };

  const value = {
    bonds,
    selectedBond,
    userHoldings,
    loading,
    selectBond,
    addHolding,
    removeHolding
  };

  return (
    <FixedIncomeContext.Provider value={value}>
      {children}
    </FixedIncomeContext.Provider>
  );
};