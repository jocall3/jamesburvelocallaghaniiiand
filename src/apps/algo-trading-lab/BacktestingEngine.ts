```typescript
import {
  Candle,
  Strategy,
  Order,
  OrderSide,
  OrderType,
  Trade,
} from './types';
import { calculateIndicators } from './indicators';
import {
  convertToCandles,
  fetchHistoricalData,
  applySlippage,
  calculateCommission,
  mergeTrades,
} from './utils';

export interface BacktestingEngineOptions {
  startDate: string;
  endDate: string;
  initialCapital: number;
  symbol: string;
  timeframe: string; // e.g., '1m', '5m', '1h', '1d'
  strategy: Strategy;
  slippage?: number; // Percentage
  commissionRate?: number; // Percentage
}

export interface BacktestingResult {
  equityCurve: { date: string; value: number }[];
  trades: Trade[];
  finalCapital: number;
  initialCapital: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  lossRate: number;
  avgWin: number;
  avgLoss: number;
  buyAndHoldReturn: number;
}

export class BacktestingEngine {
  private startDate: string;
  private endDate: string;
  private initialCapital: number;
  private symbol: string;
  private timeframe: string;
  private strategy: Strategy;
  private slippage: number;
  private commissionRate: number;
  private candles: Candle[] = [];
  private currentCapital: number;
  private positions: { [key: string]: number } = {}; // symbol: quantity
  private trades: Trade[] = [];
  private equityCurve: { date: string; value: number }[] = [];
  private buyAndHoldTrades: Trade[] = [];
  private buyAndHoldCapital: number;
  private buyAndHoldShares: number = 0;

  constructor(private options: BacktestingEngineOptions) {
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.initialCapital = options.initialCapital;
    this.symbol = options.symbol;
    this.timeframe = options.timeframe;
    this.strategy = options.strategy;
    this.slippage = options.slippage || 0;
    this.commissionRate = options.commissionRate || 0;
    this.currentCapital = this.initialCapital;
    this.buyAndHoldCapital = this.initialCapital;
  }

  public async run(): Promise<BacktestingResult> {
    try {
      await this.fetchAndPrepareData();
      this.backtest();
      return this.calculateResults();
    } catch (error) {
      console.error('Backtesting failed:', error);
      throw error; // Re-throw to propagate the error
    }
  }

  private async fetchAndPrepareData(): Promise<void> {
    const historicalData = await fetchHistoricalData(
      this.symbol,
      this.startDate,
      this.endDate,
      this.timeframe
    );

    this.candles = convertToCandles(historicalData);
  }

  private backtest(): void {
    for (let i = 0; i < this.candles.length; i++) {
      const candle = this.candles[i];
      const timestamp = new Date(candle.timestamp).toISOString();
      const currentPrice = candle.close;

      this.strategy.indicators = calculateIndicators(this.candles, i); // Pass full candle list for calculations
      const orders = this.strategy.entry(candle, this.positions, this.currentCapital);

      this.processOrders(orders, candle);

      this.equityCurve.push({ date: timestamp, value: this.currentCapital });

      this.updateBuyAndHold(candle);
    }
  }


  private processOrders(orders: Order[], candle: Candle): void {
    for (const order of orders) {
      const currentPrice = candle.close;
      if (order.side === OrderSide.BUY) {
        this.executeBuyOrder(order, currentPrice, candle.timestamp);
      } else if (order.side === OrderSide.SELL) {
        this.executeSellOrder(order, currentPrice, candle.timestamp);
      }
    }
  }

  private executeBuyOrder(order: Order, price: number, timestamp: string): void {
    const quantity = order.quantity; // Units to buy

    const slippageAdjustedPrice = applySlippage(price, this.slippage, OrderSide.BUY);
    const commission = calculateCommission(
        quantity * slippageAdjustedPrice,
        this.commissionRate
    );

    const cost = quantity * slippageAdjustedPrice + commission;

    if (this.currentCapital >= cost) {
      this.currentCapital -= cost;
      this.positions[this.symbol] = (this.positions[this.symbol] || 0) + quantity;

      this.trades.push({
        symbol: this.symbol,
        side: OrderSide.BUY,
        orderType: order.type,
        price: slippageAdjustedPrice,
        quantity: quantity,
        timestamp,
        commission,
      });

    } else {
      console.warn('Not enough capital to execute buy order');
    }
  }


  private executeSellOrder(order: Order, price: number, timestamp: string): void {
      const quantityToSell = order.quantity; // Units to sell

      const slippageAdjustedPrice = applySlippage(price, this.slippage, OrderSide.SELL);
      const commission = calculateCommission(
          quantityToSell * slippageAdjustedPrice,
          this.commissionRate
      );

      const sellValue = quantityToSell * slippageAdjustedPrice - commission;

      const currentPosition = this.positions[this.symbol] || 0;

      if (currentPosition >= quantityToSell) {
          this.currentCapital += sellValue;
          this.positions[this.symbol] -= quantityToSell;

          this.trades.push({
              symbol: this.symbol,
              side: OrderSide.SELL,
              orderType: order.type,
              price: slippageAdjustedPrice,
              quantity: quantityToSell,
              timestamp,
              commission,
          });
      } else {
          console.warn('Not enough shares to execute sell order');
      }
  }


  private updateBuyAndHold(candle: Candle): void {
      const currentPrice = candle.close;
      if (this.buyAndHoldShares === 0) {
        const quantity = Math.floor(this.buyAndHoldCapital / currentPrice);
        if (quantity > 0) {
          const buyValue = quantity * currentPrice;
          const commission = calculateCommission(buyValue, this.commissionRate);
          this.buyAndHoldCapital -= buyValue + commission;
          this.buyAndHoldShares = quantity;
          this.buyAndHoldTrades.push({
            symbol: this.symbol,
            side: OrderSide.BUY,
            orderType: OrderType.MARKET,
            price: currentPrice,
            quantity: quantity,
            timestamp: candle.timestamp,
            commission
          });
        }
      }

      // Calculate buy and hold equity
      this.buyAndHoldCapital = this.buyAndHoldShares * currentPrice + this.buyAndHoldCapital;
  }

  private calculateResults(): BacktestingResult {
    const finalCapital = this.currentCapital;
    const initialCapital = this.initialCapital;
    const totalReturn = (finalCapital - initialCapital) / initialCapital;
    const buyAndHoldReturn = (this.buyAndHoldCapital - initialCapital) / initialCapital;


    // Calculate drawdown
    let maxDrawdown = 0;
    let peakEquity = this.initialCapital;
    for (const equityPoint of this.equityCurve) {
      peakEquity = Math.max(peakEquity, equityPoint.value);
      const drawdown = (peakEquity - equityPoint.value) / peakEquity;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Calculate win rate, loss rate, avg win, avg loss
    let wins = 0;
    let losses = 0;
    let totalWin = 0;
    let totalLoss = 0;

    const profitTrades = this.trades.filter(trade => {
        const matchingTrade = this.trades.find(t => t.side !== trade.side && t.timestamp === trade.timestamp && t.symbol === trade.symbol);
        if(!matchingTrade) return false;
        return trade.side === OrderSide.BUY ? (matchingTrade.price > trade.price) : (matchingTrade.price < trade.price);
    });

    const lossTrades = this.trades.filter(trade => {
        const matchingTrade = this.trades.find(t => t.side !== trade.side && t.timestamp === trade.timestamp && t.symbol === trade.symbol);
        if(!matchingTrade) return false;
        return trade.side === OrderSide.BUY ? (matchingTrade.price < trade.price) : (matchingTrade.price > trade.price);
    });


    wins = profitTrades.length / 2;
    losses = lossTrades.length / 2;

    for(const trade of profitTrades){
        const matchingTrade = this.trades.find(t => t.side !== trade.side && t.timestamp === trade.timestamp && t.symbol === trade.symbol);
        if(matchingTrade){
          totalWin += (matchingTrade.price - trade.price) * trade.quantity;
        }

    }
    for(const trade of lossTrades){
        const matchingTrade = this.trades.find(t => t.side !== trade.side && t.timestamp === trade.timestamp && t.symbol === trade.symbol);
        if(matchingTrade){
          totalLoss += (trade.price - matchingTrade.price) * trade.quantity;
        }
    }


    const avgWin = wins > 0 ? totalWin / wins : 0;
    const avgLoss = losses > 0 ? totalLoss / losses : 0;
    const winRate = this.trades.length > 0 ? wins / (wins + losses) : 0;
    const lossRate = this.trades.length > 0 ? losses / (wins + losses) : 0;



    // Sharpe Ratio (Simplified - assuming risk-free rate is 0)
    let totalReturnOverPeriod = totalReturn;
    const numPeriods = this.equityCurve.length;
    const stdDev = this.equityCurve.length > 1 ? this.calculateStandardDeviation() : 0;
    const sharpeRatio = stdDev > 0 ? (totalReturnOverPeriod / numPeriods) / stdDev * Math.sqrt(252) : 0;  // Annualize

    return {
      equityCurve: this.equityCurve,
      trades: this.trades,
      finalCapital,
      initialCapital,
      totalReturn,
      maxDrawdown,
      sharpeRatio,
      winRate,
      lossRate,
      avgWin,
      avgLoss,
      buyAndHoldReturn,
    };
  }

  private calculateStandardDeviation(): number {
    const returns = [];
    for (let i = 1; i < this.equityCurve.length; i++) {
        const prevValue = this.equityCurve[i-1].value;
        const currentValue = this.equityCurve[i].value;
        returns.push((currentValue - prevValue) / prevValue);
    }

    if (returns.length === 0) return 0;
    const n = returns.length;
    const mean = returns.reduce((sum, val) => sum + val, 0) / n;
    const squaredDifferences = returns.map(val => (val - mean) ** 2);
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / (n - 1);
    return Math.sqrt(variance);
  }
}
```