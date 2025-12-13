// apps/APP_23_Market_ServiceDiscovery/src/ServiceRegistry.ts

/**
 * APP_23_Market_ServiceDiscovery
 * ServiceRegistry.ts
 *
 * This file contains the core logic for the ServiceRegistry, a central component
 * of the APP_23_Market_ServiceDiscovery application. It provides mechanisms for
 * services (other applications in the ecosystem) to register themselves,
 * discover other services, and manage their lifecycle within the shared
 * protocol layer.
 *
 * License: MIT
 * Copyright (c) 2024 Aetheryx Technologies Inc.
 */

import {
  AuthToken,
  AuthService,
  PermissionScope,
  Identity,
} from '../../_shared/sdk/auth/authService';
import {
  EventBus,
  ServiceRegisteredEvent,
  ServiceDeregisteredEvent,
  ServiceHeartbeatEvent,
  ServiceDiscoveryRequestEvent,
  ServiceDiscoveryResponseEvent,
  TypedEvent,
} from '../../_shared/sdk/bus/eventBus';
import {
  ServiceMetadata,
  ServiceEndpoint,
  ServiceHealthStatus,
  ServiceProtocol,
  ServiceCapability,
  ServiceContract,
  ServiceDiscoveryQuery,
  ServiceDiscoveryResult,
  ServiceRegistrationRequest,
  ServiceRegistrationResponse,
  ServiceDeregistrationRequest,
  ServiceHeartbeat,
  ServiceUpdate,
} from '../../_shared/sdk/types/serviceDiscovery';
import {
  Logger,
  LogLevel,
} from '../../_shared/sdk/utils/logger';
import {
  Configuration,
  FeatureFlag,
} from '../../_shared/sdk/config/config';
import {
  TelemetryService,
  MetricType,
} from '../../_shared/sdk/telemetry/telemetryService';
import {
  RateLimiter,
  RateLimitConfig,
} from '../../_shared/sdk/security/rateLimiter';
import {
  CircuitBreaker,
  CircuitBreakerConfig,
} from '../../_shared/sdk/resilience/circuitBreaker';
import {
  Cache,
  CacheConfig,
} from '../../_shared/sdk/utils/cache';

// --- Configuration and Constants ---
const SERVICE_REGISTRY_CONFIG_PREFIX = 'serviceRegistry';
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
const DEFAULT_DEREGISTER_AFTER_MISSED_HEARTBEATS = 3;
const DEFAULT_CACHE_TTL_MS = 60000; // 1 minute for discovery results
const MAX_SERVICE_METADATA_SIZE_BYTES = 1024 * 10; // 10KB
const MAX_ENDPOINT_COUNT_PER_SERVICE = 10;

interface ServiceRegistryConfig {
  heartbeatIntervalMs: number;
  deregisterAfterMissedHeartbeats: number;
  discoveryCacheTtlMs: number;
  maxServiceMetadataSizeBytes: number;
  maxEndpointCountPerService: number;
  rateLimit: RateLimitConfig;
  circuitBreaker: CircuitBreakerConfig;
  enableDiscoveryCache: boolean;
  enableRateLimiting: boolean;
  enableCircuitBreaker: boolean;
  enableAuditLogging: boolean;
}

const defaultConfig: ServiceRegistryConfig = {
  heartbeatIntervalMs: DEFAULT_HEARTBEAT_INTERVAL_MS,
  deregisterAfterMissedHeartbeats: DEFAULT_DEREGISTER_AFTER_MISSED_HEARTBEATS,
  discoveryCacheTtlMs: DEFAULT_CACHE_TTL_MS,
  maxServiceMetadataSizeBytes: MAX_SERVICE_METADATA_SIZE_BYTES,
  maxEndpointCountPerService: MAX_ENDPOINT_COUNT_PER_SERVICE,
  rateLimit: {
    points: 100, // 100 requests per second
    duration: 1,
    blockDuration: 60,
  },
  circuitBreaker: {
    threshold: 5, // 5 failures
    timeout: 30000, // 30 seconds
    resetTimeout: 60000, // 60 seconds
  },
  enableDiscoveryCache: true,
  enableRateLimiting: true,
  enableCircuitBreaker: true,
  enableAuditLogging: true,
};

// --- Internal Data Structures ---
interface RegisteredServiceEntry {
  serviceId: string;
  ownerId: string; // Identity ID of the service owner
  metadata: ServiceMetadata;
  endpoints: ServiceEndpoint[];
  capabilities: ServiceCapability[];
  contracts: ServiceContract[];
  lastHeartbeat: number; // Timestamp of the last received heartbeat
  missedHeartbeats: number;
  status: ServiceHealthStatus;
  registeredAt: number;
  updatedAt: number;
}

/**
 * ServiceRegistry class
 * Manages the registration, discovery, and health monitoring of services
 * within the Aetheryx ecosystem.
 */
