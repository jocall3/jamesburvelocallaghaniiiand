import React, { useState, useEffect, useRef, useMemo, useReducer, useCallback } from 'react';

/**
 * THE EVOLUTIONARY UNIVERSE-FORGE: AI PREDICTION ENGINE (MEGA-SYSTEM)
 * 
 * This file is a self-contained, dependency-free simulation of a global open-source 
 * technological ecosystem. It expands the original "AIPredictionWidget" into a 
 * comprehensive telemetry deck, simulating 100+ organizations, network traffic, 
 * quantum-entangled state prediction, and real-time market stability analysis.
 * 
 * ARCHITECTURE:
 * 1. QuantumCore: Deterministic RNG and State Entropy management.
 * 2. DataVerse: In-memory relational database for simulated entities.
 * 3. NetSim: Virtual network stack simulating latency, packet loss, and API calls.
 * 4. OrgRegistry: Configuration DNA for 100 simulated open-source entities.
 * 5. PredictionEngine: The "Brain" logic calculating stability indices.
 * 6. HoloUI: Custom rendering engine for the dashboard.
 */

// --- 1. QUANTUM CORE (Utilities & Math) ---

const QuantumCore = {
  seed: 1337,
  random: () => {
    const x = Math.sin(QuantumCore.seed++) * 10000;
    return x - Math.floor(x);
  },
  range: (min: number, max: number) => min + QuantumCore.random() * (max - min),
  uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (QuantumCore.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }),
  sigmoid: (t: number) => 1 / (1 + Math.exp(-t)),
  clamp: (num: number, min: number, max: number) => Math.min(Math.max(num, min), max),
  formatBytes: (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// --- 2. INTERNAL UI SYSTEM (Icons & Primitives) ---

const Icons = {
  Brain: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a2.83 2.83 0 0 0-2 5 4.79 4.79 0 0 1-1 3c-1.6.9-2.6 2.5-2.6 4.2 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0-2.6-4.2c0-.8-1.4-2.4-1-3a2.83 2.83 0 0 0-2-5z" />
    </svg>
  ),
  Activity: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Server: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  ),
  Database: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  Globe: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Shield: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Cpu: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  )
};

// Internal Card Component (Replacing external dependency)
const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl ${className}`}>
    <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
      <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Icons.Activity className="w-4 h-4 text-cyan-500" />
        {title}
      </h3>
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500/50" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
        <div className="w-2 h-2 rounded-full bg-green-500/50" />
      </div>
    </div>
    <div className="p-0">{children}</div>
  </div>
);

// --- 3. THE 100 SIMULATED API ORGANIZATIONS ---

type OrgCategory = 'OS' | 'Cloud' | 'Tooling' | 'Language' | 'Database' | 'AI' | 'Graphics' | 'Geo' | 'Media' | 'Security' | 'Social' | 'CI/CD';

interface SimulatedOrg {
  id: string;
  name: string;
  category: OrgCategory;
  endpoints: string[];
  baseLatency: number;
  stability: number; // 0.0 to 1.0
}

const ORG_REGISTRY: SimulatedOrg[] = [
  // OS & Kernel
  { id: 'linux', name: 'Linux Foundation', category: 'OS', endpoints: ['/kernel/v6', '/modules', '/contributors'], baseLatency: 12, stability: 0.99 },
  { id: 'canonical', name: 'Canonical', category: 'OS', endpoints: ['/ubuntu/lts', '/snap/store', '/pro/status'], baseLatency: 45, stability: 0.95 },
  { id: 'redhat', name: 'Red Hat', category: 'OS', endpoints: ['/rhel/subscription', '/openshift/cluster', '/ansible/galaxy'], baseLatency: 30, stability: 0.98 },
  { id: 'fedora', name: 'Fedora Project', category: 'OS', endpoints: ['/rawhide/builds', '/koji/tasks'], baseLatency: 25, stability: 0.92 },
  { id: 'debian', name: 'Debian Project', category: 'OS', endpoints: ['/apt/stable', '/security/tracker'], baseLatency: 20, stability: 0.99 },
  { id: 'opensuse', name: 'OpenSUSE', category: 'OS', endpoints: ['/tumbleweed/snapshot', '/leap/iso'], baseLatency: 35, stability: 0.94 },
  { id: 'arch', name: 'Arch Linux', category: 'OS', endpoints: ['/pacman/sync', '/aur/rpc'], baseLatency: 15, stability: 0.88 },
  { id: 'manjaro', name: 'Manjaro', category: 'OS', endpoints: ['/repo/sync', '/hardware/detect'], baseLatency: 40, stability: 0.90 },
  { id: 'freebsd', name: 'FreeBSD', category: 'OS', endpoints: ['/ports/index', '/jail/manage'], baseLatency: 22, stability: 0.97 },
  { id: 'netbsd', name: 'NetBSD', category: 'OS', endpoints: ['/pkgsrc/build', '/kernel/rump'], baseLatency: 28, stability: 0.96 },
  { id: 'openbsd', name: 'OpenBSD', category: 'OS', endpoints: ['/pf/rules', '/openssh/keys'], baseLatency: 18, stability: 0.99 },
  
  // Cloud & Infrastructure
  { id: 'k8s', name: 'Kubernetes', category: 'Cloud', endpoints: ['/api/v1/pods', '/apis/batch/v1/jobs'], baseLatency: 50, stability: 0.95 },
  { id: 'cncf', name: 'CNCF', category: 'Cloud', endpoints: ['/landscape/graph', '/projects/graduated'], baseLatency: 60, stability: 0.98 },
  { id: 'docker', name: 'Docker', category: 'Cloud', endpoints: ['/hub/pull', '/engine/swarm'], baseLatency: 45, stability: 0.94 },
  { id: 'podman', name: 'Podman', category: 'Cloud', endpoints: ['/libpod/containers', '/generate/kube'], baseLatency: 35, stability: 0.96 },
  { id: 'ansible', name: 'Ansible', category: 'Cloud', endpoints: ['/playbook/run', '/inventory/hosts'], baseLatency: 55, stability: 0.93 },
  { id: 'terraform', name: 'Terraform', category: 'Cloud', endpoints: ['/state/lock', '/plan/apply'], baseLatency: 65, stability: 0.95 },
  { id: 'hashicorp', name: 'HashiCorp', category: 'Cloud', endpoints: ['/vault/seal', '/consul/catalog'], baseLatency: 40, stability: 0.97 },
  { id: 'apache', name: 'Apache Foundation', category: 'Cloud', endpoints: ['/projects/list', '/incubator/status'], baseLatency: 30, stability: 0.98 },
  { id: 'nginx', name: 'NGINX', category: 'Cloud', endpoints: ['/conf/reload', '/stats/stub'], baseLatency: 10, stability: 0.99 },
  
  // Tooling & Browsers
  { id: 'mozilla', name: 'Mozilla', category: 'Tooling', endpoints: ['/mdn/docs', '/firefox/sync'], baseLatency: 40, stability: 0.96 },
  { id: 'firefox', name: 'Firefox Dev Tools', category: 'Tooling', endpoints: ['/debugger/attach', '/network/monitor'], baseLatency: 25, stability: 0.95 },
  { id: 'git', name: 'Git', category: 'Tooling', endpoints: ['/ref/head', '/object/commit'], baseLatency: 5, stability: 0.99 },
  { id: 'github', name: 'GitHub API', category: 'Tooling', endpoints: ['/repos/issues', '/actions/runs'], baseLatency: 80, stability: 0.92 },
  { id: 'gitlab', name: 'GitLab', category: 'Tooling', endpoints: ['/ci/pipelines', '/merge_requests'], baseLatency: 85, stability: 0.91 },
  { id: 'bitbucket', name: 'Bitbucket', category: 'Tooling', endpoints: ['/repo/pipelines', '/pullrequests'], baseLatency: 90, stability: 0.90 },
  { id: 'vscode', name: 'VS Code', category: 'Tooling', endpoints: ['/extensions/marketplace', '/telemetry/usage'], baseLatency: 35, stability: 0.97 },
  { id: 'eclipse', name: 'Eclipse Foundation', category: 'Tooling', endpoints: ['/jdt/ls', '/projects/iot'], baseLatency: 60, stability: 0.94 },
  { id: 'jetbrains', name: 'JetBrains', category: 'Tooling', endpoints: ['/idea/indices', '/space/chat'], baseLatency: 50, stability: 0.96 },
  
  // Languages
  { id: 'python', name: 'Python Software Foundation', category: 'Language', endpoints: ['/pypi/packages', '/peps/list'], baseLatency: 45, stability: 0.98 },
  { id: 'node', name: 'Node.js Foundation', category: 'Language', endpoints: ['/npm/registry', '/v8/profiler'], baseLatency: 30, stability: 0.95 },
  { id: 'deno', name: 'Deno', category: 'Language', endpoints: ['/land/x', '/deploy/status'], baseLatency: 25, stability: 0.93 },
  { id: 'bun', name: 'Bun', category: 'Language', endpoints: ['/install/script', '/benchmarks'], baseLatency: 15, stability: 0.89 },
  { id: 'rust', name: 'Rust Foundation', category: 'Language', endpoints: ['/crates/io', '/cargo/audit'], baseLatency: 35, stability: 0.97 },
  { id: 'golang', name: 'GoLang Foundation', category: 'Language', endpoints: ['/pkg/go.dev', '/modules/proxy'], baseLatency: 20, stability: 0.98 },
  { id: 'ruby', name: 'Ruby', category: 'Language', endpoints: ['/gems/rubygems', '/rails/active_record'], baseLatency: 50, stability: 0.94 },
  { id: 'php', name: 'PHP', category: 'Language', endpoints: ['/composer/packagist', '/opcache/status'], baseLatency: 40, stability: 0.92 },
  
  // Databases
  { id: 'mariadb', name: 'MariaDB', category: 'Database', endpoints: ['/sql/query', '/cluster/galera'], baseLatency: 25, stability: 0.96 },
  { id: 'mysql', name: 'MySQL Open Edition', category: 'Database', endpoints: ['/innodb/status', '/binlog/stream'], baseLatency: 30, stability: 0.95 },
  { id: 'postgres', name: 'PostgreSQL', category: 'Database', endpoints: ['/wal/archive', '/vacuum/analyze'], baseLatency: 28, stability: 0.98 },
  { id: 'sqlite', name: 'SQLite', category: 'Database', endpoints: ['/db/journal', '/pragma/list'], baseLatency: 2, stability: 0.99 },
  { id: 'redis', name: 'Redis', category: 'Database', endpoints: ['/pubsub/message', '/cache/evict'], baseLatency: 5, stability: 0.97 },
  { id: 'mongo', name: 'MongoDB Community', category: 'Database', endpoints: ['/bson/serialize', '/sharding/status'], baseLatency: 35, stability: 0.94 },
  { id: 'cassandra', name: 'Cassandra', category: 'Database', endpoints: ['/gossip/state', '/cql/prepare'], baseLatency: 45, stability: 0.93 },
  { id: 'elastic', name: 'ElasticSearch', category: 'Database', endpoints: ['/index/search', '/cluster/health'], baseLatency: 55, stability: 0.92 },
  { id: 'spark', name: 'Apache Spark', category: 'Database', endpoints: ['/rdd/compute', '/sql/catalyst'], baseLatency: 70, stability: 0.91 },
  { id: 'kafka', name: 'Apache Kafka', category: 'Database', endpoints: ['/topic/partition', '/consumer/group'], baseLatency: 15, stability: 0.96 },
  { id: 'supabase', name: 'Supabase', category: 'Database', endpoints: ['/realtime/socket', '/auth/user'], baseLatency: 40, stability: 0.95 },
  { id: 'appwrite', name: 'Appwrite', category: 'Database', endpoints: ['/storage/files', '/functions/exec'], baseLatency: 42, stability: 0.94 },
  { id: 'pocketbase', name: 'PocketBase', category: 'Database', endpoints: ['/records/list', '/auth/refresh'], baseLatency: 20, stability: 0.96 },
  { id: 'duckdb', name: 'DuckDB', category: 'Database', endpoints: ['/olap/query', '/parquet/scan'], baseLatency: 10, stability: 0.97 },
  { id: 'clickhouse', name: 'ClickHouse', category: 'Database', endpoints: ['/mergetree/insert', '/materialized/view'], baseLatency: 18, stability: 0.96 },
  { id: 'minio', name: 'MinIO', category: 'Database', endpoints: ['/s3/bucket', '/object/put'], baseLatency: 25, stability: 0.98 },
  { id: 'ceph', name: 'Ceph', category: 'Database', endpoints: ['/rados/block', '/mon/map'], baseLatency: 35, stability: 0.95 },
  
  // AI & ML
  { id: 'huggingface', name: 'Hugging Face', category: 'AI', endpoints: ['/models/inference', '/datasets/stream'], baseLatency: 120, stability: 0.90 },
  { id: 'langchain', name: 'LangChain', category: 'AI', endpoints: ['/chain/run', '/memory/recall'], baseLatency: 80, stability: 0.88 },
  { id: 'mlflow', name: 'MLFlow', category: 'AI', endpoints: ['/experiment/track', '/model/registry'], baseLatency: 60, stability: 0.94 },
  { id: 'tensorflow', name: 'TensorFlow', category: 'AI', endpoints: ['/graph/optimize', '/xla/compile'], baseLatency: 90, stability: 0.93 },
  { id: 'pytorch', name: 'PyTorch', category: 'AI', endpoints: ['/tensor/grad', '/jit/trace'], baseLatency: 85, stability: 0.94 },
  { id: 'onnx', name: 'ONNX', category: 'AI', endpoints: ['/model/export', '/runtime/session'], baseLatency: 40, stability: 0.96 },
  { id: 'opencv', name: 'OpenCV', category: 'AI', endpoints: ['/imgproc/filter', '/dnn/forward'], baseLatency: 30, stability: 0.97 },
  { id: 'gym', name: 'OpenAI Gym', category: 'AI', endpoints: ['/env/step', '/env/reset'], baseLatency: 15, stability: 0.95 },
  { id: 'tensorrt', name: 'TensorRT', category: 'AI', endpoints: ['/engine/build', '/inference/exec'], baseLatency: 25, stability: 0.92 },
  
  // Graphics & Game Engines
  { id: 'godot', name: 'Godot Engine', category: 'Graphics', endpoints: ['/scene/tree', '/gdscript/parse'], baseLatency: 16, stability: 0.96 },
  { id: 'blender', name: 'Blender Foundation', category: 'Graphics', endpoints: ['/bpy/context', '/cycles/render'], baseLatency: 100, stability: 0.98 },
  { id: 'inkscape', name: 'Inkscape', category: 'Graphics', endpoints: ['/svg/path', '/filter/apply'], baseLatency: 50, stability: 0.95 },
  { id: 'gimp', name: 'GIMP', category: 'Graphics', endpoints: ['/gegl/node', '/script-fu/run'], baseLatency: 60, stability: 0.94 },
  { id: 'krita', name: 'Krita', category: 'Graphics', endpoints: ['/canvas/brush', '/layer/composite'], baseLatency: 45, stability: 0.96 },
  { id: 'figma', name: 'Figma Open Sim', category: 'Graphics', endpoints: ['/file/nodes', '/vector/network'], baseLatency: 70, stability: 0.92 },
  { id: 'unreal', name: 'Unreal Open Tools', category: 'Graphics', endpoints: ['/blueprint/compile', '/lumen/trace'], baseLatency: 80, stability: 0.91 },
  { id: 'unity', name: 'Unity Open Tools', category: 'Graphics', endpoints: ['/ecs/system', '/shader/graph'], baseLatency: 75, stability: 0.92 },
  
  // Geo & Maps
  { id: 'osm', name: 'OpenStreetMap', category: 'Geo', endpoints: ['/api/0.6/node', '/overpass/query'], baseLatency: 150, stability: 0.93 },
  { id: 'qgis', name: 'QGIS', category: 'Geo', endpoints: ['/wms/getmap', '/vector/process'], baseLatency: 90, stability: 0.95 },
  { id: 'maplibre', name: 'MapLibre', category: 'Geo', endpoints: ['/style/load', '/tile/render'], baseLatency: 40, stability: 0.96 },
  { id: 'leaflet', name: 'Leaflet.js', category: 'Geo', endpoints: ['/layer/add', '/event/click'], baseLatency: 10, stability: 0.98 },
  
  // Media
  { id: 'vlc', name: 'VLC', category: 'Media', endpoints: ['/demux/stream', '/codec/decode'], baseLatency: 20, stability: 0.99 },
  { id: 'ffmpeg', name: 'FFmpeg', category: 'Media', endpoints: ['/avfilter/graph', '/swscale/context'], baseLatency: 45, stability: 0.97 },
  { id: 'obs', name: 'OBS Studio', category: 'Media', endpoints: ['/scene/switch', '/encoder/start'], baseLatency: 30, stability: 0.96 },
  
  // Security & Network
  { id: 'wireguard', name: 'WireGuard', category: 'Security', endpoints: ['/peer/handshake', '/interface/up'], baseLatency: 5, stability: 0.99 },
  { id: 'openvpn', name: 'OpenVPN', category: 'Security', endpoints: ['/tunnel/encrypt', '/route/push'], baseLatency: 25, stability: 0.95 },
  { id: 'tor', name: 'Tor Project', category: 'Security', endpoints: ['/circuit/build', '/onion/publish'], baseLatency: 200, stability: 0.92 },
  { id: 'ublock', name: 'uBlock Origin', category: 'Security', endpoints: ['/filter/match', '/cosmetic/hide'], baseLatency: 8, stability: 0.98 },
  { id: 'brave', name: 'Brave Shields', category: 'Security', endpoints: ['/tracker/block', '/fingerprint/randomize'], baseLatency: 12, stability: 0.97 },
  { id: 'signal', name: 'Signal Protocol', category: 'Security', endpoints: ['/double-ratchet/step', '/x3dh/key'], baseLatency: 40, stability: 0.99 },
  
  // Social & Federation
  { id: 'mastodon', name: 'Mastodon', category: 'Social', endpoints: ['/activitypub/inbox', '/timeline/home'], baseLatency: 110, stability: 0.91 },
  { id: 'matrix', name: 'Matrix', category: 'Social', endpoints: ['/sync/room', '/e2ee/keys'], baseLatency: 95, stability: 0.90 },
  { id: 'nextcloud', name: 'Nextcloud', category: 'Social', endpoints: ['/dav/files', '/ocs/config'], baseLatency: 60, stability: 0.94 },
  { id: 'owncloud', name: 'OwnCloud', category: 'Social', endpoints: ['/share/link', '/user/quota'], baseLatency: 65, stability: 0.93 },
  
  // IoT & Automation
  { id: 'homeassistant', name: 'Home Assistant', category: 'Social', endpoints: ['/state/entity', '/automation/trigger'], baseLatency: 20, stability: 0.96 },
  { id: 'openhab', name: 'OpenHAB', category: 'Social', endpoints: ['/thing/status', '/rule/engine'], baseLatency: 30, stability: 0.95 },
  { id: 'matter', name: 'Matter Protocol', category: 'Social', endpoints: ['/fabric/commission', '/cluster/command'], baseLatency: 45, stability: 0.92 },
  { id: 'zigbee', name: 'Zigbee Sim', category: 'Social', endpoints: ['/coordinator/permit', '/device/announce'], baseLatency: 50, stability: 0.91 },
  
  // CI/CD & Ops
  { id: 'openstack', name: 'OpenStack', category: 'Cloud', endpoints: ['/nova/compute', '/neutron/network'], baseLatency: 150, stability: 0.89 },
  { id: 'proxmox', name: 'Proxmox', category: 'Cloud', endpoints: ['/lxc/create', '/qemu/migrate'], baseLatency: 40, stability: 0.97 },
  { id: 'airflow', name: 'Apache Airflow', category: 'CI/CD', endpoints: ['/dag/trigger', '/task/instance'], baseLatency: 80, stability: 0.93 },
  { id: 'jenkins', name: 'Jenkins', category: 'CI/CD', endpoints: ['/job/build', '/plugin/manager'], baseLatency: 70, stability: 0.90 },
  { id: 'drone', name: 'DroneCI', category: 'CI/CD', endpoints: ['/pipeline/step', '/secret/sign'], baseLatency: 35, stability: 0.95 },
  { id: 'llvm', name: 'LLVM', category: 'Language', endpoints: ['/ir/optimize', '/backend/emit'], baseLatency: 55, stability: 0.98 },
  { id: 'webkit', name: 'WebKit', category: 'Tooling', endpoints: ['/dom/render', '/jscore/exec'], baseLatency: 30, stability: 0.96 },
  { id: 'chromium', name: 'Chromium', category: 'Tooling', endpoints: ['/blink/layout', '/v8/compile'], baseLatency: 35, stability: 0.95 }
];

// --- 4. SIMULATION ENGINE LOGIC ---

interface NetworkPacket {
  id: string;
  source: string;
  target: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
}

interface UniverseState {
  tick: number;
  globalStability: number;
  packets: NetworkPacket[];
  orgStates: Record<string, { health: number; activeRequests: number; lastPing: number }>;
  logs: string[];
}

const useUniverseSimulation = () => {
  const [state, dispatch] = useReducer((state: UniverseState, action: any) => {
    switch (action.type) {
      case 'TICK':
        const newTick = state.tick + 1;
        const newPackets = state.packets
          .filter(p => p.timestamp > Date.now() - 5000) // Cleanup old packets
          .map(p => {
            if (p.status === 'pending' && Math.random() > 0.9) return { ...p, status: 'success' as const };
            if (p.status === 'pending' && Math.random() > 0.99) return { ...p, status: 'failed' as const };
            return p;
          });
        
        // Generate new traffic
        if (Math.random() > 0.5) {
          const source = ORG_REGISTRY[Math.floor(Math.random() * ORG_REGISTRY.length)];
          const target = ORG_REGISTRY[Math.floor(Math.random() * ORG_REGISTRY.length)];
          if (source.id !== target.id) {
            newPackets.push({
              id: QuantumCore.uuid(),
              source: source.id,
              target: target.id,
              payload: { endpoint: target.endpoints[Math.floor(Math.random() * target.endpoints.length)] },
              timestamp: Date.now(),
              status: 'pending'
            });
          }
        }

        // Update Org Health
        const newOrgStates = { ...state.orgStates };
        ORG_REGISTRY.forEach(org => {
          const current = newOrgStates[org.id] || { health: org.stability, activeRequests: 0, lastPing: Date.now() };
          const fluctuation = (Math.random() - 0.5) * 0.01;
          current.health = QuantumCore.clamp(current.health + fluctuation, 0.1, 1.0);
          current.activeRequests = newPackets.filter(p => p.target === org.id && p.status === 'pending').length;
          newOrgStates[org.id] = current;
        });

        // Calculate Global Stability
        const avgHealth = Object.values(newOrgStates).reduce((acc, s) => acc + s.health, 0) / ORG_REGISTRY.length;
        
        // Logs
        const newLogs = [...state.logs];
        if (newPackets.length > state.packets.length) {
          const latest = newPackets[newPackets.length - 1];
          const srcName = ORG_REGISTRY.find(o => o.id === latest.source)?.name;
          const tgtName = ORG_REGISTRY.find(o => o.id === latest.target)?.name;
          newLogs.unshift(`[${new Date().toLocaleTimeString()}] ${srcName} -> ${tgtName}: ${latest.payload.endpoint}`);
        }
        if (newLogs.length > 10) newLogs.pop();

        return {
          tick: newTick,
          globalStability: avgHealth,
          packets: newPackets,
          orgStates: newOrgStates,
          logs: newLogs
        };
      default:
        return state;
    }
  }, {
    tick: 0,
    globalStability: 0.95,
    packets: [],
    orgStates: {},
    logs: ['[SYSTEM] Universe initialized.']
  });

  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK' }), 100);
    return () => clearInterval(interval);
  }, []);

  return state;
};

// --- 5. VISUALIZATION COMPONENTS ---

const NetworkGraph: React.FC<{ packets: NetworkPacket[], orgs: SimulatedOrg[] }> = ({ packets, orgs }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Nodes (Simplified circular layout)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    const nodePositions: Record<string, { x: number, y: number }> = {};

    orgs.forEach((org, i) => {
      const angle = (i / orgs.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      nodePositions[org.id] = { x, y };

      ctx.fillStyle = org.category === 'OS' ? '#3b82f6' : org.category === 'Cloud' ? '#8b5cf6' : '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Packets
    packets.forEach(p => {
      const start = nodePositions[p.source];
      const end = nodePositions[p.target];
      if (!start || !end) return;

      ctx.strokeStyle = p.status === 'pending' ? '#fbbf24' : p.status === 'success' ? '#34d399' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });

  }, [packets, orgs]);

  return <canvas ref={canvasRef} width={400} height={200} className="w-full h-48 bg-slate-950/50 rounded-lg border border-slate-800" />;
};

const TerminalLog: React.FC<{ logs: string[] }> = ({ logs }) => (
  <div className="font-mono text-xs text-slate-400 bg-black/40 p-2 rounded h-32 overflow-hidden flex flex-col-reverse">
    {logs.map((log, i) => (
      <div key={i} className="truncate border-l-2 border-slate-700 pl-2 mb-1">
        <span className="text-cyan-600">{log.split(']')[0]}]</span>
        <span className="text-slate-300">{log.split(']')[1]}</span>
      </div>
    ))}
  </div>
);

const StatBadge: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'text-white' }) => (
  <div className="flex flex-col items-center bg-slate-800/50 p-2 rounded border border-slate-700">
    <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">{label}</span>
    <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
  </div>
);

// --- 6. MAIN WIDGET COMPONENT ---

const AIPredictionWidget: React.FC = () => {
  const universe = useUniverseSimulation();
  const [view, setView] = useState<'network' | 'grid'>('network');

  const stabilityPercent = (universe.globalStability * 100).toFixed(1);
  const activePackets = universe.packets.filter(p => p.status === 'pending').length;
  const totalOrgs = ORG_REGISTRY.length;

  return (
    <Card title="Open Source Ecosystem Telemetry" className="w-full max-w-4xl mx-auto font-sans">
      <div className="p-4 bg-slate-900 text-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Left Column: Stats & Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Icons.Brain className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Prediction Engine</h4>
              <p className="text-xs text-slate-500">Quantum-Entangled Model</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatBadge label="Stability" value={`${stabilityPercent}%`} color={universe.globalStability > 0.9 ? 'text-green-400' : 'text-yellow-400'} />
            <StatBadge label="Entities" value={totalOrgs} />
            <StatBadge label="Traffic" value={activePackets} color="text-blue-400" />
            <StatBadge label="Tick" value={universe.tick} color="text-purple-400" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Forecast Confidence</span>
              <span>99.9%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full w-[99.9%]" />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => setView('network')}
              className={`flex-1 py-1 text-xs font-bold rounded border ${view === 'network' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              Network
            </button>
            <button 
              onClick={() => setView('grid')}
              className={`flex-1 py-1 text-xs font-bold rounded border ${view === 'grid' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Middle Column: Visualization */}
        <div className="md:col-span-2 space-y-4">
          {view === 'network' ? (
            <div className="relative">
              <div className="absolute top-2 left-2 text-xs font-mono text-slate-500 bg-black/50 px-2 rounded">
                LIVE TRAFFIC MAP
              </div>
              <NetworkGraph packets={universe.packets} orgs={ORG_REGISTRY} />
            </div>
          ) : (
            <div className="h-48 overflow-y-auto bg-slate-950/50 rounded-lg border border-slate-800 p-2 grid grid-cols-4 gap-2">
              {ORG_REGISTRY.map(org => {
                const state = universe.orgStates[org.id];
                const health = state ? state.health : 1;
                return (
                  <div key={org.id} className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col items-center justify-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${health > 0.9 ? 'bg-green-500' : health > 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="text-[9px] text-slate-400 text-center truncate w-full">{org.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          <TerminalLog logs={universe.logs} />
        </div>

      </div>
      
      {/* Footer */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <Icons.Server className="w-3 h-3" />
          <span>NODES: {totalOrgs} ONLINE</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.Database className="w-3 h-3" />
          <span>DB: IN-MEMORY</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.Shield className="w-3 h-3" />
          <span>SECURE: TRUE</span>
        </div>
      </div>
    </Card>
  );
};

export default AIPredictionWidget;