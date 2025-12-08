import React, { useState, useEffect, useReducer, useRef, useMemo, useCallback } from 'react';

// -----------------------------------------------------------------------------
// SECTION I: THE UNIVERSAL CONSTANTS & CORE TYPES
// -----------------------------------------------------------------------------
// The "Soul" of the original file was the BalanceTransaction.
// We expand this into the "UniversalTransaction": the atomic unit of reality
// in this simulated Open Source Universe.

type Currency = 'USD' | 'EUR' | 'BTC' | 'ETH' | 'COMPUTE' | 'ENTROPY' | 'KARMA';
type TransactionStatus = 'available' | 'pending' | 'failed' | 'quantum_superposition' | 'compiled' | 'runtime_error';
type EntityType = 'OS' | 'KERNEL' | 'CONTAINER' | 'LANGUAGE' | 'DATABASE' | 'AI_MODEL' | 'PROTOCOL' | 'TOOL';

interface UniversalTransaction {
  id: string;
  timestamp: number;
  amount: number;
  currency: Currency;
  source: string; // The ID of the entity initiating the transaction
  destination: string; // The ID of the entity receiving the transaction
  type: string; // e.g., 'kernel_panic', 'git_commit', 'tensor_flow'
  description: string;
  fee: number;
  net: number;
  status: TransactionStatus;
  metadata: Record<string, any>;
  entropy_delta: number;
  hash: string;
}

interface EntityState {
  id: string;
  name: string;
  type: EntityType;
  health: number; // 0-100
  uptime: number; // seconds
  version: string;
  config: Record<string, any>;
  logs: string[];
}

// -----------------------------------------------------------------------------
// SECTION II: THE SIMULATION KERNEL (UNIVERSE FORGE)
// -----------------------------------------------------------------------------
// This engine drives the interactions between the 100 simulated APIs.

class UniverseForge {
  private static instance: UniverseForge;
  private ledger: UniversalTransaction[] = [];
  private entities: Map<string, OpenSourceEntity> = new Map();
  private tickRate: number = 100; // ms
  private entropy: number = 0;

  private constructor() {
    this.entropy = Math.random();
  }

  public static getInstance(): UniverseForge {
    if (!UniverseForge.instance) {
      UniverseForge.instance = new UniverseForge();
    }
    return UniverseForge.instance;
  }

  public registerEntity(entity: OpenSourceEntity) {
    this.entities.set(entity.id, entity);
  }

  public getEntity(id: string): OpenSourceEntity | undefined {
    return this.entities.get(id);
  }

  public recordTransaction(txn: UniversalTransaction) {
    this.ledger.unshift(txn);
    // Enforce ledger limit to prevent memory overflow in this simulation
    if (this.ledger.length > 5000) {
      this.ledger.pop();
    }
  }

  public getLedger(): UniversalTransaction[] {
    return this.ledger;
  }

  public generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(16);
  }

  public tick() {
    this.entropy += 0.001;
    this.entities.forEach(entity => entity.update(this.entropy));
  }
}

// -----------------------------------------------------------------------------
// SECTION III: THE OPEN SOURCE API UNIVERSE (100 SIMULATED ENTITIES)
// -----------------------------------------------------------------------------
// Base Class for all simulated entities.

abstract class OpenSourceEntity {
  public id: string;
  public name: string;
  public state: EntityState;
  protected forge: UniverseForge;

  constructor(name: string, type: EntityType, version: string) {
    this.name = name;
    this.id = name.toLowerCase().replace(/\s+/g, '_');
    this.forge = UniverseForge.getInstance();
    this.state = {
      id: this.id,
      name: this.name,
      type: type,
      health: 100,
      uptime: 0,
      version: version,
      config: {},
      logs: []
    };
    this.forge.registerEntity(this);
    this.initialize();
  }

  protected log(message: string) {
    const timestamp = new Date().toISOString();
    this.state.logs.push(`[${timestamp}] [${this.name}] ${message}`);
    if (this.state.logs.length > 50) this.state.logs.shift();
  }

  protected createTransaction(
    destination: string,
    amount: number,
    type: string,
    desc: string
  ) {
    const txn: UniversalTransaction = {
      id: `txn_${this.forge.generateHash(Math.random().toString())}`,
      timestamp: Date.now() / 1000,
      amount: amount,
      currency: 'COMPUTE',
      source: this.id,
      destination: destination,
      type: type,
      description: desc,
      fee: amount * 0.01,
      net: amount * 0.99,
      status: 'available',
      metadata: {},
      entropy_delta: Math.random() * 0.1,
      hash: this.forge.generateHash(desc + Date.now())
    };
    this.forge.recordTransaction(txn);
  }

  abstract initialize(): void;
  abstract update(globalEntropy: number): void;
}

// --- 1. Linux Foundation ---
class LinuxFoundation extends OpenSourceEntity {
  constructor() { super('Linux Foundation', 'OS', '6.8.0'); }
  initialize() { this.state.config = { kernel_modules: 15000, contributors: 50000 }; }
  update(entropy: number) {
    this.state.uptime++;
    if (this.state.uptime % 10 === 0) {
      this.createTransaction('canonical', 100, 'kernel_merge', 'Merging upstream kernel patches');
      this.log('Kernel patch merged from stable tree.');
    }
  }
  public certifyCompliance(project: string): boolean {
    this.log(`Certifying compliance for ${project}`);
    return true;
  }
}

// --- 2. Canonical (Ubuntu) ---
class Canonical extends OpenSourceEntity {
  constructor() { super('Canonical', 'OS', '24.04 LTS'); }
  initialize() { this.state.config = { snap_packages: 4000, apt_repos: 50 }; }
  update(entropy: number) {
    if (Math.random() > 0.9) {
      this.createTransaction('debian_project', 50, 'upstream_sync', 'Syncing with Debian Sid');
    }
  }
  public deploySnap(packageName: string) {
    this.log(`Deploying snap: ${packageName}`);
    this.state.health -= 0.1; // Snap overhead
  }
}

// --- 3. Red Hat ---
class RedHat extends OpenSourceEntity {
  constructor() { super('Red Hat', 'OS', 'RHEL 9.3'); }
  initialize() { this.state.config = { enterprise_contracts: 9999, podman_active: true }; }
  update(entropy: number) {
    if (Math.random() > 0.95) {
      this.createTransaction('fedora_project', 200, 'downstream_stabilization', 'Stabilizing Fedora features for RHEL');
    }
  }
  public auditSecurity() {
    this.log('SELinux policy audit complete. Enforcing.');
  }
}

// --- 4. Fedora Project ---
class FedoraProject extends OpenSourceEntity {
  constructor() { super('Fedora Project', 'OS', '40'); }
  initialize() { this.state.config = { bleeding_edge: true, innovation_rate: 0.99 }; }
  update(entropy: number) {
    this.state.health = 90 + (Math.sin(entropy) * 10); // Volatile health due to bleeding edge
    if (Math.random() > 0.8) {
      this.createTransaction('linux_foundation', 10, 'feature_proposal', 'Proposing new kernel scheduler');
    }
  }
}

// --- 5. Debian Project ---
class DebianProject extends OpenSourceEntity {
  constructor() { super('Debian Project', 'OS', '12 (Bookworm)'); }
  initialize() { this.state.config = { stability: 'rock_solid', packages: 60000 }; }
  update(entropy: number) {
    this.state.health = 100; // Debian never breaks
    if (this.state.uptime % 100 === 0) {
      this.log('Universal operating system stability check passed.');
    }
  }
}

// --- 6. OpenSUSE ---
class OpenSUSE extends OpenSourceEntity {
  constructor() { super('OpenSUSE', 'OS', 'Tumbleweed'); }
  initialize() { this.state.config = { build_service: 'OBS', yast_modules: 45 }; }
  update(entropy: number) {
    if (Math.random() > 0.85) {
      this.createTransaction('suse_enterprise', 50, 'snapshot_rollback', 'Btrfs snapshot rollback test');
    }
  }
}

// --- 7. Arch Linux ---
class ArchLinux extends OpenSourceEntity {
  constructor() { super('Arch Linux', 'OS', 'Rolling'); }
  initialize() { this.state.config = { pacman_db_size: 'huge', aur_helpers: ['yay', 'paru'] }; }
  update(entropy: number) {
    if (Math.random() > 0.5) {
      this.log('Pacman -Syu executed.');
      this.createTransaction('user', 1, 'manual_intervention', 'Manual intervention required for update');
    }
  }
}

// --- 8. Manjaro ---
class Manjaro extends OpenSourceEntity {
  constructor() { super('Manjaro', 'OS', '23.1'); }
  initialize() { this.state.config = { branch: 'stable', delay: '2_weeks' }; }
  update(entropy: number) {
    if (Math.random() > 0.9) {
      this.createTransaction('arch_linux', 10, 'repo_sync', 'Syncing from Arch Stable');
    }
  }
}

// --- 9. FreeBSD ---
class FreeBSD extends OpenSourceEntity {
  constructor() { super('FreeBSD', 'OS', '14.0-RELEASE'); }
  initialize() { this.state.config = { zfs_pool: 'tank', jails: 50 }; }
  update(entropy: number) {
    if (this.state.uptime % 50 === 0) {
      this.log('ZFS Scrub initiated.');
      this.createTransaction('storage_controller', 500, 'io_burst', 'ZFS Scrub I/O');
    }
  }
}

// --- 10. NetBSD ---
class NetBSD extends OpenSourceEntity {
  constructor() { super('NetBSD', 'OS', '10.0'); }
  initialize() { this.state.config = { portability: 'infinite', toaster_support: true }; }
  update(entropy: number) {
    this.log('Running on simulated toaster architecture.');
  }
}

// --- 11. OpenBSD ---
class OpenBSD extends OpenSourceEntity {
  constructor() { super('OpenBSD', 'OS', '7.5'); }
  initialize() { this.state.config = { secure_by_default: true, pledge_calls: 10000 }; }
  update(entropy: number) {
    if (Math.random() > 0.99) {
      this.log('Only two remote holes in a heck of a long time.');
    }
  }
}

// --- 12. Kubernetes ---
class Kubernetes extends OpenSourceEntity {
  constructor() { super('Kubernetes', 'CONTAINER', '1.30'); }
  initialize() { this.state.config = { pods: 0, nodes: 3, control_plane: 'healthy' }; }
  update(entropy: number) {
    const desiredState = Math.floor(entropy * 100);
    const currentState = this.state.config.pods;
    if (currentState < desiredState) {
      this.state.config.pods++;
      this.createTransaction('docker', 5, 'schedule_pod', 'Scheduling new pod on node-1');
    } else if (currentState > desiredState) {
      this.state.config.pods--;
      this.log('Garbage collecting terminated pod.');
    }
  }
}

// --- 13. CNCF ---
class CNCF extends OpenSourceEntity {
  constructor() { super('CNCF', 'PROTOCOL', 'v1'); }
  initialize() { this.state.config = { projects: 180, graduated: 25 }; }
  update(entropy: number) {
    if (Math.random() > 0.98) {
      this.createTransaction('kubernetes', 1000, 'graduation', 'Project graduation ceremony');
    }
  }
}

// --- 14. Docker ---
class Docker extends OpenSourceEntity {
  constructor() { super('Docker', 'CONTAINER', '26.0'); }
  initialize() { this.state.config = { images: 500, containers: 20 }; }
  update(entropy: number) {
    if (Math.random() > 0.9) {
      this.log('Building layer sha256:...');
      this.createTransaction('linux_foundation', 2, 'syscall', 'cgroup resource allocation');
    }
  }
}

// --- 15. Podman ---
class Podman extends OpenSourceEntity {
  constructor() { super('Podman', 'CONTAINER', '5.0'); }
  initialize() { this.state.config = { daemonless: true, rootless: true }; }
  update(entropy: number) {
    this.log('Generating systemd unit for container.');
  }
}

// --- 16. Ansible ---
class Ansible extends OpenSourceEntity {
  constructor() { super('Ansible', 'TOOL', '9.0'); }
  initialize() { this.state.config = { playbooks: 50, inventory: 'dynamic' }; }
  update(entropy: number) {
    if (Math.random() > 0.8) {
      this.createTransaction('red_hat', 10, 'ssh_connect', 'Executing playbook task via SSH');
    }
  }
}

// --- 17. Terraform ---
class Terraform extends OpenSourceEntity {
  constructor() { super('Terraform', 'TOOL', '1.8'); }
  initialize() { this.state.config = { state_file: 's3_backend', providers: 10 }; }
  update(entropy: number) {
    if (Math.random() > 0.9) {
      this.log('Plan: 5 to add, 0 to change, 0 to destroy.');
      this.createTransaction('aws_sim', 500, 'api_call', 'Provisioning EC2 instance');
    }
  }
}

// --- 18. HashiCorp ---
class HashiCorp extends OpenSourceEntity {
  constructor() { super('HashiCorp', 'TOOL', 'Vault 1.16'); }
  initialize() { this.state.config = { secrets: 'encrypted', lease_duration: 3600 }; }
  update(entropy: number) {
    this.log('Rotating secrets.');
  }
}

// --- 19. Apache Foundation ---
class ApacheFoundation extends OpenSourceEntity {
  constructor() { super('Apache Foundation', 'PROTOCOL', '2.0'); }
  initialize() { this.state.config = { projects: 350, incubators: 40 }; }
  update(entropy: number) {
    if (Math.random() > 0.9) {
      this.createTransaction('apache_spark', 100, 'governance', 'Board meeting regarding project status');
    }
  }
}

// --- 20. NGINX ---
class NGINX extends OpenSourceEntity {
  constructor() { super('NGINX', 'PROTOCOL', '1.25'); }
  initialize() { this.state.config = { workers: 4, connections: 10000 }; }
  update(entropy: number) {
    this.createTransaction('client', 1, 'http_response', '200 OK');
  }
}

// --- 21. Mozilla ---
class Mozilla extends OpenSourceEntity {
  constructor() { super('Mozilla', 'TOOL', 'Firefox 125'); }
  initialize() { this.state.config = { privacy: 'high', rust_integration: 'maximum' }; }
  update(entropy: number) {
    this.log('Blocking third-party tracker.');
  }
}

// --- 22. Firefox Dev Tools ---
class FirefoxDevTools extends OpenSourceEntity {
  constructor() { super('Firefox Dev Tools', 'TOOL', 'v125'); }
  initialize() { this.state.config = { grid_inspector: 'active' }; }
  update(entropy: number) {
    this.log('Inspecting DOM element.');
  }
}

// --- 23. Git ---
class Git extends OpenSourceEntity {
  constructor() { super('Git', 'TOOL', '2.44'); }
  initialize() { this.state.config = { head: 'ref: refs/heads/main' }; }
  update(entropy: number) {
    if (Math.random() > 0.7) {
      const hash = this.forge.generateHash(entropy.toString());
      this.log(`Commit ${hash}: Refactoring core logic.`);
    }
  }
}

// --- 24. GitHub Open Source API (Simulated) ---
class GitHubAPI extends OpenSourceEntity {
  constructor() { super('GitHub API', 'PROTOCOL', 'v3'); }
  initialize() { this.state.config = { rate_limit: 5000, remaining: 4999 }; }
  update(entropy: number) {
    this.state.config.remaining--;
    if (this.state.config.remaining < 100) {
      this.log('Rate limit warning.');
    }
  }
}

// --- 25. GitLab ---
class GitLab extends OpenSourceEntity {
  constructor() { super('GitLab', 'TOOL', '16.10'); }
  initialize() { this.state.config = { ci_runners: 5, pipelines: 'running' }; }
  update(entropy: number) {
    this.createTransaction('docker', 20, 'ci_job', 'Running CI pipeline job');
  }
}

// --- 26. Bitbucket ---
class Bitbucket extends OpenSourceEntity {
  constructor() { super('Bitbucket', 'TOOL', 'Server'); }
  initialize() { this.state.config = { jira_integration: 'active' }; }
  update(entropy: number) {
    this.log('Syncing Jira ticket status.');
  }
}

// --- 27. VS Code ---
class VSCode extends OpenSourceEntity {
  constructor() { super('VS Code', 'TOOL', '1.88'); }
  initialize() { this.state.config = { extensions: 45, theme: 'Dark Modern' }; }
  update(entropy: number) {
    if (Math.random() > 0.8) {
      this.createTransaction('typescript_server', 5, 'intellisense', 'Requesting completion items');
    }
  }
}

// --- 28. Eclipse Foundation ---
class EclipseFoundation extends OpenSourceEntity {
  constructor() { super('Eclipse Foundation', 'TOOL', '2024-03'); }
  initialize() { this.state.config = { workspace: 'default', plugins: 200 }; }
  update(entropy: number) {
    this.log('Building workspace...');
  }
}

// --- 29. JetBrains Open Tools ---
class JetBrains extends OpenSourceEntity {
  constructor() { super('JetBrains Open Tools', 'TOOL', 'IntelliJ Community'); }
  initialize() { this.state.config = { indexing: true }; }
  update(entropy: number) {
    this.log('Indexing JDK 21...');
  }
}

// --- 30. Python Software Foundation ---
class PythonFoundation extends OpenSourceEntity {
  constructor() { super('Python Software Foundation', 'LANGUAGE', '3.12'); }
  initialize() { this.state.config = { gil: 'locked', pep: 703 }; }
  update(entropy: number) {
    if (Math.random() > 0.9) {
      this.log('Garbage collection cycle (Generation 2).');
    }
  }
}

