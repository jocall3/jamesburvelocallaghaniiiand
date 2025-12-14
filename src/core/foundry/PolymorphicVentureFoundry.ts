import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

/**
 * Type definitions for the Venture Foundry ecosystem.
 */
export type VentureID = string;
export type AtomID = string;
export type Namespace = string;

export enum VentureStatus {
    BLUEPRINT = 'BLUEPRINT',
    FORGING = 'FORGING',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    DECOMMISSIONED = 'DECOMMISSIONED',
}

export interface IServiceAtomConfig {
    [key: string]: any;
}

/**
 * Represents an atomic, deployable microservice unit.
 */
export interface IMicroserviceAtom {
    id: AtomID;
    namespace: Namespace;
    version: string;
    capabilities: string[];
    isStateful: boolean;
    
    configure(config: IServiceAtomConfig): void;
    hydrate(): Promise<void>;
    dehydrate(): Promise<void>;
}

/**
 * A blueprint defines the architectural DNA of a million-dollar app.
 */
export interface IVentureBlueprint {
    id: string;
    name: string;
    targetVertical: string;
    requiredNamespaces: Map<Namespace, string>; // Namespace -> Capability requirement
    defaultConfiguration: IServiceAtomConfig;
    scalingStrategy: 'horizontal' | 'vertical' | 'serverless';
}

/**
 * A live instance of a generated application.
 */
export interface IVentureInstance {
    id: VentureID;
    blueprintId: string;
    atoms: Map<Namespace, IMicroserviceAtom>;
    configuration: IServiceAtomConfig;
    status: VentureStatus;
    createdAt: Date;
    publicEndpoint?: string;
}

/**
 * Registry for available microservice atoms.
 */
class AtomRegistry {
    private static instance: AtomRegistry;
    private atoms: Map<string, new () => IMicroserviceAtom> = new Map();

    private constructor() {}

    public static getInstance(): AtomRegistry {
        if (!AtomRegistry.instance) {
            AtomRegistry.instance = new AtomRegistry();
        }
        return AtomRegistry.instance;
    }

    public register(capability: string, atomClass: new () => IMicroserviceAtom): void {
        this.atoms.set(capability, atomClass);
    }

    public resolve(capability: string): IMicroserviceAtom {
        const AtomClass = this.atoms.get(capability);
        if (!AtomClass) {
            throw new Error(`Registry Error: No atom found for capability [${capability}]`);
        }
        return new AtomClass();
    }
}

/**
 * The PolymorphicVentureFoundry is the central factory class that decouples domain 
 * namespaces into atomic, white-labelable microservices for dynamic recombination.
 */
export class PolymorphicVentureFoundry extends EventEmitter {
    private ventures: Map<VentureID, IVentureInstance>;
    private blueprints: Map<string, IVentureBlueprint>;
    private registry: AtomRegistry;

    constructor() {
        super();
        this.ventures = new Map();
        this.blueprints = new Map();
        this.registry = AtomRegistry.getInstance();
    }

    /**
     * Registers a new architectural blueprint for potential ventures.
     * @param blueprint The venture blueprint definition.
     */
    public registerBlueprint(blueprint: IVentureBlueprint): void {
        if (this.blueprints.has(blueprint.id)) {
            throw new Error(`Blueprint collision: ${blueprint.id} already exists.`);
        }
        this.blueprints.set(blueprint.id, blueprint);
        this.emit('blueprint_registered', blueprint.id);
    }

    /**
     * The core factory method. Instantiates a new venture based on a blueprint,
     * injects white-label configuration, and orchestrates the microservice atoms.
     * 
     * @param blueprintId The ID of the blueprint to instantiate.
     * @param whiteLabelConfig Custom configuration override for this specific venture.
     */
    public async forgeVenture(
        blueprintId: string, 
        whiteLabelConfig: IServiceAtomConfig
    ): Promise<IVentureInstance> {
        const blueprint = this.blueprints.get(blueprintId);
        if (!blueprint) {
            throw new Error(`Forge Error: Blueprint ${blueprintId} not found.`);
        }

        const ventureId = randomUUID();
        const instance: IVentureInstance = {
            id: ventureId,
            blueprintId: blueprint.id,
            atoms: new Map(),
            configuration: { ...blueprint.defaultConfiguration, ...whiteLabelConfig },
            status: VentureStatus.FORGING,
            createdAt: new Date(),
        };

        this.ventures.set(ventureId, instance);
        this.emit('forging_started', { ventureId, blueprintId });

        try {
            await this.composeAtoms(instance, blueprint.requiredNamespaces);
            await this.igniteVenture(instance);
            
            instance.status = VentureStatus.ACTIVE;
            this.emit('venture_active', { ventureId, endpoint: instance.publicEndpoint });
            
            return instance;
        } catch (error) {
            instance.status = VentureStatus.DECOMMISSIONED;
            this.emit('forging_failed', { ventureId, error });
            throw error;
        }
    }

    /**
     * Dynamically recombines existing services from different ventures into a new composite venture.
     * This allows for "Frankenstein" apps that merge successful features from multiple origins.
     */
    public async recombineServices(
        primaryVentureId: VentureID, 
        secondaryVentureId: VentureID,
        namespaceOverrides: Namespace[]
    ): Promise<IVentureInstance> {
        const primary = this.ventures.get(primaryVentureId);
        const secondary = this.ventures.get(secondaryVentureId);

        if (!primary || !secondary) throw new Error("Recombination Error: Venture not found.");

        const newVentureId = randomUUID();
        const compositeInstance: IVentureInstance = {
            id: newVentureId,
            blueprintId: `composite-${primary.blueprintId}-${secondary.blueprintId}`,
            atoms: new Map(primary.atoms), // Start with primary
            configuration: { ...primary.configuration, ...secondary.configuration },
            status: VentureStatus.FORGING,
            createdAt: new Date()
        };

        // Hot-swap namespaces from secondary venture
        for (const ns of namespaceOverrides) {
            if (secondary.atoms.has(ns)) {
                const atom = secondary.atoms.get(ns)!;
                // We clone the atom logic but re-hydrate with composite config
                const newAtom = this.registry.resolve(atom.capabilities[0]); 
                newAtom.configure(compositeInstance.configuration);
                compositeInstance.atoms.set(ns, newAtom);
            }
        }

        this.ventures.set(newVentureId, compositeInstance);
        await this.igniteVenture(compositeInstance);
        
        compositeInstance.status = VentureStatus.ACTIVE;
        return compositeInstance;
    }

    /**
     * Resolves and instantiates the necessary microservice atoms based on the namespace map.
     */
    private async composeAtoms(
        instance: IVentureInstance, 
        requirements: Map<Namespace, string>
    ): Promise<void> {
        for (const [namespace, capability] of requirements.entries()) {
            try {
                const atom = this.registry.resolve(capability);
                atom.namespace = namespace;
                atom.configure(instance.configuration);
                instance.atoms.set(namespace, atom);
            } catch (e) {
                throw new Error(`Composition failed for namespace ${namespace}: ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
        }
    }

    /**
     * Initializes the venture's lifecycle, hydrating all atoms and establishing
     * the inter-service communication bus.
     */
    private async igniteVenture(instance: IVentureInstance): Promise<void> {
        const atomPromises = Array.from(instance.atoms.values()).map(async (atom) => {
            await atom.hydrate();
        });

        await Promise.all(atomPromises);
        
        // Mocking the assignment of a public ingress
        instance.publicEndpoint = `https://${instance.id}.venture-cloud.io`;
    }

    /**
     * Gracefully tears down a venture, dehydrating stateful atoms and releasing resources.
     */
    public async decommissionVenture(ventureId: VentureID): Promise<void> {
        const instance = this.ventures.get(ventureId);
        if (!instance) return;

        instance.status = VentureStatus.SUSPENDED;
        
        const shutdownPromises = Array.from(instance.atoms.values()).map(atom => atom.dehydrate());
        await Promise.all(shutdownPromises);

        instance.status = VentureStatus.DECOMMISSIONED;
        this.emit('venture_decommissioned', ventureId);
    }

    /**
     * Retrieves internal diagnostics for a specific venture to monitor performance.
     */
    public getVentureDiagnostics(ventureId: VentureID): any {
        const instance = this.ventures.get(ventureId);
        if (!instance) throw new Error("Venture not found");

        return {
            id: instance.id,
            status: instance.status,
            atomCount: instance.atoms.size,
            uptime: (new Date().getTime() - instance.createdAt.getTime()) / 1000,
            namespaces: Array.from(instance.atoms.keys())
        };
    }
}

// ---------------------------------------------------------------------------
// Example Usage / Mock Atom Registration for Context
// ---------------------------------------------------------------------------

// This would typically be in separate files, but provided here to ensure the 
// Foundry code is strictly typed and runnable if extracted.

export abstract class BaseAtom implements IMicroserviceAtom {
    id: AtomID = randomUUID();
    namespace: Namespace = 'default';
    abstract capabilities: string[];
    version: string = '1.0.0';
    isStateful: boolean = false;
    protected config: any = {};

    configure(config: IServiceAtomConfig): void {
        this.config = config;
    }

    async hydrate(): Promise<void> {
        // console.log(`Hydrating ${this.constructor.name}...`);
    }

    async dehydrate(): Promise<void> {
        // console.log(`Dehydrating ${this.constructor.name}...`);
    }
}