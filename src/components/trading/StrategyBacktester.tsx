```tsx
import React, { useState, useEffect } from 'react';
import { Strategy } from './TradingStrategy';
import { StockData } from './StockData';
import { calculateBacktestResults } from './backtestFunctions'; // Assuming you have this

interface StrategyBacktesterProps {
  strategies: Strategy[];
  stockData: { [symbol: string]: StockData }; // Dictionary of stock data, keyed by symbol
}

const StrategyBacktester: React.FC<StrategyBacktesterProps> = ({ strategies, stockData }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [backtestResults, setBacktestResults] = useState<any | null>(null); // Define your results type
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStrategyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const strategyId = event.target.value;
    const strategy = strategies.find(strat => strat.id.toString() === strategyId) || null;
    setSelectedStrategy(strategy);
    setBacktestResults(null); // Clear previous results
  };

  const handleStockChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const stockSymbol = event.target.value;
    setSelectedStock(stockSymbol);
    setBacktestResults(null); // Clear previous results
  };

  const runBacktest = async () => {
    if (!selectedStrategy || !selectedStock || !stockData[selectedStock]) {
      setError("Please select a strategy and a stock.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await calculateBacktestResults(selectedStrategy, stockData[selectedStock]);
      setBacktestResults(results);
    } catch (err: any) {
      setError(err.message || "An error occurred during backtesting.");
    } finally {
      setLoading(false);
    }
  };

  const stockSymbols = Object.keys(stockData); // Extract stock symbols

  return (
    <div>
      <h2>Strategy Backtester</h2>

      <label htmlFor="strategySelect">Select Strategy:</label>
      <select id="strategySelect" onChange={handleStrategyChange} value={selectedStrategy?.id || ""}>
        <option value="">-- Select a Strategy --</option>
        {strategies.map(strategy => (
          <option key={strategy.id} value={strategy.id.toString()}>
            {strategy.name}
          </option>
        ))}
      </select>

      <label htmlFor="stockSelect">Select Stock:</label>
      <select id="stockSelect" onChange={handleStockChange} value={selectedStock || ""}>
        <option value="">-- Select a Stock --</option>
        {stockSymbols.map(symbol => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>

      <button onClick={runBacktest} disabled={loading || !selectedStrategy || !selectedStock}>
        {loading ? "Running..." : "Run Backtest"}
      </button>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {backtestResults && (
        <div>
          <h3>Backtest Results for {selectedStrategy?.name} on {selectedStock}</h3>
          {/* Render your backtest results here.  Structure your results appropriately
               and map through them if necessary.  For example: */}
               
          {backtestResults.trades && backtestResults.trades.length > 0 ? (
          <div>
            <h4>Trades:</h4>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Price</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {backtestResults.trades.map((trade: any, index: number) => ( // Replace 'any' with the correct type
                  <tr key={index}>
                    <td>{trade.date}</td>
                    <td>{trade.action}</td>
                    <td>{trade.price}</td>
                    <td>{trade.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No trades were executed.</p>
        )}
          {/* Example of displaying a summary */}
            <p>Total Return: {backtestResults.totalReturn}%</p>
        </div>
      )}
    </div>
  );
};

export default StrategyBacktester;
```