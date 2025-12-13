# APP_65_Agents_GoalDecompositionEngine

## Problem Statement

Financial planning and execution often involve complex, high-level goals that are difficult for individual AI agents or human operators to translate into actionable steps. This application provides an AI-powered engine that decomposes abstract financial objectives into a structured, sequential plan of executable tasks, leveraging a combination of LLM reasoning and predefined financial strategy templates. It aims to bridge the gap between strategic financial intent and tactical execution.

## Architecture Diagram

```
+---------------------------------+     +---------------------------------+
|      User/External System       |     |      AI Core Services           |
| (e.g., Portfolio Manager UI)    |     | (LLMs, Vector DBs, etc.)        |
+---------------------------------+     +---------------------------------+
          | Request Goal Decomposition             | Model Inference, Embeddings
          v                                      v
+---------------------------------+     +---------------------------------+
| APP_65_Agents_GoalDecomposition |<--->|      Shared Core SDK            |
|           Engine                |     | (Auth, Events, Ontology, Config)|
+---------------------------------+     +---------------------------------+
          | Orchestrates Steps
          v
+---------------------------------+     +---------------------------------+
|      Task Execution Agents      |     |      External Financial APIs    |
| (e.g., APP_XX_Trading_Executor) |     | (e.g., Bloomberg, Refinitiv)    |
+---------------------------------+     +---------------------------------+
          | Execute Tasks
          v
+---------------------------------+
|      Monitoring & Feedback      |
| (e.g., APP_XX_Analytics_Monitor)|
+---------------------------------+
```

## Revenue Surface

1.  **Decomposition-as-a-Service (DaaS):** Charge per financial goal decomposition request, tiered by complexity and depth of analysis.
2.  **Strategic Template Licensing:** Offer premium, pre-built financial strategy templates (e.g., for hedging, yield enhancement, risk mitigation) as a subscription or one-time purchase.
3.  **Orchestration Integration Fees:** Integrate with downstream execution agents and charge a small percentage or fixed fee for each successfully executed step orchestrated by the decomposition plan.
4.  **Consulting & Customization:** Provide professional services for integrating custom financial strategies or complex goal types.

## Cost Drivers

1.  **LLM Inference Costs:** Significant costs associated with using large language models for natural language understanding, reasoning, and plan generation.
2.  **Vector Database Costs:** Storage and retrieval costs for financial strategy templates, historical market data embeddings, and past decomposition plans.
3.  **Compute Resources:** For running the decomposition engine, processing inputs, and managing state.
4.  **External API Costs:** Fees for accessing financial data and market information from third-party providers.
5.  **Shared Core SDK Maintenance:** Costs associated with maintaining the common infrastructure.

## Failure Modes

1.  **LLM Hallucinations/Inaccurate Planning:** The LLM may generate illogical, unsafe, or financially unsound steps.
2.  **Incomplete Decomposition:** The engine might fail to break down a complex goal into sufficient detail, leaving gaps in the execution plan.
3.  **Misinterpretation of Goal:** The engine may misunderstand the user's financial objective, leading to an irrelevant plan.
4.  **Outdated Strategy Templates:** Financial markets evolve; static templates can become ineffective or detrimental.
5.  **Integration Failures:** Inability to connect with or correctly interpret outputs from downstream execution agents or external data sources.
6.  **Over-reliance on Specific AI Vendors:** If the underlying LLM or strategy model is proprietary and unavailable, the service is impacted.

## Tension: Cost vs. Quality

The engine's ability to generate high-quality, nuanced financial plans is directly tied to the sophistication of the LLM and the depth of its strategy knowledge. More advanced LLMs and extensive template libraries increase inference costs and data storage requirements. Balancing the need for accurate, safe, and effective financial decomposition against the operational costs is a primary design challenge. This is managed by:

*   **Tiered LLM Usage:** Using smaller, cheaper models for simpler decompositions and reserving larger, more expensive models for complex, high-value goals.
*   **Template Caching & Optimization:** Efficiently storing and retrieving strategy templates to minimize redundant LLM calls.
*   **Human-in-the-Loop (HITL) Options:** Offering a review and approval step for generated plans, especially for critical financial decisions, which can reduce the need for absolute AI perfection upfront.

## Agent Metadata

```yaml
agent_metadata:
  purpose: "Decomposes high-level financial goals into a sequence of executable steps for other agents."
  dependencies:
    - "Shared Core SDK (Auth, Event Bus, Ontology)"
    - "LLM Provider API (e.g., OpenAI, Anthropic, Cohere)"
    - "Vector Database (for strategy templates and historical context)"
    - "External Financial Data APIs (optional, for context)"
    - "APP_XX_ToolRegistry (to discover available execution agents)"
  invalidation_conditions:
    - "Underlying LLM API becomes unavailable or significantly degraded."
    - "Critical financial strategy templates are outdated or corrupted."
    - "Failure to retrieve necessary market context from external APIs."
    - "Changes in the shared ontology that break input/output contracts."
  adjacent_apps:
    - "APP_01_Inference_CostRouter (for LLM cost management)"
    - "APP_14_Agents_MultiModelOrchestrator (for selecting appropriate LLMs)"
    - "APP_37_Governance_AuditTrailEngine (for logging decomposition decisions)"
    - "APP_58_Narrative_ModelExplainabilityUI (for visualizing decomposition logic)"
    - "APP_XX_ToolRegistry (to find agents that can execute decomposed steps)"
    - "APP_XX_PromptCompiler (for generating LLM prompts)"
```

## Internal Extensibility Hooks

*   **`StrategyTemplateProvider` Interface:** Allows plugging in different sources for financial strategy templates (e.g., database, file system, external service).
*   **`LLMAdapter` Interface:** Enables switching between different LLM providers (OpenAI, Anthropic, Azure AI, etc.) without code changes.
*   **`DecompositionStrategy` Hooks:** Allows defining custom decomposition algorithms or heuristics beyond standard LLM prompting.
*   **`GoalValidator` Interface:** For implementing custom validation logic on incoming financial goals.
*   **`PlanPostProcessor` Interface:** To apply additional checks, refinements, or enrichments to the generated execution plan.

## Legal Defensibility

*   **License:** Apache 2.0
*   **Configuration:** All LLM endpoints, API keys, template storage locations, and feature flags are externalized.
*   **No Guarantees:** This application generates potential execution plans based on AI models and provided data. It does not guarantee financial outcomes, market performance, or the absolute correctness/safety of generated steps. All financial decisions remain the responsibility of the user or their designated financial advisor.
*   **Jurisdictional Controls:** Feature flags can be implemented to restrict the types of financial goals or strategies supported based on regulatory requirements in specific jurisdictions.
*   **Audit Logging:** All decomposition requests, generated plans, and significant internal decisions are logged for audit purposes.
*   **Disclaimer:** UIs and READMEs will prominently display disclaimers regarding the AI-generated nature of plans and the user's ultimate responsibility for financial actions.

## Code Structure

```
APP_65_Agents_GoalDecompositionEngine/
├── src/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── adapters/
│   │   │   ├── __init__.py
│   │   │   ├── llm_adapter.py         # Interface for LLM providers
│   │   │   └── strategy_template_provider.py # Interface for strategy templates
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── financial_goal.py      # Typed representation of a financial goal
│   │   │   └── execution_plan.py      # Typed representation of a decomposed plan
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── decomposition_service.py # Main logic for goal decomposition
│   │   │   └── strategy_service.py      # Manages retrieval and application of strategy templates
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── prompt_generator.py    # Helper for creating LLM prompts
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── endpoints.py         # FastAPI endpoints for the application
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py              # Application configuration
│   ├── main.py                      # FastAPI application entry point
│   └── shared/                      # Imports from the common core SDK
│       ├── __init__.py
│       ├── auth/
│       ├── events/
│       ├── ontology/
│       └── exceptions.py
├── tests/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   └── test_decomposition_service.py
│   └── api/
│       ├── __init__.py
│       └── test_endpoints.py
├── .env.example
├── Dockerfile
├── MANIFEST.in
├── README.md
├── requirements.txt
└── setup.py
```

## Source Code (Illustrative Snippets)

**`src/core/models/financial_goal.py`**

```python
# Copyright (c) 2024, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class FinancialGoal(BaseModel):
    """Represents a high-level financial objective."""
    goal_id: str = Field(..., description="Unique identifier for the financial goal.")
    description: str = Field(..., description="Natural language description of the financial goal.")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context, e.g., portfolio details, risk tolerance, market conditions.")
    priority: int = Field(5, description="Priority of the goal (1=highest, 10=lowest).")
    target_date: Optional[str] = Field(None, description="Optional target completion date (YYYY-MM-DD).")

    class Config:
        schema_extra = {
            "example": {
                "goal_id": "fg-12345",
                "description": "Hedge my equity portfolio against a 2% rise in interest rates over the next quarter.",
                "context": {
                    "portfolio_value": 1000000,
                    "equity_exposure": 0.8,
                    "risk_tolerance": "medium",
                    "current_interest_rate": 4.5
                },
                "priority": 1,
                "target_date": "2024-12-31"
            }
        }

class FinancialGoalValidationError(BaseModel):
    """Represents a validation error for a financial goal."""
    field: str = Field(..., description="The field that failed validation.")
    message: str = Field(..., description="Description of the validation error.")

    class Config:
        schema_extra = {
            "example": {
                "field": "description",
                "message": "Goal description is too vague. Please provide more specific details."
            }
        }
```

**`src/core/models/execution_plan.py`**

```python
# Copyright (c) 2024, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ExecutionStep(BaseModel):
    """Represents a single actionable step in an execution plan."""
    step_id: str = Field(..., description="Unique identifier for this execution step.")
    description: str = Field(..., description="Description of the action to be performed.")
    tool_name: str = Field(..., description="The name of the tool/agent capable of executing this step (e.g., from Tool Registry).")
    tool_input: Dict[str, Any] = Field(..., description="Input parameters for the tool.")
    dependencies: List[str] = Field([], description="List of step_ids that must be completed before this step can start.")
    estimated_cost: Optional[Dict[str, float]] = Field(None, description="Estimated cost breakdown (e.g., {'tokens': 0.01, 'compute_hours': 0.005}).")
    expected_outcome: Optional[str] = Field(None, description="Description of the expected outcome of this step.")
    safety_check_required: bool = Field(False, description="Indicates if a human or automated safety check is required before execution.")

    class Config:
        schema_extra = {
            "example": {
                "step_id": "step-001",
                "description": "Identify suitable hedging instruments.",
                "tool_name": "MarketDataQueryAgent",
                "tool_input": {
                    "query": "List inverse ETFs correlated with S&P 500 with >0.8 correlation and <1% expense ratio.",
                    "timeframe": "next_quarter"
                },
                "dependencies": [],
                "estimated_cost": {"tokens": 0.05, "compute_hours": 0.01},
                "expected_outcome": "A list of potential inverse ETFs and their key metrics.",
                "safety_check_required": False
            }
        }

class ExecutionPlan(BaseModel):
    """Represents a sequence of executable steps to achieve a financial goal."""
    plan_id: str = Field(..., description="Unique identifier for the execution plan.")
    goal_id: str = Field(..., description="The ID of the financial goal this plan addresses.")
    steps: List[ExecutionStep] = Field(..., description="Ordered list of execution steps.")
    generated_by: str = Field("APP_65_Agents_GoalDecompositionEngine", description="The agent that generated this plan.")
    version: str = Field("1.0.0", description="Version of the plan generation logic.")
    confidence_score: float = Field(0.8, description="Confidence score of the generated plan (0.0 to 1.0).")

    class Config:
        schema_extra = {
            "example": {
                "plan_id": "plan-abcde",
                "goal_id": "fg-12345",
                "steps": [
                    {
                        "step_id": "step-001",
                        "description": "Identify suitable hedging instruments.",
                        "tool_name": "MarketDataQueryAgent",
                        "tool_input": {
                            "query": "List inverse ETFs correlated with S&P 500 with >0.8 correlation and <1% expense ratio.",
                            "timeframe": "next_quarter"
                        },
                        "dependencies": [],
                        "estimated_cost": {"tokens": 0.05, "compute_hours": 0.01},
                        "expected_outcome": "A list of potential inverse ETFs and their key metrics.",
                        "safety_check_required": False
                    },
                    {
                        "step_id": "step-002",
                        "description": "Analyze the correlation and impact of selected hedging instruments on the portfolio.",
                        "tool_name": "PortfolioRiskAnalyzer",
                        "tool_input": {
                            "portfolio_id": "user-portfolio-1",
                            "hedging_instruments": ["XYZ_ETF", "ABC_SWAP"],
                            "scenario": "interest_rate_hike_2pct"
                        },
                        "dependencies": ["step-001"],
                        "estimated_cost": {"tokens": 0.1, "compute_hours": 0.05},
                        "expected_outcome": "Quantified impact of hedging instruments on portfolio value and risk.",
                        "safety_check_required": True
                    }
                ],
                "generated_by": "APP_65_Agents_GoalDecompositionEngine",
                "version": "1.0.0",
                "confidence_score": 0.85
            }
        }
```

**`src/core/adapters/llm_adapter.py`**

```python
# Copyright (c) 2024, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

import abc
from typing import Dict, Any, List, Optional

class LLMAdapter(abc.ABC):
    """Abstract base class for Large Language Model adapters."""

    @abc.abstractmethod
    async def generate_text(
        self,
        prompt: str,
        model_name: str = "default",
        max_tokens: int = 1024,
        temperature: float = 0.7,
        stop_sequences: Optional[List[str]] = None,
        **kwargs: Any
    ) -> str:
        """
        Generates text based on the provided prompt.

        Args:
            prompt: The input prompt for the LLM.
            model_name: The specific model to use (e.g., 'gpt-4', 'claude-3-opus').
            max_tokens: Maximum number of tokens to generate.
            temperature: Controls randomness. Lower values make output more focused.
            stop_sequences: Sequences where the API will stop generating further tokens.
            **kwargs: Additional provider-specific arguments.

        Returns:
            The generated text.
        """
        pass

    @abc.abstractmethod
    async def generate_structured_output(
        self,
        prompt: str,
        output_schema: Dict[str, Any],
        model_name: str = "default",
        temperature: float = 0.2,
        **kwargs: Any
    ) -> Dict[str, Any]:
        """
        Generates structured output (e.g., JSON) based on the prompt and schema.

        Args:
            prompt: The input prompt for the LLM.
            output_schema: A dictionary representing the desired output schema (e.g., Pydantic model schema).
            model_name: The specific model to use.
            temperature: Controls randomness. Lower values make output more focused and deterministic.
            **kwargs: Additional provider-specific arguments.

        Returns:
            A dictionary representing the structured output.
        """
        pass

    @abc.abstractmethod
    async def get_model_capabilities(self, model_name: str) -> Dict[str, Any]:
        """
        Retrieves capabilities of a specific model.

        Args:
            model_name: The name of the model.

        Returns:
            A dictionary of model capabilities (e.g., max_tokens, supported features).
        """
        pass

    @abc.abstractmethod
    async def get_available_models(self) -> List[str]:
        """
        Retrieves a list of available models from the provider.

        Returns:
            A list of model names.
        """
        pass

# Example concrete implementation (e.g., for OpenAI) would go here
# class OpenAIAdapter(LLMAdapter): ...
```

**`src/core/services/decomposition_service.py`**

```python
# Copyright (c) 2024, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

import logging
import uuid
from typing import Dict, Any, List, Optional

from pydantic import ValidationError

from src.core.adapters.llm_adapter import LLMAdapter
from src.core.adapters.strategy_template_provider import StrategyTemplateProvider
from src.core.models.financial_goal import FinancialGoal, FinancialGoalValidationError
from src.core.models.execution_plan import ExecutionPlan, ExecutionStep
from src.core.utils.prompt_generator import PromptGenerator
from src.shared.events import EventBus
from src.shared.ontology import Ontology
from src.shared.config import AppSettings

logger = logging.getLogger(__name__)

class DecompositionService:
    """
    Service responsible for decomposing financial goals into executable plans.
    """

    def __init__(
        self,
        llm_adapter: LLMAdapter,
        strategy_template_provider: StrategyTemplateProvider,
        event_bus: EventBus,
        ontology: Ontology,
        settings: AppSettings
    ):
        self.llm_adapter = llm_adapter
        self.strategy_template_provider = strategy_template_provider
        self.event_bus = event_bus
        self.ontology = ontology
        self.settings = settings
        self.prompt_generator = PromptGenerator(ontology=ontology)

    async def validate_goal(self, goal: FinancialGoal) -> List[FinancialGoalValidationError]:
        """
        Validates a financial goal based on predefined rules and context.
        This could involve checking for clarity, feasibility, or required context.
        """
        errors: List[FinancialGoalValidationError] = []
        if not goal.description or len(goal.description) < 10:
            errors.append(FinancialGoalValidationError(field="description", message="Goal description is too short or missing."))
        # Add more validation rules here, potentially using LLM for semantic checks
        # Example: Check if goal is financially nonsensical
        # llm_validation_prompt = self.prompt_generator.generate_goal_validation_prompt(goal)
        # validation_result = await self.llm_adapter.generate_structured_output(...)
        # if not validation_result.get("is_valid"):
        #     errors.append(FinancialGoalValidationError(field="description", message=validation_result.get("reason")))

        return errors

    async def decompose_goal(self, goal: FinancialGoal) -> ExecutionPlan:
        """
        Decomposes a financial goal into a sequence of executable steps.
        """
        logger.info(f"Starting decomposition for goal: {goal.goal_id}")

        validation_errors = await self.validate_goal(goal)
        if validation_errors:
            logger.warning(f"Goal validation failed for {goal.goal_id}: {validation_errors}")
            # Publish an event indicating validation failure
            await self.event_bus.publish(
                "goal_decomposition.validation_failed",
                {"goal_id": goal.goal_id, "errors": [e.dict() for e in validation_errors]}
            )
            raise ValidationError([e.dict() for e in validation_errors], FinancialGoal) # Re-raise as Pydantic error

        # 1. Retrieve relevant strategy templates
        relevant_templates = await self.strategy_template_provider.get_templates(goal=goal)
        logger.debug(f"Found {len(relevant_templates)} relevant strategy templates.")

        # 2. Construct the LLM prompt
        llm_prompt = self.prompt_generator.generate_decomposition_prompt(
            goal=goal,
            strategy_templates=relevant_templates,
            available_tools=self.settings.available_tools # Assuming settings has a list of tool names
        )
        logger.debug(f"Generated LLM prompt (first 200 chars): {llm_prompt[:200]}...")

        # 3. Use LLM to generate the execution plan structure
        # Define the schema for the LLM output
        execution_plan_schema = ExecutionPlan.schema()

        try:
            # Use a model suitable for structured output generation
            # Consider using APP_01_Inference_CostRouter to select the best model based on cost/performance
            llm_model_name = self.settings.llm_model_for_decomposition or "default-structured-model"
            generated_plan_dict = await self.llm_adapter.generate_structured_output(
                prompt=llm_prompt,
                output_schema=execution_plan_schema,
                model_name=llm_model_name,
                temperature=0.1 # Lower temperature for deterministic plan generation
            )
            logger.debug(f"LLM generated raw plan: {generated_plan_dict}")

            # 4. Parse and validate the generated plan
            execution_plan = ExecutionPlan(**generated_plan_dict)

            # 5. Post-processing and enrichment (e.g., adding estimated costs, safety flags)
            # This step might involve calling other services or applying business logic
            await self.enrich_execution_plan(execution_plan, goal)

            # 6. Publish event for successful decomposition
            await self.event_bus.publish(
                "goal_decomposition.completed",
                {"goal_id": goal.goal_id, "plan_id": execution_plan.plan_id, "steps_count": len(execution_plan.steps)}
            )
            logger.info(f"Successfully decomposed goal {goal.goal_id} into plan {execution_plan.plan_id} with {len(execution_plan.steps)} steps.")
            return execution_plan

        except ValidationError as e:
            logger.error(f"LLM output validation failed for goal {goal.goal_id}: {e}")
            await self.event_bus.publish(
                "goal_decomposition.llm_output_error",
                {"goal_id": goal.goal_id, "error": str(e), "type": "validation_error"}
            )
            raise e
        except Exception as e:
            logger.error(f"An unexpected error occurred during decomposition for goal {goal.goal_id}: {e}", exc_info=True)
            await self.event_bus.publish(
                "goal_decomposition.llm_output_error",
                {"goal_id": goal.goal_id, "error": str(e), "type": "runtime_error"}
            )
            raise e

    async def enrich_execution_plan(self, plan: ExecutionPlan, goal: FinancialGoal):
        """
        Enriches the generated execution plan with additional details like
        estimated costs, safety checks, and tool-specific metadata.
        """
        plan.plan_id = str(uuid.uuid4()) # Ensure a unique plan ID
        plan.goal_id = goal.goal_id

        for i, step in enumerate(plan.steps):
            step.step_id = f"step-{plan.plan_id[:8]}-{i+1:03d}" # Unique step ID

            # Placeholder for cost estimation - could call APP_01_Inference_CostRouter or other services
            # For now, use defaults or simple heuristics
            if step.estimated_cost is None:
                step.estimated_cost = {"tokens": 0.02, "compute_hours": 0.008} # Default estimates

            # Placeholder for safety checks - could be determined by tool capabilities or goal sensitivity
            # If the goal is high-risk, or the tool is known to be sensitive, mark for check.
            if goal.priority <= 2 or "trade" in step.description.lower():
                 step.safety_check_required = True

            # Add more enrichment logic here, e.g., resolving tool parameters against ontology

        # Update confidence score based on factors like template usage, LLM confidence, etc.
        # For now, a default value.
        plan.confidence_score = 0.85

    # --- Self-Querying Agent Methods ---
    def introspect(self) -> Dict[str, Any]:
        return {
            "purpose": "Decomposes high-level financial goals into a sequence of executable steps for other agents.",
            "current_state": "Operational",
            "dependencies": [
                "LLMAdapter",
                "StrategyTemplateProvider",
                "EventBus",
                "Ontology",
                "AppSettings"
            ],
            "capabilities": [
                "Financial Goal Validation",
                "LLM-based Plan Generation",
                "Strategy Template Integration",
                "Execution Plan Structuring",
                "Plan Enrichment"
            ]
        }

    def assumptions(self) -> Dict[str, str]:
        return {
            "llm_provider_reliability": "The configured LLM provider is available and responsive.",
            "strategy_template_accuracy": "Provided financial strategy templates are relevant and effective.",
            "tool_registry_completeness": "The list of available tools (`settings.available_tools`) accurately reflects executable agents.",
            "ontology_consistency": "The shared ontology provides a consistent understanding of financial concepts.",
            "user_intent_clarity": "The user's financial goal description, while high-level, contains sufficient semantic information for decomposition."
        }

    def failure_modes(self) -> Dict[str, str]:
        return {
            "llm_hallucination": "LLM generates illogical, unsafe, or financially unsound steps.",
            "incomplete_decomposition": "Goal not broken down into sufficient detail.",
            "goal_misinterpretation": "LLM misunderstands the user's objective.",
            "template_staleness": "Financial strategy templates are outdated.",
            "tool_unavailability": "Required tools/agents for execution steps are not registered or available.",
            "output_validation_error": "LLM output does not conform to the expected ExecutionPlan schema.",
            "dependency_failure": "Failure in underlying LLMAdapter, StrategyTemplateProvider, or EventBus."
        }

    def update_triggers(self) -> List[str]:
        return [
            "Significant changes in financial market conditions requiring updated strategy templates.",
            "Introduction of new financial instruments or execution agents.",
            "Updates to the shared ontology impacting financial concept definitions.",
            "Performance degradation or changes in LLM provider APIs.",
            "New regulatory requirements impacting financial planning."
        ]
```

**`src/api/v1/endpoints.py`**

```python
# Copyright (c) 2024, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

import logging
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import ValidationError

from src.core.models.financial_goal import FinancialGoal
from src.core.models.execution_plan import ExecutionPlan
from src.core.services.decomposition_service import DecompositionService
from src.shared.auth import get_current_user # Assuming auth module provides this
from src.shared.dependencies import get_decomposition_service # Assuming dependencies module provides this

logger = logging.getLogger(__name__)
router = APIRouter()

# --- Self-Querying Agent Endpoints ---

@router.get("/introspect", tags=["Agent Introspection"])
async def introspect_agent() -> Dict[str, Any]:
    """Provides introspection data about the agent."""
    service: DecompositionService = Depends(get_decomposition_service)
    return service.introspect()

@router.get("/assumptions", tags=["Agent Introspection"])
async def get_agent_assumptions() -> Dict[str, str]:
    """Lists the core assumptions the agent operates under."""
    service: DecompositionService = Depends(get_decomposition_service)
    return service.assumptions()

@router.get("/failure-modes", tags=["Agent Introspection"])
async def get_agent_failure_modes() -> Dict[str, str]:
    """Describes potential failure modes of the agent."""
    service: DecompositionService = Depends(get_decomposition_service)
    return service.failure_modes()

@router.get("/update-triggers", tags=["Agent Introspection"])
async def get_agent_update_triggers() -> Dict[str, Any]:
    """Lists conditions that might trigger agent updates."""
    service: DecompositionService = Depends(get_decomposition_service)
    return {"triggers": service.update_triggers()}

# --- Core Functionality Endpoints ---

@router.post(
    "/decompose",
    response_model=ExecutionPlan,
    status_code=status.HTTP_201_CREATED,
    summary="Decompose Financial Goal",
    description="Takes a high-level financial goal and breaks it down into a sequence of executable steps.",
    tags=["Financial Planning"]
)
async def create_decomposition(
    goal: FinancialGoal,
    current_user: Dict[str, Any] = Depends(get_current_user), # Example: Authenticate user
    service: DecompositionService = Depends(get_decomposition_service)
):
    """
    **API Endpoint:** POST /api/v1/decompose

    **Description:** Accepts a `FinancialGoal` object and returns an `ExecutionPlan`.

    **Input:**
    - `FinancialGoal` object (JSON body)

    **Output:**
    - `ExecutionPlan` object (JSON)

    **Authentication:** Requires valid user authentication.

    **Rate Limiting:** Applied based on user tier and configuration.

    **Legal Disclaimer:** Generated plans are AI-driven suggestions and do not constitute financial advice. User assumes all responsibility for execution.
    """
    logger.info(f"Received decomposition request for goal_id: {goal.goal_id} from user: {current_user.get('id')}")
    try:
        # Add user context to the goal if needed for personalization or auditing
        goal.context = goal.context or {}
        goal.context["user_id"] = current_user.get("id")

        execution_plan = await service.decompose_goal(goal)
        return execution_plan
    except ValidationError as e:
        logger.error(f"Input validation error for goal {goal.goal_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Invalid FinancialGoal input.", "errors": e.errors()}
        )
    except HTTPException as e:
        # Re-raise HTTPExceptions that might come from validation or other service layers
        raise e
    except Exception as e:
        logger.error(f"Failed to decompose goal {goal.goal_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "An internal error occurred during goal decomposition."}
        )

# --- Health Check Endpoint ---
@router.get("/health", tags=["System"])
async def health_check():
    """Basic health check endpoint."""
    # In a real app, this would check dependencies like DB, LLM connectivity etc.
    return {"status": "ok", "agent": "APP_65_Agents_GoalDecompositionEngine"}
```

**`src/main.py`**

```python
# Copyright (c) 2024, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

import logging
import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

# Import adapters and services
from src.core.adapters.llm_adapter import LLMAdapter # Placeholder
from src.core.adapters.strategy_template_provider import StrategyTemplateProvider # Placeholder
from src.core.services.decomposition_service import DecompositionService
from src.core.config.settings import AppSettings
from src.shared.auth import AuthService # Placeholder
from src.shared.events import EventBus # Placeholder
from src.shared.ontology import Ontology # Placeholder
from src.shared.dependencies import get_decomposition_service # Dependency injection setup

# Import API routes
from src.api.v1.endpoints import router as api_v1_router

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Dependency Injection Setup ---
# In a real application, these would be properly initialized singletons or managed by a DI container.
# For this example, we'll simulate their creation.

# Load settings from environment variables
settings = AppSettings()

# Placeholder for actual implementations
class MockLLMAdapter(LLMAdapter):
    async def generate_text(self, prompt: str, **kwargs: Any) -> str:
        logger.warning("Using MockLLMAdapter.generate_text")
        return "Mock LLM response."
    async def generate_structured_output(self, prompt: str, output_schema: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        logger.warning("Using MockLLMAdapter.generate_structured_output")
        # Simulate a basic structured output based on a common pattern
        # In a real scenario, this would involve calling an actual LLM API
        if "ExecutionPlan" in str(output_schema): # Crude check
             return {
                "plan_id": str(os.urandom(8).hex()),
                "goal_id": "mock-goal-id",
                "steps": [
                    {
                        "step_id": "mock-step-1",
                        "description": "Simulated step 1: Analyze market data.",
                        "tool_name": "MarketDataAgent",
                        "tool_input": {"query": "Simulated query"},
                        "dependencies": [],
                        "estimated_cost": {"tokens": 0.01, "compute_hours": 0.001},
                        "expected_outcome": "Simulated market data analysis.",
                        "safety_check_required": False
                    }
                ],
                "generated_by": "MockLLMAdapter",
                "version": "0.1.0",
                "confidence_score": 0.7
            }
        return {"message": "Mock structured output."}
    async def get_model_capabilities(self, model_name: str) -> Dict[str, Any]: return {}
    async def get_available_models(self) -> List[str]: return ["mock-model-1"]

class MockStrategyTemplateProvider(StrategyTemplateProvider):
    async def get_templates(self, goal: FinancialGoal) -> List[Dict[str, Any]]:
        logger.info(f"Using MockStrategyTemplateProvider for goal: {goal.goal_id}")
        # Return some dummy templates based on goal description keywords
        templates = []
        if "hedge" in goal.description.lower():
            templates.append({
                "template_id": "hedge-etf-strategy",
                "name": "Basic ETF Hedging Strategy",
                "description": "Uses inverse ETFs to hedge against market downturns.",
                "steps_template": [
                    {"description": "Identify suitable inverse ETFs.", "tool_name": "MarketDataQueryAgent"},
                    {"description": "Calculate required ETF allocation.", "tool_name": "PortfolioOptimizer"},
                    {"description": "Execute ETF purchase order.", "tool_name": "TradingExecutor"}
                ]
            })
        if "yield" in goal.description.lower():
             templates.append({
                "template_id": "yield-enhancement-bond",
                "name": "Bond Yield Enhancement",
                "description": "Strategies to increase portfolio yield through bond selection.",
                "steps_template": [
                    {"description": "Screen for high-yield bonds.", "tool_name": "FixedIncomeScreener"},
                    {"description": "Analyze credit risk of selected bonds.", "tool_name": "CreditRiskAnalyzer"}
                ]
            })
        return templates

class MockEventBus(EventBus):
    async def publish(self, topic: str, message: Dict[str, Any]):
        logger.info(f"MockEventBus: Publishing to topic '{topic}' with message: {message}")

class MockOntology(Ontology):
    def get_concept(self, concept_name: str) -> Optional[Dict[str, Any]]:
        logger.info(f"MockOntology: Querying for concept '{concept_name}'")
        # Dummy ontology entries
        if concept_name == "interest_rate_risk":
            return {"name": "interest_rate_risk", "description": "The risk that changes in interest rates will negatively impact the value of an investment."}
        if concept_name == "hedging_instrument":
            return {"name": "hedging_instrument", "description": "A financial instrument used to offset potential losses from another investment."}
        return None
    def get_related_concepts(self, concept_name: str) -> List[str]: return []
    def get_tool_for_concept(self, concept_name: str) -> Optional[str]: return None

class MockAuthService(AuthService):
     async def get_current_user(self, request: Request) -> Dict[str, Any]:
         logger.info("Using MockAuthService: Authenticating request.")
         # Simulate a logged-in user
         return {"id": "mock-user-123", "roles": ["financial_analyst"]}

# Initialize dependencies
mock_llm_adapter = MockLLMAdapter()
mock_strategy_template_provider = MockStrategyTemplateProvider()
mock_event_bus = MockEventBus()
mock_ontology = MockOntology()
mock_auth_service = MockAuthService()

# Create the decomposition service instance
decomposition_service = DecompositionService(
    llm_adapter=mock_llm_adapter,
    strategy_template_provider=mock_strategy_template_provider,
    event_bus=mock_event_bus,
    ontology=mock_ontology,
    settings=settings
)

# Set up dependency injection provider
def get_mock_decomposition_service() -> DecompositionService:
    return decomposition_service

def get_mock_auth_service() -> AuthService:
    return mock_auth_service

# --- FastAPI Application Setup ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Application starting up...")
    # Initialize dependencies here if they require async operations
    # For example: await database.connect()
    yield
    # Shutdown logic
    logger.info("Application shutting down...")
    # For example: await database.disconnect()

app = FastAPI(
    title="APP_65_Agents_GoalDecompositionEngine",
    description="AI planner for decomposing financial goals into executable steps.",
    version="1.0.0",
    lifespan=lifespan
)

# Mount API routes
app.include_router(api_v1_router, prefix="/api/v1")

# --- Custom Exception Handling ---
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    logger.error(f"Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"message": "Input validation failed.", "errors": exc.errors()},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail.get("message", "An error occurred")},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE, # Or 500 depending on policy
        content={"message": "An unexpected internal server error occurred."},
    )

# --- Root Endpoint ---
@app.get("/", tags=["System"])
async def read_root():
    return {"message": "Welcome to APP_65_Agents_GoalDecompositionEngine"}

# --- Dependency Injection Setup for FastAPI ---
# This ensures that the correct service instances are injected into the API endpoints.
# Replace `get_mock_decomposition_service` and `get_mock_auth_service` with your actual DI setup.
app.dependency_overrides[get_decomposition_service] = get_mock_decomposition_service
app.dependency_overrides[get_current_user] = get_mock_auth_service # Override auth dependency

# --- Legal Disclaimer Banner ---
# This is a conceptual banner. In a real UI, this would be more prominent.
LEGAL_DISCLAIMER = """
Disclaimer: This application utilizes AI models to generate financial planning steps.
These outputs are suggestions and do not constitute financial advice. Users are solely
responsible for any financial decisions and actions taken based on these suggestions.
Always consult with a qualified financial advisor before making investment decisions.
"""
logger.warning(LEGAL_DISCLAIMER)

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting uvicorn server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)