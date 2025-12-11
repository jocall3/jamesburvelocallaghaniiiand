```typescript
import React, { useMemo } from 'react';

// TypeScript interfaces for our data structures
interface CurrencyHolding {
  currency: string;
  amount: number;
}

interface EntityData {
  id: string;
  name: string;
  holdings: CurrencyHolding[];
}

export interface LiquidityMapProps {
  data: EntityData[];
  title?: string;
}

/**
 * A helper function to format numbers into a standardized string format
 * with commas and two decimal places.
 */
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * LiquidityMap is a visual component that displays a matrix of funds
 * distributed across various holding entities and currencies. It provides
 * a clear overview of global liquidity positions.
 */
const LiquidityMap: React.FC<LiquidityMapProps> = ({
  data,
  title = "Global Liquidity Map",
}) => {
  // useMemo hook to calculate derived data efficiently.
  // This avoids recalculation on every render unless the source `data` changes.
  const { uniqueCurrencies, entityTotals, currencyTotals, grandTotal } = useMemo(() => {
    const currencySet = new Set<string>();
    data.forEach(entity => {
      entity.holdings.forEach(holding => {
        currencySet.add(holding.currency);
      });
    });

    const sortedCurrencies = Array.from(currencySet).sort();
    const entityTotalsMap = new Map<string, number>();
    const currencyTotalsMap = new Map<string, number>();
    let currentGrandTotal = 0;

    // Calculate total for each entity
    data.forEach(entity => {
      const entityTotal = entity.holdings.reduce((sum, holding) => sum + holding.amount, 0);
      entityTotalsMap.set(entity.id, entityTotal);
      currentGrandTotal += entityTotal;
    });

    // Calculate total for each currency
    sortedCurrencies.forEach(currency => {
      const currencyTotal = data.reduce((sum, entity) => {
        const holding = entity.holdings.find(h => h.currency === currency);
        return sum + (holding ? holding.amount : 0);
      }, 0);
      currencyTotalsMap.set(currency, currencyTotal);
    });

    return {
      uniqueCurrencies: sortedCurrencies,
      entityTotals: entityTotalsMap,
      currencyTotals: currencyTotalsMap,
      grandTotal: currentGrandTotal,
    };
  }, [data]);

  // CSS-in-JS for styling the component.
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      backgroundColor: '#ffffff',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#212529',
      marginBottom: '1.5rem',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'right',
      fontSize: '0.9rem',
    },
    th: {
      backgroundColor: '#f8f9fa',
      color: '#495057',
      padding: '0.75rem 1rem',
      fontWeight: 600,
      border: '1px solid #dee2e6',
      borderBottomWidth: '2px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    td: {
      padding: '0.75rem 1rem',
      border: '1px solid #e9ecef',
      color: '#343a40',
    },
    entityCell: {
      textAlign: 'left',
      fontWeight: 500,
      color: '#0052cc',
    },
    totalCell: {
      fontWeight: 'bold',
      backgroundColor: '#f8f9fa',
    },
    rowOdd: {
      backgroundColor: '#f8f9fa',
    },
    rowEven: {
      backgroundColor: '#ffffff',
    },
    footer: {
      backgroundColor: '#e9ecef',
      fontWeight: 'bold',
      color: '#212529',
      borderTop: '2px solid #dee2e6',
    },
    zeroAmount: {
      color: '#adb5bd',
    },
    summary: {
      marginTop: '1.5rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid #dee2e6',
      textAlign: 'right',
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#212529',
    },
  };

  if (!data || data.length === 0) {
    return (
        <div style={styles.container}>
            <h2 style={styles.title}>{title}</h2>
            <p>No liquidity data available to display.</p>
        </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{title}</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, textAlign: 'left' }}>Holding Entity</th>
            {uniqueCurrencies.map(currency => (
              <th key={currency} style={styles.th}>{currency}</th>
            ))}
            <th style={{ ...styles.th, ...styles.totalCell }}>Entity Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entity, index) => {
            const rowStyle = index % 2 === 0 ? styles.rowEven : styles.rowOdd;
            return (
              <tr key={entity.id} style={rowStyle}>
                <td style={{ ...styles.td, ...styles.entityCell }}>{entity.name}</td>
                {uniqueCurrencies.map(currency => {
                  const holding = entity.holdings.find(h => h.currency === currency);
                  const amount = holding ? holding.amount : 0;
                  return (
                    <td key={currency} style={{ ...styles.td, ...(amount === 0 ? styles.zeroAmount : {}) }}>
                      {formatNumber(amount)}
                    </td>
                  );
                })}
                <td style={{ ...styles.td, ...styles.totalCell }}>
                  {formatNumber(entityTotals.get(entity.id) || 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={styles.footer}>
            <td style={{ ...styles.td, textAlign: 'left' }}>Grand Total</td>
            {uniqueCurrencies.map(currency => (
              <td key={currency} style={styles.td}>
                {formatNumber(currencyTotals.get(currency) || 0)}
              </td>
            ))}
            <td style={{ ...styles.td, ...styles.totalCell }}>
              {formatNumber(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
      <div style={styles.summary}>
        Total Global Liquidity: <strong>{formatNumber(grandTotal)}</strong>
      </div>
    </div>
  );
};

export default LiquidityMap;
```