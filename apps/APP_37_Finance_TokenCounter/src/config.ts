/*
 * Copyright 2024 M Corp
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
*
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file This file defines the core configuration for the TokenCounter application.
 * It includes pricing models for various AI providers, currency information, and
 * the data structures necessary to represent complex billing schemes.
 *
 * NOTE: All pricing data is for illustrative purposes and may not be up-to-date.
 * In a production environment, this data should be sourced from a dynamic,
 * reliable source and updated frequently. This system is designed to be fed
 * by a pricing intelligence service.
 */

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
}

export enum Provider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Google = 'google',
  Mistral = 'mistral',
  Cohere = 'cohere',
  AmazonBedrock = 'amazon_bedrock',
  HuggingFace = 'huggingface',
  StabilityAI = 'stability_ai',
  ElevenLabs = 'elevenlabs',
  Custom = 'custom', // For fine-tuned or self-hosted models
  Unknown = 'unknown',
}

export enum PricingUnit {
  // Text-based units
  PerToken = 'per_token',
  PerCharacter = 'per_character',
  PerKiloToken = 'per_kilo_token', // 1,000 tokens
  PerMegaToken = 'per_mega_token', // 1,000,000 tokens

  // Image-based units
  PerImage = 'per_image',
  PerPixel = 'per_pixel',
  PerMegaPixel = 'per_megapixel',

  // Audio/Video units
  PerSecond = 'per_second',
  PerMinute = 'per_minute',

  // Time-based units (for provisioned throughput, etc.)
  PerHour = 'per_hour',
  PerInstanceHour = 'per_instance_hour',

  // Request-based units
  PerRequest = 'per_request',
  PerKiloRequest = 'per_kilo_request',
}

/**
 * Represents the pricing for a specific dimension of a model's usage.
 * The tension between standardization and specificity is captured here. We try to
 * create a common structure, but acknowledge that providers have unique billing models.
 */
export interface Rate {
  unit: PricingUnit;
  price: number; // Price in the base currency (e.g., USD)
  quantity?: number; // The number of units the price applies to (e.g., price is for 1,000,000 tokens)
}

/**
 * Pricing model for standard language models with distinct input and output costs.
 */
export interface PerTokenPricing {
  type: 'per_token';
  input: Rate;
  output: Rate;
  contextWindowTokens: number;
}

/**
 * Pricing model for embedding models.
 */
export interface EmbeddingPricing {
  type: 'embedding';
  usage: Rate;
  outputDimensions: number;
}

/**
 * Pricing model for image generation models. Can have complex, tiered pricing.
 */
export interface ImagePricing {
  type: 'image';
  // Example: { '1024x1024_standard': Rate, '1024x1024_hd': Rate }
  rates: Record<string, Rate>;
}

/**
 * Pricing model for audio generation or transcription.
 */
export interface AudioPricing {
  type: 'audio';
  // Example: { 'generation': Rate, 'transcription': Rate }
  rates: Record<string, Rate>;
}

/**
 * Pricing model for fine-tuning jobs. Often involves a base cost plus usage.
 */
export interface FineTuningPricing {
  type: 'fine_tuning';
  baseJobCost: number; // A flat fee for initiating a job
  training: Rate; // e.g., per token-hour
  hosting?: Rate; // e.g., per instance-hour for custom deployments
}

/**
 * A union of all possible pricing models. This allows for extensibility.
 * As new, exotic billing models emerge, they can be added here.
 */
export type ModelPricing =
  | PerTokenPricing
  | EmbeddingPricing
  | ImagePricing
  | AudioPricing
  | FineTuningPricing;

export interface ModelPricingInfo {
  modelId: string; // The canonical model identifier (e.g., 'gpt-4o')
  provider: Provider;
  pricing: ModelPricing;
  notes?: string; // Any special conditions or notes about the pricing.
}

export type ProviderPricingMap = Record<string, ModelPricingInfo>;

export interface CurrencyRates {
  base: Currency;
  lastUpdated: string; // ISO 8601 timestamp
  rates: {
    [key in Currency]?: number;
  };
}

/**
 * The main configuration object for the TokenCounter service.
 * This structure is designed to be serializable (e.g., from JSON or YAML)
 * and can be replaced by a dynamic configuration provider in a production setup.
 */
export interface TokenCounterConfig {
  baseCurrency: Currency;
  currencyRates: CurrencyRates;
  modelPricing: Record<Provider, ProviderPricingMap>;
  fallbackPricing: ModelPricingInfo;
}

export const config: TokenCounterConfig = {
  baseCurrency: Currency.USD,
  currencyRates: {
    base: Currency.USD,
    lastUpdated: '2024-05-20T12:00:00Z',
    // In production, these rates should be fetched from a reliable currency API.
    rates: {
      [Currency.USD]: 1.0,
      [Currency.EUR]: 0.92,
      [Currency.GBP]: 0.79,
      [Currency.JPY]: 155.7,
      [Currency.CAD]: 1.36,
      [Currency.AUD]: 1.5,
    },
  },
  modelPricing: {
    [Provider.OpenAI]: {
      'gpt-4o': {
        modelId: 'gpt-4o',
        provider: Provider.OpenAI,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 5.0 },
          output: { unit: PricingUnit.PerMegaToken, price: 15.0 },
          contextWindowTokens: 128000,
        },
        notes: 'Pricing as of May 2024. Includes vision capabilities.',
      },
      'gpt-4-turbo': {
        modelId: 'gpt-4-turbo',
        provider: Provider.OpenAI,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 10.0 },
          output: { unit: PricingUnit.PerMegaToken, price: 30.0 },
          contextWindowTokens: 128000,
        },
      },
      'gpt-3.5-turbo-0125': {
        modelId: 'gpt-3.5-turbo-0125',
        provider: Provider.OpenAI,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 0.5 },
          output: { unit: PricingUnit.PerMegaToken, price: 1.5 },
          contextWindowTokens: 16385,
        },
      },
      'text-embedding-3-large': {
        modelId: 'text-embedding-3-large',
        provider: Provider.OpenAI,
        pricing: {
          type: 'embedding',
          usage: { unit: PricingUnit.PerMegaToken, price: 0.13 },
          outputDimensions: 3072,
        },
      },
      'dall-e-3': {
        modelId: 'dall-e-3',
        provider: Provider.OpenAI,
        pricing: {
          type: 'image',
          rates: {
            standard_1024x1024: { unit: PricingUnit.PerImage, price: 0.04 },
            hd_1024x1024: { unit: PricingUnit.PerImage, price: 0.08 },
          },
        },
      },
    },
    [Provider.Anthropic]: {
      'claude-3-opus-20240229': {
        modelId: 'claude-3-opus-20240229',
        provider: Provider.Anthropic,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 15.0 },
          output: { unit: PricingUnit.PerMegaToken, price: 75.0 },
          contextWindowTokens: 200000,
        },
      },
      'claude-3-sonnet-20240229': {
        modelId: 'claude-3-sonnet-20240229',
        provider: Provider.Anthropic,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 3.0 },
          output: { unit: PricingUnit.PerMegaToken, price: 15.0 },
          contextWindowTokens: 200000,
        },
      },
      'claude-3-haiku-20240307': {
        modelId: 'claude-3-haiku-20240307',
        provider: Provider.Anthropic,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 0.25 },
          output: { unit: PricingUnit.PerMegaToken, price: 1.25 },
          contextWindowTokens: 200000,
        },
      },
    },
    [Provider.Google]: {
      'gemini-1.5-pro-latest': {
        modelId: 'gemini-1.5-pro-latest',
        provider: Provider.Google,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 3.5 }, // For context > 128k tokens
          output: { unit: PricingUnit.PerMegaToken, price: 10.5 }, // For context > 128k tokens
          contextWindowTokens: 1000000,
        },
        notes: 'Pricing shown for context windows over 128K tokens. Lower price for smaller contexts.',
      },
      'gemini-1.0-pro': {
        modelId: 'gemini-1.0-pro',
        provider: Provider.Google,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 0.5 },
          output: { unit: PricingUnit.PerMegaToken, price: 1.5 },
          contextWindowTokens: 32768,
        },
      },
    },
    [Provider.Mistral]: {
      'mistral-large-latest': {
        modelId: 'mistral-large-latest',
        provider: Provider.Mistral,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 8.0 },
          output: { unit: PricingUnit.PerMegaToken, price: 24.0 },
          contextWindowTokens: 32000,
        },
      },
      'mistral-small-latest': {
        modelId: 'mistral-small-latest',
        provider: Provider.Mistral,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 2.0 },
          output: { unit: PricingUnit.PerMegaToken, price: 6.0 },
          contextWindowTokens: 32000,
        },
      },
    },
    [Provider.Cohere]: {
      'command-r-plus': {
        modelId: 'command-r-plus',
        provider: Provider.Cohere,
        pricing: {
          type: 'per_token',
          input: { unit: PricingUnit.PerMegaToken, price: 3.0 },
          output: { unit: PricingUnit.PerMegaToken, price: 15.0 },
          contextWindowTokens: 128000,
        },
      },
      'embed-english-v3.0': {
        modelId: 'embed-english-v3.0',
        provider: Provider.Cohere,
        pricing: {
          type: 'embedding',
          usage: { unit: PricingUnit.PerMegaToken, price: 0.1 },
          outputDimensions: 1024,
        },
      },
    },
    [Provider.ElevenLabs]: {
      'eleven_multilingual_v2': {
        modelId: 'eleven_multilingual_v2',
        provider: Provider.ElevenLabs,
        pricing: {
            type: 'audio',
            rates: {
                'standard_generation': { unit: PricingUnit.PerCharacter, price: 0.0003, quantity: 1 } // $0.30 per 1000 chars
            }
        },
        notes: 'Based on "Creator" tier pricing. Other tiers and features have different rates.'
      }
    },
    // Other providers would be added here...
    [Provider.AmazonBedrock]: {},
    [Provider.HuggingFace]: {},
    [Provider.StabilityAI]: {},
    [Provider.Custom]: {},
    [Provider.Unknown]: {},
  },
  fallbackPricing: {
    modelId: 'unknown_model',
    provider: Provider.Unknown,
    pricing: {
      type: 'per_token',
      input: { unit: PricingUnit.PerMegaToken, price: 10.0 }, // A safe, high-ish default
      output: { unit: PricingUnit.PerMegaToken, price: 30.0 },
      contextWindowTokens: 8192,
    },
    notes: 'This is a fallback pricing model for unrecognized models. Costs may be inaccurate.',
  },
};

/**
 * Retrieves the pricing information for a given model ID.
 * It can handle complex model IDs that might include provider prefixes.
 *
 * @param modelId The full model identifier (e.g., 'openai/gpt-4o', 'claude-3-opus-20240229').
 * @param appConfig The application configuration object.
 * @returns The pricing information for the model, or the fallback pricing if not found.
 */
export function getPricingForModel(
  modelId: string,
  appConfig: TokenCounterConfig = config
): ModelPricingInfo {
  // Simple heuristic to extract provider and model name
  let provider: Provider | undefined;
  let modelKey: string = modelId;

  const parts = modelId.split('/');
  if (parts.length === 2 && parts[0] in Provider) {
    provider = parts[0] as Provider;
    modelKey = parts[1];
  }

  // If provider is specified, search there first
  if (provider && appConfig.modelPricing[provider]?.[modelKey]) {
    return appConfig.modelPricing[provider][modelKey];
  }

  // If not found, search across all providers
  for (const p in appConfig.modelPricing) {
    const providerEnum = p as Provider;
    if (appConfig.modelPricing[providerEnum]?.[modelId]) {
      return appConfig.modelPricing[providerEnum][modelId];
    }
  }

  return appConfig.fallbackPricing;
}

/**
 * Converts an amount from one currency to another using the configured rates.
 *
 * @param amount The amount to convert.
 * @param fromCurrency The source currency.
 * @param toCurrency The target currency.
 * @param appConfig The application configuration object.
 * @returns The converted amount.
 * @throws Error if currency rates are not available.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  appConfig: TokenCounterConfig = config
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = appConfig.currencyRates.rates;
  const base = appConfig.currencyRates.base;

  const fromRate = fromCurrency === base ? 1.0 : rates[fromCurrency];
  const toRate = toCurrency === base ? 1.0 : rates[toCurrency];

  if (fromRate === undefined || toRate === undefined) {
    throw new Error(`Currency conversion rate not found for ${fromCurrency} or ${toCurrency}.`);
  }

  // Convert 'from' amount to base currency, then convert from base to 'to' currency.
  const amountInBase = amount / fromRate;
  return amountInBase * toRate;
}