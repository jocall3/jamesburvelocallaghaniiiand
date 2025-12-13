// apps/APP_11_Datasets_LifecycleManager/src/main.ts

/**
 * APP_11_Datasets_LifecycleManager
 *
 * This service manages the full lifecycle of AI datasets, from creation and versioning
 * to access control and integration with labeling platforms. It ensures data integrity,
 * reproducibility, and compliance for AI model training and evaluation.
 *
 * License: MIT
 * Copyright (c) 2023 AI-Architect
 */

import {
  DatasetLifecycleEvent,
  DatasetOperation,
  DatasetStatus,
  DatasetVisibility,
  DatasetVersion,
  DatasetMetadata,
  DatasetAccessPolicy,
  DatasetLabelingJob,
  DatasetLabelingStatus,
  DatasetSourceType,
  DatasetStorageProvider,
  DatasetStorageConfig,
  DatasetSchema,
  DatasetFeatureFlag,
  DatasetJurisdiction,
  DatasetAuditLogEntry,
  DatasetAuditAction,
  DatasetAuditActorType,
  DatasetAuditOutcome,
  DatasetCostMetrics,
  DatasetUnitEconomics,
  DatasetFailureMode,
  DatasetTension,
  DatasetIntrospection,
  DatasetAssumptions,
  DatasetUpdateTrigger,
  DatasetAgentMetadata,
} from './types';
import {
  CoreSDK,
  AuthIdentity,
  EventBus,
  MessageProtocol,
  UnifiedOntology,
  Logger,
  FeatureFlagService,
  AuditLogger,
  CostEstimator,
  Telemetry,
} from '../../shared_core_sdk/src/index'; // Assuming a shared core SDK path
import {
  S3Adapter,
  GCSAdapter,
  AzureBlobAdapter,
  LocalStorageAdapter,
  IDataStorageAdapter,
} from './adapters/storage';
import {
  ScaleAIAdapter,
  LabelboxAdapter,
  SuperAnnotateAdapter,
  ILabelingPlatformAdapter,
} from './adapters/labeling';
import {
  OpenAIEmbeddingsAdapter,
  CohereEmbeddingsAdapter,
  HuggingFaceEmbeddingsAdapter,
  IEmbeddingServiceAdapter,
} from './adapters/embeddings';
import {
  DataValidationService,
  IDataValidationService,
} from './services/dataValidation';
import {
  DataTransformationService,
  IDataTransformationService,
} from './services/dataTransformation';
import {
  AccessControlService,
  IAccessControlService,
} from './services/accessControl';
import {
  DatasetVersionManager,
  IDatasetVersionManager,
} from './services/versionManager';
import {
  DatasetSchemaManager,
  IDatasetSchemaManager,
} from './services/schemaManager';
import {
  DatasetSearchService,
  IDatasetSearchService,
} from './services/search';
import {
  DatasetCostCalculator,
  IDatasetCostCalculator,
} from './services/costCalculator';

// --- Configuration Interface ---
interface DatasetLifecycleManagerConfig {
  coreSDK: CoreSDK;
  storageProvider: DatasetStorageProvider;
  storageConfig: DatasetStorageConfig;
  labelingPlatforms: {
    [key: string]: {
      adapter: string; // e.g., 'ScaleAI', 'Labelbox'
      apiKey: string;
      baseUrl?: string;
    };
  };
  embeddingServices: {
    [key: string]: {
      adapter: string; // e.g., 'OpenAI', 'Cohere'
      apiKey: string;
      model?: string;
    };
  };
  defaultRegion: string;
  featureFlags: Record<DatasetFeatureFlag, boolean>;
  jurisdictionalControls: Record<DatasetJurisdiction, boolean>;
  // Configuration for data validation rules, e.g., schema enforcement, data quality checks
  validationRules: any;
  // Configuration for data transformation pipelines
  transformationPipelines: any;
}

// --- Main Service Class ---
export class DatasetLifecycleManager {
  private config: DatasetLifecycleManagerConfig;
  private logger: Logger;
  private eventBus: EventBus;
  private authIdentity: AuthIdentity;
  private featureFlagService: FeatureFlagService;
  private auditLogger: AuditLogger;
  private telemetry: Telemetry;
  private dataStorage: IDataStorageAdapter;
  private labelingAdapters: Map<string, ILabelingPlatformAdapter>;
  private embeddingAdapters: Map<string, IEmbeddingServiceAdapter>;
  private dataValidationService: IDataValidationService;
  private dataTransformationService: IDataTransformationService;
  private accessControlService: IAccessControlService;
  private versionManager: IDatasetVersionManager;
  private schemaManager: IDatasetSchemaManager;
  private searchService: IDatasetSearchService;
  private costCalculator: IDatasetCostCalculator;

  constructor(config: DatasetLifecycleManagerConfig) {
    this.config = config;
    this.logger = config.coreSDK.getLogger('DatasetLifecycleManager');
    this.eventBus = config.coreSDK.getEventBus();
    this.authIdentity = config.coreSDK.getAuthIdentity();
    this.featureFlagService = config.coreSDK.getFeatureFlagService();
    this.auditLogger = config.coreSDK.getAuditLogger();
    this.telemetry = config.coreSDK.getTelemetry();

    this.initializeStorageAdapter(config.storageProvider, config.storageConfig);
    this.initializeLabelingAdapters(config.labelingPlatforms);
    this.initializeEmbeddingAdapters(config.embeddingServices);

    this.dataValidationService = new DataValidationService(
      this.logger,
      config.validationRules
    );
    this.dataTransformationService = new DataTransformationService(
      this.logger,
      config.transformationPipelines
    );
    this.accessControlService = new AccessControlService(
      this.logger,
      this.authIdentity
    );
    this.versionManager = new DatasetVersionManager(this.logger);
    this.schemaManager = new DatasetSchemaManager(this.logger);
    this.searchService = new DatasetSearchService(this.logger); // Potentially integrates with a search index
    this.costCalculator = new DatasetCostCalculator(
      this.logger,
      config.coreSDK.getCostEstimator()
    );

    this.logger.info('DatasetLifecycleManager initialized.');
  }

