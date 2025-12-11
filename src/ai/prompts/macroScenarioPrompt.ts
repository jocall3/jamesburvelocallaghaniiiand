```typescript
import { MacroEconomicScenario } from "../types/macroEconomicScenario";

export const macroScenarioPrompts: MacroEconomicScenario[] = [
  {
    name: "Inflation Spike",
    description: "A sudden and sharp increase in inflation rates across the economy.",
    factors: [
      {
        name: "Consumer Price Index (CPI)",
        impact: "High positive",
        scenario: "Sudden surge in CPI, exceeding historical averages significantly.",
        timeframe: "Short to medium term (3-12 months)",
        drivers: [
          "Supply chain disruptions",
          "Geopolitical events",
          "Increased consumer demand",
          "Commodity price shocks",
        ],
      },
      {
        name: "Producer Price Index (PPI)",
        impact: "High positive",
        scenario: "Significant rise in PPI, indicating rising costs for businesses.",
        timeframe: "Short to medium term (3-9 months)",
        drivers: [
          "Rising raw material costs",
          "Increased energy prices",
          "Wage pressures",
        ],
      },
      {
        name: "Interest Rates",
        impact: "High positive (initially), then potentially negative",
        scenario: "Central bank aggressively raises interest rates to combat inflation.",
        timeframe: "Medium to long term (6-24 months)",
        drivers: [
          "Monetary policy response to inflation",
          "Inflation expectations",
        ],
      },
      {
        name: "Unemployment Rate",
        impact: "Slightly negative to neutral",
        scenario: "Unemployment may initially dip due to increased economic activity, but could rise if aggressive rate hikes lead to a slowdown.",
        timeframe: "Medium term (6-18 months)",
        drivers: [
          "Economic growth trajectory",
          "Monetary policy tightening",
        ],
      },
      {
        name: "GDP Growth",
        impact: "Negative (stagflation risk)",
        scenario: "Slowing or negative GDP growth concurrent with high inflation.",
        timeframe: "Medium to long term (9-24 months)",
        drivers: [
          "Reduced consumer spending due to inflation",
          "Increased borrowing costs",
          "Business investment slowdown",
        ],
      },
      {
        name: "Exchange Rates",
        impact: "Variable",
        scenario: "Currency may appreciate due to higher interest rates, or depreciate due to economic instability and loss of confidence.",
        timeframe: "Short to medium term (3-12 months)",
        drivers: [
          "Interest rate differentials",
          "Economic outlook",
          "Capital flows",
        ],
      },
      {
        name: "Commodity Prices",
        impact: "High positive",
        scenario: "Surge in prices of key commodities like oil, gas, and metals.",
        timeframe: "Short term (1-6 months)",
        drivers: [
          "Geopolitical tensions",
          "Supply disruptions",
          "Increased demand",
        ],
      },
    ],
    potentialOutcomes: [
      "Stagflation: A period of high inflation and stagnant economic growth.",
      "Recession: A significant decline in economic activity, potentially triggered by aggressive monetary tightening.",
      "Erosion of purchasing power: Consumers' ability to buy goods and services diminishes.",
      "Increased volatility in financial markets.",
      "Shift towards inflation-protected assets.",
    ],
  },
  {
    name: "Deflationary Spiral",
    description: "A sustained period of falling prices, leading to decreased consumer spending and economic contraction.",
    factors: [
      {
        name: "Consumer Price Index (CPI)",
        impact: "High negative",
        scenario: "Persistent and significant decline in CPI, with expectations of further price drops.",
        timeframe: "Medium to long term (12-36 months)",
        drivers: [
          "Weak consumer demand",
          "Technological advancements leading to lower production costs",
          "Excessive debt deleveraging",
          "Tight monetary policy",
        ],
      },
      {
        name: "Producer Price Index (PPI)",
        impact: "High negative",
        scenario: "Sustained decrease in PPI, reflecting declining costs for businesses.",
        timeframe: "Medium term (6-18 months)",
        drivers: [
          "Falling demand for goods and services",
          "Increased competition",
        ],
      },
      {
        name: "Interest Rates",
        impact: "Low or negative",
        scenario: "Central bank maintains very low or negative interest rates to stimulate demand.",
        timeframe: "Long term (24+ months)",
        drivers: [
          "Inability to stimulate inflation",
          "Desire to encourage borrowing and spending",
        ],
      },
      {
        name: "Unemployment Rate",
        impact: "High positive",
        scenario: "Rising unemployment as businesses cut back production and jobs.",
        timeframe: "Medium to long term (12-36 months)",
        drivers: [
          "Reduced business revenue",
          "Cost-cutting measures",
        ],
      },
      {
        name: "GDP Growth",
        impact: "Strong negative",
        scenario: "Prolonged and severe economic contraction.",
        timeframe: "Long term (18-48 months)",
        drivers: [
          "Reduced consumer and business spending",
          "Decreased investment",
          "Debt burden increases in real terms",
        ],
      },
      {
        name: "Exchange Rates",
        impact: "Variable, potentially depreciating",
        scenario: "Currency may depreciate due to weak economic fundamentals and low interest rates.",
        timeframe: "Medium term (6-18 months)",
        drivers: [
          "Economic weakness",
          "Capital outflows",
        ],
      },
      {
        name: "Commodity Prices",
        impact: "Negative",
        scenario: "Falling commodity prices due to weak global demand.",
        timeframe: "Medium to long term (6-24 months)",
        drivers: [
          "Low industrial activity",
          "Reduced consumer spending",
        ],
      },
    ],
    potentialOutcomes: [
      "Debt crisis: The real value of debt increases, making repayment harder.",
      "Consumer and business reluctance to spend or invest.",
      "Increased risk of bankruptcies.",
      "Challenges for central banks to stimulate the economy.",
      "Shift towards real assets and hard currencies.",
    ],
  },
  {
    name: "Supply Chain Crisis",
    description: "Widespread disruptions in the production and transportation of goods, leading to shortages and price increases.",
    factors: [
      {
        name: "Consumer Price Index (CPI)",
        impact: "Moderate to high positive",
        scenario: "Price increases for goods due to shortages and higher transportation costs.",
        timeframe: "Short to medium term (3-9 months)",
        drivers: [
          "Port congestion",
          "Labor shortages in logistics",
          "Geopolitical events affecting production",
          "Natural disasters",
        ],
      },
      {
        name: "Producer Price Index (PPI)",
        impact: "Moderate to high positive",
        scenario: "Rising costs for businesses due to input shortages and logistics challenges.",
        timeframe: "Short to medium term (3-9 months)",
        drivers: [
          "Increased cost of raw materials",
          "Higher shipping and freight costs",
        ],
      },
      {
        name: "Interest Rates",
        impact: "Neutral to slightly positive",
        scenario: "Central banks may cautiously raise rates if inflation becomes persistent, but might hold if the cause is seen as temporary.",
        timeframe: "Medium term (6-12 months)",
        drivers: [
          "Inflationary pressures",
          "Assessment of supply chain issues' persistence",
        ],
      },
      {
        name: "Unemployment Rate",
        impact: "Variable",
        scenario: "May increase in sectors heavily reliant on disrupted supply chains, but could decrease in logistics-related jobs.",
        timeframe: "Short to medium term (3-9 months)",
        drivers: [
          "Sector-specific impacts",
          "Labor market flexibility",
        ],
      },
      {
        name: "GDP Growth",
        impact: "Negative",
        scenario: "Reduced economic output due to inability to produce and deliver goods.",
        timeframe: "Short to medium term (3-9 months)",
        drivers: [
          "Production bottlenecks",
          "Lower consumer demand for unavailable goods",
        ],
      },
      {
        name: "Exchange Rates",
        impact: "Variable",
        scenario: "May be influenced by a country's reliance on imports or its export capacity.",
        timeframe: "Short term (1-6 months)",
        drivers: [
          "Trade balance impacts",
          "Global supply chain dynamics",
        ],
      },
      {
        name: "Commodity Prices",
        impact: "Positive",
        scenario: "Increased prices for transportation fuels and raw materials.",
        timeframe: "Short term (1-6 months)",
        drivers: [
          "Higher shipping costs",
          "Demand for specific raw materials",
        ],
      },
    ],
    potentialOutcomes: [
      "Persistent shortages of specific goods.",
      "Increased business operating costs.",
      "Reshoring or nearshoring initiatives.",
      "Greater focus on supply chain resilience and diversification.",
      "Potential for inflationary pressures to linger even after disruptions ease.",
    ],
  },
  {
    name: "Geopolitical Shock",
    description: "A major international conflict or political event with significant global economic repercussions.",
    factors: [
      {
        name: "Commodity Prices",
        impact: "High positive (especially energy and food)",
        scenario: "Sudden and sharp increase in prices due to supply disruptions or sanctions.",
        timeframe: "Short to medium term (1-9 months)",
        drivers: [
          "Conflict in major producing regions",
          "Trade restrictions and sanctions",
          "Disruption of trade routes",
        ],
      },
      {
        name: "Consumer Price Index (CPI)",
        impact: "High positive",
        scenario: "Inflation rises rapidly due to increased costs of energy, food, and imported goods.",
        timeframe: "Short to medium term (3-12 months)",
        drivers: [
          "Higher commodity prices",
          "Supply chain disruptions",
          "Increased uncertainty affecting business investment",
        ],
      },
      {
        name: "Interest Rates",
        impact: "High positive",
        scenario: "Central banks rapidly increase interest rates to combat soaring inflation.",
        timeframe: "Medium term (6-18 months)",
        drivers: [
          "Aggressive response to inflation",
          "Need to stabilize currency",
        ],
      },
      {
        name: "Unemployment Rate",
        impact: "Variable, potentially negative",
        scenario: "Could increase due to economic slowdown caused by higher rates and reduced trade, or decrease in defense-related sectors.",
        timeframe: "Medium term (6-18 months)",
        drivers: [
          "Economic contraction",
          "Sectoral shifts",
        ],
      },
      {
        name: "GDP Growth",
        impact: "Strong negative",
        scenario: "Significant slowdown or contraction in global economic growth.",
        timeframe: "Medium to long term (9-24 months)",
        drivers: [
          "Reduced trade and investment",
          "Higher costs for businesses and consumers",
          "Increased uncertainty",
        ],
      },
      {
        name: "Exchange Rates",
        impact: "High volatility, potential safe-haven flows",
        scenario: "Currencies of involved nations may depreciate, while safe-haven currencies (e.g., USD, CHF) may appreciate.",
        timeframe: "Short to medium term (3-12 months)",
        drivers: [
          "Risk aversion",
          "Sanctions and trade impacts",
          "Monetary policy divergence",
        ],
      },
      {
        name: "Investor Sentiment",
        impact: "Strong negative",
        scenario: "Widespread fear and uncertainty leading to a flight from riskier assets.",
        timeframe: "Short to medium term (1-6 months)",
        drivers: [
          "Uncertainty about conflict duration and escalation",
          "Economic fallout",
        ],
      },
    ],
    potentialOutcomes: [
      "Global recession.",
      "Significant shifts in global trade patterns and alliances.",
      "Increased defense spending and potential for further conflict.",
      "Heightened risk of financial instability.",
      "Long-term changes in energy and food security policies.",
    ],
  },
];
```