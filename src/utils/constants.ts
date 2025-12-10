export const API_VERSION = 'v1';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const DEFAULT_TIMEOUT_MS = 5000; // 5 seconds for external API calls

export const CLOUD_PROVIDERS = {
  AWS: 'aws',
  GCP: 'gcp',
  AZURE: 'azure',
} as const;

export const CLOUD_PROVIDER_NAMES = Object.values(CLOUD_PROVIDERS);

export const DEFAULT_REGION_LATENCY_THRESHOLD_MS = 100; // Example threshold for latency checks

export const SECRETS_SCAN_TARGETS = {
  GCS: 'gcs',
  S3: 's3',
  AZURE_BLOB: 'azure_blob',
  GITHUB: 'github',
  BIGQUERY: 'bigquery',
} as const;

export const LLM_PROVIDERS = {
  AWS_BEDROCK: 'aws_bedrock',
  GCP_VERTEX_AI: 'gcp_vertex_ai',
  AZURE_OPENAI: 'azure_openai',
} as const;

export const DEFAULT_LLM_MODEL = 'gpt-4o'; // Example default LLM model
export const DEFAULT_LLM_TEMPERATURE = 0.7; // Example default LLM temperature

export const DEFAULT_CACHE_TTL_SECONDS = 300; // 5 minutes for cached data

export const IAM_RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const COMPLIANCE_STANDARDS = {
  SOC2: 'soc2',
  HIPAA: 'hipaa',
  GDPR: 'gdpr',
  PCI_DSS: 'pci_dss',
} as const;

export const DEFAULT_HEALTH_CHECK_INTERVAL_MS = 60000; // 1 minute for health checks

export const METRIC_TYPES = {
  CPU_UTILIZATION: 'cpu_utilization',
  MEMORY_UTILIZATION: 'memory_utilization',
  NETWORK_IN: 'network_in',
  NETWORK_OUT: 'network_out',
  DISK_READ_OPS: 'disk_read_ops',
  DISK_WRITE_OPS: 'disk_write_ops',
} as const;

export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export const DEFAULT_LOG_RETENTION_DAYS = 30;

export const DEFAULT_CURRENCY = 'USD';

// Add more constants as the project evolves
// For example, specific endpoint paths, feature flags, etc.