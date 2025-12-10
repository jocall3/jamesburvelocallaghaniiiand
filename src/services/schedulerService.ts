import cron from 'node-cron';
import { logger } from '../utils/logger'; // Assuming a logger utility exists at this path
import { BillingDataFetcherService } from './billingDataFetcherService'; // Assuming this service exists at this path

/**
 * Configuration interface for the SchedulerService.
 * Defines cron schedules for various cloud billing data fetching tasks.
 */
interface SchedulerConfig {
  awsBillingSchedule: string;
  gcpBillingSchedule: string;
  azureBillingSchedule: string;
  // Add more cloud provider schedules here as the project expands
}

/**
 * SchedulerService manages the scheduling of periodic tasks,
 * primarily for fetching billing data from different cloud providers.
 * It uses `node-cron` for robust scheduling.
 */
export class SchedulerService {
  private config: SchedulerConfig;
  private billingDataFetcher: BillingDataFetcherService;
  private scheduledTasks: cron.ScheduledTask[] = [];

  /**
   * Initializes the SchedulerService.
   * @param billingDataFetcher An instance of BillingDataFetcherService to perform the actual data fetching.
   * @param config Optional configuration for cron schedules. Defaults to environment variables or sensible defaults.
   */
  constructor(
    billingDataFetcher: BillingDataFetcherService,
    config?: Partial<SchedulerConfig> // Allow partial config for easier testing/overrides
  ) {
    this.billingDataFetcher = billingDataFetcher;
    this.config = {
      awsBillingSchedule: process.env.AWS_BILLING_CRON_SCHEDULE || '0 0 * * *', // Daily at midnight UTC
      gcpBillingSchedule: process.env.GCP_BILLING_CRON_SCHEDULE || '30 0 * * *', // Daily at 00:30 UTC
      azureBillingSchedule: process.env.AZURE_BILLING_CRON_SCHEDULE || '0 1 * * *', // Daily at 01:00 UTC
      ...config, // Override defaults with provided config
    };
    logger.info('SchedulerService initialized with config:', this.config);
  }

  /**
   * Starts all defined scheduled tasks.
   * Each task fetches billing data from a specific cloud provider.
   */
  public start(): void {
    logger.info('Starting SchedulerService and scheduling tasks...');

    // Schedule AWS billing data fetching
    const awsTask = cron.schedule(this.config.awsBillingSchedule, async () => {
      logger.info('Running scheduled task: Fetch AWS billing data...');
      try {
        await this.billingDataFetcher.fetchAwsBillingData();
        logger.info('Successfully fetched AWS billing data.');
      } catch (error) {
        logger.error('Error fetching AWS billing data:', error instanceof Error ? error.message : String(error));
      }
    }, {
      scheduled: true,
      timezone: 'UTC' // Ensure consistent scheduling regardless of server's local timezone
    });
    this.scheduledTasks.push(awsTask);
    logger.info(`AWS billing data fetching scheduled with cron: '${this.config.awsBillingSchedule}'`);

    // Schedule GCP billing data fetching
    const gcpTask = cron.schedule(this.config.gcpBillingSchedule, async () => {
      logger.info('Running scheduled task: Fetch GCP billing data...');
      try {
        await this.billingDataFetcher.fetchGcpBillingData();
        logger.info('Successfully fetched GCP billing data.');
      } catch (error) {
        logger.error('Error fetching GCP billing data:', error instanceof Error ? error.message : String(error));
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });
    this.scheduledTasks.push(gcpTask);
    logger.info(`GCP billing data fetching scheduled with cron: '${this.config.gcpBillingSchedule}'`);

    // Schedule Azure billing data fetching
    const azureTask = cron.schedule(this.config.azureBillingSchedule, async () => {
      logger.info('Running scheduled task: Fetch Azure billing data...');
      try {
        await this.billingDataFetcher.fetchAzureBillingData();
        logger.info('Successfully fetched Azure billing data.');
      } catch (error) {
        logger.error('Error fetching Azure billing data:', error instanceof Error ? error.message : String(error));
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });
    this.scheduledTasks.push(azureTask);
    logger.info(`Azure billing data fetching scheduled with cron: '${this.config.azureBillingSchedule}'`);

    logger.info('All billing data fetching tasks have been scheduled.');
  }

  /**
   * Stops all currently running scheduled tasks.
   * Useful for graceful application shutdown.
   */
  public stop(): void {
    logger.info('Stopping SchedulerService and all scheduled tasks...');
    this.scheduledTasks.forEach(task => {
      task.stop();
      logger.debug('Stopped a scheduled task.');
    });
    this.scheduledTasks = [];
    logger.info('All scheduled tasks stopped.');
  }
}