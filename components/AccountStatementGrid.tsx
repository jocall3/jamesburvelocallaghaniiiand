import React, { useState, useEffect, useMemo, useCallback, useRef, useReducer, createContext, useContext } from 'react';
import { Box, Chip, Typography, Paper, Button, LinearProgress, ThemeProvider, createTheme, CssBaseline, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams, 
  GridValueGetterParams, 
  GridToolbar, 
  GridToolbarContainer, 
  GridToolbarFilterButton, 
  GridToolbarExport 
} from '@mui/x-data-grid';

// -----------------------------------------------------------------------------
// SECTION I: THE GENESIS TYPES
// -----------------------------------------------------------------------------

/**
 * The original DNA of the file, preserved and encapsulated.
 */
export interface StatementLine {
  BookgDt: string;
  ValDt: string;
  Amt: number;
  Ccy: string;
  CdtDbtInd: 'CRDT' | 'DBIT';
  NtryRef: string;
  AcctSvcrRef?: string;
  AddtlNtryInf?: string;
  BkTxCd?: {
    Domn?: {
      Cd: string;
      Fmly: {
        Cd: string;
        SubFmlyCd: string;
      };
    };
  };
}

// -----------------------------------------------------------------------------
// SECTION II: THE OPEN SOURCE UNIVERSE SIMULATION (100 APIs)
// -----------------------------------------------------------------------------

/**
 * A self-contained simulation of the global open-source ecosystem.
 * Each entity is represented as a functional service within the financial grid.
 */

type ServiceStatus = 'ACTIVE' | 'IDLE' | 'PROCESSING' | 'ERROR' | 'SYNCING';

interface SimulatedService {
  name: string;
  version: string;
  status: ServiceStatus;
  latency: number;
  execute: (payload: any) => Promise<any>;
  healthCheck: () => boolean;
}

class OpenSourceUniverse {
  private static instance: OpenSourceUniverse;
  private services: Map<string, SimulatedService> = new Map();
  private logs: string[] = [];

  private constructor() {
    this.initializeUniverse();
  }

  public static getInstance(): OpenSourceUniverse {
    if (!OpenSourceUniverse.instance) {
      OpenSourceUniverse.instance = new OpenSourceUniverse();
    }
    return OpenSourceUniverse.instance;
  }

  private createService(name: string, domain: string, logic: (data: any) => any): SimulatedService {
    return {
      name,
      version: `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 100)}`,
      status: 'ACTIVE',
      latency: Math.random() * 50,
      healthCheck: () => true,
      execute: async (payload: any) => {
        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
        const result = logic(payload);
        this.log(`[${name}] Executed ${domain} logic in ${(performance.now() - start).toFixed(2)}ms`);
        return result;
      }
    };
  }

  private log(message: string) {
    this.logs.push(`[${new Date().toISOString()}] ${message}`);
    if (this.logs.length > 1000) this.logs.shift();
  }

  private initializeUniverse() {
    // 1. Linux Foundation: The Kernel of the Grid
    this.services.set('LinuxFoundation', this.createService('Linux Foundation', 'Kernel', (data) => ({
      kernel_pid: Math.floor(Math.random() * 99999),
      scheduler: 'CFS',
      priority: 'RT'
    })));

    // 2. Canonical (Ubuntu): System Distribution
    this.services.set('Canonical', this.createService('Canonical', 'Distro', () => ({
      snap_packages: ['finance-core', 'grid-renderer'],
      lts_support: true
    })));

    // 3. Red Hat: Enterprise Stability
    this.services.set('RedHat', this.createService('Red Hat', 'Enterprise', () => ({
      selinux_context: 'unconfined_t',
      subscription: 'active'
    })));

    // 4. Fedora Project: Bleeding Edge Features
    this.services.set('Fedora', this.createService('Fedora Project', 'Upstream', () => ({
      dnf_update: 'pending',
      innovation_index: 0.99
    })));

    // 5. Debian Project: The Universal OS
    this.services.set('Debian', this.createService('Debian', 'Stability', () => ({
      apt_sources: 'stable',
      integrity: 'verified'
    })));

    // 6. OpenSUSE: The Chameleon
    this.services.set('OpenSUSE', this.createService('OpenSUSE', 'YaST', () => ({
      zypper_refresh: true,
      build_service: 'obs-simulated'
    })));

    // 7. Arch Linux: The Rolling Release
    this.services.set('Arch', this.createService('Arch Linux', 'Pacman', () => ({
      pacman_syu: 'up-to-date',
      aur_helper: 'yay'
    })));

    // 8. Manjaro: User Friendly Arch
    this.services.set('Manjaro', this.createService('Manjaro', 'Desktop', () => ({
      pamac_gui: 'loaded',
      kernel_manager: '5.15-LTS'
    })));

    // 9. FreeBSD: The Power to Serve
    this.services.set('FreeBSD', this.createService('FreeBSD', 'BSD', () => ({
      zfs_pool: 'tank',
      jail_id: 1
    })));

    // 10. NetBSD: Of Course It Runs
    this.services.set('NetBSD', this.createService('NetBSD', 'Portability', () => ({
      architecture: 'any',
      pkgsrc: 'bootstrapped'
    })));

    // 11. OpenBSD: Secure by Default
    this.services.set('OpenBSD', this.createService('OpenBSD', 'Security', () => ({
      pledge: 'stdio rpath',
      unveil: '/data'
    })));

    // 12. Kubernetes: Orchestration
    this.services.set('Kubernetes', this.createService('Kubernetes', 'Orchestration', (data) => ({
      pods: 5,
      deployments: ['ledger-backend', 'ui-frontend'],
      service_mesh: 'enabled'
    })));

    // 13. CNCF: Cloud Native Governance
    this.services.set('CNCF', this.createService('CNCF', 'Governance', () => ({
      graduated_projects: 15,
      landscape: 'vast'
    })));

    // 14. Docker: Containerization
    this.services.set('Docker', this.createService('Docker', 'Container', () => ({
      image: 'financial-grid:latest',
      container_id: 'a1b2c3d4'
    })));

    // 15. Podman: Daemonless Containers
    this.services.set('Podman', this.createService('Podman', 'Container', () => ({
      rootless: true,
      pods: []
    })));

    // 16. Ansible: Automation
    this.services.set('Ansible', this.createService('Ansible', 'Automation', () => ({
      playbook: 'deploy_grid.yml',
      inventory: 'localhost'
    })));

    // 17. Terraform: Infrastructure as Code
    this.services.set('Terraform', this.createService('Terraform', 'IaC', () => ({
      plan: 'applied',
      state: 'remote-s3'
    })));

    // 18. HashiCorp: The Vault
    this.services.set('HashiCorp', this.createService('HashiCorp', 'Secrets', () => ({
      vault_status: 'sealed',
      consul_peers: 3
    })));

    // 19. Apache Foundation: The Server
    this.services.set('Apache', this.createService('Apache', 'Web', () => ({
      httpd_status: 'running',
      modules: ['mod_rewrite', 'mod_proxy']
    })));

    // 20. NGINX: High Performance
    this.services.set('NGINX', this.createService('NGINX', 'ReverseProxy', () => ({
      worker_connections: 1024,
      load_balancing: 'round-robin'
    })));

    // 21. Mozilla: The Open Web
    this.services.set('Mozilla', this.createService('Mozilla', 'BrowserEngine', () => ({
      gecko_version: '99.0',
      privacy_mode: true
    })));

    // 22. Firefox Dev Tools: Inspection
    this.services.set('FirefoxDev', this.createService('Firefox Dev Tools', 'Debug', () => ({
      console_logs: 0,
      network_requests: 12
    })));

    // 23. Git: Version Control
    this.services.set('Git', this.createService('Git', 'VCS', () => ({
      branch: 'main',
      commit_hash: 'f3a12b'
    })));

    // 24. GitHub API: Social Coding
    this.services.set('GitHub', this.createService('GitHub', 'RepoHost', () => ({
      stars: 4500,
      pull_requests: 12
    })));

    // 25. GitLab: DevOps Platform
    this.services.set('GitLab', this.createService('GitLab', 'CI/CD', () => ({
      pipeline_status: 'passed',
      runners: 4
    })));

    // 26. Bitbucket: Enterprise Git
    this.services.set('Bitbucket', this.createService('Bitbucket', 'RepoHost', () => ({
      jira_integration: 'connected',
      pipelines: 'active'
    })));

    // 27. VS Code: The Editor
    this.services.set('VSCode', this.createService('VS Code', 'IDE', () => ({
      extensions: 45,
      theme: 'Dark High Contrast'
    })));

    // 28. Eclipse Foundation: The Platform
    this.services.set('Eclipse', this.createService('Eclipse', 'IDE', () => ({
      workspace: 'default',
      jdt: 'loaded'
    })));

    // 29. JetBrains: Intelligent Tools
    this.services.set('JetBrains', this.createService('JetBrains', 'IntelliJ', () => ({
      indexing: 'completed',
      refactoring: 'available'
    })));

    // 30. Python Software Foundation
    this.services.set('Python', this.createService('Python', 'Language', () => ({
      version: '3.11',
      pip_packages: 120
    })));

    // 31. Node.js Foundation
    this.services.set('NodeJS', this.createService('Node.js', 'Runtime', () => ({
      event_loop: 'active',
      v8_version: '9.4'
    })));

    // 32. Deno: Secure Runtime
    this.services.set('Deno', this.createService('Deno', 'Runtime', () => ({
      permissions: 'read-only',
      typescript: 'native'
    })));

    // 33. Bun: Fast Runtime
    this.services.set('Bun', this.createService('Bun', 'Runtime', () => ({
      startup_time: '0.1ms',
      bundler: 'integrated'
    })));

    // 34. Rust Foundation
    this.services.set('Rust', this.createService('Rust', 'Language', () => ({
      borrow_checker: 'satisfied',
      cargo_build: 'release'
    })));

    // 35. GoLang Foundation
    this.services.set('Go', this.createService('Go', 'Language', () => ({
      goroutines: 500,
      gc_latency: 'low'
    })));

    // 36. Ruby: Developer Happiness
    this.services.set('Ruby', this.createService('Ruby', 'Language', () => ({
      gems: 45,
      rails: 'mounted'
    })));

    // 37. PHP: The Web Veteran
    this.services.set('PHP', this.createService('PHP', 'Language', () => ({
      opcache: 'enabled',
      composer: 'optimized'
    })));

    // 38. MariaDB: Open SQL
    this.services.set('MariaDB', this.createService('MariaDB', 'Database', () => ({
      engine: 'InnoDB',
      replication: 'master-slave'
    })));

    // 39. MySQL Open Edition
    this.services.set('MySQL', this.createService('MySQL', 'Database', () => ({
      connections: 50,
      query_cache: 'on'
    })));

    // 40. PostgreSQL: The Advanced DB
    this.services.set('PostgreSQL', this.createService('PostgreSQL', 'Database', () => ({
      extensions: ['postgis', 'pgcrypto'],
      vacuum: 'auto'
    })));

    // 41. SQLite: The Embedded DB
    this.services.set('SQLite', this.createService('SQLite', 'Database', () => ({
      file_size: '14MB',
      journal_mode: 'WAL'
    })));

    // 42. Redis: In-Memory Store
    this.services.set('Redis', this.createService('Redis', 'Cache', () => ({
      keys: 15000,
      eviction_policy: 'allkeys-lru'
    })));

    // 43. MongoDB Community
    this.services.set('MongoDB', this.createService('MongoDB', 'NoSQL', () => ({
      collections: 12,
      sharding: 'enabled'
    })));

    // 44. Cassandra: Wide Column
    this.services.set('Cassandra', this.createService('Cassandra', 'NoSQL', () => ({
      gossip: 'active',
      consistency_level: 'QUORUM'
    })));

    // 45. ElasticSearch: Search Engine
    this.services.set('ElasticSearch', this.createService('ElasticSearch', 'Search', () => ({
      indices: 5,
      shards: 10
    })));

    // 46. Apache Spark: Big Data
    this.services.set('Spark', this.createService('Spark', 'Analytics', () => ({
      rdd_count: 45,
      executors: 4
    })));

    // 47. Apache Kafka: Streaming
    this.services.set('Kafka', this.createService('Kafka', 'Streaming', () => ({
      topics: ['transactions', 'logs'],
      brokers: 3
    })));

    // 48. Supabase: Open Backend
    this.services.set('Supabase', this.createService('Supabase', 'BaaS', () => ({
      realtime: 'connected',
      auth: 'jwt'
    })));

    // 49. Appwrite: Secure Backend
    this.services.set('Appwrite', this.createService('Appwrite', 'BaaS', () => ({
      functions: 3,
      storage: 'local'
    })));

    // 50. PocketBase: Portable Backend
    this.services.set('PocketBase', this.createService('PocketBase', 'BaaS', () => ({
      db_file: 'pb_data.db',
      admin_ui: 'served'
    })));

    // 51. Hugging Face: AI Hub
    this.services.set('HuggingFace', this.createService('Hugging Face', 'AI', () => ({
      model: 'bert-base-uncased',
      inference: 'cpu'
    })));

    // 52. LangChain: LLM Framework
    this.services.set('LangChain', this.createService('LangChain', 'AI', () => ({
      chains: 2,
      memory: 'buffer'
    })));

    // 53. MLFlow: Lifecycle
    this.services.set('MLFlow', this.createService('MLFlow', 'MLOps', () => ({
      experiment_id: 1,
      tracking_uri: 'file://'
    })));

    // 54. TensorFlow: Deep Learning
    this.services.set('TensorFlow', this.createService('TensorFlow', 'AI', () => ({
      tensors: 'allocated',
      backend: 'webgl'
    })));

    // 55. PyTorch: Dynamic AI
    this.services.set('PyTorch', this.createService('PyTorch', 'AI', () => ({
      autograd: 'enabled',
      device: 'cpu'
    })));

    // 56. ONNX: Interchange
    this.services.set('ONNX', this.createService('ONNX', 'AI', () => ({
      opset: 14,
      runtime: 'ort'
    })));

    // 57. OpenCV: Computer Vision
    this.services.set('OpenCV', this.createService('OpenCV', 'Vision', () => ({
      mat: 'empty',
      filters: ['gaussian', 'canny']
    })));

    // 58. OpenAI Gym (Sim): RL
    this.services.set('OpenAIGym', this.createService('OpenAI Gym', 'RL', () => ({
      environment: 'CartPole-v1',
      reward: 0
    })));

    // 59. Godot Engine: Game Dev
    this.services.set('Godot', this.createService('Godot', 'Engine', () => ({
      nodes: 150,
      scene_tree: 'ready'
    })));

    // 60. Blender Foundation: 3D
    this.services.set('Blender', this.createService('Blender', '3D', () => ({
      cycles_render: 'rendering',
      vertices: 4500
    })));

    // 61. Inkscape: Vector
    this.services.set('Inkscape', this.createService('Inkscape', 'Design', () => ({
      svg_nodes: 45,
      layers: 3
    })));

    // 62. GIMP: Raster
    this.services.set('GIMP', this.createService('GIMP', 'Design', () => ({
      filters: 'loaded',
      brushes: 24
    })));

    // 63. Krita: Painting
    this.services.set('Krita', this.createService('Krita', 'Art', () => ({
      canvas_size: '4k',
      color_space: 'CMYK'
    })));

    // 64. Figma Open API Sim
    this.services.set('Figma', this.createService('Figma', 'Design', () => ({
      components: 12,
      collaborators: 1
    })));

    // 65. Unreal Open Tools
    this.services.set('Unreal', this.createService('Unreal', 'Engine', () => ({
      blueprints: 'compiled',
      lumen: 'active'
    })));

    // 66. Unity Open Tools
    this.services.set('Unity', this.createService('Unity', 'Engine', () => ({
      prefabs: 45,
      csharp_scripts: 12
    })));

    // 67. OpenStreetMap: Mapping
    this.services.set('OSM', this.createService('OpenStreetMap', 'Geo', () => ({
      tiles: 'loaded',
      attribution: '© OpenStreetMap contributors'
    })));

    // 68. QGIS: GIS
    this.services.set('QGIS', this.createService('QGIS', 'Geo', () => ({
      projection: 'EPSG:4326',
      layers: ['vector', 'raster']
    })));

    // 69. MapLibre: Vector Maps
    this.services.set('MapLibre', this.createService('MapLibre', 'Geo', () => ({
      style: 'bright',
      gl_context: 'active'
    })));

    // 70. Leaflet.js: Web Maps
    this.services.set('Leaflet', this.createService('Leaflet', 'Geo', () => ({
      zoom_level: 12,
      markers: 5
    })));

    // 71. VLC: Media Player
    this.services.set('VLC', this.createService('VLC', 'Media', () => ({
      codec: 'h264',
      volume: 100
    })));

    // 72. FFmpeg: Transcoding
    this.services.set('FFmpeg', this.createService('FFmpeg', 'Media', () => ({
      conversion: 'mp4 -> webm',
      progress: '45%'
    })));

    // 73. OBS Studio: Streaming
    this.services.set('OBS', this.createService('OBS', 'Media', () => ({
      scene: 'Scene 1',
      bitrate: 6000
    })));

    // 74. WireGuard: VPN
    this.services.set('WireGuard', this.createService('WireGuard', 'Network', () => ({
      handshake: 'completed',
      interface: 'wg0'
    })));

    // 75. OpenVPN: VPN
    this.services.set('OpenVPN', this.createService('OpenVPN', 'Network', () => ({
      tunnel: 'tun0',
      encryption: 'AES-256-GCM'
    })));

    // 76. Tor Project: Privacy
    this.services.set('Tor', this.createService('Tor', 'Privacy', () => ({
      circuit: 'established',
      nodes: 3
    })));

    // 77. DuckDB: Analytical DB
    this.services.set('DuckDB', this.createService('DuckDB', 'Analytics', () => ({
      parquet_scan: 'fast',
      memory_usage: 'low'
    })));

    // 78. ClickHouse: Columnar DB
    this.services.set('ClickHouse', this.createService('ClickHouse', 'Analytics', () => ({
      rows_processed: 1000000,
      compression: 'LZ4'
    })));

    // 79. MinIO: Object Storage
    this.services.set('MinIO', this.createService('MinIO', 'Storage', () => ({
      buckets: 5,
      s3_compatible: true
    })));

    // 80. Ceph: Distributed Storage
    this.services.set('Ceph', this.createService('Ceph', 'Storage', () => ({
      health: 'HEALTH_OK',
      osds: 12
    })));

    // 81. OpenStack: Cloud OS
    this.services.set('OpenStack', this.createService('OpenStack', 'Cloud', () => ({
      nova_instances: 10,
      neutron_networks: 2
    })));

    // 82. Proxmox: Virtualization
    this.services.set('Proxmox', this.createService('Proxmox', 'Virtualization', () => ({
      lxc_containers: 5,
      qemu_vms: 3
    })));

    // 83. Home Assistant: Automation
    this.services.set('HomeAssistant', this.createService('Home Assistant', 'IoT', () => ({
      entities: 45,
      automations: 12
    })));

    // 84. OpenHAB: Automation
    this.services.set('OpenHAB', this.createService('OpenHAB', 'IoT', () => ({
      bindings: ['zwave', 'zigbee'],
      sitemap: 'default'
    })));

    // 85. Matter Protocol
    this.services.set('Matter', this.createService('Matter', 'IoT', () => ({
      fabric_id: '0x1234',
      devices: 5
    })));

    // 86. Zigbee Simulator
    this.services.set('Zigbee', this.createService('Zigbee', 'IoT', () => ({
      coordinator: 'online',
      mesh_quality: 'high'
    })));

    // 87. TensorRT: Inference
    this.services.set('TensorRT', this.createService('TensorRT', 'AI', () => ({
      optimization: 'fp16',
      engine: 'built'
    })));

    // 88. LLVM: Compiler Infra
    this.services.set('LLVM', this.createService('LLVM', 'Compiler', () => ({
      ir_code: 'generated',
      optimization_level: 'O3'
    })));

    // 89. WebKit: Engine
    this.services.set('WebKit', this.createService('WebKit', 'Browser', () => ({
      jsc: 'optimizing',
      layout: 'flexbox'
    })));

    // 90. Chromium: Engine
    this.services.set('Chromium', this.createService('Chromium', 'Browser', () => ({
      blink: 'rendering',
      v8: 'isolates'
    })));

    // 91. uBlock Origin Engine
    this.services.set('uBlock', this.createService('uBlock Origin', 'Privacy', () => ({
      blocked_requests: 15,
      cosmetic_filters: 45
    })));

    // 92. Brave Shields
    this.services.set('Brave', this.createService('Brave Shields', 'Privacy', () => ({
      fingerprinting_blocked: true,
      trackers: 0
    })));

    // 93. Nextcloud: Collaboration
    this.services.set('Nextcloud', this.createService('Nextcloud', 'Cloud', () => ({
      files: 'synced',
      talk: 'active'
    })));

    // 94. OwnCloud: Collaboration
    this.services.set('OwnCloud', this.createService('OwnCloud', 'Cloud', () => ({
      federation: 'enabled',
      storage: 'local'
    })));

    // 95. Mastodon: Social
    this.services.set('Mastodon', this.createService('Mastodon', 'Social', () => ({
      instance: 'social.finance',
      toots: 150
    })));

    // 96. Matrix: Chat
    this.services.set('Matrix', this.createService('Matrix', 'Chat', () => ({
      synapse: 'running',
      encryption: 'e2ee'
    })));

    // 97. Signal Protocol
    this.services.set('Signal', this.createService('Signal', 'Security', () => ({
      double_ratchet: 'active',
      safety_number: 'verified'
    })));

    // 98. Apache Airflow: Workflows
    this.services.set('Airflow', this.createService('Airflow', 'DataOps', () => ({
      dags: 5,
      scheduler: 'running'
    })));

    // 99. Jenkins: CI
    this.services.set('Jenkins', this.createService('Jenkins', 'CI', () => ({
      blue_ocean: 'viewing',
      build_queue: 0
    })));

    // 100. DroneCI: Container CI
    this.services.set('DroneCI', this.createService('DroneCI', 'CI', () => ({
      pipeline: 'docker',
      steps: 4
    })));
  }

