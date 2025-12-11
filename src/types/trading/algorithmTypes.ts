```typescript
export type AlgorithmType = 'SimpleMovingAverage' | 'ExponentialMovingAverage' | 'MACD' | 'RSI' | 'Custom';

export interface AlgorithmConfig {
    type: AlgorithmType;
    parameters: AlgorithmParameters;
    executionTrigger: ExecutionTrigger;
}

export interface AlgorithmParameters {
    [key: string]: any; // Allows for different parameters based on algorithm type
}

export interface SimpleMovingAverageParameters extends AlgorithmParameters {
    period: number;
}

export interface ExponentialMovingAverageParameters extends AlgorithmParameters {
    period: number;
}

export interface MACDParameters extends AlgorithmParameters {
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
}

export interface RSIParameters extends AlgorithmParameters {
    period: number;
}

export interface ExecutionTrigger {
    type: 'Price' | 'Signal';
    threshold?: number; // For Price trigger
    signalName?: string; // For Signal trigger
    operator?: '>' | '<' | '=' | '>=' | '<='; // For Price and Signal trigger
}

export interface TradingAgentConfig {
    agentName: string;
    symbol: string;
    algorithmConfig: AlgorithmConfig;
    initialCapital: number;
    riskPercentage: number;
}
```