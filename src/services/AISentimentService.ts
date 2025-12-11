import { IssuerSentiment } from '../models/IssuerSentiment';

export class AISentimentService {
    private issuerSentimentMap: Map<string, IssuerSentiment>;

    constructor() {
        this.issuerSentimentMap = new Map<string, IssuerSentiment>();
    }

    /**
     * Analyzes a news headline and determines the sentiment (bullish/bearish) for a given issuer.
     * This is a placeholder implementation and would typically involve a more sophisticated NLP model.
     *
     * @param headline The news headline to analyze.
     * @param issuerName The name of the issuer to analyze the sentiment for.
     * @returns A string representing the sentiment ('bullish', 'bearish', or 'neutral').
     */
    public analyzeSentiment(headline: string, issuerName: string): 'bullish' | 'bearish' | 'neutral' {
        const lowerHeadline = headline.toLowerCase();
        let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';

        // Simple keyword-based sentiment analysis (placeholder)
        const bullishKeywords = ['positive', 'growth', 'increase', 'strong', 'record', 'surges', 'outperforms', 'buy'];
        const bearishKeywords = ['negative', 'decline', 'decrease', 'weak', 'loss', 'falls', 'underperforms', 'sell'];

        if (bullishKeywords.some(keyword => lowerHeadline.includes(keyword))) {
            sentiment = 'bullish';
        } else if (bearishKeywords.some(keyword => lowerHeadline.includes(keyword))) {
            sentiment = 'bearish';
        }

        // Update the issuer's overall sentiment
        this.updateIssuerSentiment(issuerName, sentiment);

        return sentiment;
    }

    /**
     * Updates the aggregated sentiment for a given issuer.
     * In a real-world scenario, this might involve averaging sentiment scores or using a weighted average.
     *
     * @param issuerName The name of the issuer.
     * @param sentiment The sentiment of the latest news.
     */
    private updateIssuerSentiment(issuerName: string, sentiment: 'bullish' | 'bearish' | 'neutral'): void {
        if (!this.issuerSentimentMap.has(issuerName)) {
            this.issuerSentimentMap.set(issuerName, {
                bullishCount: 0,
                bearishCount: 0,
                neutralCount: 0,
                overallSentiment: 'neutral'
            });
        }

        const currentSentiment = this.issuerSentimentMap.get(issuerName)!;

        switch (sentiment) {
            case 'bullish':
                currentSentiment.bullishCount++;
                break;
            case 'bearish':
                currentSentiment.bearishCount++;
                break;
            case 'neutral':
                currentSentiment.neutralCount++;
                break;
        }

        // Determine overall sentiment based on counts (simple majority)
        if (currentSentiment.bullishCount > currentSentiment.bearishCount && currentSentiment.bullishCount > currentSentiment.neutralCount) {
            currentSentiment.overallSentiment = 'bullish';
        } else if (currentSentiment.bearishCount > currentSentiment.bullishCount && currentSentiment.bearishCount > currentSentiment.neutralCount) {
            currentSentiment.overallSentiment = 'bearish';
        } else {
            currentSentiment.overallSentiment = 'neutral';
        }
    }

    /**
     * Retrieves the aggregated sentiment for a given issuer.
     *
     * @param issuerName The name of the issuer.
     * @returns The IssuerSentiment object, or undefined if the issuer is not found.
     */
    public getIssuerSentiment(issuerName: string): IssuerSentiment | undefined {
        return this.issuerSentimentMap.get(issuerName);
    }

    /**
     * Clears all stored sentiment data.
     */
    public clearSentimentData(): void {
        this.issuerSentimentMap.clear();
    }
}
