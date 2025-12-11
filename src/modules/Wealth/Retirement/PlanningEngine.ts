```typescript
import { Asset, Contribution, Inflation } from "./types";

interface PlanningEngineConfig {
  assets: Asset[];
  contributions: Contribution[];
  inflation: Inflation;
  retirementAge: number;
  currentAge: number;
  desiredAnnualIncome: number;
}

interface Projection {
  year: number;
  age: number;
  assetsAtEndOfYear: number;
  incomeFromAssets: number;
  totalIncome: number;
}

export class PlanningEngine {
  private config: PlanningEngineConfig;

  constructor(config: PlanningEngineConfig) {
    this.config = config;
  }

  public calculateRetirementProjection(): Projection[] {
    const projections: Projection[] = [];
    let currentAssets = this.calculateInitialAssets();
    let currentAge = this.config.currentAge;
    const retirementYear = this.config.retirementAge - this.config.currentAge;

    for (let year = 0; currentAge <= this.config.retirementAge; year++) {
      const assetGrowthRate = 1 + this.config.inflation.assetGrowthRate;
      const inflationRate = 1 + this.config.inflation.rate;

      const annualContributions = this.config.contributions
        .filter(c => c.startYear <= year && c.endYear >= year)
        .reduce((sum, c) => sum + c.amount, 0);

      const incomeFromAssets = currentAssets * this.config.inflation.assetGrowthRate;
      const totalIncome = incomeFromAssets + annualContributions;

      currentAssets = (currentAssets + annualContributions) * assetGrowthRate - incomeFromAssets;
      currentAssets = Math.max(0, currentAssets); // Ensure assets don't go negative

      projections.push({
        year: year,
        age: currentAge,
        assetsAtEndOfYear: currentAssets,
        incomeFromAssets: incomeFromAssets,
        totalIncome: totalIncome,
      });

      currentAge++;
    }

    return projections;
  }

  private calculateInitialAssets(): number {
    return this.config.assets.reduce((sum, asset) => sum + asset.value, 0);
  }
}
```