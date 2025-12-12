import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ApplicationData {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType?: string;
  accountEnabled: boolean;
  applicationVisibility: string;
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

interface DistributionChartProps {
  data: ApplicationData[];
}

const DistributionChart: React.FC<DistributionChartProps> = ({ data }) => {
  const applicationTypeCounts: { [key: string]: number } = {};

  data.forEach((app) => {
    const appType = app.applicationType || 'Unknown';
    applicationTypeCounts[appType] = (applicationTypeCounts[appType] || 0) + 1;
  });

  const labels = Object.keys(applicationTypeCounts);
  const dataValues = Object.values(applicationTypeCounts);

  const chartData: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label: 'Application Type Distribution',
        data: dataValues,
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Application Type Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default DistributionChart;