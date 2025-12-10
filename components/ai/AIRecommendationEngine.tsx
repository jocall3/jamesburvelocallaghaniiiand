import React from 'react';
import { ArrowRightIcon, LightbulbIcon, DollarSignIcon, BookOpenIcon, TrendingUpIcon } from 'lucide-react';

// Define the shape of a single recommendation
export interface Recommendation {
  id: string;
  type: 'financial_action' | 'learning_path' | 'investment_opportunity' | 'general';
  title: string;
  description: string;
  actionLabel?: string; // e.g., "Invest Now", "Start Course", "View Details"
  actionLink?: string; // URL for the action, if applicable
  icon?: React.ElementType; // Optional icon component (e.g., from lucide-react)
  severity?: 'low' | 'medium' | 'high' | 'critical'; // For financial actions
  progress?: number; // For learning paths (0-100)
  roiEstimate?: string; // For investment opportunities
  tags?: string[]; // Optional tags for filtering or categorization
}

// Props for the AIRecommendationEngine component
interface AIRecommendationEngineProps {
  recommendations: Recommendation[];
  title?: string;
  isLoading?: boolean;
  onActionClick?: (recommendation: Recommendation) => void;
  emptyStateMessage?: string;
}

// Helper function to get a default icon based on recommendation type
const getDefaultIcon = (type: Recommendation['type']) => {
  switch (type) {
    case 'financial_action':
      return DollarSignIcon;
    case 'learning_path':
      return BookOpenIcon;
    case 'investment_opportunity':
      return TrendingUpIcon;
    case 'general':
    default:
      return LightbulbIcon;
  }
};

const AIRecommendationEngine: React.FC<AIRecommendationEngineProps> = ({
  recommendations,
  title = 'AI-Powered Recommendations',
  isLoading = false,
  onActionClick,
  emptyStateMessage = "No recommendations available at the moment. Check back later!",
}) => {
  const renderRecommendationCard = (rec: Recommendation) => {
    const IconComponent = rec.icon || getDefaultIcon(rec.type);

    const handleAction = () => {
      if (onActionClick) {
        onActionClick(rec);
      } else if (rec.actionLink) {
        window.open(rec.actionLink, '_blank');
      }
    };

    const getSeverityColor = (severity?: Recommendation['severity']) => {
      switch (severity) {
        case 'critical': return 'bg-red-100 text-red-800';
        case 'high': return 'bg-orange-100 text-orange-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div
        key={rec.id}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
      >
        <div>
          <div className="flex items-center mb-3">
            <IconComponent className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{rec.description}</p>

          {rec.severity && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(rec.severity)} mb-2`}>
              {rec.severity.charAt(0).toUpperCase() + rec.severity.slice(1)} Priority
            </span>
          )}

          {rec.progress !== undefined && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progress</span>
                <span>{rec.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${rec.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {rec.roiEstimate && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
              Estimated ROI: {rec.roiEstimate}
            </p>
          )}

          {rec.tags && rec.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {rec.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {(rec.actionLabel || rec.actionLink) && (
          <div className="mt-4">
            <button
              onClick={handleAction}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {rec.actionLabel || 'Learn More'}
              <ArrowRightIcon className="ml-2 -mr-1 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSkeletonLoader = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 animate-pulse"
        >
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-4"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-4"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
        {title}
      </h2>

      {isLoading ? (
        renderSkeletonLoader()
      ) : recommendations.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <LightbulbIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-lg font-medium">{emptyStateMessage}</h3>
          <p className="mt-1 text-sm">Our AI is constantly learning and will provide new insights soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map(renderRecommendationCard)}
        </div>
      )}
    </div>
  );
};

export default AIRecommendationEngine;