```typescript
import React, { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Slider,
  Paper,
  Box,
  AppBar,
  Toolbar,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import ShowChartIcon from '@mui/icons-material/ShowChart';

// --- Type Definitions ---
interface LabState {
  investmentAmount: number;
  tenorYears: number;
  riskFreeRate: number;
  underlyingPrice: number;
  volatility: number;
}

interface PayoffDataPoint {
  underlyingPriceAtMaturity: number;
  underlyingReturn: number;
  ppnReturn: number;
}

// --- Financial Calculation Helpers ---

/**
 * Cumulative Normal Distribution Function (CNDF)
 * Using the Abramowitz and Stegun approximation.
 * @param x The value to calculate the CNDF for.
 * @returns The probability.
 */
const cndf = (x: number): number => {
  const a1 = 0.31938153;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const p = 0.2316419;
  const c = 1.0 / (1.0 + p * Math.abs(x));
  const k = (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp((-x * x) / 2.0);
  const series = c * (a1 + c * (a2 + c * (a3 + c * (a4 + c * a5))));
  
  if (x >= 0) {
    return 1.0 - k * series;
  }
  return k * series;
};

/**
 * Black-Scholes-Merton formula for a European call option price.
 * @param S - Current stock price
 * @param K - Strike price
 * @param T - Time to maturity in years
 * @param r - Risk-free interest rate (annual)
 * @param sigma - Volatility of the stock (annual)
 * @returns The price of the European call option.
 */
const blackScholesCall = (S: number, K: number, T: number, r: number, sigma: number): number => {
  if (T <= 0 || sigma <= 0) return Math.max(0, S - K);
  const rDecimal = r / 100;
  const sigmaDecimal = sigma / 100;

  const d1 = (Math.log(S / K) + (rDecimal + (sigmaDecimal * sigmaDecimal) / 2) * T) / (sigmaDecimal * Math.sqrt(T));
  const d2 = d1 - sigmaDecimal * Math.sqrt(T);

  return S * cndf(d1) - K * Math.exp(-rDecimal * T) * cndf(d2);
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
};

const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
}


// --- Main Component ---

const StructuredProductLab = () => {
  const [inputs, setInputs] = useState<LabState>({
    investmentAmount: 100000,
    tenorYears: 5,
    riskFreeRate: 4.0,
    underlyingPrice: 100,
    volatility: 20,
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputs({
      ...inputs,
      [event.target.name]: event.target.value === '' ? '' : Number(event.target.value),
    });
  };
  
  const handleSliderChange = (name: keyof LabState) => (event: Event, value: number | number[]) => {
    setInputs({
      ...inputs,
      [name]: value,
    });
  };

  const calculations = useMemo(() => {
    const { investmentAmount, tenorYears, riskFreeRate, underlyingPrice, volatility } = inputs;

    if (investmentAmount <= 0 || tenorYears <= 0) {
        return null;
    }
    
    const principalProtectedAmount = investmentAmount;
    const rateDecimal = riskFreeRate / 100;
    
    const zeroCouponBondPrice = principalProtectedAmount / Math.pow(1 + rateDecimal, tenorYears);
    const optionBudget = investmentAmount - zeroCouponBondPrice;

    const strikePrice = underlyingPrice; // At-the-money option
    const callOptionPrice = blackScholesCall(underlyingPrice, strikePrice, tenorYears, riskFreeRate, volatility);
    
    const numberOfOptions = callOptionPrice > 0 ? optionBudget / callOptionPrice : 0;
    const participationRate = (numberOfOptions * underlyingPrice) / investmentAmount;

    const payoffData: PayoffDataPoint[] = [];
    for (let i = -50; i <= 100; i += 5) {
      const changePercent = i / 100;
      const underlyingPriceAtMaturity = underlyingPrice * (1 + changePercent);
      
      const optionPayoff = Math.max(0, underlyingPriceAtMaturity - strikePrice);
      const totalOptionValue = optionPayoff * numberOfOptions;
      
      const ppnValueAtMaturity = zeroCouponBondPrice * Math.pow(1 + rateDecimal, tenorYears) + totalOptionValue;

      payoffData.push({
        underlyingPriceAtMaturity: underlyingPriceAtMaturity,
        underlyingReturn: changePercent * 100,
        ppnReturn: ((ppnValueAtMaturity / investmentAmount) - 1) * 100,
      });
    }

    return {
      zeroCouponBondPrice,
      optionBudget,
      callOptionPrice,
      participationRate,
      payoffData
    };
  }, [inputs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <Typography variant="body2" sx={{fontWeight: 'bold'}}>{`Underlying Return: ${label.toFixed(2)}%`}</Typography>
          <Typography variant="body2" sx={{ color: '#8884d8' }}>{`PPN Return: ${payload[0].value.toFixed(2)}%`}</Typography>
          <Typography variant="body2" sx={{ color: '#82ca9d' }}>{`Underlying Direct: ${payload[1].value.toFixed(2)}%`}</Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <ShowChartIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Structured Product Lab: Principal-Protected Note
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Workbench Inputs
              </Typography>
              <Box component="form" noValidate autoComplete="off">
                <TextField
                  label="Total Investment"
                  name="investmentAmount"
                  type="number"
                  value={inputs.investmentAmount}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                
                <Typography gutterBottom sx={{ mt: 2 }}>Tenor ({inputs.tenorYears} years)</Typography>
                <Slider
                  name="tenorYears"
                  value={inputs.tenorYears}
                  onChange={handleSliderChange('tenorYears')}
                  aria-labelledby="tenor-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={10}
                />

                <Typography gutterBottom sx={{ mt: 2 }}>Risk-Free Rate ({formatPercent(inputs.riskFreeRate)})</Typography>
                <Slider
                  name="riskFreeRate"
                  value={inputs.riskFreeRate}
                  onChange={handleSliderChange('riskFreeRate')}
                  aria-labelledby="rate-slider"
                  valueLabelDisplay="auto"
                  step={0.1}
                  min={0}
                  max={10}
                />
                
                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Underlying Asset Assumptions
                </Typography>
                <TextField
                  label="Current Price"
                  name="underlyingPrice"
                  type="number"
                  value={inputs.underlyingPrice}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                 <Typography gutterBottom sx={{ mt: 2 }}>Implied Volatility ({formatPercent(inputs.volatility)})</Typography>
                 <Slider
                   name="volatility"
                   value={inputs.volatility}
                   onChange={handleSliderChange('volatility')}
                   aria-labelledby="volatility-slider"
                   valueLabelDisplay="auto"
                   step={1}
                   min={5}
                   max={60}
                 />

              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payoff Diagram at Maturity
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={calculations?.payoffData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="underlyingReturn" 
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(tick) => `${tick}%`}
                        label={{ value: 'Underlying Asset Return at Maturity', position: 'insideBottom', offset: -15 }}
                    />
                    <YAxis 
                        tickFormatter={(tick) => `${tick}%`}
                        label={{ value: 'Investment Return', angle: -90, position: 'insideLeft', offset: -10 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36}/>
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="5 5" />
                    <ReferenceLine x={0} stroke="#666" strokeDasharray="5 5" />
                    <Line
                      type="monotone"
                      dataKey="ppnReturn"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="PPN"
                      dot={false}
                    />
                     <Line
                      type="linear"
                      dataKey="underlyingReturn"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Underlying Direct"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Note Structure & Key Metrics
                </Typography>
                {calculations && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1" color="text.secondary">Allocation</Typography>
                            <Typography><strong>Zero-Coupon Bond:</strong> {formatCurrency(calculations.zeroCouponBondPrice)}</Typography>
                            <Typography><strong>Option Budget:</strong> {formatCurrency(calculations.optionBudget)}</Typography>
                            <Typography><strong>Total Investment:</strong> {formatCurrency(inputs.investmentAmount)}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1" color="text.secondary">Performance</Typography>
                            <Typography><strong>Principal Protection:</strong> 100%</Typography>
                            <Typography><strong>Upside Participation:</strong> {formatPercent(calculations.participationRate * 100)}</Typography>
                            <Typography><strong>At-the-Money Call Price:</strong> {formatCurrency(calculations.callOptionPrice)}</Typography>
                        </Grid>
                    </Grid>
                )}
            </Paper>

          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default StructuredProductLab;

```