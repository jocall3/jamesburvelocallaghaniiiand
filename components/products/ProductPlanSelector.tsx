import React, { useState, useEffect } from 'react';
import { Button, Select, Input, Form, Card, Row, Col, Typography, Space, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface ProductPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'annually';
  features: string[];
}

interface ProductPlanSelectorProps {
  initialPlans?: ProductPlan[];
  onPlansChange: (plans: ProductPlan[]) => void;
}

const ProductPlanSelector: React.FC<ProductPlanSelectorProps> = ({ initialPlans = [], onPlansChange }) => {
  const [plans, setPlans] = useState<ProductPlan[]>(initialPlans);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  const addPlan = () => {
    const newPlan: ProductPlan = {
      id: Date.now().toString(),
      name: `New Plan ${plans.length + 1}`,
      price: 0,
      billingPeriod: 'monthly',
      features: [],
    };
    setPlans([...plans, newPlan]);
  };

  const deletePlan = (id: string) => {
    setPlans(plans.filter(plan => plan.id !== id));
    if (editingPlanId === id) {
      setEditingPlanId(null);
      form.resetFields();
    }
  };

  const startEditing = (plan: ProductPlan) => {
    setEditingPlanId(plan.id);
    form.setFieldsValue({
      name: plan.name,
      price: plan.price,
      billingPeriod: plan.billingPeriod,
      features: plan.features.join('\n'),
    });
  };

  const cancelEditing = () => {
    setEditingPlanId(null);
    form.resetFields();
  };

  const saveEditing = () => {
    form.validateFields().then((values) => {
      const updatedPlans = plans.map(plan => {
        if (plan.id === editingPlanId) {
          return {
            ...plan,
            name: values.name,
            price: parseFloat(values.price),
            billingPeriod: values.billingPeriod,
            features: values.features.split('\n').map((f: string) => f.trim()).filter((f: string) => f !== ''),
          };
        }
        return plan;
      });
      setPlans(updatedPlans);
      onPlansChange(updatedPlans);
      setEditingPlanId(null);
      form.resetFields();
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  const handleFeatureChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    form.setFieldsValue({ features: e.target.value });
  };

  return (
    <div className="product-plan-selector">
      <Title level={3}>Product Plans</Title>
      <Row gutter={[16, 16]}>
        {plans.map(plan => (
          <Col key={plan.id} xs={24} sm={12} md={8}>
            <Card
              title={editingPlanId === plan.id ? (
                <Form.Item name="name" noStyle rules={[{ required: true, message: 'Plan name is required' }]}>
                  <Input placeholder="Plan Name" />
                </Form.Item>
              ) : (
                plan.name
              )}
              extra={
                editingPlanId === plan.id ? (
                  <Space>
                    <Button type="link" onClick={cancelEditing}>Cancel</Button>
                    <Button type="primary" onClick={saveEditing}>Save</Button>
                  </Space>
                ) : (
                  <Space>
                    <Button icon={<EditOutlined />} type="link" onClick={() => startEditing(plan)} />
                    <Button icon={<DeleteOutlined />} type="link" danger onClick={() => deletePlan(plan.id)} />
                  </Space>
                )
              }
            >
              {editingPlanId === plan.id ? (
                <Form form={form} layout="vertical">
                  <Form.Item name="price" label="Price ($)" rules={[{ required: true, message: 'Price is required' }, { type: 'number', min: 0, message: 'Price must be non-negative' }]}>
                    <Input type="number" addonBefore="$" />
                  </Form.Item>
                  <Form.Item name="billingPeriod" label="Billing Period" rules={[{ required: true, message: 'Billing period is required' }]}>
                    <Select>
                      <Option value="monthly">Monthly</Option>
                      <Option value="annually">Annually</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="features" label="Features (one per line)">
                    <Input.TextArea rows={4} onChange={handleFeatureChange} />
                  </Form.Item>
                </Form>
              ) : (
                <>
                  <Title level={4}>${plan.price.toFixed(2)} / {plan.billingPeriod}</Title>
                  <Divider />
                  <ul style={{ paddingLeft: '20px' }}>
                    {plan.features.length > 0 ? (
                      plan.features.map((feature, index) => <li key={index}>{feature}</li>)
                    ) : (
                      <li>No features defined</li>
                    )}
                  </ul>
                </>
              )}
            </Card>
          </Col>
        ))}
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px dashed #ccc' }}
            onClick={addPlan}
          >
            <Space direction="vertical" align="center">
              <PlusOutlined style={{ fontSize: '32px', color: '#ccc' }} />
              <Text style={{ color: '#ccc' }}>Add New Plan</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductPlanSelector;