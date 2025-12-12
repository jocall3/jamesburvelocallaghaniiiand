import React, { useState, useMemo, useCallback } from 'react';

// --- Citibankdemobusinessinc Kernel ---
namespace Citibankdemobusinessinc {
  export const BRAND_NAME = "Citibank demo business inc";

  // --- Utility Functions ---
  export const generateRandomNumber = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  export const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  export const generateRandomDate = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };

  export const generateBoolean = (): boolean => {
    return Math.random() < 0.5;
  };

  // --- Data Encryption ---
  export const encryptData = (data: string): string => {
    // Simplified encryption (replace with a real algorithm)
    return btoa(data);
  };

  export const decryptData = (encryptedData: string): string => {
    // Simplified decryption (replace with a real algorithm)
    return atob(encryptedData);
  };

  // --- Logging ---
  export const logEvent = (event: string, data: any): void => {
    console.log(`[${Citibankdemobusinessinc.BRAND_NAME}] ${event}`, data);
    // In a real application, send this to a logging service
  };

  // --- Error Handling ---
  export const handleError = (error: Error, context: string): void => {
    console.error(`[${Citibankdemobusinessinc.BRAND_NAME}] Error in ${context}:`, error);
    // In a real application, send this to an error tracking service
  };

  // --- Regulatory Compliance ---
  export const isRegulatoryCompliant = (): boolean => {
    // Mock compliance check (replace with actual compliance logic)
    return Citibankdemobusinessinc.generateBoolean();
  };

  // --- Risk Assessment ---
  export const assessRisk = (data: any): number => {
    // Mock risk assessment (replace with a real risk assessment model)
    return Math.random();
  };

  // --- Audit Trail ---
  export const createAuditLog = (action: string, user: string, data: any): void => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, action, user, data };
    console.log(`[${Citibankdemobusinessinc.BRAND_NAME}] Audit Log:`, logEntry);
    // In a real application, store this in an audit log database
  };

  // --- User Authentication ---
  export const authenticateUser = (username: string, password: string): boolean => {
    // Mock authentication (replace with a real authentication system)
    const validUsername = 'user';
    const validPassword = 'password';
    return username === validUsername && password === validPassword;
  };

  // --- Authorization ---
  export const authorizeUser = (user: string, role: string, permission: string): boolean => {
    // Mock authorization (replace with a real authorization system)
    const userRoles = {
      'user': ['viewer'],
      'admin': ['viewer', 'editor', 'admin'],
    };
    return userRoles[role]?.includes(permission) || false;
  };

  // --- Configuration Management ---
  export const getConfig = (key: string): any => {
    // Mock configuration (replace with a real configuration management system)
    const config = {
      'apiEndpoint': 'https://api.example.com',
      'timeout': 3000,
    };
    return config[key];
  };

  // --- Event Bus ---
  interface EventHandler {
    (data: any): void;
  }

  interface EventBus {
    [event: string]: EventHandler[];
  }

  export const eventBus: EventBus = {};

  export const subscribe = (event: string, handler: EventHandler): void => {
    if (!eventBus[event]) {
      eventBus[event] = [];
    }
    eventBus[event].push(handler);
  };

  export const publish = (event: string, data: any): void => {
    if (eventBus[event]) {
      eventBus[event].forEach(handler => handler(data));
    }
  };
}

// --- Citibankdemobusinessinc.procurement ---
namespace Citibankdemobusinessinc.procurement {
  // --- Data Structures ---
  interface SpendData {
    category: string;
    amount: number;
    yoyChange: number;
  }

  interface Supplier {
    id: number;
    name: string;
    category: string;
    location: string;
    aiRiskScore: number;
    riskFactors: string[];
  }

  interface Contract {
    id: number;
    supplierName: string;
    category: string;
    startDate: string;
    endDate: string;
    status: 'Active' | 'Expiring Soon' | 'Expired';
    value: number;
  }

  // --- Data Generation ---
  const generateSpendData = (): SpendData[] => {
    const categories = ['Cloud Services', 'Raw Materials', 'Marketing', 'Travel', 'Software'];
    return categories.map(category => ({
      category: category,
      amount: Citibankdemobusinessinc.generateRandomNumber(100000, 2000000),
      yoyChange: (Math.random() - 0.5) / 10,
    }));
  };

  const generateSuppliers = (): Supplier[] => {
    const locations = ['USA', 'China', 'Germany', 'Canada', 'India'];
    const categories = ['Cloud Services', 'Raw Materials', 'Marketing', 'Software', 'Consulting'];
    return Array.from({ length: 5 }, (_, i) => ({
      id: 101 + i,
      name: `Supplier ${i + 1}`,
      category: categories[i],
      location: locations[i],
      aiRiskScore: Math.random(),
      riskFactors: [Citibankdemobusinessinc.generateRandomString(20), Citibankdemobusinessinc.generateRandomString(20)],
    }));
  };

  const generateContracts = (): Contract[] => {
    const supplierNames = generateSuppliers().map(s => s.name);
    const categories = ['Cloud Services', 'Raw Materials', 'Marketing', 'Software', 'Consulting'];
    const statuses: Contract['status'][] = ['Active', 'Expiring Soon', 'Expired'];
    return Array.from({ length: 5 }, (_, i) => ({
      id: 201 + i,
      supplierName: supplierNames[i],
      category: categories[i],
      startDate: Citibankdemobusinessinc.generateRandomDate(new Date(2020, 0, 1), new Date()).toISOString().slice(0, 10),
      endDate: Citibankdemobusinessinc.generateRandomDate(new Date(), new Date(2025, 11, 31)).toISOString().slice(0, 10),
      status: statuses[i % statuses.length],
      value: Citibankdemobusinessinc.generateRandomNumber(50000, 1000000),
    }));
  };

  // --- State Management ---
  export const useProcurementState = () => {
    const [spendData, setSpendData] = useState<SpendData[]>(generateSpendData());
    const [suppliers, setSuppliers] = useState<Supplier[]>(generateSuppliers());
    const [contracts, setContracts] = useState<Contract[]>(generateContracts());
    const [searchCriteria, setSearchCriteria] = useState({ category: '', location: '' });
    const [searchResults, setSearchResults] = useState<Supplier[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- AI Supplier Search Logic ---
    const handleSearch = useCallback(() => {
      setIsSearching(true);
      setSearchResults([]);

      setTimeout(() => {
        const filteredResults = suppliers.filter(s =>
          (searchCriteria.category === '' || s.category.toLowerCase().includes(searchCriteria.category.toLowerCase())) &&
          (searchCriteria.location === '' || s.location.toLowerCase().includes(searchCriteria.location.toLowerCase()))
        );

        if (searchCriteria.category.toLowerCase().includes('software') && searchCriteria.location.toLowerCase().includes('usa')) {
          filteredResults.push({
            id: 999,
            name: 'Quantum Code Solutions (AI Match)',
            category: 'Software',
            location: 'USA',
            aiRiskScore: 0.25,
            riskFactors: ['Excellent compliance history', 'AI recommended for cost efficiency'],
          });
        }

        setSearchResults(filteredResults);
        setIsSearching(false);
      }, 1000);
    }, [searchCriteria, suppliers]);

    return {
      spendData,
      suppliers,
      contracts,
      searchCriteria,
      searchResults,
      isSearching,
      setSearchCriteria,
      handleSearch,
    };
  };

  // --- UI Components ---
  export const SpendAnalysisCard: React.FC<{ title: string; value: string; change: number }> = ({ title, value, change }) => {
    const changeColor = change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-500';
    const changeSign = change > 0 ? 'â' : change < 0 ? 'â' : '';

    return (
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className={`text-xs mt-1 ${changeColor}`}>
          {changeSign} {Math.abs(change * 100).toFixed(1)}% YoY
        </p>
      </div>
    );
  };

  export const SupplierRiskScore: React.FC<{ score: number }> = ({ score }) => {
    let colorClass = 'bg-green-100 text-green-800';
    let riskLevel = 'Low';

    if (score >= 0.7) {
      colorClass = 'bg-red-100 text-red-800';
      riskLevel = 'High';
    } else if (score >= 0.4) {
      colorClass = 'bg-yellow-100 text-yellow-800';
      riskLevel = 'Medium';
    }

    return (
      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${colorClass}`}>
        AI Score: {riskLevel} ({score.toFixed(2)})
      </span>
    );
  };

  export const getContractRowClass = (status: Contract['status']) => {
    switch (status) {
      case 'Expired': return 'bg-red-50 text-red-800 hover:bg-red-100';
      case 'Expiring Soon': return 'bg-yellow-50 text-yellow-800 font-semibold hover:bg-yellow-100';
      default: return 'bg-white hover:bg-gray-50';
    }
  };
}

// --- Citibankdemobusinessinc.procurement.ProcurementSourcingAIView ---
const ProcurementSourcingAIView: React.FC = () => {
  const {
    spendData,
    suppliers,
    contracts,
    searchCriteria,
    searchResults,
    isSearching,
    setSearchCriteria,
    handleSearch,
  } = Citibankdemobusinessinc.procurement.useProcurementState();

  const totalSpend = useMemo(() => spendData.reduce((sum, d) => sum + d.amount, 0), [spendData]);
  const topCategory = useMemo(() => spendData.sort((a, b) => b.amount - a.amount)[0], [spendData]);
  const expiringContracts = useMemo(() => contracts.filter(c => c.status === 'Expiring Soon'), [contracts]);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-2">{Citibankdemobusinessinc.BRAND_NAME} - Procurement & Sourcing AI Dashboard</h1>

      {/* 1. Spend Analysis Dashboard */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <span className="mr-2">ð</span> Spend Optimization Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Citibankdemobusinessinc.procurement.SpendAnalysisCard
            title="Total Annual Spend"
            value={`$${(totalSpend / 1000000).toFixed(2)}M`}
            change={0.10}
          />
          <Citibankdemobusinessinc.procurement.SpendAnalysisCard
            title="Top Spend Category"
            value={topCategory.category}
            change={topCategory.yoyChange}
          />
          <Citibankdemobusinessinc.procurement.SpendAnalysisCard
            title="Contracts Expiring (90 Days)"
            value={expiringContracts.length.toString()}
            change={0}
          />
          <Citibankdemobusinessinc.procurement.SpendAnalysisCard
            title="Savings Opportunities (AI Estimate)"
            value={`$${(totalSpend * 0.03).toFixed(0)}`}
            change={-0.03}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mt-4">
          <h3 className="text-xl font-medium mb-4">Spend Breakdown by Category</h3>
          <ul className="space-y-2">
            {spendData.map((data, index) => (
              <li key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                <span className="text-gray-700">{data.category}</span>
                <span className="font-mono text-lg font-semibold text-blue-600">${data.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2. AI-Powered Supplier Sourcing */}
      <section className="space-y-4 pt-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <span className="mr-2">ð§ </span> AI Supplier Sourcing & Risk Assessment
        </h2>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-sm text-gray-500 mb-4">Use AI to find new suppliers and instantly generate risk scores based on financial health, geopolitical stability, and compliance history.</p>
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              placeholder="Search Category (e.g., Software)"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchCriteria.category}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, category: e.target.value })}
            />
            <input
              type="text"
              placeholder="Location (e.g., USA, Germany)"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchCriteria.location}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, location: e.target.value })}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition duration-150"
            >
              {isSearching ? 'AI Analyzing...' : 'AI Search & Score'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">AI-Generated Matches ({searchResults.length})</h3>
              {searchResults.map(supplier => (
                <div key={supplier.id} className="p-4 border border-gray-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 transition duration-100">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-xl font-bold text-gray-900">{supplier.name}</p>
                    <p className="text-sm text-gray-600">{supplier.category} | {supplier.location}</p>
                    <div className="mt-1 text-xs text-gray-500 italic">
                      Risk Factors: {supplier.riskFactors.join(', ')}
                    </div>
                  </div>
                  <Citibankdemobusinessinc.procurement.SupplierRiskScore score={supplier.aiRiskScore} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Contract Management */}
      <section className="space-y-4 pt-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <span className="mr-2">ð</span> Contract Lifecycle Management
        </h2>
        <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contracts.map(contract => (
                <tr key={contract.id} className={Citibankdemobusinessinc.procurement.getContractRowClass(contract.status)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{contract.supplierName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{contract.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">${contract.value.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{contract.startDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{contract.endDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${contract.status === 'Active' ? 'bg-green-100 text-green-800' :
                        contract.status === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {contract.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ProcurementSourcingAIView;