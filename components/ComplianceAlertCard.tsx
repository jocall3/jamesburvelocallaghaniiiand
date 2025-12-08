import React, { useState, useEffect, useReducer, useRef, useMemo, useCallback } from 'react';

/**
 * THE EVOLUTIONARY UNIVERSE-FORGE: COMPLIANCE SINGULARITY
 * 
 * This file is no longer a simple component. It is a self-contained operating system
 * simulating a universe of open-source technologies, governed by a central Compliance Engine.
 * 
 * ORIGIN: ComplianceAlertCard.tsx
 * EVOLUTION: The Global Governance & Compliance Singularity (GGCS)
 * 
 * CONCEPTS:
 * 1. The "Transaction" is now an interaction between Open Source Systems.
 * 2. The "Alert" is a breach of digital sovereignty, license violation, or system instability.
 * 3. The "Card" is a window into the infinite state machine of the simulated internet.
 * 
 * ARCHITECTURE:
 * - Layer 1: The Kernel (State Management, Time, Entropy)
 * - Layer 2: The Network (100 Simulated Open Source APIs)
 * - Layer 3: The Compliance Engine (Rule Evaluation, Alert Generation)
 * - Layer 4: The Interface (Visualizing the invisible war of data)
 */

// -----------------------------------------------------------------------------
// SECTION I: THE KERNEL & TYPES
// -----------------------------------------------------------------------------

// --- Original Types Expanded ---

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical' | 'Existential' | 'Systemic';
export type AlertStatus = 'Open' | 'In Review' | 'Escalated' | 'Closed' | 'Auto-Remediated' | 'Quarantined';

export interface TransactionDetails {
  amount: number;
  currency: string;
  debtor: { name: string; accountNumber: string; reputationScore: number };
  creditor: { name: string; accountNumber: string; reputationScore: number };
  purposeCode?: string;
  metadata: Record<string, any>;
  traceId: string;
  protocol: string;
}

export interface ComplianceAlertCardProps {
  alertId: string;
  transactionId: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertStatus;
  ruleTriggered: string;
  triggerReason: string;
  transactionDetails: TransactionDetails;
  onAcknowledge: (alertId: string) => void;
  onEscalate: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}

// --- Universe Types ---

type UUID = string;
type ISO8601 = string;

interface SystemLog {
  id: UUID;
  timestamp: ISO8601;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  source: string;
  message: string;
}

interface NetworkPacket {
  id: UUID;
  sourceIp: string;
  destIp: string;
  payload: any;
  protocol: 'TCP' | 'UDP' | 'HTTP' | 'GRPC' | 'OS-LINK';
  encrypted: boolean;
}

// -----------------------------------------------------------------------------
// SECTION II: THE SIMULATED OPEN SOURCE API UNIVERSE (100 SYSTEMS)
// -----------------------------------------------------------------------------

/**
 * Base class for all simulated APIs.
 * Provides a standardized interface for the Compliance Engine to monitor.
 */
abstract class SimulatedAPI {
  protected id: string;
  protected name: string;
  protected uptime: number = 0;
  protected requestCount: number = 0;
  protected errorCount: number = 0;
  protected dataStore: Map<string, any> = new Map();
  protected logs: SystemLog[] = [];

  constructor(name: string) {
    this.name = name;
    this.id = `API-${name.toUpperCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 10000)}`;
  }

  public abstract healthCheck(): { status: string; latency: number };
  
  protected log(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
    this.logs.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      source: this.name,
      message
    });
  }

  public getMetrics() {
    return {
      name: this.name,
      uptime: this.uptime,
      requests: this.requestCount,
      errors: this.errorCount,
      storageUsage: this.dataStore.size
    };
  }

  protected simulateLatency() {
    const start = performance.now();
    while (performance.now() - start < Math.random() * 5) {
      // Burn cycles to simulate work
    }
  }
}

// --- 1. Linux Foundation Ecosystem ---

class LinuxFoundationAPI extends SimulatedAPI {
  constructor() { super('Linux Foundation'); }
  healthCheck() { return { status: 'STABLE', latency: 12 }; }
  
  public listProjects() {
    this.requestCount++;
    return ['Linux', 'Kubernetes', 'Node.js', 'Hyperledger'];
  }
  
  public verifyLicense(projectId: string) {
    this.simulateLatency();
    return { project: projectId, license: 'GPL-2.0', compliant: true };
  }
}

class CanonicalAPI extends SimulatedAPI {
  constructor() { super('Canonical'); }
  healthCheck() { return { status: 'ONLINE', latency: 24 }; }
  
  public snapInstall(packageName: string) {
    this.requestCount++;
    this.dataStore.set(`snap:${packageName}`, { version: 'latest', installedAt: new Date() });
    return { status: 'installed', confinement: 'strict' };
  }
}

class RedHatAPI extends SimulatedAPI {
  constructor() { super('Red Hat'); }
  healthCheck() { return { status: 'ENTERPRISE_READY', latency: 15 }; }
  
  public checkSubscription(systemId: string) {
    this.requestCount++;
    return { active: true, type: 'RHEL Server', supportLevel: 'Premium' };
  }
}

class FedoraProjectAPI extends SimulatedAPI {
  constructor() { super('Fedora Project'); }
  healthCheck() { return { status: 'BLEEDING_EDGE', latency: 10 }; }
  
  public getRawhideUpdates() {
    return { updates: 452, kernel: '6.8.0-rc1' };
  }
}

class DebianProjectAPI extends SimulatedAPI {
  constructor() { super('Debian Project'); }
  healthCheck() { return { status: 'STABLE', latency: 5 }; }
  
  public aptUpdate() {
    return { repositories: ['main', 'contrib', 'non-free'], packages: 52000 };
  }
}

class OpenSUSEAPI extends SimulatedAPI {
  constructor() { super('OpenSUSE'); }
  healthCheck() { return { status: 'ONLINE', latency: 18 }; }
  
  public zypperRefresh() {
    return { repos: ['Tumbleweed', 'Leap'], status: 'Refreshed' };
  }
}

class ArchLinuxAPI extends SimulatedAPI {
  constructor() { super('Arch Linux'); }
  healthCheck() { return { status: 'ROLLING', latency: 2 }; }
  
  public pacmanSyu() {
    this.log('WARN', 'User attempting full system upgrade. Risk of breakage: Moderate.');
    return { packagesUpdated: 12, conflicts: 0 };
  }
}

class ManjaroAPI extends SimulatedAPI {
  constructor() { super('Manjaro'); }
  healthCheck() { return { status: 'USER_FRIENDLY', latency: 20 }; }
  
  public updateMirrors() {
    return { fastest: 'Global CDN', latency: '45ms' };
  }
}

// --- 2. The BSD Family ---

class FreeBSDAPI extends SimulatedAPI {
  constructor() { super('FreeBSD'); }
  healthCheck() { return { status: 'ROCK_SOLID', latency: 8 }; }
  
  public updatePorts() {
    return { portsTree: 'HEAD', changes: 150 };
  }
}

class NetBSDAPI extends SimulatedAPI {
  constructor() { super('NetBSD'); }
  healthCheck() { return { status: 'PORTABLE', latency: 12 }; }
  
  public runOnToaster() {
    return { compatible: true, architecture: 'toaster-v1' };
  }
}

class OpenBSDAPI extends SimulatedAPI {
  constructor() { super('OpenBSD'); }
  healthCheck() { return { status: 'SECURE', latency: 14 }; }
  
  public checkSecurity() {
    return { remoteHoles: 0, defaultInstall: true };
  }
}

// --- 3. Cloud Native & Containers ---

class KubernetesAPI extends SimulatedAPI {
  constructor() { super('Kubernetes'); }
  healthCheck() { return { status: 'ORCHESTRATING', latency: 35 }; }
  
  public getPods(namespace: string) {
    this.requestCount++;
    return [
      { name: 'compliance-engine-v1', status: 'Running', restarts: 0 },
      { name: 'ledger-sync-worker', status: 'Running', restarts: 2 }
    ];
  }
  
  public scaleDeployment(name: string, replicas: number) {
    this.log('INFO', `Scaling ${name} to ${replicas} replicas.`);
    return { desired: replicas, current: replicas, available: replicas };
  }
}

class CNCFAPI extends SimulatedAPI {
  constructor() { super('CNCF'); }
  healthCheck() { return { status: 'GRADUATED', latency: 10 }; }
  
  public getLandscape() {
    return { projects: 150, graduated: 24, incubating: 36 };
  }
}

class DockerAPI extends SimulatedAPI {
  constructor() { super('Docker'); }
  healthCheck() { return { status: 'DAEMON_ACTIVE', latency: 5 }; }
  
  public pullImage(tag: string) {
    this.simulateLatency();
    return { image: tag, layers: 8, size: '145MB', status: 'Downloaded' };
  }
}

class PodmanAPI extends SimulatedAPI {
  constructor() { super('Podman'); }
  healthCheck() { return { status: 'ROOTLESS', latency: 4 }; }
  
  public runContainer(image: string) {
    return { id: crypto.randomUUID(), state: 'Running', rootless: true };
  }
}

// --- 4. Infrastructure as Code ---

class AnsibleAPI extends SimulatedAPI {
  constructor() { super('Ansible'); }
  healthCheck() { return { status: 'IDEMPOTENT', latency: 22 }; }
  
  public runPlaybook(playbook: string) {
    this.log('INFO', `Executing playbook: ${playbook}`);
    return { changed: 2, failed: 0, ok: 14 };
  }
}

class TerraformAPI extends SimulatedAPI {
  constructor() { super('Terraform'); }
  healthCheck() { return { status: 'PLANNED', latency: 30 }; }
  
  public plan() {
    return { toAdd: 4, toChange: 1, toDestroy: 0 };
  }
  
  public apply() {
    this.dataStore.set('state', 'locked');
    return { status: 'Applied', state: 's3-backend' };
  }
}

class HashiCorpAPI extends SimulatedAPI {
  constructor() { super('HashiCorp'); }
  healthCheck() { return { status: 'VAULT_SEALED', latency: 9 }; }
  
  public getSecret(path: string) {
    this.requestCount++;
    if (Math.random() > 0.9) {
      this.errorCount++;
      throw new Error('Permission Denied');
    }
    return { key: '******', ttl: '1h' };
  }
}

// --- 5. Web Servers & Foundations ---

class ApacheFoundationAPI extends SimulatedAPI {
  constructor() { super('Apache Foundation'); }
  healthCheck() { return { status: 'COMMUNITY_DRIVEN', latency: 11 }; }
  
  public getProjectStatus(project: string) {
    return { project, status: 'Active', pmcMembers: 12 };
  }
}

class NGINXAPI extends SimulatedAPI {
  constructor() { super('NGINX'); }
  healthCheck() { return { status: 'HIGH_PERFORMANCE', latency: 1 }; }
  
  public reloadConfig() {
    return { status: 'Reloaded', workers: 4, connections: 1024 };
  }
}

class MozillaAPI extends SimulatedAPI {
  constructor() { super('Mozilla'); }
  healthCheck() { return { status: 'OPEN_WEB', latency: 16 }; }
  
  public checkManifesto() {
    return { principle4: 'Security is fundamental', adhered: true };
  }
}

class FirefoxDevToolsAPI extends SimulatedAPI {
  constructor() { super('Firefox Dev Tools'); }
  healthCheck() { return { status: 'DEBUGGING', latency: 3 }; }
  
  public inspectElement(selector: string) {
    return { element: selector, computedStyle: { display: 'block' } };
  }
}

// --- 6. Version Control ---

class GitAPI extends SimulatedAPI {
  constructor() { super('Git'); }
  healthCheck() { return { status: 'DISTRIBUTED', latency: 0 }; }
  
  public commit(message: string) {
    const hash = Math.random().toString(16).substr(2, 7);
    this.log('INFO', `Commit ${hash}: ${message}`);
    return { hash, branch: 'main' };
  }
}

class GitHubAPI extends SimulatedAPI {
  constructor() { super('GitHub'); }
  healthCheck() { return { status: 'OCTOCAT_READY', latency: 45 }; }
  
  public createPullRequest(repo: string, title: string) {
    this.requestCount++;
    return { id: 402, title, status: 'Open', checks: 'Pending' };
  }
}

class GitLabAPI extends SimulatedAPI {
  constructor() { super('GitLab'); }
  healthCheck() { return { status: 'CI_RUNNING', latency: 50 }; }
  
  public runPipeline(projectId: string) {
    return { pipelineId: 9921, status: 'Running', stages: ['build', 'test', 'deploy'] };
  }
}

class BitbucketAPI extends SimulatedAPI {
  constructor() { super('Bitbucket'); }
  healthCheck() { return { status: 'ONLINE', latency: 48 }; }
  
  public getRepoSize(repo: string) {
    return { size: '45MB', lfs: false };
  }
}

// --- 7. IDEs & Editors ---

class VSCodeAPI extends SimulatedAPI {
  constructor() { super('VS Code'); }
  healthCheck() { return { status: 'EXTENSIBLE', latency: 5 }; }
  
  public installExtension(id: string) {
    return { id, status: 'Installed', version: '1.8.2' };
  }
}

class EclipseFoundationAPI extends SimulatedAPI {
  constructor() { super('Eclipse Foundation'); }
  healthCheck() { return { status: 'JAVA_ROOTS', latency: 25 }; }
  
  public getJakartaEEVersion() {
    return { version: '10', compliant: true };
  }
}

class JetBrainsAPI extends SimulatedAPI {
  constructor() { super('JetBrains Open Tools'); }
  healthCheck() { return { status: 'INDEXING', latency: 15 }; }
  
  public analyzeCode() {
    return { warnings: 4, errors: 0, typos: 1 };
  }
}

// --- 8. Languages & Runtimes ---

class PythonFoundationAPI extends SimulatedAPI {
  constructor() { super('Python Software Foundation'); }
  healthCheck() { return { status: 'SNAKE_CHARMING', latency: 8 }; }
  
  public pipInstall(pkg: string) {
    return { package: pkg, version: '3.11.0', wheels: true };
  }
}

class NodeFoundationAPI extends SimulatedAPI {
  constructor() { super('Node.js Foundation'); }
  healthCheck() { return { status: 'EVENT_LOOPING', latency: 2 }; }
  
  public npmAudit() {
    return { vulnerabilities: { low: 2, high: 0 }, recommendedAction: 'none' };
  }
}

class DenoAPI extends SimulatedAPI {
  constructor() { super('Deno'); }
  healthCheck() { return { status: 'SECURE_BY_DEFAULT', latency: 3 }; }
  
  public run(script: string) {
    return { status: 'Running', permissions: ['net', 'read'] };
  }
}

class BunAPI extends SimulatedAPI {
  constructor() { super('Bun'); }
  healthCheck() { return { status: 'BLAZING_FAST', latency: 0.5 }; }
  
  public install() {
    return { time: '4ms', packages: 150 };
  }
}

class RustFoundationAPI extends SimulatedAPI {
  constructor() { super('Rust Foundation'); }
  healthCheck() { return { status: 'MEMORY_SAFE', latency: 1 }; }
  
  public cargoBuild() {
    return { status: 'Compiling', target: 'release', warnings: 0 };
  }
}

class GoLangFoundationAPI extends SimulatedAPI {
  constructor() { super('GoLang Foundation'); }
  healthCheck() { return { status: 'CONCURRENT', latency: 2 }; }
  
  public goFmt() {
    return { filesFormatted: 3, style: 'standard' };
  }
}

class RubyAPI extends SimulatedAPI {
  constructor() { super('Ruby'); }
  healthCheck() { return { status: 'ELEGANT', latency: 12 }; }
  
  public bundleInstall() {
    return { gems: 45, status: 'Complete' };
  }
}

class PHPAPI extends SimulatedAPI {
  constructor() { super('PHP'); }
  healthCheck() { return { status: 'ALIVE', latency: 10 }; }
  
  public composerUpdate() {
    return { dependencies: 'Updated', lockFile: 'Generated' };
  }
}

// --- 9. Databases ---

class MariaDBAPI extends SimulatedAPI {
  constructor() { super('MariaDB'); }
  healthCheck() { return { status: 'REPLICATING', latency: 6 }; }
  public query(sql: string) { return { rows: 15, time: '0.02s' }; }
}

class MySQLAPI extends SimulatedAPI {
  constructor() { super('MySQL Open Edition'); }
  healthCheck() { return { status: 'RELATIONAL', latency: 7 }; }
  public explain(sql: string) { return { type: 'ALL', rows: 1000 }; }
}

class PostgreSQLAPI extends SimulatedAPI {
  constructor() { super('PostgreSQL'); }
  healthCheck() { return { status: 'ACID_COMPLIANT', latency: 8 }; }
  public vacuum() { return { status: 'Vacuumed', spaceReclaimed: '12MB' }; }
}

class SQLiteAPI extends SimulatedAPI {
  constructor() { super('SQLite'); }
  healthCheck() { return { status: 'EMBEDDED', latency: 0.1 }; }
  public integrityCheck() { return { status: 'ok' }; }
}

class RedisAPI extends SimulatedAPI {
  constructor() { super('Redis'); }
  healthCheck() { return { status: 'IN_MEMORY', latency: 0.2 }; }
  public get(key: string) { return { value: 'cached_data', ttl: 300 }; }
}

class MongoDBAPI extends SimulatedAPI {
  constructor() { super('MongoDB Community'); }
  healthCheck() { return { status: 'WEB_SCALE', latency: 5 }; }
  public aggregate(pipeline: any[]) { return { docs: 50, cursor: 'open' }; }
}

class CassandraAPI extends SimulatedAPI {
  constructor() { super('Cassandra'); }
  healthCheck() { return { status: 'GOSSIPING', latency: 12 }; }
  public nodetoolStatus() { return { nodes: 3, state: 'UN' }; }
}

class ElasticSearchAPI extends SimulatedAPI {
  constructor() { super('ElasticSearch'); }
  healthCheck() { return { status: 'GREEN', latency: 15 }; }
  public search(query: string) { return { hits: 1200, took: 5 }; }
}

// --- 10. Big Data & Streaming ---

class ApacheSparkAPI extends SimulatedAPI {
  constructor() { super('Apache Spark'); }
  healthCheck() { return { status: 'PROCESSING', latency: 100 }; }
  public submitJob(jar: string) { return { jobId: 'job-123', status: 'Accepted' }; }
}

class ApacheKafkaAPI extends SimulatedAPI {
  constructor() { super('Apache Kafka'); }
  healthCheck() { return { status: 'STREAMING', latency: 4 }; }
  public produce(topic: string, msg: string) { return { offset: 4502, partition: 0 }; }
}

// --- 11. Backend as a Service ---

class SupabaseAPI extends SimulatedAPI {
  constructor() { super('Supabase (Sim)'); }
  healthCheck() { return { status: 'REALTIME', latency: 20 }; }
  public authUser() { return { user: 'uuid-123', role: 'authenticated' }; }
}

class AppwriteAPI extends SimulatedAPI {
  constructor() { super('Appwrite'); }
  healthCheck() { return { status: 'SECURE', latency: 22 }; }
  public createDocument(collection: string, data: any) { return { id: 'doc-1', ...data }; }
}

class PocketBaseAPI extends SimulatedAPI {
  constructor() { super('PocketBase'); }
  healthCheck() { return { status: 'PORTABLE', latency: 5 }; }
  public listRecords(collection: string) { return { items: [], totalItems: 0 }; }
}

// --- 12. AI & ML ---

class HuggingFaceAPI extends SimulatedAPI {
  constructor() { super('Hugging Face'); }
  healthCheck() { return { status: 'TRANSFORMING', latency: 40 }; }
  public getModel(name: string) { return { name, downloads: 1000000, task: 'text-generation' }; }
}

class LangChainAPI extends SimulatedAPI {
  constructor() { super('LangChain Open Module'); }
  healthCheck() { return { status: 'CHAINING', latency: 10 }; }
  public createChain(prompt: string) { return { chainId: 'lc-1', steps: 4 }; }
}

class MLFlowAPI extends SimulatedAPI {
  constructor() { super('MLFlow'); }
  healthCheck() { return { status: 'TRACKING', latency: 15 }; }
  public logMetric(key: string, value: number) { return { runId: 'run-1', key, value }; }
}

class TensorFlowAPI extends SimulatedAPI {
  constructor() { super('TensorFlow'); }
  healthCheck() { return { status: 'TENSORS_FLOWING', latency: 25 }; }
  public loadSavedModel(path: string) { return { model: 'ResNet50', signatures: ['serving_default'] }; }
}

class PyTorchAPI extends SimulatedAPI {
  constructor() { super('PyTorch'); }
  healthCheck() { return { status: 'DYNAMIC_GRAPH', latency: 24 }; }
  public backward() { return { gradients: 'calculated', device: 'cuda:0' }; }
}

class ONNXAPI extends SimulatedAPI {
  constructor() { super('ONNX'); }
  healthCheck() { return { status: 'INTEROPERABLE', latency: 5 }; }
  public exportModel() { return { format: 'onnx', opset: 15 }; }
}

class OpenCVAPI extends SimulatedAPI {
  constructor() { super('OpenCV'); }
  healthCheck() { return { status: 'VISION', latency: 12 }; }
  public detectFaces(image: any) { return { faces: 3, rects: [[10,10,50,50]] }; }
}

class OpenAIGymAPI extends SimulatedAPI {
  constructor() { super('OpenAI Gym (Sim)'); }
  healthCheck() { return { status: 'TRAINING', latency: 8 }; }
  public step(action: number) { return { observation: [0.1, 0.2], reward: 1, done: false }; }
}

// --- 13. Game Engines & Graphics ---

class GodotEngineAPI extends SimulatedAPI {
  constructor() { super('Godot Engine'); }
  healthCheck() { return { status: 'WAITING_FOR_PLAYER', latency: 16 }; }
  public loadScene(path: string) { return { scene: path, nodes: 45 }; }
}

class BlenderFoundationAPI extends SimulatedAPI {
  constructor() { super('Blender Foundation'); }
  healthCheck() { return { status: 'RENDERING', latency: 50 }; }
  public renderFrame(frame: number) { return { frame, time: '2.5s', samples: 128 }; }
}

class InkscapeAPI extends SimulatedAPI {
  constructor() { super('Inkscape'); }
  healthCheck() { return { status: 'VECTORIZING', latency: 10 }; }
  public traceBitmap() { return { paths: 120, nodes: 4500 }; }
}

class GIMPAPI extends SimulatedAPI {
  constructor() { super('GIMP'); }
  healthCheck() { return { status: 'RASTERIZING', latency: 12 }; }
  public applyFilter(filter: string) { return { status: 'Applied', layer: 'Background' }; }
}

class KritaAPI extends SimulatedAPI {
  constructor() { super('Krita'); }
  healthCheck() { return { status: 'PAINTING', latency: 8 }; }
  public getBrushEngine() { return { engine: 'Pixel', size: 15 }; }
}

class FigmaOpenSimAPI extends SimulatedAPI {
  constructor() { super('Figma Open API Sim'); }
  healthCheck() { return { status: 'COLLABORATING', latency: 30 }; }
  public getFileNodes(fileKey: string) { return { document: { id: '0:0', children: [] } }; }
}

class UnrealOpenToolsAPI extends SimulatedAPI {
  constructor() { super('Unreal Open Tools'); }
  healthCheck() { return { status: 'LUMEN_ACTIVE', latency: 16 }; }
  public compileShaders() { return { remaining: 450, threads: 12 }; }
}

class UnityOpenToolsAPI extends SimulatedAPI {
  constructor() { super('Unity Open Tools'); }
  healthCheck() { return { status: 'MONO_BEHAVIOUR', latency: 16 }; }
  public buildPlayer() { return { platform: 'WebGL', size: '15MB' }; }
}

// --- 14. Geospatial ---

class OpenStreetMapAPI extends SimulatedAPI {
  constructor() { super('OpenStreetMap'); }
  healthCheck() { return { status: 'MAPPING', latency: 25 }; }
  public getNode(id: number) { return { lat: 51.505, lon: -0.09, tags: { amenity: 'pub' } }; }
}

class QGISAPI extends SimulatedAPI {
  constructor() { super('QGIS'); }
  healthCheck() { return { status: 'ANALYZING', latency: 30 }; }
  public bufferFeature(distance: number) { return { geometry: 'Polygon', area: 500 }; }
}

class MapLibreAPI extends SimulatedAPI {
  constructor() { super('MapLibre'); }
  healthCheck() { return { status: 'RENDERING_TILES', latency: 10 }; }
  public setStyle(style: string) { return { style, layers: 45 }; }
}

class LeafletAPI extends SimulatedAPI {
  constructor() { super('Leaflet.js'); }
  healthCheck() { return { status: 'LIGHTWEIGHT', latency: 2 }; }
  public addMarker(lat: number, lon: number) { return { id: 1, lat, lon }; }
}

// --- 15. Media & Streaming ---

class VLCAPI extends SimulatedAPI {
  constructor() { super('VLC'); }
  healthCheck() { return { status: 'PLAYING_ANYTHING', latency: 5 }; }
  public transcode(file: string) { return { status: 'Converting', progress: '45%' }; }
}

class FFmpegAPI extends SimulatedAPI {
  constructor() { super('FFmpeg'); }
  healthCheck() { return { status: 'ENCODING', latency: 15 }; }
  public getProbe(file: string) { return { streams: [{ codec_type: 'video', codec_name: 'h264' }] }; }
}

class OBSStudioAPI extends SimulatedAPI {
  constructor() { super('OBS Studio'); }
  healthCheck() { return { status: 'BROADCASTING', latency: 10 }; }
  public startStreaming() { return { rtmp: 'live', bitrate: 6000 }; }
}

// --- 16. Networking & Privacy ---

class WireGuardAPI extends SimulatedAPI {
  constructor() { super('WireGuard'); }
  healthCheck() { return { status: 'TUNNELED', latency: 3 }; }
  public handshake() { return { status: 'Completed', peer: '10.0.0.2' }; }
}

class OpenVPNAPI extends SimulatedAPI {
  constructor() { super('OpenVPN'); }
  healthCheck() { return { status: 'CONNECTED', latency: 15 }; }
  public getStats() { return { bytesIn: 1024, bytesOut: 2048 }; }
}

class TorProjectAPI extends SimulatedAPI {
  constructor() { super('Tor Project'); }
  healthCheck() { return { status: 'ANONYMOUS', latency: 150 }; }
  public buildCircuit() { return { hops: 3, exitNode: 'Germany' }; }
}

// --- 17. OLAP & Storage ---

class DuckDBAPI extends SimulatedAPI {
  constructor() { super('DuckDB'); }
  healthCheck() { return { status: 'QUACKING', latency: 4 }; }
  public queryParquet(file: string) { return { rows: 1000000, time: '0.5s' }; }
}

class ClickHouseAPI extends SimulatedAPI {
  constructor() { super('ClickHouse'); }
  healthCheck() { return { status: 'COLUMNAR', latency: 8 }; }
  public insertBatch(rows: number) { return { inserted: rows, speed: '1M/sec' }; }
}

class MinIOAPI extends SimulatedAPI {
  constructor() { super('MinIO'); }
  healthCheck() { return { status: 'OBJECT_STORE', latency: 12 }; }
  public putObject(bucket: string, key: string) { return { etag: 'xyz', versionId: 'v1' }; }
}

class CephAPI extends SimulatedAPI {
  constructor() { super('Ceph'); }
  healthCheck() { return { status: 'DISTRIBUTED', latency: 15 }; }
  public getClusterHealth() { return { status: 'HEALTH_OK', osds: 12 }; }
}

// --- 18. Virtualization & Cloud ---

class OpenStackAPI extends SimulatedAPI {
  constructor() { super('OpenStack'); }
  healthCheck() { return { status: 'CLOUD_OPERATING', latency: 40 }; }
  public launchInstance(flavor: string) { return { id: 'inst-1', status: 'Building' }; }
}

class ProxmoxAPI extends SimulatedAPI {
  constructor() { super('Proxmox'); }
  healthCheck() { return { status: 'VIRTUALIZING', latency: 20 }; }
  public startVM(vmid: number) { return { vmid, status: 'Running' }; }
}

// --- 19. IoT & Home Automation ---

class HomeAssistantAPI extends SimulatedAPI {
  constructor() { super('Home Assistant'); }
  healthCheck() { return { status: 'AUTOMATING', latency: 10 }; }
  public turnOn(entityId: string) { return { entityId, state: 'on' }; }
}

class OpenHABAPI extends SimulatedAPI {
  constructor() { super('OpenHAB'); }
  healthCheck() { return { status: 'BINDING', latency: 12 }; }
  public getItem(name: string) { return { name, state: 'OFF' }; }
}

class MatterProtocolSimAPI extends SimulatedAPI {
  constructor() { super('Matter Protocol'); }
  healthCheck() { return { status: 'INTEROPERABLE', latency: 5 }; }
  public commissionDevice() { return { fabricId: 1, nodeId: 12 }; }
}

class ZigbeeSimAPI extends SimulatedAPI {
  constructor() { super('Zigbee Sim'); }
  healthCheck() { return { status: 'MESHING', latency: 25 }; }
  public permitJoin() { return { duration: 60, status: 'Permitting' }; }
}

// --- 20. Compilers & Browsers ---

class TensorRTAPI extends SimulatedAPI {
  constructor() { super('TensorRT Open Ver'); }
  healthCheck() { return { status: 'OPTIMIZING', latency: 10 }; }
  public buildEngine() { return { precision: 'FP16', layers: 50 }; }
}

class LLVMAPI extends SimulatedAPI {
  constructor() { super('LLVM'); }
  healthCheck() { return { status: 'IR_GENERATING', latency: 5 }; }
  public optimizeIR() { return { passes: 12, reduction: '15%' }; }
}

class WebKitAPI extends SimulatedAPI {
  constructor() { super('WebKit'); }
  healthCheck() { return { status: 'RENDERING', latency: 15 }; }
  public layout() { return { domNodes: 500, paintTime: '12ms' }; }
}

class ChromiumAPI extends SimulatedAPI {
  constructor() { super('Chromium'); }
  healthCheck() { return { status: 'V8_REVVING', latency: 18 }; }
  public openTab(url: string) { return { id: 1, url, processId: 400 }; }
}

class UBlockOriginSimAPI extends SimulatedAPI {
  constructor() { super('uBlock Origin Engine'); }
  healthCheck() { return { status: 'BLOCKING', latency: 1 }; }
  public checkRequest(url: string) { return { url, blocked: false, filter: 'none' }; }
}

class BraveShieldsSimAPI extends SimulatedAPI {
  constructor() { super('Brave Shields'); }
  healthCheck() { return { status: 'PROTECTING', latency: 2 }; }
  public fingerprintProtect() { return { randomized: true }; }
}

// --- 21. Collaboration & Social ---

class NextcloudAPI extends SimulatedAPI {
  constructor() { super('Nextcloud'); }
  healthCheck() { return { status: 'FEDERATED', latency: 25 }; }
  public shareFile(fileId: string) { return { link: 'https://cloud.example/s/xyz', expiration: null }; }
}

class OwnCloudAPI extends SimulatedAPI {
  constructor() { super('OwnCloud'); }
  healthCheck() { return { status: 'SYNCING', latency: 28 }; }
  public getQuota() { return { used: '5GB', total: '10GB' }; }
}

class MastodonAPI extends SimulatedAPI {
  constructor() { super('Mastodon'); }
  healthCheck() { return { status: 'TOOTING', latency: 30 }; }
  public postStatus(content: string) { return { id: '109238', content, visibility: 'public' }; }
}

class MatrixAPI extends SimulatedAPI {
  constructor() { super('Matrix'); }
  healthCheck() { return { status: 'DECENTRALIZED', latency: 15 }; }
  public sync() { return { nextBatch: 's12345', rooms: [] }; }
}

class SignalOpenSimAPI extends SimulatedAPI {
  constructor() { super('Signal Protocol'); }
  healthCheck() { return { status: 'ENCRYPTED', latency: 10 }; }
  public ratchetKey() { return { newKey: 'dh-pub-key', step: 5 }; }
}

// --- 22. CI/CD ---

class ApacheAirflowAPI extends SimulatedAPI {
  constructor() { super('Apache Airflow'); }
  healthCheck() { return { status: 'SCHEDULING', latency: 20 }; }
  public triggerDag(dagId: string) { return { runId: 'manual__2023', state: 'queued' }; }
}

class JenkinsAPI extends SimulatedAPI {
  constructor() { super('Jenkins'); }
  healthCheck() { return { status: 'BUILDING', latency: 25 }; }
  public getBuildStatus(job: string) { return { job, number: 42, result: 'SUCCESS' }; }
}

class DroneCIAPI extends SimulatedAPI {
  constructor() { super('DroneCI'); }
  healthCheck() { return { status: 'CONTAINERIZED', latency: 15 }; }
  public listBuilds() { return { builds: 10, latest: 'passing' }; }
}

// -----------------------------------------------------------------------------
// SECTION III: THE UNIVERSE REGISTRY
// -----------------------------------------------------------------------------

class UniverseRegistry {
  private static instance: UniverseRegistry;
  public apis: Map<string, SimulatedAPI> = new Map();

  private constructor() {
    this.registerAll();
  }

  public static getInstance(): UniverseRegistry {
    if (!UniverseRegistry.instance) {
      UniverseRegistry.instance = new UniverseRegistry();
    }
    return UniverseRegistry.instance;
  }

  private registerAll() {
    const apiClasses = [
      LinuxFoundationAPI, CanonicalAPI, RedHatAPI, FedoraProjectAPI, DebianProjectAPI, OpenSUSEAPI, ArchLinuxAPI, ManjaroAPI,
      FreeBSDAPI, NetBSDAPI, OpenBSDAPI, KubernetesAPI, CNCFAPI, DockerAPI, PodmanAPI, AnsibleAPI, TerraformAPI, HashiCorpAPI,
      ApacheFoundationAPI, NGINXAPI, MozillaAPI, FirefoxDevToolsAPI, GitAPI, GitHubAPI, GitLabAPI, BitbucketAPI, VSCodeAPI,
      EclipseFoundationAPI, JetBrainsAPI, PythonFoundationAPI, NodeFoundationAPI, DenoAPI, BunAPI, RustFoundationAPI,
      GoLangFoundationAPI, RubyAPI, PHPAPI, MariaDBAPI, MySQLAPI, PostgreSQLAPI, SQLiteAPI, RedisAPI, MongoDBAPI, CassandraAPI,
      ElasticSearchAPI, ApacheSparkAPI, ApacheKafkaAPI, SupabaseAPI, AppwriteAPI, PocketBaseAPI, HuggingFaceAPI, LangChainAPI,
      MLFlowAPI, TensorFlowAPI, PyTorchAPI, ONNXAPI, OpenCVAPI, OpenAIGymAPI, GodotEngineAPI, BlenderFoundationAPI, InkscapeAPI,
      GIMPAPI, KritaAPI, FigmaOpenSimAPI, UnrealOpenToolsAPI, UnityOpenToolsAPI, OpenStreetMapAPI, QGISAPI, MapLibreAPI,
      LeafletAPI, VLCAPI, FFmpegAPI, OBSStudioAPI, WireGuardAPI, OpenVPNAPI, TorProjectAPI, DuckDBAPI, ClickHouseAPI, MinIOAPI,
      CephAPI, OpenStackAPI, ProxmoxAPI, HomeAssistantAPI, OpenHABAPI, MatterProtocolSimAPI, ZigbeeSimAPI, TensorRTAPI, LLVMAPI,
      WebKitAPI, ChromiumAPI, UBlockOriginSimAPI, BraveShieldsSimAPI, NextcloudAPI, OwnCloudAPI, MastodonAPI, MatrixAPI,
      SignalOpenSimAPI, ApacheAirflowAPI, JenkinsAPI, DroneCIAPI
    ];

    apiClasses.forEach(ApiClass => {
      const api = new ApiClass();
      this.apis.set(api.getMetrics().name, api);
    });
  }

  public getAPI(name: string): SimulatedAPI | undefined {
    return this.apis.get(name);
  }

  public getAllMetrics() {
    return Array.from(this.apis.values()).map(api => api.getMetrics());
  }
}

// -----------------------------------------------------------------------------
// SECTION IV: THE COMPLIANCE ENGINE & LOGIC CORE
// -----------------------------------------------------------------------------

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  check: (universe: UniverseRegistry) => boolean;
  severity: AlertSeverity;
}

class ComplianceEngine {
  private rules: ComplianceRule[] = [];
  private alerts: ComplianceAlertCardProps[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.rules.push({
      id: 'RULE-001',
      name: 'Open Source License Integrity',
      description: 'Ensures all active projects have valid OSI licenses.',
      severity: 'Critical',
      check: (u) => Math.random() > 0.95 // 5% chance of failure simulation
    });
    this.rules.push({
      id: 'RULE-002',
      name: 'Container Root Privilege Check',
      description: 'Detects containers running as root.',
      severity: 'High',
      check: (u) => Math.random() > 0.90
    });
    this.rules.push({
      id: 'RULE-003',
      name: 'Dependency Supply Chain Audit',
      description: 'Scans for malicious packages in upstream.',
      severity: 'Existential',
      check: (u) => Math.random() > 0.98
    });
  }

  public runAudit(): ComplianceAlertCardProps | null {
    const universe = UniverseRegistry.getInstance();
    
    for (const rule of this.rules) {
      if (rule.check(universe)) {
        // Generate Alert
        const alert: ComplianceAlertCardProps = {
          alertId: `ALT-${Math.floor(Math.random() * 100000)}`,
          transactionId: `TX-${crypto.randomUUID().split('-')[0]}`,
          timestamp: new Date().toISOString(),
          severity: rule.severity,
          status: 'Open',
          ruleTriggered: rule.name,
          triggerReason: `Anomaly detected in sector ${Math.floor(Math.random() * 100)}. Heuristic mismatch.`,
          transactionDetails: {
            amount: Math.floor(Math.random() * 10000),
            currency: 'OSS-CREDITS',
            debtor: { name: 'Anonymous Dev', accountNumber: '0x123...abc', reputationScore: 85 },
            creditor: { name: 'Foundation Treasury', accountNumber: '0x999...zzz', reputationScore: 99 },
            metadata: { source: 'Automated Audit' },
            traceId: crypto.randomUUID(),
            protocol: 'Compliance-v1'
          },
          onAcknowledge: (id) => console.log(`Ack ${id}`),
          onEscalate: (id) => console.log(`Esc ${id}`),
          onDismiss: (id) => console.log(`Dis ${id}`)
        };
        this.alerts.push(alert);
        return alert;
      }
    }
    return null;
  }
}

// -----------------------------------------------------------------------------
// SECTION V: UI COMPONENTS & RENDERING ENGINE
// -----------------------------------------------------------------------------

// --- Styles ---

const styles = {
  container: {
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    minHeight: '100vh',
    padding: '2rem',
    display: 'grid',
    gridTemplateColumns: '300px 1fr 350px',
    gap: '1.5rem',
  },
  panel: {
    backgroundColor: '#1e293b',
    borderRadius: '0.75rem',
    border: '1px solid #334155',
    padding: '1rem',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  },
  header: {
    fontSize: '0.875rem',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#94a3b8',
    marginBottom: '1rem',
    borderBottom: '1px solid #334155',
    paddingBottom: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    marginBottom: '0.5rem',
    padding: '0.25rem',
    borderRadius: '0.25rem',
    cursor: 'pointer',
  },
  terminal: {
    backgroundColor: '#000000',
    color: '#22c55e',
    padding: '1rem',
    borderRadius: '0.5rem',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    height: '200px',
    overflowY: 'auto' as const,
    marginTop: '1rem',
  },
  alertCard: {
    borderLeftWidth: '4px',
    backgroundColor: '#ffffff',
    color: '#111827',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }
};

// --- Sub-Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const getColor = (s: string) => {
    if (s === 'ONLINE' || s === 'STABLE' || s === 'GREEN') return '#22c55e';
    if (s === 'WARN' || s === 'In Review') return '#eab308';
    if (s === 'CRITICAL' || s === 'Existential') return '#ef4444';
    return '#3b82f6';
  };
  return (
    <span style={{ color: getColor(status), fontWeight: 'bold' }}>● {status}</span>
  );
};

const APIMonitor = ({ metrics, onSelect }: { metrics: any[], onSelect: (name: string) => void }) => {
  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {metrics.map((m) => (
        <div 
          key={m.name} 
          style={{ ...styles.metricRow, backgroundColor: '#1e293b' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
          onClick={() => onSelect(m.name)}
        >
          <span>{m.name}</span>
          <span style={{ color: m.errors > 0 ? '#ef4444' : '#94a3b8' }}>
            REQ: {m.requests} | ERR: {m.errors}
          </span>
        </div>
      ))}
    </div>
  );
};

const TerminalLog = ({ logs }: { logs: string[] }) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
  
  return (
    <div style={styles.terminal}>
      {logs.map((log, i) => (
        <div key={i} style={{ marginBottom: '0.25rem' }}>{`> ${log}`}</div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

// --- The Original Component (Evolved) ---

const ComplianceAlertCard: React.FC<ComplianceAlertCardProps> = ({
  alertId,
  transactionId,
  timestamp,
  severity,
  status,
  ruleTriggered,
  triggerReason,
  transactionDetails,
  onAcknowledge,
  onEscalate,
  onDismiss,
}) => {
  // Helper function to map severity to a color scheme
  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Low': return { bgColor: '#eff6ff', textColor: '#1e40af', borderColor: '#3b82f6' };
      case 'Medium': return { bgColor: '#fefce8', textColor: '#854d0e', borderColor: '#eab308' };
      case 'High': return { bgColor: '#fff7ed', textColor: '#9a3412', borderColor: '#f97316' };
      case 'Critical': return { bgColor: '#fee2e2', textColor: '#991b1b', borderColor: '#ef4444' };
      case 'Existential': return { bgColor: '#450a0a', textColor: '#fecaca', borderColor: '#000000' };
      default: return { bgColor: '#f3f4f6', textColor: '#1f2937', borderColor: '#6b7280' };
    }
  };

  const sStyles = getSeverityStyles(severity);

  return (
    <div style={{
        ...styles.alertCard,
        borderLeftColor: sStyles.borderColor,
        animation: severity === 'Existential' ? 'pulse 2s infinite' : 'none'
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{ruleTriggered}</h2>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {alertId}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
            <span style={{
                padding: '0.25rem 0.5rem', fontSize: '0.7rem', fontWeight: 'bold',
                borderRadius: '4px', backgroundColor: sStyles.bgColor, color: sStyles.textColor,
            }}>
                {severity.toUpperCase()}
            </span>
        </div>
      </header>

      <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
        <p style={{ fontFamily: 'monospace', color: '#dc2626' }}>{triggerReason}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: '#4b5563' }}>
        <div>
            <strong>Source:</strong> {transactionDetails.debtor.name}
        </div>
        <div>
            <strong>Target:</strong> {transactionDetails.creditor.name}
        </div>
        <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
            <strong>Protocol:</strong> {transactionDetails.protocol}
        </div>
      </div>

      <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
        <button onClick={() => onDismiss(alertId)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>Dismiss</button>
        <button onClick={() => onEscalate(alertId)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Escalate</button>
      </footer>
    </div>
  );
};

// -----------------------------------------------------------------------------
// SECTION VI: THE MAIN SYSTEM CONTROLLER (ROOT COMPONENT)
// -----------------------------------------------------------------------------

const GlobalGovernanceConsole: React.FC = () => {
  const [universe] = useState(() => UniverseRegistry.getInstance());
  const [metrics, setMetrics] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>(['System initialized...', 'Connecting to 100 simulated nodes...', 'Compliance Engine: ONLINE']);
  const [alerts, setAlerts] = useState<ComplianceAlertCardProps[]>([]);
  const [selectedAPI, setSelectedAPI] = useState<string | null>(null);
  const [systemTime, setSystemTime] = useState(new Date());

  const complianceEngine = useMemo(() => new ComplianceEngine(), []);

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemTime(new Date());
      
      // 1. Update Metrics
      setMetrics(universe.getAllMetrics());

      // 2. Randomly simulate traffic
      const apis = Array.from(universe.apis.values());
      const randomApi = apis[Math.floor(Math.random() * apis.length)];
      
      try {
        const health = randomApi.healthCheck();
        if (Math.random() > 0.7) {
            setLogs(prev => [...prev.slice(-19), `[${randomApi.getMetrics().name}] Health: ${health.status} (${health.latency}ms)`]);
        }
      } catch (e) {
        setLogs(prev => [...prev.slice(-19), `[ERROR] ${randomApi.getMetrics().name} failed health check.`]);
      }

      // 3. Run Compliance Check
      if (Math.random() > 0.85) {
        const newAlert = complianceEngine.runAudit();
        if (newAlert) {
          setAlerts(prev => [newAlert, ...prev].slice(0, 5));
          setLogs(prev => [...prev.slice(-19), `[ALERT] ${newAlert.ruleTriggered} detected!`]);
        }
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [universe, complianceEngine]);

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.alertId !== id));
    setLogs(prev => [...prev, `Alert ${id} dismissed.`]);
  };

  const handleEscalate = (id: string) => {
    setAlerts(prev => prev.filter(a => a.alertId !== id));
    setLogs(prev => [...prev, `Alert ${id} ESCALATED to Human Oversight.`]);
  };

  const selectedApiData = selectedAPI ? universe.getAPI(selectedAPI) : null;

  return (
    <div style={styles.container}>
      {/* Left Panel: Network Status */}
      <div style={styles.panel}>
        <div style={styles.header}>
          <span>Open Source Grid</span>
          <span>{metrics.length} Nodes</span>
        </div>
        <APIMonitor metrics={metrics} onSelect={setSelectedAPI} />
        <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#64748b' }}>
          System Time: {systemTime.toISOString()}
        </div>
      </div>

      {/* Center Panel: Visualization & Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Main Viewport */}
        <div style={{ ...styles.panel, flex: 2, position: 'relative', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}>
          {selectedApiData ? (
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '2rem', color: '#38bdf8', marginBottom: '1rem' }}>{selectedApiData.getMetrics().name}</h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'left' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>UPTIME</p>
                  <p style={{ fontSize: '1.5rem' }}>{selectedApiData.getMetrics().uptime}s</p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>REQUESTS</p>
                  <p style={{ fontSize: '1.5rem' }}>{selectedApiData.getMetrics().requests}</p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>STATUS</p>
                  <StatusBadge status={selectedApiData.healthCheck().status} />
                </div>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>LATENCY</p>
                  <p style={{ fontSize: '1.5rem' }}>{selectedApiData.healthCheck().latency}ms</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAPI(null)}
                style={{ marginTop: '2rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', cursor: 'pointer' }}
              >
                Close Inspector
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#475569' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌐</div>
              <p>Select a node to inspect telemetry</p>
            </div>
          )}
        </div>

        {/* Terminal */}
        <div style={{ ...styles.panel, flex: 1 }}>
          <div style={styles.header}>System Logs</div>
          <TerminalLog logs={logs} />
        </div>
      </div>

      {/* Right Panel: Compliance Alerts */}
      <div style={styles.panel}>
        <div style={styles.header}>
          <span>Active Alerts</span>
          <span style={{ color: '#ef4444' }}>{alerts.length}</span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.8rem' }}>
              No active compliance violations detected.
              <br/><br/>
              System is nominal.
            </div>
          ) : (
            alerts.map(alert => (
              <ComplianceAlertCard
                key={alert.alertId}
                {...alert}
                onDismiss={handleDismiss}
                onEscalate={handleEscalate}
                onAcknowledge={() => {}}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalGovernanceConsole;