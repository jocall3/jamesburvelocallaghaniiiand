/**
 * @file types/T_Tenant.ts
 * @description Defines the TypeScript interface for a tenant (representing an individual app/company),
 *              including ID, name, domain, and configuration settings. Crucial for multi-tenancy.
 */

/**
 * Represents a single tenant (an individual app or company) within the multi-tenant system.
 * Each tenant has its own unique identity, domain, and specific configuration.
 * This interface is fundamental for managing the 500 individual apps mentioned in the project goal.
 */
export interface T_Tenant {
  /**
   * A unique identifier for the tenant.
   * This could be a UUID, a database ID, or a unique slug.
   * Example: 'tenant_123abc'
   */
  id: string;

  /**
   * The human-readable name of the tenant (e.g., "Acme Corp App", "My SaaS Product").
   * This name might be displayed in administrative interfaces or public-facing pages.
   */
  name: string;

  /**
   * The primary domain associated with this tenant.
   * This is often used for routing requests to the correct tenant (e.g., via subdomain or custom domain).
   * Example: 'app.acmecorp.com' or 'acmecorp.com'
   */
  domain: string;

  /**
   * An optional, flexible object to store various configuration settings specific to this tenant.
   * This could include API keys, feature flags, branding settings, custom themes,
   * integration settings, or any other tenant-specific parameters.
   */
  config?: Record<string, any>;

  /**
   * The current status of the tenant.
   * - 'active': The tenant is fully operational and accessible.
   * - 'inactive': The tenant is temporarily disabled or not yet fully set up.
   * - 'suspended': The tenant's service has been suspended, possibly due to payment issues or policy violations.
   * - 'deleted': The tenant has been marked for deletion or is in a soft-deleted state.
   */
  status: 'active' | 'inactive' | 'suspended' | 'deleted';

  /**
   * The date and time when the tenant record was created.
   */
  createdAt: Date;

  /**
   * The date and time when the tenant record was last updated.
   */
  updatedAt: Date;

  /**
   * Optional: A brief description of the tenant or the app it represents.
   */
  description?: string;

  /**
   * Optional: The ID of the subscription plan currently active for this tenant.
   * This links the tenant to its billing and feature entitlements.
   */
  subscriptionPlanId?: string;
}