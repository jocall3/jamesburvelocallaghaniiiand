```tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, TextField, Typography, Button, Alert } from '@mui/material';
import { useWorkflow } from '../../WorkflowContext';

interface DataTransformNodeProps {
  id: string;
  data: {
    script: string;
    onScriptChange: (script: string) => void;
    output: any;
    error: string | null;
    onExecute: () => void;
  };
}

const DataTransformNode: React.FC<DataTransformNodeProps> = ({ id, data }) => {
  const { updateNodeData } = useWorkflow();
  const [localScript, setLocalScript] = useState(data.script);

  useEffect(() => {
    setLocalScript(data.script);
  }, [data.script]);


  const handleScriptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalScript(event.target.value);
  };

  const handleBlur = useCallback(() => {
    updateNodeData(id, { script: localScript });
  }, [id, localScript, updateNodeData]);

  const handleExecute = () => {
    data.onExecute();
  };

  return (
    <Box
      style={{
        border: '1px solid #ccc',
        padding: '10px',
        borderRadius: '5px',
        backgroundColor: 'white',
        width: '300px',
      }}
    >
      <Typography variant="subtitle1">Data Transformation</Typography>
      <Handle type="target" position={Position.Top} id="input" />
      <Handle type="source" position={Position.Bottom} id="output" />

      <TextField
        label="Transformation Script"
        multiline
        rows={4}
        variant="outlined"
        fullWidth
        value={localScript}
        onChange={handleScriptChange}
        onBlur={handleBlur}
        style={{ marginTop: '10px', marginBottom: '10px' }}
      />

      <Button variant="contained" color="primary" onClick={handleExecute}>
        Execute
      </Button>

      {data.output && (
        <Box mt={2}>
          <Typography variant="subtitle2">Output:</Typography>
          <pre>{JSON.stringify(data.output, null, 2)}</pre>
        </Box>
      )}

      {data.error && (
        <Alert severity="error" style={{ marginTop: '10px' }}>
          Error: {data.error}
        </Alert>
      )}
    </Box>
  );
};

export default DataTransformNode;
```