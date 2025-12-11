export enum BuildStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  PENDING = 'PENDING',
}

export enum BuildStep {
  SETUP = 'Setup Environment',
  CHECKOUT = 'Checkout Code',
  LINTING = 'Static Analysis & Linting',
  TESTING_UNIT = 'Run Unit Tests',
  TESTING_INTEGRATION = 'Run Integration Tests',
  BUILDING = 'Build Artifacts',
  DEPLOY_STAGING = 'Deploy to Staging',
  DEPLOY_PROD = 'Deploy to Production',
  CLEANUP = 'Cleanup Resources',
}

export interface BuildLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  step: BuildStep;
}

export interface BuildUpdate {
  status: BuildStatus;
  currentStep: BuildStep;
  progress: number; // 0 to 100
  logs: BuildLogEntry[];
}

// Mock Build Definitions to structure the simulation flow
const MOCK_BUILD_STEPS: { step: BuildStep, duration: number, successRate: number, logMessages: string[] }[] = [
    { step: BuildStep.SETUP, duration: 1000, successRate: 1.0, logMessages: ["Initialized build environment.", "Dependencies resolved."] },
    { step: BuildStep.CHECKOUT, duration: 800, successRate: 1.0, logMessages: ["Cloning repository...", "Switching to branch 'main'."] },
    { step: BuildStep.LINTING, duration: 1500, successRate: 0.95, logMessages: ["Running ESLint and Prettier.", "No major style violations found."] },
    { step: BuildStep.TESTING_UNIT, duration: 2500, successRate: 0.9, logMessages: ["Starting Jest unit tests...", "Tests passed: 45 / 45."] },
    { step: BuildStep.TESTING_INTEGRATION, duration: 3500, successRate: 0.8, logMessages: ["Running E2E tests against staging database.", "Data integrity checks complete."] },
    { step: BuildStep.BUILDING, duration: 2000, successRate: 1.0, logMessages: ["Compiling source code...", "Bundling complete. Artifact size: 12.5MB."] },
    { step: BuildStep.DEPLOY_STAGING, duration: 3000, successRate: 0.98, logMessages: ["Starting deployment to Staging cluster.", "Traffic shifting complete. Staging verified."] },
    { step: BuildStep.DEPLOY_PROD, duration: 4500, successRate: 0.7, logMessages: ["Initiating blue/green deployment to Production.", "Health checks running..."] },
    { step: BuildStep.CLEANUP, duration: 500, successRate: 1.0, logMessages: ["Tearing down temporary containers."] },
];

export class BuildMonitor {
  private totalDuration: number;
  private currentRunId = 0;

  constructor() {
    this.totalDuration = MOCK_BUILD_STEPS.reduce((sum, step) => sum + step.duration, 0);
  }

  /**
   * Simulates a streaming CI/CD build process.
   * @param pipelineId The ID of the pipeline being run.
   * @param onUpdate Callback function called with continuous updates.
   * @param onComplete Callback function called when the build finishes (success or failure).
   */
  public startBuild(
    pipelineId: string,
    onUpdate: (update: BuildUpdate) => void,
    onComplete: (status: BuildStatus, finalLog: BuildLogEntry[]) => void
  ): { cancel: () => void, runId: number } {
    this.currentRunId++;
    const runId = this.currentRunId;
    let logs: BuildLogEntry[] = [];
    let cumulativeTime = 0;
    let timer: NodeJS.Timeout | null = null;
    let active = true;

    const createLog = (level: 'INFO' | 'WARNING' | 'ERROR', message: string, step: BuildStep): BuildLogEntry => ({
      timestamp: new Date().toISOString(),
      level,
      message,
      step,
    });

    const updateUI = (status: BuildStatus, currentStep: BuildStep, stepLogs: BuildLogEntry[], progress: number) => {
        if (!active) return;
        logs = [...logs, ...stepLogs];
        onUpdate({
            status,
            currentStep,
            progress: Math.min(100, Math.round(progress)),
            logs,
        });
    };

    const processStep = (stepIndex: number, startTime: number) => {
      if (!active || stepIndex >= MOCK_BUILD_STEPS.length) {
        // Complete the build if all steps are done or if canceled
        if (active) {
            updateUI(BuildStatus.SUCCESS, MOCK_BUILD_STEPS[MOCK_BUILD_STEPS.length - 1].step, [createLog('INFO', `Pipeline ${pipelineId} completed successfully. Total time: ${(cumulativeTime / 1000).toFixed(2)}s.`, MOCK_BUILD_STEPS[MOCK_BUILD_STEPS.length - 1].step)], 100);
            onComplete(BuildStatus.SUCCESS, logs);
        }
        return;
      }

      const stepDef = MOCK_BUILD_STEPS[stepIndex];
      const stepDuration = stepDef.duration;
      const stepStartTime = cumulativeTime;

      // Start the step
      updateUI(BuildStatus.RUNNING, stepDef.step, [createLog('INFO', `--- Starting Step: ${stepDef.step} ---`, stepDef.step)], (cumulativeTime / this.totalDuration) * 100);

      // Check for failure condition
      const failed = Math.random() > stepDef.successRate;

      let subStepTime = 0;
      const subStepDelay = 300; // Time between log messages
      let logIndex = 0;

      const runSubStep = () => {
        if (!active) {
            // Already canceled via external call
            return;
        }

        if (failed) {
            // Simulate failure quickly after initial logs
            if (logIndex < 2 && logIndex < stepDef.logMessages.length) {
                // Show a couple of successful logs first
                updateUI(BuildStatus.RUNNING, stepDef.step, [createLog('INFO', stepDef.logMessages[logIndex], stepDef.step)], (stepStartTime + subStepTime) / this.totalDuration * 100);
                subStepTime += subStepDelay;
                logIndex++;
                timer = setTimeout(runSubStep, subStepDelay);
            } else {
                cumulativeTime = stepStartTime + stepDuration * 0.5; // Fail halfway through simulated time
                const errorLog = createLog('ERROR', `Step failed due to ${stepDef.step} error: Exit code 1. Build aborted.`, stepDef.step);
                updateUI(BuildStatus.FAILED, stepDef.step, [errorLog], Math.min(100, (cumulativeTime / this.totalDuration) * 100));
                onComplete(BuildStatus.FAILED, [...logs, errorLog]);
            }
            return;
        }

        // Normal successful execution
        if (logIndex < stepDef.logMessages.length) {
          const message = stepDef.logMessages[logIndex];
          updateUI(BuildStatus.RUNNING, stepDef.step, [createLog('INFO', message, stepDef.step)], (stepStartTime + subStepTime) / this.totalDuration * 100);
          
          subStepTime += subStepDelay;
          logIndex++;
          
          if (cumulativeTime + subStepDelay < stepStartTime + stepDuration) {
              timer = setTimeout(runSubStep, subStepDelay);
          } else {
              // Finalize this step
              cumulativeTime = stepStartTime + stepDuration;
              updateUI(BuildStatus.RUNNING, stepDef.step, [createLog('INFO', `Step completed: ${stepDef.step}`, stepDef.step)], (cumulativeTime / this.totalDuration) * 100);
              
              // Proceed to next step
              timer = setTimeout(() => processStep(stepIndex + 1, cumulativeTime), 500); // 500ms delay between steps
          }
        } else {
            // Handle time padding if logs finished quickly
            cumulativeTime = stepStartTime + stepDuration;
            updateUI(BuildStatus.RUNNING, stepDef.step, [], (cumulativeTime / this.totalDuration) * 100);
            timer = setTimeout(() => processStep(stepIndex + 1, cumulativeTime), 500);
        }
      };

      runSubStep();
    };

    // Start the simulation
    processStep(0, 0);

    return {
      cancel: () => {
        if (active) {
            active = false;
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
            updateUI(BuildStatus.CANCELED, MOCK_BUILD_STEPS[MOCK_BUILD_STEPS.length - 1].step, [createLog('WARNING', `Pipeline ${pipelineId} canceled by user.`, MOCK_BUILD_STEPS[MOCK_BUILD_STEPS.length - 1].step)], (cumulativeTime / this.totalDuration) * 100);
            onComplete(BuildStatus.CANCELED, logs);
        }
      },
      runId: runId,
    };
  }
}

// Export a singleton instance for simplicity in a frontend app
export const buildMonitor = new BuildMonitor();