import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Mock data and functions for demonstration purposes
// In a real application, these would come from APIs or state management
const mockFxRates = {
  USD: { EUR: 0.92, GBP: 0.79, JPY: 150.00 },
  EUR: { USD: 1.09, GBP: 0.86, JPY: 163.00 },
  GBP: { USD: 1.27, EUR: 1.16, JPY: 190.00 },
  JPY: { USD: 0.0067, EUR: 0.0061, GBP: 0.0053 },
};

const mockCashPositions = [
  { country: 'USA', city: 'New York', currency: 'USD', amount: 150000000 },
  { country: 'Germany', city: 'Frankfurt', currency: 'EUR', amount: 120000000 },
  { country: 'UK', city: 'London', currency: 'GBP', amount: 90000000 },
  { country: 'Japan', city: 'Tokyo', currency: 'JPY', amount: 10000000000 },
  { country: 'France', city: 'Paris', currency: 'EUR', amount: 80000000 },
];

const mockHedgeStrategies = [
  { id: 'H1', currencyPair: 'EUR/USD', type: 'Forward', amount: 5000000, expiry: '2024-12-31', rate: 1.08 },
  { id: 'H2', currencyPair: 'GBP/USD', type: 'Option', amount: 3000000, expiry: '2025-03-15', rate: 1.26 },
];

const mockHistoricalHedgePerformance = [
  { date: '2023-01-01', pnl: 15000 },
  { date: '2023-04-01', pnl: -5000 },
  { date: '2023-07-01', pnl: 25000 },
  { date: '2023-10-01', pnl: 10000 },
  { date: '2024-01-01', pnl: 30000 },
];

const mockCurrencyExposure = [
  { currency: 'EUR', exposure: -20000000 },
  { currency: 'GBP', exposure: 15000000 },
  { currency: 'JPY', exposure: -5000000000 },
];

// Custom icons for Leaflet markers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const GlobalTreasuryFXHubView: React.FC = () => {
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState<string>('USD');
  const [fxRates, setFxRates] = useState(mockFxRates);
  const [cashPositions, setCashPositions] = useState(mockCashPositions);
  const [hedgeStrategies, setHedgeStrategies] = useState(mockHedgeStrategies);
  const [currencyExposure, setCurrencyExposure] = useState(mockCurrencyExposure);
  const [historicalHedgePerformance, setHistoricalHedgePerformance] = useState(mockHistoricalHedgePerformance);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, fetch updated rates and data
      setFxRates(prevRates => {
        const newRates = { ...prevRates };
        // Simulate minor fluctuations
        for (const base in newRates) {
          for (const quote in newRates[base]) {
            newRates[base][quote] = parseFloat((newRates[base][quote] * (1 + (Math.random() - 0.5) * 0.001)).toFixed(5));
          }
        }
        return newRates;
      });
    }, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const getCountryCoordinates = (country: string): { lat: number; lng: number } | null => {
    // Simplified mapping for demonstration. A real app would use a more robust library or data source.
    const coords: { [key: string]: { lat: number; lng: number } } = {
      USA: { lat: 39.8283, lng: -98.5795 },
      Germany: { lat: 51.1657, lng: 10.4515 },
      UK: { lat: 55.3781, lng: -3.4360 },
      Japan: { lat: 36.2048, lng: 138.2529 },
      France: { lat: 46.2276, lng: 2.2137 },
    };
    return coords[country] || null;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
  };

  const handleExecuteTrade = (tradeDetails: any) => {
    console.log('Executing trade:', tradeDetails);
    // Implement trade execution logic
  };

  const handleManageHedge = (hedgeDetails: any) => {
    console.log('Managing hedge:', hedgeDetails);
    // Implement hedge management logic
  };

  return (
    <div className="global-treasury-fx-hub p-6 bg-gray-100 min-h-screen font-sans">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Global Treasury & FX Hub</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* FX Rates Widget */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Real-time FX Rates</h2>
          <div className="flex items-center mb-3">
            <label htmlFor="base-currency" className="mr-3 font-medium text-gray-600">Base Currency:</label>
            <select
              id="base-currency"
              value={selectedBaseCurrency}
              onChange={(e) => setSelectedBaseCurrency(e.target.value)}
              className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(mockFxRates).map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          <div className="overflow-y-auto max-h-64">
            {fxRates[selectedBaseCurrency] && Object.entries(fxRates[selectedBaseCurrency]).map(([currency, rate]) => (
              <div key={currency} className="flex justify-between py-2 border-b last:border-b-0">
                <span className="font-medium text-gray-600">{selectedBaseCurrency}/{currency}</span>
                <span className="text-blue-600 font-semibold">{rate.toFixed(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spot/Forward Trade Execution Widget */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Execute Trade</h2>
          <TradeExecutionForm
            availableCurrencies={Object.keys(mockFxRates)}
            currentFxRates={fxRates[selectedBaseCurrency] || {}}
            onExecuteTrade={handleExecuteTrade}
          />
        </div>

        {/* Hedging Strategies Widget */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Manage Hedging Strategies</h2>
          <div className="overflow-y-auto max-h-64">
            {hedgeStrategies.length === 0 ? (
              <p className="text-gray-500">No hedging strategies defined.</p>
            ) : (
              hedgeStrategies.map(hedge => (
                <div key={hedge.id} className="border p-3 rounded-md mb-3 last:mb-0">
                  <p><span className="font-medium">ID:</span> {hedge.id}</p>
                  <p><span className="font-medium">Pair:</span> {hedge.currencyPair}</p>
                  <p><span className="font-medium">Type:</span> {hedge.type}</p>
                  <p><span className="font-medium">Amount:</span> {formatCurrency(hedge.amount, hedge.currencyPair.split('/')[0])}</p>
                  <p><span className="font-medium">Expiry:</span> {hedge.expiry}</p>
                  <p><span className="font-medium">Rate:</span> {hedge.rate.toFixed(4)}</p>
                  <button
                    onClick={() => handleManageHedge(hedge)}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Manage
                  </button>
                </div>
              ))
            )}
          </div>
          <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500">
            Add New Hedge
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* World Map Visualization */}
        <div className="bg-white p-5 rounded-lg shadow-md col-span-1 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Global Cash Positions</h2>
          <div className="h-96 w-full">
            <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {cashPositions.map((pos, index) => {
                const coords = getCountryCoordinates(pos.country);
                if (!coords) return null;
                return (
                  <Marker key={index} position={[coords.lat, coords.lng]} icon={defaultIcon}>
                    <Popup>
                      <strong>{pos.country}</strong><br />
                      {pos.city}<br />
                      {formatCurrency(pos.amount, pos.currency)}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Exposure Chart */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Currency Exposure</h2>
          <div className="h-72 flex items-center justify-center">
            {currencyExposure.length > 0 ? (
              <BarChart data={currencyExposure.map(item => ({ label: item.currency, value: item.exposure }))} />
            ) : (
              <p className="text-gray-500">No currency exposure data available.</p>
            )}
          </div>
        </div>

        {/* Historical Hedge Performance Chart */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Historical Hedge Performance</h2>
          <div className="h-72 flex items-center justify-center">
            {historicalHedgePerformance.length > 0 ? (
              <LineChart data={historicalHedgePerformance.map(item => ({ label: item.date, value: item.pnl }))} />
            ) : (
              <p className="text-gray-500">No historical hedge performance data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components (Simplified for self-containment) ---

interface TradeExecutionFormProps {
  availableCurrencies: string[];
  currentFxRates: { [key: string]: number };
  onExecuteTrade: (details: any) => void;
}

const TradeExecutionForm: React.FC<TradeExecutionFormProps> = ({ availableCurrencies, currentFxRates, onExecuteTrade }) => {
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [amount, setAmount] = useState<string>('');
  const [tradeType, setTradeType] = useState<string>('Spot');
  const [rate, setRate] = useState<number>(0);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);

  useEffect(() => {
    if (currentFxRates[toCurrency]) {
      setRate(currentFxRates[toCurrency]);
      if (amount) {
        setCalculatedAmount(parseFloat(amount) * currentFxRates[toCurrency]);
      } else {
        setCalculatedAmount(0);
      }
    } else {
      setRate(0);
      setCalculatedAmount(0);
    }
  }, [toCurrency, amount, currentFxRates]);

  const handleExecute = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    onExecuteTrade({
      fromCurrency,
      toCurrency,
      amount: parseFloat(amount),
      tradeType,
      rate,
      calculatedAmount,
    });
    setAmount(''); // Clear form after execution
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleExecute(); }}>
      <div className="mb-3">
        <label htmlFor="from-currency" className="block text-sm font-medium text-gray-700 mb-1">From Currency</label>
        <select
          id="from-currency"
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {availableCurrencies.map(currency => <option key={currency} value={currency}>{currency}</option>)}
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor="to-currency" className="block text-sm font-medium text-gray-700 mb-1">To Currency</label>
        <select
          id="to-currency"
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {availableCurrencies.map(currency => <option key={currency} value={currency}>{currency}</option>)}
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount ({fromCurrency})</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 1000000"
          min="0"
          step="any"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="trade-type" className="block text-sm font-medium text-gray-700 mb-1">Trade Type</label>
        <select
          id="trade-type"
          value={tradeType}
          onChange={(e) => setTradeType(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Spot">Spot</option>
          <option value="Forward">Forward</option>
          <option value="Option">Option</option>
        </select>
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">Current Rate ({fromCurrency}/{toCurrency}): <span className="font-semibold">{rate.toFixed(5)}</span></p>
        <p className="text-sm text-gray-600">Estimated {toCurrency}: <span className="font-semibold">{calculatedAmount.toFixed(2)}</span></p>
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Execute Trade
      </button>
    </form>
  );
};

// --- Basic Chart Components (Simplified for self-containment) ---

interface ChartDataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartDataPoint[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  if (data.length === 0) return <p className="text-center text-gray-500">No data</p>;

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
  const chartHeight = 200; // Fixed height for the chart area

  return (
    <div className="flex items-end justify-around w-full h-full">
      {data.map((point, index) => {
        const barHeight = maxValue > 0 ? (Math.abs(point.value) / maxValue) * chartHeight : 0;
        const isPositive = point.value >= 0;
        const barColor = isPositive ? 'bg-green-500' : 'bg-red-500';
        const translateY = isPositive ? `${chartHeight - barHeight}` : `${chartHeight}`; // Position for negative bars

        return (
          <div key={index} className="flex flex-col items-center w-1/5">
            <div
              className={`w-8 ${barColor} rounded-t-md relative`}
              style={{
                height: `${barHeight}px`,
                transform: `translateY(-${isPositive ? 0 : barHeight}px)`, // Adjust for negative bars
                transformOrigin: 'bottom',
              }}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-700">
                {point.value.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-600">{point.label}</div>
          </div>
        );
      })}
    </div>
  );
};

interface LineChartProps {
  data: ChartDataPoint[];
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  if (data.length === 0) return <p className="text-center text-gray-500">No data</p>;

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  const chartHeight = 200; // Fixed height for the chart area

  const getYPosition = (value: number): string => {
    if (range === 0) return `${chartHeight / 2}px`; // All values are the same
    const normalizedValue = (value - minValue) / range;
    return `${chartHeight - normalizedValue * chartHeight}px`;
  };

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100; // Percentage along the width
    const y = parseFloat(getYPosition(point.value));
    return `${x}% ${y}px`;
  }).join(', ');

  return (
    <div className="relative w-full h-full">
      <svg className="w-full h-full" viewBox={`0 0 100 ${chartHeight}`}>
        <polyline
          points={points}
          fill="none"
          stroke="rgb(59, 130, 246)" // blue-500
          strokeWidth="2"
        />
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = parseFloat(getYPosition(point.value));
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}px`}
              r="3"
              fill="rgb(59, 130, 246)" // blue-500
            />
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-600">
        {data.map((point, index) => (
          <span key={index}>{point.label}</span>
        ))}
      </div>
      <div className="absolute top-0 left-0 bottom-0 w-px bg-gray-300"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300 opacity-50"></div>
    </div>
  );
};

export default GlobalTreasuryFXHubView;