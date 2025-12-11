import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Tag,
  Typography,
  Space,
  notification,
  Divider,
} from 'antd';
import {
  DatabaseOutlined,
  TableOutlined,
  SearchOutlined,
  StopOutlined,
  PlayCircleOutlined,
  CodeOutlined,
} from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

// Mock external service interface for demonstration purposes
const mockDbService = {
  getConnections: async () => {
    return [
      { id: 'local_finance_db', name: 'Local Financial DB', status: 'connected' },
      { id: 'remote_analytics', name: 'Remote Analytics', status: 'disconnected' },
    ];
  },
  getSchemas: async (connectionId: string) => {
    if (connectionId === 'local_finance_db') {
      return ['public', 'finance_data', 'user_management'];
    }
    return [];
  },
  getTables: async (connectionId: string, schemaName: string) => {
    if (connectionId === 'local_finance_db' && schemaName === 'finance_data') {
      return ['transactions', 'accounts', 'budgets'];
    }
    if (connectionId === 'local_finance_db' && schemaName === 'user_management') {
        return ['users', 'roles'];
      }
    return [];
  },
  executeSql: async (connectionId: string, sql: string) => {
    if (connectionId === 'local_finance_db') {
      if (sql.trim().toLowerCase().startsWith('select')) {
        // Mock data for a successful SELECT query
        const match = sql.match(/from\s+(\w+)/i);
        const tableName = match ? match[1] : 'result';
        const mockData = {
          transactions: [
            { id: 1, date: '2023-10-01', amount: 150.75, description: 'Groceries' },
            { id: 2, date: '2023-10-02', amount: 45.00, description: 'Dinner' },
          ],
          accounts: [
            { id: 101, name: 'Checking', balance: 1500.20 },
            { id: 102, name: 'Savings', balance: 5000.00 },
          ],
          budgets: [
            { id: 5, category: 'Food', limit: 500.00 },
          ],
          users: [
              {id: 1, username: 'admin', email: 'admin@example.com'},
              {id: 2, username: 'guest', email: 'guest@example.com'},
          ],
          roles: [
            {id: 1, name: 'admin'},
            {id: 2, name: 'user'},
        ],
        }[tableName] || [
          { id: 0, message: 'No results found or table does not exist in mock data.' }
        ];

        // Mock column names based on the first row
        const columns = Object.keys(mockData[0] || {}).map(key => ({ title: key, dataIndex: key, key: key }));

        return { success: true, data: mockData, columns: columns.length > 0 ? columns : [{ title: 'Result', dataIndex: 'message', key: 'message' }] };
      } else if (sql.trim().toLowerCase().startsWith('show tables')) {
        // Mock for SHOW TABLES-like command (if needed separately)
        return { success: true, data: [{ table_name: 'transactions' }, { table_name: 'accounts' }], columns: [{ title: 'Table Name', dataIndex: 'table_name', key: 'table_name' }] };
      } else if (sql.trim().toLowerCase().startsWith('select count(*) from')) {
          // Mock for count
          return { success: true, data: [{ count: 2 }], columns: [{ title: 'count', dataIndex: 'count', key: 'count' }] };
      } else {
        // Mock for DDL/DML success
        return { success: true, data: [{ message: `Command executed successfully: ${sql.substring(0, 30)}...` }], columns: [{ title: 'Status', dataIndex: 'message', key: 'message' }] };
      }
    }
    return { success: false, error: 'Mock execution failed for connection: ' + connectionId };
  },
};

interface Connection {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
}

interface DatabaseNavigatorState {
  connections: Connection[];
  selectedConnectionId: string | null;
  schemas: string[];
  selectedSchema: string | null;
  tables: string[];
  sqlQuery: string;
  queryResult: {
    data: any[];
    columns: { title: string; dataIndex: string; key: string }[];
  };
  loading: boolean;
  isExplorerVisible: boolean;
}

const DatabaseNavigator: React.FC = () => {
  const [state, setState] = useState<DatabaseNavigatorState>({
    connections: [],
    selectedConnectionId: null,
    schemas: [],
    selectedSchema: null,
    tables: [],
    sqlQuery: '',
    queryResult: { data: [], columns: [] },
    loading: true,
    isExplorerVisible: true,
  });

  useEffect(() => {
    // Load connections on mount
    const loadConnections = async () => {
      const connections = await mockDbService.getConnections();
      setState(s => ({ ...s, connections, loading: false }));
      if (connections.length > 0) {
        handleConnectionSelect(connections[0].id);
      }
    };
    loadConnections();
  }, []);

  const handleConnectionSelect = useCallback(async (connId: string) => {
    setState(s => ({ ...s, selectedConnectionId: connId, schemas: [], selectedSchema: null, tables: [], queryResult: { data: [], columns: [] } }));
    const schemas = await mockDbService.getSchemas(connId);
    setState(s => ({ ...s, schemas }));
    if (schemas.length > 0) {
      handleSchemaSelect(connId, schemas[0]);
    }
  }, []);

  const handleSchemaSelect = useCallback(async (connId: string, schemaName: string) => {
    setState(s => ({ ...s, selectedSchema: schemaName, tables: [], queryResult: { data: [], columns: [] } }));
    const tables = await mockDbService.getTables(connId, schemaName);
    setState(s => ({ ...s, tables }));
  }, []);

  const handleTableSelect = useCallback((tableName: string) => {
    const { selectedConnectionId, selectedSchema } = state;
    if (selectedConnectionId && selectedSchema) {
      const initialQuery = `SELECT * FROM ${selectedSchema}.${tableName} LIMIT 10;`;
      setState(s => ({ ...s, sqlQuery: initialQuery }));
    }
  }, [state]);

  const runQuery = useCallback(async () => {
    const { selectedConnectionId, sqlQuery } = state;
    if (!selectedConnectionId || !sqlQuery.trim()) {
      notification.warning({ message: 'Please select a connection and enter a query.' });
      return;
    }

    setState(s => ({ ...s, loading: true, queryResult: { data: [], columns: [] } }));

    try {
      const result = await mockDbService.executeSql(selectedConnectionId, sqlQuery);
      if (result.success) {
        setState(s => ({ ...s, queryResult: { data: result.data, columns: result.columns }, loading: false }));
        notification.success({ message: 'Query executed successfully' });
      } else {
        setState(s => ({ ...s, queryResult: { data: [{ message: result.error || 'Unknown execution error' }], columns: [{ title: 'Error', dataIndex: 'message', key: 'message' }] }, loading: false }));
        notification.error({ message: 'Query Error', description: result.error || 'Check console output' });
      }
    } catch (error) {
      console.error("SQL Execution Error:", error);
      setState(s => ({ ...s, queryResult: { data: [{ message: `Exception during query execution: ${error instanceof Error ? error.message : String(error)}` }], columns: [{ title: 'Error', dataIndex: 'message', key: 'message' }] }, loading: false }));
      notification.error({ message: 'Execution Exception', description: 'An unexpected error occurred during query execution.' });
    }
  }, [state]);

  const renderConnectionStatus = (status: Connection['status']) => {
    const color = status === 'connected' ? 'green' : 'red';
    const text = status === 'connected' ? 'Connected' : 'Disconnected';
    return <Tag color={color}>{text}</Tag>;
  };

  const renderExplorer = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={5} icon={<DatabaseOutlined />}>
        Connections
      </Title>
      <Select
        style={{ width: '100%' }}
        value={state.selectedConnectionId || undefined}
        placeholder="Select a database connection"
        onChange={handleConnectionSelect}
        loading={state.loading}
      >
        {state.connections.map(conn => (
          <Option key={conn.id} value={conn.id} disabled={conn.status === 'disconnected'}>
            {conn.name} {renderConnectionStatus(conn.status)}
          </Option>
        ))}
      </Select>

      {state.selectedConnectionId && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Divider orientation="left" plain>
            <Title level={5} icon={<CodeOutlined />}>
              Schemas & Tables
            </Title>
          </Divider>
          <Select
            style={{ width: '100%' }}
            value={state.selectedSchema || undefined}
            placeholder="Select a schema"
            onChange={(schema: string) => handleSchemaSelect(state.selectedConnectionId!, schema)}
            disabled={state.loading || !state.selectedConnectionId}
          >
            {state.schemas.map(schema => (
              <Option key={schema} value={schema}>
                {schema}
              </Option>
            ))}
          </Select>

          {state.selectedSchema && (
            <Table
              size="small"
              pagination={false}
              dataSource={state.tables.map((t, index) => ({ key: index, name: t }))}
              columns={[{
                title: <TableOutlined />,
                dataIndex: 'name',
                key: 'name',
                onCell: (record) => ({
                    onClick: () => handleTableSelect(record.name),
                    style: { cursor: 'pointer' }
                }),
                render: (text: string) => <Text strong>{text}</Text>
              }]}
              headerTitle={`Tables in ${state.selectedSchema}`}
              rowKey="key"
            />
          )}
        </Space>
      )}
    </Space>
  );

  const renderQueryResult = () => {
    const { data, columns } = state.queryResult;

    return (
      <div style={{ flex: 1, minHeight: 200, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Title level={5} icon={<SearchOutlined />}>
          Query Result ({data.length} rows)
        </Title>
        <Table
          dataSource={data}
          columns={columns}
          loading={state.loading}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 'max-content', y: 'calc(100vh - 450px)' }}
          size="small"
        />
      </div>
    );
  };

  return (
    <div style={{ padding: 16, background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={3} icon={<DatabaseOutlined />}>
        Database Query Tool
      </Title>
      <Text type="secondary">Execute SQL against configured database connections.</Text>
      <Divider />

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 180px)' }}>
        {/* Left Panel: Database Explorer */}
        <div
          style={{
            width: state.isExplorerVisible ? 300 : 50,
            minWidth: state.isExplorerVisible ? 300 : 50,
            transition: 'width 0.3s',
            background: '#fff',
            padding: 12,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Button
              type={state.isExplorerVisible ? "dashed" : "primary"}
              icon={state.isExplorerVisible ? <StopOutlined /> : <DatabaseOutlined />}
              onClick={() => setState(s => ({ ...s, isExplorerVisible: !s.isExplorerVisible }))}
              style={{ width: '100%' }}
            >
              {state.isExplorerVisible ? "Collapse Explorer" : "Expand"}
            </Button>
            {state.isExplorerVisible && renderExplorer()}
          </Space>
        </div>

        {/* Right Panel: Query Editor and Results */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Query Editor */}
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
            <Title level={5} icon={<CodeOutlined />}>
              SQL Editor
            </Title>
            <Input.TextArea
              rows={6}
              value={state.sqlQuery}
              onChange={(e) => setState(s => ({ ...s, sqlQuery: e.target.value }))}
              placeholder="Enter SQL query here (e.g., SELECT * FROM finance_data.transactions LIMIT 10);"
              style={{ marginBottom: 10 }}
            />
            <Space>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={runQuery}
                loading={state.loading}
                disabled={!state.selectedConnectionId}
              >
                Execute Query
              </Button>
              <Text type="secondary">
                Connected to: {state.selectedConnectionId ? state.connections.find(c => c.id === state.selectedConnectionId)?.name : 'None'}
              </Text>
            </Space>
          </div>

          {/* Query Results */}
          <div style={{ flex: 1, background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column' }}>
            {renderQueryResult()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseNavigator;