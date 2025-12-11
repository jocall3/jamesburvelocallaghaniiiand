```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnomalySeverity, AnomalyStatus } from '../../../types'; // Assuming types are in ../../../types
import { AiOutlineWarning, AiFillCloseCircle, AiOutlineCheckCircle, AiOutlineEye } from 'react-icons/ai';
import { TbAlertTriangleFilled } from 'react-icons/tb';
import { FeatureGuard } from '../../../components/FeatureGuard';
import { View } from '../../../types';

// GraphQL Schema for AI Risk Registry
const GET_RISK_DATA = gql`
  query GetRiskData {
    listAnomalies(status: null) { # Fetch all anomalies initially
      id
      description
      details
      severity
      status
      timestamp
      riskScore
      entityType
      entityId
    }
  }
`;

const UPDATE_ANOMALY_STATUS = gql`
  mutation UpdateAnomalyStatus($anomalyId: ID!, $status: AnomalyStatus!, $resolutionNotes: String) {
    resolveAnomaly(anomalyId: $anomalyId, status: $status, resolutionNotes: $resolutionNotes) {
      id
      status
      resolutionNotes
    }
  }
`;

type Anomaly = {
  id: string;
  description: string;
  details: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  timestamp: string;
  riskScore: number;
  entityType: string;
  entityId: string;
};

const AIRiskRegistryView: React.FC = () => {
  const { loading, error, data, refetch } = useQuery<{ listAnomalies: Anomaly[] }>(GET_RISK_DATA);
  const [updateAnomalyStatus] = useMutation(UPDATE_ANOMALY_STATUS, {
    onCompleted: () => refetch(), // Refetch data after status update
  });

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<AnomalyStatus | ''>('');

  const anomalies = data?.listAnomalies || [];

  const filteredAnomalies = useMemo(() => {
    if (!filterStatus) {
      return anomalies;
    }
    return anomalies.filter(a => a.status === filterStatus);
  }, [anomalies, filterStatus]);

  const severityData = useMemo(() => {
    const counts = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    filteredAnomalies.forEach(anomaly => {
      if (counts.hasOwnProperty(anomaly.severity)) {
        counts[anomaly.severity]++;
      }
    });
    return Object.entries(counts).map(([severity, value]) => ({ severity, value }));
  }, [filteredAnomalies]);

  const handleUpdateStatus = (newStatus: AnomalyStatus) => {
    if (selectedAnomaly) {
      updateAnomalyStatus({
        variables: {
          anomalyId: selectedAnomaly.id,
          status: newStatus,
          resolutionNotes: newStatus !== AnomalyStatus.Dismissed ? resolutionNotes : '', // Only save notes if not dismissed
        },
      });
      setSelectedAnomaly(null);
      setResolutionNotes('');
    }
  };

  const getSeverityColor = (severity: AnomalySeverity) => {
    switch (severity) {
      case AnomalySeverity.Low: return 'bg-green-500';
      case AnomalySeverity.Medium: return 'bg-yellow-500';
      case AnomalySeverity.High: return 'bg-orange-500';
      case AnomalySeverity.Critical: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderSeverityIcon = (severity: AnomalySeverity) => {
    switch (severity) {
      case AnomalySeverity.Low: return <AiOutlineCheckCircle className="text-green-400" />;
      case AnomalySeverity.Medium: return <AiOutlineWarning className="text-yellow-400" />;
      case AnomalySeverity.High: return <TbAlertTriangleFilled className="text-orange-400 animate-pulse" />;
      case AnomalySeverity.Critical: return <TbAlertTriangleFilled className="text-red-400 animate-pulse text-xl" />;
      default: return null;
    }
  };

  if (loading && !data) return <div className="flex justify-center items-center h-full">Loading AI Risks...</div>;
  if (error) return <div className="text-red-500">Error loading AI Risks: {error.message}</div>;

  return (
    <FeatureGuard view={View.AIRiskRegistry}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-100">AI Risk Registry</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 shadow-md flex items-center space-x-4">
            <div>
              <div className="text-sm font-medium text-gray-400">Total Risks</div>
              <div className="text-3xl font-bold text-gray-100">{anomalies.length}</div>
            </div>
          </div>
          {severityData.map(({ severity, value }) => (
            <div key={severity} className="bg-gray-900 border border-gray-700 rounded-lg p-5 shadow-md flex items-center space-x-4 cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => setFilterStatus(severity as AnomalyStatus)}>
              <div>
                <div className="text-sm font-medium text-gray-400 capitalize">{severity}</div>
                <div className={`text-3xl font-bold ${getSeverityColor(severity as AnomalySeverity)} rounded-full p-2`}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-300">Filter by Status:</label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AnomalyStatus)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5"
            >
              <option value="">All</option>
              <option value={AnomalyStatus.New}>New</option>
              <option value={AnomalyStatus.UnderReview}>Under Review</option>
              <option value={AnomalyStatus.Dismissed}>Dismissed</option>
              <option value={AnomalyStatus.Resolved}>Resolved</option>
            </select>
            <button onClick={() => { setFilterStatus(''); setSelectedAnomaly(null); }} className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Clear Filters</button>
          </div>
          <button onClick={() => refetch()} className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1">
            <AiOutlineEye className="h-5 w-5" />
            <span>Refresh Data</span>
          </button>
        </div>

        <div className="overflow-x-auto bg-gray-900 border border-gray-700 rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Severity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Entity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {filteredAnomalies.length > 0 ? filteredAnomalies.map((anomaly) => (
                <tr key={anomaly.id} className={`${selectedAnomaly?.id === anomaly.id ? 'bg-gray-800/50' : ''} hover:bg-gray-800/30 transition-colors cursor-pointer`} onClick={() => setSelectedAnomaly(anomaly)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-2">
                    {renderSeverityIcon(anomaly.severity)}
                    <span className="capitalize">{anomaly.severity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 max-w-xs truncate" title={anomaly.description}>
                    {anomaly.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 max-w-xs truncate" title={anomaly.details}>
                    {anomaly.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      anomaly.status === AnomalyStatus.New ? 'bg-blue-100 text-blue-800' :
                      anomaly.status === AnomalyStatus.UnderReview ? 'bg-yellow-100 text-yellow-800' :
                      anomaly.status === AnomalyStatus.Dismissed ? 'bg-gray-100 text-gray-800' :
                      anomaly.status === AnomalyStatus.Resolved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {anomaly.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {anomaly.entityType}: {anomaly.entityId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(anomaly.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {anomaly.status === AnomalyStatus.New && (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedAnomaly(anomaly); }} className="text-blue-400 hover:text-blue-300 transition-colors">Review</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No risks found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal for Reviewing Anomaly */}
        {selectedAnomaly && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-3xl w-full shadow-xl">
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h2 className="text-2xl font-semibold text-gray-100">Review Risk: <span className={`font-bold capitalize ${getSeverityColor(selectedAnomaly.severity)}`}>{selectedAnomaly.severity}</span></h2>
                <button onClick={() => { setSelectedAnomaly(null); setResolutionNotes(''); }} className="text-gray-400 hover:text-gray-200 transition-colors text-2xl">&times;</button>
              </div>
              <div className="mb-6">
                <p className="text-gray-300 font-medium mb-2">Description:</p>
                <p className="text-gray-400">{selectedAnomaly.description}</p>
              </div>
              <div className="mb-6">
                <p className="text-gray-300 font-medium mb-2">Details:</p>
                <p className="text-gray-400 break-words">{selectedAnomaly.details}</p>
              </div>
              <div className="mb-6">
                <p className="text-gray-300 font-medium mb-2">Entity:</p>
                <p className="text-gray-400">{selectedAnomaly.entityType}: {selectedAnomaly.entityId}</p>
              </div>
              <div className="mb-6">
                <p className="text-gray-300 font-medium mb-2">Timestamp:</p>
                <p className="text-gray-400">{new Date(selectedAnomaly.timestamp).toLocaleString()}</p>
              </div>
              {selectedAnomaly.status === AnomalyStatus.New && (
                <div className="mb-6">
                  <label htmlFor="resolutionNotes" className="block text-sm font-medium text-gray-300 mb-2">Resolution Notes (Optional):</label>
                  <textarea
                    id="resolutionNotes"
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="Explain your decision (e.g., 'False positive, user action was expected')..."
                  ></textarea>
                </div>
              )}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleUpdateStatus(AnomalyStatus.Dismissed)}
                  className="px-6 py-3 bg-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Dismiss
                </button>
                {selectedAnomaly.status === AnomalyStatus.New && (
                  <button
                    onClick={() => handleUpdateStatus(AnomalyStatus.UnderReview)}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Review
                  </button>
                )}
                {(selectedAnomaly.status === AnomalyStatus.New || selectedAnomaly.status === AnomalyStatus.UnderReview) && (
                  <button
                    onClick={() => handleUpdateStatus(AnomalyStatus.Resolved)}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
};

export default AIRiskRegistryView;
```