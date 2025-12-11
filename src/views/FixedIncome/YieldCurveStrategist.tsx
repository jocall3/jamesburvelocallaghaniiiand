```typescript
import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// --- Mock Data ---
// In a real application, this would be fetched from an API.
const MOCK_YIELD_DATA = {
  '2024-07-26': [
    { tenor: '1M', yield: 5.35 },
    { tenor: '3M', yield: 5.38 },
    { tenor: '6M', yield: 5.36 },
    { tenor: '1Y', yield: 5.10 },
    { tenor: '2Y', yield: 4.85 },
    { tenor: '3Y', yield: 4.60 },
    { tenor: '5Y', yield: 4.40 },
    { tenor: '7Y', yield: 4.35 },
    { tenor: '10Y', yield: 4.30 },
    { tenor: '20Y', yield: 4.55 },
    { tenor: '30Y', yield: 4.50 },
  ],
  '2021-05-15': [
    { tenor: '1M', yield: 0.01 },
    { tenor: '3M', yield: 0.02 },
    { tenor: '6M', yield: 0.04 },
    { tenor: '1Y', yield: 0.06 },
    { tenor: '2Y', yield: 0.15 },
    { tenor: '3Y', yield: 0.32 },
    { tenor: '5Y', yield: 0.80 },
    { tenor: '7Y', yield: 1.25 },
    { tenor: '10Y', yield: 1.63 },
    { tenor: '20Y', yield: 2.21 },
    { tenor: '30Y', yield: 2.34 },
  ],
  '2007-03-15': [
    { tenor: '1M', yield: 5.25 },
    { tenor: '3M', yield: 5.20 },
    { tenor: '6M', yield: 5.15 },
    { tenor: '1Y', yield: 4.80 },
    { tenor: '2Y', yield: 4.55 },
    { tenor: '3Y', yield: 4.52 },
    { tenor: '5Y', yield: 4.50 },
    { tenor: '7Y', yield: 4.51 },
    { tenor: '10Y', yield: 4.53 },
    { tenor: '20Y', yield: 4.70 },
    { tenor: '30Y', yield: 4.69 },
  ],
};

const availableDates = Object.keys(MOCK_YIELD_DATA);
const TENORS = ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];

const styles = {
  pageContainer: {
    fontFamily: 'Arial, sans-serif',
    color: '#333',
    padding: '24px',
    backgroundColor: '#f9f9f9',
  },
  header: {
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '12px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a237e',
    margin: 0,
  },
  subtitle: {
    fontSize: '16px',
    color: '#555',
    margin: '4px 0 0 0',
  },
  controls: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#444',
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    alignItems: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  chartContainer: {
    height: '500px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1a237e',
  },
  spreadsContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '24px',
    textAlign: 'center',
  },
  spreadValue: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  spreadLabel: {
    fontSize: '14px',
    color: '#666',
  },
  analysisSection: {
    marginBottom: '20px',
  },
  analysisTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    borderBottom: '1px solid #eee',
    paddingBottom: '8px',
    marginBottom: '12px',
  },
  analysisText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#555',
  },
  strategyList: {
    listStyle: 'none',
    padding: 0,
  },
  strategyItem: {
    marginBottom: '12px',
  },
  strategyName: {
    fontWeight: 'bold',
  },
};

const YieldCurveStrategist: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(availableDates[0]);
  const [historicalDate, setHistoricalDate] = useState(availableDates[1]);

  const { chartData, currentCurve, spreads, analysis } = useMemo(() => {
    const currentData = MOCK_YIELD_DATA[currentDate as keyof typeof MOCK_YIELD_DATA];
    const historicalData = MOCK_YIELD_DATA[historicalDate as keyof typeof MOCK_YIELD_DATA];

    const combined = TENORS.map(tenor => {
      const currentPoint = currentData.find(d => d.tenor === tenor);
      const historicalPoint = historicalData.find(d => d.tenor === tenor);
      return {
        tenor,
        [currentDate]: currentPoint ? currentPoint.yield : null,
        [historicalDate]: historicalPoint ? historicalPoint.yield : null,
      };
    });

    const tenYearYield = currentData.find(d => d.tenor === '10Y')?.yield ?? 0;
    const twoYearYield = currentData.find(d => d.tenor === '2Y')?.yield ?? 0;
    const threeMonthYield = currentData.find(d => d.tenor === '3M')?.yield ?? 0;

    const spread10y2y = (tenYearYield - twoYearYield) * 100; // in basis points
    const spread10y3m = (tenYearYield - threeMonthYield) * 100; // in basis points

    let shape = 'Normal';
    let strategy = 'Bullet';
    let shapeDescription = 'Long-term yields are higher than short-term yields, indicating expectations for healthy economic growth.';
    let strategyRecommendation = 'A **bullet strategy**, concentrating holdings in the middle of the curve (e.g., 5-7 years), could be effective. It offers a balance of yield and moderate duration risk.';
    let commentary = 'The market is pricing in stable growth and inflation. The Federal Reserve is likely to maintain its current policy stance or embark on a predictable, gradual hiking cycle.';

    if (spread10y2y < 25 && spread10y2y > -10) {
      shape = 'Flat';
      shapeDescription = 'There is little difference between short-term and long-term yields. This often suggests economic uncertainty and a potential transition in the business cycle.';
      strategy = 'Ladder';
      strategyRecommendation = 'A **laddered portfolio** is prudent during periods of uncertainty. By staggering maturities, investors can mitigate reinvestment risk and benefit from potential rate changes across the curve.';
      commentary = 'The market is uncertain about the future direction of inflation and growth. The Federal Reserve may be nearing the end of a hiking cycle, leading to investor caution.';
    }

    if (spread10y2y <= -10) {
      shape = 'Inverted';
      shapeDescription = 'Short-term yields are higher than long-term yields. This is a classic, though not infallible, predictor of a potential economic recession in the next 6-18 months.';
      strategy = 'Barbell';
      strategyRecommendation = 'A **barbell strategy** could be optimal. It combines short-duration bonds for high current yields and liquidity, with long-duration bonds to capture capital appreciation if the Fed cuts rates in a downturn.';
      commentary = 'The market is signaling a pessimistic outlook for economic growth, anticipating that the Federal Reserve will need to cut rates in the future to stimulate the economy.';
    }
    
    return {
      chartData: combined,
      currentCurve: currentData,
      spreads: {
        '10Y-2Y': spread10y2y.toFixed(2),
        '10Y-3M': spread10y3m.toFixed(2),
      },
      analysis: {
        shape,
        strategy,
        shapeDescription,
        strategyRecommendation,
        commentary,
      },
    };
  }, [currentDate, historicalDate]);

  const renderSpread = (label: string, value: string) => {
    const valNum = parseFloat(value);
    const color = valNum >= 0 ? '#2e7d32' : '#c62828';
    return (
      <div>
        <div style={{ ...styles.spreadValue, color }}>{valNum > 0 ? '+' : ''}{value} bps</div>
        <div style={styles.spreadLabel}>{label} Spread</div>
      </div>
    );
  };
  
  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <h1 style={styles.title}>Yield Curve Strategist</h1>
        <p style={styles.subtitle}>Analyze yield curve dynamics to inform duration and positioning strategy.</p>
      </header>

      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <label htmlFor="current-date" style={styles.label}>Current Curve Date</label>
          <select id="current-date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} style={styles.select}>
            {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
          </select>
        </div>
        <div style={styles.controlGroup}>
          <label htmlFor="historical-date" style={styles.label}>Comparison Curve Date</label>
          <select id="historical-date" value={historicalDate} onChange={e => setHistoricalDate(e.target.value)} style={styles.select}>
            {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
          </select>
        </div>
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.card}>
            <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tenor" />
                    <YAxis unit="%" domain={['auto', 'auto']} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                    <Line type="monotone" dataKey={currentDate} stroke="#1a237e" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey={historicalDate} stroke="#8c9eff" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Curve Analysis & Strategy</h2>
          <div style={styles.spreadsContainer}>
            {renderSpread('10Y - 2Y', spreads['10Y-2Y'])}
            {renderSpread('10Y - 3M', spreads['10Y-3M'])}
          </div>

          <div style={styles.analysisSection}>
            <h3 style={styles.analysisTitle}>Curve Shape: <span style={{color: '#1a237e'}}>{analysis.shape}</span></h3>
            <p style={styles.analysisText}>{analysis.shapeDescription}</p>
          </div>

          <div style={styles.analysisSection}>
            <h3 style={styles.analysisTitle}>Strategic Outlook: <span style={{color: '#1a237e'}}>{analysis.strategy} Strategy</span></h3>
            <p style={styles.analysisText} dangerouslySetInnerHTML={{ __html: analysis.strategyRecommendation }} />
          </div>

          <div style={styles.analysisSection}>
            <h3 style={styles.analysisTitle}>Market Commentary</h3>
            <p style={styles.analysisText}>{analysis.commentary}</p>
          </div>
        </div>
      </div>

      <div style={{...styles.card, marginTop: '24px'}}>
        <h2 style={styles.cardTitle}>Duration Strategy Definitions</h2>
        <ul style={styles.strategyList}>
            <li style={styles.strategyItem}>
                <p><strong style={styles.strategyName}>Bullet Strategy:</strong> Concentrates all bond holdings around a single maturity point on the yield curve. This is used to target a specific duration and yield profile, often in the intermediate part of the curve.</p>
            </li>
            <li style={styles.strategyItem}>
                <p><strong style={styles.strategyName}>Barbell Strategy:</strong> A portfolio is constructed with holdings in both very short-term and very long-term bonds, with minimal holdings in intermediate maturities. This strategy can perform well during periods of curve flattening or inversion.</p>
            </li>
            <li style={styles.strategyItem}>
                <p><strong style={styles.strategyName}>Ladder Strategy:</strong> Involves staggering the maturity dates of bonds in a portfolio. As shorter-term bonds mature, the principal is reinvested in new long-term bonds, providing steady cash flow and mitigating reinvestment risk.</p>
            </li>
        </ul>
      </div>
    </div>
  );
};

export default YieldCurveStrategist;
```