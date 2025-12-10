export interface FinancialDataPoint {
  timestamp: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  [key: string]: any; // Allow for additional custom properties
}

export interface AnalysisResult<T> {
  type: string;
  data: T;
  meta?: { [key: string]: any };
}

/**
 * AnalysisService provides a suite of financial analysis and pattern detection capabilities
 * on normalized financial data.
 * It's designed as a backend microservice component, capable of running complex calculations.
 */
export class AnalysisService {
  constructor() {
    // In a real-world scenario, this constructor might load ML models,
    // establish database connections, or configure external dependencies.
  }

  /**
   * Runs a comprehensive suite of default analyses on the provided normalized financial data.
   * This method aggregates results from various individual analysis functions.
   * @param data Normalized financial data points (e.g., OHLCV arrays).
   * @returns A Promise resolving to a collection of analysis results.
   * @throws Error if input data is empty or invalid.
   */
  public async analyzeAll(data: FinancialDataPoint[]): Promise<AnalysisResult<any>[]> {
    if (!data || data.length === 0) {
      throw new Error("Input data for analysis cannot be empty.");
    }

    const results: AnalysisResult<any>[] = [];

    // Run various analyses. Parameters for periods are common defaults.
    results.push(this.calculateSMA(data, 10));
    results.push(this.calculateSMA(data, 20));
    results.push(this.calculateEMA(data, 12));
    results.push(this.calculateEMA(data, 26));
    results.push(this.calculateRSI(data, 14));
    results.push(this.calculateMACD(data, 12, 26, 9));
    results.push(this.calculateATR(data, 14));
    results.push(this.calculateOnBalanceVolume(data));
    results.push(this.detectBullishEngulfing(data));
    results.push(this.detectBearishEngulfing(data));
    results.push(this.identifyTrend(data, 20, 50)); // Using 20/50 SMA crossover for trend

    // Filter out results that might indicate an error (e.g., not enough data)
    return results.filter(result => !(result.meta && result.meta.error));
  }

