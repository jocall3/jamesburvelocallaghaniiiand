import React, { useState, useCallback, useMemo } from 'react';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Paper,
  TextareaAutosize,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Assuming ISO 20022 code types are defined elsewhere or imported.
// For this specific file generation, we'll use placeholders/mocked types
// based on the schema provided, although in a real project, these would
// be generated or imported types.

type ExternalCodeType = string; // Placeholder for actual union types from schema definitions

interface PaymentInstruction {
  id: number;
  instrId: string;
  endToEndId: string;
  amt: string;
  ccy: string;
  instrDt: string;
  debtorName: string;
  debtorIban: string;
  creditorName: string;
  creditorIban: string;
  serviceLevel: ExternalCodeType;
  purpose: ExternalCodeType;
  localInstrument: ExternalCodeType;
}

// Mocked/Placeholder external code lists for form population
const mockServiceLevelCodes: ExternalCodeType[] = ['SEPA', 'URGP', 'INST', 'NURG'];
const mockPurposeCodes: ExternalCodeType[] = ['CASH', 'TREA', 'SUPP', 'GOVT'];
const mockLocalInstrumentCodes: ExternalCodeType[] = ['CORE', 'B2B', 'TRF', 'INST'];

const PaymentInitiationForm: React.FC = () => {
  const [isBulk, setIsBulk] = useState(false);
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);
  const [newInstruction, setNewInstruction] = useState<Omit<PaymentInstruction, 'id'>>({
    instrId: '',
    endToEndId: '',
    amt: '',
    ccy: 'EUR',
    instrDt: new Date().toISOString().substring(0, 10),
    debtorName: '',
    debtorIban: '',
    creditorName: '',
    creditorIban: '',
    serviceLevel: 'SEPA',
    purpose: 'CASH',
    localInstrument: 'CORE',
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleNewInstructionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewInstruction((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateInstruction = (instr: Omit<PaymentInstruction, 'id'>): boolean => {
    if (!instr.instrId || !instr.endToEndId || !instr.amt || !instr.ccy || !instr.instrDt ||
        !instr.debtorName || !instr.debtorIban || !instr.creditorName || !instr.creditorIban ||
        !instr.serviceLevel || !instr.purpose || !instr.localInstrument) {
      setError('All fields must be filled.');
      return false;
    }
    if (isNaN(parseFloat(instr.amt)) || parseFloat(instr.amt) <= 0) {
      setError('Amount must be a positive number.');
      return false;
    }
    setError(null);
    return true;
  };

  const addInstruction = useCallback(() => {
    if (validateInstruction(newInstruction)) {
      const instructionToAdd: PaymentInstruction = {
        ...newInstruction,
        id: Date.now(), // Simple unique ID
      };
      setInstructions((prev) => [...prev, instructionToAdd]);
      setNewInstruction((prev) => ({
        ...prev,
        instrId: '',
        endToEndId: '',
      })); // Clear IDs for the next entry if adding multiple one by one
      setMessage('Instruction added successfully.');
      setTimeout(() => setMessage(null), 3000);
    }
  }, [newInstruction]);

  const removeInstruction = useCallback((id: number) => {
    setInstructions((prev) => prev.filter((instr) => instr.id !== id));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instructions.length === 0) {
      setError('No payment instructions to submit.');
      return;
    }

    console.log('Submitting Payment Instructions (Simulated pain.001 generation):', instructions);
    
    // In a real application, this would trigger the pain.001 XML generation/API call
    setError(null);
    setMessage(`Successfully submitted ${instructions.length} payment instruction(s) for processing.`);
    setInstructions([]);
    setNewInstruction({
        instrId: '',
        endToEndId: '',
        amt: '',
        ccy: 'EUR',
        instrDt: new Date().toISOString().substring(0, 10),
        debtorName: '',
        debtorIban: '',
        creditorName: '',
        creditorIban: '',
        serviceLevel: 'SEPA',
        purpose: 'CASH',
        localInstrument: 'CORE',
    });
  };

  const formFields = useMemo(() => (
    <>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="Instruction ID (MsgId)"
          name="instrId"
          value={newInstruction.instrId}
          onChange={handleNewInstructionChange}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="End To End ID"
          name="endToEndId"
          value={newInstruction.endToEndId}
          onChange={handleNewInstructionChange}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="Amount"
          name="amt"
          type="number"
          InputProps={{ inputProps: { min: 0.01, step: '0.01' } }}
          value={newInstruction.amt}
          onChange={handleNewInstructionChange}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="Currency (ISOCode)"
          name="ccy"
          value={newInstruction.ccy}
          onChange={handleNewInstructionChange}
          required
          inputProps={{ maxLength: 3 }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="Requested Execution Date"
          name="instrDt"
          type="date"
          value={newInstruction.instrDt}
          onChange={handleNewInstructionChange}
          required
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} md={12}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Debtor Details</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Debtor Name"
          name="debtorName"
          value={newInstruction.debtorName}
          onChange={handleNewInstructionChange}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Debtor IBAN"
          name="debtorIban"
          value={newInstruction.debtorIban}
          onChange={handleNewInstructionChange}
          required
        />
      </Grid>

      <Grid item xs={12} md={12}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Creditor Details</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Creditor Name"
          name="creditorName"
          value={newInstruction.creditorName}
          onChange={handleNewInstructionChange}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Creditor IBAN"
          name="creditorIban"
          value={newInstruction.creditorIban}
          onChange={handleNewInstructionChange}
          required
        />
      </Grid>

      <Grid item xs={12} md={12}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Classification (External Codes)</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel id="serviceLevelLabel">Service Level (SvcLvl)</InputLabel>
          <Select
            labelId="serviceLevelLabel"
            name="serviceLevel"
            value={newInstruction.serviceLevel}
            label="Service Level (SvcLvl)"
            onChange={(e) => setNewInstruction((prev) => ({ ...prev, serviceLevel: e.target.value as ExternalCodeType }))}
          >
            {mockServiceLevelCodes.map((code) => (
              <MenuItem key={code} value={code}>{code}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel id="purposeLabel">Purpose (Purp)</InputLabel>
          <Select
            labelId="purposeLabel"
            name="purpose"
            value={newInstruction.purpose}
            label="Purpose (Purp)"
            onChange={(e) => setNewInstruction((prev) => ({ ...prev, purpose: e.target.value as ExternalCodeType }))}
          >
            {mockPurposeCodes.map((code) => (
              <MenuItem key={code} value={code}>{code}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel id="localInstrumentLabel">Local Instrument (LclInstrm)</InputLabel>
          <Select
            labelId="localInstrumentLabel"
            name="localInstrument"
            value={newInstruction.localInstrument}
            label="Local Instrument (LclInstrm)"
            onChange={(e) => setNewInstruction((prev) => ({ ...prev, localInstrument: e.target.value as ExternalCodeType }))}
          >
            {mockLocalInstrumentCodes.map((code) => (
              <MenuItem key={code} value={code}>{code}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      {/* Placeholder for unstructured remittance information */}
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Remittance Information (Ustrd)</InputLabel>
          <TextareaAutosize
            minRows={3}
            name="remittanceInfo"
            placeholder="Enter unstructured remittance information here..."
            style={{ width: '100%', padding: '10px', borderRadius: '4px', borderColor: '#ccc' }}
            // Note: Remittance info is not in the base mock structure, added here as common field
          />
        </FormControl>
      </Grid>
    </>
  ), [newInstruction]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Payment Initiation ({isBulk ? 'Bulk' : 'Single'})
      </Typography>

      <FormControl sx={{ mb: 2 }}>
        <Button
          variant={isBulk ? "outlined" : "contained"}
          onClick={() => setIsBulk(false)}
        >
          Single Payment
        </Button>
        <Button
          variant={isBulk ? "contained" : "outlined"}
          onClick={() => setIsBulk(true)}
          sx={{ ml: 1 }}
        >
          Bulk Payment
        </Button>
      </FormControl>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {isBulk ? 'Add Instruction to Batch' : 'New Payment Instruction'}
        </Typography>
        <Grid container spacing={3}>
          {formFields}
          
          <Grid item xs={12}>
            {isBulk ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addInstruction}
                disabled={!newInstruction.instrId || !newInstruction.amt} // Minimal check for bulk entry
              >
                Add to Batch
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={instructions.length === 0 && (!newInstruction.instrId || !newInstruction.amt)}
              >
                Submit Single Payment (Simulate pain.001)
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {isBulk && instructions.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Batch ({instructions.length} Items)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Instr ID</TableCell>
                  <TableCell>End-to-End ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Creditor IBAN</TableCell>
                  <TableCell>Service Level</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instructions.map((instr) => (
                  <TableRow key={instr.id}>
                    <TableCell>{instr.instrId}</TableCell>
                    <TableCell>{instr.endToEndId}</TableCell>
                    <TableCell>{instr.amt} {instr.ccy}</TableCell>
                    <TableCell>{instr.creditorIban.substring(0, 25)}...</TableCell>
                    <TableCell>{instr.serviceLevel}</TableCell>
                    <TableCell>{instr.purpose}</TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="delete"
                        onClick={() => removeInstruction(instr.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={handleSubmit}
          >
            Finalize and Submit Batch (Simulate pain.001)
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default PaymentInitiationForm;
