import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Placeholder for a custom hook to get authentication context
// In a real app, this would provide user info, Google auth tokens, and GitHub tokens.
const useAuth = () => ({
    // Assuming the user has logged in with Google and we have a GitHub token
    // This token would be obtained via an OAuth flow.
    githubToken: process.env.REACT_APP_GITHUB_TOKEN || 'ghp_your_placeholder_token',
    googleUser: {
        name: 'AI Programmer',
        email: 'ai.programmer@example.com',
    },
    isAuthenticated: true,
});

// --- Type Definitions for GitHub API responses ---

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    owner: {
        login: string;
    };
}

interface GitHubWorkflow {
    id: number;
    name: string;
    path: string;
    state: 'active' | 'disabled_manually' | 'disabled_inactivity';
}

interface GitHubWorkflowRun {
    id: number;
    name: string;
    status: 'completed' | 'in_progress' | 'queued';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
    html_url: string;
    created_at: string;
    actor: {
        login: string;
    };
}

// --- API Service ---
// In a real application, this would be in a separate `services` directory.

const GITHUB_API_BASE = 'https://api.github.com';

const githubApiFetch = async (endpoint: string, token: string, options: RequestInit = {}) => {
    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `GitHub API request failed: ${response.statusText}`);
    }
    // For POST requests that might not return a body on success
    if (response.status === 204) {
        return null;
    }
    return response.json();
};

const fetchUserRepos = (token: string): Promise<GitHubRepo[]> => {
    return githubApiFetch('/user/repos?sort=updated&per_page=100', token);
};

const fetchRepoWorkflows = (token:string, owner: string, repo: string): Promise<{ workflows: GitHubWorkflow[] }> => {
    return githubApiFetch(`/repos/${owner}/${repo}/actions/workflows`, token);
};

const fetchWorkflowRuns = (token: string, owner: string, repo: string, workflowId: number): Promise<{ workflow_runs: GitHubWorkflowRun[] }> => {
    return githubApiFetch(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`, token);
};

const triggerWorkflowRun = (token: string, owner: string, repo: string, workflowId: number, ref: string = 'main'): Promise<Response> => {
    return githubApiFetch(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, token, {
        method: 'POST',
        body: JSON.stringify({ ref }),
    });
};


// --- UI Components (Placeholders) ---
// In a real app, these would be imported from a UI library like Material-UI, Ant Design, or a custom component library.

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} className={className}>
        {children}
    </div>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
    <button
        style={{
            padding: '10px 15px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            margin: '0 5px',
            opacity: props.disabled ? 0.5 : 1,
        }}
        {...props}
    />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
     <select
        style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: 'white',
        }}
        {...props}
    />
);

const Spinner: React.FC = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>Loading...</div>;

const Alert: React.FC<{ message: string; type: 'error' | 'info' }> = ({ message, type }) => (
    <div style={{ padding: '15px', margin: '15px 0', border: `1px solid ${type === 'error' ? 'red' : 'blue'}`, color: type === 'error' ? 'red' : 'blue', backgroundColor: type === 'error' ? '#fdd' : '#ddf', borderRadius: '4px' }}>
        {message}
    </div>
);


// --- Main View Component ---

const DevOpsControlView: React.FC = () => {
    const { githubToken, isAuthenticated } = useAuth();

    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>('');

    const [workflows, setWorkflows] = useState<GitHubWorkflow[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');

    const [workflowRuns, setWorkflowRuns] = useState<GitHubWorkflowRun[]>([]);

    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
        repos: false,
        workflows: false,
        runs: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [triggering, setTriggering] = useState(false);

    const currentRepo = useMemo(() => repos.find(r => r.full_name === selectedRepo), [repos, selectedRepo]);
    const currentWorkflow = useMemo(() => workflows.find(w => String(w.id) === selectedWorkflow), [workflows, selectedWorkflow]);

    const handleLoading = (key: string, value: boolean) => {
        setIsLoading(prev => ({ ...prev, [key]: value }));
    };

    // Fetch repositories
    useEffect(() => {
        if (!isAuthenticated || !githubToken) return;

        const loadRepos = async () => {
            handleLoading('repos', true);
            setError(null);
            try {
                const userRepos = await fetchUserRepos(githubToken);
                setRepos(userRepos);
            } catch (err: any) {
                setError(`Failed to fetch repositories: ${err.message}`);
            } finally {
                handleLoading('repos', false);
            }
        };

        loadRepos();
    }, [isAuthenticated, githubToken]);

    // Fetch workflows when a repository is selected
    useEffect(() => {
        if (!currentRepo || !githubToken) {
            setWorkflows([]);
            setWorkflowRuns([]);
            setSelectedWorkflow('');
            return;
        }

        const loadWorkflows = async () => {
            handleLoading('workflows', true);
            setError(null);
            setWorkflows([]);
            setWorkflowRuns([]);
            setSelectedWorkflow('');
            try {
                const { workflows: repoWorkflows } = await fetchRepoWorkflows(githubToken, currentRepo.owner.login, currentRepo.name);
                setWorkflows(repoWorkflows.filter(w => w.state === 'active'));
            } catch (err: any) {
                setError(`Failed to fetch workflows for ${currentRepo.full_name}: ${err.message}`);
            } finally {
                handleLoading('workflows', false);
            }
        };

        loadWorkflows();
    }, [currentRepo, githubToken]);

    // Fetch workflow runs when a workflow is selected
    const loadWorkflowRuns = useCallback(async () => {
        if (!currentRepo || !currentWorkflow || !githubToken) {
            setWorkflowRuns([]);
            return;
        }

        handleLoading('runs', true);
        setError(null);
        try {
            const { workflow_runs } = await fetchWorkflowRuns(githubToken, currentRepo.owner.login, currentRepo.name, currentWorkflow.id);
            setWorkflowRuns(workflow_runs);
        } catch (err: any) {
            setError(`Failed to fetch runs for ${currentWorkflow.name}: ${err.message}`);
        } finally {
            handleLoading('runs', false);
        }
    }, [currentRepo, currentWorkflow, githubToken]);

    useEffect(() => {
        loadWorkflowRuns();
    }, [loadWorkflowRuns]);


    const handleTriggerWorkflow = async () => {
        if (!currentRepo || !currentWorkflow || !githubToken) return;

        setTriggering(true);
        setError(null);
        try {
            await triggerWorkflowRun(githubToken, currentRepo.owner.login, currentRepo.name, currentWorkflow.id);
            // Give GitHub Actions a moment to create the run, then refresh
            setTimeout(() => {
                loadWorkflowRuns();
            }, 3000);
        } catch (err: any) {
            setError(`Failed to trigger workflow: ${err.message}`);
        } finally {
            setTriggering(false);
        }
    };
    
    const getStatusIndicator = (status: string | null, conclusion: string | null) => {
        if (status === 'in_progress' || status === 'queued') {
            return <span style={{ color: '#f0ad4e' }}>● In Progress</span>;
        }
        if (status === 'completed') {
            switch (conclusion) {
                case 'success':
                    return <span style={{ color: '#5cb85c' }}>✔ Success</span>;
                case 'failure':
                    return <span style={{ color: '#d9534f' }}>✖ Failure</span>;
                case 'cancelled':
                    return <span style={{ color: '#777' }}>- Cancelled</span>;
                default:
                    return <span style={{ color: '#5bc0de' }}>- {conclusion || 'Completed'}</span>;
            }
        }
        return <span>- {status}</span>;
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#f4f7f9' }}>
            <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>DevOps Control Center</h1>

            {!isAuthenticated && <Alert message="Please log in to manage your DevOps projects." type="info" />}
            {error && <Alert message={error} type="error" />}

            {isAuthenticated && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                    {/* Left Column: Selectors */}
                    <div>
                        <Card>
                            <h2>Project & Workflow Selection</h2>
                            <div style={{ marginBottom: '16px' }}>
                                <label htmlFor="repo-select" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>GitHub Repository</label>
                                {isLoading.repos ? <Spinner /> : (
                                    <Select id="repo-select" value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
                                        <option value="">-- Select a Repository --</option>
                                        {repos.map(repo => (
                                            <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>
                                        ))}
                                    </Select>
                                )}
                            </div>
                            {selectedRepo && (
                                <div>
                                    <label htmlFor="workflow-select" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>CI/CD Workflow</label>
                                    {isLoading.workflows ? <Spinner /> : (
                                        <Select id="workflow-select" value={selectedWorkflow} onChange={e => setSelectedWorkflow(e.target.value)} disabled={!workflows.length}>
                                            <option value="">-- Select a Workflow --</option>
                                            {workflows.map(wf => (
                                                <option key={wf.id} value={wf.id}>{wf.name}</option>
                                            ))}
                                        </Select>
                                    )}
                                </div>
                            )}
                        </Card>
                        {currentRepo && (
                             <Card>
                                <h3>Project Integrations</h3>
                                <p>Link this project to other services.</p>
                                <Button onClick={() => alert('Google Drive integration logic would go here.')}>
                                    🔗 Link to Google Drive
                                </Button>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Details and Actions */}
                    <div>
                        {currentWorkflow && (
                            <Card>
                                <h2>{currentWorkflow.name}</h2>
                                <p>Control and monitor runs for this workflow.</p>
                                <Button onClick={handleTriggerWorkflow} disabled={triggering}>
                                    {triggering ? 'Triggering...' : '🚀 Run Workflow'}
                                </Button>
                                <Button onClick={loadWorkflowRuns} disabled={isLoading.runs}>
                                    {isLoading.runs ? 'Refreshing...' : '🔄 Refresh Runs'}
                                </Button>
                            </Card>
                        )}

                        <Card>
                            <h3>Workflow Run History</h3>
                            {isLoading.runs ? <Spinner /> : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                                            <th style={{ padding: '8px' }}>Status</th>
                                            <th style={{ padding: '8px' }}>Run ID</th>
                                            <th style={{ padding: '8px' }}>Triggered By</th>
                                            <th style={{ padding: '8px' }}>Timestamp</th>
                                            <th style={{ padding: '8px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workflowRuns.length > 0 ? workflowRuns.map(run => (
                                            <tr key={run.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '8px' }}>{getStatusIndicator(run.status, run.conclusion)}</td>
                                                <td style={{ padding: '8px' }}>#{run.id}</td>
                                                <td style={{ padding: '8px' }}>{run.actor.login}</td>
                                                <td style={{ padding: '8px' }}>{new Date(run.created_at).toLocaleString()}</td>
                                                <td style={{ padding: '8px' }}>
                                                    <a href={run.html_url} target="_blank" rel="noopener noreferrer">View on GitHub</a>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#777' }}>
                                                    {selectedWorkflow ? 'No runs found for this workflow.' : 'Select a repository and workflow to see run history.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevOpsControlView;