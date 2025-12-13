# Copyright 2024 UNIVERSE-OS
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import uuid
import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Literal, Optional, Union
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Depends, BackgroundTasks
from pydantic import BaseModel, Field, Json
from starlette.responses import JSONResponse
from starlette.status import (
    HTTP_202_ACCEPTED,
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND,
    HTTP_500_INTERNAL_SERVER_ERROR,
)

# --- Core SDK Imports ---
# These would be provided by the shared core SDK library.
# For this standalone file, we'll use placeholder implementations.
try:
    from core_sdk.logging import get_logger
    from core_sdk.config import get_config_value
    from core_sdk.auth.middleware import AuthMiddleware, get_current_principal
    from core_sdk.auth.models import Principal
    from core_sdk.messaging.publisher import EventPublisher
    from core_sdk.messaging.models import CloudEvent
    from core_sdk.database.redis_client import get_redis_client
    from core_sdk.observability.metrics import instrument, count_request, measure_latency
except ImportError:
    # Placeholder implementations for standalone execution
    import logging
    def get_logger(name):
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        if not logger.handlers:
            logger.addHandler(handler)
        return logger

    def get_config_value(key, default=None):
        return os.environ.get(key, default)

    class Principal(BaseModel):
        id: str
        org_id: str
        roles: List[str]

    async def get_current_principal() -> Principal:
        return Principal(id="user-placeholder", org_id="org-placeholder", roles=["admin"])

    class AuthMiddleware:
        def __init__(self, app):
            self.app = app
        async def __call__(self, scope, receive, send):
            await self.app(scope, receive, send)

    class EventPublisher:
        def __init__(self, topic): self.topic = topic
        async def publish(self, event: 'CloudEvent'):
            logger.info(f"PUBLISHING EVENT to {self.topic}: {event.model_dump_json(indent=2)}")
        async def close(self): pass

    class CloudEvent(BaseModel):
        source: str
        type: str
        subject: str
        data: Dict[str, Any]
        specversion: str = "1.0"
        id: str = Field(default_factory=lambda: str(uuid.uuid4()))
        time: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    class RedisClient:
        def __init__(self): self._data = {}
        async def set(self, key, value, ex=None): self._data[key] = value
        async def get(self, key): return self._data.get(key)
        async def hset(self, name, key, value):
            if name not in self._data: self._data[name] = {}
            self._data[name][key] = value
        async def hgetall(self, name): return self._data.get(name, {})
        async def close(self): pass

    _redis_client = None
    def get_redis_client():
        global _redis_client
        if _redis_client is None: _redis_client = RedisClient()
        return _redis_client

    def instrument(*args, **kwargs):
        def decorator(f):
            return f
        return decorator
    
    def count_request(*args, **kwargs): pass
    def measure_latency(*args, **kwargs): pass


# --- Local Module Imports ---
# These would be in separate files within the application's src directory.
from generators.manager import GeneratorManager
from sinks.manager import DataSinkManager
from schemas.validator import validate_schema

# --- Application Setup ---
logger = get_logger("APP_12_Data_SyntheticGenerator")

# Global state for dependencies, managed by lifespan events
app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting APP_12_Data_SyntheticGenerator...")
    app_state["redis"] = get_redis_client()
    app_state["event_publisher"] = EventPublisher(topic=get_config_value("EVENT_BUS_TOPIC_DATA", "universe.data.events"))
    app_state["generator_manager"] = GeneratorManager()
    app_state["sink_manager"] = DataSinkManager()
    logger.info("Service initialized successfully.")
    yield
    # Shutdown
    logger.info("Shutting down APP_12_Data_SyntheticGenerator...")
    await app_state["event_publisher"].close()
    await app_state["redis"].close()
    logger.info("Shutdown complete.")

app = FastAPI(
    title="APP_12_Data_SyntheticGenerator",
    description="Orchestrates synthetic data generation pipelines using various generative models.",
    version="1.0.0",
    lifespan=lifespan,
)

# Add shared middleware
app.add_middleware(AuthMiddleware)

# --- Pydantic Models (Data Contracts) ---

class GeneratorConfig(BaseModel):
    provider: str = Field(..., description="AI provider to use for generation (e.g., 'openai', 'stability-ai', 'mock').")
    model: str = Field(..., description="Specific model name (e.g., 'gpt-4-turbo', 'stable-diffusion-3').")
    params: Dict[str, Any] = Field(default_factory=dict, description="Additional parameters for the model API call.")

class SchemaDefinition(BaseModel):
    type: Literal["json_schema", "tabular", "unstructured_text", "image"] = Field(..., description="The type of schema being defined.")
    definition: Dict[str, Any] = Field(..., description="The schema definition itself (e.g., a JSON Schema object, column definitions).")

class DataSinkConfig(BaseModel):
    type: Literal["s3", "webhook", "inline"] = Field(..., description="The destination for the generated data.")
    config: Dict[str, Any] = Field(..., description="Configuration for the sink (e.g., bucket name, webhook URL).")

class GenerationProfile(BaseModel):
    """
    Defines the core tension of the service: Fidelity vs. Cost/Speed.
    This choice dictates model selection, validation steps, and other parameters.
    """
    strategy: Literal["high_fidelity", "balanced", "high_speed"] = Field(
        "balanced",
        description="The desired trade-off between generation quality, cost, and speed."
    )
    enable_validation: bool = Field(
        True,
        description="Whether to run post-generation validation. Disabled for high_speed."
    )

class GenerationJobRequest(BaseModel):
    schema_definition: SchemaDefinition
    num_records: int = Field(..., gt=0, le=100000, description="Number of synthetic records to generate.")
    generator_config: GeneratorConfig
    data_sink: DataSinkConfig
    profile: GenerationProfile = Field(default_factory=GenerationProfile)
    tags: Dict[str, str] = Field(default_factory=dict, description="Key-value tags for tracking and billing.")

class JobMetrics(BaseModel):
    tokens_used: Optional[int] = None
    compute_seconds: Optional[float] = None
    estimated_cost_usd: Optional[float] = None
    records_generated: int = 0
    records_failed: int = 0

class GenerationJob(BaseModel):
    job_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: Literal["pending", "running", "completed", "failed", "partially_completed"] = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    owner_id: str
    org_id: str
    request: GenerationJobRequest
    error_message: Optional[str] = None
    metrics: JobMetrics = Field(default_factory=JobMetrics)
    results_location: Optional[str] = None

# --- Job Orchestration Logic ---

async def run_generation_job(job_id: str):
    """
    The core background task that executes a generation job.
    """
    redis = app_state["redis"]
    publisher = app_state["event_publisher"]
    job_data_raw = await redis.get(f"job:{job_id}")
    if not job_data_raw:
        logger.error(f"Job {job_id} not found in Redis for execution.")
        return

    job = GenerationJob.model_validate_json(job_data_raw)
    
    try:
        # 1. Update status to 'running'
        job.status = "running"
        job.updated_at = datetime.now(timezone.utc).isoformat()
        await redis.set(f"job:{job_id}", job.model_dump_json())
        await publisher.publish(CloudEvent(
            source="app_12_data_syntheticgenerator",
            type="synthetic_data.job.started",
            subject=job_id,
            data=job.model_dump()
        ))

        # 2. Select generator and data sink based on config
        generator = app_state["generator_manager"].get_generator(job.request.generator_config)
        data_sink = app_state["sink_manager"].get_sink(job.request.data_sink)

        # 3. Execute generation loop
        start_time = time.time()
        async with data_sink as sink:
            async for result in generator.generate(job.request.schema_definition, job.request.num_records, job.request.profile):
                if result.success:
                    await sink.write(result.data)
                    job.metrics.records_generated += 1
                else:
                    job.metrics.records_failed += 1
                    logger.warning(f"Record generation failed for job {job_id}: {result.error}")
                
                # Update metrics from the generation result
                if result.metrics:
                    job.metrics.tokens_used = (job.metrics.tokens_used or 0) + (result.metrics.get("tokens_used") or 0)

            job.results_location = await sink.finalize()

        end_time = time.time()
        job.metrics.compute_seconds = end_time - start_time
        
        # 4. Finalize status
        if job.metrics.records_failed > 0:
            job.status = "partially_completed" if job.metrics.records_generated > 0 else "failed"
        else:
            job.status = "completed"
        
        job.error_message = f"{job.metrics.records_failed} records failed to generate." if job.metrics.records_failed > 0 else None

    except Exception as e:
        logger.exception(f"Job {job_id} failed with an unhandled exception.")
        job.status = "failed"
        job.error_message = str(e)
    
    finally:
        # 5. Persist final state and publish completion event
        job.updated_at = datetime.now(timezone.utc).isoformat()
        await redis.set(f"job:{job_id}", job.model_dump_json())
        await publisher.publish(CloudEvent(
            source="app_12_data_syntheticgenerator",
            type=f"synthetic_data.job.{job.status}",
            subject=job_id,
            data=job.model_dump()
        ))
        logger.info(f"Job {job_id} finished with status: {job.status}")


# --- API Endpoints ---

@app.post("/v1/jobs", status_code=HTTP_202_ACCEPTED, response_model=GenerationJob)
@instrument(service="synthetic_generator", endpoint="create_job")
async def create_generation_job(
    request: GenerationJobRequest,
    background_tasks: BackgroundTasks,
    principal: Principal = Depends(get_current_principal)
):
    """
    Creates and starts a new synthetic data generation job.
    """
    count_request(endpoint="create_job", schema_type=request.schema_definition.type)
    start_time = time.time()

    # Validate the schema before accepting the job
    is_valid, error = await validate_schema(request.schema_definition)
    if not is_valid:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=f"Schema validation failed: {error}")

    # Check for jurisdictional feature flags
    if "pii" in request.schema_definition.definition.get("properties", {}) and not get_config_value("ENABLE_PII_GENERATION", False):
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="PII generation is disabled in this jurisdiction.")

    job = GenerationJob(
        owner_id=principal.id,
        org_id=principal.org_id,
        request=request
    )

    redis = app_state["redis"]
    await redis.set(f"job:{job.job_id}", job.model_dump_json(), ex=86400) # 24-hour TTL for job state

    background_tasks.add_task(run_generation_job, job.job_id)

    publisher = app_state["event_publisher"]
    await publisher.publish(CloudEvent(
        source="app_12_data_syntheticgenerator",
        type="synthetic_data.job.created",
        subject=job.job_id,
        data=job.model_dump()
    ))
    
    latency = time.time() - start_time
    measure_latency(endpoint="create_job", latency_ms=latency * 1000)
    
    logger.info(f"Created job {job.job_id} for org {principal.org_id}")
    return job

@app.get("/v1/jobs/{job_id}", response_model=GenerationJob)
@instrument(service="synthetic_generator", endpoint="get_job_status")
async def get_job_status(job_id: str, principal: Principal = Depends(get_current_principal)):
    """
    Retrieves the status and details of a specific generation job.
    """
    redis = app_state["redis"]
    job_data_raw = await redis.get(f"job:{job_id}")
    if not job_data_raw:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Job not found")
    
    job = GenerationJob.model_validate_json(job_data_raw)

    # Basic authorization check
    if job.org_id != principal.org_id and "system_admin" not in principal.roles:
        raise HTTPException(status_code=403, detail="Forbidden")

    return job

@app.get("/v1/providers", response_model=List[Dict[str, Any]])
async def list_available_providers():
    """
    Lists the available data generation providers and their models.
    """
    manager = app_state["generator_manager"]
    return await manager.list_providers()

# --- Self-Querying Agent Endpoints ---

AGENT_METADATA = {
    "purpose": "Orchestrates the generation of synthetic datasets based on user-defined schemas, constraints, and quality profiles. It integrates with multiple AI model providers to produce diverse data types.",
    "dependencies": [
        "core_sdk.auth: For authenticating and authorizing requests.",
        "core_sdk.messaging: To publish events about job lifecycle (created, started, completed, failed).",
        "core_sdk.database.redis: For temporary storage of job state and metadata.",
        "External AI Providers (e.g., OpenAI, Stability AI): For the actual data generation.",
        "Data Storage Services (e.g., AWS S3): As a sink for the generated data."
    ],
    "invalidation_conditions": [
        "Major breaking changes in an integrated AI provider's API.",
        "Deprecation of the underlying message bus protocol.",
        "Significant changes to the shared Principal auth model."
    ],
    "adjacent_apps": [
        "APP_11_Data_SchemaRegistry: Provides versioned schemas that can be used as input for this service.",
        "APP_13_Data_LifecycleManager: Can consume the output of this service to manage datasets.",
        "APP_21_Evaluation_Benchmarking: Can use the generated data to run model benchmarks.",
        "APP_31_Cost_BillingEngine: Consumes job completion events to calculate and bill for usage based on metrics."
    ]
}

@app.get("/introspect", tags=["Agent"])
async def introspect():
    """Provides machine-readable metadata about the service's purpose and dependencies."""
    return {
        "app_name": "APP_12_Data_SyntheticGenerator",
        "version": "1.0.0",
        "agent_metadata": AGENT_METADATA
    }

@app.get("/assumptions", tags=["Agent"])
async def assumptions():
    """Lists the key assumptions the service operates under."""
    return {
        "network_access": "The service assumes it has reliable network access to external AI provider APIs and data sinks (e.g., S3).",
        "schema_validity": "Assumes that while schemas are syntactically validated, they are semantically meaningful for generation. Poorly designed schemas will lead to poor quality data.",
        "cost_model": "Assumes that the cost estimation model (based on tokens, compute time) is a reasonable proxy for actual cost, but may not be exact.",
        "state_transience": "Job state stored in Redis is assumed to be transient. A more robust system would use a persistent database.",
        "asynchronous_nature": "Clients are assumed to understand the asynchronous nature of jobs and will poll the status endpoint rather than expecting immediate results."
    }

@app.get("/failure-modes", tags=["Agent"])
async def failure_modes():
    """Describes common ways the service can fail and their impact."""
    return {
        "provider_api_failure": {
            "description": "An external AI provider's API is down or returns errors.",
            "impact": "Generation for jobs using that provider will fail. The job will be marked as 'failed'.",
            "mitigation": "Built-in retries with exponential backoff. Support for multiple providers allows users to switch."
        },
        "data_sink_failure": {
            "description": "The configured data sink (e.g., S3 bucket) is unavailable or misconfigured (e.g., permissions).",
            "impact": "Data cannot be written, and the job will fail, potentially after incurring generation costs.",
            "mitigation": "Pre-flight checks for sink connectivity and permissions could be implemented. Clear error messages are provided."
        },
        "invalid_generation_request": {
            "description": "A user requests a combination of schema and model that is incompatible (e.g., asking a text model to generate an image).",
            "impact": "The job will fail quickly with a configuration error.",
            "mitigation": "Provider manager has capability mappings to prevent some invalid combinations. Enhanced schema validation."
        },
        "resource_exhaustion": {
            "description": "A large number of concurrent, high-volume jobs exhausts available compute or memory.",
            "impact": "Service may become slow or unresponsive. New jobs may be delayed or fail.",
            "mitigation": "Rate limiting, job queuing with worker scaling, and resource monitoring are required for production-grade scaling."
        }
    }

@app.get("/update-triggers", tags=["Agent"])
async def update_triggers():
    """Explains what events or conditions would necessitate an update to this service."""
    return {
        "new_ai_provider": "Addition of a new major AI model provider requires creating a new Generator adapter.",
        "new_data_sink": "Support for a new data storage system (e.g., Google Cloud Storage, a database) requires a new DataSink adapter.",
        "schema_evolution": "Introduction of a new, fundamentally different schema type (e.g., 3D models, audio) would require significant changes to the generation loop and validation logic.",
        "compliance_requirements": "New data privacy or residency regulations (e.g., GDPR, CCPA) may require adding feature flags, data anonymization hooks, or region-locking capabilities."
    }

# --- Main Entry Point ---
if __name__ == "__main__":
    import uvicorn
    # This is for local development. In production, a Gunicorn/Uvicorn process manager would be used.
    # Disclaimer: This service is for demonstration purposes and is not intended for production use without further hardening.
    # It does not implement robust security, scalability, or error handling features expected of a production system.
    print("--- DISCLAIMER ---")
    print("This application is part of a proof-of-concept ecosystem.")
    print("It is not intended for production use without significant hardening.")
    print("No guarantees or warranties are provided.")
    print("------------------")
    uvicorn.run(app, host="0.0.0.0", port=8012)