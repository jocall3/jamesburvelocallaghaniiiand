import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GetChannelStatsResponse, GetChannelStatsRequest } from '../../../proto/youtube_pb';
import { YouTubeServiceClient } from '../../../proto/youtube_grpc_webServiceClient';
import { useAuth } from '../../../contexts/AuthContext';

// Mock API calls for demonstration purposes. In a real app, these would call the backend service.
const mockFetchChannelStats = (channelId: string): Promise<GetChannelStatsResponse.AsObject> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = {
        channelName: `Mock Channel ${channelId}`,
        subscribers: Math.floor(Math.random() * 1000000),
        viewsLast30Days: Math.floor(Math.random() * 5000000),
        videosCount: Math.floor(Math.random() * 500) + 50,
        viewsHistory: [
          { date: '2023-10-01', views: Math.floor(Math.random() * 100000) },
          { date: '2023-10-08', views: Math.floor(Math.random() * 100000) },
          { date: '2023-10-15', views: Math.floor(Math.random() * 100000) },
          { date: '2023-10-22', views: Math.floor(Math.random() * 100000) },
          { date: '2023-10-29', views: Math.floor(Math.random() * 100000) },
        ],
      };
      resolve(mockData);
    }, 1500);
  });
};

interface YouTubeChannelStatsProps {
  channelId: string;
}

interface ChannelStats {
  channelName: string;
  subscribers: number;
  viewsLast30Days: number;
  videosCount: number;
  viewsHistory: { date: string, views: number }[];
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toString();
};

const YouTubeChannelStats: React.FC<YouTubeChannelStatsProps> = ({ channelId }) => {
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthToken } = useAuth(); // Assuming AuthContext provides a way to get tokens for service calls

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real application, you would use the YouTubeServiceClient
        // const token = await getAuthToken();
        // const request = new GetChannelStatsRequest();
        // request.setChannelId(channelId);
        // const client = new YouTubeServiceClient(process.env.REACT_APP_YOUTUBE_API_BASE_URL!, null);
        // const response = await client.getChannelStats(request, { 'Authorization': `Bearer ${token}` });
        // const data = response.toObject() as unknown as ChannelStats; // Simplified mapping
        
        // Mock API call
        const data = await mockFetchChannelStats(channelId);
        setStats(data as unknown as ChannelStats);
      } catch (err) {
        console.error("Error fetching YouTube stats:", err);
        setError("Failed to load YouTube channel statistics. Please check the connection.");
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      fetchStats();
    }
  }, [channelId, getAuthToken]);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading YouTube Stats...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent>
          <Typography color="textSecondary">No statistics available for this channel ID.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          YouTube Channel Stats: {stats.channelName}
        </Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1">Subscribers</Typography>
            <Typography variant="h5" color="primary">
              {formatNumber(stats.subscribers)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1">Views (Last 30 Days)</Typography>
            <Typography variant="h5" color="primary">
              {formatNumber(stats.viewsLast30Days)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1">Total Videos</Typography>
            <Typography variant="h5" color="primary">
              {stats.videosCount}
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Views History (Recent Weeks)
        </Typography>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={stats.viewsHistory}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatNumber(value)} />
              <Tooltip formatter={(value: number) => [formatNumber(value), 'Views']} />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} name="Daily Views" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default YouTubeChannelStats;
