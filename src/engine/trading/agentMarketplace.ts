```typescript
import { LiquiditySweeper } from './agents/LiquiditySweeper';
import { RiskHedger } from './agents/RiskHedger';
import { AlgorithmicAgent } from './agents/AlgorithmicAgent';

export class AgentMarketplace {
    private static agents: { [key: string]: AlgorithmicAgent } = {};

    static registerAgent(agent: AlgorithmicAgent): void {
        if (AgentMarketplace.agents[agent.name]) {
            console.warn(`Agent ${agent.name} is already registered. Overwriting.`);
        }
        AgentMarketplace.agents[agent.name] = agent;
    }

    static getAgent(name: string): AlgorithmicAgent | undefined {
        return AgentMarketplace.agents[name];
    }

    static getAllAgents(): AlgorithmicAgent[] {
        return Object.values(AgentMarketplace.agents);
    }

    static initializeDefaultAgents(): void {
        AgentMarketplace.registerAgent(new LiquiditySweeper());
        AgentMarketplace.registerAgent(new RiskHedger());
        // Add more default agents here as they are developed
    }
}

// Initialize default agents when the module is loaded
AgentMarketplace.initializeDefaultAgents();
```