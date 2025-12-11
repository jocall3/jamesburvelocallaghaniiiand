```tsx
import React, { useState } from 'react';
import { Typography, Grid, TextField, Button, Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';

interface BondData {
  isin: string;
  cusip: string;
  issuer: string;
  sector: string;
  maturityDate: string;
  amount: number; // In USD
  price: number;
  yield: number;
  // Add other relevant bond data fields here
}

interface ComplianceResult {
  bond: BondData;
  complianceStatus: 'Compliant' | 'Non-Compliant' | 'Requires Review';
  reason?: string;
}

const ComplianceOracleView: React.FC = () => {
  const [bondData, setBondData] = useState<BondData[]>([]);
  const [isinInput, setIsinInput] = useState('');
  const [complianceResults, setComplianceResults] = useState<ComplianceResult[]>([]);

  // Sample Investment Mandates (replace with actual mandates)
  const mandates = {
    'Sovereign': { // Example: Max 30% allocation to Sovereign bonds
      maxAllocation: 0.30,
    },
    'Retail':{
        maxAllocation: 0.20,
    },
    'Other':{
        maxAllocation: 0.5,
    }
  };


  const fetchBondData = async (isin: string) => {
    // In a real application, you would fetch bond data from a backend API or database
    // For this example, we'll use hardcoded data.
    const mockData: { [key: string]: BondData } = {
      'US912796P781': {
        isin: 'US912796P781',
        cusip: '912796P7',
        issuer: 'USA',
        sector: 'Sovereign',
        maturityDate: '2021-12-21',
        amount: 68759029200,
        price: 99.8,
        yield: 0.005,
      },
      // Add more mock bond data here
    };

    return mockData[isin];
  };

  const handleIsinInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsinInput(event.target.value);
  };

  const handleAddBond = async () => {
    if (!isinInput) {
      alert('Please enter an ISIN.');
      return;
    }

    const bond = await fetchBondData(isinInput);

    if (!bond) {
      alert('Bond not found.');
      return;
    }

    setBondData(prevData => [...prevData, bond]);
    setIsinInput('');
  };


  const checkCompliance = (bond: BondData): ComplianceResult => {
      let complianceStatus: 'Compliant' | 'Non-Compliant' | 'Requires Review' = 'Compliant';
      let reason = '';

      //Simple checks based on sector
      if (bond.sector && mandates[bond.sector]) {
          const totalAmountInvestedInSector = bondData.filter(b => b.sector === bond.sector).reduce((sum, b) => sum + b.amount, 0) + bond.amount;
          const totalPortfolioValue = bondData.reduce((sum, b) => sum + b.amount, 0) + bond.amount;
          const sectorAllocation = totalPortfolioValue > 0 ? totalAmountInvestedInSector / totalPortfolioValue : 0;
          if (sectorAllocation > mandates[bond.sector].maxAllocation) {
              complianceStatus = 'Non-Compliant';
              reason = `Exceeds maximum allocation for ${bond.sector}. Current: ${sectorAllocation.toFixed(2)}, Max: ${mandates[bond.sector].maxAllocation}`;
          }
      }

      // Add more compliance checks here based on your mandates

      return { bond, complianceStatus, reason };
  };

  const runComplianceChecks = () => {
      const results = bondData.map(bond => checkCompliance(bond));
      setComplianceResults(results);
  };


  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h5" gutterBottom>
        Compliance Oracle
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <TextField
            label="Enter ISIN"
            variant="outlined"
            value={isinInput}
            onChange={handleIsinInputChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Button variant="contained" onClick={handleAddBond}>
            Add Bond
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ISIN</TableCell>
              <TableCell>Issuer</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell>Maturity Date</TableCell>
              <TableCell>Amount (USD)</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Yield</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bondData.map((bond, index) => (
              <TableRow key={index}>
                <TableCell>{bond.isin}</TableCell>
                <TableCell>{bond.issuer}</TableCell>
                <TableCell>{bond.sector}</TableCell>
                <TableCell>{bond.maturityDate}</TableCell>
                <TableCell>{bond.amount.toLocaleString()}</TableCell>
                <TableCell>{bond.price}</TableCell>
                <TableCell>{bond.yield.toFixed(3)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button variant="contained" color="primary" onClick={runComplianceChecks} sx={{ marginTop: 2 }}>
        Run Compliance Checks
      </Button>

      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ISIN</TableCell>
              <TableCell>Compliance Status</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {complianceResults.map((result, index) => (
              <TableRow key={index}>
                <TableCell>{result.bond.isin}</TableCell>
                <TableCell>{result.complianceStatus}</TableCell>
                <TableCell>{result.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ComplianceOracleView;
```