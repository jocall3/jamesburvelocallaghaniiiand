import { generateContent, generateContentStream } from '../utils/gemini'; // Assuming gemini utility exists
import {
  Transaction, User, CorporateCard, TransactionType, AnomalySeverity, AnomalyStatus,
  // Import other relevant types from graphql.ts if needed for comprehensive data mesh
} from '../graphql'; // Re-using existing types for consistency

// ==============================================================================
// 1. Data Mesh Specific Types
// ==============================================================================

/**
 * Represents a simulated data node in the Data Mesh.
 * Each node would ideally have a more complex definition including its actual API endpoint,
 * authentication, and supported query capabilities. For this simulation, it's simplified.
 */
interface DataMeshNode {
  id: string;
  name: string;
  description: string;
  /** Mock function to simulate querying this node */
  query: (structuredQuery: any) => Promise<any[]>;
  /** Simplified schema description for AI to understand */
  schemaDescription: string;
}

/**
 * Structured query object that the AI will generate from natural language.
 * This represents a query targeting specific nodes with specific operations.
 */
interface StructuredDataMeshQuery {
  targetNodes: string[]; // IDs of the nodes to query
  queries: {
    [nodeId: string]: {
      operation: string; // e.g., "listTransactions", "getUsers"
      filters?: { [key: string]: any };
      limit?: number;
      offset?: number;
      // ... other specific query parameters for the node
    };
  };
  requiredTransformations?: string[]; // e.g., "join:transactions:users", "aggregate:totalAmount"
  outputFormat?: 'table' | 'json' | 'chart';
  summarizeResults?: boolean;
}

/**
 * Options for the DataMeshService query method.
 */
export interface DataMeshQueryOptions {
  limit?: number;
  offset?: number;
  summarize?: boolean; // Request AI summarization of results
  outputFormat?: 'table' | 'json' | 'chart'; // Desired output format
}

/**
 * The aggregated result from a Data Mesh query.
 */
export interface DataMeshQueryResult {
  rawResults: { [nodeId: string]: any[] };
  aggregatedData: any[]; // Combined and transformed data
  aiSummary?: string; // AI-generated summary of insights
  chartData?: any; // Structured data for charting, if outputFormat is 'chart'
  error?: string;
}

// ==============================================================================
// 2. Mock Data Mesh Nodes and Data
// ==============================================================================

// Mock Data - using actual graphql.ts types for consistency
const mockTransactions: Transaction[] = [
  { id: "txn1", type: TransactionType.EXPENSE, status: "POSTED", category: "Groceries", description: "Whole Foods", amount: 150.23, date: "2024-01-15", carbonFootprint: 2.5, merchant: { id: "m1", name: "Whole Foods" } },
  { id: "txn2", type: TransactionType.INCOME, status: "CLEARED", category: "Salary", description: "Employer", amount: 3500.00, date: "2024-01-20", merchant: { id: "m2", name: "Acme Corp" } },
  { id: "txn3", type: TransactionType.EXPENSE, status: "PENDING", category: "Dining", description: "Restaurant XYZ", amount: 75.50, date: "2024-01-22", carbonFootprint: 1.8, merchant: { id: "m3", name: "Restaurant XYZ" } },
  { id: "txn4", type: TransactionType.EXPENSE, status: "POSTED", category: "Utilities", description: "Electricity Bill", amount: 88.00, date: "2024-01-25", carbonFootprint: 0.9, merchant: { id: "m4", name: "PowerCo" } },
  { id: "txn5", type: TransactionType.INCOME, status: "POSTED", category: "Freelance", description: "Client Project", amount: 1200.00, date: "2024-01-28", merchant: { id: "m5", name: "Creative Solutions" } },
  { id: "txn6", type: TransactionType.EXPENSE, status: "POSTED", category: "Groceries", description: "Trader Joe's", amount: 90.10, date: "2024-02-01", carbonFootprint: 1.5, merchant: { id: "m6", name: "Trader Joe's" } },
  { id: "txn7", type: TransactionType.EXPENSE, status: "POSTED", category: "Dining", description: "Cafe Luna", amount: 30.00, date: "2024-02-03", carbonFootprint: 0.5, merchant: { id: "m7", name: "Cafe Luna" } },
];

const mockUsers: User[] = [
  { 
    id: "user1", 
    name: "Alice Smith", 
    email: "alice@example.com", 
    createdAt: "2023-01-01T10:00:00Z", 
    gamification: {level: 5, levelName: "Expert", progress: 80, score: 1200}, 
    rewardPoints: {balance: 500, lastEarned: 50}, 
    preferences: {theme: "dark", notifications: {email: true, push: true}} 
  },
  { 
    id: "user2", 
    name: "Bob Johnson", 
    email: "bob@example.com", 
    createdAt: "2023-03-15T14:30:00Z", 
    gamification: {level: 3, levelName: "Journeyman", progress: 40, score: 600}, 
    rewardPoints: {balance: 200, lastEarned: 20}, 
    preferences: {theme: "light", notifications: {email: false, push: true}} 
  },
];

const mockCorporateCards: CorporateCard[] = [
  { 
    id: "card1", 
    holderName: "Alice Smith", 
    cardNumberMask: "XXXX-XXXX-XXXX-1111", 
    status: "Active", 
    frozen: false, 
    balance: 250.00, 
    limit: 1000.00, 
    controls: {atm: true, contactless: true, online: true, monthlyLimit: 1000} 
  },
  { 
    id: "card2", 
    holderName: "Bob Johnson", 
    cardNumberMask: "XXXX-XXXX-XXXX-2222", 
    status: "Active", 
    frozen: false, 
    balance: 700.00, 
    limit: 1500.00, 
    controls: {atm: false, contactless: true, online: true, monthlyLimit: 1500} 
  },
];


const dataMeshNodes: { [key: string]: DataMeshNode } = {
  'transactions-node': {
    id: 'transactions-node',
    name: 'Transactions Data',
    description: 'Contains all financial transaction records.',
    schemaDescription: `
      Transactions: {
        id: string,
        type: "EXPENSE" | "INCOME",
        status: "PENDING" | "POSTED" | "CLEARED" | "FAILED",
        category: string,
        description: string,
        amount: float,
        date: string (YYYY-MM-DD),
        carbonFootprint: float (nullable),
        merchant: { id: string, name: string } (nullable)
      }
    `,
    query: async (structuredQuery: any) => {
      // Simulate filtering and pagination
      let results = [...mockTransactions];
      if (structuredQuery.filters) {
        for (const key in structuredQuery.filters) {
          results = results.filter(txn => {
            const filterValue = structuredQuery.filters[key];
            const transactionValue = txn[key as keyof Transaction];
            // Simple equality filter for now. Date range, amount range, etc. would be more complex.
            if (typeof transactionValue === 'string' && typeof filterValue === 'string') {
              return transactionValue.toLowerCase().includes(filterValue.toLowerCase());
            }
            return transactionValue === filterValue;
          });
        }
      }
      const limit = structuredQuery.limit || mockTransactions.length;
      const offset = structuredQuery.offset || 0;
      return results.slice(offset, offset + limit);
    },
  },
  'users-node': {
    id: 'users-node',
    name: 'User Profiles',
    description: 'Contains user demographic and preference data.',
    schemaDescription: `
      User: {
        id: string,
        name: string,
        email: string,
        createdAt: string (DateTime),
        gamification: { level: int, levelName: string, progress: int, score: int },
        rewardPoints: { balance: int, lastEarned: int },
        preferences: { theme: string, notifications: { email: boolean, push: boolean } }
      }
    `,
    query: async (structuredQuery: any) => {
      let results = [...mockUsers];
      if (structuredQuery.filters) {
        for (const key in structuredQuery.filters) {
          results = results.filter(user => {
            const filterValue = structuredQuery.filters[key];
            const userValue = user[key as keyof User];
            if (typeof userValue === 'string' && typeof filterValue === 'string') {
              return userValue.toLowerCase().includes(filterValue.toLowerCase());
            }
            return userValue === filterValue;
          });
        }
      }
      const limit = structuredQuery.limit || mockUsers.length;
      const offset = structuredQuery.offset || 0;
      return results.slice(offset, offset + limit);
    },
  },
  'corporate-cards-node': {
    id: 'corporate-cards-node',
    name: 'Corporate Cards',
    description: 'Contains corporate card details and controls.',
    schemaDescription: `
      CorporateCard: {
        id: string,
        holderName: string,
        cardNumberMask: string,
        status: string,
        frozen: boolean,
        balance: float,
        limit: float,
        controls: { atm: boolean, contactless: boolean, online: boolean, monthlyLimit: float }
      }
    `,
    query: async (structuredQuery: any) => {
      let results = [...mockCorporateCards];
      if (structuredQuery.filters) {
        for (const key in structuredQuery.filters) {
          results = results.filter(card => {
            const filterValue = structuredQuery.filters[key];
            const cardValue = card[key as keyof CorporateCard];
            if (typeof cardValue === 'string' && typeof filterValue === 'string') {
              return cardValue.toLowerCase().includes(filterValue.toLowerCase());
            }
            return cardValue === filterValue;
          });
        }
      }
      const limit = structuredQuery.limit || mockCorporateCards.length;
      const offset = structuredQuery.offset || 0;
      return results.slice(offset, offset + limit);
    },
  },
  // Add more nodes as the application grows, aligning with existing graphql.ts types or new ones
};

// ==============================================================================
// 3. DataMeshService Class
// ==============================================================================

class DataMeshService {
  private availableNodes: DataMeshNode[] = Object.values(dataMeshNodes);

  constructor() {
    console.log("DataMeshService initialized with nodes:", this.availableNodes.map(node => node.name));
  }

  /**
   * Generates a prompt for the Gemini AI to interpret a natural language query
   * and convert it into a structured query for the Data Mesh.
   */
  private generateAIQueryInterpretationPrompt(naturalLanguageQuery: string): { prompt: string; responseSchema: any } {
    const nodesSchema = this.availableNodes.map(node => ({
      id: node.id,
      name: node.name,
      description: node.description,
      schema: node.schemaDescription,
    }));

    const prompt = `
      You are the "Data Mesh Query Translator," an AI designed to interpret natural language queries
      into structured queries for a federated data mesh. Your goal is to identify relevant data nodes,
      determine the necessary operations (filtering, aggregation), and propose data transformations
      or joins if required.

      Available Data Nodes and their Schemas:
      ${JSON.stringify(nodesSchema, null, 2)}

      Based on the user's natural language query, generate a structured query object.
      If the query implies aggregation (e.g., "total", "average", "count"), identify the appropriate metric.
      If a transformation or join is needed to answer the query (e.g., combining user and transaction data),
      specify it in 'requiredTransformations'.
      If the user explicitly asks for a chart or table, set 'outputFormat'.

      Natural language query: "${naturalLanguageQuery}"

      Your structured query should follow this JSON schema:
    `;

    const responseSchema = {
      type: "object",
      properties: {
        targetNodes: {
          type: "array",
          description: "List of IDs of the data mesh nodes relevant to the query.",
          items: { type: "string", enum: this.availableNodes.map(node => node.id) }
        },
        queries: {
          type: "object",
          description: "An object where keys are node IDs and values are structured queries for that specific node.",
          patternProperties: {
            "^[a-zA-Z0-9-]+$": { // Allow any node ID
              type: "object",
              properties: {
                operation: { type: "string", description: "The specific operation to perform on the node (e.g., 'list', 'get', 'aggregate')." },
                filters: { type: "object", description: "Key-value pairs for filtering data on this node. Map natural language filters to schema fields, e.g., 'name' for user, 'category' for transaction. Ensure filter keys match schema fields precisely." },
                limit: { type: "integer", description: "Optional limit for results from this node." },
                offset: { type: "integer", description: "Optional offset for results from this node." },
                // Add more properties for specific node operations (e.g., 'aggregationField', 'groupByField')
              },
              required: ["operation"]
            }
          },
          additionalProperties: false
        },
        requiredTransformations: {
          type: "array",
          description: "List of high-level transformations or joins needed across node results (e.g., 'join:users-node:transactions-node', 'aggregate:total_spending_per_user', 'aggregate:total_spending_per_category').",
          items: { type: "string" }
        },
        outputFormat: {
          type: "string",
          description: "Preferred output format if specified in the query.",
          enum: ["table", "json", "chart"]
        },
        summarizeResults: {
          type: "boolean",
          description: "True if the user explicitly asked for a summary or insights.",
          default: false
        }
      },
      required: ["targetNodes", "queries"],
      additionalProperties: false
    };

    return { prompt, responseSchema };
  }

  /**
   * Generates a prompt for the Gemini AI to summarize raw data results.
   */
  private generateAISummaryPrompt(query: string, rawResults: any[]): { prompt: string; responseSchema: any } {
    const prompt = `
      You are the "Data Mesh Insight Generator," an AI designed to summarize and extract key insights
      from raw data retrieved from a federated data mesh.

      User's original query: "${query}"

      Raw data results (JSON):
      ${JSON.stringify(rawResults, null, 2)}

      Please provide a concise, insightful summary of the key findings from this data.
      Highlight any notable patterns, trends, or anomalies. Structure your response as a plain string.
    `;
    const responseSchema = {
      type: "string",
      description: "A concise, insightful summary of the data results."
    };
    return { prompt, responseSchema };
  }

  /**
   * Executes a federated query across the Data Mesh.
   * @param naturalLanguageQuery The natural language query from the user.
   * @param options Additional query options.
   * @returns A promise resolving to the aggregated query results.
   */
  public async queryDataMesh(
    naturalLanguageQuery: string,
    options?: DataMeshQueryOptions
  ): Promise<DataMeshQueryResult> {
    try {
      // 1. AI: Interpret Natural Language Query into Structured Query
      console.log("[DataMeshService] Step 1 - Interpreting natural language query with AI...");
      const { prompt: nlToStructPrompt, responseSchema: nlToStructSchema } = this.generateAIQueryInterpretationPrompt(naturalLanguageQuery);
      
      const aiResponseContent = await generateContent({
        prompt: nlToStructPrompt,
        responseSchema: nlToStructSchema,
        temperature: 0, // Ensure deterministic output for structured queries
      });

      let structuredQuery: StructuredDataMeshQuery;
      try {
        structuredQuery = JSON.parse(aiResponseContent);
      } catch (e) {
        console.error("[DataMeshService] Failed to parse AI response as JSON:", aiResponseContent);
        throw new Error("AI returned an unparseable response for structured query.");
      }
      
      console.log("[DataMeshService] Step 1 Complete - Structured Query:", structuredQuery);

      if (!structuredQuery || !structuredQuery.targetNodes || structuredQuery.targetNodes.length === 0) {
        throw new Error("AI could not identify relevant data nodes or structured queries from your input.");
      }

      const rawResults: { [nodeId: string]: any[] } = {};
      let aggregatedData: any[] = [];

      // 2. Federated Execution: Query identified data nodes concurrently
      console.log("[DataMeshService] Step 2 - Executing federated queries...");
      const queryPromises = structuredQuery.targetNodes.map(async nodeId => {
        const node = dataMeshNodes[nodeId];
        if (!node) {
          console.warn(`[DataMeshService] Data Mesh Node '${nodeId}' not found. Skipping.`);
          return;
        }
        const nodeQuery = structuredQuery.queries[nodeId];
        if (!nodeQuery) {
          console.warn(`[DataMeshService] No specific query defined for node '${nodeId}'. Skipping.`);
          return;
        }
        console.log(`[DataMeshService] Querying node '${node.name}' with operation '${nodeQuery.operation}'...`);
        // In a real scenario, this would call actual node APIs
        const nodeResults = await node.query(nodeQuery);
        rawResults[nodeId] = nodeResults;
        // Tag source node for potential later reference or AI analysis
        aggregatedData = aggregatedData.concat(nodeResults.map(item => ({ ...item, _sourceNode: nodeId }))); 
      });

      await Promise.all(queryPromises);
      console.log("[DataMeshService] Step 2 Complete - Raw Results:", rawResults);

      // 3. (Simulated) Transformations & Aggregations
      console.log("[DataMeshService] Step 3 - Applying transformations and aggregations (simulated)...");
      if (structuredQuery.requiredTransformations && structuredQuery.requiredTransformations.length > 0) {
        console.log("[DataMeshService] Applying specific transformations:", structuredQuery.requiredTransformations);
        // Example: simple join if AI suggests it (e.g., joining transactions with user info if merchant name matches user name)
        if (structuredQuery.requiredTransformations.includes('join:users-node:transactions-node') && rawResults['users-node'] && rawResults['transactions-node']) {
            const usersMap = new Map(rawResults['users-node']?.map((u: User) => [u.name.toLowerCase(), u]));
            aggregatedData = rawResults['transactions-node'].map((txn: Transaction) => {
                const holderName = mockCorporateCards.find(card => card.id === txn.id)?.holderName; // Heuristic for transaction-card-user link
                const associatedUser = usersMap.get((txn.merchant?.name || holderName || '').toLowerCase()); 
                if (associatedUser) {
                    return { ...txn, user: { id: associatedUser.id, name: associatedUser.name, email: associatedUser.email } };
                }
                return txn;
            });
        }
        // Example: simple aggregation for total spending by category
        if (structuredQuery.requiredTransformations.includes('aggregate:total_spending_per_category')) {
          const categorySpending: { [key: string]: number } = {};
          (aggregatedData as Transaction[]).filter(item => item.type === TransactionType.EXPENSE).forEach(txn => {
              categorySpending[txn.category] = (categorySpending[txn.category] || 0) + txn.amount;
          });
          aggregatedData = Object.entries(categorySpending).map(([category, total]) => ({ category, totalSpending: total }));
        }
      }

      console.log("[DataMeshService] Step 3 Complete - Aggregated Data:", aggregatedData);

      // 4. AI: Summarize Results if requested
      let aiSummary: string | undefined;
      const shouldSummarize = options?.summarize || structuredQuery.summarizeResults;

      if (shouldSummarize && aggregatedData.length > 0) {
        console.log("[DataMeshService] Step 4 - Generating AI summary of results...");
        const { prompt: summaryPrompt, responseSchema: summarySchema } = this.generateAISummaryPrompt(naturalLanguageQuery, aggregatedData);
        aiSummary = await generateContent({
          prompt: summaryPrompt,
          responseSchema: summarySchema,
          temperature: 0.2, // Allow some creativity in summary
        });
        console.log("[DataMeshService] Step 4 Complete - AI Summary generated.");
      }

      // 5. (Simulated) Chart Data Generation (Basic)
      let chartData: any | undefined;
      if ((options?.outputFormat === 'chart' || structuredQuery.outputFormat === 'chart') && aggregatedData.length > 0) {
        // For demo, generate a basic bar chart if data looks like category spending
        if (aggregatedData[0] && aggregatedData[0].category && typeof aggregatedData[0].totalSpending === 'number') {
          chartData = {
            type: 'bar',
            labels: aggregatedData.map(d => d.category),
            datasets: [{
              label: 'Total Spending by Category',
              data: aggregatedData.map(d => d.totalSpending),
              backgroundColor: ['#4ade80', '#facc15', '#fb923c', '#ef4444', '#60a5fa'], // Example Tailwind colors
            }]
          };
        } else if (aggregatedData[0] && aggregatedData[0].date && typeof aggregatedData[0].amount === 'number') {
          // Example: line chart for transactions over time
          const sortedData = [...(aggregatedData as Transaction[])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          chartData = {
            type: 'line',
            labels: sortedData.map(d => d.date),
            datasets: [{
              label: 'Transaction Amount',
              data: sortedData.map(d => d.amount),
              borderColor: '#60a5fa',
              fill: false,
            }]
          };
        }
      }


      return {
        rawResults,
        aggregatedData,
        aiSummary,
        chartData,
      };

    } catch (error: any) {
      console.error("[DataMeshService] Error:", error);
      return {
        rawResults: {},
        aggregatedData: [],
        error: `Failed to query Data Mesh: ${error.message || 'Unknown error.'}`,
      };
    }
  }

  /**
   * Provides information about the available data nodes in the mesh.
   * This could be used by a UI to dynamically inform the user or by another AI agent.
   */
  public getAvailableNodesInfo() {
    return this.availableNodes.map(node => ({
      id: node.id,
      name: node.name,
      description: node.description,
      schemaSnippet: node.schemaDescription.split('\n').slice(0, 5).join('\n') + '...', // Just first few lines
    }));
  }
}

export const dataMeshService = new DataMeshService();