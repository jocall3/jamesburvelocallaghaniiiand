output "api_gateway_url" {
  description = "The base URL of the Multi-Cloud Billing Normalizer API Gateway."
  value       = aws_api_gateway_deployment.main_deployment.invoke_url
}

output "api_gateway_id" {
  description = "The ID of the Multi-Cloud Billing Normalizer API Gateway."
  value       = aws_api_gateway_rest_api.main_api.id
}

output "lambda_function_name" {
  description = "The name of the primary AWS Lambda function for billing normalization."
  value       = aws_lambda_function.billing_normalizer.function_name
}

output "lambda_function_arn" {
  description = "The ARN of the primary AWS Lambda function for billing normalization."
  value       = aws_lambda_function.billing_normalizer.arn
}

output "raw_billing_data_bucket_name" {
  description = "The name of the S3 bucket used to store raw billing data."
  value       = aws_s3_bucket.raw_billing_data.id
}

output "normalized_billing_data_bucket_name" {
  description = "The name of the S3 bucket used to store normalized billing data."
  value       = aws_s3_bucket.normalized_billing_data.id
}

output "processing_sqs_queue_url" {
  description = "The URL of the SQS queue used for asynchronous billing data processing."
  value       = aws_sqs_queue.processing_queue.id
}

output "processing_sqs_queue_arn" {
  description = "The ARN of the SQS queue used for asynchronous billing data processing."
  value       = aws_sqs_queue.processing_queue.arn
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table storing normalized billing records."
  value       = aws_dynamodb_table.normalized_billing_table.name
}

output "cloudwatch_log_group_name" {
  description = "The name of the CloudWatch Log Group for the Lambda function."
  value       = aws_cloudwatch_log_group.lambda_log_group.name
}