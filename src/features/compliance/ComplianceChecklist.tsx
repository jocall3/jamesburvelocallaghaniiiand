```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ComplianceChecklistProps } from './ComplianceChecklist.types';
import { getApps } from '../../services/appService';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Typography,
    Paper,
    CircularProgress,
} from '@mui/material';

const ComplianceChecklist: React.FC<ComplianceChecklistProps> = ({ governancePolicies }) => {
    const [checkedItems, setCheckedItems] = useState<{ [key: string]: { [policyId: string]: boolean } }>({});
    const { isLoading, error, data } = useQuery({
        queryKey: ['apps'],
        queryFn: getApps,
    });

    const handleCheckboxChange = (appId: string, policyId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setCheckedItems(prev => {
            const appState = { ...prev[appId], [policyId]: event.target.checked };
            return { ...prev, [appId]: appState };
        });
    };

    if (isLoading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography color="error">Error loading data</Typography>;
    }

    if (!data || data.length === 0) {
        return <Typography>No apps found.</Typography>;
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="compliance checklist table">
                <TableHead>
                    <TableRow>
                        <TableCell>App Name</TableCell>
                        {governancePolicies.map(policy => (
                            <TableCell key={policy.id}>{policy.name}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map(app => (
                        <TableRow key={app.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row">
                                {app.displayName}
                            </TableCell>
                            {governancePolicies.map(policy => (
                                <TableCell key={`${app.id}-${policy.id}`} align="center">
                                    <Checkbox
                                        checked={checkedItems[app.id]?.[policy.id] || false}
                                        onChange={handleCheckboxChange(app.id, policy.id)}
                                        inputProps={{ 'aria-label': `checkbox for ${app.displayName} - ${policy.name}` }}
                                    />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ComplianceChecklist;
```