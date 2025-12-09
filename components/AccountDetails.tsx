import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer, createContext, useContext } from 'react';

/**
 * THE OPEN SOURCE UNIVERSE FORGE
 * 
 * A self-contained, dependency-free simulation of the global open-source ecosystem.
 * Expanded from the DNA of a simple AccountDetails component.
 * 
 * @system Version: 10.0.0-ALPHA
 * @codename: OMNIVERSE_LEDGER
 * @license: MIT (Simulated)
 */

// ==========================================
// SECTION 1: CORE UTILITIES & MATH ENGINE
// ==========================================

const UUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const Random = {
  float: (min: number, max: number) => Math.random() * (max - min) + min,
  int: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min),
  choice: <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
  bool: (chance: number = 0.5) => Math.random() < chance,
  date: (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
  series: (length: number, generator: (i: number) => any) => Array.from({ length }, (_, i) => generator(i)),
};

const Color = {
  hexToRgba: (hex: string, alpha: number = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
  lerp: (start: string, end: string, t: number) => {
    // Simple linear interpolation for colors would go here
    return end; 
  },
  theme: {
    primary: '#3b82f6',
    secondary: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    dark: '#111827',
    light: '#f3f4f6',
    surface: '#ffffff',
    border: '#e5e7eb',
    text: '#374151',
    textMuted: '#9ca3af',
  }
};

const Time = {
  now: () => Math.floor(Date.now() / 1000),
  format: (timestamp: number, fmt: string = 'YYYY-MM-DD') => {
    const d = new Date(timestamp * 1000);
    const map: Record<string, string> = {
      YYYY: d.getFullYear().toString(),
      MM: String(d.getMonth() + 1).padStart(2, '0'),
      DD: String(d.getDate()).padStart(2, '0'),
      HH: String(d.getHours()).padStart(2, '0'),
      mm: String(d.getMinutes()).padStart(2, '0'),
      ss: String(d.getSeconds()).padStart(2, '0'),
    };
    return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, matched => map[matched]);
  },
  ago: (timestamp: number) => {
    const diff = Time.now() - timestamp;
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
};

// ==========================================
// SECTION 2: DATA STRUCTURES & TYPES
// ==========================================

type Currency = 'USD' | 'EUR' | 'BTC' | 'ETH' | 'CREDITS' | 'CONTRIB';

interface EntityIdentity {
  id: string;
  name: string;
  type: 'foundation' | 'corporation' | 'community' | 'protocol' | 'tool';
  domain: string;
  founded: number;
  reputation: number;
  tier: 'S' | 'A' | 'B' | 'C';
}

interface FinancialSnapshot {
  balance: number;
  currency: Currency;
  burnRate: number;
  revenue: number;
  lastAudit: number;
}

interface CodeMetrics {
  linesOfCode: number;
  contributors: number;
  stars: number;
  forks: number;
  issuesOpen: number;
  issuesClosed: number;
  velocity: number; // commits per week
}

interface APIMetrics {
  uptime: number;
  latency: number;
  requestsPerSecond: number;
  errorRate: number;
  activeConnections: number;
}

interface SimulatedNode {
  id: string;
  identity: EntityIdentity;
  finance: FinancialSnapshot;
  code: CodeMetrics;
  api: APIMetrics;
  logs: string[];
}

interface TransactionRecord {
  id: string;
  sourceId: string;
  targetId: string;
  amount: number;
  currency: Currency;
  timestamp: number;
  type: 'grant' | 'donation' | 'service_fee' | 'cloud_cost' | 'bounty';
  status: 'pending' | 'completed' | 'failed';
  hash: string;
}

// ==========================================
// SECTION 3: THE 100 API SIMULATIONS
// ==========================================

/**
 * Base class for all simulated Open Source APIs.
 * This replaces the simple "fetchAccountDetails" with a robust object-oriented system.
 */
abstract class OpenSourceProvider {
  public readonly id: string;
  public readonly name: string;
  protected state: SimulatedNode;
  protected history: TransactionRecord[] = [];

  constructor(name: string, type: EntityIdentity['type'], domain: string) {
    this.id = UUID();
    this.name = name;
    this.state = {
      id: this.id,
      identity: {
        id: this.id,
        name: name,
        type: type,
        domain: domain,
        founded: Time.now() - Random.int(31536000, 31536000 * 20),
        reputation: Random.int(50, 100),
        tier: Random.choice(['S', 'A', 'B']),
      },
      finance: {
        balance: Random.float(10000, 50000000),
        currency: 'USD',
        burnRate: Random.float(1000, 50000),
        revenue: Random.float(2000, 100000),
        lastAudit: Time.now() - Random.int(0, 86400 * 30),
      },
      code: {
        linesOfCode: Random.int(5000, 50000000),
        contributors: Random.int(10, 5000),
        stars: Random.int(100, 200000),
        forks: Random.int(50, 50000),
        issuesOpen: Random.int(0, 5000),
        issuesClosed: Random.int(100, 50000),
        velocity: Random.float(0.1, 50),
      },
      api: {
        uptime: 99.9 + Random.float(0, 0.09),
        latency: Random.int(10, 200),
        requestsPerSecond: Random.int(10, 10000),
        errorRate: Random.float(0, 0.05),
        activeConnections: Random.int(5, 5000),
      },
      logs: [],
    };
    this.generateHistory();
  }

  private generateHistory() {
    const count = Random.int(20, 100);
    for (let i = 0; i < count; i++) {
      this.history.push({
        id: UUID(),
        sourceId: Random.bool() ? this.id : UUID(),
        targetId: Random.bool() ? UUID() : this.id,
        amount: Random.float(10, 5000),
        currency: 'USD',
        timestamp: Time.now() - (i * 86400),
        type: Random.choice(['grant', 'donation', 'service_fee', 'cloud_cost']),
        status: 'completed',
        hash: UUID().split('-')[0],
      });
    }
  }

  // Public API Methods
  public async getDetails(): Promise<SimulatedNode> {
    await this.simulateNetworkDelay();
    return { ...this.state };
  }

  public async getTransactions(limit: number = 50): Promise<TransactionRecord[]> {
    await this.simulateNetworkDelay();
    return this.history.slice(0, limit);
  }

  public async getMetrics(): Promise<APIMetrics> {
    await this.simulateNetworkDelay();
    // Fluctuate metrics slightly
    this.state.api.activeConnections += Random.int(-10, 10);
    this.state.api.latency += Random.int(-5, 5);
    return this.state.api;
  }

  public async healthCheck(): Promise<{ status: string; timestamp: number }> {
    return { status: 'healthy', timestamp: Time.now() };
  }

  protected async simulateNetworkDelay() {
    const delay = this.state.api.latency + Random.int(0, 50);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// --- Specific Implementations for the 100 Entities ---

class LinuxFoundationAPI extends OpenSourceProvider { constructor() { super('Linux Foundation', 'foundation', 'linuxfoundation.org'); } }
class CanonicalAPI extends OpenSourceProvider { constructor() { super('Canonical', 'corporation', 'ubuntu.com'); } }
class RedHatAPI extends OpenSourceProvider { constructor() { super('Red Hat', 'corporation', 'redhat.com'); } }
class FedoraProjectAPI extends OpenSourceProvider { constructor() { super('Fedora Project', 'community', 'fedoraproject.org'); } }
class DebianProjectAPI extends OpenSourceProvider { constructor() { super('Debian Project', 'community', 'debian.org'); } }
class OpenSUSEAPI extends OpenSourceProvider { constructor() { super('OpenSUSE', 'community', 'opensuse.org'); } }
class ArchLinuxAPI extends OpenSourceProvider { constructor() { super('Arch Linux', 'community', 'archlinux.org'); } }
class ManjaroAPI extends OpenSourceProvider { constructor() { super('Manjaro', 'corporation', 'manjaro.org'); } }
class FreeBSDAPI extends OpenSourceProvider { constructor() { super('FreeBSD', 'foundation', 'freebsd.org'); } }
class NetBSDAPI extends OpenSourceProvider { constructor() { super('NetBSD', 'foundation', 'netbsd.org'); } }
class OpenBSDAPI extends OpenSourceProvider { constructor() { super('OpenBSD', 'foundation', 'openbsd.org'); } }
class KubernetesAPI extends OpenSourceProvider { constructor() { super('Kubernetes', 'community', 'kubernetes.io'); } }
class CNCFAPI extends OpenSourceProvider { constructor() { super('CNCF', 'foundation', 'cncf.io'); } }
class DockerAPI extends OpenSourceProvider { constructor() { super('Docker', 'corporation', 'docker.com'); } }
class PodmanAPI extends OpenSourceProvider { constructor() { super('Podman', 'community', 'podman.io'); } }
class AnsibleAPI extends OpenSourceProvider { constructor() { super('Ansible', 'community', 'ansible.com'); } }
class TerraformAPI extends OpenSourceProvider { constructor() { super('Terraform', 'tool', 'terraform.io'); } }
class HashiCorpAPI extends OpenSourceProvider { constructor() { super('HashiCorp', 'corporation', 'hashicorp.com'); } }
class ApacheFoundationAPI extends OpenSourceProvider { constructor() { super('Apache Foundation', 'foundation', 'apache.org'); } }
class NGINXAPI extends OpenSourceProvider { constructor() { super('NGINX', 'tool', 'nginx.org'); } }
class MozillaAPI extends OpenSourceProvider { constructor() { super('Mozilla', 'foundation', 'mozilla.org'); } }
class FirefoxDevToolsAPI extends OpenSourceProvider { constructor() { super('Firefox DevTools', 'tool', 'firefox-dev.tools'); } }
class GitAPI extends OpenSourceProvider { constructor() { super('Git', 'tool', 'git-scm.com'); } }
class GitHubAPI extends OpenSourceProvider { constructor() { super('GitHub', 'corporation', 'github.com'); } }
class GitLabAPI extends OpenSourceProvider { constructor() { super('GitLab', 'corporation', 'gitlab.com'); } }
class BitbucketAPI extends OpenSourceProvider { constructor() { super('Bitbucket', 'corporation', 'bitbucket.org'); } }
class VSCodeAPI extends OpenSourceProvider { constructor() { super('VS Code', 'tool', 'code.visualstudio.com'); } }
class EclipseFoundationAPI extends OpenSourceProvider { constructor() { super('Eclipse Foundation', 'foundation', 'eclipse.org'); } }
class JetBrainsAPI extends OpenSourceProvider { constructor() { super('JetBrains', 'corporation', 'jetbrains.com'); } }
class PythonFoundationAPI extends OpenSourceProvider { constructor() { super('Python Software Foundation', 'foundation', 'python.org'); } }
class NodeFoundationAPI extends OpenSourceProvider { constructor() { super('Node.js Foundation', 'foundation', 'nodejs.org'); } }
class DenoAPI extends OpenSourceProvider { constructor() { super('Deno', 'corporation', 'deno.land'); } }
class BunAPI extends OpenSourceProvider { constructor() { super('Bun', 'corporation', 'bun.sh'); } }
class RustFoundationAPI extends OpenSourceProvider { constructor() { super('Rust Foundation', 'foundation', 'rust-lang.org'); } }
class GoLangAPI extends OpenSourceProvider { constructor() { super('GoLang', 'community', 'go.dev'); } }
class RubyAPI extends OpenSourceProvider { constructor() { super('Ruby', 'community', 'ruby-lang.org'); } }
class PHPAPI extends OpenSourceProvider { constructor() { super('PHP', 'community', 'php.net'); } }
class MariaDBAPI extends OpenSourceProvider { constructor() { super('MariaDB', 'foundation', 'mariadb.org'); } }
class MySQLAPI extends OpenSourceProvider { constructor() { super('MySQL', 'corporation', 'mysql.com'); } }
class PostgreSQLAPI extends OpenSourceProvider { constructor() { super('PostgreSQL', 'community', 'postgresql.org'); } }
class SQLiteAPI extends OpenSourceProvider { constructor() { super('SQLite', 'community', 'sqlite.org'); } }
class RedisAPI extends OpenSourceProvider { constructor() { super('Redis', 'corporation', 'redis.io'); } }
class MongoDBAPI extends OpenSourceProvider { constructor() { super('MongoDB', 'corporation', 'mongodb.com'); } }
class CassandraAPI extends OpenSourceProvider { constructor() { super('Cassandra', 'community', 'cassandra.apache.org'); } }
class ElasticSearchAPI extends OpenSourceProvider { constructor() { super('ElasticSearch', 'corporation', 'elastic.co'); } }
class ApacheSparkAPI extends OpenSourceProvider { constructor() { super('Apache Spark', 'community', 'spark.apache.org'); } }
class ApacheKafkaAPI extends OpenSourceProvider { constructor() { super('Apache Kafka', 'community', 'kafka.apache.org'); } }
class SupabaseAPI extends OpenSourceProvider { constructor() { super('Supabase', 'corporation', 'supabase.com'); } }
class AppwriteAPI extends OpenSourceProvider { constructor() { super('Appwrite', 'corporation', 'appwrite.io'); } }
class PocketBaseAPI extends OpenSourceProvider { constructor() { super('PocketBase', 'community', 'pocketbase.io'); } }
class HuggingFaceAPI extends OpenSourceProvider { constructor() { super('Hugging Face', 'corporation', 'huggingface.co'); } }
class LangChainAPI extends OpenSourceProvider { constructor() { super('LangChain', 'corporation', 'langchain.com'); } }
class MLFlowAPI extends OpenSourceProvider { constructor() { super('MLFlow', 'community', 'mlflow.org'); } }
class TensorFlowAPI extends OpenSourceProvider { constructor() { super('TensorFlow', 'community', 'tensorflow.org'); } }
class PyTorchAPI extends OpenSourceProvider { constructor() { super('PyTorch', 'foundation', 'pytorch.org'); } }
class ONNXAPI extends OpenSourceProvider { constructor() { super('ONNX', 'community', 'onnx.ai'); } }
class OpenCVAPI extends OpenSourceProvider { constructor() { super('OpenCV', 'foundation', 'opencv.org'); } }
class OpenAIGymAPI extends OpenSourceProvider { constructor() { super('OpenAI Gym', 'tool', 'gym.openai.com'); } }
class GodotEngineAPI extends OpenSourceProvider { constructor() { super('Godot Engine', 'foundation', 'godotengine.org'); } }
class BlenderFoundationAPI extends OpenSourceProvider { constructor() { super('Blender Foundation', 'foundation', 'blender.org'); } }
class InkscapeAPI extends OpenSourceProvider { constructor() { super('Inkscape', 'community', 'inkscape.org'); } }
class GIMPAPI extends OpenSourceProvider { constructor() { super('GIMP', 'community', 'gimp.org'); } }
class KritaAPI extends OpenSourceProvider { constructor() { super('Krita', 'foundation', 'krita.org'); } }
class FigmaOpenAPI extends OpenSourceProvider { constructor() { super('Figma Open', 'corporation', 'figma.com'); } }
class UnrealOpenToolsAPI extends OpenSourceProvider { constructor() { super('Unreal Open Tools', 'corporation', 'unrealengine.com'); } }
class UnityOpenToolsAPI extends OpenSourceProvider { constructor() { super('Unity Open Tools', 'corporation', 'unity.com'); } }
class OpenStreetMapAPI extends OpenSourceProvider { constructor() { super('OpenStreetMap', 'foundation', 'openstreetmap.org'); } }
class QGISAPI extends OpenSourceProvider { constructor() { super('QGIS', 'community', 'qgis.org'); } }
class MapLibreAPI extends OpenSourceProvider { constructor() { super('MapLibre', 'community', 'maplibre.org'); } }
class LeafletAPI extends OpenSourceProvider { constructor() { super('Leaflet.js', 'community', 'leafletjs.com'); } }
class VLCAPI extends OpenSourceProvider { constructor() { super('VLC', 'foundation', 'videolan.org'); } }
class FFmpegAPI extends OpenSourceProvider { constructor() { super('FFmpeg', 'community', 'ffmpeg.org'); } }
class OBSStudioAPI extends OpenSourceProvider { constructor() { super('OBS Studio', 'community', 'obsproject.com'); } }
class WireGuardAPI extends OpenSourceProvider { constructor() { super('WireGuard', 'protocol', 'wireguard.com'); } }
class OpenVPNAPI extends OpenSourceProvider { constructor() { super('OpenVPN', 'corporation', 'openvpn.net'); } }
class TorProjectAPI extends OpenSourceProvider { constructor() { super('Tor Project', 'foundation', 'torproject.org'); } }
class DuckDBAPI extends OpenSourceProvider { constructor() { super('DuckDB', 'corporation', 'duckdb.org'); } }
class ClickHouseAPI extends OpenSourceProvider { constructor() { super('ClickHouse', 'corporation', 'clickhouse.com'); } }
class MinIOAPI extends OpenSourceProvider { constructor() { super('MinIO', 'corporation', 'min.io'); } }
class CephAPI extends OpenSourceProvider { constructor() { super('Ceph', 'foundation', 'ceph.io'); } }
class OpenStackAPI extends OpenSourceProvider { constructor() { super('OpenStack', 'foundation', 'openstack.org'); } }
class ProxmoxAPI extends OpenSourceProvider { constructor() { super('Proxmox', 'corporation', 'proxmox.com'); } }
class HomeAssistantAPI extends OpenSourceProvider { constructor() { super('Home Assistant', 'community', 'home-assistant.io'); } }
class OpenHABAPI extends OpenSourceProvider { constructor() { super('OpenHAB', 'foundation', 'openhab.org'); } }
class MatterProtocolAPI extends OpenSourceProvider { constructor() { super('Matter', 'protocol', 'csa-iot.org'); } }
class ZigbeeAPI extends OpenSourceProvider { constructor() { super('Zigbee', 'protocol', 'zigbee.org'); } }
class TensorRTAPI extends OpenSourceProvider { constructor() { super('TensorRT', 'tool', 'developer.nvidia.com'); } }
class LLVMAPI extends OpenSourceProvider { constructor() { super('LLVM', 'foundation', 'llvm.org'); } }
class WebKitAPI extends OpenSourceProvider { constructor() { super('WebKit', 'community', 'webkit.org'); } }
class ChromiumAPI extends OpenSourceProvider { constructor() { super('Chromium', 'community', 'chromium.org'); } }
class UBlockOriginAPI extends OpenSourceProvider { constructor() { super('uBlock Origin', 'tool', 'ublockorigin.com'); } }
class BraveShieldsAPI extends OpenSourceProvider { constructor() { super('Brave Shields', 'tool', 'brave.com'); } }
class NextcloudAPI extends OpenSourceProvider { constructor() { super('Nextcloud', 'corporation', 'nextcloud.com'); } }
class OwnCloudAPI extends OpenSourceProvider { constructor() { super('OwnCloud', 'corporation', 'owncloud.com'); } }
class MastodonAPI extends OpenSourceProvider { constructor() { super('Mastodon', 'foundation', 'joinmastodon.org'); } }
class MatrixAPI extends OpenSourceProvider { constructor() { super('Matrix', 'protocol', 'matrix.org'); } }
class SignalAPI extends OpenSourceProvider { constructor() { super('Signal', 'foundation', 'signal.org'); } }
class ApacheAirflowAPI extends OpenSourceProvider { constructor() { super('Apache Airflow', 'community', 'airflow.apache.org'); } }
class JenkinsAPI extends OpenSourceProvider { constructor() { super('Jenkins', 'community', 'jenkins.io'); } }
class DroneCIAPI extends OpenSourceProvider { constructor() { super('DroneCI', 'corporation', 'drone.io'); } }

// ==========================================
// SECTION 4: THE UNIVERSE REGISTRY
// ==========================================

class UniverseRegistry {
  private static instance: UniverseRegistry;
  private providers: Map<string, OpenSourceProvider> = new Map();
  private providerList: OpenSourceProvider[] = [];

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
    const classes = [
      LinuxFoundationAPI, CanonicalAPI, RedHatAPI, FedoraProjectAPI, DebianProjectAPI, OpenSUSEAPI, ArchLinuxAPI, ManjaroAPI, FreeBSDAPI, NetBSDAPI, OpenBSDAPI,
      KubernetesAPI, CNCFAPI, DockerAPI, PodmanAPI, AnsibleAPI, TerraformAPI, HashiCorpAPI, ApacheFoundationAPI, NGINXAPI, MozillaAPI, FirefoxDevToolsAPI,
      GitAPI, GitHubAPI, GitLabAPI, BitbucketAPI, VSCodeAPI, EclipseFoundationAPI, JetBrainsAPI, PythonFoundationAPI, NodeFoundationAPI, DenoAPI, BunAPI,
      RustFoundationAPI, GoLangAPI, RubyAPI, PHPAPI, MariaDBAPI, MySQLAPI, PostgreSQLAPI, SQLiteAPI, RedisAPI, MongoDBAPI, CassandraAPI, ElasticSearchAPI,
      ApacheSparkAPI, ApacheKafkaAPI, SupabaseAPI, AppwriteAPI, PocketBaseAPI, HuggingFaceAPI, LangChainAPI, MLFlowAPI, TensorFlowAPI, PyTorchAPI, ONNXAPI,
      OpenCVAPI, OpenAIGymAPI, GodotEngineAPI, BlenderFoundationAPI, InkscapeAPI, GIMPAPI, KritaAPI, FigmaOpenAPI, UnrealOpenToolsAPI, UnityOpenToolsAPI,
      OpenStreetMapAPI, QGISAPI, MapLibreAPI, LeafletAPI, VLCAPI, FFmpegAPI, OBSStudioAPI, WireGuardAPI, OpenVPNAPI, TorProjectAPI, DuckDBAPI, ClickHouseAPI,
      MinIOAPI, CephAPI, OpenStackAPI, ProxmoxAPI, HomeAssistantAPI, OpenHABAPI, MatterProtocolAPI, ZigbeeAPI, TensorRTAPI, LLVMAPI, WebKitAPI, ChromiumAPI,
      UBlockOriginAPI, BraveShieldsAPI, NextcloudAPI, OwnCloudAPI, MastodonAPI, MatrixAPI, SignalAPI, ApacheAirflowAPI, JenkinsAPI, DroneCIAPI
    ];

    classes.forEach(Cls => {
      const instance = new Cls();
      this.providers.set(instance.id, instance);
      this.providerList.push(instance);
    });
  }

  public getAll(): OpenSourceProvider[] {
    return this.providerList;
  }

  public get(id: string): OpenSourceProvider | undefined {
    return this.providers.get(id);
  }

  public search(query: string): OpenSourceProvider[] {
    const q = query.toLowerCase();
    return this.providerList.filter(p => p.name.toLowerCase().includes(q));
  }
}

// ==========================================
// SECTION 5: CUSTOM UI ENGINE (NO EXTERNAL LIBS)
// ==========================================

// --- SVG Charting Engine ---

const ChartEngine = {
  createPath: (data: number[], width: number, height: number) => {
    if (data.length === 0) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    
    const points = data.map((val, i) => {
      const x = i * stepX;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  },
  
  createAreaPath: (data: number[], width: number, height: number) => {
    const linePath = ChartEngine.createPath(data, width, height);
    return `${linePath} L ${width},${height} L 0,${height} Z`;
  }
};

// --- UI Components ---

const Box: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }> = ({ children, className, style, onClick }) => (
  <div onClick={onClick} className={className} style={style}>{children}</div>
);

const Text: React.FC<{ children: React.ReactNode; size?: number; weight?: number; color?: string; className?: string }> = ({ children, size = 14, weight = 400, color = Color.theme.text, className }) => (
  <span className={className} style={{ fontSize: size, fontWeight: weight, color, fontFamily: 'Inter, system-ui, sans-serif' }}>{children}</span>
);

const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean }> = ({ children, onClick, variant = 'primary', disabled }) => {
  const baseStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    fontWeight: 600,
    transition: 'all 0.2s',
    opacity: disabled ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const variants = {
    primary: { backgroundColor: Color.theme.primary, color: '#fff' },
    secondary: { backgroundColor: Color.theme.light, color: Color.theme.text },
    ghost: { backgroundColor: 'transparent', color: Color.theme.primary },
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{ ...baseStyle, ...variants[variant] }}>
      {children}
    </button>
  );
};

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = Color.theme.primary }) => (
  <span style={{
    backgroundColor: Color.hexToRgba(color, 0.1),
    color: color,
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    border: `1px solid ${Color.hexToRgba(color, 0.2)}`
  }}>
    {children}
  </span>
);

const Card: React.FC<{ children: React.ReactNode; title?: string; action?: React.ReactNode }> = ({ children, title, action }) => (
  <div style={{
    backgroundColor: Color.theme.surface,
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: `1px solid ${Color.theme.border}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  }}>
    {(title || action) && (
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${Color.theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
        {title && <Text size={16} weight={600}>{title}</Text>}
        {action}
      </div>
    )}
    <div style={{ padding: '20px' }}>
      {children}
    </div>
  </div>
);

const Grid: React.FC<{ children: React.ReactNode; cols?: number; gap?: number }> = ({ children, cols = 1, gap = 16 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${gap}px` }}>
    {children}
  </div>
);

const Flex: React.FC<{ children: React.ReactNode; dir?: 'row' | 'column'; gap?: number; align?: 'center' | 'start' | 'end' | 'stretch'; justify?: 'center' | 'start' | 'end' | 'space-between'; style?: React.CSSProperties }> = ({ children, dir = 'row', gap = 8, align = 'stretch', justify = 'start', style }) => (
  <div style={{ display: 'flex', flexDirection: dir, gap: `${gap}px`, alignItems: align, justifyContent: justify, ...style }}>
    {children}
  </div>
);

// --- Custom Icons (SVG) ---

const Icons = {
  Server: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>,
  Code: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  Dollar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  Activity: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  ArrowRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Refresh: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>,
};

// ==========================================
// SECTION 6: APPLICATION LOGIC & STATE
// ==========================================

// --- Contexts ---

const UniverseContext = createContext<{
  registry: UniverseRegistry;
  selectedEntity: SimulatedNode | null;
  selectEntity: (id: string) => void;
  globalStats: { totalCapital: number; totalCode: number; activeNodes: number };
}>({
  registry: UniverseRegistry.getInstance(),
  selectedEntity: null,
  selectEntity: () => {},
  globalStats: { totalCapital: 0, totalCode: 0, activeNodes: 0 }
});

// --- Hooks ---

const useEntityData = (provider: OpenSourceProvider) => {
  const [data, setData] = useState<SimulatedNode | null>(null);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [d, h] = await Promise.all([provider.getDetails(), provider.getTransactions()]);
    setData(d);
    setHistory(h);
    setLoading(false);
  }, [provider]);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      // Live update simulation
      provider.getMetrics().then(() => {
        // In a real app, this would trigger a re-render if we stored metrics separately
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [refresh, provider]);

  return { data, history, loading, refresh };
};

// ==========================================
// SECTION 7: SUB-COMPONENTS (The "Apps")
// ==========================================

// 1. The Entity Explorer (Sidebar)
const EntityExplorer: React.FC = () => {
  const { registry, selectEntity, selectedEntity } = useContext(UniverseContext);
  const [filter, setFilter] = useState('');
  
  const entities = useMemo(() => registry.search(filter), [registry, filter]);

  return (
    <div style={{ width: '300px', borderRight: `1px solid ${Color.theme.border}`, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', height: '100%' }}>
      <div style={{ padding: '16px', borderBottom: `1px solid ${Color.theme.border}` }}>
        <Text size={18} weight={700} color={Color.theme.dark}>Universe Explorer</Text>
        <div style={{ marginTop: '12px', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search 100+ APIs..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: `1px solid ${Color.theme.border}`, outline: 'none' }}
          />
          <div style={{ position: 'absolute', left: '10px', top: '8px', color: '#999' }}><Icons.Search /></div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {entities.map(entity => (
          <div 
            key={entity.id}
            onClick={() => selectEntity(entity.id)}
            style={{ 
              padding: '12px 16px', 
              cursor: 'pointer', 
              borderBottom: `1px solid ${Color.theme.light}`,
              backgroundColor: selectedEntity?.id === entity.id ? '#eff6ff' : 'transparent',
              borderLeft: selectedEntity?.id === entity.id ? `4px solid ${Color.theme.primary}` : '4px solid transparent'
            }}
          >
            <Text weight={600} size={14} color={Color.theme.dark} style={{ display: 'block' }}>{entity.name}</Text>
            <Text size={12} color={Color.theme.textMuted}>{entity.name.toLowerCase().replace(/\s/g, '')}.org</Text>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. The Account Details View (The Core Transformation)
const AccountDetailsView: React.FC<{ provider: OpenSourceProvider }> = ({ provider }) => {
  const { data, history, loading, refresh } = useEntityData(provider);

  if (loading || !data) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: `4px solid ${Color.theme.light}`, borderTop: `4px solid ${Color.theme.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <Text color={Color.theme.textMuted}>Connecting to {provider.name} Node...</Text>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Generate chart data from history
  const chartData = history.map(h => h.amount).reverse();
  const balanceHistory = history.reduce((acc, curr) => {
    const last = acc.length > 0 ? acc[acc.length - 1] : data.finance.balance;
    acc.push(last + (curr.amount * (Math.random() > 0.5 ? 1 : -1))); // Simulate fluctuation
    return acc;
  }, [] as number[]);

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: '32px' }}>
        <div>
          <Flex align="center" gap={12}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: Color.theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
              {data.identity.name.charAt(0)}
            </div>
            <div>
              <Text size={24} weight={700} color={Color.theme.dark} style={{ display: 'block' }}>{data.identity.name}</Text>
              <Flex gap={8} align="center">
                <Badge color={Color.theme.secondary}>{data.identity.type.toUpperCase()}</Badge>
                <Text size={14} color={Color.theme.textMuted}>ID: {data.identity.id.split('-')[0]}</Text>
              </Flex>
            </div>
          </Flex>
        </div>
        <Flex gap={12}>
          <Button variant="secondary" onClick={refresh}><Icons.Refresh /> Sync Node</Button>
          <Button variant="primary">Connect Wallet</Button>
        </Flex>
      </Flex>

      {/* Key Metrics Grid */}
      <Grid cols={3} gap={24}>
        <Card>
          <Flex align="center" gap={12} style={{ marginBottom: '8px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#eff6ff', color: Color.theme.primary }}><Icons.Dollar /></div>
            <Text color={Color.theme.textMuted} weight={600}>Treasury Balance</Text>
          </Flex>
          <Text size={32} weight={700} color={Color.theme.dark}>${data.finance.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          <Text size={12} color={data.finance.revenue > data.finance.burnRate ? Color.theme.secondary : Color.theme.danger}>
            {data.finance.revenue > data.finance.burnRate ? '+' : '-'}${Math.abs(data.finance.revenue - data.finance.burnRate).toLocaleString()} / mo net
          </Text>
        </Card>

        <Card>
          <Flex align="center" gap={12} style={{ marginBottom: '8px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: Color.theme.secondary }}><Icons.Code /></div>
            <Text color={Color.theme.textMuted} weight={600}>Code Velocity</Text>
          </Flex>
          <Text size={32} weight={700} color={Color.theme.dark}>{data.code.velocity.toFixed(1)}</Text>
          <Text size={12} color={Color.theme.textMuted}>commits per week</Text>
          <div style={{ marginTop: '12px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(data.code.velocity * 2, 100)}%`, height: '100%', backgroundColor: Color.theme.secondary }}></div>
          </div>
        </Card>

        <Card>
          <Flex align="center" gap={12} style={{ marginBottom: '8px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fef3c7', color: Color.theme.warning }}><Icons.Server /></div>
            <Text color={Color.theme.textMuted} weight={600}>API Health</Text>
          </Flex>
          <Text size={32} weight={700} color={Color.theme.dark}>{data.api.uptime.toFixed(3)}%</Text>
          <Text size={12} color={Color.theme.textMuted}>{data.api.latency}ms latency</Text>
        </Card>
      </Grid>

      {/* Main Content Area */}
      <Grid cols={3} gap={24} style={{ marginTop: '24px' }}>
        {/* Chart Section */}
        <div style={{ gridColumn: 'span 2' }}>
          <Card title="Financial Performance (90 Days)">
            <div style={{ height: '300px', width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '20px 0' }}>
              {/* Y-Axis Labels */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                <span>Max</span>
                <span>Avg</span>
                <span>Min</span>
              </div>
              {/* Chart Area */}
              <div style={{ marginLeft: '40px', flex: 1, height: '100%', position: 'relative' }}>
                {/* Grid Lines */}
                <div style={{ position: 'absolute', top: '0%', width: '100%', height: '1px', backgroundColor: '#f3f4f6' }}></div>
                <div style={{ position: 'absolute', top: '50%', width: '100%', height: '1px', backgroundColor: '#f3f4f6' }}></div>
                <div style={{ position: 'absolute', top: '100%', width: '100%', height: '1px', backgroundColor: '#f3f4f6' }}></div>
                
                {/* The SVG Chart */}
                <svg width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={Color.theme.primary} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={Color.theme.primary} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path 
                    d={ChartEngine.createAreaPath(balanceHistory, 600, 260)} 
                    fill="url(#chartGradient)" 
                  />
                  <path 
                    d={ChartEngine.createPath(balanceHistory, 600, 260)} 
                    fill="none" 
                    stroke={Color.theme.primary} 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <div style={{ marginTop: '24px' }}>
            <Card title="Recent Transactions">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {history.map((tx, i) => (
                  <div key={tx.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 0', 
                    borderBottom: i === history.length - 1 ? 'none' : `1px solid ${Color.theme.light}` 
                  }}>
                    <Flex gap={12} align="center">
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        backgroundColor: tx.type === 'donation' ? '#ecfdf5' : '#eff6ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: tx.type === 'donation' ? Color.theme.secondary : Color.theme.primary
                      }}>
                        {tx.type === 'donation' ? '+' : '→'}
                      </div>
                      <div>
                        <Text weight={600} size={14} style={{ display: 'block' }}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</Text>
                        <Text size={12} color={Color.theme.textMuted}>{Time.ago(tx.timestamp)} • {tx.hash}</Text>
                      </div>
                    </Flex>
                    <Text weight={600} color={tx.type === 'donation' ? Color.theme.secondary : Color.theme.dark}>
                      {tx.type === 'donation' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Ecosystem Stats">
            <Flex dir="column" gap={16}>
              <div>
                <Text size={12} color={Color.theme.textMuted}>Contributors</Text>
                <Text size={18} weight={600} style={{ display: 'block' }}>{data.code.contributors.toLocaleString()}</Text>
              </div>
              <div>
                <Text size={12} color={Color.theme.textMuted}>GitHub Stars</Text>
                <Text size={18} weight={600} style={{ display: 'block' }}>{data.code.stars.toLocaleString()}</Text>
              </div>
              <div>
                <Text size={12} color={Color.theme.textMuted}>Open Issues</Text>
                <Text size={18} weight={600} style={{ display: 'block' }}>{data.code.issuesOpen.toLocaleString()}</Text>
              </div>
            </Flex>
          </Card>

          <Card title="Infrastructure">
            <Flex dir="column" gap={12}>
              <Flex justify="space-between">
                <Text size={14}>Active Nodes</Text>
                <Text size={14} weight={600}>{data.api.activeConnections}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text size={14}>Error Rate</Text>
                <Text size={14} weight={600} color={data.api.errorRate > 0.01 ? Color.theme.danger : Color.theme.secondary}>
                  {(data.api.errorRate * 100).toFixed(2)}%
                </Text>
              </Flex>
              <div style={{ padding: '12px', backgroundColor: '#111827', borderRadius: '6px', color: '#10b981', fontFamily: 'monospace', fontSize: '12px' }}>
                &gt; sys_status: OK<br/>
                &gt; load_avg: 0.45<br/>
                &gt; mem_usage: 42%
              </div>
            </Flex>
          </Card>
        </div>
      </Grid>
    </div>
  );
};

// 3. The Global Dashboard (Default View)
const GlobalDashboard: React.FC = () => {
  const { registry } = useContext(UniverseContext);
  const providers = registry.getAll();
  
  // Calculate aggregates
  const totalCapital = providers.reduce((acc, p) => acc + (p as any).state.finance.balance, 0);
  const totalStars = providers.reduce((acc, p) => acc + (p as any).state.code.stars, 0);
  const totalContributors = providers.reduce((acc, p) => acc + (p as any).state.code.contributors, 0);

  return (
    <div style={{ padding: '40px', overflowY: 'auto', height: '100%', backgroundColor: '#f3f4f6' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Text size={36} weight={800} color={Color.theme.dark} style={{ display: 'block', marginBottom: '8px' }}>OPEN SOURCE UNIVERSE</Text>
        <Text size={16} color={Color.theme.textMuted}>Real-time simulation of {providers.length} decentralized entities</Text>
      </div>

      <Grid cols={3} gap={32}>
        <div style={{ backgroundColor: '#3b82f6', borderRadius: '16px', padding: '24px', color: 'white', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
          <Text size={14} color="rgba(255,255,255,0.8)">Total Ecosystem Value</Text>
          <Text size={42} weight={700} color="white" style={{ display: 'block', marginTop: '8px' }}>${(totalCapital / 1000000).toFixed(1)}M</Text>
        </div>
        <div style={{ backgroundColor: '#10b981', borderRadius: '16px', padding: '24px', color: 'white', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
          <Text size={14} color="rgba(255,255,255,0.8)">Total Stars</Text>
          <Text size={42} weight={700} color="white" style={{ display: 'block', marginTop: '8px' }}>{(totalStars / 1000000).toFixed(1)}M</Text>
        </div>
        <div style={{ backgroundColor: '#8b5cf6', borderRadius: '16px', padding: '24px', color: 'white', boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)' }}>
          <Text size={14} color="rgba(255,255,255,0.8)">Active Contributors</Text>
          <Text size={42} weight={700} color="white" style={{ display: 'block', marginTop: '8px' }}>{(totalContributors / 1000).toFixed(1)}k</Text>
        </div>
      </Grid>

      <div style={{ marginTop: '40px' }}>
        <Text size={20} weight={700} color={Color.theme.dark} style={{ marginBottom: '20px', display: 'block' }}>Top Performing Nodes</Text>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${Color.theme.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: `1px solid ${Color.theme.border}` }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: Color.theme.textMuted, textTransform: 'uppercase' }}>Entity</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: Color.theme.textMuted, textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: Color.theme.textMuted, textTransform: 'uppercase' }}>Balance</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: Color.theme.textMuted, textTransform: 'uppercase' }}>Uptime</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: Color.theme.textMuted, textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {providers.slice(0, 10).map((p: any) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${Color.theme.light}` }}>
                  <td style={{ padding: '16px' }}>
                    <Flex align="center" gap={12}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: Color.theme.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: Color.theme.text }}>
                        {p.name.charAt(0)}
                      </div>
                      <Text weight={600}>{p.name}</Text>
                    </Flex>
                  </td>
                  <td style={{ padding: '16px' }}><Badge color={Color.theme.primary}>{p.state.identity.type}</Badge></td>
                  <td style={{ padding: '16px', textAlign: 'right' }}><Text font-family="monospace">${p.state.finance.balance.toLocaleString()}</Text></td>
                  <td style={{ padding: '16px', textAlign: 'right' }}><Text>{p.state.api.uptime.toFixed(2)}%</Text></td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SECTION 8: MAIN SYSTEM COMPONENT
// ==========================================

const AccountDetails: React.FC = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const registry = useMemo(() => UniverseRegistry.getInstance(), []);
  
  const selectedEntity = useMemo(() => 
    selectedEntityId ? registry.get(selectedEntityId)?.['state'] || null : null, 
  [selectedEntityId, registry]);

  const selectedProvider = useMemo(() => 
    selectedEntityId ? registry.get(selectedEntityId) : null,
  [selectedEntityId, registry]);

  const contextValue = {
    registry,
    selectedEntity,
    selectEntity: setSelectedEntityId,
    globalStats: { totalCapital: 0, totalCode: 0, activeNodes: 0 } // Placeholder for now
  };

  return (
    <UniverseContext.Provider value={contextValue}>
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        backgroundColor: '#fff', 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <EntityExplorer />

        {/* Main View */}
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          {selectedProvider ? (
            <AccountDetailsView provider={selectedProvider} />
          ) : (
            <GlobalDashboard />
          )}
        </div>
      </div>
    </UniverseContext.Provider>
  );
};

export default AccountDetails;