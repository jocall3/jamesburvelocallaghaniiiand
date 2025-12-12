import { EventEmitter } from 'events';

/**
 * Represents the status of a workflow or a specific step.
 */
export enum ExecutionStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED',
    CANCELLED = 'CANCELLED',
}

/**
 * Configuration for retrying failed steps.
 */
export interface RetryPolicy {
    maxAttempts: number;
    backoffMultiplier: number;
    initialIntervalMs: number;
}

/**
 * Defines a single step within a workflow.
 */
export interface WorkflowStep {
    id: string;
    operationId: string; // Links to OpenAPI Operation ID
    description?: string;
    dependsOn?: string[]; // IDs of steps that must complete before this one
    inputs: Record<string, any>; // Inputs for the operation, supports expressions
    preScript?: string; // JavaScript code to run before the operation
    postScript?: string; // JavaScript code to run after the operation
    retryPolicy?: RetryPolicy;
    condition?: string; // Expression that must evaluate to true to run this step
}

/**
 * Defines the structure of a workflow.
 */
export interface WorkflowDefinition {
    id: string;
    title: string;
    version: string;
    description?: string;
    variables?: Record<string, any>; // Global variables
    steps: WorkflowStep[];
}

/**
 * The runtime context passed between steps.
 */
export interface WorkflowContext {
    workflowId: string;
    executionId: string;
    status: ExecutionStatus;
    variables: Record<string, any>;
    steps: Record<string, StepResult>;
    auth: {
        accessToken?: string;
        provider?: string; // e.g., 'google'
        user?: any;
    };
    integrations: {
        googleDrive?: any;
        github?: any;
        [key: string]: any;
    };
    telemetry: TelemetryData[];
    auditLog: AuditLogEntry[];
    riskAssessment: RiskAssessmentData;
    governancePolicies: GovernancePolicy[];
}

/**
 * The result of a single step execution.
 */
export interface StepResult {
    id: string;
    status: ExecutionStatus;
    startTime: Date;
    endTime?: Date;
    output?: any;
    error?: Error;
    attempts: number;
}

/**
 * Interface for the external service that executes the actual API calls.
 */
export interface IOperationExecutor {
    executeOperation(operationId: string, inputs: any, auth: any): Promise<any>;
}

/**
 * Interface for script execution (sandbox).
 */
export interface IScriptExecutor {
    execute(script: string, context: any): Promise<any>;
}

// --- Additional Interfaces and Types ---

/**
 * Telemetry data structure.
 */
export interface TelemetryData {
    timestamp: Date;
    event: string;
    data: Record<string, any>;
}

/**
 * Audit log entry structure.
 */
export interface AuditLogEntry {
    timestamp: Date;
    user: string;
    action: string;
    details: Record<string, any>;
}

/**
 * Risk assessment data structure.
 */
export interface RiskAssessmentData {
    overallRiskScore: number;
    materialRisks: string[];
    liquidityRatio: number;
}

/**
 * Governance policy structure.
 */
export interface GovernancePolicy {
    policyId: string;
    description: string;
    isActive: boolean;
    lastUpdated: Date;
}

/**
 * Configuration settings for the application.
 */
export interface AppConfig {
    appName: string;
    version: string;
    environment: string;
    apiKeys: Record<string, string>;
}

/**
 * User profile information.
 */
export interface UserProfile {
    userId: string;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
}

/**
 * Financial statement data structure.
 */
export interface FinancialStatement {
    period: string;
    revenue: number;
    expenses: number;
    netIncome: number;
}

/**
 * Market analysis data structure.
 */
export interface MarketAnalysis {
    marketSize: number;
    growthRate: number;
    trends: string[];
}

/**
 * Customer persona data structure.
 */
export interface CustomerPersona {
    personaId: string;
    name: string;
    age: number;
    occupation: string;
    needs: string[];
}

/**
 * Product roadmap data structure.
 */
export interface ProductRoadmap {
    version: string;
    releaseDate: Date;
    features: string[];
}

/**
 * Pricing strategy data structure.
 */
export interface PricingStrategy {
    model: string;
    price: number;
    features: string[];
}

/**
 * Partnership agreement data structure.
 */
export interface PartnershipAgreement {
    partnerId: string;
    terms: string;
    startDate: Date;
    endDate: Date;
}

/**
 * Valuation metrics data structure.
 */
export interface ValuationMetrics {
    marketCap: number;
    revenueMultiple: number;
    ebitdaMultiple: number;
}

/**
 * Stress test scenario data structure.
 */
export interface StressTestScenario {
    scenarioId: string;
    description: string;
    assumptions: Record<string, any>;
    impact: Record<string, any>;
}

/**
 * Capital plan data structure.
 */
export interface CapitalPlan {
    period: string;
    capitalExpenditures: number;
    fundingSources: string[];
}

/**
 * Sustainability metrics data structure.
 */
export interface SustainabilityMetrics {
    carbonFootprint: number;
    waterUsage: number;
    wasteGeneration: number;
}

/**
 * Workforce plan data structure.
 */
export interface WorkforcePlan {
    department: string;
    headcount: number;
    skills: string[];
}

/**
 * Org structure data structure.
 */
export interface OrgStructure {
    department: string;
    roles: string[];
    reportingLines: string[];
}

// --- Data Generation Functions ---

/**
 * Generates a random UUID.
 */
function generateUUID(): string {
    return crypto.randomUUID();
}

/**
 * Generates a random number within a range.
 */
function randomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Generates a random date within a range.
 */
function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generates a random string.
 */
function randomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Generates a random boolean.
 */
function randomBoolean(): boolean {
    return Math.random() < 0.5;
}

/**
 * Generates a random email address.
 */
function randomEmail(): string {
    return `${randomString(10)}@${randomString(5)}.${randomString(3)}`;
}

/**
 * Generates a random phone number.
 */
function randomPhoneNumber(): string {
    return `+1-${randomNumber(200, 999).toFixed(0)}-${randomNumber(200, 999).toFixed(0)}-${randomNumber(1000, 9999).toFixed(0)}`;
}

/**
 * Generates a random name.
 */
function randomName(): string {
    const firstNames = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Mallory', 'Trent'];
    const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Wilson', 'Garcia'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

// --- Citibankdemobusinessinc Business Models ---

namespace Citibankdemobusinessinc {

    export interface IBaseApp {
        run(): Promise<void>;
        getConfig(): AppConfig;
    }

    /**
     * Citibankdemobusinessinc.openbanking.accountaggregator
     * Mission: To aggregate user financial accounts into a unified view, providing insights and personalized recommendations.
     * Monetization: Premium subscriptions for advanced analytics and personalized financial advice.
     * IP Moat: Proprietary algorithms for data aggregation and personalized insights.
     */
    export namespace openbanking {
        export class AccountAggregator implements IBaseApp {
            private config: AppConfig;

            constructor() {
                this.config = {
                    appName: 'AccountAggregator',
                    version: '1.0.0',
                    environment: 'production',
                    apiKeys: {
                        plaid: generateUUID(),
                        finicity: generateUUID()
                    }
                };
            }

            async run(): Promise<void> {
                console.log(`${this.config.appName} is running...`);
                // Simulate account aggregation
                const numAccounts = randomNumber(1, 10).toFixed(0);
                console.log(`Aggregating ${numAccounts} accounts...`);
                // Simulate personalized recommendations
                const recommendation = `Consider consolidating debt to save ${randomNumber(50, 500).toFixed(0)} USD per month.`;
                console.log(`Recommendation: ${recommendation}`);
            }

            getConfig(): AppConfig {
                return this.config;
            }
        }

        /**
         * Citibankdemobusinessinc.openbanking.paymentgateway
         * Mission: To provide a secure and seamless payment gateway for open banking transactions.
         * Monetization: Transaction fees and premium features for merchants.
         * IP Moat: Advanced security protocols and fraud detection algorithms.
         */
        export class PaymentGateway implements IBaseApp {
            private config: AppConfig;

            constructor() {
                this.config = {
                    appName: 'PaymentGateway',
                    version: '1.0.0',
                    environment: 'production',
                    apiKeys: {
                        stripe: generateUUID(),
                        paypal: generateUUID()
                    }
                };
            }

            async run(): Promise<void> {
                console.log(`${this.config.appName} is running...`);
                // Simulate payment processing
                const transactionId = generateUUID();
                const amount = randomNumber(10, 1000).toFixed(2);
                console.log(`Processing payment of ${amount} USD with transaction ID: ${transactionId}`);
                // Simulate fraud detection
                if (randomBoolean()) {
                    console.log('Fraud detected! Transaction flagged.');
                } else {
                    console.log('Transaction successful.');
                }
            }

            getConfig(): AppConfig {
                return this.config;
            }
        }
    }

    /**
     * Citibankdemobusinessinc.lending.autoloanplatform
     * Mission: To provide an automated platform for auto loan applications and approvals.
     * Monetization: Interest on loans and fees for additional services.
     * IP Moat: Proprietary credit scoring algorithms and automated approval processes.
     */
    export namespace lending {
        export class AutoLoanPlatform implements IBaseApp {
            private config: AppConfig;

            constructor() {
                this.config = {
                    appName: 'AutoLoanPlatform',
                    version: '1.0.0',
                    environment: 'production',
                    apiKeys: {
                        experian: generateUUID(),
                        transunion: generateUUID()
                    }
                };
            }

            async run(): Promise<void> {
                console.log(`${this.config.appName} is running...`);
                // Simulate loan application
                const loanAmount = randomNumber(5000, 50000).toFixed(0);
                console.log(`Processing auto loan application for ${loanAmount} USD...`);
                // Simulate credit scoring
                const creditScore = randomNumber(300, 850).toFixed(0);
                console.log(`Credit score: ${creditScore}`);
                // Simulate loan approval
                if (creditScore > 650) {
                    console.log('Loan approved!');
                } else {
                    console.log('Loan denied.');
                }
            }

            getConfig(): AppConfig {
                return this.config;
            }
        }

        /**
         * Citibankdemobusinessinc.lending.mortgageplatform
         * Mission: To streamline the mortgage application process with automated tools and personalized advice.
         * Monetization: Mortgage origination fees and refinancing services.
         * IP Moat: Advanced property valuation models and risk assessment algorithms.
         */
        export class MortgagePlatform implements IBaseApp {
            private config: AppConfig;

            constructor() {
                this.config = {
                    appName: 'MortgagePlatform',
                    version: '1.0.0',
                    environment: 'production',
                    apiKeys: {
                        zillow: generateUUID(),
                        redfin: generateUUID()
                    }
                };
            }

            async run(): Promise<void> {
                console.log(`${this.config.appName} is running...`);
                // Simulate mortgage application
                const propertyValue = randomNumber(100000, 1000000).toFixed(0);
                console.log(`Processing mortgage application for property valued at ${propertyValue} USD...`);
                // Simulate property valuation
                const appraisedValue = randomNumber(propertyValue * 0.9, propertyValue * 1.1).toFixed(0);
                console.log(`Appraised value: ${appraisedValue} USD`);
                // Simulate loan approval
                if (appraisedValue > propertyValue * 0.8) {
                    console.log('Mortgage approved!');
                } else {
                    console.log('Mortgage denied.');
                }
            }

            getConfig(): AppConfig {
                return this.config;
            }
        }
    }

    /**
     * Citibankdemobusinessinc.investment.roboadvisor
     * Mission: To provide automated investment advice and portfolio management services.
     * Monetization: Management fees based on assets under management.
     * IP Moat: Proprietary algorithms for portfolio optimization and risk management.
     */
    export namespace investment {
        export class RoboAdvisor implements IBaseApp {
            private config: AppConfig;

            constructor() {
                this.config = {
                    appName: 'RoboAdvisor',
                    version: '1.0.0',
                    environment: 'production',
                    apiKeys: {
                        alphaVantage: generateUUID(),
                        finnhub: generateUUID()
                    }
                };
            }

            async run(): Promise<void> {
                console.log(`${this.config.appName} is running...`);
                // Simulate portfolio allocation
                const riskTolerance = randomNumber(1, 10).toFixed(0);
                console.log(`Allocating portfolio based on risk tolerance: ${riskTolerance}`);
                // Simulate portfolio performance
                const portfolioReturn = randomNumber(-0.05, 0.15).toFixed(2);
                console.log(`Portfolio return: ${portfolioReturn}%`);
            }

            getConfig(): AppConfig {
                return this.config;
            }
        }

        /**
         * Citibankdemobusinessinc.investment.tradingplatform
         * Mission: To offer a user-friendly platform for trading stocks, options, and other financial instruments.
         * Monetization: Commission fees and premium subscription services.
         * IP Moat: High-performance trading engine and advanced charting tools.
         */
        export class TradingPlatform implements IBaseApp {
            private config: AppConfig;

            constructor() {
                this.config = {
                    appName: 'TradingPlatform',
                    version: '1.0.0',
                    environment: 'production',
                    apiKeys: {
                        iexCloud: generateUUID(),
                        polygon: generateUUID()
                    }
                };
            }

            async run(): Promise<void> {
                console.log(`${this.config.appName} is running...`);
                // Simulate trade execution
                const ticker = randomString(3).toUpperCase();
                const quantity = randomNumber(1, 100).toFixed(0);
                const price = randomNumber(10, 1000).toFixed(2);
                console.log(`Executing trade: Buy ${quantity} shares of ${ticker} at ${price} USD`);
                // Simulate market data
                const currentPrice = randomNumber(price * 0.9, price * 1.1).toFixed(2);
                console.log(`Current price of ${ticker}: ${currentPrice} USD`);
            }

            getConfig(): AppConfig {
                return this.config;
            }
        }
    }

    /**
     * Citibankdemobusinessinc.insurance.autoinsurance
     * Mission: To provide comprehensive auto insurance coverage with personalized pricing.
     * Monetization: Insurance premiums and add-on services.
     * IP Moat: Advanced risk assessment models and claims processing automation.
     */
    export namespace insurance {
        export class AutoInsurance implements IBaseApp {
            private config: AppConfig;

            constructor() {
                this.config = {
                    appName: 'AutoInsurance',
                    version: '1.0.0',
                    environment: 'production',
                    apiKeys: {
                        lexisNexis: generateUUID(),
                        dmv: generateUUID()
                    }
                };
            }

            async run(): Promise<void> {
                console.log(`${this.config.appName} is running...`);
                // Simulate insurance quote
                const driverAge = randomNumber(18, 70).toFixed(0);
                const vehicleType = randomString(5);
                console.log(`Generating auto insurance quote for driver age ${driverAge} and vehicle type ${vehicleType}...`);
                // Simulate risk assessment
                const riskScore = randomNumber(1, 10).toFixed(0);
                console.log(`Risk score: ${riskScore}`);
                // Simulate premium calculation
                const premium = randomNumber(500, 2000).toFixed(0);
                console.log(`Estimated premium: ${premium} USD per year`);
            }

            getConfig(): AppConfig {
                return this.config;
            }
        }

        /**
         * Citibankdemobusinessinc.insurance.healthinsurance
         * Mission: To offer affordable and comprehensive health insurance plans.
         * Monetization: Insurance premiums and wellness program subscriptions.
         * IP Moat: Predictive analytics for healthcare costs and personalized wellness recommendations.
         */
        export class HealthInsurance implements IBaseApp {
            private config: AppConfig;

            constructor() {
                this.config = {
                    appName: 'HealthInsurance',
                    version: '1.0.0',
                    environment: 'production',
                    apiKeys: {
                        cms: generateUUID(),
                        ehr: generateUUID()
                    }
                };
            }

            async run(): Promise<void> {
                console.log(`${this.config.appName} is running...`);
                // Simulate health insurance quote
                const age = randomNumber(18, 70).toFixed(0);
                const location = randomString(5);
                console.log(`Generating health insurance quote for age ${age} and location ${location}...`);
                // Simulate risk assessment
                const healthScore = randomNumber(1, 10).toFixed(0);
                console.log(`Health score: ${healthScore}`);
                // Simulate premium calculation
                const premium = randomNumber(100, 500).toFixed(0);
                console.log(`Estimated premium: ${premium} USD per month`);
            }

            getConfig(): AppConfig {
                return this.config;
            }
        }
    }

    /**
     * Citibankdemobusinessinc.realestate.propertyplatform
     * Mission: To connect buyers, sellers, and renters through an innovative real estate platform.
     * Monetization: Listing fees, advertising revenue, and premium services.
     * IP Moat: Advanced search algorithms and virtual tour technology.
     */
    export namespace realestate {
        export class PropertyPlatform implements IBaseApp {
            private config: AppConfig;

            constructor() {
                this.config = {
                    appName: 'PropertyPlatform',
                    version: '1.0.0',
                    environment: 'production',
                    apiKeys: {
                        googleMaps: generateUUID(),
                        mls: generateUUID()
                    }
                };
            }

            async run(): Promise<void> {
                console.log(`${this.config.appName} is running...`);
                // Simulate property search
                const location = randomString(5);
                const priceRange = `${randomNumber(100000, 500000).toFixed(0)} - ${randomNumber(500000, 1000000).toFixed(0)}`;
                console.log(`Searching for properties in ${location} with price range ${priceRange} USD...`);
                // Simulate property listing
                const numListings = randomNumber(1, 100).toFixed(0);
                console.log(`Found ${numListings} listings.`);
            }

            getConfig(): AppConfig {
                return this.config;
            }
        }

        /**
         * Citibankdemobusinessinc.realestate.propertymanagement
         * Mission: To provide comprehensive property management services for landlords and tenants.
         * Monetization: Management fees and service charges.
         * IP Moat: Automated rent collection and maintenance request systems.
         */
        export class PropertyManagement implements IBaseApp {
            private config: AppConfig;

            constructor() {
                this.config = {
                    appName: 'PropertyManagement',
                    version: '1.0.0',
                    environment: 'production',
                    apiKeys: {
                        rently: generateUUID(),
                        zInspector: generateUUID()
                    }
                };
            }

            async run(): Promise<void> {
                console.log(`${this.config.appName} is running...`);
                // Simulate rent collection
                const numTenants = randomNumber(1, 10).toFixed(0);
                console.log(`Collecting rent from ${numTenants} tenants...`);
                // Simulate maintenance request
                const numRequests = randomNumber(1, 5).toFixed(0);
                console.log(`Received ${numRequests} maintenance requests.`);
            }

            getConfig(): AppConfig {
                return this.config;
            }
        }
    }

    /**
     * Orchestration Layer
     * Mission: To unify all Citibankdemobusinessinc services into a seamless open banking ecosystem.
     */
    export class OrchestrationLayer {
        private apps: IBaseApp[];

        constructor() {
            this.apps = [
                new openbanking.AccountAggregator(),
                new openbanking.PaymentGateway(),
                new lending.AutoLoanPlatform(),
                new lending.MortgagePlatform(),
                new investment.RoboAdvisor(),
                new investment.TradingPlatform(),
                new insurance.AutoInsurance(),
                new insurance.HealthInsurance(),
                new realestate.PropertyPlatform(),
                new realestate.PropertyManagement()
            ];
        }

        async runAll(): Promise<void> {
            console.log('Starting Citibankdemobusinessinc ecosystem...');
            for (const app of this.apps) {
                await app.run();
            }
            console.log('Citibankdemobusinessinc ecosystem completed.');
        }
    }
}

// --- End Citibankdemobusinessinc Business Models ---

/**
 * Core engine for executing workflows defined by OpenAPI 3.1.0 standards and custom extensions.
 * Handles state transitions, dependency resolution, scripting hooks, and error management.
 */
export class WorkflowEngine extends EventEmitter {
    private operationExecutor: IOperationExecutor;
    private scriptExecutor: IScriptExecutor;

    constructor(operationExecutor: IOperationExecutor, scriptExecutor: IScriptExecutor) {
        super();
        this.operationExecutor = operationExecutor;
        this.scriptExecutor = scriptExecutor;
    }

    /**
     * Initializes and executes a workflow.
     * @param definition The workflow definition.
     * @param initialInputs Initial inputs provided to the workflow.
     * @param authContext Authentication tokens (e.g., Google OAuth).
     */
    public async executeWorkflow(
        definition: WorkflowDefinition,
        initialInputs: Record<string, any> = {},
        authContext: any = {}
    ): Promise<WorkflowContext> {
        const executionId = generateUUID();
        
        const context: WorkflowContext = {
            workflowId: definition.id,
            executionId: executionId,
            status: ExecutionStatus.RUNNING,
            variables: { ...definition.variables, ...initialInputs },
            steps: {},
            auth: authContext,
            integrations: {}, // Populated as needed
            telemetry: [],
            auditLog: [],
            riskAssessment: {
                overallRiskScore: 0,
                materialRisks: [],
                liquidityRatio: 0
            },
            governancePolicies: []
        };

        this.emit('workflowStart', { executionId, workflowId: definition.id });

        try {
            // Topological sort or simple dependency check loop
            const stepsToRun = new Map<string, WorkflowStep>(definition.steps.map(s => [s.id, s]));
            const completedSteps = new Set<string>();

            // Initialize step results
            definition.steps.forEach(step => {
                context.steps[step.id] = {
                    id: step.id,
                    status: ExecutionStatus.PENDING,
                    startTime: new Date(),
                    attempts: 0
                };
            });

            while (completedSteps.size < stepsToRun.size) {
                // Find steps that are ready to run (dependencies met) and haven't run yet
                const readySteps = Array.from(stepsToRun.values()).filter(step => {
                    if (completedSteps.has(step.id)) return false;
                    if (!step.dependsOn || step.dependsOn.length === 0) return true;
                    return step.dependsOn.every(depId => completedSteps.has(depId));
                });

                if (readySteps.length === 0 && completedSteps.size < stepsToRun.size) {
                    throw new Error('Deadlock detected in workflow dependencies or circular dependency.');
                }

                // Execute ready steps in parallel
                await Promise.all(readySteps.map(async (step) => {
                    try {
                        await this.executeStep(step, context);
                    } catch (error) {
                        // If a step fails and it's critical, the workflow fails
                        // Error handling logic is inside executeStep, but if it bubbles up:
                        context.status = ExecutionStatus.FAILED;
                        throw error;
                    } finally {
                        completedSteps.add(step.id);
                    }
                }));

                if (context.status === ExecutionStatus.FAILED) break;
            }

            context.status = ExecutionStatus.COMPLETED;
            this.emit('workflowComplete', { executionId, result: context });
        } catch (error) {
            context.status = ExecutionStatus.FAILED;
            this.emit('workflowError', { executionId, error });
            throw error;
        }

        return context;
    }

    /**
     * Executes a single step including pre-scripts, operation call, and post-scripts.
     */
    private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
        const stepResult = context.steps[step.id];
        stepResult.status = ExecutionStatus.RUNNING;
        stepResult.startTime = new Date();
        this.emit('stepStart', { executionId: context.executionId, stepId: step.id });

        try {
            // 1. Evaluate Condition
            if (step.condition) {
                const shouldRun = await this.evaluateExpression(step.condition, context);
                if (!shouldRun) {
                    stepResult.status = ExecutionStatus.SKIPPED;
                    stepResult.endTime = new Date();
                    this.emit('stepSkipped', { executionId: context.executionId, stepId: step.id });
                    return;
                }
            }

            // 2. Run Pre-Script
            if (step.preScript) {
                await this.runScript(step.preScript, context, stepResult);
            }

            // 3. Resolve Inputs
            const resolvedInputs = this.resolveInputs(step.inputs, context);

            // 4. Execute Operation (with Retry Logic)
            const output = await this.executeOperationWithRetry(step, resolvedInputs, context);
            stepResult.output = output;

            // 5. Run Post-Script
            if (step.postScript) {
                await this.runScript(step.postScript, context, stepResult);
            }

            stepResult.status = ExecutionStatus.COMPLETED;
            stepResult.endTime = new Date();
            this.emit('stepComplete', { executionId: context.executionId, stepId: step.id, output });

        } catch (error: any) {
            stepResult.status = ExecutionStatus.FAILED;
            stepResult.error = error;
            stepResult.endTime = new Date();
            this.emit('stepError', { executionId: context.executionId, stepId: step.id, error });
            throw error; // Re-throw to stop workflow if necessary
        }
    }

    /**
     * Handles the retry logic for operations.
     */
    private async executeOperationWithRetry(
        step: WorkflowStep, 
        inputs: any, 
        context: WorkflowContext
    ): Promise<any> {
        const policy = step.retryPolicy || { maxAttempts: 1, backoffMultiplier: 1, initialIntervalMs: 0 };
        let attempt = 0;
        let lastError;

        while (attempt < policy.maxAttempts) {
            attempt++;
            context.steps[step.id].attempts = attempt;
            
            try {
                // Special handling for specific integrations if needed, otherwise generic executor
                // This supports the "1000 APIs" requirement by delegating to the operationExecutor
                // which should have the OpenAPI definitions loaded.
                return await this.operationExecutor.executeOperation(
                    step.operationId, 
                    inputs, 
                    context.auth
                );
            } catch (error) {
                lastError = error;
                if (attempt >= policy.maxAttempts) break;

                const delay = policy.initialIntervalMs * Math.pow(policy.backoffMultiplier, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                this.emit('stepRetry', { executionId: context.executionId, stepId: step.id, attempt, delay });
            }
        }

        throw lastError;
    }

    /**
     * Resolves input variables using a template syntax (e.g., ${steps.step1.output.id}).
     */
    private resolveInputs(inputs: any, context: WorkflowContext): any {
        if (typeof inputs === 'string') {
            return this.interpolateString(inputs, context);
        } else if (Array.isArray(inputs)) {
            return inputs.map(i => this.resolveInputs(i, context));
        } else if (typeof inputs === 'object' && inputs !== null) {
            const resolved: any = {};
            for (const key in inputs) {
                resolved[key] = this.resolveInputs(inputs[key], context);
            }
            return resolved;
        }
        return inputs;
    }

    /**
     * Interpolates a string with context values.
     * Supports dot notation: ${steps.login.output.token}
     */
    private interpolateString(str: string, context: WorkflowContext): any {
        const regex = /\$\{([^}]+)\}/g;
        
        // If the string is exactly one variable, return the raw value (preserve types)
        if (str.match(/^\$\{([^}]+)\}$/)) {
            const path = str.slice(2, -1).trim();
            return this.getValueFromPath(path, context);
        }

        return str.replace(regex, (_, path) => {
            const val = this.getValueFromPath(path.trim(), context);
            return val !== undefined ? String(val) : '';
        });
    }

    private getValueFromPath(path: string, context: WorkflowContext): any {
        const parts = path.split('.');
        let current: any = context;
        
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        return current;
    }

    /**
     * Evaluates a boolean expression for step conditions.
     */
    private async evaluateExpression(expression: string, context: WorkflowContext): Promise<boolean> {
        // Using the script executor to evaluate expressions safely
        try {
            const result = await this.scriptExecutor.execute(`return ${expression};`, context);
            return !!result;
        } catch (e) {
            console.error(`Failed to evaluate condition: ${expression}`, e);
            return false;
        }
    }

    /**
     * Runs a pre or post script.
     * Scripts have access to the context and can modify variables.
     */
    private async runScript(script: string, context: WorkflowContext, currentStep: StepResult): Promise<void> {
        // Expose a safe sandbox context
        const sandboxContext = {
            variables: context.variables,
            steps: context.steps,
            currentStep: currentStep,
            auth: context.auth,
            // Helper to set output from script
            setOutput: (val: any) => { currentStep.output = val; },
            // Helper to fail from script
            fail: (msg: string) => { throw new Error(msg); }
        };

        await this.scriptExecutor.execute(script, sandboxContext);
    }
}

/**
 * Default implementation of a Script Executor using Function constructor.
 * Note: In a high-security environment, use 'vm2' or 'isolated-vm'.
 */
export class DefaultScriptExecutor implements IScriptExecutor {
    async execute(script: string, context: any): Promise<any> {
        const keys = Object.keys(context);
        const values = Object.values(context);
        
        // Wrap in an async function to allow await in scripts
        const func = new Function(...keys, `return (async () => { ${script} })();`);
        return func(...values);
    }
}

/**
 * Helper to validate if a workflow definition is valid.
 */
export function validateWorkflow(definition: WorkflowDefinition): string[] {
    const errors: string[] = [];
    if (!definition.id) errors.push('Workflow ID is required');
    if (!definition.steps || !Array.isArray(definition.steps)) errors.push('Workflow steps are required');
    
    const stepIds = new Set<