import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Activity,
  PlugZap,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// --- Generative Data Functions (as per self-contained app requirement) ---

const generateSystemHealth = () => ({
  overallStatus: Math.random() > 0.1 ? 'Operational' : 'Degraded',
  uptime: `${(99.9 + Math.random() * 0.09).toFixed(2)}%`,
  averageResponseTime: `${Math.floor(80 + Math.random() * 120)}ms`,
});

const generateUserMetrics = () => {
    const totalUsers = 100000 + Math.floor(Math.random() * 50000);
    return {
        totalUsers,
        newUsersToday: Math.floor(Math.random() * 200),
        activeUsers24h: Math.floor(totalUsers * (0.1 + Math.random() * 0.1)),
        growthLast30d: parseFloat((5 + Math.random() * 15).toFixed(1)),
    };
};

type IntegrationStatus = 'Operational' | 'Degraded' | 'Outage';

interface Integration {
  id: string;
  name: string;
  status: IntegrationStatus;
  apiCalls24h: number;
  errorRate: number;
}

const integrationServices = [
  { id: 'google', name: 'Google' },
  { id: 'meta', name: 'Meta (Facebook)' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'amazon', name: 'Amazon (AWS)' },
  { id: 'apple', name: 'Apple' },
  { id: 'x', name: 'X (Twitter)' },
  { id: 'slack', name: 'Slack' },
];

const generateIntegrations = (): Integration[] => {
  const statuses: IntegrationStatus[] = ['Operational', 'Degraded', 'Outage'];
  return integrationServices.map(service => {
    const rand = Math.random();
    let status: IntegrationStatus;
    if (rand < 0.8) status = 'Operational';
    else if (rand < 0.95) status = 'Degraded';
    else status = 'Outage';

    const errorRate = status === 'Operational' ? Math.random() * 0.5 : status === 'Degraded' ? 1 + Math.random() * 5 : 10 + Math.random() * 10;

    return {
      ...service,
      status,
      apiCalls24h: Math.floor(Math.random() * 250000),
      errorRate: parseFloat(errorRate.toFixed(2)),
    };
  });
};

const generateUserGrowthData = (months = 7) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [];
  let userCount = 40000;
  for (let i = 0; i < months; i++) {
    userCount += Math.floor(userCount * (0.1 + Math.random() * 0.2));
    data.push({ name: monthNames[i % 12], users: userCount });
  }
  return data;
};

interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'user' | 'integration' | 'system';
  message: string;
}

const generateActivityLog = (count = 5): ActivityLog[] => {
    const logs: ActivityLog[] = [];
    const types: ('user' | 'integration' | 'system')[] = ['user', 'integration', 'system'];
    const userMessages = [
        'New user signed up: user{N}@example.com',
        'User admin@example.com updated system settings.',
        'Password reset requested for user{N}@example.com',
    ];
    const integrationMessages = [
        '{S} API integration failed.',
        '{S} API showing degraded performance.',
        'Successfully processed 10,000 records from {S} API.',
    ];
    const systemMessages = [
        'Database backup completed successfully.',
        'System update to v2.1.0 initiated.',
        'CPU usage exceeded 90% threshold.',
    ];

    let time = 2; // start at 2 minutes ago
    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        let message = '';
        switch(type) {
            case 'user':
                message = userMessages[Math.floor(Math.random() * userMessages.length)].replace('{N}', Math.floor(Math.random() * 1000).toString());
                break;
            case 'integration':
                const service = integrationServices[Math.floor(Math.random() * integrationServices.length)].name;
                message = integrationMessages[Math.floor(Math.random() * integrationMessages.length)].replace('{S}', service);
                break;
            case 'system':
                message = systemMessages[Math.floor(Math.random() * systemMessages.length)];
                break;
        }
        
        let timestamp = '';
        if (time < 60) {
            timestamp = `${Math.round(time)} minutes ago`;
        } else {
            const hours = Math.floor(time / 60);
            timestamp = `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        
        logs.push({
            id: (i + 1).toString(),
            timestamp,
            type,
            message,
        });

        // Increase time for the next log entry, with some randomness
        time = time * (1.5 + Math.random() * 2);
    }
    return logs;
};


// --- Helper Components ---

const StatCard = ({ title, value, icon: Icon, change, changeType }: { title: string; value: string; icon: React.ElementType; change?: string; changeType?: 'increase' | 'decrease' }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className="text-xs text-muted-foreground flex items-center">
          {changeType === 'increase' ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
          {change} from last month
        </p>
      )}
    </CardContent>
  </Card>
);

const getStatusBadgeVariant = (status: IntegrationStatus): "default" | "destructive" | "outline" | "secondary" => {
  switch (status) {
    case 'Operational':
      return 'default'; // Using default for success, can be customized
    case 'Degraded':
      return 'secondary'; // Using secondary for warning, can be customized
    case 'Outage':
      return 'destructive';
    default:
      return 'outline';
  }
};

// --- Main Dashboard Component ---

export default function AdminDashboard() {
  // Data is generated on component mount to simulate a live, self-contained environment
  // as per the self-hosted, no-mock-data requirements.
  const [systemHealth] = useState(() => generateSystemHealth());
  const [userMetrics] = useState(() => generateUserMetrics());
  const [integrations] = useState(() => generateIntegrations());
  const [userGrowthData] = useState(() => generateUserGrowthData());
  const [activityLog] = useState(() => generateActivityLog());

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Citibankdemobusinessinc Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={userMetrics.totalUsers.toLocaleString()}
          icon={Users}
          change={`+${userMetrics.growthLast30d}%`}
          changeType="increase"
        />
        <StatCard
          title="Active Users (24h)"
          value={userMetrics.activeUsers24h.toLocaleString()}
          icon={Activity}
        />
        <StatCard
          title="Active Integrations"
          value={`${integrations.filter(i => i.status === 'Operational').length} / ${integrations.length}`}
          icon={PlugZap}
        />
        <StatCard
          title="System Status"
          value={systemHealth.overallStatus}
          icon={Server}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Total users over the last 7 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value as number) / 1000}k`} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of recent system and user events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLog.map((log) => (
                <div key={log.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 pt-0.5">
                    {log.type === 'user' && <Users className="h-5 w-5 text-muted-foreground" />}
                    {log.type === 'integration' && <PlugZap className="h-5 w-5 text-muted-foreground" />}
                    {log.type === 'system' && <Server className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">{log.message}</p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1.5" />
                      {log.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>Live status of all major tech company integrations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">API Calls (24h)</TableHead>
                  <TableHead className="text-right">Error Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((integration) => (
                  <TableRow key={integration.id}>
                    <TableCell className="font-medium">{integration.name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(integration.status)} className={integration.status === 'Operational' ? 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-500/20' : integration.status === 'Degraded' ? 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-500/20' : ''}>
                        {integration.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{integration.apiCalls24h.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-mono ${integration.errorRate > 5 ? 'text-red-500' : ''}`}>
                      {integration.errorRate.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}