export class ServiceRegistry {
  private services: Map<string, RegisteredServiceEntry> = new Map();
  private readonly eventBus: EventBus;
  private readonly authService: AuthService;
  private readonly logger: Logger;
  private readonly config: ServiceRegistryConfig;
  private readonly telemetryService: TelemetryService;
  private readonly rateLimiter: RateLimiter;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly discoveryCache: Cache<ServiceDiscoveryQuery, ServiceDiscoveryResult[]>;
  private heartbeatMonitorInterval: NodeJS.Timeout | null = null;

  constructor(
    eventBus: EventBus,
    authService: AuthService,
    configuration: Configuration,
    telemetryService: TelemetryService,
    logger: Logger
  ) {
    this.eventBus = eventBus;
    this.authService = authService;
    this.telemetryService = telemetryService;
    this.logger = logger.withContext('ServiceRegistry');

    // Load configuration, merging defaults with provided overrides
    this.config = {
      ...defaultConfig,
      ...configuration.get<Partial<ServiceRegistryConfig>>(SERVICE_REGISTRY_CONFIG_PREFIX, {}),
    };

    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
    this.discoveryCache = new Cache<ServiceDiscoveryQuery, ServiceDiscoveryResult[]>(this.config.discoveryCacheTtlMs);

    this.setupEventHandlers();
    this.startHeartbeatMonitor();

    this.logger.info('ServiceRegistry initialized.', { config: this.config });
  }

  /**
   * Sets up event listeners for service lifecycle events.
   */
  private setupEventHandlers(): void {
    this.eventBus.subscribe(ServiceRegisteredEvent.TYPE, this.handleServiceRegistered.bind(this));
    this.eventBus.subscribe(ServiceDeregisteredEvent.TYPE, this.handleServiceDeregistered.bind(this));
    this.eventBus.subscribe(ServiceHeartbeatEvent.TYPE, this.handleServiceHeartbeat.bind(this));
    this.eventBus.subscribe(ServiceDiscoveryRequestEvent.TYPE, this.handleServiceDiscoveryRequest.bind(this));
    // Add more handlers for updates, status changes, etc.
  }

  /**
   * Starts the periodic monitor for service heartbeats.
   */
  private startHeartbeatMonitor(): void {
    if (this.heartbeatMonitorInterval) {
      clearInterval(this.heartbeatMonitorInterval);
    }
    this.heartbeatMonitorInterval = setInterval(
      this.checkServiceHeartbeats.bind(this),
      this.config.heartbeatIntervalMs
    );
    this.logger.debug(`Heartbeat monitor started with interval: ${this.config.heartbeatIntervalMs}ms`);
  }

  /**
   * Stops the periodic monitor for service heartbeats.
   */
  private stopHeartbeatMonitor(): void {
    if (this.heartbeatMonitorInterval) {
      clearInterval(this.heartbeatMonitorInterval);
      this.heartbeatMonitorInterval = null;
      this.logger.debug('Heartbeat monitor stopped.');
    }
  }

  /**
   * Periodically checks all registered services for missed heartbeats and updates their status.
   * Services exceeding `deregisterAfterMissedHeartbeats` are automatically deregistered.
   */
  private checkServiceHeartbeats(): void {
    const now = Date.now();
    const servicesToDeregister: string[] = [];

    this.services.forEach((entry, serviceId) => {
      const timeSinceLastHeartbeat = now - entry.lastHeartbeat;

      if (timeSinceLastHeartbeat > this.config.heartbeatIntervalMs) {
        entry.missedHeartbeats++;
        this.logger.warn(`Service ${serviceId} missed heartbeat. Missed count: ${entry.missedHeartbeats}`);
        this.telemetryService.recordMetric('service_heartbeat_missed', 1, { serviceId: serviceId });

        if (entry.missedHeartbeats >= this.config.deregisterAfterMissedHeartbeats) {
          servicesToDeregister.push(serviceId);
          this.logger.error(`Service ${serviceId} exceeded missed heartbeat threshold. Marking for deregistration.`);
        } else if (entry.status !== ServiceHealthStatus.DEGRADED) {
          entry.status = ServiceHealthStatus.DEGRADED;
          this.logger.warn(`Service ${serviceId} status changed to DEGRADED due to missed heartbeats.`);
          this.telemetryService.recordMetric('service_status_change', 1, { serviceId: serviceId, status: 'DEGRADED' });
          this.publishServiceUpdate(entry);
        }
      } else {
        // Reset missed heartbeats if a heartbeat was received within the interval
        if (entry.missedHeartbeats > 0) {
          entry.missedHeartbeats = 0;
          this.logger.info(`Service ${serviceId} heartbeat restored.`);
          if (entry.status !== ServiceHealthStatus.HEALTHY) {
            entry.status = ServiceHealthStatus.HEALTHY;
            this.logger.info(`Service ${serviceId} status changed to HEALTHY.`);
            this.telemetryService.recordMetric('service_status_change', 1, { serviceId: serviceId, status: 'HEALTHY' });
            this.publishServiceUpdate(entry);
          }
        }
      }
    });

    servicesToDeregister.forEach(serviceId => {
      this.deregisterServiceInternal(serviceId, 'AUTOMATIC_DEREGISTRATION_MISSED_HEARTBEATS');
    });

    this.telemetryService.recordMetric('service_registry_active_services', this.services.size, MetricType.GAUGE);
  }

  /**
   * Publishes a ServiceUpdate event to the event bus.
   * @param entry The registered service entry.
   */
  private publishServiceUpdate(entry: RegisteredServiceEntry): void {
    const updateEvent = new TypedEvent('ServiceUpdate', {
      serviceId: entry.serviceId,
      ownerId: entry.ownerId,
      metadata: entry.metadata,
      endpoints: entry.endpoints,
      capabilities: entry.capabilities,
      contracts: entry.contracts,
      status: entry.status,
      updatedAt: entry.updatedAt,
    });
    this.eventBus.publish(updateEvent);
    this.logger.debug(`Published ServiceUpdate for ${entry.serviceId}`);
  }

  /**
   * Handles incoming ServiceRegisteredEvent.
   * @param event The ServiceRegisteredEvent.
   */
  private async handleServiceRegistered(event: TypedEvent<ServiceRegistrationRequest>): Promise<void> {
    const { serviceId, ownerId, metadata, endpoints, capabilities, contracts, authToken } = event.payload;

    if (this.config.enableRateLimiting && !this.rateLimiter.consume(ownerId, 'register_service')) {
      this.logger.warn(`Rate limit exceeded for service registration by ${ownerId}`);
      this.eventBus.publish(new TypedEvent('ServiceRegistrationFailed', {
        serviceId,
        ownerId,
        reason: 'Rate limit exceeded',
        timestamp: Date.now(),
      }));
      return;
    }

    try {
      await this.circuitBreaker.execute(async () => {
        // Validate authentication and authorization
        const identity = await this.authService.validateToken(authToken);
        if (!identity || identity.id !== ownerId || !this.authService.hasPermission(identity, PermissionScope.SERVICE_REGISTER)) {
          this.logger.warn(`Unauthorized service registration attempt for ${serviceId} by ${ownerId}`);
          this.eventBus.publish(new TypedEvent('ServiceRegistrationFailed', {
            serviceId,
            ownerId,
            reason: 'Unauthorized',
            timestamp: Date.now(),
          }));
          return;
        }

        // Input validation
        if (!serviceId || !ownerId || !metadata || !endpoints || endpoints.length === 0) {
          this.logger.error(`Invalid registration request: missing required fields for service ${serviceId}`);
          this.eventBus.publish(new TypedEvent('ServiceRegistrationFailed', {
            serviceId,
            ownerId,
            reason: 'Invalid request payload',
            timestamp: Date.now(),
          }));
          return;
        }

        if (JSON.stringify(metadata).length > this.config.maxServiceMetadataSizeBytes) {
          this.logger.error(`Service metadata too large for ${serviceId}`);
          this.eventBus.publish(new TypedEvent('ServiceRegistrationFailed', {
            serviceId,
            ownerId,
            reason: 'Metadata too large',
            timestamp: Date.now(),
          }));
          return;
        }

        if (endpoints.length > this.config.maxEndpointCountPerService) {
          this.logger.error(`Too many endpoints for service ${serviceId}`);
          this.eventBus.publish(new TypedEvent('ServiceRegistrationFailed', {
            serviceId,
            ownerId,
            reason: 'Too many endpoints',
            timestamp: Date.now(),
          }));
          return;
        }

        const now = Date.now();
        const existingEntry = this.services.get(serviceId);

        if (existingEntry && existingEntry.ownerId !== ownerId) {
          this.logger.warn(`Attempt to re-register service ${serviceId} by different owner ${ownerId}. Current owner: ${existingEntry.ownerId}`);
          this.eventBus.publish(new TypedEvent('ServiceRegistrationFailed', {
            serviceId,
            ownerId,
            reason: 'Service ID already owned by another identity',
            timestamp: Date.now(),
          }));
          return;
        }

        const newEntry: RegisteredServiceEntry = {
          serviceId,
          ownerId,
          metadata,
          endpoints,
          capabilities: capabilities || [],
          contracts: contracts || [],
          lastHeartbeat: now,
          missedHeartbeats: 0,
          status: ServiceHealthStatus.HEALTHY,
          registeredAt: existingEntry ? existingEntry.registeredAt : now,
          updatedAt: now,
        };

        this.services.set(serviceId, newEntry);
        this.logger.info(`Service ${serviceId} registered/updated by ${ownerId}.`, { metadata: newEntry.metadata.name });
        this.telemetryService.recordMetric('service_registered', 1, { serviceId: serviceId, ownerId: ownerId });

        if (this.config.enableAuditLogging) {
          this.eventBus.publish(new TypedEvent('AuditLog', {
            action: 'SERVICE_REGISTERED',
            actorId: ownerId,
            targetId: serviceId,
            details: { metadata: newEntry.metadata.name, endpoints: newEntry.endpoints.length },
            timestamp: now,
            jurisdiction: metadata.jurisdiction || 'GLOBAL', // Example jurisdictional control
          }));
        }

        // Respond to the registering service
        this.eventBus.publish(new TypedEvent<ServiceRegistrationResponse>('ServiceRegistrationResponse', {
          serviceId,
          success: true,
          message: 'Service registered successfully',
          timestamp: now,
        }, event.correlationId)); // Use correlationId to link response to request
      });
    } catch (error) {
      this.logger.error(`Error during service registration for ${serviceId}: ${error instanceof Error ? error.message : String(error)}`);
      this.eventBus.publish(new TypedEvent('ServiceRegistrationFailed', {
        serviceId,
        ownerId,
        reason: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
      }));
    }
  }

  /**
   * Handles incoming ServiceDeregisteredEvent.
   * @param event The ServiceDeregisteredEvent.
   */
  private async handleServiceDeregistered(event: TypedEvent<ServiceDeregistrationRequest>): Promise<void> {
    const { serviceId, ownerId, authToken, reason } = event.payload;

    if (this.config.enableRateLimiting && !this.rateLimiter.consume(ownerId, 'deregister_service')) {
      this.logger.warn(`Rate limit exceeded for service deregistration by ${ownerId}`);
      this.eventBus.publish(new TypedEvent('ServiceDeregistrationFailed', {
        serviceId,
        ownerId,
        reason: 'Rate limit exceeded',
        timestamp: Date.now(),
      }));
      return;
    }

    try {
      await this.circuitBreaker.execute(async () => {
        const identity = await this.authService.validateToken(authToken);
        if (!identity || identity.id !== ownerId || !this.authService.hasPermission(identity, PermissionScope.SERVICE_DEREGISTER)) {
          this.logger.warn(`Unauthorized service deregistration attempt for ${serviceId} by ${ownerId}`);
          this.eventBus.publish(new TypedEvent('ServiceDeregistrationFailed', {
            serviceId,
            ownerId,
            reason: 'Unauthorized',
            timestamp: Date.now(),
          }));
          return;
        }

        this.deregisterServiceInternal(serviceId, reason || 'MANUAL_DEREGISTRATION', ownerId);
      });
    } catch (error) {
      this.logger.error(`Error during service deregistration for ${serviceId}: ${error instanceof Error ? error.message : String(error)}`);
      this.eventBus.publish(new TypedEvent('ServiceDeregistrationFailed', {
        serviceId,
        ownerId,
        reason: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
      }));
    }
  }

  /**
   * Internal method to deregister a service.
   * @param serviceId The ID of the service to deregister.
   * @param reason The reason for deregistration.
   * @param ownerId The ID of the owner initiating deregistration (optional, for audit).
   */
  private deregisterServiceInternal(serviceId: string, reason: string, ownerId?: string): void {
    const entry = this.services.get(serviceId);
    if (entry) {
      // Ensure only the owner or an authorized admin can deregister
      if (ownerId && entry.ownerId !== ownerId && !this.authService.hasPermission({ id: ownerId, roles: [] } as Identity, PermissionScope.ADMIN_SERVICE_DEREGISTER)) {
        this.logger.warn(`Unauthorized attempt to deregister service ${serviceId} by ${ownerId}. Owner is ${entry.ownerId}.`);
        this.eventBus.publish(new TypedEvent('ServiceDeregistrationFailed', {
          serviceId,
          ownerId,
          reason: 'Unauthorized to deregister this service',
          timestamp: Date.now(),
        }));
        return;
      }

      this.services.delete(serviceId);
      this.logger.info(`Service ${serviceId} deregistered. Reason: ${reason}`, { ownerId: entry.ownerId });
      this.telemetryService.recordMetric('service_deregistered', 1, { serviceId: serviceId, reason: reason });

      if (this.config.enableAuditLogging) {
        this.eventBus.publish(new TypedEvent('AuditLog', {
          action: 'SERVICE_DEREGISTERED',
          actorId: ownerId || 'SYSTEM',
          targetId: serviceId,
          details: { reason: reason, serviceName: entry.metadata.name },
          timestamp: Date.now(),
          jurisdiction: entry.metadata.jurisdiction || 'GLOBAL',
        }));
      }

      // Invalidate cache entries related to this service
      this.discoveryCache.invalidateMatching(query => {
        // A simple heuristic: if the query might have included this service, invalidate.
        // A more sophisticated approach would track which services are part of which query results.
        return JSON.stringify(query).includes(serviceId) || true; // Invalidate all for simplicity
      });

      // Publish a final update indicating removal
      this.eventBus.publish(new TypedEvent('ServiceUpdate', {
        serviceId: entry.serviceId,
        ownerId: entry.ownerId,
        metadata: entry.metadata,
        endpoints: [], // No longer available
        capabilities: [],
        contracts: [],
        status: ServiceHealthStatus.UNKNOWN, // Or REMOVED
        updatedAt: Date.now(),
      }));
    } else {
      this.logger.warn(`Attempted to deregister non-existent service: ${serviceId}`);
      this.eventBus.publish(new TypedEvent('ServiceDeregistrationFailed', {
        serviceId,
        ownerId,
        reason: 'Service not found',
        timestamp: Date.now(),
      }));
    }
  }

