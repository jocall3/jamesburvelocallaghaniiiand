export interface ProductSubscriptionPlan {
    id: string;
    name: string; // e.g., "Basic Monthly", "Premium Yearly"
    price: number; // Price in a base unit (e.g., USD cents, or actual USD)
    currency: string; // e.g., "USD", "EUR"
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number; // e.g., 1 for "monthly", 3 for "quarterly"
    features: string[]; // List of features included in this plan
    isTrialAvailable: boolean;
    trialPeriodDays?: number;
    stripePriceId?: string; // Optional: ID from a payment gateway like Stripe
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Product {
    id: string;
    name: string; // Name of the app
    slug: string; // URL-friendly identifier, unique
    description: string;
    shortDescription?: string;
    iconUrl?: string;
    bannerUrl?: string;
    category: string; // e.g., "Productivity", "Utility", "Entertainment"
    status: 'draft' | 'published' | 'archived';
    developerId: string; // ID of the developer/creator of the app
    subscriptionPlans: ProductSubscriptionPlan[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductListOptions {
    page?: number;
    limit?: number;
    category?: string;
    status?: 'draft' | 'published' | 'archived';
    search?: string; // Search by product name or description
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

export interface CC_ProductRepositoryInterface {
    findMany(options: ProductListOptions): Promise<Product[]>;
    findById(productId: string): Promise<Product | null>;
    findBySlug(slug: string): Promise<Product | null>;
}

export class ProductNotFoundError extends Error {
    constructor(identifier: string, type: 'id' | 'slug' = 'id') {
        super(`Product with ${type} "${identifier}" not found.`);
        this.name = 'ProductNotFoundError';
    }
}

export class InvalidProductListOptionsError extends Error {
    constructor(message: string) {
        super(`Invalid product list options: ${message}`);
        this.name = 'InvalidProductListOptionsError';
    }
}

/**
 * Business logic for product catalog management.
 * Implements AE14 (listing products) and AE15 (retrieving product details).
 */
export class CC_ProductService {
    private productRepository: CC_ProductRepositoryInterface;

    constructor(productRepository: CC_ProductRepositoryInterface) {
        if (!productRepository) {
            throw new Error("Product repository must be provided to CC_ProductService.");
        }
        this.productRepository = productRepository;
    }

    /**
     * AE14: Lists products based on provided criteria.
     * This method handles business logic related to fetching a collection of products.
     * It can include filtering, pagination, and sorting.
     *
     * @param options Optional parameters for filtering, pagination, and sorting.
     * @returns A promise that resolves to an array of products.
     * @throws {InvalidProductListOptionsError} if options are invalid.
     * @throws {Error} for other unexpected errors during retrieval.
     */
    public async listProducts(options: ProductListOptions = {}): Promise<Product[]> {
        // Basic validation for options
        if (options.page !== undefined && (options.page < 1 || !Number.isInteger(options.page))) {
            throw new InvalidProductListOptionsError("Page number must be a positive integer.");
        }
        if (options.limit !== undefined && (options.limit < 1 || !Number.isInteger(options.limit))) {
            throw new InvalidProductListOptionsError("Limit must be a positive integer.");
        }
        if (options.sortBy && !['name', 'createdAt', 'updatedAt'].includes(options.sortBy)) {
            throw new InvalidProductListOptionsError("Invalid sortBy field.");
        }
        if (options.sortOrder && !['asc', 'desc'].includes(options.sortOrder)) {
            throw new InvalidProductListOptionsError("Invalid sortOrder.");
        }
        if (options.status && !['draft', 'published', 'archived'].includes(options.status)) {
            throw new InvalidProductListOptionsError("Invalid product status.");
        }

        try {
            // Business rule: By default, only list 'published' products for public access
            // unless a specific status is requested (e.g., by an admin).
            const effectiveOptions = { ...options };
            if (!effectiveOptions.status) {
                effectiveOptions.status = 'published';
            }

            const products = await this.productRepository.findMany(effectiveOptions);

            // Further business logic: Filter out inactive plans for listed products
            return products.map(product => ({
                ...product,
                subscriptionPlans: product.subscriptionPlans.filter(plan => plan.isActive)
            }));
        } catch (error) {
            console.error(`Error listing products with options ${JSON.stringify(options)}:`, error);
            if (error instanceof InvalidProductListOptionsError) {
                throw error;
            }
            throw new Error("Failed to retrieve product list due to an internal error.");
        }
    }

    /**
     * AE15: Retrieves detailed information for a single product by its ID.
     * This method handles business logic related to fetching a specific product.
     *
     * @param productId The unique identifier of the product.
     * @returns A promise that resolves to the product.
     * @throws {ProductNotFoundError} if the product with the given ID does not exist.
     * @throws {Error} for other unexpected errors during retrieval.
     */
    public async getProductById(productId: string): Promise<Product> {
        if (!productId) {
            throw new Error("Product ID must be provided.");
        }

        try {
            const product = await this.productRepository.findById(productId);

            if (!product) {
                throw new ProductNotFoundError(productId, 'id');
            }

            // Business logic: Ensure only active subscription plans are returned for a published product.
            // If the product is in draft/archived, all plans might be returned for administrative purposes,
            // but for a public-facing service, we'd typically filter.
            if (product.status === 'published') {
                product.subscriptionPlans = product.subscriptionPlans.filter(plan => plan.isActive);
            }

            return product;
        } catch (error) {
            if (error instanceof ProductNotFoundError) {
                throw error;
            }
            console.error(`Error retrieving product with ID ${productId}:`, error);
            throw new Error(`Failed to retrieve product details for ID ${productId} due to an internal error.`);
        }
    }

    /**
     * Retrieves detailed information for a single product by its slug.
     * This is particularly useful for user-facing URLs (e.g., /apps/my-awesome-app).
     *
     * @param slug The URL-friendly identifier of the product.
     * @returns A promise that resolves to the product.
     * @throws {ProductNotFoundError} if the product with the given slug does not exist.
     * @throws {Error} for other unexpected errors during retrieval.
     */
    public async getProductBySlug(slug: string): Promise<Product> {
        if (!slug) {
            throw new Error("Product slug must be provided.");
        }

        try {
            const product = await this.productRepository.findBySlug(slug);

            if (!product) {
                throw new ProductNotFoundError(slug, 'slug');
            }

            // Apply similar business logic as getProductById
            if (product.status === 'published') {
                product.subscriptionPlans = product.subscriptionPlans.filter(plan => plan.isActive);
            }

            return product;
        } catch (error) {
            if (error instanceof ProductNotFoundError) {
                throw error;
            }
            console.error(`Error retrieving product with slug ${slug}:`, error);
            throw new Error(`Failed to retrieve product details for slug ${slug} due to an internal error.`);
        }
    }
}