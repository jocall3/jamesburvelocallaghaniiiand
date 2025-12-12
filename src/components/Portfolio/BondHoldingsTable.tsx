import React from 'react';

interface BondHolding {
  isin: string;
  cusip: string;
  quantity: number;
  averageCost: number;
  marketPrice: number;
}

interface BondHoldingsTableProps {
  bondHoldings: BondHolding[];
}

const BondHoldingsTable: React.FC<BondHoldingsTableProps> = ({ bondHoldings }) => {
  const calculateMarketValue = (holding: BondHolding): number => {
    return holding.quantity * holding.marketPrice;
  };

  const calculateDuration = (holding: BondHolding): number => {
    return 0;
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
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BondHoldingsTable;