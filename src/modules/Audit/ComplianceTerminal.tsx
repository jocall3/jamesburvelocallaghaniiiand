import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Types ---

type LogLevel = 'AUDIT' | 'INFO' | 'WARNING' | 'ERROR';

interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
}

// --- Constants and Utility Functions ---

const MAX_LOG_LINES = 500;
let entryIdCounter = 0;

const getRandomLogLevel = (): LogLevel => {
  const levels: LogLevel[] = ['AUDIT', 'INFO', 'WARNING', 'ERROR'];
  // Ensure AUDIT logs appear slightly more often in this specific compliance view
  if (Math.random() < 0.4) {
    return 'AUDIT';
  }
  return levels[Math.floor(Math.random() * levels.length)];
};

const formatTimestamp = (): string => {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
};

const createMockLog = (level: LogLevel): LogEntry => {
  entryIdCounter++;
  const sources = ['AuthService', 'DataValidator', 'BillingAPI', 'ComplianceEngine', 'UserManagement', 'AccessControl'];
  const messages = {
    AUDIT: ['User 123 attempted sensitive access.', 'Policy enforced on resource X.', 'Configuration change logged.', 'Successful authentication policy check.', 'Failed attempt to modify immutable file.'],
    INFO: ['Database connection established.', 'Processing batch job BATCH-001.', 'System health check passed.', 'Started log aggregation pipeline.'],
    WARNING: ['High latency detected in upstream service.', 'Resource utilization above 80%.', 'Non-critical failure: Retrying...', 'Pending security patch deployment.'],
    ERROR: ['Failed to write to audit log.', 'Transaction rollback initiated.', 'Unhandled exception in worker thread.', 'Critical resource lock failed.'],
  };

  const selectedMessages = messages[level];
  const message = selectedMessages[Math.floor(Math.random() * selectedMessages.length)];
  const source = sources[Math.floor(Math.random() * sources.length)];

  return {
    id: entryIdCounter,
    timestamp: formatTimestamp(),
    level,
    source,
    message: `${message} (EID: ${entryIdCounter})`,
  };
};

const getLevelColor = (level: LogLevel): string => {
  switch (level) {
    case 'AUDIT': return '#00FF00'; // Bright Green for compliance success/event
    case 'INFO': return '#4CAF50';
    case 'WARNING': return '#FFC107';
    case 'ERROR': return '#F44336';
    default: return '#FFFFFF';
  }
};

// --- Sub Component for Log Line ---

const TerminalLine: React.FC<{ entry: LogEntry }> = React.memo(({ entry }) => {
  const levelColor = getLevelColor(entry.level);

  // Pad lengths for alignment in a monospace font
  const LEVEL_WIDTH = 7;
  const SOURCE_WIDTH = 15;

  return (
    <div style={{ display: 'flex', whiteSpace: 'pre', color: '#B0B0B0', lineHeight: '1.2' }}>
      {/* Timestamp */}
      <span style={{ color: '#555' }}>[{entry.timestamp}] </span>
      {/* Level */}
      <span style={{ color: levelColor, width: `${LEVEL_WIDTH + 1}ch`, flexShrink: 0 }}>{entry.level.padStart(LEVEL_WIDTH)} </span>
      {/* Source */}
      <span style={{ color: '#00FFFF', width: `${SOURCE_WIDTH + 1}ch`, flexShrink: 0 }}>{entry.source.padEnd(SOURCE_WIDTH)} </span>
      {/* Message */}
      <span>{entry.message}</span>
    </div>
  );
});

// --- Main Component ---

const ComplianceTerminal: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [filterKeyword, setFilterKeyword] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback(() => {
    const newLog = createMockLog(getRandomLogLevel());
    setLogs((prevLogs) => {
      // Keep only the last MAX_LOG_LINES entries for performance
      const newLogs = [...prevLogs.slice(-(MAX_LOG_LINES - 1)), newLog];
      return newLogs;
    });
  }, []);

  // Effect for auto-scrolling
  useEffect(() => {
    if (terminalRef.current && isStreaming) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isStreaming]);

  // Effect for simulation (streaming)
  useEffect(() => {
    if (!isStreaming) return;

    // Simulate streaming logs every 100ms
    const interval = setInterval(addLog, 100);

    return () => clearInterval(interval);
  }, [isStreaming, addLog]);

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterLevel(e.target.value as LogLevel | 'ALL');
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterKeyword(e.target.value);
  };

  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'ALL' || log.level === filterLevel;
    const keywordMatch = filterKeyword === '' || 
                         log.message.toLowerCase().includes(filterKeyword.toLowerCase()) || 
                         log.source.toLowerCase().includes(filterKeyword.toLowerCase());
    return levelMatch && keywordMatch;
  });

  // --- Styles ---
  const containerStyle: React.CSSProperties = {
    padding: '20px', 
    backgroundColor: '#2C2C2C', 
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  };
  
  const headerStyle: React.CSSProperties = { 
    color: '#E0E0E0', 
    borderBottom: '1px solid #555', 
    paddingBottom: '10px' 
  };

  const terminalStyle: React.CSSProperties = {
    backgroundColor: '#1E1E1E',
    color: '#D4D4D4',
    fontFamily: 'Consolas, "Courier New", monospace',
    flexGrow: 1,
    overflowY: 'auto',
    padding: '10px',
    border: '1px solid #333',
    borderRadius: '4px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    marginTop: '15px',
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '20px',
    paddingBottom: '15px',
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 15px',
    cursor: 'pointer',
    backgroundColor: isStreaming ? '#DC3545' : '#28A745',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  };
  
  const inputStyle: React.CSSProperties = { 
    padding: '5px', 
    backgroundColor: '#3C3C3C', 
    color: 'white', 
    border: '1px solid #555', 
    borderRadius: '3px',
    width: '250px' 
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Compliance & Audit Terminal</h2>

      <div style={controlsStyle}>
        {/* Streaming Control */}
        <button onClick={toggleStreaming} style={buttonStyle}>
          {isStreaming ? '⏸ PAUSE STREAM' : '▶ RESUME STREAM'}
        </button>
        
        {/* Level Filter */}
        <div>
          <label style={{ color: '#D4D4D4', marginRight: '10px' }}>Level:</label>
          <select onChange={handleFilterChange} value={filterLevel} style={inputStyle}>
            <option value="ALL">ALL</option>
            <option value="AUDIT">AUDIT</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>

        {/* Keyword Filter */}
        <div>
          <label style={{ color: '#D4D4D4', marginRight: '10px' }}>Keyword:</label>
          <input 
            type="text" 
            value={filterKeyword} 
            onChange={handleKeywordChange} 
            placeholder="Filter content..."
            style={inputStyle}
          />
        </div>

        {/* Status */}
        <div style={{ color: '#90CAF9', marginLeft: 'auto', fontWeight: 'bold' }}>
            Status: <span style={{ color: isStreaming ? '#28A745' : '#FFC107' }}>{isStreaming ? 'LIVE' : 'BUFFERED'}</span> | Displaying: {filteredLogs.length} of {logs.length}
        </div>
      </div>

      <div style={terminalStyle} ref={terminalRef}>
        {filteredLogs.length === 0 && (
            <div style={{ color: '#888' }}>
                {logs.length > 0 ? 'No logs match current filter.' : 'Awaiting compliance events...'}
            </div>
        )}
        {filteredLogs.map(entry => (
          <TerminalLine key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
};

export default ComplianceTerminal;
// Reset counter on HMR or component unmount (optional, for development environment consistency)
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        entryIdCounter = 0;
    });
}