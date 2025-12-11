```typescript
import { SovereignRiskFactors } from "../types/SovereignRiskFactors";

export class SovereignRiskModel {
  private static readonly WEIGHTS = {
    debtToGdp: -0.4,
    inflationRate: -0.3,
    interestRate: -0.2,
    politicalStability: 0.3,
    economicGrowth: 0.2,
  };

  /**
   * Calculates the Sovereign Implied Risk Score (SIRS) based on provided risk factors.
   *
   * @param factors - An object containing the sovereign risk factors.
   * @returns The calculated SIRS score.
   */
  public predictSirs(factors: SovereignRiskFactors): number {
    let sirs = 0;

    // Weighted sum of risk factors
    sirs += factors.debtToGdp * SovereignRiskModel.WEIGHTS.debtToGdp;
    sirs += factors.inflationRate * SovereignRiskModel.WEIGHTS.inflationRate;
    sirs += factors.interestRate * SovereignRiskModel.WEIGHTS.interestRate;
    sirs += factors.politicalStability * SovereignRiskModel.WEIGHTS.politicalStability;
    sirs += factors.economicGrowth * SovereignRiskModel.WEIGHTS.economicGrowth;

    // Normalize the score to a common range, e.g., 0-100
    // This is a simple normalization and might need adjustment based on expected factor ranges.
    // For now, let's assume a basic scaling.
    // A more sophisticated approach would involve analyzing historical data to define score ranges.
    const minScore = -1.4; // Estimated minimum possible score based on weights and plausible factor ranges
    const maxScore = 1.0; // Estimated maximum possible score
    const range = maxScore - minScore;

    let normalizedSirs = ((sirs - minScore) / range) * 100;

    // Clamp the score to ensure it stays within the 0-100 range
    normalizedSirs = Math.max(0, Math.min(100, normalizedSirs));

    return normalizedSirs;
  }
}
```