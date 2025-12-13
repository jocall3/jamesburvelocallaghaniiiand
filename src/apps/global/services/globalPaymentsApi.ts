import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

/**
 * Represents a currency with its code, name, and symbol.
 */
export interface Currency {
  code: string; // e.g., "USD", "EUR"
  name: string; // e.g., "United States Dollar", "Euro"
  symbol: string; // e.g., "$", "€"
  decimal_digits: number; // e.g., 2
  rounding: number; // e.g., 0
}

/**
 * Represents an exchange rate between two currencies.
 */
export interface ExchangeRate {
  from_currency: string; // e.g., "USD"
  to_currency: string; // e.g., "EUR"
  rate: number; // e.g., 0.85
  last_updated: string; // ISO 8601 timestamp
}

/**
 * Represents a tax rate applicable to a specific country or region.
 */
export interface TaxRate {
  country_code: string; // e.g., "US", "DE"
  region_code?: string; // e.g., "CA" for California, "BY" for Bavaria
  tax_type: 'VAT' | 'GST' | 'Sales Tax' | 'Other';
  rate: number; // e.g., 0.20 for 20%
  description: string; // e.g., "Standard VAT rate"
  effective_date: string; // ISO 8601 timestamp
  is_default: boolean; // True if this is the default rate for the country/region
}

/**
 * Represents a country with its code, name, and supported currencies.
 */
export interface Country {
  code: string; // e.g., "US"
  name: string; // e.g., "United States"
  currencies: string[]; // Array of currency codes supported, e.g., ["USD"]
  tax_regimes: string[]; // Array of tax types applicable, e.g., ["VAT", "Sales Tax"]
}

/**
 * Configuration options for the GlobalPaymentsApi.
 */
export interface GlobalPaymentsApiConfig {
  baseUrl: string; // Base URL for the global payments API
  apiKey: string; // API key for authentication
  timeout?: number; // Request timeout in milliseconds
}

/**
 * A service layer for fetching data related to international payments, currencies, and tax.
 * This API is designed to be a mock or a wrapper around a hypothetical external global payments service.
 */
export class GlobalPaymentsApi {
  private api: AxiosInstance;
  private apiKey: string;

