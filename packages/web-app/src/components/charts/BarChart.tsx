import React from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  barColor?: string;
  width?: number | string;
  height?: number;
  margin?: { top?: number; right?: number; left?: number; bottom?: number };
  xAxisLabel?: string;
  yAxisLabel?: string;
  tooltipFormatter?: (value: any, name: string, props: any) => React.ReactNode;
  legendFormatter?: (value: any, entry: any, index: number) => React.ReactNode;
  gridStrokeDasharray?: string;
  barDataKey?: string;
}

const CustomTooltip = ({ active, payload, label, formatter }: { active?: boolean; payload?: any[]; label?: string; formatter?: (value: any, name: string, props: any) => React.ReactNode }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
        <p className="label">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="intro">
            {`${entry.name}: ${formatter ? formatter(entry.value, entry.name, entry) : entry.value}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};


const ReusableBarChart: React.FC<BarChartProps> = ({
  data,
  xAxisKey,
  yAxisKey,
  barColor = '#8884d8',
  width = '100%',
  height = 300,
  margin = { top: 5, right: 30, left: 20, bottom: 5 },
  xAxisLabel,
  yAxisLabel,
  tooltipFormatter,
  legendFormatter,
  gridStrokeDasharray = '3 3',
  barDataKey
}) => {
  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray={gridStrokeDasharray} />
        <XAxis dataKey={xAxisKey} label={{ value: xAxisLabel || '', position: 'bottom' }} />
        <YAxis label={{ value: yAxisLabel || '', angle: -90, position: 'left' }} />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {legendFormatter && <Legend formatter={legendFormatter} />}
        <Bar dataKey={barDataKey || yAxisKey} fill={barColor} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ReusableBarChart;