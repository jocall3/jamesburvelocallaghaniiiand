import React from 'react';
import { StripeNexusDashboard } from '../components/StripeNexusDashboard'; // Assuming StripeNexusDashboard is in ../components
import { AppLayout } from '../layouts/AppLayout'; // Assuming AppLayout is in ../layouts

export const DashboardPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">StripeNexus Dashboard</h1>
        <StripeNexusDashboard />
      </div>
    </AppLayout>
  );
};