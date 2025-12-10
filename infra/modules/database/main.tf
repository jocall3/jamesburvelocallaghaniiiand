# This Terraform module deploys a PostgreSQL database instance across AWS, GCP, or Azure.
# It supports configuration, backups, and basic scaling.

# --- Input Variables ---
variable "cloud_provider" {
  description = "The cloud provider to deploy the database on (aws, gcp, or azure)."
  type        = string
  validation {
    condition     = contains(["aws", "gcp", "azure"], var.cloud_provider)
    error_message = "The cloud_provider must be one of 'aws', 'gcp', or 'azure'."
  }
}

variable "project_name" {
  description = "A unique name for the project, used for resource naming."
  type        = string
}

variable "region" {
  description = "The cloud region where the database will be deployed."
  type        = string
}

variable "db_instance_type" {
  description = "The instance type/tier for the database."
  type        = string
  default     = "db.t3.micro" # AWS default
}

variable "db_storage_gb" {
  description = "The allocated storage for the database in GB."
  type        = number
  default     = 20
}

variable "db_username" {
  description = "The master username for the database."
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "The master password for the database."
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "The name of the initial database to create."
  type        = string
  default     = "billing_normalizer_db"
}

variable "allowed_ip_ranges" {
  description = "A list of CIDR blocks allowed to connect to the database."
  type        = list(string)
  default     = ["0.0.0.0/0"] # WARNING: Do not use 0.0.0.0/0 in production without proper security measures.
}

# AWS Specific Variables
variable "aws_vpc_id" {
  description = "The VPC ID for AWS RDS deployment."
  type        = string
  default     = null
}

variable "aws_subnet_ids" {
  description = "A list of subnet IDs for the AWS RDS DB Subnet Group."
  type        = list(string)
  default     = []
}

# Azure Specific Variables
variable "azure_resource_group_name" {
  description = "The name of the Azure Resource Group to deploy resources into."
  type        = string
  default     = null
}

# --- AWS RDS (PostgreSQL) ---
resource "aws_db_subnet_group" "main" {
  count       = var.cloud_provider == "aws" ? 1 : 0
  name        = "${var.project_name}-db-subnet-group"
  subnet_ids  = var.aws_subnet_ids
  description = "Subnet group for ${var.project_name} RDS instance"

  tags = {
    Project = var.project_name
  }
}

resource "aws_security_group" "db_access" {
  count       = var.cloud_provider == "aws" ? 1 : 0
  name        = "${var.project_name}-db-access-sg"
  description = "Allow inbound traffic to RDS instance"
  vpc_id      = var.aws_vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_ip_ranges
    description = "Allow PostgreSQL access from specified IPs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_db_instance" "main" {
  count                   = var.cloud_provider == "aws" ? 1 : 0
  allocated_storage       = var.db_storage_gb
  storage_type            = "gp2"
  engine                  = "postgres"
  engine_version          = "14.7" # Specify a stable version
  instance_class          = var.db_instance_type
  name                    = var.db_name
  username                = var.db_username
  password                = var.db_password
  port                    = 5432
  db_subnet_group_name    = aws_db_subnet_group.main[0].name
  vpc_security_group_ids  = [aws_security_group.db_access[0].id]
  skip_final_snapshot     = true # Set to false in production
  backup_retention_period = 7    # 7 days of backups
  multi_az                = false # Set to true for production high availability
  publicly_accessible     = true # Set to false for private VPC access
  identifier              = "${var.project_name}-db-instance"

  tags = {
    Project = var.project_name
  }
}

# --- GCP Cloud SQL (PostgreSQL) ---
resource "google_sql_database_instance" "main" {
  count            = var.cloud_provider == "gcp" ? 1 : 0
  database_version = "POSTGRES_14"
  region           = var.region
  project          = var.project_name # Assumes project_name is also the GCP project ID
  name             = "${var.project_name}-cloudsql"

  settings {
    tier = var.db_instance_type == "db.t3.micro" ? "db-f1-micro" : var.db_instance_type # Map AWS type to GCP
    disk_size = var.db_storage_gb
    disk_type = "PD_SSD"

    backup_configuration {
      enabled            = true
      start_time         = "03:00" # UTC time
      binary_log_enabled = false
    }

    ip_configuration {
      ipv4_enabled = true
      dynamic "authorized_networks" {
        for_each = var.allowed_ip_ranges
        content {
          value = authorized_networks.value
        }
      }
    }

    # For production, consider private IP and VPC Service Controls
    # private_network = "projects/your-project/global/networks/your-vpc"
  }

  deletion_protection_enabled = false # Set to true in production
}

resource "google_sql_database" "main" {
  count    = var.cloud_provider == "gcp" ? 1 : 0
  name     = var.db_name
  instance = google_sql_database_instance.main[0].name
  project  = var.project_name
}

resource "google_sql_user" "main" {
  count    = var.cloud_provider == "gcp" ? 1 : 0
  name     = var.db_username
  host     = "%" # Allow connections from any host
  password = var.db_password
  instance = google_sql_database_instance.main[0].name
  project  = var.project_name
}

# --- Azure Database for PostgreSQL (Flexible Server) ---
resource "azurerm_postgresql_flexible_server" "main" {
  count                 = var.cloud_provider == "azure" ? 1 : 0
  name                  = "${var.project_name}-pgflex"
  resource_group_name   = var.azure_resource_group_name
  location              = var.region
  version               = "14"
  sku_name              = var.db_instance_type == "db.t3.micro" ? "Standard_B1ms" : var.db_instance_type # Map AWS type to Azure
  storage_mb            = var.db_storage_gb * 1024
  administrator_login   = var.db_username
  administrator_password = var.db_password
  zone                  = "1" # For high availability, consider multiple zones
  public_network_access_enabled = true # Set to false for private VNet access

  backup_retention_days = 7
  geo_redundant_backup_enabled = false # Set to true for production

  tags = {
    Project = var.project_name
  }
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  count     = var.cloud_provider == "azure" ? 1 : 0
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.main[0].id
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "main" {
  count               = var.cloud_provider == "azure" ? length(var.allowed_ip_ranges) : 0
  name                = "${var.project_name}-firewall-rule-${count.index}"
  server_id           = azurerm_postgresql_flexible_server.main[0].id
  start_ip_address    = split("/", var.allowed_ip_ranges[count.index])[0]
  end_ip_address      = split("/", var.allowed_ip_ranges[count.index])[0] # Azure firewall rules are IP ranges, not CIDR. For simplicity, using start IP as end IP.
                                                                           # For actual CIDR support, you'd need to calculate the range.
}

# --- Outputs ---
output "db_host" {
  description = "The hostname/IP address of the database instance."
  value = one(flatten([
    aws_db_instance.main[*].address,
    google_sql_database_instance.main[*].public_ip_address,
    azurerm_postgresql_flexible_server.main[*].fqdn,
  ]))
}

output "db_port" {
  description = "The port number for the database connection."
  value       = 5432
}

output "db_name" {
  description = "The name of the created database."
  value       = var.db_name
}

output "db_username" {
  description = "The master username for the database."
  value       = var.db_username
  sensitive   = true
}

output "db_password" {
  description = "The master password for the database."
  value       = var.db_password
  sensitive   = true
}

output "aws_rds_instance_arn" {
  description = "The ARN of the AWS RDS instance (if deployed)."
  value       = var.cloud_provider == "aws" ? aws_db_instance.main[0].arn : null
}

output "gcp_cloudsql_instance_connection_name" {
  description = "The connection name of the GCP Cloud SQL instance (if deployed)."
  value       = var.cloud_provider == "gcp" ? google_sql_database_instance.main[0].connection_name : null
}

output "azure_postgresql_flexible_server_id" {
  description = "The ID of the Azure PostgreSQL Flexible Server (if deployed)."
  value       = var.cloud_provider == "azure" ? azurerm_postgresql_flexible_server.main[0].id : null
}