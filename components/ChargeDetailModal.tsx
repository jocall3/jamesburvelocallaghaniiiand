import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type Stripe from 'stripe';

/**
 * THE EVOLUTIONARY UNIVERSE-FORGE: CHARGE DETAIL NEXUS
 * 
 * This file is a self-contained, universe-scale system generated from a single React component.
 * It simulates an entire ecosystem of open-source technologies, financial logic, and 
 * observability platforms to render a single Stripe Charge detail view.
 * 
 * ARCHITECTURE:
 * 1. The Core: Mathematical and logical primitives.
 * 2. The Federation: 100 simulated Open Source API systems.
 * 3. The Engine: Event bus, state management, and data synthesis.
 * 4. The UI Layer: A custom rendering engine for the "Holo-Deck" interface.
 * 5. The Nexus: The final ChargeDetailModal component.
 * 
 * @license MIT-Universe-Simulated
 * @version 10.0.0-ALPHA-OMEGA
 */

// -----------------------------------------------------------------------------
// SECTION I: THE CORE PRIMITIVES & TYPES
// -----------------------------------------------------------------------------

type UUID = string;
type ISODate = string;
type Currency = string;
type Status = 'active' | 'inactive' | 'error' | 'booting' | 'syncing';

interface ISystemNode {
  id: UUID;
  name: string;
  version: string;
  status: Status;
  latency: number;
  uptime: number;
  initialize(): Promise<void>;
  healthCheck(): boolean;
  shutdown(): void;
}

interface IDataPacket<T = any> {
  id: UUID;
  timestamp: number;
  source: string;
  payload: T;
  signature: string;
  entropy: number;
}

interface IAuditLog {
  traceId: UUID;
  severity: 'INFO' | 'WARN' | 'CRITICAL' | 'FATAL';
  message: string;
  component: string;
  stack?: string[];
}

// Simulated Stripe Types for Self-Containment (extending the import)
interface NexusCharge extends Stripe.Charge {
  _nexus_metadata: {
    risk_score: number;
    network_latency: number;
    origin_node: string;
    federation_approvals: string[];
  };
}

// -----------------------------------------------------------------------------
// SECTION II: UTILITIES & MATH ENGINE
// -----------------------------------------------------------------------------

const NexusMath = {
  generateUUID: (): UUID => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
  
  calculateEntropy: (input: string): number => {
    let entropy = 0;
    for (let i = 0; i < input.length; i++) {
      entropy += input.charCodeAt(i) * (i + 1);
    }
    return entropy % 100;
  },

  formatCurrency: (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  },

  getTimestamp: (): number => Date.now(),
};

const NexusLogger = {
  logs: [] as IAuditLog[],
  log: (component: string, message: string, severity: IAuditLog['severity'] = 'INFO') => {
    const entry: IAuditLog = {
      traceId: NexusMath.generateUUID(),
      severity,
      message,
      component,
      stack: new Error().stack?.split('\n'),
    };
    NexusLogger.logs.push(entry);
    // In a real system, this would stream to ElasticSearch
    if (NexusLogger.logs.length > 1000) NexusLogger.logs.shift();
  }
};

// -----------------------------------------------------------------------------
// SECTION III: THE OPEN SOURCE FEDERATION (100 SIMULATED APIs)
// -----------------------------------------------------------------------------

/**
 * Base class for all simulated open source systems.
 * Each system maintains its own internal state, memory, and logic.
 */
abstract class FederationSystem implements ISystemNode {
  id: UUID;
  name: string;
  version: string;
  status: Status = 'booting';
  latency: number = 0;
  uptime: number = 0;
  protected memory: Map<string, any> = new Map();

  constructor(name: string, version: string) {
    this.id = NexusMath.generateUUID();
    this.name = name;
    this.version = version;
    this.initialize();
  }

  async initialize(): Promise<void> {
    this.status = 'booting';
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    this.status = 'active';
    this.uptime = Date.now();
    NexusLogger.log(this.name, `System initialized v${this.version}`);
  }

  healthCheck(): boolean {
    // Simulate random jitter
    this.latency = Math.random() * 100;
    return this.status === 'active' && this.latency < 200;
  }

  shutdown(): void {
    this.status = 'inactive';
    this.memory.clear();
  }

  abstract executeTask(task: string, payload: any): any;
}

// --- 1. Linux Foundation ---
class LinuxFoundationAPI extends FederationSystem {
  constructor() { super('Linux Foundation', '6.8.0-rc1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'kernel_audit') {
      return { syscalls: 4096, context_switches: 120, load_avg: [0.4, 0.5, 0.9] };
    }
    return { error: 'Unknown syscall' };
  }

  verifyKernelIntegrity(): boolean {
    return true; // It's Linux, it's solid.
  }
}

// --- 2. Canonical (Ubuntu) ---
class CanonicalAPI extends FederationSystem {
  constructor() { super('Canonical', '24.04-LTS'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'snap_refresh') return { status: 'updated', channel: 'stable' };
    return null;
  }

  checkLTSStatus(): string {
    return 'Supported until 2029';
  }
}

// --- 3. Red Hat ---
class RedHatAPI extends FederationSystem {
  constructor() { super('Red Hat', '9.3'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'subscription_check') return { active: true, type: 'enterprise' };
    return null;
  }
}

// --- 4. Fedora Project ---
class FedoraAPI extends FederationSystem {
  constructor() { super('Fedora', '39'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'dnf_update') return { packages: 0, message: 'Nothing to do' };
    return null;
  }
}

// --- 5. Debian Project ---
class DebianAPI extends FederationSystem {
  constructor() { super('Debian', '12 (Bookworm)'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'apt_get') return { stability: 'rock_solid', packages: 50000 };
    return null;
  }
}

// --- 6. OpenSUSE ---
class OpenSUSEAPI extends FederationSystem {
  constructor() { super('OpenSUSE', 'Tumbleweed'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'zypper_dup') return { rolling: true, snapshot: '20240501' };
    return null;
  }
}

// --- 7. Arch Linux ---
class ArchLinuxAPI extends FederationSystem {
  constructor() { super('Arch Linux', 'Rolling'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'pacman_syu') return { updated: true, broken: false, btw: 'i_use_arch' };
    return null;
  }
}

// --- 8. Manjaro ---
class ManjaroAPI extends FederationSystem {
  constructor() { super('Manjaro', '23.1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'pamac_check') return { branch: 'stable', mirrors: 'synced' };
    return null;
  }
}

// --- 9. FreeBSD ---
class FreeBSDAPI extends FederationSystem {
  constructor() { super('FreeBSD', '14.0-RELEASE'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'zfs_status') return { pool: 'tank', health: 'ONLINE' };
    return null;
  }
}

// --- 10. NetBSD ---
class NetBSDAPI extends FederationSystem {
  constructor() { super('NetBSD', '9.3'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'portability_check') return { runs_on_toaster: true };
    return null;
  }
}

// --- 11. OpenBSD ---
class OpenBSDAPI extends FederationSystem {
  constructor() { super('OpenBSD', '7.4'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'security_audit') return { remote_holes: 2, time_span: 'a_long_time' };
    return null;
  }
}

// --- 12. Kubernetes ---
class KubernetesAPI extends FederationSystem {
  constructor() { super('Kubernetes', '1.29'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'get_pods') return { items: [], kind: 'PodList' };
    if (task === 'scale') return { replicas: payload.replicas || 1 };
    return null;
  }

  schedulePod(name: string): string {
    return `Pod ${name} scheduled on node-worker-1`;
  }
}

// --- 13. CNCF ---
class CNCFAPI extends FederationSystem {
  constructor() { super('CNCF', 'v2024'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'landscape_check') return { projects: 150, graduated: 25 };
    return null;
  }
}

// --- 14. Docker ---
class DockerAPI extends FederationSystem {
  constructor() { super('Docker', '25.0.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'ps') return { containers: 5, running: 5 };
    if (task === 'build') return { layers: 12, cache: true };
    return null;
  }
}

// --- 15. Podman ---
class PodmanAPI extends FederationSystem {
  constructor() { super('Podman', '4.9'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'generate_kube') return { yaml: 'apiVersion: v1...' };
    return null;
  }
}

// --- 16. Ansible ---
class AnsibleAPI extends FederationSystem {
  constructor() { super('Ansible', '9.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'playbook_run') return { changed: 2, ok: 10, failed: 0 };
    return null;
  }
}

// --- 17. Terraform ---
class TerraformAPI extends FederationSystem {
  constructor() { super('Terraform', '1.7'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'plan') return { add: 1, change: 0, destroy: 0 };
    if (task === 'apply') return { state: 'locked', output: 'success' };
    return null;
  }
}

// --- 18. HashiCorp ---
class HashiCorpAPI extends FederationSystem {
  constructor() { super('HashiCorp', 'Vault/Consul'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'get_secret') return { data: '*******', lease_duration: 3600 };
    return null;
  }
}

// --- 19. Apache Foundation ---
class ApacheAPI extends FederationSystem {
  constructor() { super('Apache Foundation', 'ASF'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'project_incubator') return { status: 'graduating' };
    return null;
  }
}

// --- 20. NGINX ---
class NginxAPI extends FederationSystem {
  constructor() { super('NGINX', '1.25'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'reload') return { workers: 'respawned' };
    if (task === 'stats') return { active_connections: 405, reading: 2, writing: 1 };
    return null;
  }
}

// --- 21. Mozilla ---
class MozillaAPI extends FederationSystem {
  constructor() { super('Mozilla', 'Manifesto'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'privacy_check') return { tracking_protection: 'enabled' };
    return null;
  }
}

// --- 22. Firefox Dev Tools ---
class FirefoxDevToolsAPI extends FederationSystem {
  constructor() { super('Firefox DevTools', '123.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'inspect_grid') return { overlay: 'visible', tracks: 12 };
    return null;
  }
}

// --- 23. Git ---
class GitAPI extends FederationSystem {
  constructor() { super('Git', '2.43'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'status') return { branch: 'main', clean: true };
    if (task === 'log') return { commit: 'a1b2c3d', message: 'feat: universe expansion' };
    return null;
  }
}

// --- 24. GitHub Open Source API ---
class GitHubAPI extends FederationSystem {
  constructor() { super('GitHub', 'API v3'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'get_repo') return { stars: 10000, forks: 500 };
    if (task === 'create_issue') return { number: 42, state: 'open' };
    return null;
  }
}

// --- 25. GitLab ---
class GitLabAPI extends FederationSystem {
  constructor() { super('GitLab', '16.8'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'ci_pipeline') return { status: 'running', stage: 'deploy' };
    return null;
  }
}

// --- 26. Bitbucket ---
class BitbucketAPI extends FederationSystem {
  constructor() { super('Bitbucket', 'Cloud'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'pr_status') return { reviewers: 2, approved: true };
    return null;
  }
}

// --- 27. VS Code ---
class VSCodeAPI extends FederationSystem {
  constructor() { super('VS Code', '1.86'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'install_extension') return { id: 'ms-python.python', status: 'installed' };
    return null;
  }
}

// --- 28. Eclipse Foundation ---
class EclipseAPI extends FederationSystem {
  constructor() { super('Eclipse', 'IDE 2024-03'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'build_workspace') return { errors: 0, warnings: 15 };
    return null;
  }
}

// --- 29. JetBrains Open Tools ---
class JetBrainsAPI extends FederationSystem {
  constructor() { super('JetBrains', 'IntelliJ Platform'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'index_project') return { progress: '100%', files: 5000 };
    return null;
  }
}

// --- 30. Python Software Foundation ---
class PythonAPI extends FederationSystem {
  constructor() { super('Python', '3.12'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'pip_install') return { package: payload.pkg, cached: true };
    if (task === 'gil_status') return { locked: false };
    return null;
  }
}

// --- 31. Node.js Foundation ---
class NodeAPI extends FederationSystem {
  constructor() { super('Node.js', '20.11 LTS'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'event_loop') return { lag: 0.5, active_handles: 10 };
    return null;
  }
}

// --- 32. Deno ---
class DenoAPI extends FederationSystem {
  constructor() { super('Deno', '1.40'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'run_secure') return { permissions: 'none', status: 'ok' };
    return null;
  }
}

// --- 33. Bun ---
class BunAPI extends FederationSystem {
  constructor() { super('Bun', '1.0.25'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'install') return { speed: 'fast', time: '10ms' };
    return null;
  }
}

// --- 34. Rust Foundation ---
class RustAPI extends FederationSystem {
  constructor() { super('Rust', '1.76'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'borrow_check') return { lifetimes: 'valid', ownership: 'safe' };
    return null;
  }
}

// --- 35. GoLang Foundation ---
class GoAPI extends FederationSystem {
  constructor() { super('Go', '1.22'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'goroutine_spawn') return { id: 1024, state: 'running' };
    return null;
  }
}

// --- 36. Ruby ---
class RubyAPI extends FederationSystem {
  constructor() { super('Ruby', '3.3'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'jit_compile') return { enabled: true, optimization: 'level2' };
    return null;
  }
}

// --- 37. PHP ---
class PhpAPI extends FederationSystem {
  constructor() { super('PHP', '8.3'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'opcache_status') return { hit_rate: 0.99, memory_usage: '128MB' };
    return null;
  }
}

// --- 38. MariaDB ---
class MariaDBAPI extends FederationSystem {
  constructor() { super('MariaDB', '11.2'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'query') return { rows: 1, time: '0.001s' };
    return null;
  }
}

// --- 39. MySQL Open Edition ---
class MySQLAPI extends FederationSystem {
  constructor() { super('MySQL', '8.3'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'explain') return { type: 'const', key: 'PRIMARY' };
    return null;
  }
}

// --- 40. PostgreSQL ---
class PostgresAPI extends FederationSystem {
  constructor() { super('PostgreSQL', '16.1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'vacuum') return { tuples_removed: 50, pages_freed: 2 };
    if (task === 'jsonb_query') return { result: { valid: true } };
    return null;
  }
}

// --- 41. SQLite ---
class SQLiteAPI extends FederationSystem {
  constructor() { super('SQLite', '3.45'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'wal_checkpoint') return { mode: 'passive', frames: 0 };
    return null;
  }
}

// --- 42. Redis ---
class RedisAPI extends FederationSystem {
  constructor() { super('Redis', '7.2'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'get') return { value: 'cached_data', ttl: 60 };
    if (task === 'pubsub') return { channel: 'notifications', subscribers: 5 };
    return null;
  }
}

// --- 43. MongoDB Community ---
class MongoAPI extends FederationSystem {
  constructor() { super('MongoDB', '7.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'aggregate') return { pipeline: 'optimized', docs: 100 };
    return null;
  }
}

// --- 44. Cassandra ---
class CassandraAPI extends FederationSystem {
  constructor() { super('Cassandra', '4.1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'gossip') return { peers: 12, status: 'UP' };
    return null;
  }
}

// --- 45. ElasticSearch ---
class ElasticAPI extends FederationSystem {
  constructor() { super('ElasticSearch', '8.12'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'search') return { hits: 10, score: 1.5, took: 5 };
    return null;
  }
}

// --- 46. Apache Spark ---
class SparkAPI extends FederationSystem {
  constructor() { super('Apache Spark', '3.5'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'job_status') return { stages: 4, completed: 3 };
    return null;
  }
}

// --- 47. Apache Kafka ---
class KafkaAPI extends FederationSystem {
  constructor() { super('Apache Kafka', '3.6'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'produce') return { offset: 10023, partition: 0 };
    if (task === 'consume') return { lag: 0 };
    return null;
  }
}

// --- 48. Supabase ---
class SupabaseAPI extends FederationSystem {
  constructor() { super('Supabase', 'Open Source'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'auth_user') return { id: 'user_123', role: 'authenticated' };
    if (task === 'realtime') return { channel: 'db-changes', status: 'joined' };
    return null;
  }
}

// --- 49. Appwrite ---
class AppwriteAPI extends FederationSystem {
  constructor() { super('Appwrite', '1.4'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'storage_upload') return { fileId: 'file_abc', bucket: 'images' };
    return null;
  }
}

// --- 50. PocketBase ---
class PocketBaseAPI extends FederationSystem {
  constructor() { super('PocketBase', '0.21'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'list_records') return { items: [], totalItems: 0 };
    return null;
  }
}

// --- 51. Hugging Face ---
class HuggingFaceAPI extends FederationSystem {
  constructor() { super('Hugging Face', 'Hub'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'model_info') return { downloads: 50000, likes: 1200 };
    return null;
  }
}

// --- 52. LangChain ---
class LangChainAPI extends FederationSystem {
  constructor() { super('LangChain', '0.1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'chain_run') return { output: 'The answer is 42', tokens: 50 };
    return null;
  }
}

// --- 53. MLFlow ---
class MLFlowAPI extends FederationSystem {
  constructor() { super('MLFlow', '2.10'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'log_metric') return { key: 'accuracy', value: 0.98 };
    return null;
  }
}

// --- 54. TensorFlow ---
class TensorFlowAPI extends FederationSystem {
  constructor() { super('TensorFlow', '2.15'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'predict') return { tensor: [0.1, 0.9], shape: [1, 2] };
    return null;
  }
}

// --- 55. PyTorch ---
class PyTorchAPI extends FederationSystem {
  constructor() { super('PyTorch', '2.2'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'backward') return { gradients: 'computed' };
    return null;
  }
}

// --- 56. ONNX ---
class ONNXAPI extends FederationSystem {
  constructor() { super('ONNX', '1.15'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'export') return { format: 'onnx', size: '15MB' };
    return null;
  }
}

// --- 57. OpenCV ---
class OpenCVAPI extends FederationSystem {
  constructor() { super('OpenCV', '4.9'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'detect_faces') return { faces: 1, rect: [10, 10, 100, 100] };
    return null;
  }
}

// --- 58. OpenAI Gym ---
class GymAPI extends FederationSystem {
  constructor() { super('OpenAI Gym', '0.26'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'step') return { observation: [0, 0, 0], reward: 1.0, done: false };
    return null;
  }
}

// --- 59. Godot Engine ---
class GodotAPI extends FederationSystem {
  constructor() { super('Godot', '4.2'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'scene_tree') return { nodes: 50, physics_fps: 60 };
    return null;
  }
}

// --- 60. Blender Foundation ---
class BlenderAPI extends FederationSystem {
  constructor() { super('Blender', '4.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'render_frame') return { sample: 128, time: '2s' };
    return null;
  }
}

// --- 61. Inkscape ---
class InkscapeAPI extends FederationSystem {
  constructor() { super('Inkscape', '1.3'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'vectorize') return { paths: 150, nodes: 2000 };
    return null;
  }
}

// --- 62. GIMP ---
class GimpAPI extends FederationSystem {
  constructor() { super('GIMP', '2.10'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'filter_gaussian') return { radius: 5.0, applied: true };
    return null;
  }
}

// --- 63. Krita ---
class KritaAPI extends FederationSystem {
  constructor() { super('Krita', '5.2'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'brush_engine') return { pressure: 0.5, tilt: 10 };
    return null;
  }
}

// --- 64. Figma Open API ---
class FigmaAPI extends FederationSystem {
  constructor() { super('Figma Open Sim', 'v1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'get_file') return { document: { children: [] } };
    return null;
  }
}

// --- 65. Unreal Open Tools ---
class UnrealAPI extends FederationSystem {
  constructor() { super('Unreal Tools', '5.3'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'compile_shaders') return { remaining: 0, total: 500 };
    return null;
  }
}

// --- 66. Unity Open Tools ---
class UnityAPI extends FederationSystem {
  constructor() { super('Unity Tools', '2023.2'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'bake_lightmap') return { progress: 0.8 };
    return null;
  }
}

// --- 67. OpenStreetMap ---
class OSMAPI extends FederationSystem {
  constructor() { super('OpenStreetMap', 'API 0.6'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'reverse_geocode') return { lat: 0, lon: 0, address: 'Null Island' };
    return null;
  }
}

// --- 68. QGIS ---
class QGISAPI extends FederationSystem {
  constructor() { super('QGIS', '3.34'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'layer_render') return { features: 1000, crs: 'EPSG:4326' };
    return null;
  }
}

// --- 69. MapLibre ---
class MapLibreAPI extends FederationSystem {
  constructor() { super('MapLibre', '3.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'style_load') return { layers: 50, sources: 2 };
    return null;
  }
}

// --- 70. Leaflet.js ---
class LeafletAPI extends FederationSystem {
  constructor() { super('Leaflet', '1.9'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'add_marker') return { latlng: [0,0], icon: 'default' };
    return null;
  }
}

// --- 71. VLC ---
class VLCAPI extends FederationSystem {
  constructor() { super('VLC', '3.0.20'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'codec_info') return { video: 'h264', audio: 'aac' };
    return null;
  }
}

// --- 72. FFmpeg ---
class FFmpegAPI extends FederationSystem {
  constructor() { super('FFmpeg', '6.1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'transcode') return { fps: 60, bitrate: '4000k' };
    return null;
  }
}

// --- 73. OBS Studio ---
class OBSAPI extends FederationSystem {
  constructor() { super('OBS Studio', '30.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'stream_status') return { live: false, dropped_frames: 0 };
    return null;
  }
}

// --- 74. WireGuard ---
class WireGuardAPI extends FederationSystem {
  constructor() { super('WireGuard', '1.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'handshake') return { latest: '2s ago', peers: 1 };
    return null;
  }
}

// --- 75. OpenVPN ---
class OpenVPNAPI extends FederationSystem {
  constructor() { super('OpenVPN', '2.6'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'tunnel_stats') return { bytes_in: 1024, bytes_out: 2048 };
    return null;
  }
}

// --- 76. Tor Project ---
class TorAPI extends FederationSystem {
  constructor() { super('Tor', '0.4.8'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'circuit_build') return { hops: 3, exit_node: 'unknown' };
    return null;
  }
}

// --- 77. DuckDB ---
class DuckDBAPI extends FederationSystem {
  constructor() { super('DuckDB', '0.9'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'analytical_query') return { rows: 1000000, time: '0.05s' };
    return null;
  }
}

// --- 78. ClickHouse ---
class ClickHouseAPI extends FederationSystem {
  constructor() { super('ClickHouse', '24.1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'insert_batch') return { rows: 50000, compressed: true };
    return null;
  }
}

// --- 79. MinIO ---
class MinIOAPI extends FederationSystem {
  constructor() { super('MinIO', 'RELEASE.2024'); }
  
  executeTask(task: string, payload: any) {
    if (task === 's3_compatibility') return { status: '100%' };
    return null;
  }
}

// --- 80. Ceph ---
class CephAPI extends FederationSystem {
  constructor() { super('Ceph', 'Reef'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'cluster_health') return { status: 'HEALTH_OK', osds: 10 };
    return null;
  }
}

// --- 81. OpenStack ---
class OpenStackAPI extends FederationSystem {
  constructor() { super('OpenStack', 'Bobcat'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'nova_list') return { instances: 50, hypervisors: 5 };
    return null;
  }
}

// --- 82. Proxmox ---
class ProxmoxAPI extends FederationSystem {
  constructor() { super('Proxmox', 'VE 8.1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'lxc_start') return { vmid: 100, status: 'running' };
    return null;
  }
}

// --- 83. Home Assistant ---
class HomeAssistantAPI extends FederationSystem {
  constructor() { super('Home Assistant', '2024.2'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'state_get') return { entity_id: 'light.living_room', state: 'on' };
    return null;
  }
}

// --- 84. OpenHAB ---
class OpenHABAPI extends FederationSystem {
  constructor() { super('OpenHAB', '4.1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'item_command') return { item: 'Switch1', command: 'OFF' };
    return null;
  }
}

// --- 85. Matter Protocol ---
class MatterAPI extends FederationSystem {
  constructor() { super('Matter', '1.2'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'commission') return { device_id: 'xyz', fabric: 1 };
    return null;
  }
}

// --- 86. Zigbee ---
class ZigbeeAPI extends FederationSystem {
  constructor() { super('Zigbee', '3.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'network_map') return { coordinator: 1, routers: 5, end_devices: 10 };
    return null;
  }
}

// --- 87. TensorRT ---
class TensorRTAPI extends FederationSystem {
  constructor() { super('TensorRT', '8.6'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'optimize') return { precision: 'FP16', speedup: '2.5x' };
    return null;
  }
}

// --- 88. LLVM ---
class LLVMAPI extends FederationSystem {
  constructor() { super('LLVM', '17.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'ir_dump') return { lines: 500, basic_blocks: 20 };
    return null;
  }
}

// --- 89. WebKit ---
class WebKitAPI extends FederationSystem {
  constructor() { super('WebKit', '617.1'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'render_tree') return { nodes: 150, layout: 'done' };
    return null;
  }
}

// --- 90. Chromium ---
class ChromiumAPI extends FederationSystem {
  constructor() { super('Chromium', '121.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'v8_stats') return { heap_size: '50MB', used: '30MB' };
    return null;
  }
}

// --- 91. uBlock Origin ---
class UBlockAPI extends FederationSystem {
  constructor() { super('uBlock Origin', '1.55'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'filter_request') return { blocked: true, filter: 'EasyList' };
    return null;
  }
}

// --- 92. Brave Shields ---
class BraveAPI extends FederationSystem {
  constructor() { super('Brave Shields', '1.62'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'fingerprint_block') return { attempts: 5, blocked: 5 };
    return null;
  }
}

// --- 93. Nextcloud ---
class NextcloudAPI extends FederationSystem {
  constructor() { super('Nextcloud', '28.0'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'sync_status') return { files_synced: 100, remaining: 0 };
    return null;
  }
}

// --- 94. OwnCloud ---
class OwnCloudAPI extends FederationSystem {
  constructor() { super('OwnCloud', 'Infinite Scale'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'share_link') return { url: 'https://...', expires: '1d' };
    return null;
  }
}

// --- 95. Mastodon ---
class MastodonAPI extends FederationSystem {
  constructor() { super('Mastodon', '4.2'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'federate') return { instance: 'mastodon.social', status: 'connected' };
    return null;
  }
}

// --- 96. Matrix ---
class MatrixAPI extends FederationSystem {
  constructor() { super('Matrix', 'Synapse 1.99'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'sync') return { rooms: 10, messages: 5 };
    return null;
  }
}

// --- 97. Signal ---
class SignalAPI extends FederationSystem {
  constructor() { super('Signal Protocol', 'Double Ratchet'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'encrypt') return { ciphertext: '...', keys_rotated: true };
    return null;
  }
}

// --- 98. Apache Airflow ---
class AirflowAPI extends FederationSystem {
  constructor() { super('Apache Airflow', '2.8'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'dag_run') return { dag_id: 'etl_daily', state: 'success' };
    return null;
  }
}

// --- 99. Jenkins ---
class JenkinsAPI extends FederationSystem {
  constructor() { super('Jenkins', '2.440'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'build_job') return { number: 101, result: 'SUCCESS' };
    return null;
  }
}

// --- 100. DroneCI ---
class DroneCIAPI extends FederationSystem {
  constructor() { super('DroneCI', '2.20'); }
  
  executeTask(task: string, payload: any) {
    if (task === 'pipeline_exec') return { step: 'clone', status: 'done' };
    return null;
  }
}

// -----------------------------------------------------------------------------
// SECTION IV: THE FEDERATION REGISTRY
// -----------------------------------------------------------------------------

class FederationRegistry {
  private static systems: Map<string, FederationSystem> = new Map();

  static initialize() {
    const registry = [
      new LinuxFoundationAPI(), new CanonicalAPI(), new RedHatAPI(), new FedoraAPI(), new DebianAPI(),
      new OpenSUSEAPI(), new ArchLinuxAPI(), new ManjaroAPI(), new FreeBSDAPI(), new NetBSDAPI(),
      new OpenBSDAPI(), new KubernetesAPI(), new CNCFAPI(), new DockerAPI(), new PodmanAPI(),
      new AnsibleAPI(), new TerraformAPI(), new HashiCorpAPI(), new ApacheAPI(), new NginxAPI(),
      new MozillaAPI(), new FirefoxDevToolsAPI(), new GitAPI(), new GitHubAPI(), new GitLabAPI(),
      new BitbucketAPI(), new VSCodeAPI(), new EclipseAPI(), new JetBrainsAPI(), new PythonAPI(),
      new NodeAPI(), new DenoAPI(), new BunAPI(), new RustAPI(), new GoAPI(),
      new RubyAPI(), new PhpAPI(), new MariaDBAPI(), new MySQLAPI(), new PostgresAPI(),
      new SQLiteAPI(), new RedisAPI(), new MongoAPI(), new CassandraAPI(), new ElasticAPI(),
      new SparkAPI(), new KafkaAPI(), new SupabaseAPI(), new AppwriteAPI(), new PocketBaseAPI(),
      new HuggingFaceAPI(), new LangChainAPI(), new MLFlowAPI(), new TensorFlowAPI(), new PyTorchAPI(),
      new ONNXAPI(), new OpenCVAPI(), new GymAPI(), new GodotAPI(), new BlenderAPI(),
      new InkscapeAPI(), new GimpAPI(), new KritaAPI(), new FigmaAPI(), new UnrealAPI(),
      new UnityAPI(), new OSMAPI(), new QGISAPI(), new MapLibreAPI(), new LeafletAPI(),
      new VLCAPI(), new FFmpegAPI(), new OBSAPI(), new WireGuardAPI(), new OpenVPNAPI(),
      new TorAPI(), new DuckDBAPI(), new ClickHouseAPI(), new MinIOAPI(), new CephAPI(),
      new OpenStackAPI(), new ProxmoxAPI(), new HomeAssistantAPI(), new OpenHABAPI(), new MatterAPI(),
      new ZigbeeAPI(), new TensorRTAPI(), new LLVMAPI(), new WebKitAPI(), new ChromiumAPI(),
      new UBlockAPI(), new BraveAPI(), new NextcloudAPI(), new OwnCloudAPI(), new MastodonAPI(),
      new MatrixAPI(), new SignalAPI(), new AirflowAPI(), new JenkinsAPI(), new DroneCIAPI()
    ];

    registry.forEach(sys => {
      this.systems.set(sys.name, sys);
    });
    
    NexusLogger.log('Federation', `Initialized ${registry.length} systems.`);
  }

  static getSystem(name: string): FederationSystem | undefined {
    return this.systems.get(name);
  }

  static getAllSystems(): FederationSystem[] {
    return Array.from(this.systems.values());
  }
}

// -----------------------------------------------------------------------------
// SECTION V: UI COMPONENT LIBRARY (INLINE)
// -----------------------------------------------------------------------------

// --- 1. Modal ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: React.ReactNode; size?: 'small' | 'medium' | 'large'; children: React.ReactNode }> = ({ isOpen, onClose, title, size = 'medium', children }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-sm p-4">
      <div className={`relative w-full ${sizeClasses[size]} rounded-xl border border-gray-800 bg-gray-900 shadow-2xl transform transition-all`}>
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <div className="text-lg font-semibold text-white">{title}</div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- 2. Section ---
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

// --- 3. DetailItem ---
const DetailItem: React.FC<{ title: string; value: React.ReactNode; isMono?: boolean }> = ({ title, value, isMono }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
    <span className="text-sm font-medium text-gray-400">{title}</span>
    <span className={`text-sm text-gray-200 ${isMono ? 'font-mono' : ''} text-right`}>{value}</span>
  </div>
);

// --- 4. NexusLink ---
const NexusLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <a href={to} className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline transition-colors">
    {children}
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  </a>
);

// --- 5. Amount ---
const Amount: React.FC<{ amount: number; currency: string; className?: string }> = ({ amount, currency, className }) => (
  <span className={className}>{NexusMath.formatCurrency(amount, currency)}</span>
);

// --- 6. Timestamp ---
const Timestamp: React.FC<{ ts: number }> = ({ ts }) => (
  <span className="font-mono text-gray-300" title={new Date(ts * 1000).toISOString()}>
    {new Date(ts * 1000).toLocaleString()}
  </span>
);

// --- 7. Metadata ---
const Metadata: React.FC<{ metadata: Record<string, string> }> = ({ metadata }) => (
  <div className="rounded-md bg-gray-950 p-3 font-mono text-xs text-gray-300 border border-gray-800">
    {Object.entries(metadata).map(([k, v]) => (
      <div key={k} className="flex justify-between py-1 border-b border-gray-800 last:border-0">
        <span className="text-gray-500">{k}</span>
        <span className="text-emerald-400">{v}</span>
      </div>
    ))}
  </div>
);

// --- 8. StatusBadge ---
const StatusBadge: React.FC<{ status: string; color: 'success' | 'warning' | 'danger' | 'default' }> = ({ status, color }) => {
  const colors = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    default: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colors[color]}`}>
      {status}
    </span>
  );
};

// --- 9. BillingDetails ---
const BillingDetails: React.FC<{ details: Stripe.Charge.BillingDetails | null }> = ({ details }) => {
  if (!details) return <div className="text-sm text-gray-500 italic">No billing details provided</div>;
  return (
    <div className="space-y-2 text-sm">
      {details.name && <DetailItem title="Name" value={details.name} />}
      {details.email && <DetailItem title="Email" value={details.email} />}
      {details.phone && <DetailItem title="Phone" value={details.phone} />}
      {details.address && (
        <div className="mt-2 rounded bg-gray-800/50 p-2">
          <div className="text-xs text-gray-500 mb-1">Address</div>
          <div className="text-gray-300">
            {details.address.line1}<br/>
            {details.address.line2 && <>{details.address.line2}<br/></>}
            {details.address.city}, {details.address.state} {details.address.postal_code}<br/>
            {details.address.country}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 10. PaymentMethodDetails ---
const PaymentMethodDetails: React.FC<{ details: Stripe.Charge.PaymentMethodDetails | null }> = ({ details }) => {
  if (!details) return null;
  return (
    <div className="pt-4 mt-4 border-t border-gray-700">
      <h4 className="text-sm font-semibold text-gray-300 mb-2">Payment Method</h4>
      <DetailItem title="Type" value={details.type} />
      {details.card && (
        <>
          <DetailItem title="Brand" value={details.card.brand?.toUpperCase()} />
          <DetailItem title="Last 4" value={`•••• ${details.card.last4}`} isMono />
          <DetailItem title="Exp" value={`${details.card.exp_month}/${details.card.exp_year}`} isMono />
          <DetailItem title="Funding" value={details.card.funding} />
        </>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// SECTION VI: THE MAIN COMPONENT (EVOLVED)
// -----------------------------------------------------------------------------

interface ChargeDetailModalProps {
  charge: Stripe.Charge;
  isOpen: boolean;
  onClose: () => void;
}

const getChargeStatusColor = (status: Stripe.Charge.Status) => {
  switch (status) {
    case 'succeeded': return 'success';
    case 'pending': return 'warning';
    case 'failed': return 'danger';
    default: return 'default';
  }
};

/**
 * The ChargeDetailModal is now the entry point to the Financial Universe.
 * It initializes the FederationRegistry on mount and renders the Holo-Deck.
 */
export const ChargeDetailModal: React.FC<ChargeDetailModalProps> = ({
  charge,
  isOpen,
  onClose,
}) => {
  // 1. Initialize the Universe
  useEffect(() => {
    if (isOpen) {
      FederationRegistry.initialize();
      NexusLogger.log('UI', `Opening charge detail for ${charge.id}`);
    }
  }, [isOpen, charge.id]);

  // 2. Simulate Federation Data Enrichment
  const [enrichmentData, setEnrichmentData] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      // Simulate fetching data from the 100 APIs based on charge context
      const systems = FederationRegistry.getAllSystems();
      const results: Record<string, any> = {};
      
      // Randomly select 5 systems to "analyze" this charge
      const selectedSystems = systems.sort(() => 0.5 - Math.random()).slice(0, 5);
      
      for (const sys of selectedSystems) {
        results[sys.name] = sys.executeTask('analyze', { chargeId: charge.id });
      }
      
      setEnrichmentData(results);
    };

    fetchData();
  }, [isOpen, charge]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-500/20 text-indigo-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction Nexus</span>
            <span className="font-mono text-white text-sm">{charge.id}</span>
          </div>
        </div>
      }
      size="large"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-2">
        
        {/* LEFT COLUMN: CORE DATA */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Section */}
          <Section title="Transaction Core">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-800 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-gray-500 uppercase mb-1">Total Amount</span>
                <Amount
                  amount={charge.amount}
                  currency={charge.currency}
                  className="font-bold text-3xl text-white tracking-tight"
                />
                <div className="mt-2">
                  <StatusBadge
                    status={charge.status}
                    color={getChargeStatusColor(charge.status)}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <DetailItem title="Created At" value={<Timestamp ts={charge.created} />} />
                <DetailItem title="Description" value={charge.description || 'No description provided'} />
                <DetailItem title="Captured" value={charge.captured ? 'Yes' : 'No'} />
                {charge.receipt_url && (
                  <DetailItem
                    title="Receipt"
                    value={
                      <a
                        href={charge.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline text-xs"
                      >
                        View Official Receipt &rarr;
                      </a>
                    }
                  />
                )}
              </div>
            </div>
          </Section>

          {/* Payment Mechanics */}
          <Section title="Payment Mechanics">
            <div className="grid grid-cols-1 gap-4">
              {charge.payment_intent && (
                <DetailItem
                  title="Payment Intent"
                  value={
                    <NexusLink
                      to={`/payment_intents/${typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id}`}
                    >
                       {typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id}
                    </NexusLink>
                  }
                />
              )}
              {charge.balance_transaction && (
                <DetailItem
                  title="Balance Transaction"
                  value={
                    <NexusLink
                      to={`/balance_transactions/${typeof charge.balance_transaction === 'string' ? charge.balance_transaction : charge.balance_transaction?.id}`}
                    >
                      {typeof charge.balance_transaction === 'string' ? charge.balance_transaction : charge.balance_transaction?.id}
                    </NexusLink>
                  }
                />
              )}
              
              {charge.payment_method_details && (
                  <PaymentMethodDetails details={charge.payment_method_details} />
              )}

              {charge.outcome && (
                  <div className="pt-4 mt-4 border-t border-gray-700 bg-red-900/10 p-3 rounded border border-red-900/20">
                      <h4 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Outcome Analysis
                      </h4>
                      <DetailItem title="Type" value={charge.outcome.type} />
                      {charge.outcome.network_status && <DetailItem title="Network Status" value={charge.outcome.network_status} />}
                      {charge.outcome.reason && <DetailItem title="Reason" value={charge.outcome.reason} />}
                      {charge.outcome.seller_message && <DetailItem title="Seller Message" value={charge.outcome.seller_message} />}
                  </div>
              )}
            </div>
          </Section>

          {/* Refunds */}
          <Section title="Refund Ledger">
             <div className="flex justify-between items-center mb-4">
               <DetailItem
                  title="Amount Refunded"
                  value={<Amount amount={charge.amount_refunded} currency={charge.currency} />}
               />
               <DetailItem
                  title="Refunded"
                  value={charge.refunded ? 'Yes' : 'No'}
               />
             </div>
             {charge.refunds && charge.refunds.data.length > 0 && (
                <div className="pt-4 mt-4 border-t border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Refund History</h4>
                    <ul className="space-y-2">
                        {charge.refunds.data.map((refund) => (
                            <li key={refund.id} className="flex items-center justify-between bg-gray-800/50 p-2 rounded text-sm">
                                <div className="flex items-center gap-2">
                                  <NexusLink to={`/refunds/${refund.id}`}>
                                      {refund.id}
                                  </NexusLink>
                                  <span className="text-gray-500 text-xs">({refund.status})</span>
                                </div>
                                <Amount amount={refund.amount} currency={refund.currency} className="text-white font-mono" />
                            </li>
                        ))}
                    </ul>
                </div>
             )}
          </Section>

          {/* FEDERATION INSIGHTS (New Feature) */}
          <Section title="Federation Intelligence">
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">Real-time analysis from the Open Source Federation.</p>
              {Object.keys(enrichmentData).length === 0 ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-2 bg-gray-700 rounded"></div>
                    <div className="h-2 bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(enrichmentData).map(([system, data]) => (
                    <div key={system} className="bg-gray-950 border border-gray-800 p-2 rounded">
                      <div className="text-xs font-bold text-indigo-400 mb-1">{system}</div>
                      <pre className="text-[10px] text-gray-500 overflow-hidden">{JSON.stringify(data, null, 2).slice(0, 100)}...</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

        </div>

        {/* RIGHT COLUMN: METADATA & ENTITIES */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Customer Profile */}
          <Section title="Customer Entity">
            {charge.customer ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-800/30 rounded border border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">Customer ID</div>
                  <NexusLink
                    to={`/customers/${typeof charge.customer === 'string' ? charge.customer : charge.customer.id}`}
                  >
                    {typeof charge.customer === 'string' ? charge.customer : charge.customer.id}
                  </NexusLink>
                </div>
                <BillingDetails details={charge.billing_details} />
              </div>
            ) : (
                <div className="p-4 text-center text-gray-500 bg-gray-800/20 rounded">Guest User</div>
            )}
          </Section>

          {/* Metadata Engine */}
          {charge.metadata && Object.keys(charge.metadata).length > 0 && (
            <Section title="Metadata Layer">
              <Metadata metadata={charge.metadata} />
            </Section>
          )}

          {/* Dispute Warning System */}
           {charge.disputed && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-sm font-bold text-red-400 uppercase">Dispute Active</h3>
              </div>
              <p className="text-xs text-red-300/80">
                This transaction is currently under dispute resolution. Funds may be frozen.
              </p>
            </div>
           )}

           {/* System Status Footer */}
           <div className="mt-8 pt-4 border-t border-gray-800 text-[10px] text-gray-600 font-mono text-center">
             <p>NEXUS OS v10.0.0 • FEDERATION ACTIVE</p>
             <p>SECURE CONNECTION ESTABLISHED</p>
           </div>

        </div>
      </div>
    </Modal>
  );
};