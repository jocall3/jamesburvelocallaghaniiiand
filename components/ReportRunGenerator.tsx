
import React, { useState } from 'react';
import { reportingReportRunCreate } from '../lib/api/stripeNexus/reporting';
import { useAuth } from '../context/AuthContext'; // Fixed path

interface ReportRunGeneratorProps {
  onReportRunCreated?: (reportRun: any) => void;
}

export const ReportRunGenerator: React.FC<ReportRunGeneratorProps> = ({ onReportRunCreated }) => {
  const { user } = useAuth() || {};
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
      setLoading(true);
      await reportingReportRunCreate({});
      setLoading(false);
      alert("Report run created!");
  };

  if (!user) return <div>Please log in.</div>;

  return (
    <div>
      <h3>Generate Report</h3>
      <button onClick={handleCreate} disabled={loading} className="bg-blue-500 text-white p-2 rounded">
        {loading ? 'Generating...' : 'Create Balance Report'}
      </button>
    </div>
  );
};
