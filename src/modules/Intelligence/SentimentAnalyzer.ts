export enum MarketTrend {
    BULLISH = 'BULLISH',
    NEUTRAL = 'NEUTRAL',
    BEARISH = 'BEARISH',
}

export interface SentimentAnalysisResult {
    sentimentScore: number; // A normalized score, typically between -1 (very negative) and 1 (very positive)
    trend: MarketTrend;
    matchedKeywords: {
        positive: string[];
        negative: string[];
    };
}

/**
 * Service that processes market news feeds to quantify sentiment and predict market trends.
 * This is a simplified, lexicon-based sentiment analyzer for demonstration purposes.
 * For production use, integration with advanced NLP libraries or APIs would be recommended.
 */
export class SentimentAnalyzer {
    private readonly positiveKeywords: string[] = [
        "gain", "rise", "grow", "strong", "up", "bullish", "increase", "profit", "success",
        "optimistic", "breakthrough", "rally", "boom", "soar", "advance", "strength", "recovery",
        "expansion", "upside", "positive", "outperform", "achieve", "boost", "surge", "higher",
        "growth"
    ];

    private readonly negativeKeywords: string[] = [
        "lose", "fall", "drop", "weak", "down", "bearish", "decrease", "loss", "failure",
        "pessimistic", "decline", "slump", "plunge", "crisis", "recession", "stagnation",
        "weakness", "downside", "negative", "warn", "concern", "risk", "underperform", "cut",
        "miss", "lower", "contraction"
    ];

    private readonly neutralWords: string[] = [
        "stable", "flat", "steady", "unchanged", "maintain", "hold", "consolidate", "mixed",
        "speculation", "analysts", "report", "economy", "market", "sector", "company", "stock"
    ];

    private readonly bullishThreshold: number = 0.2;
    private readonly bearishThreshold: number = -0.2;

    /**
     * Analyzes a given text (e.g., market news article or headline) to quantify sentiment
     * and predict an associated market trend.
     *
     * @param text The input text string to be analyzed.
     * @returns A `SentimentAnalysisResult` object containing the sentiment score,
     *          predicted trend, and lists of positive and negative keywords found.
     */
    public analyze(text: string): SentimentAnalysisResult {
        const normalizedText = text.toLowerCase();

        let positiveScore = 0;
        const foundPositiveKeywords: string[] = [];
        for (const keyword of this.positiveKeywords) {
            // Count occurrences to give more weight to repeated keywords
            const matches = (normalizedText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
            positiveScore += matches;
            if (matches > 0) {
                foundPositiveKeywords.push(keyword);
            }
        }

        let negativeScore = 0;
        const foundNegativeKeywords: string[] = [];
        for (const keyword of this.negativeKeywords) {
            const matches = (normalizedText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
            negativeScore += matches;
            if (matches > 0) {
                foundNegativeKeywords.push(keyword);
            }
        }

        // Neutral words can temper extreme scores if they appear alongside strong sentiment words
        let neutralScore = 0;
        for (const keyword of this.neutralWords) {
            neutralScore += (normalizedText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
        }

        const totalSentimentWords = positiveScore + negativeScore;
        let sentimentScore = 0; // Default to neutral if no sentiment words are found

        if (totalSentimentWords > 0) {
            sentimentScore = (positiveScore - negativeScore) / totalSentimentWords;
            // Slightly reduce the absolute sentiment score if many neutral words are present
            // This is a heuristic to make the sentiment less extreme if the context is largely neutral.
            if (neutralScore > totalSentimentWords * 0.5) { // If neutral words outweigh sentiment words
                sentimentScore *= (1 - (neutralScore / (totalSentimentWords + neutralScore)));
            }
        } else if (neutralScore > 0) {
            // If only neutral words are found, force sentiment to 0
            sentimentScore = 0;
        }

        const trend = this.predictTrend(sentimentScore);

        return {
            sentimentScore: parseFloat(sentimentScore.toFixed(4)), // Keep score readable
            trend,
            matchedKeywords: {
                positive: Array.from(new Set(foundPositiveKeywords)), // Remove duplicates
                negative: Array.from(new Set(foundNegativeKeywords)), // Remove duplicates
            },
        };
    }

    /**
     * Predicts the market trend based on a given normalized sentiment score.
     *
     * @param sentimentScore The calculated sentiment score (-1 to 1).
     * @returns The corresponding `MarketTrend` (BULLISH, NEUTRAL, or BEARISH).
     */
    private predictTrend(sentimentScore: number): MarketTrend {
        if (sentimentScore > this.bullishThreshold) {
            return MarketTrend.BULLISH;
        } else if (sentimentScore < this.bearishThreshold) {
            return MarketTrend.BEARISH;
        } else {
            return MarketTrend.NEUTRAL;
        }
    }
}