  constructor(config: GlobalPaymentsApiConfig) {
    if (!config.baseUrl) {
      throw new Error('GlobalPaymentsApi: baseUrl is required.');
    }
    if (!config.apiKey) {
      throw new Error('GlobalPaymentsApi: apiKey is required.');
    }

    this.apiKey = config.apiKey;
    this.api = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 10000, // Default to 10 seconds
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`, // Example authorization header
      },
    });

    // Optional: Add request/response interceptors for logging or error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('GlobalPaymentsApi request failed:', error.message, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetches a list of all supported currencies.
   * @returns A promise that resolves to an array of Currency objects.
   */
  public async getSupportedCurrencies(): Promise<Currency[]> {
    try {
      const response: AxiosResponse<{ currencies: Currency[] }> = await this.api.get('/currencies');
      return response.data.currencies;
    } catch (error) {
      console.error('Error fetching supported currencies:', error);
      throw error;
    }
  }

  /**
   * Fetches details for a specific currency.
   * @param currencyCode The 3-letter ISO currency code (e.g., "USD").
   * @returns A promise that resolves to a Currency object.
   */
  public async getCurrencyDetails(currencyCode: string): Promise<Currency> {
    try {
      const response: AxiosResponse<Currency> = await this.api.get(`/currencies/${currencyCode}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for currency ${currencyCode}:`, error);
      throw error;
    }
  }

  /**
   * Fetches the latest exchange rate between two currencies.
   * @param fromCurrencyCode The source currency code.
   * @param toCurrencyCode The target currency code.
   * @returns A promise that resolves to an ExchangeRate object.
   */
  public async getExchangeRate(fromCurrencyCode: string, toCurrencyCode: string): Promise<ExchangeRate> {
    try {
      const response: AxiosResponse<ExchangeRate> = await this.api.get(`/exchange-rates`, {
        params: { from: fromCurrencyCode, to: toCurrencyCode },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching exchange rate from ${fromCurrencyCode} to ${toCurrencyCode}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a list of all supported countries and their payment/tax capabilities.
   * @returns A promise that resolves to an array of Country objects.
   */
  public async getSupportedCountries(): Promise<Country[]> {
    try {
      const response: AxiosResponse<{ countries: Country[] }> = await this.api.get('/countries');
      return response.data.countries;
    } catch (error) {
      console.error('Error fetching supported countries:', error);
      throw error;
    }
  }

  /**
   * Fetches tax rates for a specific country and optionally a region.
   * @param countryCode The 2-letter ISO country code (e.g., "DE").
   * @param regionCode Optional. The region code (e.g., "BY" for Bavaria in Germany).
   * @returns A promise that resolves to an array of TaxRate objects.
   */
  public async getTaxRates(countryCode: string, regionCode?: string): Promise<TaxRate[]> {
    try {
      const params: { country_code: string; region_code?: string } = { country_code: countryCode };
      if (regionCode) {
        params.region_code = regionCode;
      }
      const response: AxiosResponse<{ tax_rates: TaxRate[] }> = await this.api.get('/tax-rates', { params });
      return response.data.tax_rates;
    } catch (error) {
      console.error(`Error fetching tax rates for ${countryCode}${regionCode ? `/${regionCode}` : ''}:`, error);
      throw error;
    }
  }

  /**
   * Calculates the final amount after applying relevant taxes for a given transaction.
   * This is a hypothetical endpoint that would typically involve more complex logic on the backend.
   * @param amount The base amount in the specified currency.
   * @param currencyCode The currency of the amount.
   * @param countryCode The country where the transaction occurs.
   * @param regionCode Optional. The region where the transaction occurs.
   * @param productType Optional. A category for the product/service (e.g., "digital", "physical", "service").
   * @returns A promise that resolves to an object containing the original amount, total tax, and final amount.
   */
  public async calculateTaxedAmount(
    amount: number,
    currencyCode: string,
    countryCode: string,
    regionCode?: string,
    productType?: string
  ): Promise<{ original_amount: number; total_tax_amount: number; final_amount: number; applied_taxes: TaxRate[] }> {
    try {
      const response: AxiosResponse<{
        original_amount: number;
        total_tax_amount: number;
        final_amount: number;
        applied_taxes: TaxRate[];
      }> = await this.api.post('/calculate-tax', {
        amount,
        currency_code: currencyCode,
        country_code: countryCode,
        region_code: regionCode,
        product_type: productType,
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating taxed amount:', error);
      throw error;
    }
  }

  /**
   * Converts an amount from one currency to another using the latest exchange rates.
   * @param amount The amount to convert.
   * @param fromCurrencyCode The currency of the amount to convert.
   * @param toCurrencyCode The target currency.
   * @returns A promise that resolves to an object containing the converted amount and the applied exchange rate.
   */
  public async convertCurrency(
    amount: number,
    fromCurrencyCode: string,
    toCurrencyCode: string
  ): Promise<{ original_amount: number; from_currency: string; converted_amount: number; to_currency: string; exchange_rate: ExchangeRate }> {
    try {
      const response: AxiosResponse<{
        original_amount: number;
        from_currency: string;
        converted_amount: number;
        to_currency: string;
        exchange_rate: ExchangeRate;
      }> = await this.api.post('/convert-currency', {
        amount,
        from_currency: fromCurrencyCode,
        to_currency: toCurrencyCode,
      });
      return response.data;
    } catch (error) {
      console.error(`Error converting ${amount} ${fromCurrencyCode} to ${toCurrencyCode}:`, error);
      throw error;
    }
  }
}