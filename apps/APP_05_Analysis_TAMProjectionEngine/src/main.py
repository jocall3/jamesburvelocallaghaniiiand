#
# Copyright 2024 Autonomous Software Architect
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
#

import os
import uuid
import json
import asyncio
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Any, Optional, Union

import pandas as pd
from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks, status
from pydantic import BaseModel, Field, HttpUrl
from pydantic_settings import BaseSettings

# Databricks SDK for large-scale data processing
from databricks.sdk import WorkspaceClient
from databricks.sdk.service import sql

# --- Core SDK Imports ---
# These would be part of a shared library distributed to all applications
# For this file, we'll define placeholder interfaces to demonstrate integration.
from core_sdk.auth import get_current_user, User
from core_sdk.events import EventBus, Event
from core_sdk.logging import get_logger, StructuredLogger
from core_sdk.clients.ai_client_factory import AIClientFactory, AIClient, AIModelSpec
from core_sdk.config import CoreSettings
from core_sdk.observability import (
    instrument,
    log_unit_economics,
    UnitEconomics,
    MetricType,
)
from core_sdk.database import get_job_store, JobStore

# --- Application Configuration ---

class AppSettings(BaseSettings):
    """
    Configuration for the TAM Projection Engine.
    Separates configuration from execution logic for legal defensibility and operational flexibility.
    """
    APP_NAME: str = "APP_05_Analysis_TAMProjectionEngine"
    APP_VERSION: str = "0.1.0"
    DATABRICKS_HOST: HttpUrl
    DATABRICKS_TOKEN: str
    DATABRICKS_WAREHOUSE_ID: str
    DEFAULT_AI_PROVIDER_SCENARIO: str = "openai"
    DEFAULT_AI_MODEL_SCENARIO: str = "gpt-4-turbo"
    DEFAULT_AI_PROVIDER_VALIDATION: str = "anthropic"
    DEFAULT_AI_MODEL_VALIDATION: str = "claude-3-opus-20240229"
    JOB_TTL_SECONDS: int = 3600  # 1 hour
    MAX_PROJECTION_YEARS: int = 10
    
    # Feature flags for jurisdictional controls
    ENABLE_GEOPOLITICAL_SCENARIOS: bool = Field(
        default=False, description="Enable scenarios considering geopolitical factors."
    )
    ENABLE_REGULATORY_IMPACT_ANALYSIS: bool = Field(
        default=True, description="Enable analysis of potential regulatory changes."
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = AppSettings()
core_settings = CoreSettings()
logger: StructuredLogger = get_logger(settings.APP_NAME)

# --- Global Clients & Services Initialization ---

# Initialize Core SDK components
event_bus = EventBus(core_settings.event_bus_config)
job_store = get_job_store(core_settings.job_store_config)
ai_client_factory = AIClientFactory(core_settings.ai_client_config)

# Initialize Databricks Workspace Client
try:
    databricks_ws = WorkspaceClient(
        host=str(settings.DATABRICKS_HOST), token=settings.DATABRICKS_TOKEN
    )
    logger.info("Databricks WorkspaceClient initialized successfully.")
except Exception as e:
    logger.error("Failed to initialize Databricks WorkspaceClient", error=str(e))
    # This would typically be a fatal error on startup
    databricks_ws = None


# --- Service Layer: Encapsulating Business Logic ---

class DatabricksQueryService:
    """
    Service to interact with Databricks for fetching market data.
    Abstracts away the specifics of Databricks SQL execution.
    """

    def __init__(self, client: WorkspaceClient, warehouse_id: str):
        self.client = client
        self.warehouse_id = warehouse_id

    @instrument(service_name="databricks_query")
    async def fetch_market_data(
        self, market_segment: str, region: str, start_year: int, end_year: int
    ) -> pd.DataFrame:
        """
        Fetches historical market size data from a hypothetical 'market_data' table.
        """
        query = f"""
        SELECT year, region, market_segment, market_size_usd, growth_rate
        FROM gold.market_intelligence.historical_market_data
        WHERE market_segment = '{market_segment}'
          AND region = '{region}'
          AND year BETWEEN {start_year} AND {end_year}
        ORDER BY year;
        """
        return await self._execute_query(query, "fetch_market_data")

    @instrument(service_name="databricks_query")
    async def fetch_economic_indicators(
        self, region: str, start_year: int, end_year: int
    ) -> pd.DataFrame:
        """
        Fetches macroeconomic indicators relevant to the projection.
        """
        query = f"""
        SELECT year, region, gdp_growth_rate, inflation_rate, population_growth
        FROM gold.economic_data.global_indicators
        WHERE region = '{region}'
          AND year BETWEEN {start_year} AND {end_year}
        ORDER BY year;
        """
        return await self._execute_query(query, "fetch_economic_indicators")

    async def _execute_query(self, query_text: str, operation: str) -> pd.DataFrame:
        if not self.client:
            raise ConnectionError("Databricks client not initialized.")
        
        start_time = datetime.utcnow()
        try:
            statement = self.client.statement_execution.execute_statement(
                statement=query_text,
                warehouse_id=self.warehouse_id,
                wait_timeout=timedelta(minutes=5),
            )
            
            # Assuming successful execution, fetch results
            # In a real app, you'd handle various states (PENDING, RUNNING, etc.)
            # and potentially fetch results chunk by chunk.
            result = self.client.statement_execution.get_statement_result_chunk(
                statement_id=statement.statement_id,
                chunk_index=0
            )
            
            data = json.loads(result.data_array.to_json(orient='split'))
            df = pd.DataFrame(data['data'], columns=[c['name'] for c in data['schema']['fields']])
            
            duration = (datetime.utcnow() - start_time).total_seconds()
            log_unit_economics(
                UnitEconomics(
                    cost_driver="databricks_dpu",
                    amount=duration, # Simplified: cost is proportional to query time
                    metric_type=MetricType.COMPUTE_SECONDS,
                    vendor="databricks",
                    operation=operation,
                )
            )
            logger.info(
                "Databricks query executed successfully",
                extra={"query": query_text, "rows": len(df), "duration_s": duration},
            )
            return df
        except Exception as e:
            logger.error(
                "Databricks query failed",
                extra={"query": query_text, "error": str(e)},
            )
            raise


class ScenarioGenerationService:
    """
    Service for using Generative AI to create qualitative market scenarios.
    This service embodies the "Generative Speculation" side of the app's core tension.
    """

    def __init__(self, client_factory: AIClientFactory):
        self.client_factory = client_factory

    @instrument(service_name="generate_scenarios")
    async def generate_growth_scenarios(
        self,
        market_segment: str,
        region: str,
        projection_years: int,
        base_projection: pd.DataFrame,
        economic_data: pd.DataFrame,
    ) -> Dict[str, str]:
        """
        Generates optimistic, pessimistic, and baseline narrative scenarios.
        """
        client = self.client_factory.get_client(
            provider=settings.DEFAULT_AI_PROVIDER_SCENARIO,
            model_spec=AIModelSpec(model_id=settings.DEFAULT_AI_MODEL_SCENARIO),
        )

        base_projection_summary = base_projection.to_string()
        economic_data_summary = economic_data.to_string()

        prompt = self._construct_scenario_prompt(
            market_segment,
            region,
            projection_years,
            base_projection_summary,
            economic_data_summary,
        )

        try:
            response = await client.generate_text(
                prompt, max_tokens=2048, temperature=0.7
            )
            scenarios = self._parse_scenario_response(response)
            
            # Log token usage for unit economics
            # Assuming the client response includes token counts
            if response.usage:
                log_unit_economics(
                    UnitEconomics(
                        cost_driver="llm_tokens_prompt",
                        amount=response.usage.prompt_tokens,
                        metric_type=MetricType.TOKENS,
                        vendor=client.provider,
                        operation="generate_growth_scenarios",
                        model=client.model_id,
                    )
                )
                log_unit_economics(
                    UnitEconomics(
                        cost_driver="llm_tokens_completion",
                        amount=response.usage.completion_tokens,
                        metric_type=MetricType.TOKENS,
                        vendor=client.provider,
                        operation="generate_growth_scenarios",
                        model=client.model_id,
                    )
                )

            return scenarios
        except Exception as e:
            logger.error("Failed to generate scenarios from AI model", error=str(e))
            return {
                "error": "Scenario generation failed.",
                "optimistic": "N/A",
                "pessimistic": "N/A",
                "baseline": "N/A",
            }

    def _construct_scenario_prompt(self, market_segment, region, years, projection, econ_data):
        return f"""
        As an expert market analyst, your task is to generate three narrative scenarios for the future of the '{market_segment}' market in '{region}' over the next {years} years.

        You are provided with a quantitative baseline projection and historical economic data. Ground your narratives in this data, but extrapolate based on potential market dynamics.

        **Core Task:**
        For each scenario (Optimistic, Pessimistic, Baseline), provide a 2-3 paragraph narrative. Each narrative should explain the key drivers, potential events, and overall market trajectory.

        **Input Data:**

        1.  **Quantitative Baseline Projection (USD Billions):**
            ```
            {projection}
            ```

        2.  **Historical Economic Indicators:**
            ```
            {econ_data}
            ```

        **Scenario Guidelines:**

        *   **Baseline Scenario:** Describe a future that is a reasonable extrapolation of current trends. What are the most likely sustaining factors?
        *   **Optimistic Scenario:** What factors could lead to accelerated growth? Consider technological breakthroughs, favorable regulatory changes, new market adoption, or positive economic shifts.
        *   **Pessimistic Scenario:** What are the major headwinds or risks? Consider disruptive competition, economic downturns, regulatory hurdles, or shifts in consumer behavior.

        **Output Format:**
        Provide your response as a JSON object with three keys: "optimistic", "pessimistic", and "baseline". The value for each key should be the narrative string. Do not include any other text or explanation outside the JSON object.

        Example:
        {{
          "optimistic": "The market is poised for explosive growth...",
          "pessimistic": "Significant headwinds are expected as...",
          "baseline": "The market will likely continue its steady growth trajectory..."
        }}
        """

    def _parse_scenario_response(self, response_text: str) -> Dict[str, str]:
        try:
            # Clean up potential markdown code fences
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            
            data = json.loads(response_text)
            if all(k in data for k in ["optimistic", "pessimistic", "baseline"]):
                return data
            else:
                raise ValueError("Missing required keys in scenario response.")
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("Failed to parse AI scenario response as JSON", response=response_text, error=str(e))
            # Fallback: try to find keys in the text
            return {
                "optimistic": response_text,
                "pessimistic": "Could not parse pessimistic scenario.",
                "baseline": "Could not parse baseline scenario.",
            }


class TAMProjectionEngine:
    """
    Orchestrates the TAM projection process.
    This class embodies the core tension of the application:
    **Data-Driven Rigor vs. Generative Speculation**.
    It combines statistical forecasting (rigor) with AI-generated narratives (speculation).
    """

    def __init__(
        self,
        db_service: DatabricksQueryService,
        scenario_service: ScenarioGenerationService,
    ):
        self.db_service = db_service
        self.scenario_service = scenario_service

    @instrument(service_name="run_projection")
    async def run_projection(
        self,
        market_segment: str,
        region: str,
        projection_years: int,
        user_id: str,
        job_id: str,
    ) -> Dict[str, Any]:
        """
        Executes the full TAM projection pipeline.
        """
        logger.info(
            "Starting TAM projection job",
            extra={"job_id": job_id, "user_id": user_id, "params": locals()},
        )

        # 1. Data Fetching (Rigor)
        current_year = datetime.utcnow().year
        hist_start_year = current_year - 5
        
        # Use asyncio.gather to fetch data concurrently
        try:
            market_data_task = self.db_service.fetch_market_data(
                market_segment, region, hist_start_year, current_year - 1
            )
            economic_data_task = self.db_service.fetch_economic_indicators(
                region, hist_start_year, current_year - 1
            )
            hist_market_df, hist_econ_df = await asyncio.gather(
                market_data_task, economic_data_task
            )
        except Exception as e:
            logger.error("Data fetching from Databricks failed", job_id=job_id, error=str(e))
            raise ValueError(f"Failed to fetch base data for projection: {e}")

        if hist_market_df.empty:
            raise ValueError(f"No historical market data found for segment '{market_segment}' in region '{region}'.")

        # 2. Quantitative Modeling (Rigor)
        base_projection_df = self._calculate_baseline_projection(
            hist_market_df, projection_years
        )

        # 3. Qualitative Scenario Generation (Speculation)
        scenarios = await self.scenario_service.generate_growth_scenarios(
            market_segment,
            region,
            projection_years,
            base_projection_df,
            hist_econ_df,
        )

        # 4. Assemble and return the final result
        result = {
            "metadata": {
                "job_id": job_id,
                "created_at": datetime.utcnow().isoformat(),
                "market_segment": market_segment,
                "region": region,
                "projection_years": projection_years,
            },
            "quantitative_projection": {
                "baseline": json.loads(base_projection_df.to_json(orient="records")),
                "assumptions": "Projection based on Compound Annual Growth Rate (CAGR) of the last 5 years of historical data.",
            },
            "qualitative_scenarios": scenarios,
            "source_data_summary": {
                "historical_market_data": json.loads(hist_market_df.to_json(orient="records")),
                "historical_economic_indicators": json.loads(hist_econ_df.to_json(orient="records")),
            },
        }
        
        logger.info("TAM projection job completed successfully", job_id=job_id)
        return result

    def _calculate_baseline_projection(
        self, df: pd.DataFrame, projection_years: int
    ) -> pd.DataFrame:
        """
        A simple CAGR-based projection model.
        This is an extensibility hook: more complex models (e.g., regression, time series)
        could be plugged in here.
        """
        df_sorted = df.sort_values("year").reset_index()
        start_value = df_sorted.loc[0, "market_size_usd"]
        end_value = df_sorted.loc[len(df_sorted) - 1, "market_size_usd"]
        num_years = len(df_sorted) - 1

        if start_value <= 0 or end_value <= 0 or num_years <= 0:
            # Fallback to average growth rate if CAGR is not possible
            cagr = df_sorted["growth_rate"].mean()
        else:
            cagr = (end_value / start_value) ** (1 / num_years) - 1

        last_year = df_sorted.loc[len(df_sorted) - 1, "year"]
        last_market_size = end_value

        projection_data = []
        current_size = last_market_size
        for i in range(1, projection_years + 1):
            current_size *= 1 + cagr
            projection_data.append(
                {"year": last_year + i, "projected_market_size_usd": current_size, "assumed_growth_rate": cagr}
            )

        return pd.DataFrame(projection_data)


# --- API Data Models (Pydantic) ---

class ProjectionRequest(BaseModel):
    market_segment: str = Field(
        ...,
        description="The specific market segment to analyze (e.g., 'Cloud AI Developer Services').",
        max_length=100,
    )
    region: str = Field(
        ..., description="The geographical region (e.g., 'North America', 'EU', 'APAC').", max_length=50
    )
    projection_years: int = Field(
        5,
        gt=0,
        le=settings.MAX_PROJECTION_YEARS,
        description="The number of years into the future to project.",
    )

class JobCreationResponse(BaseModel):
    job_id: str
    status: str
    message: str
    links: Dict[str, str]

class JobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class JobResult(BaseModel):
    job_id: str
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    request: ProjectionRequest
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# --- FastAPI Application ---

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="An engine for projecting Total Addressable Market (TAM) by combining rigorous data analysis from Databricks with speculative, AI-generated narrative scenarios.",
)

# --- Dependency Injection Setup ---

def get_db_service() -> DatabricksQueryService:
    if not databricks_ws:
        raise HTTPException(status_code=503, detail="Databricks service is not available.")
    return DatabricksQueryService(
        client=databricks_ws, warehouse_id=settings.DATABRICKS_WAREHOUSE_ID
    )

def get_scenario_service() -> ScenarioGenerationService:
    return ScenarioGenerationService(client_factory=ai_client_factory)

def get_tam_engine(
    db_service: DatabricksQueryService = Depends(get_db_service),
    scenario_service: ScenarioGenerationService = Depends(get_scenario_service),
) -> TAMProjectionEngine:
    return TAMProjectionEngine(db_service, scenario_service)


# --- Background Task for Projections ---

async def run_projection_background(
    job_id: str,
    request_data: dict,
    user_id: str,
    engine: TAMProjectionEngine,
    job_store: JobStore,
):
    """The actual task that runs in the background."""
    await job_store.update(job_id, {"status": JobStatus.RUNNING, "updated_at": datetime.utcnow()})
    try:
        result = await engine.run_projection(
            market_segment=request_data["market_segment"],
            region=request_data["region"],
            projection_years=request_data["projection_years"],
            user_id=user_id,
            job_id=job_id,
        )
        await job_store.update(
            job_id,
            {
                "status": JobStatus.COMPLETED,
                "result": result,
                "updated_at": datetime.utcnow(),
            },
        )
        # Emit event on successful completion
        await event_bus.publish(
            "tam.projection.completed",
            Event(
                source=settings.APP_NAME,
                event_type="tam.projection.completed",
                payload={"job_id": job_id, "metadata": result.get("metadata")},
            ),
        )
    except Exception as e:
        error_message = f"Projection failed: {str(e)}"
        logger.error("Background projection task failed", job_id=job_id, error=error_message)
        await job_store.update(
            job_id,
            {
                "status": JobStatus.FAILED,
                "error": error_message,
                "updated_at": datetime.utcnow(),
            },
        )
        await event_bus.publish(
            "tam.projection.failed",
            Event(
                source=settings.APP_NAME,
                event_type="tam.projection.failed",
                payload={"job_id": job_id, "error": error_message},
            ),
        )


# --- API Endpoints ---

@app.post(
    "/v1/projections",
    response_model=JobCreationResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create a new TAM Projection Job",
)
async def create_projection(
    request: Request,
    projection_request: ProjectionRequest,
    background_tasks: BackgroundTasks,
    engine: TAMProjectionEngine = Depends(get_tam_engine),
    current_user: User = Depends(get_current_user),
):
    """
    Accepts a request to generate a TAM projection.

    This endpoint initiates an asynchronous job. It immediately returns a job ID
    which can be used to poll the status and retrieve the results from the
    `/v1/projections/{job_id}` endpoint.

    This design handles potentially long-running data queries and AI generation
    without blocking the client.
    """
    job_id = str(uuid.uuid4())
    
    # Audit log the request initiation
    await logger.audit(
        "PROJECTION_REQUESTED",
        user_id=current_user.id,
        details={
            "job_id": job_id,
            "market_segment": projection_request.market_segment,
            "region": projection_request.region,
        },
    )

    # Create initial job record in the job store
    initial_job_data = {
        "job_id": job_id,
        "status": JobStatus.PENDING,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "request": projection_request.model_dump(),
        "user_id": current_user.id,
    }
    await job_store.create(job_id, initial_job_data, ttl=settings.JOB_TTL_SECONDS)

    # Add the long-running task to the background
    background_tasks.add_task(
        run_projection_background,
        job_id,
        projection_request.model_dump(),
        current_user.id,
        engine,
        job_store,
    )

    return JobCreationResponse(
        job_id=job_id,
        status="PENDING",
        message="TAM projection job has been accepted and is running in the background.",
        links={"status": str(request.url_for("get_projection_status", job_id=job_id))},
    )


@app.get(
    "/v1/projections/{job_id}",
    response_model=JobResult,
    summary="Get TAM Projection Status and Results",
)
async def get_projection_status(job_id: str, current_user: User = Depends(get_current_user)):
    """
    Retrieves the status and, if completed, the results of a TAM projection job.

    Poll this endpoint with the `job_id` received from a POST request to `/v1/projections`.
    """
    job_data = await job_store.get(job_id)
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")

    # Basic authorization check
    if job_data.get("user_id") != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view this job")

    return JobResult(**job_data)


@app.get("/health", status_code=status.HTTP_200_OK, tags=["System"])
async def health_check():
    return {"status": "ok", "app_name": settings.APP_NAME, "version": settings.APP_VERSION}


# --- Self-Querying Agent Endpoints ---

@app.get("/introspect", tags=["Agent"])
def introspect():
    """Provides machine-readable metadata about the service's capabilities."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Generates Total Addressable Market (TAM) projections by blending quantitative data analysis with qualitative, AI-generated scenarios.",
        "capabilities": [
            "Fetch market and economic data from Databricks",
            "Calculate baseline quantitative projections (CAGR)",
            "Generate narrative scenarios (optimistic, pessimistic, baseline) using LLMs",
            "Asynchronous job processing for long-running tasks",
        ],
        "integrations": {
            "data_sources": ["Databricks SQL Warehouse"],
            "ai_providers": ai_client_factory.get_available_providers(),
        },
        "api_version": "v1",
        "endpoints": ["/v1/projections", "/v1/projections/{job_id}"],
    }


@app.get("/assumptions", tags=["Agent"])
def assumptions():
    """Lists the core assumptions the service operates on."""
    return {
        "data_quality": "Assumes the data in the source Databricks tables ('gold.market_intelligence', 'gold.economic_data') is accurate, clean, and up-to-date.",
        "model_validity": "The baseline quantitative model is a simple CAGR extrapolation. It assumes past growth trends are indicative of future performance, which may not hold true.",
        "ai_reasoning": "Assumes the configured LLMs can reason logically about economic and market data to produce plausible, coherent, and relevant narrative scenarios.",
        "api_stability": "Assumes the APIs for Databricks and the selected AI providers are stable and available.",
        "config_correctness": "Assumes that environment variables (e.g., Databricks host, warehouse ID, API keys) are correctly configured.",
    }


@app.get("/failure-modes", tags=["Agent"])
def failure_modes():
    """Describes potential failure modes of the service."""
    return {
        "data_ingestion_failure": {
            "description": "The service fails to connect to or query Databricks.",
            "cause": "Network issues, invalid credentials, Databricks service outage, or changes in table schemas.",
            "mitigation": "Connection retries with backoff, robust error handling, and monitoring alerts on query failures.",
        },
        "ai_generation_failure": {
            "description": "The LLM API call fails or returns unusable/malformed data.",
            "cause": "AI provider outage, API key issues, rate limiting, or the model producing non-JSON output.",
            "mitigation": "Retry mechanisms, fallback to a different model/provider, robust JSON parsing with error handling, and input/output validation.",
        },
        "invalid_projection_logic": {
            "description": "The quantitative model produces nonsensical results (e.g., negative market size).",
            "cause": "Edge cases in historical data (e.g., zero or negative starting values for CAGR), leading to mathematical errors.",
            "mitigation": "Input validation on historical data, fallback to simpler models (e.g., average growth rate), and sanity checks on outputs.",
        },
        "job_processing_error": {
            "description": "A background job fails silently.",
            "cause": "Unhandled exceptions in the background task, issues with the job store (e.g., Redis outage).",
            "mitigation": "Comprehensive exception logging within the background task, persistent job state updates, and monitoring for stale or failed jobs.",
        },
    }


@app.get("/update-triggers", tags=["Agent"])
def update_triggers():
    """Describes events that should trigger updates or re-evaluation of projections."""
    return {
        "data_update": {
            "trigger": "Publication of new annual or quarterly market data in the source Databricks tables.",
            "action": "Re-run relevant projections to incorporate the latest data points for improved accuracy.",
        },
        "economic_shift": {
            "trigger": "Major shifts in global or regional economic indicators (e.g., significant change in GDP forecasts, unexpected inflation).",
            "action": "Re-run projections for affected regions, as the underlying assumptions for scenarios have changed.",
        },
        "model_improvement": {
            "trigger": "A new, more sophisticated quantitative forecasting model is deployed within this service.",
            "action": "Offer users the option to re-run past projections using the new model.",
        },
        "ai_model_update": {
            "trigger": "A significantly more capable generative AI model becomes available (e.g., GPT-5, Claude 4).",
            "action": "Re-evaluate scenario generation quality and potentially re-run key projections to generate more nuanced narratives.",
        },
        "competitor_event": {
            "trigger": "External event notification (e.g., from APP_XX_Market_EventStream) about a major competitor's product launch, merger, or failure.",
            "action": "Trigger re-evaluation of projections in the affected market segments, as market dynamics have fundamentally changed.",
        },
    }


# --- Agent Metadata Block ---
# This is a machine-readable block for the ecosystem's self-querying agents.

agent_metadata = """
agent_metadata:
  purpose: "To provide Total Addressable Market (TAM) projections by synthesizing quantitative data from enterprise data warehouses (Databricks) with qualitative narrative scenarios from large language models (OpenAI, Anthropic). It serves as a strategic analysis tool for business planning and investment diligence."
  dependencies:
    - service: "core_sdk.auth.AuthenticationService"
    - service: "core_sdk.events.EventBus"
    - service: "core_sdk.database.JobStore"
    - external_platform: "Databricks (for historical market data)"
    - external_platform: "OpenAI API (for scenario generation)"
    - external_platform: "Anthropic API (for scenario generation/validation)"
  invalidation_conditions:
    - "Source data tables in Databricks are deprecated or schema is altered."
    - "Core economic assumptions become invalid due to a global economic event."
    - "Access to primary AI model providers is revoked or experiences prolonged outage."
  adjacent_apps:
    - app_id: "APP_01_Inference_CostRouter"
      relationship: "This app could be used to optimize which AI model is used for scenario generation based on cost and quality."
    - app_id: "APP_17_Data_SyntheticGenerator"
      relationship: "Could be used to generate synthetic market data for testing projection models in markets with sparse historical data."
    - app_id: "APP_37_Governance_AuditTrailEngine"
      relationship: "Consumes audit events from this app to build a comprehensive record of what projections were run, by whom, and based on what data."
    - app_id: "APP_58_Narrative_ModelExplainabilityUI"
      relationship: "Could consume the outputs of this app to provide a user-friendly interface for exploring the quantitative and qualitative aspects of the TAM projections."
"""

if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    # This is a placeholder for a real production server like Gunicorn + Uvicorn workers
    uvicorn.run(app, host="0.0.0.0", port=8000)