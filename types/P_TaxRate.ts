/**
 * @interface ITaxRate
 * @description Defines the TypeScript interface for a tax rate.
 *              This interface includes essential properties for identifying, displaying,
 *              calculating, and managing tax rates within the application,
 *              such as ID, display name, percentage, and applicable jurisdiction.
 */
export interface ITaxRate {
  /**
   * A unique identifier for the tax rate.
   * This ID can be used for database keys, API endpoints, or internal references.
   * @example "tax_us_ca_sales_2023"
   */
  id: string;

  /**
   * A human-readable name for the tax rate, suitable for display in UIs.
   * @example "California State Sales Tax"
   */
  displayName: string;

  /**
   * The actual tax rate expressed as a decimal percentage.
   * For example, 0.075 represents 7.5%.
   * Must be a non-negative number.
   */
  percentage: number;

  /**
   * The geographical or political jurisdiction to which this tax rate applies.
   * This could be a country code, state code, region, or a custom identifier.
   * @example "US-CA", "EU", "Global", "Canada-ON"
   */
  jurisdiction: string;

  /**
   * An optional, more detailed description of the tax rate, its purpose, or specific conditions.
   */
  description?: string;

  /**
   * A boolean indicating whether this tax rate is currently active and should be applied.
   * Useful for enabling/disabling tax rates without deleting them.
   */
  isActive: boolean;

  /**
   * The date from which this tax rate becomes effective.
   * Stored as an ISO 8601 string (e.g., "YYYY-MM-DDTHH:mm:ssZ").
   */
  effectiveDate: string;

  /**
   * The date until which this tax rate is effective.
   * If null or undefined, the tax rate is considered effective indefinitely from its effectiveDate.
   * Stored as an ISO 8601 string (e.g., "YYYY-MM-DDTHH:mm:ssZ").
   */
  endDate?: string;

  /**
   * Optional metadata associated with the tax rate, allowing for flexible extension.
   * This could include specific tax codes, categories, or external system IDs.
   */
  metadata?: { [key: string]: any };
}