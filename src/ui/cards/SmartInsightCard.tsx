```tsx
import React from 'react';
import {
  AlertTriangle,
  Info,
  Lightbulb,
  ShieldAlert,
  X,
  Zap,
} from 'lucide-react';

// --- TYPE DEFINITIONS ---

export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface InsightAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  timestamp: Date;
  actions?: InsightAction[];
}

export interface SmartInsightCardProps {
  insight: Insight;
  onDismiss?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

// --- CONFIGURATION ---

const severityConfig = {
  low: {
    Icon: Info,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 border-blue-200',
    titleColor: 'text-blue-800',
  },
  medium: {
    Icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50 border-yellow-200',
    titleColor: 'text-yellow-800',
  },
  high: {
    Icon: Zap,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
    titleColor: 'text-red-800',
  },
  critical: {
    Icon: ShieldAlert,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    titleColor: 'text-purple-800',
  },
};

// --- HELPER FUNCTIONS ---

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} years ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)} months ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} days ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)} hours ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)} minutes ago`;
  if (seconds < 5) return 'just now';
  return `${Math.floor(seconds)} seconds ago`;
};

// --- SKELETON LOADER COMPONENT ---

const SmartInsightCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`w-full max-w-md animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded-full bg-gray-300"></div>
        <div className="h-5 w-48 rounded bg-gray-300"></div>
      </div>
      <div className="h-5 w-5 rounded bg-gray-300"></div>
    </div>
    <div className="mt-4 space-y-2 pl-9">
      <div className="h-4 w-full rounded bg-gray-200"></div>
      <div className="h-4 w-5/6 rounded bg-gray-200"></div>
    </div>
    <div className="mt-5 flex items-center justify-between pl-9">
      <div className="h-4 w-24 rounded bg-gray-200"></div>
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-md bg-gray-300"></div>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

/**
 * A modular UI card that uses AI to surface contextual insights and actionable alerts.
 */
const SmartInsightCard: React.FC<SmartInsightCardProps> = ({
  insight,
  onDismiss,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return <SmartInsightCardSkeleton className={className} />;
  }

  const { id, title, description, severity, timestamp, actions } = insight;
  const config = severityConfig[severity];

  return (
    <div
      className={`w-full max-w-md rounded-lg border p-4 shadow-sm transition-all duration-300 hover:shadow-md ${config.bgColor} ${className}`}
    >
      {/* Card Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <config.Icon className={`h-6 w-6 flex-shrink-0 ${config.iconColor}`} aria-hidden="true" />
          <h3 className={`text-lg font-semibold ${config.titleColor}`}>
            {title}
          </h3>
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(id)}
            aria-label="Dismiss insight"
            className="text-gray-400 rounded-full p-1 hover:bg-black/10 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </header>

      {/* Card Body */}
      <main className="my-3 pl-9">
        <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
      </main>

      {/* Card Footer */}
      <footer className="flex items-center justify-between pl-9 mt-4">
        <span className="text-xs text-gray-500" title={timestamp.toLocaleString()}>
            {formatTimeAgo(timestamp)}
        </span>
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${
                    action.variant === 'primary'
                      ? 'bg-slate-800 text-white hover:bg-slate-700 focus:ring-slate-500'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 focus:ring-slate-400'
                  }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
};

export default SmartInsightCard;
```