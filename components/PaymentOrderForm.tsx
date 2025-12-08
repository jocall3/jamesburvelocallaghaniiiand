// --- GLOBAL UNIVERSE CONFIGURATION & UTILITIES ---

/**
 * @module UniverseConfig
 * @description Central configuration for the entire simulated universe.
 * Defines global constants, system parameters, and initial states.
 */
namespace UniverseConfig {
  export const UNIVERSE_NAME = "OmniLedger Nexus";
  export const UNIVERSE_VERSION = "1.0.0-alpha";
  export const INITIAL_SIMULATION_DATE = "2023-01-01T00:00:00Z";
  export const MAX_TRANSACTION_HISTORY_DEPTH = 10000; // Max entries in ledger
  export const DEFAULT_CURRENCY = "USD";
  export const SIMULATION_TICK_INTERVAL_MS = 1000; // How often the simulation advances
  export const API_RATE_LIMIT_DEFAULT_REQUESTS = 100;
  export const API_RATE_LIMIT_DEFAULT_WINDOW_MS = 60000; // 1 minute

  export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    CRITICAL = 4,
  }

  export const CURRENT_LOG_LEVEL = LogLevel.INFO;

  export const SYSTEM_ACCOUNTS = {
    FEE_COLLECTION: "sys_fee_collector_001",
    INTEREST_ACCRUAL: "sys_interest_accrual_001",
    RESERVE_POOL: "sys_reserve_pool_001",
  };

  export const PAYMENT_RAIL_LATENCY_MS = {
    ach: { min: 1000, max: 5000 }, // 1-5 seconds simulated processing
    wire: { min: 500, max: 2000 }, // 0.5-2 seconds
    rtp: { min: 50, max: 200 },    // 50-200 ms
    check: { min: 5000, max: 15000 }, // 5-15 seconds
    book: { min: 10, max: 50 },    // 10-50 ms
    eft: { min: 1000, max: 3000 },
    sepa: { min: 2000, max: 7000 },
    bacs: { min: 3000, max: 8000 },
    au_becs: { min: 2000, max: 6000 },
    interac: { min: 100, max: 500 },
    sen: { min: 50, max: 200 },
    signet: { min: 50, max: 200 },
    provexchange: { min: 100, max: 500 },
  };

  export const TRANSACTION_FEES_CENTS = {
    ach: 25,
    wire: 1500,
    rtp: 10,
    check: 500,
    book: 0,
    eft: 30,
    sepa: 50,
    bacs: 40,
    au_becs: 35,
    interac: 15,
    sen: 5,
    signet: 5,
    provexchange: 15,
  };
}

/**
 * @module UniverseUtils
 * @description Collection of general-purpose utility functions for the universe.
 */
namespace UniverseUtils {
  /**
   * Generates a unique identifier (UUID v4 style).
   * @returns {string} A UUID string.
   */
  export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Formats a date string to YYYY-MM-DD.
   * @param {Date | string} date - The date object or string.
   * @returns {string} Formatted date string.
   */
  export function formatDate(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Converts cents to dollars.
   * @param {number} cents - Amount in cents.
   * @returns {number} Amount in dollars.
   */
  export function centsToDollars(cents: number): number {
    return cents / 100;
  }

  /**
   * Converts dollars to cents.
   * @param {number} dollars - Amount in dollars.
   * @returns {number} Amount in cents.
   */
  export function dollarsToCents(dollars: number): number {
    return Math.round(dollars * 100);
  }

  /**
   * Simple logger for the universe.
   * @param {UniverseConfig.LogLevel} level - The log level.
   * @param {string} message - The log message.
   * @param {any[]} args - Additional arguments to log.
   */
  export function log(level: UniverseConfig.LogLevel, message: string, ...args: any[]): void {
    if (level >= UniverseConfig.CURRENT_LOG_LEVEL) {
      const timestamp = new Date().toISOString();
      const levelStr = UniverseConfig.LogLevel[level];
      console.log(`[${timestamp}] [${levelStr}] ${message}`, ...args);
    }
  }

  /**
   * Deep clones an object.
   * @param {T} obj - The object to clone.
   * @returns {T} A deep clone of the object.
   */
  export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Simulates a delay.
   * @param {number} ms - Milliseconds to delay.
   * @returns {Promise<void>} A promise that resolves after the delay.
   */
  export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generates a random integer within a range.
   * @param {number} min - Minimum value (inclusive).
   * @param {number} max - Maximum value (inclusive).
   * @returns {number} A random integer.
   */
  export function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// --- REACT-LIKE CORE (Minimalist Implementation) ---
// This section provides a bare-bones, self-contained implementation
// of React-like hooks and component rendering for the universe's UI.
// It replaces the external 'react' dependency.

namespace ReactLike {
  type ComponentFunction<P extends object = {}> = (props: P) => VNode;
  type VNode = {
    type: string | ComponentFunction;
    props: { children?: VNode | VNode[] | string | number | null; [key: string]: any };
    _key?: string | number | null;
  };

  let currentComponent: ComponentFunction | null = null;
  let hookIndex: number = 0;
  const componentStates = new Map<ComponentFunction, any[]>();
  const componentEffects = new Map<ComponentFunction, Array<[() => (() => void) | void, any[]]>>();

  /**
   * Creates a virtual DOM node.
   * @param {string | ComponentFunction} type - The HTML tag name or component function.
   * @param {object | null} props - The properties of the element.
   * @param {...(VNode | string | number | null)[]} children - Child nodes.
   * @returns {VNode} A virtual DOM node.
   */
  export function createElement(
    type: string | ComponentFunction,
    props: object | null,
    ...children: (VNode | string | number | null)[]
  ): VNode {
    const processedProps = { ...props };
    if (children.length > 0) {
      processedProps.children = children.length === 1 ? children[0] : children.flat();
    }
    return { type, props: processedProps };
  }

  /**
   * Renders a VNode into a real DOM element.
   * @param {VNode} vnode - The virtual DOM node to render.
   * @returns {HTMLElement | Text} The rendered DOM element.
   */
  function renderVNode(vnode: VNode): HTMLElement | Text {
    if (typeof vnode === 'string' || typeof vnode === 'number' || vnode === null || vnode === undefined) {
      return document.createTextNode(String(vnode));
    }

    if (typeof vnode.type === 'function') {
      currentComponent = vnode.type;
      hookIndex = 0;
      const componentVNode = vnode.type(vnode.props);
      currentComponent = null;
      return renderVNode(componentVNode);
    }

    const element = document.createElement(vnode.type);
    for (const propName in vnode.props) {
      if (propName === 'children') {
        const children = Array.isArray(vnode.props.children) ? vnode.props.children : [vnode.props.children];
        children.forEach(child => {
          if (child !== null && child !== undefined) {
            element.appendChild(renderVNode(child as VNode));
          }
        });
      } else if (propName.startsWith('on') && typeof vnode.props[propName] === 'function') {
        const eventName = propName.toLowerCase().substring(2);
        element.addEventListener(eventName, vnode.props[propName]);
      } else if (propName === 'className') {
        element.setAttribute('class', vnode.props[propName]);
      } else if (propName === 'style' && typeof vnode.props[propName] === 'object') {
        Object.assign(element.style, vnode.props[propName]);
      } else if (propName === 'htmlFor') {
        element.setAttribute('for', vnode.props[propName]);
      } else if (propName === 'inputProps' && typeof vnode.props[propName] === 'object') {
        for (const inputProp in vnode.props[propName]) {
          element.setAttribute(inputProp, vnode.props[propName][inputProp]);