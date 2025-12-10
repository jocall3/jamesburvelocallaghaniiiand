variable "api_name" {
  description = "A unique name for the API service. Used for naming resources."
  type        = string
}

variable "image_name" {
  description = "Name of the Docker image (e.g., 'billing-normalizer-api'). This will also be the ECR repository name."
  type        = string
}

variable "image_tag" {
  description = "Tag of the Docker image to deploy (e.g., 'latest' or a specific version)."
  type        = string
  default     = "latest"
}

variable "container_port" {
  description = "The port on which the application listens inside the container."
  type        = number
  default     = 8080
}

variable "cpu" {
  description = "The number of CPU units reserved for the Fargate task. (e.g., 256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "The amount of memory (in MiB) reserved for the Fargate task. (e.g., 512, 1024, 2048, 4096, 8192)"
  type        = number
  default     = 512
}

variable "vpc_id" {
  description = "The ID of the VPC where the ECS service will be deployed."
  type        = string
}

variable "subnet_ids" {
  description = "A list of subnet IDs for the ECS service and ALB. These should be private subnets for the service and public for the ALB if external."
  type        = list(string)
}

variable "security_group_ids" {
  description = "A list of security group IDs to associate with the ECS service and ALB. These should allow inbound traffic on the container port from the ALB and outbound to necessary services."
  type        = list(string)
}

variable "environment_variables" {
  description = "A map of environment variables to pass to the container."
  type        = map(string)
  default     = {}
}

variable "desired_count" {
  description = "The number of desired tasks to run in the ECS service."
  type        = number
  default     = 1
}

variable "health_check_path" {
  description = "The path for the ALB health check (e.g., '/health')."
  type        = string
  default     = "/"
}

variable "health_check_interval" {
  description = "The interval (in seconds) for health checks."
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "The timeout (in seconds) for health checks."
  type        = number
  default     = 5
}

variable "health_check_healthy_threshold" {
  description = "The number of consecutive successful health checks required."
  type        = number
  default     = 3
}

variable "health_check_unhealthy_threshold" {
  description = "The number of consecutive failed health checks required."
  type        = number
  default     = 3
}

variable "alb_internal" {
  description = "Set to true to create an internal-facing Application Load Balancer. False for internet-facing."
  type        = bool
  default     = false
}

variable "enable_alb_deletion_protection" {
  description = "Set to true to enable deletion protection for the ALB."
  type        = bool
  default     = false
}

variable "assign_public_ip" {
  description = "Assign a public IP address to the Fargate tasks. Set to false if using NAT Gateway for outbound traffic."
  type        = bool
  default     = true
}

variable "tags" {
  description = "A map of tags to apply to all created resources."
  type        = map(string)
  default     = {}
}

# --- Data Sources ---
data "aws_region" "current" {}

# --- Resources ---

# ECR Repository for the API image
resource "aws_ecr_repository" "api_repo" {
  name                 = var.image_name
  image_tag_mutability = "MUTABLE" # Consider "IMMUTABLE" for production
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(var.tags, {
    Name = "${var.api_name}-ecr-repo"
  })
}

# ECS Cluster
resource "aws_ecs_cluster" "api_cluster" {
  name = "${var.api_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled" # Enable Container Insights for monitoring
  }

  tags = merge(var.tags, {
    Name = "${var.api_name}-cluster"
  })
}

# IAM Role for ECS Task Execution (required by Fargate for pulling images, logging, etc.)
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.api_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.api_name}-ecs-task-execution-role"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Task (permissions for the application itself, e.g., S3, DynamoDB access)
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.api_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.api_name}-ecs-task-role"
  })
}

# CloudWatch Log Group for ECS Task Logs
resource "aws_cloudwatch_log_group" "api_log_group" {
  name              = "/ecs/${var.api_name}"
  retention_in_days = 30 # Adjust retention as needed

  tags = merge(var.tags, {
    Name = "${var.api_name}-log-group"
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "api_task_definition" {
  family                   = "${var.api_name}-task"
  cpu                      = var.cpu
  memory                   = var.memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name        = var.api_name
      image       = "${aws_ecr_repository.api_repo.repository_url}:${var.image_tag}"
      cpu         = var.cpu
      memory      = var.memory
      essential   = true
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      environment = [for k, v in var.environment_variables : { name = k, value = v }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api_log_group.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = merge(var.tags, {
    Name = "${var.api_name}-task-definition"
  })
}

# Application Load Balancer (ALB)
resource "aws_lb" "api_alb" {
  name               = "${var.api_name}-alb"
  internal           = var.alb_internal
  load_balancer_type = "application"
  security_groups    = var.security_group_ids
  subnets            = var.subnet_ids

  enable_deletion_protection = var.enable_alb_deletion_protection

  tags = merge(var.tags, {
    Name = "${var.api_name}-alb"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "api_tg" {
  name        = "${var.api_name}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = var.health_check_path
    protocol            = "HTTP"
    matcher             = "200"
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
  }

  tags = merge(var.tags, {
    Name = "${var.api_name}-target-group"
  })
}

# ALB Listener (HTTP on port 80)
resource "aws_lb_listener" "api_listener_http" {
  load_balancer_arn = aws_lb.api_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }

  tags = merge(var.tags, {
    Name = "${var.api_name}-http-listener"
  })
}

# ECS Service
resource "aws_ecs_service" "api_service" {
  name            = "${var.api_name}-service"
  cluster         = aws_ecs_cluster.api_cluster.id
  task_definition = aws_ecs_task_definition.api_task_definition.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = var.assign_public_ip
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_tg.arn
    container_name   = var.api_name
    container_port   = var.container_port
  }

  # Optional: Deployment circuit breaker and minimum healthy percent
  deployment_controller {
    type = "ECS"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  ordered_placement_strategy {
    type  = "spread"
    field = "AZ"
  }

  tags = merge(var.tags, {
    Name = "${var.api_name}-service"
  })

  # Allows external autoscaling to manage desired_count without Terraform trying to reset it
  lifecycle {
    ignore_changes = [desired_count]
  }
}

# --- Outputs ---

output "api_endpoint" {
  description = "The DNS name of the Application Load Balancer for the API."
  value       = aws_lb.api_alb.dns_name
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster where the API service is deployed."
  value       = aws_ecs_cluster.api_cluster.name
}

output "ecs_service_name" {
  description = "The name of the ECS service running the API."
  value       = aws_ecs_service.api_service.name
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository where the API Docker image is stored."
  value       = aws_ecr_repository.api_repo.repository_url
}

output "alb_arn" {
  description = "The ARN of the Application Load Balancer."
  value       = aws_lb.api_alb.arn
}

output "alb_target_group_arn" {
  description = "The ARN of the ALB Target Group."
  value       = aws_lb_target_group.api_tg.arn
}

output "ecs_task_role_arn" {
  description = "The ARN of the IAM role assumed by the ECS tasks."
  value       = aws_iam_role.ecs_task_role.arn
}