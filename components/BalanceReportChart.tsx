
import React from 'react';
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

interface BalanceReportChartProps {
  data: {
    as_of_date: string;
    closing_ledger: { amount: number }
  }[];
}

const BalanceReportChart: React.FC<BalanceReportChartProps> = ({ data }) => {
  const chartData = data.map(report => ({
    date: report.as_of_date,
    balance: report.closing_ledger?.amount || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="balance" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BalanceReportChart;
