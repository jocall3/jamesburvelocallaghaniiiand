```tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, TextField, Button, Slider, Paper } from '@mui/material';
import { styled } from '@mui/system';

// Styled Components for better UI
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.grey[900], // Dark background
    boxShadow: theme.shadows[3],
}));

const StyledCard = styled(Card)(({ theme }) => ({
    backgroundColor: theme.palette.grey[800], // Darker card background
    color: theme.palette.common.white,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiInputBase-input': {
        color: theme.palette.common.white,
    },
    '& label': {
        color: theme.palette.grey[500],
    },
    '& label.Mui-focused': {
        color: theme.palette.primary.main,
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: theme.palette.grey[700],
        },
        '&:hover fieldset': {
            borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
        },
    },
}));

const StyledSlider = styled(Slider)(({ theme }) => ({
    color: theme.palette.primary.main,
    '& .MuiSlider-thumb': {
        color: theme.palette.secondary.main,
    },
}));


const FractionalReserveView: React.FC = () => {
    const [initialDeposit, setInitialDeposit] = useState<number>(1000);
    const [reserveRatio, setReserveRatio] = useState<number>(10);
    const [moneySupply, setMoneySupply] = useState<number>(initialDeposit);

    useEffect(() => {
        const calculateMoneySupply = () => {
            const multiplier = 1 / (reserveRatio / 100);
            setMoneySupply(initialDeposit * multiplier);
        };

        calculateMoneySupply();
    }, [initialDeposit, reserveRatio]);

    const handleInitialDepositChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(event.target.value);
        setInitialDeposit(isNaN(value) ? 0 : value);
    };

    const handleReserveRatioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(event.target.value);
        setReserveRatio(isNaN(value) ? 0 : value);
    };
    
    const handleInitialDepositSliderChange = (event: Event, newValue: number | number[]) => {
        setInitialDeposit(newValue as number);
    };

    const handleReserveRatioSliderChange = (event: Event, newValue: number | number[]) => {
        setReserveRatio(newValue as number);
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom align="center" color="primary">
                Fractional Reserve Banking
            </Typography>

            <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} md={6}>
                    <StyledPaper elevation={3}>
                        <Typography variant="h6" gutterBottom color="secondary">
                            Initial Deposit: ${initialDeposit.toFixed(2)}
                        </Typography>
                            <StyledSlider
                                value={initialDeposit}
                                onChange={handleInitialDepositSliderChange}
                                min={100}
                                max={5000}
                                step={100}
                                aria-labelledby="initial-deposit-slider"
                            />
                        <StyledTextField
                            label="Initial Deposit ($)"
                            type="number"
                            variant="outlined"
                            fullWidth
                            value={initialDeposit}
                            onChange={handleInitialDepositChange}
                            margin="normal"
                        />
                    </StyledPaper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <StyledPaper elevation={3}>
                        <Typography variant="h6" gutterBottom color="secondary">
                            Reserve Ratio: {reserveRatio.toFixed(2)}%
                        </Typography>
                        <StyledSlider
                            value={reserveRatio}
                            onChange={handleReserveRatioSliderChange}
                            min={1}
                            max={100}
                            step={1}
                            aria-labelledby="reserve-ratio-slider"
                        />

                        <StyledTextField
                            label="Reserve Ratio (%)"
                            type="number"
                            variant="outlined"
                            fullWidth
                            value={reserveRatio}
                            onChange={handleReserveRatioChange}
                            margin="normal"
                        />
                    </StyledPaper>
                </Grid>

                <Grid item xs={12}>
                    <StyledCard elevation={3}>
                        <CardContent>
                            <Typography variant="h5" component="h2" align="center" color="secondary">
                                Potential Money Supply: ${moneySupply.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" align="center">
                                This calculation demonstrates how fractional reserve banking can create a multiple of the initial deposit.
                            </Typography>
                        </CardContent>
                    </StyledCard>
                </Grid>

                <Grid item xs={12}>
                    <StyledPaper elevation={3}>
                        <Typography variant="body1" color="textSecondary">
                            Disclaimer: This is a simplified demonstration. Real-world money supply is affected by many other factors, such as loan demand, bank capital requirements, and central bank policies.
                        </Typography>
                    </StyledPaper>
                </Grid>
            </Grid>
        </div>
    );
};

export default FractionalReserveView;
```