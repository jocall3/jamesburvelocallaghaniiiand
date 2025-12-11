import React, { useState, useEffect, useCallback } from 'react';
import {
    Button,
    Collapse,
    Select,
    Spin,
    Alert,
    Card,
    Typography,
    Table,
    Modal,
    Tag,
    Tooltip,
    Row,
    Col
} from 'antd';
import { CodeOutlined, BarChartOutlined, ClockCircleOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useDevToolsContext } from '../DevToolsContext';
import { ProfilerData, ProfileResult, ProfileCall, ProfileFlameData, ProfileFlameNode } from './types';

const { Panel } = Collapse;
const { Option } = Select;
const { Title, Text } = Typography;

// Mock API functions (Replace with actual API calls)
const fetchAvailableScripts = async (): Promise<string[]> => {
    // Simulate API call to get list of scripts
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(['ScriptA.js', 'ScriptB.js', 'FastTradeScript.py', 'SlowAnalysis.ts']);
        }, 500);
    });
};

const startProfiling = async (scriptName: string): Promise<ProfilerData> => {
    // Simulate starting profiling and receiving data
    console.log(`Starting profiling for: ${scriptName}`);
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockData: ProfilerData = {
                timestamp: Date.now(),
                durationMs: Math.floor(Math.random() * 5000) + 1000,
                scriptName: scriptName,
                results: generateMockProfileResults(scriptName),
            };
            resolve(mockData);
        }, 2000);
    });
};

const generateMockProfileResults = (scriptName: string): ProfileResult[] => {
    const results: ProfileResult[] = [];
    const numFunctions = Math.floor(Math.random() * 10) + 5;

    for (let i = 0; i < numFunctions; i++) {
        const funcName = `fn_${scriptName.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`;
        const selfTime = Math.floor(Math.random() * 500);
        const totalTime = selfTime + Math.floor(Math.random() * 1500);
        const calls = Math.floor(Math.random() * 50) + 1;

        const mockCalls: ProfileCall[] = [];
        const callTargets = ['<external>', 'fn_core_util_1', 'fn_db_access_2', funcName]; // Simulating some dependencies

        for (let j = 0; j < calls; j++) {
            mockCalls.push({
                caller: callTargets[Math.floor(Math.random() * callTargets.length)],
                durationMs: Math.floor(Math.random() * (totalTime / calls)),
                selfTime: Math.floor(Math.random() * (selfTime / calls)),
            });
        }

        results.push({
            functionName: funcName,
            selfTimeMs: selfTime,
            totalTimeMs: totalTime,
            calls: mockCalls,
            flameData: generateMockFlameData(funcName, selfTime + totalTime),
        });
    }
    return results;
};

const generateMockFlameData = (funcName: string, totalDuration: number): ProfileFlameData => {
    const nodes: ProfileFlameNode[] = [];
    let currentTime = 0;

    for (let i = 0; i < 5; i++) {
        const duration = Math.floor(Math.random() * (totalDuration / 5));
        nodes.push({
            name: `sub_op_${funcName}_${i}`,
            selfTimeMs: duration * 0.4,
            totalTimeMs: duration,
            start: currentTime,
            end: currentTime + duration,
        });
        currentTime += duration;
    }

    return {
        functionName: funcName,
        totalDurationMs: totalDuration,
        nodes: nodes,
    };
};

// Component for Flame Chart Visualization (Simplified Mock)
const FlameChart: React.FC<{ data: ProfileFlameData }> = ({ data }) => {
    const { nodes, totalDurationMs } = data;
    const chartHeight = 100;

    if (!nodes || nodes.length === 0) {
        return <Alert message="No detailed flame data available for this function." type="warning" />;
    }

    const totalWidth = 600; // Fixed width for visualization

    return (
        <div style={{ padding: '10px 0' }}>
            <Title level={5} style={{ marginBottom: 5 }}>Flame Chart (Mock)</Title>
            <div style={{ border: '1px solid #ddd', padding: 10, borderRadius: 4, height: chartHeight + 20, position: 'relative' }}>
                <Text type="secondary" style={{ position: 'absolute', top: 0, left: 10 }}>0ms</Text>
                <Text type="secondary" style={{ position: 'absolute', top: 0, right: 10 }}>{totalDurationMs.toFixed(1)}ms</Text>
                <div style={{ height: chartHeight, position: 'relative', marginTop: 15 }}>
                    {nodes.map((node, index) => {
                        const widthRatio = node.totalTimeMs / totalDurationMs;
                        const width = widthRatio * totalWidth;
                        const left = (node.start / totalDurationMs) * totalWidth;

                        return (
                            <Tooltip key={index} title={
                                <div>
                                    <strong>{node.name}</strong>
                                    <br />
                                    Total Time: {node.totalTimeMs.toFixed(2)}ms
                                    <br />
                                    Self Time: {node.selfTimeMs.toFixed(2)}ms
                                </div>
                            }>
                                <div
                                    style={{
                                        position: 'absolute',
                                        height: '80%',
                                        top: '10%',
                                        left: `${left}px`,
                                        width: `${width}px`,
                                        backgroundColor: `hsl(${index * 60 % 360}, 70%, 60%)`,
                                        borderRadius: 3,
                                        border: '1px solid rgba(0,0,0,0.2)',
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        fontSize: 10,
                                        textAlign: 'center',
                                        lineHeight: `${chartHeight - 20}px`,
                                        color: '#fff'
                                    }}
                                >
                                    {width > 30 && <Text strong ellipsis>{node.name.split('_').pop()}</Text>}
                                </div>
                            </Tooltip>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Component for Detailed Function Results
const FunctionDetail: React.FC<{ result: ProfileResult }> = ({ result }) => {
    const [visible, setVisible] = useState(false);
    const { functionName, selfTimeMs, totalTimeMs, calls, flameData } = result;

    const callColumns = [
        {
            title: 'Caller',
            dataIndex: 'caller',
            key: 'caller',
            width: '50%',
            render: (text: string) => <Text code>{text}</Text>,
        },
        {
            title: 'Total Time (ms)',
            dataIndex: 'durationMs',
            key: 'durationMs',
            width: '25%',
            sorter: (a: ProfileCall, b: ProfileCall) => a.durationMs - b.durationMs,
            render: (text: number) => <Text type={text > 100 ? 'danger' : 'success'}>{text.toFixed(2)}</Text>,
        },
        {
            title: 'Self Time (ms)',
            dataIndex: 'selfTime',
            key: 'selfTime',
            width: '25%',
            sorter: (a: ProfileCall, b: ProfileCall) => a.selfTime - b.selfTime,
            render: (text: number) => text.toFixed(2),
        },
    ];

    return (
        <Panel header={<>
            <CodeOutlined style={{ marginRight: 8 }} />
            <Text strong>{functionName}</Text>
            <Tag color="blue" style={{ marginLeft: 10 }}>Total: {totalTimeMs.toFixed(1)}ms</Tag>
            <Tag color="red">{selfTimeMs.toFixed(1)}ms Self</Tag>
        </>}>
            <Row gutter={16}>
                <Col span={24}>
                    <FlameChart data={flameData} />
                </Col>
                <Col span={24}>
                    <Title level={5} style={{ marginTop: 10 }}><BarChartOutlined style={{ marginRight: 8 }} /> Call Hierarchy</Title>
                    <Table
                        dataSource={calls}
                        columns={callColumns}
                        pagination={false}
                        size="small"
                        rowKey={(record, index) => `${functionName}-${index}`}
                    />
                </Col>
            </Row>
        </Panel>
    );
};

const Profiler: React.FC = () => {
    const { pluginApi } = useDevToolsContext();
    const [scriptList, setScriptList] = useState<string[]>([]);
    const [selectedScript, setSelectedScript] = useState<string | undefined>(undefined);
    const [profilingData, setProfilingData] = useState<ProfilerData | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [activeKey, setActiveKey] = useState<string | string[]>([]);

    const loadScripts = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const scripts = await fetchAvailableScripts();
            setScriptList(scripts);
            if (scripts.length > 0) {
                setSelectedScript(scripts[0]);
            }
        } catch (err) {
            setError(`Failed to load scripts: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadScripts();
    }, [loadScripts]);

    const handleProfile = async () => {
        if (!selectedScript) return;

        setLoading(true);
        setError(undefined);
        setProfilingData(undefined);
        setActiveKey([]);

        try {
            const data = await startProfiling(selectedScript);
            setProfilingData(data);
        } catch (err) {
            setError(`Profiling failed for ${selectedScript}: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    const handleScriptChange = (value: string) => {
        setSelectedScript(value);
    };

    const getProfileSummary = (data: ProfilerData) => {
        if (!data || !data.results || data.results.length === 0) return null;

        const totalExecutionTime = data.durationMs;
        const totalSelfTime = data.results.reduce((sum, r) => sum + r.selfTimeMs, 0);
        const averageTotalTime = data.results.reduce((sum, r) => sum + r.totalTimeMs, 0) / data.results.length;
        const mostExpensive = data.results.sort((a, b) => b.totalTimeMs - a.totalTimeMs)[0];

        return (
            <Card title={<><BarChartOutlined /> Profile Summary</>} bordered={false}>
                <Row gutter={16}>
                    <Col span={8}><Text strong>Total Execution Time:</Text> <Text code>{totalExecutionTime.toFixed(2)} ms</Text></Col>
                    <Col span={8}><Text strong>Total Profiling Time (Aggregated):</Text> <Text code>{totalSelfTime.toFixed(2)} ms</Text></Col>
                    <Col span={8}><Text strong>Avg Function Total Time:</Text> <Text code>{averageTotalTime.toFixed(2)} ms</Text></Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 10 }}>
                    <Col span={24}>
                        <Alert
                            icon={<ClockCircleOutlined />}
                            message={<>
                                <strong>Most Expensive Function:</strong> <Text code>{mostExpensive.functionName}</Text>
                                (Total Time: {mostExpensive.totalTimeMs.toFixed(1)}ms, Self Time: {mostExpensive.selfTimeMs.toFixed(1)}ms)
                            </>}
                            type="info"
                        />
                    </Col>
                </Row>
            </Card>
        );
    };

    const renderResults = (data: ProfilerData) => {
        const columns = [
            {
                title: 'Function Name',
                dataIndex: 'functionName',
                key: 'functionName',
                width: '40%',
                render: (text: string) => <Text code>{text}</Text>,
            },
            {
                title: 'Total Time (ms)',
                dataIndex: 'totalTimeMs',
                key: 'totalTimeMs',
                sorter: (a: ProfileResult, b: ProfileResult) => a.totalTimeMs - b.totalTimeMs,
                render: (text: number) => <Tag color={text > 1500 ? 'red' : text > 500 ? 'orange' : 'green'}>{text.toFixed(1)}</Tag>,
            },
            {
                title: 'Self Time (ms)',
                dataIndex: 'selfTimeMs',
                key: 'selfTimeMs',
                sorter: (a: ProfileResult, b: ProfileResult) => a.selfTimeMs - b.selfTimeMs,
                render: (text: number) => <Text>{text.toFixed(1)}</Text>,
            },
            {
                title: 'Call Count',
                dataIndex: 'calls',
                key: 'calls',
                render: (calls: ProfileCall[]) => calls.length,
            },
        ];

        const tableData = data.results.map(r => ({
            ...r,
            key: r.functionName,
        }));

        return (
            <div style={{ marginTop: 20 }}>
                {getProfileSummary(data)}

                <Title level={3} style={{ marginTop: 30 }}><BarChartOutlined style={{ marginRight: 8 }} /> Function Breakdown</Title>
                <Alert
                    icon={<InfoCircleOutlined />}
                    message="Click on any function panel below to see detailed call stacks and flame chart visualization."
                    type="info"
                    style={{ marginBottom: 16 }}
                />
                <Table
                    dataSource={tableData}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                    expandable={{
                        expandedRowRender: (record) => <FunctionDetail result={record} />,
                        defaultExpandedRowKeys: activeKey.length > 0 ? (Array.isArray(activeKey) ? activeKey : [activeKey]) : [],
                        onExpand: (expanded, record) => {
                            const key = record.functionName;
                            setActiveKey(expanded ? key : activeKey.filter(k => k !== key));
                        }
                    }}
                    rowKey="functionName"
                />
            </div>
        );
    };

    return (
        <div style={{ padding: 20 }}>
            <Title level={2}><ClockCircleOutlined style={{ marginRight: 10 }} /> Trading Script Profiler</Title>
            <Text type="secondary">Analyze execution time and pinpoint bottlenecks in your trading scripts.</Text>

            <Card style={{ marginTop: 20 }} loading={loading}>
                <Row gutter={16} align="middle">
                    <Col span={10}>
                        <Title level={4} style={{ margin: 0 }}>Select Script to Profile:</Title>
                    </Col>
                    <Col span={8}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Choose a script"
                            value={selectedScript}
                            onChange={handleScriptChange}
                            disabled={loading}
                        >
                            {scriptList.map(script => (
                                <Option key={script} value={script}>{script}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col span={6} style={{ textAlign: 'right' }}>
                        <Button
                            type="primary"
                            onClick={handleProfile}
                            disabled={!selectedScript || loading}
                            icon={<CodeOutlined />}
                        >
                            {loading ? 'Profiling...' : 'Start Profiling'}
                        </Button>
                    </Col>
                </Row>
                {error && (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginTop: 16 }}
                    />
                )}
            </Card>

            {loading && (
                <div style={{ textAlign: 'center', padding: 50 }}>
                    <Spin size="large" tip={`Analyzing ${selectedScript || 'script'} performance...`} />
                    <Alert
                        icon={<WarningOutlined />}
                        message="Profiling in progress"
                        description="Please wait while the trading environment executes and captures detailed timing data. This may take a moment."
                        type="info"
                        style={{ marginTop: 20, maxWidth: 600, margin: '20px auto 0' }}
                    />
                </div>
            )}

            {profilingData && !loading && renderResults(profilingData)}

            {!loading && !profilingData && scriptList.length > 0 && (
                <Alert
                    message="Ready to Profile"
                    description={`Select a script from the dropdown and click 'Start Profiling' to begin execution time analysis.`}
                    type="info"
                    style={{ marginTop: 20 }}
                />
            )}

            {!loading && scriptList.length === 0 && !error && (
                <Alert
                    message="No Scripts Found"
                    description="No accessible trading scripts found to profile. Ensure your project is correctly loaded."
                    type="warning"
                    style={{ marginTop: 20 }}
                />
            )}
        </div>
    );
};

export default Profiler;