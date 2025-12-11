```tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Components for Enhanced UI
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

interface Option {
  id: string;
  symbol: string;
  expiry: string;
  strike: number;
  optionType: 'call' | 'put';
  bid: number;
  ask: number;
  underlyingPrice: number; // Added underlying price
}

const initialOptions: Option[] = [
  { id: '1', symbol: 'AAPL', expiry: '2024-03-15', strike: 170, optionType: 'call', bid: 2.50, ask: 2.75, underlyingPrice: 172.00 },
  { id: '2', symbol: 'AAPL', expiry: '2024-03-15', strike: 170, optionType: 'put', bid: 1.80, ask: 2.00, underlyingPrice: 172.00 },
  { id: '3', symbol: 'GOOG', expiry: '2024-03-22', strike: 2500, optionType: 'call', bid: 15.20, ask: 15.50, underlyingPrice: 2495.50 },
  { id: '4', symbol: 'GOOG', expiry: '2024-03-22', strike: 2500, optionType: 'put', bid: 20.50, ask: 20.80, underlyingPrice: 2495.50 },
  { id: '5', symbol: 'TSLA', expiry: '2024-03-08', strike: 850, optionType: 'call', bid: 8.10, ask: 8.40, underlyingPrice: 848.20 },
  { id: '6', symbol: 'TSLA', expiry: '2024-03-08', strike: 850, optionType: 'put', bid: 10.30, ask: 10.60, underlyingPrice: 848.20 },
];


const OptionsTradingDesk: React.FC = () => {
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const [newOption, setNewOption] = useState<Omit<Option, 'id'>>({
    symbol: '',
    expiry: '',
    strike: 0,
    optionType: 'call',
    bid: 0,
    ask: 0,
    underlyingPrice: 0,
  });
  const [filterSymbol, setFilterSymbol] = useState<string>('');
  const [tradeQuantity, setTradeQuantity] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');


  useEffect(() => {
    // Simulate live updates (e.g., from a WebSocket)
    const intervalId = setInterval(() => {
      setOptions(prevOptions => {
        return prevOptions.map(option => ({
          ...option,
          bid: Math.max(0.01, option.bid + (Math.random() - 0.5) * 0.2), // Simulate bid changes
          ask: Math.max(0.01, option.ask + (Math.random() - 0.5) * 0.2), // Simulate ask changes
          underlyingPrice: option.underlyingPrice + (Math.random() - 0.5) * 1,
        }));
      });
    }, 3000);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNewOption((prevOption) => ({
      ...prevOption,
      [name]: value,
    }));
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    setNewOption((prevOption) => ({
      ...prevOption,
      [name]: value,
    }));
  };


  const handleAddOption = () => {
    if (
      !newOption.symbol ||
      !newOption.expiry ||
      !newOption.strike ||
      !newOption.optionType ||
      !newOption.bid ||
      !newOption.ask ||
      !newOption.underlyingPrice
    ) {
      setSnackbarMessage('Please fill in all fields.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const newId = String(Date.now());
    const newOptionWithId: Option = { ...newOption, id: newId };
    setOptions([...options, newOptionWithId]);
    setNewOption({
      symbol: '',
      expiry: '',
      strike: 0,
      optionType: 'call',
      bid: 0,
      ask: 0,
      underlyingPrice: 0,
    });

    setSnackbarMessage('Option added successfully!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleDeleteOption = (id: string) => {
    setOptions(options.filter((option) => option.id !== id));
    setSnackbarMessage('Option deleted successfully!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const filteredOptions = options.filter((option) =>
    option.symbol.toLowerCase().includes(filterSymbol.toLowerCase())
  );

  const handleSnackbarClose = (event: Event | React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };


  const handleTradeExecution = () => {
    if (!selectedOption) {
      setSnackbarMessage('No option selected for trading.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (tradeQuantity <= 0) {
      setSnackbarMessage('Invalid trade quantity.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Simulate Trade Execution
    const tradePrice = tradeType === 'buy' ? selectedOption.ask : selectedOption.bid;

    // In a real application, this would interact with a backend service
    console.log(`Executing ${tradeType} of ${tradeQuantity} ${selectedOption.symbol} ${selectedOption.optionType} options at strike ${selectedOption.strike} for $${tradePrice} each.`);

    setSnackbarMessage(`Trade executed: ${tradeType} ${tradeQuantity} ${selectedOption.symbol} at $${tradePrice.toFixed(2)}`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    setSelectedOption(null); // Clear selection after trade
  };


  return (
    <Box sx={{ flexGrow: 1, padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Options Trading Desk
      </Typography>

      <StyledPaper>
        <Typography variant="h6">Add New Option</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Symbol"
              name="symbol"
              value={newOption.symbol}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Expiry Date"
              name="expiry"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={newOption.expiry}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Strike Price"
              name="strike"
              type="number"
              value={newOption.strike === 0 ? '' : newOption.strike}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel id="option-type-label">Option Type</InputLabel>
              <Select
                labelId="option-type-label"
                id="optionType"
                name="optionType"
                value={newOption.optionType}
                label="Option Type"
                onChange={handleSelectChange}
              >
                <MenuItem value="call">Call</MenuItem>
                <MenuItem value="put">Put</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Bid Price"
              name="bid"
              type="number"
              value={newOption.bid === 0 ? '' : newOption.bid}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Ask Price"
              name="ask"
              type="number"
              value={newOption.ask === 0 ? '' : newOption.ask}
              onChange={handleInputChange}
            />
          </Grid>
           <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Underlying Price"
              name="underlyingPrice"
              type="number"
              value={newOption.underlyingPrice === 0 ? '' : newOption.underlyingPrice}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button variant="contained" color="primary" onClick={handleAddOption}>
              Add Option
            </Button>
          </Grid>
        </Grid>
      </StyledPaper>

      <StyledPaper>
        <Typography variant="h6">Filter Options</Typography>
        <TextField
          fullWidth
          label="Filter by Symbol"
          value={filterSymbol}
          onChange={(e) => setFilterSymbol(e.target.value)}
          sx={{ marginBottom: 2 }}
        />

        <StyledTableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="options table">
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell align="right">Expiry</TableCell>
                <TableCell align="right">Strike</TableCell>
                <TableCell align="right">Type</TableCell>
                <TableCell align="right">Bid</TableCell>
                <TableCell align="right">Ask</TableCell>
                <TableCell align="right">Underlying</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOptions.map((option) => (
                <TableRow
                  key={option.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
                  onClick={() => setSelectedOption(option)}
                  selected={selectedOption?.id === option.id}
                >
                  <TableCell component="th" scope="row">
                    {option.symbol}
                  </TableCell>
                  <TableCell align="right">{option.expiry}</TableCell>
                  <TableCell align="right">{option.strike}</TableCell>
                  <TableCell align="right">{option.optionType}</TableCell>
                  <TableCell align="right">{option.bid.toFixed(2)}</TableCell>
                  <TableCell align="right">{option.ask.toFixed(2)}</TableCell>
                  <TableCell align="right">{option.underlyingPrice.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Button color="secondary" onClick={() => handleDeleteOption(option.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </StyledPaper>

      <StyledPaper>
        <Typography variant="h6">Trade Execution</Typography>
        {selectedOption ? (
          <>
            <Typography>
              Selected Option: {selectedOption.symbol} {selectedOption.expiry} {selectedOption.optionType} {selectedOption.strike}
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel id="trade-type-label">Trade Type</InputLabel>
                  <Select
                    labelId="trade-type-label"
                    id="tradeType"
                    value={tradeType}
                    label="Trade Type"
                    onChange={(e) => setTradeType(e.target.value as 'buy' | 'sell')}
                  >
                    <MenuItem value="buy">Buy</MenuItem>
                    <MenuItem value="sell">Sell</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary" onClick={handleTradeExecution}>
                  Execute Trade
                </Button>
              </Grid>
            </Grid>
          </>
        ) : (
          <Typography>No option selected for trading. Please select a row from the table.</Typography>
        )}
      </StyledPaper>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OptionsTradingDesk;
```