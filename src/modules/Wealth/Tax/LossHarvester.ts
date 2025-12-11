import { Portfolio } from "../../../types/Portfolio";
import { TaxLossHarvesterConfig } from "../../../types/Wealth/Tax/TaxLossHarvesterConfig";
import { Transaction } from "../../../types/Transaction";

export class LossHarvester {
    private portfolio: Portfolio;
    private config: TaxLossHarvesterConfig;

    constructor(portfolio: Portfolio, config: TaxLossHarvesterConfig) {
        this.portfolio = portfolio;
        this.config = config;
    }

    /**
     * Identifies and executes tax-loss harvesting opportunities within the portfolio.
     * @returns A list of transactions executed for tax-loss harvesting.
     */
    public harvestLosses(): Transaction[] {
        const executedTransactions: Transaction[] = [];
        const holdings = this.portfolio.holdings;
        const availableLots = this.getAvailableLots(holdings);

        // Sort holdings by unrealized loss in descending order
        const sortedHoldings = Object.entries(availableLots)
            .sort(([, a], [, b]) => (b.unrealizedLoss ?? 0) - (a.unrealizedLoss ?? 0));

        for (const [symbol, holding] of sortedHoldings) {
            if (holding.unrealizedLoss && holding.unrealizedLoss > this.config.lossThreshold) {
                // Find the lot with the largest unrealized loss
                const lotToSell = holding.lots.sort((a, b) => (b.unrealizedLoss ?? 0) - (a.unrealizedLoss ?? 0))[0];

                if (lotToSell) {
                    const transaction: Transaction = {
                        id: `TLH-${symbol}-${Date.now()}`,
                        symbol: symbol,
                        type: 'SELL',
                        quantity: lotToSell.quantity,
                        price: lotToSell.currentPrice ?? lotToSell.costBasis / lotToSell.quantity, // Use current price if available, otherwise estimate
                        date: new Date(),
                        commission: this.config.commissionRate,
                        notes: `Tax-loss harvest for ${symbol} (Lot ID: ${lotToSell.id})`
                    };
                    executedTransactions.push(transaction);

                    // Remove the sold lot from the holding
                    holding.lots = holding.lots.filter(lot => lot.id !== lotToSell.id);

                    // Update holding's total quantity and value
                    holding.totalQuantity -= lotToSell.quantity;
                    holding.totalValue = holding.lots.reduce((sum, lot) => sum + (lot.currentPrice ?? lot.costBasis / lot.quantity) * lot.quantity, 0);

                    // If no lots remain for this holding, remove it
                    if (holding.totalQuantity <= 0) {
                        delete this.portfolio.holdings[symbol];
                    }
                }
            }
        }

        return executedTransactions;
    }

    /**
     * Calculates unrealized gains and losses for each lot within holdings.
     * @param holdings - The current holdings in the portfolio.
     * @returns An object mapping symbols to their detailed holding information including lots with calculated gains/losses.
     */
    private getAvailableLots(holdings: { [symbol: string]: { quantity: number; costBasis: number; totalValue: number; lots: Array<{ id: string; quantity: number; costBasis: number; currentPrice?: number; realizedLoss?: number; realizedGain?: number; unrealizedLoss?: number; unrealizedGain?: number; }> } }) {
        const availableLots: { [symbol: string]: { quantity: number; costBasis: number; totalValue: number; lots: Array<{ id: string; quantity: number; costBasis: number; currentPrice?: number; realizedLoss?: number; realizedGain?: number; unrealizedLoss?: number; unrealizedGain?: number; }> } } = {};

        for (const symbol in holdings) {
            const holding = holdings[symbol];
            availableLots[symbol] = {
                ...holding,
                lots: holding.lots.map(lot => {
                    const currentValue = lot.currentPrice !== undefined ? lot.currentPrice * lot.quantity : this.portfolio.marketData[symbol]?.price * lot.quantity;
                    const lotUnrealizedGainLoss = currentValue - lot.costBasis;

                    return {
                        ...lot,
                        unrealizedLoss: lotUnrealizedGainLoss < 0 ? Math.abs(lotUnrealizedGainLoss) : undefined,
                        unrealizedGain: lotUnrealizedGainLoss >= 0 ? lotUnrealizedGainLoss : undefined,
                        currentPrice: lot.currentPrice ?? this.portfolio.marketData[symbol]?.price
                    };
                }).filter(lot => lot.unrealizedLoss !== undefined) // Only consider lots with unrealized losses
            };
        }
        return availableLots;
    }
}
