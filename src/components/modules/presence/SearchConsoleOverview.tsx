import React, { useState, useEffect } from 'react';
import { SearchConsoleOverviewProps } from './types';

// Mock API call function - replace with actual implementation
const fetchSearchConsoleData = async (siteUrl: string): Promise<any> => {
  console.log(`Fetching Search Console data for: ${siteUrl}`);
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock data structure based on typical Search Console API responses (e.g., Search Analytics)
  return {
    siteUrl: siteUrl,
    impressions: Math.floor(Math.random() * 100000) + 1000,
    clicks: Math.floor(Math.random() * 10000) + 100,
    ctr: (Math.random() * 0.1).toFixed(3), // Click-Through Rate (0.000 to 0.100)
    position: (Math.random() * 50).toFixed(2), // Average Position
    lastUpdated: new Date().toISOString(),
  };
};

const SearchConsoleOverview: React.FC<SearchConsoleOverviewProps> = ({ siteUrl }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteUrl) {
      setError("Site URL is required.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchSearchConsoleData(siteUrl);
        setData(result);
      } catch (err) {
        console.error("Error fetching Search Console data:", err);
        setError("Failed to load search performance data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [siteUrl]);

  if (loading) {
    return <div className="text-center p-4">Loading Search Console Overview...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  if (!data) {
    return <div className="text-center p-4">No Search Console data available for this site.</div>;
  }

  // Helper function for formatting numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        Search Performance Overview
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Metrics for: <code className="bg-gray-100 p-1 rounded">{data.siteUrl}</code>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Impressions Card */}
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
          <p className="text-sm font-medium text-gray-500">Total Impressions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatNumber(data.impressions)}
          </p>
        </div>

        {/* Clicks Card */}
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
          <p className="text-sm font-medium text-gray-500">Total Clicks</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatNumber(data.clicks)}
          </p>
        </div>

        {/* CTR Card */}
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-md">
          <p className="text-sm font-medium text-gray-500">Avg. CTR</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {(data.ctr * 100).toFixed(2)}%
          </p>
        </div>

        {/* Position Card */}
        <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-md">
          <p className="text-sm font-medium text-gray-500">Avg. Position</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {data.position}
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-400 border-t pt-2">
        Data last checked: {new Date(data.lastUpdated).toLocaleString()} (Mock Data)
      </div>

      {/* In a real application, you would integrate charting libraries here */}
      <div className="mt-6">
        <p className="text-sm font-medium text-gray-600 mb-2">Performance Trend (Visualization Placeholder)</p>
        <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm border border-dashed">
            [Chart showing Impressions, Clicks, Position over time]
        </div>
      </div>
    </div>
  );
};

export default SearchConsoleOverview;
// src/components/modules/presence/SearchConsoleOverview.tsx
// Purpose: A component to show website search performance metrics from the Google Search Console API.

// Placeholder for types definition (assuming types are defined in src/components/modules/presence/types.ts)
// export interface SearchConsoleOverviewProps {
//   siteUrl: string;
// }
// Note: Since we cannot create external files, we rely on the structure above.
// For a runnable local example, the interface definition would be needed or implicitly defined.