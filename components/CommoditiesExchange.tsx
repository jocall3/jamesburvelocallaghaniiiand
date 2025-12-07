




import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- Types & Interfaces ---

interface Commodity {
  id: string;
  name: string;
  symbol: string;
  basePrice: number;
  volatility: number;
  description: string;
  category: 'Metal' | 'Energy' | 'Agricultural' | 'Future';
}

interface PricePoint {
  time: number;
  price: number;
}

interface PortfolioItem {
  commodityId: string;
  quantity: number;
  averageBuyPrice: number;
}

interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  commodityId: string;
  price: number;
  quantity: number;
  timestamp: number;
}

// --- Configuration ---

const COMMODITIES: Commodity[] = [
  { id: '1', name: 'Gold Bullion', symbol: 'XAU', basePrice: 1950.00, volatility: 0.008, description: 'Standard Gold Bullion (1 oz)', category: 'Metal' },
  { id: '2', name: 'Silver', symbol: 'XAG', basePrice: 24.50, volatility: 0.012, description: 'Silver Ingots (1 oz)', category: 'Metal' },
  { id: '3', name: 'Lithium Carbonate', symbol: 'LITH', basePrice: 71000.00, volatility: 0.025, description: 'Battery grade Lithium', category: 'Energy' },
  { id: '4', name: 'Water Rights (Global)', symbol: 'H2O', basePrice: 450.00, volatility: 0.005, description: 'Acre-foot water rights index', category: 'Future' },
  { id: '5', name: 'Crude Oil', symbol: 'WTI', basePrice: 78.00, volatility: 0.015, description: 'West Texas Intermediate', category: 'Energy' },
  { id: '6', name: 'Platinum', symbol: 'XPT', basePrice: 980.00, volatility: 0.010, description: 'Platinum bars', category: 'Metal' },
  { id: '7', name: 'Palladium', symbol: 'XPD', basePrice: 1400.00, volatility: 0.018, description: 'Industrial Palladium', category: 'Metal' },
  { id: '8', name: 'Cobalt', symbol: 'COB', basePrice: 34000.00, volatility: 0.020, description: 'Refined Cobalt', category: 'Energy' },
  { id: '9', name: 'Rare Earth Basket', symbol: 'REE', basePrice: 12500.00, volatility: 0.015, description: 'Neodymium/Praseodymium mix', category: 'Metal' },
  { id: '10', name: 'Carbon Credits', symbol: 'CO2', basePrice: 85.00, volatility: 0.030, description: 'EU Emissions Allowances', category: 'Future' },
];

const INITIAL_CASH = 1000000; // $1,000,000 start
const HISTORY_LENGTH = 100;
const TICK_RATE_MS = 1000;

// --- Helper Components ---

// Simple SVG Line Chart with Gradient
const MarketChart = ({ data, color, height = 300 }: { data: PricePoint[]; color: string; height?: number }) => {
  if (data.length < 2) return <div style={{ height }} className="flex items-center justify-center text-gray-500">Initializing Feed...</div>;

  const maxVal = Math.max(...data.map(d => d.price));
  const minVal = Math.min(...data.map(d => d.price));
  const range = maxVal - minVal;
  const padding = range * 0.1; // 10% padding
  
  // Normalize points
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (((d.price - minVal + padding) / (range + padding * 2)) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px`, overflow: 'hidden' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M0,100 L0,${100 - (((data[0].price - minVal + padding) / (range + padding * 2)) * 100)} ${points.replace(/,/g, ' ').split(' ').map((coord, i) => (i % 2 === 0 ? 'L' + coord : coord)).join(' ')} L100,100 Z`}
          fill={`url(#grad-${color})`}
          stroke="none"
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Price Labels */}
      <div style={{ position: 'absolute', right: 5, top: 5, fontSize: '10px', color: '#888' }}>{maxVal.toFixed(2)}</div>
      <div style={{ position: 'absolute', right: 5, bottom: 5, fontSize: '10px', color: '#888' }}>{minVal.toFixed(2)}</div>
    </div>
  );
};

// --- Main Component ---

export default function CommoditiesExchange() {
  // --- State ---
  const [prices, setPrices] = useState<{ [key: string]: PricePoint[] }>({});
  const [currentPrices, setCurrentPrices] = useState<{ [key: string]: number }>({});
  const [selectedId, setSelectedId] = useState<string>(COMMODITIES[0].id);
  const [cash, setCash] = useState<number>(INITIAL_CASH);
  const [portfolio, setPortfolio] = useState<{ [key: string]: PortfolioItem }>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orderAmount, setOrderAmount] = useState<string>('');
  const [isBuy, setIsBuy] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Initialization & Simulation ---

  // Initialize price history
  useEffect(() => {
    const initialHistory: { [key: string]: PricePoint[] } = {};
    const initialCurrent: { [key: string]: number } = {};

    COMMODITIES.forEach(c => {
      let price = c.basePrice;
      const history: PricePoint[] = [];
      const now = Date.now();
      
      // Generate past data
      for (let i = HISTORY_LENGTH; i > 0; i--) {
        const change = (Math.random() - 0.5) * c.volatility * price;
        price += change;
        history.push({ time: now - (i * TICK_RATE_MS), price });
      }
      initialHistory[c.id] = history;
      initialCurrent[c.id] = price;
    });

    setPrices(initialHistory);
    setCurrentPrices(initialCurrent);
  }, []);

  // Live simulation ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prevHistory: { [key: string]: PricePoint[] }) => {
        const newHistory = { ...prevHistory };
        const newCurrent: { [key: string]: number } = {};
        const now = Date.now();

        COMMODITIES.forEach(c => {
          const currentHistory = prevHistory[c.id] || [];
          
          const lastPrice = (currentHistory[currentHistory.length - 1]?.price ?? c.basePrice) as number;
          
          // Random Walk simulation
          const sentiment = Math.random() > 0.5 ? 1 : -1;
          const magnitude = Math.random() * c.volatility;
          const delta = lastPrice * magnitude * sentiment;
          let newPrice = lastPrice + delta;
          
          // Ensure price never goes below 0.01
          if (newPrice < 0.01) newPrice = 0.01;

          newCurrent[c.id] = newPrice;
          
          const newPoints = [...currentHistory, { time: now, price: newPrice }];
          if (newPoints.length > HISTORY_LENGTH) newPoints.shift();
          newHistory[c.id] = newPoints;
        });
        
        setCurrentPrices(newCurrent);
        return newHistory;
      });
    }, TICK_RATE_MS);

    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---

  const handleTrade = () => {
    const qty = parseFloat(orderAmount);
    if (isNaN(qty) || qty <= 0) return;

    const price = currentPrices[selectedId];
    const totalCost = price * qty;
    const commodity = COMMODITIES.find(c => c.id === selectedId);

    if (isBuy) {
      if (cash >= totalCost) {
        setCash(prev => prev - totalCost);
        setPortfolio(prev => {
          const currentItem = prev[selectedId] || { commodityId: selectedId, quantity: 0, averageBuyPrice: 0 };
          const newQty = currentItem.quantity + qty;
          // Weighted average price
          const newAvgPrice = ((currentItem.quantity * currentItem.averageBuyPrice) + (qty * price)) / newQty;
          
          return {
            ...prev,
            [selectedId]: { ...currentItem, quantity: newQty, averageBuyPrice: newAvgPrice }
          };
        });
        recordTransaction('BUY', selectedId, price, qty);
        showNotification(`Bought ${qty} ${commodity?.symbol} for $${totalCost.toLocaleString()}`);
      } else {
        showNotification("Insufficient Funds");
      }
    } else {
      // Sell
      const currentItem = portfolio[selectedId];
      if (currentItem && currentItem.quantity >= qty) {
        setCash(prev => prev + totalCost);
        setPortfolio(prev => {
          const newQty = currentItem.quantity - qty;
          if (newQty <= 0) {
            const { [selectedId]: removed, ...rest } = prev;
            return rest;
          }
          return {
            ...prev,
            [selectedId]: { ...currentItem, quantity: newQty }
          };
        });
        recordTransaction('SELL', selectedId, price, qty);
        showNotification(`Sold ${qty} ${commodity?.symbol} for $${totalCost.toLocaleString()}`);
      } else {
        showNotification("Insufficient Quantity");
      }
    }
  };

  const recordTransaction = (type: 'BUY' | 'SELL', commodityId: string, price: number, quantity: number) => {
    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      commodityId,
      price,
      quantity,
      timestamp: Date.now()
    };
    setTransactions(prev => [tx, ...prev].slice(0, 50));
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Derived Data ---

  const selectedCommodity = COMMODITIES.find(c => c.id === selectedId) || COMMODITIES[0];
  const selectedHistory = prices[selectedId] || [];
  const selectedPrice = currentPrices[selectedId] || selectedCommodity.basePrice;
  const previousPrice = selectedHistory.length > 1 ? selectedHistory[selectedHistory.length - 2].price : selectedPrice;
  const isUp = selectedPrice >= previousPrice;
  const percentChange = ((selectedPrice - previousPrice) / previousPrice) * 100;

  const totalPortfolioValue = Object.values(portfolio).reduce((acc, item: PortfolioItem) => {
    const currentPrice = currentPrices[item.commodityId] || 0;
    return acc + (item.quantity * currentPrice);
  }, 0);
  
  const totalNetWorth = cash + totalPortfolioValue;

  // --- Styles ---

  const styles = {
    container: {
      backgroundColor: '#0f172a', // Slate 900
      color: '#e2e8f0', // Slate 200
      fontFamily: 'Inter, system-ui, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      backgroundColor: '#1e293b', // Slate 800
      padding: '1rem 2rem',
      borderBottom: '1px solid #334155',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    main: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '300px 1fr 350px',
      gap: '1px',
      backgroundColor: '#334155' // Grid lines color
    },
    panel: {
      backgroundColor: '#0f172a',
      padding: '1.5rem',
      overflowY: 'auto' as const,
      maxHeight: 'calc(100vh - 80px)'
    },
    card: {
      backgroundColor: '#1e293b',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    cardSelected: {
      backgroundColor: '#334155',
      borderLeft: '4px solid #3b82f6'
    },
    priceUp: { color: '#10b981' },
    priceDown: { color: '#ef4444' },
    button: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '6px',
      border: 'none',
      fontWeight: 'bold' as const,
      cursor: 'pointer',
      marginTop: '1rem',
      color: '#fff'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '6px',
      backgroundColor: '#0f172a',
      border: '1px solid #334155',
      color: '#fff',
      marginTop: '0.5rem',
      marginBottom: '0.5rem'
    },
    label: {
      fontSize: '0.85rem',
      color: '#94a3b8',
      display: 'block',
      marginBottom: '0.25rem'
    },
    tag: {
      fontSize: '0.7rem',
      padding: '0.2rem 0.5rem',
      borderRadius: '4px',
      backgroundColor: '#334155',
      marginRight: '0.5rem'
    }
  };

  return (
    <div style={styles.container} ref={containerRef}>
      {/* --- Global Styles for Scrollbars --- */}
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>

      {/* --- Header --- */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>CE</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Balcony of Prosperity</h1>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Commodities Exchange Desk</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Net Worth</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
            ${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <div style={styles.main}>
        
        {/* --- Left Column: Market Watch --- */}
        <div style={styles.panel}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Market Watch</h3>
          {COMMODITIES.map(c => {
            const price = currentPrices[c.id] || c.basePrice;
            const history = prices[c.id] || [];
            const prev = history.length > 1 ? history[history.length - 2].price : price;
            const change = price - prev;
            const pct = (change / prev) * 100;
            const isGain = change >= 0;

            return (
              <div 
                key={c.id} 
                style={{ ...styles.card, ...(selectedId === c.id ? styles.cardSelected : {}) }}
                onClick={() => setSelectedId(c.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{c.symbol}</span>
                  <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>${price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>{c.name}</span>
                  <span style={isGain ? styles.priceUp : styles.priceDown}>
                    {isGain ? '+' : ''}{pct.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- Middle Column: Chart & Details --- */}
        <div style={{ ...styles.panel, display: 'flex', flexDirection: 'column' }}>
          {/* Chart Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={styles.tag}>{selectedCommodity.category}</span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{selectedCommodity.description}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '2rem' }}>{selectedCommodity.name} <span style={{ color: '#64748b', fontSize: '1rem' }}>/ USD</span></h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: isUp ? '#10b981' : '#ef4444' }}>
                ${selectedPrice.toFixed(2)}
              </div>
              <div style={{ color: isUp ? '#10b981' : '#ef4444' }}>
                {isUp ? '▲' : '▼'} {Math.abs(selectedPrice - previousPrice).toFixed(2)} ({percentChange.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Chart Visual */}
          <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
             <MarketChart 
               data={selectedHistory} 
               color={isUp ? '#10b981' : '#ef4444'} 
               height={400}
             />
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
               <span>T-100s</span>
               <span>T-50s</span>
               <span>Live</span>
             </div>
          </div>

          {/* Description / Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
             <div style={styles.card}>
               <div style={styles.label}>Volatility Index</div>
               <div style={{ fontSize: '1.1rem' }}>{(selectedCommodity.volatility * 100).toFixed(1)}%</div>
             </div>
             <div style={styles.card}>
               <div style={styles.label}>24h High (Sim)</div>
               <div style={{ fontSize: '1.1rem' }}>${(Math.max(...selectedHistory.map(h => h.price)) || 0).toFixed(2)}</div>
             </div>
             <div style={styles.card}>
               <div style={styles.label}>24h Low (Sim)</div>
               <div style={{ fontSize: '1.1rem' }}>${(Math.min(...selectedHistory.map(h => h.price)) || 0).toFixed(2)}</div>
             </div>
          </div>
        </div>

        {/* --- Right Column: Trading Desk --- */}
        <div style={{ ...styles.panel, flexDirection: 'column', display: 'flex' }}>
          
          {/* Balance Card */}
          <div style={{ ...styles.card, background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid #334155' }}>
             <div style={styles.label}>Available Cash</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>${cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>

          {/* Position Card */}
          <div style={styles.card}>
            <div style={styles.label}>Your Position: {selectedCommodity.symbol}</div>
            {portfolio[selectedId] ? (
               <div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {portfolio[selectedId].quantity.toFixed(4)} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>units</span>
                 </div>
                 <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                    Avg Price: ${portfolio[selectedId].averageBuyPrice.toFixed(2)}
                 </div>
                 <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: (selectedPrice - portfolio[selectedId].averageBuyPrice) >= 0 ? '#10b981' : '#ef4444' }}>
                    P/L: {((selectedPrice - portfolio[selectedId].averageBuyPrice) * portfolio[selectedId].quantity).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                 </div>
               </div>
            ) : (
              <div style={{ color: '#64748b', fontStyle: 'italic' }}>No open position</div>
            )}
          </div>

          {/* Order Entry */}
          <div style={{ ...styles.card, border: '1px solid #475569' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#e2e8f0' }}>Execute Order</h4>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                onClick={() => setIsBuy(true)}
                style={{ ...styles.button, marginTop: 0, backgroundColor: isBuy ? '#10b981' : '#1e293b', border: isBuy ? 'none' : '1px solid #334155', color: isBuy ? '#fff' : '#94a3b8' }}
              >
                Buy
              </button>
              <button 
                onClick={() => setIsBuy(false)}
                style={{ ...styles.button, marginTop: 0, backgroundColor: !isBuy ? '#ef4444' : '#1e293b', border: !isBuy ? 'none' : '1px solid #334155', color: !isBuy ? '#fff' : '#94a3b8' }}
              >
                Sell
              </button>
            </div>

            <label style={styles.label}>Quantity</label>
            <input 
              type="number" 
              value={orderAmount} 
              onChange={(e) => setOrderAmount(e.target.value)}
              placeholder="0.00"
              style={styles.input}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
               <span>Est. Total</span>
               <span>${((parseFloat(orderAmount) || 0) * selectedPrice).toLocaleString()}</span>
            </div>

            <button 
              onClick={handleTrade}
              style={{ ...styles.button, backgroundColor: isBuy ? '#10b981' : '#ef4444', opacity: !orderAmount ? 0.5 : 1 }}
              disabled={!orderAmount}
            >
              {isBuy ? `Buy ${selectedCommodity.symbol}` : `Sell ${selectedCommodity.symbol}`}
            </button>
            
            {notification && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                {notification}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Recent Activity</h4>
            <div style={{ fontSize: '0.8rem' }}>
              {transactions.length === 0 && <div style={{ color: '#64748b' }}>No transactions yet</div>}
              {transactions.map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #1e293b' }}>
                  <div>
                    <span style={{ color: tx.type === 'BUY' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{tx.type}</span> 
                    <span style={{ marginLeft: '0.5rem', color: '#cbd5e1' }}>{COMMODITIES.find(c => c.id === tx.commodityId)?.symbol}</span>
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    {tx.quantity.toFixed(2)} @ ${tx.price.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
