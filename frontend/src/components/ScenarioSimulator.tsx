```typescript
import React, { useState } from 'react';
import { TextField, Button, Typography, Slider, Grid, Paper } from '@mui/material';
import { Portfolio } from '../utils/types';

interface ScenarioSimulatorProps {
    portfolio: Portfolio;
}

const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ portfolio }) => {
    const [inflationRate, setInflationRate] = useState<number>(3);
    const [recessionImpact, setRecessionImpact] = useState<number>(0);

    const calculateScenarioImpact = (): number => {
        let totalValue = portfolio.totalValue;

        // Simulate Inflation
        totalValue *= (1 + (inflationRate / 100));

        // Simulate Recession Impact (simplified)
        totalValue *= (1 - (recessionImpact / 100));

        return totalValue;
    };

    const simulatedValue = calculateScenarioImpact();

    return (
        <Paper elevation={3} style={{ padding: '20px', margin: '20px' }}>
            <Typography variant="h6" gutterBottom>
                Scenario Simulator
            </Typography>

            <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                    <Typography id="inflation-slider" gutterBottom>
                        Inflation Rate (%)
                    </Typography>
                    <Slider
                        value={inflationRate}
                        onChange={(event, newValue) => setInflationRate(newValue as number)}
                        aria-labelledby="inflation-slider"
                        valueLabelDisplay="auto"
                        min={-5}
                        max={20}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography id="recession-slider" gutterBottom>
                        Recession Impact (%)
                    </Typography>
                    <Slider
                        value={recessionImpact}
                        onChange={(event, newValue) => setRecessionImpact(newValue as number)}
                        aria-labelledby="recession-slider"
                        valueLabelDisplay="auto"
                        min={-10}
                        max={30}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="subtitle1">
                        Initial Portfolio Value: ${portfolio.totalValue.toFixed(2)}
                    </Typography>
                    <Typography variant="subtitle1">
                        Simulated Value: ${simulatedValue.toFixed(2)}
                    </Typography>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default ScenarioSimulator;
```