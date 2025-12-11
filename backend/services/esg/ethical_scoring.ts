```typescript
// backend/services/esg/ethical_scoring.ts

import { Portfolio } from '../../models/portfolio';
import { Company } from '../../models/company';
import { EsgCriteria } from '../../models/esg_criteria';

/**
 * Calculates the overall ESG score for a given portfolio.
 *
 * This function aggregates ESG scores for each company within the portfolio,
 * weighting them by the proportion of the portfolio they represent.
 *
 * @param portfolio The portfolio to calculate the ESG score for.
 * @param esgCriteriaMap A map of company ticker to ESG criteria for each company in the portfolio.
 * @returns The overall ESG score for the portfolio, or null if the portfolio is empty or an error occurs.
 */
export function calculatePortfolioEsgScore(portfolio: Portfolio, esgCriteriaMap: Map<string, EsgCriteria>): number | null {
  if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
    return null; // Handle empty portfolio
  }

  let totalWeightedScore = 0;
  let totalPortfolioValue = 0;

  for (const holding of portfolio.holdings) {
    const companyTicker = holding.ticker;
    const companyValue = holding.shares * holding.price; // Assuming 'price' represents the current share price

    if (!esgCriteriaMap.has(companyTicker)) {
      console.warn(`ESG criteria not found for company: ${companyTicker}. Skipping.`);
      continue; // Skip companies without ESG data
    }

    const esgCriteria = esgCriteriaMap.get(companyTicker);

    if (!esgCriteria) {
      console.error(`Error retrieving ESG criteria for company: ${companyTicker}.`);
      return null; // Indicate an error
    }

    const companyEsgScore = calculateCompanyEsgScore(esgCriteria);

    if (companyEsgScore === null) {
      console.warn(`Could not calculate ESG score for company: ${companyTicker}. Skipping.`);
      continue; // Skip companies with invalid ESG data
    }

    const weight = companyValue / portfolio.totalValue; // Weight by proportion of portfolio
    const weightedScore = companyEsgScore * weight;

    totalWeightedScore += weightedScore;
    totalPortfolioValue += companyValue;
  }

  if (totalPortfolioValue === 0) {
    return null; // Prevent division by zero
  }

  return totalWeightedScore;
}

/**
 * Calculates a company's ESG score based on its ESG criteria.
 *
 * This function weights each ESG category (Environmental, Social, Governance)
 * and sums them up to produce an overall ESG score.
 *
 * @param esgCriteria The ESG criteria for the company.
 * @returns The overall ESG score for the company, or null if an error occurs.
 */
export function calculateCompanyEsgScore(esgCriteria: EsgCriteria): number | null {
  if (!esgCriteria) {
    return null; // Handle missing criteria
  }

  const environmentalScore = esgCriteria.environmental;
  const socialScore = esgCriteria.social;
  const governanceScore = esgCriteria.governance;

  if (environmentalScore === null || environmentalScore === undefined ||
      socialScore === null || socialScore === undefined ||
      governanceScore === null || governanceScore === undefined) {
    return null; // Handle cases where ESG data is not available.
  }

  // Define weights for each category (adjust as needed)
  const environmentalWeight = 0.4;
  const socialWeight = 0.3;
  const governanceWeight = 0.3;

  const weightedEsgScore = (
    environmentalScore * environmentalWeight +
    socialScore * socialWeight +
    governanceScore * governanceWeight
  );

  return weightedEsgScore;
}


/**
 * Retrieves ESG criteria for a list of companies. (Placeholder, replace with actual data retrieval)
 *
 * In a real application, this function would fetch ESG data from an external API
 * or database. For this example, it returns dummy data.
 *
 * @param companyTickers An array of company tickers to retrieve ESG criteria for.
 * @returns A map of company ticker to ESG criteria.
 */
export async function getEsgCriteriaForCompanies(companyTickers: string[]): Promise<Map<string, EsgCriteria>> {
  const esgCriteriaMap: Map<string, EsgCriteria> = new Map();

  // Replace with actual data retrieval logic
  for (const ticker of companyTickers) {
    // Simulate fetching ESG data (replace with API call)
    const esgData = await simulateEsgDataFetch(ticker);
    if (esgData) {
      esgCriteriaMap.set(ticker, esgData);
    } else {
      console.warn(`Could not retrieve ESG data for company: ${ticker}`);
    }
  }

  return esgCriteriaMap;
}

/**
 * Simulates fetching ESG data for a company. (For demonstration purposes)
 *
 * @param ticker The ticker symbol of the company.
 * @returns An ESG criteria object or null if no data is found.
 */
async function simulateEsgDataFetch(ticker: string): Promise<EsgCriteria | null> {
  // Simulate a delay to mimic API latency
  await new Promise(resolve => setTimeout(resolve, 50));

  // Dummy data based on ticker
  switch (ticker) {
    case "AAPL":
      return { environmental: 7, social: 8, governance: 9 };
    case "MSFT":
      return { environmental: 8, social: 9, governance: 7 };
    case "GOOGL":
      return { environmental: 9, social: 7, governance: 8 };
    case "TSLA":
      return { environmental: 6, social: 5, governance: 6 };
    default:
      return null; // No data found
  }
}
```