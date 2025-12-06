
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, Row, Col, Typography } from 'antd';
import { useForm } from 'antd/es/form/util';
import {
    ExternalClearingSystemIdentification1Code,
    ExternalAccountIdentification1Code,
} from './types';

const { Title } = Typography;

const SsiEditorForm: React.FC<{
    initialValues?: any;
    onSubmit: (values: any) => void;
    onCancel: () => void;
}> = ({ initialValues, onSubmit, onCancel }) => {
    const [form] = useForm();
    const [clearingSystemOptions, setClearingSystemOptions] = useState<
        { value: ExternalClearingSystemIdentification1Code; label: string }[]
    >([]);
    const [accountIdentificationOptions, setAccountIdentificationOptions] = useState<
        { value: ExternalAccountIdentification1Code; label: string }[]
    >([]);

    useEffect(() => {
        const clearingSystemData = [
            { value: 'USABA', label: 'USABA' },
            { value: 'CHIPS', label: 'CHIPS' },
            { value: 'SWIFT', label: 'SWIFT' },
        ];
        setClearingSystemOptions(clearingSystemData);

        const accountIdentificationData = [
            { value: 'BBAN', label: 'BBAN' },
            { value: 'IBAN', label: 'IBAN' },
        ];
        setAccountIdentificationOptions(accountIdentificationData);

        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [form, initialValues]);

    const onFinish = (values: any) => {
        onSubmit(values);
        form.resetFields();
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={initialValues}
        >
            <Title level={4}>SSI Details</Title>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="clearingSystem"
                        label="Clearing System"
                        rules={[{ required: true, message: 'Please select!' }]}
                    >
                        <Select placeholder="Select clearing system">
                            {clearingSystemOptions.map((option) => (
                                <Select.Option key={option.value} value={option.value}>
                                    {option.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="correspondentBank.bic" label="Correspondent Bank BIC">
                        <Input placeholder="Correspondent Bank BIC" />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="account.identificationType" label="Account ID Type">
                        <Select placeholder="Select type">
                            {accountIdentificationOptions.map((option) => (
                                <Select.Option key={option.value} value={option.value}>
                                    {option.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="account.number" label="Account Number">
                        <Input placeholder="Account Number" />
                    </Form.Item>
                </Col>
            </Row>
             <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit">Submit</Button>
                    <Button htmlType="button" onClick={onCancel}>Cancel</Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default SsiEditorForm;
