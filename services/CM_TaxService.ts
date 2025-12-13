import { v4 as uuidv4 } from 'uuid';

// --- Interfaces ---

/**
 * Represents a single tax rate configuration.
 */
interface TaxRate {
    id: string;
    name: string;
    rate: number; // e.g., 0.05 for 5%
    region: string; // e.g., "US-CA", "US", "EU", "GLOBAL" - supports hierarchical matching
    productType?: string; // Optional, e.g., "DIGITAL", "PHYSICAL"
    effectiveDate: Date;
    expirationDate?: Date; // Optional end date for the rate's validity
    priority: number; // Higher priority rates take precedence in case of ties
    isActive: boolean; // Whether the tax rate is currently active
    description?: string;
}

/**
 * Defines criteria for filtering tax rates.
 */
interface TaxRateFilter {
    region?: string;
    productType?: string;
    isActive?: boolean;
    effectiveDateBefore?: Date;
        effectiveDateAfter?: Date;
}

/**
 * Details of a single tax rate applied during a calculation.
 */
interface AppliedTaxDetail {
    rateId: string;
    rateName: string;
    ratePercentage: number;
    taxableAmount: number;
    calculatedTax: number;
    description?: string;
}

/**
 * The result of a tax calculation for a specific entity.
 */
interface TaxCalculationResult {
    id: string; // Unique ID for this specific calculation record
    entityId: string; // ID of the subscription or invoice this calculation applies to
    entityType: 'subscription' | 'invoice';
    originalAmount: number; // The amount before tax
    currency: string;
    taxAmount: number; // The total calculated tax
    totalAmount: number; // originalAmount + taxAmount
    appliedRates: AppliedTaxDetail[]; // Details of all rates that were applied
    customerLocation: string;
    productType?: string; // The product type used for calculation, if applicable
    calculationDate: Date; // When the calculation was performed
}

/**
 * Represents a subscription object (simplified for tax service context).
 */
interface Subscription {
    id: string;
    customerId: string;
    amount: number; // Base amount before tax
    currency: string;
    customerLocation: string; // e.g., "US-CA"
    productType?: string;
    // ... other subscription details
}

/**
 * Represents an item within an invoice.
 */
interface InvoiceItem {
    description: string;
    amount: number;
    productType?: string;
    quantity?: number;
}

/**
 * Represents an invoice object (simplified for tax service context).
 */
interface Invoice {
    id: string;
    subscriptionId?: string; // Optional, if invoice is not directly tied to a subscription
    customerId: string;
    items: InvoiceItem[];
    totalAmountBeforeTax: number; // Sum of item amounts
    currency: string;
    customerLocation: string;
    // ... other invoice details
}

/**
 * An invoice object augmented with tax details after calculation.
 */
interface InvoiceWithTax extends Invoice {
    taxAmount: number;
    totalAmountAfterTax: number;
    taxDetails: TaxCalculationResult;
}

// --- CM_TaxService Class ---

/**
 * CM_TaxService provides business logic for managing tax rates and applying them
 * to subscriptions and invoices. It implements AE65 (Tax Rate Management),
 * AE66 (Tax Application/Calculation), and AE67 (Tax Reporting/Audit Trail).
 */
class CM_TaxService {
    private taxRates: TaxRate[] = []; // In-memory store for tax rates
    private taxCalculationHistory: TaxCalculationResult[] = []; // In-memory store for audit trail

    constructor() {
        this.seedTaxRates(); // Initialize with some dummy data
    }

    /**
     * Populates the service with initial, dummy tax rate data.
     * In a production environment, this data would be loaded from a persistent store.
     */
    private seedTaxRates() {
        this.taxRates.push(
            {
                id: uuidv4(),
                name: "US Federal Sales Tax",
                rate: 0.05,
                region: "US",
                effectiveDate: new Date("2020-01-01"),
                isActive: true,
                priority: 10,
                description: "Standard US federal sales tax."
            },
            {
                id: uuidv4(),
                name: "California State Sales Tax",
                rate: 0.0725,
                region: "US-CA",
                effectiveDate: new Date("2020-01-01"),
                isActive: true,
                priority: 20,
                description: "California state sales tax."
            },
            {
                id: uuidv4(),
                name: "California Digital Goods Tax",
                rate: 0.08, // Example: higher for digital goods
                region: "US-CA",
                productType: "DIGITAL",
                effectiveDate: new Date("2021-01-01"),
                isActive: true,
                priority: 30,
                description: "California sales tax for digital products."
            },
            {
                id: uuidv4(),
                name: "EU VAT Standard Rate",
                rate: 0.20, // Example average VAT rate
                region: "EU",
                effectiveDate: new Date("2020-01-01"),
                isActive: true,
                priority: 15,
                description: "Standard EU VAT rate."
            },
            {
                id: uuidv4(),
                name: "Global Digital Service Tax",
                rate: 0.03,
                region: "GLOBAL",
                productType: "DIGITAL",
                effectiveDate: new Date("2022-01-01"),
                isActive: true,
                priority: 5,
                description: "A hypothetical global tax for digital services."
            },
            {
                id: uuidv4(),
                name: "Expired Tax Rate",
                rate: 0.01,
                region: "US",
                effectiveDate: new Date("2019-01-01"),
                expirationDate: new Date("2019-12-31"),
                isActive: true,
                priority: 1,
                description: "An expired tax rate (should not be applied)."
            },
            {
                id: uuidv4(),
                name: "Inactive Tax Rate",
                rate: 0.02,
                region: "US",
                effectiveDate: new Date("2020-01-01"),
                isActive: false,
                priority: 1,
                description: "An inactive tax rate (should not be applied)."
            }
        );
    }

    // --- AE65: Manage Tax Rates ---

    /**
     * Adds a new tax rate to the system.
     * @param newRate The tax rate object to add (excluding ID).
     * @returns The added tax rate with a generated ID.
     * @throws Error if the rate data is invalid.
     */
    public addTaxRate(newRate: Omit<TaxRate, 'id'>): TaxRate {
        if (newRate.rate < 0 || newRate.rate > 1) {
            throw new Error("Tax rate must be between 0 and 1 (0% to 100%).");
        }
        if (!newRate.region || newRate.region.trim() === '') {
            throw new Error("Tax rate must specify a region.");
        }
        if (!newRate.effectiveDate) {
            throw new Error("Tax rate must have an effective date.");
        }

        const taxRate: TaxRate = {
            id: uuidv4(),
            ...newRate,
            isActive: newRate.isActive ?? true, // Default to active if not provided
            priority: newRate.priority ?? 0 // Default priority if not provided
        };
        this.taxRates.push(taxRate);
        return taxRate;
    }

    /**
     * Updates an existing tax rate by its ID.
     * @param id The ID of the tax rate to update.
     * @param updates Partial object containing fields to update.
     * @returns The updated tax rate.
     * @throws Error if tax rate not found or updates are invalid.
     */
    public updateTaxRate(id: string, updates: Partial<Omit<TaxRate, 'id'>>): TaxRate {
        const index = this.taxRates.findIndex(rate => rate.id === id);
        if (index === -1) {
            throw new Error(`Tax rate with ID ${id} not found.`);
        }

        if (updates.rate !== undefined && (updates.rate < 0 || updates.rate > 1)) {
            throw new Error("Tax rate must be between 0 and 1 (0% to 100%).");
        }
        if (updates.region !== undefined && updates.region.trim() === '') {
            throw new Error("Tax rate region cannot be empty.");
        }

        this.taxRates[index] = { ...this.taxRates[index], ...updates };
        return this.taxRates[index];
    }

    /**
     * Deletes a tax rate by its ID.
     * @param id The ID of the tax rate to delete.
     * @returns True if the tax rate was found and deleted, false otherwise.
     */
    public deleteTaxRate(id: string): boolean {
        const initialLength = this.taxRates.length;
        this.taxRates = this.taxRates.filter(rate => rate.id !== id);
        return this.taxRates.length < initialLength;
    }

    /**
     * Retrieves a single tax rate by its ID.
     * @param id The ID of the tax rate.
     * @returns The tax rate object or undefined if not found.
     */
    public getTaxRate(id: string): TaxRate | undefined {
        return this.taxRates.find(rate => rate.id === id);
    }

    /**
     * Retrieves all tax rates, optionally filtered by various criteria.
     * @param filter Criteria to filter the tax rates.
     * @returns An array of matching tax rates.
     */
    public getAllTaxRates(filter?: TaxRateFilter): TaxRate[] {
        let filteredRates = [...this.taxRates];
        const now = new Date();

        if (filter) {
            if (filter.region) {
                filteredRates = filteredRates.filter(rate => rate.region === filter.region);
            }
            if (filter.productType) {
                filteredRates = filteredRates.filter(rate => rate.productType === filter.productType);
            }
            if (filter.isActive !== undefined) {
                filteredRates = filteredRates.filter(rate => rate.isActive === filter.isActive);
            }
            if (filter.effectiveDateAfter) {
                filteredRates = filteredRates.filter(rate => rate.effectiveDate >= filter.effectiveDateAfter!);
            }
            if (filter.effectiveDateBefore) {
                filteredRates = filteredRates.filter(rate => rate.effectiveDate <= filter.effectiveDateBefore!);
            }
        }
        return filteredRates;
    }

    // --- AE66: Apply Tax to Subscription/Invoice ---

    /**
     * Finds the best matching tax rates for a given set of criteria.
     * This method implements the core logic for AE66.
     * It prioritizes rates based on:
     * 1. Being active and within their effective date range.
     * 2. Most specific region match (e.g., "US-CA" > "US" > "GLOBAL").
     * 3. Most specific product type match (e.g., "DIGITAL" > undefined).
     * 4. Higher priority value.
     *
     * @param customerLocation The customer's location (e.g., "US-CA").
     * @param productType Optional product type (e.g., "DIGITAL").
     * @param date The date for which to find applicable rates (defaults to current date).
     * @returns An array of applicable tax rates, sorted by best match.
     */
    private findApplicableTaxRates(customerLocation: string, productType?: string, date: Date = new Date()): TaxRate[] {
        const now = date;

        const applicableRates = this.taxRates.filter(rate => {
            const isEffective = rate.effectiveDate <= now && (!rate.expirationDate || rate.expirationDate >= now);
            const isActive = rate.isActive;
            return isEffective && isActive;
        });

        // Filter by region and product type, then sort by specificity and priority
        const matchedRates = applicableRates
            .filter(rate => {
                // Region matching logic:
                // 1. Exact match (e.g., rate.region="US-CA", customerLocation="US-CA")
                // 2. Broader match (e.g., rate.region="US", customerLocation="US-CA")
                // 3. Global match (rate.region="GLOBAL")
                const regionMatches =
                    rate.region === customerLocation ||
                    (customerLocation.startsWith(rate.region + '-') && rate.region !== 'GLOBAL') ||
                    rate.region === 'GLOBAL';

                // Product type matching logic:
                // 1. If no productType is provided in criteria, any rate can match.
                // 2. If rate has no productType, it applies generally.
                // 3. Exact productType match.
                const productTypeMatches =
                    !productType ||
                    !rate.productType ||
                    rate.productType === productType;

                return regionMatches && productTypeMatches;
            })
            .sort((a, b) => {
                // Sort by region specificity (more specific first)
                // "US-CA" (3) > "US" (2) > "GLOBAL" (1)
                const getRegionSpecificity = (region: string, customerLoc: string) => {
                    if (region === customerLoc) return 3;
                    if (customerLoc.startsWith(region + '-')) return 2;
                    if (region === 'GLOBAL') return 1;
                    return 0;
                };
                const regionSpecificityA = getRegionSpecificity(a.region, customerLocation);
                const regionSpecificityB = getRegionSpecificity(b.region, customerLocation);

                if (regionSpecificityA !== regionSpecificityB) {
                    return regionSpecificityB - regionSpecificityA; // Higher specificity first
                }

                // Then by product type specificity (specific product type first)
                // "DIGITAL" (1) > undefined (0)
                const productTypeSpecificityA = (a.productType && productType) ? 1 : 0;
                const productTypeSpecificityB = (b.productType && productType) ? 1 : 0;

                if (productTypeSpecificityA !== productTypeSpecificityB) {
                    return productTypeSpecificityB - productTypeSpecificityA; // Higher specificity first
                }

                // Finally, by priority (higher priority value first)
                return b.priority - a.priority;
            });

        return matchedRates;
    }

    /**
     * Calculates the tax for a given amount based on customer location and product type.
     * This is the core tax calculation method. It applies the single best-matching tax rate.
     * For systems requiring multiple stacked taxes (e.g., state + city), this logic would need
     * to be extended to iterate and sum multiple applicable rates.
     *
     * @param originalAmount The base amount before tax.
     * @param currency The currency of the amount.
     * @param customerLocation The customer's location (e.g., "US-CA").
     * @param entityId The ID of the entity (subscription/invoice) this calculation is for.
     * @param entityType The type of entity ('subscription' or 'invoice').
     * @param productType Optional product type (e.g., "DIGITAL").
     * @returns A TaxCalculationResult object.
     * @throws Error if the original amount is negative.
     */
    public calculateTax(
        originalAmount: number,
        currency: string,
        customerLocation: string,
        entityId: string,
        entityType: 'subscription' | 'invoice',
        productType?: string
    ): TaxCalculationResult {
        if (originalAmount < 0) {
            throw new Error("Original amount cannot be negative.");
        }

        const applicableRates = this.findApplicableTaxRates(customerLocation, productType);

        let totalTaxAmount = 0;
        const appliedDetails: AppliedTaxDetail[] = [];

        // Apply the single best-matching rate.
        if (applicableRates.length > 0) {
            const bestRate = applicableRates[0]; // The first one is the best match due to sorting
            const calculatedTax = originalAmount * bestRate.rate;
            totalTaxAmount += calculatedTax;

            appliedDetails.push({
                rateId: bestRate.id,
                rateName: bestRate.name,
                ratePercentage: bestRate.rate,
                taxableAmount: originalAmount,
                calculatedTax: calculatedTax,
                description: bestRate.description
            });
        }

        const result: TaxCalculationResult = {
            id: uuidv4(),
            entityId,
            entityType,
            originalAmount,
            currency,
            taxAmount: totalTaxAmount,
            totalAmount: originalAmount + totalTaxAmount,
            appliedRates: appliedDetails,
            customerLocation,
            productType,
            calculationDate: new Date(),
        };

        this.recordTaxCalculation(result); // Record for AE67
        return result;
    }

    /**
     * Applies tax to a subscription object.
     * @param subscription The subscription object.
     * @returns The tax calculation result for the subscription.
     */
    public applyTaxToSubscription(subscription: Subscription): TaxCalculationResult {
        return this.calculateTax(
            subscription.amount,
            subscription.currency,
            subscription.customerLocation,
            subscription.id,
            'subscription',
            subscription.productType
        );
    }

