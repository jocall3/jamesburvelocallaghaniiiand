terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0.0"
}

provider "aws" {
  region = var.aws_region
}

# --- Variables ---
variable "aws_region" {
  description = "The AWS region to deploy resources into."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "A unique name for the project, used for resource naming."
  type        = string
  default     = "multi-cloud-billing-normalizer"
}

variable "environment" {
  description = "The deployment environment (e.g., dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "lambda_memory_size" {
  description = "Memory size for the Lambda function in MB."
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Timeout for the Lambda function in seconds."
  type        = number
  default     = 30
}

variable "billing_data_bucket_name" {
  description = "Name for the S3 bucket to store raw billing data."
  type        = string
  default     = "raw-multi-cloud-billing-data" # Will be suffixed with project/env
}

# --- Networking (VPC, Subnets, Security Groups) ---
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count                   = 2 # Deploy two public subnets for high availability
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index) # 10.0.0.0/24, 10.0.1.0/24
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-subnet-${count.index}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-igw"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-rt"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-${var.environment}-lambda-sg"
  description = "Allow outbound internet access for Lambda"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-sg"
    Project     = var.project_name
    Environment = var.environment
  }
}

# --- Data Storage (S3 for raw, DynamoDB for normalized) ---
resource "aws_s3_bucket" "raw_billing_data" {
  bucket = "${var.billing_data_bucket_name}-${var.project_name}-${var.environment}"

  tags = {
    Name        = "${var.project_name}-${var.environment}-raw-billing-data"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "raw_billing_data_block" {
  bucket = aws_s3_bucket.raw_billing_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "normalized_billing" {
  name         = "${var.project_name}-${var.environment}-normalized-billing"
  billing_mode = "PAY_PER_REQUEST" # Use on-demand for flexibility
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "cloud_provider"
    type = "S"
  }
  attribute {
    name = "billing_period"
    type = "S"
  }

  global_secondary_index {
    name            = "CloudProviderBillingPeriodIndex"
    hash_key        = "cloud_provider"
    range_key       = "billing_period"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-normalized-billing"
    Project     = var.project_name
    Environment = var.environment
  }
}

# --- IAM Roles and Policies ---
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-${var.environment}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-exec-role"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_s3_dynamodb_access" {
  name = "${var.project_name}-${var.environment}-lambda-s3-dynamodb-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = ["${aws_s3_bucket.raw_billing_data.arn}", "${aws_s3_bucket.raw_billing_data.arn}/*"]
      },
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.normalized_billing.arn
      },
      {
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# --- Lambda Function (API Backend) ---
resource "aws_lambda_function" "api_handler" {
  function_name    = "${var.project_name}-${var.environment}-api-handler"
  handler          = "main.handler" # Assuming Python handler: main.py, handler function
  runtime          = "python3.9"
  role             = aws_iam_role.lambda_exec.arn
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # For a real application, you'd typically build and upload a zip file.
  # For this example, we'll use a placeholder local file.
  filename = data.archive_file.lambda_zip.output_path

  vpc_config {
    subnet_ids         = aws_subnet.public[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      NORMALIZED_BILLING_TABLE = aws_dynamodb_table.normalized_billing.name
      RAW_BILLING_BUCKET       = aws_s3_bucket.raw_billing_data.bucket
      ENVIRONMENT              = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-api-handler"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Placeholder for Lambda code (replace with actual application code)
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function_payload.zip"
  source_content = <<-EOF
    import json
    import os
    import boto3

    dynamodb = boto3.resource('dynamodb')
    s3 = boto3.client('s3')

    def handler(event, context):
        table_name = os.environ.get('NORMALIZED_BILLING_TABLE')
        bucket_name = os.environ.get('RAW_BILLING_BUCKET')
        environment = os.environ.get('ENVIRONMENT')

        table = dynamodb.Table(table_name)

        path = event.get('path', '/')
        http_method = event.get('httpMethod', 'GET')

        if path == '/health' and http_method == 'GET':
            return {
                'statusCode': 200,
                'body': json.dumps({'status': 'ok', 'environment': environment})
            }
        elif path == '/billing' and http_method == 'GET':
            # Example: Fetch some data
            try:
                response = table.scan(Limit=10) # Just a sample scan
                return {
                    'statusCode': 200,
                    'body': json.dumps(response.get('Items', []))
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)})
                }
        elif path == '/billing' and http_method == 'POST':
            try:
                body = json.loads(event['body'])
                # In a real app, process and normalize billing data here
                # For demo, just store it
                item = {
                    'id': body.get('id', 'default-id'),
                    'cloud_provider': body.get('cloud_provider', 'unknown'),
                    'billing_period': body.get('billing_period', '2023-01'),
                    'raw_data': body # Store raw for now
                }
                table.put_item(Item=item)

                # Simulate storing raw data in S3
                s3.put_object(
                    Bucket=bucket_name,
                    Key=f"raw/{item['cloud_provider']}/{item['billing_period']}/{item['id']}.json",
                    Body=json.dumps(body)
                )

                return {
                    'statusCode': 201,
                    'body': json.dumps({'message': 'Billing data processed', 'id': item['id']})
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)})
                }
        
        return {
            'statusCode': 404,
            'body': json.dumps({'message': 'Not Found'})
        }
    EOF
  # This is a dummy file for local testing. In a real project, you'd use a proper build process.
  # For production, you'd typically use a `source_path` to a directory containing your Lambda code.
  # For example: source_dir = "../src/lambda_handler"
}


# --- API Gateway (HTTP Endpoint) ---
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "API Gateway for Multi-Cloud Billing Normalizer"

  tags = {
    Name        = "${var.project_name}-${var.environment}-api"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_api_gateway_resource" "billing" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "billing"
}

resource "aws_api_gateway_method" "billing_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.billing.id
  http_method   = "GET"
  authorization = "NONE" # For simplicity, no auth. Use COGNITO_USER_POOLS or AWS_IAM for production.
}

resource "aws_api_gateway_integration" "billing_get_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.billing.id
  http_method             = aws_api_gateway_method.billing_get.http_method
  integration_http_method = "POST" # Lambda integrations always use POST
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_method" "billing_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.billing.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "billing_post_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.billing.id
  http_method             = aws_api_gateway_method.billing_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_get_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.health.id
  http_method             = aws_api_gateway_method.health_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}


resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.billing_get_lambda,
    aws_api_gateway_integration.billing_post_lambda,
    aws_api_gateway_integration.health_get_lambda,
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  # Note: Terraform will redeploy the API Gateway if any method/integration changes.
  # For production, consider using a null_resource with a timestamp trigger for explicit deployments.
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.billing.id,
      aws_api_gateway_method.billing_get.id,
      aws_api_gateway_integration.billing_get_lambda.id,
      aws_api_gateway_method.billing_post.id,
      aws_api_gateway_integration.billing_post_lambda.id,
      aws_api_gateway_resource.health.id,
      aws_api_gateway_method.health_get.id,
      aws_api_gateway_integration.health_get_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  tags = {
    Name        = "${var.project_name}-${var.environment}-stage"
    Project     = var.project_name
    Environment = var.environment
  }
}

# --- Permissions for API Gateway to invoke Lambda ---
resource "aws_lambda_permission" "api_gateway_invoke_lambda" {
  statement_id  = "AllowAPIGatewayInvokeLambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/* part allows invocation from any method on any resource under the API Gateway.
  # For more granular control, specify the exact resource and method.
  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# --- Data Sources ---
data "aws_availability_zones" "available" {
  state = "available"
}

# --- Outputs ---
output "api_gateway_endpoint" {
  description = "The base URL for the deployed API Gateway."
  value       = aws_api_gateway_stage.main.invoke_url
}

output "lambda_function_name" {
  description = "The name of the deployed Lambda function."
  value       = aws_lambda_function.api_handler.function_name
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket for raw billing data."
  value       = aws_s3_bucket.raw_billing_data.bucket
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table for normalized billing data."
  value       = aws_dynamodb_table.normalized_billing.name
}