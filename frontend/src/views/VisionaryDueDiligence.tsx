import React, { useState, useEffect } from 'react';

// Define a type for our insight data
interface Insight {
  id: string;
  title: string;
  description: string;
  category: 'Risk' | 'Opportunity' | 'Financial Health' | 'Operational Efficiency' | 'Compliance';
  relevanceScore: number; // A score from 0 to 1
  sourceDocument: string;
  pageNumber?: number; // Optional, as some insights might be aggregate or from multiple sources
  timestamp: string; // When the insight was generated/updated
}

const VisionaryDueDiligence: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching data from a backend API
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real application, you would make an API call here:
        // const response = await fetch('/api/due-diligence/insights');
        // if (!response.ok) {
        //   throw new Error(`Failed to fetch insights: ${response.statusText}`);
        // }
        // const data: Insight[] = await response.json();

        // Mock data for demonstration purposes
        const mockData: Insight[] = [
          {
            id: 'dd-001',
            title: 'High Debt-to-Equity Ratio',
            description: 'The company exhibits a debt-to-equity ratio of 2.8, significantly higher than the industry average of 1.5. This indicates a heightened financial leverage and potential risk during economic downturns.',
            category: 'Risk',
            relevanceScore: 0.92,
            sourceDocument: 'Annual Report 2023.pdf',
            pageNumber: 47,
            timestamp: '2024-03-10T10:30:00Z',
          },
          {
            id: 'dd-002',
            title: 'Strong Revenue Growth in Emerging Markets',
            description: 'Revenue from the APAC region surged by 38% year-over-year, outpacing overall company growth. This suggests a significant untapped market opportunity and successful market penetration strategies.',
            category: 'Opportunity',
            relevanceScore: 0.88,
            sourceDocument: 'Q4 Financials 2023.pdf',
            pageNumber: 15,
            timestamp: '2024-03-10T11:00:00Z',
          },
          {
            id: 'dd-003',
            title: 'Consistent Improvement in Gross Profit Margin',
            description: 'Gross profit margins have shown a steady increase of 1.2% annually over the last three fiscal years, reflecting optimized cost structures and efficient production processes.',
            category: 'Financial Health',
            relevanceScore: 0.80,
            sourceDocument: 'Income Statement Analysis.xlsx',
            timestamp: '2024-03-09T16:45:00Z',
          },
          {
            id: 'dd-004',
            title: 'Inventory Turnover Rate Decline',
            description: 'Inventory turnover has decreased from 5.5x to 3.9x in the past two years, potentially indicating slower sales, overstocking, or issues with product obsolescence.',
            category: 'Risk',
            relevanceScore: 0.75,
            sourceDocument: 'Balance Sheet 2022-2023.pdf',
            pageNumber: 32,
            timestamp: '2024-03-08T09:15:00Z',
          },
          {
            id: 'dd-005',
            title: 'Strategic Partnerships for New Product Line',
            description: 'Announcement of two key partnerships for the upcoming "Quantum Computing Solutions" product line, projected to launch in Q3 2024, signals potential for significant market disruption and new revenue streams.',
            category: 'Opportunity',
            relevanceScore: 0.95,
            sourceDocument: 'Press Release - Feb 2024.pdf',
            timestamp: '2024-03-11T14:20:00Z',
          },
          {
            id: 'dd-006',
            title: 'Increased Capital Expenditure on R&D',
            description: 'Capital expenditure allocated to Research & Development has increased by 25% this fiscal year, focusing on AI and sustainable technologies, indicating long-term growth investment.',
            category: 'Financial Health',
            relevanceScore: 0.70,
            sourceDocument: 'Cash Flow Statement 2023.pdf',
            pageNumber: 20,
            timestamp: '2024-03-07T10:00:00Z',
          },
          {
            id: 'dd-007',
            title: 'Supply Chain Diversification Initiatives',
            description: 'The company has initiated a program to diversify its supply chain by onboarding three new key suppliers across different geographies, reducing single-point-of-failure risks.',
            category: 'Operational Efficiency',
            relevanceScore: 0.82,
            sourceDocument: 'Operations Review Q1 2024.docx',
            timestamp: '2024-03-10T15:00:00Z',
          },
        ];

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 700));
        setInsights(mockData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const getCategoryColor = (category: Insight['category']) => {
    switch (category) {
      case 'Risk': return 'text-red-800 bg-red-100 border-red-200';
      case 'Opportunity': return 'text-green-800 bg-green-100 border-green-200';
      case 'Financial Health': return 'text-blue-800 bg-blue-100 border-blue-200';
      case 'Operational Efficiency': return 'text-purple-800 bg-purple-100 border-purple-200';
      case 'Compliance': return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-xl font-medium text-gray-700">Loading visionary insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Error Loading Insights</h2>
        <p className="text-lg">An unexpected error occurred: {error}</p>
        <p className="mt-2 text-md">Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-10 leading-tight">
          Visionary Due Diligence <span className="text-indigo-600">Insights</span>
        </h1>

        {insights.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center border border-gray-200">
            <p className="text-gray-600 text-xl font-medium">
              No insights available for display. Please upload or process financial documents to generate findings.
            </p>
            <button className="mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200">
              Upload Documents
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white rounded-xl shadow-lg p-7 border border-gray-100 hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${getCategoryColor(insight.category)} border`}>
                    {insight.category}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">
                    Relevance: <span className="font-semibold text-gray-800">{(insight.relevanceScore * 100).toFixed(0)}%</span>
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">{insight.title}</h2>
                <p className="text-gray-700 mb-5 text-base leading-relaxed">{insight.description}</p>
                <div className="text-xs text-gray-500 flex justify-between items-center pt-3 border-t border-gray-100">
                  <span>
                    Source: <span className="font-semibold text-gray-600">{insight.sourceDocument}</span>
                    {insight.pageNumber && <span className="ml-1">(Page {insight.pageNumber})</span>}
                  </span>
                  <span className="ml-4">
                    Updated: {new Date(insight.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionaryDueDiligence;