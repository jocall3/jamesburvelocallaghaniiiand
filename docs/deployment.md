# Unified AI Model Runner API Deployment Guide

This guide provides detailed instructions and prerequisites for deploying the Unified AI Model Runner API across various cloud environments. This API intelligently routes LLM queries to the cheapest or fastest available cloud provider (AWS Bedrock, Google Vertex AI, Azure OpenAI) based on configured preferences.

## Table of Contents

1.  [Introduction](#introduction)
2.  [Prerequisites](#prerequisites)
3.  [Configuration](#configuration)
    *   [Environment Variables](#environment-variables)
    *   [Cloud Provider Credentials](#cloud-provider-credentials)
4.  [Deployment Options](#deployment-options)
    *   [1. Docker (Local & Container Orchestration)](#1-docker-local--container-orchestration)
        *   [Build Docker Image](#build-docker-image)
        *   [Run Locally](#run-locally)
        *   [Push to Container Registry](#push-to-container-registry)
    *   [2. Kubernetes](#2-kubernetes)
        *   [Using Helm (Recommended)](#using-helm-recommended)
        *   [Manual Deployment with YAML](#manual-deployment-with-yaml)
    *   [3. Serverless Platforms](#3-serverless-platforms)
        *   [AWS Lambda](#aws-lambda)
        *   [Google Cloud Functions](#google-cloud-functions)
        *   [Azure Functions](#azure-functions)
5.  [Post-Deployment Steps](#post-deployment-steps)
    *   [Testing the API](#testing-the-api)
    *   [Monitoring and Logging](#monitoring-and-logging)
    *   [Scaling](#scaling)
    *   [Security Best Practices](#security-best-practices)

---

## 1. Introduction

The Unified AI Model Runner API acts as an intelligent proxy, abstracting away the complexities of interacting with multiple LLM providers. This document will guide you through setting up and deploying this service to ensure optimal performance and cost efficiency.

## 2. Prerequisites

Before you begin, ensure you have the following:

*   **Cloud Provider Accounts**:
    *   An AWS account with access to Amazon Bedrock.
    *   A Google Cloud Platform (GCP) account with Vertex AI enabled.
    *   An Azure account with Azure OpenAI Service enabled.
*   **API Keys/Credentials**:
    *   AWS credentials (IAM user with Bedrock access, or EC2 instance profile/EKS service account role).
    *   GCP Service Account key (JSON format) with Vertex AI User role.
    *   Azure OpenAI API Key and Endpoint URL.
*   **Development Tools**:
    *   [Git](https://git-scm.com/downloads)
    *   [Docker](https://www.docker.com/products/docker-desktop/) (for containerized deployments)
    *   [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) (for Kubernetes deployments)
    *   [Helm](https://helm.sh/docs/intro/install/) (for Kubernetes deployments, recommended)
    *   [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) / [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) / [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) (for AWS Serverless)
    *   [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) (for GCP Serverless)
    *   [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) / [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) (for Azure Serverless)
    *   Python 3.9+ and `pip` (if deploying directly or for serverless function runtimes)

## 3. Configuration

The API relies heavily on environment variables for configuration, especially for cloud provider credentials and routing logic.

### Environment Variables

Create a `.env` file in the root of your project (or configure these directly in your deployment environment):

```ini
# Cloud Provider Credentials (REQUIRED)
# AWS Bedrock
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=us-east-1 # e.g., us-east-1, us-west-2

# GCP Vertex AI
GCP_PROJECT_ID=your-gcp-project-id
# Path to your GCP service account key file (e.g., /app/gcp-key.json)
# For container deployments, mount this file. For serverless, use IAM roles.
GCP_SERVICE_ACCOUNT_KEY_PATH=/path/to/your/gcp-service-account-key.json

# Azure OpenAI
AZURE_OPENAI_API_KEY=YOUR_AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/ # e.g., https://my-aoai-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2023-05-15 # Or your specific version

# API Routing Logic (OPTIONAL - defaults will be used if not set)
# Strategy for choosing LLM provider: 'COST' or 'LATENCY'
ROUTING_STRATEGY=COST

# Cost thresholds (USD per 1000 tokens) - used if ROUTING_STRATEGY=COST
# These are example values and should be updated based on actual pricing and your budget.
AWS_BEDROCK_COST_PER_1K_TOKENS=0.0015 # Example for a specific model
GCP_VERTEX_AI_COST_PER_1K_TOKENS=0.0012 # Example for a specific model
AZURE_OPENAI_COST_PER_1K_TOKENS=0.0010 # Example for a specific model

# Latency thresholds (milliseconds) - used if ROUTING_STRATEGY=LATENCY
# These are example values and should be updated based on your performance requirements.
AWS_BEDROCK_LATENCY_MS=200
GCP_VERTEX_AI_LATENCY_MS=180
AZURE_OPENAI_LATENCY_MS=150

# Fallback provider if primary fails or is unavailable (e.g., 'AWS', 'GCP', 'AZURE')
FALLBACK_PROVIDER=AWS

# General API settings
API_PORT=8000 # For Docker/Kubernetes deployments
```

### Cloud Provider Credentials

*   **AWS**: For containerized deployments, it's recommended to use IAM Roles for Service Accounts (IRSA) in EKS or EC2 Instance Profiles for EC2/ECS to avoid hardcoding credentials. If using Lambda, the function's execution role will need Bedrock permissions.
*   **GCP**: For containerized deployments, mount the `GCP_SERVICE_ACCOUNT_KEY_PATH` file into the container. For Cloud Functions, the function's service account will need `Vertex AI User` role.
*   **Azure**: The `AZURE_OPENAI_API_KEY` is a direct key. For Azure Functions, you can store this in Application Settings.

## 4. Deployment Options

### 1. Docker (Local & Container Orchestration)

This is the most straightforward way to run the API in a consistent environment.

#### Build Docker Image

Navigate to the root of the API project and build the Docker image:

```bash
git clone <repository-url>
cd unified-ai-model-runner-api # Or your project directory
docker build -t unified-llm-router:latest .
```

#### Run Locally

To run the API locally using Docker, ensuring your `.env` file is configured:

```bash
docker run -d \
  --name unified-llm-router \
  -p 8000:8000 \
  --env-file .env \
  -v /path/to/your/gcp-service-account-key.json:/app/gcp-key.json:ro \
  unified-llm-router:latest
```
*   Replace `/path/to/your/gcp-service-account-key.json` with the actual path on your host machine.
*   Ensure `GCP_SERVICE_ACCOUNT_KEY_PATH` in your `.env` points to `/app/gcp-key.json` inside the container.

#### Push to Container Registry

For deployment to cloud container services (ECS, GKE, AKS), push your image to a registry:

**AWS ECR:**

```bash
aws ecr get-login-password --region <your-aws-region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<your-aws-region>.amazonaws.com
aws ecr create-repository --repository-name unified-llm-router --region <your-aws-region>
docker tag unified-llm-router:latest <aws_account_id>.dkr.ecr.<your-aws-region>.amazonaws.com/unified-llm-router:latest
docker push <aws_account_id>.dkr.ecr.<your-aws-region>.amazonaws.com/unified-llm-router:latest
```

**Google Container Registry (GCR) / Artifact Registry:**

```bash
gcloud auth configure-docker
docker tag unified-llm-router:latest gcr.io/<your-gcp-project-id>/unified-llm-router:latest
docker push gcr.io/<your-gcp-project-id>/unified-llm-router:latest
```

**Azure Container Registry (ACR):**

```bash
az acr login --name <your-acr-name>
docker tag unified-llm-router:latest <your-acr-name>.azurecr.io/unified-llm-router:latest
docker push <your-acr-name>.azurecr.io/unified-llm-router:latest
```

### 2. Kubernetes

Deploying to Kubernetes provides high availability, scalability, and robust management.

#### Using Helm (Recommended)

A Helm chart simplifies Kubernetes deployments. Assuming you have a `helm/unified-llm-router` chart in your repository:

1.  **Configure `values.yaml`**:
    Update `helm/unified-llm-router/values.yaml` with your image details, environment variables, and resource requests.
    ```yaml
    image:
      repository: <your-container-registry>/unified-llm-router
      tag: latest
      pullPolicy: IfNotPresent

    replicaCount: 2 # Or more for high availability

    env:
      AWS_ACCESS_KEY_ID: "YOUR_AWS_ACCESS_KEY_ID"
      AWS_SECRET_ACCESS_KEY: "YOUR_AWS_SECRET_ACCESS_KEY"
      AWS_REGION: "us-east-1"
      GCP_PROJECT_ID: "your-gcp-project-id"
      # For GCP_SERVICE_ACCOUNT_KEY_PATH, use Kubernetes Secrets and Volume Mounts
      # AZURE_OPENAI_API_KEY: "YOUR_AZURE_OPENAI_API_KEY"
      # AZURE_OPENAI_ENDPOINT: "https://your-resource-name.openai.azure.com/"
      # ... other environment variables ...

    # Example for GCP Service Account Key as a Secret
    # Create a secret: kubectl create secret generic gcp-sa-key --from-file=key.json=/path/to/your/gcp-service-account-key.json
    # Then configure volumeMounts and volumes in your deployment template.
    ```
    **Note on Secrets**: For sensitive data like API keys and GCP service account keys, use Kubernetes Secrets.
    *   Create secrets:
        ```bash
        kubectl create secret generic aws-credentials --from-literal=AWS_ACCESS_KEY_ID='...' --from-literal=AWS_SECRET_ACCESS_KEY='...'
        kubectl create secret generic azure-openai-key --from-literal=AZURE_OPENAI_API_KEY='...'
        kubectl create secret generic gcp-sa-key --from-file=key.json=/path/to/your/gcp-service-account-key.json
        ```
    *   Reference these secrets in your `deployment.yaml` (or Helm template) as environment variables or mounted files.

2.  **Install the Helm Chart**:

    ```bash
    helm upgrade --install unified-llm-router ./helm/unified-llm-router \
      --namespace default \
      --set image.repository=<your-registry>/unified-llm-router \
      --set image.tag=latest \
      --set env.AWS_REGION=us-east-1 \
      --set env.GCP_PROJECT_ID=your-gcp-project-id \
      # ... other overrides for non-secret env vars ...
      # For secrets, ensure your deployment.yaml references them
    ```

#### Manual Deployment with YAML

If you prefer not to use Helm, you can create Kubernetes YAML manifests:

1.  **`deployment.yaml`**: Defines the application pods.
2.  **`service.yaml`**: Exposes the deployment within the cluster.
3.  **`ingress.yaml`** (Optional): Exposes the service externally via an Ingress controller.
4.  **`secret.yaml`** (Optional, but recommended): Stores sensitive credentials.

Example `deployment.yaml` snippet (simplified):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unified-llm-router
  labels:
    app: unified-llm-router
spec:
  replicas: 2
  selector:
    matchLabels:
      app: unified-llm-router
  template:
    metadata:
      labels:
        app: unified-llm-router
    spec:
      containers:
      - name: unified-llm-router
        image: <your-container-registry>/unified-llm-router:latest
        ports:
        - containerPort: 8000
        env:
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: AWS_ACCESS_KEY_ID
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: AWS_SECRET_ACCESS_KEY
        - name: AWS_REGION
          value: "us-east-1"
        - name: GCP_PROJECT_ID
          value: "your-gcp-project-id"
        - name: GCP_SERVICE_ACCOUNT_KEY_PATH
          value: "/etc/gcp/key.json" # Path inside container
        - name: AZURE_OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: azure-openai-key
              key: AZURE_OPENAI_API_KEY
        - name: AZURE_OPENAI_ENDPOINT
          value: "https://your-resource-name.openai.azure.com/"
        # ... other environment variables ...
        volumeMounts:
        - name: gcp-sa-key-volume
          mountPath: "/etc/gcp"
          readOnly: true
      volumes:
      - name: gcp-sa-key-volume
        secret:
          secretName: gcp-sa-key # Name of the secret created earlier
```

Apply the manifests:

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
# kubectl apply -f ingress.yaml (if using)
```

### 3. Serverless Platforms

Deploying as a serverless function (Lambda, Cloud Functions, Azure Functions) is ideal for event-driven, cost-optimized, and auto-scaling scenarios.

#### AWS Lambda

Use AWS SAM or CDK for easier deployment.

1.  **`template.yaml` (SAM example)**:

    ```yaml
    AWSTemplateFormatVersion: '2010-09-09'
    Transform: AWS::Serverless-2016-10-31
    Description: Unified AI Model Runner API

    Resources:
      UnifiedLLMRouterFunction:
        Type: AWS::Serverless::Function
        Properties:
          Handler: app.handler # Assuming your main handler is in app.py
          Runtime: python3.9
          CodeUri: ./src # Path to your application code
          MemorySize: 512 # Adjust as needed
          Timeout: 30 # Adjust based on expected LLM response times
          Policies:
            - AWSSecretsManagerReadWrite # If using Secrets Manager for credentials
            - Statement: # Policy for Bedrock access
                Effect: Allow
                Action:
                  - bedrock:InvokeModel
                  - bedrock:ListFoundationModels
                Resource: "*"
          Environment:
            Variables:
              AWS_REGION: !Ref AWS::Region
              GCP_PROJECT_ID: your-gcp-project-id
              AZURE_OPENAI_ENDPOINT: https://your-resource-name.openai.azure.com/
              # Store AZURE_OPENAI_API_KEY in Secrets Manager and retrieve in code
              # Store GCP_SERVICE_ACCOUNT_KEY_PATH content in Secrets Manager or use Workload Identity Federation
              ROUTING_STRATEGY: COST
              # ... other environment variables ...
          Events:
            Api:
              Type: Api
              Properties:
                Path: /llm/route
                Method: post
    ```

2.  **Package and Deploy with SAM CLI**:

    ```bash
    sam build
    sam deploy --guided --capabilities CAPABILITY_IAM
    ```
    *   **Credentials**: For AWS, the Lambda execution role will need permissions for Bedrock. For GCP and Azure, you'll need to securely store and retrieve their credentials (e.g., using AWS Secrets Manager). For GCP, consider Workload Identity Federation for direct access without key files.

#### Google Cloud Functions

1.  **`main.py` (example)**:

    ```python
    import os
    from flask import Request, jsonify
    # Import your API logic here

    # Initialize your API router with environment variables
    # For GCP credentials, Cloud Functions automatically uses the service account
    # For AWS/Azure, retrieve from Secret Manager or environment variables
    # Example:
    # aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    # azure_openai_key = os.environ.get("AZURE_OPENAI_API_KEY")

    def unified_llm_router(request: Request):
        """HTTP Cloud Function for the Unified AI Model Runner API."""
        # Your API logic to process request, route, and return response
        # ...
        return jsonify({"message": "LLM routed successfully!"})
    ```

2.  **`requirements.txt`**: List your Python dependencies (e.g., `fastapi`, `uvicorn`, `boto3`, `google-cloud-aiplatform`, `openai`).

3.  **Deploy with `gcloud` CLI**:

    ```bash
    gcloud functions deploy unified-llm-router \
      --runtime python39 \
      --trigger-http \
      --entry-point unified_llm_router \
      --allow-unauthenticated \
      --set-env-vars AWS_REGION=us-east-1,AZURE_OPENAI_ENDPOINT=... \
      --set-secrets=AZURE_OPENAI_API_KEY=projects/your-project/secrets/azure-openai-key:latest \
      --project your-gcp-project-id \
      --region us-central1 # Or your preferred region
    ```
    *   **Credentials**: GCP Cloud Functions automatically uses the function's service account. Ensure it has `Vertex AI User` role. For AWS/Azure, use Google Secret Manager to store keys and reference them with `--set-secrets`.

#### Azure Functions

1.  **`__init__.py` (example for HTTP Trigger)**:

    ```python
    import logging
    import os
    import azure.functions as func
    # Import your API logic here

    # Initialize your API router with environment variables
    # Example:
    # aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    # azure_openai_key = os.environ.get("AZURE_OPENAI_API_KEY")

    def main(req: func.HttpRequest) -> func.HttpResponse:
        logging.info('Python HTTP trigger function processed a request.')
        # Your API logic to process request, route, and return response
        # ...
        return func.HttpResponse(
             "LLM routed successfully!",
             mimetype="application/json",
             status_code=200
        )
    ```

2.  **`requirements.txt`**: List your Python dependencies.

3.  **Deploy with Azure CLI**:

    ```bash
    # Create a Function App
    az functionapp create --resource-group <your-resource-group> --consumption-plan-location <region> --runtime python --runtime-version 3.9 --functions-version 4 --name <your-function-app-name> --storage-account <your-storage-account>

    # Deploy your code
    func azure functionapp publish <your-function-app-name> --build remote

    # Configure Application Settings (Environment Variables)
    az functionapp config appsettings set --name <your-function-app-name> --resource-group <your-resource-group> --settings \
        AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID" \
        AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY" \
        AWS_REGION="us-east-1" \
        GCP_PROJECT_ID="your-gcp-project-id" \
        AZURE_OPENAI_API_KEY="YOUR_AZURE_OPENAI_API_KEY" \
        AZURE_OPENAI_ENDPOINT="https://your-resource-name.openai.azure.com/" \
        ROUTING_STRATEGY="COST"
    ```
    *   **Credentials**: Azure Functions uses Application Settings for environment variables. For AWS/GCP credentials, store them securely in Azure Key Vault and retrieve them in your function code, or use Managed Identities for Azure-native services.

## 5. Post-Deployment Steps

### Testing the API

Once deployed, retrieve the API endpoint URL (Docker: `http://localhost:8000`, Kubernetes: Ingress/Service IP, Serverless: Function URL).

Use `curl` or a tool like Postman/Insomnia to send a test request:

```bash
curl -X POST <your-api-endpoint>/llm/route \
  -H "Content-Type: application/json" \
  -d '{
        "prompt": "Explain quantum entanglement in simple terms.",
        "model_preferences": {
          "max_tokens": 100,
          "temperature": 0.7
        },
        "routing_override": "LATENCY" # Optional: override default strategy for this request
      }'
```

Verify that you receive a valid response and that the routing logic (cost/latency) is working as expected.

### Monitoring and Logging

*   **Docker**: Use `docker logs <container-name>` or integrate with a logging driver.
*   **Kubernetes**: Use `kubectl logs <pod-name>` and integrate with a cluster-wide logging solution (e.g., Fluentd + Elasticsearch/Loki, or cloud-native logging like CloudWatch Logs, Stackdriver Logging, Azure Monitor Logs).
*   **AWS Lambda**: Logs are automatically sent to CloudWatch Logs.
*   **Google Cloud Functions**: Logs are automatically sent to Cloud Logging (Stackdriver).
*   **Azure Functions**: Logs are automatically sent to Azure Monitor Logs.

Implement metrics (e.g., request count, latency per provider, error rates) using Prometheus/Grafana for Kubernetes, or cloud-native monitoring services.

### Scaling

*   **Docker**: Manually scale containers or use Docker Swarm/Compose for basic orchestration.
*   **Kubernetes**: Configure Horizontal Pod Autoscalers (HPA) based on CPU/memory utilization or custom metrics.
*   **Serverless**: Auto-scaling is built-in and managed by the cloud provider.

### Security Best Practices

*   **Least Privilege**: Ensure your deployment's IAM roles/service accounts have only the necessary permissions to access Bedrock, Vertex AI, Azure OpenAI, and any other required services (e.g., Secrets Manager).
*   **Secrets Management**: Never hardcode API keys or sensitive credentials. Use cloud-native secret management services (AWS Secrets Manager, Google Secret Manager, Azure Key Vault) or Kubernetes Secrets.
*   **Network Security**:
    *   Restrict API access using firewalls, security groups, or VPC Service Controls.
    *   Use private endpoints for cloud services where possible.
    *   Ensure your API endpoint is secured with HTTPS/TLS.
*   **Input Validation**: Implement robust input validation to prevent injection attacks and ensure valid LLM requests.
*   **Rate Limiting**: Protect your API and upstream LLM providers from abuse by implementing rate limiting.
*   **Regular Updates**: Keep your application dependencies and base images updated to patch security vulnerabilities.