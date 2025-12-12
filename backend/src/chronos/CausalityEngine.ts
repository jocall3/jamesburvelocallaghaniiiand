interface VariableState {
    name: string;
    value: any;
    timestamp: number;
}

interface CausalityRule {
    condition: (currentState: Map<string, any>, time: number) => boolean;
    action: (currentState: Map<string, any>, time: number) => Map<string, any>;
    name: string;
}

interface SimulationResult {
    history: VariableState[];
    finalState: Map<string, any>;
    executionTimeMs: number;
}

class CausalityEngine {
    private variables: Map<string, any>;
    private rules: CausalityRule[];
    private readonly startTime: number;

    constructor(initialVariables: Map<string, any> = new Map()) {
        this.variables = new Map(initialVariables);
        this.rules = [];
        this.startTime = Date.now();
    }

    /**
     * Adds a new variable or updates an existing one.
     * @param name The name of the variable.
     * @param value The initial or updated value.
     */
    public setVariable(name: string, value: any): void {
        this.variables.set(name, value);
    }

    /**
     * Registers a new causality rule.
     * @param rule The rule to add.
     */
    public addRule(rule: CausalityRule): void {
        this.rules.push(rule);
    }

    /**
     * Runs a 'what-if' simulation for a specified duration or number of steps.
     * @param simulationDurationMs The duration to simulate in milliseconds.
     * @param stepIntervalMs The time interval between simulation steps in milliseconds.
     * @returns The simulation result.
     */
    public runSimulation(simulationDurationMs: number, stepIntervalMs: number = 100): SimulationResult {
        const initialTime = Date.now();
        const endTime = initialTime + simulationDurationMs;
        
        const history: VariableState[] = [];
        let currentTime = initialTime;
        let currentState = new Map(this.variables);
        
        history.push({ name: 'SystemStart', value: 'Simulation Initialized', timestamp: initialTime });
        this.logState(history, currentTime, currentState);

        while (currentTime < endTime) {
            let appliedChange = false;
            const nextState = new Map(currentState);
            
            // Apply rules sequentially
            for (const rule of this.rules) {
                if (rule.condition(currentState, currentTime - initialTime)) {
                    const newStateUpdate = rule.action(currentState, currentTime - initialTime);
                    
                    // Merge updates into the next state
                    newStateUpdate.forEach((value, key) => {
                        nextState.set(key, value);
                    });
                    appliedChange = true;
                }
            }

            if (appliedChange) {
                // Only log state if changes were applied in this step
                currentState = nextState;
                this.logState(history, currentTime, currentState);
            }

            // Advance time for the next step
            currentTime += stepIntervalMs;
            if (currentTime > endTime) {
                currentTime = endTime; // Ensure we don't overshoot the end time significantly
            }
        }

        history.push({ name: 'SystemEnd', value: 'Simulation Finished', timestamp: currentTime });

        return {
            history,
            finalState: currentState,
            executionTimeMs: Date.now() - this.startTime,
        };
    }
    
    /**
     * Helper function to record the current state of all variables.
     */
    private logState(history: VariableState[], time: number, state: Map<string, any>): void {
        state.forEach((value, key) => {
            // For simplicity, we record the time elapsed since start in the timestamp field
            history.push({
                name: key,
                value: JSON.parse(JSON.stringify(value)), // Deep copy to prevent future mutations affecting history
                timestamp: time - this.startTime, // Time elapsed
            });
        });
    }

    /**
     * Utility method to check the state of a variable during simulation.
     * @param name The name of the variable.
     * @returns The current value, or undefined if not found.
     */
    public getVariable(name: string): any | undefined {
        return this.variables.get(name);
    }
}

// Example Usage (Demonstration purposes, not part of the core class export typically)
/*
const initialVars = new Map<string, any>([
    ['Money', 1000],
    ['Morale', 50],
    ['ProductionRate', 10]
]);

const engine = new CausalityEngine(initialVars);

const highMoraleRule: CausalityRule = {
    name: "HighMoraleBoost",
    condition: (state, timeElapsed) => {
        return state.get('Morale') > 70 && timeElapsed > 500;
    },
    action: (state, timeElapsed) => {
        const updates = new Map();
        updates.set('ProductionRate', state.get('ProductionRate') + 2);
        updates.set('Morale', state.get('Morale') - 1); // Morale slightly decreases after the boost stabilizes
        return updates;
    }
};

const lowMoneyRule: CausalityRule = {
    name: "LowMoneyCrisis",
    condition: (state, timeElapsed) => {
        return state.get('Money') < 200;
    },
    action: (state, timeElapsed) => {
        const updates = new Map();
        updates.set('Morale', state.get('Morale') - 5);
        updates.set('Money', state.get('Money') + 50); // Small recovery attempt
        return updates;
    }
};

const steadyDepreciationRule: CausalityRule = {
    name: "SteadyDepreciation",
    condition: (state, timeElapsed) => {
        return timeElapsed % 300 === 0; // Check every 3 steps (300ms total if step is 100ms)
    },
    action: (state, timeElapsed) => {
        const updates = new Map();
        updates.set('Money', state.get('Money') - 50);
        return updates;
    }
};


engine.addRule(highMoraleRule);
engine.addRule(lowMoneyRule);
engine.addRule(steadyDepreciationRule);

// Set initial Morale high to trigger the boost after some time passes
engine.setVariable('Morale', 80);


const result = engine.runSimulation(2000, 100); // Simulate for 2 seconds, 100ms steps

// console.log("Simulation Complete:", result.finalState);
// console.log("History Length:", result.history.filter(h => h.name !== 'SystemStart' && h.name !== 'SystemEnd').length);

export { CausalityEngine, CausalityRule, VariableState, SimulationResult };
*/
export { CausalityEngine, CausalityRule, VariableState, SimulationResult };