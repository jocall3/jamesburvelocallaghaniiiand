export interface MockOrder {
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'STOP';
    quantity: number;
    limitPrice?: number;
    stopPrice?: number;
    status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    filledPrice?: number;
    filledQuantity: number;
    timestamp: number;
}

export interface MockPosition {
    symbol: string;
    quantity: number;
    averageEntryPrice: number;
    currentPrice: number;
    unrealizedPL: number;
    realizedPL: number;
}

export interface TestResult {
    testName: string;
    passed: boolean;
    durationMs: number;
    error?: Error;
    logs: string[];
}

export class AssertionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AssertionError';
    }
}

/**
 * The context passed to unit tests.
 * Acts as both the mock environment (Market/Broker) and the assertion library.
 */
export interface FinancialTestContext {
    // --- Environment Configuration ---
    /** Set the initial cash balance for the account. */
    setBalance(amount: number): void;
    /** Update the current market price for a symbol. Triggers order processing. */
    updateMarketPrice(symbol: string, price: number): void;
    /** Set the simulation timestamp. */
    setTimestamp(timestamp: number): void;

    // --- Strategy Simulation Actions (Mimics Trading API) ---
    /** Place a market buy order. */
    buy(symbol: string, quantity: number): MockOrder;
    /** Place a market sell order. */
    sell(symbol: string, quantity: number): MockOrder;
    /** Place a limit order. */
    limitOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number): MockOrder;
    /** Cancel an open order by ID. */
    cancelOrder(orderId: string): boolean;

    // --- State Inspection ---
    /** Get current account cash balance. */
    getBalance(): number;
    /** Get current account equity (cash + unrealized P&L). */
    getEquity(): number;
    /** Get a specific position details. */
    getPosition(symbol: string): MockPosition | undefined;
    /** Get all positions. */
    getAllPositions(): MockPosition[];
    /** Get all orders (history and open). */
    getAllOrders(): MockOrder[];
    /** Get open orders. */
    getOpenOrders(): MockOrder[];

    // --- Logging ---
    log(message: string): void;

    // --- Assertions ---
    assert(condition: boolean, message?: string): void;
    assertEqual(actual: any, expected: any, message?: string): void;
    assertNotEqual(actual: any, expected: any, message?: string): void;
    assertCloseTo(actual: number, expected: number, tolerance: number, message?: string): void;
    assertTransactionCount(count: number): void;
    fail(message?: string): void;
}

type TestFunction = (context: FinancialTestContext) => void | Promise<void>;

/**
 * Implementation of the Test Context logic including a mock broker engine.
 */
class FinancialTestContextImpl implements FinancialTestContext {
    private timestamp: number = Date.now();
    private balance: number = 100000;
    private marketPrices: Map<string, number> = new Map();
    private positions: Map<string, MockPosition> = new Map();
    private orders: MockOrder[] = [];
    private logs: string[] = [];

    // --- Environment ---

    public setBalance(amount: number): void {
        this.balance = amount;
    }

    public updateMarketPrice(symbol: string, price: number): void {
        this.marketPrices.set(symbol, price);
        this.processPendingOrders(symbol, price);
        this.updatePositionValuations(symbol, price);
    }

    public setTimestamp(timestamp: number): void {
        this.timestamp = timestamp;
    }

    // --- Simulation Actions ---

    public buy(symbol: string, quantity: number): MockOrder {
        return this.submitOrder(symbol, 'BUY', 'MARKET', quantity);
    }

    public sell(symbol: string, quantity: number): MockOrder {
        return this.submitOrder(symbol, 'SELL', 'MARKET', quantity);
    }

    public limitOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number): MockOrder {
        return this.submitOrder(symbol, side, 'LIMIT', quantity, price);
    }

    public cancelOrder(orderId: string): boolean {
        const order = this.orders.find(o => o.id === orderId);
        if (order && order.status === 'PENDING') {
            order.status = 'CANCELLED';
            return true;
        }
        return false;
    }

    private submitOrder(symbol: string, side: 'BUY' | 'SELL', type: 'MARKET' | 'LIMIT', quantity: number, price?: number): MockOrder {
        const order: MockOrder = {
            id: this.generateId(),
            symbol,
            side,
            type,
            quantity,
            limitPrice: price,
            status: 'PENDING',
            filledQuantity: 0,
            timestamp: this.timestamp
        };

        this.orders.push(order);
        
        // Attempt immediate fill if market price exists
        const currentPrice = this.marketPrices.get(symbol);
        if (currentPrice !== undefined) {
            this.processOrderFill(order, currentPrice);
        }

        return order;
    }

    // --- Engine Logic ---

    private processPendingOrders(symbol: string, currentPrice: number) {
        this.orders
            .filter(o => o.symbol === symbol && o.status === 'PENDING')
            .forEach(order => this.processOrderFill(order, currentPrice));
    }

    private processOrderFill(order: MockOrder, currentPrice: number) {
        let shouldFill = false;
        let fillPrice = currentPrice;

        if (order.type === 'MARKET') {
            shouldFill = true;
        } else if (order.type === 'LIMIT') {
            if (order.side === 'BUY' && currentPrice <= (order.limitPrice ?? 0)) {
                shouldFill = true;
                fillPrice = order.limitPrice!; // Simplified: fill at limit or better (using limit for simplicity in mocks)
            } else if (order.side === 'SELL' && currentPrice >= (order.limitPrice ?? 0)) {
                shouldFill = true;
                fillPrice = order.limitPrice!;
            }
        }

        if (shouldFill) {
            // Check funds/holdings
            const cost = fillPrice * order.quantity;
            
            if (order.side === 'BUY') {
                if (this.balance >= cost) {
                    this.balance -= cost;
                    this.updatePosition(order.symbol, order.quantity, fillPrice);
                    order.status = 'FILLED';
                    order.filledPrice = fillPrice;
                    order.filledQuantity = order.quantity;
                } else {
                    order.status = 'REJECTED';
                    this.log(`Order ${order.id} rejected: Insufficient funds.`);
                }
            } else {
                const pos = this.positions.get(order.symbol);
                if (pos && pos.quantity >= order.quantity) {
                    this.balance += cost;
                    this.updatePosition(order.symbol, -order.quantity, fillPrice);
                    order.status = 'FILLED';
                    order.filledPrice = fillPrice;
                    order.filledQuantity = order.quantity;
                } else {
                    order.status = 'REJECTED';
                    this.log(`Order ${order.id} rejected: Insufficient position.`);
                }
            }
        }
    }

    private updatePosition(symbol: string, quantityDelta: number, price: number) {
        let pos = this.positions.get(symbol);
        if (!pos) {
            pos = {
                symbol,
                quantity: 0,
                averageEntryPrice: 0,
                currentPrice: price,
                unrealizedPL: 0,
                realizedPL: 0
            };
            this.positions.set(symbol, pos);
        }

        if (quantityDelta > 0) {
            // Buying
            const totalCost = (pos.quantity * pos.averageEntryPrice) + (quantityDelta * price);
            pos.quantity += quantityDelta;
            pos.averageEntryPrice = totalCost / pos.quantity;
        } else {
            // Selling
            const realizedPnl = Math.abs(quantityDelta) * (price - pos.averageEntryPrice);
            pos.realizedPL += realizedPnl;
            pos.quantity += quantityDelta; // quantityDelta is negative
        }

        if (pos.quantity === 0) {
            pos.averageEntryPrice = 0;
            pos.unrealizedPL = 0;
        }

        this.updatePositionValuations(symbol, price);
    }

    private updatePositionValuations(symbol: string, currentPrice: number) {
        const pos = this.positions.get(symbol);
        if (pos && pos.quantity > 0) {
            pos.currentPrice = currentPrice;
            pos.unrealizedPL = (currentPrice - pos.averageEntryPrice) * pos.quantity;
        }
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // --- State Inspection ---

    public getBalance(): number {
        return this.balance;
    }

    public getEquity(): number {
        let equity = this.balance;
        for (const pos of this.positions.values()) {
            equity += (pos.quantity * pos.currentPrice);
        }
        return equity;
    }

    public getPosition(symbol: string): MockPosition | undefined {
        return this.positions.get(symbol);
    }

    public getAllPositions(): MockPosition[] {
        return Array.from(this.positions.values()).filter(p => p.quantity !== 0);
    }

    public getAllOrders(): MockOrder[] {
        return [...this.orders];
    }

    public getOpenOrders(): MockOrder[] {
        return this.orders.filter(o => o.status === 'PENDING');
    }

    // --- Logging ---

    public log(message: string): void {
        this.logs.push(message);
    }

    public getLogs(): string[] {
        return this.logs;
    }

    // --- Assertions ---

    public assert(condition: boolean, message: string = "Assertion failed"): void {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    public assertEqual(actual: any, expected: any, message?: string): void {
        if (actual !== expected) {
            throw new AssertionError(message || `Expected '${expected}' but got '${actual}'`);
        }
    }

    public assertNotEqual(actual: any, expected: any, message?: string): void {
        if (actual === expected) {
            throw new AssertionError(message || `Expected values to be different, but both were '${actual}'`);
        }
    }

    public assertCloseTo(actual: number, expected: number, tolerance: number, message?: string): void {
        if (Math.abs(actual - expected) > tolerance) {
            throw new AssertionError(message || `Expected ${expected} +/- ${tolerance}, but got ${actual}`);
        }
    }

    public assertTransactionCount(count: number): void {
        const filled = this.orders.filter(o => o.status === 'FILLED').length;
        if (filled !== count) {
            throw new AssertionError(`Expected ${count} transactions, but found ${filled}`);
        }
    }

    public fail(message: string = "Test failed"): void {
        throw new AssertionError(message);
    }
}

/**
 * Main class for managing and running financial unit tests.
 */
export class FinancialUnitTester {
    private tests: Map<string, TestFunction> = new Map();

    /**
     * Registers a unit test function.
     * @param name Unique name of the test.
     * @param testFn The function containing test logic.
     */
    public registerTest(name: string, testFn: TestFunction): void {
        if (this.tests.has(name)) {
            console.warn(`Overwriting existing test registration: ${name}`);
        }
        this.tests.set(name, testFn);
    }

    /**
     * Runs all registered tests.
     * @returns A promise resolving to the list of test results.
     */
    public async runAll(): Promise<TestResult[]> {
        const results: TestResult[] = [];
        for (const name of this.tests.keys()) {
            results.push(await this.runTest(name));
        }
        return results;
    }

    /**
     * Runs a specific test by name.
     * @param name Name of the test to run.
     */
    public async runTest(name: string): Promise<TestResult> {
        const testFn = this.tests.get(name);
        if (!testFn) {
            return {
                testName: name,
                passed: false,
                durationMs: 0,
                error: new Error(`Test '${name}' not found.`),
                logs: []
            };
        }

        const context = new FinancialTestContextImpl();
        const start = Date.now();

        try {
            await testFn(context);
            return {
                testName: name,
                passed: true,
                durationMs: Date.now() - start,
                logs: context.getLogs()
            };
        } catch (e: any) {
            return {
                testName: name,
                passed: false,
                durationMs: Date.now() - start,
                error: e,
                logs: context.getLogs()
            };
        }
    }

    /**
     * Clear all registered tests.
     */
    public clearTests(): void {
        this.tests.clear();
    }
}