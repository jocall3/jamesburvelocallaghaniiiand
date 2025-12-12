import React, { useState, useContext } from 'react';
import { Select } from 'antd';
import { ChainContext } from '../../context/ChainContext';

const { Option } = Select;

const ChainSelector: React.FC = () => {
  const { chain, setChain } = useContext(ChainContext);

  const handleChange = (value: string) => {
    setChain(value);
  };

  return (
    <Select defaultValue={chain} style={{ width: 120 }} onChange={handleChange}>
      <Option value="mainnet">Mainnet</Option>
      <Option value="polygon">Polygon</Option>
      <Option value="arbitrum">Arbitrum</Option>
    </Select>
  );
};

export default ChainSelector;