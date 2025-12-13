import React, { useState, useEffect } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  Grid,
  Box,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { styled } from '@mui/material/styles';

// Define interfaces for rule structure
interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  conditions: Condition[];
  action: 'block' | 'review' | 'allow';
}

// Mock data for available fields and operators
const availableFields = [
  'amount',
  'currency',
  'card_country',
  'customer_email',
  'ip_address',
  'device_type',
  'fraud_score',
  'transaction_id',
  'created_at',
];

const availableOperators = [
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'contains',
  'starts_with',
  'ends_with',
  'is_null',
  'is_not_null',
];

const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
}));

const RuleEditor: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [testTransaction, setTestTransaction] = useState<any>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [openTestDialog, setOpenTestDialog] = useState(false);

  // Load rules from local storage or mock data
  useEffect(() => {
    const storedRules = localStorage.getItem('stripeFraudRules');
    if (storedRules) {
      setRules(JSON.parse(storedRules));
    } else {
      // Add some initial mock rules if none exist
      setRules([
        {
          id: 'rule-1',
          name: 'High Value Transactions from Risky Countries',
          description: 'Blocks transactions over $1000 from countries with high fraud rates.',
          conditions: [
            { field: 'amount', operator: 'greater_than', value: '1000' },
            { field: 'card_country', operator: 'equals', value: 'NG' },
          ],
          action: 'block',
        },
        {
          id: 'rule-2',
          name: 'Suspicious Email Domains',
          description: 'Flags transactions with temporary or suspicious email domains for review.',
          conditions: [
            { field: 'customer_email', operator: 'contains', value: '@mailinator.com' },
            { field: 'customer_email', operator: 'contains', value: '@tempmail.org' },
          ],
          action: 'review',
        },
      ]);
    }
  }, []);

  // Save rules to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('stripeFraudRules', JSON.stringify(rules));
  }, [rules]);

  const handleAddRule = () => {
    setIsAddMode(true);
    setEditingRule({
      id: `rule-${Date.now()}`,
      name: '',
      description: '',
      conditions: [{ field: '', operator: '', value: '' }],
      action: 'review',
    });
  };

  const handleEditRule = (ruleId: string) => {
    const ruleToEdit = rules.find((r) => r.id === ruleId);
    if (ruleToEdit) {
      setIsAddMode(false);
      setEditingRule({ ...ruleToEdit });
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter((r) => r.id !== ruleId));
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    if (isAddMode) {
      setRules([...rules, editingRule]);
    } else {
      setRules(rules.map((r) => (r.id === editingRule.id ? editingRule : r)));
    }
    setEditingRule(null);
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
  };

  const handleConditionChange = (index: number, field: keyof Condition, value: string) => {
    if (!editingRule) return;
    const newConditions = [...editingRule.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setEditingRule({ ...editingRule, conditions: newConditions });
  };

  const handleAddCondition = () => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      conditions: [...editingRule.conditions, { field: '', operator: '', value: '' }],
    });
  };

  const handleDeleteCondition = (index: number) => {
    if (!editingRule) return;
    const newConditions = editingRule.conditions.filter((_, i) => i !== index);
    setEditingRule({ ...editingRule, conditions: newConditions });
  };

  const handleTestRule = () => {
    setOpenTestDialog(true);
    setTestResult(null); // Reset test result
  };

  const handleRunTest = () => {
    // In a real app, this would involve sending the testTransaction data
    // to a backend service that evaluates the rules against it.
    // For this example, we'll simulate a basic check.

    if (!editingRule) return;

    let matches = true;
    for (const condition of editingRule.conditions) {
      const testValue = testTransaction[condition.field];
      if (testValue === undefined) {
        matches = false; // Field not present in test transaction
        break;
      }

      switch (condition.operator) {
        case 'equals':
          if (String(testValue) !== condition.value) matches = false;
          break;
        case 'not_equals':
          if (String(testValue) === condition.value) matches = false;
          break;
        case 'greater_than':
          if (parseFloat(String(testValue)) <= parseFloat(condition.value)) matches = false;
          break;
        case 'less_than':
          if (parseFloat(String(testValue)) >= parseFloat(condition.value)) matches = false;
          break;
        case 'contains':
          if (!String(testValue).includes(condition.value)) matches = false;
          break;
        case 'starts_with':
          if (!String(testValue).startsWith(condition.value)) matches = false;
          break;
        case 'ends_with':
          if (!String(testValue).endsWith(condition.value)) matches = false;
          break;
        case 'is_null':
          if (testValue !== null && testValue !== undefined && testValue !== '') matches = false;
          break;
        case 'is_not_null':
          if (testValue === null || testValue === undefined || testValue === '') matches = false;
          break;
        default:
          matches = false; // Unknown operator
      }
      if (!matches) break;
    }

    if (matches) {
      setTestResult(`Rule "${editingRule.name}" would trigger action: ${editingRule.action}.`);
    } else {
      setTestResult(`Rule "${editingRule.name}" would NOT trigger.`);
    }
  };

  const handleCloseTestDialog = () => {
    setOpenTestDialog(false);
    setTestTransaction({});
    setTestResult(null);
  };

  const handleTestTransactionChange = (field: string, value: string) => {
    setTestTransaction((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Stripe Radar - Custom Fraud Rules
      </Typography>

      <Button variant="contained" onClick={handleAddRule} sx={{ mb: 3 }}>
        <AddIcon sx={{ mr: 1 }} />
        Add New Rule
      </Button>

      {rules.map((rule) => (
        <StyledBox key={rule.id}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <Typography variant="h6">{rule.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {rule.description || 'No description provided.'}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Conditions: {rule.conditions.length} | Action: {rule.action}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
              <IconButton color="primary" onClick={() => handleEditRule(rule.id)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => handleDeleteRule(rule.id)}>
                <DeleteIcon />
              </IconButton>
              <IconButton color="secondary" onClick={handleTestRule}>
                <PlayArrowIcon />
              </IconButton>
            </Grid>
          </Grid>
        </StyledBox>
      ))}

      {editingRule && (
        <StyledBox>
          <Typography variant="h5" gutterBottom>
            {isAddMode ? 'Create New Rule' : 'Edit Rule'}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Rule Name"
                fullWidth
                value={editingRule.name}
                onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Description"
                fullWidth
                value={editingRule.description}
                onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                margin="normal"
              />
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Conditions</Typography>
          {editingRule.conditions.map((condition, index) => (
            <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Field</InputLabel>
                  <Select
                    label="Field"
                    value={condition.field}
                    onChange={(e) => handleConditionChange(index, 'field', e.target.value as string)}
                  >
                    {availableFields.map((field) => (
                      <MenuItem key={field} value={field}>
                        {field}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Operator</InputLabel>
                  <Select
                    label="Operator"
                    value={condition.operator}
                    onChange={(e) => handleConditionChange(index, 'operator', e.target.value as string)}
                  >
                    {availableOperators.map((op) => (
                      <MenuItem key={op} value={op}>
                        {op}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Value"
                  fullWidth
                  value={condition.value}
                  onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                  disabled={condition.operator === 'is_null' || condition.operator === 'is_not_null'}
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <IconButton color="error" onClick={() => handleDeleteCondition(index)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Button variant="outlined" onClick={handleAddCondition} sx={{ mt: 1, mb: 3 }}>
            <AddIcon sx={{ mr: 1 }} />
            Add Condition
          </Button>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  label="Action"
                  value={editingRule.action}
                  onChange={(e) => setEditingRule({ ...editingRule, action: e.target.value as 'block' | 'review' | 'allow' })}
                >
                  <MenuItem value="block">Block</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="allow">Allow</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleCancelEdit} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSaveRule}>
              {isAddMode ? 'Save Rule' : 'Update Rule'}
            </Button>
          </Box>
        </StyledBox>
      )}

      <Dialog open={openTestDialog} onClose={handleCloseTestDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Test Rule: {editingRule?.name || 'Select a rule to test'}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Simulate a Transaction
          </Typography>
          <Grid container spacing={2}>
            {availableFields.map((field) => (
              <Grid item xs={12} sm={6} key={field}>
                <TextField
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  fullWidth
                  value={testTransaction[field] || ''}
                  onChange={(e) => handleTestTransactionChange(field, e.target.value)}
                  margin="dense"
                />
              </Grid>
            ))}
          </Grid>
          {testResult && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle1">Test Result:</Typography>
              <Typography variant="body1" color={testResult.includes('trigger') ? 'error' : 'success.main'}>
                {testResult}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestDialog}>Close</Button>
          <Button onClick={handleRunTest} variant="contained" disabled={!editingRule}>
            Run Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RuleEditor;