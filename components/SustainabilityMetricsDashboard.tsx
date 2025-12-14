import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// Define data types for clarity
interface MetricDataPoint {
  date: string; // e.g., "Q1 2022", "2023"
  value: number;
}

interface ESGMetric {
  id: string;
  name: string;
  unit: string;
  category: 'Environmental' | 'Social' | 'Governance';
  data: MetricDataPoint[];
  currentValue?: number;
  change?: number; // percentage change from previous period
}

interface MetricCardProps {
  metric: ESGMetric;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const latestDataPoint = metric.data[metric.data.length - 1];
  const previousDataPoint = metric.data[metric.data.length - 2];

  const currentValue = latestDataPoint ? latestDataPoint.value : 0;
  const change = latestDataPoint && previousDataPoint
    ? ((latestDataPoint.value - previousDataPoint.value) / previousDataPoint.value) * 100
    : 0;

  const changeColor = change >= 0 ? 'text-red-500' : 'text-green-500'; // Assuming lower is better for most ESG metrics, adjust as needed
  const changeArrow = change >= 0 ? '▲' : '▼';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{metric.name}</h3>
        <p className="text-4xl font-bold text-gray-900">
          {currentValue.toLocaleString()} <span className="text-xl font-normal text-gray-600">{metric.unit}</span>
        </p>
      </div>
      {latestDataPoint && previousDataPoint && (
        <div className="mt-4 text-sm text-gray-600">
          <span className={`${changeColor} font-medium`}>
            {changeArrow} {Math.abs(change).toFixed(2)}%
          </span>{' '}
          from previous period
        </div>
      )}
    </div>
  );
};

// Mock Data for Sustainability Metrics
const MOCK_ESG_DATA: ESGMetric[] = [
  // Environmental
  {
    id: 'carbon_emissions',
    name: 'Carbon Emissions',
    unit: 'tCO2e',
    category: 'Environmental',
    data: [
      { date: 'Q1 2022', value: 1200 }, { date: 'Q2 2022', value: 1150 }, { date: 'Q3 2022', value: 1100 }, { date: 'Q4 2022', value: 1050 },
      { date: 'Q1 2023', value: 1000 }, { date: 'Q2 2023', value: 980 }, { date: 'Q3 2023', value: 950 }, { date: 'Q4 2023', value: 920 },
      { date: 'Q1 2024', value: 900 }, { date: 'Q2 2024', value: 880 },
    ],
  },
  {
    id: 'water_usage',
    name: 'Water Usage',
    unit: 'm³',
    category: 'Environmental',
    data: [
      { date: 'Q1 2022', value: 500 }, { date: 'Q2 2022', value: 480 }, { date: 'Q3 2022', value: 460 }, { date: 'Q4 2022', value: 450 },
      { date: 'Q1 2023', value: 430 }, { date: 'Q2 2023', value: 420 }, { date: 'Q3 2023', value: 410 }, { date: 'Q4 2023', value: 400 },
      { date: 'Q1 2024', value: 390 }, { date: 'Q2 2024', value: 380 },
    ],
  },
  {
    id: 'renewable_energy',
    name: 'Renewable Energy Share',
    unit: '%',
    category: 'Environmental',
    data: [
      { date: 'Q1 2022', value: 25 }, { date: 'Q2 2022', value: 27 }, { date: 'Q3 2022', value: 28 }, { date: 'Q4 2022', value: 30 },
      { date: 'Q1 2023', value: 32 }, { date: 'Q2 2023', value: 35 }, { date: 'Q3 2023', value: 37 }, { date: 'Q4 2023', value: 40 },
      { date: 'Q1 2024', value: 42 }, { date: 'Q2 2024', value: 45 },
    ],
  },
  // Social
  {
    id: 'employee_diversity',
    name: 'Employee Diversity Score',
    unit: 'score',
    category: 'Social',
    data: [
      { date: 'Q1 2022', value: 65 }, { date: 'Q2 2022', value: 66 }, { date: 'Q3 2022', value: 68 }, { date: 'Q4 2022', value: 70 },
      { date: 'Q1 2023', value: 71 }, { date: 'Q2 2023', value: 73 }, { date: 'Q3 2023', value: 75 }, { date: 'Q4 2023', value: 76 },
      { date: 'Q1 2024', value: 78 }, { date: 'Q2 2024', value: 79 },
    ],
  },
  {
    id: 'safety_incidents',
    name: 'Safety Incidents',
    unit: 'incidents',
    category: 'Social',
    data: [
      { date: 'Q1 2022', value: 8 }, { date: 'Q2 2022', value: 7 }, { date: 'Q3 2022', value: 6 }, { date: 'Q4 2022', value: 5 },
      { date: 'Q1 2023', value: 5 }, { date: 'Q2 2023', value: 4 }, { date: 'Q3 2023', value: 3 }, { date: 'Q4 2023', value: 3 },
      { date: 'Q1 2024', value: 2 }, { date: 'Q2 2024', value: 2 },
    ],
  },
  {
    id: 'community_investment',
    name: 'Community Investment',
    unit: '$K',
    category: 'Social',
    data: [
      { date: 'Q1 2022', value: 100 }, { date: 'Q2 2022', value: 110 }, { date: 'Q3 2022', value: 105 }, { date: 'Q4 2022', value: 120 },
      { date: 'Q1 2023', value: 130 }, { date: 'Q2 2023', value: 125 }, { date: 'Q3 2023', value: 140 }, { date: 'Q4 2023', value: 150 },
      { date: 'Q1 2024', value: 160 }, { date: 'Q2 2024', value: 155 },
    ],
  },
  // Governance
  {
    id: 'board_diversity',
    name: 'Board Diversity',
    unit: '%',
    category: 'Governance',
    data: [
      { date: 'Q1 2022', value: 30 }, { date: 'Q2 2022', value: 30 }, { date: 'Q3 2022', value: 33 }, { date: 'Q4 2022', value: 33 },
      { date: 'Q1 2023', value: 35 }, { date: 'Q2 2023', value: 35 }, { date: 'Q3 2023', value: 38 }, { date: 'Q4 2023', value: 38 },
      { date: 'Q1 2024', value: 40 }, { date: 'Q2 2024', value: 40 },
    ],
  },
  {
    id: 'ethics_training',
    name: 'Ethics Training Completion',
    unit: '%',
    category: 'Governance',
    data: [
      { date: 'Q1 2022', value: 85 }, { date: 'Q2 2022', value: 88 }, { date: 'Q3 2022', value: 90 }, { date: 'Q4 2022', value: 92 },
      { date: 'Q1 2023', value: 93 }, { date: 'Q2 2023', value: 94 }, { date: 'Q3 2023', value: 95 }, { date: 'Q4 2023', value: 96 },
      { date: 'Q1 2024', value: 97 }, { date: 'Q2 2024', value: 97 },
    ],
  },
  {
    id: 'data_privacy_incidents',
    name: 'Data Privacy Incidents',
    unit: 'incidents',
    category: 'Governance',
    data: [
      { date: 'Q1 2022', value: 2 }, { date: 'Q2 2022', value: 1 }, { date: 'Q3 2022', value: 1 }, { date: 'Q4 2022', value: 0 },
      { date: 'Q1 2023', value: 1 }, { date: 'Q2 2023', value: 0 }, { date: 'Q3 2023', value: 0 }, { date: 'Q4 2023', value: 0 },
      { date: 'Q1 2024', value: 0 }, { date: 'Q2 2024', value: 0 },
    ],
  },
];

