```typescript
import { createOrder, executeTrade, getPortfolio } from '../../src/tradeFlow'; // Adjust import paths as needed
import { Order, Trade, Portfolio } from '../../src/types'; // Adjust import paths as needed

describe('Trade Flow Integration Tests', () => {
  const initialPortfolio: Portfolio = {
    USD: 100000,
    US912796P781: 0,
  }; // Define initial portfolio state

  beforeEach(() => {
    // Reset state before each test if necessary, or modify initialPortfolio if tests share state
    // For example:
    // global.portfolio = { ...initialPortfolio }; // If using global state
  });


  it('should create an order, execute a trade, and update the portfolio correctly - BUY', async () => {
    const order: Order = {
      type: 'BUY',
      securityId: 'US912796P781',
      quantity: 10,
      price: 90, // Example price - adjust according to bond specifics
    };

    const expectedTrade: Trade = {
      orderId: expect.any(String), // Dynamically check for a generated orderId
      securityId: 'US912796P781',
      quantity: 10,
      price: 90,
      type: 'BUY',
      timestamp: expect.any(Date),
    };

    const expectedPortfolioAfterTrade: Portfolio = {
      USD: initialPortfolio.USD - (order.quantity * order.price),
      US912796P781: initialPortfolio.US912796P781 + order.quantity,
    };


    // 1. Create Order
    const orderResult = await createOrder(order);
    expect(orderResult).toEqual({
      orderId: expect.any(String),
      status: 'OPEN',
      ...order,
      timestamp: expect.any(Date),
    });
    const orderId = orderResult.orderId;

    // 2. Execute Trade
    const tradeResult = await executeTrade({ orderId });
    expect(tradeResult).toEqual(expect.objectContaining(expectedTrade));

    // 3. Verify Portfolio
    const portfolioAfterTrade = await getPortfolio();
    expect(portfolioAfterTrade).toEqual(expectedPortfolioAfterTrade);
  });

  it('should create an order, execute a trade, and update the portfolio correctly - SELL', async () => {

      // Ensure the portfolio has some bonds to sell
      await createOrder({
        type: 'BUY',
        securityId: 'US912796P781',
        quantity: 50,
        price: 90,
      });
      await executeTrade({ orderId: expect.any(String) }); // Execute the buy order

    const order: Order = {
      type: 'SELL',
      securityId: 'US912796P781',
      quantity: 20,
      price: 95,
    };

    const expectedTrade: Trade = {
      orderId: expect.any(String),
      securityId: 'US912796P781',
      quantity: 20,
      price: 95,
      type: 'SELL',
      timestamp: expect.any(Date),
    };

    const expectedPortfolioAfterTrade: Portfolio = {
      USD: initialPortfolio.USD + (order.quantity * order.price),
      US912796P781: 30, // 50 (bought) - 20 (sold), assuming previous buy test passed.  Adjust if buy test is disabled/altered.
    };

    // 1. Create Order
    const orderResult = await createOrder(order);
    expect(orderResult).toEqual({
      orderId: expect.any(String),
      status: 'OPEN',
      ...order,
      timestamp: expect.any(Date),
    });
    const orderId = orderResult.orderId;

    // 2. Execute Trade
    const tradeResult = await executeTrade({ orderId });
    expect(tradeResult).toEqual(expect.objectContaining(expectedTrade));

    // 3. Verify Portfolio
    const portfolioAfterTrade = await getPortfolio();
    expect(portfolioAfterTrade).toEqual(expect.objectContaining(expectedPortfolioAfterTrade)); // Use objectContaining for partial match, as other values (USD) may vary

  });

  it('should handle insufficient funds (BUY)', async () => {
    const order: Order = {
        type: 'BUY',
        securityId: 'US912796P781',
        quantity: 10000,
        price: 1000,
    };
    const orderResult = await createOrder(order);
    const orderId = orderResult.orderId;
    const tradeResult = await executeTrade({ orderId });

    expect(tradeResult.status).toBe("REJECTED");
    const portfolio = await getPortfolio();
    expect(portfolio.USD).toBe(initialPortfolio.USD);
  });

  // Add more test cases as needed, e.g.:
  // - Test order cancellation
  // - Test partial fills (if applicable)
  // - Test invalid order (e.g., incorrect securityId)
});
```