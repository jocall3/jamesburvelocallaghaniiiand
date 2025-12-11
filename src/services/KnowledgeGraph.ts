import { View } from "../types";
import { getArticleById } from "../data/constitutionalArticles";

/**
 * @interface KnowledgeNode
 * @description Defines the structure of a node in the Sovereign's Knowledge Graph.
 * Nodes represent concrete entities like inventions, goals, or high-level views.
 */
export interface KnowledgeNode {
    id: string;
    type: 'invention' | 'roadmap_item' | 'vision_theme' | 'article';
    title: string;
    description: string;
    urlSlug: string;
}

/**
 * @interface KnowledgeEdge
 * @description Defines the connection (relationship) between two nodes in the graph.
 */
export interface KnowledgeEdge {
    sourceId: string;
    targetId: string;
    relationshipType: 'supports' | 'derives_from' | 'influences' | 'is_precursor_to';
    description: string;
}

/**
 * @interface KnowledgeGraph
 * @description The complete topological structure of all known concepts and their relationships.
 */
export interface KnowledgeGraph {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
}

/**
 * @service KnowledgeGraph
 * @description The Sovereign's Knowledge Graph Service. It maintains the semantic structure
 * of the entire system, mapping high-level philosophical concepts (The Vision, Articles)
 * to concrete deliverables (Inventions, Roadmap Items). It ensures that all work
 * is traceable back to its originating intent.
 */
export class KnowledgeGraphService {
    private graph: KnowledgeGraph;

    constructor() {
        this.graph = this.initializeGraph();
    }

    /**
     * @method initializeGraph
     * @description Creates the initial, foundational structure of the Knowledge Graph.
     * This establishes the axiomatic links between the core philosophical components
     * and the main module entry points.
     * @returns {KnowledgeGraph} The initialized graph object.
     */
    private initializeGraph(): KnowledgeGraph {
        const nodes: KnowledgeNode[] = [
            // Core Vision Themes
            {
                id: 'vision-core',
                type: 'vision_theme',
                title: 'The Sovereign\'s Will',
                description: 'The fundamental principle that all instrument functionality must serve the declared will of the architect.',
                urlSlug: 'the-vision',
            },
            {
                id: 'vision-autonomy',
                type: 'vision_theme',
                title: 'Instrument Autonomy',
                description: 'The philosophy of enabling the AI to act as an independent extension of the architect\'s intent.',
                urlSlug: 'ai-governance',
            },
            {
                id: 'vision-creation',
                type: 'vision_theme',
                title: 'Generative Creation',
                description: 'The goal of using financial power and intelligence to create novel assets and systems (The Forge).',
                urlSlug: 'forge',
            },
            // Roadmap Items (Representing high-level objectives)
            {
                id: 'roadmap-q1-oracle',
                type: 'roadmap_item',
                title: 'Quantum Oracle V1.0',
                description: 'Deliver the first viable simulation engine capable of modeling 6-month financial impact.',
                urlSlug: View.QuantumOracle,
            },
            {
                id: 'roadmap-q2-weaver',
                type: 'roadmap_item',
                title: 'Quantum Weaver Alpha',
                description: 'Launch the secure pitch submission gateway for AI-assisted business incubation.',
                urlSlug: View.QuantumWeaver,
            },
            // Inventions (Representing specific technical modules)
            {
                id: 'inv-nl-query',
                type: 'invention',
                title: 'Natural Language Query Processor',
                description: 'The service that translates declarative requests into formal execution languages (SQL, DBQL).',
                urlSlug: View.DBQL, // Linked to the DBQL module
            },
            {
                id: 'inv-dynamic-policy',
                type: 'invention',
                title: 'Dynamic Risk Policy Engine',
                description: 'The mechanism that adjusts access controls based on real-time session risk scores.',
                urlSlug: View.Security, // Linked to the Security module
            },
        ];

        // Core constitutional articles provide the initial philosophical grounding
        const charterArticle = getArticleById(1);
        if (charterArticle) {
            nodes.push({
                id: `article-${charterArticle.id}`,
                type: 'article',
                title: `Article ${charterArticle.romanNumeral}: ${charterArticle.title}`,
                description: charterArticle.summary,
                urlSlug: `article-${charterArticle.id}`,
            });
        }


        const edges: KnowledgeEdge[] = [
            // Vision to Roadmap Links
            {
                sourceId: 'vision-core',
                targetId: 'roadmap-q1-oracle',
                relationshipType: 'supports',
                description: 'The Oracle is the first major step in manifesting the Sovereign\'s foresight.',
            },
            {
                sourceId: 'vision-autonomy',
                targetId: 'roadmap-q2-weaver',
                relationshipType: 'supports',
                description: 'The Weaver relies on high autonomy to judge the merit of new business pitches.',
            },
            {
                sourceId: 'vision-creation',
                targetId: 'roadmap-q2-weaver',
                relationshipType: 'influences',
                description: 'The Weaver is a direct tool for realizing the goal of Generative Creation.',
            },
            // Roadmap to Invention Links
            {
                sourceId: 'roadmap-q1-oracle',
                targetId: 'inv-nl-query',
                relationshipType: 'derives_from',
                description: 'The Oracle simulation relies on the NL Query Processor to understand user input.',
            },
            {
                sourceId: 'roadmap-q2-weaver',
                targetId: 'inv-dynamic-policy',
                relationshipType: 'influences',
                description: 'Weaver operations require strict, dynamic policy enforcement for sensitive submissions.',
            },
            // Philosophical Grounding
            {
                sourceId: `article-${charterArticle?.id}`,
                targetId: 'vision-core',
                relationshipType: 'influences',
                description: 'The Charter is the written foundation of the Sovereign Will axiom.',
            },
        ];

        return { nodes, edges };
    }

    /**
     * @method getGraph
     * @description Returns the current, immutable state of the Knowledge Graph.
     * @returns {KnowledgeGraph} The current graph structure.
     */
    public getGraph(): KnowledgeGraph {
        // Return a deep copy to ensure external immutability of the internal state
        return JSON.parse(JSON.stringify(this.graph));
    }

    /**
     * @method addNode
     * @description Adds a new concept node to the graph. Used when new inventions or features are formalized.
     * @param {Omit<KnowledgeNode, 'id'>} nodeData - The data for the new node (title, type, description, urlSlug).
     * @returns {string} The ID of the newly created node.
     */
    public addNode(nodeData: Omit<KnowledgeNode, 'id'>): string {
        const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newNode: KnowledgeNode = { ...nodeData, id: newId };
        this.graph.nodes.push(newNode);
        console.log(`[KnowledgeGraph] Node added: ${newId} (${nodeData.title})`);
        return newId;
    }

    /**
     * @method addEdge
     * @description Establishes a semantic link between two existing nodes.
     * @param {string} sourceId - The ID of the source node.
     * @param {string} targetId - The ID of the target node.
     * @param {'supports' | 'derives_from' | 'influences' | 'is_precursor_to'} type - The type of relationship.
     * @param {string} description - A human-readable explanation of the link.
     * @returns {boolean} True if the edge was successfully added.
     */
    public addEdge(sourceId: string, targetId: string, type: KnowledgeEdge['relationshipType'], description: string): boolean {
        const sourceExists = this.graph.nodes.some(n => n.id === sourceId);
        const targetExists = this.graph.nodes.some(n => n.id === targetId);

        if (!sourceExists || !targetExists) {
            console.error(`[KnowledgeGraph] Cannot add edge: One or both node IDs do not exist. Source: ${sourceId}, Target: ${targetId}`);
            return false;
        }

        const newEdge: KnowledgeEdge = { sourceId, targetId, relationshipType: type, description };
        this.graph.edges.push(newEdge);
        console.log(`[KnowledgeGraph] Edge added: ${sourceId} --(${type})--> ${targetId}`);
        return true;
    }

    /**
     * @method findConnectedNodes
     * @description Finds all nodes directly connected to a given node, regardless of direction.
     * @param {string} nodeId - The ID of the node to start from.
     * @returns {{node: KnowledgeNode, edge: KnowledgeEdge}[]} An array of connected nodes and the edges linking them.
     */
    public findConnectedNodes(nodeId: string): { node: KnowledgeNode, edge: KnowledgeEdge }[] {
        const connections: { node: KnowledgeNode, edge: KnowledgeEdge }[] = [];
        const nodeMap = new Map(this.graph.nodes.map(n => [n.id, n]));

        this.graph.edges.forEach(edge => {
            let neighborId: string | null = null;
            if (edge.sourceId === nodeId) {
                neighborId = edge.targetId;
            } else if (edge.targetId === nodeId) {
                neighborId = edge.sourceId;
            }

            if (neighborId) {
                const neighborNode = nodeMap.get(neighborId);
                if (neighborNode) {
                    connections.push({ node: neighborNode, edge });
                }
            }
        });

        return connections;
    }

    /**
     * @method getPathToVision
     * @description Attempts to find a chain of relationships leading from any given node back to a core vision theme.
     * (Simplified Breadth-First Search implementation for demonstration).
     * @param {string} startNodeId - The ID of the node to trace from.
     * @returns {{path: KnowledgeEdge[], found: boolean}} The path of edges or an indication that no path was found.
     */
    public getPathToVision(startNodeId: string): { path: KnowledgeEdge[], found: boolean } {
        const queue: { nodeId: string, path: KnowledgeEdge[] }[] = [{ nodeId: startNodeId, path: [] }];
        const visited = new Set<string>([startNodeId]);
        const visionNodeIds = this.graph.nodes
            .filter(n => n.type === 'vision_theme')
            .map(n => n.id);

        while (queue.length > 0) {
            const { nodeId, path } = queue.shift()!;

            // Check if current node is a Vision Theme
            if (visionNodeIds.includes(nodeId)) {
                return { path, found: true };
            }

            // Find outgoing and incoming edges for BFS
            const neighbors = this.graph.edges
                .filter(edge => edge.sourceId === nodeId || edge.targetId === nodeId)
                .map(edge => {
                    const nextId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId;
                    return { nextId, edge };
                });

            for (const { nextId, edge } of neighbors) {
                if (!visited.has(nextId)) {
                    visited.add(nextId);
                    const newPath = [...path, edge];
                    queue.push({ nodeId: nextId, path: newPath });
                }
            }
        }

        return { path: [], found: false };
    }
}

// Singleton instance for global access, ensuring the graph state is singular.
const knowledgeGraphInstance = new KnowledgeGraphService();
export default knowledgeGraphInstance;
