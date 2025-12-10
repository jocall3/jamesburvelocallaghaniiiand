import React, { useState, useEffect } from 'react';

// Define types for market data
interface MarketIndex {
  id: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  time: string;
  url: string;
}

const MarketOverview: React.FC = () => {
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [marketNews, setMarketNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockIndices: MarketIndex[] = [
          { id: 'SPX', name: 'S&P 500', value: 5200.12, change: 15.34, changePercent: 0.30 },
          { id: 'NDX', name: 'NASDAQ', value: 16300.55, change: -50.21, changePercent: -0.31 },
          { id: 'DJI', name: 'Dow Jones', value: 39000.78, change: 120.05, changePercent: 0.31 },
          { id: 'FTSE', name: 'FTSE 100', value: 7900.23, change: 25.10, changePercent: 0.32 },
          { id: 'N225', name: 'Nikkei 225', value: 38500.45, change: -150.70, changePercent: -0.39 },
          { id: 'DAX', name: 'DAX', value: 18200.67, change: 40.80, changePercent: 0.22 },
        ];

        const mockNews: NewsArticle[] = [
          { id: 'n1', title: 'Tech Giants Report Strong Q1 Earnings, Boosting Market Confidence', source: 'Reuters', time: '2 hours ago', url: '#' },
          { id: 'n2', title: 'Inflation Concerns Ease as Fed Hints at Stable Interest Rates', source: 'Bloomberg', time: '4 hours ago', url: '#' },
          { id: 'n3', title: 'Oil Prices Fluctuate Amid Geopolitical Tensions in Middle East', source: 'Wall Street Journal', time: '6 hours ago', url: '#' },
          { id: 'n4', title: 'New AI Breakthroughs Drive Semiconductor Stocks Higher', source: 'TechCrunch', time: '1 day ago', url: '#' },
          { id: 'n5', title: 'European Markets React to Latest ECB Policy Statements', source: 'Financial Times', time: '1 day ago', url: '#' },
        ];

        setMarketIndices(mockIndices);
        setMarketNews(mockNews);
      } catch (err) {
        setError('Failed to fetch market data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    // Refresh data every 5 minutes (300000 ms)
    const interval = setInterval(fetchMarketData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg shadow-lg text-white min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg">Loading market data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-800 rounded-lg shadow-lg text-white min-h-[400px] flex items-center justify-center">
        <p className="text-lg font-semibold">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg text-white">
      <h2 className="text-3xl font-bold mb-6 text-blue-400">Global Market Overview</h2>

      {/* Key Global Indices */}
      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-gray-200">Key Global Indices</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketIndices.map((index) => (
            <div key={index.id} className="bg-gray-700 p-4 rounded-md shadow-md flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-bold mb-1">{index.name}</h4>
                <p className="text-3xl font-extrabold text-blue-300">{index.value.toFixed(2)}</p>
              </div>
              <div className="mt-2">
                <span className={`text-lg font-semibold ${index.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {index.change >= 0 ? '▲' : '▼'} {Math.abs(index.change).toFixed(2)}
                </span>
                <span className={`ml-2 text-md ${index.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ({Math.abs(index.changePercent).toFixed(2)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Market News */}
      <section>
        <h3 className="text-2xl font-semibold mb-4 text-gray-200">Latest Market News</h3>
        <div className="bg-gray-700 p-4 rounded-md shadow-md">
          <ul className="divide-y divide-gray-600">
            {marketNews.map((article) => (
              <li key={article.id} className="py-3">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="block hover:text-blue-400 transition-colors duration-200">
                  <p className="text-lg font-medium text-gray-100">{article.title}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {article.source} <span className="mx-1">•</span> {article.time}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default MarketOverview;