type TimeRange = '1Y' | '2Y' | 'All';

const SustainabilityMetricsDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('All');

  const filterDataByTimeRange = (data: MetricDataPoint[], range: TimeRange): MetricDataPoint[] => {
    if (range === 'All') {
      return data;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    const filterDate = (pointDate: string): boolean => {
      const parts = pointDate.split(' '); // e.g., ["Q1", "2024"] or ["2023"]
      let year: number;
      let quarter: number | undefined;

      if (parts.length === 2 && parts[0].startsWith('Q')) {
        quarter = parseInt(parts[0].substring(1));
        year = parseInt(parts[1]);
      } else if (parts.length === 1) {
        year = parseInt(parts[0]);
      } else {
        return false; // Malformed date
      }

      if (range === '1Y') {
        if (year === currentYear) return true;
        if (year === currentYear - 1 && quarter && quarter >= currentQuarter) return true; // Include previous year's data from current quarter
        return false;
      }
      if (range === '2Y') {
        if (year === currentYear || year === currentYear - 1) return true;
        if (year === currentYear - 2 && quarter && quarter >= currentQuarter) return true;
        return false;
      }
      return true; // Should not reach here for 'All'
    };

    return data.filter(point => filterDate(point.date));
  };

  const filteredMetrics = useMemo(() => {
    return MOCK_ESG_DATA.map(metric => ({
      ...metric,
      data: filterDataByTimeRange(metric.data, selectedTimeRange),
    }));
  }, [selectedTimeRange]);

  const environmentalMetrics = filteredMetrics.filter(m => m.category === 'Environmental');
  const socialMetrics = filteredMetrics.filter(m => m.category === 'Social');
  const governanceMetrics = filteredMetrics.filter(m => m.category === 'Governance');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">Sustainability & ESG Dashboard</h1>
          <div className="flex space-x-2">
            {(['1Y', '2Y', 'All'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                  ${selectedTimeRange === range
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
              >
                {range === '1Y' ? 'Last 12 Months' : range === '2Y' ? 'Last 24 Months' : 'All Data'}
              </button>
            ))}
          </div>
        </div>

        {/* Environmental Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-green-500 pb-2">Environmental</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {environmentalMetrics.map(metric => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {environmentalMetrics.map(metric => (
              <div key={`chart-${metric.id}`} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{metric.name} Trend ({metric.unit})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metric.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                      labelStyle={{ color: '#333', fontWeight: 'bold' }}
                      itemStyle={{ color: '#555' }}
                      formatter={(value: number) => `${value.toLocaleString()} ${metric.unit}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="value" stroke="#4CAF50" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name={metric.name} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </section>

        {/* Social Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-blue-500 pb-2">Social</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {socialMetrics.map(metric => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {socialMetrics.map(metric => (
              <div key={`chart-${metric.id}`} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{metric.name} Trend ({metric.unit})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metric.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                      labelStyle={{ color: '#333', fontWeight: 'bold' }}
                      itemStyle={{ color: '#555' }}
                      formatter={(value: number) => `${value.toLocaleString()} ${metric.unit}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="value" fill="#3B82F6" name={metric.name} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </section>

        {/* Governance Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-purple-500 pb-2">Governance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {governanceMetrics.map(metric => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {governanceMetrics.map(metric => (
              <div key={`chart-${metric.id}`} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{metric.name} Trend ({metric.unit})</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metric.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                      labelStyle={{ color: '#333', fontWeight: 'bold' }}
                      itemStyle={{ color: '#555' }}
                      formatter={(value: number) => `${value.toLocaleString()} ${metric.unit}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="value" stroke="#9333EA" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name={metric.name} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SustainabilityMetricsDashboard;