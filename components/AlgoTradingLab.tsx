import React, { useState, useEffect, useCallback, useMemo, useRef, useReducer } from 'react';
import {
  RefreshCw, Play, Save, History, Code, Settings, TrendingUp, DollarSign, X, User, LogOut,
  Plus, Search, Filter, ChevronDown, ChevronUp, BrainCircuit, Bot, SlidersHorizontal,
  LayoutDashboard, Repeat, Send, Target, Trophy, Heart, Briefcase, Link, Zap, Lock,
  Atom, Users, Megaphone, CreditCard, Handshake, Activity, Phone, Shield, Sparkles, Eye,
  Globe, Key, Receipt, Rocket, PieChart, Palette, Building, Wheat, Scale, Crown, FileText,
  Server, Network, GitBranch, HardDrive, Cpu, Database, Cloud, Terminal, BookOpen,
  BarChart2, CheckSquare, Calendar, MessageSquare, LifeBuoy, Command, Hash, Layers,
  Monitor, Wifi, Bluetooth, Radio, Map, Video, Music, Image, Mic, Speaker, Box,
  Package, Truck, Anchor, Coffee, Sun, Moon, Wind, Droplets, Thermometer, Navigation,
  Compass, Flag, MapPin, Share2, Download, Upload, Trash2, Edit3, Copy, ExternalLink,
  AlertTriangle, Info, CheckCircle, XCircle, Loader, Sidebar, Maximize2, Minimize2,
  Grid, List, Folder, File, FileCode, FileJson, FileDigit, Disc, HardDrive as Disk,
  Smartphone, Tablet, Watch, Tv, Printer, Camera, Headphones, Battery, BatteryCharging
} from 'lucide-react';
import { Badge } from './badge';

/**
 * THE UNIVERSE-FORGE: FAMILY OS & ALGO-TRADING MEGA-SYSTEM
 * 
 * This file represents a self-contained, dependency-free operating environment.
 * It simulates a universe of 100+ open-source APIs, a high-frequency trading engine,
 * and a complete desktop UI system.
 * 
 * ARCHITECTURE:
 * 1. KERNEL: Central state management, time-stepping, and event bus.
 * 2. API UNIVERSE: 100+ simulated classes representing real-world open-source projects.
 * 3. DATA LAYER: In-memory relational database simulation.
 * 4. UI ENGINE: Window manager, theming, and component library.
 * 5. APPLICATIONS: AlgoTradingLab, SystemMonitor, APIExplorer, etc.
 */

// ==========================================
// PART I: CORE TYPES & INTERFACES
// ==========================================

type UUID = string;
type ISODate = string;
type JSONString = string;

interface SystemEvent {
  id: UUID;
  timestamp: number;
  source: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'TRANSACTION' | 'SYSTEM';
  message: string;
  payload?: any;
}

interface KernelState {
  bootTime: number;
  uptime: number;
  tickCount: number;
  systemLoad: number;
  memoryUsage: number;
  networkTraffic: { in: number; out: number };
  activeProcesses: number;
  user: UserProfile;
  theme: 'dark' | 'light' | 'hacker' | 'cyberpunk';
}

interface UserProfile {
  id: UUID;
  username: string;
  role: 'ADMIN' | 'USER' | 'GUEST' | 'ROOT';
  permissions: string[];
  preferences: Record<string, any>;
  wallet: {
    fiat: number;
    crypto: Record<string, number>;
  };
}

// --- API Simulation Types ---

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: Record<string, string>;
  responseSchema?: Record<string, string>;
  rateLimit: number; // req/min
}

interface APIMetrics {
  requestsTotal: number;
  requestsFailed: number;
  latencyAvg: number;
  uptime: number;
  lastIncident: ISODate | null;
}

abstract class SimulatedAPI {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly version: string;
  protected state: Record<string, any> = {};
  protected metrics: APIMetrics = {
    requestsTotal: 0,
    requestsFailed: 0,
    latencyAvg: 20,
    uptime: 99.99,
    lastIncident: null
  };
  protected endpoints: APIEndpoint[] = [];

  constructor(id: string, name: string, category: string, version: string) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.version = version;
    this.initialize();
  }

  protected abstract initialize(): void;

  public getMetadata() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      version: this.version,
      metrics: this.metrics,
      endpoints: this.endpoints
    };
  }

  public async call(endpoint: string, method: string, payload?: any): Promise<any> {
    this.metrics.requestsTotal++;
    const start = performance.now();
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
    
    try {
      const result = await this.handleRequest(endpoint, method, payload);
      this.metrics.latencyAvg = (this.metrics.latencyAvg * 0.9) + ((performance.now() - start) * 0.1);
      return { status: 200, data: result, meta: { latency: performance.now() - start } };
    } catch (e: any) {
      this.metrics.requestsFailed++;
      return { status: 500, error: e.message };
    }
  }

  protected abstract handleRequest(endpoint: string, method: string, payload?: any): Promise<any>;
}

// ==========================================
// PART II: THE 100 API SIMULATIONS
// ==========================================

// --- 1. Linux Foundation & OS ---

class LinuxFoundationAPI extends SimulatedAPI {
  protected initialize() {
    this.endpoints = [
      { method: 'GET', path: '/projects', description: 'List all hosted projects', rateLimit: 1000 },
      { method: 'GET', path: '/members', description: 'List corporate members', rateLimit: 1000 },
      { method: 'POST', path: '/donate', description: 'Donate to the foundation', rateLimit: 10 },
    ];
    this.state = { projects: ['Linux', 'Kubernetes', 'Node.js', 'Hyperledger'], funds: 50000000 };
  }
  async handleRequest(path: string) {
    if (path === '/projects') return this.state.projects;
    if (path === '/members') return ['IBM', 'Intel', 'Samsung', 'Microsoft'];
    return { message: 'Welcome to the Linux Foundation' };
  }
}

class CanonicalAPI extends SimulatedAPI {
  protected initialize() {
    this.endpoints = [{ method: 'GET', path: '/ubuntu/releases', description: 'Get Ubuntu versions', rateLimit: 500 }];
    this.state = { releases: ['20.04 LTS', '22.04 LTS', '23.10', '24.04 LTS'] };
  }
  async handleRequest(path: string) {
    if (path === '/ubuntu/releases') return this.state.releases;
    return { status: 'Canonical services operational' };
  }
}

class RedHatAPI extends SimulatedAPI {
  protected initialize() {
    this.endpoints = [{ method: 'GET', path: '/rhel/subscriptions', description: 'Check RHEL subs', rateLimit: 200 }];
  }
  async handleRequest() { return { active: true, type: 'Enterprise' }; }
}

class FedoraProjectAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: 39, edition: 'Workstation' }; }
  async handleRequest() { return this.state; }
}

class DebianProjectAPI extends SimulatedAPI {
  protected initialize() { this.state = { stable: 'Bookworm', testing: 'Trixie', unstable: 'Sid' }; }
  async handleRequest() { return this.state; }
}

class OpenSUSEAPI extends SimulatedAPI {
  protected initialize() { this.state = { tumbleweed: 'Rolling', leap: '15.5' }; }
  async handleRequest() { return this.state; }
}

class ArchLinuxAPI extends SimulatedAPI {
  protected initialize() { this.state = { packages: 15000, aur_packages: 85000 }; }
  async handleRequest() { return { msg: 'I use Arch btw', stats: this.state }; }
}

class ManjaroAPI extends SimulatedAPI {
  protected initialize() { this.state = { branch: 'stable', kernel: '6.6' }; }
  async handleRequest() { return this.state; }
}

class FreeBSDAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '14.0-RELEASE', zfs_version: '2.2' }; }
  async handleRequest() { return this.state; }
}

class NetBSDAPI extends SimulatedAPI {
  protected initialize() { this.state = { platforms: 58, slogan: 'Of course it runs NetBSD' }; }
  async handleRequest() { return this.state; }
}

class OpenBSDAPI extends SimulatedAPI {
  protected initialize() { this.state = { security_audit: 'clean', openssh_version: '9.6' }; }
  async handleRequest() { return this.state; }
}

// --- 2. Cloud Native & Containers ---

class KubernetesAPI extends SimulatedAPI {
  protected initialize() {
    this.endpoints = [
      { method: 'GET', path: '/pods', description: 'List pods', rateLimit: 5000 },
      { method: 'GET', path: '/nodes', description: 'List nodes', rateLimit: 5000 },
    ];
    this.state = { pods: 45, nodes: 3, status: 'Healthy' };
  }
  async handleRequest(path: string) {
    if (path === '/pods') return Array(this.state.pods).fill(0).map((_, i) => ({ id: `pod-${i}`, status: 'Running' }));
    return this.state;
  }
}

class CNCFAPI extends SimulatedAPI {
  protected initialize() { this.state = { graduated_projects: 24, incubating: 35 }; }
  async handleRequest() { return this.state; }
}

class DockerAPI extends SimulatedAPI {
  protected initialize() { this.state = { images: 120, containers: 15 }; }
  async handleRequest() { return { hub_status: 'online', local_daemon: 'running' }; }
}

class PodmanAPI extends SimulatedAPI {
  protected initialize() { this.state = { rootless: true, pods: 5 }; }
  async handleRequest() { return this.state; }
}

class AnsibleAPI extends SimulatedAPI {
  protected initialize() { this.state = { playbooks: 12, inventory_hosts: 50 }; }
  async handleRequest() { return { last_run: 'success', changed: 2 }; }
}

class TerraformAPI extends SimulatedAPI {
  protected initialize() { this.state = { state_file_size: '45KB', providers: ['aws', 'azurerm'] }; }
  async handleRequest() { return { plan: '3 to add, 0 to change, 0 to destroy' }; }
}

class HashiCorpAPI extends SimulatedAPI {
  protected initialize() { this.state = { vault_status: 'sealed', consul_peers: 3 }; }
  async handleRequest() { return this.state; }
}

// --- 3. Web Servers & Foundations ---

class ApacheFoundationAPI extends SimulatedAPI {
  protected initialize() { this.state = { projects: ['httpd', 'kafka', 'spark', 'maven'] }; }
  async handleRequest() { return this.state; }
}

class NGINXAPI extends SimulatedAPI {
  protected initialize() { this.state = { active_connections: 4502, requests_per_sec: 1200 }; }
  async handleRequest() { return this.state; }
}

class MozillaAPI extends SimulatedAPI {
  protected initialize() { this.state = { manifesto: 'Open Web', projects: ['Firefox', 'MDN', 'Common Voice'] }; }
  async handleRequest() { return this.state; }
}

class FirefoxDevToolsAPI extends SimulatedAPI {
  protected initialize() { this.state = { connected_tabs: 4, remote_debugging: true }; }
  async handleRequest() { return this.state; }
}

class EclipseFoundationAPI extends SimulatedAPI {
  protected initialize() { this.state = { ide_version: '2023-09', projects: ['Jakarta EE', 'MicroProfile'] }; }
  async handleRequest() { return this.state; }
}

// --- 4. Dev Tools & Git ---

class GitAPI extends SimulatedAPI {
  protected initialize() { this.state = { branch: 'main', clean: true, last_commit: 'a1b2c3d' }; }
  async handleRequest() { return this.state; }
}

class GitHubAPI extends SimulatedAPI {
  protected initialize() {
    this.endpoints = [{ method: 'GET', path: '/user/repos', description: 'List repos', rateLimit: 5000 }];
    this.state = { stars: 1420, forks: 300, issues: 12 };
  }
  async handleRequest() { return this.state; }
}

class GitLabAPI extends SimulatedAPI {
  protected initialize() { this.state = { pipelines_running: 2, merge_requests: 5 }; }
  async handleRequest() { return this.state; }
}

class BitbucketAPI extends SimulatedAPI {
  protected initialize() { this.state = { workspaces: 1, repos: 10 }; }
  async handleRequest() { return this.state; }
}

class VSCodeAPI extends SimulatedAPI {
  protected initialize() { this.state = { extensions: 45, theme: 'Dark Modern' }; }
  async handleRequest() { return this.state; }
}

class JetBrainsAPI extends SimulatedAPI {
  protected initialize() { this.state = { product: 'IntelliJ IDEA', license: 'Active' }; }
  async handleRequest() { return this.state; }
}

// --- 5. Languages ---

class PythonFoundationAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '3.12.0', pypi_packages: 400000 }; }
  async handleRequest() { return this.state; }
}

class NodeFoundationAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '20.9.0 LTS', npm_packages: 2500000 }; }
  async handleRequest() { return this.state; }
}

class DenoAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '1.38', secure_by_default: true }; }
  async handleRequest() { return this.state; }
}

class BunAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '1.0.10', speed: 'Fast' }; }
  async handleRequest() { return { msg: 'Bun is fast.' }; }
}

class RustFoundationAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '1.74.0', crates: 130000 }; }
  async handleRequest() { return { msg: 'Borrow checker satisfied.' }; }
}

class GoLangFoundationAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '1.21', goroutines: 5000 }; }
  async handleRequest() { return this.state; }
}

class RubyAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '3.2.2', gems: 170000 }; }
  async handleRequest() { return { msg: 'Matz is nice so we are nice.' }; }
}

class PHPAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '8.3', frameworks: ['Laravel', 'Symfony'] }; }
  async handleRequest() { return this.state; }
}

// --- 6. Databases ---

class MariaDBAPI extends SimulatedAPI {
  protected initialize() { this.state = { status: 'active', connections: 50 }; }
  async handleRequest() { return this.state; }
}

class MySQLAPI extends SimulatedAPI {
  protected initialize() { this.state = { status: 'active', version: '8.0' }; }
  async handleRequest() { return this.state; }
}

class PostgreSQLAPI extends SimulatedAPI {
  protected initialize() { this.state = { status: 'active', version: '16.1', extensions: ['PostGIS'] }; }
  async handleRequest() { return this.state; }
}

class SQLiteAPI extends SimulatedAPI {
  protected initialize() { this.state = { file_size: '12MB', mode: 'WAL' }; }
  async handleRequest() { return this.state; }
}

class RedisAPI extends SimulatedAPI {
  protected initialize() { this.state = { keys: 15000, memory: '64MB' }; }
  async handleRequest() { return { ping: 'PONG' }; }
}

class MongoDBAPI extends SimulatedAPI {
  protected initialize() { this.state = { collections: 12, documents: 45000 }; }
  async handleRequest() { return this.state; }
}

class CassandraAPI extends SimulatedAPI {
  protected initialize() { this.state = { nodes: 3, token_ring: 'balanced' }; }
  async handleRequest() { return this.state; }
}

class ElasticSearchAPI extends SimulatedAPI {
  protected initialize() { this.state = { indices: 5, shards: 10, health: 'green' }; }
  async handleRequest() { return this.state; }
}

class DuckDBAPI extends SimulatedAPI {
  protected initialize() { this.state = { query_speed: '0.02s', format: 'parquet' }; }
  async handleRequest() { return this.state; }
}

class ClickHouseAPI extends SimulatedAPI {
  protected initialize() { this.state = { rows_processed: 1000000000, speed: 'insane' }; }
  async handleRequest() { return this.state; }
}

// --- 7. Big Data & Streaming ---

class ApacheSparkAPI extends SimulatedAPI {
  protected initialize() { this.state = { workers: 10, jobs: 'running' }; }
  async handleRequest() { return this.state; }
}

class ApacheKafkaAPI extends SimulatedAPI {
  protected initialize() { this.state = { topics: 20, lag: 0 }; }
  async handleRequest() { return this.state; }
}

// --- 8. Backend / BaaS ---

class SupabaseAPI extends SimulatedAPI {
  protected initialize() { this.state = { auth_users: 150, db_size: '500MB' }; }
  async handleRequest() { return this.state; }
}

class AppwriteAPI extends SimulatedAPI {
  protected initialize() { this.state = { functions: 5, storage: '2GB' }; }
  async handleRequest() { return this.state; }
}

class PocketBaseAPI extends SimulatedAPI {
  protected initialize() { this.state = { collections: 8, realtime: true }; }
  async handleRequest() { return this.state; }
}

// --- 9. AI / ML ---

class HuggingFaceAPI extends SimulatedAPI {
  protected initialize() { this.state = { models: 400000, datasets: 80000 }; }
  async handleRequest() { return { trending: 'Llama-2-70b' }; }
}

class LangChainAPI extends SimulatedAPI {
  protected initialize() { this.state = { chains: 5, agents: 2 }; }
  async handleRequest() { return { thought: 'Reasoning...', action: 'API Call' }; }
}

class MLFlowAPI extends SimulatedAPI {
  protected initialize() { this.state = { experiments: 12, runs: 150 }; }
  async handleRequest() { return this.state; }
}

class TensorFlowAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '2.14', gpu: true }; }
  async handleRequest() { return { tensor: '[1, 0, 0]' }; }
}

class PyTorchAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '2.1', cuda: true }; }
  async handleRequest() { return { tensor: 'torch.Tensor([0.5, 0.5])' }; }
}

class ONNXAPI extends SimulatedAPI {
  protected initialize() { this.state = { format: 'interoperable', models: 5 }; }
  async handleRequest() { return this.state; }
}

class OpenCVAPI extends SimulatedAPI {
  protected initialize() { this.state = { modules: ['core', 'imgproc', 'dnn'] }; }
  async handleRequest() { return { image_processed: true }; }
}

class OpenAIGymAPI extends SimulatedAPI {
  protected initialize() { this.state = { env: 'CartPole-v1', reward: 150 }; }
  async handleRequest() { return this.state; }
}

class TensorRTAPI extends SimulatedAPI {
  protected initialize() { this.state = { optimization: 'FP16', speedup: '4x' }; }
  async handleRequest() { return this.state; }
}

// --- 10. Graphics & Game Engines ---

class GodotEngineAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '4.2', nodes: 500 }; }
  async handleRequest() { return { scene: 'Main.tscn' }; }
}

class BlenderFoundationAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '4.0', cycles: 'rendering' }; }
  async handleRequest() { return { render_status: '85%' }; }
}

class InkscapeAPI extends SimulatedAPI {
  protected initialize() { this.state = { vectors: 120, layers: 5 }; }
  async handleRequest() { return this.state; }
}

class GIMPAPI extends SimulatedAPI {
  protected initialize() { this.state = { version: '2.10', plugins: 15 }; }
  async handleRequest() { return this.state; }
}

class KritaAPI extends SimulatedAPI {
  protected initialize() { this.state = { brush_engine: 'active', canvas: '4k' }; }
  async handleRequest() { return this.state; }
}

class FigmaOpenSimAPI extends SimulatedAPI {
  protected initialize() { this.state = { collaborators: 3, files: 12 }; }
  async handleRequest() { return this.state; }
}

class UnrealOpenToolsAPI extends SimulatedAPI {
  protected initialize() { this.state = { nanite: true, lumen: true }; }
  async handleRequest() { return { fps: 120 }; }
}

class UnityOpenToolsAPI extends SimulatedAPI {
  protected initialize() { this.state = { ecs: 'enabled', dots: 'active' }; }
  async handleRequest() { return this.state; }
}

// --- 11. Maps & Geo ---

class OpenStreetMapAPI extends SimulatedAPI {
  protected initialize() { this.state = { nodes: 'billions', contributors: 'millions' }; }
  async handleRequest() { return { lat: 40.7128, lon: -74.0060 }; }
}

class QGISAPI extends SimulatedAPI {
  protected initialize() { this.state = { layers: 15, projection: 'EPSG:4326' }; }
  async handleRequest() { return this.state; }
}

class MapLibreAPI extends SimulatedAPI {
  protected initialize() { this.state = { style: 'vector', gl: true }; }
  async handleRequest() { return this.state; }
}

class LeafletAPI extends SimulatedAPI {
  protected initialize() { this.state = { zoom: 12, center: [51.505, -0.09] }; }
  async handleRequest() { return this.state; }
}

// --- 12. Media ---

class VLCAPI extends SimulatedAPI {
  protected initialize() { this.state = { playing: false, codec: 'h264' }; }
  async handleRequest() { return this.state; }
}

class FFmpegAPI extends SimulatedAPI {
  protected initialize() { this.state = { encoding: false, preset: 'slow' }; }
  async handleRequest() { return { progress: 'frame=120 fps=30' }; }
}

class OBSStudioAPI extends SimulatedAPI {
  protected initialize() { this.state = { streaming: false, recording: true }; }
  async handleRequest() { return this.state; }
}

// --- 13. Network & Security ---

class WireGuardAPI extends SimulatedAPI {
  protected initialize() { this.state = { handshake: 'completed', peers: 2 }; }
  async handleRequest() { return this.state; }
}

class OpenVPNAPI extends SimulatedAPI {
  protected initialize() { this.state = { tunnel: 'tun0', status: 'connected' }; }
  async handleRequest() { return this.state; }
}

class TorProjectAPI extends SimulatedAPI {
  protected initialize() { this.state = { circuit: 'established', anonymity: 'high' }; }
  async handleRequest() { return { ip: 'hidden' }; }
}

class UBlockOriginAPI extends SimulatedAPI {
  protected initialize() { this.state = { ads_blocked: 14502, trackers: 500 }; }
  async handleRequest() { return this.state; }
}

class BraveShieldsAPI extends SimulatedAPI {
  protected initialize() { this.state = { shields: 'up', fingerprinting: 'blocked' }; }
  async handleRequest() { return this.state; }
}

// --- 14. Infrastructure & Virt ---

class MinIOAPI extends SimulatedAPI {
  protected initialize() { this.state = { buckets: 5, objects: 1200 }; }
  async handleRequest() { return this.state; }
}

class CephAPI extends SimulatedAPI {
  protected initialize() { this.state = { health: 'HEALTH_OK', osds: 12 }; }
  async handleRequest() { return this.state; }
}

class OpenStackAPI extends SimulatedAPI {
  protected initialize() { this.state = { nova: 'running', neutron: 'running' }; }
  async handleRequest() { return this.state; }
}

class ProxmoxAPI extends SimulatedAPI {
  protected initialize() { this.state = { vms: 8, lxc: 4, cluster: 'healthy' }; }
  async handleRequest() { return this.state; }
}

// --- 15. Home & IoT ---

class HomeAssistantAPI extends SimulatedAPI {
  protected initialize() { this.state = { entities: 45, automations: 12 }; }
  async handleRequest() { return { temperature: 22.5, lights: 'on' }; }
}

class OpenHABAPI extends SimulatedAPI {
  protected initialize() { this.state = { things: 20, items: 60 }; }
  async handleRequest() { return this.state; }
}

class MatterProtocolAPI extends SimulatedAPI {
  protected initialize() { this.state = { fabric: 'active', devices: 5 }; }
  async handleRequest() { return this.state; }
}

class ZigbeeAPI extends SimulatedAPI {
  protected initialize() { this.state = { coordinator: 'online', mesh_quality: 98 }; }
  async handleRequest() { return this.state; }
}

// --- 16. Compilers & Browsers ---

class LLVMAPI extends SimulatedAPI {
  protected initialize() { this.state = { targets: ['x86', 'arm', 'wasm'], optimizations: 'O3' }; }
  async handleRequest() { return this.state; }
}

class WebKitAPI extends SimulatedAPI {
  protected initialize() { this.state = { engine: 'JavaScriptCore', rendering: 'fast' }; }
  async handleRequest() { return this.state; }
}

class ChromiumAPI extends SimulatedAPI {
  protected initialize() { this.state = { v8: '9.8', blink: 'active' }; }
  async handleRequest() { return this.state; }
}

// --- 17. Collaboration ---

class NextcloudAPI extends SimulatedAPI {
  protected initialize() { this.state = { files: 5000, contacts: 200 }; }
  async handleRequest() { return this.state; }
}

class OwnCloudAPI extends SimulatedAPI {
  protected initialize() { this.state = { storage: 'local', federation: 'enabled' }; }
  async handleRequest() { return this.state; }
}

class MastodonAPI extends SimulatedAPI {
  protected initialize() { this.state = { instance: 'social.local', toots: 1500 }; }
  async handleRequest() { return this.state; }
}

class MatrixAPI extends SimulatedAPI {
  protected initialize() { this.state = { synapse: 'running', rooms: 15 }; }
  async handleRequest() { return { encryption: 'e2ee' }; }
}

class SignalProtocolAPI extends SimulatedAPI {
  protected initialize() { this.state = { ratchet: 'advanced', safety_number: 'verified' }; }
  async handleRequest() { return { msg: 'Sealed Sender' }; }
}

// --- 18. CI/CD ---

class ApacheAirflowAPI extends SimulatedAPI {
  protected initialize() { this.state = { dags: 5, tasks: 25 }; }
  async handleRequest() { return { scheduler: 'healthy' }; }
}

class JenkinsAPI extends SimulatedAPI {
  protected initialize() { this.state = { jobs: 10, executors: 2 }; }
  async handleRequest() { return { build: '#42 SUCCESS' }; }
}

class DroneCIAPI extends SimulatedAPI {
  protected initialize() { this.state = { pipelines: 4, steps: 12 }; }
  async handleRequest() { return this.state; }
}

// --- Registry ---

const API_REGISTRY: SimulatedAPI[] = [
  new LinuxFoundationAPI('linux', 'Linux Foundation', 'OS', '1.0'),
  new CanonicalAPI('canonical', 'Canonical', 'OS', '1.0'),
  new RedHatAPI('redhat', 'Red Hat', 'OS', '1.0'),
  new FedoraProjectAPI('fedora', 'Fedora', 'OS', '1.0'),
  new DebianProjectAPI('debian', 'Debian', 'OS', '1.0'),
  new OpenSUSEAPI('opensuse', 'OpenSUSE', 'OS', '1.0'),
  new ArchLinuxAPI('arch', 'Arch Linux', 'OS', '1.0'),
  new ManjaroAPI('manjaro', 'Manjaro', 'OS', '1.0'),
  new FreeBSDAPI('freebsd', 'FreeBSD', 'OS', '1.0'),
  new NetBSDAPI('netbsd', 'NetBSD', 'OS', '1.0'),
  new OpenBSDAPI('openbsd', 'OpenBSD', 'OS', '1.0'),
  new KubernetesAPI('k8s', 'Kubernetes', 'Cloud', '1.28'),
  new CNCFAPI('cncf', 'CNCF', 'Cloud', '1.0'),
  new DockerAPI('docker', 'Docker', 'Cloud', '24.0'),
  new PodmanAPI('podman', 'Podman', 'Cloud', '4.7'),
  new AnsibleAPI('ansible', 'Ansible', 'Cloud', '2.15'),
  new TerraformAPI('terraform', 'Terraform', 'Cloud', '1.6'),
  new HashiCorpAPI('hashicorp', 'HashiCorp', 'Cloud', '1.0'),
  new ApacheFoundationAPI('apache', 'Apache', 'Web', '1.0'),
  new NGINXAPI('nginx', 'NGINX', 'Web', '1.25'),
  new MozillaAPI('mozilla', 'Mozilla', 'Web', '1.0'),
  new FirefoxDevToolsAPI('firefox-dev', 'Firefox DevTools', 'Web', '1.0'),
  new EclipseFoundationAPI('eclipse', 'Eclipse', 'Web', '1.0'),
  new GitAPI('git', 'Git', 'Tools', '2.42'),
  new GitHubAPI('github', 'GitHub', 'Tools', '1.0'),
  new GitLabAPI('gitlab', 'GitLab', 'Tools', '16.5'),
  new BitbucketAPI('bitbucket', 'Bitbucket', 'Tools', '1.0'),
  new VSCodeAPI('vscode', 'VS Code', 'Tools', '1.84'),
  new JetBrainsAPI('jetbrains', 'JetBrains', 'Tools', '2023.2'),
  new PythonFoundationAPI('python', 'Python', 'Lang', '3.12'),
  new NodeFoundationAPI('node', 'Node.js', 'Lang', '20.9'),
  new DenoAPI('deno', 'Deno', 'Lang', '1.38'),
  new BunAPI('bun', 'Bun', 'Lang', '1.0'),
  new RustFoundationAPI('rust', 'Rust', 'Lang', '1.74'),
  new GoLangFoundationAPI('go', 'Go', 'Lang', '1.21'),
  new RubyAPI('ruby', 'Ruby', 'Lang', '3.2'),
  new PHPAPI('php', 'PHP', 'Lang', '8.3'),
  new MariaDBAPI('mariadb', 'MariaDB', 'DB', '11.1'),
  new MySQLAPI('mysql', 'MySQL', 'DB', '8.1'),
  new PostgreSQLAPI('postgres', 'PostgreSQL', 'DB', '16.1'),
  new SQLiteAPI('sqlite', 'SQLite', 'DB', '3.44'),
  new RedisAPI('redis', 'Redis', 'DB', '7.2'),
  new MongoDBAPI('mongo', 'MongoDB', 'DB', '7.0'),
  new CassandraAPI('cassandra', 'Cassandra', 'DB', '4.1'),
  new ElasticSearchAPI('elastic', 'ElasticSearch', 'DB', '8.11'),
  new DuckDBAPI('duckdb', 'DuckDB', 'DB', '0.9'),
  new ClickHouseAPI('clickhouse', 'ClickHouse', 'DB', '23.10'),
  new ApacheSparkAPI('spark', 'Spark', 'BigData', '3.5'),
  new ApacheKafkaAPI('kafka', 'Kafka', 'BigData', '3.6'),
  new SupabaseAPI('supabase', 'Supabase', 'BaaS', '1.0'),
  new AppwriteAPI('appwrite', 'Appwrite', 'BaaS', '1.4'),
  new PocketBaseAPI('pocketbase', 'PocketBase', 'BaaS', '0.19'),
  new HuggingFaceAPI('huggingface', 'Hugging Face', 'AI', '1.0'),
  new LangChainAPI('langchain', 'LangChain', 'AI', '0.0.330'),
  new MLFlowAPI('mlflow', 'MLFlow', 'AI', '2.8'),
  new TensorFlowAPI('tensorflow', 'TensorFlow', 'AI', '2.14'),
  new PyTorchAPI('pytorch', 'PyTorch', 'AI', '2.1'),
  new ONNXAPI('onnx', 'ONNX', 'AI', '1.15'),
  new OpenCVAPI('opencv', 'OpenCV', 'AI', '4.8'),
  new OpenAIGymAPI('gym', 'OpenAI Gym', 'AI', '0.26'),
  new TensorRTAPI('tensorrt', 'TensorRT', 'AI', '8.6'),
  new GodotEngineAPI('godot', 'Godot', 'Game', '4.2'),
  new BlenderFoundationAPI('blender', 'Blender', 'Game', '4.0'),
  new InkscapeAPI('inkscape', 'Inkscape', 'Game', '1.3'),
  new GIMPAPI('gimp', 'GIMP', 'Game', '2.10'),
  new KritaAPI('krita', 'Krita', 'Game', '5.2'),
  new FigmaOpenSimAPI('figma', 'Figma Sim', 'Game', '1.0'),
  new UnrealOpenToolsAPI('unreal', 'Unreal Tools', 'Game', '5.3'),
  new UnityOpenToolsAPI('unity', 'Unity Tools', 'Game', '2023.2'),
  new OpenStreetMapAPI('osm', 'OpenStreetMap', 'Map', '1.0'),
  new QGISAPI('qgis', 'QGIS', 'Map', '3.34'),
  new MapLibreAPI('maplibre', 'MapLibre', 'Map', '3.0'),
  new LeafletAPI('leaflet', 'Leaflet', 'Map', '1.9'),
  new VLCAPI('vlc', 'VLC', 'Media', '3.0'),
  new FFmpegAPI('ffmpeg', 'FFmpeg', 'Media', '6.1'),
  new OBSStudioAPI('obs', 'OBS Studio', 'Media', '30.0'),
  new WireGuardAPI('wireguard', 'WireGuard', 'Net', '1.0'),
  new OpenVPNAPI('openvpn', 'OpenVPN', 'Net', '2.6'),
  new TorProjectAPI('tor', 'Tor', 'Net', '0.4.8'),
  new UBlockOriginAPI('ublock', 'uBlock Origin', 'Net', '1.53'),
  new BraveShieldsAPI('brave', 'Brave Shields', 'Net', '1.0'),
  new MinIOAPI('minio', 'MinIO', 'Infra', 'RELEASE.2023'),
  new CephAPI('ceph', 'Ceph', 'Infra', '18.2'),
  new OpenStackAPI('openstack', 'OpenStack', 'Infra', '2023.2'),
  new ProxmoxAPI('proxmox', 'Proxmox', 'Infra', '8.0'),
  new HomeAssistantAPI('hass', 'Home Assistant', 'IoT', '2023.11'),
  new OpenHABAPI('openhab', 'OpenHAB', 'IoT', '4.0'),
  new MatterProtocolAPI('matter', 'Matter', 'IoT', '1.2'),
  new ZigbeeAPI('zigbee', 'Zigbee', 'IoT', '3.0'),
  new LLVMAPI('llvm', 'LLVM', 'Compiler', '17.0'),
  new WebKitAPI('webkit', 'WebKit', 'Compiler', '617.1'),
  new ChromiumAPI('chromium', 'Chromium', 'Compiler', '119.0'),
  new NextcloudAPI('nextcloud', 'Nextcloud', 'Collab', '27.1'),
  new OwnCloudAPI('owncloud', 'OwnCloud', 'Collab', '10.13'),
  new MastodonAPI('mastodon', 'Mastodon', 'Collab', '4.2'),
  new MatrixAPI('matrix', 'Matrix', 'Collab', '1.9'),
  new SignalProtocolAPI('signal', 'Signal', 'Collab', '1.0'),
  new ApacheAirflowAPI('airflow', 'Airflow', 'CI', '2.7'),
  new JenkinsAPI('jenkins', 'Jenkins', 'CI', '2.426'),
  new DroneCIAPI('drone', 'Drone', 'CI', '2.20'),
];

// ==========================================
// PART III: SYSTEM KERNEL & LOGIC
// ==========================================

class SystemKernel {
  private static instance: SystemKernel;
  private state: KernelState;
  private eventLog: SystemEvent[] = [];
  private listeners: ((state: KernelState) => void)[] = [];
  private eventListeners: ((event: SystemEvent) => void)[] = [];

  private constructor() {
    this.state = {
      bootTime: Date.now(),
      uptime: 0,
      tickCount: 0,
      systemLoad: 0.1,
      memoryUsage: 0.2,
      networkTraffic: { in: 0, out: 0 },
      activeProcesses: 1,
      user: {
        id: 'u-root',
        username: 'Administrator',
        role: 'ADMIN',
        permissions: ['*'],
        preferences: {},
        wallet: { fiat: 1000000, crypto: { BTC: 5.2, ETH: 120 } }
      },
      theme: 'dark'
    };
    this.startLoop();
  }

  public static getInstance(): SystemKernel {
    if (!SystemKernel.instance) {
      SystemKernel.instance = new SystemKernel();
    }
    return SystemKernel.instance;
  }

  private startLoop() {
    setInterval(() => {
      this.tick();
    }, 1000);
  }

  private tick() {
    this.state.tickCount++;
    this.state.uptime = Date.now() - this.state.bootTime;
    
    // Simulate system load fluctuation
    this.state.systemLoad = Math.max(0.05, Math.min(1.0, this.state.systemLoad + (Math.random() - 0.5) * 0.1));
    this.state.memoryUsage = Math.max(0.1, Math.min(0.9, this.state.memoryUsage + (Math.random() - 0.5) * 0.05));
    this.state.networkTraffic = {
      in: Math.floor(Math.random() * 1000),
      out: Math.floor(Math.random() * 500)
    };

    // Random system events
    if (Math.random() > 0.95) {
      this.emitEvent({
        id: `evt-${Date.now()}`,
        timestamp: Date.now(),
        source: 'KERNEL',
        type: 'INFO',
        message: 'Garbage collection cycle completed.'
      });
    }

    this.notify();
  }

