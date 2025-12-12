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

// --- Internal Data Generation Functions ---

const generateRandomPrice = (base: number, volatility: number = 0.05): number => {
  return Math.max(0.01, base + (Math.random() - 0.5) * base * volatility);
};

const generateRandomDate = (daysAhead: number = 30): string => {
  const today = new Date();
  const futureDate = new Date(today.setDate(today.getDate() + Math.floor(Math.random() * daysAhead)));
  return futureDate.toISOString().split('T')[0];
};

const generateOptionData = (count: number): Option[] => {
  const symbols = ['AAPL', 'GOOG', 'TSLA', 'MSFT', 'AMZN'];
  const initialOptions: Option[] = [];
  for (let i = 0; i < count; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const strike = Math.floor(Math.random() * 500) + 50;
    const optionType = Math.random() > 0.5 ? 'call' : 'put';
    const underlyingPrice = generateRandomPrice(100, 0.1);
    const bid = generateRandomPrice(strike * 0.02, 0.1);
    const ask = bid + generateRandomPrice(0.1, 0.05);
    initialOptions.push({
      id: String(Date.now() + i),
      symbol: symbol,
      expiry: generateRandomDate(90),
      strike: strike,
      optionType: optionType,
      bid: bid,
      ask: ask,
      underlyingPrice: underlyingPrice,
    });
  }
  return initialOptions;
};

// --- Business Model Definition ---
// Citibankdemobusinessinc.options.tradingdesk

const OptionsTradingDesk: React.FC = () => {
  const [options, setOptions] = useState<Option[]>(generateOptionData(6)); // Use generated data
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

  // --- Internal Generative Data Functions ---
  const simulateMarketUpdates = () => {
    setOptions(prevOptions => {
      return prevOptions.map(option => ({
        ...option,
        bid: generateRandomPrice(option.bid, 0.02),
        ask: generateRandomPrice(option.ask, 0.02),
        underlyingPrice: generateRandomPrice(option.underlyingPrice, 0.01),
      }));
    });
  };

  useEffect(() => {
    const intervalId = setInterval(simulateMarketUpdates, 3000);
    return () => clearInterval(intervalId);
  }, []);

  // --- Input Handling ---
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setNewOption((prevOption) => ({
      ...prevOption,
      [name]: value,
    }));
  };

  const handleSelectChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setNewOption((prevOption) => ({
      ...prevOption,
      [name as keyof typeof prevOption]: value,
    }));
  };

  // --- Core Business Logic ---
  const addOption = () => {
    if (
      !newOption.symbol ||
      !newOption.expiry ||
      !newOption.strike ||
      !newOption.optionType ||
      !newOption.bid ||
      !newOption.ask ||
      !newOption.underlyingPrice
    ) {
      showSnackbar('Please fill in all fields.', 'error');
      return;
    }

    const newOptionWithId: Option = { ...newOption, id: String(Date.now()) };
    setOptions([...options, newOptionWithId]);
    resetNewOptionForm();
    showSnackbar('Option added successfully!', 'success');
  };

  const deleteOption = (id: string) => {
    setOptions(options.filter((option) => option.id !== id));
    showSnackbar('Option deleted successfully!', 'success');
  };

  const executeTrade = () => {
    if (!selectedOption) {
      showSnackbar('No option selected for trading.', 'error');
      return;
    }

    if (tradeQuantity <= 0) {
      showSnackbar('Invalid trade quantity.', 'error');
      return;
    }

    const tradePrice = tradeType === 'buy' ? selectedOption.ask : selectedOption.bid;
    console.log(`Executing ${tradeType} of ${tradeQuantity} ${selectedOption.symbol} ${selectedOption.optionType} options at strike ${selectedOption.strike} for $${tradePrice} each.`);

    showSnackbar(`Trade executed: ${tradeType} ${tradeQuantity} ${selectedOption.symbol} at $${tradePrice.toFixed(2)}`, 'success');
    setSelectedOption(null);
  };

  // --- UI Helpers ---
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const resetNewOptionForm = () => {
    setNewOption({
      symbol: '',
      expiry: '',
      strike: 0,
      optionType: 'call',
      bid: 0,
      ask: 0,
      underlyingPrice: 0,
    });
  };

  const filteredOptions = options.filter((option) =>
    option.symbol.toLowerCase().includes(filterSymbol.toLowerCase())
  );

  // --- Mission Statement ---
  const missionStatement = "To democratize options trading by providing an intuitive, data-driven, and secure platform for retail and institutional investors, fostering financial literacy and enabling sophisticated trading strategies.";

  // --- Monetization Paths ---
  const monetizationPaths = [
    "Transaction fees on executed trades.",
    "Premium subscription tiers for advanced analytics and real-time data feeds.",
    "API access for institutional clients and algorithmic traders.",
    "Data licensing for market research and financial institutions.",
    "White-labeling solutions for other financial platforms."
  ];

  // --- Defensible IP Moats ---
  const ipMoats = [
    "Proprietary algorithms for real-time option pricing and risk assessment.",
    "Unique generative data models for simulating market scenarios and backtesting strategies.",
    "Patented user interface for intuitive option selection and trade execution.",
    "Secure, self-hosted infrastructure designed for high-frequency trading.",
    "Integrated compliance and regulatory reporting automation."
  ];

  // --- Auto-scaling Architecture ---
  const autoScalingArchitecture = "Leverages containerization (Docker) and orchestration (Kubernetes) for seamless scaling. Microservices architecture allows independent scaling of components like data ingestion, trading engine, and user interface. Cloud-agnostic design ensures deployment flexibility across major cloud providers or on-premise.";

  // --- Regulatory Alignment ---
  const regulatoryAlignment = "Built-in modules for SEC, FINRA, and CFTC compliance. Automated generation of trade blotters, audit trails, and suspicious activity reports. Real-time monitoring for insider trading and market manipulation patterns. Dynamic adaptation to evolving regulatory landscapes.";

  return (
    <Box sx={{ flexGrow: 1, padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Citibankdemobusinessinc.options.tradingdesk
      </Typography>
      <Typography variant="h6" gutterBottom color="textSecondary">
        {missionStatement}
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
            <Button variant="contained" color="primary" onClick={addOption}>
              Add Option
            </Button>
          </Grid>
        </Grid>
      </StyledPaper>

      <StyledPaper>
        <Typography variant="h6">Option Market Data</Typography>
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
                    <Button color="secondary" onClick={(e) => { e.stopPropagation(); deleteOption(option.id); }}>
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
            <Typography gutterBottom>
              Selected Option: {selectedOption.symbol} {selectedOption.expiry} {selectedOption.optionType} {selectedOption.strike} (Underlying: {selectedOption.underlyingPrice.toFixed(2)})
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
                <Button variant="contained" color="primary" onClick={executeTrade}>
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

      {/* --- Additional Business Model Components (Placeholders) --- */}
      <StyledPaper>
        <Typography variant="h6">Monetization Paths</Typography>
        <ul>
          {monetizationPaths.map((path, index) => <li key={index}>{path}</li>)}
        </ul>
      </StyledPaper>

      <StyledPaper>
        <Typography variant="h6">Defensible IP Moats</Typography>
        <ul>
          {ipMoats.map((moat, index) => <li key={index}>{moat}</li>)}
        </ul>
      </StyledPaper>

      <StyledPaper>
        <Typography variant="h6">Auto-scaling Architecture</Typography>
        <Typography>{autoScalingArchitecture}</Typography>
      </StyledPaper>

      <StyledPaper>
        <Typography variant="h6">Regulatory Alignment</Typography>
        <Typography>{regulatoryAlignment}</Typography>
      </StyledPaper>
    </Box>
  );
};

export default OptionsTradingDesk;