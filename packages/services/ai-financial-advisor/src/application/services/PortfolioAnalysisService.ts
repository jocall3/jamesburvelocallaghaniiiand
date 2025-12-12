import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../../infrastructure/services/OpenAiService';
import { Portfolio } from '../../domain/models/Portfolio';
import { AssetAllocationRecommendation } from '../../domain/models/AssetAllocationRecommendation';
import { RiskTolerance } from '../../domain/enums/RiskTolerance';
import { MarketDataService } from './MarketDataService';
import { FinancialNewsService } from './FinancialNewsService';

@Injectable()
export class PortfolioAnalysisService {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly marketDataService: MarketDataService,
    private readonly financialNewsService: FinancialNewsService,
  ) {}

  async analyzePortfolio(
    portfolio: Portfolio,
    riskTolerance: RiskTolerance,
  ): Promise<AssetAllocationRecommendation> {
    // 1. Fetch Market Data for Portfolio Assets
    const assetData = await this.marketDataService.getMarketDataForAssets(
      portfolio.assets.map((asset) => asset.ticker),
    );

    // 2. Fetch Relevant Financial News
    const news = await this.financialNewsService.getFinancialNews(
      portfolio.assets.map((asset) => asset.ticker),
    );

    // 3. Construct Prompt for OpenAI
    const prompt = this.constructPrompt(portfolio, riskTolerance, assetData, news);

    // 4. Call OpenAI Service
    const aiResponse = await this.openAiService.generateText(prompt);

    // 5. Parse OpenAI Response (Error Handling Required)
    try {
      const recommendation = this.parseAiResponse(aiResponse);
      return recommendation;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Provide a default or fallback recommendation in case of parsing failure
      return {
        recommendedAllocation: {
          cash: 0.2,
          stocks: 0.6,
          bonds: 0.2,
        },
        rationale:
          'AI analysis failed. Providing a default moderate risk allocation.',
      };
    }
  }

  private constructPrompt(
    portfolio: Portfolio,
    riskTolerance: RiskTolerance,
    assetData: any[], // Replace 'any' with a more specific type if possible
    news: any[], // Replace 'any' with a more specific type if possible
  ): string {
    // Construct a detailed prompt for OpenAI, including:
    // - Portfolio composition (asset types, quantities)
    // - Risk tolerance
    // - Market data for each asset (price, volatility, etc.)
    // - Recent financial news related to the assets

    const portfolioSummary = `Portfolio contains: ${portfolio.assets
      .map((asset) => `${asset.quantity} shares of ${asset.ticker}`)
      .join(', ')}.`;
    const riskToleranceStatement = `The investor has a risk tolerance of ${riskTolerance}.`;
    const marketDataSummary = `Market data: ${JSON.stringify(assetData)}`; // Consider formatting this better
    const newsSummary = `Recent news: ${JSON.stringify(news)}`; // Consider formatting this better

    return `Analyze the following investment portfolio and provide an asset allocation recommendation.
      ${portfolioSummary}
      ${riskToleranceStatement}
      ${marketDataSummary}
      ${newsSummary}

      Provide a recommended asset allocation (percentages for cash, stocks, bonds, and other asset classes if applicable) and a brief rationale for the recommendation.
      Format the response as a JSON object with 'recommendedAllocation' and 'rationale' fields.
      Example:
      {
        "recommendedAllocation": {
          "cash": 0.1,
          "stocks": 0.7,
          "bonds": 0.2
        },
        "rationale": "Based on the portfolio composition, risk tolerance, and market conditions, a shift towards stocks is recommended."
      }
    `;
  }

  private parseAiResponse(aiResponse: string): AssetAllocationRecommendation {
    // Parse the JSON response from OpenAI and return an AssetAllocationRecommendation object.
    // Implement error handling to catch invalid JSON or unexpected data formats.

    try {
      const parsedResponse = JSON.parse(aiResponse);

      if (
        typeof parsedResponse === 'object' &&
        parsedResponse !== null &&
        'recommendedAllocation' in parsedResponse &&
        'rationale' in parsedResponse
      ) {
        return {
          recommendedAllocation: parsedResponse.recommendedAllocation,
          rationale: parsedResponse.rationale,
        };
      } else {
        throw new Error('Invalid AI response format.');
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response.');
    }
  }
}