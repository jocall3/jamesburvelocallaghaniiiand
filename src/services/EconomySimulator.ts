```ts
// src/services/EconomySimulator.ts

// ================================================================================================
// CONFIGURATION CONSTANTS
// ================================================================================================

const DEFAULT_SIMULATION_DURATION = 365;  // Days
const DEFAULT_NUM_AGENTS = 100;
const DEFAULT_INITIAL_WEALTH_RANGE = { min: 1000, max: 5000 };
const DEFAULT_CONSUMPTION_RATE = 0.1; // Percentage of wealth consumed per period
const DEFAULT_PRODUCTION_EFFICIENCY_RANGE = { min: 0.01, max: 0.05 }; // Output per unit input
const DEFAULT_REINVESTMENT_RATE = 0.05;  // Percentage of profit reinvested
const DEFAULT_TAX_RATE = 0.2; // Simple proportional tax


// ================================================================================================
// UTILITY FUNCTIONS
// ================================================================================================

/**
 * Generates a random number within a specified range.
 * @param {number} min - The minimum value of the range.
 * @param {number} max - The maximum value of the range.
 * @returns {number} A random number between min and max (inclusive).
 */
const getRandomInRange = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

/**
 * Represents a single agent in the economic simulation.
 */
interface Agent {
    id: string;
    wealth: number;
    consumptionRate: number;
    productionEfficiency: number;
    reinvestmentRate: number;
    isEmployed: boolean;
    producedGoods: number;
    profit: number;
    taxPaid: number;
    utility:number;
}

/**
 * Represents the overall state of the economic simulation.
 */
interface EconomyState {
    agents: Agent[];
    totalWealth: number;
    averageWealth: number;
    giniCoefficient: number;
    taxRevenue: number;
    unemploymentRate: number;
    time: number; // Current time period of simulation
}


// ================================================================================================
// MAIN SIMULATION CLASS
// ================================================================================================

class EconomySimulator {
    private agents: Agent[];
    private simulationDuration: number;
    private time: number;  // Simulation Time



    constructor(
        numAgents: number = DEFAULT_NUM_AGENTS,
        simulationDuration: number = DEFAULT_SIMULATION_DURATION
    ) {
        this.agents = this.initializeAgents(numAgents);
        this.simulationDuration = simulationDuration;
        this.time = 0;
    }


    /**
     * Initializes the agents with random wealth and other properties.
     * @param {number} numAgents - The number of agents to create.
     * @returns {Agent[]} An array of initialized agents.
     */
    private initializeAgents(numAgents: number): Agent[] {
        const agents: Agent[] = [];
        for (let i = 0; i < numAgents; i++) {
            agents.push({
                id: `agent-${i}`,
                wealth: getRandomInRange(DEFAULT_INITIAL_WEALTH_RANGE.min, DEFAULT_INITIAL_WEALTH_RANGE.max),
                consumptionRate: DEFAULT_CONSUMPTION_RATE,
                productionEfficiency: getRandomInRange(DEFAULT_PRODUCTION_EFFICIENCY_RANGE.min, DEFAULT_PRODUCTION_EFFICIENCY_RANGE.max),
                reinvestmentRate: DEFAULT_REINVESTMENT_RATE,
                isEmployed: true,
                producedGoods: 0,
                profit: 0,
                taxPaid: 0,
                utility: 0,
            });
        }
        return agents;
    }

    /**
     * Simulates a single time step in the economy.
     */
    simulateStep(): void {
        this.time++;

        // 1. Production: Each agent produces goods
        this.agents.forEach(agent => {
            if (agent.isEmployed) {
                agent.producedGoods = agent.wealth * agent.productionEfficiency; //Simplified
            }
        });

        // 2. Trade: Agents exchange goods (simplified - not modeled)

        // 3. Consumption: Agents consume a portion of their wealth
        this.agents.forEach(agent => {
            const consumption = agent.wealth * agent.consumptionRate;
            agent.wealth -= consumption;
            agent.utility += consumption; //Simplified - consuming makes agent happier

        });

        // 4. Calculate Profit:
        this.agents.forEach(agent => {
            agent.profit = agent.producedGoods - (agent.wealth * agent.consumptionRate);
        });

        // 5. Taxation: Simple proportional tax
        this.agents.forEach(agent => {
            agent.taxPaid = agent.profit * DEFAULT_TAX_RATE;
            agent.wealth += agent.profit - agent.taxPaid;
        });

        // 6. Reinvestment:
        this.agents.forEach(agent => {
            const reinvestment = agent.profit * agent.reinvestmentRate;
            agent.wealth += reinvestment;
        });
        this.updateEconomyState();
    }

    /**
     * Simulates the economy for the defined duration.
     */
    runSimulation(): EconomyState[] {
        const history: EconomyState[] = [];
        while (this.time < this.simulationDuration) {
            this.simulateStep();
            history.push(this.getEconomyState());
        }
        return history;
    }

    /**
     * Calculates the Gini coefficient of wealth distribution.
     * @returns {number} The Gini coefficient.
     */
    private calculateGiniCoefficient(): number {
        const sortedWealth = this.agents.map(agent => agent.wealth).sort((a, b) => a - b);
        const n = sortedWealth.length;
        let sum = 0;
        for (let i = 0; i < n; i++) {
            sum += (2 * (i + 1) - n - 1) * sortedWealth[i];
        }
        const meanWealth = sortedWealth.reduce((a, b) => a + b, 0) / n;
        return sum / (n * n * meanWealth);
    }

    /**
     * Updates and returns the current state of the economy.
     * @returns {EconomyState} The current state of the economy.
     */
    getEconomyState(): EconomyState {
        const totalWealth = this.agents.reduce((sum, agent) => sum + agent.wealth, 0);
        const averageWealth = totalWealth / this.agents.length;
        const giniCoefficient = this.calculateGiniCoefficient();
        const taxRevenue = this.agents.reduce((sum, agent) => sum + agent.taxPaid, 0);
        const unemploymentRate = this.agents.filter(agent => !agent.isEmployed).length / this.agents.length;

        return {
            agents: [...this.agents], // Return a copy to prevent external modification
            totalWealth,
            averageWealth,
            giniCoefficient,
            taxRevenue,
            unemploymentRate,
            time: this.time,
        };
    }

    /**
     * Resets the simulation to its initial state.
     */
    resetSimulation(): void {
        this.agents = this.initializeAgents(this.agents.length);
        this.time = 0;
    }
}

export default EconomySimulator;
```