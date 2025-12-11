```typescript
import React from 'react';
import { Global, css } from '@emotion/react';

// In a real application, this data would be fetched from a financial data API
const tickerData = [
  { label: 'US 10Y T-Note', value: '4.251%', change: '+0.023', isPositive: true },
  { label: 'US 2Y T-Note', value: '4.732%', change: '-0.011', isPositive: false },
  { label: 'German 10Y Bund', value: '2.378%', change: '+0.015', isPositive: true },
  { label: 'UK 10Y Gilt', value: '3.989%', change: '+0.030', isPositive: true },
  { label: 'Japan 10Y JGB', value: '0.655%', change: '+0.002', isPositive: true },
  { label: 'CDX IG CDSI S39 5Y', value: '55.12 bps', change: '-0.50', isPositive: false },
  { label: 'iTraxx Europe S39 5Y', value: '62.75 bps', change: '+0.25', isPositive: true },
  { label: 'Fed Funds Rate', value: '5.25-5.50%', change: '0.00', isPositive: null },
  { label: 'SOFR', value: '5.31%', change: '+0.01', isPositive: true },
  { label: 'EURIBOR 3M', value: '3.945%', change: '-0.001', isPositive: false },
];

type TickerItemData = {
    label: string;
    value: string;
    change: string;
    isPositive: boolean | null;
};

const TickerItem: React.FC<{ item: TickerItemData }> = ({ item }) => {
  const changeColor = item.isPositive === true ? '#4caf50' : item.isPositive === false ? '#f44336' : '#9e9e9e';
  const changeSymbol = item.isPositive === true ? '▲' : item.isPositive === false ? '▼' : '';

  return (
    <div style={{ display: 'inline-block', padding: '0 1.5rem', fontSize: '0.9rem', fontFamily: 'monospace' }}>
      <span style={{ color: '#aaa', marginRight: '0.5rem' }}>{item.label}</span>
      <span style={{ fontWeight: 'bold' }}>{item.value}</span>
      <span style={{ color: changeColor, marginLeft: '0.5rem', minWidth: '60px', display: 'inline-block', textAlign: 'left' }}>
        {changeSymbol} {item.change}
      </span>
    </div>
  );
};

const TickerTape: React.FC = () => {
    // Duplicate the data array to create a seamless, infinite scrolling effect
    const duplicatedData = [...tickerData, ...tickerData];
  
    return (
      <header style={{
        backgroundColor: '#1a1a1e',
        color: '#f0f0f0',
        padding: '10px 0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        borderBottom: '1px solid #333',
        width: '100%',
      }}>
        <div className="ticker-scroll">
          {duplicatedData.map((item, index) => (
            <TickerItem key={index} item={item} />
          ))}
        </div>
      </header>
    );
};

interface FixedIncomeLayoutProps {
  children: React.ReactNode;
}

const FixedIncomeLayout: React.FC<FixedIncomeLayoutProps> = ({ children }) => {
  // Adjust animation duration based on the number of items for a consistent speed
  const animationDuration = tickerData.length * 6; // Approx. 6 seconds per item

  return (
    <>
      <Global
        styles={css`
          @keyframes scroll-left {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          .ticker-scroll {
            display: inline-block;
            animation: scroll-left ${animationDuration}s linear infinite;
          }
          
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f0f2f5;
          }
        `}
      />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TickerTape />
        <main style={{ flex: 1, padding: '24px', backgroundColor: '#ffffff' }}>
          {children}
        </main>
      </div>
    </>
  );
};

export default FixedIncomeLayout;
```