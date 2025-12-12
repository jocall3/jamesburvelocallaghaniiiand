import React, { useState, useEffect } from 'react';

interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  lastCheck: string;
}

interface SystemMetricsData {
  cpuUsage: number; // percentage
  memory: {
    used: number; // GB
    total: number; // GB
    percentage: number;
  };
  disk: {
    used: number; // GB
    total: number; // GB
    percentage: number;
  };
  network: {
    uploadSpeed: number; // Mbps
    downloadSpeed: number; // Mbps
  };
  uptime: number; // seconds
  services: ServiceStatus[];
}

const generateInitialServices = (): ServiceStatus[] => {
  const serviceNames = [
    'OpenBanking Core API',
    'Risk-Weighted Asset Calculator',
    'Liquidity Simulation Engine',
    'Compliance Automation Service',
    'Investor Deck Generator',
    'Capital Planning Engine',
    'Stress Scenario Modeler',
    'Cross-Branch Orchestrator',
    'Shared Identity Layer',
    'Automated Audit Validator',
  ];

  return serviceNames.map(name => ({
    name,
    status: 'up',
    lastCheck: new Date().toLocaleTimeString(),
  }));
};

const initialMetrics: SystemMetricsData = {
  cpuUsage: 0,
  memory: { used: 0, total: 0, percentage: 0 },
  disk: { used: 0, total: 0, percentage: 0 },
  network: { uploadSpeed: 0, downloadSpeed: 0 },
  uptime: 0,
  services: generateInitialServices(),
};

const SystemMetrics: React.FC = () => {
  const [systemSpecs] = useState(() => ({
    totalMemory: [16, 32, 64, 128][Math.floor(Math.random() * 4)],
    totalDisk: [512, 1024, 2048, 4096][Math.floor(Math.random() * 4)],
  }));

  const [metrics, setMetrics] = useState<SystemMetricsData>({
    ...initialMetrics,
    memory: { ...initialMetrics.memory, total: systemSpecs.totalMemory },
    disk: { ...initialMetrics.disk, total: systemSpecs.totalDisk },
  });
  const [loading, setLoading] = useState(true);

  // Function to generate mock metric data
  const generateMockMetrics = (prevMetrics: SystemMetricsData): SystemMetricsData => {
    const { totalMemory, totalDisk } = systemSpecs;
    const intervalDuration = 3; // seconds, matches setInterval

    const newCpuUsage = parseFloat((Math.random() * 80 + 10).toFixed(2)); // 10-90%
    const newMemoryUsed = parseFloat((Math.random() * totalMemory * 0.7 + totalMemory * 0.1).toFixed(2)); // 10-80% of total
    const newDiskUsed = parseFloat((Math.random() * totalDisk * 0.6 + totalDisk * 0.2).toFixed(2)); // 20-80% of total

    const newServices = prevMetrics.services.map(service => {
      // Randomly change status for some services
      if (Math.random() < 0.1) { // 10% chance to change status for any service
        const statuses: ServiceStatus['status'][] = ['up', 'down', 'degraded'];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        return { ...service, status: newStatus, lastCheck: new Date().toLocaleTimeString() };
      }
      // Even if status doesn't change, update the lastCheck time
      return { ...service, lastCheck: new Date().toLocaleTimeString() };
    });

    return {
      cpuUsage: newCpuUsage,
      memory: {
        used: newMemoryUsed,
        total: totalMemory,
        percentage: parseFloat(((newMemoryUsed / totalMemory) * 100).toFixed(2)),
      },
      disk: {
        used: newDiskUsed,
        total: totalDisk,
        percentage: parseFloat(((newDiskUsed / totalDisk) * 100).toFixed(2)),
      },
      network: {
        uploadSpeed: parseFloat((Math.random() * 50 + 5).toFixed(2)), // 5-55 Mbps
        downloadSpeed: parseFloat((Math.random() * 100 + 10).toFixed(2)), // 10-110 Mbps
      },
      uptime: prevMetrics.uptime + intervalDuration, // Increment by interval duration
      services: newServices,
    };
  };

  useEffect(() => {
    // Simulate initial data fetch
    const fetchInitialData = () => {
      setTimeout(() => {
        setMetrics(prevMetrics => generateMockMetrics(prevMetrics)); // Generate some initial non-zero data
        setLoading(false);
      }, 500); // Simulate network delay
    };

    fetchInitialData();

    // Simulate real-time updates
    const intervalId = setInterval(() => {
      setMetrics(prevMetrics => generateMockMetrics(prevMetrics));
    }, 3000); // Update every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []); // Empty dependency array is correct here

  // Helper to format uptime from seconds to human-readable string
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    seconds %= (3600 * 24);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  // Helper to get Tailwind CSS color class based on service status
  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'up': return 'bg-green-500';
      case 'down': return 'bg-red-500';
      case 'degraded': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Citibankdemobusinessinc System Metrics</h2>
        <p className="text-gray-600">Loading real-time system metrics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Citibankdemobusinessinc System Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* CPU Usage */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-2">CPU Usage</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${metrics.cpuUsage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{metrics.cpuUsage}%</p>
        </div>

        {/* Memory Usage */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Memory Usage</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${metrics.memory.percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {metrics.memory.used}GB / {metrics.memory.total}GB ({metrics.memory.percentage}%)
          </p>
        </div>

        {/* Disk Usage */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Disk Usage</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-orange-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${metrics.disk.percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {metrics.disk.used}GB / {metrics.disk.total}GB ({metrics.disk.percentage}%)
          </p>
        </div>

        {/* Network I/O */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Network I/O</h3>
          <p className="text-sm text-gray-600">
            Upload: <span className="font-semibold">{metrics.network.uploadSpeed} Mbps</span>
          </p>
          <p className="text-sm text-gray-600">
            Download: <span className="font-semibold">{metrics.network.downloadSpeed} Mbps</span>
          </p>
        </div>

        {/* Uptime */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-2">System Uptime</h3>
          <p className="text-sm text-gray-600 font-semibold">
            {formatUptime(metrics.uptime)}
          </p>
        </div>
      </div>

      {/* Service Health */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Service Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.services.map((service) => (
            <div key={service.name} className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm">
              <span className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(service.status)}`}></span>
              <div>
                <p className="font-medium text-gray-700">{service.name}</p>
                <p className="text-sm text-gray-500">Status: <span className="capitalize">{service.status}</span></p>
                <p className="text-xs text-gray-400">Last Check: {service.lastCheck}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemMetrics;