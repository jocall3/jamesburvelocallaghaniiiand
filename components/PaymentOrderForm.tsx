
import React, { useState, useEffect, useCallback } from 'react';

// NOTE: This component assumes a UI library like Material-UI is installed and configured.
// e.g., `import { TextField, Button } from '@mui/material';`
// For brevity, component types are aliased to standard HTML elements or placeholder types.

// --- UI Component Placeholders ---
const Box: React.FC<any> = ({ component: Component = 'div', ...props }) => <Component {...props} />;
const Typography: React.FC<any> = (props) => <h5 {...props} />;
const Grid: React.FC<any> = (props) => <div {...props} />;
const TextField: React.FC<any> = (props) => <input {...props} />;
const Button: React.FC<any> = (props) => <button {...props} />;
const Select: React.FC<any> = ({ children, ...props }) => <select {...props}>{children}</select>;
const MenuItem: React.FC<any> = (props) => <option {...props} />;
const FormControl: React.FC<any> = (props) => <div {...props} />;
const InputLabel: React.FC<any> = (props) => <label {...props} />;
const IconButton: React.FC<any> = (props) => <button {...props} />;
const Switch: React.FC<any> = (props) => <input type="checkbox" {...props} />;
const FormControlLabel: React.FC<any> = ({ control, label }) => <label>{control}{label}</label>;
const Accordion: React.FC<any> = (props) => <details {...props} />;
const AccordionSummary: React.FC<any> = (props) => <summary {...props} />;
const AccordionDetails: React.FC<any> = (props) => <div {...props} />;
const AddCircleOutline: React.FC<any> = () => <span>+</span>;
const RemoveCircleOutline: React.FC<any> = () => <span>-</span>;
const ExpandMore: React.FC<any> = () => <span>v</span>;
// --- End UI Component Placeholders ---

// --- Type Definitions ---
interface Account {
  id: string;
  name: string;
  currency: string;
}

interface LineItem {
  amount: number; // in cents
  description: string;
  metadata?: { [key: string]: string };
}

interface PaymentOrderFormData {
  id?: string;
  type: 'ach' | 'wire' | 'rtp' | 'check' | 'book' | 'eft' | 'sepa' | 'bacs' | 'au_becs' | 'interac' | 'sen' | 'signet' | 'provexchange' | '';
  subtype?: 'CCD' | 'PPD' | 'IAT' | 'CTX' | 'WEB' | 'CIE' | 'TEL' | '';
  amount: number; // in dollars
  direction: 'credit' | 'debit' | '';
  priority: 'normal' | 'high' | '';
  originating_account_id: string;
  receiving_account_id: string;
  currency: string;
  effective_date: string; // YYYY-MM-DD
  description: string;
  statement_descriptor: string;
  remittance_information: string;
  purpose: string;
  metadata: { key: string; value: string }[];
  line_items: LineItem[];
  send_remittance_advice: boolean;
  nsf_protected: boolean;
  charge_bearer?: 'shared' | 'sender' | 'receiver' | '';
  ultimate_originating_party_name: string;
  ultimate_receiving_party_name: string;
}

const initialFormData: PaymentOrderFormData = {
  type: '',
  subtype: '',
  amount: 0,
  direction: '',
  priority: 'normal',
  originating_account_id: '',
  receiving_account_id: '',
  currency: 'USD',
  effective_date: new Date().toISOString().split('T')[0],
  description: '',
  statement_descriptor: '',
  remittance_information: '',
  purpose: '',
  metadata: [],
  line_items: [{ amount: 0, description: '' }],
  send_remittance_advice: false,
  nsf_protected: false,
  charge_bearer: '',
  ultimate_originating_party_name: '',
  ultimate_receiving_party_name: '',
};

interface PaymentOrderFormProps {
  initialData?: Partial<PaymentOrderFormData>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  internalAccounts: Account[];
  externalAccounts: Account[];
}

const paymentTypes = ['ach', 'wire', 'rtp', 'check', 'book', 'eft', 'sepa', 'bacs', 'au_becs', 'interac', 'sen', 'signet', 'provexchange'];
const achSubtypes = ['CCD', 'PPD', 'IAT', 'CTX', 'WEB', 'CIE', 'TEL'];
const currencies = ['USD', 'CAD', 'EUR', 'GBP', 'AUD'];

const PaymentOrderForm: React.FC<PaymentOrderFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  internalAccounts,
  externalAccounts,
}) => {
  const [formData, setFormData] = useState<PaymentOrderFormData>(initialFormData);

  useEffect(() => {
    if (initialData) {
        // When editing, convert amount from cents to dollars for the form
        const populatedData = { ...initialFormData, ...initialData };
        if (typeof populatedData.amount === 'number') {
            populatedData.amount = populatedData.amount / 100;
        }
        setFormData(populatedData);
    } else {
      setFormData(initialFormData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newAmount = isNaN(value) ? 0 : value;
    setFormData(prev => ({
      ...prev,
      amount: newAmount,
      line_items: prev.line_items.length === 1 ? [{ ...prev.line_items[0], amount: Math.round(newAmount * 100) }] : prev.line_items
    }));
  };

  const handleMetadataChange = (index: number, field: 'key' | 'value', value: string) => {
    const newMetadata = [...formData.metadata];
    newMetadata[index] = { ...newMetadata[index], [field]: value };
    setFormData(prev => ({ ...prev, metadata: newMetadata }));
  };

  const addMetadataField = () => {
    setFormData(prev => ({ ...prev, metadata: [...prev.metadata, { key: '', value: '' }] }));
  };

  const removeMetadataField = (index: number) => {
    setFormData(prev => ({ ...prev, metadata: prev.metadata.filter((_, i) => i !== index) }));
  };

  const handleLineItemChange = (index: number, field: 'description' | 'amount', value: string | number) => {
    const newLineItems = [...formData.line_items];
    const item = { ...newLineItems[index] };
    if (field === 'amount') {
      const amountValue = typeof value === 'string' ? parseFloat(value) : value;
      item.amount = isNaN(amountValue) ? 0 : Math.round(amountValue * 100);
    } else {
      item.description = value as string;
    }
    newLineItems[index] = item;
    setFormData(prev => ({ ...prev, line_items: newLineItems }));
  };

  const addLineItem = () => {
    setFormData(prev => ({ ...prev, line_items: [...prev.line_items, { amount: 0, description: '' }] }));
  };

  const removeLineItem = (index: number) => {
    if (formData.line_items.length > 1) {
      setFormData(prev => ({ ...prev, line_items: prev.line_items.filter((_, i) => i !== index) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      amount: Math.round(formData.amount * 100), // Convert to cents
    };
    onSubmit(submissionData);
  };

  const totalLineItemAmount = useCallback(() => {
    return formData.line_items.reduce((sum, item) => sum + item.amount, 0);
  }, [formData.line_items]);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        {formData.id ? 'Edit Payment Order' : 'Create Payment Order'}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth required>
            <InputLabel>Payment Type</InputLabel>
            <Select name="type" value={formData.type} label="Payment Type" onChange={handleChange}>
              <MenuItem value=""><em>Select Type</em></MenuItem>
              {paymentTypes.map(type => <MenuItem key={type} value={type}>{type.toUpperCase()}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        {formData.type === 'ach' && (
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>ACH Subtype</InputLabel>
              <Select name="subtype" value={formData.subtype} label="ACH Subtype" onChange={handleChange}>
                <MenuItem value=""><em>None</em></MenuItem>
                {achSubtypes.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth required>
            <InputLabel>Direction</InputLabel>
            <Select name="direction" value={formData.direction} label="Direction" onChange={handleChange}>
              <MenuItem value=""><em>Select Direction</em></MenuItem>
              <MenuItem value="credit">Credit</MenuItem>
              <MenuItem value="debit">Debit</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="amount" label="Amount" type="number" value={formData.amount} onChange={handleAmountChange} fullWidth required inputProps={{ step: "0.01" }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Currency</InputLabel>
            <Select name="currency" value={formData.currency} label="Currency" onChange={handleChange}>
              {currencies.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField name="description" label="Description (Internal)" value={formData.description} onChange={handleChange} fullWidth multiline rows={2} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Originating Account</InputLabel>
            <Select name="originating_account_id" value={formData.originating_account_id} label="Originating Account" onChange={handleChange}>
              <MenuItem value=""><em>Select Account</em></MenuItem>
              {internalAccounts.map(acc => <MenuItem key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Receiving Account</InputLabel>
            <Select name="receiving_account_id" value={formData.receiving_account_id} label="Receiving Account" onChange={handleChange}>
              <MenuItem value=""><em>Select Account</em></MenuItem>
              {[...internalAccounts, ...externalAccounts].map(acc => <MenuItem key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="effective_date" label="Effective Date" type="date" value={formData.effective_date} onChange={handleChange} fullWidth required InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select name="priority" value={formData.priority} label="Priority" onChange={handleChange}>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Line Items</Typography>
          {formData.line_items.map((item, index) => (
            <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
              <Grid item xs={7}>
                <TextField label={`Line Item ${index + 1} Description`} value={item.description} onChange={(e: any) => handleLineItemChange(index, 'description', e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Amount" type="number" value={item.amount / 100} onChange={(e: any) => handleLineItemChange(index, 'amount', e.target.value)} fullWidth inputProps={{ step: "0.01" }} />
              </Grid>
              <Grid item xs={1}>
                <IconButton onClick={() => removeLineItem(index)} disabled={formData.line_items.length <= 1}><RemoveCircleOutline /></IconButton>
              </Grid>
            </Grid>
          ))}
          <Button onClick={addLineItem} startIcon={<AddCircleOutline />}>Add Line Item</Button>
          {Math.round(formData.amount * 100) !== totalLineItemAmount() && (
            <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>Total of line items (${(totalLineItemAmount() / 100).toFixed(2)}) does not match payment amount (${formData.amount.toFixed(2)}).</Typography>
          )}
        </Grid>
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}><Typography>Optional Fields</Typography></AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}><TextField name="statement_descriptor" label="Statement Descriptor" value={formData.statement_descriptor} onChange={handleChange} fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField name="remittance_information" label="Remittance Information" value={formData.remittance_information} onChange={handleChange} fullWidth /></Grid>
                {formData.type === 'wire' && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Charge Bearer</InputLabel>
                      <Select name="charge_bearer" value={formData.charge_bearer} label="Charge Bearer" onChange={handleChange}>
                        <MenuItem value=""><em>None</em></MenuItem>
                        <MenuItem value="shared">Shared (SHA)</MenuItem>
                        <MenuItem value="sender">Sender (OUR)</MenuItem>
                        <MenuItem value="receiver">Receiver (BEN)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={formData.send_remittance_advice} onChange={handleChange} name="send_remittance_advice" />} label="Send Remittance Advice" /></Grid>
                <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={formData.nsf_protected} onChange={handleChange} name="nsf_protected" />} label="NSF Protected" /></Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}><Typography>Metadata</Typography></AccordionSummary>
            <AccordionDetails>
              {formData.metadata.map((meta, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                  <Grid item xs={5}><TextField label="Key" value={meta.key} onChange={(e: any) => handleMetadataChange(index, 'key', e.target.value)} fullWidth /></Grid>
                  <Grid item xs={6}><TextField label="Value" value={meta.value} onChange={(e: any) => handleMetadataChange(index, 'value', e.target.value)} fullWidth /></Grid>
                  <Grid item xs={1}><IconButton onClick={() => removeMetadataField(index)}><RemoveCircleOutline /></IconButton></Grid>
                </Grid>
              ))}
              <Button onClick={addMetadataField} startIcon={<AddCircleOutline />}>Add Metadata</Button>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>Cancel</Button>
        <Button type="submit" variant="contained" color="primary">{formData.id ? 'Update Payment Order' : 'Create Payment Order'}</Button>
      </Box>
    </Box>
  );
};

export default PaymentOrderForm;
