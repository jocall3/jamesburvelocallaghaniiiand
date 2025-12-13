# Copyright 2024, Ecosystem AI. All rights reserved.
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

"""
APP_12_Data_NewsSentimentProcessor

Main service entry point for consuming news feeds, orchestrating multi-vendor
sentiment analysis, and publishing enriched data to the ecosystem event bus.

This application embodies the tension between Cost and Nuance in data processing.
It uses a tiered analysis approach: a fast, low-cost model provides an initial
sentiment triage, while a more powerful, expensive model is selectively invoked
for high-value or ambiguous articles, governed by a configurable policy engine.
"""

import os
import asyncio
import logging
import time
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Literal, Union
from abc import ABC, abstractmethod
from uuid import uuid4

import uvicorn
import feedparser
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel, Field, HttpUrl, field_validator
from pydantic_settings import BaseSettings

# Assume a shared core SDK is available in the execution environment
# In a real monorepo, this would be a direct import.
try:
    from core_sdk.logging import get_logger
    from core_sdk.config import get_service_config
    from core_sdk.auth import EgressAuthProvider
    from core_sdk.events import EventPublisher, Event
    from core_sdk.ontology.data import NewsArticle, SentimentScore, Entity, EnrichedDataEvent
    from core_sdk.metrics import instrument, count_event, gauge_metric, time_execution
    from core_sdk.feature_flags import FeatureFlagClient
except ImportError:
    # Mock SDK for standalone execution
    print("WARNING: core_sdk not found. Using mock implementation.")
    from stubs.core_sdk_mock import (
        get_logger, get_service_config, EgressAuthProvider,
        EventPublisher, Event, NewsArticle, SentimentScore, Entity,
        EnrichedDataEvent, instrument, count_event, gauge_metric, time_execution,
        FeatureFlagClient
    )


# --- Agent Metadata ---
AGENT_METADATA = {
    "agent_metadata": {
        "purpose": "To ingest news articles from various sources, perform multi-tiered sentiment and entity analysis using different AI providers, and publish enriched data for downstream consumption. It balances cost against analytical depth.",
        "dependencies": {
            "internal": ["APP_01_Inference_CostRouter", "APP_03_Auth_IdentityService", "core_sdk"],
            "external": ["OpenAI API", "Google Cloud Natural Language API", "News RSS/Atom Feeds"],
            "data": ["Configured news feed URLs", "Routing policies"]
        },
        "invalidation_conditions": [
            "Major breaking news event causing sentiment analysis models to become unreliable.",
            "Significant change in the API contract of a primary AI vendor.",
            "Deprecation of a configured news feed source.",
            "Change in global compliance regulations regarding data processing from certain jurisdictions."
        ],
        "adjacent_apps": [
            "APP_25_Analytics_TrendDetector",
            "APP_37_Governance_AuditTrailEngine",
            "APP_41_Data_MarketSignalGenerator"
        ]
    }
}

# --- Configuration ---

class ProviderConfig(BaseModel):
    api_key: str = Field(..., min_length=1)
    model: str

class RoutingPolicy(BaseModel):
    tier1_provider: str = "google_nlp_fast"
    tier2_provider: str = "openai_nuanced"
    tier2_trigger_threshold: float = Field(0.2, ge=0, le=1, description="Absolute sentiment score below which to trigger Tier 2 analysis.")
    high_priority_sources: List[str] = Field(default_factory=list, description="Substrings of feed URLs to always send to Tier 2.")
    jurisdiction_blocklist: List[str] = Field(default_factory=list, description="ISO 3166-1 alpha-2 country codes to block processing for.")

class FeedConfig(BaseModel):
    url: HttpUrl
    poll_interval_seconds: int = 300

class AppSettings(BaseSettings):
    app_name: str = "APP_12_Data_NewsSentimentProcessor"
    log_level: str = "INFO"
    port: int = 8012
    openai_api_key: Optional[str] = None
    google_application_credentials: Optional[str] = None # Path to JSON key file
    event_bus_topic: str = "ecosystem.data.news.enriched.v1"
    feeds: List[FeedConfig] = [
        FeedConfig(url="http://feeds.bbci.co.uk/news/rss.xml"),
        FeedConfig(url="http://rss.cnn.com/rss/cnn_topstories.rss"),
    ]
    routing_policy: RoutingPolicy = RoutingPolicy()
    max_articles_in_memory: int = 10000

    class Config:
        env_nested_delimiter = '__'

settings = AppSettings()
logger = get_logger(settings.app_name, level=settings.log_level)

# --- Core Components ---

event_publisher = EventPublisher()
feature_flags = FeatureFlagClient()
auth_provider = EgressAuthProvider()

# --- Data Models ---

class AnalysisResult(BaseModel):
    provider: str
    model: str
    sentiment: SentimentScore
    entities: List[Entity]
    cost: float # In USD
    latency_ms: float
    raw_response: Dict[str, Any]

class EnrichedArticle(NewsArticle):
    processing_id: str = Field(default_factory=lambda: str(uuid4()))
    analysis_tier: Literal[1, 2]
    tier1_analysis: AnalysisResult
    tier2_analysis: Optional[AnalysisResult] = None
    processing_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    policy_applied: RoutingPolicy

# --- Sentiment Provider Adapters ---

class BaseSentimentProvider(ABC):
    def __init__(self, provider_name: str, model_name: str):
        self.provider_name = provider_name
        self.model_name = model_name
        self.http_client = httpx.AsyncClient(timeout=30.0)

    @abstractmethod
    async def analyze(self, text: str, article_url: str) -> AnalysisResult:
        pass

    def _get_auth_header(self) -> Dict[str, str]:
        # In a real system, this would fetch a scoped token
        token = auth_provider.get_token(f"vendor:{self.provider_name}")
        return {"Authorization": f"Bearer {token}"}

class OpenAISentimentProvider(BaseSentimentProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        super().__init__("openai", model)
        self.api_key = api_key
        self.api_url = "https://api.openai.com/v1/chat/completions"

    @time_execution(service=settings.app_name, component="openai_provider")
    async def analyze(self, text: str, article_url: str) -> AnalysisResult:
        start_time = time.monotonic()
        prompt = f"""
        Analyze the sentiment of the following news article text.
        Provide your analysis in a structured JSON format.
        The sentiment score must be a float between -1.0 (extremely negative) and 1.0 (extremely positive).
        Identify up to 5 key entities mentioned, classifying them as PERSON, ORG, GPE (Geo-Political Entity), or PRODUCT.
        
        JSON format:
        {{
          "sentiment_score": float,
          "sentiment_label": "positive" | "negative" | "neutral",
          "reasoning": "A brief explanation for the sentiment score.",
          "entities": [
            {{"name": "string", "type": "PERSON" | "ORG" | "GPE" | "PRODUCT", "salience": float}}
          ]
        }}

        Article Text:
        ---
        {text[:4000]}
        ---
        """
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }
        
        try:
            response = await self.http_client.post(self.api_url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            # This is a simplified cost model. A real one would use the CostRouter app.
            input_tokens = data.get('usage', {}).get('prompt_tokens', 0)
            output_tokens = data.get('usage', {}).get('completion_tokens', 0)
            cost = (input_tokens * 0.00015 / 1000) + (output_tokens * 0.0006 / 1000) # GPT-4o-mini pricing
            
            content = data['choices'][0]['message']['content']
            parsed_content = self._parse_response(content)

            latency_ms = (time.monotonic() - start_time) * 1000
            
            return AnalysisResult(
                provider=self.provider_name,
                model=self.model_name,
                sentiment=SentimentScore(**parsed_content),
                entities=[Entity(**e) for e in parsed_content.get('entities', [])],
                cost=cost,
                latency_ms=latency_ms,
                raw_response=data
            )
        except (httpx.HTTPStatusError, KeyError, ValueError) as e:
            logger.error(f"Error analyzing with OpenAI: {e}")
            count_event(f"{settings.app_name}.provider.error", tags={"provider": "openai"})
            raise

    def _parse_response(self, content: str) -> Dict:
        import json
        try:
            data = json.loads(content)
            return {
                "score": data.get("sentiment_score", 0.0),
                "label": data.get("sentiment_label", "neutral"),
                "magnitude": abs(data.get("sentiment_score", 0.0)),
                "reasoning": data.get("reasoning", ""),
                "entities": data.get("entities", [])
            }
        except json.JSONDecodeError:
            logger.error("Failed to parse JSON response from OpenAI")
            return {"score": 0.0, "label": "neutral", "magnitude": 0.0, "reasoning": "JSON parse error"}


class GoogleNLPSentimentProvider(BaseSentimentProvider):
    def __init__(self, model: str = "google_nlp_standard"):
        super().__init__("google_nlp", model)
        # In a real app, this would initialize the Google Cloud client library
        # For simplicity, we'll simulate the API call with httpx
        self.api_url = "https://language.googleapis.com/v1/documents:analyzeSentiment"
        self.entity_api_url = "https://language.googleapis.com/v1/documents:analyzeEntities"
        # The key would be managed by the auth provider or environment
        self.api_key = os.getenv("GOOGLE_API_KEY") 

    @time_execution(service=settings.app_name, component="google_nlp_provider")
    async def analyze(self, text: str, article_url: str) -> AnalysisResult:
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set.")
        start_time = time.monotonic()
        
        document = {"type": "PLAIN_TEXT", "content": text[:10000]} # Limit text size
        payload = {"document": document, "encodingType": "UTF8"}
        
        try:
            # Perform two separate calls for sentiment and entities
            sentiment_task = self.http_client.post(f"{self.api_url}?key={self.api_key}", json=payload)
            entity_task = self.http_client.post(f"{self.entity_api_url}?key={self.api_key}", json=payload)
            
            sentiment_response, entity_response = await asyncio.gather(sentiment_task, entity_task)
            
            sentiment_response.raise_for_status()
            entity_response.raise_for_status()
            
            sentiment_data = sentiment_response.json()
            entity_data = entity_response.json()

            # Simplified cost model
            cost = (len(text) / 1000) * 0.001 * 2 # $1 per 1k units, 2 calls
            latency_ms = (time.monotonic() - start_time) * 1000

            return AnalysisResult(
                provider=self.provider_name,
                model=self.model_name,
                sentiment=self._parse_sentiment(sentiment_data),
                entities=self._parse_entities(entity_data),
                cost=cost,
                latency_ms=latency_ms,
                raw_response={"sentiment": sentiment_data, "entities": entity_data}
            )
        except (httpx.HTTPStatusError, KeyError) as e:
            logger.error(f"Error analyzing with Google NLP: {e}")
            count_event(f"{settings.app_name}.provider.error", tags={"provider": "google_nlp"})
            raise

    def _parse_sentiment(self, data: Dict) -> SentimentScore:
        doc_sentiment = data.get("documentSentiment", {})
        score = doc_sentiment.get("score", 0.0)
        label = "neutral"
        if score > 0.25: label = "positive"
        elif score < -0.25: label = "negative"
        return SentimentScore(
            score=score,
            label=label,
            magnitude=doc_sentiment.get("magnitude", 0.0),
            reasoning="Google NLP does not provide reasoning."
        )

    def _parse_entities(self, data: Dict) -> List[Entity]:
        entities = []
        for e in data.get("entities", []):
            entities.append(Entity(
                name=e.get("name"),
                type=e.get("type"),
                salience=e.get("salience")
            ))
        return entities

# --- Orchestrator ---

class SentimentOrchestrator:
    """
    Implements the Cost vs. Nuance tension by routing articles to different
    providers based on a configurable policy.
    """
    def __init__(self, providers: Dict[str, BaseSentimentProvider]):
        self.providers = providers
        logger.info(f"Orchestrator initialized with providers: {list(providers.keys())}")

    @instrument(service=settings.app_name, component="orchestrator")
    async def process_article(self, article: NewsArticle, policy: RoutingPolicy) -> EnrichedArticle:
        count_event(f"{settings.app_name}.article.received", tags={"source": article.source})
        
        # Tier 1 Analysis (Cost-effective triage)
        tier1_provider_name = policy.tier1_provider
        if tier1_provider_name not in self.providers:
            raise ValueError(f"Tier 1 provider '{tier1_provider_name}' not configured.")
        
        tier1_provider = self.providers[tier1_provider_name]
        tier1_result = await tier1_provider.analyze(article.content, str(article.url))
        gauge_metric(f"{settings.app_name}.provider.cost", tier1_result.cost, tags={"provider": tier1_provider_name, "tier": "1"})
        
        # Tier 2 Decision Logic
        tier2_analysis = None
        analysis_tier = 1
        
        is_high_priority = any(src in str(article.url) for src in policy.high_priority_sources)
        is_ambiguous = abs(tier1_result.sentiment.score) < policy.tier2_trigger_threshold
        
        if is_high_priority or is_ambiguous:
            if feature_flags.is_active("enable_tier2_analysis", user_id="system"):
                logger.info(f"Triggering Tier 2 analysis for article {article.id}. Reason: high_priority={is_high_priority}, ambiguous={is_ambiguous}")
                count_event(f"{settings.app_name}.tier2.triggered", tags={"reason": "high_priority" if is_high_priority else "ambiguous"})
                
                tier2_provider_name = policy.tier2_provider
                if tier2_provider_name not in self.providers:
                    raise ValueError(f"Tier 2 provider '{tier2_provider_name}' not configured.")
                
                tier2_provider = self.providers[tier2_provider_name]
                tier2_analysis = await tier2_provider.analyze(article.content, str(article.url))
                gauge_metric(f"{settings.app_name}.provider.cost", tier2_analysis.cost, tags={"provider": tier2_provider_name, "tier": "2"})
                analysis_tier = 2
            else:
                logger.warning(f"Tier 2 analysis for article {article.id} skipped due to feature flag.")

        enriched_article = EnrichedArticle(
            **article.model_dump(),
            analysis_tier=analysis_tier,
            tier1_analysis=tier1_result,
            tier2_analysis=tier2_analysis,
            policy_applied=policy
        )
        
        return enriched_article

# --- News Feed Consumer ---

class FeedPoller:
    def __init__(self, orchestrator: SentimentOrchestrator):
        self.orchestrator = orchestrator
        self.seen_article_hashes = set()
        self.feed_configs = settings.feeds
        self.http_client = httpx.AsyncClient(headers={"User-Agent": f"EcosystemAI/{settings.app_name}"})

    async def poll_feed(self, feed_config: FeedConfig):
        url = str(feed_config.url)
        logger.info(f"Polling feed: {url}")
        try:
            response = await self.http_client.get(url, follow_redirects=True)
            response.raise_for_status()
            
            feed = feedparser.parse(response.text)
            
            for entry in feed.entries:
                article_hash = hashlib.sha256(entry.get("link", "").encode()).hexdigest()
                if article_hash in self.seen_article_hashes:
                    continue

                if len(self.seen_article_hashes) > settings.max_articles_in_memory:
                    self.seen_article_hashes.pop()
                self.seen_article_hashes.add(article_hash)

                content = entry.get("summary", entry.get("description", ""))
                if not content:
                    logger.warning(f"Skipping article with no content: {entry.get('link')}")
                    continue

                article = NewsArticle(
                    id=entry.get("id", str(uuid4())),
                    url=entry.get("link"),
                    title=entry.get("title"),
                    content=content,
                    source=feed.feed.get("title", url),
                    published_at=self._parse_date(entry.get("published_parsed"))
                )
                
                # Process article in the background
                asyncio.create_task(self.process_and_publish(article))

        except Exception as e:
            logger.error(f"Failed to poll or process feed {url}: {e}")
            count_event(f"{settings.app_name}.feed.error", tags={"feed_url": url})

    async def process_and_publish(self, article: NewsArticle):
        try:
            enriched_article = await self.orchestrator.process_article(article, settings.routing_policy)
            
            event_payload = EnrichedDataEvent(
                source_app=settings.app_name,
                data_type="NewsArticleSentiment",
                data=enriched_article.model_dump()
            )
            
            await event_publisher.publish(settings.event_bus_topic, event_payload)
            logger.info(f"Successfully processed and published article: {article.id}")
            count_event(f"{settings.app_name}.article.published", tags={"source": article.source})
        except Exception as e:
            logger.error(f"Error in processing pipeline for article {article.id}: {e}")
            count_event(f"{settings.app_name}.processing.error")

    def _parse_date(self, parsed_time: Optional[time.struct_time]) -> datetime:
        if parsed_time:
            return datetime.fromtimestamp(time.mktime(parsed_time), tz=timezone.utc)
        return datetime.now(timezone.utc)

    async def run(self):
        logger.info("Starting feed polling tasks...")
        tasks = []
        for feed_config in self.feed_configs:
            tasks.append(self._create_periodic_task(feed_config))
        await asyncio.gather(*tasks)

    async def _create_periodic_task(self, feed_config: FeedConfig):
        while True:
            await self.poll_feed(feed_config)
            await asyncio.sleep(feed_config.poll_interval_seconds)

# --- API Service ---

app = FastAPI(
    title=settings.app_name,
    description="Consumes news feeds and orchestrates multi-vendor sentiment analysis.",
    version="1.0.0"
)

# Initialize components on startup
@app.on_event("startup")
async def startup_event():
    providers = {}
    if settings.openai_api_key:
        providers["openai_nuanced"] = OpenAISentimentProvider(api_key=settings.openai_api_key, model="gpt-4o-mini")
        providers["openai_fast"] = OpenAISentimentProvider(api_key=settings.openai_api_key, model="gpt-3.5-turbo")
    if settings.google_application_credentials or os.getenv("GOOGLE_API_KEY"):
        if settings.google_application_credentials:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials
        providers["google_nlp_fast"] = GoogleNLPSentimentProvider()
    
    if not providers:
        logger.critical("No AI providers configured. Service will not be able to process articles.")
    
    app.state.orchestrator = SentimentOrchestrator(providers)
    app.state.feed_poller = FeedPoller(app.state.orchestrator)
    
    # Start the background polling
    asyncio.create_task(app.state.feed_poller.run())

# --- API Endpoints ---

@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "app_name": settings.app_name, "timestamp": datetime.now(timezone.utc)}

class ManualProcessRequest(BaseModel):
    url: HttpUrl
    content_override: Optional[str] = None

@app.post("/process/url", response_model=EnrichedArticle, tags=["Processing"])
async def process_manual_url(request: ManualProcessRequest, background_tasks: BackgroundTasks):
    """Manually trigger processing for a single URL."""
    orchestrator: SentimentOrchestrator = app.state.orchestrator
    
    if request.content_override:
        content = request.content_override
    else:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(str(request.url))
                response.raise_for_status()
                # This is a naive content extraction. A real app would use a library like `beautifulsoup` or `trafilatura`.
                content = response.text
        except httpx.RequestError as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {e}")

    article = NewsArticle(
        id=str(uuid4()),
        url=request.url,
        title=f"Manual submission: {request.url}",
        content=content,
        source="manual_submission",
        published_at=datetime.now(timezone.utc)
    )
    
    enriched_article = await orchestrator.process_article(article, settings.routing_policy)
    
    # Publish to event bus in the background
    event_payload = EnrichedDataEvent(
        source_app=settings.app_name,
        data_type="NewsArticleSentiment",
        data=enriched_article.model_dump()
    )
    background_tasks.add_task(event_publisher.publish, settings.event_bus_topic, event_payload)
    
    return enriched_article

# --- Self-Querying Agent Endpoints ---

@app.get("/introspect", tags=["Agent"])
async def introspect():
    return {
        "app_name": settings.app_name,
        "description": AGENT_METADATA["agent_metadata"]["purpose"],
        "active_providers": list(app.state.orchestrator.providers.keys()),
        "active_feeds": [str(f.url) for f in settings.feeds],
        "current_policy": settings.routing_policy.model_dump(),
        "event_bus_topic": settings.event_bus_topic,
        "agent_metadata": AGENT_METADATA["agent_metadata"]
    }

@app.get("/assumptions", tags=["Agent"])
async def assumptions():
    return {
        "architectural": [
            "The core_sdk provides a reliable interface for logging, events, and auth.",
            "The event bus has sufficient capacity to handle the output volume.",
            "AI provider APIs are available and their schemas are relatively stable.",
            "RSS/Atom feeds are well-formed and provide meaningful content in summary/description fields."
        ],
        "operational": [
            "API keys and credentials are securely managed and have sufficient quotas.",
            "The cost models for AI providers are accurate enough for effective routing.",
            "The sentiment 'ambiguity' threshold in the policy is a meaningful signal for needing deeper analysis.",
            "Feature flags can be toggled dynamically to control high-cost operations."
        ]
    }

@app.get("/failure-modes", tags=["Agent"])
async def failure_modes():
    return {
        "data_ingestion": [
            "A major news source changes its feed format or URL, causing ingestion to fail.",
            "A 'poison pill' article (e.g., malformed HTML, extremely large) breaks the content parser.",
            "Rate limiting or IP blocking from news sources."
        ],
        "processing": [
            "An AI provider API is down or returning persistent errors, halting a processing tier.",
            "A change in provider response schema breaks the result parser.",
            "Exhaustion of API key quotas, leading to processing failures.",
            "A bug in the routing logic sends all articles to the expensive Tier 2, causing a cost spike."
        ],
        "downstream": [
            "Event bus is unavailable, causing a backlog of processed articles.",
            "Downstream services cannot parse the enriched data format due to an unannounced change."
        ]
    }

@app.get("/update-triggers", tags=["Agent"])
async def update_triggers():
    return {
        "code_update_required": [
            "Deprecation of a major AI provider's API version.",
            "Fundamental change in the core_sdk eventing or auth model.",
            "Introduction of a new, significantly more efficient sentiment analysis model."
        ],
        "config_update_sufficient": [
            "A news feed URL changes.",
            "API keys need to be rotated.",
            "The routing policy needs to be tuned for cost/performance.",
            "A new jurisdiction is added to the blocklist."
        ]
    }

if __name__ == "__main__":
    logger.info(f"Starting {settings.app_name} on port {settings.port}")
    uvicorn.run(app, host="0.0.0.0", port=settings.port, log_level=settings.log_level.lower())