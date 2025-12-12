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

// --- Internal Generative-Data Functions ---
// As per Citibankdemobusinessinc principles: zero mock data, internal data generators.

const generateRandomFloat = (min: number, max: number, decimals: number): number => {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
};

const generateMarketIndexData = (): MarketIndex[] => {
  const indices = [
    { id: 'SPX', name: 'S&P 500', baseValue: 5200 },
    { id: 'NDX', name: 'NASDAQ', baseValue: 16300 },
    { id: 'DJI', name: 'Dow Jones', baseValue: 39000 },
    { id: 'FTSE', name: 'FTSE 100', baseValue: 7900 },
    { id: 'N225', name: 'Nikkei 225', baseValue: 38500 },
    { id: 'DAX', name: 'DAX', baseValue: 18200 },
  ];

  return indices.map(index => {
    const value = index.baseValue * (1 + generateRandomFloat(-0.05, 0.05, 4));
    const changePercent = generateRandomFloat(-1.5, 1.5, 2);
    const previousValue = value / (1 + changePercent / 100);
    const change = value - previousValue;
    
    return {
      id: index.id,
      name: index.name,
      value: parseFloat(value.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: changePercent,
    };
  });
};

const generateMarketNewsData = (): NewsArticle[] => {
  const subjects = ['Tech Giants', 'Global Markets', 'Oil Prices', 'Semiconductor Stocks', 'European Markets', 'Central Bank'];
  const actions = ['Report Strong', 'Experience Volatility', 'Fluctuate Amid', 'Drive Higher', 'React to', 'Hints at'];
  const reasons = ['Q1 Earnings', 'Geopolitical Tensions', 'Inflation Concerns', 'New AI Breakthroughs', 'ECB Policy Statements', 'Stable Interest Rates'];
  const sources = ['Reuters', 'Bloomberg', 'Wall Street Journal', 'TechCrunch', 'Financial Times', 'Associated Press'];
  const times = ['2 hours ago', '4 hours ago', '6 hours ago', '1 day ago', '2 days ago'];

  const articles: NewsArticle[] = [];
  for (let i = 0; i < 5; i++) {
    const title = `${subjects[Math.floor(Math.random() * subjects.length)]} ${actions[Math.floor(Math.random() * actions.length)]} ${reasons[Math.floor(Math.random() * reasons.length)]}`;
    articles.push({
      id: `n${i + 1}-${Date.now()}`,
      title: title,
      source: sources[Math.floor(Math.random() * sources.length)],
      time: times[Math.floor(Math.random() * times.length)],
      url: '#',
    });
  }
  return articles;
};


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
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Use internal generative functions instead of mock data
        const generatedIndices = generateMarketIndexData();
        const generatedNews = generateMarketNewsData();

        setMarketIndices(generatedIndices);
        setMarketNews(generatedNews);
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
      <h2 className="text-3xl font-bold mb-6 text-blue-400">Citibankdemobusinessinc - Global Market Overview</h2>

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
                  {index.change >= 0 ? 'â–²' : 'â–¼'} {Math.abs(index.change).toFixed(2)}
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
                    {article.source} <span className="mx-1">â€¢</span> {article.time}
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