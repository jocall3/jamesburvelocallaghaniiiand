interface AN_TenantModel {
    id: string;
    name: string;
    slug: string; // Unique identifier for URL/subdomain, e.g., 'my-company'
    domain: string; // Custom domain, e.g., 'app.my-company.com'
    subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
    // Add other tenant-specific properties as needed, e.g.,
    // planId: string;
    // settings: Record<string, any>;
}

// Data Transfer Objects (DTOs) for creating and updating tenants
type CreateTenantDTO = Omit<AN_TenantModel, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateTenantDTO = Partial<Omit<AN_TenantModel, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Data access layer for tenants.
 * Provides methods to interact with the AN_TenantModel, abstracting database operations.
 *
 * In a production environment, this repository would typically interact with an ORM/ODM
 * (e.g., Mongoose, Prisma, TypeORM) to persist and retrieve tenant data from a database.
 * For demonstration, an in-memory array is used to simulate database operations.
 */
export class BN_TenantRepository {
    // In a real application, this would be an ORM client instance (e.g., PrismaClient, Mongoose.Model)
    // For demonstration, we'll use a simple in-memory array to simulate a database.
    private tenants: AN_TenantModel[] = [];

    constructor() {
        // Optionally, initialize with mock data for development/testing
        // this.tenants.push({
        //     id: 'tenant-mock-1',
        //     name: 'Example Corp',
        //     slug: 'example-corp',
        //     domain: 'example.com',
        //     subscriptionStatus: 'active',
        //     createdAt: new Date(),
        //     updatedAt: new Date(),
        // });
    }

    /**
     * Creates a new tenant record in the database.
     * @param tenantData The data for the new tenant.
     * @returns A promise that resolves with the created tenant model.
     */
    async createTenant(tenantData: CreateTenantDTO): Promise<AN_TenantModel> {
        // --- ORM/ODM Integration Examples ---
        // Mongoose: `const newTenant = await AN_TenantModel.create(tenantData);`
        // Prisma: `const newTenant = await prisma.tenant.create({ data: tenantData });`
        // ------------------------------------

        const newTenant: AN_TenantModel = {
            id: `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Generate a unique ID
            ...tenantData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.tenants.push(newTenant);
        return newTenant;
    }

    /**
     * Retrieves a tenant by its unique identifier.
     * @param id The unique ID of the tenant.
     * @returns A promise that resolves with the tenant model or null if not found.
     */
    async getTenantById(id: string): Promise<AN_TenantModel | null> {
        // --- ORM/ODM Integration Examples ---
        // Mongoose: `return await AN_TenantModel.findById(id).exec();`
        // Prisma: `return await prisma.tenant.findUnique({ where: { id } });`
        // ------------------------------------
        return this.tenants.find(tenant => tenant.id === id) || null;
    }

    /**
     * Retrieves a tenant by its unique slug.
     * This is often used for subdomain or URL path identification in multi-tenant applications.
     * @param slug The unique slug of the tenant.
     * @returns A promise that resolves with the tenant model or null if not found.
     */
    async getTenantBySlug(slug: string): Promise<AN_TenantModel | null> {
        // --- ORM/ODM Integration Examples ---
        // Mongoose: `return await AN_TenantModel.findOne({ slug }).exec();`
        // Prisma: `return await prisma.tenant.findUnique({ where: { slug } });`
        // ------------------------------------
        return this.tenants.find(tenant => tenant.slug === slug) || null;
    }

    /**
     * Retrieves a tenant by its custom domain.
     * This is used when tenants have their own custom domains (e.g., mycompany.com instead of myapp.com/mycompany).
     * @param domain The custom domain of the tenant.
     * @returns A promise that resolves with the tenant model or null if not found.
     */
    async getTenantByDomain(domain: string): Promise<AN_TenantModel | null> {
        // --- ORM/ODM Integration Examples ---
        // Mongoose: `return await AN_TenantModel.findOne({ domain }).exec();`
        // Prisma: `return await prisma.tenant.findUnique({ where: { domain } });`
        // ------------------------------------
        return this.tenants.find(tenant => tenant.domain === domain) || null;
    }

    /**
     * Retrieves all tenant records from the database.
     * @returns A promise that resolves with an array of all tenant models.
     */
    async getAllTenants(): Promise<AN_TenantModel[]> {
        // --- ORM/ODM Integration Examples ---
        // Mongoose: `return await AN_TenantModel.find({}).exec();`
        // Prisma: `return await prisma.tenant.findMany();`
        // ------------------------------------
        return [...this.tenants]; // Return a shallow copy to prevent external modification
    }

    /**
     * Updates an existing tenant record.
     * @param id The unique ID of the tenant to update.
     * @param updateData The partial data to update the tenant with.
     * @returns A promise that resolves with the updated tenant model or null if not found.
     */
    async updateTenant(id: string, updateData: UpdateTenantDTO): Promise<AN_TenantModel | null> {
        // --- ORM/ODM Integration Examples ---
        // Mongoose: `return await AN_TenantModel.findByIdAndUpdate(id, updateData, { new: true }).exec();`
        // Prisma: `return await prisma.tenant.update({ where: { id }, data: updateData });`
        // ------------------------------------

        const index = this.tenants.findIndex(tenant => tenant.id === id);
        if (index === -1) {
            return null;
        }

        const updatedTenant: AN_TenantModel = {
            ...this.tenants[index],
            ...updateData,
            updatedAt: new Date(), // Update timestamp on modification
        };
        this.tenants[index] = updatedTenant;
        return updatedTenant;
    }

    /**
     * Deletes a tenant record by its unique ID.
     * @param id The unique ID of the tenant to delete.
     * @returns A promise that resolves to true if the tenant was deleted, false otherwise.
     */
    async deleteTenant(id: string): Promise<boolean> {
        // --- ORM/ODM Integration Examples ---
        // Mongoose: `const result = await AN_TenantModel.findByIdAndDelete(id).exec(); return !!result;`
        // Prisma: `await prisma.tenant.delete({ where: { id } }); return true;` (throws if not found, so wrap in try/catch)
        // ------------------------------------

        const initialLength = this.tenants.length;
        this.tenants = this.tenants.filter(tenant => tenant.id !== id);
        return this.tenants.length < initialLength; // True if an item was removed
    }
}