// --- 31. Node.js Foundation ---
class NodeFoundation extends OpenSourceEntity {
  constructor() { super('Node.js Foundation', 'LANGUAGE', '22.0'); }
  initialize() { this.state.config = { event_loop: 'running', libuv_threads: 4 }; }
  update(entropy: number) {
    this.createTransaction('v8_engine', 1, 'async_task', 'Processing microtask queue');
  }
}

// --- 32. Deno ---
class Deno extends OpenSourceEntity {
  constructor() { super('Deno', 'LANGUAGE', '1.42'); }
  initialize() { this.state.config = { security: 'sandbox', typescript: 'native' }; }
  update(entropy: number) {
    this.log('Downloading dependency from URL...');
  }
}

// --- 33. Bun ---
class Bun extends OpenSourceEntity {
  constructor() { super('Bun', 'LANGUAGE', '1.1'); }
  initialize() { this.state.config = { speed: 'blazing', zig: true }; }
  update(entropy: number) {
    this.log('Bundle complete in 0.001ms.');
  }
}

// --- 34. Rust Foundation ---
class RustFoundation extends OpenSourceEntity {
  constructor() { super('Rust Foundation', 'LANGUAGE', '1.77'); }
  initialize() { this.state.config = { borrow_checker: 'strict', safety: 'guaranteed' }; }
  update(entropy: number) {
    if (Math.random() > 0.5) {
      this.log('Compiling crate... (Release mode)');
    }
  }
}

// --- 35. GoLang Foundation ---
class GoLang extends OpenSourceEntity {
  constructor() { super('GoLang Foundation', 'LANGUAGE', '1.22'); }
  initialize() { this.state.config = { goroutines: 50000, gc: 'concurrent' }; }
  update(entropy: number) {
    this.createTransaction('scheduler', 1, 'context_switch', 'Parking goroutine');
  }
}

// --- 36. Ruby ---
class Ruby extends OpenSourceEntity {
  constructor() { super('Ruby', 'LANGUAGE', '3.3'); }
  initialize() { this.state.config = { jit: 'yjit', happiness: 'optimized' }; }
  update(entropy: number) {
    this.log('Yielding to block.');
  }
}

// --- 37. PHP ---
class PHP extends OpenSourceEntity {
  constructor() { super('PHP', 'LANGUAGE', '8.3'); }
  initialize() { this.state.config = { opcache: 'enabled', jit: 'tracing' }; }
  update(entropy: number) {
    this.log('Request terminated. Memory freed.');
  }
}

// --- 38. MariaDB ---
class MariaDB extends OpenSourceEntity {
  constructor() { super('MariaDB', 'DATABASE', '11.2'); }
  initialize() { this.state.config = { engine: 'Aria', replication: 'galera' }; }
  update(entropy: number) {
    this.createTransaction('disk', 10, 'write_wal', 'Flushing binary log');
  }
}

// --- 39. MySQL Open Edition ---
class MySQL extends OpenSourceEntity {
  constructor() { super('MySQL Open Edition', 'DATABASE', '8.0'); }
  initialize() { this.state.config = { innodb_buffer_pool: '8G' }; }
  update(entropy: number) {
    this.log('Optimizing query plan.');
  }
}

// --- 40. PostgreSQL ---
class PostgreSQL extends OpenSourceEntity {
  constructor() { super('PostgreSQL', 'DATABASE', '16.2'); }
  initialize() { this.state.config = { vacuum: 'autovacuum', extensions: ['postgis'] }; }
  update(entropy: number) {
    if (Math.random() > 0.9) {
      this.createTransaction('disk', 50, 'vacuum', 'Running autovacuum on large table');
    }
  }
}

// --- 41. SQLite ---
class SQLite extends OpenSourceEntity {
  constructor() { super('SQLite', 'DATABASE', '3.45'); }
  initialize() { this.state.config = { mode: 'wal', single_file: true }; }
  update(entropy: number) {
    this.log('Checkpointing WAL file.');
  }
}

// --- 42. Redis ---
class Redis extends OpenSourceEntity {
  constructor() { super('Redis', 'DATABASE', '7.2'); }
  initialize() { this.state.config = { persistence: 'aof', eviction: 'allkeys-lru' }; }
  update(entropy: number) {
    this.log('Evicting key to free memory.');
  }
}

// --- 43. MongoDB Community ---
class MongoDB extends OpenSourceEntity {
  constructor() { super('MongoDB Community', 'DATABASE', '7.0'); }
  initialize() { this.state.config = { shards: 3, replica_set: 'rs0' }; }
  update(entropy: number) {
    this.log('Balancing chunks across shards.');
  }
}

// --- 44. Cassandra ---
class Cassandra extends OpenSourceEntity {
  constructor() { super('Cassandra', 'DATABASE', '4.1'); }
  initialize() { this.state.config = { gossip: 'active', compaction: 'leveled' }; }
  update(entropy: number) {
    this.createTransaction('network', 20, 'gossip', 'Exchanging node state');
  }
}

// --- 45. ElasticSearch ---
class ElasticSearch extends OpenSourceEntity {
  constructor() { super('ElasticSearch', 'DATABASE', '8.13'); }
  initialize() { this.state.config = { lucene_version: '9.10', indices: 50 }; }
  update(entropy: number) {
    this.log('Merging Lucene segments.');
  }
}

// --- 46. Apache Spark ---
class ApacheSpark extends OpenSourceEntity {
  constructor() { super('Apache Spark', 'DATABASE', '3.5'); }
  initialize() { this.state.config = { executors: 10, rdd_cache: 'memory_only' }; }
  update(entropy: number) {
    this.createTransaction('hadoop', 100, 'shuffle', 'Shuffling data between stages');
  }
}

// --- 47. Apache Kafka ---
class ApacheKafka extends OpenSourceEntity {
  constructor() { super('Apache Kafka', 'DATABASE', '3.7'); }
  initialize() { this.state.config = { brokers: 3, partitions: 12 }; }
  update(entropy: number) {
    this.log('Rebalancing consumer group.');
  }
}

// --- 48. Supabase (Simulated) ---
class Supabase extends OpenSourceEntity {
  constructor() { super('Supabase', 'DATABASE', 'v1'); }
  initialize() { this.state.config = { realtime: true, auth: 'jwt' }; }
  update(entropy: number) {
    this.createTransaction('postgresql', 5, 'subscription', 'Broadcasting realtime change');
  }
}

// --- 49. Appwrite ---
class Appwrite extends OpenSourceEntity {
  constructor() { super('Appwrite', 'DATABASE', '1.5'); }
  initialize() { this.state.config = { functions: 'runtime', storage: 'local' }; }
  update(entropy: number) {
    this.log('Executing cloud function.');
  }
}

// --- 50. PocketBase ---
class PocketBase extends OpenSourceEntity {
  constructor() { super('PocketBase', 'DATABASE', '0.22'); }
  initialize() { this.state.config = { go_embedded: true }; }
  update(entropy: number) {
    this.log('Serving API request from single binary.');
  }
}

// --- 51. Hugging Face ---
class HuggingFace extends OpenSourceEntity {
  constructor() { super('Hugging Face', 'AI_MODEL', 'Hub'); }
  initialize() { this.state.config = { models: 500000, datasets: 100000 }; }
  update(entropy: number) {
    this.createTransaction('user', 50, 'download', 'Downloading Llama-3 weights');
  }
}

// --- 52. LangChain Open Module ---
class LangChain extends OpenSourceEntity {
  constructor() { super('LangChain', 'AI_MODEL', '0.1'); }
  initialize() { this.state.config = { chains: 5, agents: 2 }; }
  update(entropy: number) {
    this.log('Chaining prompt to LLM.');
  }
}

// --- 53. MLFlow ---
class MLFlow extends OpenSourceEntity {
  constructor() { super('MLFlow', 'AI_MODEL', '2.11'); }
  initialize() { this.state.config = { experiments: 10, runs: 500 }; }
  update(entropy: number) {
    this.log('Logging metrics: accuracy=0.98');
  }
}

// --- 54. TensorFlow ---
class TensorFlow extends OpenSourceEntity {
  constructor() { super('TensorFlow', 'AI_MODEL', '2.16'); }
  initialize() { this.state.config = { eager_execution: true, xla: 'enabled' }; }
  update(entropy: number) {
    this.createTransaction('gpu', 100, 'gradient_descent', 'Backpropagating loss');
  }
}

// --- 55. PyTorch ---
class PyTorch extends OpenSourceEntity {
  constructor() { super('PyTorch', 'AI_MODEL', '2.2'); }
  initialize() { this.state.config = { dynamic_graph: true, cuda: 'available' }; }
  update(entropy: number) {
    this.log('Zeroing gradients.');
  }
}

// --- 56. ONNX ---
class ONNX extends OpenSourceEntity {
  constructor() { super('ONNX', 'AI_MODEL', '1.16'); }
  initialize() { this.state.config = { interoperability: 'high' }; }
  update(entropy: number) {
    this.log('Exporting model graph.');
  }
}

// --- 57. OpenCV ---
class OpenCV extends OpenSourceEntity {
  constructor() { super('OpenCV', 'AI_MODEL', '4.9'); }
  initialize() { this.state.config = { modules: ['core', 'imgproc', 'dnn'] }; }
  update(entropy: number) {
    this.log('Applying Gaussian Blur.');
  }
}

// --- 58. OpenAI Gym (Sim) ---
class OpenAIGym extends OpenSourceEntity {
  constructor() { super('OpenAI Gym', 'AI_MODEL', '0.26'); }
  initialize() { this.state.config = { env: 'CartPole-v1' }; }
  update(entropy: number) {
    this.log('Step: reward=1.0');
  }
}

// --- 59. Godot Engine ---
class Godot extends OpenSourceEntity {
  constructor() { super('Godot Engine', 'TOOL', '4.2'); }
  initialize() { this.state.config = { renderer: 'Vulkan', nodes: 500 }; }
  update(entropy: number) {
    this.createTransaction('gpu', 16, 'draw_call', 'Rendering frame');
  }
}

// --- 60. Blender Foundation ---
class Blender extends OpenSourceEntity {
  constructor() { super('Blender Foundation', 'TOOL', '4.1'); }
  initialize() { this.state.config = { cycles: 'active', geometry_nodes: true }; }
  update(entropy: number) {
    this.log('Denoising render tile.');
  }
}

// --- 61. Inkscape ---
class Inkscape extends OpenSourceEntity {
  constructor() { super('Inkscape', 'TOOL', '1.3'); }
  initialize() { this.state.config = { svg_standard: '1.1' }; }
  update(entropy: number) {
    this.log('Calculating bezier curve intersection.');
  }
}

// --- 62. GIMP ---
class GIMP extends OpenSourceEntity {
  constructor() { super('GIMP', 'TOOL', '2.10'); }
  initialize() { this.state.config = { gegl: 'integrated' }; }
  update(entropy: number) {
    this.log('Applying filter.');
  }
}

// --- 63. Krita ---
class Krita extends OpenSourceEntity {
  constructor() { super('Krita', 'TOOL', '5.2'); }
  initialize() { this.state.config = { brush_engine: 'advanced' }; }
  update(entropy: number) {
    this.log('Stabilizing brush stroke.');
  }
}

// --- 64. Figma Open API Sim ---
class FigmaSim extends OpenSourceEntity {
  constructor() { super('Figma Open API', 'TOOL', 'v1'); }
  initialize() { this.state.config = { multiplayer: 'active' }; }
  update(entropy: number) {
    this.createTransaction('websocket', 1, 'cursor_move', 'Broadcasting cursor position');
  }
}

// --- 65. Unreal Open Tools ---
class UnrealTools extends OpenSourceEntity {
  constructor() { super('Unreal Open Tools', 'TOOL', '5.4'); }
  initialize() { this.state.config = { nanite: 'enabled', lumen: 'enabled' }; }
  update(entropy: number) {
    this.log('Compiling shaders (4500 remaining).');
  }
}

// --- 66. Unity Open Tools ---
class UnityTools extends OpenSourceEntity {
  constructor() { super('Unity Open Tools', 'TOOL', '6000.0'); }
  initialize() { this.state.config = { dots: 'active' }; }
  update(entropy: number) {
    this.log('Baking lightmaps.');
  }
}

// --- 67. OpenStreetMap ---
class OpenStreetMap extends OpenSourceEntity {
  constructor() { super('OpenStreetMap', 'DATABASE', 'Planet'); }
  initialize() { this.state.config = { nodes: 8000000000 }; }
  update(entropy: number) {
    this.log('Processing changeset.');
  }
}

// --- 68. QGIS ---
class QGIS extends OpenSourceEntity {
  constructor() { super('QGIS', 'TOOL', '3.36'); }
  initialize() { this.state.config = { projection: 'EPSG:4326' }; }
  update(entropy: number) {
    this.log('Rendering vector layer.');
  }
}

// --- 69. MapLibre ---
class MapLibre extends OpenSourceEntity {
  constructor() { super('MapLibre', 'TOOL', '3.0'); }
  initialize() { this.state.config = { tiles: 'vector' }; }
  update(entropy: number) {
    this.log('Parsing style JSON.');
  }
}

// --- 70. Leaflet.js ---
class Leaflet extends OpenSourceEntity {
  constructor() { super('Leaflet.js', 'TOOL', '1.9'); }
  initialize() { this.state.config = { lightweight: true }; }
  update(entropy: number) {
    this.log('Pan animation start.');
  }
}

// --- 71. VLC ---
class VLC extends OpenSourceEntity {
  constructor() { super('VLC', 'TOOL', '3.0.20'); }
  initialize() { this.state.config = { codecs: 'all' }; }
  update(entropy: number) {
    this.log('Decoding H.265 stream.');
  }
}

// --- 72. FFmpeg ---
class FFmpeg extends OpenSourceEntity {
  constructor() { super('FFmpeg', 'TOOL', '7.0'); }
  initialize() { this.state.config = { filters: 'complex' }; }
  update(entropy: number) {
    this.createTransaction('cpu', 100, 'transcode', 'Converting MP4 to WebM');
  }
}

// --- 73. OBS Studio ---
class OBSStudio extends OpenSourceEntity {
  constructor() { super('OBS Studio', 'TOOL', '30.1'); }
  initialize() { this.state.config = { streaming: true, recording: false }; }
  update(entropy: number) {
    this.log('Dropping frames due to network lag.');
  }
}

// --- 74. WireGuard ---
class WireGuard extends OpenSourceEntity {
  constructor() { super('WireGuard', 'PROTOCOL', '1.0'); }
  initialize() { this.state.config = { crypto: 'Noise_IK', handshake: 'completed' }; }
  update(entropy: number) {
    this.log('Rekeying tunnel.');
  }
}

// --- 75. OpenVPN ---
class OpenVPN extends OpenSourceEntity {
  constructor() { super('OpenVPN', 'PROTOCOL', '2.6'); }
  initialize() { this.state.config = { protocol: 'udp', compression: 'lzo' }; }
  update(entropy: number) {
    this.log('Keepalive sent.');
  }
}

// --- 76. Tor Project ---
class TorProject extends OpenSourceEntity {
  constructor() { super('Tor Project', 'PROTOCOL', '0.4.8'); }
  initialize() { this.state.config = { circuits: 3, nodes: 'random' }; }
  update(entropy: number) {
    this.log('Building new circuit.');
  }
}

// --- 77. DuckDB ---
class DuckDB extends OpenSourceEntity {
  constructor() { super('DuckDB', 'DATABASE', '0.10'); }
  initialize() { this.state.config = { olap: true, vectorized: true }; }
  update(entropy: number) {
    this.log('Executing analytical query on Parquet file.');
  }
}

// --- 78. ClickHouse ---
class ClickHouse extends OpenSourceEntity {
  constructor() { super('ClickHouse', 'DATABASE', '24.3'); }
  initialize() { this.state.config = { merge_tree: 'active' }; }
  update(entropy: number) {
    this.log('Merging data parts.');
  }
}

// --- 79. MinIO ---
class MinIO extends OpenSourceEntity {
  constructor() { super('MinIO', 'DATABASE', 'RELEASE.2024'); }
  initialize() { this.state.config = { s3_compatible: true, erasure_coding: '4+2' }; }
  update(entropy: number) {
    this.log('Healing object bitrot.');
  }
}

// --- 80. Ceph ---
class Ceph extends OpenSourceEntity {
  constructor() { super('Ceph', 'DATABASE', 'Reef'); }
  initialize() { this.state.config = { osds: 10, mons: 3 }; }
  update(entropy: number) {
    this.log('CRUSH map updated.');
  }
}

// --- 81. OpenStack ---
class OpenStack extends OpenSourceEntity {
  constructor() { super('OpenStack', 'OS', 'Caracal'); }
  initialize() { this.state.config = { nova: 'running', neutron: 'running' }; }
  update(entropy: number) {
    this.createTransaction('hypervisor', 50, 'spawn_vm', 'Launching instance');
  }
}

// --- 82. Proxmox ---
class Proxmox extends OpenSourceEntity {
  constructor() { super('Proxmox', 'OS', '8.1'); }
  initialize() { this.state.config = { lxc: 5, qemu: 3 }; }
  update(entropy: number) {
    this.log('Backing up VM 100.');
  }
}

// --- 83. Home Assistant ---
class HomeAssistant extends OpenSourceEntity {
  constructor() { super('Home Assistant', 'TOOL', '2024.4'); }
  initialize() { this.state.config = { integrations: 45, automations: 12 }; }
  update(entropy: number) {
    if (Math.random() > 0.9) {
      this.createTransaction('zigbee', 1, 'light_toggle', 'Turning on living room lights');
    }
  }
}

// --- 84. OpenHAB ---
class OpenHAB extends OpenSourceEntity {
  constructor() { super('OpenHAB', 'TOOL', '4.1'); }
  initialize() { this.state.config = { bindings: 20 }; }
  update(entropy: number) {
    this.log('Rule engine triggered.');
  }
}

// --- 85. Matter Protocol Sim ---
class MatterSim extends OpenSourceEntity {
  constructor() { super('Matter Protocol', 'PROTOCOL', '1.2'); }
  initialize() { this.state.config = { fabric: 'default' }; }
  update(entropy: number) {
    this.log('Commissioning device over BLE.');
  }
}

// --- 86. Zigbee Sim ---
class ZigbeeSim extends OpenSourceEntity {
  constructor() { super('Zigbee Simulator', 'PROTOCOL', '3.0'); }
  initialize() { this.state.config = { mesh_hops: 2 }; }
  update(entropy: number) {
    this.log('Route request broadcast.');
  }
}

// --- 87. TensorRT Open Version ---
class TensorRT extends OpenSourceEntity {
  constructor() { super('TensorRT', 'AI_MODEL', '8.6'); }
  initialize() { this.state.config = { precision: 'fp16' }; }
  update(entropy: number) {
    this.log('Fusing layers for inference optimization.');
  }
}

// --- 88. LLVM ---
class LLVM extends OpenSourceEntity {
  constructor() { super('LLVM', 'TOOL', '18.1'); }
  initialize() { this.state.config = { ir: 'optimized' }; }
  update(entropy: number) {
    this.log('Running optimization pass: Dead Code Elimination.');
  }
}

// --- 89. WebKit ---
class WebKit extends OpenSourceEntity {
  constructor() { super('WebKit', 'TOOL', '618.1'); }
  initialize() { this.state.config = { jsc: 'jit' }; }
  update(entropy: number) {
    this.log('Layout calculation.');
  }
}

// --- 90. Chromium ---
class Chromium extends OpenSourceEntity {
  constructor() { super('Chromium', 'TOOL', '124.0'); }
  initialize() { this.state.config = { blink: 'rendering' }; }
  update(entropy: number) {
    this.createTransaction('gpu', 5, 'raster', 'Rasterizing paint operations');
  }
}

// --- 91. uBlock Origin Engine ---
class UBlockOrigin extends OpenSourceEntity {
  constructor() { super('uBlock Origin', 'TOOL', '1.57'); }
  initialize() { this.state.config = { filters: 150000 }; }
  update(entropy: number) {
    this.log('Network request blocked by cosmetic filter.');
  }
}

// --- 92. Brave Shields ---
class BraveShields extends OpenSourceEntity {
  constructor() { super('Brave Shields', 'TOOL', '1.65'); }
  initialize() { this.state.config = { fingerprinting_protection: 'strict' }; }
  update(entropy: number) {
    this.log('Randomizing canvas fingerprint.');
  }
}

// --- 93. Nextcloud ---
class Nextcloud extends OpenSourceEntity {
  constructor() { super('Nextcloud', 'TOOL', '29.0'); }
  initialize() { this.state.config = { files: 5000, federation: 'enabled' }; }
  update(entropy: number) {
    this.log('Syncing file changes.');
  }
}

// --- 94. OwnCloud ---
class OwnCloud extends OpenSourceEntity {
  constructor() { super('OwnCloud', 'TOOL', 'Infinite Scale'); }
  initialize() { this.state.config = { microservices: true }; }
  update(entropy: number) {
    this.log('Processing metadata.');
  }
}

// --- 95. Mastodon ---
class Mastodon extends OpenSourceEntity {
  constructor() { super('Mastodon', 'PROTOCOL', '4.2'); }
  initialize() { this.state.config = { activitypub: 'federating' }; }
  update(entropy: number) {
    this.createTransaction('fediverse', 1, 'toot', 'Broadcasting status to followers');
  }
}

// --- 96. Matrix ---
class Matrix extends OpenSourceEntity {
  constructor() { super('Matrix', 'PROTOCOL', '1.10'); }
  initialize() { this.state.config = { synapse: 'running', encryption: 'olm' }; }
  update(entropy: number) {
    this.log('Syncing room state.');
  }
}

// --- 97. Signal Protocol Sim ---
class SignalSim extends OpenSourceEntity {
  constructor() { super('Signal Protocol', 'PROTOCOL', 'v3'); }
  initialize() { this.state.config = { double_ratchet: 'active' }; }
  update(entropy: number) {
    this.log('Deriving new message keys.');
  }
}

// --- 98. Apache Airflow ---
class Airflow extends OpenSourceEntity {
  constructor() { super('Apache Airflow', 'TOOL', '2.9'); }
  initialize() { this.state.config = { dag_processor: 'active' }; }
  update(entropy: number) {
    this.log('Triggering DAG run.');
  }
}

// --- 99. Jenkins ---
class Jenkins extends OpenSourceEntity {
  constructor() { super('Jenkins', 'TOOL', '2.452'); }
  initialize() { this.state.config = { plugins: 150 }; }
  update(entropy: number) {
    this.log('Waiting for executor slot.');
  }
}

// --- 100. DroneCI ---
class DroneCI extends OpenSourceEntity {
  constructor() { super('DroneCI', 'TOOL', '2.20'); }
  initialize() { this.state.config = { pipeline: 'yaml' }; }
  update(entropy: number) {
    this.log('Cloning repository step.');
  }
}

