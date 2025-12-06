
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SpendingData {
  category: string;
  amount: number;
}

interface SpendingAnalysisChartProps {
  transactions: any[]; // Replace 'any' with a more specific type if possible
}

const SpendingAnalysisChart: React.FC<SpendingAnalysisChartProps> = ({ transactions }) => {
  const [spendingData, setSpendingData] = useState<SpendingData[]>([]);

  useEffect(() => {
    // Process transactions to categorize and sum spending
    const categorizedSpending: { [category: string]: number } = {};

    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized'; // Default category

      if (transaction.amount < 0) { // Assuming expenses are negative amounts
        categorizedSpending[category] = (categorizedSpending[category] || 0) + Math.abs(transaction.amount);
      }
    });

    // Convert categorizedSpending object to an array of SpendingData objects
    const dataArray: SpendingData[] = Object.entries(categorizedSpending).map(([category, amount]) => ({
      category,
      amount,
    }));

    setSpendingData(dataArray);
  }, [transactions]);

  const chartData = {
    labels: spendingData.map(item => item.category),
    datasets: [
      {
        label: 'Spending by Category',
        data: spendingData.map(item => item.amount),
        backgroundColor: 'rgba(54, 162, 235, 0.8)', // Example color
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Spending Analysis',
      },
    },
  };

  return (
    <Bar data={chartData} options={chartOptions} />
  );
};

export default SpendingAnalysisChart;