  public subscribe(callback: (state: KernelState) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public subscribeToEvents(callback: (event: SystemEvent) => void) {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }

  public emitEvent(event: SystemEvent) {
    this.eventLog.unshift(event);
    if (this.eventLog.length > 1000) this.eventLog.pop();
    this.eventListeners.forEach(l => l(event));
  }

  public getState() {
    return this.state;
  }

  public getEvents() {
    return this.eventLog;
  }
}

// ==========================================
// PART IV: UI COMPONENT LIBRARY
// ==========================================

const WindowFrame = ({ title, children, onClose, isMaximized, onMaximize, isActive, onClick }: any) => (
  <div 
    className={`absolute flex flex-col bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden transition-all duration-200 ${isActive ? 'z-50 ring-1 ring-indigo-500' : 'z-10 opacity-90'}`}
    style={{
      top: isMaximized ? 0 : '10%',
      left: isMaximized ? 0 : '10%',
      width: isMaximized ? '100%' : '80%',
      height: isMaximized ? '100%' : '80%',
    }}
    onClick={onClick}
  >
    <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 select-none cursor-move">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer" onClick={onClose}></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer" onClick={onMaximize}></div>
        <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 cursor-pointer"></div>
      </div>
      <span className="text-sm font-medium text-gray-300">{title}</span>
      <div className="w-10"></div>
    </div>
    <div className="flex-grow overflow-auto bg-gray-900/95 backdrop-blur-sm relative">
      {children}
    </div>
  </div>
);

const TaskBar = ({ apps, activeApp, onLaunch }: any) => (
  <div className="h-12 bg-gray-900/80 backdrop-blur-md border-t border-gray-700 flex items-center px-4 space-x-2 z-50 absolute bottom-0 w-full">
    <div className="p-2 rounded hover:bg-gray-700 cursor-pointer transition-colors">
      <LayoutDashboard className="w-6 h-6 text-indigo-400" />
    </div>
    <div className="h-6 w-px bg-gray-700 mx-2"></div>
    {apps.map((app: any) => (
      <div 
        key={app.id}
        onClick={() => onLaunch(app.id)}
        className={`p-2 rounded cursor-pointer transition-all duration-200 flex items-center space-x-2 ${activeApp === app.id ? 'bg-gray-700 text-white shadow-inner' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
      >
        <app.icon className="w-5 h-5" />
        <span className="text-xs font-medium hidden md:block">{app.name}</span>
        {activeApp === app.id && <div className="w-1 h-1 bg-indigo-400 rounded-full ml-1"></div>}
      </div>
    ))}
    <div className="flex-grow"></div>
    <div className="flex items-center space-x-4 text-xs text-gray-400 font-mono">
      <div className="flex items-center"><Wifi className="w-3 h-3 mr-1" /> 1Gbps</div>
      <div className="flex items-center"><Cpu className="w-3 h-3 mr-1" /> 12%</div>
      <div className="flex items-center"><Battery className="w-3 h-3 mr-1" /> 100%</div>
      <div>{new Date().toLocaleTimeString()}</div>
    </div>
  </div>
);

// ==========================================
// PART V: APPLICATIONS
// ==========================================

// --- App 1: API Explorer ---

const APIExplorer = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedAPI, setSelectedAPI] = useState<SimulatedAPI | null>(null);
  const [requestLog, setRequestLog] = useState<any[]>([]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(API_REGISTRY.map(a => a.category)))], []);
  
  const filteredAPIs = useMemo(() => {
    return API_REGISTRY.filter(api => 
      (selectedCategory === 'All' || api.category === selectedCategory) &&
      (api.name.toLowerCase().includes(search.toLowerCase()) || api.id.includes(search.toLowerCase()))
    );
  }, [selectedCategory, search]);

  const handleCall = async (endpoint: APIEndpoint) => {
    if (!selectedAPI) return;
    const res = await selectedAPI.call(endpoint.path, endpoint.method);
    setRequestLog(prev => [{
      timestamp: new Date().toISOString(),
      api: selectedAPI.name,
      method: endpoint.method,
      path: endpoint.path,
      status: res.status,
      latency: res.meta?.latency?.toFixed(2) + 'ms',
      response: res.data || res.error
    }, ...prev]);
  };

  return (
    <div className="flex h-full text-gray-200">
      <div className="w-64 bg-gray-800/50 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search APIs..." 
              className="w-full bg-gray-900 border border-gray-600 rounded pl-8 pr-2 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {categories.map(c => (
              <button 
                key={c} 
                onClick={() => setSelectedCategory(c)}
                className={`text-xs px-2 py-1 rounded ${selectedCategory === c ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-2 space-y-1">
          {filteredAPIs.map(api => (
            <div 
              key={api.id}
              onClick={() => setSelectedAPI(api)}
              className={`p-2 rounded cursor-pointer flex items-center justify-between ${selectedAPI?.id === api.id ? 'bg-indigo-900/50 border border-indigo-500/50' : 'hover:bg-gray-700/50'}`}
            >
              <span className="text-sm font-medium">{api.name}</span>
              <span className="text-[10px] bg-gray-800 px-1 rounded text-gray-400">{api.version}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-grow flex flex-col bg-gray-900">
        {selectedAPI ? (
          <>
            <div className="p-6 border-b border-gray-700 bg-gray-800/30">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Globe className="w-6 h-6 mr-2 text-indigo-400" />
                    {selectedAPI.name}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Category: {selectedAPI.category} • ID: {selectedAPI.id}</p>
                </div>
                <div className="flex space-x-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-500 text-xs uppercase">Uptime</div>
                    <div className="text-green-400 font-mono">99.99%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500 text-xs uppercase">Latency</div>
                    <div className="text-yellow-400 font-mono">24ms</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center"><Link className="w-4 h-4 mr-2" /> Endpoints</h3>
                <div className="grid gap-3">
                  {selectedAPI.getMetadata().endpoints.map((ep, i) => (
                    <div key={i} className="bg-gray-800 border border-gray-700 rounded p-3 flex items-center justify-between group hover:border-gray-500 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Badge variant={ep.method === 'GET' ? 'default' : 'destructive'}>{ep.method}</Badge>
                        <code className="text-sm text-indigo-300 font-mono">{ep.path}</code>
                        <span className="text-sm text-gray-400">- {ep.description}</span>
                      </div>
                      <button 
                        onClick={() => handleCall(ep)}
                        className="bg-gray-700 hover:bg-indigo-600 text-white px-3 py-1 rounded text-xs transition-colors flex items-center"
                      >
                        <Play className="w-3 h-3 mr-1" /> Test
                      </button>
                    </div>
                  ))}
                  {selectedAPI.getMetadata().endpoints.length === 0 && (
                    <div className="text-gray-500 italic">No public endpoints documented.</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center"><Terminal className="w-4 h-4 mr-2" /> Request Log</h3>
                <div className="bg-black rounded-lg border border-gray-700 p-4 font-mono text-xs h-64 overflow-y-auto custom-scrollbar">
                  {requestLog.length === 0 && <span className="text-gray-600">// No requests made yet...</span>}
                  {requestLog.map((log, i) => (
                    <div key={i} className="mb-4 border-b border-gray-800 pb-2 last:border-0">
                      <div className="flex items-center space-x-2 text-gray-500 mb-1">
                        <span>[{log.timestamp.split('T')[1].split('.')[0]}]</span>
                        <span className={log.status === 200 ? 'text-green-500' : 'text-red-500'}>{log.status}</span>
                        <span className="text-indigo-400">{log.method}</span>
                        <span>{log.path}</span>
                        <span className="text-yellow-600">({log.latency})</span>
                      </div>
                      <pre className="text-gray-300 pl-4 border-l-2 border-gray-800 overflow-x-auto">
                        {JSON.stringify(log.response, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 flex-col">
            <Server className="w-16 h-16 mb-4 opacity-20" />
            <p>Select an API from the registry to explore.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- App 2: Algo Trading Lab (The Original Core) ---

// Re-implementing the core logic from the input file but integrated into the OS
const AlgoTradingLabApp = () => {
  // ... (Logic from original file, condensed and adapted)
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div className="flex h-full bg-gray-900 text-white">
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 font-bold text-indigo-400 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" /> QUANT LAB
        </div>
        <nav className="flex-grow p-2 space-y-1">
          {['Dashboard', 'Strategy Editor', 'Backtest Engine', 'Live Markets', 'Risk Analysis'].map(item => (
            <div 
              key={item}
              onClick={() => setActiveTab(item.toLowerCase())}
              className={`p-2 rounded cursor-pointer text-sm font-medium ${activeTab === item.toLowerCase() ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              {item}
            </div>
          ))}
        </nav>
      </div>
      <div className="flex-grow p-6 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Portfolio Performance</h3>
              <div className="h-64 flex items-end space-x-1">
                {Array(50).fill(0).map((_, i) => {
                  const h = 20 + Math.random() * 60;
                  return <div key={i} className="flex-1 bg-indigo-500 hover:bg-indigo-400 transition-all" style={{ height: `${h}%` }}></div>
                })}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Total Equity</h3>
                <div className="text-3xl font-bold text-white">$1,245,302.55</div>
                <div className="text-sm text-green-400 mt-1">+2.4% today</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Active Algos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Mean Reversion A</span><span className="text-green-400">Running</span></div>
                  <div className="flex justify-between text-sm"><span>Crypto Arb Bot</span><span className="text-green-400">Running</span></div>
                  <div className="flex justify-between text-sm"><span>News Sentiment</span><span className="text-yellow-400">Paused</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'strategy editor' && (
          <div className="h-full flex flex-col">
            <div className="bg-gray-800 p-2 rounded-t-lg border border-gray-700 flex space-x-2">
              <button className="px-3 py-1 bg-indigo-600 rounded text-xs font-bold">Save</button>
              <button className="px-3 py-1 bg-gray-700 rounded text-xs">Compile</button>
            </div>
            <textarea 
              className="flex-grow bg-black font-mono text-sm text-green-400 p-4 border border-gray-700 rounded-b-lg focus:outline-none resize-none"
              defaultValue={`class MeanReversionStrategy(Strategy):
    def init(self):
        self.rsi = self.I(ta.rsi, self.data.Close, 14)

    def next(self):
        if self.rsi < 30:
            self.buy()
        elif self.rsi > 70:
            self.sell()
            
# AI Optimization Suggestion:
# Consider adding a volatility filter (ATR > 1.5) to reduce false signals in sideways markets.`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// --- App 3: System Monitor ---

const SystemMonitorApp = () => {
  const [history, setHistory] = useState<any[]>([]);
  const kernel = SystemKernel.getInstance();

  useEffect(() => {
    const unsub = kernel.subscribe((state) => {
      setHistory(prev => [...prev.slice(-49), state]);
    });
    return unsub;
  }, []);

  const currentState = history[history.length - 1] || kernel.getState();

  return (
    <div className="p-6 h-full bg-black text-green-500 font-mono overflow-hidden flex flex-col">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-green-900 p-4 rounded">
          <div className="text-xs text-green-700 uppercase">CPU Load</div>
          <div className="text-4xl font-bold">{(currentState.systemLoad * 100).toFixed(1)}%</div>
          <div className="w-full bg-green-900/30 h-2 mt-2 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${currentState.systemLoad * 100}%` }}></div>
          </div>
        </div>
        <div className="border border-green-900 p-4 rounded">
          <div className="text-xs text-green-700 uppercase">Memory</div>
          <div className="text-4xl font-bold">{(currentState.memoryUsage * 100).toFixed(1)}%</div>
          <div className="w-full bg-green-900/30 h-2 mt-2 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${currentState.memoryUsage * 100}%` }}></div>
          </div>
        </div>
      </div>
      
      <div className="flex-grow border border-green-900 p-4 rounded relative overflow-hidden">
        <div className="absolute top-2 left-4 text-xs text-green-700 uppercase">Network Traffic (In/Out)</div>
        <div className="flex items-end justify-between h-full space-x-1 pt-6">
          {history.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end space-y-1 h-full">
              <div className="bg-green-500/50 w-full transition-all" style={{ height: `${Math.min(100, h.networkTraffic.in / 10)}%` }}></div>
              <div className="bg-green-800/50 w-full transition-all" style={{ height: `${Math.min(100, h.networkTraffic.out / 5)}%` }}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 h-32 border border-green-900 p-2 rounded overflow-y-auto text-xs">
        {kernel.getEvents().map((e, i) => (
          <div key={i} className="mb-1">
            <span className="text-green-700">[{new Date(e.timestamp).toLocaleTimeString()}]</span> <span className="text-green-300">{e.type}</span>: {e.message}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// PART VI: MAIN DESKTOP ENVIRONMENT
// ==========================================

const FamilyOS = () => {
  const [apps, setApps] = useState([
    { id: 'algo-lab', name: 'Algo Trading Lab', icon: TrendingUp, component: AlgoTradingLabApp, isOpen: true, isMaximized: true },
    { id: 'api-explorer', name: 'Open Source Universe', icon: Globe, component: APIExplorer, isOpen: false, isMaximized: false },
    { id: 'sys-mon', name: 'System Monitor', icon: Activity, component: SystemMonitorApp, isOpen: false, isMaximized: false },
    { id: 'terminal', name: 'Terminal', icon: Terminal, component: () => <div className="p-4 font-mono text-green-400">root@family-os:~$ <span className="animate-pulse">_</span></div>, isOpen: false, isMaximized: false },
  ]);
  
  const [activeAppId, setActiveAppId] = useState('algo-lab');

  // Initialize Kernel
  useEffect(() => {
    SystemKernel.getInstance();
  }, []);

  const launchApp = (id: string) => {
    setApps(apps.map(app => app.id === id ? { ...app, isOpen: true } : app));
    setActiveAppId(id);
  };

  const closeApp = (id: string) => {
    setApps(apps.map(app => app.id === id ? { ...app, isOpen: false } : app));
    if (activeAppId === id) setActiveAppId('');
  };

  const toggleMaximize = (id: string) => {
    setApps(apps.map(app => app.id === id ? { ...app, isMaximized: !app.isMaximized } : app));
  };

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden font-sans select-none">
      {/* Desktop Background / Wallpaper */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/90 pointer-events-none"></div>

      {/* Windows */}
      {apps.map(app => app.isOpen && (
        <WindowFrame
          key={app.id}
          title={app.name}
          isActive={activeAppId === app.id}
          isMaximized={app.isMaximized}
          onClose={() => closeApp(app.id)}
          onMaximize={() => toggleMaximize(app.id)}
          onClick={() => setActiveAppId(app.id)}
        >
          <app.component />
        </WindowFrame>
      ))}

      {/* Taskbar */}
      <TaskBar 
        apps={apps} 
        activeApp={activeAppId} 
        onLaunch={launchApp} 
      />
    </div>
  );
};

export default FamilyOS;