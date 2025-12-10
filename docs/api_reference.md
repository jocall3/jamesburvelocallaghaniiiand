# Multi-Cloud Billing Normalizer API Reference

This document provides a comprehensive reference for the Multi-Cloud Billing Normalizer API. This API allows you to retrieve and analyze your billing data from AWS, Google Cloud Platform (GCP), and Microsoft Azure, unified into a single, consistent schema.

## Base URL

`https://api.multicloudbilling.example.com/v1`

## Authentication

All API requests must be authenticated using an API Key provided in the `X-API-Key` header.

```
X-API-Key: YOUR_API_KEY_HERE
```

Failure to provide a valid API Key will result in a `401 Unauthorized` response.

## Common Data Models

### UnifiedBillingRecord

Represents a single billing record normalized across AWS, GCP, and Azure.

| Field Name          | Type      | Description