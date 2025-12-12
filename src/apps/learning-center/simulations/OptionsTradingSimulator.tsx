import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

namespace Citibankdemobusinessinc {
  // Shared Kernel: Utility functions and types used across all business models
  export namespace Kernel {
    export interface DataPoint {
      date: string;
      value: number;
    }

    export const generateRandomNumber = (min: number, max: number): number => {
      return Math.random() * (max - min) + min;
    };

    export const generateDate = (daysFromNow: number): string => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      return date.toISOString().split('T')[0];
    };

    export const generateMockDataset = (size: number, baseValue: number, volatility: number): DataPoint[] => {
      const dataset: DataPoint[] = [];
      let currentValue = baseValue;
      for (let i = 0; i < size; i++) {
        currentValue += generateRandomNumber(-volatility, volatility);
        dataset.push({
          date: generateDate(i),
          value: currentValue,
        });
      }
      return dataset;
    };

    export const generateId = (): string => {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    export const generateMissionStatement = (businessName: string, industry: string, goal: string): string => {
      return `Our mission at ${businessName} is to revolutionize the ${industry} industry by ${goal}, creating unparalleled value for our customers and stakeholders.`;
    };

    export const generateMonetizationPath = (method: string, targetMarket: string, valueProposition: string): string => {
      return `We will monetize our services through ${method}, targeting ${targetMarket} by offering ${valueProposition}.`;
    };

    export const generateDefensibleIPMoat = (technology: string, application: string, advantage: string): string => {
      return `Our defensible IP moat is built around our proprietary ${technology}, which we apply to ${application}, providing a unique ${advantage} over competitors.`;
    };

    export const generateRegulatoryAlignmentStrategy = (region: string, regulation: string, approach: string): string => {
      return `To ensure regulatory alignment in ${region}, we will adhere to ${regulation} by implementing ${approach}.`;
    };

    export const generateRiskDetectionModule = (riskType: string, detectionMethod: string, mitigationStrategy: string): string => {
      return `Our risk detection module identifies ${riskType} using ${detectionMethod}, and we mitigate this risk through ${mitigationStrategy}.`;
    };

    export const generatePrivacyFirstArchitecture = (dataTypes: string, encryptionMethod: string, accessControls: string): string => {
      return `Our privacy-first architecture protects ${dataTypes} using ${encryptionMethod} and enforces strict ${accessControls}.`;
    };

    export const generateErrorHandling = (errorCode: string, errorMessage: string, resolutionSteps: string): string => {
      return `Error Code: ${errorCode}. Message: ${errorMessage}. Resolution: ${resolutionSteps}.`;
    };

    export const generatePricingStrategy = (model: string, factors: string, competitivePositioning: string): string => {
      return `Our pricing strategy is based on a ${model} model, considering factors such as ${factors}, to achieve a competitive positioning through ${competitivePositioning}.`;
    };

    export const generatePartnershipFramework = (partnerType: string, benefits: string, collaborationModel: string): string => {
      return `Our partnership framework focuses on collaborating with ${partnerType}, offering mutual ${benefits} through a ${collaborationModel}.`;
    };

    export const generateFinancialStatement = (period: string, revenue: number, expenses: number, profit: number): string => {
      return `Financial Statement for ${period}: Revenue = $${revenue}, Expenses = $${expenses}, Profit = $${profit}.`;
    };
  }

  // 1. Citibankdemobusinessinc.tradewiz.optionsimulator
  export namespace tradewiz {
    export namespace optionsimulator {
      interface OptionTrade {
        type: 'call' | 'put';
        strikePrice: number;
        expirationDate: string;
        premium: number;
        quantity: number;
        action: 'buy' | 'sell';
      }

      interface StockData {
        date: string;
        price: number;
      }

      const OptionsTradingSimulator: React.FC = () => {
        const [stockPrice, setStockPrice] = useState<number>(100);
        const [stockHistory, setStockHistory] = useState<StockData[]>([]);
        const [trades, setTrades] = useState<OptionTrade[]>([]);
        const [newTrade, setNewTrade] = useState<OptionTrade>({
          type: 'call',
          strikePrice: 100,
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          premium: 5,
          quantity: 1,
          action: 'buy',
        });
        const [simulationTime, setSimulationTime] = useState<number>(0);
        const [simulationInterval, setSimulationInterval] = useState<number>(500); // milliseconds

        // Simulate stock price movement
        useEffect(() => {
          const interval = setInterval(() => {
            const priceChange = (Math.random() - 0.5) * 2; // Random change between -1 and 1
            setStockPrice((prevPrice) => Math.max(1, prevPrice + priceChange));
            setSimulationTime((prevTime) => prevTime + 1);
          }, simulationInterval);

          return () => clearInterval(interval);
        }, [simulationInterval]);

        // Update stock history
        useEffect(() => {
          setStockHistory((prevHistory) => [
            ...prevHistory,
            { date: `Day ${simulationTime}`, price: stockPrice },
          ]);
          // Keep history to a reasonable limit to avoid performance issues
          if (stockHistory.length > 100) {
            setStockHistory((prevHistory) => prevHistory.slice(1));
          }
        }, [simulationTime, stockPrice]);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
          const { name, value } = e.target;
          setNewTrade((prevTrade) => ({
            ...prevTrade,
            [name]: value,
          }));
        };

        const addTrade = () => {
          setTrades((prevTrades) => [...prevTrades, { ...newTrade }]);
        };

        const removeTrade = (index: number) => {
          setTrades((prevTrades) => prevTrades.filter((_, i) => i !== index));
        };

        const calculateProfitLoss = (): number => {
          let totalProfitLoss = 0;

          trades.forEach((trade) => {
            let tradeProfitLoss = 0;
            const daysToExp = Math.max(0, (new Date(trade.expirationDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            const timeDecayFactor = Math.max(0, 1 - daysToExp / 365); // Simple time decay approximation

            // Simplified profit/loss calculation
            if (trade.type === 'call') {
              const intrinsicValue = Math.max(0, stockPrice - trade.strikePrice);
              const extrinsicValue = trade.premium - intrinsicValue; // This is a simplification, real option pricing is complex
              const currentOptionValue = intrinsicValue + Math.max(0, extrinsicValue * timeDecayFactor); // Very simplified

              if (trade.action === 'buy') {
                tradeProfitLoss = (currentOptionValue - trade.premium) * trade.quantity * 100; // 1 contract = 100 shares
                if (simulationTime >= new Date(trade.expirationDate).getTime()) { // Expired
                  tradeProfitLoss = (intrinsicValue - trade.premium) * trade.quantity * 100;
                }
              } else { // sell
                tradeProfitLoss = (trade.premium - currentOptionValue) * trade.quantity * 100;
                if (simulationTime >= new Date(trade.expirationDate).getTime()) { // Expired
                  tradeProfitLoss = (trade.premium - intrinsicValue) * trade.quantity * 100;
                }
              }
            } else { // put
              const intrinsicValue = Math.max(0, trade.strikePrice - stockPrice);
              const extrinsicValue = trade.premium - intrinsicValue;
              const currentOptionValue = intrinsicValue + Math.max(0, extrinsicValue * timeDecayFactor);

              if (trade.action === 'buy') {
                tradeProfitLoss = (currentOptionValue - trade.premium) * trade.quantity * 100;
                if (simulationTime >= new Date(trade.expirationDate).getTime()) { // Expired
                  tradeProfitLoss = (intrinsicValue - trade.premium) * trade.quantity * 100;
                }
              } else { // sell
                tradeProfitLoss = (trade.premium - currentOptionValue) * trade.quantity * 100;
                if (simulationTime >= new Date(trade.expirationDate).getTime()) { // Expired
                  tradeProfitLoss = (trade.premium - intrinsicValue) * trade.quantity * 100;
                }
              }
            }

            // Ensure profit/loss doesn't exceed maximum possible gain/loss for a single contract
            if (trade.action === 'buy') {
              if (trade.type === 'call') {
                tradeProfitLoss = Math.max(tradeProfitLoss, -trade.premium * 100); // Max loss is premium paid
              } else { // put
                tradeProfitLoss = Math.max(tradeProfitLoss, -trade.premium * 100); // Max loss is premium paid
              }
            } else { // sell
              if (trade.type === 'call') {
                tradeProfitLoss = Math.min(tradeProfitLoss, Infinity); // Theoretically unlimited profit
              } else { // put
                tradeProfitLoss = Math.min(tradeProfitLoss, (trade.strikePrice - trade.premium) * 100); // Max profit is strike - premium
              }
            }

            totalProfitLoss += tradeProfitLoss;
          });

          return totalProfitLoss;
        };

        return (
          <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Options Trading Simulator</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Current Market Info */}
              <div className="bg-white p-5 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">Market Snapshot</h2>
                <p className="text-lg mb-2">Current Stock Price: <span className={`font-bold ${stockPrice > 100 ? 'text-green-600' : stockPrice < 100 ? 'text-red-600' : 'text-gray-800'}`}>${stockPrice.toFixed(2)}</span></p>
                <p className="text-lg mb-2">Simulation Time: <span className="font-medium text-blue-600">{simulationTime} days</span></p>
                <label htmlFor="simulationInterval" className="block text-sm font-medium text-gray-600 mb-1">
                  Simulation Speed:
                </label>
                <input
                  id="simulationInterval"
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={simulationInterval}
                  onChange={(e) => setSimulationInterval(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Add New Trade */}
              <div className="bg-white p-5 rounded-lg shadow-md lg:col-span-2">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">Add New Option Trade</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="action" className="block text-sm font-medium text-gray-600 mb-1">Action</label>
                    <select
                      id="action"
                      name="action"
                      value={newTrade.action}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-600 mb-1">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={newTrade.type}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="call">Call</option>
                      <option value="put">Put</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="strikePrice" className="block text-sm font-medium text-gray-600 mb-1">Strike Price</label>
                    <input
                      id="strikePrice"
                      type="number"
                      name="strikePrice"
                      value={newTrade.strikePrice}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="premium" className="block text-sm font-medium text-gray-600 mb-1">Premium per Share</label>
                    <input
                      id="premium"
                      type="number"
                      name="premium"
                      value={newTrade.premium}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-600 mb-1">Quantity (Contracts)</label>
                    <input
                      id="quantity"
                      type="number"
                      name="quantity"
                      value={newTrade.quantity}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-600 mb-1">Expiration Date</label>
                    <input
                      id="expirationDate"
                      type="date"
                      name="expirationDate"
                      value={newTrade.expirationDate}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={addTrade}
                  className="mt-4 px-5 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Trade
                </button>
              </div>
            </div>

            {/* Current Trades & P/L */}
            <div className="bg-white p-5 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">My Trades</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strike</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trades.map((trade, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{trade.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{trade.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${trade.strikePrice.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${trade.premium.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{trade.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(trade.expirationDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {simulationTime >= new Date(trade.expirationDate).getTime() / (24 * 60 * 60 * 1000) ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Expired</span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => removeTrade(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <p className="text-lg font-semibold">
                  Total P/L: <span className={`font-bold ${calculateProfitLoss() > 0 ? 'text-green-600' : calculateProfitLoss() < 0 ? 'text-red-600' : 'text-gray-800'}`}>${calculateProfitLoss().toFixed(2)}</span>
                </p>
              </div>
            </div>

            {/* Stock Price History Chart */}
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Stock Price History</h2>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <LineChart
                    data={stockHistory}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      };

      export default OptionsTradingSimulator;
    }
  }

  // 2. Citibankdemobusinessinc.loanpro.autoloan
  export namespace loanpro {
    export namespace autoloan {
      interface LoanApplication {
        loanAmount: number;
        interestRate: number;
        loanTerm: number;
        creditScore: number;
        income: number;
      }

      interface LoanOffer {
        monthlyPayment: number;
        totalInterest: number;
        apr: number;
      }

      const AutoLoanCalculator: React.FC = () => {
        const [loanApplication, setLoanApplication] = useState<LoanApplication>({
          loanAmount: 20000,
          interestRate: 5,
          loanTerm: 60,
          creditScore: 700,
          income: 60000,
        });
        const [loanOffer, setLoanOffer] = useState<LoanOffer | null>(null);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const { name, value } = e.target;
          setLoanApplication((prevApplication) => ({
            ...prevApplication,
            [name]: Number(value),
          }));
        };

        const calculateLoan = () => {
          const { loanAmount, interestRate, loanTerm } = loanApplication;
          const monthlyInterestRate = interestRate / 100 / 12;
          const monthlyPayment =
            (loanAmount * monthlyInterestRate) /
            (1 - Math.pow(1 + monthlyInterestRate, -loanTerm));
          const totalInterest = monthlyPayment * loanTerm - loanAmount;
          const apr = interestRate + 1; // Simplified APR calculation

          setLoanOffer({
            monthlyPayment: monthlyPayment,
            totalInterest: totalInterest,
            apr: apr,
          });
        };

        return (
          <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Auto Loan Calculator</h1>

            <div className="bg-white p-5 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Loan Application</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-600 mb-1">Loan Amount</label>
                  <input
                    id="loanAmount"
                    type="number"
                    name="loanAmount"
                    value={loanApplication.loanAmount}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="interestRate" className="block text-sm font-medium text-gray-600 mb-1">Interest Rate (%)</label>
                  <input
                    id="interestRate"
                    type="number"
                    name="interestRate"
                    value={loanApplication.interestRate}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-600 mb-1">Loan Term (Months)</label>
                  <input
                    id="loanTerm"
                    type="number"
                    name="loanTerm"
                    value={loanApplication.loanTerm}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="creditScore" className="block text-sm font-medium text-gray-600 mb-1">Credit Score</label>
                  <input
                    id="creditScore"
                    type="number"
                    name="creditScore"
                    value={loanApplication.creditScore}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="income" className="block text-sm font-medium text-gray-600 mb-1">Annual Income</label>
                  <input
                    id="income"
                    type="number"
                    name="income"
                    value={loanApplication.income}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={calculateLoan}
                className="mt-4 px-5 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Calculate Loan
              </button>
            </div>

            {loanOffer && (
              <div className="bg-white p-5 rounded-lg shadow-md mt-6">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">Loan Offer</h2>
                <p className="text-lg mb-2">Monthly Payment: <span className="font-bold text-green-600">${loanOffer.monthlyPayment.toFixed(2)}</span></p>
                <p className="text-lg mb-2">Total Interest: <span className="font-bold text-green-600">${loanOffer.totalInterest.toFixed(2)}</span></p>
                <p className="text-lg mb-2">APR: <span className="font-bold text-green-600">{loanOffer.apr.toFixed(2)}%</span></p>
              </div>
            )}
          </div>
        );
      };

      export default AutoLoanCalculator;
    }
  }

  // 3. Citibankdemobusinessinc.investwise.portfoliomanager
  export namespace investwise {
    export namespace portfoliomanager {
      interface Asset {
        name: string;
        symbol: string;
        quantity: number;
        price: number;
      }

      interface PortfolioSummary {
        totalValue: number;
        dailyChange: number;
      }

      const PortfolioManager: React.FC = () => {
        const [assets, setAssets] = useState<Asset[]>([
          { name: 'Apple', symbol: 'AAPL', quantity: 10, price: 150 },
          { name: 'Tesla', symbol: 'TSLA', quantity: 5, price: 600 },
        ]);

        const calculatePortfolioSummary = (): PortfolioSummary => {
          let totalValue = 0;
          let dailyChange = 0;

          assets.forEach((asset) => {
            totalValue += asset.quantity * asset.price;
            dailyChange += asset.quantity * (Math.random() - 0.5) * 10; // Simulate daily price change
          });

          return {
            totalValue: totalValue,
            dailyChange: dailyChange,
          };
        };

        const portfolioSummary = calculatePortfolioSummary();

        return (
          <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Portfolio Manager</h1>

            <div className="bg-white p-5 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Portfolio Summary</h2>
              <p className="text-lg mb-2">Total Value: <span className="font-bold text-green-600">${portfolioSummary.totalValue.toFixed(2)}</span></p>
              <p className="text-lg mb-2">Daily Change: <span className={`font-bold ${portfolioSummary.dailyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{portfolioSummary.dailyChange.toFixed(2)}</span></p>
            </div>

            <div className="bg-white p-5 rounded-lg shadow-md mt-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Assets</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assets.map((asset, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asset.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.symbol}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{asset.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${asset.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${(asset.quantity * asset.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      };

      export default PortfolioManager;
    }
  }

  // 4. Citibankdemobusinessinc.securevault.passwordmanager
  export namespace securevault {
    export namespace passwordmanager {
      interface PasswordEntry {
        id: string;
        website: string;
        username: string;
        passwordHash: string;
      }

      const PasswordManager: React.FC = () => {
        const [passwords, setPasswords] = useState<PasswordEntry[]>([
          { id: Kernel.generateId(), website: 'google.com', username: 'user1', passwordHash: 'hashed_password1' },
          { id: Kernel.generateId(), website: 'facebook.com', username: 'user2', passwordHash: 'hashed_password2' },
        ]);

        const generatePassword = (): string => {
          const length = Math.floor(Kernel.generateRandomNumber(8, 16));
          const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
          let password = "";
          for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
          }
          return password;
        };

        const addPasswordEntry = () => {
          const newPassword = generatePassword();
          const newEntry: PasswordEntry = {
            id: Kernel.generateId(),
            website: 'example.com',
            username: 'new_user',
            passwordHash: `hashed_${newPassword}`,
          };
          setPasswords((prevPasswords) => [...prevPasswords, newEntry]);
        };

        return (
          <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Password Manager</h1>

            <div className="bg-white p-5 rounded-lg shadow-md">
              <h2 className="