import { Request, Response, NextFunction } from 'express';

// --- Placeholder for utils/apiErrors.ts ---
export class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends ApiError {
    constructor(message = 'Bad Request') {
        super(message, 400);
    }
}

export class NotFoundError extends ApiError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}

export class InternalServerError extends ApiError {
    constructor(message = 'Internal Server Error') {
        super(message, 500, false); // Not operational by default, indicates a bug
    }
}
// --- End Placeholder for utils/apiErrors.ts ---

// --- Placeholder for utils/logger.ts ---
export const logger = {
    info: (...args: any[]) => console.log(`[${new Date().toISOString()}] [INFO]`, ...args),
    warn: (...args: any[]) => console.warn(`[${new Date().toISOString()}] [WARN]`, ...args),
    error: (...args: any[]) => console.error(`[${new Date().toISOString()}] [ERROR]`, ...args),
    debug: (...args: any[]) => console.debug(`[${new Date().toISOString()}] [DEBUG]`, ...args),
};
// --- End Placeholder for utils/logger.ts ---

// --- Placeholder for repositories/normalizedBillingRepository.ts ---
// Defines the structure of a normalized billing record
export interface NormalizedBillingRecord {
    id: string;
    cloudProvider: 'AWS' | 'GCP' | 'Azure' | string;
    accountId: string;
    resourceId: string;
    resourceType: string; // e.g., 'EC2', 'Compute Engine', 'VM'
    service: string; // e.g., 'AmazonEC2', 'Cloud Functions', 'Virtual Machines'
    usageAmount: number;
    usageUnit: string; // e.g., 'hours', 'GB', 'requests'
    cost: number;
    currency: string;
    usageStartDate: Date;
    usageEndDate: Date;
    tags: Record<string, string>; // Unified tags/labels
    normalizedAt: Date;
    rawBillingSource?: string; // Optional: reference to the original billing item
}

// Defines filters for querying billing data
export interface BillingFilters {
    startDate?: Date;
    endDate?: Date;
    cloudProvider?: string;
    resourceType?: string;
    accountId?: string;
    service?: string;
    tags?: Record<string, string>; // Filter by tags
}

// Defines pagination options
export interface PaginationOptions {
    limit: number;
    offset: number;
}

/**
 * Mock Repository for Normalized Billing Data.
 * In a real application, this would interact with a database.
 */
export class NormalizedBillingRepository {
    private db: NormalizedBillingRecord[] = []; // In-memory store for demonstration

    constructor() {
        logger.info('NormalizedBillingRepository initialized (using in-memory store).');
        // Seed with some dummy data
        this.db.push({
            id: 'nb-aws-001',
            cloudProvider: 'AWS',
            accountId: '111122223333',
            resourceId: 'i-abcdef1234567890a',
            resourceType: 'EC2',
            service: 'AmazonEC2',
            usageAmount: 720,
            usageUnit: 'hours',
            cost: 15.50,
            currency: 'USD',
            usageStartDate: new Date('2023-01-01T00:00:00Z'),
            usageEndDate: new Date('2023-01-31T23:59:59Z'),
            tags: { project: 'project-alpha', environment: 'prod' },
            normalizedAt: new Date(),
        });
        this.db.push({
            id: 'nb-gcp-002',
            cloudProvider: 'GCP',
            accountId: 'gcp-project-id-123',
            resourceId: 'vm-instance-1',
            resourceType: 'Compute Engine',
            service: 'Compute Engine',
            usageAmount: 600,
            usageUnit: 'hours',
            cost: 10.25,
            currency: 'USD',
            usageStartDate: new Date('2023-01-05T00:00:00Z'),
            usageEndDate: new Date('2023-01-25T23:59:59Z'),
            tags: { project: 'project-alpha', environment: 'dev' },
            normalizedAt: new Date(),
        });
        this.db.push({
            id: 'nb-azure-003',
            cloudProvider: 'Azure',
            accountId: 'azure-sub-id-abc',
            resourceId: 'function-app-1',
            resourceType: 'Azure Functions',
            service: 'Azure Functions',
            usageAmount: 1000000,
            usageUnit: 'executions',
            cost: 5.75,
            currency: 'USD',
            usageStartDate: new Date('2023-02-01T00:00:00Z'),
            usageEndDate: new Date('2023-02-28T23:59:59Z'),
            tags: { project: 'project-beta', environment: 'prod' },
            normalizedAt: new Date(),
        });
    }

    /**
     * Finds normalized billing records based on filters and pagination.
     * @param filters Criteria to filter records.
     * @param pagination Pagination options (limit, offset).
     * @returns An object containing the data and total count.
     */
    public async find(filters: BillingFilters, pagination: PaginationOptions): Promise<{ data: NormalizedBillingRecord[]; total: number }> {
        logger.debug('Repository: Finding normalized billing records with filters:', filters, 'pagination:', pagination);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB latency

        let filteredData = this.db.filter(record => {
            let match = true;
            if (filters.startDate && record.usageStartDate < filters.startDate) match = false;
            if (filters.endDate && record.usageEndDate > filters.endDate) match = false;
            if (filters.cloudProvider && record.cloudProvider !== filters.cloudProvider) match = false;
            if (filters.resourceType && record.resourceType !== filters.resourceType) match = false;
            if (filters.accountId && record.accountId !== filters.accountId) match = false;
            if (filters.service && record.service !== filters.service) match = false;
            // Basic tag filtering (exact match for now)
            if (filters.tags) {
                for (const key in filters.tags) {
                    if (record.tags[key] !== filters.tags[key]) {
                        match = false;
                        break;
                    }
                }
            }
            return match;
        });

        const total = filteredData.length;
        const data = filteredData.slice(pagination.offset, pagination.offset + pagination.limit);

        return { data, total };
    }

    /**
     * Finds a single normalized billing record by its ID.
     * @param id The ID of the record to find.
     * @returns The record if found, otherwise null.
     */
    public async findById(id: string): Promise<NormalizedBillingRecord | null> {
        logger.debug(`Repository: Finding record by ID: ${id}`);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB latency
        return this.db.find(record => record.id === id) || null;
    }

    /**
     * Creates a new normalized billing record.
     * @param record The record to create.
     * @returns The created record.
     */
    public async create(record: NormalizedBillingRecord): Promise<NormalizedBillingRecord> {
        logger.info('Repository: Creating new record:', record.id);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB latency
        this.db.push(record);
        return record;
    }

    // In a real app, you'd also have update, delete, and potentially bulk operations.
}
// --- End Placeholder for repositories/normalizedBillingRepository.ts ---

// --- Placeholder for services/normalizedBillingService.ts ---
/**
 * Mock Service for Billing Normalization.
 * This service would contain the core logic for fetching raw billing data,
 * normalizing it, and interacting with the repository.
 */
export class NormalizedBillingService {
    private normalizedBillingRepository: NormalizedBillingRepository;

    constructor(normalizedBillingRepository: NormalizedBillingRepository) {
        this.normalizedBillingRepository = normalizedBillingRepository;
    }

    /**
     * Triggers the asynchronous process of fetching raw billing data from
     * various cloud providers, normalizing it, and persisting it.
     * @returns A promise resolving to details about the initiated process (e.g., job ID).
     */
    public async triggerNormalizationProcess(): Promise<{ jobId: string; status: string; message: string }> {
        logger.info('Service: Initiating billing data normalization process...');

        // In a real application, this would involve:
        // 1. Calling AWS Cost Explorer, GCP Billing Export, Azure Cost Management APIs.
        // 2. Parsing and transforming the raw data into the `NormalizedBillingRecord` schema.
        // 3. Batching and saving the normalized data via `normalizedBillingRepository.create` or a bulk insert.
        // 4. This operation would likely be offloaded to a message queue (e.g., SQS, Pub/Sub)
        //    or a background job system (e.g., AWS Step Functions, GCP Cloud Workflows)
        //    to avoid long-running HTTP requests.

        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate heavy async work

        const jobId = `normalization-job-${Date.now()}`;
        logger.info(`Service: Normalization job ${jobId} started.`);

        // Simulate creating a new normalized record after processing
        const newRecord: NormalizedBillingRecord = {
            id: `nb-auto-${Date.now()}`,
            cloudProvider: ['AWS', 'GCP', 'Azure'][Math.floor(Math.random() * 3)],
            accountId: `acc-${Math.random().toString(36).substring(2, 10)}`,
            resourceId: `res-${Math.random().toString(36).substring(2, 10)}`,
            resourceType: ['Storage', 'Compute', 'Network'][Math.floor(Math.random() * 3)],
            service: ['S3', 'GCS', 'Blob Storage', 'EC2', 'GCE', 'VMs'][Math.floor(Math.random() * 6)],
            usageAmount: Math.floor(Math.random() * 1000),
            usageUnit: ['GB', 'hours', 'requests'][Math.floor(Math.random() * 3)],
            cost: parseFloat((Math.random() * 50).toFixed(2)),
            currency: 'USD',
            usageStartDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
            usageEndDate: new Date(),
            tags: { env: 'staging', owner: 'billing-team' },
            normalizedAt: new Date(),
        };
        await this.normalizedBillingRepository.create(newRecord);
        logger.info(`Service: New dummy record ${newRecord.id} created as part of normalization.`);

        return { jobId, status: 'initiated', message: 'Normalization process has been queued.' };
    }

    // Other business logic methods related to billing data could go here,
    // e.g., `getCostBreakdown`, `getSavingsRecommendations`.
}
// --- End Placeholder for services/normalizedBillingService.ts ---


// Define an interface for the expected query parameters for fetching billing data
interface GetBillingQueryParams {
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    cloudProvider?: string; // e.g., 'AWS', 'GCP', 'Azure'
    resourceType?: string; // e.g., 'EC2', 'Compute Engine', 'VM'
    accountId?: string; // Specific cloud account ID
    service?: string; // Specific cloud service
    limit?: string;
    offset?: string;
    // Add more query parameters for tag filtering if needed, e.g., 'tag_project', 'tag_environment'
}

// Define an interface for the controller's dependencies
interface NormalizedBillingControllerDependencies {
    billingNormalizerService: NormalizedBillingService;
    normalizedBillingRepository: NormalizedBillingRepository;
}

/**
 * Handles incoming HTTP requests for normalized billing data.
 * It orchestrates calls to the `billingNormalizerService` and `normalizedBillingRepository`,
 * formats responses, and handles errors.
 */
export class NormalizedBillingController {
    private billingNormalizerService: NormalizedBillingService;
    private normalizedBillingRepository: NormalizedBillingRepository;

    constructor({ billingNormalizerService, normalizedBillingRepository }: NormalizedBillingControllerDependencies) {
        this.billingNormalizerService = billingNormalizerService;
        this.normalizedBillingRepository = normalizedBillingRepository;

        // Bind methods to the instance to ensure `this` context is correct when used as Express middleware
        this.getNormalizedBillingData = this.getNormalizedBillingData.bind(this);
        this.triggerNormalization = this.triggerNormalization.bind(this);
        this.getNormalizedBillingRecordById = this.getNormalizedBillingRecordById.bind(this);
    }

    /**
     * @route GET /api/v1/normalized-billing
     * @description Retrieves normalized billing data based on query parameters.
     * @param req Express Request object with query parameters for filtering and pagination.
     * @param res Express Response object to send the data.
     * @param next Express NextFunction for error handling.
     */
    public async getNormalizedBillingData(req: Request<{}, {}, {}, GetBillingQueryParams>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate, cloudProvider, resourceType, accountId, service, limit, offset, ...tagFilters } = req.query;

            // Basic validation for date formats if provided
            if ((startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) || (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))) {
                throw new BadRequestError('Invalid date format. Use YYYY-MM-DD.');
            }

            const filters: BillingFilters = {
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                cloudProvider,
                resourceType,
                accountId,
                service,
                tags: {}, // Initialize tags object
            };

            // Extract tag filters (e.g., query param 'tag_project=my-project' -> { project: 'my-project' })
            for (const key in tagFilters) {
                if (key.startsWith('tag_')) {
                    const tagName = key.substring(4); // Remove 'tag_' prefix
                    if (typeof tagFilters[key] === 'string') {
                        filters.tags![tagName] = tagFilters[key] as string;
                    }
                }
            }
            // If no specific tag filters were found, ensure tags is undefined or empty if not needed
            if (Object.keys(filters.tags!).length === 0) {
                delete filters.tags;
            }


            const pagination: PaginationOptions = {
                limit: limit ? parseInt(limit, 10) : 20,
                offset: offset ? parseInt(offset, 10) : 0,
            };

            if (isNaN(pagination.limit) || pagination.limit <= 0 || isNaN(pagination.offset) || pagination.offset < 0) {
                throw new BadRequestError('Invalid limit or offset values. Limit must be positive, offset non-negative.');
            }

            logger.info('Fetching normalized billing data with filters:', filters, 'and pagination:', pagination);

            // Use the repository to fetch already normalized data
            const { data, total } = await this.normalizedBillingRepository.find(filters, pagination);

            res.status(200).json({
                status: 'success',
                data,
                meta: {
                    total,
                    limit: pagination.limit,
                    offset: pagination.offset,
                },
            });
        } catch (error) {
            logger.error('Error fetching normalized billing data:', error);
            // Pass the error to the Express error handling middleware
            next(error);
        }
    }

    /**
     * @route GET /api/v1/normalized-billing/:id
     * @description Retrieves a single normalized billing record by its ID.
     * @param req Express Request object with the record ID in parameters.
     * @param res Express Response object to send the data.
     * @param next Express NextFunction for error handling.
     */
    public async getNormalizedBillingRecordById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                throw new BadRequestError('Billing record ID is required.');
            }

            logger.info(`Fetching normalized billing record with ID: ${id}`);

            const record = await this.normalizedBillingRepository.findById(id);

            if (!record) {
                throw new NotFoundError(`Normalized billing record with ID '${id}' not found.`);
            }

            res.status(200).json({
                status: 'success',
                data: record,
            });
        } catch (error) {
            logger.error(`Error fetching normalized billing record by ID '${req.params.id}':`, error);
            next(error);
        }
    }

    /**
     * @route POST /api/v1/normalized-billing/trigger-normalization
     * @description Triggers the normalization process for billing data.
     *              This is typically an asynchronous operation.
     * @param req Express Request object.
     * @param res Express Response object to acknowledge the request.
     * @param next Express NextFunction for error handling.
     */
    public async triggerNormalization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logger.info('Received request to trigger billing data normalization process.');

            // The service method should handle the actual fetching, processing, and saving.
            // It returns details about the initiated process, e.g., a job ID.
            const result = await this.billingNormalizerService.triggerNormalizationProcess();

            // 202 Accepted indicates the request has been accepted for processing,
            // but the processing itself has not yet completed.
            res.status(202).json({
                status: 'accepted',
                message: 'Billing data normalization process initiated successfully.',
                details: result, // e.g., { jobId: '...' }
            });
        } catch (error) {
            logger.error('Error triggering billing data normalization:', error);
            next(error);
        }
    }
}