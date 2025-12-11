interface TailRiskMetrics {
    /** Excess kurtosis: Positive indicates fatter tails (higher risk of extreme outcomes). */
    excessKurtosis: number;
    /** Largest peak-to-trough decline over the period (0 to 1). */
    maxDrawdown: number;
    /** Number of return events exceeding 3 standard deviations (Z-score > 3). */
    extremeEventCount: number;
    /** Measures overall vulnerability (0-100), higher score implies higher tail risk. */
    tailVulnerabilityScore: number;
}

/**
 * Analytical logic designed to detect vulnerability to black swan events and 
 * extreme market conditions based on historical returns data.
 * 
 * The analysis relies on historical return series data (e.g., daily returns).
 */
export class TailRiskAnalyzer {
    private returns: number[];

    /**
     * Initializes the analyzer with a series of historical returns.
     * @param returns An array of numerical returns (e.g., [-0.01, 0.02, ...])
     */
    constructor(returns: number[]) {
        if (!returns || returns.length === 0) {
            this.returns = [];
        } else {
            // Ensure returns are numerical
            this.returns = returns.map(r => Number(r));
        }
    }

    private static calculateMean(data: number[]): number {
        if (data.length === 0) return 0;
        return data.reduce((sum, value) => sum + value, 0) / data.length;
    }

    private static calculateStdDev(data: number[], mean: number): number {
        if (data.length <= 1) return 0;
        // Sample standard deviation
        const variance = data.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (data.length - 1);
        return Math.sqrt(variance);
    }

    private static calculateKurtosis(data: number[], mean: number, stdDev: number): number {
        if (data.length < 4 || stdDev === 0) return 0; 
        
        const n = data.length;
        let sumFourthPower = 0;
        for (const value of data) {
            sumFourthPower += (value - mean) ** 4;
        }
        
        const M4 = sumFourthPower / n;
        const varianceSquared = stdDev ** 4;
        
        // Calculate Excess Kurtosis (Kurtosis - 3)
        return (varianceSquared !== 0) ? (M4 / varianceSquared) - 3 : 0; 
    }

    private static calculateMaxDrawdown(returns: number[]): number {
        if (returns.length === 0) return 0;

        let maxDrawdown = 0;
        let peakValue = 1; 
        let cumulativeValue = 1;

        for (const ret of returns) {
            cumulativeValue *= (1 + ret);
            peakValue = Math.max(peakValue, cumulativeValue);
            
            const drawdown = (peakValue - cumulativeValue) / peakValue;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        }
        
        return maxDrawdown; 
    }

    private getStatistics(): { mean: number, stdDev: number } {
        const mean = TailRiskAnalyzer.calculateMean(this.returns);
        const stdDev = TailRiskAnalyzer.calculateStdDev(this.returns, mean);
        return { mean, stdDev };
    }

    private countExtremeEvents(mean: number, stdDev: number, threshold: number = 3): number {
        if (stdDev === 0) return 0;
        
        const thresholdValue = threshold * stdDev;
        let count = 0;
        for (const ret of this.returns) {
            // Check if return is outside +/- threshold standard deviations from the mean
            if (Math.abs(ret - mean) > thresholdValue) {
                count++;
            }
        }
        return count;
    }

    /**
     * Calculates composite tail vulnerability score (0-100).
     * This is a heuristic score using scaled weightings for demonstration purposes.
     */
    private calculateVulnerabilityScore(metrics: Omit<TailRiskMetrics, 'tailVulnerabilityScore'>): number {
        const { excessKurtosis, maxDrawdown, extremeEventCount } = metrics;
        
        // 1. Kurtosis contribution: Higher positive excess kurtosis means fatter tails.
        const effectiveKurtosis = Math.max(0, excessKurtosis); 
        // Max contribution 50: (e.g., Excess Kurtosis 10 * 5 = 50)
        const kurtosisContribution = Math.min(50, effectiveKurtosis * 5); 

        // 2. Max Drawdown contribution: Larger drawdown implies higher historical loss potential.
        // Max contribution 40: (e.g., Drawdown 40% * 100 / 100 * 100 = 40)
        const drawdownContribution = Math.min(40, maxDrawdown * 100); 

        // 3. Extreme Event count contribution: Frequency of high-sigma events.
        // Max contribution 10: (e.g., 5 events * 2 = 10)
        const eventContribution = Math.min(10, extremeEventCount * 2);

        const score = kurtosisContribution + drawdownContribution + eventContribution;
        
        return Math.round(Math.min(100, Math.max(0, score)));
    }

    /**
     * Analyzes historical returns to determine vulnerability to extreme market conditions.
     * @returns TailRiskMetrics object containing various risk metrics.
     */
    public analyze(): TailRiskMetrics {
        if (this.returns.length === 0 || this.returns.length < 2) {
            return {
                excessKurtosis: 0,
                maxDrawdown: 0,
                extremeEventCount: 0,
                tailVulnerabilityScore: 0,
            };
        }

        const { mean, stdDev } = this.getStatistics();
        
        const excessKurtosis = TailRiskAnalyzer.calculateKurtosis(this.returns, mean, stdDev);
        const maxDrawdown = TailRiskAnalyzer.calculateMaxDrawdown(this.returns);
        const extremeEventCount = this.countExtremeEvents(mean, stdDev, 3);

        const metrics: Omit<TailRiskMetrics, 'tailVulnerabilityScore'> = {
            excessKurtosis,
            maxDrawdown,
            extremeEventCount,
        };

        const tailVulnerabilityScore = this.calculateVulnerabilityScore(metrics);

        return {
            ...metrics,
            tailVulnerabilityScore
        };
    }
}

export { TailRiskMetrics };
```