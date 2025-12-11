```tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComponentUsageChartProps {
  data: { week: string; insertions: number; detachments: number }[];
}

const ComponentUsageChart: React.FC<ComponentUsageChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="insertions" fill="#8884d8" />
        <Bar dataKey="detachments" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ComponentUsageChart;
```