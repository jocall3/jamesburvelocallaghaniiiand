import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';

const aiPrompt = `BEGIN PROMPT

You will operate under the unified brand Citibank demo business inc  spelled and used in code as Citibankdemobusinessinc. Your objective is to generate 10 new business models inside a niche derived from the input document and convert them into dot-notation branches using the structure:

Citibankdemobusinessinc.<subdivision>.<function>

Example: Citibankdemobusinessinc.viewit.movieplayform

For each business model, you will architect a self-contained, completely dependency-free, fully runnable application that is:

• self-hosted • standalone • complete within its own file • internally wired with no external calls • free of all mock data • populated using internal generative-data functions only • fully integrated with all other generated branches • engineered for billion-dollar potential

Your task is to produce all business models, all branches, all namespaces, all files, all apps, all functions, and all linkage layers based on the following 100-point instruction set. You will obey every point and implement all outputs inside this prompt’s structure.


THE 100-POINT INSTRUCTION FRAMEWORK
Operate under the single unifying brand Citibank demo business inc.

Generate 10 business models within the chosen niche.

Structure each business as a branch using dot-notation naming.

Ensure each business targets $1B+ market potential.

Architect each output as a full self-hosted app.

Include zero third-party dependencies.

Include zero external services.

Include zero mock data.

Replace all static values with generative functions.

Each file must be runnable as-is.

Each file must contain all logic required.

Include internal data generators.

Include internal model-training logic where needed.

Include internal dataset simulation.

Include unique mission statements.

Include clear monetization paths.

Include defensible IP moats.

Include auto-scaling architectures.

Include regulatory alignment functions.

Include supervisory-response adaptation logic.

Include risk-detection modules.

Include material-risk evaluation.

Include liquidity-monitoring logic.

Include internal governance tracks.

Include compliance automation.

Include embedded audit simulation.

Ensure internal audit acts as validator.

Include role-based access controls.

Include internal telemetry.

Include encrypted storage.

Include privacy-first architecture.

Make every component self-contained.

Add internal documentation generators.

Add architecture diagram generators.

Add code-explanation utilities.

Add debugging systems.

Add internal testing frameworks.

Add zero-dependency runtime libraries.

Add user dashboards.

Add admin dashboards.

Add CLI interfaces.

Add GUI layers.

Add file output utilities.

Add modular plugin systems.

Add offline-first design.

Add resilience mechanics.

Add stable upgrade paths.

Add container-safe design.

Add hardware-agnostic execution.

Add single-binary output options.

Provide rich error handling.

Provide human-readable errors.

Add in-app training modules.

Add onboarding logic.

Add built-in analytics.

Add forecasting dashboards.

Add visual data generation.

Add inter-branch syncing.

Add a shared kernel across all apps.

Add custom logic per branch.

Add regulatory reporting templates.

Add executive summary generators.

Add investor deck generators.

Add competitive analysis engines.

Add market-gap evaluators.

Add customer-persona generators.

Add product roadmapping logic.

Add milestone systems.

Add adoption-curve analysis.

Add pricing engines.

Add churn-prediction models.

Add partnership frameworks.

Add privacy compliance templates.

Add financial statement generators.

Add valuation calculators.

Add IPO-readiness scoring.

Add global expansion logic.

Add risk-weighted asset calculators.

Add stress-scenario generators.

Add liquidity simulations.

Add capital-planning engines.

Add rules engines.

Add automated escalation logic.

Add sustainability metrics.

Add environmental modeling.

Add workforce planning software.

Add org-structure generation.

Add board-pack generators.

Add open-banking strategy layers.

Add cross-branch orchestration.

Add internal event bus.

Add shared identity layer.

Add unified configuration layer.

Add schema auto-generation.

Add automated linking between branches.

Add common security primitives.

Add internal messaging queues.

Add deterministic build-generation.

Add all required interfaces in every file.

Produce a master orchestration layer binding all 10 business models into a unified Citibankdemobusinessinc ecosystem aimed at making open banking the U.S. standard.


FINAL TASK
Using the above structure:

• Generate 10 dot-notation business branches under Citibankdemobusinessinc. • Generate 10 full billion-dollar business models. • Generate 10 self-contained apps. • Link them through a unified orchestration layer. • Output everything cleanly and completely.

END PROMPT`;

const ApiPlaygroundView: React.FC = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Prompt Playground
      </Typography>
      <Typography variant="body1" paragraph>
        Copy and paste this prompt into a generative AI to create the Citibankdemobusinessinc ecosystem.
      </Typography>
      <Paper elevation={3} sx={{ p: 2, overflowX: 'auto', backgroundColor: '#f5f5f5' }}>
        <pre>{aiPrompt}</pre>
      </Paper>
    </Box>
  );
};

export default ApiPlaygroundView;