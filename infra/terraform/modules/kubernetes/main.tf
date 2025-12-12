# main.tf

# This module supports EKS, GKE, and AKS.
# The 'provider' variable determines which cloud provider is used.

variable "provider" {
  type        string
  description = "Cloud provider to use (eks, gke, or aks)"
  validation {
    condition     = contains(["eks", "gke", "aks"], lower(var.provider))
    error_message = "The provider must be one of 'eks', 'gke', or 'aks'."
  }
}

variable "cluster_name" {
  type        string
  description = "Name of the Kubernetes cluster"
}

variable "region" {
  type        string
  description = "Region where the cluster will be created"
  default     = null # Optional, can be omitted if provider configures it
}

variable "node_count" {
  type        number
  description = "Number of worker nodes"
  default     = 3
}

variable "node_type" {
  type        string
  description = "Instance type for worker nodes"
  default     = "t3.medium"
}

variable "kubernetes_version" {
  type        string
  description = "Kubernetes version"
  default     = "1.28"
}

variable "tags" {
  type        map(string)
  description = "Tags to apply to the cluster resources"
  default     = {}
}

# EKS Specific Variables
variable "eks_vpc_id" {
  type        string
  description = "VPC ID for EKS cluster"
  default     = null
  nullable    = true
}

variable "eks_subnet_ids" {
  type        list(string)
  description = "List of subnet IDs for EKS cluster"
  default     = []
  nullable    = true
}

variable "eks_security_group_ids" {
  type        list(string)
  description = "List of security group IDs for EKS cluster"
  default     = []
  nullable    = true
}

# GKE Specific Variables
variable "gke_project_id" {
  type        string
  description = "GCP Project ID for GKE cluster"
  default     = null
  nullable    = true
}

variable "gke_network" {
  type        string
  description = "GCP Network for GKE cluster"
  default     = "default"
  nullable    = true
}

variable "gke_subnetwork" {
  type        string
  description = "GCP Subnetwork for GKE cluster"
  default     = null
  nullable    = true
}

# AKS Specific Variables
variable "aks_resource_group_name" {
  type        string
  description = "Azure Resource Group name for AKS cluster"
  default     = null
  nullable    = true
}

variable "aks_node_pool_name" {
  type        string
  description = "Name of the AKS node pool"
  default     = "default"
}

# -----------------------------------------------------------------------------
# EKS Implementation
# -----------------------------------------------------------------------------
module "eks" {
  source  = "./modules/eks"
  count   = var.provider == "eks" ? 1 : 0

  cluster_name          = var.cluster_name
  region                = var.region
  node_count            = var.node_count
  node_type             = var.node_type
  kubernetes_version    = var.kubernetes_version
  tags                  = var.tags
  vpc_id                = var.eks_vpc_id
  subnet_ids            = var.eks_subnet_ids
  security_group_ids    = var.eks_security_group_ids
}

# -----------------------------------------------------------------------------
# GKE Implementation
# -----------------------------------------------------------------------------
module "gke" {
  source  = "./modules/gke"
  count   = var.provider == "gke" ? 1 : 0

  cluster_name       = var.cluster_name
  region             = var.region
  node_count         = var.node_count
  node_type          = var.node_type
  kubernetes_version = var.kubernetes_version
  tags               = var.tags
  project_id         = var.gke_project_id
  network            = var.gke_network
  subnetwork         = var.gke_subnetwork
}

# -----------------------------------------------------------------------------
# AKS Implementation
# -----------------------------------------------------------------------------
module "aks" {
  source  = "./modules/aks"
  count   = var.provider == "aks" ? 1 : 0

  cluster_name          = var.cluster_name
  region                = var.region
  node_count            = var.node_count
  node_type             = var.node_type
  kubernetes_version    = var.kubernetes_version
  tags                  = var.tags
  resource_group_name = var.aks_resource_group_name
  node_pool_name      = var.aks_node_pool_name
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "cluster_name" {
  description = "The name of the Kubernetes cluster."
  value       = var.cluster_name
}

output "kubeconfig" {
  description = "The kubeconfig for the Kubernetes cluster."
  value = var.provider == "eks" ? (module.eks[0].kubeconfig != null ? module.eks[0].kubeconfig : null) : (var.provider == "gke" ? (module.gke[0].kubeconfig != null ? module.gke[0].kubeconfig : null) : (var.provider == "aks" ? (module.aks[0].kubeconfig != null ? module.aks[0].kubeconfig : null) : null))
  sensitive   = true
}

output "cluster_endpoint" {
  description = "The endpoint of the Kubernetes cluster."
  value = var.provider == "eks" ? (module.eks[0].cluster_endpoint != null ? module.eks[0].cluster_endpoint : null) : (var.provider == "gke" ? (module.gke[0].cluster_endpoint != null ? module.gke[0].cluster_endpoint : null) : (var.provider == "aks" ? (module.aks[0].cluster_endpoint != null ? module.aks[0].cluster_endpoint : null) : null))
}

output "cluster_id" {
  description = "The ID of the Kubernetes cluster."
  value = var.provider == "eks" ? (module.eks[0].cluster_id != null ? module.eks[0].cluster_id : null) : (var.provider == "gke" ? (module.gke[0].cluster_id != null ? module.gke[0].cluster_id : null) : (var.provider == "aks" ? (module.aks[0].cluster_id != null ? module.aks[0].cluster_id : null) : null))
}