variable "environment" {
  description = "The deployment environment (e.g., 'dev', 'staging', 'prod')."
  type        = string
  default     = "dev"
}

variable "project_prefix" {
  description = "A unique prefix for all resources to ensure naming consistency and avoid collisions."
  type        = string
  default     = "mcbna" # Multi-Cloud Billing Normalizer API
}

variable "common_tags" {
  description = "A map of common tags to apply to all provisioned resources."
  type        = map(string)
  default = {
    "Project"     = "MultiCloudBillingNormalizer"
    "ManagedBy"   = "Terraform"
    "Environment" = "dev" # This will be overridden by the 'environment' variable in main.tf
  }
}

# AWS Configuration
variable "aws_region" {
  description = "The AWS region where resources will be deployed."
  type        = string
  default     = "us-east-1"
}

variable "aws_billing_s3_bucket_name" {
  description = "The S3 bucket name where AWS Cost and Usage Reports (CUR) are stored."
  type        = string
}

variable "aws_billing_report_path_prefix" {
  description = "The path prefix within the S3 bucket where CUR files are located (e.g., 'cost-and-usage-reports/')."
  type        = string
  default     = "cost-and-usage-reports/"
}

# GCP Configuration
variable "gcp_project_id" {
  description = "The Google Cloud Project ID where resources will be deployed and billing data is exported."
  type        = string
}

variable "gcp_region" {
  description = "The GCP region where resources will be deployed."
  type        = string
  default     = "us-central1"
}

variable "gcp_billing_bigquery_dataset_id" {
  description = "The BigQuery dataset ID where GCP billing export data resides."
  type        = string
}

variable "gcp_billing_bigquery_table_id" {
  description = "The BigQuery table ID within the dataset that contains GCP billing export data."
  type        = string
}

# Azure Configuration
variable "azure_subscription_id" {
  description = "The Azure Subscription ID where resources will be deployed and billing data is exported."
  type        = string
}

variable "azure_tenant_id" {
  description = "The Azure Tenant ID associated with the subscription."
  type        = string
}

variable "azure_client_id" {
  description = "The Client ID (Application ID) of the Azure Service Principal used for authentication."
  type        = string
}

variable "azure_client_secret" {
  description = "The Client Secret of the Azure Service Principal used for authentication."
  type        = string
  sensitive   = true
}

variable "azure_region" {
  description = "The Azure region where resources will be deployed."
  type        = string
  default     = "eastus"
}

variable "azure_billing_storage_account_name" {
  description = "The Azure Storage Account name where Azure billing export data is stored."
  type        = string
}

variable "azure_billing_container_name" {
  description = "The container name within the Azure Storage Account for billing data."
  type        = string
}

variable "azure_billing_directory_path" {
  description = "The directory path within the Azure Storage container where billing files are located (e.g., 'billingdata/')."
  type        = string
  default     = "billingdata/"
}

# API Service Deployment Configuration (Example for a containerized service)
variable "api_container_image" {
  description = "The Docker image for the Multi-Cloud Billing Normalizer API service."
  type        = string
  default     = "your-registry/multi-cloud-billing-normalizer:latest"
}

variable "api_port" {
  description = "The port on which the API service listens for incoming requests."
  type        = number
  default     = 8080
}

variable "api_instance_count" {
  description = "The desired number of API service instances/replicas."
  type        = number
  default     = 1
}

variable "api_cpu_limit" {
  description = "CPU limit for the API service container (e.g., '256m' for 0.25 CPU, '1' for 1 CPU)."
  type        = string
  default     = "256m"
}

variable "api_memory_limit" {
  description = "Memory limit for the API service container (e.g., '512Mi')."
  type        = string
  default     = "512Mi"
}