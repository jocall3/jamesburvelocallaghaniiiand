import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Stack } from '@mui/material';
import Paper from '@mui/material/Paper';

interface RemittanceInfoEditorProps {
  structured?: string;
  unstructured?: string;
  onChange: (structured?: string, unstructured?: string) => void;
}

const RemittanceInfoEditor: React.FC<RemittanceInfoEditorProps> = ({
  structured: initialStructured,
  unstructured: initialUnstructured,
  onChange,
}) => {
  const [structured, setStructured] = useState<string | undefined>(initialStructured);
  const [unstructured, setUnstructured] = useState<string | undefined>(initialUnstructured);

  useEffect(() => {
    setStructured(initialStructured);
    setUnstructured(initialUnstructured);
  }, [initialStructured, initialUnstructured]);

  const handleStructuredChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setStructured(value);
    onChange(value, unstructured);
  };

  const handleUnstructuredChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setUnstructured(value);
    onChange(structured, value);
  };

  return (
    <Paper elevation={2} sx={{ padding: 3 }}>
      <Typography variant="h6" gutterBottom>
        Remittance Information
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle1">Structured Remittance Information</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter structured remittance information (e.g., key-value pairs, JSON)"
            value={structured || ''}
            onChange={handleStructuredChange}
            variant="outlined"
            helperText="Use a structured format for automated processing."
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1">Unstructured Remittance Information</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter unstructured remittance information (free text)"
            value={unstructured || ''}
            onChange={handleUnstructuredChange}
            variant="outlined"
            helperText="Use free text for additional details not covered in the structured format."
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RemittanceInfoEditor;
