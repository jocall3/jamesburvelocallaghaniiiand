import React, { useState, useMemo, useCallback } from 'react';

// --- 1. Data Structures and Mock Data ---

interface SpendData {
  category: string;
  amount: number;
  yoyChange: number; // Year-over-year change percentage
}

interface Supplier {
  id: number;
  name: string;
  category: string;
  location: string;
  aiRiskScore: number; // 0.0 (low risk) to 1.0 (high risk)
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

const MOCK_SPEND_DATA: SpendData[] = [
  { category: 'Cloud Services', amount: 1500000, yoyChange: 0.15 },
  { category: 'Raw Materials', amount: 850000, yoyChange: -0.05 },
  { category: 'Marketing', amount: 420000, yoyChange: 0.22 },
  { category: 'Travel', amount: 180000, yoyChange: 0.50 },
];

const MOCK_SUPPLIERS: Supplier[] = [
  { id: 101, name: 'GlobalTech Solutions', category: 'Cloud Services', location: 'USA', aiRiskScore: 0.15, riskFactors: ['Stable financials', 'High compliance'] },
  { id: 102, name: 'Asia Steel Corp', category: 'Raw Materials', location: 'China', aiRiskScore: 0.78, riskFactors: ['Geopolitical instability', 'Logistics delays', 'High carbon footprint'] },
  { id: 103, name: 'Euro Ad Agency', category: 'Marketing', location: 'Germany', aiRiskScore: 0.35, riskFactors: ['Good track record', 'Competitive pricing'] },
  { id: 104, name: 'NewGen AI Labs', category: 'Software', location: 'Canada', aiRiskScore: 0.92, riskFactors: ['New vendor', 'Limited financial history', 'High dependency risk'] },
];

const MOCK_CONTRACTS: Contract[] = [
  { id: 201, supplierName: 'GlobalTech Solutions', category: 'Cloud Services', startDate: '2023-01-01', endDate: '2024-12-31', status: 'Active', value: 1500000 },
  { id: 202, supplierName: 'Asia Steel Corp', category: 'Raw Materials', startDate: '2022-06-01', endDate: '2024-07-15', status: 'Expiring Soon', value: 850000 },
  { id: 203, supplierName: 'Office Supplies Inc.', category: 'Office', startDate: '2021-01-01', endDate: '2023-12-31', status: 'Expired', value: 50000 },
  { id: 204, supplierName: 'Euro Ad Agency', category: 'Marketing', startDate: '2024-03-01', endDate: '2025-03-01', status: 'Active', value: 420000 },
];

// --- 2. Helper Components ---

/** Renders a single spend metric card */
const SpendAnalysisCard: React.FC<{ title: string; value: string; change: number }> = ({ title, value, change }) => {
  const changeColor = change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-500';
  const changeSign = change > 0 ? '↑' : change < 0 ? '↓' : '';

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

/** Renders the AI Risk Score badge */
const SupplierRiskScore: React.FC<{ score: number }> = ({ score }) => {
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

// --- 3. Main View Component ---

const ProcurementSourcingAIView: React.FC = () => {
  const [searchCriteria, setSearchCriteria] = useState({ category: '', location: '' });
  const [searchResults, setSearchResults] = useState<Supplier[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- Dashboard Calculations ---
  const totalSpend = useMemo(() => MOCK_SPEND_DATA.reduce((sum, d) => sum + d.amount, 0), []);
  const topCategory = useMemo(() => MOCK_SPEND_DATA.sort((a, b) => b.amount - a.amount)[0], []);

  // --- AI Supplier Search Logic (Mocking API call) ---
  const handleSearch = useCallback(() => {
    setIsSearching(true);
    setSearchResults([]); // Clear previous results

    // Simulate AI processing and database lookup
    setTimeout(() => {
      const filteredResults = MOCK_SUPPLIERS.filter(s =>
        (searchCriteria.category === '' || s.category.toLowerCase().includes(searchCriteria.category.toLowerCase())) &&
        (searchCriteria.location === '' || s.location.toLowerCase().includes(searchCriteria.location.toLowerCase()))
      );

      // Add a new, highly relevant AI-generated supplier if search is specific
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
  }, [searchCriteria]);

  // --- Contract Management Logic ---
  const expiringContracts = useMemo(() => MOCK_CONTRACTS.filter(c => c.status === 'Expiring Soon'), []);

  const getContractRowClass = (status: Contract['status']) => {
    switch (status) {
      case 'Expired': return 'bg-red-50 text-red-800 hover:bg-red-100';
      case 'Expiring Soon': return 'bg-yellow-50 text-yellow-800 font-semibold hover:bg-yellow-100';
      default: return 'bg-white hover:bg-gray-50';
    }
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-2">Procurement & Sourcing AI Dashboard</h1>

      {/* 1. Spend Analysis Dashboard */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <span className="mr-2">📊</span> Spend Optimization Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SpendAnalysisCard
            title="Total Annual Spend"
            value={`$${(totalSpend / 1000000).toFixed(2)}M`}
            change={0.10} // Mock overall change
          />
          <SpendAnalysisCard
            title="Top Spend Category"
            value={topCategory.category}
            change={topCategory.yoyChange}
          />
          <SpendAnalysisCard
            title="Contracts Expiring (90 Days)"
            value={expiringContracts.length.toString()}
            change={0}
          />
          <SpendAnalysisCard
            title="Savings Opportunities (AI Estimate)"
            value={`$${(totalSpend * 0.03).toFixed(0)}`}
            change={-0.03} // Negative change implies savings
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mt-4">
          <h3 className="text-xl font-medium mb-4">Spend Breakdown by Category</h3>
          <ul className="space-y-2">
            {MOCK_SPEND_DATA.map((data, index) => (
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
          <span className="mr-2">🧠</span> AI Supplier Sourcing & Risk Assessment
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
                  <SupplierRiskScore score={supplier.aiRiskScore} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Contract Management */}
      <section className="space-y-4 pt-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <span className="mr-2">📜</span> Contract Lifecycle Management
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
              {MOCK_CONTRACTS.map(contract => (
                <tr key={contract.id} className={getContractRowClass(contract.status)}>
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