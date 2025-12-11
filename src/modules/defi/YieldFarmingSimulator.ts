```typescript
// src/modules/defi/YieldFarmingSimulator.ts

interface FarmingStrategy {
    name: string;
    apy: number;
    platform: string;
    riskLevel: 'low' | 'medium' | 'high';
}

interface SimulationResult {
    strategy: FarmingStrategy;
    initialInvestment: number;
    timePeriodMonths: number;
    finalValue: number;
    totalInterestEarned: number;
}

class YieldFarmingSimulator {

    /**
     * Simulates the returns from a given yield farming strategy over a specified time period.
     * @param strategy The yield farming strategy to simulate.
     * @param initialInvestment The initial amount to invest.
     * @param timePeriodMonths The time period to simulate in months.
     * @returns A SimulationResult object containing the results of the simulation.
     */
    simulateFarming(strategy: FarmingStrategy, initialInvestment: number, timePeriodMonths: number): SimulationResult {
        const monthlyRate = strategy.apy / 12;
        let finalValue = initialInvestment;
        for (let i = 0; i < timePeriodMonths; i++) {
            finalValue += finalValue * monthlyRate;
        }

        const totalInterestEarned = finalValue - initialInvestment;

        return {
            strategy,
            initialInvestment,
            timePeriodMonths,
            finalValue,
            totalInterestEarned,
        };
    }

    /**
     * Compares multiple yield farming strategies based on their simulated returns.
     * @param strategies An array of yield farming strategies to compare.
     * @param initialInvestment The initial amount to invest in each strategy.
     * @param timePeriodMonths The time period to simulate in months.
     * @returns An array of SimulationResult objects, sorted by final value in descending order.
     */
    compareStrategies(strategies: FarmingStrategy[], initialInvestment: number, timePeriodMonths: number): SimulationResult[] {
        const results: SimulationResult[] = strategies.map(strategy => this.simulateFarming(strategy, initialInvestment, timePeriodMonths));
        return results.sort((a, b) => b.finalValue - a.finalValue);
    }

    /**
     * A simple example to demonstrate usage.
     *  Could be extended to include staking, LP rewards and impermanent loss calculations
     */
    runExample(): void {
        const strategies: FarmingStrategy[] = [
            { name: 'Stablecoin Farming on AAVE', apy: 0.05, platform: 'AAVE', riskLevel: 'low' },
            { name: 'ETH/DAI LP on Uniswap', apy: 0.15, platform: 'Uniswap', riskLevel: 'medium' },
            { name: 'High-Yield Farming on a New Protocol', apy: 0.50, platform: 'Unknown Protocol', riskLevel: 'high' },
        ];

        const initialInvestment = 1000;
        const timePeriodMonths = 12;

        const comparisonResults = this.compareStrategies(strategies, initialInvestment, timePeriodMonths);

        console.log('Yield Farming Strategy Comparison:');
        comparisonResults.forEach(result => {
            console.log(`- Strategy: ${result.strategy.name}`);
            console.log(`  Platform: ${result.strategy.platform}`);
            console.log(`  Risk Level: ${result.strategy.riskLevel}`);
            console.log(`  Final Value after ${timePeriodMonths} months: $${result.finalValue.toFixed(2)}`);
            console.log(`  Total Interest Earned: $${result.totalInterestEarned.toFixed(2)}`);
        });
    }
}

export { YieldFarmingSimulator, FarmingStrategy, SimulationResult };
```