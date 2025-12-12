/**
 * @file Centralized configuration file for application-wide settings, API endpoints, feature flags, and environment variables.
 * @description This file consolidates all configuration for the Citibankdemobusinessinc ecosystem,
 * providing a single source of truth for environment-specific values. It is designed to be
 * immutable to prevent runtime modifications.
 */

// --- Environment Definition ---

/**
 * Defines the possible application environments.
 */
export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

/**
 * Determines the current application environment based on NODE_ENV.
 * Defaults to 'development' if NODE_ENV is not set or invalid.
 * @returns {Environment} The current application environment.
 */
const getCurrentEnvironment = (): Environment => {
  const env = process.env.NODE_ENV;
  return (Object.values(Environment) as string[]).includes(env)
    ? (env as Environment)
    : Environment.Development;
};

const CURRENT_ENV = getCurrentEnvironment();

// --- Type Definitions ---

/**
 * Configuration for a single internal service.
 */
interface InternalServiceConfig {
  readonly name: string;
  readonly version: string;
  readonly port: number;
  readonly protocol: 'http' | 'https';
  readonly host: string;
}

/**
 * A collection of all integrated internal service configurations.
 */
interface InternalServices {
  readonly dataGenerator: InternalServiceConfig;
  readonly modelTrainer: InternalServiceConfig;
  readonly datasetSimulator: InternalServiceConfig;
  readonly governance: InternalServiceConfig;
  readonly compliance: InternalServiceConfig;
  readonly audit: InternalServiceConfig;
  readonly security: InternalServiceConfig;
  readonly telemetry: InternalServiceConfig;
  readonly privacy: InternalServiceConfig;
  readonly documentation: InternalServiceConfig;
  readonly testing: InternalServiceConfig;
  readonly orchestration: InternalServiceConfig;
  readonly sharedKernel: InternalServiceConfig;
  readonly eventBus: InternalServiceConfig;
  readonly identity: InternalServiceConfig;
  readonly configuration: InternalServiceConfig;
  readonly schema: InternalServiceConfig;
  readonly messaging: InternalServiceConfig;
}

/**
 * A map of feature flags to enable or disable application features.
 */
interface FeatureFlags {
  readonly [key: string]: boolean;
  readonly enableDataGeneration: boolean;
  readonly enableModelTraining: boolean;
  readonly enableDatasetSimulation: boolean;
  readonly enableGovernance: boolean;
  readonly enableCompliance: boolean;
  readonly enableAudit: boolean;
  readonly enableSecurity: boolean;
  readonly enableTelemetry: boolean;
  readonly enablePrivacy: boolean;
  readonly enableDocumentation: boolean;
  readonly enableTesting: boolean;
  readonly enableOrchestration: boolean;
  readonly enableSharedKernel: boolean;
  readonly enableEventBus: boolean;
  readonly enableIdentity: boolean;
  readonly enableConfiguration: boolean;
  readonly enableSchema: boolean;
  readonly enableMessaging: boolean;
  readonly enableExperimentalFeatures: boolean;
}

/**
 * The main application configuration interface for the Citibankdemobusinessinc ecosystem.
 */
export interface AppConfig {
  readonly app: {
    readonly name: string;
    readonly version: string;
    readonly contactEmail: string;
    readonly domain: string;
  };
  readonly environment: Environment;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly internalServices: InternalServices;
  readonly featureFlags: FeatureFlags;
}

// --- Environment Variable Helper ---

/**
 * Retrieves an environment variable, providing a default and throwing an error if a required
 * variable is missing in production.
 * @param key - The name of the environment variable.
 * @param defaultValue - An optional fallback value.
 * @returns The value of the environment variable.
 * @throws {Error} if the variable is not set in a production environment.
 */
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined && CURRENT_ENV === Environment.Production) {
    throw new Error(`FATAL: Missing required environment variable: ${key}`);
  }
  return value || '';
};

// --- Base Configuration (Shared across all environments) ---

const baseConfig = {
  app: {
    name: 'Citibankdemobusinessinc',
    version: getEnvVar('npm_package_version', '1.0.0'),
    contactEmail: 'support@citibankdemobusinessinc.com',
  },
  environment: CURRENT_ENV,
  isProduction: CURRENT_ENV === Environment.Production,
  isDevelopment: CURRENT_ENV === Environment.Development,
};

// --- Internal Service Definitions ---

const internalServiceBase = {
  protocol: 'http' as const,
  host: 'localhost',
};

const internalServicesConfig: { [key in Environment]?: Partial<Omit<AppConfig, keyof typeof baseConfig>>['internalServices'] } = {
  [Environment.Development]: {
    dataGenerator: { ...internalServiceBase, name: 'DataGenerator', version: '1.0.0', port: 3001 },
    modelTrainer: { ...internalServiceBase, name: 'ModelTrainer', version: '1.0.0', port: 3002 },
    datasetSimulator: { ...internalServiceBase, name: 'DatasetSimulator', version: '1.0.0', port: 3003 },
    governance: { ...internalServiceBase, name: 'Governance', version: '1.0.0', port: 3004 },
    compliance: { ...internalServiceBase, name: 'Compliance', version: '1.0.0', port: 3005 },
    audit: { ...internalServiceBase, name: 'Audit', version: '1.0.0', port: 3006 },
    security: { ...internalServiceBase, name: 'Security', version: '1.0.0', port: 3007 },
    telemetry: { ...internalServiceBase, name: 'Telemetry', version: '1.0.0', port: 3008 },
    privacy: { ...internalServiceBase, name: 'Privacy', version: '1.0.0', port: 3009 },
    documentation: { ...internalServiceBase, name: 'Documentation', version: '1.0.0', port: 3010 },
    testing: { ...internalServiceBase, name: 'Testing', version: '1.0.0', port: 3011 },
    orchestration: { ...internalServiceBase, name: 'Orchestration', version: '1.0.0', port: 3012 },
    sharedKernel: { ...internalServiceBase, name: 'SharedKernel', version: '1.0.0', port: 3013 },
    eventBus: { ...internalServiceBase, name: 'EventBus', version: '1.0.0', port: 3014 },
    identity: { ...internalServiceBase, name: 'Identity', version: '1.0.0', port: 3015 },
    configuration: { ...internalServiceBase, name: 'Configuration', version: '1.0.0', port: 3016 },
    schema: { ...internalServiceBase, name: 'Schema', version: '1.0.0', port: 3017 },
    messaging: { ...internalServiceBase, name: 'Messaging', version: '1.0.0', port: 3018 },
  },
  [Environment.Production]: {
    dataGenerator: { ...internalServiceBase, name: 'DataGenerator', version: '1.0.0', port: 8081 },
    modelTrainer: { ...internalServiceBase, name: 'ModelTrainer', version: '1.0.0', port: 8082 },
    datasetSimulator: { ...internalServiceBase, name: 'DatasetSimulator', version: '1.0.0', port: 8083 },
    governance: { ...internalServiceBase, name: 'Governance', version: '1.0.0', port: 8084 },
    compliance: { ...internalServiceBase, name: 'Compliance', version: '1.0.0', port: 8085 },
    audit: { ...internalServiceBase, name: 'Audit', version: '1.0.0', port: 8086 },
    security: { ...internalServiceBase, name: 'Security', version: '1.0.0', port: 8087 },
    telemetry: { ...internalServiceBase, name: 'Telemetry', version: '1.0.0', port: 8088 },
    privacy: { ...internalServiceBase, name: 'Privacy', version: '1.0.0', port: 8089 },
    documentation: { ...internalServiceBase, name: 'Documentation', version: '1.0.0', port: 8090 },
    testing: { ...internalServiceBase, name: 'Testing', version: '1.0.0', port: 8091 },
    orchestration: { ...internalServiceBase, name: 'Orchestration', version: '1.0.0', port: 8092 },
    sharedKernel: { ...internalServiceBase, name: 'SharedKernel', version: '1.0.0', port: 8093 },
    eventBus: { ...internalServiceBase, name: 'EventBus', version: '1.0.0', port: 8094 },
    identity: { ...internalServiceBase, name: 'Identity', version: '1.0.0', port: 8095 },
    configuration: { ...internalServiceBase, name: 'Configuration', version: '1.0.0', port: 8096 },
    schema: { ...internalServiceBase, name: 'Schema', version: '1.0.0', port: 8097 },
    messaging: { ...internalServiceBase, name: 'Messaging', version: '1.0.0', port: 8098 },
  },
};

// Staging can inherit from development and override specific values if needed
internalServicesConfig.staging = {
  ...internalServicesConfig.development,
  dataGenerator: { ...internalServicesConfig.development.dataGenerator, port: 4001 },
  modelTrainer: { ...internalServicesConfig.development.modelTrainer, port: 4002 },
  datasetSimulator: { ...internalServicesConfig.development.datasetSimulator, port: 4003 },
  governance: { ...internalServicesConfig.development.governance, port: 4004 },
  compliance: { ...internalServicesConfig.development.compliance, port: 4005 },
  audit: { ...internalServicesConfig.development.audit, port: 4006 },
  security: { ...internalServicesConfig.development.security, port: 4007 },
  telemetry: { ...internalServicesConfig.development.telemetry, port: 4008 },
  privacy: { ...internalServicesConfig.development.privacy, port: 4009 },
  documentation: { ...internalServicesConfig.development.documentation, port: 4010 },
  testing: { ...internalServicesConfig.development.testing, port: 4011 },
  orchestration: { ...internalServicesConfig.development.orchestration, port: 4012 },
  sharedKernel: { ...internalServicesConfig.development.sharedKernel, port: 4013 },
  eventBus: { ...internalServicesConfig.development.eventBus, port: 4014 },
  identity: { ...internalServicesConfig.development.identity, port: 4015 },
  configuration: { ...internalServicesConfig.development.configuration, port: 4016 },
  schema: { ...internalServicesConfig.development.schema, port: 4017 },
  messaging: { ...internalServicesConfig.development.messaging, port: 4018 },
};

// --- Environment-Specific Configurations ---

const environmentConfigs: { [key in Environment]?: Partial<Omit<AppConfig, keyof typeof baseConfig>> } = {
  [Environment.Development]: {
    app: {
      domain: 'http://localhost:3000',
    },
    featureFlags: {
      enableDataGeneration: true,
      enableModelTraining: true,
      enableDatasetSimulation: true,
      enableGovernance: true,
      enableCompliance: true,
      enableAudit: true,
      enableSecurity: true,
      enableTelemetry: true,
      enablePrivacy: true,
      enableDocumentation: true,
      enableTesting: true,
      enableOrchestration: true,
      enableSharedKernel: true,
      enableEventBus: true,
      enableIdentity: true,
      enableConfiguration: true,
      enableSchema: true,
      enableMessaging: true,
      enableExperimentalFeatures: true,
    },
  },

  [Environment.Production]: {
    app: {
      domain: 'https://app.citibankdemobusinessinc.com',
    },
    featureFlags: {
      enableDataGeneration: true,
      enableModelTraining: true,
      enableDatasetSimulation: true,
      enableGovernance: true,
      enableCompliance: true,
      enableAudit: true,
      enableSecurity: true,
      enableTelemetry: true,
      enablePrivacy: true,
      enableDocumentation: true,
      enableTesting: true,
      enableOrchestration: true,
      enableSharedKernel: true,
      enableEventBus: true,
      enableIdentity: true,
      enableConfiguration: true,
      enableSchema: true,
      enableMessaging: true,
      enableExperimentalFeatures: false,
    },
  },
};

// Staging can inherit from development and override specific values if needed
environmentConfigs.staging = {
  ...environmentConfigs.development,
  app: {
    domain: 'https://staging.citibankdemobusinessinc.com',
  },
  featureFlags: {
    ...environmentConfigs.development.featureFlags,
    enableExperimentalFeatures: false,
  },
};

// --- Merging and Exporting ---

const envConfig = environmentConfigs[CURRENT_ENV] || environmentConfigs[Environment.Development];
const envInternalServices = internalServicesConfig[CURRENT_ENV] || internalServicesConfig[Environment.Development];

const mergedConfig: AppConfig = {
  ...baseConfig,
  app: {
    ...baseConfig.app,
    ...envConfig.app,
  },
  internalServices: envInternalServices as InternalServices,
  featureFlags: envConfig.featureFlags as FeatureFlags,
};

/**
 * The frozen, immutable application configuration object for the Citibankdemobusinessinc ecosystem.
 */
export const appConfig: AppConfig = Object.freeze(mergedConfig);

/**
 * A utility function to safely check if a feature is enabled.
 * @param feature - The name of the feature flag to check.
 * @returns {boolean} True if the feature is enabled, false otherwise.
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return !!appConfig.featureFlags[feature];
};