export enum OrderSide {
    BUY = 'BUY',
    SELL = 'SELL',
}

export enum OrderType {
    MARKET = 'MARKET',
    LIMIT = 'LIMIT',
    STOP = 'STOP',
}

export enum OrderStatus {
    PENDING = 'PENDING',
    OPEN = 'OPEN',
    FILLED = 'FILLED',
    CANCELLED = 'CANCELLED',
    REJECTED = 'REJECTED',
}

export interface Tick {
    timestamp: number;
    price: number;
    volume: number;
}

export interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Order {
    id: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
    stopPrice?: number;
    status: OrderStatus;
    createdAt: number;
    filledAt?: number;
    filledQuantity: number;
    avgFillPrice?: number;
}

export interface Trade {
    id: string;
    orderId: string;
    symbol: string;
    side: OrderSide;
    price: number;
    quantity: number;
    commission: number;
    timestamp: number;
}

export interface Position {
    symbol: string;
    quantity: number; // Positive for long, negative for short
    averageEntryPrice: number;
    unrealizedPnl: number;
}

export interface Portfolio {
    initialCash: number;
    cash: number;
    positions: { [symbol: string]: Position };
    equity: number;
    trades: Trade[];
}

export interface SimulationContext {
    readonly currentTime: number;
    readonly currentPrice: number;
    getPortfolio: () => Portfolio;
    placeOrder: (orderRequest: Omit<Order, 'id' | 'status' | 'createdAt' | 'filledQuantity' | 'avgFillPrice'>) => Order | null;
    cancelOrder: (orderId: string) => boolean;
    log: (message: any) => void;
}

export interface IStrategy {
    init(context: SimulationContext): void;
    onTick?(tick: Tick): void;
    onCandle?(candle: Candle): void;
    onOrderUpdate?(order: Order): void;
    onTrade?(trade: Trade): void;
    onEnd?(): void;
}

export interface SimulatorConfig {
    symbol: string;
    initialCash: number;
    commissionPerTrade: number;
    slippageFactor: number; // e.g., 0.0001 for 0.01%
}

export class SimulatorBackend {
    private context: SimulationContext;
    private portfolio: Portfolio;
    private openOrders: Map<string, Order> = new Map();
    private tradeIdCounter = 0;
    private orderIdCounter = 0;
    private currentTime: number = 0;
    private currentPrice: number = 0;
    private logs: string[] = [];
    
    constructor(
        private strategy: IStrategy,
        private data: (Tick | Candle)[],
        private config: SimulatorConfig
    ) {
        this.portfolio = {
            initialCash: config.initialCash,
            cash: config.initialCash,
            positions: {},
            equity: config.initialCash,
            trades: [],
        };

        this.context = this.createContext();
    }
    
    private createContext(): SimulationContext {
        return {
            get currentTime() { return this.currentTime; },
            get currentPrice() { return this.currentPrice; },
            getPortfolio: () => JSON.parse(JSON.stringify(this.portfolio)), // Deep copy
            placeOrder: this.placeOrder.bind(this),
            cancelOrder: this.cancelOrder.bind(this),
            log: (message: any) => {
                this.logs.push(`[${new Date(this.currentTime).toISOString()}] ${typeof message === 'string' ? message : JSON.stringify(message)}`);
            },
        };
    }

    public run() {
        if (!this.data || this.data.length === 0) {
            console.error("Simulation data is empty.");
            return { finalPortfolio: this.portfolio, trades: [], logs: this.logs };
        }
        
        this.strategy.init(this.context);
        
        for (const dataPoint of this.data) {
            if ('open' in dataPoint) { // It's a Candle
                const candle = dataPoint as Candle;
                // Simulate intra-candle price movement for more realistic fills
                this.processTick({ timestamp: candle.timestamp, price: candle.open, volume: 0 });
                this.processTick({ timestamp: candle.timestamp, price: candle.high, volume: 0 });
                this.processTick({ timestamp: candle.timestamp, price: candle.low, volume: 0 });
                this.processTick({ timestamp: candle.timestamp, price: candle.close, volume: candle.volume });
                
                if (this.strategy.onCandle) {
                    this.strategy.onCandle(candle);
                }
            } else { // It's a Tick
                this.processTick(dataPoint as Tick);
            }
            this.updatePortfolioEquity();
        }
        
        if (this.strategy.onEnd) {
            this.strategy.onEnd();
        }

        return {
            finalPortfolio: this.portfolio,
            trades: this.portfolio.trades,
            logs: this.logs
        };
    }
    
    private processTick(tick: Tick) {
        this.currentTime = tick.timestamp;
        this.currentPrice = tick.price;
        
        this.checkPendingOrders();
        
        if (this.strategy.onTick) {
            this.strategy.onTick(tick);
        }
    }

    private checkPendingOrders() {
        const orderIds = [...this.openOrders.keys()];
        for (const orderId of orderIds) {
            const order = this.openOrders.get(orderId);
            if (!order) continue;

            let triggerFill = false;
            let fillPrice = this.currentPrice;

            switch (order.type) {
                case OrderType.MARKET:
                    triggerFill = true;
                    break;
                case OrderType.LIMIT:
                    if (order.side === OrderSide.BUY && this.currentPrice <= order.price!) {
                        triggerFill = true;
                        fillPrice = Math.min(this.currentPrice, order.price!); // Fill at limit or better
                    } else if (order.side === OrderSide.SELL && this.currentPrice >= order.price!) {
                        triggerFill = true;
                        fillPrice = Math.max(this.currentPrice, order.price!); // Fill at limit or better
                    }
                    break;
                case OrderType.STOP:
                    if (order.side === OrderSide.BUY && this.currentPrice >= order.stopPrice!) {
                        order.type = OrderType.MARKET;
                        triggerFill = true;
                    } else if (order.side === OrderSide.SELL && this.currentPrice <= order.stopPrice!) {
                        order.type = OrderType.MARKET;
                        triggerFill = true;
                    }
                    break;
            }

            if (triggerFill) {
                this.executeOrder(order, fillPrice);
            }
        }
    }
    
    private executeOrder(order: Order, price: number) {
        const fillPriceWithSlippage = this.calculateFillPrice(price, order.side);
        const commission = this.config.commissionPerTrade;
        const cost = fillPriceWithSlippage * order.quantity;
        const totalDebit = order.side === OrderSide.BUY ? cost + commission : 0;
        const totalCredit = order.side === OrderSide.SELL ? cost - commission : 0;

        if (order.side === OrderSide.BUY && this.portfolio.cash < totalDebit) {
            this.rejectOrder(order, "Insufficient funds");
            return;
        }

        this.portfolio.cash += totalCredit - totalDebit;
        
        const trade: Trade = {
            id: `trade-${++this.tradeIdCounter}`,
            orderId: order.id,
            symbol: order.symbol,
            side: order.side,
            price: fillPriceWithSlippage,
            quantity: order.quantity,
            commission,
            timestamp: this.currentTime,
        };
        this.portfolio.trades.push(trade);

        this.updatePosition(trade);

        order.status = OrderStatus.FILLED;
        order.filledAt = this.currentTime;
        order.filledQuantity = order.quantity;
        order.avgFillPrice = fillPriceWithSlippage;

        this.openOrders.delete(order.id);

        if (this.strategy.onOrderUpdate) this.strategy.onOrderUpdate({ ...order });
        if (this.strategy.onTrade) this.strategy.onTrade({ ...trade });
    }

    private updatePosition(trade: Trade) {
        const position = this.portfolio.positions[trade.symbol] || {
            symbol: trade.symbol, quantity: 0, averageEntryPrice: 0, unrealizedPnl: 0,
        };

        const currentQuantity = position.quantity;
        const tradeEffect = trade.side === OrderSide.BUY ? trade.quantity : -trade.quantity;
        const newQuantity = currentQuantity + tradeEffect;

        if (newQuantity === 0) {
            delete this.portfolio.positions[trade.symbol];
        } else {
            if (Math.sign(newQuantity) === Math.sign(currentQuantity) || currentQuantity === 0) {
                // Averaging into a position
                const newTotalCost = (position.averageEntryPrice * currentQuantity) + (trade.price * tradeEffect);
                position.averageEntryPrice = newTotalCost / newQuantity;
            }
            position.quantity = newQuantity;
            this.portfolio.positions[trade.symbol] = position;
        }
    }
    
    private calculateFillPrice(price: number, side: OrderSide): number {
        const slippage = price * this.config.slippageFactor;
        return side === OrderSide.BUY ? price + slippage : price - slippage;
    }

    private rejectOrder(order: Order, reason: string) {
        order.status = OrderStatus.REJECTED;
        this.openOrders.delete(order.id);
        this.context.log(`Order ${order.id} rejected: ${reason}`);
        if (this.strategy.onOrderUpdate) this.strategy.onOrderUpdate({ ...order });
    }

    private updatePortfolioEquity() {
        let positionsValue = 0;
        for (const symbol in this.portfolio.positions) {
            const position = this.portfolio.positions[symbol];
            positionsValue += position.quantity * this.currentPrice;
            position.unrealizedPnl = (this.currentPrice - position.averageEntryPrice) * position.quantity;
        }
        this.portfolio.equity = this.portfolio.cash + positionsValue;
    }

    private placeOrder(orderRequest: Omit<Order, 'id' | 'status' | 'createdAt' | 'filledQuantity' | 'avgFillPrice'>): Order | null {
        const { symbol, side, type, quantity, price, stopPrice } = orderRequest;
        
        if (quantity <= 0) { this.context.log("Order quantity must be positive."); return null; }
        if (type === OrderType.LIMIT && !price) { this.context.log("Limit orders require a price."); return null; }
        if (type === OrderType.STOP && !stopPrice) { this.context.log("Stop orders require a stop price."); return null; }
        
        const order: Order = {
            id: `order-${++this.orderIdCounter}`,
            symbol, side, type, quantity, price, stopPrice,
            status: OrderStatus.PENDING,
            createdAt: this.currentTime,
            filledQuantity: 0,
        };

        this.openOrders.set(order.id, order);
        this.context.log(`Order placed: ${JSON.stringify(order)}`);
        
        if (this.strategy.onOrderUpdate) this.strategy.onOrderUpdate({ ...order });
        
        return { ...order };
    }

    private cancelOrder(orderId: string): boolean {
        const order = this.openOrders.get(orderId);
        if (order) {
            order.status = OrderStatus.CANCELLED;
            this.openOrders.delete(orderId);
            this.context.log(`Order cancelled: ${orderId}`);
            if (this.strategy.onOrderUpdate) this.strategy.onOrderUpdate({ ...order });
            return true;
        }
        this.context.log(`Failed to cancel order ${orderId}: Not found.`);
        return false;
    }
}