  public getService(name: string): SimulatedService | undefined {
    return this.services.get(name);
  }

  public getAllServices(): SimulatedService[] {
    return Array.from(this.services.values());
  }

  public async executeTransaction(serviceName: string, payload: any): Promise<any> {
    const service = this.services.get(serviceName);
    if (service) {
      return service.execute(payload);
    }
    throw new Error(`Service ${serviceName} not found in Open Source Universe.`);
  }
}

// -----------------------------------------------------------------------------
// SECTION III: THE FINANCIAL LOGIC CORE
// -----------------------------------------------------------------------------

/**
 * A sophisticated financial engine that processes statement lines using the
 * simulated open-source universe.
 */

interface EnrichedStatementLine extends StatementLine {
  id: string;
  riskScore: number;
  category: string;
  processedBy: string[];
  geoTag?: { lat: number; lng: number };
  aiPrediction?: string;
}

class FinancialCore {
  private universe = OpenSourceUniverse.getInstance();

  public async enrichStatement(lines: StatementLine[]): Promise<EnrichedStatementLine[]> {
    // Simulate a massive parallel processing pipeline using our "Universe"
    const enriched = await Promise.all(lines.map(async (line, index) => {
      // 1. Use "TensorFlow" to predict category
      const tfResult = await this.universe.executeTransaction('TensorFlow', { input: line.NtryRef });
      
      // 2. Use "PostgreSQL" to simulate a lookup
      await this.universe.executeTransaction('PostgreSQL', { query: 'SELECT * FROM merchants WHERE ref = ?', params: [line.NtryRef] });

      // 3. Use "OpenStreetMap" to generate fake geo data
      const geoResult = await this.universe.executeTransaction('OSM', { query: line.NtryRef });

      // 4. Use "Signal" to encrypt sensitive data (simulation)
      await this.universe.executeTransaction('Signal', { data: line.Amt });

      return {
        ...line,
        id: `TXN-${Date.now()}-${index}`,
        riskScore: Math.random(),
        category: this.categorize(line.NtryRef),
        processedBy: ['TensorFlow', 'PostgreSQL', 'OSM', 'Signal'],
        geoTag: { lat: 34.05 + Math.random(), lng: -118.25 + Math.random() },
        aiPrediction: Math.random() > 0.5 ? 'Recurring' : 'One-time'
      };
    }));

    return enriched;
  }

  private categorize(ref: string): string {
    if (ref.includes('UBER') || ref.includes('LYFT')) return 'Transport';
    if (ref.includes('AMZN') || ref.includes('SHOP')) return 'Shopping';
    if (ref.includes('REST') || ref.includes('FOOD')) return 'Dining';
    return 'General';
  }
}

// -----------------------------------------------------------------------------
// SECTION IV: UI & INTERACTION LAYER (THEME ENGINE)
// -----------------------------------------------------------------------------

const universeTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00ff9d' }, // Cyberpunk Green
    secondary: { main: '#bd00ff' }, // Cyberpunk Purple
    background: {
      default: '#0a0a12',
      paper: '#13131f',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#a0a0a0',
    },
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    h4: { fontWeight: 700, letterSpacing: '-0.05em' },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid #333',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #222',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#1a1a2e',
            borderBottom: '2px solid #00ff9d',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4, fontWeight: 'bold' },
      },
    },
  },
});

// -----------------------------------------------------------------------------
// SECTION V: SUB-COMPONENTS & WIDGETS
// -----------------------------------------------------------------------------

const ServiceStatusBadge: React.FC<{ service: SimulatedService }> = ({ service }) => {
  const color = service.status === 'ACTIVE' ? 'success' : service.status === 'ERROR' ? 'error' : 'warning';
  return (
    <Tooltip title={`Latency: ${service.latency.toFixed(2)}ms | Version: ${service.version}`}>
      <Chip 
        label={service.name} 
        size="small" 
        color={color} 
        variant="outlined" 
        sx={{ m: 0.5, fontSize: '0.7rem', height: 20 }} 
      />
    </Tooltip>
  );
};

const UniverseDashboard: React.FC = () => {
  const universe = useMemo(() => OpenSourceUniverse.getInstance(), []);
  const services = universe.getAllServices();
  
  // Randomly select a few services to display to avoid clutter
  const displayServices = useMemo(() => services.sort(() => 0.5 - Math.random()).slice(0, 15), [services]);

  return (
    <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(45deg, #13131f 30%, #1a1a2e 90%)' }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        OPEN SOURCE UNIVERSE STATUS
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {displayServices.map(s => <ServiceStatusBadge key={s.name} service={s} />)}
        <Chip label={`+${services.length - 15} MORE`} size="small" variant="outlined" sx={{ m: 0.5, height: 20 }} />
      </Box>
    </Paper>
  );
};

const TransactionDetailPanel: React.FC<{ row: EnrichedStatementLine }> = ({ row }) => {
  return (
    <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="caption" color="secondary">AI ANALYSIS (TENSORFLOW)</Typography>
        <Typography variant="body2">Prediction: {row.aiPrediction}</Typography>
        <Typography variant="body2">Risk Score: {(row.riskScore * 100).toFixed(1)}%</Typography>
        <LinearProgress variant="determinate" value={row.riskScore * 100} color={row.riskScore > 0.5 ? 'error' : 'success'} sx={{ mt: 1 }} />
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="caption" color="secondary">GEOLOCATION (OPENSTREETMAP)</Typography>
        <Typography variant="body2">Lat: {row.geoTag?.lat.toFixed(4)}</Typography>
        <Typography variant="body2">Lng: {row.geoTag?.lng.toFixed(4)}</Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Processed via PostGIS simulation</Typography>
      </Paper>
    </Box>
  );
};

// -----------------------------------------------------------------------------
// SECTION VI: THE MAIN COMPONENT (EVOLVED)
// -----------------------------------------------------------------------------

interface AccountStatementGridProps {
  statementLines: StatementLine[];
}

const AccountStatementGrid: React.FC<AccountStatementGridProps> = ({ statementLines }) => {
  const [enrichedData, setEnrichedData] = useState<EnrichedStatementLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionModel, setSelectionModel] = useState<any[]>([]);
  
  const financialCore = useMemo(() => new FinancialCore(), []);

  useEffect(() => {
    const initializeUniverse = async () => {
      setLoading(true);
      // Simulate the "boot sequence" of the universe
      await new Promise(r => setTimeout(r, 1500)); 
      const data = await financialCore.enrichStatement(statementLines);
      setEnrichedData(data);
      setLoading(false);
    };
    initializeUniverse();
  }, [statementLines, financialCore]);

  const columns: GridColDef<EnrichedStatementLine>[] = useMemo(() => [
    { 
      field: 'id', 
      headerName: 'TX ID', 
      width: 180,
      renderCell: (params) => <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{params.value}</Typography>
    },
    { 
      field: 'BookgDt', 
      headerName: 'Date', 
      width: 120, 
      valueGetter: (params: GridValueGetterParams) => new Date(params.row.BookgDt).toLocaleDateString(),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 'Shopping' ? 'secondary' : 'default'} 
          variant="filled"
        />
      )
    },
    {
      field: 'Amt',
      headerName: 'Amount',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: params.row.CdtDbtInd === 'CRDT' ? '#00ff9d' : '#ff4d4d', 
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          >
            {params.row.CdtDbtInd === 'CRDT' ? '+' : '-'} {params.value.toFixed(2)} {params.row.Ccy}
          </Typography>
        </Box>
      )
    },
    { field: 'NtryRef', headerName: 'Reference', width: 250 },
    {
      field: 'riskScore',
      headerName: 'Risk Analysis',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={params.value * 100} 
            color={params.value > 0.7 ? 'error' : params.value > 0.3 ? 'warning' : 'success'}
          />
        </Box>
      )
    },
    {
      field: 'processedBy',
      headerName: 'Tech Stack',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, overflow: 'hidden' }}>
          {params.value.map((tech: string) => (
            <Avatar key={tech} sx={{ width: 20, height: 20, fontSize: 10, bgcolor: '#333' }}>{tech[0]}</Avatar>
          ))}
        </Box>
      )
    }
  ], []);

  return (
    <ThemeProvider theme={universeTheme}>
      <CssBaseline />
      <Box sx={{ height: '100%', width: '100%', p: 3, bgcolor: 'background.default', minHeight: '800px' }}>
        
        {/* Header Section */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" color="primary">
              UNIVERSE GRID <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>v10.0.0-alpha</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Powered by 100 Simulated Open Source APIs
            </Typography>
          </Box>
          <Button variant="outlined" color="secondary" onClick={() => console.log('Syncing with Linux Foundation...')}>
            SYNC KERNEL
          </Button>
        </Box>

        {/* Universe Status Dashboard */}
        <UniverseDashboard />

        {/* Main Data Grid */}
        <Paper elevation={3} sx={{ height: 650, width: '100%', overflow: 'hidden' }}>
          <DataGrid
            rows={enrichedData}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            checkboxSelection
            disableSelectionOnClick
            loading={loading}
            components={{
              Toolbar: GridToolbar,
            }}
            onSelectionModelChange={(newSelection) => setSelectionModel(newSelection)}
            sx={{
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(0, 255, 157, 0.05)',
              },
            }}
          />
        </Paper>

        {/* Footer / Analytics Summary */}
        <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">{enrichedData.length}</Typography>
            <Typography variant="caption">Transactions Processed</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="secondary">
              {enrichedData.reduce((acc, curr) => acc + (curr.CdtDbtInd === 'DBIT' ? curr.Amt : 0), 0).toFixed(2)}
            </Typography>
            <Typography variant="caption">Total Debits</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#00ff9d' }}>
              {enrichedData.reduce((acc, curr) => acc + (curr.CdtDbtInd === 'CRDT' ? curr.Amt : 0).toFixed(2), 0)}
            </Typography>
            <Typography variant="caption">Total Credits</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error">
              {enrichedData.filter(x => x.riskScore > 0.8).length}
            </Typography>
            <Typography variant="caption">High Risk Alerts</Typography>
          </Paper>
        </Box>

      </Box>
    </ThemeProvider>
  );
};

export default AccountStatementGrid;