    /**
     * Applies tax to an invoice object, calculating tax for each item and summing them up.
     * This assumes that each invoice item might have a different product type and thus
     * potentially different tax rates.
     *
     * @param invoice The invoice object.
     * @returns The invoice object augmented with tax details.
     */
    public applyTaxToInvoice(invoice: Invoice): InvoiceWithTax {
        let totalTaxAmount = 0;
        const allAppliedDetails: AppliedTaxDetail[] = [];

        // Calculate tax for each item in the invoice
        for (const item of invoice.items) {
            const itemTaxResult = this.calculateTax(
                item.amount,
                invoice.currency,
                invoice.customerLocation,
                invoice.id, // Use invoice ID for item-level calculation tracking
                'invoice',
                item.productType
            );
            totalTaxAmount += itemTaxResult.taxAmount;
            // Aggregate applied rates, ensuring no duplicates if the same rate applies to multiple items
            itemTaxResult.appliedRates.forEach(detail => {
                if (!allAppliedDetails.some(ad => ad.rateId === detail.rateId)) {
                    allAppliedDetails.push(detail);
                } else {
                    // If rate already exists, update its taxable amount and calculated tax
                    const existingDetail = allAppliedDetails.find(ad => ad.rateId === detail.rateId)!;
                    existingDetail.taxableAmount += detail.taxableAmount;
                    existingDetail.calculatedTax += detail.calculatedTax;
                }
            });
        }

        const taxCalculationResult: TaxCalculationResult = {
            id: uuidv4(),
            entityId: invoice.id,
            entityType: 'invoice',
            originalAmount: invoice.totalAmountBeforeTax,
            currency: invoice.currency,
            taxAmount: totalTaxAmount,
            totalAmount: invoice.totalAmountBeforeTax + totalTaxAmount,
            appliedRates: allAppliedDetails,
            customerLocation: invoice.customerLocation,
            calculationDate: new Date(),
            // productType is aggregated from items, not a single value for the whole invoice
        };

        this.recordTaxCalculation(taxCalculationResult); // Record for AE67

        return {
            ...invoice,
            taxAmount: totalTaxAmount,
            totalAmountAfterTax: invoice.totalAmountBeforeTax + totalTaxAmount,
            taxDetails: taxCalculationResult,
        };
    }

    // --- AE67: Tax Reporting/Audit Trail ---

    /**
     * Records a tax calculation result for auditing and reporting purposes.
     * In a real application, this would persist to a database.
     * @param result The TaxCalculationResult to record.
     */
    private recordTaxCalculation(result: TaxCalculationResult): void {
        this.taxCalculationHistory.push(result);
    }

    /**
     * Retrieves the tax calculation history for a specific entity (subscription or invoice).
     * @param entityId The ID of the subscription or invoice.
     * @param entityType The type of entity ('subscription' or 'invoice').
     * @returns An array of TaxCalculationResult objects related to the entity.
     */
    public getTaxHistoryForEntity(entityId: string, entityType: 'subscription' | 'invoice'): TaxCalculationResult[] {
        return this.taxCalculationHistory.filter(
            history => history.entityId === entityId && history.entityType === entityType
        );
    }

    /**
     * Retrieves all tax calculation history, optionally filtered by a date range.
     * @param startDate Optional start date for the history (inclusive).
     * @param endDate Optional end date for the history (inclusive).
     * @returns An array of TaxCalculationResult objects.
     */
    public getTaxCalculationHistory(startDate?: Date, endDate?: Date): TaxCalculationResult[] {
        let history = [...this.taxCalculationHistory];
        if (startDate) {
            history = history.filter(calc => calc.calculationDate >= startDate);
        }
        if (endDate) {
            history = history.filter(calc => calc.calculationDate <= endDate);
        }
        return history;
    }
}

// Export a singleton instance of the service for easy access throughout the application.
export const cmTaxService = new CM_TaxService();

// Export interfaces for external use and type checking.
export {
    TaxRate,
    TaxRateFilter,
    AppliedTaxDetail,
    TaxCalculationResult,
    Subscription,
    InvoiceItem,
    Invoice,
    InvoiceWithTax,
};