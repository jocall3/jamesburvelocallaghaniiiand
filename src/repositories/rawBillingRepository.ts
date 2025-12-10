export enum CloudProvider {
  AWS = 'AWS',
  GCP = 'GCP',
  AZURE = 'AZURE',
}

/**
 * Represents a raw billing record as ingested from a cloud provider.
 * This schema is designed to be flexible, storing the original provider-specific
 * data for auditing and detailed analysis without immediate normalization.
 */
export interface RawBillingRecord {
  /**
   * A unique identifier for this raw record within our system.
   * This is typically generated upon ingestion.
   */
  id: string;
  /**
   * The cloud provider from which this billing record originated.
   */
  provider: CloudProvider;
  /**
   * The primary timestamp associated with the billing event itself,
   * as reported by the cloud provider (e.g., usage start time, invoice date).
   */
  timestamp: Date;
  /**
   * The raw, unparsed billing data directly from the cloud provider's API
   * or export. This is typically a JSON object.
   */
  rawData: any;
  /**
   * The timestamp when this record was ingested and stored in our system.
   */
  ingestionDate: Date;
}

// --- Mock Database Implementation (for demonstration/local development) ---
// In a production environment, this would be replaced by a connection to a
// persistent database (e.g., PostgreSQL, MongoDB, DynamoDB, BigQuery).
// The methods below would interact with the ORM/ODM or database client.
const mockDatabase: RawBillingRecord[] = [];

/**
 * Data access layer for storing and retrieving raw billing records from each cloud provider.
 * Primarily used for auditing, detailed analysis, and as the source for normalization processes.
 */
export class RawBillingRepository {
  /**
   * Saves a single raw billing record to the repository.
   * If the record does not have an `id`, a new one will be generated.
   * The `ingestionDate` will always be set to the current time.
   *
   * @param record The raw billing record to save.
   * @returns A promise that resolves with the saved record, including its generated ID and ingestionDate.
   */
  public async saveRawRecord(record: RawBillingRecord): Promise<RawBillingRecord> {
    const recordToSave: RawBillingRecord = {
      ...record,
      id: record.id || `raw-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Simple ID generation
      ingestionDate: new Date(),
    };

    mockDatabase.push(recordToSave);
    // In a real implementation, this would be a database insert operation.
    // e.g., `await this.dbClient.insert(recordToSave);`
    console.log(`[RawBillingRepository] Saved raw record for ${recordToSave.provider} (ID: ${recordToSave.id})`);
    return recordToSave;
  }

  /**
   * Saves multiple raw billing records to the repository in a batch.
   * Each record will have its `id` generated (if not provided) and `ingestionDate` set.
   *
   * @param records An array of raw billing records to save.
   * @returns A promise that resolves with an array of the saved records.
   */
  public async saveRawRecords(records: RawBillingRecord[]): Promise<RawBillingRecord[]> {
    const savedRecords: RawBillingRecord[] = [];
    for (const record of records) {
      savedRecords.push(await this.saveRawRecord(record));
    }
    console.log(`[RawBillingRepository] Saved ${savedRecords.length} raw records in batch.`);
    return savedRecords;
  }

  /**
   * Retrieves raw billing records for a specific cloud provider within a given date range.
   * The date range applies to the `timestamp` field of the billing record.
   *
   * @param provider The cloud provider to filter by.
   * @param startDate The start date for the query (inclusive).
   * @param endDate The end date for the query (inclusive).
   * @returns A promise that resolves with an array of matching raw billing records.
   */
  public async getRawRecords(
    provider: CloudProvider,
    startDate: Date,
    endDate: Date
  ): Promise<RawBillingRecord[]> {
    const filteredRecords = mockDatabase.filter(
      (record) =>
        record.provider === provider &&
        record.timestamp >= startDate &&
        record.timestamp <= endDate
    );
    // In a real implementation, this would be a database query with date range and provider filters.
    // e.g., `await this.dbClient.find({ provider, timestamp: { $gte: startDate, $lte: endDate } });`
    console.log(
      `[RawBillingRepository] Retrieved ${filteredRecords.length} raw records for ${provider} ` +
        `between ${startDate.toISOString()} and ${endDate.toISOString()}`
    );
    return filteredRecords;
  }

  /**
   * Retrieves a single raw billing record by its unique `id`.
   *
   * @param id The unique identifier of the raw billing record.
   * @returns A promise that resolves with the raw billing record if found, otherwise `null`.
   */
  public async getRawRecordById(id: string): Promise<RawBillingRecord | null> {
    const record = mockDatabase.find((r) => r.id === id);
    // In a real implementation, this would be a database query by ID.
    // e.g., `await this.dbClient.findById(id);`
    if (record) {
      console.log(`[RawBillingRepository] Retrieved raw record with ID: ${id}`);
      return record;
    }
    console.log(`[RawBillingRepository] Raw record with ID: ${id} not found.`);
    return null;
  }

  /**
   * Clears all records from the mock database.
   * This method is primarily for testing and should not be used in a production
   * environment with a real persistent database.
   */
  public async clearAllRecords(): Promise<void> {
    mockDatabase.length = 0; // Clears the array
    console.log('[RawBillingRepository] All mock records cleared.');
  }
}