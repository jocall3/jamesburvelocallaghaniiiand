import React, { useState, useEffect, useReducer, useRef, useMemo, useCallback, createContext, useContext } from 'react';

/**
 * THE OMNISCIENT CODEX SYSTEM
 * 
 * This file is an evolutionary expansion of the original CodeTooltip.tsx.
 * It transforms the concept of "hovering to reveal definitions" into a 
 * self-contained universe where "hovering" (observation) collapses quantum 
 * states of simulated open-source ecosystems.
 * 
 * ORIGIN: components/CodeTooltip.tsx
 * EVOLUTION: Level 100 - The Universe Forge
 */

// ---------------------------------------------------------------------------
// SECTION I: THE FUNDAMENTAL CONSTANTS OF THE UNIVERSE
// ---------------------------------------------------------------------------

const UNIVERSE_TICK_RATE_MS = 100;
const ENTROPY_GROWTH_FACTOR = 0.001;
const MAX_SYSTEM_LOGS = 500;

type UUID = string;
type ISO8601 = string;

// ---------------------------------------------------------------------------
// SECTION II: THE CORE SIMULATION KERNEL
// ---------------------------------------------------------------------------

/**
 * The QuantumState represents the probabilistic nature of a simulated API.
 */
enum QuantumState {
    SUPERPOSITION = "SUPERPOSITION",
    COLLAPSED_SUCCESS = "COLLAPSED_SUCCESS",
    COLLAPSED_ERROR = "COLLAPSED_ERROR",
    ENTANGLED = "ENTANGLED"
}

interface SystemEvent {
    id: UUID;
    timestamp: ISO8601;
    source: string;
    severity: 'INFO' | 'WARN' | 'CRITICAL' | 'FATAL';
    payload: any;
}

interface APIMetrics {
    uptime: number;
    latency: number;
    requestsPerSecond: number;
    activeConnections: number;
    memoryUsageMB: number;
}

interface SimulatedEndpoint {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    complexity: number; // 0-100
    requiresAuth: boolean;
    handler: (ctx: any) => any;
}

abstract class SimulatedSystem {
    public readonly id: UUID;
    public name: string;
    public version: string;
    public state: QuantumState;
    public metrics: APIMetrics;
    protected endpoints: Map<string, SimulatedEndpoint>;
    protected dataStore: Map<string, any>;

    constructor(name: string, version: string) {
        this.id = Math.random().toString(36).substring(2, 15);
        this.name = name;
        this.version = version;
        this.state = QuantumState.SUPERPOSITION;
        this.metrics = {
            uptime: 0,
            latency: Math.random() * 50,
            requestsPerSecond: 0,
            activeConnections: 0,
            memoryUsageMB: 128
        };
        this.endpoints = new Map();
        this.dataStore = new Map();
        this.initialize();
    }

    abstract initialize(): void;
    abstract tick(delta: number): void;
    
    public execute(path: string, method: string, payload: any): any {
        const endpoint = this.endpoints.get(`${method}:${path}`);
        if (!endpoint) throw new Error(`404 Not Found: ${path} on ${this.name}`);
        
        // Simulate processing
        this.metrics.requestsPerSecond++;
        this.metrics.activeConnections++;
        
        const result = endpoint.handler({ payload, store: this.dataStore });
        
        this.metrics.activeConnections--;
        return result;
    }
}

// ---------------------------------------------------------------------------
// SECTION III: THE 100 SIMULATED API ECOSYSTEMS
// ---------------------------------------------------------------------------

// 1. Linux Foundation
class LinuxFoundationSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/kernel/version', { path: '/kernel/version', method: 'GET', complexity: 1, requiresAuth: false, handler: () => "6.8.0-rc1-simulated" });
        this.endpoints.set('POST:/foundation/members', { path: '/foundation/members', method: 'POST', complexity: 5, requiresAuth: true, handler: ({payload}: any) => ({ status: "Member Added", member: payload }) });
    }
    tick(delta: number) { this.metrics.uptime += delta; }
}

// 2. Canonical (Ubuntu)
class CanonicalSim extends SimulatedSystem {
    initialize() {
        this.dataStore.set('snap_packages', ['code', 'spotify', 'lxd']);
        this.endpoints.set('GET:/snap/search', { path: '/snap/search', method: 'GET', complexity: 3, requiresAuth: false, handler: () => this.dataStore.get('snap_packages') });
    }
    tick(delta: number) { this.metrics.memoryUsageMB += Math.sin(delta) * 2; }
}

// 3. Red Hat
class RedHatSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/rhel/subscription', { path: '/rhel/subscription', method: 'GET', complexity: 8, requiresAuth: true, handler: () => ({ active: true, tier: "Enterprise" }) });
    }
    tick(delta: number) { this.metrics.latency = 20 + Math.random() * 5; }
}

// 4. Fedora Project
class FedoraSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/rawhide/latest', { path: '/rawhide/latest', method: 'GET', complexity: 2, requiresAuth: false, handler: () => "Fedora 41 (Rawhide)" });
    }
    tick(delta: number) { /* Bleeding edge stability simulation */ if(Math.random() > 0.99) this.state = QuantumState.COLLAPSED_ERROR; }
}

// 5. Debian Project
class DebianSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/apt/sources', { path: '/apt/sources', method: 'GET', complexity: 4, requiresAuth: false, handler: () => "deb http://deb.debian.org/debian bookworm main" });
    }
    tick(delta: number) { this.metrics.uptime += delta; /* Rock solid */ }
}

// 6. OpenSUSE
class OpenSUSESim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/tumbleweed/snapshot', { path: '/tumbleweed/snapshot', method: 'GET', complexity: 3, requiresAuth: false, handler: () => new Date().toISOString() });
    }
    tick(delta: number) {}
}

// 7. Arch Linux
class ArchLinuxSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/pacman/sync', { path: '/pacman/sync', method: 'GET', complexity: 9, requiresAuth: true, handler: () => ":: Synchronizing package databases..." });
    }
    tick(delta: number) { this.metrics.requestsPerSecond = Math.floor(Math.random() * 1000); }
}

// 8. Manjaro
class ManjaroSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/branch/stable', { path: '/branch/stable', method: 'GET', complexity: 2, requiresAuth: false, handler: () => ({ status: "Green", lag: "2 weeks" }) });
    }
    tick(delta: number) {}
}

// 9. FreeBSD
class FreeBSDSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/ports/index', { path: '/ports/index', method: 'GET', complexity: 6, requiresAuth: false, handler: () => "34,000 ports available" });
    }
    tick(delta: number) {}
}

// 10. NetBSD
class NetBSDSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/toaster/status', { path: '/toaster/status', method: 'GET', complexity: 1, requiresAuth: false, handler: () => "Running NetBSD" });
    }
    tick(delta: number) {}
}

// 11. OpenBSD
class OpenBSDSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/security/audit', { path: '/security/audit', method: 'GET', complexity: 10, requiresAuth: true, handler: () => "Only two remote holes in the default install, in a heck of a long time!" });
    }
    tick(delta: number) {}
}

// 12. Kubernetes
class KubernetesSim extends SimulatedSystem {
    initialize() {
        this.dataStore.set('pods', []);
        this.endpoints.set('GET:/api/v1/pods', { path: '/api/v1/pods', method: 'GET', complexity: 7, requiresAuth: true, handler: () => this.dataStore.get('pods') });
        this.endpoints.set('POST:/api/v1/pods', { path: '/api/v1/pods', method: 'POST', complexity: 7, requiresAuth: true, handler: ({payload}: any) => { const pods = this.dataStore.get('pods'); pods.push(payload); return { status: "Created" }; } });
    }
    tick(delta: number) { this.metrics.memoryUsageMB += 10; }
}

// 13. CNCF
class CNCFSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/landscape', { path: '/landscape', method: 'GET', complexity: 10, requiresAuth: false, handler: () => "Overwhelmingly large JSON" });
    }
    tick(delta: number) {}
}

// 14. Docker
class DockerSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/containers/create', { path: '/containers/create', method: 'POST', complexity: 5, requiresAuth: true, handler: () => ({ id: Math.random().toString(16).substr(2, 12) }) });
    }
    tick(delta: number) {}
}

// 15. Podman
class PodmanSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/libpod/info', { path: '/libpod/info', method: 'GET', complexity: 4, requiresAuth: false, handler: () => ({ daemonless: true }) });
    }
    tick(delta: number) {}
}

// 16. Ansible
class AnsibleSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/playbook/run', { path: '/playbook/run', method: 'POST', complexity: 6, requiresAuth: true, handler: () => ({ changed: 5, failed: 0 }) });
    }
    tick(delta: number) {}
}

// 17. Terraform
class TerraformSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/plan', { path: '/plan', method: 'POST', complexity: 8, requiresAuth: true, handler: () => ({ add: 2, change: 0, destroy: 0 }) });
    }
    tick(delta: number) {}
}

// 18. HashiCorp
class HashiCorpSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/vault/seal-status', { path: '/vault/seal-status', method: 'GET', complexity: 9, requiresAuth: true, handler: () => ({ sealed: false }) });
    }
    tick(delta: number) {}
}

// 19. Apache Foundation
class ApacheSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/projects', { path: '/projects', method: 'GET', complexity: 5, requiresAuth: false, handler: () => ["httpd", "kafka", "spark", "maven"] });
    }
    tick(delta: number) {}
}

// 20. NGINX
class NGINXSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/stub_status', { path: '/stub_status', method: 'GET', complexity: 2, requiresAuth: false, handler: () => "Active connections: 432" });
    }
    tick(delta: number) { this.metrics.requestsPerSecond = 5000 + Math.random() * 1000; }
}

// 21. Mozilla
class MozillaSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/mdn/search', { path: '/mdn/search', method: 'GET', complexity: 4, requiresAuth: false, handler: () => "Documentation found." });
    }
    tick(delta: number) {}
}

// 22. Firefox Dev Tools
class FirefoxDevToolsSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/remote/debug', { path: '/remote/debug', method: 'POST', complexity: 8, requiresAuth: true, handler: () => ({ port: 6000 }) });
    }
    tick(delta: number) {}
}

// 23. Git
class GitSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/commit', { path: '/commit', method: 'POST', complexity: 3, requiresAuth: false, handler: () => ({ hash: Math.random().toString(16).substr(2, 40) }) });
    }
    tick(delta: number) {}
}

// 24. GitHub Open Source API
class GitHubSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/repos/octocat/hello-world', { path: '/repos/octocat/hello-world', method: 'GET', complexity: 5, requiresAuth: false, handler: () => ({ stars: 45000 }) });
    }
    tick(delta: number) {}
}

// 25. GitLab
class GitLabSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/ci/lint', { path: '/ci/lint', method: 'POST', complexity: 6, requiresAuth: false, handler: () => ({ status: "valid" }) });
    }
    tick(delta: number) {}
}

// 26. Bitbucket
class BitbucketSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/pipelines', { path: '/pipelines', method: 'GET', complexity: 5, requiresAuth: true, handler: () => [] });
    }
    tick(delta: number) {}
}

// 27. VS Code
class VSCodeSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/extensions/install', { path: '/extensions/install', method: 'POST', complexity: 4, requiresAuth: false, handler: () => "Installing..." });
    }
    tick(delta: number) {}
}

// 28. Eclipse Foundation
class EclipseSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/jakarta/ee', { path: '/jakarta/ee', method: 'GET', complexity: 7, requiresAuth: false, handler: () => "Enterprise Java Lives" });
    }
    tick(delta: number) {}
}

// 29. JetBrains Open Tools
class JetBrainsSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/intellij/community', { path: '/intellij/community', method: 'GET', complexity: 6, requiresAuth: false, handler: () => "Build 232.8660.185" });
    }
    tick(delta: number) {}
}

// 30. Python Software Foundation
class PythonSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/pypi/stats', { path: '/pypi/stats', method: 'GET', complexity: 3, requiresAuth: false, handler: () => ({ packages: 400000 }) });
    }
    tick(delta: number) {}
}

// 31. Node.js Foundation
class NodeSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/event-loop/lag', { path: '/event-loop/lag', method: 'GET', complexity: 8, requiresAuth: false, handler: () => "0.4ms" });
    }
    tick(delta: number) {}
}

// 32. Deno
class DenoSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/security/permissions', { path: '/security/permissions', method: 'GET', complexity: 4, requiresAuth: false, handler: () => ({ net: false, read: false }) });
    }
    tick(delta: number) {}
}

// 33. Bun
class BunSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/speed', { path: '/speed', method: 'GET', complexity: 1, requiresAuth: false, handler: () => "Fast." });
    }
    tick(delta: number) {}
}

// 34. Rust Foundation
class RustSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/borrow-checker/verify', { path: '/borrow-checker/verify', method: 'POST', complexity: 10, requiresAuth: false, handler: () => "Safe." });
    }
    tick(delta: number) {}
}

// 35. GoLang Foundation
class GoSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/fmt', { path: '/fmt', method: 'POST', complexity: 2, requiresAuth: false, handler: () => "Formatted." });
    }
    tick(delta: number) {}
}

// 36. Ruby
class RubySim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/gems', { path: '/gems', method: 'GET', complexity: 4, requiresAuth: false, handler: () => "Sparkling" });
    }
    tick(delta: number) {}
}

// 37. PHP
class PHPSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/version', { path: '/version', method: 'GET', complexity: 2, requiresAuth: false, handler: () => "8.3" });
    }
    tick(delta: number) {}
}

// 38. MariaDB
class MariaDBSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/query', { path: '/query', method: 'POST', complexity: 6, requiresAuth: true, handler: () => "Result Set" });
    }
    tick(delta: number) {}
}

// 39. MySQL Open Edition
class MySQLSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/query', { path: '/query', method: 'POST', complexity: 6, requiresAuth: true, handler: () => "Result Set" });
    }
    tick(delta: number) {}
}

// 40. PostgreSQL
class PostgresSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/vacuum', { path: '/vacuum', method: 'POST', complexity: 8, requiresAuth: true, handler: () => "Vacuuming..." });
    }
    tick(delta: number) {}
}

// 41. SQLite
class SQLiteSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/file/size', { path: '/file/size', method: 'GET', complexity: 1, requiresAuth: false, handler: () => "14KB" });
    }
    tick(delta: number) {}
}

// 42. Redis
class RedisSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/keys', { path: '/keys', method: 'GET', complexity: 2, requiresAuth: false, handler: () => "*" });
    }
    tick(delta: number) { this.metrics.latency = 0.1; }
}

// 43. MongoDB Community
class MongoDBSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/aggregate', { path: '/aggregate', method: 'POST', complexity: 7, requiresAuth: true, handler: () => "Pipeline executed" });
    }
    tick(delta: number) {}
}

// 44. Cassandra
class CassandraSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/gossip', { path: '/gossip', method: 'GET', complexity: 8, requiresAuth: false, handler: () => "Cluster healthy" });
    }
    tick(delta: number) {}
}

// 45. ElasticSearch
class ElasticSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/_search', { path: '/_search', method: 'POST', complexity: 9, requiresAuth: false, handler: () => ({ hits: { total: 100 } }) });
    }
    tick(delta: number) {}
}

// 46. Apache Spark
class SparkSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/job/submit', { path: '/job/submit', method: 'POST', complexity: 9, requiresAuth: true, handler: () => "Job ID: 442" });
    }
    tick(delta: number) {}
}

// 47. Apache Kafka
class KafkaSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/produce', { path: '/produce', method: 'POST', complexity: 5, requiresAuth: false, handler: () => "Offset: 9921" });
    }
    tick(delta: number) {}
}

// 48. Supabase
class SupabaseSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/realtime', { path: '/realtime', method: 'GET', complexity: 7, requiresAuth: true, handler: () => "Connected" });
    }
    tick(delta: number) {}
}

// 49. Appwrite
class AppwriteSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/functions', { path: '/functions', method: 'POST', complexity: 6, requiresAuth: true, handler: () => "Function Executed" });
    }
    tick(delta: number) {}
}

// 50. PocketBase
class PocketBaseSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/records', { path: '/records', method: 'GET', complexity: 3, requiresAuth: false, handler: () => [] });
    }
    tick(delta: number) {}
}

// 51. Hugging Face
class HuggingFaceSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/inference', { path: '/inference', method: 'POST', complexity: 10, requiresAuth: true, handler: () => "Tensor[0.1, 0.9]" });
    }
    tick(delta: number) {}
}

// 52. LangChain
class LangChainSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/chain/run', { path: '/chain/run', method: 'POST', complexity: 8, requiresAuth: false, handler: () => "Thought: ... Action: ..." });
    }
    tick(delta: number) {}
}

// 53. MLFlow
class MLFlowSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/runs/log-metric', { path: '/runs/log-metric', method: 'POST', complexity: 4, requiresAuth: false, handler: () => "Logged" });
    }
    tick(delta: number) {}
}

// 54. TensorFlow
class TensorFlowSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/graph/optimize', { path: '/graph/optimize', method: 'POST', complexity: 10, requiresAuth: false, handler: () => "Graph Optimized" });
    }
    tick(delta: number) {}
}

// 55. PyTorch
class PyTorchSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/autograd/backward', { path: '/autograd/backward', method: 'POST', complexity: 10, requiresAuth: false, handler: () => "Gradients Computed" });
    }
    tick(delta: number) {}
}

// 56. ONNX
class ONNXSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/export', { path: '/export', method: 'POST', complexity: 7, requiresAuth: false, handler: () => "Model.onnx" });
    }
    tick(delta: number) {}
}

// 57. OpenCV
class OpenCVSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/imgproc/canny', { path: '/imgproc/canny', method: 'POST', complexity: 6, requiresAuth: false, handler: () => "Edges Detected" });
    }
    tick(delta: number) {}
}

// 58. OpenAI Gym
class GymSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/env/step', { path: '/env/step', method: 'POST', complexity: 5, requiresAuth: false, handler: () => ({ obs: [], reward: 1.0, done: false }) });
    }
    tick(delta: number) {}
}

// 59. Godot Engine
class GodotSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/scene/tree', { path: '/scene/tree', method: 'GET', complexity: 4, requiresAuth: false, handler: () => "Root/Node2D" });
    }
    tick(delta: number) {}
}

// 60. Blender Foundation
class BlenderSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/render', { path: '/render', method: 'POST', complexity: 10, requiresAuth: false, handler: () => "Rendering tile 1/256..." });
    }
    tick(delta: number) {}
}

// 61. Inkscape
class InkscapeSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/svg/export', { path: '/svg/export', method: 'POST', complexity: 5, requiresAuth: false, handler: () => "Vector exported" });
    }
    tick(delta: number) {}
}

// 62. GIMP
class GIMPSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/filters/gaussian-blur', { path: '/filters/gaussian-blur', method: 'POST', complexity: 6, requiresAuth: false, handler: () => "Blurred" });
    }
    tick(delta: number) {}
}

// 63. Krita
class KritaSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/brush/engine', { path: '/brush/engine', method: 'GET', complexity: 7, requiresAuth: false, handler: () => "Pixel Engine" });
    }
    tick(delta: number) {}
}

// 64. Figma Open API
class FigmaSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/file/nodes', { path: '/file/nodes', method: 'GET', complexity: 6, requiresAuth: true, handler: () => "Frame 1" });
    }
    tick(delta: number) {}
}

// 65. Unreal Open Tools
class UnrealSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/blueprints/compile', { path: '/blueprints/compile', method: 'POST', complexity: 9, requiresAuth: false, handler: () => "Success" });
    }
    tick(delta: number) {}
}

// 66. Unity Open Tools
class UnitySim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/assets/guid', { path: '/assets/guid', method: 'GET', complexity: 3, requiresAuth: false, handler: () => "GUID: 4f3a..." });
    }
    tick(delta: number) {}
}

// 67. OpenStreetMap
class OSMSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/map', { path: '/map', method: 'GET', complexity: 8, requiresAuth: false, handler: () => "XML Data" });
    }
    tick(delta: number) {}
}

// 68. QGIS
class QGISSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/layer/add', { path: '/layer/add', method: 'POST', complexity: 5, requiresAuth: false, handler: () => "Layer Added" });
    }
    tick(delta: number) {}
}

// 69. MapLibre
class MapLibreSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/style.json', { path: '/style.json', method: 'GET', complexity: 4, requiresAuth: false, handler: () => "Style Def" });
    }
    tick(delta: number) {}
}

// 70. Leaflet.js
class LeafletSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/marker/add', { path: '/marker/add', method: 'POST', complexity: 2, requiresAuth: false, handler: () => "Marker placed" });
    }
    tick(delta: number) {}
}

// 71. VLC
class VLCSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/decode', { path: '/decode', method: 'POST', complexity: 7, requiresAuth: false, handler: () => "Frame decoded" });
    }
    tick(delta: number) {}
}

// 72. FFmpeg
class FFmpegSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/transcode', { path: '/transcode', method: 'POST', complexity: 10, requiresAuth: false, handler: () => "Transcoding..." });
    }
    tick(delta: number) {}
}

// 73. OBS Studio
class OBSSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/stream/start', { path: '/stream/start', method: 'POST', complexity: 8, requiresAuth: false, handler: () => "Streaming" });
    }
    tick(delta: number) {}
}

// 74. WireGuard
class WireGuardSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/handshake', { path: '/handshake', method: 'POST', complexity: 6, requiresAuth: true, handler: () => "Handshake Completed" });
    }
    tick(delta: number) {}
}

// 75. OpenVPN
class OpenVPNSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/connect', { path: '/connect', method: 'POST', complexity: 7, requiresAuth: true, handler: () => "Tunnel Established" });
    }
    tick(delta: number) {}
}

// 76. Tor Project
class TorSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/circuit/build', { path: '/circuit/build', method: 'POST', complexity: 9, requiresAuth: false, handler: () => "Circuit Ready" });
    }
    tick(delta: number) {}
}

// 77. DuckDB
class DuckDBSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/query/analytical', { path: '/query/analytical', method: 'POST', complexity: 6, requiresAuth: false, handler: () => "Fast Result" });
    }
    tick(delta: number) {}
}

// 78. ClickHouse
class ClickHouseSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/insert/bulk', { path: '/insert/bulk', method: 'POST', complexity: 8, requiresAuth: false, handler: () => "Inserted 1M rows" });
    }
    tick(delta: number) {}
}

// 79. MinIO
class MinIOSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('PUT:/object', { path: '/object', method: 'PUT', complexity: 5, requiresAuth: true, handler: () => "Stored" });
    }
    tick(delta: number) {}
}

// 80. Ceph
class CephSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/crush/map', { path: '/crush/map', method: 'GET', complexity: 9, requiresAuth: true, handler: () => "Map Data" });
    }
    tick(delta: number) {}
}

// 81. OpenStack
class OpenStackSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/nova/instances', { path: '/nova/instances', method: 'POST', complexity: 10, requiresAuth: true, handler: () => "Instance Provisioning" });
    }
    tick(delta: number) {}
}

// 82. Proxmox
class ProxmoxSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/cluster/resources', { path: '/cluster/resources', method: 'GET', complexity: 6, requiresAuth: true, handler: () => "Resources OK" });
    }
    tick(delta: number) {}
}

// 83. Home Assistant
class HomeAssistantSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/service/call', { path: '/service/call', method: 'POST', complexity: 4, requiresAuth: true, handler: () => "Light On" });
    }
    tick(delta: number) {}
}

// 84. OpenHAB
class OpenHABSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/items', { path: '/items', method: 'GET', complexity: 4, requiresAuth: false, handler: () => "Items List" });
    }
    tick(delta: number) {}
}

// 85. Matter Protocol
class MatterSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/commission', { path: '/commission', method: 'POST', complexity: 8, requiresAuth: true, handler: () => "Device Joined" });
    }
    tick(delta: number) {}
}

// 86. Zigbee Sim
class ZigbeeSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/bind', { path: '/bind', method: 'POST', complexity: 5, requiresAuth: false, handler: () => "Bound" });
    }
    tick(delta: number) {}
}

// 87. TensorRT
class TensorRTSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/engine/build', { path: '/engine/build', method: 'POST', complexity: 9, requiresAuth: false, handler: () => "Engine Built" });
    }
    tick(delta: number) {}
}

// 88. LLVM
class LLVMSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/ir/optimize', { path: '/ir/optimize', method: 'POST', complexity: 10, requiresAuth: false, handler: () => "Bitcode Optimized" });
    }
    tick(delta: number) {}
}

// 89. WebKit
class WebKitSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/layout', { path: '/layout', method: 'POST', complexity: 8, requiresAuth: false, handler: () => "Reflow Complete" });
    }
    tick(delta: number) {}
}

// 90. Chromium
class ChromiumSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/v8/compile', { path: '/v8/compile', method: 'POST', complexity: 9, requiresAuth: false, handler: () => "JIT Code Generated" });
    }
    tick(delta: number) {}
}

// 91. uBlock Origin
class uBlockSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/filter/check', { path: '/filter/check', method: 'POST', complexity: 3, requiresAuth: false, handler: () => "Blocked" });
    }
    tick(delta: number) {}
}

// 92. Brave Shields
class BraveSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/fingerprint/block', { path: '/fingerprint/block', method: 'POST', complexity: 4, requiresAuth: false, handler: () => "Randomized" });
    }
    tick(delta: number) {}
}

// 93. Nextcloud
class NextcloudSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('PROPFIND:/files', { path: '/files', method: 'GET', complexity: 6, requiresAuth: true, handler: () => "File List" });
    }
    tick(delta: number) {}
}

// 94. OwnCloud
class OwnCloudSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('GET:/status', { path: '/status', method: 'GET', complexity: 2, requiresAuth: false, handler: () => "OK" });
    }
    tick(delta: number) {}
}

// 95. Mastodon
class MastodonSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/statuses', { path: '/statuses', method: 'POST', complexity: 5, requiresAuth: true, handler: () => "Tooted" });
    }
    tick(delta: number) {}
}

// 96. Matrix
class MatrixSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('PUT:/send/m.room.message', { path: '/send/m.room.message', method: 'PUT', complexity: 7, requiresAuth: true, handler: () => "Event ID" });
    }
    tick(delta: number) {}
}

// 97. Signal
class SignalSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/keys/upload', { path: '/keys/upload', method: 'POST', complexity: 9, requiresAuth: true, handler: () => "Prekeys Uploaded" });
    }
    tick(delta: number) {}
}

// 98. Apache Airflow
class AirflowSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/dag/trigger', { path: '/dag/trigger', method: 'POST', complexity: 6, requiresAuth: true, handler: () => "DAG Running" });
    }
    tick(delta: number) {}
}

// 99. Jenkins
class JenkinsSim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/job/build', { path: '/job/build', method: 'POST', complexity: 5, requiresAuth: true, handler: () => "Build Queued" });
    }
    tick(delta: number) {}
}

// 100. DroneCI
class DroneCISim extends SimulatedSystem {
    initialize() {
        this.endpoints.set('POST:/repo/enable', { path: '/repo/enable', method: 'POST', complexity: 4, requiresAuth: true, handler: () => "Webhooks Set" });
    }
    tick(delta: number) {}
}

// ---------------------------------------------------------------------------
// SECTION IV: THE UNIVERSE FACTORY
// ---------------------------------------------------------------------------

class UniverseFactory {
    static create(): Map<string, SimulatedSystem> {
        const systems = new Map<string, SimulatedSystem>();
        const registry = [
            new LinuxFoundationSim("Linux Foundation", "Kernel 6.8"),
            new CanonicalSim("Canonical", "Ubuntu 24.04"),
            new RedHatSim("Red Hat", "RHEL 9"),
            new FedoraSim("Fedora Project", "Rawhide"),
            new DebianSim("Debian Project", "Bookworm"),
            new OpenSUSESim("OpenSUSE", "Tumbleweed"),
            new ArchLinuxSim("Arch Linux", "Rolling"),
            new ManjaroSim("Manjaro", "Stable"),
            new FreeBSDSim("FreeBSD", "14.0"),
            new NetBSDSim("NetBSD", "9.3"),
            new OpenBSDSim("OpenBSD", "7.4"),
            new KubernetesSim("Kubernetes", "1.29"),
            new CNCFSim("CNCF", "Landscape"),
            new DockerSim("Docker", "25.0"),
            new PodmanSim("Podman", "4.9"),
            new AnsibleSim("Ansible", "Core"),
            new TerraformSim("Terraform", "1.7"),
            new HashiCorpSim("HashiCorp", "Vault"),
            new ApacheSim("Apache Foundation", "Projects"),
            new NGINXSim("NGINX", "1.25"),
            new MozillaSim("Mozilla", "Firefox"),
            new FirefoxDevToolsSim("Firefox Dev Tools", "Latest"),
            new GitSim("Git", "2.43"),
            new GitHubSim("GitHub API", "Simulated"),
            new GitLabSim("GitLab", "16.8"),
            new BitbucketSim("Bitbucket", "Cloud"),
            new VSCodeSim("VS Code", "1.86"),
            new EclipseSim("Eclipse Foundation", "IDE"),
            new JetBrainsSim("JetBrains", "Open Tools"),
            new PythonSim("Python Software Foundation", "3.12"),
            new NodeSim("Node.js Foundation", "21.6"),
            new DenoSim("Deno", "1.40"),
            new BunSim("Bun", "1.0"),
            new RustSim("Rust Foundation", "1.75"),
            new GoSim("GoLang Foundation", "1.22"),
            new RubySim("Ruby", "3.3"),
            new PHPSim("PHP", "8.3"),
            new MariaDBSim("MariaDB", "11.2"),
            new MySQLSim("MySQL Open Edition", "8.3"),
            new PostgresSim("PostgreSQL", "16.1"),
            new SQLiteSim("SQLite", "3.45"),
            new RedisSim("Redis", "7.2"),
            new MongoDBSim("MongoDB Community", "7.0"),
            new CassandraSim("Cassandra", "4.1"),
            new ElasticSim("ElasticSearch", "8.12"),
            new SparkSim("Apache Spark", "3.5"),
            new KafkaSim("Apache Kafka", "3.6"),
            new SupabaseSim("Supabase", "Open Sim"),
            new AppwriteSim("Appwrite", "1.4"),
            new PocketBaseSim("PocketBase", "0.21"),
            new HuggingFaceSim("Hugging Face", "Hub"),
            new LangChainSim("LangChain", "0.1"),
            new MLFlowSim("MLFlow", "2.10"),
            new TensorFlowSim("TensorFlow", "2.15"),
            new PyTorchSim("PyTorch", "2.2"),
            new ONNXSim("ONNX", "1.15"),
            new OpenCVSim("OpenCV", "4.9"),
            new GymSim("OpenAI Gym", "Sim"),
            new GodotSim("Godot Engine", "4.2"),
            new BlenderSim("Blender Foundation", "4.0"),
            new InkscapeSim("Inkscape", "1.3"),
            new GIMPSim("GIMP", "2.10"),
            new KritaSim("Krita", "5.2"),
            new FigmaSim("Figma Open API", "Sim"),
            new UnrealSim("Unreal Open Tools", "5.3"),
            new UnitySim("Unity Open Tools", "2023"),
            new OSMSim("OpenStreetMap", "Planet"),
            new QGISSim("QGIS", "3.34"),
            new MapLibreSim("MapLibre", "3.0"),
            new LeafletSim("Leaflet.js", "1.9"),
            new VLCSim("VLC", "3.0"),
            new FFmpegSim("FFmpeg", "6.1"),
            new OBSSim("OBS Studio", "30.0"),
            new WireGuardSim("WireGuard", "1.0"),
            new OpenVPNSim("OpenVPN", "2.6"),
            new TorSim("Tor Project", "0.4.8"),
            new DuckDBSim("DuckDB", "0.9"),
            new ClickHouseSim("ClickHouse", "24.1"),
            new MinIOSim("MinIO", "RELEASE"),
            new CephSim("Ceph", "Reef"),
            new OpenStackSim("OpenStack", "Bobcat"),
            new ProxmoxSim("Proxmox", "8.1"),
            new HomeAssistantSim("Home Assistant", "2024.1"),
            new OpenHABSim("OpenHAB", "4.1"),
            new MatterSim("Matter Protocol", "1.2"),
            new ZigbeeSim("Zigbee Sim", "3.0"),
            new TensorRTSim("TensorRT", "8.6"),
            new LLVMSim("LLVM", "17.0"),
            new WebKitSim("WebKit", "GTK"),
            new ChromiumSim("Chromium", "121"),
            new uBlockSim("uBlock Origin", "1.55"),
            new BraveSim("Brave Shields", "1.62"),
            new NextcloudSim("Nextcloud", "28"),
            new OwnCloudSim("OwnCloud", "Infinite Scale"),
            new MastodonSim("Mastodon", "4.2"),
            new MatrixSim("Matrix", "Synapse"),
            new SignalSim("Signal", "Protocol"),
            new AirflowSim("Apache Airflow", "2.8"),
            new JenkinsSim("Jenkins", "2.440"),
            new DroneCISim("DroneCI", "2.20")
        ];

        registry.forEach(sys => systems.set(sys.name, sys));
        return systems;
    }
}

// ---------------------------------------------------------------------------
// SECTION V: THE REACT CONTEXT & HOOKS
// ---------------------------------------------------------------------------

interface UniverseContextType {
    systems: Map<string, SimulatedSystem>;
    logs: SystemEvent[];
    selectedSystemId: UUID | null;
    selectSystem: (id: UUID | null) => void;
    tick: number;
}

const UniverseContext = createContext<UniverseContextType | null>(null);

const useUniverse = () => {
    const context = useContext(UniverseContext);
    if (!context) throw new Error("Universe not found. Did you forget to ignite the Big Bang?");
    return context;
};

// ---------------------------------------------------------------------------
// SECTION VI: UI COMPONENTS (THE VISUAL LAYER)
// ---------------------------------------------------------------------------

const SystemCard: React.FC<{ system: SimulatedSystem; isSelected: boolean; onClick: () => void }> = ({ system, isSelected, onClick }) => {
    const statusColor = system.state === QuantumState.COLLAPSED_ERROR ? '#ff4444' : '#44ff44';
    
    return (
        <div 
            onClick={onClick}
            style={{
                border: `1px solid ${isSelected ? '#ffffff' : '#333'}`,
                backgroundColor: isSelected ? '#222' : '#000',
                padding: '10px',
                margin: '5px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '10px',
                width: '140px',
                height: '80px',
                display: 'inline-block',
                verticalAlign: 'top',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '5px' }}>{system.name}</div>
            <div style={{ color: '#888' }}>{system.version}</div>
            <div style={{ 
                position: 'absolute', 
                bottom: '5px', 
                right: '5px', 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: statusColor,
                boxShadow: `0 0 5px ${statusColor}`
            }} />
            <div style={{ fontSize: '9px', marginTop: '10px', color: '#666' }}>
                REQ/S: {system.metrics.requestsPerSecond.toFixed(0)}
            </div>
        </div>
    );
};

const DetailPanel: React.FC<{ system: SimulatedSystem }> = ({ system }) => {
    return (
        <div style={{
            padding: '20px',
            backgroundColor: '#111',
            borderTop: '1px solid #333',
            color: '#eee',
            fontFamily: 'monospace',
            height: '200px',
            overflowY: 'auto'
        }}>
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
                SYSTEM INSPECTION: {system.name.toUpperCase()}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <h4 style={{ color: '#888' }}>METRICS</h4>
                    <div>UPTIME: {system.metrics.uptime.toFixed(2)}s</div>
                    <div>LATENCY: {system.metrics.latency.toFixed(2)}ms</div>
                    <div>MEMORY: {system.metrics.memoryUsageMB.toFixed(1)}MB</div>
                    <div>CONNECTIONS: {system.metrics.activeConnections}</div>
                </div>
                <div>
                    <h4 style={{ color: '#888' }}>ENDPOINTS</h4>
                    {Array.from((system as any).endpoints.values()).map((ep: any) => (
                        <div key={ep.path} style={{ marginBottom: '4px' }}>
                            <span style={{ 
                                backgroundColor: ep.method === 'GET' ? '#2a5' : '#d82', 
                                color: '#000', 
                                padding: '1px 4px', 
                                borderRadius: '2px', 
                                fontSize: '9px',
                                marginRight: '5px'
                            }}>{ep.method}</span>
                            {ep.path}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LogConsole: React.FC<{ logs: SystemEvent[] }> = ({ logs }) => {
    const endRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div style={{
            height: '150px',
            backgroundColor: '#000',
            borderTop: '1px solid #333',
            overflowY: 'auto',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#aaa'
        }}>
            {logs.map(log => (
                <div key={log.id} style={{ marginBottom: '2px' }}>
                    <span style={{ color: '#555' }}>[{log.timestamp.split('T')[1].split('.')[0]}]</span>
                    <span style={{ color: log.severity === 'INFO' ? '#4f4' : '#f44', margin: '0 8px' }}>{log.severity}</span>
                    <span style={{ color: '#fff' }}>[{log.source}]</span> {JSON.stringify(log.payload)}
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
};

// ---------------------------------------------------------------------------
// SECTION VII: THE MAIN COMPONENT (EVOLVED)
// ---------------------------------------------------------------------------

// Embedded mock schema data (Preserved from original file as "Ancient Scripture")
const schemaData = {
  definitions: {
    "ExternalPurpose1Code": {
      "description": "*`CASH` - Cash management.\n*`SECU` - Securities.",
      "enum": ["CASH", "SECU"]
    }
  }
};

interface CodeTooltipProps {
  codeType: string;
  codeValue: string;
  children: React.ReactNode;
}

/**
 * CodeTooltip
 * 
 * Originally a simple tooltip.
 * Now a portal to a simulated universe of 100 open-source ecosystems.
 * 
 * When you hover, you do not just see a definition.
 * You see the machine.
 */
const CodeTooltip: React.FC<CodeTooltipProps> = ({ codeType, codeValue, children }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [universeExpanded, setUniverseExpanded] = useState(false);
  
  // Universe State
  const [systems] = useState(() => UniverseFactory.create());
  const [logs, setLogs] = useState<SystemEvent[]>([]);
  const [tick, setTick] = useState(0);
  const [selectedSystemId, setSelectedSystemId] = useState<UUID | null>(null);

  // The Simulation Loop
  useEffect(() => {
    if (!universeExpanded) return;

    const interval = setInterval(() => {
        setTick(t => t + 1);
        
        // Randomly pick a system to generate activity
        const systemArray = Array.from(systems.values());
        const randomSystem = systemArray[Math.floor(Math.random() * systemArray.length)];
        
        randomSystem.tick(UNIVERSE_TICK_RATE_MS / 1000);
        
        // Generate Log
        if (Math.random() > 0.7) {
            const newLog: SystemEvent = {
                id: Math.random().toString(36),
                timestamp: new Date().toISOString(),
                source: randomSystem.name,
                severity: Math.random() > 0.95 ? 'WARN' : 'INFO',
                payload: `Processed ${Math.floor(Math.random() * 100)} ops`
            };
            setLogs(prev => [...prev.slice(-MAX_SYSTEM_LOGS), newLog]);
        }

    }, UNIVERSE_TICK_RATE_MS);

    return () => clearInterval(interval);
  }, [universeExpanded, systems]);

  // Original Logic Preservation
  const definition = schemaData.definitions[codeType as keyof typeof schemaData.definitions]?.description;

  const handleInteraction = () => {
      setUniverseExpanded(!universeExpanded);
  };

  return (
    <span
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleInteraction}
      style={{ position: 'relative', cursor: 'help', textDecoration: 'underline dotted', color: universeExpanded ? '#44ff44' : 'inherit' }}
    >
      {children}
      
      {/* The "Soul" of the original file: The Tooltip */}
      {isHovering && !universeExpanded && definition && (
        <span style={{
            position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'black', color: 'white', padding: '5px', borderRadius: '4px',
            width: '200px', fontSize: '12px', zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
            <div style={{ borderBottom: '1px solid #444', paddingBottom: '2px', marginBottom: '2px', fontWeight: 'bold' }}>
                {codeType}
            </div>
            {definition}
            <div style={{ fontSize: '9px', color: '#888', marginTop: '5px' }}>
                Click to expand Universe
            </div>
        </span>
      )}

      {/* The Expansion: The Universe Dashboard */}
      {universeExpanded && (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            height: '80vh',
            backgroundColor: '#050505',
            border: '1px solid #333',
            borderRadius: '8px',
            zIndex: 10000,
            boxShadow: '0 0 50px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111' }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '16px', fontFamily: 'monospace' }}>
                    OMNISCIENT CODEX // {codeType}::{codeValue}
                </h2>
                <button 
                    onClick={(e) => { e.stopPropagation(); setUniverseExpanded(false); }}
                    style={{ background: 'none', border: '1px solid #444', color: '#fff', cursor: 'pointer', padding: '5px 10px' }}
                >
                    CLOSE SIMULATION
                </button>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* System Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', alignContent: 'flex-start' }}>
                    {Array.from(systems.values()).map(sys => (
                        <SystemCard 
                            key={sys.id} 
                            system={sys} 
                            isSelected={selectedSystemId === sys.id}
                            onClick={() => setSelectedSystemId(sys.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Detail Panel (if selected) */}
            {selectedSystemId && (
                <DetailPanel system={Array.from(systems.values()).find(s => s.id === selectedSystemId)!} />
            )}

            {/* Logs */}
            <LogConsole logs={logs} />
            
            {/* Footer */}
            <div style={{ padding: '5px 20px', borderTop: '1px solid #333', fontSize: '10px', color: '#666', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
                <span>UNIVERSE TICK: {tick}</span>
                <span>SYSTEMS ONLINE: {systems.size}</span>
                <span>ENTROPY: {(tick * ENTROPY_GROWTH_FACTOR).toFixed(4)}</span>
            </div>
        </div>
      )}
    </span>
  );
};

export default CodeTooltip;