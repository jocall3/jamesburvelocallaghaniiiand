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
import time
import json
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Literal, Union
from enum import Enum

import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request
from pydantic import BaseModel, Field, HttpUrl
from pydantic_settings import BaseSettings
import evaluate
from datasets import load_dataset, Dataset
import httpx

# ==============================================================================
# Core SDK Integration (Placeholders)
# In a real scenario, this would be a shared library `universe_sdk`.
# ==============================================================================

from core_sdk.logging import get_logger
from core_sdk.database import get_db_session, Base, engine
from core_sdk.auth import get_current_active_user, User
from core_sdk.events import EventPublisher, Event
from core_sdk.config import load_config
from core_sdk.ontology import (
    Entity,
    BenchmarkJobStatus as OntologyBenchmarkJobStatus,
    MetricType,
    Provider,
)
from core_sdk.feature_flags import is_feature_enabled

# Initialize Core SDK components
logger = get_logger("APP_10_Evaluation_BenchmarkService")
config = load_config()
event_publisher = EventPublisher()

# ==============================================================================
# Agent Metadata
# ==============================================================================

AGENT_METADATA = {
    "agent_metadata": {
        "purpose": "Orchestrates and executes evaluation benchmarks for AI models across multiple providers, datasets, and metrics. It provides a standardized framework for comparing model performance on various tasks.",
        "dependencies": [
            "core_sdk.database: For storing job definitions and results.",
            "core_sdk.auth: To secure API endpoints.",
            "core_sdk.events: To publish notifications on benchmark completion.",
            "APP_01_Inference_CostRouter: Potentially for routing inference requests during benchmarks.",
            "APP_07_DataAccess_UnifiedAPIs: For accessing standardized datasets.",
            "APP_37_Governance_AuditTrailEngine: For logging benchmark execution events for compliance.",
        ],
        "invalidation_conditions": [
            "Major version changes in integrated provider APIs (e.g., OpenAI, Anthropic).",
            "Deprecation of core evaluation libraries (e.g., Hugging Face Evaluate).",
            "Significant schema changes in the shared database.",
            "Changes in the shared event bus protocol.",
        ],
        "adjacent_apps": [
            "APP_11_Evaluation_HumanInTheLoop",
            "APP_12_Evaluation_RedTeamingService",
            "APP_58_Narrative_ModelExplainabilityUI",
        ],
    }
}

# ==============================================================================
# Configuration
# ==============================================================================

class AppSettings(BaseSettings):
    APP_NAME: str = "APP_10_Evaluation_BenchmarkService"
    APP_VERSION: str = "1.0.0"
    HTTP_CLIENT_TIMEOUT: int = 60
    MAX_CONCURRENT_JOBS: int = 10
    RESULTS_CACHE_TTL: int = 3600 # 1 hour
    
    # Jurisdictional controls
    ALLOWED_DATA_REGIONS: List[str] = Field(default_factory=lambda: ["EU", "US-WEST"])

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = AppSettings()

# ==============================================================================
# Database Models (using SQLAlchemy from core_sdk)
# ==============================================================================

from sqlalchemy import Column, String, DateTime, JSON, Enum as SQLAlchemyEnum, ForeignKey
from sqlalchemy.orm import relationship

class BenchmarkJobDB(Base):
    __tablename__ = "benchmark_jobs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(SQLAlchemyEnum(OntologyBenchmarkJobStatus), default=OntologyBenchmarkJobStatus.PENDING)
    job_request = Column(JSON)
    error_message = Column(String, nullable=True)
    
    results = relationship("BenchmarkResultDB", back_populates="job", cascade="all, delete-orphan")

class BenchmarkResultDB(Base):
    __tablename__ = "benchmark_results"

    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("benchmark_jobs.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    scores = Column(JSON) # { "metric_name": score_value }
    unit_economics = Column(JSON) # { "input_tokens": X, "output_tokens": Y, "latency_ms": Z }
    
    job = relationship("BenchmarkJobDB", back_populates="results")

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)


# ==============================================================================
# Pydantic API Models (Data Contracts)
# ==============================================================================

class ModelProviderConfig(BaseModel):
    provider: Provider = Field(..., description="The AI model provider.")
    model_name: str = Field(..., description="The specific model identifier, e.g., 'gpt-4-turbo'.")
    api_key_secret_name: Optional[str] = Field(None, description="Name of the secret holding the API key.")

class DatasetConfig(BaseModel):
    source_type: Literal["huggingface", "url"] = Field(..., description="The source of the dataset.")
    path: str = Field(..., description="Path or URL to the dataset.")
    split: Optional[str] = Field("test", description="Dataset split to use.")
    subset: Optional[str] = Field(None, description="Dataset subset or configuration name.")
    input_column: str = Field(..., description="Column name for model input/prompt.")
    reference_column: str = Field(..., description="Column name for the ground truth reference.")
    sample_size: Optional[int] = Field(None, description="Number of samples to use. If None, use the full dataset.")

class MetricConfig(BaseModel):
    metric_type: MetricType = Field(..., description="The type of metric to compute.")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Parameters for the metric function.")

class BenchmarkProfile(str, Enum):
    QUICK_CHECK = "quick_check"
    STANDARD = "standard"
    DEEP_DIVE = "deep_dive"

class BenchmarkJobRequest(BaseModel):
    name: str = Field(..., description="A human-readable name for the benchmark job.")
    models: List[ModelProviderConfig] = Field(..., min_length=1, description="List of models to evaluate.")
    dataset: DatasetConfig
    metrics: List[MetricConfig] = Field(..., min_length=1)
    prompt_template: Optional[str] = Field(
        "{input}", 
        description="A template for formatting the input. Use {input} as a placeholder for the dataset's input column."
    )
    profile: BenchmarkProfile = Field(
        BenchmarkProfile.STANDARD,
        description="The evaluation profile, trading off rigor vs. speed. 'quick_check' uses smaller samples, 'deep_dive' is exhaustive."
    )

class BenchmarkJob(Entity):
    id: str
    status: OntologyBenchmarkJobStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    job_request: BenchmarkJobRequest
    error_message: Optional[str] = None

class UnitEconomics(BaseModel):
    total_input_tokens: int
    total_output_tokens: int
    avg_latency_ms: float
    total_cost_usd: Optional[float] = None # To be implemented by a cost service

class BenchmarkResult(Entity):
    model: ModelProviderConfig
    scores: Dict[str, float]
    unit_economics: UnitEconomics
    raw_outputs: List[Dict[str, Any]] = Field(..., description="List of raw model predictions and references.")

class BenchmarkJobResults(Entity):
    job: BenchmarkJob
    results: List[BenchmarkResult]

# ==============================================================================
# Model Provider Adapters (Extensibility & No Vendor Lock-in)
# ==============================================================================

class ModelProviderAdapter:
    """Abstract base class for model provider integrations."""
    def __init__(self, model_config: ModelProviderConfig, http_client: httpx.AsyncClient):
        self.model_config = model_config
        self.http_client = http_client

    async def generate(self, prompts: List[str]) -> List[Dict[str, Any]]:
        """Generate responses for a batch of prompts."""
        raise NotImplementedError

    def _get_api_key(self) -> str:
        # In a real system, this would fetch from a secure vault like HashiCorp Vault or AWS Secrets Manager
        # using the `api_key_secret_name`.
        secret_name = self.model_config.api_key_secret_name
        if not secret_name:
            raise ValueError(f"API key secret name not provided for provider {self.model_config.provider}")
        
        # Placeholder for secret retrieval
        api_key = os.getenv(secret_name)
        if not api_key:
            raise ValueError(f"API key not found in environment for secret {secret_name}")
        return api_key

class OpenAIAdapter(ModelProviderAdapter):
    async def generate(self, prompts: List[str]) -> List[Dict[str, Any]]:
        api_key = self._get_api_key()
        headers = {"Authorization": f"Bearer {api_key}"}
        results = []
        for prompt in prompts:
            start_time = time.perf_counter()
            try:
                response = await self.http_client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": self.model_config.model_name,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                response.raise_for_status()
                data = response.json()
                latency_ms = (time.perf_counter() - start_time) * 1000
                results.append({
                    "prediction": data["choices"][0]["message"]["content"],
                    "input_tokens": data["usage"]["prompt_tokens"],
                    "output_tokens": data["usage"]["completion_tokens"],
                    "latency_ms": latency_ms,
                    "error": None,
                })
            except (httpx.HTTPStatusError, Exception) as e:
                logger.error(f"OpenAI API error for model {self.model_config.model_name}: {e}")
                results.append({
                    "prediction": None,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "latency_ms": (time.perf_counter() - start_time) * 1000,
                    "error": str(e),
                })
        return results

class AnthropicAdapter(ModelProviderAdapter):
    async def generate(self, prompts: List[str]) -> List[Dict[str, Any]]:
        api_key = self._get_api_key()
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        results = []
        for prompt in prompts:
            start_time = time.perf_counter()
            try:
                response = await self.http_client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json={
                        "model": self.model_config.model_name,
                        "max_tokens": 1024,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                response.raise_for_status()
                data = response.json()
                latency_ms = (time.perf_counter() - start_time) * 1000
                results.append({
                    "prediction": data["content"][0]["text"],
                    "input_tokens": data["usage"]["input_tokens"],
                    "output_tokens": data["usage"]["output_tokens"],
                    "latency_ms": latency_ms,
                    "error": None,
                })
            except (httpx.HTTPStatusError, Exception) as e:
                logger.error(f"Anthropic API error for model {self.model_config.model_name}: {e}")
                results.append({
                    "prediction": None,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "latency_ms": (time.perf_counter() - start_time) * 1000,
                    "error": str(e),
                })
        return results

def get_model_adapter(model_config: ModelProviderConfig, http_client: httpx.AsyncClient) -> ModelProviderAdapter:
    """Factory function to get the correct model adapter."""
    if model_config.provider == Provider.OPENAI:
        return OpenAIAdapter(model_config, http_client)
    elif model_config.provider == Provider.ANTHROPIC:
        return AnthropicAdapter(model_config, http_client)
    # Add other providers like HuggingFace, Google, etc. here
    else:
        raise NotImplementedError(f"Provider '{model_config.provider}' is not supported.")

# ==============================================================================
# Benchmark Orchestration Service
# ==============================================================================

class BenchmarkRunner:
    """
    Encapsulates the logic for executing a single benchmark job.
    This class demonstrates the core tension: Rigor vs. Speed.
    The `profile` parameter directly influences dataset size and potentially
    metric complexity, making the trade-off explicit.
    """
    def __init__(self, job_id: str, job_request: BenchmarkJobRequest, db_session):
        self.job_id = job_id
        self.job_request = job_request
        self.db = db_session
        self.http_client = httpx.AsyncClient(timeout=settings.HTTP_CLIENT_TIMEOUT)

    async def run(self):
        """Main orchestration method for the benchmark job."""
        try:
            await self._update_job_status(OntologyBenchmarkJobStatus.RUNNING, started_at=datetime.now(timezone.utc))
            
            dataset = self._load_and_prepare_dataset()
            
            for model_config in self.job_request.models:
                await self._evaluate_model(model_config, dataset)

            await self._update_job_status(OntologyBenchmarkJobStatus.COMPLETED, completed_at=datetime.now(timezone.utc))
            await self._publish_completion_event()

        except Exception as e:
            logger.error(f"Benchmark job {self.job_id} failed: {e}", exc_info=True)
            await self._update_job_status(OntologyBenchmarkJobStatus.FAILED, error_message=str(e))
            await self._publish_completion_event(success=False, error=str(e))
        finally:
            await self.http_client.aclose()

    def _load_and_prepare_dataset(self) -> Dataset:
        """Loads dataset from source and applies sampling based on profile."""
        logger.info(f"[{self.job_id}] Loading dataset: {self.job_request.dataset.path}")
        
        # Jurisdictional check
        if not is_feature_enabled("ALLOW_UNRESTRICTED_DATA_SOURCES"):
            # A real implementation would check the dataset's metadata for region info
            logger.warning(f"[{self.job_id}] Skipping jurisdictional data source check. Feature flag is off.")

        ds = load_dataset(
            self.job_request.dataset.path,
            name=self.job_request.dataset.subset,
            split=self.job_request.dataset.split,
        )

        # Apply sampling based on the Rigor vs. Speed profile
        sample_size = self.job_request.dataset.sample_size
        if not sample_size:
            if self.job_request.profile == BenchmarkProfile.QUICK_CHECK:
                sample_size = min(100, len(ds))
            elif self.job_request.profile == BenchmarkProfile.STANDARD:
                sample_size = min(1000, len(ds))
            # DEEP_DIVE uses the full dataset (sample_size is None)

        if sample_size:
            logger.info(f"[{self.job_id}] Sampling dataset to {sample_size} examples for profile '{self.job_request.profile}'.")
            ds = ds.shuffle(seed=42).select(range(sample_size))
        
        return ds

    async def _evaluate_model(self, model_config: ModelProviderConfig, dataset: Dataset):
        """Runs inference and calculates metrics for a single model."""
        logger.info(f"[{self.job_id}] Evaluating model: {model_config.provider.value} - {model_config.model_name}")
        
        adapter = get_model_adapter(model_config, self.http_client)
        
        prompts = [
            self.job_request.prompt_template.format(input=item[self.job_request.dataset.input_column])
            for item in dataset
        ]
        references = [item[self.job_request.dataset.reference_column] for item in dataset]

        # Run inference
        inference_results = await adapter.generate(prompts)
        
        predictions = [res["prediction"] for res in inference_results if res["prediction"] is not None]
        valid_references = [ref for res, ref in zip(inference_results, references) if res["prediction"] is not None]

        # Calculate metrics
        scores = {}
        for metric_conf in self.job_request.metrics:
            logger.info(f"[{self.job_id}] Calculating metric: {metric_conf.metric_type.value}")
            try:
                metric = evaluate.load(metric_conf.metric_type.value)
                # Note: Some metrics require specific input formats. This is a simplification.
                result = metric.compute(predictions=predictions, references=valid_references, **metric_conf.parameters)
                # Flatten result dict if it contains nested scores
                for key, value in result.items():
                    if isinstance(value, (int, float)):
                        scores[key] = value
            except Exception as e:
                logger.warning(f"[{self.job_id}] Could not compute metric {metric_conf.metric_type.value}: {e}")
                scores[metric_conf.metric_type.value] = -1.0 # Indicate failure

        # Aggregate unit economics
        total_input_tokens = sum(res["input_tokens"] for res in inference_results)
        total_output_tokens = sum(res["output_tokens"] for res in inference_results)
        avg_latency_ms = sum(res["latency_ms"] for res in inference_results) / len(inference_results) if inference_results else 0

        unit_economics = UnitEconomics(
            total_input_tokens=total_input_tokens,
            total_output_tokens=total_output_tokens,
            avg_latency_ms=avg_latency_ms,
        )

        # Store results
        result_id = str(uuid.uuid4())
        result_db = BenchmarkResultDB(
            id=result_id,
            job_id=self.job_id,
            scores=scores,
            unit_economics=unit_economics.model_dump(),
        )
        self.db.add(result_db)
        self.db.commit()
        logger.info(f"[{self.job_id}] Stored results for model {model_config.model_name}")

    async def _update_job_status(self, status: OntologyBenchmarkJobStatus, **kwargs):
        """Updates the job status in the database."""
        job_db = self.db.query(BenchmarkJobDB).filter(BenchmarkJobDB.id == self.job_id).first()
        if job_db:
            job_db.status = status
            for key, value in kwargs.items():
                setattr(job_db, key, value)
            self.db.commit()
            logger.info(f"[{self.job_id}] Status updated to {status.value}")

    async def _publish_completion_event(self, success: bool = True, error: Optional[str] = None):
        """Publishes an event to the shared message bus on job completion."""
        event = Event(
            event_type="benchmark.job.completed",
            source=settings.APP_NAME,
            payload={
                "job_id": self.job_id,
                "success": success,
                "error": error,
                "completion_time": datetime.now(timezone.utc).isoformat(),
            }
        )
        await event_publisher.publish(event)
        logger.info(f"[{self.job_id}] Published completion event.")


# ==============================================================================
# FastAPI Application
# ==============================================================================

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A service to orchestrate and execute evaluation benchmarks for AI models.",
)

# --- API Endpoints ---

@app.post("/v1/benchmarks", response_model=BenchmarkJob, status_code=status.HTTP_202_ACCEPTED)
async def create_benchmark_job(
    request: BenchmarkJobRequest,
    background_tasks: BackgroundTasks,
    db=Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create and start a new benchmark evaluation job.
    The job runs in the background. Use the returned job ID to check status and retrieve results.
    """
    job_id = str(uuid.uuid4())
    
    # Audit hook
    logger.info(f"User {current_user.id} creating benchmark job {job_id} with name '{request.name}'")

    job_db = BenchmarkJobDB(
        id=job_id,
        user_id=current_user.id,
        status=OntologyBenchmarkJobStatus.PENDING,
        job_request=request.model_dump(),
    )
    db.add(job_db)
    db.commit()
    db.refresh(job_db)

    runner = BenchmarkRunner(job_id=job_id, job_request=request, db_session=db)
    background_tasks.add_task(runner.run)

    return BenchmarkJob(
        id=job_db.id,
        status=job_db.status,
        created_at=job_db.created_at,
        job_request=request,
    )

@app.get("/v1/benchmarks", response_model=List[BenchmarkJob])
async def list_benchmark_jobs(
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    List all benchmark jobs for the current user.
    """
    jobs_db = db.query(BenchmarkJobDB).filter(BenchmarkJobDB.user_id == current_user.id).offset(skip).limit(limit).all()
    return [
        BenchmarkJob(
            id=job.id,
            status=job.status,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
            job_request=BenchmarkJobRequest(**job.job_request),
            error_message=job.error_message,
        ) for job in jobs_db
    ]

@app.get("/v1/benchmarks/{job_id}", response_model=BenchmarkJob)
async def get_benchmark_job_status(
    job_id: str,
    db=Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the status and details of a specific benchmark job.
    """
    job_db = db.query(BenchmarkJobDB).filter(BenchmarkJobDB.id == job_id, BenchmarkJobDB.user_id == current_user.id).first()
    if not job_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Benchmark job not found")
    
    return BenchmarkJob(
        id=job_db.id,
        status=job_db.status,
        created_at=job_db.created_at,
        started_at=job_db.started_at,
        completed_at=job_db.completed_at,
        job_request=BenchmarkJobRequest(**job_db.job_request),
        error_message=job_db.error_message,
    )

@app.get("/v1/benchmarks/{job_id}/results", response_model=BenchmarkJobResults)
async def get_benchmark_job_results(
    job_id: str,
    db=Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the detailed results of a completed benchmark job.
    """
    job_db = db.query(BenchmarkJobDB).filter(BenchmarkJobDB.id == job_id, BenchmarkJobDB.user_id == current_user.id).first()
    if not job_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Benchmark job not found")
    
    if job_db.status != OntologyBenchmarkJobStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Job is not complete. Current status: {job_db.status.value}")

    job_info = BenchmarkJob(
        id=job_db.id,
        status=job_db.status,
        created_at=job_db.created_at,
        started_at=job_db.started_at,
        completed_at=job_db.completed_at,
        job_request=BenchmarkJobRequest(**job_db.job_request),
    )

    results_db = db.query(BenchmarkResultDB).filter(BenchmarkResultDB.job_id == job_id).all()
    
    # This mapping is a bit simplified; a real system would store model info with results
    model_configs = {mc.model_name: mc for mc in job_info.job_request.models}
    
    results = []
    # This is a placeholder logic to map results back to models.
    # A robust implementation would store the model identifier directly in the result row.
    for i, res_db in enumerate(results_db):
        model_config = job_info.job_request.models[i] if i < len(job_info.job_request.models) else None
        if model_config:
            results.append(
                BenchmarkResult(
                    model=model_config,
                    scores=res_db.scores,
                    unit_economics=UnitEconomics(**res_db.unit_economics),
                    raw_outputs=[] # For brevity, not storing raw outputs in this example
                )
            )

    return BenchmarkJobResults(job=job_info, results=results)

# --- Self-Querying Agent Endpoints ---

@app.get("/introspect", tags=["Agent"])
def introspect():
    """Provides machine-readable metadata about the application's purpose and capabilities."""
    return AGENT_METADATA

@app.get("/assumptions", tags=["Agent"])
def assumptions():
    """Lists the key assumptions the service operates under."""
    return {
        "title": "Operational Assumptions for APP_10_Evaluation_BenchmarkService",
        "assumptions": [
            {"id": "A01", "statement": "The Core SDK (database, auth, events) is available and functional."},
            {"id": "A02", "statement": "API keys for external model providers are correctly configured as environment variables or in a secrets manager."},
            {"id": "A03", "statement": "Hugging Face Hub and other dataset sources are network-accessible."},
            {"id": "A04", "statement": "The format of datasets (input/reference columns) matches the job request configuration."},
            {"id": "A05", "statement": "The `evaluate` library supports the requested metrics and their required input formats (predictions/references)."},
            {"id": "A06", "statement": "The underlying infrastructure has sufficient resources (CPU, memory, network) to run background jobs."},
            {"id": "A07", "statement": "The shared event bus is capable of handling completion notifications."},
        ]
    }

@app.get("/failure-modes", tags=["Agent"])
def failure_modes():
    """Describes potential failure modes and their impact."""
    return {
        "title": "Failure Modes for APP_10_Evaluation_BenchmarkService",
        "failure_modes": [
            {
                "mode": "External API Unavailability or Rate Limiting",
                "description": "An integrated model provider's API (e.g., OpenAI) is down, slow, or rate-limits requests.",
                "impact": "Benchmark jobs for that provider will fail or be severely delayed. Results will be incomplete.",
                "mitigation": "Implemented with per-prompt error handling, timeouts, and job-level failure status. Future work: automated retries with exponential backoff."
            },
            {
                "mode": "Invalid Dataset Configuration",
                "description": "A user provides an incorrect dataset path, split, or column names.",
                "impact": "The job will fail during the data loading phase.",
                "mitigation": "The job status is updated to FAILED with a descriptive error message. Pre-flight validation checks could be an enhancement."
            },
            {
                "mode": "Metric Computation Error",
                "description": "The `evaluate` library fails to compute a metric, often due to data format mismatches (e.g., list of lists vs. list of strings).",
                "impact": "The specific metric will be missing from the results, but the rest of the job may complete.",
                "mitigation": "Error is logged, and a placeholder score (-1.0) is used. The job is not failed entirely."
            },
            {
                "mode": "Background Worker Overload",
                "description": "Too many large benchmark jobs are submitted simultaneously, exhausting server resources.",
                "impact": "Service becomes unresponsive, new jobs may not start, and existing jobs may fail due to resource starvation.",
                "mitigation": "A `MAX_CONCURRENT_JOBS` setting can be implemented with a proper job queue (e.g., Celery, RQ) for more robust control. Currently relies on process/thread limits."
            }
        ]
    }

@app.get("/update-triggers", tags=["Agent"])
def update_triggers():
    """Defines conditions that should trigger a review or update of this service."""
    return {
        "title": "Update Triggers for APP_10_Evaluation_BenchmarkService",
        "triggers": [
            {"id": "T01", "condition": "A new major AI provider gains significant market share.", "action": "Implement a new ModelProviderAdapter for the provider."},
            {"id": "T02", "condition": "The `evaluate` or `datasets` library releases a new major version with breaking changes.", "action": "Update integration points and test compatibility."},
            {"id": "T03", "condition": "Monitoring shows a persistent high rate of job failures for a specific provider.", "action": "Investigate and update the corresponding adapter for API changes."},
            {"id": "T04", "condition": "A new, widely adopted evaluation metric or technique emerges.", "action": "Add support for the new metric to the `MetricType` ontology and implementation."},
            {"id": "T05", "condition": "The shared Core SDK auth or event protocol is updated.", "action": "Update dependencies and refactor code to align with the new protocol."},
        ]
    }


# --- Main Entry Point ---

if __name__ == "__main__":
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    uvicorn.run(app, host="0.0.0.0", port=8000)