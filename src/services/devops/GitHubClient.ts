import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Interface representing a GitHub User.
 */
export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

/**
 * Interface representing a GitHub Repository.
 */
export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  mirror_url: string | null;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
    node_id: string;
  } | null;
  allow_forking: boolean;
  is_template: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
}

/**
 * Interface representing a GitHub Issue.
 */
export interface GitHubIssue {
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  id: number;
  node_id: string;
  number: number;
  title: string;
  user: GitHubUser;
  labels: any[];
  state: 'open' | 'closed';
  locked: boolean;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  milestone: any | null;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  author_association: string;
  active_lock_reason: string | null;
  body: string | null;
}

/**
 * Interface representing a GitHub Action Workflow.
 */
export interface GitHubWorkflow {
  id: number;
  node_id: string;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
}

/**
 * Interface representing a GitHub Workflow Run.
 */
export interface GitHubWorkflowRun {
  id: number;
  name: string;
  node_id: string;
  head_branch: string;
  head_sha: string;
  path: string;
  display_title: string;
  run_number: number;
  event: string;
  status: string;
  conclusion: string | null;
  workflow_id: number;
  check_suite_id: number;
  check_suite_node_id: string;
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  actor: GitHubUser;
  run_attempt: number;
  referenced_workflows: any[];
  run_started_at: string;
  triggering_actor: GitHubUser;
}

/**
 * Options for creating a repository.
 */
export interface CreateRepoOptions {
  name: string;
  description?: string;
  homepage?: string;
  private?: boolean;
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  is_template?: boolean;
  auto_init?: boolean;
  gitignore_template?: string;
  license_template?: string;
}

/**
 * Options for creating an issue.
 */
export interface CreateIssueOptions {
  title: string;
  body?: string;
  assignees?: string[];
  milestone?: number;
  labels?: string[];
}

/**
 * Options for creating or updating a file.
 */
export interface CreateFileOptions {
  message: string;
  content: string; // Base64 encoded content
  sha?: string; // Required if updating an existing file
  branch?: string;
  committer?: {
    name: string;
    email: string;
  };
  author?: {
    name: string;
    email: string;
  };
}

/**
 * Service class for interacting with the GitHub API.
 * Handles authentication, repository management, issues, and workflows.
 */
export class GitHubClient {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  /**
   * Initializes the GitHub client.
   * @param token The GitHub Personal Access Token or OAuth token.
   * @param baseUrl The base URL for the GitHub API (defaults to public GitHub API).
   */
  constructor(token: string, baseUrl: string = 'https://api.github.com') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          console.error(`GitHub API Error [${status}]:`, data);
          throw new Error(`GitHub API Error: ${data.message || status}`);
        }
        throw error;
      }
    );
  }

  // ==========================================
  // User Operations
  // ==========================================

  /**
   * Get the authenticated user's profile.
   */
  public async getAuthenticatedUser(): Promise<GitHubUser> {
    const response = await this.client.get<GitHubUser>('/user');
    return response.data;
  }

  // ==========================================
  // Repository Operations
  // ==========================================

  /**
   * List repositories for the authenticated user.
   * @param visibility Filter by visibility (all, public, private).
   * @param sort Property to sort by.
   */
  public async listRepositories(
    visibility: 'all' | 'public' | 'private' = 'all',
    sort: 'created' | 'updated' | 'pushed' | 'full_name' = 'updated'
  ): Promise<GitHubRepository[]> {
    const response = await this.client.get<GitHubRepository[]>('/user/repos', {
      params: { visibility, sort },
    });
    return response.data;
  }

  /**
   * Get a specific repository by owner and name.
   */
  public async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const response = await this.client.get<GitHubRepository>(`/repos/${owner}/${repo}`);
    return response.data;
  }

  /**
   * Create a new repository.
   */
  public async createRepository(options: CreateRepoOptions): Promise<GitHubRepository> {
    const response = await this.client.post<GitHubRepository>('/user/repos', options);
    return response.data;
  }

  /**
   * Delete a repository.
   */
  public async deleteRepository(owner: string, repo: string): Promise<void> {
    await this.client.delete(`/repos/${owner}/${repo}`);
  }

  // ==========================================
  // File Operations (Content)
  // ==========================================

  /**
   * Get the content of a file or directory.
   */
  public async getContent(owner: string, repo: string, path: string, ref?: string): Promise<any> {
    const params = ref ? { ref } : {};
    const response = await this.client.get(`/repos/${owner}/${repo}/contents/${path}`, { params });
    return response.data;
  }

  /**
   * Create or update a file in a repository.
   * Useful for saving project files from Drive to GitHub.
   */
  public async createOrUpdateFile(owner: string, repo: string, path: string, options: CreateFileOptions): Promise<any> {
    const response = await this.client.put(`/repos/${owner}/${repo}/contents/${path}`, options);
    return response.data;
  }

  // ==========================================
  // Issue Tracking
  // ==========================================

  /**
   * List issues for a repository.
   */
  public async listIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<GitHubIssue[]> {
    const response = await this.client.get<GitHubIssue[]>(`/repos/${owner}/${repo}/issues`, {
      params: { state },
    });
    return response.data;
  }

  /**
   * Create a new issue.
   */
  public async createIssue(owner: string, repo: string, options: CreateIssueOptions): Promise<GitHubIssue> {
    const response = await this.client.post<GitHubIssue>(`/repos/${owner}/${repo}/issues`, options);
    return response.data;
  }

  /**
   * Add a comment to an issue.
   */
  public async createIssueComment(owner: string, repo: string, issueNumber: number, body: string): Promise<any> {
    const response = await this.client.post(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
      body,
    });
    return response.data;
  }

  // ==========================================
  // GitHub Actions (Workflows)
  // ==========================================

  /**
   * List workflows for a repository.
   */
  public async listWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
    const response = await this.client.get<{ workflows: GitHubWorkflow[] }>(`/repos/${owner}/${repo}/actions/workflows`);
    return response.data.workflows;
  }

  /**
   * Trigger a workflow dispatch event.
   * @param workflowId The ID or filename of the workflow.
   * @param ref The git reference (branch or tag) for the workflow run.
   * @param inputs Input keys and values configured in the workflow file.
   */
  public async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: string | number,
    ref: string,
    inputs?: Record<string, any>
  ): Promise<void> {
    await this.client.post(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      ref,
      inputs,
    });
  }

  /**
   * List runs for a specific workflow.
   */
  public async listWorkflowRuns(
    owner: string,
    repo: string,
    workflowId: string | number,
    status?: string
  ): Promise<GitHubWorkflowRun[]> {
    const params = status ? { status } : {};
    const response = await this.client.get<{ workflow_runs: GitHubWorkflowRun[] }>(
      `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`,
      { params }
    );
    return response.data.workflow_runs;
  }

  /**
   * Get details of a specific workflow run.
   */
  public async getWorkflowRun(owner: string, repo: string, runId: number): Promise<GitHubWorkflowRun> {
    const response = await this.client.get<GitHubWorkflowRun>(`/repos/${owner}/${repo}/actions/runs/${runId}`);
    return response.data;
  }
}