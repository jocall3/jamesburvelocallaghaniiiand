import { NormalizedBillingRepository } from '../../../src/repositories/normalizedBillingRepository';
import { PrismaClient, NormalizedBillingRecord } from '@prisma/client';

// Mock the PrismaClient
const mockPrismaClient = {
  normalizedBillingRecord: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaClient; // Cast to unknown first, then to PrismaClient

describe('NormalizedBillingRepository', () => {
  let repository: NormalizedBillingRepository;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    repository = new NormalizedBillingRepository(mockPrismaClient);
  });

  const mockRecordInput = {
    cloudProvider: 'AWS',
    accountId: '123456789012',
    serviceName: 'AmazonEC2',
    resourceId: 'i-1234567890abcdef0',
    usageType: 'BoxUsage:t2.micro',
    usageAmount: 1.0,
    cost: 0.0116,
    currency: 'USD',
    usageStartTime: new Date('2023-01-01T00:00:00Z'),
    usageEndTime: new Date('2023-01-01T01:00:00Z'),
    region: 'us-east-1',
    tags: {
      Project: 'BillingNormalizer',
      Environment: 'Dev',
    },
  };

  const mockNormalizedRecord: NormalizedBillingRecord = {
    id: 'rec-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...mockRecordInput,
  };

  describe('saveNormalizedBillingRecord', () => {
    it('should successfully save a new normalized billing record', async () => {
      mockPrismaClient.normalizedBillingRecord.create.mockResolvedValue(mockNormalizedRecord);

      const result = await repository.saveNormalizedBillingRecord(mockRecordInput);

      expect(mockPrismaClient.normalizedBillingRecord.create).toHaveBeenCalledWith({
        data: mockRecordInput,
      });
      expect(result).toEqual(mockNormalizedRecord);
    });

    it('should throw an error if the database operation fails', async () => {
      const error = new Error('Database connection failed');
      mockPrismaClient.normalizedBillingRecord.create.mockRejectedValue(error);

      await expect(repository.saveNormalizedBillingRecord(mockRecordInput)).rejects.toThrow(error);
    });
  });

  describe('getNormalizedBillingRecordById', () => {
    it('should return a normalized billing record if found', async () => {
      mockPrismaClient.normalizedBillingRecord.findUnique.mockResolvedValue(mockNormalizedRecord);

      const result = await repository.getNormalizedBillingRecordById(mockNormalizedRecord.id);

      expect(mockPrismaClient.normalizedBillingRecord.findUnique).toHaveBeenCalledWith({
        where: { id: mockNormalizedRecord.id },
      });
      expect(result).toEqual(mockNormalizedRecord);
    });

    it('should return null if no record is found', async () => {
      mockPrismaClient.normalizedBillingRecord.findUnique.mockResolvedValue(null);

      const result = await repository.getNormalizedBillingRecordById('non-existent-id');

      expect(mockPrismaClient.normalizedBillingRecord.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
      expect(result).toBeNull();
    });
  });

  describe('getNormalizedBillingRecordsByCloudProvider', () => {
    it('should return an array of records for a given cloud provider', async () => {
      const awsRecords = [{ ...mockNormalizedRecord, id: 'rec-aws-1' }, { ...mockNormalizedRecord, id: 'rec-aws-2' }];
      mockPrismaClient.normalizedBillingRecord.findMany.mockResolvedValue(awsRecords);

      const result = await repository.getNormalizedBillingRecordsByCloudProvider('AWS');

      expect(mockPrismaClient.normalizedBillingRecord.findMany).toHaveBeenCalledWith({
        where: { cloudProvider: 'AWS' },
      });
      expect(result).toEqual(awsRecords);
      expect(result.length).toBe(2);
    });

    it('should return an empty array if no records are found for the provider', async () => {
      mockPrismaClient.normalizedBillingRecord.findMany.mockResolvedValue([]);

      const result = await repository.getNormalizedBillingRecordsByCloudProvider('GCP');

      expect(mockPrismaClient.normalizedBillingRecord.findMany).toHaveBeenCalledWith({
        where: { cloudProvider: 'GCP' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('getNormalizedBillingRecordsByDateRange', () => {
    it('should return records within the specified date range', async () => {
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-31T23:59:59Z');
      const recordsInMonth = [{ ...mockNormalizedRecord, id: 'rec-jan-1' }];
      mockPrismaClient.normalizedBillingRecord.findMany.mockResolvedValue(recordsInMonth);

      const result = await repository.getNormalizedBillingRecordsByDateRange(startDate, endDate);

      expect(mockPrismaClient.normalizedBillingRecord.findMany).toHaveBeenCalledWith({
        where: {
          usageStartTime: { gte: startDate },
          usageEndTime: { lte: endDate },
        },
      });
      expect(result).toEqual(recordsInMonth);
      expect(result.length).toBe(1);
    });

    it('should return an empty array if no records are found in the date range', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');
      mockPrismaClient.normalizedBillingRecord.findMany.mockResolvedValue([]);

      const result = await repository.getNormalizedBillingRecordsByDateRange(startDate, endDate);

      expect(mockPrismaClient.normalizedBillingRecord.findMany).toHaveBeenCalledWith({
        where: {
          usageStartTime: { gte: startDate },
          usageEndTime: { lte: endDate },
        },
      });
      expect(result).toEqual([]);
    });
  });

  describe('updateNormalizedBillingRecord', () => {
    it('should successfully update an existing record', async () => {
      const updatedData = { cost: 0.0120, tags: { ...mockRecordInput.tags, Status: 'Reviewed' } };
      const updatedRecord = { ...mockNormalizedRecord, ...updatedData };
      mockPrismaClient.normalizedBillingRecord.update.mockResolvedValue(updatedRecord);

      const result = await repository.updateNormalizedBillingRecord(mockNormalizedRecord.id, updatedData);

      expect(mockPrismaClient.normalizedBillingRecord.update).toHaveBeenCalledWith({
        where: { id: mockNormalizedRecord.id },
        data: updatedData,
      });
      expect(result).toEqual(updatedRecord);
    });

    it('should throw an error if the record to update does not exist', async () => {
      const error = new Error('Record not found');
      mockPrismaClient.normalizedBillingRecord.update.mockRejectedValue(error);

      await expect(repository.updateNormalizedBillingRecord('non-existent-id', { cost: 0.05 })).rejects.toThrow(error);
    });
  });

  describe('deleteNormalizedBillingRecord', () => {
    it('should successfully delete a record', async () => {
      mockPrismaClient.normalizedBillingRecord.delete.mockResolvedValue(mockNormalizedRecord);

      const result = await repository.deleteNormalizedBillingRecord(mockNormalizedRecord.id);

      expect(mockPrismaClient.normalizedBillingRecord.delete).toHaveBeenCalledWith({
        where: { id: mockNormalizedRecord.id },
      });
      expect(result).toEqual(mockNormalizedRecord);
    });

    it('should throw an error if the record to delete does not exist', async () => {
      const error = new Error('Record not found');
      mockPrismaClient.normalizedBillingRecord.delete.mockRejectedValue(error);

      await expect(repository.deleteNormalizedBillingRecord('non-existent-id')).rejects.toThrow(error);
    });
  });
});