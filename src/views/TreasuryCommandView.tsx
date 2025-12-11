import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader,
  Card,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
  Table,
  Descriptions,
  Button,
  Modal,
  Tabs,
  Tag,
  Tooltip,
  Select,
  DatePicker,
} from 'antd';
import { DollarCircleOutlined, BankTwoTone, CalendarOutlined, WalletOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import moment from 'moment';

// Mock Data Structure (replace with actual API service calls)
interface LiquidityData {
  totalCash: number;
  availableFunds: number;
  onHoldFunds: number;
  pendingInflows: number;
  pendingOutflows: number;
  lastUpdated: string;
}

interface AccountSummary {
  accountId: string;
  bankName: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  status: 'ACTIVE' | 'DORMANT' | 'CLOSED';
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: 'INFLOW' | 'OUTFLOW';
  accountId: string;
}

interface TreasuryMetrics {
  cashConversionCycle: number; // Days
  workingCapital: number;
  shortTermInvestmentValue: number;
}

const mockLiquidityData: LiquidityData = {
  totalCash: 154320000.50,
  availableFunds: 138120000.50,
  onHoldFunds: 16200000.00,
  pendingInflows: 45000000.00,
  pendingOutflows: 32000000.00,
  lastUpdated: new Date().toISOString(),
};

const mockAccountSummary: AccountSummary[] = [
  { accountId: 'A0012345', bankName: 'Global Trust Bank', currency: 'USD', currentBalance: 85000000.00, availableBalance: 80000000.00, status: 'ACTIVE' },
  { accountId: 'A0067890', bankName: 'Euro Finance Corp', currency: 'EUR', currentBalance: 40000000.00, availableBalance: 3500000.00, status: 'ACTIVE' },
  { accountId: 'A0011223', bankName: 'Asia Pacific Bank', currency: 'USD', currentBalance: 29320000.50, availableBalance: 23120000.50, status: 'ACTIVE' },
  { accountId: 'A0099887', bankName: 'Local Bank Holding', currency: 'USD', currentBalance: 500000.00, availableBalance: 0.00, status: 'DORMANT' },
];

const mockTransactions: Transaction[] = [
  { id: 'T001', date: '2024-10-10', description: 'Vendor Payment - XYZ Corp', amount: -1200000.00, currency: 'USD', type: 'OUTFLOW', accountId: 'A0012345' },
  { id: 'T002', date: '2024-10-10', description: 'Client Payment Received', amount: 850000.00, currency: 'USD', type: 'INFLOW', accountId: 'A0012345' },
  { id: 'T003', date: '2024-10-09', description: 'Intercompany Transfer', amount: -5000000.00, currency: 'EUR', type: 'OUTFLOW', accountId: 'A0067890' },
  { id: 'T004', date: '2024-10-09', description: 'Sales Revenue Deposit', amount: 2500000.00, currency: 'USD', type: 'INFLOW', accountId: 'A0011223' },
];

const mockMetrics: TreasuryMetrics = {
    cashConversionCycle: 45,
    workingCapital: 98000000.00,
    shortTermInvestmentValue: 15000000.00,
}

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const TreasuryCommandView: React.FC = () => {
  const [liquidity, setLiquidity] = useState<LiquidityData | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<TreasuryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterDate, setFilterDate] = useState([moment().subtract(7, 'days'), moment()]);

  useEffect(() => {
    // Simulate data fetching
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setLiquidity(mockLiquidityData);
        setAccounts(mockAccountSummary);
        setMetrics(mockMetrics);
        // Filter transactions based on selected date range (mocked here)
        setTransactions(mockTransactions.filter(t => moment(t.date).isBetween(filterDate[0], filterDate[1], null, '[]')));
      } catch (err) {
        setError("Failed to load treasury data. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 1500);
  }, [filterDate]);

  const handleDateChange = (dates: any) => {
    if (dates) {
      setFilterDate(dates);
    }
  };

  const handleCurrencyConversion = (amount: number, fromCurrency: string, toCurrency: string) => {
    // Simplified mock conversion rate for demonstration
    const rates: { [key: string]: number } = {
        'USD_USD': 1.0,
        'EUR_USD': 1.08,
        'USD_EUR': 1/1.08,
    };
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = rates[rateKey] || 1.0;
    return amount * rate;
  };

  const totalCashInUSD = useMemo(() => {
    let total = 0;
    accounts.forEach(acc => {
        if (acc.status === 'ACTIVE') {
            total += handleCurrencyConversion(acc.availableBalance, acc.currency, 'USD');
        }
    });
    return total;
  }, [accounts]);

  // --- Components ---

  const LiquidityOverview = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Statistic
          title="Total Available Liquidity (USD Equivalent)"
          value={totalCashInUSD}
          formatter={(val) => formatCurrency(val as number, 'USD')}
          prefix={<WalletOutlined />}
          valueStyle={{ color: '#3f8600' }}
        />
      </Col>
      <Col span={12}>
        <Statistic
          title="Net Pending Cash Flow (USD Equivalent)"
          value={handleCurrencyConversion(liquidity!.pendingInflows - liquidity!.pendingOutflows, 'USD', 'USD')}
          formatter={(val) => formatCurrency(val as number, 'USD')}
          prefix={liquidity!.pendingInflows - liquidity!.pendingOutflows >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          valueStyle={{ color: liquidity!.pendingInflows - liquidity!.pendingOutflows >= 0 ? '#3f8600' : '#cf1322' }}
        />
      </Col>
      <Col span={8} style={{ marginTop: 24 }}>
        <Statistic
          title="Total Cash (Reported Currency)"
          value={liquidity!.totalCash}
          formatter={(val) => formatCurrency(val as number, 'USD')}
        />
      </Col>
      <Col span={8} style={{ marginTop: 24 }}>
        <Statistic
          title="Funds On Hold"
          value={liquidity!.onHoldFunds}
          formatter={(val) => formatCurrency(val as number, 'USD')}
          valueStyle={{ color: '#faad14' }}
        />
      </Col>
      <Col span={8} style={{ marginTop: 24 }}>
        <Statistic
          title="Last Updated"
          value={moment(liquidity!.lastUpdated).format('YYYY-MM-DD HH:mm:ss')}
          prefix={<CalendarOutlined />}
        />
      </Col>
    </Row>
  );

  const AccountTable = () => {
    const columns = useMemo(() => [
      {
        title: 'Account ID',
        dataIndex: 'accountId',
        key: 'accountId',
        render: (text: string, record: AccountSummary) => (
          <Tooltip title={`Bank: ${record.bankName}`}>
            <a>{text}</a>
          </Tooltip>
        ),
      },
      {
        title: 'Bank Name',
        dataIndex: 'bankName',
        key: 'bankName',
      },
      {
        title: 'Currency',
        dataIndex: 'currency',
        key: 'currency',
      },
      {
        title: 'Current Balance',
        dataIndex: 'currentBalance',
        key: 'currentBalance',
        align: 'right' as const,
        render: (text: number, record: AccountSummary) => formatCurrency(text, record.currency),
      },
      {
        title: 'Available Balance',
        dataIndex: 'availableBalance',
        key: 'availableBalance',
        align: 'right' as const,
        render: (text: number, record: AccountSummary) => (
          <Tooltip title={record.status === 'DORMANT' ? "Account is Dormant" : "Funds available for immediate use"}>
            {formatCurrency(text, record.currency)}
          </Tooltip>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: AccountSummary['status']) => {
          let color = status === 'ACTIVE' ? 'green' : status === 'DORMANT' ? 'gold' : 'red';
          return <Tag color={color}>{status}</Tag>;
        },
      },
    ], []);

    return (
      <Card title="Account Balances" headStyle={{ backgroundColor: '#f0f2f5' }}>
        <Table
          dataSource={accounts}
          columns={columns}
          rowKey="accountId"
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  const TransactionTable = () => {
    const columns = useMemo(() => [
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        width: 120,
        sorter: (a: Transaction, b: Transaction) => moment(b.date).diff(moment(a.date)),
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 100,
        render: (type: Transaction['type']) => (
          <Tag color={type === 'INFLOW' ? 'green' : 'red'}>{type}</Tag>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right' as const,
        render: (text: number, record: Transaction) => formatCurrency(text, record.currency),
      },
      {
        title: 'Account ID',
        dataIndex: 'accountId',
        key: 'accountId',
        width: 120,
      },
    ], []);

    return (
      <Card
        title="Recent Transactions"
        headStyle={{ backgroundColor: '#f0f2f5' }}
        extra={
          <>
            <DatePicker.RangePicker
              value={filterDate}
              onChange={handleDateChange}
              ranges={[
                { label: 'Last 7 Days', value: [moment().subtract(7, 'days'), moment()] },
                { label: 'This Month', value: [moment().startOf('month'), moment()] },
              ]}
              allowClear={false}
            />
            <Button type="link" onClick={() => setActiveTab('all_transactions')}>View All</Button>
          </>
        }
      >
        <Table
          dataSource={transactions}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Card>
    );
  };

  const TreasuryMetricsCard = () => {
    if (!metrics) return null;

    const cccColor = metrics.cashConversionCycle <= 50 ? '#3f8600' : metrics.cashConversionCycle <= 70 ? '#faad14' : '#cf1322';

    return (
      <Card title="Key Treasury Metrics" headStyle={{ backgroundColor: '#f0f2f5' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Cash Conversion Cycle (Days)"
              value={metrics.cashConversionCycle}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: cccColor }}
              suffix="Days"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Working Capital"
              value={metrics.workingCapital}
              formatter={(val) => formatCurrency(val as number, 'USD')}
              prefix={<BankTwoTone />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Short Term Investments"
              value={metrics.shortTermInvestmentValue}
              formatter={(val) => formatCurrency(val as number, 'USD')}
              prefix={<DollarCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  const DetailedTransactionsView = () => {
    const columns = [
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
      },
      {
        title: 'Account ID',
        dataIndex: 'accountId',
        key: 'accountId',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (type: Transaction['type']) => (
          <Tag color={type === 'INFLOW' ? 'green' : 'red'}>{type}</Tag>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right' as const,
        render: (text: number, record: Transaction) => formatCurrency(text, record.currency),
      },
    ];

    return (
        <Card title="All Transactions" headStyle={{ backgroundColor: '#f0f2f5' }} extra={
            <DatePicker.RangePicker
              value={filterDate}
              onChange={handleDateChange}
              allowClear={false}
            />
        }>
            <Table
                dataSource={mockTransactions} // Use full mock data for "View All" context
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />
        </Card>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '20vh' }}><Spin size="large" tip="Loading Treasury Dashboard..." /></div>;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon style={{ margin: 16 }} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <LiquidityOverview />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <TreasuryMetricsCard />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <AccountTable />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <TransactionTable />
              </Col>
            </Row>
          </>
        );
      case 'accounts':
        return <AccountTable />;
      case 'transactions':
        return <DetailedTransactionsView />;
      case 'all_transactions':
        return <DetailedTransactionsView />;
      default:
        return <LiquidityOverview />;
    }
  };

  return (
    <div className="treasury-command-view" style={{ padding: '24px' }}>
      <PageHeader
        title="Corporate Treasury Command Center"
        className="site-page-header"
        subTitle="Consolidated view of global liquidity, accounts, and key metrics"
        tags={<Tag color="blue">Production</Tag>}
        extra={[
            <Button key="3" type="default">Export Report</Button>,
        ]}
      />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        style={{ marginTop: 24 }}
        items={[
            { key: 'overview', label: 'Dashboard Overview', children: null },
            { key: 'accounts', label: 'Account Details', children: null },
            { key: 'transactions', label: 'Recent Transactions', children: null },
        ]}
      />

      <div className="treasury-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default TreasuryCommandView;