  private initializeStorageAdapter(
    provider: DatasetStorageProvider,
    config: DatasetStorageConfig
  ): void {
    switch (provider) {
      case DatasetStorageProvider.S3:
        this.dataStorage = new S3Adapter(config);
        break;
      case DatasetStorageProvider.GCS:
        this.dataStorage = new GCSAdapter(config);
        break;
      case DatasetStorageProvider.AzureBlob:
        this.dataStorage = new AzureBlobAdapter(config);
        break;
      case DatasetStorageProvider.LocalStorage:
        this.dataStorage = new LocalStorageAdapter(config);
        break;
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
    this.logger.info(`Initialized storage adapter: ${provider}`);
  }

  private initializeLabelingAdapters(
    platforms: DatasetLifecycleManagerConfig['labelingPlatforms']
  ): void {
    this.labelingAdapters = new Map();
    for (const [name, platformConfig] of Object.entries(platforms)) {
      let adapter: ILabelingPlatformAdapter;
      switch (platformConfig.adapter) {
        case 'ScaleAI':
          adapter = new ScaleAIAdapter(
            platformConfig.apiKey,
            platformConfig.baseUrl
          );
          break;
        case 'Labelbox':
          adapter = new LabelboxAdapter(
            platformConfig.apiKey,
            platformConfig.baseUrl
          );
          break;
        case 'SuperAnnotate':
          adapter = new SuperAnnotateAdapter(
            platformConfig.apiKey,
            platformConfig.baseUrl
          );
          break;
        default:
          this.logger.warn(
            `Unsupported labeling platform adapter: ${platformConfig.adapter}`
          );
          continue;
      }
      this.labelingAdapters.set(name, adapter);
      this.logger.info(`Initialized labeling adapter: ${name}`);
    }
  }

  private initializeEmbeddingAdapters(
    services: DatasetLifecycleManagerConfig['embeddingServices']
  ): void {
    this.embeddingAdapters = new Map();
    for (const [name, serviceConfig] of Object.entries(services)) {
      let adapter: IEmbeddingServiceAdapter;
      switch (serviceConfig.adapter) {
        case 'OpenAI':
          adapter = new OpenAIEmbeddingsAdapter(
            serviceConfig.apiKey,
            serviceConfig.model
          );
          break;
        case 'Cohere':
          adapter = new CohereEmbeddingsAdapter(
            serviceConfig.apiKey,
            serviceConfig.model
          );
          break;
        case 'HuggingFace':
          adapter = new HuggingFaceEmbeddingsAdapter(
            serviceConfig.apiKey,
            serviceConfig.model
          );
          break;
        default:
          this.logger.warn(
            `Unsupported embedding service adapter: ${serviceConfig.adapter}`
          );
          continue;
      }
      this.embeddingAdapters.set(name, adapter);
      this.logger.info(`Initialized embedding adapter: ${name}`);
    }
  }

  /**
   * Internal helper for auditing actions.
   */
  private async audit(
    datasetId: string,
    action: DatasetAuditAction,
    actorId: string,
    actorType: DatasetAuditActorType,
    outcome: DatasetAuditOutcome,
    details: Record<string, any> = {}
  ): Promise<void> {
    const entry: DatasetAuditLogEntry = {
      timestamp: new Date().toISOString(),
      datasetId,
      action,
      actorId,
      actorType,
      outcome,
      details,
      jurisdiction: this.config.defaultRegion, // Example, could be derived
    };
    await this.auditLogger.log(entry);
    this.eventBus.publish(
      MessageProtocol.createEvent(
        'dataset.audited',
        { datasetId, action, outcome },
        UnifiedOntology.Dataset
      )
    );
  }

  /**
   * Checks if a feature is enabled based on feature flags and jurisdictional controls.
   */
  private isFeatureEnabled(
    feature: DatasetFeatureFlag,
    jurisdiction?: DatasetJurisdiction
  ): boolean {
    const globalEnabled = this.featureFlagService.isFeatureEnabled(feature);
    if (!globalEnabled) return false;

    if (jurisdiction && this.config.jurisdictionalControls[jurisdiction] === false) {
      this.logger.warn(
        `Feature ${feature} is disabled for jurisdiction ${jurisdiction}.`
      );
      return false;
    }
    return true;
  }

  /**
   * API: Creates a new dataset.
   * @param name - Name of the dataset.
   * @param description - Description of the dataset.
   * @param sourceType - The type of data source (e.g., raw, synthetic).
   * @param initialDataUri - Optional URI to initial data.
   * @param schema - Optional schema for the dataset.
   * @param accessPolicy - Initial access policy.
   * @param metadata - Additional metadata.
   * @returns The created dataset's ID and initial version.
   */
  public async createDataset(
    name: string,
    description: string,
    sourceType: DatasetSourceType,
    initialDataUri: string | null,
    schema: DatasetSchema | null,
    accessPolicy: DatasetAccessPolicy,
    metadata: DatasetMetadata = {}
  ): Promise<{ datasetId: string; version: DatasetVersion }> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to create a dataset.');
    }

    if (!this.isFeatureEnabled(DatasetFeatureFlag.DATASET_CREATION)) {
      throw new Error('Dataset creation is currently disabled.');
    }

    const datasetId = `ds_${CoreSDK.generateUniqueId()}`;
    const initialVersion: DatasetVersion = {
      versionId: 'v0.0.1',
      timestamp: new Date().toISOString(),
      changes: 'Initial creation',
      dataUri: initialDataUri,
      schemaHash: schema ? this.schemaManager.generateSchemaHash(schema) : null,
      metadataHash: CoreSDK.hashObject(metadata),
    };

    const dataset: DatasetMetadata = {
      id: datasetId,
      name,
      description,
      sourceType,
      status: DatasetStatus.CREATED,
      visibility: accessPolicy.visibility,
      ownerId: actor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentVersion: initialVersion,
      versions: [initialVersion],
      accessPolicy,
      schema: schema,
      metadata: metadata,
      tags: [],
      costMetrics: {
        storageBytes: 0,
        labelingCost: 0,
        processingCost: 0,
        totalCost: 0,
        lastCalculated: new Date().toISOString(),
      },
    };

    try {
      // Store dataset metadata (e.g., in a database)
      await this.dataStorage.storeMetadata(datasetId, dataset);

      // If initial data URI is provided, potentially copy/process it
      if (initialDataUri) {
        // This is a placeholder. In a real system, this might involve
        // copying data from a source URI to the managed storage,
        // or simply registering the external URI.
        this.logger.info(
          `Registering initial data for dataset ${datasetId} from ${initialDataUri}`
        );
        // Example: await this.dataStorage.copyData(initialDataUri, this.dataStorage.getDatasetPath(datasetId, initialVersion.versionId));
      }

      // Validate initial schema if provided
      if (schema) {
        await this.schemaManager.validateSchema(schema);
      }

      this.eventBus.publish(
        MessageProtocol.createEvent(
          'dataset.created',
          { datasetId, name, ownerId: actor.id },
          UnifiedOntology.Dataset
        )
      );
      this.telemetry.trackEvent('dataset_created', { datasetId, ownerId: actor.id });
      await this.audit(
        datasetId,
        DatasetAuditAction.CREATE,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS,
        { name, sourceType }
      );

      this.logger.info(`Dataset ${datasetId} created successfully.`);
      return { datasetId, version: initialVersion };
    } catch (error) {
      this.logger.error(`Failed to create dataset ${datasetId}: ${error}`);
      await this.audit(
        datasetId,
        DatasetAuditAction.CREATE,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        { name, sourceType, error: (error as Error).message }
      );
      throw error;
    }
  }

  /**
   * API: Retrieves dataset metadata.
   * @param datasetId - The ID of the dataset.
   * @param versionId - Optional specific version ID. If not provided, returns the current version.
   * @returns Dataset metadata.
   */
  public async getDataset(
    datasetId: string,
    versionId?: string
  ): Promise<DatasetMetadata> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to get dataset metadata.');
    }

    try {
      const dataset = await this.dataStorage.getMetadata<DatasetMetadata>(
        datasetId
      );
      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found.`);
      }

      if (
        !this.accessControlService.canAccessDataset(
          actor,
          dataset,
          DatasetOperation.READ_METADATA
        )
      ) {
        await this.audit(
          datasetId,
          DatasetAuditAction.READ_METADATA,
          actor.id,
          DatasetAuditActorType.USER,
          DatasetAuditOutcome.FAILURE,
          { reason: 'Access denied' }
        );
        throw new Error('Access denied to dataset metadata.');
      }

      if (versionId) {
        const version = dataset.versions.find((v) => v.versionId === versionId);
        if (!version) {
          throw new Error(
            `Version ${versionId} not found for dataset ${datasetId}.`
          );
        }
        // Return a copy with the specific version as current for consistency
        return { ...dataset, currentVersion: version };
      }

      await this.audit(
        datasetId,
        DatasetAuditAction.READ_METADATA,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS
      );
      return dataset;
    } catch (error) {
      this.logger.error(`Failed to get dataset ${datasetId}: ${error}`);
      await this.audit(
        datasetId,
        DatasetAuditAction.READ_METADATA,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        { error: (error as Error).message }
      );
      throw error;
    }
  }

  /**
   * API: Updates dataset metadata (excluding data itself).
   * @param datasetId - The ID of the dataset.
   * @param updates - Partial updates to the dataset metadata.
   * @returns Updated dataset metadata.
   */
  public async updateDatasetMetadata(
    datasetId: string,
    updates: Partial<Omit<DatasetMetadata, 'id' | 'createdAt' | 'ownerId'>>
  ): Promise<DatasetMetadata> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to update dataset metadata.');
    }

    if (!this.isFeatureEnabled(DatasetFeatureFlag.DATASET_METADATA_UPDATE)) {
      throw new Error('Dataset metadata updates are currently disabled.');
    }

    try {
      const dataset = await this.dataStorage.getMetadata<DatasetMetadata>(
        datasetId
      );
      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found.`);
      }

      if (
        !this.accessControlService.canAccessDataset(
          actor,
          dataset,
          DatasetOperation.UPDATE_METADATA
        )
      ) {
        await this.audit(
          datasetId,
          DatasetAuditAction.UPDATE_METADATA,
          actor.id,
          DatasetAuditActorType.USER,
          DatasetAuditOutcome.FAILURE,
          { reason: 'Access denied' }
        );
        throw new Error('Access denied to update dataset metadata.');
      }

      const oldMetadata = { ...dataset };
      const newMetadata = { ...dataset, ...updates, updatedAt: new Date().toISOString() };

      // Handle schema updates
      if (updates.schema) {
        await this.schemaManager.validateSchema(updates.schema);
        newMetadata.schema = updates.schema;
      }

      // Update visibility if accessPolicy is updated
      if (updates.accessPolicy) {
        newMetadata.visibility = updates.accessPolicy.visibility;
      }

      await this.dataStorage.storeMetadata(datasetId, newMetadata);

      this.eventBus.publish(
        MessageProtocol.createEvent(
          'dataset.metadataUpdated',
          { datasetId, updatedFields: Object.keys(updates) },
          UnifiedOntology.Dataset
        )
      );
      this.telemetry.trackEvent('dataset_metadata_updated', {
        datasetId,
        actorId: actor.id,
      });
      await this.audit(
        datasetId,
        DatasetAuditAction.UPDATE_METADATA,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS,
        { updatedFields: Object.keys(updates) }
      );

      this.logger.info(`Dataset ${datasetId} metadata updated.`);
      return newMetadata;
    } catch (error) {
      this.logger.error(
        `Failed to update dataset ${datasetId} metadata: ${error}`
      );
      await this.audit(
        datasetId,
        DatasetAuditAction.UPDATE_METADATA,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        { updatedFields: Object.keys(updates), error: (error as Error).message }
      );
      throw error;
    }
  }

  /**
   * API: Adds new data to a dataset, creating a new version.
   * This method handles data ingestion, validation, and versioning.
   * @param datasetId - The ID of the dataset.
   * @param dataUri - URI to the new data (e.g., S3 path, local file path).
   * @param changes - Description of the changes in this version.
   * @param applyTransformations - Whether to apply configured data transformations.
   * @param validateSchema - Whether to validate data against the dataset's schema.
   * @returns The new dataset version.
   */
  public async addDatasetVersion(
    datasetId: string,
    dataUri: string,
    changes: string,
    applyTransformations: boolean = true,
    validateSchema: boolean = true
  ): Promise<DatasetVersion> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to add a dataset version.');
    }

    if (!this.isFeatureEnabled(DatasetFeatureFlag.DATASET_VERSIONING)) {
      throw new Error('Dataset versioning is currently disabled.');
    }

    try {
      const dataset = await this.dataStorage.getMetadata<DatasetMetadata>(
        datasetId
      );
      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found.`);
      }

      if (
        !this.accessControlService.canAccessDataset(
          actor,
          dataset,
          DatasetOperation.ADD_VERSION
        )
      ) {
        await this.audit(
          datasetId,
          DatasetAuditAction.ADD_VERSION,
          actor.id,
          DatasetAuditActorType.USER,
          DatasetAuditOutcome.FAILURE,
          { reason: 'Access denied' }
        );
        throw new Error('Access denied to add dataset version.');
      }

      // 1. Ingest data (e.g., copy from source to managed storage)
      const managedDataUri = await this.dataStorage.ingestData(
        datasetId,
        dataUri,
        dataset.currentVersion.versionId // Use current version as base for new data
      );

      // 2. Apply transformations if enabled
      let processedDataUri = managedDataUri;
      if (applyTransformations) {
        processedDataUri = await this.dataTransformationService.transformData(
          datasetId,
          managedDataUri,
          dataset.transformationPipelines || []
        );
        this.logger.info(
          `Data for dataset ${datasetId} transformed. New URI: ${processedDataUri}`
        );
      }

      // 3. Validate data against schema if enabled and schema exists
      if (validateSchema && dataset.schema) {
        const validationResult =
          await this.dataValidationService.validateDataAgainstSchema(
            processedDataUri,
            dataset.schema
          );
        if (!validationResult.isValid) {
          throw new Error(
            `Data validation failed for dataset ${datasetId}: ${validationResult.errors.join(', ')}`
          );
        }
        this.logger.info(`Data for dataset ${datasetId} validated successfully.`);
      }

      // 4. Create new version
      const newVersion = this.versionManager.createNewVersion(
        dataset.versions,
        changes,
        processedDataUri,
        dataset.schema
      );

      dataset.versions.push(newVersion);
      dataset.currentVersion = newVersion;
      dataset.updatedAt = new Date().toISOString();
      dataset.status = DatasetStatus.READY; // Assuming data is ready after processing

      await this.dataStorage.storeMetadata(datasetId, dataset);

      // Update cost metrics
      await this.updateDatasetCostMetrics(datasetId);

      this.eventBus.publish(
        MessageProtocol.createEvent(
          'dataset.versionAdded',
          { datasetId, versionId: newVersion.versionId, changes },
          UnifiedOntology.Dataset
        )
      );
      this.telemetry.trackEvent('dataset_version_added', {
        datasetId,
        versionId: newVersion.versionId,
        actorId: actor.id,
      });
      await this.audit(
        datasetId,
        DatasetAuditAction.ADD_VERSION,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS,
        { versionId: newVersion.versionId, changes, dataUri }
      );

      this.logger.info(
        `New version ${newVersion.versionId} added to dataset ${datasetId}.`
      );
      return newVersion;
    } catch (error) {
      this.logger.error(
        `Failed to add version to dataset ${datasetId}: ${error}`
      );
      await this.audit(
        datasetId,
        DatasetAuditAction.ADD_VERSION,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        { changes, dataUri, error: (error as Error).message }
      );
      throw error;
    }
  }

  /**
   * API: Retrieves the URI for a specific dataset version's data.
   * This URI can be used to access the data directly (e.g., for model training).
   * @param datasetId - The ID of the dataset.
   * @param versionId - The specific version ID.
   * @returns A URI to the dataset's data.
   */
  public async getDatasetDataUri(
    datasetId: string,
    versionId: string
  ): Promise<string> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to get dataset data URI.');
    }

    try {
      const dataset = await this.dataStorage.getMetadata<DatasetMetadata>(
        datasetId
      );
      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found.`);
      }

      if (
        !this.accessControlService.canAccessDataset(
          actor,
          dataset,
          DatasetOperation.READ_DATA
        )
      ) {
        await this.audit(
          datasetId,
          DatasetAuditAction.READ_DATA,
          actor.id,
          DatasetAuditActorType.USER,
          DatasetAuditOutcome.FAILURE,
          { reason: 'Access denied' }
        );
        throw new Error('Access denied to dataset data.');
      }

      const version = dataset.versions.find((v) => v.versionId === versionId);
      if (!version || !version.dataUri) {
        throw new Error(
          `Data URI not found for version ${versionId} of dataset ${datasetId}.`
        );
      }

      // Generate a temporary, signed URL if applicable for cloud storage
      const dataUri = await this.dataStorage.getSignedUrl(version.dataUri);

      this.eventBus.publish(
        MessageProtocol.createEvent(
          'dataset.dataAccessed',
          { datasetId, versionId, actorId: actor.id },
          UnifiedOntology.Dataset
        )
      );
      this.telemetry.trackEvent('dataset_data_accessed', {
        datasetId,
        versionId,
        actorId: actor.id,
      });
      await this.audit(
        datasetId,
        DatasetAuditAction.READ_DATA,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS,
        { versionId }
      );

      return dataUri;
    } catch (error) {
      this.logger.error(
        `Failed to get data URI for dataset ${datasetId}, version ${versionId}: ${error}`
      );
      await this.audit(
        datasetId,
        DatasetAuditAction.READ_DATA,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        { versionId, error: (error as Error).message }
      );
      throw error;
    }
  }

  /**
   * API: Initiates a data labeling job with an integrated labeling platform.
   * @param datasetId - The ID of the dataset to label.
   * @param versionId - The specific version of the dataset to label.
   * @param labelingPlatformName - The name of the configured labeling platform (e.g., 'ScaleAI').
   * @param jobConfig - Configuration specific to the labeling job (e.g., instructions, annotators).
   * @returns Details of the initiated labeling job.
   */
  public async initiateLabelingJob(
    datasetId: string,
    versionId: string,
    labelingPlatformName: string,
    jobConfig: Record<string, any>
  ): Promise<DatasetLabelingJob> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to initiate labeling job.');
    }

    if (!this.isFeatureEnabled(DatasetFeatureFlag.DATASET_LABELING)) {
      throw new Error('Dataset labeling is currently disabled.');
    }

    try {
      const dataset = await this.dataStorage.getMetadata<DatasetMetadata>(
        datasetId
      );
      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found.`);
      }

      if (
        !this.accessControlService.canAccessDataset(
          actor,
          dataset,
          DatasetOperation.INITIATE_LABELING
        )
      ) {
        await this.audit(
          datasetId,
          DatasetAuditAction.INITIATE_LABELING,
          actor.id,
          DatasetAuditActorType.USER,
          DatasetAuditOutcome.FAILURE,
          { reason: 'Access denied' }
        );
        throw new Error('Access denied to initiate labeling job.');
      }

      const labelingAdapter = this.labelingAdapters.get(labelingPlatformName);
      if (!labelingAdapter) {
        throw new Error(
          `Labeling platform adapter "${labelingPlatformName}" not found or configured.`
        );
      }

      const version = dataset.versions.find((v) => v.versionId === versionId);
      if (!version || !version.dataUri) {
        throw new Error(
          `Data URI not found for version ${versionId} of dataset ${datasetId}.`
        );
      }

      // Get a temporary, signed URL for the labeling platform to access the data
      const dataAccessUri = await this.dataStorage.getSignedUrl(
        version.dataUri,
        60 * 60 * 24 * 7 // 7 days access for labeling
      );

      const labelingJob = await labelingAdapter.createLabelingJob(
        datasetId,
        versionId,
        dataAccessUri,
        jobConfig
      );

      // Update dataset status and store labeling job info
      dataset.status = DatasetStatus.LABELING_IN_PROGRESS;
      dataset.labelingJobs = dataset.labelingJobs || [];
      dataset.labelingJobs.push(labelingJob);
      dataset.updatedAt = new Date().toISOString();
      await this.dataStorage.storeMetadata(datasetId, dataset);

      // Update cost metrics
      await this.updateDatasetCostMetrics(datasetId);

      this.eventBus.publish(
        MessageProtocol.createEvent(
          'dataset.labelingJobInitiated',
          {
            datasetId,
            versionId,
            labelingPlatformName,
            jobId: labelingJob.jobId,
          },
          UnifiedOntology.Dataset
        )
      );
      this.telemetry.trackEvent('dataset_labeling_job_initiated', {
        datasetId,
        versionId,
        labelingPlatformName,
        jobId: labelingJob.jobId,
        actorId: actor.id,
      });
      await this.audit(
        datasetId,
        DatasetAuditAction.INITIATE_LABELING,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS,
        { versionId, labelingPlatformName, jobId: labelingJob.jobId }
      );

      this.logger.info(
        `Labeling job ${labelingJob.jobId} initiated for dataset ${datasetId} (version ${versionId}) on ${labelingPlatformName}.`
      );
      return labelingJob;
    } catch (error) {
      this.logger.error(
        `Failed to initiate labeling job for dataset ${datasetId}: ${error}`
      );
      await this.audit(
        datasetId,
        DatasetAuditAction.INITIATE_LABELING,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        {
          versionId,
          labelingPlatformName,
          error: (error as Error).message,
        }
      );
      throw error;
    }
  }

  /**
   * API: Fetches the status of a labeling job.
   * @param datasetId - The ID of the dataset.
   * @param jobId - The ID of the labeling job.
   * @param labelingPlatformName - The name of the configured labeling platform.
   * @returns The current status of the labeling job.
   */
  public async getLabelingJobStatus(
    datasetId: string,
    jobId: string,
    labelingPlatformName: string
  ): Promise<DatasetLabelingStatus> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to get labeling job status.');
    }

    try {
      const dataset = await this.dataStorage.getMetadata<DatasetMetadata>(
        datasetId
      );
      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found.`);
      }

      if (
        !this.accessControlService.canAccessDataset(
          actor,
          dataset,
          DatasetOperation.READ_LABELING_STATUS
        )
      ) {
        await this.audit(
          datasetId,
          DatasetAuditAction.READ_LABELING_STATUS,
          actor.id,
          DatasetAuditActorType.USER,
          DatasetAuditOutcome.FAILURE,
          { reason: 'Access denied' }
        );
        throw new Error('Access denied to read labeling job status.');
      }

      const labelingAdapter = this.labelingAdapters.get(labelingPlatformName);
      if (!labelingAdapter) {
        throw new Error(
          `Labeling platform adapter "${labelingPlatformName}" not found or configured.`
        );
      }

      const status = await labelingAdapter.getLabelingJobStatus(jobId);

      // Optionally update dataset status if job is complete
      if (
        status === DatasetLabelingStatus.COMPLETED ||
        status === DatasetLabelingStatus.FAILED
      ) {
        const jobIndex = dataset.labelingJobs?.findIndex(
          (job) => job.jobId === jobId
        );
        if (jobIndex !== undefined && jobIndex !== -1) {
          dataset.labelingJobs![jobIndex].status = status;
          if (status === DatasetLabelingStatus.COMPLETED) {
            dataset.status = DatasetStatus.LABELED;
          } else if (status === DatasetLabelingStatus.FAILED) {
            dataset.status = DatasetStatus.LABELING_FAILED;
          }
          dataset.updatedAt = new Date().toISOString();
          await this.dataStorage.storeMetadata(datasetId, dataset);
        }
      }

      await this.audit(
        datasetId,
        DatasetAuditAction.READ_LABELING_STATUS,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS,
        { jobId, labelingPlatformName, status }
      );

      return status;
    } catch (error) {
      this.logger.error(
        `Failed to get labeling job ${jobId} status for dataset ${datasetId}: ${error}`
      );
      await this.audit(
        datasetId,
        DatasetAuditAction.READ_LABELING_STATUS,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        { jobId, labelingPlatformName, error: (error as Error).message }
      );
      throw error;
    }
  }

  /**
   * API: Imports labeled data from a labeling platform, creating a new dataset version.
   * @param datasetId - The ID of the dataset.
   * @param jobId - The ID of the completed labeling job.
   * @param labelingPlatformName - The name of the configured labeling platform.
   * @param changes - Description of the changes (e.g., "Labeled data from job X").
   * @returns The new dataset version containing the labeled data.
   */
  public async importLabeledData(
    datasetId: string,
    jobId: string,
    labelingPlatformName: string,
    changes: string
  ): Promise<DatasetVersion> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to import labeled data.');
    }

    if (!this.isFeatureEnabled(DatasetFeatureFlag.DATASET_LABELING_IMPORT)) {
      throw new Error('Labeled data import is currently disabled.');
    }

    try {
      const dataset = await this.dataStorage.getMetadata<DatasetMetadata>(
        datasetId
      );
      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found.`);
      }

      if (
        !this.accessControlService.canAccessDataset(
          actor,
          dataset,
          DatasetOperation.IMPORT_LABELED_DATA
        )
      ) {
        await this.audit(
          datasetId,
          DatasetAuditAction.IMPORT_LABELED_DATA,
          actor.id,
          DatasetAuditActorType.USER,
          DatasetAuditOutcome.FAILURE,
          { reason: 'Access denied' }
        );
        throw new Error('Access denied to import labeled data.');
      }

      const labelingAdapter = this.labelingAdapters.get(labelingPlatformName);
      if (!labelingAdapter) {
        throw new Error(
          `Labeling platform adapter "${labelingPlatformName}" not found or configured.`
        );
      }

      // 1. Fetch labeled data URI from the labeling platform
      const labeledDataUri = await labelingAdapter.getLabeledDataUri(jobId);
      if (!labeledDataUri) {
        throw new Error(
          `No labeled data URI found for job ${jobId} on ${labelingPlatformName}.`
        );
      }

      // 2. Ingest labeled data into managed storage
      const managedLabeledDataUri = await this.dataStorage.ingestData(
        datasetId,
        labeledDataUri,
        dataset.currentVersion.versionId // Base for new version
      );

      // 3. Create a new dataset version for the labeled data
      const newVersion = this.versionManager.createNewVersion(
        dataset.versions,
        changes,
        managedLabeledDataUri,
        dataset.schema // Labeled data should conform to existing schema or a new one
      );

      dataset.versions.push(newVersion);
      dataset.currentVersion = newVersion;
      dataset.updatedAt = new Date().toISOString();
      dataset.status = DatasetStatus.LABELED; // Mark as labeled
      await this.dataStorage.storeMetadata(datasetId, dataset);

      // Update cost metrics
      await this.updateDatasetCostMetrics(datasetId);

      this.eventBus.publish(
        MessageProtocol.createEvent(
          'dataset.labeledDataImported',
          { datasetId, versionId: newVersion.versionId, jobId },
          UnifiedOntology.Dataset
        )
      );
      this.telemetry.trackEvent('dataset_labeled_data_imported', {
        datasetId,
        versionId: newVersion.versionId,
        jobId,
        actorId: actor.id,
      });
      await this.audit(
        datasetId,
        DatasetAuditAction.IMPORT_LABELED_DATA,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS,
        { versionId: newVersion.versionId, jobId, labelingPlatformName }
      );

      this.logger.info(
        `Labeled data from job ${jobId} imported as new version ${newVersion.versionId} for dataset ${datasetId}.`
      );
      return newVersion;
    } catch (error) {
      this.logger.error(
        `Failed to import labeled data for dataset ${datasetId}, job ${jobId}: ${error}`
      );
      await this.audit(
        datasetId,
        DatasetAuditAction.IMPORT_LABELED_DATA,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        { jobId, labelingPlatformName, error: (error as Error).message }
      );
      throw error;
    }
  }

  /**
   * API: Deletes a dataset and all its associated data and metadata.
   * This is a destructive operation.
   * @param datasetId - The ID of the dataset to delete.
   */
  public async deleteDataset(datasetId: string): Promise<void> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to delete a dataset.');
    }

    if (!this.isFeatureEnabled(DatasetFeatureFlag.DATASET_DELETION)) {
      throw new Error('Dataset deletion is currently disabled.');
    }

    try {
      const dataset = await this.dataStorage.getMetadata<DatasetMetadata>(
        datasetId
      );
      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found.`);
      }

      if (
        !this.accessControlService.canAccessDataset(
          actor,
          dataset,
          DatasetOperation.DELETE
        )
      ) {
        await this.audit(
          datasetId,
          DatasetAuditAction.DELETE,
          actor.id,
          DatasetAuditActorType.USER,
          DatasetAuditOutcome.FAILURE,
          { reason: 'Access denied' }
        );
        throw new Error('Access denied to delete dataset.');
      }

      // Delete all data associated with the dataset
      await this.dataStorage.deleteDatasetData(datasetId);
      // Delete dataset metadata
      await this.dataStorage.deleteMetadata(datasetId);

      this.eventBus.publish(
        MessageProtocol.createEvent(
          'dataset.deleted',
          { datasetId, ownerId: actor.id },
          UnifiedOntology.Dataset
        )
      );
      this.telemetry.trackEvent('dataset_deleted', {
        datasetId,
        actorId: actor.id,
      });
      await this.audit(
        datasetId,
        DatasetAuditAction.DELETE,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS
      );

      this.logger.warn(`Dataset ${datasetId} and all its data permanently deleted.`);
    } catch (error) {
      this.logger.error(`Failed to delete dataset ${datasetId}: ${error}`);
      await this.audit(
        datasetId,
        DatasetAuditAction.DELETE,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        { error: (error as Error).message }
      );
      throw error;
    }
  }

  /**
   * API: Calculates and updates the cost metrics for a given dataset.
   * This can be triggered periodically or after significant operations.
   * @param datasetId - The ID of the dataset.
   * @returns Updated cost metrics.
   */
  public async updateDatasetCostMetrics(
    datasetId: string
  ): Promise<DatasetCostMetrics> {
    const actor = this.authIdentity.getCurrentUser(); // System or user
    const actorId = actor ? actor.id : 'system';
    const actorType = actor ? DatasetAuditActorType.USER : DatasetAuditActorType.SYSTEM;

    try {
      const dataset = await this.dataStorage.getMetadata<DatasetMetadata>(
        datasetId
      );
      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found.`);
      }

      // Calculate storage cost
      const storageBytes = await this.dataStorage.getDatasetSize(datasetId);
      const storageCost = this.costCalculator.estimateStorageCost(
        storageBytes,
        this.config.storageProvider
      );

      // Calculate labeling cost (sum of costs from all labeling jobs)
      const labelingCost =
        dataset.labelingJobs?.reduce((sum, job) => sum + (job.cost || 0), 0) ||
        0;

      // Placeholder for processing cost (e.g., validation, transformation, embedding generation)
      // This would typically come from internal service metrics or estimates
      const processingCost = this.costCalculator.estimateProcessingCost(
        datasetId,
        dataset.versions.length,
        dataset.transformationPipelines?.length || 0,
        dataset.schema ? 1 : 0
      );

      const totalCost = storageCost + labelingCost + processingCost;

      const newCostMetrics: DatasetCostMetrics = {
        storageBytes,
        storageCost,
        labelingCost,
        processingCost,
        totalCost,
        lastCalculated: new Date().toISOString(),
      };

      dataset.costMetrics = newCostMetrics;
      await this.dataStorage.storeMetadata(datasetId, dataset);

      this.eventBus.publish(
        MessageProtocol.createEvent(
          'dataset.costMetricsUpdated',
          { datasetId, totalCost },
          UnifiedOntology.Dataset
        )
      );
      this.telemetry.trackEvent('dataset_cost_metrics_updated', {
        datasetId,
        totalCost,
      });
      await this.audit(
        datasetId,
        DatasetAuditAction.UPDATE_COST_METRICS,
        actorId,
        actorType,
        DatasetAuditOutcome.SUCCESS,
        { newCostMetrics }
      );

      this.logger.info(
        `Cost metrics updated for dataset ${datasetId}. Total cost: $${totalCost.toFixed(2)}`
      );
      return newCostMetrics;
    } catch (error) {
      this.logger.error(
        `Failed to update cost metrics for dataset ${datasetId}: ${error}`
      );
      await this.audit(
        datasetId,
        DatasetAuditAction.UPDATE_COST_METRICS,
        actorId,
        actorType,
        DatasetAuditOutcome.FAILURE,
        { error: (error as Error).message }
      );
      throw error;
    }
  }

  /**
   * API: Generates embeddings for a specific dataset version using a configured embedding service.
   * This can be used for semantic search, similarity, etc.
   * @param datasetId - The ID of the dataset.
   * @param versionId - The specific version ID.
   * @param embeddingServiceName - The name of the configured embedding service (e.g., 'OpenAI', 'Cohere').
   * @param config - Configuration specific to the embedding generation (e.g., batch size).
   * @returns URI to the generated embeddings.
   */
  public async generateDatasetEmbeddings(
    datasetId: string,
    versionId: string,
    embeddingServiceName: string,
    config: Record<string, any> = {}
  ): Promise<string> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to generate embeddings.');
    }

    if (!this.isFeatureEnabled(DatasetFeatureFlag.DATASET_EMBEDDING_GENERATION)) {
      throw new Error('Dataset embedding generation is currently disabled.');
    }

    try {
      const dataset = await this.dataStorage.getMetadata<DatasetMetadata>(
        datasetId
      );
      if (!dataset) {
        throw new Error(`Dataset with ID ${datasetId} not found.`);
      }

      if (
        !this.accessControlService.canAccessDataset(
          actor,
          dataset,
          DatasetOperation.GENERATE_EMBEDDINGS
        )
      ) {
        await this.audit(
          datasetId,
          DatasetAuditAction.GENERATE_EMBEDDINGS,
          actor.id,
          DatasetAuditActorType.USER,
          DatasetAuditOutcome.FAILURE,
          { reason: 'Access denied' }
        );
        throw new Error('Access denied to generate dataset embeddings.');
      }

      const embeddingAdapter =
        this.embeddingAdapters.get(embeddingServiceName);
      if (!embeddingAdapter) {
        throw new Error(
          `Embedding service adapter "${embeddingServiceName}" not found or configured.`
        );
      }

      const version = dataset.versions.find((v) => v.versionId === versionId);
      if (!version || !version.dataUri) {
        throw new Error(
          `Data URI not found for version ${versionId} of dataset ${datasetId}.`
        );
      }

      // Get data for embedding generation (e.g., download or stream)
      const dataContent = await this.dataStorage.readData(version.dataUri);

      // Generate embeddings
      const embeddings = await embeddingAdapter.generateEmbeddings(
        dataContent,
        config
      );

      // Store embeddings (e.g., in a separate file or vector database)
      const embeddingsUri = await this.dataStorage.storeEmbeddings(
        datasetId,
        versionId,
        embeddingServiceName,
        embeddings
      );

      // Update dataset metadata with embeddings URI
      version.embeddings = version.embeddings || {};
      version.embeddings[embeddingServiceName] = embeddingsUri;
      dataset.updatedAt = new Date().toISOString();
      await this.dataStorage.storeMetadata(datasetId, dataset);

      // Update cost metrics (embedding generation has a cost)
      await this.updateDatasetCostMetrics(datasetId);

      this.eventBus.publish(
        MessageProtocol.createEvent(
          'dataset.embeddingsGenerated',
          { datasetId, versionId, embeddingServiceName, embeddingsUri },
          UnifiedOntology.Dataset
        )
      );
      this.telemetry.trackEvent('dataset_embeddings_generated', {
        datasetId,
        versionId,
        embeddingServiceName,
        actorId: actor.id,
      });
      await this.audit(
        datasetId,
        DatasetAuditAction.GENERATE_EMBEDDINGS,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS,
        { versionId, embeddingServiceName, embeddingsUri }
      );

      this.logger.info(
        `Embeddings generated for dataset ${datasetId} (version ${versionId}) using ${embeddingServiceName}. URI: ${embeddingsUri}`
      );
      return embeddingsUri;
    } catch (error) {
      this.logger.error(
        `Failed to generate embeddings for dataset ${datasetId}, version ${versionId}: ${error}`
      );
      await this.audit(
        datasetId,
        DatasetAuditAction.GENERATE_EMBEDDINGS,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        {
          versionId,
          embeddingServiceName,
          error: (error as Error).message,
        }
      );
      throw error;
    }
  }

  /**
   * API: Searches for datasets based on various criteria.
   * @param query - Search query string.
   * @param filters - Structured filters (e.g., ownerId, tags, status).
   * @param pagination - Pagination options.
   * @returns A list of matching dataset metadata.
   */
  public async searchDatasets(
    query: string,
    filters: Record<string, any> = {},
    pagination: { limit: number; offset: number } = { limit: 10, offset: 0 }
  ): Promise<DatasetMetadata[]> {
    const actor = this.authIdentity.getCurrentUser();
    if (!actor) {
      throw new Error('Authentication required to search datasets.');
    }

    if (!this.isFeatureEnabled(DatasetFeatureFlag.DATASET_SEARCH)) {
      throw new Error('Dataset search is currently disabled.');
    }

    try {
      // This would typically delegate to a dedicated search service (e.g., Elasticsearch, OpenSearch)
      // For this example, we'll simulate a basic search over metadata.
      const allDatasets = await this.dataStorage.listAllMetadata<DatasetMetadata>();

      const results = this.searchService.search(
        allDatasets,
        query,
        filters,
        pagination
      );

      // Filter results based on access control for the current actor
      const accessibleResults = results.filter((dataset) =>
        this.accessControlService.canAccessDataset(
          actor,
          dataset,
          DatasetOperation.READ_METADATA
        )
      );

      await this.audit(
        'N/A', // No specific dataset ID for a search operation
        DatasetAuditAction.SEARCH_DATASETS,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.SUCCESS,
        { query, filters, resultCount: accessibleResults.length }
      );

      return accessibleResults;
    } catch (error) {
      this.logger.error(`Failed to search datasets: ${error}`);
      await this.audit(
        'N/A',
        DatasetAuditAction.SEARCH_DATASETS,
        actor.id,
        DatasetAuditActorType.USER,
        DatasetAuditOutcome.FAILURE,
        { query, filters, error: (error as Error).message }
      );
      throw error;
    }
  }

  // --- Internal Extensibility Hooks ---

  /**
   * Hook: Register a custom data storage adapter.
   * @param providerName - Name of the new provider.
   * @param adapterInstance - Instance of the custom adapter.
   */
  public registerStorageAdapter(
    providerName: DatasetStorageProvider,
    adapterInstance: IDataStorageAdapter
  ): void {
    // In a real system, this would require re-initializing the dataStorage or having a map of adapters
    // For simplicity, this example assumes a single active storage adapter.
    // A more robust system would allow dynamic switching or multiple active adapters.
    this.logger.warn(
      `Attempted to register storage adapter for ${providerName}. Current implementation only supports one active adapter.`
    );
    // Example of how it *could* work with a map:
    // this.storageAdapters.set(providerName, adapterInstance);
  }

  /**
   * Hook: Register a custom labeling platform adapter.
   * @param platformName - Name of the new platform.
   * @param adapterInstance - Instance of the custom adapter.
   */
  public registerLabelingAdapter(
    platformName: string,
    adapterInstance: ILabelingPlatformAdapter
  ): void {
    this.labelingAdapters.set(platformName, adapterInstance);
    this.logger.info(`Custom labeling adapter "${platformName}" registered.`);
  }

  /**
   * Hook: Register a custom embedding service adapter.
   * @param serviceName - Name of the new service.
   * @param adapterInstance - Instance of the custom adapter.
   */
  public registerEmbeddingAdapter(
    serviceName: string,
    adapterInstance: IEmbeddingServiceAdapter
  ): void {
    this.embeddingAdapters.set(serviceName, adapterInstance);
    this.logger.info(`Custom embedding adapter "${serviceName}" registered.`);
  }

  /**
   * Hook: Add a custom data validation rule.
   * @param ruleName - Name of the rule.
   * @param validatorFunction - Function that performs validation.
   */
  public addCustomValidationRule(
    ruleName: string,
    validatorFunction: (data: any, schema: DatasetSchema) => boolean
  ): void {
    this.dataValidationService.addCustomRule(ruleName, validatorFunction);
    this.logger.info(`Custom validation rule "${ruleName}" added.`);
  }

  /**
   * Hook: Add a custom data transformation step.
   * @param transformationName - Name of the transformation.
   * @param transformerFunction - Function that performs transformation.
   */
  public addCustomTransformation(
    transformationName: string,
    transformerFunction: (data: any) => any
  ): void {
    this.dataTransformationService.addCustomTransformation(
      transformationName,
      transformerFunction
    );
    this.logger.info(
      `Custom transformation "${transformationName}" added.`
    );
  }

  // --- Self-Querying Agent Mode Endpoints ---

  /**
   * /introspect
   * Provides a detailed overview of the service's current state, configurations, and capabilities.
   */
  public async introspect(): Promise<DatasetIntrospection> {
    return {
      serviceName: 'APP_11_Datasets_LifecycleManager',
      status: 'Operational',
      configuredStorageProvider: this.config.storageProvider,
      configuredLabelingPlatforms: Array.from(this.labelingAdapters.keys()),
      configuredEmbeddingServices: Array.from(this.embeddingAdapters.keys()),
      enabledFeatureFlags: Object.entries(this.config.featureFlags)
        .filter(([, enabled]) => enabled)
        .map(([flag]) => flag as DatasetFeatureFlag),
      enabledJurisdictionalControls: Object.entries(
        this.config.jurisdictionalControls
      )
        .filter(([, enabled]) => enabled)
        .map(([jurisdiction]) => jurisdiction as DatasetJurisdiction),
      coreSDKVersion: this.config.coreSDK.getVersion(),
      activeHooks: {
        customValidationRules: this.dataValidationService.listCustomRules(),
        customTransformations:
          this.dataTransformationService.listCustomTransformations(),
      },
      // Add more details as needed, e.g., current resource usage, recent errors
    };
  }

  /**
   * /assumptions
   * Lists key assumptions made in the design and operation of this service.
   */
  public async assumptions(): Promise<DatasetAssumptions> {
    return {
      assumptions: [
        'Underlying storage (S3, GCS, etc.) is highly available and durable.',
        'Labeling platforms (Scale AI, Labelbox) provide consistent APIs and data formats.',
        'Embedding services (OpenAI, Cohere) are performant and return consistent embeddings.',
        'Network connectivity to external AI vendor APIs is reliable.',
        'The shared Core SDK (Auth, EventBus, Logger) is correctly configured and operational.',
        'Data schemas, once defined, are generally stable or evolve gracefully.',
        'Access control policies are enforced by the `AccessControlService` and are correctly configured.',
        'Cost estimation models are reasonably accurate for billing purposes.',
        'Data ingestion URIs are accessible by the service.',
        'Jurisdictional controls are correctly mapped to feature flags and applied.',
      ],
    };
  }

  /**
   * /failure-modes
   * Describes potential failure modes and their implications.
   */
  public async failureModes(): Promise<DatasetFailureMode[]> {
    return [
      {
        name: 'StorageProviderFailure',
        description:
          'Failure of the underlying data storage provider (e.g., S3 outage).',
        impact:
          'Data ingestion, retrieval, and versioning operations will fail. Datasets become inaccessible.',
        mitigation:
          'Redundant storage, multi-region deployments, robust error handling with retries, monitoring.',
      },
      {
        name: 'LabelingPlatformAPIError',
        description:
          'API errors or downtime from integrated labeling platforms (e.g., Scale AI).',
        impact:
          'New labeling jobs cannot be initiated, or labeled data cannot be imported.',
        mitigation:
          'Circuit breakers, retries, fallback to manual labeling processes, multi-vendor strategy.',
      },
      {
        name: 'DataValidationFailure',
        description:
          'Incoming data fails schema validation or quality checks.',
        impact:
          'New dataset versions cannot be created, leading to data ingestion bottlenecks or corrupted datasets.',
        mitigation:
          'Clear error reporting, data quarantine, manual review processes, pre-validation tools.',
      },
      {
        name: 'AccessControlMisconfiguration',
        description:
          'Incorrect access policies or bugs in the access control service.',
        impact:
          'Unauthorized access to sensitive datasets or legitimate users being denied access.',
        mitigation:
          'Strict policy-as-code, regular audits, granular permissions, least privilege principle.',
      },
      {
        name: 'CostEstimationInaccuracy',
        description:
          'Errors in cost calculation logic or external pricing changes not reflected.',
        impact:
          'Incorrect billing for dataset usage, leading to financial discrepancies or customer dissatisfaction.',
        mitigation:
          'Regular review of pricing models, integration with billing systems, transparent cost breakdowns.',
      },
      {
        name: 'DataTransformationPipelineFailure',
        description:
          'Errors during data transformation steps (e.g., malformed scripts, resource limits).',
        impact:
          'Processed data is incorrect or unavailable, affecting downstream model training.',
        mitigation:
          'Idempotent transformations, robust logging, data lineage tracking, manual intervention for failed pipelines.',
      },
      {
        name: 'EmbeddingServiceFailure',
        description:
          'Downtime or errors from integrated embedding generation services.',
        impact:
          'Inability to generate vector embeddings for datasets, impacting search and similarity features.',
        mitigation:
          'Multi-vendor embedding strategy, caching, graceful degradation, monitoring.',
      },
    ];
  }

  /**
   * /update-triggers
   * Identifies conditions or events that would necessitate an update or redeployment of this service.
   */
  public async updateTriggers(): Promise<DatasetUpdateTrigger[]> {
    return [
      {
        name: 'NewStorageProviderIntegration',
        description: 'Adding support for a new cloud storage provider (e.g., Alibaba Cloud OSS).',
        type: 'Feature',
        impact: 'Requires new adapter development and configuration updates.',
      },
      {
        name: 'LabelingPlatformAPIChange',
        description: 'Breaking API changes in an integrated labeling platform (e.g., Scale AI).',
        type: 'Dependency',
        impact: 'Requires updating the corresponding labeling adapter.',
      },
      {
        name: 'NewDataValidationRequirement',
        description: 'Introduction of new compliance or data quality validation rules.',
        type: 'Policy/Compliance',
        impact: 'Requires updates to the `DataValidationService` or custom rule registration.',
      },
      {
        name: 'CoreSDKUpdate',
        description: 'Significant updates or breaking changes in the shared Core SDK.',
        type: 'Dependency',
        impact: 'Requires review and potential adaptation of Core SDK interactions.',
      },
      {
        name: 'CostModelChange',
        description: 'Changes in pricing from cloud providers or AI vendors affecting cost calculations.',
        type: 'Financial',
        impact: 'Requires updates to the `DatasetCostCalculator` logic.',
      },
      {
        name: 'SecurityVulnerability',
        description: 'Discovery of a critical security vulnerability in dependencies or custom code.',
        type: 'Security',
        impact: 'Requires immediate patch and redeployment.',
      },
      {
        name: 'PerformanceBottleneck',
        description: 'Identification of performance issues under high load (e.g., slow data ingestion).',
        type: 'Performance',
        impact: 'Requires optimization of data processing pipelines or storage interactions.',
      },
    ];
  }

  // --- Machine-readable agent metadata block ---
  public agent_metadata: DatasetAgentMetadata = {
    purpose:
      'Manages the full lifecycle of AI datasets, ensuring versioning, access control, and integration with data storage and labeling platforms.',
    dependencies: [
      'CoreSDK (AuthIdentity, EventBus, Logger, FeatureFlagService, AuditLogger, CostEstimator, Telemetry)',
      'IDataStorageAdapter (S3Adapter, GCSAdapter, AzureBlobAdapter, LocalStorageAdapter)',
      'ILabelingPlatformAdapter (ScaleAIAdapter, LabelboxAdapter, SuperAnnotateAdapter)',
      'IEmbeddingServiceAdapter (OpenAIEmbeddingsAdapter, CohereEmbeddingsAdapter, HuggingFaceEmbeddingsAdapter)',
      'DataValidationService',
      'DataTransformationService',
      'AccessControlService',
      'DatasetVersionManager',
      'DatasetSchemaManager',
      'DatasetSearchService',
      'DatasetCostCalculator',
    ],
    invalidation_conditions: [
      'Breaking changes in underlying storage provider APIs.',
      'Major API changes in integrated labeling or embedding platforms.',
      'Fundamental shifts in data governance or compliance requirements.',
      'Incompatibility with new versions of the Core SDK.',
      'Significant changes to the unified ontology affecting dataset concepts.',
    ],
    adjacent_apps: [
      'APP_01_Inference_CostRouter (for cost data)',
      'APP_03_Agents_ToolCallingRegistry (datasets as tools)',
      'APP_05_Memory_VectorSystem (for storing dataset embeddings)',
      'APP_07_Evaluation_BenchmarkingService (consumes datasets)',
      'APP_08_Synthetic_DataGenerator (produces datasets)',
      'APP_09_Prompt_CompilationVersioning (may use datasets for prompt engineering)',
      'APP_10_AICost_AccountingBilling (consumes cost metrics)',
      'APP_12_Compliance_AuditLogging (consumes audit logs)',
      'APP_14_Agents_MultiModelOrchestrator (agents may interact with datasets)',
      'APP_15_FineTuning_Orchestrator (consumes datasets for fine-tuning)',
      'APP_17_Developer_Observability (consumes telemetry and logs)',
      'APP_19_Governance_PolicyEnforcement (enforces policies on datasets)',
    ],
  };
}

// --- Disclaimer Banner (for UI/README) ---
/*
DISCLAIMER:
This software is provided "as is", without warranty of any kind, express or
implied, including but not limited to the warranties of merchantability,
fitness for a particular purpose and noninfringement. In no event shall the
authors or copyright holders be liable for any claim, damages or other
liability, whether in an action of contract, tort or otherwise, arising from,
out of or in connection with the software or the use or other dealings in the
software.

This application is a system for managing AI datasets. It does not provide
financial advice, make claims or guarantees about model performance, or engage
in behavioral targeting. All data processing is for system functionality only.
Users are responsible for ensuring their use complies with all applicable
laws and regulations.
*/