import { Octokit } from "@octokit/rest";

/**
 * Configuration interface for executing a project workflow.
 */
export interface ProjectExecutionConfig {
  /**
   * The repository URL or 'owner/repo' string.
   * Example: 'https://github.com/my-org/my-project' or 'my-org/my-project'
   */
  repository: string;

  /**
   * The GitHub OAuth token or Personal Access Token (PAT).
   * Must have 'repo' and 'workflow' scopes.
   */
  authToken: string;

  /**
   * The ID or filename of the workflow to trigger.
   * Example: 'main.yml' or '123456'
   */
  workflowId: string;

  /**
   * The git reference (branch or tag) to run the workflow on.
   * Defaults to 'main' or 'master' if not specified, but explicit is better.
   */
  ref: string;

  /**
   * Inputs to pass to the workflow_dispatch event.
   * Must match the inputs defined in the workflow YAML.
   */
  inputs?: Record<string, any>;

  /**
   * Optional base URL for GitHub Enterprise instances.
   * Defaults to 'https://api.github.com'.
   */
  baseUrl?: string;

  /**
   * Maximum time to wait for the workflow to complete in milliseconds.
   * Default: 600000 (10 minutes).
   */
  timeoutMs?: number;
}

/**
 * Result of a project execution run.
 */
export interface ExecutionResult {
  success: boolean;
  runId: number;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  logsUrl: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  artifacts: Array<ArtifactSummary>;
}

export interface ArtifactSummary {
  id: number;
  name: string;
  downloadUrl: string;
  sizeInBytes: number;
  createdAt: string;
}

/**
 * Service: ProjectRunner
 * Purpose: Orchestrates the execution of projects stored in GitHub, triggering workflows or CI/CD pipelines via API.
 * 
 * This service handles:
 * 1. Authentication with GitHub via provided tokens.
 * 2. Dispatching workflow events with dynamic inputs.
 * 3. Polling for workflow run initialization and completion.
 * 4. Aggregating results, logs, and artifacts for downstream processing (e.g., Google Drive storage).
 */
export class ProjectRunner {
  private readonly DEFAULT_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  private readonly POLL_INTERVAL = 5000; // 5 seconds
  private readonly RUN_START_TIMEOUT = 60000; // 60 seconds to wait for run to appear

  /**
   * Triggers a GitHub workflow and monitors it to completion.
   * 
   * @param config Configuration for the execution.
   * @returns Promise resolving to the detailed execution result.
   */
  public async runProject(config: ProjectExecutionConfig): Promise<ExecutionResult> {
    const { owner, repo } = this.parseRepository(config.repository);
    
    const octokit = new Octokit({
      auth: config.authToken,
      baseUrl: config.baseUrl || 'https://api.github.com',
      userAgent: 'DevOps-ProjectRunner/1.0.0'
    });

    try {
      // 1. Validate connection and permissions implicitly by attempting action or explicit check
      // (Skipping explicit check to save API calls, relying on try/catch)

      // 2. Trigger the workflow
      const dispatchTimestamp = new Date();
      // Subtract a small buffer to account for clock skew between local and GitHub
      dispatchTimestamp.setSeconds(dispatchTimestamp.getSeconds() - 5);

      await octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: config.workflowId,
        ref: config.ref,
        inputs: config.inputs || {},
      });

      // 3. Wait for the run to be created
      const runId = await this.waitForRunStart(octokit, owner, repo, config.workflowId, dispatchTimestamp);

      // 4. Monitor the run until terminal state
      const completedRun = await this.monitorRun(octokit, owner, repo, runId, config.timeoutMs || this.DEFAULT_TIMEOUT);

      // 5. Fetch Artifacts
      const artifacts = await this.getArtifacts(octokit, owner, repo, runId);

      // 6. Construct Result
      const startTime = new Date(completedRun.created_at);
      const endTime = new Date(completedRun.updated_at);
      const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

      return {
        success: completedRun.conclusion === 'success',
        runId: completedRun.id,
        status: completedRun.status || 'unknown',
        conclusion: completedRun.conclusion,
        htmlUrl: completedRun.html_url,
        logsUrl: completedRun.logs_url,
        startTime: completedRun.created_at,
        endTime: completedRun.updated_at,
        durationSeconds,
        artifacts
      };

    } catch (error: any) {
      // Enhance error message for debugging
      const msg = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`ProjectRunner execution failed for ${owner}/${repo}: ${msg}`);
    }
  }

  /**
   * Parses the repository string to extract owner and repo name.
   */
  private parseRepository(repository: string): { owner: string; repo: string } {
    // Remove .git extension if present
    const clean = repository.replace(/\.git$/, '');
    
    // Handle full URL
    if (clean.startsWith('http')) {
      const url = new URL(clean);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] };
      }
    }

    // Handle "owner/repo" string
    const parts = clean.split('/');
    if (parts.length === 2) {
      return { owner: parts[0], repo: parts[1] };
    }

    throw new Error(`Invalid repository format: "${repository}". Expected "owner/repo" or full GitHub URL.`);
  }

  /**
   * Polls GitHub to find the run ID generated by the dispatch event.
   * GitHub does not return the Run ID in the dispatch response, so we must query for it.
   */
  private async waitForRunStart(
    octokit: Octokit, 
    owner: string, 
    repo: string, 
    workflowId: string, 
    since: Date
  ): Promise<number> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.RUN_START_TIMEOUT) {
      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data } = await octokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
        event: 'workflow_dispatch',
        created: `>=${since.toISOString()}`,
        sort: 'created',
        direction: 'desc',
        per_page: 5
      });

      // Find the most recent run that matches our timing
      if (data.workflow_runs.length > 0) {
        // We take the first one as we sorted by desc
        const run = data.workflow_runs[0];
        return run.id;
      }
    }

    throw new Error(`Timeout: Workflow run did not start within ${this.RUN_START_TIMEOUT}ms.`);
  }

  /**
   * Polls the specific workflow run until it reaches a completed state.
   */
  private async monitorRun(
    octokit: Octokit,
    owner: string,
    repo: string,
    runId: number,
    timeoutMs: number
  ): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const { data: run } = await octokit.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runId
      });

      const terminalStates = ['completed', 'action_required', 'cancelled', 'failure', 'neutral', 'skipped', 'success', 'timed_out'];
      
      // Note: 'status' is usually 'queued', 'in_progress', or 'completed'.
      // If status is completed, we check conclusion.
      if (run.status === 'completed' || (run.conclusion && terminalStates.includes(run.conclusion))) {
        return run;
      }

      await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL));
    }

    throw new Error(`Timeout: Workflow run ${runId} did not complete within ${timeoutMs}ms.`);
  }

  /**
   * Retrieves list of artifacts produced by the workflow run.
   */
  private async getArtifacts(
    octokit: Octokit,
    owner: string,
    repo: string,
    runId: number
  ): Promise<ArtifactSummary[]> {
    try {
      const { data } = await octokit.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: runId
      });

      return data.artifacts.map(art => ({
        id: art.id,
        name: art.name,
        downloadUrl: art.archive_download_url,
        sizeInBytes: art.size_in_bytes,
        createdAt: art.created_at || new Date().toISOString()
      }));
    } catch (error) {
      // Non-critical error, return empty artifacts list if retrieval fails
      console.warn(`Failed to retrieve artifacts for run ${runId}`, error);
      return [];
    }
  }

  /**
   * Helper to download an artifact buffer (e.g., for uploading to Google Drive).
   * Note: The download URL from listArtifacts is a redirect. This method handles the actual stream retrieval.
   */
  public async downloadArtifact(config: ProjectExecutionConfig, artifactId: number): Promise<ArrayBuffer> {
    const { owner, repo } = this.parseRepository(config.repository);
    const octokit = new Octokit({ auth: config.authToken });

    const { data } = await octokit.actions.downloadArtifact({
      owner,
      repo,
      artifact_id: artifactId,
      archive_format: 'zip',
    });

    return data as ArrayBuffer;
  }
}