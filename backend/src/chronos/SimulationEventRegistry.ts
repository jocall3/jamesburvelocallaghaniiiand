interface SimulationEvent {
    id: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    probability: number; // 0.0 to 1.0
    triggerCondition: (context: any) => boolean;
    consequences: (context: any) => void;
    metadata?: any;
}

class SimulationEventRegistry {
    private events: Map<string, SimulationEvent> = new Map();

    /**
     * Registers a new simulation event.
     * @param event The simulation event object.
     */
    public registerEvent(event: SimulationEvent): void {
        if (this.events.has(event.id)) {
            console.warn(`Simulation Event ID ${event.id} already registered. Overwriting.`);
        }
        this.events.set(event.id, event);
    }

    /**
     * Retrieves an event by its ID.
     * @param id The ID of the event.
     * @returns The SimulationEvent or undefined if not found.
     */
    public getEvent(id: string): SimulationEvent | undefined {
        return this.events.get(id);
    }

    /**
     * Retrieves all registered events.
     * @returns An array of SimulationEvent objects.
     */
    public getAllEvents(): SimulationEvent[] {
        return Array.from(this.events.values());
    }

    /**
     * Iterates through all registered events and checks if any are triggered based on the current simulation context.
     * Note: This typically triggers only one event per check in a real scenario to maintain focus, but this implementation checks all.
     * @param context The current state of the simulation (e.g., market data, model parameters).
     * @returns An array of IDs of the events that were triggered.
     */
    public checkAndTriggerEvents(context: any): string[] {
        const triggeredIds: string[] = [];
        
        for (const [id, event] of this.events.entries()) {
            try {
                if (event.triggerCondition(context)) {
                    console.log(`Triggering simulation event: ${event.name} (${id})`);
                    event.consequences(context);
                    triggeredIds.push(id);
                }
            } catch (error) {
                console.error(`Error while checking/triggering event ${event.name} (${id}):`, error);
            }
        }
        
        return triggeredIds;
    }

    /**
     * Clears all registered events.
     */
    public clearEvents(): void {
        this.events.clear();
    }
}

// --- Example/Pre-defined Events (To be populated based on specific simulation needs) ---

const exampleEvents: SimulationEvent[] = [
    {
        id: 'MARKET_FLASH_CRASH_001',
        name: 'Rapid Market Decline',
        description: 'A sudden, severe drop in major indices.',
        severity: 'critical',
        probability: 0.1, // Low intrinsic probability, but context might increase it
        triggerCondition: (context: { volatilityIndex: number, portfolioValue: number }) => {
            // Example condition: Volatility spike combined with a recent market downturn
            return context.volatilityIndex > 40 && context.portfolioValue < 95000;
        },
        consequences: (context: any) => {
            console.warn("System response: Initiate emergency liquidity injection protocols.");
            // In a real system, this would call specific simulation handlers
        },
        metadata: { assetClass: 'Equities' }
    },
    {
        id: 'REG_SHIFT_PRIVACY_002',
        name: 'New Data Privacy Regulation',
        description: 'A major regulatory body imposes strict new data handling rules.',
        severity: 'high',
        probability: 0.05,
        triggerCondition: (context: { year: number, regulatoryRiskScore: number }) => {
            // Example: Only check this in a specific future year or if risk score is high
            return context.year >= 2025 && context.regulatoryRiskScore > 0.7;
        },
        consequences: (context: any) => {
            console.info("System response: Flag all personal data processing modules for compliance review.");
        },
        metadata: { regulatoryArea: 'GDPR_like' }
    },
    {
        id: 'TECH_ADV_AI_BREAKTHROUGH_003',
        name: 'Unexpected Technological Leap',
        description: 'A new general AI model is released, fundamentally changing competitive dynamics.',
        severity: 'medium',
        probability: 0.01,
        triggerCondition: (context: { sectorFocus: string, techAdvancementLevel: number }) => {
            return context.sectorFocus === 'AI' && context.techAdvancementLevel > 0.9;
        },
        consequences: (context: any) => {
            console.log("System response: Re-evaluate long-term growth projections for technology sectors.");
        },
        metadata: { impactType: 'Disruptive Innovation' }
    }
];

// Initialize the registry with example events upon module load
const eventRegistry = new SimulationEventRegistry();

exampleEvents.forEach(event => eventRegistry.registerEvent(event));

export { SimulationEvent, SimulationEventRegistry, eventRegistry };
