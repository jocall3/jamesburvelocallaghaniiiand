```tsx
import React from 'react';

interface BondHolding {
  // Define the structure of a bond holding based on your data
  // Example properties:
  isin: string;
  cusip: string;
  quantity: number;
  averageCost: number;
  marketPrice: number;
  // Add other properties as needed
}

interface BondHoldingsTableProps {
  bondHoldings: BondHolding[];
}

const BondHoldingsTable: React.FC<BondHoldingsTableProps> = ({ bondHoldings }) => {
  const calculateMarketValue = (holding: BondHolding): number => {
    return holding.quantity * holding.marketPrice;
  };

  const calculateDuration = (holding: BondHolding): number => {
    // Implement duration calculation logic here.  This is complex and depends on bond characteristics.
    // For this example, we'll return a placeholder.
    return 0; // Replace with actual duration calculation
  };

  return (
    <table>
      <thead>
        <tr>
          <th>ISIN</th>
          <th>CUSIP</th>
          <th>Quantity</th>
          <th>Average Cost</th>
          <th>Market Price</th>
          <th>Market Value</th>
          <th>Duration</th>
          {/* Add other columns as needed */}
        </tr>
      </thead>
      <tbody>
        {bondHoldings.map((holding) => (
          <tr key={holding.isin}>
            <td>{holding.isin}</td>
            <td>{holding.cusip}</td>
            <td>{holding.quantity}</td>
            <td>{holding.averageCost.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
            <td>{holding.marketPrice.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
            <td>{calculateMarketValue(holding).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
            <td>{calculateDuration(holding).toFixed(2)}</td>
            {/* Add other data cells as needed */}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BondHoldingsTable;
```