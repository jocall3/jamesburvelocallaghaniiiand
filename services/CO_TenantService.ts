import { Tenant, AppSubscriptionStatus } from '../types/CO_TenantTypes';
import { CO_TenantRepository } from '../repositories/CO_TenantRepository';
import { CO_AppConfigService } from './CO_AppConfigService';
import { CO_SubscriptionService } from './CO_SubscriptionService';

/**
 * Interface for the Tenant Data Access Layer.
 * Defines the contract for interacting with tenant data storage.
 */
interface ITenantRepository {
    createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'subscriptionStatus'>): Promise<Tenant>;
    getTenantById(tenantId: string): Promise<Tenant | null>;
    getTenantByAppId(appId: string): Promise<Tenant | null>;
    updateTenant(tenantId: string, updates: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'appId' | 'subscriptionStatus'>>): Promise<Tenant | null>;
    deleteTenant(tenantId: string): Promise<boolean>; // Soft delete is usually preferred
    listTenants(): Promise<Tenant[]>;
}

/**
 * Interface for the Application Configuration Service.
 * Defines the contract for managing app-specific configurations for tenants.
 */
interface IAppConfigService {
    createAppConfig(tenantId: string, initialConfig: any): Promise<any>;
    getAppConfig(tenantId: string): Promise<any | null>;
    updateAppConfig(tenantId: string, updates: any): Promise<any | null>;
    // deleteAppConfig(tenantId: string): Promise<boolean>; // Optional, for cleanup
}

/**
 * Interface for the Subscription Management Service.
 * Defines the contract for interacting with subscription statuses and management.
 */
interface ISubscriptionService {
    getSubscriptionStatus(tenantId: string): Promise<AppSubscriptionStatus>;
    // Potentially methods to initiate, update, cancel subscriptions
}

/**
 * CO_TenantService
 *
 * Business logic for managing tenants, including creation, retrieval, and configuration
 * of individual apps. This service orchestrates interactions with the tenant repository,
 * app configuration service, and subscription service.
 */
export class CO_TenantService {
    private tenantRepository: ITenantRepository;
    private appConfigService: IAppConfigService;
    private subscriptionService: ISubscriptionService;

    /**
     * Constructs a new CO_TenantService instance.
     * @param tenantRepository The repository for tenant data.
     * @param appConfigService The service for managing app-specific configurations.
     * @param subscriptionService The service for managing tenant subscriptions.
     */
    constructor(
        tenantRepository: CO_TenantRepository, // Use concrete types for constructor for easier instantiation
        appConfigService: CO_AppConfigService,
        subscriptionService: CO_SubscriptionService
    ) {
        // Cast to interfaces for internal use, ensuring adherence to contracts
        this.tenantRepository = tenantRepository as ITenantRepository;
        this.appConfigService = appConfigService as IAppConfigService;
        this.subscriptionService = subscriptionService as ISubscriptionService;
    }

    /**
     * Creates a new tenant and initializes its associated app configuration.
     * A unique `appId` is generated to link the tenant to its specific application instance.
     * The initial subscription status is determined by the subscription service.
     *
     * @param name The name of the tenant (e.g., "Acme Corp App").
     * @param ownerId The ID of the user who owns this tenant.
     * @param initialAppConfig Optional initial configuration object for the tenant's app.
     * @returns A Promise that resolves to the newly created Tenant object.
     * @throws Error if tenant creation or app config initialization fails.
     */
    public async createTenant(name: string, ownerId: string, initialAppConfig: any = {}): Promise<Tenant> {
        // Generate a unique app ID for this tenant.
        // In a production system, this might use a UUID generator or a more structured ID.
        const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const newTenantData = {
            name,
            ownerId,
            appId, // Link tenant to its specific app instance
            status: 'active', // Default status for a new tenant
            // subscriptionStatus is managed by the subscription service, not directly set on creation
        };

        try {
            // 1. Create the tenant record in the database
            const tenant = await this.tenantRepository.createTenant(newTenantData);
            if (!tenant) {
                throw new Error('Tenant repository failed to return a created tenant.');
            }

            // 2. Initialize app-specific configuration for this tenant
            await this.appConfigService.createAppConfig(tenant.id, initialAppConfig);

            // 3. Get initial subscription status (e.g., 'trial' or 'active' if immediately subscribed)
            tenant.subscriptionStatus = await this.subscriptionService.getSubscriptionStatus(tenant.id);

            console.log(`Tenant '${tenant.name}' (ID: ${tenant.id}, AppID: ${tenant.appId}) created successfully.`);
            return tenant;
        } catch (error) {
            console.error(`Error creating tenant '${name}':`, error);
            throw new Error(`Could not create tenant: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves a tenant by its unique ID.
     * The tenant's current subscription status is also fetched and included.
     *
     * @param tenantId The unique identifier of the tenant.
     * @returns A Promise that resolves to the Tenant object or null if not found.
     * @throws Error if retrieval fails.
     */
    public async getTenantById(tenantId: string): Promise<Tenant | null> {
        try {
            const tenant = await this.tenantRepository.getTenantById(tenantId);
            if (tenant) {
                // Enrich tenant data with current subscription status
                tenant.subscriptionStatus = await this.subscriptionService.getSubscriptionStatus(tenant.id);
            }
            return tenant;
        } catch (error) {
            console.error(`Error retrieving tenant by ID '${tenantId}':`, error);
            throw new Error(`Could not retrieve tenant: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves a tenant by its associated application ID.
     * This is useful for requests coming from a specific app instance.
     * The tenant's current subscription status is also fetched and included.
     *
     * @param appId The unique identifier of the application instance.
     * @returns A Promise that resolves to the Tenant object or null if not found.
     * @throws Error if retrieval fails.
     */
    public async getTenantByAppId(appId: string): Promise<Tenant | null> {
        try {
            const tenant = await this.tenantRepository.getTenantByAppId(appId);
            if (tenant) {
                // Enrich tenant data with current subscription status
                tenant.subscriptionStatus = await this.subscriptionService.getSubscriptionStatus(tenant.id);
            }
            return tenant;
        } catch (error) {
            console.error(`Error retrieving tenant by App ID '${appId}':`, error);
            throw new Error(`Could not retrieve tenant by App ID: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Updates an existing tenant's details.
     * Fields like `id`, `createdAt`, `updatedAt`, `appId`, and `subscriptionStatus` cannot be updated directly via this method.
     *
     * @param tenantId The ID of the tenant to update.
     * @param updates A partial Tenant object containing the fields to update.
     * @returns A Promise that resolves to the updated Tenant object or null if not found.
     * @throws Error if the update operation fails.
     */
    public async updateTenant(tenantId: string, updates: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'appId' | 'subscriptionStatus'>>): Promise<Tenant | null> {
        try {
            const updatedTenant = await this.tenantRepository.updateTenant(tenantId, updates);
            if (updatedTenant) {
                // Re-fetch subscription status as it's not part of the direct update
                updatedTenant.subscriptionStatus = await this.subscriptionService.getSubscriptionStatus(tenantId);
                console.log(`Tenant '${tenantId}' updated successfully.`);
            }
            return updatedTenant;
        } catch (error) {
            console.error(`Error updating tenant '${tenantId}':`, error);
            throw new Error(`Could not update tenant: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Deactivates or "soft deletes" a tenant.
     * In a production system, actual deletion is rare; typically, a tenant's status is changed to 'inactive' or 'suspended'.
     * This method might also trigger cascading effects, such as marking associated app configurations as inactive.
     *
     * @param tenantId The ID of the tenant to deactivate/delete.
     * @returns A Promise that resolves to true if the operation was successful, false otherwise.
     * @throws Error if the deletion operation fails.
     */
    public async deleteTenant(tenantId: string): Promise<boolean> {
        try {
            // In a real system, this would likely be a soft delete (e.g., update tenant status to 'inactive')
            // and might trigger cleanup processes or data archiving.
            const success = await this.tenantRepository.deleteTenant(tenantId); // This method should ideally perform a soft delete
            if (success) {
                // Optionally, also mark app config as inactive or delete it
                // await this.appConfigService.deleteAppConfig(tenantId);
                console.log(`Tenant '${tenantId}' deleted/deactivated successfully.`);
            }
            return success;
        } catch (error) {
            console.error(`Error deleting tenant '${tenantId}':`, error);
            throw new Error(`Could not delete tenant: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves the configuration for a specific tenant's app.
     *
     * @param tenantId The ID of the tenant.
     * @returns A Promise that resolves to the app configuration object or null if not found.
     * @throws Error if retrieval fails.
     */
    public async getTenantAppConfig(tenantId: string): Promise<any | null> {
        try {
            return await this.appConfigService.getAppConfig(tenantId);
        } catch (error) {
            console.error(`Error retrieving app config for tenant '${tenantId}':`, error);
            throw new Error(`Could not retrieve app config: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Updates the configuration for a specific tenant's app.
     *
     * @param tenantId The ID of the tenant.
     * @param updates A partial object containing the fields to update in the app configuration.
     * @returns A Promise that resolves to the updated app configuration object or null if not found.
     * @throws Error if the update operation fails.
     */
    public async updateTenantAppConfig(tenantId: string, updates: any): Promise<any | null> {
        try {
            const updatedConfig = await this.appConfigService.updateAppConfig(tenantId, updates);
            if (updatedConfig) {
                console.log(`App config for tenant '${tenantId}' updated successfully.`);
            }
            return updatedConfig;
        } catch (error) {
            console.error(`Error updating app config for tenant '${tenantId}':`, error);
            throw new Error(`Could not update app config: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves the current subscription status for a tenant.
     * This delegates to the `CO_SubscriptionService`.
     *
     * @param tenantId The ID of the tenant.
     * @returns A Promise that resolves to the `AppSubscriptionStatus` enum value.
     * @throws Error if retrieval of subscription status fails.
     */
    public async getTenantSubscriptionStatus(tenantId: string): Promise<AppSubscriptionStatus> {
        try {
            return await this.subscriptionService.getSubscriptionStatus(tenantId);
        } catch (error) {
            console.error(`Error getting subscription status for tenant '${tenantId}':`, error);
            throw new Error(`Could not get subscription status: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Lists all tenants, enriching each with its current subscription status.
     *
     * @returns A Promise that resolves to an array of Tenant objects.
     * @throws Error if listing tenants fails.
     */
    public async listTenants(): Promise<Tenant[]> {
        try {
            const tenants = await this.tenantRepository.listTenants();
            // For each tenant, fetch and update their subscription status concurrently
            const tenantsWithStatus = await Promise.all(tenants.map(async tenant => {
                tenant.subscriptionStatus = await this.subscriptionService.getSubscriptionStatus(tenant.id);
                return tenant;
            }));
            return tenantsWithStatus;
        } catch (error) {
            console.error('Error listing tenants:', error);
            throw new Error(`Could not list tenants: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}