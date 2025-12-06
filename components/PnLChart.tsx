import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PnLDataPoint {
  timestamp: string;
  pnl: number;
}

interface PnLChartProps {
  data: PnLDataPoint[];
  algorithmName: string;
}

const PnLChart: React.FC<PnLChartProps> = ({ data, algorithmName }) => {
  const [chartData, setChartData] = useState<PnLDataPoint[]>([]);

  useEffect(() => {
    // Sort the data by timestamp
    const sortedData = [...data].sort((a, b) => (new Date(a.timestamp)).getTime() - (new Date(b.timestamp)).getTime());
    setChartData(sortedData);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="pnl" stroke="#8884d8" name={`${algorithmName} P&L`} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PnLChart;