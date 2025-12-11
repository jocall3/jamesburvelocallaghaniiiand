```ts
import { Order } from '../../core/model/order';
import { Position } from '../../core/model/position';
import { Security } from '../../core/model/security';
import { Account } from '../../core/model/account';
import { LiveRunner } from '../live/liveRunner';

export class ShadowModeRunner {
  private readonly liveRunner: LiveRunner;

  constructor(liveRunner: LiveRunner) {
    this.liveRunner = liveRunner;
  }

  public async processOrder(order: Order, account: Account, security: Security): Promise<void> {
    // TODO: Mirror data.  Instead of directly executing the order, we would 
    // fetch a similar dataset from a mocked environment

    // Log the would-be order execution
    console.log(`[SHADOW MODE] Would execute order: ${JSON.stringify(order)} for account ${account.accountId} on security ${security.ticker)}`);

    // Simulate the order execution against mirrored/mocked data
    await this.simulateOrderExecution(order, account, security);
  }

  private async simulateOrderExecution(order: Order, account: Account, security: Security): Promise<void> {
    // Fetch mock position data (assuming we have a way to do this)
    const mockPosition: Position | undefined = await this.fetchMockPosition(account, security);

    if (mockPosition) {
      // Simulate position update based on the order (without real execution)
      const simulatedQuantity = mockPosition.quantity + order.quantity;
      console.log(`[SHADOW MODE] Simulated position update for account ${account.accountId} on security ${security.ticker}: Quantity would change to ${simulatedQuantity}`);
      // Further actions like calculating P&L based on mock data could also be performed here
    } else {
      console.log(`[SHADOW MODE] No existing position found in mock data for account ${account.accountId} on security ${security.ticker}.  Simulating new position.`);
      // Simulate creation of new position
      console.log(`[SHADOW MODE] Simulated new position created with quantity: ${order.quantity}`);

      //Other simulation calculations here
    }
  }

  private async fetchMockPosition(account: Account, security: Security): Promise<Position | undefined> {
    // TODO: Implement the logic to fetch mock position data.
    // This might involve querying a mock data store or generating data dynamically.

    // Placeholder for fetching mocked position.
    console.log(`[SHADOW MODE] Fetching mock position for account ${account.accountId} on security ${security.ticker}...`);

    // Example: Returning a hardcoded mock position for testing.  Replace with actual data fetching logic.
    if (security.ticker === "MOCK_AAPL") {
      return {
        accountId: account.accountId,
        securityId: security.securityId,
        quantity: 10,
        averagePrice: 150.00,
        unrealizedPL: 0 //initial value
      }
    }
    return undefined; // Return undefined if no mock position is found.
  }
}
```