```typescript
export interface EconomicScenario {
  name: string;
  description: string;
  applyScenario: (data: any) => any; // The 'any' type should ideally be replaced with specific data structures
}

// Example Scenario: Inflation Spike
export const inflationSpike: EconomicScenario = {
  name: "Inflation Spike",
  description: "Simulates a sudden increase in inflation.",
  applyScenario: (data: any) => {
    // Example: Increase all expense categories by a certain percentage
    const inflationRate = 0.05; // 5% inflation
    const updatedData = { ...data };

    if (updatedData.expenses) {
      updatedData.expenses = updatedData.expenses.map((expense: any) => ({
        ...expense,
        amount: expense.amount * (1 + inflationRate),
      }));
    }

    return updatedData;
  },
};

// Example Scenario: Market Crash
export const marketCrash: EconomicScenario = {
  name: "Market Crash",
  description: "Simulates a significant downturn in the financial markets.",
  applyScenario: (data: any) => {
    // Example: Reduce investment values by a certain percentage
    const crashRate = 0.30; // 30% market crash
    const updatedData = { ...data };

    if (updatedData.investments) {
      updatedData.investments = updatedData.investments.map((investment: any) => ({
        ...investment,
        value: investment.value * (1 - crashRate),
      }));
    }

    return updatedData;
  },
};


// Example Scenario: Unemployment Increase
export const unemploymentIncrease: EconomicScenario = {
    name: "Unemployment Increase",
    description: "Simulates a period of increased unemployment.",
    applyScenario: (data: any) => {
        // Example: Reduce income or add unemployment expenses
        const unemploymentRate = 0.10; // Assume 10% chance of unemployment
        const updatedData = { ...data };

        // A simplistic model: if "employed", reduce income by some amount.
        if (updatedData.employmentStatus === "employed") {
          if (Math.random() < unemploymentRate) {
              // Simulate job loss - reduce income drastically (or set to 0)
              updatedData.income = updatedData.income * 0.2; // Reduced to 20% (e.g. unemployment benefits)
              updatedData.employmentStatus = "unemployed";
              // Optionally, add unemployment-related expenses
              if (!updatedData.expenses){
                updatedData.expenses = [];
              }
              updatedData.expenses.push({
                  name: "Unemployment Expenses",
                  amount: 500, //Example amount
                  category: "Emergency",
              });
          }
        }
        return updatedData;
    }
};

// Add more scenarios as needed (e.g., interest rate hike, housing market decline)

export const availableScenarios: EconomicScenario[] = [
  inflationSpike,
  marketCrash,
  unemploymentIncrease,
];
```