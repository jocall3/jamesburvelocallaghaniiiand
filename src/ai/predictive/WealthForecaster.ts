import { z } from 'zod';

const MarketConditionSchema = z.object({
  name: z.string(),
  description: z.string(),
  annualReturn: z.number().describe('Annual market return rate'),
  volatility: z.number().describe('Annual market volatility'),
  inflationRate: z.number().describe('Annual inflation rate'),
});

const UserChoiceSchema = z.object({
  name: z.string(),
  description: z.string(),
  impactOnSavingsRate: z.number().describe('Percentage change in savings rate'),
  impactOnInvestmentStrategy: z.enum(['conservative', 'moderate', 'aggressive']).describe('Change in investment strategy'),
});

const WealthProjectionInputSchema = z.object({
  initialInvestment: z.number().describe('Initial investment amount'),
  annualContributions: z.number().describe('Annual contribution amount'),
  currentAge: z.number().describe('Current age of the user'),
  retirementAge: z.number().describe('Target retirement age'),
  marketConditions: z.array(MarketConditionSchema).describe('Array of simulated market conditions'),
  userChoices: z.array(UserChoiceSchema).describe('Array of user choices and their impacts'),
});

const WealthProjectionScenarioSchema = z.object({
  scenarioName: z.string(),
  marketCondition: MarketConditionSchema,
  userChoices: z.array(UserChoiceSchema),
  projections: z.array(z.object({
    year: z.number(),
    age: z.number(),
    startingBalance: z.number(),
    contributions: z.number(),
    marketGrowth: z.number(),
    inflationAdjustment: z.number(),
    endingBalance: z.number(),
    purchasingPower: z.number(),
  })),
  summary: z.object({
    finalWealth: z.number(),
    finalPurchasingPower: z.number(),
    yearsToRetirement: z.number(),
  }),
});

export const WealthForecasterSchema = z.object({
  input: WealthProjectionInputSchema,
  scenarios: z.array(WealthProjectionScenarioSchema),
});

export type MarketCondition = z.infer<typeof MarketConditionSchema>;
export type UserChoice = z.infer<typeof UserChoiceSchema>;
export type WealthProjectionInput = z.infer<typeof WealthProjectionInputSchema>;
export type WealthProjectionScenario = z.infer<typeof WealthProjectionScenarioSchema>;
export type WealthForecaster = z.infer<typeof WealthForecasterSchema>;

/**
 * Generates long-term wealth projection scenarios simulating various market conditions and user choices.
 *
 * @param input - The input parameters for wealth forecasting.
 * @returns An object containing multiple wealth projection scenarios.
 */
export function generateWealthProjections(input: WealthProjectionInput): WealthForecaster {
  const scenarios: WealthProjectionScenario[] = [];
  const yearsToRetirement = input.retirementAge - input.currentAge;

  input.marketConditions.forEach(market => {
    input.userChoices.forEach(choice => {
      const projections: WealthProjectionScenario['projections'] = [];
      let currentBalance = input.initialInvestment;
      let currentSavingsRate = 1; // Assuming a base savings rate that gets modified by user choice

      for (let year = 0; year < yearsToRetirement; year++) {
        const currentYearAge = input.currentAge + year;
        const contributions = input.annualContributions * (1 + choice.impactOnSavingsRate);

        // Calculate market growth before inflation
        const marketGrowth = currentBalance * market.annualReturn;

        // Calculate inflation adjustment for the year
        const inflationAdjustment = (currentBalance + contributions + marketGrowth) * market.inflationRate;

        const endingBalance = currentBalance + contributions + marketGrowth - inflationAdjustment;

        projections.push({
          year: year + 1,
          age: currentYearAge + 1,
          startingBalance: currentBalance,
          contributions: contributions,
          marketGrowth: marketGrowth,
          inflationAdjustment: inflationAdjustment,
          endingBalance: endingBalance,
          purchasingPower: endingBalance / Math.pow(1 + market.inflationRate, year + 1),
        });

        currentBalance = endingBalance;
      }

      const finalWealth = currentBalance;
      const finalPurchasingPower = finalWealth / Math.pow(1 + market.inflationRate, yearsToRetirement);

      scenarios.push({
        scenarioName: `${market.name} with ${choice.name}`,
        marketCondition: market,
        userChoices: [choice],
        projections,
        summary: {
          finalWealth,
          finalPurchasingPower,
          yearsToRetirement,
        },
      });
    });
  });

  return {
    input,
    scenarios,
  };
}

export const defaultMarketConditions: MarketCondition[] = [
  {
    name: 'Bull Market',
    description: 'A period of sustained market growth and optimism.',
    annualReturn: 0.12,
    volatility: 0.15,
    inflationRate: 0.03,
  },
  {
    name: 'Bear Market',
    description: 'A period of sustained market decline and pessimism.',
    annualReturn: -0.08,
    volatility: 0.25,
    inflationRate: 0.04,
  },
  {
    name: 'Stagnant Market',
    description: 'A period of little to no market growth.',
    annualReturn: 0.02,
    volatility: 0.10,
    inflationRate: 0.035,
  },
  {
    name: 'Average Market',
    description: 'A typical market performance over a long period.',
    annualReturn: 0.07,
    volatility: 0.18,
    inflationRate: 0.03,
  },
];

export const defaultUserChoices: UserChoice[] = [
  {
    name: 'Aggressive Saving',
    description: 'Increased savings rate and investment in growth-oriented assets.',
    impactOnSavingsRate: 0.10, // 10% increase in savings rate
    impactOnInvestmentStrategy: 'aggressive',
  },
  {
    name: 'Moderate Approach',
    description: 'Balanced savings and investment strategy.',
    impactOnSavingsRate: 0.05, // 5% increase in savings rate
    impactOnInvestmentStrategy: 'moderate',
  },
  {
    name: 'Conservative Strategy',
    description: 'Lower savings rate and focus on capital preservation.',
    impactOnSavingsRate: -0.05, // 5% decrease in savings rate
    impactOnInvestmentStrategy: 'conservative',
  },
];
