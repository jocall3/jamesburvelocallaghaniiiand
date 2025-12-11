import { SentimentAnalysisClient } from '@google-cloud/language';

export class SentimentAnalyzer {
  private client: SentimentAnalysisClient;

  constructor() {
    this.client = new SentimentAnalysisClient();
  }

  /**
   * Analyzes the sentiment of a given text.
   *
   * @param text The text to analyze.
   * @returns A Promise that resolves to the sentiment score and magnitude of the text.
   */
  async analyzeSentiment(text: string): Promise<{ score: number; magnitude: number }> {
    const document = {
      content: text,
      type: 'PLAIN_TEXT',
    } as any;

    try {
      const [result] = await this.client.analyzeSentiment({ document });
      const sentiment = result.documentSentiment;

      if (!sentiment) {
        throw new Error('Sentiment analysis failed to return a result.');
      }

      return {
        score: sentiment.score ?? 0,
        magnitude: sentiment.magnitude ?? 0,
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }

  /**
   * Analyzes the sentiment of multiple transaction descriptions.
   *
   * @param transactions An array of transaction objects, each with a description.
   * @returns A Promise that resolves to an array of sentiment analysis results for each transaction.
   */
  async analyzeTransactionsSentiment(
    transactions: { description: string }[]
  ): Promise<{ description: string; score: number; magnitude: number }[]> {
    const results = [];
    for (const transaction of transactions) {
      if (transaction.description) {
        const sentiment = await this.analyzeSentiment(transaction.description);
        results.push({
          description: transaction.description,
          score: sentiment.score,
          magnitude: sentiment.magnitude,
        });
      }
    }
    return results;
  }

  /**
   * Analyzes the sentiment of a news article related to financial markets.
   *
   * @param newsArticle The news article object, expected to have a content field.
   * @returns A Promise that resolves to the sentiment analysis result for the news article.
   */
  async analyzeNewsSentiment(newsArticle: {
    content: string;
  }): Promise<{ score: number; magnitude: number }> {
    if (!newsArticle || !newsArticle.content) {
      throw new Error('News article content is missing.');
    }
    return this.analyzeSentiment(newsArticle.content);
  }
}
