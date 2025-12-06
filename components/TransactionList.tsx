
import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  [key: string]: any;
}

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionSelect?: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onTransactionSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [dataSource, setDataSource] = useState<Transaction[]>(transactions);

  useEffect(() => {
    setDataSource(transactions);
  }, [transactions]);

  const handleSearch = (selectedKeys: string[], confirm: (param?: boolean) => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: string): any => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value: any, record: Transaction) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toString().toLowerCase())
        : '',
    onFilterDropdownVisibleChange: (visible: boolean) => {
      if (visible) {
        // setTimeout(() => searchInput.select(), 100); // Removed searchInput ref
      }
    },
    render: (text: any) =>
    searchedColumn === dataIndex ? (
      <span>
        {text.split(new RegExp(`(?<=(.))(${searchText})`, 'i')).map(
          (elem, index, array) => {
            const length = array.length;
            return index > 0 ? (
              <React.Fragment key={`${text}-${index}`}>
                {index === 1 && <span>{searchText}</span>}
                {elem}
              </React.Fragment>
            ) : (
              elem
            )
          })}
      </span>
    ) : (
      text
    ),
  });

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      ...getColumnSearchProps('date'),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ...getColumnSearchProps('description'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      ...getColumnSearchProps('category'),
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Transaction[]) => {
      if (onTransactionSelect && selectedRows.length > 0) {
        onTransactionSelect(selectedRows[0]); // Assuming single selection
      }
    },
    type: 'radio', // Ensures only one row can be selected
  };


  return (
    <Table
      rowSelection={rowSelection}
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
    />
  );
};

export default TransactionList;