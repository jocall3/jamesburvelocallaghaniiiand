```typescript
// PayoffStrategizer.ts

interface Debt {
  name: string;
  principal: number;
  interestRate: number;
  minimumPayment: number;
}

interface PaymentAllocation {
  debtName: string;
  amount: number;
}

interface PayoffCalculationResult {
  payments: PaymentAllocation[];
  totalInterestPaid: number;
  timeToPayoffMonths: number;
}

class PayoffStrategizer {

  /**
   * Calculates the debt payoff plan using the debt avalanche method (highest interest rate first).
   *
   * @param debts An array of debt objects.
   * @param extraPayment The amount of extra payment to apply each month.
   * @returns A PayoffCalculationResult object containing the payment allocation and payoff details.
   */
  calculateDebtAvalanche(debts: Debt[], extraPayment: number): PayoffCalculationResult {
    // Sort debts by interest rate in descending order.
    const sortedDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    return this.calculatePayoff(sortedDebts, extraPayment);
  }

  /**
   * Calculates the debt payoff plan using the debt snowball method (smallest balance first).
   *
   * @param debts An array of debt objects.
   * @param extraPayment The amount of extra payment to apply each month.
   * @returns A PayoffCalculationResult object containing the payment allocation and payoff details.
   */
  calculateDebtSnowball(debts: Debt[], extraPayment: number): PayoffCalculationResult {
    // Sort debts by principal in ascending order.
    const sortedDebts = [...debts].sort((a, b) => a.principal - b.principal);
    return this.calculatePayoff(sortedDebts, extraPayment);
  }

  /**
   * Core logic to calculate the debt payoff plan.
   *
   * @param debts An array of sorted debt objects.
   * @param extraPayment The amount of extra payment to apply each month.
   * @returns A PayoffCalculationResult object containing the payment allocation and payoff details.
   */
  private calculatePayoff(debts: Debt[], extraPayment: number): PayoffCalculationResult {
    let remainingDebts = [...debts]; // Create a copy to modify.
    let payments: PaymentAllocation[] = [];
    let totalInterestPaid = 0;
    let timeToPayoffMonths = 0;

    while (remainingDebts.length > 0) {
      timeToPayoffMonths++;
      let availablePayment = extraPayment;

      remainingDebts.forEach(debt => {
        // Calculate interest for the month
        const monthlyInterestRate = debt.interestRate / 12;
        const interest = debt.principal * monthlyInterestRate;
        totalInterestPaid += interest;

        // Make minimum payment first
        let paymentAmount = Math.min(debt.principal + interest, debt.minimumPayment);

        if (paymentAmount < debt.minimumPayment)
        {
          paymentAmount = debt.minimumPayment;
        }

        if (availablePayment > 0 && debt === remainingDebts[0]) {
          const additionalPayment = Math.min(availablePayment, debt.principal + interest - paymentAmount);
          paymentAmount += additionalPayment;
          availablePayment -= additionalPayment;
        }
        paymentAmount = Math.min(debt.principal + interest, paymentAmount);


        debt.principal -= paymentAmount - interest;


        payments.push({ debtName: debt.name, amount: paymentAmount });

        if (debt.principal <= 0) {
          debt.principal = 0; // Ensure principal doesn't go negative
        }
      });

      remainingDebts = remainingDebts.filter(debt => debt.principal > 0);
    }

    return {
      payments,
      totalInterestPaid,
      timeToPayoffMonths
    };
  }
}

export default PayoffStrategizer;
```