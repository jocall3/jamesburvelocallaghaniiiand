```typescript
import { Bond } from '../models/Bond';
import { Trade } from '../models/Trade';

export class TradeExecutionService {

    /**
     * Calculates the settlement amount for a bond trade, including accrued interest.
     *
     * @param trade The trade to be executed.
     * @param bond The bond being traded.
     * @param settlementDate The date of settlement.
     * @returns The settlement amount.  Returns null if parameters are invalid
     */
    public calculateSettlementAmount(trade: Trade, bond: Bond, settlementDate: Date): number | null {
        if (!trade || !bond || !settlementDate || trade.quantity <= 0 || trade.price <= 0) {
            return null; // Invalid input
        }

        const accruedInterest = this.calculateAccruedInterest(bond, settlementDate);
        const tradeAmount = trade.quantity * trade.price;
        const settlementAmount = tradeAmount + (trade.isBuy ? accruedInterest : -accruedInterest); //Buy adds accrued interest, Sell subtracts

        return settlementAmount;
    }


    /**
     * Calculates the accrued interest for a bond.
     *  Simplified for the context of this example, assuming simple interest calculation.
     *  Uses the provided bond's details, uses the provided settlement date.
     * @param bond The bond to calculate accrued interest for.
     * @param settlementDate The date of settlement.
     * @returns The accrued interest. Returns 0 if there's no coupon or invalid dates.
     */
    public calculateAccruedInterest(bond: Bond, settlementDate: Date): number {
        if (!bond.couponRate || bond.couponRate <= 0 || !bond.maturityDate || !bond.issueDate || settlementDate < bond.issueDate || settlementDate > bond.maturityDate) {
            return 0; // No coupon, invalid dates, or out of range
        }


        // Simplified accrued interest calculation (simple interest)

        const daysInYear = 365;  // Assuming 365 days in a year for simplicity
        const daysBetweenIssueAndSettlement = this.daysBetween(bond.issueDate, settlementDate);
        const accruedInterest = (bond.faceValue * bond.couponRate * daysBetweenIssueAndSettlement) / daysInYear;


        return accruedInterest;
    }


    /**
     * Calculates the number of days between two dates.
     *
     * @param startDate The start date.
     * @param endDate The end date.
     * @returns The number of days between the two dates.
     */
    private daysBetween(startDate: Date, endDate: Date): number {
        const diffInMs = endDate.getTime() - startDate.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        return Math.floor(diffInDays); // Return integer value.
    }
}
```