  /**
   * Handles incoming ServiceHeartbeatEvent.
   * @param event The ServiceHeartbeatEvent.
   */
  private async handleServiceHeartbeat(event: TypedEvent<ServiceHeartbeat>): Promise<void> {
    const { serviceId, ownerId, authToken, status, metrics } = event.payload;

    if (this.config.enableRateLimiting && !this.rateLimiter.consume(ownerId, 'service_heartbeat')) {
      this.logger.warn(`Rate limit exceeded for service heartbeat by ${ownerId}`);
      return;
    }

    try {
      await this.circuitBreaker.execute(async () => {
        const identity = await this.authService.validateToken(authToken);
        if (!identity || identity.id !== ownerId) { // Heartbeats don't require specific permissions, just ownership
          this.logger.warn(`Unauthorized heartbeat attempt for ${serviceId} by ${ownerId}`);
          return;
        }

        const entry = this.services.get(serviceId);
        if (entry) {
          if (entry.ownerId !== ownerId) {
            this.logger.warn(`Heartbeat for service ${serviceId} received from non-owner ${ownerId}. Expected owner: ${entry.ownerId}`);
            return;
          }

          entry.lastHeartbeat = Date.now();
          entry.missedHeartbeats = 0; // Reset missed heartbeats on successful heartbeat

          // Only update status if it's different or more critical
          if (status && status !== entry.status) {
            const oldStatus = entry.status;
            entry.status = status;
            entry.updatedAt = Date.now();
            this.logger.info(`Service ${serviceId} status updated to ${status} from ${oldStatus}.`);
            this.telemetryService.recordMetric('service_status_change', 1, { serviceId: serviceId, oldStatus: oldStatus, newStatus: status });
            this.publishServiceUpdate(entry); // Publish update if status changed
          } else if (entry.status !== ServiceHealthStatus.HEALTHY) {
            // If status was DEGRADED due to missed heartbeats, and a heartbeat is now received,
            // revert to HEALTHY if no explicit status was provided or it's still healthy.
            entry.status = ServiceHealthStatus.HEALTHY;
            entry.updatedAt = Date.now();
            this.logger.info(`Service ${serviceId} status reverted to HEALTHY after heartbeat.`);
            this.telemetryService.recordMetric('service_status_change', 1, { serviceId: serviceId, oldStatus: entry.status, newStatus: ServiceHealthStatus.HEALTHY });
            this.publishServiceUpdate(entry);
          }

          // Process metrics if provided
          if (metrics && Array.isArray(metrics)) {
            metrics.forEach(metric => {
              this.telemetryService.recordMetric(metric.name, metric.value, { ...metric.tags, serviceId: serviceId });
            });
          }

          this.logger.debug(`Heartbeat received for service ${serviceId}. Status: ${entry.status}`);
          this.telemetryService.recordMetric('service_heartbeat_received', 1, { serviceId: serviceId });
        } else {
          this.logger.warn(`Heartbeat received for unknown service: ${serviceId}. Owner: ${ownerId}`);
          // Optionally, trigger a re-registration request to the service
        }
      });
    } catch (error) {
      this.logger.error(`Error processing heartbeat for ${serviceId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles incoming ServiceDiscoveryRequestEvent.
   * @param event The ServiceDiscoveryRequestEvent.
   */
  private async handleServiceDiscoveryRequest(event: TypedEvent<ServiceDiscoveryQuery>): Promise<void> {
    const { requesterId, authToken, query, correlationId } = event.payload;

    if (this.config.enableRateLimiting && !this.rateLimiter.consume(requesterId, 'discover_service')) {
      this.logger.warn(`Rate limit exceeded for service discovery by ${requesterId}`);
      this.eventBus.publish(new TypedEvent('ServiceDiscoveryResponse', {
        query,
        results: [],
        success: false,
        message: 'Rate limit exceeded',
        timestamp: Date.now(),
      }, correlationId));
      return;
    }

    try {
      await this.circuitBreaker.execute(async () => {
        const identity = await this.authService.validateToken(authToken);
        if (!identity || identity.id !== requesterId || !this.authService.hasPermission(identity, PermissionScope.SERVICE_DISCOVER)) {
          this.logger.warn(`Unauthorized service discovery attempt by ${requesterId}`);
          this.eventBus.publish(new TypedEvent('ServiceDiscoveryResponse', {
            query,
            results: [],
            success: false,
            message: 'Unauthorized',
            timestamp: Date.now(),
          }, correlationId));
          return;
        }

        let results: ServiceDiscoveryResult[] = [];
        const cacheKey = JSON.stringify(query);

        if (this.config.enableDiscoveryCache) {
          const cachedResults = this.discoveryCache.get(query);
          if (cachedResults) {
            results = cachedResults;
            this.logger.debug(`Service discovery cache hit for query: ${JSON.stringify(query)}`);
            this.telemetryService.recordMetric('service_discovery_cache_hit', 1);
          }
        }

        if (results.length === 0) { // If not cached or caching is disabled
          results = this.performDiscovery(query, identity);
          if (this.config.enableDiscoveryCache) {
            this.discoveryCache.set(query, results);
            this.telemetryService.recordMetric('service_discovery_cache_miss', 1);
          }
        }

        this.logger.info(`Service discovery request from ${requesterId} for query ${JSON.stringify(query)} returned ${results.length} results.`);
        this.telemetryService.recordMetric('service_discovery_requests', 1, { requesterId: requesterId, queryType: query.type });
        this.telemetryService.recordMetric('service_discovery_results_count', results.length, { requesterId: requesterId, queryType: query.type });

        if (this.config.enableAuditLogging) {
          this.eventBus.publish(new TypedEvent('AuditLog', {
            action: 'SERVICE_DISCOVERY',
            actorId: requesterId,
            targetId: 'N/A', // Discovery is not for a single target
            details: { query: query, resultCount: results.length },
            timestamp: Date.now(),
            jurisdiction: query.jurisdiction || 'GLOBAL',
          }));
        }

        this.eventBus.publish(new TypedEvent<ServiceDiscoveryResponseEvent>('ServiceDiscoveryResponse', {
          query,
          results,
          success: true,
          message: 'Discovery successful',
          timestamp: Date.now(),
        }, correlationId));
      });
    } catch (error) {
      this.logger.error(`Error during service discovery for ${requesterId}: ${error instanceof Error ? error.message : String(error)}`);
      this.eventBus.publish(new TypedEvent('ServiceDiscoveryResponse', {
        query,
        results: [],
        success: false,
        message: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
      }, correlationId));
    }
  }

  /**
   * Performs the actual service discovery based on the query.
   * Applies filtering based on query parameters and requester's permissions.
   * @param query The discovery query.
   * @param requesterIdentity The identity of the service making the request.
   * @returns An array of ServiceDiscoveryResult.
   */
  private performDiscovery(query: ServiceDiscoveryQuery, requesterIdentity: Identity): ServiceDiscoveryResult[] {
    const matchingServices: ServiceDiscoveryResult[] = [];

    this.services.forEach(entry => {
      // Basic health check: only return healthy or degraded services
      if (entry.status === ServiceHealthStatus.UNKNOWN || entry.status === ServiceHealthStatus.OFFLINE) {
        return;
      }

      // Filter by service ID
      if (query.serviceId && query.serviceId !== entry.serviceId) {
        return;
      }

      // Filter by service name (case-insensitive partial match)
      if (query.serviceName && !entry.metadata.name.toLowerCase().includes(query.serviceName.toLowerCase())) {
        return;
      }

      // Filter by owner ID
      if (query.ownerId && query.ownerId !== entry.ownerId) {
        return;
      }

      // Filter by capabilities
      if (query.capabilities && query.capabilities.length > 0) {
        const hasAllCapabilities = query.capabilities.every(reqCap =>
          entry.capabilities.some(entryCap =>
            entryCap.name === reqCap.name &&
            (!reqCap.version || entryCap.version === reqCap.version) &&
            (!reqCap.protocol || entryCap.protocol === reqCap.protocol)
          )
        );
        if (!hasAllCapabilities) {
          return;
        }
      }

      // Filter by contracts
      if (query.contracts && query.contracts.length > 0) {
        const hasAllContracts = query.contracts.every(reqContract =>
          entry.contracts.some(entryContract =>
            entryContract.name === reqContract.name &&
            (!reqContract.version || entryContract.version === reqContract.version)
          )
        );
        if (!hasAllContracts) {
          return;
        }
      }

      // Filter by metadata tags
      if (query.tags && Object.keys(query.tags).length > 0) {
        const hasAllTags = Object.entries(query.tags).every(([key, value]) =>
          entry.metadata.tags && entry.metadata.tags[key] === value
        );
        if (!hasAllTags) {
          return;
        }
      }

      // Filter by protocol
      if (query.protocol && !entry.endpoints.some(ep => ep.protocol === query.protocol)) {
        return;
      }

      // Filter by jurisdiction (feature flag for jurisdictional controls)
      if (Configuration.getFeatureFlag(FeatureFlag.JURISDICTIONAL_CONTROLS_ENABLED) && query.jurisdiction) {
        if (entry.metadata.jurisdiction && entry.metadata.jurisdiction !== query.jurisdiction) {
          return;
        }
      }

      // Apply access control based on requester's permissions and service's visibility settings
      // Example: A service might be marked as 'internal' or 'private'
      const isInternalService = entry.metadata.tags?.visibility === 'internal';
      const canAccessInternal = this.authService.hasPermission(requesterIdentity, PermissionScope.SERVICE_DISCOVER_INTERNAL);

      if (isInternalService && !canAccessInternal && entry.ownerId !== requesterIdentity.id) {
        this.logger.debug(`Blocking discovery of internal service ${entry.serviceId} for ${requesterIdentity.id}`);
        return;
      }

      // Construct the discovery result
      matchingServices.push({
        serviceId: entry.serviceId,
        ownerId: entry.ownerId,
        metadata: entry.metadata,
        endpoints: entry.endpoints,
        capabilities: entry.capabilities,
        contracts: entry.contracts,
        status: entry.status,
        lastHeartbeat: entry.lastHeartbeat,
      });
    });

    return matchingServices;
  }

  /**
   * Shuts down the ServiceRegistry, stopping heartbeat monitors and clearing resources.
   */
  public shutdown(): void {
    this.stopHeartbeatMonitor();
    this.services.clear();
    this.discoveryCache.clear();
    this.logger.info('ServiceRegistry shut down.');
  }

  // --- Public API for introspection and management ---

  /**
   * Returns the current configuration of the ServiceRegistry.
   * @returns The current ServiceRegistryConfig.
   */
  public getConfiguration(): ServiceRegistryConfig {
    return { ...this.config };
  }

  /**
   * Returns a list of all currently registered service IDs.
   * @returns An array of service IDs.
   */
  public getRegisteredServiceIds(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Retrieves the full entry for a specific registered service.
   * @param serviceId The ID of the service.
   * @returns The RegisteredServiceEntry or undefined if not found.
   */
  public getServiceEntry(serviceId: string): RegisteredServiceEntry | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Exposes internal extensibility hooks.
   * This method allows for dynamic registration of custom validation rules or
   * transformation pipelines for service metadata, capabilities, etc.
   *
   * Example:
   * registry.addValidationHook('serviceMetadata', (metadata) => {
   *   if (!metadata.description) throw new Error('Description is required');
   * });
   */
  private validationHooks: Map<string, ((data: any) => void)[]> = new Map();
  private transformationHooks: Map<string, ((data: any) => any)[]> = new Map();

  public addValidationHook(type: 'serviceMetadata' | 'serviceEndpoint' | 'serviceCapability' | 'serviceContract', hook: (data: any) => void): void {
    if (!this.validationHooks.has(type)) {
      this.validationHooks.set(type, []);
    }
    this.validationHooks.get(type)?.push(hook);
    this.logger.debug(`Added validation hook for type: ${type}`);
  }

  public addTransformationHook(type: 'serviceMetadata' | 'serviceEndpoint' | 'serviceCapability' | 'serviceContract', hook: (data: any) => any): void {
    if (!this.transformationHooks.has(type)) {
      this.transformationHooks.set(type, []);
    }
    this.transformationHooks.get(type)?.push(hook);
    this.logger.debug(`Added transformation hook for type: ${type}`);
  }

  private applyValidationHooks(type: string, data: any): void {
    const hooks = this.validationHooks.get(type);
    if (hooks) {
      for (const hook of hooks) {
        hook(data); // Throws error if validation fails
      }
    }
  }

  private applyTransformationHooks(type: string, data: any): any {
    let transformedData = { ...data };
    const hooks = this.transformationHooks.get(type);
    if (hooks) {
      for (const hook of hooks) {
        transformedData = hook(transformedData);
      }
    }
    return transformedData;
  }

  // --- Self-querying agent mode metadata ---
  public agent_metadata = {
    purpose: "Manages the registration, discovery, and health monitoring of services within the Aetheryx ecosystem. Acts as a central directory for all deployable applications.",
    dependencies: [
      "../../_shared/sdk/auth/authService",
      "../../_shared/sdk/bus/eventBus",
      "../../_shared/sdk/types/serviceDiscovery",
      "../../_shared/sdk/utils/logger",
      "../../_shared/sdk/config/config",
      "../../_shared/sdk/telemetry/telemetryService",
      "../../_shared/sdk/security/rateLimiter",
      "../../_shared/sdk/resilience/circuitBreaker",
      "../../_shared/sdk/utils/cache",
    ],
    invalidation_conditions: [
      "Configuration changes (e.g., heartbeat interval, rate limits)",
      "AuthService or EventBus failures",
      "Persistent storage issues (if services were persisted, currently in-memory)",
      "Security policy updates affecting access control for discovery/registration",
    ],
    adjacent_apps: [
      "APP_01_Inference_CostRouter (needs to discover inference providers)",
      "APP_14_Agents_MultiModelOrchestrator (needs to discover agent tools/models)",
      "APP_37_Governance_AuditTrailEngine (consumes audit logs from registry actions)",
      "APP_58_Narrative_ModelExplainabilityUI (might discover explainability services)",
      "APP_XX_Monitoring_HealthDashboard (consumes service status updates)",
      "APP_XX_Deployment_Orchestrator (registers new deployments)",
      "APP_XX_Security_AccessControlManager (integrates with authService for permissions)",
    ],
  };

  /**
   * /introspect endpoint equivalent.
   * Provides a snapshot of the registry's current state and configuration.
   */
  public introspect(): any {
    return {
      status: 'operational',
      registeredServicesCount: this.services.size,
      config: this.getConfiguration(),
      heartbeatMonitorActive: this.heartbeatMonitorInterval !== null,
      cacheStats: this.discoveryCache.getStats(),
      circuitBreakerState: this.circuitBreaker.getState(),
      rateLimiterStats: this.rateLimiter.getStats(),
      agentMetadata: this.agent_metadata,
      // Note: Do not expose sensitive service details without proper authorization
    };
  }

  /**
   * /assumptions endpoint equivalent.
   * Lists key assumptions made by the ServiceRegistry.
   */
  public assumptions(): string[] {
    return [
      "All services will use the shared AuthToken for authentication and authorization.",
      "Services will send heartbeats regularly to maintain their 'HEALTHY' status.",
      "The EventBus is reliable for inter-service communication and event delivery.",
      "Service IDs are globally unique within the ecosystem.",
      "Owner IDs provided during registration are valid identities managed by AuthService.",
      "Network latency between services and the registry is within acceptable limits for heartbeats.",
      "The underlying system clock is synchronized across all components for accurate timestamps.",
      "Configuration values are loaded correctly at startup and are immutable during runtime (unless explicitly reloaded).",
      "Jurisdictional controls are enforced via feature flags and metadata tagging, not by hardcoded logic.",
    ];
  }

  /**
   * /failure-modes endpoint equivalent.
   * Describes potential failure modes and their consequences.
   */
  public failureModes(): any[] {
    return [
      {
        name: "EventBus Failure",
        impact: "Service registrations, deregistration, heartbeats, and discovery requests/responses will fail to propagate. Registry state will become stale, and services won't be able to find each other.",
        mitigation: "EventBus should have its own resilience mechanisms (e.g., message queues, retries, dead-letter queues). Registry will log errors and attempt retries for critical operations.",
      },
      {
        name: "AuthService Unavailability",
        impact: "No new services can register or deregister. Heartbeats cannot be authenticated. Discovery requests will fail due to authorization errors. Existing registered services will remain, but their lifecycle management is halted.",
        mitigation: "AuthService should be highly available. Registry can implement a grace period for existing services during Auth downtime, but new operations are blocked.",
      },
      {
        name: "Persistent Storage Failure (if implemented)",
        impact: "Loss of all registered service data upon restart. Currently, the registry is in-memory, so a restart already means loss of state unless re-registered.",
        mitigation: "Implement persistent storage (e.g., distributed database) with replication and backup strategies. This would be a significant architectural enhancement.",
      },
      {
        name: "High Load / DDoS Attack",
        impact: "Registry becomes unresponsive, leading to failed registrations, discoveries, and stale service states. Rate limiting helps, but extreme load can still overwhelm.",
        mitigation: "Rate limiting, circuit breakers, autoscaling of registry instances, robust infrastructure, and DDoS protection at the network edge.",
      },
      {
        name: "Incorrect Service Metadata/Endpoints",
        impact: "Services might be discovered but are unreachable or provide incorrect capabilities, leading to runtime errors in consuming applications.",
        mitigation: "Strong validation at registration time (including custom validation hooks), clear documentation for service providers, and robust client-side error handling/retries.",
      },
      {
        name: "Heartbeat Monitor Failure",
        impact: "Services that go offline will not be automatically deregistered, leading to stale entries in the registry and potential attempts to connect to unavailable services.",
        mitigation: "Internal monitoring of the heartbeat monitor process, health checks for the registry itself, and alerts for long-running or failed monitor cycles.",
      },
      {
        name: "Cache Invalidation Issues",
        impact: "Stale discovery results might be served to clients, leading to connection errors or incorrect service routing.",
        mitigation: "Careful design of cache keys and invalidation strategies. Time-to-live (TTL) on cache entries ensures eventual consistency. Manual cache invalidation hooks for critical updates.",
      },
    ];
  }

  /**
   * /update-triggers endpoint equivalent.
   * Describes conditions that would necessitate an update or redeployment of the ServiceRegistry.
   */
  public updateTriggers(): string[] {
    return [
      "Changes to the shared SDK (AuthService, EventBus, types, etc.) requiring API compatibility updates.",
      "Updates to core configuration parameters (e.g., heartbeat intervals, rate limits, cache TTLs).",
      "Introduction of new service discovery query parameters or filtering logic.",
      "Security vulnerability patches in dependencies or the registry itself.",
      "Performance optimizations or scalability improvements.",
      "Changes to audit logging requirements or data retention policies.",
      "New feature flag implementations related to service discovery or registration.",
      "Updates to the underlying infrastructure or deployment environment.",
      "Expansion of jurisdictional controls or compliance requirements.",
    ];
  }
}