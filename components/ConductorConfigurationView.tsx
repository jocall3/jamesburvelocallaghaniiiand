import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Grid, Card, CardContent, IconButton, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ConductorConfigurationView: React.FC = () => {
    const [rules, setRules] = useState<any[]>([]);
    const [newRule, setNewRule] = useState<any>({
        name: '',
        description: '',
        priority: 1,
        conditions: [{ field: '', operator: '=', value: '' }],
        actions: [{ type: '', value: '' }]
    });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState<any>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Mock API calls (replace with actual API calls)
    useEffect(() => {
        // Fetch rules on component mount
        const fetchRules = async () => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            setRules([
                { id: 'rule-1', name: 'High Priority Payments', description: 'Route high priority payments to immediate processing', priority: 1, conditions: [{ field: 'payment.priority', operator: '=', value: 'HIGH' }], actions: [{ type: 'ROUTING', value: 'IMMEDIATE_QUEUE' }] },
                { id: 'rule-2', name: 'Low Value Transactions', description: 'Route low value transactions to batch processing', priority: 3, conditions: [{ field: 'payment.amount', operator: '<', value: '100' }], actions: [{ type: 'ROUTING', value: 'BATCH_PROCESSING' }] },
            ]);
        };
        fetchRules();
    }, []);

    const handleAddRule = () => {
        setRules([...rules, { ...newRule, id: `rule-${Date.now()}` }]);
        setNewRule({ name: '', description: '', priority: 1, conditions: [{ field: '', operator: '=', value: '' }], actions: [{ type: '', value: '' }] });
    };

    const handleEditRule = (rule: any) => {
        setCurrentRule({ ...rule });
        setEditingIndex(rules.findIndex(r => r.id === rule.id));
        setEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (currentRule && editingIndex !== null) {
            const updatedRules = [...rules];
            updatedRules[editingIndex] = currentRule;
            setRules(updatedRules);
            setEditDialogOpen(false);
            setCurrentRule(null);
            setEditingIndex(null);
        }
    };

    const handleDeleteRule = (ruleId: string) => {
        setRules(rules.filter(rule => rule.id !== ruleId));
    };

    const handleConditionChange = (index: number, field: string, value: string) => {
        if (currentRule) {
            const updatedConditions = [...currentRule.conditions];
            updatedConditions[index] = { ...updatedConditions[index], [field]: value };
            setCurrentRule({ ...currentRule, conditions: updatedConditions });
        }
    };

    const handleActionChange = (index: number, field: string, value: string) => {
        if (currentRule) {
            const updatedActions = [...currentRule.actions];
            updatedActions[index] = { ...updatedActions[index], [field]: value };
            setCurrentRule({ ...currentRule, actions: updatedActions });
        }
    };

    const addCondition = () => {
        if (currentRule) {
            setCurrentRule({ ...currentRule, conditions: [...currentRule.conditions, { field: '', operator: '=', value: '' }] });
        }
    };

    const addAction = () => {
        if (currentRule) {
            setCurrentRule({ ...currentRule, actions: [...currentRule.actions, { type: '', value: '' }] });
        }
    };

    const removeCondition = (index: number) => {
        if (currentRule) {
            const updatedConditions = currentRule.conditions.filter((_, i) => i !== index);
            setCurrentRule({ ...currentRule, conditions: updatedConditions });
        }
    };

    const removeAction = (index: number) => {
        if (currentRule) {
            const updatedActions = currentRule.actions.filter((_, i) => i !== index);
            setCurrentRule({ ...currentRule, actions: updatedActions });
        }
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) {
            return;
        }
        const reorderedRules = Array.from(rules);
        const [movedRule] = reorderedRules.splice(result.source.index, 1);
        reorderedRules.splice(result.destination.index, 0, movedRule);
        setRules(reorderedRules);
    };

    const handleNewRuleChange = (field: string, value: string | number) => {
        setNewRule({ ...newRule, [field]: value });
    };

    const handleNewRuleConditionChange = (index: number, field: string, value: string) => {
        const updatedConditions = [...newRule.conditions];
        updatedConditions[index] = { ...updatedConditions[index], [field]: value };
        setNewRule({ ...newRule, conditions: updatedConditions });
    };

    const handleNewRuleActionChange = (index: number, field: string, value: string) => {
        const updatedActions = [...newRule.actions];
        updatedActions[index] = { ...updatedActions[index], [field]: value };
        setNewRule({ ...newRule, actions: updatedActions });
    };

    const addNewConditionToNewRule = () => {
        setNewRule({ ...newRule, conditions: [...newRule.conditions, { field: '', operator: '=', value: '' }] });
    };

    const addNewActionToNewRule = () => {
        setNewRule({ ...newRule, actions: [...newRule.actions, { type: '', value: '' }] });
    };

    const removeNewRuleCondition = (index: number) => {
        const updatedConditions = newRule.conditions.filter((_, i) => i !== index);
        setNewRule({ ...newRule, conditions: updatedConditions });
    };

    const removeNewRuleAction = (index: number) => {
        const updatedActions = newRule.actions.filter((_, i) => i !== index);
        setNewRule({ ...newRule, actions: updatedActions });
    };


    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Conductor Configuration
            </Typography>
            <Typography variant="body1" gutterBottom>
                Define the rules, priorities, and routing logic for the AI Payment Orchestrator.
            </Typography>

            <Box sx={{ my: 3, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>Add New Routing Rule</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid xs={12} sm={4}>
                        <TextField
                            label="Rule Name"
                            value={newRule.name}
                            onChange={(e) => handleNewRuleChange('name', e.target.value)}
                            fullWidth
                        />
                    </Grid>
                    <Grid xs={12} sm={2}>
                        <TextField
                            label="Priority"
                            type="number"
                            value={newRule.priority}
                            onChange={(e) => handleNewRuleChange('priority', parseInt(e.target.value, 10))}
                            fullWidth
                        />
                    </Grid>
                    <Grid xs={12}>
                        <TextField
                            label="Description"
                            value={newRule.description}
                            onChange={(e) => handleNewRuleChange('description', e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </Grid>
                    {newRule.conditions.map((cond: any, index: number) => (
                        <Grid container spacing={1} key={index} alignItems="center" sx={{ mt: 1 }}>
                            <Grid xs={5}>
                                <TextField
                                    label="Condition Field"
                                    value={cond.field}
                                    onChange={(e) => handleNewRuleConditionChange(index, 'field', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={2}>
                                <TextField
                                    label="Operator"
                                    value={cond.operator}
                                    onChange={(e) => handleNewRuleConditionChange(index, 'operator', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={4}>
                                <TextField
                                    label="Value"
                                    value={cond.value}
                                    onChange={(e) => handleNewRuleConditionChange(index, 'value', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={1}>
                                <IconButton onClick={() => removeNewRuleCondition(index)} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                    ))}
                    <Grid xs={12}>
                        <Button startIcon={<AddCircleOutlineIcon />} onClick={addNewConditionToNewRule} variant="outlined" size="small">Add Condition</Button>
                    </Grid>

                    {newRule.actions.map((action: any, index: number) => (
                        <Grid container spacing={1} key={index} alignItems="center" sx={{ mt: 1 }}>
                            <Grid xs={5}>
                                <TextField
                                    label="Action Type"
                                    value={action.type}
                                    onChange={(e) => handleNewRuleActionChange(index, 'type', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={6}>
                                <TextField
                                    label="Action Value"
                                    value={action.value}
                                    onChange={(e) => handleNewRuleActionChange(index, 'value', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={1}>
                                <IconButton onClick={() => removeNewRuleAction(index)} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                    ))}
                    <Grid xs={12}>
                        <Button startIcon={<AddCircleOutlineIcon />} onClick={addNewActionToNewRule} variant="outlined" size="small">Add Action</Button>
                    </Grid>
                </Grid>
                <Button variant="contained" onClick={handleAddRule} sx={{ mt: 2 }}>Add Rule</Button>
            </Box>

            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Existing Routing Rules
            </Typography>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="rules-list">
                    {(provided) => (
                        <Grid container spacing={2} ref={provided.innerRef} {...provided.droppableProps}>
                            {rules.length === 0 && (
                                <Grid xs={12}>
                                    <Typography>No rules defined yet. Add a new rule to get started.</Typography>
                                </Grid>
                            )}
                            {rules.map((rule, index) => (
                                <Grid xs={12} sm={6} lg={4} key={rule.id}>
                                    <Draggable draggableId={rule.id} index={index}>
                                        {(provided) => (
                                            <Card
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                sx={{ minHeight: 250, position: 'relative' }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                        <Typography variant="h6" component="div">
                                                            {rule.name}
                                                        </Typography>
                                                        <DragIndicatorIcon sx={{ opacity: 0.6, fontSize: 18 }} />
                                                    </Box>
                                                    <Typography sx={{ fontSize: 14, mb: 1 }} color="text.secondary">
                                                        Priority: {rule.priority}
                                                    </Typography>
                                                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                                        {rule.description}
                                                    </Typography>
                                                    <Typography variant="subtitle2">Conditions:</Typography>
                                                    <ul>
                                                        {rule.conditions.map((cond: any, condIndex: number) => (
                                                            <li key={condIndex}>
                                                                {cond.field} {cond.operator} {cond.value}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <Typography variant="subtitle2">Actions:</Typography>
                                                    <ul>
                                                        {rule.actions.map((action: any, actionIndex: number) => (
                                                            <li key={actionIndex}>
                                                                {action.type}: {action.value}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                                <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                                                    <IconButton onClick={() => handleEditRule(rule)} color="primary" size="small">
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton onClick={() => handleDeleteRule(rule.id)} color="error" size="small">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Card>
                                        )}
                                    </Draggable>
                                </Grid>
                            ))}
                            {provided.placeholder}
                        </Grid>
                    )}
                </Droppable>
            </DragDropContext>

            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Edit Routing Rule</DialogTitle>
                <DialogContent>
                    {currentRule && (
                        <Grid container spacing={2}>
                            <Grid xs={12} sm={6}>
                                <TextField
                                    label="Rule Name"
                                    value={currentRule.name}
                                    onChange={(e) => setCurrentRule({ ...currentRule, name: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={12} sm={2}>
                                <TextField
                                    label="Priority"
                                    type="number"
                                    value={currentRule.priority}
                                    onChange={(e) => setCurrentRule({ ...currentRule, priority: parseInt(e.target.value, 10) })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid xs={12}>
                                <TextField
                                    label="Description"
                                    value={currentRule.description}
                                    onChange={(e) => setCurrentRule({ ...currentRule, description: e.target.value })}
                                    fullWidth
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid xs={12}>
                                <Typography variant="h6">Conditions</Typography>
                                {currentRule.conditions.map((cond: any, index: number) => (
                                    <Grid container spacing={1} key={index} alignItems="center" sx={{ mt: 1 }}>
                                        <Grid xs={5}>
                                            <TextField
                                                label="Field"
                                                value={cond.field}
                                                onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid xs={2}>
                                            <TextField
                                                label="Operator"
                                                value={cond.operator}
                                                onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid xs={4}>
                                            <TextField
                                                label="Value"
                                                value={cond.value}
                                                onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid xs={1}>
                                            <IconButton onClick={() => removeCondition(index)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button startIcon={<AddCircleOutlineIcon />} onClick={addCondition} variant="outlined" size="small" sx={{ mt: 1 }}>Add Condition</Button>
                            </Grid>

                            <Grid xs={12}>
                                <Typography variant="h6">Actions</Typography>
                                {currentRule.actions.map((action: any, index: number) => (
                                    <Grid container spacing={1} key={index} alignItems="center" sx={{ mt: 1 }}>
                                        <Grid xs={5}>
                                            <TextField
                                                label="Action Type"
                                                value={action.type}
                                                onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid xs={6}>
                                            <TextField
                                                label="Action Value"
                                                value={action.value}
                                                onChange={(e) => handleActionChange(index, 'value', e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid xs={1}>
                                            <IconButton onClick={() => removeAction(index)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button startIcon={<AddCircleOutlineIcon />} onClick={addAction} variant="outlined" size="small" sx={{ mt: 1 }}>Add Action</Button>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ConductorConfigurationView;