  /**
   * Calculates the Simple Moving Average (SMA) for a given period.
   * @param data Financial data points.
   * @param period The number of data points to include in each average calculation.
   * @returns An AnalysisResult containing timestamps and SMA values.
   */
  public calculateSMA(data: FinancialDataPoint[], period: number): AnalysisResult<{ timestamp: number; value: number }[]> {
    if (data.length < period) {
      return { type: 'SMA', data: [], meta: { period, error: 'Not enough data for SMA calculation.' } };
    }

    const smaResults: { timestamp: number; value: number }[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, point) => acc + point.close, 0);
      smaResults.push({
        timestamp: data[i].timestamp,
        value: sum / period,
      });
    }
    return { type: 'SMA', data: smaResults, meta: { period } };
  }

  /**
   * Calculates the Exponential Moving Average (EMA) for a given period.
   * EMA gives more weight to recent prices.
   * @param data Financial data points.
   * @param period The number of data points to include in each average calculation.
   * @returns An AnalysisResult containing timestamps and EMA values.
   */
  public calculateEMA(data: FinancialDataPoint[], period: number): AnalysisResult<{ timestamp: number; value: number }[]> {
    if (data.length < period) {
      return { type: 'EMA', data: [], meta: { period, error: 'Not enough data for EMA calculation.' } };
    }

    const emaResults: { timestamp: number; value: number }[] = [];
    const multiplier = 2 / (period + 1);

    // Calculate initial SMA for the first EMA value
    let initialSMA = data.slice(0, period).reduce((acc, point) => acc + point.close, 0) / period;
    emaResults.push({
      timestamp: data[period - 1].timestamp, // EMA starts from the Nth data point
      value: initialSMA,
    });

    // Calculate subsequent EMAs
    for (let i = period; i < data.length; i++) {
      const prevEMA = emaResults[emaResults.length - 1].value;
      const currentClose = data[i].close;
      const currentEMA = (currentClose - prevEMA) * multiplier + prevEMA;
      emaResults.push({
        timestamp: data[i].timestamp,
        value: currentEMA,
      });
    }

    return { type: 'EMA', data: emaResults, meta: { period } };
  }

  /**
   * Detects Bullish Engulfing candlestick patterns.
   * A two-candle reversal pattern: a small bearish candle is followed by a large bullish candle
   * that completely engulfs the previous candle's body.
   * @param data Financial data points.
   * @returns An AnalysisResult containing detected pattern timestamps and names.
   */
  public detectBullishEngulfing(data: FinancialDataPoint[]): AnalysisResult<{ timestamp: number; pattern: string }[]> {
    const patterns: { timestamp: number; pattern: string }[] = [];
    if (data.length < 2) {
      return { type: 'CandlestickPattern', data: patterns, meta: { patternName: 'Bullish Engulfing', error: 'Not enough data.' } };
    }

    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const current = data[i];

      const prevBody = Math.abs(prev.open - prev.close);
      const currentBody = Math.abs(current.open - current.close);

      const isPrevBearish = prev.close < prev.open;
      const isCurrentBullish = current.close > current.open;

      const isEngulfing = isPrevBearish && isCurrentBullish &&
                          current.open < prev.close &&
                          current.close > prev.open &&
                          currentBody > prevBody; // Current body must be larger than previous

      if (isEngulfing) {
        patterns.push({ timestamp: current.timestamp, pattern: 'Bullish Engulfing' });
      }
    }
    return { type: 'CandlestickPattern', data: patterns, meta: { patternName: 'Bullish Engulfing' } };
  }

  /**
   * Detects Bearish Engulfing candlestick patterns.
   * A two-candle reversal pattern: a small bullish candle is followed by a large bearish candle
   * that completely engulfs the previous candle's body.
   * @param data Financial data points.
   * @returns An AnalysisResult containing detected pattern timestamps and names.
   */
  public detectBearishEngulfing(data: FinancialDataPoint[]): AnalysisResult<{ timestamp: number; pattern: string }[]> {
    const patterns: { timestamp: number; pattern: string }[] = [];
    if (data.length < 2) {
      return { type: 'CandlestickPattern', data: patterns, meta: { patternName: 'Bearish Engulfing', error: 'Not enough data.' } };
    }

    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const current = data[i];

      const prevBody = Math.abs(prev.open - prev.close);
      const currentBody = Math.abs(current.open - current.close);

      const isPrevBullish = prev.close > prev.open;
      const isCurrentBearish = current.close < current.open;

      const isEngulfing = isPrevBullish && isCurrentBearish &&
                          current.open > prev.close &&
                          current.close < prev.open &&
                          currentBody > prevBody;

      if (isEngulfing) {
        patterns.push({ timestamp: current.timestamp, pattern: 'Bearish Engulfing' });
      }
    }
    return { type: 'CandlestickPattern', data: patterns, meta: { patternName: 'Bearish Engulfing' } };
  }

  /**
   * Calculates the Relative Strength Index (RSI).
   * RSI is a momentum oscillator measuring the speed and change of price movements.
   * @param data Financial data points.
   * @param period The period for the RSI calculation (commonly 14).
   * @returns An AnalysisResult containing timestamps and RSI values.
   */
  public calculateRSI(data: FinancialDataPoint[], period: number): AnalysisResult<{ timestamp: number; value: number }[]> {
    const rsiResults: { timestamp: number; value: number }[] = [];
    if (data.length < period + 1) { // Need N+1 data points for the first N-period change calculation
      return { type: 'RSI', data: [], meta: { period, error: 'Not enough data for RSI calculation.' } };
    }

    let avgGain = 0;
    let avgLoss = 0;

    // Calculate initial average gain/loss over the first 'period' differences
    for (let i = 1; i <= period; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) {
        avgGain += change;
      } else {
        avgLoss -= change; // Absolute loss
      }
    }
    avgGain /= period;
    avgLoss /= period;

    // Calculate initial RS and RSI
    let rs = avgLoss === 0 ? (avgGain === 0 ? 0 : Infinity) : avgGain / avgLoss;
    rsiResults.push({
      timestamp: data[period].timestamp,
      value: 100 - (100 / (1 + rs)),
    });

    // Calculate subsequent RS and RSI using Wilder's smoothing method
    for (let i = period + 1; i < data.length; i++) {
      const currentChange = data[i].close - data[i - 1].close;
      const currentGain = currentChange > 0 ? currentChange : 0;
      const currentLoss = currentChange < 0 ? -currentChange : 0;

      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

      rs = avgLoss === 0 ? (avgGain === 0 ? 0 : Infinity) : avgGain / avgLoss;
      rsiResults.push({
        timestamp: data[i].timestamp,
        value: 100 - (100 / (1 + rs)),
      });
    }

    return { type: 'RSI', data: rsiResults, meta: { period } };
  }

  /**
   * Calculates Moving Average Convergence Divergence (MACD).
   * MACD is a trend-following momentum indicator showing the relationship between two moving averages of a security’s price.
   * @param data Financial data points.
   * @param fastPeriod The period for the fast EMA (commonly 12).
   * @param slowPeriod The period for the slow EMA (commonly 26).
   * @param signalPeriod The period for the signal line EMA (commonly 9).
   * @returns An AnalysisResult containing MACD line, Signal line, and Histogram values.
   */
  public calculateMACD(
    data: FinancialDataPoint[],
    fastPeriod: number,
    slowPeriod: number,
    signalPeriod: number
  ): AnalysisResult<{ timestamp: number; macd: number; signal: number; histogram: number }[]> {
    const macdResults: { timestamp: number; macd: number; signal: number; histogram: number }[] = [];

    // Ensure enough data for the slowest EMA calculation
    if (data.length < slowPeriod) {
      return { type: 'MACD', data: [], meta: { fastPeriod, slowPeriod, signalPeriod, error: 'Not enough data for MACD calculation.' } };
    }

    const fastEMA = this.calculateEMA(data, fastPeriod).data;
    const slowEMA = this.calculateEMA(data, slowPeriod).data;

    if (fastEMA.length === 0 || slowEMA.length === 0) {
        return { type: 'MACD', data: [], meta: { fastPeriod, slowPeriod, signalPeriod, error: 'EMA calculation failed for MACD.' } };
    }

    // Map EMA values to timestamps for easy lookup and alignment
    const fastEMAMap = new Map(fastEMA.map(d => [d.timestamp, d.value]));
    const slowEMAMap = new Map(slowEMA.map(d => [d.timestamp, d.value]));

    const macdLineRaw: { timestamp: number; value: number }[] = [];

    // The MACD line can only be calculated for timestamps where both EMAs exist.
    // The EMAs start at `period - 1` index of the original data array.
    // So, we start from the maximum of the two starting indices (which corresponds to the slower EMA's start).
    const maxDataIndexForEMAs = Math.max(fastPeriod - 1, slowPeriod - 1);

    for (let i = maxDataIndexForEMAs; i < data.length; i++) {
        const timestamp = data[i].timestamp;
        const currentFastEMA = fastEMAMap.get(timestamp);
        const currentSlowEMA = slowEMAMap.get(timestamp);

        if (currentFastEMA !== undefined && currentSlowEMA !== undefined) {
            macdLineRaw.push({
                timestamp: timestamp,
                value: currentFastEMA - currentSlowEMA,
            });
        }
    }

    if (macdLineRaw.length === 0) {
        return { type: 'MACD', data: [], meta: { fastPeriod, slowPeriod, signalPeriod, error: 'Could not form MACD line.' } };
    }

    // Calculate the Signal Line (EMA of the MACD line)
    // We create dummy FinancialDataPoint objects from the MACD line values
    // to reuse the existing calculateEMA function.
    const macdDataForSignal: FinancialDataPoint[] = macdLineRaw.map(m => ({
        timestamp: m.timestamp,
        open: m.value, // Not used for EMA of 'close'
        high: m.value, // Not used
        low: m.value,  // Not used
        close: m.value, // This is the value the EMA is calculated on
    }));
    const signalLineRaw = this.calculateEMA(macdDataForSignal, signalPeriod).data;

    // Map signal line values to timestamps
    const signalLineMap = new Map(signalLineRaw.map(d => [d.timestamp, d.value]));

    // Combine MACD line and Signal Line, calculate Histogram
    for (const macdPoint of macdLineRaw) {
      const signalValue = signalLineMap.get(macdPoint.timestamp);
      if (signalValue !== undefined) {
        macdResults.push({
          timestamp: macdPoint.timestamp,
          macd: macdPoint.value,
          signal: signalValue,
          histogram: macdPoint.value - signalValue,
        });
      }
    }

    return { type: 'MACD', data: macdResults, meta: { fastPeriod, slowPeriod, signalPeriod } };
  }

  /**
   * Calculates the Average True Range (ATR).
   * ATR is a measure of market volatility, indicating how much an asset moves on average.
   * @param data Financial data points.
   * @param period The period for the ATR calculation (commonly 14).
   * @returns An AnalysisResult containing timestamps and ATR values.
   */
  public calculateATR(data: FinancialDataPoint[], period: number): AnalysisResult<{ timestamp: number; value: number }[]> {
    const atrResults: { timestamp: number; value: number }[] = [];
    if (data.length < period) {
      return { type: 'ATR', data: [], meta: { period, error: 'Not enough data for ATR calculation.' } };
    }

    const trueRanges: number[] = [];
    // Calculate True Ranges for each data point
    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      if (i === 0) {
        // For the first data point, True Range is simply High - Low
        trueRanges.push(current.high - current.low);
      } else {
        const prevClose = data[i - 1].close;
        const tr = Math.max(
          current.high - current.low,
          Math.abs(current.high - prevClose),
          Math.abs(current.low - prevClose)
        );
        trueRanges.push(tr);
      }
    }

    // Calculate initial ATR as the SMA of the first 'period' True Ranges
    let currentATR = trueRanges.slice(0, period).reduce((acc, tr) => acc + tr, 0) / period;
    atrResults.push({
      timestamp: data[period - 1].timestamp,
      value: currentATR,
    });

    // Calculate subsequent ATRs using Wilder's smoothing method
    for (let i = period; i < data.length; i++) {
      const currentTR = trueRanges[i];
      currentATR = ((currentATR * (period - 1)) + currentTR) / period;
      atrResults.push({
        timestamp: data[i].timestamp,
        value: currentATR,
      });
    }

    return { type: 'ATR', data: atrResults, meta: { period } };
  }

  /**
   * Calculates On-Balance Volume (OBV).
   * OBV is a momentum indicator that uses volume flow to predict price changes.
   * @param data Financial data points.
   * @returns An AnalysisResult containing timestamps and OBV values.
   */
  public calculateOnBalanceVolume(data: FinancialDataPoint[]): AnalysisResult<{ timestamp: number; value: number }[]> {
    const obvResults: { timestamp: number; value: number }[] = [];
    if (data.length === 0) {
      return { type: 'OBV', data: [], meta: { error: 'No data provided for OBV calculation.' } };
    }

    let currentOBV = 0;
    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      const prev = data[i - 1];

      // Handle missing volume data gracefully (e.g., treat as no change)
      const currentVolume = current.volume !== undefined ? current.volume : 0;

      if (i === 0) {
        currentOBV = currentVolume;
      } else {
        if (current.close > prev.close) {
          currentOBV += currentVolume;
        } else if (current.close < prev.close) {
          currentOBV -= currentVolume;
        }
        // If current.close === prev.close, OBV remains unchanged.
      }
      obvResults.push({ timestamp: current.timestamp, value: currentOBV });
    }

    return { type: 'OBV', data: obvResults };
  }

  /**
   * Identifies the general market trend based on the crossover of two Simple Moving Averages.
   * This is a simplified approach to trend detection; real-world applications may use more complex models.
   * @param data Financial data points.
   * @param shortPeriod Period for the shorter moving average (default: 20).
   * @param longPeriod Period for the longer moving average (default: 50).
   * @returns An AnalysisResult containing timestamps and the identified trend.
   */
  public identifyTrend(
    data: FinancialDataPoint[],
    shortPeriod: number = 20,
    longPeriod: number = 50
  ): AnalysisResult<{ timestamp: number; trend: 'uptrend' | 'downtrend' | 'sideways' | 'unknown' }[]> {
    const trendResults: { timestamp: number; trend: 'uptrend' | 'downtrend' | 'sideways' | 'unknown' }[] = [];

    if (data.length < Math.max(shortPeriod, longPeriod)) {
      return { type: 'Trend', data: [], meta: { shortPeriod, longPeriod, error: 'Not enough data for trend identification.' } };
    }

    const shortSMAData = this.calculateSMA(data, shortPeriod).data;
    const longSMAData = this.calculateSMA(data, longPeriod).data;

    if (shortSMAData.length === 0 || longSMAData.length === 0) {
        return { type: 'Trend', data: [], meta: { shortPeriod, longPeriod, error: 'SMA calculation failed for trend identification.' } };
    }

    // Map SMA values to timestamps for efficient lookup
    const shortSMAMap = new Map(shortSMAData.map(d => [d.timestamp, d.value]));
    const longSMAMap = new Map(longSMAData.map(d => [d.timestamp, d.value]));

    // Start iteration from the first timestamp where both SMAs are available
    const commonStartTimestamp = Math.max(
      shortSMAData[0].timestamp,
      longSMAData[0].timestamp
    );

    for (const point of data) {
      if (point.timestamp < commonStartTimestamp) {
        continue; // Skip data points before both SMAs can be calculated
      }

      const shortSMA = shortSMAMap.get(point.timestamp);
      const longSMA = longSMAMap.get(point.timestamp);

      if (shortSMA !== undefined && longSMA !== undefined) {
        let trend: 'uptrend' | 'downtrend' | 'sideways' | 'unknown' = 'unknown';
        if (shortSMA > longSMA) {
          trend = 'uptrend';
        } else if (shortSMA < longSMA) {
          trend = 'downtrend';
        } else {
          trend = 'sideways'; // When SMAs are equal
        }
        trendResults.push({ timestamp: point.timestamp, trend });
      } else {
        trendResults.push({ timestamp: point.timestamp, trend: 'unknown' });
      }
    }

    return { type: 'Trend', data: trendResults, meta: { shortPeriod, longPeriod } };
  }

  // TODO: Implement more advanced analysis techniques:
  // - Volume Profile analysis
  // - Harmonic Pattern detection
  // - Elliott Wave analysis
  // - Machine Learning models for price prediction or anomaly detection
  // - Statistical significance testing for patterns
  // These would typically involve specialized libraries (e.g., TensorFlow.js, or backend Python services).
}