# This module defines and manages IAM roles, policies, and service accounts
# required by the Multi-Cloud Billing Normalizer API to access cloud resources securely.

# --- Variables ---

variable "environment" {
  description = "The environment name (e.g., 'dev', 'prod') for resource naming."
  type        = string
}

variable "application_name" {
  description = "The name of the application (e.g., 'billing-normalizer')."
  type        = string
  default     = "billing-normalizer"
}

# AWS Variables
variable "enable_aws_iam" {
  description = "Set to true to create AWS IAM resources."
  type        = bool
  default     = true
}

variable "aws_account_id" {
  description = "The AWS account ID where the application will run (for trust policy). Required if enable_aws_iam is true."
  type        = string
  default     = ""
}

variable "aws_output_s3_bucket_name" {
  description = "The name of the S3 bucket where normalized billing data will be stored. Required if enable_aws_iam is true."
  type        = string
  default     = ""
}

# GCP Variables
variable "enable_gcp_iam" {
  description = "Set to true to create GCP IAM resources."
  type        = bool
  default     = true
}

variable "gcp_project_id" {
  description = "The GCP project ID where the application will run and billing data is accessed. Required if enable_gcp_iam is true."
  type        = string
  default     = ""
}

variable "gcp_output_gcs_bucket_name" {
  description = "The name of the GCS bucket where normalized billing data will be stored. Required if enable_gcp_iam is true."
  type        = string
  default     = ""
}

# Azure Variables
variable "enable_azure_iam" {
  description = "Set to true to create Azure IAM resources."
  type        = bool
  default     = true
}

variable "azure_subscription_id" {
  description = "The Azure Subscription ID where billing data is accessed and resources are deployed. Required if enable_azure_iam is true."
  type        = string
  default     = ""
}

variable "azure_tenant_id" {
  description = "The Azure AD Tenant ID. Required if enable_azure_iam is true."
  type        = string
  default     = ""
}

variable "azure_output_storage_account_name" {
  description = "The name of the Azure Storage Account where normalized billing data will be stored. Required if enable_azure_iam is true."
  type        = string
  default     = ""
}

variable "azure_output_storage_account_resource_group" {
  description = "The resource group name of the Azure Storage Account. Required if enable_azure_iam is true."
  type        = string
  default     = ""
}

# --- AWS IAM Resources ---
resource "aws_iam_role" "app_role" {
  count = var.enable_aws_iam ? 1 : 0

  name = "${var.environment}-${var.application_name}-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          # This trust policy is a placeholder. In a real-world scenario,
          # this should be narrowed down to specific service principals (e.g., "ec2.amazonaws.com", "lambda.amazonaws.com")
          # or an OIDC provider for Kubernetes/ECS.
          # For a generic module, we allow the root account to assume, which is broad.
          # The calling module should refine this or attach the role to a specific compute resource.
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
      },
    ]
  })

  tags = {
    Environment = var.environment
    Application = var.application_name
  }
}

resource "aws_iam_policy" "app_policy" {
  count = var.enable_aws_iam ? 1 : 0

  name        = "${var.environment}-${var.application_name}-policy"
  description = "Policy for ${var.application_name} to read AWS billing data and write to S3."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ce:GetCostAndUsage",
          "billing:GetBillingDetails",
          "organizations:DescribeAccount", # Useful for multi-account billing
          "organizations:ListAccounts",    # Useful for multi-account billing
        ]
        Resource = "*" # Billing actions are often global
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject" # If the normalizer needs to manage objects
        ]
        Resource = [
          "arn:aws:s3:::${var.aws_output_s3_bucket_name}",
          "arn:aws:s3:::${var.aws_output_s3_bucket_name}/*",
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "app_policy_attachment" {
  count = var.enable_aws_iam ? 1 : 0

  role       = aws_iam_role.app_role[0].name
  policy_arn = aws_iam_policy.app_policy[0].arn
}

# --- GCP IAM Resources ---
resource "google_service_account" "app_sa" {
  count = var.enable_gcp_iam ? 1 : 0

  project      = var.gcp_project_id
  account_id   = "${var.environment}-${var.application_name}-sa"
  display_name = "${title(var.environment)} ${title(var.application_name)} Service Account"
}

resource "google_project_iam_member" "billing_viewer" {
  count = var.enable_gcp_iam ? 1 : 0

  project = var.gcp_project_id
  role    = "roles/billing.viewer"
  member  = "serviceAccount:${google_service_account.app_sa[0].email}"
}

resource "google_project_iam_member" "bigquery_data_viewer" {
  count = var.enable_gcp_iam ? 1 : 0

  project = var.gcp_project_id
  role    = "roles/bigquery.dataViewer" # Assuming billing data might be in BigQuery export
  member  = "serviceAccount:${google_service_account.app_sa[0].email}"
}

resource "google_project_iam_member" "gcs_object_admin" {
  count = var.enable_gcp_iam ? 1 : 0

  project = var.gcp_project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.app_sa[0].email}"
}

# --- Azure IAM Resources ---
data "azuread_client_config" "current" {
  count = var.enable_azure_iam ? 1 : 0
}

resource "azuread_application" "app_ad" {
  count = var.enable_azure_iam ? 1 : 0

  display_name = "${var.environment}-${var.application_name}-app"
  owners       = [data.azuread_client_config.current[0].object_id]
}

resource "azuread_service_principal" "app_sp" {
  count = var.enable_azure_iam ? 1 : 0

  application_id = azuread_application.app_ad[0].application_id
  owners         = [data.azuread_client_config.current[0].object_id]
}

resource "azurerm_role_assignment" "billing_reader" {
  count = var.enable_azure_iam ? 1 : 0

  scope                = "/subscriptions/${var.azure_subscription_id}"
  role_definition_name = "Billing Reader"
  principal_id         = azuread_service_principal.app_sp[0].id
}

resource "azurerm_role_assignment" "storage_blob_data_contributor" {
  count = var.enable_azure_iam ? 1 : 0

  scope                = "/subscriptions/${var.azure_subscription_id}/resourceGroups/${var.azure_output_storage_account_resource_group}/providers/Microsoft.Storage/storageAccounts/${var.azure_output_storage_account_name}"
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azuread_service_principal.app_sp[0].id
}

# --- Outputs ---

output "aws_iam_role_arn" {
  description = "The ARN of the AWS IAM Role created for the application."
  value       = var.enable_aws_iam ? aws_iam_role.app_role[0].arn : null
}

output "aws_iam_role_name" {
  description = "The name of the AWS IAM Role created for the application."
  value       = var.enable_aws_iam ? aws_iam_role.app_role[0].name : null
}

output "gcp_service_account_email" {
  description = "The email of the GCP Service Account created for the application."
  value       = var.enable_gcp_iam ? google_service_account.app_sa[0].email : null
}

output "azure_ad_application_id" {
  description = "The Application ID (Client ID) of the Azure AD Application."
  value       = var.enable_azure_iam ? azuread_application.app_ad[0].application_id : null
}

output "azure_service_principal_id" {
  description = "The Object ID of the Azure AD Service Principal."
  value       = var.enable_azure_iam ? azuread_service_principal.app_sp[0].id : null
}

output "azure_service_principal_display_name" {
  description = "The display name of the Azure AD Service Principal."
  value       = var.enable_azure_iam ? azuread_service_principal.app_sp[0].display_name : null
}