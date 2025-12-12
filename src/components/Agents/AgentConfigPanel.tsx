import React, { useState, useEffect } from 'react';
import { Slider, InputNumber, Switch, Typography, Space, Divider, Alert, Button } from 'antd';
import { Agent } from '../../types/Agent';

const { Text, Title } = Typography;

interface AgentConfigPanelProps {
    agent: Agent | null;
    onUpdateAgent: (updatedAgent: Agent) => void;
    onPanelClose: () => void;
}

const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({ agent, onUpdateAgent, onPanelClose }) => {
    const [riskTolerance, setRiskTolerance] = useState<number>(50);
    const [budget, setBudget] = useState<number>(1000);
    const [autoInvest, setAutoInvest] = useState<boolean>(false);

    useEffect(() => {
        if (agent) {
            setRiskTolerance(agent.riskTolerance || 50);
            setBudget(agent.budget || 1000);
            setAutoInvest(agent.autoInvest || false);
        }
    }, [agent]);

    const handleRiskToleranceChange = (value: number) => {
        setRiskTolerance(value);
    };

    const handleBudgetChange = (value: number | null) => {
        if (value !== null) {
            setBudget(value);
        }
    };

    const handleAutoInvestChange = (checked: boolean) => {
        setAutoInvest(checked);
    };

    const handleSave = () => {
        if (agent) {
            const updatedAgent: Agent = {
                ...agent,
                riskTolerance: riskTolerance,
                budget: budget,
                autoInvest: autoInvest,
            };
            onUpdateAgent(updatedAgent);
        }
    };

    if (!agent) {
        return (
            <Alert
                message="No Agent Selected"
                description="Please select an agent to configure."
                type="info"
                showIcon
            />
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                <Title level={3}>Configure Agent: {agent.name}</Title>

                <Divider />

                <div>
                    <Text strong>Risk Tolerance:</Text>
                    <Slider
                        defaultValue={50}
                        value={riskTolerance}
                        onChange={handleRiskToleranceChange}
                        tooltip={{
                            formatter: (value) => `${value}%`,
                        }}
                    />
                    <Text>Current Risk Tolerance: {riskTolerance}%</Text>
                </div>

                <div>
                    <Text strong>Budget:</Text>
                    <InputNumber
                        defaultValue={1000}
                        value={budget}
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                        onChange={handleBudgetChange}
                        style={{ width: '100%' }}
                    />
                    <Text>Current Budget: ${budget}</Text>
                </div>

                <div>
                    <Text strong>Auto Invest:</Text>
                    <Switch defaultChecked={false} checked={autoInvest} onChange={handleAutoInvestChange} />
                    <Text>Auto Invest Enabled: {autoInvest ? 'Yes' : 'No'}</Text>
                </div>

                <Space>
                    <Button type="primary" onClick={handleSave}>
                        Save Configuration
                    </Button>
                    <Button onClick={onPanelClose}>
                        Close
                    </Button>
                </Space>
            </Space>
        </div>
    );
};

export default AgentConfigPanel;