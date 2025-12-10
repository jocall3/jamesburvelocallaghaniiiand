```tsx
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface ConditionalLogicNodeProps {
  id: string;
  data: {
    condition?: string;
    conditionType?: string;
    trueOutput?: string;
    falseOutput?: string;
    onChange: (id: string, data: any) => void;
  };
}

const ConditionalLogicNode: React.FC<ConditionalLogicNodeProps> = ({ id, data }) => {
  const { condition = '', conditionType = 'boolean', trueOutput = '', falseOutput = '', onChange } = data;
  const [localCondition, setLocalCondition] = useState(condition);
  const [localConditionType, setLocalConditionType] = useState(conditionType);
  const [localTrueOutput, setLocalTrueOutput] = useState(trueOutput);
  const [localFalseOutput, setLocalFalseOutput] = useState(falseOutput);

  const handleConditionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCondition = event.target.value;
    setLocalCondition(newCondition);
    onChange(id, { ...data, condition: newCondition });
  };

  const handleConditionTypeChange = (event: React.ChangeEvent<any>) => {
    const newConditionType = event.target.value;
    setLocalConditionType(newConditionType);
    onChange(id, { ...data, conditionType: newConditionType });
  };


  const handleTrueOutputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTrueOutput = event.target.value;
    setLocalTrueOutput(newTrueOutput);
    onChange(id, { ...data, trueOutput: newTrueOutput });
  };

  const handleFalseOutputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFalseOutput = event.target.value;
    setLocalFalseOutput(newFalseOutput);
    onChange(id, { ...data, falseOutput: newFalseOutput });
  };



  return (
    <Box style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', width: '300px', backgroundColor: 'white' }}>
      <Handle type="target" position={Position.Top} id="input" />
      <div>
        <FormControl fullWidth margin="dense">
          <InputLabel id="condition-type-label">Condition Type</InputLabel>
          <Select
            labelId="condition-type-label"
            id="condition-type"
            value={localConditionType}
            label="Condition Type"
            onChange={handleConditionTypeChange}
          >
            <MenuItem value={'boolean'}>Boolean</MenuItem>
            <MenuItem value={'number'}>Number</MenuItem>
            <MenuItem value={'string'}>String</MenuItem>
          </Select>
        </FormControl>


        <TextField
          label="Condition"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localCondition}
          onChange={handleConditionChange}
        />

        <TextField
          label="True Output"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localTrueOutput}
          onChange={handleTrueOutputChange}
        />

        <TextField
          label="False Output"
          variant="outlined"
          fullWidth
          margin="dense"
          value={localFalseOutput}
          onChange={handleFalseOutputChange}
        />

      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} />
    </Box>
  );
};

export default ConditionalLogicNode;
```