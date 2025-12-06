
import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { useMoneyMovement } from './MoneyMovementContext';

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: Method;
  path: string;
  status: number | 'Error';
  response?: any;
  requestBody?: any;
}

type Listener = (logs: ApiLogEntry[]) => void;

class ApiLogger {
  private logEntries: ApiLogEntry[] = [];
  private listeners: Set<Listener> = new Set();
  private readonly MAX_LOG_SIZE = 50;

  public addLog(entry: Omit<ApiLogEntry, 'id' | 'timestamp'>) {
    const newEntry: ApiLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.logEntries.unshift(newEntry);
    if (this.logEntries.length > this.MAX_LOG_SIZE) {
      this.logEntries.pop();
    }
    this.notifyListeners();
  }

  public getLogs(): ApiLogEntry[] {
    return [...this.logEntries];
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getLogs()));
  }
}

export const apiLogger = new ApiLogger();

const useApiLog = () => {
  const [logs, setLogs] = useState<ApiLogEntry[]>(apiLogger.getLogs());
  useEffect(() => {
    const unsubscribe = apiLogger.subscribe(setLogs);
    return unsubscribe;
  }, []);
  return logs;
};

const CitibankDeveloperToolsView: React.FC = () => {
  const { accessToken, uuid } = useMoneyMovement();
  const logs = useApiLog();
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen text-black">
        <h2 className="text-2xl font-bold mb-4">Developer Tools</h2>
        <div className="bg-white p-4 rounded shadow mb-6">
            <h3 className="text-lg font-bold mb-2">Current Context</h3>
            <p><strong>Access Token:</strong> {accessToken ? `${accessToken.substring(0, 10)}...` : 'None'}</p>
            <p><strong>UUID:</strong> {uuid}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-bold mb-2">API Logs</h3>
            <div className="overflow-y-auto h-96 border rounded">
                {logs.map(log => (
                    <div key={log.id} className="border-b p-2 hover:bg-gray-100">
                        <div className="flex justify-between">
                            <span className={`font-bold ${log.status === 200 ? 'text-green-600' : 'text-red-600'}`}>{log.method} {log.status}</span>
                            <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-sm truncate">{log.path}</div>
                        <details>
                            <summary className="cursor-pointer text-blue-500 text-sm">View Details</summary>
                            <pre className="text-xs bg-gray-800 text-white p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(log.response || log.requestBody, null, 2)}
                            </pre>
                        </details>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default CitibankDeveloperToolsView;
