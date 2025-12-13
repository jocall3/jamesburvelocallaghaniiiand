# Copyright 2024 Unfolded Orbit, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
APP_02_Sourcing_EmergingTrendForecaster

This application provides a service for identifying and forecasting emerging trends from
real-time data streams. It consumes data from the shared ecosystem event bus, processes
it using a variety of forecasting models (from simple statistical methods to complex
transformer-based models), and exposes an API for querying trend probabilities, trajectories,
and confidence intervals.

The core architectural tension is Speed vs. Accuracy. The system maintains two parallel
forecasting tracks:
1.  A low-latency, "fast" track using computationally cheap models (e.g., Exponential
    Smoothing) for real-time signal detection.
2.  A high-fidelity, "accurate" track using powerful but slow models (e.g., Hugging Face
    Time Series Transformers) that run periodically to refine and validate trends.

This allows consumers to choose the appropriate trade-off for their use case, from
real-time alerting to deep strategic analysis.
"""

import os
import asyncio
import time
import uuid
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Union, Protocol, Tuple, Callable
from contextlib import asynccontextmanager
from enum import Enum
import logging

# Third-party imports
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Depends, Request, status
from pydantic import BaseModel, Field, validator
from pydantic_settings import BaseSettings

# AI/ML specific imports
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline, TimeSeriesTransformerForPrediction, TimeSeriesTransformerConfig
from statsmodels.tsa.api import ExponentialSmoothing, SimpleExpSmoothing, Holt
from sklearn.preprocessing import MinMaxScaler

# Core SDK components
# In a real setup, these would be in a separate, installable package
from core_sdk.config import get_settings, Settings
from core_sdk.auth import get_current_user, User
from core_sdk.logging import get_logger
from core_sdk.event_bus import EventBusClient, Event
from core_sdk.ontology import Ontology, TrendConcept, DataPoint
from core_sdk.exceptions import CoreException, ServiceException
from core_sdk.feature_flags import FeatureFlagClient

# --- Agent Metadata Block ---
# This block is machine-readable and used for self-discovery and orchestration.
agent_metadata = {
  "purpose": "To identify, track, and forecast emerging trends from high-velocity data streams, providing both real-time signals and deep analytical predictions.",
  "dependencies": {
    "internal": ["core_sdk", "APP_01_Data_IngestionGateway", "APP_03_Data_SyntheticGenerator"],
    "external_apis": ["Hugging Face Hub", "NVIDIA Triton (optional)", "Google Vertex AI (adapter placeholder)"],
    "data_formats": ["core_sdk.ontology.DataPoint", "core_sdk.event_bus.Event"],
    "protocols": ["HTTP/S", "AMQP or Kafka (via core_sdk.event_bus)"]
  },
  "invalidation_conditions": [
    "Significant concept drift in the incoming data stream.",
    "Underlying forecasting models become deprecated or outdated.",
    "Failure of the upstream event bus for an extended period.",
    "Radical change in the data schema defined by the core ontology."
  ],
  "adjacent_apps": [
    "APP_01_Data_IngestionGateway",
    "APP_04_Analytics_AnomalyDetector",
    "APP_15_Strategy_MarketOpportunityScanner"
  ]
}
# --- End Agent Metadata Block ---

# --- Configuration ---
class AppSettings(Settings):
    APP_NAME: str = "APP_02_Sourcing_EmergingTrendForecaster"
    DEFAULT_HF_MODEL: str = "huggingface/time-series-transformer-tourism-monthly"
    DEFAULT_DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"
    MAX_TRENDS_TO_TRACK: int = 1000
    MAX_TIMESERIES_LENGTH: int = 2048
    FAST_FORECAST_INTERVAL_SECONDS: int = 60
    ACCURATE_FORECAST_INTERVAL_SECONDS: int = 3600 # 1 hour
    EVENT_BUS_TOPIC_SUBSCRIPTION: str = "topic.data.normalized"
    JURISDICTIONAL_FLAG_ENABLE_SENSITIVE_TOPICS: str = "enable-sensitive-topic-forecasting"

settings = get_settings(AppSettings)
logger = get_logger(settings.APP_NAME)
feature_flags = FeatureFlagClient()

# --- Core Abstractions & Protocols ---

class Forecast(BaseModel):
    """Represents a single forecast result."""
    timestamp: datetime = Field(..., description="The time the forecast was generated.")
    model_name: str = Field(..., description="The name of the model that generated the forecast.")
    forecast_horizon: int = Field(..., description="Number of steps forecasted into the future.")
    values: List[float] = Field(..., description="The forecasted values.")
    confidence_upper: Optional[List[float]] = Field(None, description="Upper bound of the confidence interval.")
    confidence_lower: Optional[List[float]] = Field(None, description="Lower bound of the confidence interval.")
    execution_time_ms: float = Field(..., description="Time taken to generate the forecast in milliseconds.")
    is_fast_forecast: bool = Field(..., description="True if this is from the low-latency track.")

class ForecastingModel(Protocol):
    """A protocol defining the interface for all forecasting models."""
    
    def __init__(self, model_id: str, config: Dict[str, Any]):
        ...

    @property
    def model_id(self) -> str:
        ...

    def train(self, series: pd.Series) -> None:
        """Optional training step for stateful models."""
        ...

    def forecast(self, series: pd.Series, horizon: int) -> Tuple[np.ndarray, Optional[np.ndarray], Optional[np.ndarray]]:
        """
        Generates a forecast.
        Returns a tuple of (forecast_values, lower_bound, upper_bound).
        """
        ...

    def get_assumptions(self) -> List[str]:
        """Returns a list of assumptions the model makes."""
        ...

class ModelRegistry:
    """Manages the lifecycle and access to different forecasting models."""
    _models: Dict[str, ForecastingModel] = {}

    def register_model(self, model_instance: ForecastingModel):
        if model_instance.model_id in self._models:
            logger.warning(f"Model '{model_instance.model_id}' is being overwritten.")
        self._models[model_instance.model_id] = model_instance
        logger.info(f"Registered forecasting model: {model_instance.model_id}")

    def get_model(self, model_id: str) -> ForecastingModel:
        if model_id not in self._models:
            raise ValueError(f"Model '{model_id}' not found in registry.")
        return self._models[model_id]

    def list_models(self) -> List[str]:
        return list(self._models.keys())

# --- Model Implementations ---

class SimpleExponentialSmoothingModel(ForecastingModel):
    """A fast, baseline model using statsmodels."""
    def __init__(self, model_id: str = "ses_baseline", config: Dict[str, Any] = None):
        self._model_id = model_id
        self.config = config or {}
        self.smoothing_level = self.config.get("smoothing_level", 0.6)
        logger.info(f"Initialized SimpleExponentialSmoothingModel with smoothing_level={self.smoothing_level}")

    @property
    def model_id(self) -> str:
        return self._model_id

    def forecast(self, series: pd.Series, horizon: int) -> Tuple[np.ndarray, Optional[np.ndarray], Optional[np.ndarray]]:
        if len(series) < 2:
            return np.full(horizon, series.iloc[-1] if len(series) > 0 else 0), None, None
        
        fit = SimpleExpSmoothing(series, initialization_method="estimated").fit(
            smoothing_level=self.smoothing_level, optimized=False
        )
        forecast_values = fit.forecast(horizon)
        return forecast_values.values, None, None

    def get_assumptions(self) -> List[str]:
        return [
            "The time series has no trend or seasonal pattern.",
            "Errors are random, uncorrelated, and have a mean of zero.",
            "Recent observations are better predictors of the future than distant observations."
        ]

class HoltWintersModel(ForecastingModel):
    """A more advanced statistical model that handles trend and seasonality."""
    def __init__(self, model_id: str = "holt_winters_additive", config: Dict[str, Any] = None):
        self._model_id = model_id
        self.config = config or {}
        self.trend = self.config.get("trend", "add")
        self.seasonal = self.config.get("seasonal", "add")
        self.seasonal_periods = self.config.get("seasonal_periods", None)
        logger.info(f"Initialized HoltWintersModel with trend={self.trend}, seasonal={self.seasonal}, periods={self.seasonal_periods}")

    @property
    def model_id(self) -> str:
        return self._model_id

    def forecast(self, series: pd.Series, horizon: int) -> Tuple[np.ndarray, Optional[np.ndarray], Optional[np.ndarray]]:
        min_len = 2 * self.seasonal_periods if self.seasonal_periods else 10
        if len(series) < min_len:
            logger.warning(f"Time series for Holt-Winters is too short ({len(series)} < {min_len}). Falling back to mean.")
            return np.full(horizon, series.mean() if not series.empty else 0), None, None

        try:
            fit = ExponentialSmoothing(
                series,
                trend=self.trend,
                seasonal=self.seasonal,
                seasonal_periods=self.seasonal_periods,
                initialization_method="estimated"
            ).fit()
            forecast_values = fit.forecast(horizon)
            # Note: statsmodels forecast does not easily provide confidence intervals here.
            return forecast_values.values, None, None
        except Exception as e:
            logger.error(f"Holt-Winters model failed: {e}. Falling back to mean.")
            return np.full(horizon, series.mean() if not series.empty else 0), None, None

    def get_assumptions(self) -> List[str]:
        return [
            "The time series can be decomposed into level, trend, and seasonal components.",
            f"The trend component is {self.trend}itive.",
            f"The seasonal component is {self.seasonal}itive and has a period of {self.seasonal_periods}.",
            "Model parameters and components are relatively stable over time."
        ]

class HuggingFaceTransformerModel(ForecastingModel):
    """
    An accurate, but computationally expensive model using Hugging Face Time Series Transformers.
    This demonstrates integration with a major AI provider (Hugging Face).
    """
    def __init__(self, model_id: str, config: Dict[str, Any] = None):
        self._model_id = model_id
        self.config = config or {}
        self.hf_model_name = self.config.get("hf_model_name", settings.DEFAULT_HF_MODEL)
        self.device = self.config.get("device", settings.DEFAULT_DEVICE)
        self.prediction_length = self.config.get("prediction_length", 24)
        self.context_length = self.config.get("context_length", 128)
        
        logger.info(f"Initializing HuggingFaceTransformerModel '{self.hf_model_name}' on device '{self.device}'")
        try:
            self.model = TimeSeriesTransformerForPrediction.from_pretrained(self.hf_model_name).to(self.device)
            self.tokenizer = AutoTokenizer.from_pretrained(self.hf_model_name) # Not always used for TS, but good practice
        except Exception as e:
            logger.error(f"Failed to load Hugging Face model '{self.hf_model_name}': {e}")
            raise ServiceException(f"Could not initialize Hugging Face model: {e}")
        
        self.scaler = MinMaxScaler()

    @property
    def model_id(self) -> str:
        return self._model_id

    def forecast(self, series: pd.Series, horizon: int) -> Tuple[np.ndarray, Optional[np.ndarray], Optional[np.ndarray]]:
        if len(series) < self.context_length:
            logger.warning(f"Time series for HF Transformer is too short ({len(series)} < {self.context_length}). Cannot forecast.")
            return np.array([]), None, None

        # Prepare data for the model
        past_values = series.tail(self.context_length).values.astype(np.float32)
        
        # Scaling is crucial for neural networks
        scaled_values = self.scaler.fit_transform(past_values.reshape(-1, 1)).flatten()

        inputs = torch.tensor(scaled_values, dtype=torch.float32).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model.generate(
                past_values=inputs,
                prediction_length=min(horizon, self.prediction_length),
                num_return_sequences=1,
                # Add other generation config as needed
            )
        
        # Process output
        forecast_sequence = outputs[0].cpu().numpy().flatten()
        
        # Inverse transform to get back to original scale
        unscaled_forecast = self.scaler.inverse_transform(forecast_sequence.reshape(-1, 1)).flatten()

        # For simplicity, we are not generating confidence intervals here, but it's possible
        # with techniques like Monte Carlo dropout or quantile regression heads.
        return unscaled_forecast, None, None

    def get_assumptions(self) -> List[str]:
        return [
            "The underlying patterns in the time series are learnable by a transformer architecture.",
            "The time series is stationary or has been made stationary through differencing/scaling.",
            "The provided context length is sufficient to capture relevant historical patterns.",
            "The pre-trained model is suitable for the domain of the input data."
        ]

class CloudVendorForecasterAdapter(ForecastingModel):
    """
    Placeholder adapter for a cloud-based forecasting service like Amazon Forecast or Google Vertex AI.
    This demonstrates extensibility and abstraction over external AI vendors.
    """
    def __init__(self, model_id: str, config: Dict[str, Any]):
        self._model_id = model_id
        self.config = config
        self.vendor = self.config.get("vendor", "aws_forecast") # or "gcp_vertex_ai"
        self.api_key = os.getenv(f"{self.vendor.upper()}_API_KEY")
        self.predictor_arn = self.config.get("predictor_arn")
        
        if not self.api_key or not self.predictor_arn:
            raise ValueError(f"API key and predictor ARN must be configured for {self.vendor}")
        
        logger.info(f"Initialized CloudVendorForecasterAdapter for vendor: {self.vendor}")
        # Here you would initialize the vendor's SDK client, e.g., boto3.client('forecastquery')

    @property
    def model_id(self) -> str:
        return self._model_id

    def forecast(self, series: pd.Series, horizon: int) -> Tuple[np.ndarray, Optional[np.ndarray], Optional[np.ndarray]]:
        logger.info(f"Making a simulated API call to {self.vendor} for forecasting.")
        # In a real implementation:
        # 1. Format the series data into the vendor's required format.
        # 2. Make an API call to the forecast endpoint using the vendor's SDK.
        # 3. Parse the response to extract forecast values and confidence intervals.
        # 4. Handle API errors, rate limiting, etc.
        
        # Simulate API call latency
        time.sleep(random.uniform(0.5, 2.0))
        
        # Simulate a plausible response
        last_value = series.iloc[-1]
        simulated_trend = np.linspace(0, horizon * 0.05, horizon)
        simulated_noise = np.random.normal(0, last_value * 0.1, horizon)
        forecast_values = last_value + simulated_trend + simulated_noise
        
        # Simulate confidence intervals
        confidence_margin = last_value * 0.2
        lower_bound = forecast_values - confidence_margin
        upper_bound = forecast_values + confidence_margin
        
        return forecast_values, lower_bound, upper_bound

    def get_assumptions(self) -> List[str]:
        return [
            f"The user has a correctly configured and trained predictor endpoint at '{self.predictor_arn}'.",
            "The data format of the input series matches the schema expected by the cloud model.",
            "Network connectivity to the cloud vendor's API is stable.",
            "The provided API credentials have the necessary permissions."
        ]


# --- Trend State Management ---

class Trend:
    """Represents a single trend being tracked by the system."""
    def __init__(self, trend_id: str, concept: TrendConcept):
        self.trend_id = trend_id
        self.concept = concept
        self.data = pd.Series(dtype=np.float64, name="value")
        self.timestamps = pd.Series(dtype='datetime64[ns]', name="timestamp")
        self.last_fast_forecast: Optional[Forecast] = None
        self.last_accurate_forecast: Optional[Forecast] = None
        self.created_at = datetime.now(timezone.utc)
        self.last_updated_at = self.created_at
        self.metadata: Dict[str, Any] = {"sources": set()}

    def add_data_point(self, point: DataPoint):
        new_timestamp = pd.to_datetime(point.timestamp)
        # Avoid duplicate timestamps
        if new_timestamp in self.timestamps.values:
            return

        self.data = pd.concat([self.data, pd.Series([point.value])], ignore_index=True)
        self.timestamps = pd.concat([self.timestamps, pd.Series([new_timestamp])], ignore_index=True)
        
        # Sort by timestamp to maintain order
        sort_indices = self.timestamps.argsort()
        self.data = self.data.iloc[sort_indices].reset_index(drop=True)
        self.timestamps = self.timestamps.iloc[sort_indices].reset_index(drop=True)

        # Enforce max length
        if len(self.data) > settings.MAX_TIMESERIES_LENGTH:
            self.data = self.data.tail(settings.MAX_TIMESERIES_LENGTH).reset_index(drop=True)
            self.timestamps = self.timestamps.tail(settings.MAX_TIMESERIES_LENGTH).reset_index(drop=True)

        self.last_updated_at = datetime.now(timezone.utc)
        if point.source:
            self.metadata["sources"].add(point.source)

    def get_time_series(self) -> pd.Series:
        if self.data.empty:
            return pd.Series([], dtype=np.float64)
        ts = self.data.copy()
        ts.index = self.timestamps
        return ts

class TrendManager:
    """Manages the lifecycle of all tracked trends."""
    def __init__(self, model_registry: ModelRegistry):
        self._trends: Dict[str, Trend] = {}
        self._lock = asyncio.Lock()
        self.model_registry = model_registry

    async def get_or_create_trend(self, concept: TrendConcept) -> Trend:
        async with self._lock:
            # A simple way to create a consistent ID from the concept
            trend_id = f"trend_{hash(frozenset(concept.keywords))}"
            if trend_id not in self._trends:
                if len(self._trends) >= settings.MAX_TRENDS_TO_TRACK:
                    # Eviction strategy: remove the least recently updated trend
                    lru_trend_id = min(self._trends, key=lambda k: self._trends[k].last_updated_at)
                    del self._trends[lru_trend_id]
                    logger.info(f"Evicted trend '{lru_trend_id}' due to capacity limit.")
                
                logger.info(f"Creating new trend '{trend_id}' for concept: {concept.name}")
                self._trends[trend_id] = Trend(trend_id=trend_id, concept=concept)
            return self._trends[trend_id]

    async def add_data_point(self, point: DataPoint):
        if not point.associated_concepts:
            return
        
        for concept in point.associated_concepts:
            if isinstance(concept, TrendConcept):
                trend = await self.get_or_create_trend(concept)
                trend.add_data_point(point)

    async def get_trend(self, trend_id: str) -> Optional[Trend]:
        async with self._lock:
            return self._trends.get(trend_id)

    async def list_trends(self) -> List[Dict[str, Any]]:
        async with self._lock:
            trend_list = []
            for trend_id, trend in self._trends.items():
                trend_list.append({
                    "trend_id": trend.trend_id,
                    "concept_name": trend.concept.name,
                    "keywords": trend.concept.keywords,
                    "data_points": len(trend.data),
                    "last_updated_at": trend.last_updated_at,
                    "created_at": trend.created_at,
                })
            return trend_list

    async def run_forecast(self, trend_id: str, model_id: str, horizon: int, is_fast: bool) -> Forecast:
        trend = await self.get_trend(trend_id)
        if not trend:
            raise ValueError(f"Trend '{trend_id}' not found.")

        model = self.model_registry.get_model(model_id)
        series = trend.get_time_series()

        if series.empty:
            raise ValueError(f"Trend '{trend_id}' has no data to forecast.")

        start_time = time.perf_counter()
        values, lower, upper = model.forecast(series, horizon)
        end_time = time.perf_counter()

        forecast = Forecast(
            timestamp=datetime.now(timezone.utc),
            model_name=model_id,
            forecast_horizon=horizon,
            values=values.tolist(),
            confidence_lower=lower.tolist() if lower is not None else None,
            confidence_upper=upper.tolist() if upper is not None else None,
            execution_time_ms=(end_time - start_time) * 1000,
            is_fast_forecast=is_fast
        )

        async with self._lock:
            # This ensures the trend object is updated safely
            trend_to_update = self._trends.get(trend_id)
            if trend_to_update:
                if is_fast:
                    trend_to_update.last_fast_forecast = forecast
                else:
                    trend_to_update.last_accurate_forecast = forecast
        
        return forecast

# --- Global State ---
# In a real production app, this state would be externalized (e.g., Redis, DB)
# For this self-contained example, we manage it in memory.
model_registry = ModelRegistry()
trend_manager = TrendManager(model_registry)
event_bus_client: Optional[EventBusClient] = None

# --- Background Tasks ---

async def event_bus_consumer():
    """Consumes data points from the event bus and updates trends."""
    global event_bus_client
    if not event_bus_client:
        logger.error("Event bus client not initialized. Consumer cannot start.")
        return

    logger.info(f"Starting event bus consumer, subscribing to '{settings.EVENT_BUS_TOPIC_SUBSCRIPTION}'")
    try:
        await event_bus_client.connect()
        async for event in event_bus_client.subscribe(settings.EVENT_BUS_TOPIC_SUBSCRIPTION):
            try:
                # Using the shared ontology to parse the event payload
                data_point = Ontology.parse_event_payload(event, DataPoint)
                if data_point:
                    await trend_manager.add_data_point(data_point)
                    logger.debug(f"Processed data point for concepts: {[c.name for c in data_point.associated_concepts]}")
            except Exception as e:
                logger.error(f"Failed to process event {event.id}: {e}", exc_info=True)
    except asyncio.CancelledError:
        logger.info("Event bus consumer task cancelled.")
    except Exception as e:
        logger.critical(f"Event bus consumer crashed: {e}", exc_info=True)
    finally:
        if event_bus_client:
            await event_bus_client.disconnect()
        logger.info("Event bus consumer stopped.")

async def periodic_forecaster(interval: int, model_id: str, horizon: int, is_fast: bool):
    """Periodically runs forecasts for all active trends."""
    logger.info(f"Starting periodic forecaster for model '{model_id}' with interval {interval}s")
    while True:
        await asyncio.sleep(interval)
        logger.info(f"Running periodic forecast cycle for model '{model_id}'...")
        try:
            trends = await trend_manager.list_trends()
            for trend_info in trends:
                trend_id = trend_info["trend_id"]
                try:
                    await trend_manager.run_forecast(trend_id, model_id, horizon, is_fast)
                    logger.debug(f"Successfully ran {'fast' if is_fast else 'accurate'} forecast for trend '{trend_id}'")
                except Exception as e:
                    logger.error(f"Failed to run periodic forecast for trend '{trend_id}': {e}")
        except Exception as e:
            logger.error(f"Error in periodic forecaster main loop for model '{model_id}': {e}", exc_info=True)


# --- FastAPI Application ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles application startup and shutdown events."""
    global event_bus_client
    logger.info("Application startup...")

    # 1. Initialize models
    model_registry.register_model(SimpleExponentialSmoothingModel())
    model_registry.register_model(HoltWintersModel(config={"seasonal_periods": 24})) # Assume hourly data with daily seasonality
    try:
        model_registry.register_model(HuggingFaceTransformerModel(model_id="hf_transformer_accurate"))
    except Exception as e:
        logger.warning(f"Could not initialize HuggingFaceTransformerModel: {e}. Accurate forecasts will be disabled.")
    
    # Example of registering a cloud adapter if configured
    if os.getenv("AWS_FORECAST_API_KEY") and os.getenv("AWS_FORECAST_PREDICTOR_ARN"):
        try:
            model_registry.register_model(CloudVendorForecasterAdapter(
                model_id="aws_forecast_adapter",
                config={
                    "vendor": "aws_forecast",
                    "predictor_arn": os.getenv("AWS_FORECAST_PREDICTOR_ARN")
                }
            ))
        except Exception as e:
            logger.warning(f"Could not initialize AWS Forecast adapter: {e}")

    # 2. Initialize Event Bus Client
    event_bus_client = EventBusClient()

    # 3. Start background tasks
    app.state.event_consumer_task = asyncio.create_task(event_bus_consumer())
    app.state.fast_forecaster_task = asyncio.create_task(
        periodic_forecaster(
            interval=settings.FAST_FORECAST_INTERVAL_SECONDS,
            model_id="ses_baseline",
            horizon=12, # Forecast 12 steps ahead
            is_fast=True
        )
    )
    if "hf_transformer_accurate" in model_registry.list_models():
        app.state.accurate_forecaster_task = asyncio.create_task(
            periodic_forecaster(
                interval=settings.ACCURATE_FORECAST_INTERVAL_SECONDS,
                model_id="hf_transformer_accurate",
                horizon=48, # Forecast 48 steps ahead
                is_fast=False
            )
        )

    yield

    # --- Shutdown logic ---
    logger.info("Application shutdown...")
    app.state.event_consumer_task.cancel()
    app.state.fast_forecaster_task.cancel()
    if hasattr(app.state, 'accurate_forecaster_task'):
        app.state.accurate_forecaster_task.cancel()
    
    await asyncio.gather(
        app.state.event_consumer_task,
        app.state.fast_forecaster_task,
        getattr(app.state, 'accurate_forecaster_task', asyncio.sleep(0)),
        return_exceptions=True
    )
    logger.info("Background tasks stopped.")


app = FastAPI(
    title=settings.APP_NAME,
    description=agent_metadata["purpose"],
    version="1.0.0",
    lifespan=lifespan
)

# --- API Models ---

class TrendInfo(BaseModel):
    trend_id: str
    concept_name: str
    keywords: List[str]
    data_points: int
    last_updated_at: datetime
    created_at: datetime

class TrendDetail(TrendInfo):
    metadata: Dict[str, Any]
    fast_forecast: Optional[Forecast] = None
    accurate_forecast: Optional[Forecast] = None
    time_series_sample: List[Tuple[datetime, float]] = Field(..., description="A sample of the most recent time series data.")

class ForecastRequest(BaseModel):
    trend_id: str
    model_id: str = Field(..., description="The ID of the model to use for forecasting.")
    horizon: int = Field(12, gt=0, le=100, description="The number of future steps to forecast.")

# --- API Endpoints ---

@app.get("/", tags=["General"])
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}"}

@app.get("/trends", response_model=List[TrendInfo], tags=["Trends"])
async def get_all_trends(current_user: User = Depends(get_current_user)):
    """
    Lists all currently tracked trends.
    """
    trends = await trend_manager.list_trends()
    return trends

@app.get("/trends/{trend_id}", response_model=TrendDetail, tags=["Trends"])
async def get_trend_details(trend_id: str, current_user: User = Depends(get_current_user)):
    """
    Retrieves detailed information about a specific trend, including its latest forecasts.
    """
    trend = await trend_manager.get_trend(trend_id)
    if not trend:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trend not found")

    # Sanitize metadata for response
    sanitized_metadata = trend.metadata.copy()
    sanitized_metadata["sources"] = list(sanitized_metadata["sources"])

    # Get a sample of the time series data
    ts = trend.get_time_series().tail(50)
    ts_sample = list(zip(ts.index.to_pydatetime(), ts.values))

    return TrendDetail(
        trend_id=trend.trend_id,
        concept_name=trend.concept.name,
        keywords=trend.concept.keywords,
        data_points=len(trend.data),
        last_updated_at=trend.last_updated_at,
        created_at=trend.created_at,
        metadata=sanitized_metadata,
        fast_forecast=trend.last_fast_forecast,
        accurate_forecast=trend.last_accurate_forecast,
        time_series_sample=ts_sample
    )

@app.post("/forecast", response_model=Forecast, tags=["Forecasting"])
async def run_on_demand_forecast(request: ForecastRequest, current_user: User = Depends(get_current_user)):
    """
    Runs an on-demand forecast for a specific trend using a chosen model.
    This is a potentially expensive operation and may be rate-limited.
    """
    try:
        # Note: is_fast is False for on-demand, as it's an explicit, likely analytical query.
        forecast_result = await trend_manager.run_forecast(
            request.trend_id, request.model_id, request.horizon, is_fast=False
        )
        return forecast_result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"On-demand forecast failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An internal error occurred during forecasting.")

@app.get("/models", response_model=List[str], tags=["Forecasting"])
async def list_available_models(current_user: User = Depends(get_current_user)):
    """
    Lists the IDs of all available forecasting models in the registry.
    """
    return model_registry.list_models()

# --- Self-Querying Agent Endpoints ---

@app.get("/introspect", tags=["Agent"])
async def introspect():
    """Provides machine-readable metadata about the agent's purpose and capabilities."""
    return {
        "agent_name": settings.APP_NAME,
        "metadata": agent_metadata,
        "active_configuration": {
            "log_level": settings.LOG_LEVEL,
            "max_trends": settings.MAX_TRENDS_TO_TRACK,
            "max_timeseries_length": settings.MAX_TIMESERIES_LENGTH,
            "fast_forecast_interval_s": settings.FAST_FORECAST_INTERVAL_SECONDS,
            "accurate_forecast_interval_s": settings.ACCURATE_FORECAST_INTERVAL_SECONDS,
            "event_bus_subscription": settings.EVENT_BUS_TOPIC_SUBSCRIPTION,
        },
        "runtime_status": {
            "tracked_trends_count": len(await trend_manager.list_trends()),
            "available_models": model_registry.list_models(),
            "background_tasks_healthy": {
                "event_consumer": not app.state.event_consumer_task.done() if hasattr(app.state, 'event_consumer_task') else False,
                "fast_forecaster": not app.state.fast_forecaster_task.done() if hasattr(app.state, 'fast_forecaster_task') else False,
                "accurate_forecaster": not getattr(app.state, 'accurate_forecaster_task', type('obj', (object,), {'done': lambda: True})()).done()
            }
        }
    }

@app.get("/assumptions", tags=["Agent"])
async def assumptions():
    """Lists the underlying assumptions of the service and its models."""
    model_assumptions = {}
    for model_id in model_registry.list_models():
        model = model_registry.get_model(model_id)
        model_assumptions[model_id] = model.get_assumptions()

    return {
        "service_assumptions": [
            "The event bus provides data points in a timely manner.",
            "The data schema conforms to the core_sdk.ontology.DataPoint structure.",
            "The concept of a 'trend' can be meaningfully represented by a univariate time series.",
            "Periodic forecasting is sufficient for maintaining up-to-date trend insights.",
            "In-memory state is acceptable for the service's required uptime and data persistence needs."
        ],
        "model_assumptions": model_assumptions
    }

@app.get("/failure-modes", tags=["Agent"])
async def failure_modes():
    """Describes potential failure modes and their impact."""
    return {
        "data_pipeline_failure": {
            "description": "The upstream event bus or data ingestion gateway fails, stopping the flow of new data.",
            "impact": "Trends become stale. Forecasts will be based on outdated information. No new trends can be detected.",
            "mitigation": "Health checks on the event bus connection. Alerting on lack of new data for a configured period. Service continues to serve forecasts on existing data."
        },
        "model_failure": {
            "description": "A specific forecasting model (e.g., Hugging Face) fails to load or execute.",
            "impact": "The corresponding forecast track (e.g., 'accurate') will be unavailable. API calls requesting that model will fail.",
            "mitigation": "Graceful degradation. The service continues to operate with other available models. Health checks on model endpoints/libraries. Automatic fallback to simpler models."
        },
        "concept_drift": {
            "description": "The statistical properties of the incoming data change significantly over time, making trained models inaccurate.",
            "impact": "Forecast accuracy degrades silently, potentially leading to misleading predictions.",
            "mitigation": "Requires an adjacent model monitoring service (e.g., APP_04_Analytics_AnomalyDetector) to detect drift. Hooks for triggering model retraining or switching models."
        },
        "state_overload": {
            "description": "The number of unique trends exceeds the configured limit, leading to eviction of older trends.",
            "impact": "Loss of historical data for less active trends. Potential for thrashing if many trends have similar activity levels.",
            "mitigation": "Configurable trend limit and eviction policy. Metrics on trend churn. For enterprise scale, requires externalizing state to a scalable database (e.g., Redis, Cassandra)."
        }
    }

@app.get("/update-triggers", tags=["Agent"])
async def update_triggers():
    """Describes conditions that should trigger a review or update of this application."""
    return {
        "code_updates": [
            "A new major version of a core dependency is released (e.g., FastAPI, PyTorch, Transformers).",
            "The core_sdk.ontology for DataPoint or TrendConcept is updated with breaking changes.",
            "Performance metrics indicate that a forecasting model is consistently too slow or inaccurate."
        ],
        "operational_updates": [
            "Persistent alerts about concept drift from a monitoring service.",
            "A change in the event bus protocol or topic structure.",
            "Introduction of a new, superior forecasting model or AI vendor API that should be integrated.",
            "Change in legal or compliance requirements regarding data sourcing or analysis in a target jurisdiction."
        ]
    }

if __name__ == "__main__":
    import uvicorn
    # This is for local development. In production, a Gunicorn/Uvicorn process manager would be used.
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")