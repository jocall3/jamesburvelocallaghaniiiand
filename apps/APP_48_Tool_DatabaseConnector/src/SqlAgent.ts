/*
 * Copyright (c) 2024. The Bifrost Platform Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
    CoreServices,
    Logger,
    ModelRouter,
    EventBus,
    BifrostEvent,
    ModelProvider,
    AIModel,
} from '@bifrost/core-sdk';
import { DatabaseManager, ConnectionDetails } from './DatabaseManager';
import {
    SqlAgentConfig,
    QueryGenerationRequest,
    QueryExecutionRequest,
    SqlAgentResult,
    QueryAnalysis,
    SqlDialect,
    SafetyLevel,
    AgentMetadata,
} from './types';

/**
 * Represents a potential risk identified during query analysis.
 */
interface IdentifiedRisk {
    level: 'high' | 'medium' | 'low';
    description: string;
    mitigation: string;
}

/**
 * The core tension of this agent is Speed vs. Safety.
 *
 * - Speed: Users want immediate answers from their data. This pushes for direct execution
 *   of generated SQL.
 * - Safety: Executing arbitrary, AI-generated SQL against a production database is
 *   inherently risky. This pushes for multiple layers of validation, sanitization,
 *   and restrictive permissions, all of which add latency and complexity.
 *
 * This tension is architecturally manifested in:
 * 1. The `safetyLevel` configuration, which directly trades off validation depth for speed.
 * 2. The multi-step `processNaturalLanguageQuery` flow (generate -> analyze -> validate -> execute).
 * 3. The explicit separation of query generation from execution, allowing for human-in-the-loop validation.
 * 4. The strict enforcement of read-only operations unless explicitly overridden.
 */
export class SqlAgent {
    private readonly config: SqlAgentConfig;
    private readonly logger: Logger;
    private readonly modelRouter: ModelRouter;
    private readonly dbManager: DatabaseManager;
    private readonly eventBus: EventBus;

    // Regex to detect potentially destructive or data-modifying keywords.
    // This is a first-line defense; a full SQL parser would be the enterprise-grade solution.
    private static readonly WRITE_OPERATIONS_REGEX = /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE)\b/i;
    private static readonly SELECT_REGEX = /\b(SELECT)\b/i;
    private static readonly TABLE_ACCESS_REGEX = /\b(?:FROM|JOIN|UPDATE|INTO)\s+([a-zA-Z0-9_."]+)/gi;

    constructor(
        config: SqlAgentConfig,
        dbManager: DatabaseManager,
        coreServices: CoreServices,
    ) {
        this.config = config;
        this.dbManager = dbManager;
        this.logger = coreServices.getLogger('APP_48_SqlAgent');
        this.modelRouter = coreServices.getModelRouter();
        this.eventBus = coreServices.getEventBus();

        this.logger.info('SqlAgent initialized', {
            safetyLevel: this.config.safetyLevel,
            allowWrites: this.config.allowWrites,
        });
    }

    /**
     * The primary entry point for converting a natural language question into a database result.
     * This method orchestrates the entire generate -> analyze -> execute pipeline.
     * @param nlQueryRequest - The natural language query and its context.
     * @param connectionId - The ID of the database connection to use.
     * @returns A promise that resolves to the complete result, including SQL, data, and analysis.
     */
    public async processNaturalLanguageQuery(
        nlQueryRequest: QueryGenerationRequest,
        connectionId: string,
    ): Promise<SqlAgentResult> {
        const startTime = Date.now();
        this.logger.info('Starting natural language query processing', {
            query: nlQueryRequest.naturalLanguageQuery,
            connectionId,
        });

        try {
            // Step 1: Generate SQL from natural language using an LLM
            const generatedSql = await this.generateSql(nlQueryRequest);
            if (!generatedSql) {
                throw new Error('LLM failed to generate a valid SQL query.');
            }

            // Step 2: Analyze the generated SQL for safety and intent
            const analysis = this.analyzeQuery(generatedSql, nlQueryRequest.dialect);

            // Step 3: Validate the query against the agent's safety configuration
            this.validateQuerySafety(analysis);

            // Step 4: Execute the validated query
            const executionRequest: QueryExecutionRequest = {
                sqlQuery: generatedSql,
                connectionId: connectionId,
                parameters: nlQueryRequest.parameters,
            };
            const { results, rowCount, executionTimeMs } = await this.executeSql(executionRequest);

            const totalTimeMs = Date.now() - startTime;
            const finalResult: SqlAgentResult = {
                generatedSql,
                executionResult: results,
                rowCount,
                executionTimeMs,
                totalTimeMs,
                queryAnalysis: analysis,
                warnings: analysis.potentialRisks.map(r => r.description),
            };

            this.publishAuditEvent('nl_query_success', finalResult, nlQueryRequest.userId);
            return finalResult;

        } catch (error: any) {
            this.logger.error('Error processing natural language query', { error: error.message, stack: error.stack });
            this.publishAuditEvent('nl_query_failure', { error: error.message }, nlQueryRequest.userId);
            throw error; // Re-throw for the caller to handle
        }
    }

    /**
     * Generates an SQL query from a natural language prompt and schema context.
     * @param request - The query generation request details.
     * @returns The generated SQL string.
     */
    public async generateSql(request: QueryGenerationRequest): Promise<string> {
        const prompt = this.constructSqlGenerationPrompt(request);

        const modelRequest = {
            provider: request.modelProvider || this.config.defaultModelProvider,
            model: request.model || this.config.defaultModel,
            prompt,
            temperature: 0.1,
            max_tokens: 1024,
            stop_sequences: ['-- End of Query', ';'],
        };

        this.logger.debug('Sending request to model router for SQL generation', { model: modelRequest.model });
        const response = await this.modelRouter.generate(modelRequest as any); // Cast to handle provider variations

        return this.extractSqlFromResponse(response.content);
    }

    /**
     * Analyzes a given SQL query string to assess its characteristics and potential risks.
     * This is a critical step in the Speed vs. Safety tradeoff.
     * @param sql - The SQL query to analyze.
     * @param dialect - The SQL dialect, for context.
     * @returns A detailed analysis of the query.
     */
    public analyzeQuery(sql: string, dialect: SqlDialect): QueryAnalysis {
        const isWriteOperation = SqlAgent.WRITE_OPERATIONS_REGEX.test(sql);
        const isReadOperation = SqlAgent.SELECT_REGEX.test(sql);

        const tablesAccessed = [...new Set(
            Array.from(sql.matchAll(SqlAgent.TABLE_ACCESS_REGEX), m => m[1].replace(/["`]/g, ''))
        )];

        const potentialRisks: IdentifiedRisk[] = [];

        if (isWriteOperation) {
            potentialRisks.push({
                level: 'high',
                description: 'Query contains data modification keywords (e.g., UPDATE, DELETE, DROP).',
                mitigation: 'Ensure write operations are disabled or require explicit approval.',
            });
        }

        if (!sql.toLowerCase().includes('where') && (isWriteOperation || (isReadOperation && this.config.safetyLevel === 'strict'))) {
            potentialRisks.push({
                level: 'medium',
                description: 'Query lacks a WHERE clause, which could lead to full table scans or unintended mass updates/deletes.',
                mitigation: 'Add a specific WHERE clause or set a LIMIT.',
            });
        }

        if (!sql.toLowerCase().includes('limit') && isReadOperation && this.config.safetyLevel !== 'permissive') {
             potentialRisks.push({
                level: 'low',
                description: 'Query lacks a LIMIT clause, which could return a very large result set.',
                mitigation: `A default limit of ${this.config.maxResultRows} will be applied at execution time.`,
            });
        }

        return {
            isReadOnly: !isWriteOperation && isReadOperation,
            tablesAccessed,
            potentialRisks,
            estimatedCostUnits: 1 + tablesAccessed.length, // Simplistic cost model
        };
    }

    /**
     * Executes a pre-validated SQL query against a specified database connection.
     * @param request - The execution request details.
     * @returns The query results and performance metrics.
     */
    public async executeSql(request: QueryExecutionRequest): Promise<{ results: any[]; rowCount: number; executionTimeMs: number }> {
        const { connectionId, sqlQuery, parameters } = request;

        // Pre-execution hook
        this.eventBus.publish('bifrost.tool.db_connector.query.pre-execution', {
            connectionId,
            query: sqlQuery.substring(0, 256), // Log a snippet
        });

        // Add a LIMIT clause if one doesn't exist, to prevent excessive data return (Safety > Speed)
        let finalQuery = sqlQuery.trim();
        if (SqlAgent.SELECT_REGEX.test(finalQuery) && !/\bLIMIT\b/i.test(finalQuery)) {
            finalQuery = `${finalQuery.replace(/;$/, '')} LIMIT ${this.config.maxResultRows};`;
            this.logger.warn(`No LIMIT clause found. Applying default limit of ${this.config.maxResultRows}.`, { connectionId });
        }

        const result = await this.dbManager.executeQuery(
            connectionId,
            finalQuery,
            parameters,
            this.config.queryTimeoutMs
        );

        // Post-execution hook
        this.eventBus.publish('bifrost.tool.db_connector.query.post-execution', {
            connectionId,
            rowCount: result.rowCount,
            executionTimeMs: result.executionTimeMs,
        });

        return result;
    }

    /**
     * Constructs the detailed prompt for the LLM to generate SQL.
     * Includes schema, dialect, constraints, and the user's question.
     */
    private constructSqlGenerationPrompt(request: QueryGenerationRequest): string {
        const { naturalLanguageQuery, databaseSchema, dialect, instructions } = request;
        const readOnlyInstruction = this.config.allowWrites
            ? 'You are allowed to generate INSERT, UPDATE, and DELETE statements if the user query explicitly asks for it.'
            : 'You MUST ONLY generate read-only SELECT statements. Any other type of query is strictly forbidden.';

        return `
You are an expert ${dialect} SQL writer AI. Your task is to convert a natural language question into a valid, efficient, and secure SQL query.

### Database Schema
Here is the schema of the database you are querying:
\`\`\`sql
${databaseSchema}
\`\`\`

### Rules & Constraints
1.  Your response must contain ONLY the SQL query. Do not include any explanations, greetings, or markdown formatting like \`\`\`sql.
2.  The generated SQL must be compatible with the ${dialect} dialect.
3.  ${readOnlyInstruction}
4.  Always use parameterized queries if values are provided. For this task, you will be given placeholders if needed.
5.  Pay close attention to table and column names from the schema. Do not hallucinate names.
6.  If the question is ambiguous or cannot be answered with the given schema, return a single line comment starting with '--' explaining the issue. Example: -- Error: The 'products' table does not contain pricing information.
${instructions ? `\n### Additional Instructions\n${instructions}` : ''}

### User's Question
"${naturalLanguageQuery}"

### Generated SQL Query:
`;
    }

    /**
     * Extracts and cleans the SQL query from the raw LLM response.
     */
    private extractSqlFromResponse(responseText: string): string {
        const cleanedText = responseText.trim();
        const sqlBlockMatch = cleanedText.match(/```(?:sql)?\s*([\s\S]+?)\s*```/);
        if (sqlBlockMatch && sqlBlockMatch[1]) {
            return sqlBlockMatch[1].trim();
        }
        return cleanedText.replace(/;$/, '').trim();
    }

    /**
     * Enforces the agent's safety policies based on the query analysis.
     * Throws an error if a policy is violated.
     */
    private validateQuerySafety(analysis: QueryAnalysis): void {
        if (!this.config.allowWrites && !analysis.isReadOnly) {
            this.logger.error('Safety Violation: A write operation was attempted while allowWrites is false.', { analysis });
            throw new Error('Query blocked: The generated query attempts to modify data, but write operations are disabled for this agent.');
        }

        if (this.config.safetyLevel === 'strict' && analysis.potentialRisks.some(r => r.level === 'high' || r.level === 'medium')) {
             this.logger.error('Safety Violation: Query failed strict validation checks.', { risks: analysis.potentialRisks });
             throw new Error(`Query blocked: Strict safety policy violation. Risks found: ${analysis.potentialRisks.map(r => r.description).join(', ')}`);
        }
    }

    private publishAuditEvent(
        eventName: string,
        payload: Record<string, any>,
        userId?: string
    ): void {
        const event: BifrostEvent = {
            source: 'APP_48_Tool_DatabaseConnector',
            type: `audit.sql_agent.${eventName}`,
            timestamp: new Date().toISOString(),
            payload: {
                ...payload,
                agentId: 'SqlAgent',
                userId: userId || 'system',
                config: {
                    safetyLevel: this.config.safetyLevel,
                    allowWrites: this.config.allowWrites,
                },
            },
        };
        this.eventBus.publish(event.type, event);
    }

    // --- Self-Querying Agent Interface ---

    public getIntrospection(): Record<string, any> {
        return {
            component: 'SqlAgent',
            version: '1.0.0',
            config: this.config,
            state: {
                activeConnections: this.dbManager.getActiveConnectionCount(),
            },
            capabilities: [
                'Natural Language to SQL Translation',
                'Multi-Dialect SQL Execution',
                'Configurable Safety Policies (Read-Only, Strict Validation)',
                'Query Analysis (Read/Write, Table Access)',
            ],
        };
    }

    public getAssumptions(): Record<string, string[]> {
        return {
            'core-sdk': [
                'ModelRouter provides access to text-generation LLMs capable of writing SQL.',
                'EventBus is available for publishing audit and operational events.',
                'Logger provides structured logging.',
            ],
            'database-manager': [
                'DatabaseManager handles connection pooling and secure credential management.',
                'DatabaseManager can execute queries against configured connections and return structured results.',
            ],
            'llm-provider': [
                'The configured LLM understands SQL syntax and can follow instructions regarding schema and dialect.',
                'The LLM response format is predictable enough for `extractSqlFromResponse` to work reliably.',
            ],
            'operational': [
                'Network connectivity to both AI model endpoints and target databases is stable.',
                'The provided database schemas are accurate and up-to-date.',
            ],
        };
    }

    public static getAgentMetadata(): AgentMetadata {
        return {
            purpose: 'Translates natural language queries into safe, executable SQL for various database dialects, acting as a secure data access tool for other agents.',
            dependencies: [
                '@bifrost/core-sdk',
                'DatabaseManager (local module)',
                'AI Model Providers (via ModelRouter, e.g., OpenAI, Anthropic, Cohere)',
            ],
            invalidation_conditions: [
                'Major breaking changes in the Core SDK ModelRouter API.',
                'Deprecation of the configured default LLM.',
                'Fundamental changes to SQL syntax that invalidate the analysis regex.',
            ],
            adjacent_apps: [
                'APP_14_Agents_MultiModelOrchestrator (as a tool consumer)',
                'APP_37_Governance_AuditTrailEngine (as an event producer)',
                'APP_58_Narrative_ModelExplainabilityUI (to visualize query generation process)',
            ],
        };
    }
}