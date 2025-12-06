
import React, { useState, useMemo } from 'react';
import { Table, Button, Typography, Input, Modal } from 'antd';
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title } = Typography;

// Mock Types
type ReportType = 'voa' | 'voi' | 'voiePayroll' | 'voePayroll' | 'paystatement' | 'transactions';
type ReportStatus = 'success' | 'inProgress' | 'failure';

interface Report {
    id: string;
    type: ReportType;
    status: ReportStatus;
    createdDate: string;
    consumerName: string;
}

// Mock Data
const MOCK_REPORTS: Report[] = [
    { id: 'rep_001', type: 'voa', status: 'success', createdDate: '2023-10-25', consumerName: 'John Doe' },
    { id: 'rep_002', type: 'voi', status: 'inProgress', createdDate: '2023-10-26', consumerName: 'Jane Smith' },
    { id: 'rep_003', type: 'transactions', status: 'failure', createdDate: '2023-10-24', consumerName: 'Bob Wilson' },
    { id: 'rep_004', type: 'voiePayroll', status: 'success', createdDate: '2023-10-27', consumerName: 'Alice Johnson' },
];

interface VerificationReportsViewProps {
  customerId: string;
  consumerId?: string;
}

const VerificationReportsView: React.FC<VerificationReportsViewProps> = ({ customerId }) => {
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [reportStatus, setReportStatus] = useState<ReportStatus | ''>('');
  const [reportId, setReportId] = useState<string | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);

  const handleViewReport = (id: string, type: ReportType) => {
    setReportId(id);
    setReportType(type);
    setModalVisible(true);
  };

  const handleDownloadReport = (id: string, type: ReportType) => {
    alert(`Downloading report ${id} (${type})...`);
  };

  const handleRefresh = () => {
      // Simulate refresh
      setReports([...MOCK_REPORTS]); 
  };

  const filteredReports = useMemo(() => {
    return reports.filter(
      (report) =>
        (!reportType || report.type === reportType) &&
        (!reportStatus || report.status === reportStatus)
    );
  }, [reports, reportType, reportStatus]);

  const columns = [
      { title: 'Report ID', dataIndex: 'id', key: 'id' },
      { title: 'Type', dataIndex: 'type', key: 'type', render: (text: string) => text.toUpperCase() },
      { 
          title: 'Status', 
          dataIndex: 'status', 
          key: 'status',
          render: (status: string) => (
              <span className={`px-2 py-1 rounded text-xs font-bold ${status === 'success' ? 'bg-green-100 text-green-800' : status === 'failure' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                  {status.toUpperCase()}
              </span>
          )
      },
      { title: 'Date', dataIndex: 'createdDate', key: 'createdDate' },
      { title: 'Consumer', dataIndex: 'consumerName', key: 'consumerName' },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: Report) => (
          <div className="flex space-x-2">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewReport(record.id, record.type)}
              disabled={record.status !== 'success'}
            />
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadReport(record.id, record.type)}
              disabled={record.status !== 'success'}
            />
          </div>
        ),
      },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Title level={3}>Verification Reports</Title>
      
      <div className="flex gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
          <select
            className="p-2 border rounded bg-white"
            onChange={(e) => setReportType(e.target.value as ReportType | '')}
            value={reportType}
          >
            <option value="">All Report Types</option>
            <option value="voa">VOA</option>
            <option value="voi">VOI</option>
            <option value="voiePayroll">VOIE - Payroll</option>
            <option value="voePayroll">VOE - Payroll</option>
            <option value="paystatement">Pay Statement</option>
            <option value="transactions">Transactions</option>
          </select>

          <select
            className="p-2 border rounded bg-white"
            onChange={(e) => setReportStatus(e.target.value as ReportStatus | '')}
            value={reportStatus}
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="inProgress">In Progress</option>
            <option value="failure">Failure</option>
          </select>

          <Button type="primary" onClick={handleRefresh}>
             Refresh Data
          </Button>
      </div>

      <Table
        dataSource={filteredReports}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        className="bg-white rounded-lg shadow-sm"
      />

      <Modal
        title={`Report Details: ${reportId}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <div className="p-6 bg-gray-100 rounded border border-gray-300 h-96 flex items-center justify-center text-gray-500">
            [PDF Viewer Placeholder for Report {reportId}]
        </div>
      </Modal>
    </div>
  );
};

export default VerificationReportsView;
