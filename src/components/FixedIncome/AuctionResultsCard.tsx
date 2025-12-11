```typescript
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface AuctionResult {
  date: string;
  dealType: string;
  status: string;
  offer: string;
  bids: string;
  placement: string;
  settlementDuration: string;
  cutoffPriceYield: string;
  weightedAveragePriceYield: string;
}

interface AuctionResultsCardProps {
  auctionResults: AuctionResult[];
}

const AuctionResultsCard: React.FC<AuctionResultsCardProps> = ({ auctionResults }) => {
  return (
    <div>
      <h3>Auctions and Additional Placements</h3>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Deal Type</TableCell>
              <TableCell align="right">Status</TableCell>
              <TableCell align="right">Offer, M</TableCell>
              <TableCell align="right">Bids, M</TableCell>
              <TableCell align="right">Placement / Buy-Back, M</TableCell>
              <TableCell align="right">Settlement Duration</TableCell>
              <TableCell align="right">Cut-Off Price (Yield), %</TableCell>
              <TableCell align="right">Weighted Average Price (Yield), %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auctionResults.map((row, index) => (
              <TableRow
                key={index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.date}
                </TableCell>
                <TableCell align="right">{row.dealType}</TableCell>
                <TableCell align="right">{row.status}</TableCell>
                <TableCell align="right">{row.offer}</TableCell>
                <TableCell align="right">{row.bids}</TableCell>
                <TableCell align="right">{row.placement}</TableCell>
                <TableCell align="right">{row.settlementDuration}</TableCell>
                <TableCell align="right">{row.cutoffPriceYield}</TableCell>
                <TableCell align="right">{row.weightedAveragePriceYield}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AuctionResultsCard;
```