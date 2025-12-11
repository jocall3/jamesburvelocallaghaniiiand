import React, { useMemo } from 'react';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

interface StreamStatusWidgetProps {
  /**
   * Current connection state of the event mesh stream.
   */
  status: ConnectionStatus;
  /**
   * Round-trip time in milliseconds.
   */
  latencyMs?: number;
  /**
   * Number of events processed in the current session.
   */
  eventCount?: number;
  /**
   * Throughput in events per second.
   */
  eventsPerSecond?: number;
  /**
   * Timestamp of the last successful heartbeat or data packet.
   */
  lastPacketReceivedAt?: Date | null;
  /**
   * Optional custom endpoint label.
   */
  meshEndpoint?: string;
}

/**
 * StreamStatusWidget
 * 
 * A specialized component to visualize the health and metrics of the 
 * serverless event mesh connection (e.g., gRPC-Web or WebSocket).
 */
export const StreamStatusWidget: React.FC<StreamStatusWidgetProps> = ({
  status = 'idle',
  latencyMs = 0,
  eventCount = 0,
  eventsPerSecond = 0,
  lastPacketReceivedAt = null,
  meshEndpoint = 'event-mesh-gateway'
}) => {
  
  // derived state for visual indicators
  const config = useMemo(() => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-emerald-500',
          ring: 'ring-emerald-500/30',
          text: 'text-emerald-700 dark:text-emerald-400',
          label: 'Mesh Active',
          pulse: true,
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          )
        };
      case 'connecting':
      case 'reconnecting':
        return {
          color: 'bg-amber-500',
          ring: 'ring-amber-500/30',
          text: 'text-amber-700 dark:text-amber-400',
          label: status === 'connecting' ? 'Initializing...' : 'Reconnecting...',
          pulse: true,
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          )
        };
      case 'error':
        return {
          color: 'bg-rose-500',
          ring: 'ring-rose-500/30',
          text: 'text-rose-700 dark:text-rose-400',
          label: 'Connection Failed',
          pulse: false,
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          )
        };
      case 'disconnected':
      case 'idle':
      default:
        return {
          color: 'bg-slate-400',
          ring: 'ring-slate-400/30',
          text: 'text-slate-600 dark:text-slate-400',
          label: 'Offline',
          pulse: false,
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          )
        };
    }
  }, [status]);

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 w-full max-w-sm">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700">
             {/* Icon SVG */}
            <svg 
              className={`w-5 h-5 ${config.text}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {config.icon}
            </svg>
            
            {/* Status Dot */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              {config.pulse && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color}`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${config.color}`}></span>
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Event Mesh</h3>
            <p className={`text-xs font-semibold ${config.text}`}>
              {config.label}
            </p>
          </div>
        </div>
        <div className="text-right">
           <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
             {meshEndpoint}
           </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Latency Metric */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between transition-colors">
          <span className="text-slate-500 dark:text-slate-400 mb-1">Latency</span>
          <div className="flex items-end space-x-1">
            <span className={`text-base font-bold ${latencyMs > 200 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
              {status === 'connected' ? latencyMs : '-'}
            </span>
            <span className="text-slate-400 mb-0.5">ms</span>
          </div>
        </div>

        {/* Throughput Metric */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <span className="text-slate-500 dark:text-slate-400 mb-1">Throughput</span>
          <div className="flex items-end space-x-1">
            <span className="text-base font-bold text-slate-700 dark:text-slate-200">
              {status === 'connected' ? eventsPerSecond : '-'}
            </span>
            <span className="text-slate-400 mb-0.5">evt/s</span>
          </div>
        </div>

        {/* Total Events */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between col-span-1">
          <span className="text-slate-500 dark:text-slate-400 mb-1">Total Events</span>
          <span className="text-base font-bold text-slate-700 dark:text-slate-200 font-mono">
            {eventCount.toLocaleString()}
          </span>
        </div>

         {/* Last Heartbeat */}
         <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between col-span-1">
          <span className="text-slate-500 dark:text-slate-400 mb-1">Last Packet</span>
          <span className="text-base font-bold text-slate-700 dark:text-slate-200 font-mono">
            {formatTime(lastPacketReceivedAt)}
          </span>
        </div>
      </div>
      
      {/* Progress/Activity Bar (Decorative or Functional) */}
      {(status === 'connecting' || status === 'reconnecting') && (
        <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 animate-progress origin-left"></div>
        </div>
      )}
    </div>
  );
};

export default StreamStatusWidget;