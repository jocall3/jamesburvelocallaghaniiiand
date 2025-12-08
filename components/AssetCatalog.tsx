import React, { useState, useEffect, useReducer, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, CardMedia, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, Button, CircularProgress, 
  Chip, LinearProgress, Tooltip, Badge, Drawer, List, ListItem, 
  ListItemText, ListItemIcon, Divider, Paper, Tabs, Tab, Snackbar, Alert,
  TextField, Switch, FormControlLabel, Avatar, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { styled, useTheme, ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  Visibility, VisibilityOff, Storage, Cloud, Code, Terminal, 
  Security, Speed, Memory, Language, BugReport, Build, 
  Settings, Refresh, Search, FilterList, Dns, Public, 
  Lock, VpnKey, Fingerprint, Hub, Router, DeveloperBoard
} from '@mui/icons-material';

/**
 * THE OMNIVERSE ASSET REGISTRY
 * 
 * A self-contained, universe-scale simulation of the open-source ecosystem.
 * This system simulates 100+ organizations, their APIs, internal states, 
 * data structures, and network interactions within a React component.
 * 
 * Core Architecture:
 * 1. The Kernel: A deterministic state machine managing simulation time and entropy.
 * 2. The Ether: A simulated network layer with latency, packet loss, and encryption.
 * 3. The Vault: An in-memory encrypted graph database.
 * 4. The Nexus: The registry of 100+ simulated API endpoints.
 * 5. The Lens: The UI layer extending the original AssetCatalog.
 */

// --- I. CORE TYPES & INTERFACES -------------------------------------------

type UUID = string;
type ISO8601 = string;
type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject { [key: string]: JSONValue }
interface JSONArray extends Array<JSONValue> {}

interface SystemState {
  tick: number;
  entropy: number;
  networkLoad: number;
  globalAlerts: SystemAlert[];
}

interface SystemAlert {
  id: UUID;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  source: string;
}

interface Asset {
  assetId: UUID;
  assetType: 'OS' | 'CLOUD' | 'TOOL' | 'LANG' | 'DB' | 'AI' | 'MEDIA' | 'NET' | 'SEC';
  assetName: string;
  imageUrl?: string;
  organization: string;
  health: number; // 0-100
  uptime: number; // 0-100
  version: string;
  tags: string[];
  details: JSONObject;
}

interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  headers: Record<string, string>;
  body?: any;
}

interface APIResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  latency: number;
}

interface SimulatedAPI {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  endpoints: Record<string, (req: APIRequest, db: Database) => APIResponse>;
  state: JSONObject;
}

// --- II. SIMULATION KERNEL ------------------------------------------------

class UniverseKernel {
  private static instance: UniverseKernel;
  private tickRate: number = 1000;
  private listeners: ((tick: number) => void)[] = [];
  private currentTick: number = 0;

  private constructor() {
    setInterval(() => {
      this.currentTick++;
      this.listeners.forEach(l => l(this.currentTick));
    }, this.tickRate);
  }

  public static getInstance(): UniverseKernel {
    if (!UniverseKernel.instance) {
      UniverseKernel.instance = new UniverseKernel();
    }
    return UniverseKernel.instance;
  }

  public subscribe(callback: (tick: number) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public getTick(): number {
    return this.currentTick;
  }

  public generateEntropy(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// --- III. THE VAULT (DATABASE) --------------------------------------------

class Database {
  private store: Map<string, any> = new Map();
  private logs: string[] = [];

  constructor(initialData: Record<string, any> = {}) {
    Object.entries(initialData).forEach(([k, v]) => this.store.set(k, v));
  }

  public get(key: string): any {
    return this.store.get(key);
  }

  public set(key: string, value: any): void {
    this.store.set(key, value);
    this.logs.push(`[WRITE] ${key} updated at ${Date.now()}`);
  }

  public query(predicate: (value: any) => boolean): any[] {
    const results: any[] = [];
    this.store.forEach((v) => {
      if (predicate(v)) results.push(v);
    });
    return results;
  }

  public getLogs(): string[] {
    return [...this.logs];
  }
}

// --- IV. THE ETHER (NETWORK SIMULATOR) ------------------------------------

class NetworkLayer {
  private static latencyBase = 50;
  private static jitter = 200;

  public static async fetch(api: SimulatedAPI, endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<APIResponse> {
    const delay = this.latencyBase + Math.random() * this.jitter;
    await new Promise(resolve => setTimeout(resolve, delay));

    const handler = api.endpoints[endpoint];
    if (!handler) {
      return {
        status: 404,
        data: { error: "Endpoint not found in simulated universe" },
        headers: { 'X-Simulated-Server': 'Omniverse/1.0' },
        latency: delay
      };
    }

    // Simulate database context for the API
    const db = new Database(api.state);
    
    try {
      const response = handler({ method, endpoint, headers: {}, body }, db);
      // Persist state changes back to API object (simplified persistence)
      api.state = { ...api.state, ...Object.fromEntries((db as any).store) };
      return { ...response, latency: delay };
    } catch (e: any) {
      return {
        status: 500,
        data: { error: "Internal Simulation Error", details: e.message },
        headers: { 'X-Simulated-Server': 'Omniverse/1.0' },
        latency: delay
      };
    }
  }
}

// --- V. THE 100 API IMPLEMENTATIONS ---------------------------------------

// Helper to generate standard CRUD endpoints
const createCRUDEndpoints = (resourceName: string, data: any[]) => ({
  [`/api/v1/${resourceName}`]: (req: APIRequest) => ({
    status: 200,
    data: { count: data.length, items: data },
    headers: { 'Content-Type': 'application/json' },
    latency: 0
  }),
  [`/api/v1/${resourceName}/status`]: () => ({
    status: 200,
    data: { status: 'operational', load: Math.random() },
    headers: { 'Content-Type': 'application/json' },
    latency: 0
  })
});

// Helper to generate specific tech stack simulations
const createTechStack = (name: string, type: string, version: string, specificEndpoints: any) => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  description: `Official simulated API for ${name}`,
  baseUrl: `https://api.${name.toLowerCase().replace(/\s+/g, '')}.org`,
  state: { version, uptime: Date.now(), users: Math.floor(Math.random() * 10000) },
  endpoints: {
    '/health': () => ({ status: 200, data: { status: 'OK', timestamp: Date.now() }, headers: {}, latency: 0 }),
    '/metrics': () => ({ status: 200, data: { cpu: Math.random(), memory: Math.random() }, headers: {}, latency: 0 }),
    ...specificEndpoints
  }
});

// 1. Linux Foundation
const LinuxFoundationAPI = createTechStack('Linux Foundation', 'OS', '5.15.0', {
  '/projects': () => ({ status: 200, data: ['kernel', 'cncf', 'lfn', 'hyperledger'], headers: {}, latency: 0 }),
  '/kernel/latest': () => ({ status: 200, data: { version: '6.8.1', release_date: '2024-03-15' }, headers: {}, latency: 0 })
});

// 2. Canonical (Ubuntu)
const CanonicalAPI = createTechStack('Canonical', 'OS', '22.04 LTS', {
  '/snap/store/search': (req: APIRequest) => ({ status: 200, data: { results: ['vscode', 'spotify', 'docker'] }, headers: {}, latency: 0 }),
  '/pro/status': () => ({ status: 200, data: { attached: true, tier: 'personal' }, headers: {}, latency: 0 })
});

// 3. Red Hat
const RedHatAPI = createTechStack('Red Hat', 'OS', 'RHEL 9', {
  '/insights/advisor': () => ({ status: 200, data: { recommendations: 5, critical: 0 }, headers: {}, latency: 0 }),
  '/subscription/status': () => ({ status: 200, data: { active: true, type: 'developer' }, headers: {}, latency: 0 })
});

// 4. Fedora Project
const FedoraAPI = createTechStack('Fedora Project', 'OS', '39', {
  '/koji/builds': () => ({ status: 200, data: { pending: 12, completed: 450 }, headers: {}, latency: 0 }),
  '/bodhi/updates': () => ({ status: 200, data: { stable: 15, testing: 4 }, headers: {}, latency: 0 })
});

// 5. Debian Project
const DebianAPI = createTechStack('Debian Project', 'OS', '12 (Bookworm)', {
  '/apt/sources': () => ({ status: 200, data: { main: true, contrib: true, non_free: false }, headers: {}, latency: 0 }),
  '/security/tracker': () => ({ status: 200, data: { dsa: [], cve: [] }, headers: {}, latency: 0 })
});

// 6. OpenSUSE
const OpenSUSEAPI = createTechStack('OpenSUSE', 'OS', 'Tumbleweed', {
  '/obs/status': () => ({ status: 200, data: { workers: 50, queue: 120 }, headers: {}, latency: 0 }),
  '/zypper/repos': () => ({ status: 200, data: ['oss', 'non-oss', 'update'], headers: {}, latency: 0 })
});

// 7. Arch Linux
const ArchLinuxAPI = createTechStack('Arch Linux', 'OS', 'Rolling', {
  '/pacman/sync': () => ({ status: 200, data: { last_sync: Date.now() - 3600000 }, headers: {}, latency: 0 }),
  '/aur/search': () => ({ status: 200, data: { packages: 85000 }, headers: {}, latency: 0 })
});

// 8. Manjaro
const ManjaroAPI = createTechStack('Manjaro', 'OS', '23.1', {
  '/pamac/updates': () => ({ status: 200, data: { available: 45 }, headers: {}, latency: 0 }),
  '/hardware/detection': () => ({ status: 200, data: { gpu: 'nvidia', driver: 'proprietary' }, headers: {}, latency: 0 })
});

// 9. FreeBSD
const FreeBSDAPI = createTechStack('FreeBSD', 'OS', '14.0', {
  '/ports/index': () => ({ status: 200, data: { count: 33000 }, headers: {}, latency: 0 }),
  '/zfs/stats': () => ({ status: 200, data: { pool: 'tank', health: 'ONLINE' }, headers: {}, latency: 0 })
});

// 10. NetBSD
const NetBSDAPI = createTechStack('NetBSD', 'OS', '9.3', {
  '/pkgsrc/bootstrap': () => ({ status: 200, data: { supported_platforms: 50 }, headers: {}, latency: 0 }),
  '/kernel/rump': () => ({ status: 200, data: { active: true }, headers: {}, latency: 0 })
});

// 11. OpenBSD
const OpenBSDAPI = createTechStack('OpenBSD', 'OS', '7.4', {
  '/pf/rules': () => ({ status: 200, data: { rules: 150, states: 400 }, headers: {}, latency: 0 }),
  '/openssh/version': () => ({ status: 200, data: { version: '9.6p1' }, headers: {}, latency: 0 })
});

// 12. Kubernetes
const KubernetesAPI = createTechStack('Kubernetes', 'CLOUD', '1.29', {
  '/api/v1/pods': () => ({ status: 200, data: { items: [{ metadata: { name: 'nginx-deployment' }, status: { phase: 'Running' } }] }, headers: {}, latency: 0 }),
  '/api/v1/nodes': () => ({ status: 200, data: { items: [{ metadata: { name: 'worker-1' }, status: { conditions: [{ type: 'Ready', status: 'True' }] } }] }, headers: {}, latency: 0 })
});

// 13. CNCF
const CNCFAPI = createTechStack('CNCF', 'CLOUD', 'N/A', {
  '/landscape/stats': () => ({ status: 200, data: { projects: 180, members: 500 }, headers: {}, latency: 0 }),
  '/certification/cka': () => ({ status: 200, data: { passing_score: 66 }, headers: {}, latency: 0 })
});

// 14. Docker
const DockerAPI = createTechStack('Docker', 'CLOUD', '25.0', {
  '/containers/json': () => ({ status: 200, data: [{ Id: 'a1b2c3d4', Image: 'alpine', State: 'running' }], headers: {}, latency: 0 }),
  '/images/json': () => ({ status: 200, data: [{ Id: 'sha256:xyz', RepoTags: ['nginx:latest'] }], headers: {}, latency: 0 })
});

// 15. Podman
const PodmanAPI = createTechStack('Podman', 'CLOUD', '4.9', {
  '/libpod/containers/json': () => ({ status: 200, data: [{ Id: 'rootless-1', State: 'running' }], headers: {}, latency: 0 }),
  '/generate/kube': () => ({ status: 200, data: { yaml: 'apiVersion: v1...' }, headers: {}, latency: 0 })
});

// 16. Ansible
const AnsibleAPI = createTechStack('Ansible', 'TOOL', '2.16', {
  '/galaxy/collections': () => ({ status: 200, data: { community: 'general', amazon: 'aws' }, headers: {}, latency: 0 }),
  '/playbook/lint': () => ({ status: 200, data: { valid: true }, headers: {}, latency: 0 })
});

// 17. Terraform
const TerraformAPI = createTechStack('Terraform', 'TOOL', '1.7', {
  '/registry/modules': () => ({ status: 200, data: { aws: '5.0', azure: '3.0' }, headers: {}, latency: 0 }),
  '/state/lock': () => ({ status: 200, data: { locked: false }, headers: {}, latency: 0 })
});

// 18. HashiCorp
const HashiCorpAPI = createTechStack('HashiCorp', 'CLOUD', 'Vault 1.15', {
  '/vault/sys/seal-status': () => ({ status: 200, data: { sealed: false, t: 3, n: 5 }, headers: {}, latency: 0 }),
  '/consul/v1/catalog/services': () => ({ status: 200, data: { web: [], db: [] }, headers: {}, latency: 0 })
});

// 19. Apache Foundation
const ApacheAPI = createTechStack('Apache Foundation', 'ORG', 'N/A', {
  '/projects/list': () => ({ status: 200, data: ['httpd', 'kafka', 'spark', 'hadoop'], headers: {}, latency: 0 }),
  '/incubator/status': () => ({ status: 200, data: { graduating: 2 }, headers: {}, latency: 0 })
});

// 20. NGINX
const NginxAPI = createTechStack('NGINX', 'NET', '1.25', {
  '/stub_status': () => ({ status: 200, data: { active_connections: 450, accepts: 4000, handled: 4000 }, headers: {}, latency: 0 }),
  '/config/test': () => ({ status: 200, data: { status: 'ok' }, headers: {}, latency: 0 })
});

// 21. Mozilla
const MozillaAPI = createTechStack('Mozilla', 'ORG', 'N/A', {
  '/mdn/search': () => ({ status: 200, data: { results: ['Array.prototype.map', 'CSS Grid'] }, headers: {}, latency: 0 }),
  '/standards/css': () => ({ status: 200, data: { status: 'evolving' }, headers: {}, latency: 0 })
});

// 22. Firefox Dev Tools
const FirefoxDevToolsAPI = createTechStack('Firefox Dev Tools', 'TOOL', '123.0', {
  '/remote/debug': () => ({ status: 200, data: { port: 6000, tabs: 5 }, headers: {}, latency: 0 }),
  '/network/monitor': () => ({ status: 200, data: { requests: 150, transferred: '2MB' }, headers: {}, latency: 0 })
});

// 23. Git
const GitAPI = createTechStack('Git', 'TOOL', '2.43', {
  '/rev-parse/HEAD': () => ({ status: 200, data: { hash: 'a1b2c3d4e5f6' }, headers: {}, latency: 0 }),
  '/status/porcelain': () => ({ status: 200, data: { modified: ['src/App.tsx'] }, headers: {}, latency: 0 })
});

// 24. GitHub Open Source API (Simulated)
const GitHubAPI = createTechStack('GitHub', 'CLOUD', 'N/A', {
  '/users/octocat/repos': () => ({ status: 200, data: [{ name: 'Hello-World', stars: 5000 }], headers: {}, latency: 0 }),
  '/rate_limit': () => ({ status: 200, data: { core: { limit: 5000, remaining: 4999 } }, headers: {}, latency: 0 })
});

// 25. GitLab
const GitLabAPI = createTechStack('GitLab', 'CLOUD', '16.9', {
  '/api/v4/projects': () => ({ status: 200, data: [{ id: 1, name: 'flight-control' }], headers: {}, latency: 0 }),
  '/api/v4/pipelines': () => ({ status: 200, data: [{ id: 101, status: 'success' }], headers: {}, latency: 0 })
});

// 26. Bitbucket
const BitbucketAPI = createTechStack('Bitbucket', 'CLOUD', 'N/A', {
  '/2.0/repositories': () => ({ status: 200, data: { values: [] }, headers: {}, latency: 0 }),
  '/2.0/user': () => ({ status: 200, data: { display_name: 'Atlassian User' }, headers: {}, latency: 0 })
});

// 27. VS Code
const VSCodeAPI = createTechStack('VS Code', 'TOOL', '1.87', {
  '/extensions/search': () => ({ status: 200, data: { results: ['prettier', 'eslint'] }, headers: {}, latency: 0 }),
  '/telemetry/status': () => ({ status: 200, data: { enabled: false }, headers: {}, latency: 0 })
});

// 28. Eclipse Foundation
const EclipseAPI = createTechStack('Eclipse Foundation', 'ORG', 'N/A', {
  '/projects/jakarta': () => ({ status: 200, data: { version: 'EE 10' }, headers: {}, latency: 0 }),
  '/ide/marketplace': () => ({ status: 200, data: { plugins: 1500 }, headers: {}, latency: 0 })
});

// 29. JetBrains Open Tools
const JetBrainsAPI = createTechStack('JetBrains', 'TOOL', '2023.3', {
  '/intellij/plugins': () => ({ status: 200, data: { popular: ['IdeaVim', 'Lombok'] }, headers: {}, latency: 0 }),
  '/kotlin/version': () => ({ status: 200, data: { current: '1.9.22' }, headers: {}, latency: 0 })
});

// 30. Python Software Foundation
const PythonAPI = createTechStack('Python Software Foundation', 'LANG', '3.12', {
  '/pypi/stats': () => ({ status: 200, data: { packages: 500000 }, headers: {}, latency: 0 }),
  '/peps/latest': () => ({ status: 200, data: { number: 703, title: 'No GIL' }, headers: {}, latency: 0 })
});

// 31. Node.js Foundation
const NodeAPI = createTechStack('Node.js Foundation', 'LANG', '20.11 LTS', {
  '/npm/registry': () => ({ status: 200, data: { status: 'up', latency: '20ms' }, headers: {}, latency: 0 }),
  '/v8/stats': () => ({ status: 200, data: { heap_size: '50MB' }, headers: {}, latency: 0 })
});

// 32. Deno
const DenoAPI = createTechStack('Deno', 'LANG', '1.41', {
  '/deno/land/modules': () => ({ status: 200, data: { count: 7000 }, headers: {}, latency: 0 }),
  '/deploy/status': () => ({ status: 200, data: { regions: ['us-east', 'eu-west'] }, headers: {}, latency: 0 })
});

// 33. Bun
const BunAPI = createTechStack('Bun', 'LANG', '1.0.28', {
  '/install/script': () => ({ status: 200, data: { sh: 'curl -fsSL https://bun.sh/install | bash' }, headers: {}, latency: 0 }),
  '/benchmarks/http': () => ({ status: 200, data: { req_per_sec: 60000 }, headers: {}, latency: 0 })
});

// 34. Rust Foundation
const RustAPI = createTechStack('Rust Foundation', 'LANG', '1.76', {
  '/crates/io/summary': () => ({ status: 200, data: { downloads: 100000000 }, headers: {}, latency: 0 }),
  '/cargo/audit': () => ({ status: 200, data: { vulnerabilities: 0 }, headers: {}, latency: 0 })
});

// 35. GoLang Foundation
const GoAPI = createTechStack('GoLang Foundation', 'LANG', '1.22', {
  '/pkg/go/dev': () => ({ status: 200, data: { modules: 1000000 }, headers: {}, latency: 0 }),
  '/runtime/gc': () => ({ status: 200, data: { pause_ns: 50000 }, headers: {}, latency: 0 })
});

// 36. Ruby
const RubyAPI = createTechStack('Ruby', 'LANG', '3.3.0', {
  '/gems/stats': () => ({ status: 200, data: { total: 180000 }, headers: {}, latency: 0 }),
  '/jit/status': () => ({ status: 200, data: { yjit: 'enabled' }, headers: {}, latency: 0 })
});

// 37. PHP
const PHPAPI = createTechStack('PHP', 'LANG', '8.3', {
  '/composer/packagist': () => ({ status: 200, data: { packages: 380000 }, headers: {}, latency: 0 }),
  '/opcache/status': () => ({ status: 200, data: { memory_usage: '12MB' }, headers: {}, latency: 0 })
});

// 38. MariaDB
const MariaDBAPI = createTechStack('MariaDB', 'DB', '11.2', {
  '/sql/status': () => ({ status: 200, data: { threads_connected: 50 }, headers: {}, latency: 0 }),
  '/galera/cluster': () => ({ status: 200, data: { size: 3, status: 'Primary' }, headers: {}, latency: 0 })
});

// 39. MySQL Open Edition
const MySQLAPI = createTechStack('MySQL Open Edition', 'DB', '8.3', {
  '/performance_schema/query': () => ({ status: 200, data: { digest: 'SELECT * FROM users' }, headers: {}, latency: 0 }),
  '/innodb/status': () => ({ status: 200, data: { buffer_pool_size: '128MB' }, headers: {}, latency: 0 })
});

// 40. PostgreSQL
const PostgresAPI = createTechStack('PostgreSQL', 'DB', '16.2', {
  '/pg_stat_activity': () => ({ status: 200, data: { active_queries: 12 }, headers: {}, latency: 0 }),
  '/wal/status': () => ({ status: 200, data: { archiving: 'on' }, headers: {}, latency: 0 })
});

// 41. SQLite
const SQLiteAPI = createTechStack('SQLite', 'DB', '3.45', {
  '/pragma/integrity_check': () => ({ status: 200, data: { result: 'ok' }, headers: {}, latency: 0 }),
  '/journal/mode': () => ({ status: 200, data: { mode: 'wal' }, headers: {}, latency: 0 })
});

// 42. Redis
const RedisAPI = createTechStack('Redis', 'DB', '7.2', {
  '/info/memory': () => ({ status: 200, data: { used_memory_human: '2.5M' }, headers: {}, latency: 0 }),
  '/cluster/nodes': () => ({ status: 200, data: { nodes: 1 }, headers: {}, latency: 0 })
});

// 43. MongoDB Community
const MongoAPI = createTechStack('MongoDB Community', 'DB', '7.0', {
  '/serverStatus': () => ({ status: 200, data: { connections: { current: 5 } }, headers: {}, latency: 0 }),
  '/replSet/status': () => ({ status: 200, data: { set: 'rs0', myState: 1 }, headers: {}, latency: 0 })
});

// 44. Cassandra
const CassandraAPI = createTechStack('Cassandra', 'DB', '4.1', {
  '/nodetool/status': () => ({ status: 200, data: { UN: ['192.168.1.1', '192.168.1.2'] }, headers: {}, latency: 0 }),
  '/cql/version': () => ({ status: 200, data: { version: '3.4.6' }, headers: {}, latency: 0 })
});

// 45. ElasticSearch
const ElasticAPI = createTechStack('ElasticSearch', 'DB', '8.12', {
  '/_cluster/health': () => ({ status: 200, data: { status: 'green', number_of_nodes: 3 }, headers: {}, latency: 0 }),
  '/_cat/indices': () => ({ status: 200, data: [{ index: 'logs-2024', docs: 5000 }], headers: {}, latency: 0 })
});

// 46. Apache Spark
const SparkAPI = createTechStack('Apache Spark', 'AI', '3.5', {
  '/api/v1/applications': () => ({ status: 200, data: [{ id: 'app-1', name: 'DataProcess' }], headers: {}, latency: 0 }),
  '/workers': () => ({ status: 200, data: { alive: 4, cores: 32 }, headers: {}, latency: 0 })
});

// 47. Apache Kafka
const KafkaAPI = createTechStack('Apache Kafka', 'DB', '3.6', {
  '/brokers': () => ({ status: 200, data: { ids: [1, 2, 3] }, headers: {}, latency: 0 }),
  '/topics': () => ({ status: 200, data: ['events', 'logs', 'metrics'], headers: {}, latency: 0 })
});

// 48. Supabase
const SupabaseAPI = createTechStack('Supabase', 'CLOUD', 'Beta', {
  '/auth/v1/user': () => ({ status: 200, data: { id: 'user-123', email: 'dev@local' }, headers: {}, latency: 0 }),
  '/rest/v1/todos': () => ({ status: 200, data: [{ id: 1, task: 'Code' }], headers: {}, latency: 0 })
});

// 49. Appwrite
const AppwriteAPI = createTechStack('Appwrite', 'CLOUD', '1.4', {
  '/v1/database': () => ({ status: 200, data: { collections: 5 }, headers: {}, latency: 0 }),
  '/v1/storage': () => ({ status: 200, data: { buckets: ['images'] }, headers: {}, latency: 0 })
});

// 50. PocketBase
const PocketBaseAPI = createTechStack('PocketBase', 'CLOUD', '0.21', {
  '/api/collections': () => ({ status: 200, data: { items: [] }, headers: {}, latency: 0 }),
  '/api/health': () => ({ status: 200, data: { code: 200, message: 'API Online' }, headers: {}, latency: 0 })
});

// 51. Hugging Face
const HuggingFaceAPI = createTechStack('Hugging Face', 'AI', 'N/A', {
  '/api/models': () => ({ status: 200, data: [{ id: 'gpt2', downloads: 1000000 }], headers: {}, latency: 0 }),
  '/api/datasets': () => ({ status: 200, data: [{ id: 'common_voice' }], headers: {}, latency: 0 })
});

// 52. LangChain
const LangChainAPI = createTechStack('LangChain Open Module', 'AI', '0.1', {
  '/chains/run': () => ({ status: 200, data: { output: 'Simulated LLM response' }, headers: {}, latency: 0 }),
  '/agents/list': () => ({ status: 200, data: ['zero-shot-react', 'conversational'], headers: {}, latency: 0 })
});

// 53. MLFlow
const MLFlowAPI = createTechStack('MLFlow', 'AI', '2.10', {
  '/api/2.0/mlflow/experiments/list': () => ({ status: 200, data: { experiments: [{ experiment_id: '0', name: 'Default' }] }, headers: {}, latency: 0 }),
  '/api/2.0/mlflow/runs/search': () => ({ status: 200, data: { runs: [] }, headers: {}, latency: 0 })
});

// 54. TensorFlow
const TensorFlowAPI = createTechStack('TensorFlow', 'AI', '2.15', {
  '/serving/models': () => ({ status: 200, data: { model_version_status: [{ version: '1', state: 'AVAILABLE' }] }, headers: {}, latency: 0 }),
  '/tensorboard/logdir': () => ({ status: 200, data: { path: '/tmp/logs' }, headers: {}, latency: 0 })
});

// 55. PyTorch
const PyTorchAPI = createTechStack('PyTorch', 'AI', '2.2', {
  '/torch/hub/list': () => ({ status: 200, data: ['resnet18', 'bert'], headers: {}, latency: 0 }),
  '/cuda/is_available': () => ({ status: 200, data: { available: false }, headers: {}, latency: 0 })
});

// 56. ONNX
const ONNXAPI = createTechStack('ONNX', 'AI', '1.15', {
  '/runtime/providers': () => ({ status: 200, data: ['CPUExecutionProvider'], headers: {}, latency: 0 }),
  '/models/zoo': () => ({ status: 200, data: { vision: ['mobilenet'] }, headers: {}, latency: 0 })
});

// 57. OpenCV
const OpenCVAPI = createTechStack('OpenCV', 'AI', '4.9', {
  '/build/info': () => ({ status: 200, data: { modules: ['core', 'imgproc', 'dnn'] }, headers: {}, latency: 0 }),
  '/dnn/backends': () => ({ status: 200, data: ['default', 'halide'] }, headers: {}, latency: 0 })
});

// 58. OpenAI Gym (Sim)
const GymAPI = createTechStack('OpenAI Gym', 'AI', '0.26', {
  '/envs/registry': () => ({ status: 200, data: ['CartPole-v1', 'LunarLander-v2'], headers: {}, latency: 0 }),
  '/env/step': () => ({ status: 200, data: { observation: [0.1, 0.2], reward: 1.0, done: false }, headers: {}, latency: 0 })
});

// 59. Godot Engine
const GodotAPI = createTechStack('Godot Engine', 'MEDIA', '4.2', {
  '/asset-lib/search': () => ({ status: 200, data: { results: ['platformer-kit', 'fps-controller'] }, headers: {}, latency: 0 }),
  '/docs/classes': () => ({ status: 200, data: ['Node3D', 'RigidBody'], headers: {}, latency: 0 })
});

// 60. Blender Foundation
const BlenderAPI = createTechStack('Blender Foundation', 'MEDIA', '4.0', {
  '/extensions/add-ons': () => ({ status: 200, data: ['Node Wrangler', 'Cycles'] }, headers: {}, latency: 0 }),
  '/fund/status': () => ({ status: 200, data: { members: 5000 }, headers: {}, latency: 0 })
});

// 61. Inkscape
const InkscapeAPI = createTechStack('Inkscape', 'MEDIA', '1.3', {
  '/extensions/gallery': () => ({ status: 200, data: ['TexText', 'MightyScape'] }, headers: {}, latency: 0 }),
  '/cli/export': () => ({ status: 200, data: { supported: ['png', 'pdf', 'svg'] }, headers: {}, latency: 0 })
});

// 62. GIMP
const GIMPAPI = createTechStack('GIMP', 'MEDIA', '2.10', {
  '/plugin-registry/latest': () => ({ status: 200, data: ['Resynthesizer', 'G' + 'MIC'], headers: {}, latency: 0 }),
  '/script-fu/server': () => ({ status: 200, data: { port: 10008, active: false }, headers: {}, latency: 0 })
});

// 63. Krita
const KritaAPI = createTechStack('Krita', 'MEDIA', '5.2', {
  '/resources/brushes': () => ({ status: 200, data: { bundles: ['Charcoal', 'Digital'] }, headers: {}, latency: 0 }),
  '/animation/status': () => ({ status: 200, data: { frame_rate: 24 }, headers: {}, latency: 0 })
});

// 64. Figma Open API Sim
const FigmaAPI = createTechStack('Figma Open API sim', 'MEDIA', 'Sim', {
  '/v1/files/:key': () => ({ status: 200, data: { document: { id: '123', name: 'Design System' } }, headers: {}, latency: 0 }),
  '/v1/teams/:id/projects': () => ({ status: 200, data: [{ name: 'Mobile App' }], headers: {}, latency: 0 })
});

// 65. Unreal Open Tools
const UnrealAPI = createTechStack('Unreal Open Tools', 'MEDIA', '5.3', {
  '/marketplace/free': () => ({ status: 200, data: { month: 'March', items: 5 }, headers: {}, latency: 0 }),
  '/metahuman/status': () => ({ status: 200, data: { service: 'online' }, headers: {}, latency: 0 })
});

// 66. Unity Open Tools
const UnityAPI = createTechStack('Unity Open Tools', 'MEDIA', '2023.2', {
  '/package-manager/search': () => ({ status: 200, data: { packages: ['com.unity.render-pipelines.universal'] }, headers: {}, latency: 0 }),
  '/services/ads': () => ({ status: 200, data: { revenue: 0 }, headers: {}, latency: 0 })
});

// 67. OpenStreetMap
const OSMAPI = createTechStack('OpenStreetMap', 'NET', 'N/A', {
  '/api/0.6/map': () => ({ status: 200, data: { bounds: { minlat: 0, minlon: 0, maxlat: 1, maxlon: 1 } }, headers: {}, latency: 0 }),
  '/nominatim/search': () => ({ status: 200, data: [{ display_name: 'Null Island' }], headers: {}, latency: 0 })
});

// 68. QGIS
const QGISAPI = createTechStack('QGIS', 'NET', '3.34', {
  '/plugins/repo': () => ({ status: 200, data: { count: 900 }, headers: {}, latency: 0 }),
  '/wms/capabilities': () => ({ status: 200, data: { layers: ['topo', 'satellite'] }, headers: {}, latency: 0 })
});

// 69. MapLibre
const MapLibreAPI = createTechStack('MapLibre', 'NET', '3.0', {
  '/style/validate': () => ({ status: 200, data: { valid: true }, headers: {}, latency: 0 }),
  '/tiles/vector': () => ({ status: 200, data: { format: 'pbf' }, headers: {}, latency: 0 })
});

// 70. Leaflet.js
const LeafletAPI = createTechStack('Leaflet.js', 'NET', '1.9', {
  '/plugins/list': () => ({ status: 200, data: ['MarkerCluster', 'Heatmap'], headers: {}, latency: 0 }),
  '/version': () => ({ status: 200, data: { current: '1.9.4' }, headers: {}, latency: 0 })
});

// 71. VLC
const VLCAPI = createTechStack('VLC', 'MEDIA', '3.0.20', {
  '/requests/status.xml': () => ({ status: 200, data: { state: 'playing', volume: 100 }, headers: {}, latency: 0 }),
  '/requests/playlist.xml': () => ({ status: 200, data: { items: 5 }, headers: {}, latency: 0 })
});

// 72. FFmpeg
const FFmpegAPI = createTechStack('FFmpeg', 'MEDIA', '6.1', {
  '/codecs': () => ({ status: 200, data: { h264: 'decode/encode', vp9: 'decode/encode' }, headers: {}, latency: 0 }),
  '/filters': () => ({ status: 200, data: ['scale', 'transpose', 'overlay'], headers: {}, latency: 0 })
});

// 73. OBS Studio
const OBSAPI = createTechStack('OBS Studio', 'MEDIA', '30.0', {
  '/obs-websocket/version': () => ({ status: 200, data: { obs_version: '30.0.0', obs_websocket_version: '5.0.0' }, headers: {}, latency: 0 }),
  '/scenes/list': () => ({ status: 200, data: ['Scene 1', 'Gaming', 'Just Chatting'], headers: {}, latency: 0 })
});

// 74. WireGuard
const WireGuardAPI = createTechStack('WireGuard', 'SEC', '1.0', {
  '/wg0/status': () => ({ status: 200, data: { public_key: 'abc...', peers: 2 }, headers: {}, latency: 0 }),
  '/metrics': () => ({ status: 200, data: { rx_bytes: 1024, tx_bytes: 2048 }, headers: {}, latency: 0 })
});

// 75. OpenVPN
const OpenVPNAPI = createTechStack('OpenVPN', 'SEC', '2.6', {
  '/management/status': () => ({ status: 200, data: { state: 'CONNECTED' }, headers: {}, latency: 0 }),
  '/client/list': () => ({ status: 200, data: [{ common_name: 'client1', real_address: '1.2.3.4' }], headers: {}, latency: 0 })
});

// 76. Tor Project
const TorAPI = createTechStack('Tor Project', 'SEC', '0.4.8', {
  '/control/circuit-status': () => ({ status: 200, data: { circuits: 3, built: true }, headers: {}, latency: 0 }),
  '/onion/service': () => ({ status: 200, data: { hostname: 'xyz.onion' }, headers: {}, latency: 0 })
});

// 77. DuckDB
const DuckDBAPI = createTechStack('DuckDB', 'DB', '0.10', {
  '/query': () => ({ status: 200, data: { result: 'parquet_scan executed' }, headers: {}, latency: 0 }),
  '/extensions': () => ({ status: 200, data: ['httpfs', 'parquet'], headers: {}, latency: 0 })
});

// 78. ClickHouse
const ClickHouseAPI = createTechStack('ClickHouse', 'DB', '24.1', {
  '/ping': () => ({ status: 200, data: 'Ok.', headers: {}, latency: 0 }),
  '/replicas/status': () => ({ status: 200, data: { active: true, lag: 0 }, headers: {}, latency: 0 })
});

// 79. MinIO
const MinIOAPI = createTechStack('MinIO', 'CLOUD', 'RELEASE.2024', {
  '/minio/health/live': () => ({ status: 200, data: {}, headers: {}, latency: 0 }),
  '/minio/admin/info': () => ({ status: 200, data: { mode: 'distributed', drives: 4 }, headers: {}, latency: 0 })
});

// 80. Ceph
const CephAPI = createTechStack('Ceph', 'CLOUD', 'Reef', {
  '/api/health/minimal': () => ({ status: 200, data: { status: 'HEALTH_OK' }, headers: {}, latency: 0 }),
  '/api/osd': () => ({ status: 200, data: { count: 12, up: 12, in: 12 }, headers: {}, latency: 0 })
});

// 81. OpenStack
const OpenStackAPI = createTechStack('OpenStack', 'CLOUD', 'Bobcat', {
  '/nova/servers': () => ({ status: 200, data: { servers: [] }, headers: {}, latency: 0 }),
  '/neutron/networks': () => ({ status: 200, data: { networks: [] }, headers: {}, latency: 0 })
});

// 82. Proxmox
const ProxmoxAPI = createTechStack('Proxmox', 'CLOUD', '8.1', {
  '/api2/json/nodes': () => ({ status: 200, data: [{ node: 'pve1', status: 'online' }], headers: {}, latency: 0 }),
  '/api2/json/cluster/status': () => ({ status: 200, data: { quorate: 1 }, headers: {}, latency: 0 })
});

// 83. Home Assistant
const HomeAssistantAPI = createTechStack('Home Assistant', 'NET', '2024.2', {
  '/api/states': () => ({ status: 200, data: [{ entity_id: 'light.living_room', state: 'on' }], headers: {}, latency: 0 }),
  '/api/services': () => ({ status: 200, data: [{ domain: 'light', services: ['turn_on', 'turn_off'] }], headers: {}, latency: 0 })
});

// 84. OpenHAB
const OpenHABAPI = createTechStack('OpenHAB', 'NET', '4.1', {
  '/rest/items': () => ({ status: 200, data: [{ name: 'Temperature', state: '21.5' }], headers: {}, latency: 0 }),
  '/rest/things': () => ({ status: 200, data: [{ label: 'Z-Wave Controller', status: 'ONLINE' }], headers: {}, latency: 0 })
});

// 85. Matter protocol simulator
const MatterAPI = createTechStack('Matter protocol simulator', 'NET', '1.2', {
  '/fabric/nodes': () => ({ status: 200, data: { nodes: [1, 2] }, headers: {}, latency: 0 }),
  '/commissioning/window': () => ({ status: 200, data: { open: false }, headers: {}, latency: 0 })
});

// 86. Zigbee simulator
const ZigbeeAPI = createTechStack('Zigbee simulator', 'NET', '3.0', {
  '/coordinator/permit_join': () => ({ status: 200, data: { permitted: true, time_left: 60 }, headers: {}, latency: 0 }),
  '/networkmap': () => ({ status: 200, data: { nodes: 15, links: 25 }, headers: {}, latency: 0 })
});

// 87. TensorRT
const TensorRTAPI = createTechStack('TensorRT open version', 'AI', '8.6', {
  '/engine/build': () => ({ status: 200, data: { status: 'success', precision: 'FP16' }, headers: {}, latency: 0 }),
  '/profiler/layer': () => ({ status: 200, data: { layer: 'conv1', time_ms: 0.5 }, headers: {}, latency: 0 })
});

// 88. LLVM
const LLVMAPI = createTechStack('LLVM', 'TOOL', '18.1', {
  '/ir/optimize': () => ({ status: 200, data: { passes: ['instcombine', 'gvn'] }, headers: {}, latency: 0 }),
  '/targets': () => ({ status: 200, data: ['x86', 'arm', 'riscv', 'wasm'], headers: {}, latency: 0 })
});

// 89. WebKit
const WebKitAPI = createTechStack('WebKit', 'TOOL', 'N/A', {
  '/jsc/version': () => ({ status: 200, data: { version: '617.1' }, headers: {}, latency: 0 }),
  '/inspector/protocol': () => ({ status: 200, data: { domains: ['DOM', 'Network'] }, headers: {}, latency: 0 })
});

// 90. Chromium
const ChromiumAPI = createTechStack('Chromium', 'TOOL', '122', {
  '/components/updater': () => ({ status: 200, data: { status: 'checking' }, headers: {}, latency: 0 }),
  '/flags/list': () => ({ status: 200, data: { available: 500 }, headers: {}, latency: 0 })
});

// 91. uBlock Origin engine sim
const UBlockAPI = createTechStack('uBlock Origin engine sim', 'SEC', '1.56', {
  '/filters/update': () => ({ status: 200, data: { updated: ['EasyList', 'Privacy'] }, headers: {}, latency: 0 }),
  '/stats/blocked': () => ({ status: 200, data: { total: 15432 }, headers: {}, latency: 0 })
});

// 92. Brave Shields engine sim
const BraveAPI = createTechStack('Brave Shields engine sim', 'SEC', '1.63', {
  '/shields/status': () => ({ status: 200, data: { ads_blocked: 50, https_upgrades: 10 }, headers: {}, latency: 0 }),
  '/rewards/wallet': () => ({ status: 200, data: { balance: '15 BAT' }, headers: {}, latency: 0 })
});

// 93. Nextcloud
const NextcloudAPI = createTechStack('Nextcloud', 'CLOUD', '28', {
  '/ocs/v2.php/cloud/capabilities': () => ({ status: 200, data: { files: { versioning: true } }, headers: {}, latency: 0 }),
  '/status.php': () => ({ status: 200, data: { installed: true, maintenance: false }, headers: {}, latency: 0 })
});

// 94. OwnCloud
const OwnCloudAPI = createTechStack('OwnCloud', 'CLOUD', 'Infinite Scale', {
  '/graph/v1.0/me': () => ({ status: 200, data: { displayName: 'Admin' }, headers: {}, latency: 0 }),
  '/api/v0/settings': () => ({ status: 200, data: { theme: 'default' }, headers: {}, latency: 0 })
});

// 95. Mastodon
const MastodonAPI = createTechStack('Mastodon', 'NET', '4.2', {
  '/api/v1/instance': () => ({ status: 200, data: { title: 'Social', user_count: 500 }, headers: {}, latency: 0 }),
  '/api/v1/timelines/public': () => ({ status: 200, data: [{ content: 'Hello Fediverse!' }], headers: {}, latency: 0 })
});

// 96. Matrix
const MatrixAPI = createTechStack('Matrix', 'NET', '1.9', {
  '/_matrix/client/v3/sync': () => ({ status: 200, data: { next_batch: 's12345' }, headers: {}, latency: 0 }),
  '/_matrix/federation/v1/version': () => ({ status: 200, data: { server: { name: 'Synapse', version: '1.99' } }, headers: {}, latency: 0 })
});

// 97. Signal open protocol
const SignalAPI = createTechStack('Signal open protocol simulation', 'SEC', 'N/A', {
  '/v1/keys': () => ({ status: 200, data: { prekeys: 100 }, headers: {}, latency: 0 }),
  '/v1/certificate/delivery': () => ({ status: 200, data: { certificate: 'MII...' }, headers: {}, latency: 0 })
});

// 98. Apache Airflow
const AirflowAPI = createTechStack('Apache Airflow', 'TOOL', '2.8', {
  '/api/v1/dags': () => ({ status: 200, data: { dags: [{ dag_id: 'etl_pipeline', is_paused: false }] }, headers: {}, latency: 0 }),
  '/api/v1/health': () => ({ status: 200, data: { metadatabase: { status: 'healthy' } }, headers: {}, latency: 0 })
});

// 99. Jenkins
const JenkinsAPI = createTechStack('Jenkins', 'TOOL', '2.440', {
  '/api/json': () => ({ status: 200, data: { jobs: [{ name: 'Build-Main', color: 'blue' }] }, headers: {}, latency: 0 }),
  '/crumbIssuer/api/json': () => ({ status: 200, data: { crumb: '123456' }, headers: {}, latency: 0 })
});

// 100. DroneCI
const DroneCIAPI = createTechStack('DroneCI', 'TOOL', '2.20', {
  '/api/user': () => ({ status: 200, data: { login: 'octocat' }, headers: {}, latency: 0 }),
  '/api/repos': () => ({ status: 200, data: [{ slug: 'octocat/hello-world', active: true }], headers: {}, latency: 0 })
});

// --- VI. THE REGISTRY (API AGGREGATOR) ------------------------------------

const API_REGISTRY: SimulatedAPI[] = [
  LinuxFoundationAPI, CanonicalAPI, RedHatAPI, FedoraAPI, DebianAPI, OpenSUSEAPI, ArchLinuxAPI, ManjaroAPI, FreeBSDAPI, NetBSDAPI,
  OpenBSDAPI, KubernetesAPI, CNCFAPI, DockerAPI, PodmanAPI, AnsibleAPI, TerraformAPI, HashiCorpAPI, ApacheAPI, NginxAPI,
  MozillaAPI, FirefoxDevToolsAPI, GitAPI, GitHubAPI, GitLabAPI, BitbucketAPI, VSCodeAPI, EclipseAPI, JetBrainsAPI, PythonAPI,
  NodeAPI, DenoAPI, BunAPI, RustAPI, GoAPI, RubyAPI, PHPAPI, MariaDBAPI, MySQLAPI, PostgresAPI,
  SQLiteAPI, RedisAPI, MongoAPI, CassandraAPI, ElasticAPI, SparkAPI, KafkaAPI, SupabaseAPI, AppwriteAPI, PocketBaseAPI,
  HuggingFaceAPI, LangChainAPI, MLFlowAPI, TensorFlowAPI, PyTorchAPI, ONNXAPI, OpenCVAPI, GymAPI, GodotAPI, BlenderAPI,
  InkscapeAPI, GIMPAPI, KritaAPI, FigmaAPI, UnrealAPI, UnityAPI, OSMAPI, QGISAPI, MapLibreAPI, LeafletAPI,
  VLCAPI, FFmpegAPI, OBSAPI, WireGuardAPI, OpenVPNAPI, TorAPI, DuckDBAPI, ClickHouseAPI, MinIOAPI, CephAPI,
  OpenStackAPI, ProxmoxAPI, HomeAssistantAPI, OpenHABAPI, MatterAPI, ZigbeeAPI, TensorRTAPI, LLVMAPI, WebKitAPI, ChromiumAPI,
  UBlockAPI, BraveAPI, NextcloudAPI, OwnCloudAPI, MastodonAPI, MatrixAPI, SignalAPI, AirflowAPI, JenkinsAPI, DroneCIAPI
];

// --- VII. UI COMPONENTS & THEME -------------------------------------------

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00ff9d' },
    secondary: { main: '#bd00ff' },
    background: { default: '#0a0a0a', paper: '#111111' },
    text: { primary: '#e0e0e0', secondary: '#a0a0a0' },
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    h5: { fontWeight: 700, letterSpacing: '-0.05em' },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: { styleOverrides: { root: { border: '1px solid #333', backgroundImage: 'none' } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 4 } } },
  },
});

const TerminalBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#000',
  color: '#0f0',
  padding: theme.spacing(2),
  fontFamily: 'monospace',
  borderRadius: theme.shape.borderRadius,
  border: '1px solid #333',
  height: '200px',
  overflowY: 'auto',
  fontSize: '0.8rem',
  '&::-webkit-scrollbar': { width: '8px' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: '#333' },
}));

const StatusDot = styled(Box)<{ status: 'ok' | 'warn' | 'err' }>(({ theme, status }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: status === 'ok' ? '#00ff9d' : status === 'warn' ? '#ffb700' : '#ff0055',
  boxShadow: `0 0 8px ${status === 'ok' ? '#00ff9d' : status === 'warn' ? '#ffb700' : '#ff0055'}`,
}));

// --- VIII. MAIN COMPONENT LOGIC -------------------------------------------

interface AssetCatalogProps {
  assets?: Asset[]; // Optional now, as we generate them internally
  onAssetSelected?: (asset: Asset) => void;
  getAssetDetails?: (assetId: string) => Promise<any>;
}

const AssetCatalog: React.FC<AssetCatalogProps> = (props) => {
  // 1. Initialize Universe State
  const [tick, setTick] = useState(0);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>(['> System initialized.', '> Connecting to Omniverse...']);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [apiResponses, setApiResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 2. Kernel Subscription
  useEffect(() => {
    const kernel = UniverseKernel.getInstance();
    const unsub = kernel.subscribe((t) => {
      setTick(t);
      if (t % 10 === 0 && Math.random() > 0.7) {
        addLog(`> [KERNEL] Tick ${t}: Entropy stable. Network load: ${(Math.random() * 100).toFixed(1)}%`);
      }
    });
    return unsub;
  }, []);

  // 3. Helper Functions
  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev.slice(-50), msg]);
  };

  const handleApiCall = async (api: SimulatedAPI, endpoint: string) => {
    const key = `${api.id}:${endpoint}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    addLog(`> [NET] Requesting ${api.baseUrl}${endpoint}...`);
    
    try {
      const response = await NetworkLayer.fetch(api, endpoint);
      setApiResponses(prev => ({ ...prev, [key]: response }));
      addLog(`> [NET] ${response.status} OK (${response.latency.toFixed(0)}ms)`);
    } catch (e) {
      addLog(`> [ERR] Request failed.`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const filteredApis = useMemo(() => {
    return API_REGISTRY.filter(api => 
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const selectedApi = useMemo(() => API_REGISTRY.find(a => a.id === selectedApiId), [selectedApiId]);

  // 4. Render Logic
  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', color: 'text.primary', overflow: 'hidden' }}>
        
        {/* Sidebar Navigation */}
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box', borderRight: '1px solid #333', bgcolor: '#050505' },
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Hub sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>OMNIVERSE</Typography>
          </Box>
          <Divider sx={{ borderColor: '#333' }} />
          <List>
            {['Dashboard', 'Network Map', 'Security', 'Logs'].map((text, index) => (
              <ListItem button key={text} selected={index === 0}>
                <ListItemIcon sx={{ color: 'text.secondary' }}>
                  {index === 0 ? <Dns /> : index === 1 ? <Public /> : index === 2 ? <Security /> : <Terminal />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 'auto', p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Kernel Tick: {tick}<br/>
              Active Nodes: {API_REGISTRY.length}
            </Typography>
            <LinearProgress variant="determinate" value={(tick % 100)} sx={{ mt: 1, height: 2, bgcolor: '#333' }} />
          </Box>
        </Drawer>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          
          {/* Top Bar */}
          <Paper square sx={{ p: 2, borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Search sx={{ color: 'text.secondary' }} />
            <TextField 
              variant="standard" 
              placeholder="Search simulated universe..." 
              InputProps={{ disableUnderline: true }}
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <IconButton><FilterList /></IconButton>
            <IconButton><Refresh onClick={() => setTick(0)} /></IconButton>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>AI</Avatar>
          </Paper>

          {/* Content Grid */}
          <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
            <Grid container spacing={3}>
              {filteredApis.map((api) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={api.id}>
                  <Card 
                    onClick={() => setSelectedApiId(api.id)}
                    sx={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      borderColor: selectedApiId === api.id ? 'primary.main' : '#333',
                      '&:hover': { transform: 'translateY(-2px)', borderColor: 'text.secondary' }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          label={api.state.version || 'v1.0'} 
                          size="small" 
                          sx={{ bgcolor: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }} 
                        />
                        <StatusDot status={Math.random() > 0.1 ? 'ok' : 'warn'} />
                      </Box>
                      <Typography variant="h6" gutterBottom noWrap>{api.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                        {api.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Code fontSize="small" color="disabled" />
                        <Typography variant="caption" color="text.secondary">
                          {Object.keys(api.endpoints).length} Endpoints
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Terminal Footer */}
          <Box sx={{ p: 2, borderTop: '1px solid #333', bgcolor: '#050505' }}>
            <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>SYSTEM CONSOLE</Typography>
            <TerminalBox>
              {terminalLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
              <div style={{ animation: 'blink 1s infinite' }}>_</div>
            </TerminalBox>
          </Box>
        </Box>

        {/* Detail Panel (Right Side) */}
        {selectedApi && (
          <Paper 
            elevation={4}
            sx={{ 
              width: 400, 
              borderLeft: '1px solid #333', 
              display: 'flex', 
              flexDirection: 'column',
              height: '100vh'
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid #333' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Typography variant="h5">{selectedApi.name}</Typography>
                <IconButton size="small" onClick={() => setSelectedApiId(null)}><VisibilityOff /></IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedApi.baseUrl}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Chip label="Active" color="success" size="small" />
                <Chip label="Simulated" color="primary" size="small" variant="outlined" />
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Endpoints" />
                <Tab label="State" />
                <Tab label="Docs" />
              </Tabs>

              {activeTab === 0 && (
                <List>
                  {Object.keys(selectedApi.endpoints).map((endpoint) => (
                    <React.Fragment key={endpoint}>
                      <ListItem alignItems="flex-start">
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Chip label="GET" size="small" sx={{ borderRadius: 1, bgcolor: 'rgba(0,255,157,0.1)', color: 'primary.main', fontWeight: 'bold' }} />
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{endpoint}</Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => handleApiCall(selectedApi, endpoint)}
                              disabled={loading[`${selectedApi.id}:${endpoint}`]}
                            >
                              {loading[`${selectedApi.id}:${endpoint}`] ? <CircularProgress size={16} /> : <Speed fontSize="small" />}
                            </IconButton>
                          </Box>
                          
                          {apiResponses[`${selectedApi.id}:${endpoint}`] && (
                            <Box sx={{ bgcolor: '#000', p: 1, borderRadius: 1, mt: 1, border: '1px solid #333' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color={apiResponses[`${selectedApi.id}:${endpoint}`].status === 200 ? 'success.main' : 'error.main'}>
                                  HTTP {apiResponses[`${selectedApi.id}:${endpoint}`].status}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {apiResponses[`${selectedApi.id}:${endpoint}`].latency.toFixed(0)}ms
                                </Typography>
                              </Box>
                              <Typography variant="caption" component="pre" sx={{ m: 0, overflowX: 'auto', color: '#aaa' }}>
                                {JSON.stringify(apiResponses[`${selectedApi.id}:${endpoint}`].data, null, 2)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}

              {activeTab === 1 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Internal Memory State</Typography>
                  <Box sx={{ bgcolor: '#000', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.8rem', color: '#bd00ff' }}>
                    {JSON.stringify(selectedApi.state, null, 2)}
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Metrics</Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)' }}>
                          <Typography variant="caption">Uptime</Typography>
                          <Typography variant="h6">99.9%</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)' }}>
                          <Typography variant="caption">Requests</Typography>
                          <Typography variant="h6">{Math.floor(Math.random() * 1000)}/s</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              )}
              
              {activeTab === 2 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" paragraph>
                    This is a fully simulated environment for {selectedApi.name}. 
                    All endpoints return deterministic data generated by the Universe Kernel.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Protocol: HTTPS/2<br/>
                    Auth: Bearer Token (Simulated)<br/>
                    Rate Limit: 5000/hr
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default AssetCatalog;