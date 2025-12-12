import { MarketPrediction } from '../../domain/entities/MarketPrediction';
import { MarketPredictionRequest } from '../../domain/value-objects/MarketPredictionRequest';

export interface MarketPredictionClient {
  /**
   * Predicts the market trend based on the provided request.
   *
   * @param request The market prediction request.
   * @returns A promise that resolves to a MarketPrediction object.
   * @throws Error if the prediction fails.
   */
  predictMarketTrend(request: MarketPredictionRequest): Promise<MarketPrediction>;
}

export class MockMarketPredictionClient implements MarketPredictionClient {
  async predictMarketTrend(request: MarketPredictionRequest): Promise<MarketPrediction> {
    // Simulate a prediction based on the request.  This is a very basic mock.
    const { ticker, timeframe } = request;
    const now = new Date();
    const predictionDate = new Date(now.getTime() + (timeframe === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)); // Predict 1 day or 1 week ahead

    let predictedPriceChange: number;
    let confidence: number;

    // Very basic logic - could be expanded significantly
    if (ticker.startsWith('AAPL')) {
      predictedPriceChange = 0.01 * Math.random(); // Slightly positive
      confidence = 0.7 + 0.1 * Math.random();
    } else if (ticker.startsWith('GME')) {
      predictedPriceChange = (Math.random() - 0.5) * 0.2; // Volatile
      confidence = 0.3 + 0.2 * Math.random();
    } else {
      predictedPriceChange = (Math.random() - 0.5) * 0.05; // Moderate
      confidence = 0.5 + 0.2 * Math.random();
    }

    const prediction: MarketPrediction = {
      ticker: ticker,
      predictionDate: predictionDate,
      predictedPriceChange: predictedPriceChange,
      confidence: confidence,
    };

    return prediction;
  }
}