import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';

// --- Interfaces for Stripe-like objects (simplified for frontend use) ---
interface StripeProduct {
  id?: string; // Existing product ID for editing
  name: string;
  description?: string;
  active?: boolean;
  metadata?: { [key: string]: string };
  tax_code?: string;
}

interface StripePriceTier {
  flat_amount?: number; // amount in cents
  unit_amount?: number; // amount in cents
  up_to?: number | 'inf'; // quantity
}

interface StripePrice {
  id?: string; // Existing price ID for editing
  product_id?: string; // Will be linked after product creation, not directly set by this form
  currency: string;
  unit_amount?: number; // amount in cents for standard/per-unit/metered
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
    usage_type: 'licensed' | 'metered';
    aggregate_usage?: 'sum' | 'last_ever' | 'last_month' | 'max'; // For metered
  };
  type: 'one_time' | 'recurring';
  billing_scheme?: 'per_unit' | 'tiered';
  tiers_mode?: 'graduated' | 'volume'; // For tiered pricing
  tiers?: StripePriceTier[];
  transform_quantity?: { // Not implemented in this form for simplicity
    divide_by: number;
    round: 'up' | 'down';
  };
  metadata?: { [key: string]: string };
  trial_period_days?: number;
}

// --- Form Data Structure ---
interface PlanEditorFormData {
  // Product Fields
  productName: string;
  productDescription: string;
  productTaxCode?: string;
  productMetadata?: string; // JSON string

  // Price Fields
  priceType: 'one_time' | 'recurring';
  currency: string;
  amount: number; // For standard/per-unit/metered, in base units (e.g., dollars)
  billingInterval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  trialPeriodDays?: number;

  // Pricing Model
  pricingModel: 'standard' | 'per_unit' | 'metered' | 'tiered';

  // Metered specific
  meteredUsageType?: 'sum' | 'last_ever' | 'last_month' | 'max';

  // Tiered specific
  tiers?: { upTo: number | 'inf'; unitAmount: number; flatAmount?: number }[];
  tiersMode?: 'graduated' | 'volume';
}

// --- Component Props ---
interface PlanEditorProps {
  initialProduct?: StripeProduct;
  initialPrice?: StripePrice;
  onSave: (product: StripeProduct, price: StripePrice) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

// --- Helper Data ---
const billingIntervalOptions = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const currencyOptions = [
  { value: 'usd', label: 'USD' },
  { value: 'eur', label: 'EUR' },
  { value: 'gbp', label: 'GBP' },
  { value: 'cad', label: 'CAD' },
  { value: 'aud', label: 'AUD' },
  // Add more currencies as needed
];

const pricingModelOptions = [
  { value: 'standard', label: 'Standard (Fixed Price)' },
  { value: 'per_unit', label: 'Per Unit (e.g., Per Seat)' },
  { value: 'metered', label: 'Metered (Usage-based)' },
  { value: 'tiered', label: 'Tiered (Volume-based)' },
];

const meteredUsageTypeOptions = [
  { value: 'sum', label: 'Sum of all usage' },
  { value: 'last_ever', label: 'Last reported usage' },
  { value: 'last_month', label: 'Last month usage' },
  { value: 'max', label: 'Maximum usage' },
];

const tiersModeOptions = [
  { value: 'graduated', label: 'Graduated (Price changes at each tier)' },
  { value: 'volume', label: 'Volume (All units at the tier price)' },
];

const PlanEditor: React.FC<PlanEditorProps> = ({
  initialProduct,
  initialPrice,
  onSave,
  onCancel,
  isLoading,
}) => {
  const getInitialPricingModel = (price?: StripePrice): PlanEditorFormData['pricingModel'] => {
    if (price?.billing_scheme === 'tiered') {
      return 'tiered';
    }
    if (price?.recurring?.usage_type === 'metered') {
      return 'metered';
    }
    // Default to 'standard' if not explicitly tiered or metered.
    // 'per_unit' is functionally similar to 'standard' in terms of form fields,
    // but we can differentiate it if needed. For now, 'standard' covers both simple fixed and per-unit.
    return 'standard';
  };

  const defaultValues: PlanEditorFormData = {
    productName: initialProduct?.name || '',
    productDescription: initialProduct?.description || '',
    productTaxCode: initialProduct?.tax_code || '',
    productMetadata: initialProduct?.metadata ? JSON.stringify(initialProduct.metadata, null, 2) : '',

    priceType: initialPrice?.type || 'recurring',
    currency: initialPrice?.currency || 'usd',
    amount: (initialPrice?.unit_amount || 0) / 100, // Convert cents to base unit
    billingInterval: initialPrice?.recurring?.interval || 'month',
    intervalCount: initialPrice?.recurring?.interval_count || 1,
    trialPeriodDays: initialPrice?.trial_period_days || undefined,

    pricingModel: getInitialPricingModel(initialPrice),

    meteredUsageType: initialPrice?.recurring?.aggregate_usage || 'sum',
    tiers: initialPrice?.tiers?.length
      ? initialPrice.tiers.map(tier => ({
          upTo: tier.up_to === 'inf' ? 'inf' : (tier.up_to || 0),
          unitAmount: (tier.unit_amount || 0) / 100,
          flatAmount: (tier.flat_amount || 0) / 100,
        }))
      : [{ upTo: 1, unitAmount: 0, flatAmount: 0 }], // Default first tier
    tiersMode: initialPrice?.tiers_mode || 'graduated',
  };

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PlanEditorFormData>({
    defaultValues,
  });

  // Watch relevant fields to conditionally render UI
  const priceType = useWatch({ control, name: 'priceType' });
  const pricingModel = useWatch({ control, name: 'pricingModel' });
  const tiers = useWatch({ control, name: 'tiers' }); // This will re-render when tiers array changes

  useEffect(() => {
    reset(defaultValues);
  }, [initialProduct, initialPrice]); // Reset form if initial data changes

  const onSubmit: SubmitHandler<PlanEditorFormData> = async (data) => {
    const product: StripeProduct = {
      id: initialProduct?.id,
      name: data.productName,
      description: data.productDescription,
      tax_code: data.productTaxCode || undefined,
      metadata: data.productMetadata ? JSON.parse(data.productMetadata) : undefined,
      active: true, // Always active on creation/edit
    };

    const price: StripePrice = {
      id: initialPrice?.id,
      currency: data.currency,
      type: data.priceType,
      metadata: initialPrice?.metadata, // Preserve existing metadata if any
      trial_period_days: data.trialPeriodDays || undefined,
    };

    if (data.priceType === 'recurring') {
      price.recurring = {
        interval: data.billingInterval,
        interval_count: data.intervalCount,
        usage_type: data.pricingModel === 'metered' ? 'metered' : 'licensed',
      };
      if (data.pricingModel === 'metered') {
        price.recurring.aggregate_usage = data.meteredUsageType;
      }
    }

    if (data.pricingModel === 'tiered') {
      price.billing_scheme = 'tiered';
      price.tiers_mode = data.tiersMode;
      price.tiers = data.tiers?.map(tier => ({
        up_to: tier.upTo,
        unit_amount: Math.round(tier.unitAmount * 100), // Convert to cents
        flat_amount: tier.flatAmount ? Math.round(tier.flatAmount * 100) : undefined, // Convert to cents
      }));
      // No unit_amount on the price object itself for tiered pricing
    } else {
      // Standard, Per-unit, and Metered all use 'per_unit' billing scheme with a unit_amount
      price.billing_scheme = 'per_unit';
      price.unit_amount = Math.round(data.amount * 100); // Convert to cents
    }

    await onSave(product, price);
  };

  const addTier = () => {
    const currentTiers = getValues('tiers') || [];
    const lastUpTo = currentTiers.length > 0 && currentTiers[currentTiers.length - 1].upTo !== 'inf'
      ? (currentTiers[currentTiers.length - 1].upTo as number) + 1
      : 1;
    setValue('tiers', [...currentTiers, { upTo: lastUpTo, unitAmount: 0, flatAmount: 0 }]);
  };

  const removeTier = (index: number) => {
    const currentTiers = getValues('tiers') || [];
    setValue('tiers', currentTiers.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {initialProduct ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
      </h2>

      {/* Product Details */}
      <section className="border-b pb-4 mb-4">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Product Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Product Name</label>
            <Controller
              name="productName"
              control={control}
              rules={{ required: 'Product Name is required' }}
              render={({ field }) => (
                <input
                  {...field}
                  id="productName"
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            />
            {errors.productName && <p className="mt-1 text-sm text-red-600">{errors.productName.message}</p>}
          </div>
          <div>
            <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <Controller
              name="productDescription"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="productDescription"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              )}
            />
          </div>
          <div>
            <label htmlFor="productTaxCode" className="block text-sm font-medium text-gray-700">Tax Code (Optional)</label>
            <Controller
              name="productTaxCode"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="productTaxCode"
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., txcd_20030000"
                />
              )}
            />
          </div>
          <div>
            <label htmlFor="productMetadata" className="block text-sm font-medium text-gray-700">Metadata (JSON, Optional)</label>
            <Controller
              name="productMetadata"
              control={control}
              rules={{
                validate: (value) => {
                  if (!value) return true;
                  try {
                    JSON.parse(value);
                    return true;
                  } catch (e) {
                    return 'Invalid JSON format';
                  }
                },
              }}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="productMetadata"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder='{"key": "value"}'
                ></textarea>
              )}
            />
            {errors.productMetadata && <p className="mt-1 text-sm text-red-600">{errors.productMetadata.message}</p>}
          </div>
        </div>
      </section>

      {/* Price Details */}
      <section className="border-b pb-4 mb-4">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Pricing Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price Type</label>
            <div className="mt-1 flex space-x-4">
              <Controller
                name="priceType"
                control={control}
                render={({ field }) => (
                  <>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        {...field}
                        value="recurring"
                        checked={field.value === 'recurring'}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">Recurring</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        {...field}
                        value="one_time"
                        checked={field.value === 'one_time'}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">One-time</span>
                    </label>
                  </>
                )}
              />
            </div>
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
            <Controller
              name="currency"
              control={control}
              rules={{ required: 'Currency is required' }}
              render={({ field }) => (
                <select
                  {...field}
                  id="currency"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              )}
            />
            {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>}
          </div>
        </div>

        {priceType === 'recurring' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="billingInterval" className="block text-sm font-medium text-gray-700">Billing Interval</label>
              <Controller
                name="billingInterval"
                control={control}
                rules={{ required: 'Billing interval is required' }}
                render={({ field }) => (
                  <select
                    {...field}
                    id="billingInterval"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {billingIntervalOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                )}
              />
              {errors.billingInterval && <p className="mt-1 text-sm text-red-600">{errors.billingInterval.message}</p>}
            </div>
            <div>
              <label htmlFor="intervalCount" className="block text-sm font-medium text-gray-700">Interval Count</label>
              <Controller
                name="intervalCount"
                control={control}
                rules={{
                  required: 'Interval count is required',
                  min: { value: 1, message: 'Must be at least 1' },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    id="intervalCount"
                    type="number"
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
              {errors.intervalCount && <p className="mt-1 text-sm text-red-600">{errors.intervalCount.message}</p>}
            </div>
            <div>
              <label htmlFor="trialPeriodDays" className="block text-sm font-medium text-gray-700">Trial Period (Days, Optional)</label>
              <Controller
                name="trialPeriodDays"
                control={control}
                rules={{ min: { value: 0, message: 'Cannot be negative' } }}
                render={({ field }) => (
                  <input
                    {...field}
                    id="trialPeriodDays"
                    type="number"
                    min="0"
                    placeholder="e.g., 7"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
              {errors.trialPeriodDays && <p className="mt-1 text-sm text-red-600">{errors.trialPeriodDays.message}</p>}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Pricing Model</label>
          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
            {pricingModelOptions.map((option) => (
              <label key={option.value} className="inline-flex items-center border border-gray-200 rounded-md p-3 cursor-pointer hover:bg-gray-50">
                <Controller
                  name="pricingModel"
                  control={control}
                  rules={{ required: 'Pricing model is required' }}
                  render={({ field }) => (
                    <input
                      type="radio"
                      {...field}
                      value={option.value}
                      checked={field.value === option.value}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                  )}
                />
                <span className="ml-2 text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.pricingModel && <p className="mt-1 text-sm text-red-600">{errors.pricingModel.message}</p>}
        </div>

        {/* Conditional Pricing Model Fields */}
        {(pricingModel === 'standard' || pricingModel === 'per_unit' || pricingModel === 'metered') ? (
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              {pricingModel === 'standard' ? 'Price Amount' : pricingModel === 'per_unit' ? 'Unit Amount' : 'Price per Unit of Usage'} ({getValues('currency').toUpperCase()})
            </label>
            <Controller
              name="amount"
              control={control}
              rules={{
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
          </div>
        ) : null}

        {pricingModel === 'metered' && priceType === 'recurring' ? (
          <div className="mb-4">
            <label htmlFor="meteredUsageType" className="block text-sm font-medium text-gray-700">Aggregate Usage</label>
            <Controller
              name="meteredUsageType"
              control={control}
              rules={{ required: 'Aggregate usage type is required for metered pricing' }}
              render={({ field }) => (
                <select
                  {...field}
                  id="meteredUsageType"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {meteredUsageTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              )}
            />
            {errors.meteredUsageType && <p className="mt-1 text-sm text-red-600">{errors.meteredUsageType.message}</p>}
            <p className="mt-2 text-sm text-gray-500">
              For metered pricing, you will report usage to Stripe. The price is per unit of usage.
            </p>
          </div>
        ) : null}

        {pricingModel === 'tiered' ? (
          <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h4 className="text-lg font-medium text-gray-700 mb-3">Tiered Pricing Configuration</h4>
            <div className="mb-4">
              <label htmlFor="tiersMode" className="block text-sm font-medium text-gray-700">Tiers Mode</label>
              <Controller
                name="tiersMode"
                control={control}
                rules={{ required: 'Tiers mode is required for tiered pricing' }}
                render={({ field }) => (
                  <select
                    {...field}
                    id="tiersMode"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {tiersModeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                )}
              />
              {errors.tiersMode && <p className="mt-1 text-sm text-red-600">{errors.tiersMode.message}</p>}
            </div>

            <div className="space-y-3">
              {tiers?.map((tier, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-end space-y-2 sm:space-y-0 sm:space-x-2 p-2 border border-gray-200 rounded-md bg-white">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-600">Up To Quantity</label>
                    <Controller
                      name={`tiers.${index}.upTo`}
                      control={control}
                      rules={{
                        required: 'Up to quantity is required',
                        validate: (value) => {
                          if (value === 'inf') return true;
                          if (typeof value !== 'number' || isNaN(value)) return 'Must be a number or "inf"';
                          if (value <= 0) return 'Must be greater than 0';
                          // Optional: Add validation for sequential tiers (e.g., current tier's upTo > previous tier's upTo)
                          return true;
                        }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text" // Use text to allow 'inf'
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            field.onChange(val === 'inf' ? 'inf' : parseFloat(val));
                          }}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                          placeholder="e.g., 10 or inf"
                        />
                      )}
                    />
                    {errors.tiers?.[index]?.upTo && <p className="mt-1 text-xs text-red-600">{errors.tiers[index]?.upTo?.message}</p>}
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-600">Unit Amount ({getValues('currency').toUpperCase()})</label>
                    <Controller
                      name={`tiers.${index}.unitAmount`}
                      control={control}
                      rules={{
                        required: 'Unit amount is required',
                        min: { value: 0, message: 'Cannot be negative' },
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                        />
                      )}
                    />
                    {errors.tiers?.[index]?.unitAmount && <p className="mt-1 text-xs text-red-600">{errors.tiers[index]?.unitAmount?.message}</p>}
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-600">Flat Fee ({getValues('currency').toUpperCase()}, Optional)</label>
                    <Controller
                      name={`tiers.${index}.flatAmount`}
                      control={control}
                      rules={{ min: { value: 0, message: 'Cannot be negative' } }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                        />
                      )}
                    />
                    {errors.tiers?.[index]?.flatAmount && <p className="mt-1 text-xs text-red-600">{errors.tiers[index]?.flatAmount?.message}</p>}
                  </div>
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTier(index)}
                      className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addTier}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Add Tier
            </button>
          </div>
        ) : null}
      </section>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (initialProduct ? 'Update Plan' : 'Create Plan')}
        </button>
      </div>
    </form>
  );
};

export default PlanEditor;