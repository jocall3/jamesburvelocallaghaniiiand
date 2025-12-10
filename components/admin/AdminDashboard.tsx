import React, { useState, useEffect } from 'react';
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
  BarChart,
  Bar,
} from 'recharts';

// --- Mock Data (replace with actual API calls in a real application) ---

const mockSystemHealth = {
  overallStatus: 'Operational',
  uptime: '99.98%',
  averageResponseTime: '120ms',
};

const mockUserMetrics = {
  totalUsers: 125430,
  newUsersToday: 152,
  activeUsers24h: 18765,
  growthLast30d: 12.5,
};

type IntegrationStatus = 'Operational' | 'Degraded' | 'Outage';

interface Integration {
  id: string;
  name: string;
  status: IntegrationStatus;
  apiCalls24h: number;
  errorRate: number;
}

const mockIntegrations: Integration[] = [
  { id: 'google', name: 'Google', status: 'Operational', apiCalls24h: 120500, errorRate: 0.1 },
  { id: 'meta', name: 'Meta (Facebook)', status: 'Operational', apiCalls24h: 89700, errorRate: 0.3 },
  { id: 'microsoft', name: 'Microsoft', status: 'Degraded', apiCalls24h: 45200, errorRate: 5.2 },
  { id: 'amazon', name: 'Amazon (AWS)', status: 'Operational', apiCalls24h: 250000, errorRate: 0.05 },
  { id: 'apple', name: 'Apple', status: 'Operational', apiCalls24h: 33100, errorRate: 0.2 },
  { id: 'x', name: 'X (Twitter)', status: 'Outage', apiCalls24h: 5600, errorRate: 15.8 },
  { id: 'slack', name: 'Slack', status: 'Operational', apiCalls24h: 67800, errorRate: 0.4 },
];

const mockUserGrowthData = [
  { name: 'Jan', users: 40000 },
  { name: 'Feb', users: 51000 },
  { name: 'Mar', users: 65000 },
  { name: 'Apr', users: 78780 },
  { name: 'May', users: 95890 },
  { name: 'Jun', users: 110390 },
  { name: 'Jul', users: 125430 },
];

const mockApiUsageData = mockIntegrations.map(int => ({
  name: int.name,
  'API Calls': int.apiCalls24h,
}));

interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'user' | 'integration' | 'system';
  message: string;
}

const mockActivityLog: ActivityLog[] = [
    { id: '1', timestamp: '2 minutes ago', type: 'integration', message: 'X (Twitter) API integration failed.' },
    { id: '2', timestamp: '15 minutes ago', type: 'user', message: 'New user signed up: user@example.com' },
    { id: '3', timestamp: '1 hour ago', type: 'system', message: 'Database backup completed successfully.' },
    { id: '4', timestamp: '2 hours ago', type: 'integration', message: 'Microsoft API showing degraded performance.' },
    { id: '5', timestamp: '4 hours ago', type: 'user', message: 'User admin@example.com updated system settings.' },
];


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
  // In a real app, you'd use hooks like useQuery from react-query to fetch this data
  const [systemHealth] = useState(mockSystemHealth);
  const [userMetrics] = useState(mockUserMetrics);
  const [integrations] = useState(mockIntegrations);
  const [userGrowthData] = useState(mockUserGrowthData);
  const [apiUsageData] = useState(mockApiUsageData);
  const [activityLog] = useState(mockActivityLog);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
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