// -----------------------------------------------------------------------------
// SECTION IV: THE UI & INTERACTION LAYER
// -----------------------------------------------------------------------------

const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'COMPUTE') return `${amount.toFixed(2)} TFLOPS`;
  if (currency === 'ENTROPY') return `${amount.toFixed(4)} ΔS`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
};

const EntityCard: React.FC<{ entity: OpenSourceEntity }> = ({ entity }) => {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs([...entity.state.logs].reverse().slice(0, 3));
    }, 500);
    return () => clearInterval(interval);
  }, [entity]);

  return (
    <div className="p-4 bg-gray-900 text-green-400 font-mono text-xs border border-gray-700 rounded shadow-lg h-48 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
        <span className="font-bold text-white">{entity.name}</span>
        <span className="text-gray-500">{entity.state.version}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="mb-1 opacity-80 hover:opacity-100 transition-opacity">
            {log}
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-800 flex justify-between text-gray-400">
        <span>Health: {entity.state.health.toFixed(1)}%</span>
        <span>Uptime: {entity.state.uptime}s</span>
      </div>
    </div>
  );
};

const TransactionRow: React.FC<{ txn: UniversalTransaction }> = ({ txn }) => (
  <tr className="hover:bg-gray-800 transition-colors border-b border-gray-800">
    <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{formatDate(txn.timestamp)}</td>
    <td className="px-4 py-2 text-blue-400 font-bold">{txn.source}</td>
    <td className="px-4 py-2 text-purple-400">➜</td>
    <td className="px-4 py-2 text-blue-400 font-bold">{txn.destination}</td>
    <td className="px-4 py-2 text-white">{txn.type}</td>
    <td className="px-4 py-2 text-gray-500 text-right font-mono">{formatCurrency(txn.amount, txn.currency)}</td>
    <td className="px-4 py-2 text-xs text-gray-600 max-w-xs truncate">{txn.description}</td>
  </tr>
);

// -----------------------------------------------------------------------------
// SECTION V: THE MAIN COMPONENT (THE UNIVERSE CONTAINER)
// -----------------------------------------------------------------------------

interface BalanceTransactionTableProps {
  balanceTransactions?: any[]; // Kept for compatibility, but ignored in favor of the simulation
}

const BalanceTransactionTable: React.FC<BalanceTransactionTableProps> = () => {
  const [ledger, setLedger] = useState<UniversalTransaction[]>([]);
  const [entities, setEntities] = useState<OpenSourceEntity[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'matrix'>('dashboard');
  const forgeRef = useRef<UniverseForge>(UniverseForge.getInstance());

  // Initialize the Universe
  useEffect(() => {
    const forge = forgeRef.current;
    
    // Register all 100 entities
    const registry = [
      new LinuxFoundation(), new Canonical(), new RedHat(), new FedoraProject(), new DebianProject(),
      new OpenSUSE(), new ArchLinux(), new Manjaro(), new FreeBSD(), new NetBSD(),
      new OpenBSD(), new Kubernetes(), new CNCF(), new Docker(), new Podman(),
      new Ansible(), new Terraform(), new HashiCorp(), new ApacheFoundation(), new NGINX(),
      new Mozilla(), new FirefoxDevTools(), new Git(), new GitHubAPI(), new GitLab(),
      new Bitbucket(), new VSCode(), new EclipseFoundation(), new JetBrains(), new PythonFoundation(),
      new NodeFoundation(), new Deno(), new Bun(), new RustFoundation(), new GoLang(),
      new Ruby(), new PHP(), new MariaDB(), new MySQL(), new PostgreSQL(),
      new SQLite(), new Redis(), new MongoDB(), new Cassandra(), new ElasticSearch(),
      new ApacheSpark(), new ApacheKafka(), new Supabase(), new Appwrite(), new PocketBase(),
      new HuggingFace(), new LangChain(), new MLFlow(), new TensorFlow(), new PyTorch(),
      new ONNX(), new OpenCV(), new OpenAIGym(), new Godot(), new Blender(),
      new Inkscape(), new GIMP(), new Krita(), new FigmaSim(), new UnrealTools(),
      new UnityTools(), new OpenStreetMap(), new QGIS(), new MapLibre(), new Leaflet(),
      new VLC(), new FFmpeg(), new OBSStudio(), new WireGuard(), new OpenVPN(),
      new TorProject(), new DuckDB(), new ClickHouse(), new MinIO(), new Ceph(),
      new OpenStack(), new Proxmox(), new HomeAssistant(), new OpenHAB(), new MatterSim(),
      new ZigbeeSim(), new TensorRT(), new LLVM(), new WebKit(), new Chromium(),
      new UBlockOrigin(), new BraveShields(), new Nextcloud(), new OwnCloud(), new Mastodon(),
      new Matrix(), new SignalSim(), new Airflow(), new Jenkins(), new DroneCI()
    ];

    // Start the simulation loop
    const interval = setInterval(() => {
      forge.tick();
      setLedger([...forge.getLedger()]);
      // Randomly sample entities to update UI to avoid React rendering bottleneck
      setEntities(registry); 
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black min-h-screen text-white font-sans p-6">
      <header className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-500">
            OPEN SOURCE UNIVERSE FORGE
          </h1>
          <p className="text-gray-500 text-sm mt-1">Real-time simulation of the global technology ecosystem</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Grid View
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded ${activeTab === 'ledger' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Transaction Ledger
          </button>
        </div>
      </header>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {entities.map((entity) => (
            <EntityCard key={entity.id} entity={entity} />
          ))}
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-950 text-gray-400 uppercase font-mono text-xs">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3">Dest</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Load</th>
                  <th className="px-4 py-3">Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 font-mono">
                {ledger.slice(0, 50).map((txn) => (
                  <TransactionRow key={txn.id} txn={txn} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceTransactionTable;