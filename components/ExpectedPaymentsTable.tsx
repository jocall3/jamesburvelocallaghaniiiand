
import React, { useState, useEffect } from 'react';
import { Table, Input, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ExpectedPayment } from '../types/ExpectedPayment';
import { listExpectedPayments } from '../api/expectedPayments';

interface Props {
  internalAccountId?: string;
}

const ExpectedPaymentsTable: React.FC<Props> = ({ internalAccountId }) => {
  const [expectedPayments, setExpectedPayments] = useState<ExpectedPayment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await listExpectedPayments({ internal_account_id: internalAccountId });
        setExpectedPayments(response);
      } catch (error) {
        console.error('Failed to fetch expected payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [internalAccountId]);

  const columns: ColumnsType<any> = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Amount', dataIndex: 'amount_upper_bound', key: 'amount', render: (val: number) => val / 100 },
    { title: 'Direction', dataIndex: 'direction', key: 'direction' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
  ];

  return (
    <Table columns={columns} dataSource={expectedPayments} loading={loading} rowKey="id" />
  );
};

export default ExpectedPaymentsTable;
