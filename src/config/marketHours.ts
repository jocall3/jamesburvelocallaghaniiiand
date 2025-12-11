export interface MarketTime {
  hour: number;
  minute: number;
}

export interface MarketConfig {
  id: string;
  label: string;
  timezone: string;
  open: MarketTime;
  close: MarketTime;
  currency: string;
}

export const MARKET_HOURS: Record<string, MarketConfig> = {
  TOKYO: {
    id: 'tokyo',
    label: 'Tokyo (JGB)',
    timezone: 'Asia/Tokyo',
    open: { hour: 9, minute: 0 },
    close: { hour: 15, minute: 0 },
    currency: 'JPY',
  },
  LONDON: {
    id: 'london',
    label: 'London (Gilts)',
    timezone: 'Europe/London',
    open: { hour: 8, minute: 0 },
    close: { hour: 16, minute: 30 },
    currency: 'GBP',
  },
  NEW_YORK: {
    id: 'new_york',
    label: 'New York (Treasuries)',
    timezone: 'America/New_York',
    open: { hour: 8, minute: 0 },
    close: { hour: 17, minute: 0 },
    currency: 'USD',
  },
};

export const SIMULATION_TICK_INTERVAL_MS = 1000;
export const DEFAULT_MARKET_ID = 'new_york';