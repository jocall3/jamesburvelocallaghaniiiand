import React, { useState, useEffect } from 'react';
import { FiLightbulb, FiZap, FiAlertTriangle, FiInfo, FiLoader } from 'react-icons/fi';

// Define the shape of an insight
interface Insight {
  id: string;
  type: 'recommendation' | 'alert' | 'warning' | 'info';
  message: string;
  timestamp: string; // ISO string or similar
  severity: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    url: string;
  };
}

// Helper component for displaying individual insights
const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => {
  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'recommendation':
        return <FiLightbulb className="text-yellow-500" />;
      case 'alert':
        return <FiZap className="text-red-500" />;
      case 'warning':
        return <FiAlertTriangle className="text-orange-500" />;
      case 'info':
        return <FiInfo className="text-blue-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  const getSeverityStyle = (severity: Insight['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-orange-500 bg-orange-50';
      case 'low':
        return 'border-l-4 border-blue-500 bg-blue-50';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50';
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12);
    return `${years} years ago`;
  };

  return (
    <div className={`flex items-start p-4 rounded-lg shadow-sm ${getSeverityStyle(insight.severity)}`}>
      <div className="flex-shrink-0 mr-3 text-2xl">
        {getIcon(insight.type)}
      </div>
      <div className="flex-grow">
        <p className="font-medium text-gray-800">{insight.message}</p>
        <p className="text-sm text-gray-600 mt-1">
          <span className="mr-2">{timeAgo(insight.timestamp)}</span>
          {insight.action && (
            <a href={insight.action.url} className="text-blue-600 hover:underline font-medium">
              {insight.action.label} &rarr;
            </a>
          )}
        </p>
      </div>
    </div>
  );
};

// Main ProactiveInsightWidget component
const ProactiveInsightWidget: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate API call to AI Core
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay

        // Mock data from AI Core
        const mockInsights: Insight[] = [
          {
            id: 'rec1',
            type: 'recommendation',
            message: 'Your monthly report generation could be optimized by pre-caching frequently accessed data points. Estimated 15% speed improvement.',
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            severity: 'low',
            action: { label: 'Optimize Report', url: '/settings/reports' },
          },
          {
            id: 'alert1',
            type: 'alert',
            message: 'High CPU utilization detected on Production Server 1 (server-prod-01) for the last 30 minutes. Consider scaling up or investigating recent deployments.',
            timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
            severity: 'high',
            action: { label: 'View Server Metrics', url: '/servers/server-prod-01' },
          },
          {
            id: 'warning1',
            type: 'warning',
            message: 'Database connection pool usage reached 85% capacity. Monitor for potential performance degradation during peak hours.',
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            severity: 'medium',
            action: { label: 'Check Database', url: '/monitoring/database' },
          },
          {
            id: 'info1',
            type: 'info',
            message: 'New AI model update available for enhanced sentiment analysis. Review release notes for new features.',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            severity: 'low',
            action: { label: 'Read More', url: '/updates/ai-model' },
          },
          // { // Example of no insights
          //   id: 'empty',
          //   type: 'info',
          //   message: 'No proactive insights at the moment.',
          //   timestamp: new Date().toISOString(),
          //   severity: 'low',
          // }
        ];

        setInsights(mockInsights);
      } catch (err) {
        setError('Failed to load insights. Please try again.');
        console.error('Error fetching insights:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FiZap className="mr-3 text-blue-500" /> Proactive Insights
      </h2>

      {isLoading && (
        <div className="flex items-center justify-center py-8 text-blue-500">
          <FiLoader className="animate-spin text-4xl mr-3" />
          <p className="text-lg">Loading insights...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {!isLoading && !error && insights.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          <FiInfo className="text-5xl mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No proactive insights at the moment. Everything looks good!</p>
          <p className="text-sm text-gray-500 mt-2">Check back later for new recommendations or alerts from the AI Core.</p>
        </div>
      )}

      {!isLoading && !error && insights.length > 0 && (
        <div className="space-y-4">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProactiveInsightWidget;