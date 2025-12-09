// THE EVOLUTIONARY UNIVERSE-FORGE: Financial Nexus Core
// This file transforms a simple PaymentOrdersView into a self-contained,
// universe-scale financial simulation and open-source API ecosystem.
// It replaces external dependencies with internal implementations,
// expands core concepts, and simulates a vast interconnected world.

// --- GLOBAL UTILITIES AND CORE TYPES ---

/**
 * Represents a unique identifier within the universe.
 */
type UniverseID = string;

/**
 * A simple logger for the universe's internal events.
 * Replaces console for self-containment.
 */
const UniverseLogger = {
    log: (...args: any[]) => { /* In a real system, this would write to a log stream */ },
    warn: (...args: any[]) => { /* ... */ },
    error: (...args: any[]) => { /* ... */ },
    debug: (...args: any[]) => { /* ... */ },
};

/**
 * A custom Date-like object for time management within the simulation.
 * Allows for time manipulation and deterministic behavior.
 */
class UniverseTime {
    private static _now: number = Date.now(); // Milliseconds since epoch
    private static _speed: number = 1; // 1x normal speed

    static setTime(timestamp: number) {
        UniverseTime._now = timestamp;
    }

    static advanceTime(milliseconds: number) {
        UniverseTime._now += milliseconds * UniverseTime._speed;
    }

    static setSpeed(speed: number) {
        UniverseTime._speed = Math.max(0, speed);
    }

    static now(): number {
        return UniverseTime._now;
    }

    static toISOString(timestamp: number = UniverseTime._now): string {
        const date = new Date(timestamp);
        return date.toISOString();
    }

    static fromISOString(iso: string): number {
        return new Date(iso).getTime();
    }
}

/**
 * Generates unique IDs for entities within the universe.
 */
const IDGenerator = (() => {
    let counter = 0;
    const prefix = 'UNV-';
    return {
        generate: (): UniverseID => `${prefix}${UniverseTime.now()}-${counter++}`,
    };
})();

/**
 * Basic event emitter for internal communication.
 */
class UniverseEventEmitter {
    private listeners: { [event: string]: Function[] } = {};

    on(event: string, listener: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    off(event: string, listener: Function) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        }
    }

    emit(event: string, ...args: any[]) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => {
                try {
                    listener(...args);
                } catch (e) {
                    UniverseLogger.error(`Error in event listener for ${event}:`, e);
                }
            });
        }
    }
}
const UniverseEvents = new UniverseEventEmitter();

// --- CUSTOM REACT-LIKE UI FRAMEWORK (UNIVERSE-UI) ---

/**
 * Represents a virtual DOM node.
 */
interface UniverseVNode {
    type: string | Function; // HTML tag name or Component function
    props: { [key: string]: any };
    children: UniverseVNode[];
    dom?: HTMLElement | Text; // Reference to the actual DOM node
}

/**
 * Base class for all components in Universe-UI.
 */
class UniverseComponent {
    props: { [key: string]: any };
    state: any;
    stateHookIndex: number = 0; // Used by useState hook

    constructor(props: { [key: string]: any }) {
        this.props = props;
        this.state = {};
    }

    setState(updater: any) {
        // Legacy setState for class-based components, triggers a re-render.
        const oldState = { ...this.state };
        const newState = typeof updater === 'function' ? updater(oldState, this.props) : updater;
        this.state = { ...oldState, ...newState };
        renderer.scheduleRender();
    }

    render(): UniverseVNode {
        throw new Error("Component must implement render method.");
    }

    // Lifecycle methods (optional)
    componentDidMount?(): void;
    componentWillUnmount?(): void;
    componentDidUpdate?(oldProps: any, oldState: any): void;
}

/**
 * A simplified custom rendering engine, replacing React.
 * Manages a virtual DOM and updates the real DOM.
 */
class UniverseRenderer {
    private rootComponent: Function | null = null;
    private rootDomElement: HTMLElement | null = null;
    private currentVNode: UniverseVNode | null = null;
    private componentInstances: Map<UniverseVNode, UniverseComponent> = new Map();
    private componentStates: Map<UniverseComponent, any[]> = new Map();
    private componentEffects: Map<UniverseComponent, Function[]> = new Map();
    private currentRenderingComponent: UniverseComponent | null = null;

    render(component: Function, container: HTMLElement) {
        this.rootComponent = component;
        this.rootDomElement = container;
        this.scheduleRender();
    }

    scheduleRender() {
        // Debounce rendering to a single animation frame
        requestAnimationFrame(() => this.performRender());
    }

    private performRender() {
        if (!this.rootComponent || !this.rootDomElement) return;

        const newVNode = this.createElement(this.rootComponent, {}, []);
        this.diffAndPatch(this.rootDomElement, this.currentVNode, newVNode);
        this.currentVNode = newVNode;
        this.runEffects();
    }

    private createElement(type: string | Function, props: { [key: string]: any }, children: any[]): UniverseVNode {
        const flatChildren = children.flat().map(child => {
            if (typeof child === 'string' || typeof child === 'number') {
                return { type: '#text', props: { nodeValue: String(child) }, children: [] };
            }
            return child;
        }).filter(Boolean);
        return { type, props: props || {}, children: flatChildren };
    }

    private diffAndPatch(parentDom: HTMLElement, oldVNode: UniverseVNode | null, newVNode: UniverseVNode | null) {
        if (oldVNode === null && newVNode !== null) {
            // Add new node
            const newDom = this.createDomElement(newVNode);
            parentDom.appendChild(newDom);
            newVNode.dom = newDom;
            this.mountComponent(newVNode);
        } else if (oldVNode !== null && newVNode === null) {
            // Remove old node
            if (oldVNode.dom) {
                parentDom.removeChild(oldVNode.dom);
                this.unmountComponent(oldVNode);
            }
        } else if (oldVNode !== null && newVNode !== null && oldVNode.type !== newVNode.type) {
            // Replace node
            if (oldVNode.dom) {
                const newDom = this.createDomElement(newVNode);
                parentDom.replaceChild(newDom, oldVNode.dom);
                newVNode.dom = newDom;
                this.unmountComponent(oldVNode);
                this.mountComponent(newVNode);
            }
        } else if (oldVNode !== null && newVNode !== null && oldVNode.type === newVNode.type) {
            // Update node
            newVNode.dom = oldVNode.dom; // Keep reference to existing DOM node
            if (typeof newVNode.type === 'string') {
                this.updateDomProperties(newVNode.dom as HTMLElement, oldVNode.props, newVNode.props);
            } else {
                this.updateComponent(oldVNode, newVNode);
            }

            // Diff children
            const oldChildren = oldVNode.children;
            const newChildren = newVNode.children;
            const max = Math.max(oldChildren.length, newChildren.length);
            for (let i = 0; i < max; i++) {
                this.diffAndPatch(newVNode.dom as HTMLElement, oldChildren[i] || null, newChildren[i] || null);
            }
        }
    }

    private createDomElement(vNode: UniverseVNode): HTMLElement | Text {
        if (typeof vNode.type === 'string') {
            if (vNode.type === '#text') {
                return document.createTextNode(vNode.props.nodeValue);
            }
            const dom = document.createElement(vNode.type);
            this.updateDomProperties(dom, {}, vNode.props);
            vNode.children.forEach(child => {
                const childDom = this.createDomElement(child);
                child.dom = childDom;
                dom.appendChild(childDom);
            });
            return dom;
        } else {
            // Component function or class
            const isClass = (vNode.type.prototype instanceof UniverseComponent);
            const componentInstance = isClass ? new (vNode.type as any)(vNode.props) : new UniverseComponent(vNode.props);
            if (!isClass) {
                componentInstance.render = () => (vNode.type as Function)(vNode.props);
            }

            this.componentInstances.set(vNode, componentInstance);
            this.currentRenderingComponent = componentInstance;
            componentInstance.stateHookIndex = 0; // Reset for render
            const childVNode = componentInstance.render();
            this.currentRenderingComponent = null;
            
            const dom = this.createDomElement(childVNode);
            childVNode.dom = dom;
            vNode.children = [childVNode];
            return dom;
        }
    }

    private updateDomProperties(dom: HTMLElement, oldProps: { [key: string]: any }, newProps: { [key: string]: any }) {
        for (const key in oldProps) {
            if (!(key in newProps)) {
                if (key.startsWith('on')) {
                    dom.removeEventListener(key.substring(2).toLowerCase(), oldProps[key]);
                } else if (key !== 'children') {
                    dom.removeAttribute(key);
                }
            }
        }
        for (const key in newProps) {
            if (key !== 'children' && oldProps[key] !== newProps[key]) {
                if (key.startsWith('on')) {
                    if (oldProps[key]) {
                        dom.removeEventListener(key.substring(2).toLowerCase(), oldProps[key]);
                    }
                    dom.addEventListener(key.substring(2).toLowerCase(), newProps[key]);
                } else if (key === 'className') {
                    dom.setAttribute('class', newProps[key]);
                } else if (key === 'style' && typeof newProps[key] === 'object') {
                    Object.assign(dom.style, newProps[key]);
                } else {
                    (dom as any)[key] = newProps[key];
                }
            }
        }
    }

    private mountComponent(vNode: UniverseVNode) {
        if (typeof vNode.type === 'function') {
            const instance = this.componentInstances.get(vNode);
            if (instance && instance.componentDidMount) {
                instance.componentDidMount();
            }
        }
    }

    private unmountComponent(vNode: UniverseVNode) {
        if (typeof vNode.type === 'function') {
            const instance = this.componentInstances.get(vNode);
            if (instance && instance.componentWillUnmount) {
                instance.componentWillUnmount();
            }
            this.componentInstances.delete(vNode);
            if (instance) {
                this.componentStates.delete(instance);
                this.componentEffects.delete(instance);
            }
        }
    }

    private updateComponent(oldVNode: UniverseVNode, newVNode: UniverseVNode) {
        const instance = this.componentInstances.get(oldVNode);
        if (instance) {
            const oldProps = instance.props;
            const oldState = this.componentStates.get(instance) || [];
            
            instance.props = newVNode.props;
            this.componentInstances.delete(oldVNode);
            this.componentInstances.set(newVNode, instance); // Transfer instance to new VNode
            
            this.currentRenderingComponent = instance;
            instance.stateHookIndex = 0; // Reset for render
            const newChildVNode = instance.render();
            this.currentRenderingComponent = null;
            
            this.diffAndPatch(oldVNode.dom!.parentElement as HTMLElement, oldVNode.children[0], newChildVNode);
            newVNode.children = [newChildVNode];
            newChildVNode.dom = oldVNode.dom; // The DOM element is the same, but its content is patched

            if (instance.componentDidUpdate) {
                instance.componentDidUpdate(oldProps, oldState);
            }
        }
    }

    private runEffects() {
        this.componentEffects.forEach((effects) => {
            effects.forEach(effect => effect());
        });
        this.componentEffects.clear(); // Effects run once after render
    }

    // Hook implementations will be called by components
    useState<S>(initialState: S): [S, (newState: S | ((prevState: S) => S)) => void] {
        if (!this.currentRenderingComponent) {
            throw new Error("useState can only be called inside a component.");
        }
        const component = this.currentRenderingComponent;
        const states = this.componentStates.get(component) || [];
        const stateIndex = component.stateHookIndex++;
        
        if (states[stateIndex] === undefined) {
            states[stateIndex] = initialState;
        }
        
        const setState = (newState: S | ((prevState: S) => S)) => {
            const oldState = states[stateIndex];
            const resolvedState = typeof newState === 'function' 
                ? (newState as (prevState: S) => S)(oldState) 
                : newState;

            if (oldState !== resolvedState) {
                states[stateIndex] = resolvedState;
                this.scheduleRender();
            }
        };
        
        this.componentStates.set(component, states);
        return [states[stateIndex], setState];
    }

    useEffect(effect: () => (() => void) | void, deps?: any[]) {
        if (!this.currentRenderingComponent) {
            throw new Error("useEffect can only be called inside a component.");
        }
        // Simplified: for now, we just run effects after every render.
        // A full implementation would handle dependency arrays.
        const component = this.currentRenderingComponent;
        if (!this.componentEffects.has(component)) {
            this.componentEffects.set(component, []);
        }
        this.componentEffects.get(component)!.push(effect as Function);
    }
}

const renderer = new UniverseRenderer();

// Helper for creating VNodes, mimicking JSX
function h(type: string | Function, props: { [key: string]: any } | null, ...children: any[]): UniverseVNode {
    return (renderer as any).createElement(type, props, children);
}

// --- FINANCIAL SIMULATION CORE ---

enum Currency {
    USD = 'USD', // United States Dollar
    EUR = 'EUR', // Euro
    GAL_CRED = 'GAL_CRED', // Galactic Credit
    XIP = 'XIP', // Xylosian Interstellar Pound
    Q_BIT = 'Q_BIT', // Quantum Bit
}

enum PaymentOrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

interface FinancialAccount {
    id: UniverseID;
    owner: string; // Could be a person, corporation, or government ID
    balance: number;
    currency: Currency;
    accountType: 'checking' | 'savings' | 'investment' | 'credit';
    createdAt: number; // UniverseTime timestamp
}

interface PaymentOrder {
    id: UniverseID;
    sourceAccountId: UniverseID;
    destinationAccountId: UniverseID;
    amount: number;
    currency: Currency;
    status: PaymentOrderStatus;
    createdAt: number;
    updatedAt: number;
    memo: string;
    transactionFee: number;
}

// --- IN-MEMORY UNIVERSE DATABASE ---

class UniverseDB {
    private accounts: Map<UniverseID, FinancialAccount> = new Map();
    private paymentOrders: Map<UniverseID, PaymentOrder> = new Map();

    constructor() {
        this.seedData();
    }

    private seedData() {
        const account1: FinancialAccount = {
            id: IDGenerator.generate(),
            owner: 'Galactic Federation Central Bank',
            balance: 1_000_000_000_000,
            currency: Currency.GAL_CRED,
            accountType: 'checking',
            createdAt: UniverseTime.now(),
        };
        const account2: FinancialAccount = {
            id: IDGenerator.generate(),
            owner: 'Orion Syndicate Holdings',
            balance: 500_000_000,
            currency: Currency.GAL_CRED,
            accountType: 'investment',
            createdAt: UniverseTime.now(),
        };
        const account3: FinancialAccount = {
            id: IDGenerator.generate(),
            owner: 'Jane Doe, Earth Division',
            balance: 15000,
            currency: Currency.USD,
            accountType: 'savings',
            createdAt: UniverseTime.now(),
        };
        this.accounts.set(account1.id, account1);
        this.accounts.set(account2.id, account2);
        this.accounts.set(account3.id, account3);

        const order1: PaymentOrder = {
            id: IDGenerator.generate(),
            sourceAccountId: account2.id,
            destinationAccountId: account1.id,
            amount: 10000,
            currency: Currency.GAL_CRED,
            status: PaymentOrderStatus.COMPLETED,
            createdAt: UniverseTime.now() - 86400000,
            updatedAt: UniverseTime.now() - 86300000,
            memo: 'Quarterly tax payment',
            transactionFee: 5,
        };
        const order2: PaymentOrder = {
            id: IDGenerator.generate(),
            sourceAccountId: account1.id,
            destinationAccountId: account3.id,
            amount: 500,
            currency: Currency.USD, // Note: Cross-currency would need an exchange rate service
            status: PaymentOrderStatus.PENDING,
            createdAt: UniverseTime.now(),
            updatedAt: UniverseTime.now(),
            memo: 'Universal Basic Income stipend',
            transactionFee: 0.1,
        };
        this.paymentOrders.set(order1.id, order1);
        this.paymentOrders.set(order2.id, order2);
    }

    getAccount(id: UniverseID): FinancialAccount | undefined {
        return this.accounts.get(id);
    }

    getAllAccounts(): FinancialAccount[] {
        return Array.from(this.accounts.values());
    }

    getPaymentOrder(id: UniverseID): PaymentOrder | undefined {
        return this.paymentOrders.get(id);
    }

    getAllPaymentOrders(): PaymentOrder[] {
        return Array.from(this.paymentOrders.values()).sort((a, b) => b.createdAt - a.createdAt);
    }

    createPaymentOrder(orderData: Omit<PaymentOrder, 'id' | 'status' | 'createdAt' | 'updatedAt'>): PaymentOrder {
        const newOrder: PaymentOrder = {
            ...orderData,
            id: IDGenerator.generate(),
            status: PaymentOrderStatus.PENDING,
            createdAt: UniverseTime.now(),
            updatedAt: UniverseTime.now(),
        };
        this.paymentOrders.set(newOrder.id, newOrder);
        UniverseEvents.emit('paymentOrder:created', newOrder);
        // In a real system, this would trigger the processing logic
        setTimeout(() => this.processPaymentOrder(newOrder.id), 2000); // Simulate processing delay
        return newOrder;
    }

    private processPaymentOrder(id: UniverseID) {
        const order = this.paymentOrders.get(id);
        if (!order || order.status !== PaymentOrderStatus.PENDING) return;

        order.status = PaymentOrderStatus.PROCESSING;
        this.paymentOrders.set(id, order);
        UniverseEvents.emit('paymentOrder:updated', order);

        const source = this.accounts.get(order.sourceAccountId);
        const dest = this.accounts.get(order.destinationAccountId);

        if (!source || !dest) {
            order.status = PaymentOrderStatus.FAILED;
            order.memo += ' | Error: Invalid account ID.';
        } else if (source.currency !== dest.currency) {
            // Simplified: fail on currency mismatch. A real system would use an exchange.
            order.status = PaymentOrderStatus.FAILED;
            order.memo += ' | Error: Cross-currency transactions not supported in this simulation.';
        } else if (source.balance < order.amount + order.transactionFee) {
            order.status = PaymentOrderStatus.FAILED;
            order.memo += ' | Error: Insufficient funds.';
        } else {
            source.balance -= (order.amount + order.transactionFee);
            dest.balance += order.amount;
            order.status = PaymentOrderStatus.COMPLETED;
            this.accounts.set(source.id, source);
            this.accounts.set(dest.id, dest);
        }

        order.updatedAt = UniverseTime.now();
        this.paymentOrders.set(id, order);
        UniverseEvents.emit('paymentOrder:updated', order);
    }
}

const db = new UniverseDB();

// --- API LAYER ---

const PaymentOrderAPI = {
    fetchAll: async (): Promise<PaymentOrder[]> => {
        UniverseLogger.log('Fetching all payment orders...');
        return new Promise(resolve => {
            setTimeout(() => resolve(db.getAllPaymentOrders()), 500); // Simulate network latency
        });
    },
    fetchById: async (id: UniverseID): Promise<PaymentOrder | undefined> => {
        UniverseLogger.log(`Fetching payment order ${id}...`);
        return new Promise(resolve => {
            setTimeout(() => resolve(db.getPaymentOrder(id)), 200);
        });
    },
    create: async (data: Omit<PaymentOrder, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<PaymentOrder> => {
        UniverseLogger.log('Creating new payment order...');
        return new Promise(resolve => {
            setTimeout(() => resolve(db.createPaymentOrder(data)), 700);
        });
    }
};

const AccountAPI = {
    fetchAll: async (): Promise<FinancialAccount[]> => {
        return new Promise(resolve => {
            setTimeout(() => resolve(db.getAllAccounts()), 300);
        });
    }
};

// --- UI COMPONENTS ---

// Hooks provided by the renderer instance
const useState = renderer.useState.bind(renderer);
const useEffect = renderer.useEffect.bind(renderer);

// A simple Button component
function Button({ onClick, children, variant = 'primary' }: { onClick: () => void, children: any[], variant?: 'primary' | 'secondary' }) {
    const baseStyle = {
        padding: '10px 15px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
    };
    const variantStyle = {
        primary: {
            backgroundColor: '#007bff',
            color: 'white',
        },
        secondary: {
            backgroundColor: '#6c757d',
            color: 'white',
        }
    };
    return h('button', {
        onClick,
        style: { ...baseStyle, ...variantStyle[variant] }
    }, ...children);
}

// Component to display a single payment order in a list
function PaymentOrderListItem({ order, onSelect }: { order: PaymentOrder, onSelect: (id: UniverseID) => void }) {
    const statusColors: { [key in PaymentOrderStatus]: string } = {
        [PaymentOrderStatus.PENDING]: '#ffc107',
        [PaymentOrderStatus.PROCESSING]: '#17a2b8',
        [PaymentOrderStatus.COMPLETED]: '#28a745',
        [PaymentOrderStatus.FAILED]: '#dc3545',
        [PaymentOrderStatus.CANCELLED]: '#6c757d',
    };

    return h('div', {
        onClick: () => onSelect(order.id),
        style: {
            padding: '15px',
            borderBottom: '1px solid #333',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }
    },
        h('div', null,
            h('div', { style: { fontWeight: 'bold', fontSize: '16px' } }, `Order ${order.id.slice(-8)}`),
            h('div', { style: { fontSize: '12px', color: '#aaa' } }, `Memo: ${order.memo}`)
        ),
        h('div', { style: { textAlign: 'right' } },
            h('div', { style: { fontWeight: 'bold', fontSize: '18px' } }, `${order.amount.toLocaleString()} ${order.currency}`),
            h('div', {
                style: {
                    color: statusColors[order.status],
                    fontSize: '12px',
                    fontWeight: 'bold',
                }
            }, order.status)
        )
    );
}

// Component to display details of a selected payment order
function PaymentOrderDetail({ orderId }: { orderId: UniverseID | null }) {
    const [order, setOrder] = useState<PaymentOrder | null>(null);
    const [sourceAccount, setSourceAccount] = useState<FinancialAccount | null>(null);
    const [destAccount, setDestAccount] = useState<FinancialAccount | null>(null);

    useEffect(() => {
        if (orderId) {
            setOrder(null); // Clear previous order details
            PaymentOrderAPI.fetchById(orderId).then(fetchedOrder => {
                if (fetchedOrder) {
                    setOrder(fetchedOrder);
                    AccountAPI.fetchAll().then(accounts => {
                        setSourceAccount(accounts.find(a => a.id === fetchedOrder.sourceAccountId) || null);
                        setDestAccount(accounts.find(a => a.id === fetchedOrder.destinationAccountId) || null);
                    });
                }
            });
        }
    }, [orderId]);

    if (!orderId) {
        return h('div', { style: { padding: '20px', textAlign: 'center', color: '#888' } }, 'Select a payment order to see details.');
    }

    if (!order) {
        return h('div', { style: { padding: '20px', textAlign: 'center' } }, 'Loading details...');
    }

    return h('div', { style: { padding: '20px' } },
        h('h3', { style: { borderBottom: '1px solid #444', paddingBottom: '10px' } }, `Details for Order ${order.id}`),
        h('div', { style: { marginTop: '15px' } },
            h('p', null, h('strong', null, 'Status: '), order.status),
            h('p', null, h('strong', null, 'Amount: '), `${order.amount.toLocaleString()} ${order.currency}`),
            h('p', null, h('strong', null, 'Fee: '), `${order.transactionFee} ${order.currency}`),
            h('p', null, h('strong', null, 'Memo: '), order.memo),
            h('p', null, h('strong', null, 'Created: '), UniverseTime.toISOString(order.createdAt)),
            h('p', null, h('strong', null, 'Last Updated: '), UniverseTime.toISOString(order.updatedAt)),
            h('h4', { style: { marginTop: '20px' } }, 'Parties'),
            h('p', null, h('strong', null, 'From: '), sourceAccount ? `${sourceAccount.owner} (${sourceAccount.id.slice(-6)})` : 'Loading...'),
            h('p', null, h('strong', null, 'To: '), destAccount ? `${destAccount.owner} (${destAccount.id.slice(-6)})` : 'Loading...'),
        )
    );
}

// Main view component
function PaymentOrdersView() {
    const [orders, setOrders] = useState<PaymentOrder[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedOrderId, setSelectedOrderId] = useState<UniverseID | null>(null);

    const fetchData = () => {
        setIsLoading(true);
        PaymentOrderAPI.fetchAll().then(data => {
            setOrders(data);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
        const onUpdate = () => fetchData();
        UniverseEvents.on('paymentOrder:created', onUpdate);
        UniverseEvents.on('paymentOrder:updated', onUpdate);
        // A full implementation of useEffect would return a cleanup function
        // to call UniverseEvents.off(...)
    }, []);

    const handleSelectOrder = (id: UniverseID) => {
        setSelectedOrderId(id);
    };

    return h('div', {
        style: {
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#1a1a1a',
            color: '#f0f0f0',
            display: 'flex',
            height: '100vh',
            width: '100vw',
        }
    },
        h('div', { // Left Panel: List
            style: {
                width: '40%',
                borderRight: '1px solid #444',
                display: 'flex',
                flexDirection: 'column',
            }
        },
            h('div', {
                style: {
                    padding: '20px',
                    borderBottom: '1px solid #444',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }
            },
                h('h2', { style: { margin: 0 } }, 'Payment Orders'),
                h(Button, { onClick: fetchData }, 'Refresh')
            ),
            h('div', { style: { overflowY: 'auto', flex: 1 } },
                isLoading
                    ? h('p', { style: { textAlign: 'center', padding: '20px' } }, 'Loading...')
                    : orders.map(order => h(PaymentOrderListItem, { key: order.id, order, onSelect: handleSelectOrder }))
            )
        ),
        h('div', { // Right Panel: Details
            style: {
                width: '60%',
                overflowY: 'auto',
            }
        },
            h(PaymentOrderDetail, { orderId: selectedOrderId })
        )
    );
}

// --- APPLICATION ENTRY POINT ---

// This would be in your main index.ts or similar
document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
        // Clear any existing content
        rootElement.innerHTML = '';
        // Set some base styles for the page
        document.body.style.margin = '0';
        document.body.style.backgroundColor = '#1a1a1a';
        // Render the main component
        renderer.render(PaymentOrdersView, rootElement);
    } else {
        UniverseLogger.error("Root element with id 'root' not found.");
    }
});

// Exporting for potential modular use, though this file is self-contained.
export default PaymentOrdersView;