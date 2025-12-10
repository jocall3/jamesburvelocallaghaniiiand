import { Request, Response, NextFunction } from 'express';
import { RawBillingRepository } from '../repositories/rawBillingRepository';
import { AwsBillingService } from '../services/awsBillingService';
import { GcpBillingService } from '../services/gcpBillingService';
import { AzureBillingService } from '../services/azureBillingService';
import { AppError } from '../errors/AppError';

/**
 * @class RawBillingController
 * @description Manages HTTP requests for retrieving raw, unnormalized billing data from various cloud providers.
 * It acts as a bridge between the API routes and the underlying services that fetch the data.
 */
export class RawBillingController {
  /**
   * @param rawBillingRepository - Repository for interacting with stored raw billing data.
   * @param awsBillingService - Service for fetching raw billing data from AWS.
   * @param gcpBillingService - Service for fetching raw billing data from GCP.
   * @param azureBillingService - Service for fetching raw billing data from Azure.
   */
  constructor(
    private rawBillingRepository: RawBillingRepository,
    private awsBillingService: AwsBillingService,
    private gcpBillingService: GcpBillingService,
    private azureBillingService: AzureBillingService
  ) {}

  /**
   * @description Validates and parses the date range from the request query.
   * @private
   * @param {Request} req - The Express request object.
   * @returns {{ startDate: Date, endDate: Date }} The parsed start and end dates.
   * @throws {AppError} If the date parameters are missing or invalid.
   */
  private parseDateRange(req: Request): { startDate: Date; endDate: Date } {
    const { startDate: startDateStr, endDate: endDateStr } = req.query;

    if (!startDateStr || !endDateStr) {
      throw new AppError('Missing required query parameters: startDate and endDate.', 400);
    }

    const startDate = new Date(startDateStr as string);
    const endDate = new Date(endDateStr as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError('Invalid date format. Please use ISO 8601 format (e.g., YYYY-MM-DD).', 400);
    }

    if (startDate > endDate) {
        throw new AppError('startDate cannot be after endDate.', 400);
    }

    // Set endDate to the end of the day to include all records for that day
    endDate.setUTCHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  /**
   * @handler GET /raw/aws
   * @description Retrieves raw AWS billing records for a specified date range.
   * @param {Request} req - Express request object. Expects `startDate` and `endDate` query params.
   * @param {Response} res - Express response object.
   * @param {NextFunction} next - Express next middleware function.
   */
  public getAwsRawBilling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = this.parseDateRange(req);
      // The controller delegates the core logic of fetching data to the service layer.
      // A caching layer could be implemented here or in the repository.
      // e.g., let data = await this.rawBillingRepository.find('aws', { startDate, endDate });
      const data = await this.awsBillingService.getRawBillingData(startDate, endDate);
      res.status(200).json({
        provider: 'aws',
        recordCount: data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @handler GET /raw/gcp
   * @description Retrieves raw GCP billing records for a specified date range.
   * @param {Request} req - Express request object. Expects `startDate` and `endDate` query params.
   * @param {Response} res - Express response object.
   * @param {NextFunction} next - Express next middleware function.
   */
  public getGcpRawBilling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = this.parseDateRange(req);
      const data = await this.gcpBillingService.getRawBillingData(startDate, endDate);
      res.status(200).json({
        provider: 'gcp',
        recordCount: data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @handler GET /raw/azure
   * @description Retrieves raw Azure billing records for a specified date range.
   * @param {Request} req - Express request object. Expects `startDate` and `endDate` query params.
   * @param {Response} res - Express response object.
   * @param {NextFunction} next - Express next middleware function.
   */
  public getAzureRawBilling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = this.parseDateRange(req);
      const data = await this.azureBillingService.getRawBillingData(startDate, endDate);
      res.status(200).json({
        provider: 'azure',
        recordCount: data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @handler GET /raw/all
   * @description Retrieves raw billing records from all configured cloud providers concurrently for a given date range.
   * @param {Request} req - Express request object. Expects `startDate` and `endDate` query params.
   * @param {Response} res - Express response object.
   * @param {NextFunction} next - Express next middleware function.
   */
  public getAllRawBilling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = this.parseDateRange(req);

      // Use Promise.allSettled to ensure that a failure in one provider's API
      // does not prevent the others from returning data.
      const results = await Promise.allSettled([
        this.awsBillingService.getRawBillingData(startDate, endDate),
        this.gcpBillingService.getRawBillingData(startDate, endDate),
        this.azureBillingService.getRawBillingData(startDate, endDate),
      ]);

      const [awsResult, gcpResult, azureResult] = results;

      res.status(200).json({
        aws: awsResult.status === 'fulfilled'
          ? { status: 'success', recordCount: awsResult.value.length, data: awsResult.value }
          : { status: 'error', message: (awsResult.reason as Error).message },
        gcp: gcpResult.status === 'fulfilled'
          ? { status: 'success', recordCount: gcpResult.value.length, data: gcpResult.value }
          : { status: 'error', message: (gcpResult.reason as Error).message },
        azure: azureResult.status === 'fulfilled'
          ? { status: 'success', recordCount: azureResult.value.length, data: azureResult.value }
          : { status: 'error', message: (azureResult.reason as Error).message },
      });
    } catch (error) {
      next(error);
    }
  };
}