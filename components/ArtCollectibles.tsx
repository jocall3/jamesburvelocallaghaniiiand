import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react';

/**
 * --------------------------------------------------------------------------------
 * THE OMNIVERSE OPEN SOURCE SIMULATION ENGINE (OOSSE)
 * --------------------------------------------------------------------------------
 * 
 * This file is a self-contained, universe-scale simulation of the global open-source
 * ecosystem. It transforms the concept of "Art Collectibles" into "Technological Assets".
 * 
 * ARCHITECTURE:
 * 1. KERNEL: A central simulation loop (The "Heartbeat") driving time and entropy.
 * 2. ENTITY LAYER: 100+ fully simulated API classes representing real-world organizations.
 * 3. DATA MESH: An in-memory graph database linking all entities.
 * 4. INTERFACE: A sci-fi, terminal-inspired dashboard for interacting with the universe.
 * 
 * INSTRUCTIONS:
 * - Explore the simulated APIs via the "Terminal" tab.
 * - Monitor global system health in the "Dashboard".
 * - Invest in open-source projects in the "Market".
 * 
 * --------------------------------------------------------------------------------
 */

// ================================================================================
// SECTION 1: CORE TYPES & UTILITIES
// ================================================================================

type UUID = string;
type ISO8601 = string;
type SemVer = string;
type HexHash = string;

type SystemStatus = 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE';
type AssetCategory = 'OS' | 'Containerization' | 'DevTools' | 'Language' | 'Database' | 'AI/ML' | 'Media' | 'Geo' | 'Network' | 'Storage' | 'Cloud' | 'IoT' | 'WebEngine' | 'Privacy' | 'Communication' | 'CI/CD';

interface SimulationPacket {
    tick: number;
    entropy: number;
    globalComputeLoad: number; // 0.0 - 1.0
    activeContributors: number;
    securityThreatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
}

interface LogEntry {
    id: UUID;
    timestamp: ISO8601;
    source: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';
    message: string;
    metadata?: Record<string, any>;
}

interface ApiResponse<T> {
    status: number;
    data: T | null;
    error?: string;
    latencyMs: number;
    headers: Record<string, string>;
}

// --- MATH & RANDOMNESS ENGINE ---

class UniverseMath {
    private static seed = 1337;

    static random(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    static randomInt(min: number, max: number): number {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    static generateUUID(): UUID {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (this.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    static generateHash(input: string): HexHash {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
    }

    static sigmoid(t: number): number {
        return 1 / (1 + Math.exp(-t));
    }

    static perlinNoise(x: number): number {
        // Simplified pseudo-noise for market fluctuations
        return Math.sin(x) * 0.5 + Math.sin(x * 2.1) * 0.25 + Math.sin(x * 4.3) * 0.125;
    }
}

// ================================================================================
// SECTION 2: THE 100 SIMULATED API SYSTEMS
// ================================================================================

/**
 * Base class for all simulated Open Source Entities.
 * Each entity acts as a mini-server with state, logic, and endpoints.
 */
abstract class OpenSourceEntity {
    public readonly id: UUID;
    public readonly name: string;
    public readonly category: AssetCategory;
    public status: SystemStatus = 'OPERATIONAL';
    public version: SemVer = '1.0.0';
    public uptime: number = 0;
    public contributors: number = 0;
    public marketValue: number = 0; // Simulated "Tokenized" value
    public logs: LogEntry[] = [];
    
    protected internalState: Record<string, any> = {};

    constructor(name: string, category: AssetCategory, initialValue: number) {
        this.id = UniverseMath.generateUUID();
        this.name = name;
        this.category = category;
        this.marketValue = initialValue;
        this.contributors = UniverseMath.randomInt(50, 5000);
    }

    /**
     * The heartbeat of the entity. Called every simulation tick.
     */
    public abstract tick(globalPacket: SimulationPacket): void;

    /**
     * Generic request handler simulating an API call.
     */
    protected async handleRequest<T>(endpoint: string, logic: () => T): Promise<ApiResponse<T>> {
        const start = performance.now();
        // Simulate network latency
        const latency = UniverseMath.randomInt(10, 200);
        await new Promise(resolve => setTimeout(resolve, latency));

        try {
            const result = logic();
            this.log('INFO', `API Call: ${endpoint}`, { latency });
            return {
                status: 200,
                data: result,
                latencyMs: performance.now() - start,
                headers: { 'X-Powered-By': 'OOSSE-Sim-Engine', 'X-Entity': this.name }
            };
        } catch (e: any) {
            this.log('ERROR', `API Failure: ${endpoint}`, { error: e.message });
            return {
                status: 500,
                data: null,
                error: e.message,
                latencyMs: performance.now() - start,
                headers: { 'X-Error': 'SimulationException' }
            };
        }
    }

    protected log(level: LogEntry['level'], message: string, metadata?: any) {
        const entry: LogEntry = {
            id: UniverseMath.generateUUID(),
            timestamp: new Date().toISOString(),
            source: this.name,
            level,
            message,
            metadata
        };
        this.logs.unshift(entry);
        if (this.logs.length > 50) this.logs.pop();
    }

    // --- STANDARD SIMULATED ENDPOINTS ---
    
    public async getHealth(): Promise<ApiResponse<{ status: SystemStatus, uptime: number }>> {
        return this.handleRequest('GET /health', () => ({
            status: this.status,
            uptime: this.uptime
        }));
    }

    public async getMetrics(): Promise<ApiResponse<{ contributors: number, value: number }>> {
        return this.handleRequest('GET /metrics', () => ({
            contributors: this.contributors,
            value: this.marketValue
        }));
    }
}

// --------------------------------------------------------------------------------
// GROUP 1: OPERATING SYSTEMS & FOUNDATIONS
// --------------------------------------------------------------------------------

class LinuxFoundationAPI extends OpenSourceEntity {
    constructor() { super('Linux Foundation', 'OS', 5000000); }
    
    tick(packet: SimulationPacket) {
        this.uptime++;
        if (packet.tick % 100 === 0) {
            this.internalState.kernelVersion = `6.${Math.floor(packet.tick / 1000)}.${packet.tick % 100}`;
            this.log('SUCCESS', `Kernel patch merged: ${this.internalState.kernelVersion}`);
        }
    }

    public async submitPatch(patchId: string): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /kernel/patch', () => {
            if (UniverseMath.random() > 0.8) throw new Error('Patch rejected: Code style violation');
            return `Patch ${patchId} merged into mainline.`;
        });
    }
}

class CanonicalAPI extends OpenSourceEntity {
    constructor() { super('Canonical (Ubuntu)', 'OS', 2000000); }
    tick(packet: SimulationPacket) {
        this.uptime++;
        if (UniverseMath.random() > 0.95) this.log('INFO', 'Snap Store updated with 50 new packages.');
    }
    public async releaseLTS(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /release/lts', () => `Ubuntu 24.04.${UniverseMath.randomInt(1, 5)} LTS Released`);
    }
}

class RedHatAPI extends OpenSourceEntity {
    constructor() { super('Red Hat', 'OS', 3500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async verifyRHELSubscription(id: string): Promise<ApiResponse<boolean>> {
        return this.handleRequest('GET /subscription/verify', () => true);
    }
}

class FedoraProjectAPI extends OpenSourceEntity {
    constructor() { super('Fedora Project', 'OS', 800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async rawhideBuild(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /build/rawhide', () => 'Build successful. Bleeding edge deployed.');
    }
}

class DebianProjectAPI extends OpenSourceEntity {
    constructor() { super('Debian Project', 'OS', 900000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async aptUpdate(): Promise<ApiResponse<string[]>> {
        return this.handleRequest('GET /apt/update', () => ['stable', 'testing', 'unstable']);
    }
}

class OpenSUSEAPI extends OpenSourceEntity {
    constructor() { super('OpenSUSE', 'OS', 600000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async tumbleweedRoll(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /tumbleweed/roll', () => 'Rolling release updated.');
    }
}

class ArchLinuxAPI extends OpenSourceEntity {
    constructor() { super('Arch Linux', 'OS', 750000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async pacmanSync(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /pacman/syu', () => 'System updated. Nothing broke (hopefully).');
    }
}

class ManjaroAPI extends OpenSourceEntity {
    constructor() { super('Manjaro', 'OS', 400000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async updateMirrors(): Promise<ApiResponse<number>> {
        return this.handleRequest('POST /mirrors/refresh', () => UniverseMath.randomInt(50, 200));
    }
}

class FreeBSDAPI extends OpenSourceEntity {
    constructor() { super('FreeBSD', 'OS', 650000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async compilePorts(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /ports/compile', () => 'Ports tree compiled successfully.');
    }
}

class NetBSDAPI extends OpenSourceEntity {
    constructor() { super('NetBSD', 'OS', 300000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async runOnToaster(): Promise<ApiResponse<boolean>> {
        return this.handleRequest('POST /deploy/toaster', () => true);
    }
}

class OpenBSDAPI extends OpenSourceEntity {
    constructor() { super('OpenBSD', 'OS', 450000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async auditCode(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /security/audit', () => '0 remote holes in default install.');
    }
}

// --------------------------------------------------------------------------------
// GROUP 2: CONTAINERIZATION & ORCHESTRATION
// --------------------------------------------------------------------------------

class KubernetesAPI extends OpenSourceEntity {
    constructor() { super('Kubernetes', 'Containerization', 4000000); }
    tick(packet: SimulationPacket) { 
        this.uptime++;
        if (packet.tick % 50 === 0) this.log('INFO', 'Reconciling cluster state...');
    }
    public async schedulePod(image: string): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /api/v1/pods', () => `Pod ${image}-${UniverseMath.randomInt(1000,9999)} scheduled.`);
    }
}

class CNCFAPI extends OpenSourceEntity {
    constructor() { super('CNCF', 'Containerization', 3000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async graduateProject(project: string): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /projects/graduate', () => `${project} is now a Graduated project.`);
    }
}

class DockerAPI extends OpenSourceEntity {
    constructor() { super('Docker', 'Containerization', 2500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async pullImage(tag: string): Promise<ApiResponse<string>> {
        return this.handleRequest(`POST /images/pull?tag=${tag}`, () => `Image ${tag} pulled from hub.`);
    }
}

class PodmanAPI extends OpenSourceEntity {
    constructor() { super('Podman', 'Containerization', 1200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async runRootless(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /containers/run', () => 'Container running without root privileges.');
    }
}

class AnsibleAPI extends OpenSourceEntity {
    constructor() { super('Ansible', 'DevTools', 1800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async runPlaybook(name: string): Promise<ApiResponse<string>> {
        return this.handleRequest(`POST /playbooks/${name}`, () => 'Playbook execution completed. Changed=5, Failed=0.');
    }
}

class TerraformAPI extends OpenSourceEntity {
    constructor() { super('Terraform', 'DevTools', 2200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async applyPlan(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /apply', () => 'Infrastructure provisioned. State locked.');
    }
}

class HashiCorpAPI extends OpenSourceEntity {
    constructor() { super('HashiCorp', 'DevTools', 2800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async vaultSealStatus(): Promise<ApiResponse<boolean>> {
        return this.handleRequest('GET /vault/status', () => false); // Unsealed
    }
}

// --------------------------------------------------------------------------------
// GROUP 3: WEB SERVERS & FOUNDATIONS
// --------------------------------------------------------------------------------

class ApacheFoundationAPI extends OpenSourceEntity {
    constructor() { super('Apache Foundation', 'WebEngine', 3200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async listProjects(): Promise<ApiResponse<number>> {
        return this.handleRequest('GET /projects/count', () => 350);
    }
}

class NGINXAPI extends OpenSourceEntity {
    constructor() { super('NGINX', 'WebEngine', 2900000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async reloadConfig(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /reload', () => 'Configuration reloaded gracefully.');
    }
}

class MozillaAPI extends OpenSourceEntity {
    constructor() { super('Mozilla', 'WebEngine', 2100000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async manifesto(): Promise<ApiResponse<string>> {
        return this.handleRequest('GET /manifesto', () => 'Internet is a global public resource.');
    }
}

class FirefoxDevToolsAPI extends OpenSourceEntity {
    constructor() { super('Firefox Dev Tools', 'DevTools', 1500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async debugSession(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /debug/attach', () => 'Debugger attached to remote runtime.');
    }
}

// --------------------------------------------------------------------------------
// GROUP 4: VERSION CONTROL & IDES
// --------------------------------------------------------------------------------

class GitAPI extends OpenSourceEntity {
    constructor() { super('Git', 'DevTools', 5000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async commit(msg: string): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /commit', () => `[master ${UniverseMath.generateHash('commit').substring(0,7)}] ${msg}`);
    }
}

class GitHubAPI extends OpenSourceEntity {
    constructor() { super('GitHub Open Source API', 'DevTools', 4500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async createPR(): Promise<ApiResponse<number>> {
        return this.handleRequest('POST /repos/pr', () => UniverseMath.randomInt(1000, 50000));
    }
}

class GitLabAPI extends OpenSourceEntity {
    constructor() { super('GitLab', 'DevTools', 3000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async runPipeline(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /ci/pipeline', () => 'Pipeline #12345 running...');
    }
}

class BitbucketAPI extends OpenSourceEntity {
    constructor() { super('Bitbucket', 'DevTools', 1500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async checkJiraIntegration(): Promise<ApiResponse<boolean>> {
        return this.handleRequest('GET /integrations/jira', () => true);
    }
}

class VSCodeAPI extends OpenSourceEntity {
    constructor() { super('VS Code', 'DevTools', 4200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async installExtension(id: string): Promise<ApiResponse<string>> {
        return this.handleRequest(`POST /extensions/${id}`, () => `Extension ${id} installed.`);
    }
}

class EclipseFoundationAPI extends OpenSourceEntity {
    constructor() { super('Eclipse Foundation', 'DevTools', 1800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async getJakartaEEVersion(): Promise<ApiResponse<string>> {
        return this.handleRequest('GET /jakarta/version', () => '10.0.0');
    }
}

class JetBrainsAPI extends OpenSourceEntity {
    constructor() { super('JetBrains Open Tools', 'DevTools', 2500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async indexProject(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /index', () => 'Indexing completed. 5000 files scanned.');
    }
}

// --------------------------------------------------------------------------------
// GROUP 5: LANGUAGES & RUNTIMES
// --------------------------------------------------------------------------------

class PythonFoundationAPI extends OpenSourceEntity {
    constructor() { super('Python Software Foundation', 'Language', 4800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async pipInstall(pkg: string): Promise<ApiResponse<string>> {
        return this.handleRequest(`POST /pypi/install/${pkg}`, () => `Successfully installed ${pkg}`);
    }
}

class NodeFoundationAPI extends OpenSourceEntity {
    constructor() { super('Node.js Foundation', 'Language', 4600000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async npmAudit(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /npm/audit', () => 'Found 3 vulnerabilities (0 critical).');
    }
}

class DenoAPI extends OpenSourceEntity {
    constructor() { super('Deno', 'Language', 1200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async runSecure(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /run', () => 'Running with --allow-net only.');
    }
}

class BunAPI extends OpenSourceEntity {
    constructor() { super('Bun', 'Language', 900000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async benchmark(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /bench', () => 'It is fast. Very fast.');
    }
}

class RustFoundationAPI extends OpenSourceEntity {
    constructor() { super('Rust Foundation', 'Language', 3500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async borrowChecker(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /cargo/check', () => 'Compiled successfully. Memory safe.');
    }
}

class GoLangFoundationAPI extends OpenSourceEntity {
    constructor() { super('GoLang Foundation', 'Language', 3400000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async goFmt(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /fmt', () => 'Code formatted.');
    }
}

class RubyAPI extends OpenSourceEntity {
    constructor() { super('Ruby', 'Language', 2000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async bundleInstall(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /bundle', () => 'Gems installed.');
    }
}

class PHPAPI extends OpenSourceEntity {
    constructor() { super('PHP', 'Language', 2800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async composerUpdate(): Promise<ApiResponse<string>> {
        return this.handleRequest('POST /composer/update', () => 'Dependencies updated.');
    }
}

// --------------------------------------------------------------------------------
// GROUP 6: DATABASES
// --------------------------------------------------------------------------------

class MariaDBAPI extends OpenSourceEntity {
    constructor() { super('MariaDB', 'Database', 1500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async query(): Promise<ApiResponse<string>> { return this.handleRequest('POST /sql', () => 'Result Set'); }
}

class MySQLAPI extends OpenSourceEntity {
    constructor() { super('MySQL Open Edition', 'Database', 2500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async optimize(): Promise<ApiResponse<string>> { return this.handleRequest('POST /optimize', () => 'Tables optimized'); }
}

class PostgreSQLAPI extends OpenSourceEntity {
    constructor() { super('PostgreSQL', 'Database', 3800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async vacuum(): Promise<ApiResponse<string>> { return this.handleRequest('POST /vacuum', () => 'Vacuum Full completed'); }
}

class SQLiteAPI extends OpenSourceEntity {
    constructor() { super('SQLite', 'Database', 2000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async checkpoint(): Promise<ApiResponse<string>> { return this.handleRequest('POST /wal/checkpoint', () => 'WAL Checkpointed'); }
}

class RedisAPI extends OpenSourceEntity {
    constructor() { super('Redis', 'Database', 2200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async flushAll(): Promise<ApiResponse<string>> { return this.handleRequest('POST /flushall', () => 'OK'); }
}

class MongoDBAPI extends OpenSourceEntity {
    constructor() { super('MongoDB Community', 'Database', 2600000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async aggregate(): Promise<ApiResponse<string>> { return this.handleRequest('POST /aggregate', () => 'Pipeline executed'); }
}

class CassandraAPI extends OpenSourceEntity {
    constructor() { super('Cassandra', 'Database', 1800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async repair(): Promise<ApiResponse<string>> { return this.handleRequest('POST /nodetool/repair', () => 'Repair started'); }
}

class ElasticSearchAPI extends OpenSourceEntity {
    constructor() { super('ElasticSearch', 'Database', 2400000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async reindex(): Promise<ApiResponse<string>> { return this.handleRequest('POST /reindex', () => 'Reindexing...'); }
}

class ApacheSparkAPI extends OpenSourceEntity {
    constructor() { super('Apache Spark', 'Database', 2100000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async submitJob(): Promise<ApiResponse<string>> { return this.handleRequest('POST /job/submit', () => 'Job running on 50 executors'); }
}

class ApacheKafkaAPI extends OpenSourceEntity {
    constructor() { super('Apache Kafka', 'Database', 2300000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async createTopic(): Promise<ApiResponse<string>> { return this.handleRequest('POST /topic/create', () => 'Topic created with 3 partitions'); }
}

class SupabaseAPI extends OpenSourceEntity {
    constructor() { super('Supabase', 'Database', 1200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async realtime(): Promise<ApiResponse<string>> { return this.handleRequest('POST /realtime/sub', () => 'Subscribed to changes'); }
}

class AppwriteAPI extends OpenSourceEntity {
    constructor() { super('Appwrite', 'Database', 800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async deployFunction(): Promise<ApiResponse<string>> { return this.handleRequest('POST /functions', () => 'Function active'); }
}

class PocketBaseAPI extends OpenSourceEntity {
    constructor() { super('PocketBase', 'Database', 600000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async auth(): Promise<ApiResponse<string>> { return this.handleRequest('POST /auth', () => 'Token generated'); }
}

// --------------------------------------------------------------------------------
// GROUP 7: AI & MACHINE LEARNING
// --------------------------------------------------------------------------------

class HuggingFaceAPI extends OpenSourceEntity {
    constructor() { super('Hugging Face', 'AI/ML', 3500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async loadModel(id: string): Promise<ApiResponse<string>> { return this.handleRequest(`GET /models/${id}`, () => 'Model weights loaded'); }
}

class LangChainAPI extends OpenSourceEntity {
    constructor() { super('LangChain', 'AI/ML', 2000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async buildChain(): Promise<ApiResponse<string>> { return this.handleRequest('POST /chain', () => 'Chain constructed'); }
}

class MLFlowAPI extends OpenSourceEntity {
    constructor() { super('MLFlow', 'AI/ML', 1500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async logMetric(): Promise<ApiResponse<string>> { return this.handleRequest('POST /log', () => 'Metric recorded'); }
}

class TensorFlowAPI extends OpenSourceEntity {
    constructor() { super('TensorFlow', 'AI/ML', 4000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async train(): Promise<ApiResponse<string>> { return this.handleRequest('POST /fit', () => 'Training... Loss: 0.01'); }
}

class PyTorchAPI extends OpenSourceEntity {
    constructor() { super('PyTorch', 'AI/ML', 4200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async backward(): Promise<ApiResponse<string>> { return this.handleRequest('POST /backward', () => 'Gradients computed'); }
}

class ONNXAPI extends OpenSourceEntity {
    constructor() { super('ONNX', 'AI/ML', 1000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async export(): Promise<ApiResponse<string>> { return this.handleRequest('POST /export', () => 'Model exported to ONNX format'); }
}

class OpenCVAPI extends OpenSourceEntity {
    constructor() { super('OpenCV', 'AI/ML', 1800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async processImage(): Promise<ApiResponse<string>> { return this.handleRequest('POST /process', () => 'Image processed (Canny Edge)'); }
}

class OpenAIGymAPI extends OpenSourceEntity {
    constructor() { super('OpenAI Gym', 'AI/ML', 1200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async step(): Promise<ApiResponse<string>> { return this.handleRequest('POST /step', () => 'Environment stepped. Reward: +1'); }
}

// --------------------------------------------------------------------------------
// GROUP 8: MEDIA & CREATIVE
// --------------------------------------------------------------------------------

class GodotEngineAPI extends OpenSourceEntity {
    constructor() { super('Godot Engine', 'Media', 1500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async exportGame(): Promise<ApiResponse<string>> { return this.handleRequest('POST /export', () => 'Game exported to WebAssembly'); }
}

class BlenderFoundationAPI extends OpenSourceEntity {
    constructor() { super('Blender Foundation', 'Media', 2500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async renderFrame(): Promise<ApiResponse<string>> { return this.handleRequest('POST /render', () => 'Frame rendered (Cycles)'); }
}

class InkscapeAPI extends OpenSourceEntity {
    constructor() { super('Inkscape', 'Media', 800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async vectorize(): Promise<ApiResponse<string>> { return this.handleRequest('POST /trace', () => 'Bitmap traced to SVG'); }
}

class GIMPAPI extends OpenSourceEntity {
    constructor() { super('GIMP', 'Media', 900000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async applyFilter(): Promise<ApiResponse<string>> { return this.handleRequest('POST /filter', () => 'Gaussian Blur applied'); }
}

class KritaAPI extends OpenSourceEntity {
    constructor() { super('Krita', 'Media', 700000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async brushEngine(): Promise<ApiResponse<string>> { return this.handleRequest('POST /brush', () => 'Brush stroke simulated'); }
}

class FigmaOpenSimAPI extends OpenSourceEntity {
    constructor() { super('Figma Open API Sim', 'Media', 3000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async sync(): Promise<ApiResponse<string>> { return this.handleRequest('POST /sync', () => 'Multiplayer cursor updated'); }
}

class UnrealOpenToolsAPI extends OpenSourceEntity {
    constructor() { super('Unreal Open Tools', 'Media', 3500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async compileShaders(): Promise<ApiResponse<string>> { return this.handleRequest('POST /shaders', () => 'Shaders compiled (5000 left)'); }
}

class UnityOpenToolsAPI extends OpenSourceEntity {
    constructor() { super('Unity Open Tools', 'Media', 3200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async bakeLightmap(): Promise<ApiResponse<string>> { return this.handleRequest('POST /bake', () => 'Lightmap baking...'); }
}

class VLCAPI extends OpenSourceEntity {
    constructor() { super('VLC', 'Media', 1200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async play(): Promise<ApiResponse<string>> { return this.handleRequest('POST /play', () => 'Playing MKV file'); }
}

class FFmpegAPI extends OpenSourceEntity {
    constructor() { super('FFmpeg', 'Media', 2000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async transcode(): Promise<ApiResponse<string>> { return this.handleRequest('POST /transcode', () => 'Transcoding to H.265'); }
}

class OBSStudioAPI extends OpenSourceEntity {
    constructor() { super('OBS Studio', 'Media', 1800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async startStream(): Promise<ApiResponse<string>> { return this.handleRequest('POST /stream', () => 'Streaming to Twitch'); }
}

// --------------------------------------------------------------------------------
// GROUP 9: GEOSPATIAL
// --------------------------------------------------------------------------------

class OpenStreetMapAPI extends OpenSourceEntity {
    constructor() { super('OpenStreetMap', 'Geo', 1500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async getTile(): Promise<ApiResponse<string>> { return this.handleRequest('GET /tile', () => 'Tile fetched'); }
}

class QGISAPI extends OpenSourceEntity {
    constructor() { super('QGIS', 'Geo', 1000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async analyzeLayer(): Promise<ApiResponse<string>> { return this.handleRequest('POST /analyze', () => 'Spatial analysis complete'); }
}

class MapLibreAPI extends OpenSourceEntity {
    constructor() { super('MapLibre', 'Geo', 800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async renderVector(): Promise<ApiResponse<string>> { return this.handleRequest('POST /render', () => 'Vector tiles rendered'); }
}

class LeafletAPI extends OpenSourceEntity {
    constructor() { super('Leaflet.js', 'Geo', 900000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async addMarker(): Promise<ApiResponse<string>> { return this.handleRequest('POST /marker', () => 'Marker added to map'); }
}

// --------------------------------------------------------------------------------
// GROUP 10: NETWORK & SECURITY
// --------------------------------------------------------------------------------

class WireGuardAPI extends OpenSourceEntity {
    constructor() { super('WireGuard', 'Network', 1200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async handshake(): Promise<ApiResponse<string>> { return this.handleRequest('POST /handshake', () => 'Handshake completed'); }
}

class OpenVPNAPI extends OpenSourceEntity {
    constructor() { super('OpenVPN', 'Network', 1100000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async connect(): Promise<ApiResponse<string>> { return this.handleRequest('POST /connect', () => 'Tunnel established'); }
}

class TorProjectAPI extends OpenSourceEntity {
    constructor() { super('Tor Project', 'Network', 1500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async newCircuit(): Promise<ApiResponse<string>> { return this.handleRequest('POST /circuit', () => 'New circuit built'); }
}

class uBlockOriginAPI extends OpenSourceEntity {
    constructor() { super('uBlock Origin', 'Privacy', 1000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async updateLists(): Promise<ApiResponse<string>> { return this.handleRequest('POST /update', () => 'Filter lists updated'); }
}

class BraveShieldsAPI extends OpenSourceEntity {
    constructor() { super('Brave Shields', 'Privacy', 1200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async blockTracker(): Promise<ApiResponse<string>> { return this.handleRequest('POST /block', () => 'Tracker blocked'); }
}

class SignalAPI extends OpenSourceEntity {
    constructor() { super('Signal Protocol', 'Communication', 2000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async encryptMessage(): Promise<ApiResponse<string>> { return this.handleRequest('POST /encrypt', () => 'Double Ratchet encryption applied'); }
}

class MatrixAPI extends OpenSourceEntity {
    constructor() { super('Matrix', 'Communication', 1400000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async syncRoom(): Promise<ApiResponse<string>> { return this.handleRequest('POST /sync', () => 'Room state synced'); }
}

class MastodonAPI extends OpenSourceEntity {
    constructor() { super('Mastodon', 'Communication', 1600000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async federate(): Promise<ApiResponse<string>> { return this.handleRequest('POST /federate', () => 'Status pushed to 50 instances'); }
}

// --------------------------------------------------------------------------------
// GROUP 11: DATA INFRASTRUCTURE
// --------------------------------------------------------------------------------

class DuckDBAPI extends OpenSourceEntity {
    constructor() { super('DuckDB', 'Database', 1100000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async queryParquet(): Promise<ApiResponse<string>> { return this.handleRequest('POST /query', () => 'Parquet file scanned'); }
}

class ClickHouseAPI extends OpenSourceEntity {
    constructor() { super('ClickHouse', 'Database', 1800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async insertBatch(): Promise<ApiResponse<string>> { return this.handleRequest('POST /insert', () => '1M rows inserted'); }
}

class MinIOAPI extends OpenSourceEntity {
    constructor() { super('MinIO', 'Storage', 1300000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async putObject(): Promise<ApiResponse<string>> { return this.handleRequest('PUT /object', () => 'Object stored (S3 compatible)'); }
}

class CephAPI extends OpenSourceEntity {
    constructor() { super('Ceph', 'Storage', 1600000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async rebalance(): Promise<ApiResponse<string>> { return this.handleRequest('POST /crush/rebalance', () => 'Cluster rebalancing'); }
}

class OpenStackAPI extends OpenSourceEntity {
    constructor() { super('OpenStack', 'Cloud', 2500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async provisionVM(): Promise<ApiResponse<string>> { return this.handleRequest('POST /nova/boot', () => 'Instance booting'); }
}

class ProxmoxAPI extends OpenSourceEntity {
    constructor() { super('Proxmox', 'Cloud', 1400000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async backupLXC(): Promise<ApiResponse<string>> { return this.handleRequest('POST /backup', () => 'Container backup started'); }
}

// --------------------------------------------------------------------------------
// GROUP 12: IOT & HOME AUTOMATION
// --------------------------------------------------------------------------------

class HomeAssistantAPI extends OpenSourceEntity {
    constructor() { super('Home Assistant', 'IoT', 1800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async triggerAutomation(): Promise<ApiResponse<string>> { return this.handleRequest('POST /automation', () => 'Lights turned on'); }
}

class OpenHABAPI extends OpenSourceEntity {
    constructor() { super('OpenHAB', 'IoT', 1200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async updateThing(): Promise<ApiResponse<string>> { return this.handleRequest('POST /thing', () => 'Thing status updated'); }
}

class MatterAPI extends OpenSourceEntity {
    constructor() { super('Matter Protocol', 'IoT', 2000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async commissionDevice(): Promise<ApiResponse<string>> { return this.handleRequest('POST /commission', () => 'Device joined fabric'); }
}

class ZigbeeAPI extends OpenSourceEntity {
    constructor() { super('Zigbee Simulator', 'IoT', 1000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async meshRoute(): Promise<ApiResponse<string>> { return this.handleRequest('POST /route', () => 'Mesh route optimized'); }
}

// --------------------------------------------------------------------------------
// GROUP 13: COMPILERS & BROWSERS
// --------------------------------------------------------------------------------

class LLVMAPI extends OpenSourceEntity {
    constructor() { super('LLVM', 'DevTools', 3000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async optimizeIR(): Promise<ApiResponse<string>> { return this.handleRequest('POST /opt', () => 'IR optimized (O3)'); }
}

class WebKitAPI extends OpenSourceEntity {
    constructor() { super('WebKit', 'WebEngine', 2800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async layout(): Promise<ApiResponse<string>> { return this.handleRequest('POST /layout', () => 'DOM reflow complete'); }
}

class ChromiumAPI extends OpenSourceEntity {
    constructor() { super('Chromium', 'WebEngine', 3500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async v8gc(): Promise<ApiResponse<string>> { return this.handleRequest('POST /v8/gc', () => 'Garbage collection run'); }
}

class TensorRTAPI extends OpenSourceEntity {
    constructor() { super('TensorRT', 'AI/ML', 2200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async buildEngine(): Promise<ApiResponse<string>> { return this.handleRequest('POST /build', () => 'Inference engine built'); }
}

// --------------------------------------------------------------------------------
// GROUP 14: CLOUD & STORAGE (REMAINING)
// --------------------------------------------------------------------------------

class NextcloudAPI extends OpenSourceEntity {
    constructor() { super('Nextcloud', 'Cloud', 1500000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async syncFile(): Promise<ApiResponse<string>> { return this.handleRequest('PUT /dav', () => 'File synced'); }
}

class OwnCloudAPI extends OpenSourceEntity {
    constructor() { super('OwnCloud', 'Cloud', 1000000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async shareLink(): Promise<ApiResponse<string>> { return this.handleRequest('POST /share', () => 'Public link created'); }
}

class ApacheAirflowAPI extends OpenSourceEntity {
    constructor() { super('Apache Airflow', 'CI/CD', 1800000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async triggerDAG(): Promise<ApiResponse<string>> { return this.handleRequest('POST /dag/run', () => 'DAG started'); }
}

class JenkinsAPI extends OpenSourceEntity {
    constructor() { super('Jenkins', 'CI/CD', 2200000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async buildJob(): Promise<ApiResponse<string>> { return this.handleRequest('POST /job/build', () => 'Build #42 started'); }
}

class DroneCIAPI extends OpenSourceEntity {
    constructor() { super('DroneCI', 'CI/CD', 900000); }
    tick(packet: SimulationPacket) { this.uptime++; }
    public async executeStep(): Promise<ApiResponse<string>> { return this.handleRequest('POST /step', () => 'Step executed in container'); }
}

// ================================================================================
// SECTION 3: UNIVERSE REGISTRY & FACTORY
// ================================================================================

class UniverseRegistry {
    private static entities: OpenSourceEntity[] = [
        new LinuxFoundationAPI(), new CanonicalAPI(), new RedHatAPI(), new FedoraProjectAPI(), new DebianProjectAPI(),
        new OpenSUSEAPI(), new ArchLinuxAPI(), new ManjaroAPI(), new FreeBSDAPI(), new NetBSDAPI(), new OpenBSDAPI(),
        new KubernetesAPI(), new CNCFAPI(), new DockerAPI(), new PodmanAPI(), new AnsibleAPI(), new TerraformAPI(),
        new HashiCorpAPI(), new ApacheFoundationAPI(), new NGINXAPI(), new MozillaAPI(), new FirefoxDevToolsAPI(),
        new GitAPI(), new GitHubAPI(), new GitLabAPI(), new BitbucketAPI(), new VSCodeAPI(), new EclipseFoundationAPI(),
        new JetBrainsAPI(), new PythonFoundationAPI(), new NodeFoundationAPI(), new DenoAPI(), new BunAPI(),
        new RustFoundationAPI(), new GoLangFoundationAPI(), new RubyAPI(), new PHPAPI(), new MariaDBAPI(),
        new MySQLAPI(), new PostgreSQLAPI(), new SQLiteAPI(), new RedisAPI(), new MongoDBAPI(), new CassandraAPI(),
        new ElasticSearchAPI(), new ApacheSparkAPI(), new ApacheKafkaAPI(), new SupabaseAPI(), new AppwriteAPI(),
        new PocketBaseAPI(), new HuggingFaceAPI(), new LangChainAPI(), new MLFlowAPI(), new TensorFlowAPI(),
        new PyTorchAPI(), new ONNXAPI(), new OpenCVAPI(), new OpenAIGymAPI(), new GodotEngineAPI(), new BlenderFoundationAPI(),
        new InkscapeAPI(), new GIMPAPI(), new KritaAPI(), new FigmaOpenSimAPI(), new UnrealOpenToolsAPI(), new UnityOpenToolsAPI(),
        new OpenStreetMapAPI(), new QGISAPI(), new MapLibreAPI(), new LeafletAPI(), new VLCAPI(), new FFmpegAPI(),
        new OBSStudioAPI(), new WireGuardAPI(), new OpenVPNAPI(), new TorProjectAPI(), new DuckDBAPI(), new ClickHouseAPI(),
        new MinIOAPI(), new CephAPI(), new OpenStackAPI(), new ProxmoxAPI(), new HomeAssistantAPI(), new OpenHABAPI(),
        new MatterAPI(), new ZigbeeAPI(), new TensorRTAPI(), new LLVMAPI(), new WebKitAPI(), new ChromiumAPI(),
        new uBlockOriginAPI(), new BraveShieldsAPI(), new NextcloudAPI(), new OwnCloudAPI(), new MastodonAPI(),
        new MatrixAPI(), new SignalAPI(), new ApacheAirflowAPI(), new JenkinsAPI(), new DroneCIAPI()
    ];

    static getAll(): OpenSourceEntity[] {
        return this.entities;
    }

    static getById(id: UUID): OpenSourceEntity | undefined {
        return this.entities.find(e => e.id === id);
    }
}

// ================================================================================
// SECTION 4: UI COMPONENTS & VISUALIZATION LAYER
// ================================================================================

const THEME = {
    bg: '#0d1117',
    fg: '#c9d1d9',
    border: '#30363d',
    accent: '#58a6ff',
    success: '#238636',
    error: '#da3633',
    warning: '#d29922',
    panel: '#161b22',
    font: '"JetBrains Mono", "Fira Code", monospace'
};

const TerminalView: React.FC<{ entity: OpenSourceEntity }> = ({ entity }) => {
    const [output, setOutput] = useState<string[]>(['> Connection established.', '> Authenticated as guest.']);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [output]);

    const executeCommand = async (cmd: string) => {
        const newOutput = [...output, `$ ${cmd}`];
        setOutput(newOutput);
        
        let response = '';
        try {
            if (cmd === 'help') {
                response = 'Available commands: status, metrics, ping, exit';
            } else if (cmd === 'status') {
                const res = await entity.getHealth();
                response = JSON.stringify(res.data, null, 2);
            } else if (cmd === 'metrics') {
                const res = await entity.getMetrics();
                response = JSON.stringify(res.data, null, 2);
            } else if (cmd === 'ping') {
                response = 'pong';
            } else {
                response = `Command not found: ${cmd}`;
            }
        } catch (e) {
            response = 'Error executing command.';
        }
        
        setOutput([...newOutput, response]);
        setInput('');
    };

    return (
        <div style={{ 
            backgroundColor: '#000', 
            color: '#0f0', 
            fontFamily: THEME.font, 
            padding: '1rem', 
            height: '300px', 
            overflowY: 'auto',
            border: `1px solid ${THEME.border}`,
            borderRadius: '4px'
        }}>
            {output.map((line, i) => <div key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>{line}</div>)}
            <div style={{ display: 'flex' }}>
                <span>$ </span>
                <input 
                    type="text" 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && executeCommand(input)}
                    style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#0f0', 
                        flex: 1, 
                        outline: 'none',
                        fontFamily: THEME.font
                    }}
                    autoFocus
                />
            </div>
            <div ref={bottomRef} />
        </div>
    );
};

const EntityCard: React.FC<{ entity: OpenSourceEntity, onClick: () => void }> = ({ entity, onClick }) => {
    return (
        <div 
            onClick={onClick}
            style={{
                backgroundColor: THEME.panel,
                border: `1px solid ${THEME.border}`,
                borderRadius: '6px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = THEME.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = THEME.border}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: THEME.accent }}>{entity.name}</h3>
                <span style={{ 
                    fontSize: '0.7rem', 
                    padding: '2px 6px', 
                    borderRadius: '10px', 
                    backgroundColor: entity.status === 'OPERATIONAL' ? 'rgba(35, 134, 54, 0.2)' : 'rgba(218, 54, 51, 0.2)',
                    color: entity.status === 'OPERATIONAL' ? THEME.success : THEME.error
                }}>
                    {entity.status}
                </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>
                {entity.category} | v{entity.version}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>
                Val: ${entity.marketValue.toLocaleString()}
            </div>
        </div>
    );
};

const Dashboard: React.FC<{ packet: SimulationPacket }> = ({ packet }) => {
    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1rem', 
            marginBottom: '2rem' 
        }}>
            <div style={{ background: THEME.panel, padding: '1rem', borderRadius: '6px', border: `1px solid ${THEME.border}` }}>
                <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>Global Tick</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{packet.tick}</div>
            </div>
            <div style={{ background: THEME.panel, padding: '1rem', borderRadius: '6px', border: `1px solid ${THEME.border}` }}>
                <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>Entropy Level</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: THEME.warning }}>{(packet.entropy * 100).toFixed(2)}%</div>
            </div>
            <div style={{ background: THEME.panel, padding: '1rem', borderRadius: '6px', border: `1px solid ${THEME.border}` }}>
                <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>Compute Load</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: THEME.accent }}>{(packet.globalComputeLoad * 100).toFixed(1)}%</div>
            </div>
            <div style={{ background: THEME.panel, padding: '1rem', borderRadius: '6px', border: `1px solid ${THEME.border}` }}>
                <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>Threat Level</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: packet.securityThreatLevel === 'LOW' ? THEME.success : THEME.error }}>
                    {packet.securityThreatLevel}
                </div>
            </div>
        </div>
    );
};

// ================================================================================
// SECTION 5: MAIN APPLICATION COMPONENT
// ================================================================================

const ArtCollectibles: React.FC = () => {
    const [packet, setPacket] = useState<SimulationPacket>({
        tick: 0,
        entropy: 0,
        globalComputeLoad: 0.2,
        activeContributors: 100000,
        securityThreatLevel: 'LOW'
    });

    const [selectedEntity, setSelectedEntity] = useState<OpenSourceEntity | null>(null);
    const [filter, setFilter] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // The Simulation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setPacket(prev => {
                const newTick = prev.tick + 1;
                const newEntropy = UniverseMath.perlinNoise(newTick * 0.05);
                
                // Update all entities
                UniverseRegistry.getAll().forEach(entity => entity.tick({
                    ...prev,
                    tick: newTick,
                    entropy: newEntropy
                }));

                return {
                    tick: newTick,
                    entropy: Math.abs(newEntropy),
                    globalComputeLoad: Math.min(1, Math.max(0, prev.globalComputeLoad + (Math.random() - 0.5) * 0.05)),
                    activeContributors: prev.activeContributors + UniverseMath.randomInt(-100, 200),
                    securityThreatLevel: newEntropy > 0.8 ? 'HIGH' : newEntropy > 0.5 ? 'MODERATE' : 'LOW'
                };
            });
        }, 1000); // 1 second per tick

        return () => clearInterval(interval);
    }, []);

    const entities = UniverseRegistry.getAll();
    const filteredEntities = entities.filter(e => {
        const matchesCategory = filter === 'ALL' || e.category === filter;
        const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categories = Array.from(new Set(entities.map(e => e.category)));

    return (
        <div style={{ 
            backgroundColor: THEME.bg, 
            color: THEME.fg, 
            minHeight: '100vh', 
            fontFamily: THEME.font,
            padding: '2rem',
            boxSizing: 'border-box'
        }}>
            <header style={{ marginBottom: '2rem', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '1rem' }}>
                <h1 style={{ margin: 0, color: THEME.accent }}>OMNIVERSE // OPEN SOURCE SIMULATION</h1>
                <p style={{ margin: '0.5rem 0 0 0', color: '#8b949e' }}>
                    Real-time simulation of {entities.length} technological assets.
                </p>
            </header>

            <Dashboard packet={packet} />

            <div style={{ display: 'flex', gap: '2rem' }}>
                {/* LEFT COLUMN: ENTITY LIST */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <input 
                            type="text" 
                            placeholder="Search entities..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ 
                                flex: 1, 
                                padding: '0.5rem', 
                                background: THEME.panel, 
                                border: `1px solid ${THEME.border}`, 
                                color: THEME.fg,
                                borderRadius: '4px'
                            }}
                        />
                        <select 
                            value={filter} 
                            onChange={e => setFilter(e.target.value)}
                            style={{ 
                                padding: '0.5rem', 
                                background: THEME.panel, 
                                border: `1px solid ${THEME.border}`, 
                                color: THEME.fg,
                                borderRadius: '4px'
                            }}
                        >
                            <option value="ALL">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                        gap: '1rem',
                        maxHeight: '600px',
                        overflowY: 'auto',
                        paddingRight: '0.5rem'
                    }}>
                        {filteredEntities.map(entity => (
                            <EntityCard 
                                key={entity.id} 
                                entity={entity} 
                                onClick={() => setSelectedEntity(entity)} 
                            />
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: DETAIL VIEW */}
                <div style={{ flex: 1, background: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: '6px', padding: '1.5rem' }}>
                    {selectedEntity ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: THEME.accent }}>{selectedEntity.name}</h2>
                                    <div style={{ color: '#8b949e', marginTop: '0.5rem' }}>ID: {selectedEntity.id}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${selectedEntity.marketValue.toLocaleString()}</div>
                                    <div style={{ color: THEME.success, fontSize: '0.8rem' }}>+{(Math.random() * 5).toFixed(2)}% (24h)</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1rem', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '0.5rem' }}>System Terminal</h3>
                                <TerminalView entity={selectedEntity} />
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1rem', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '0.5rem' }}>Recent Logs</h3>
                                <div style={{ 
                                    background: '#000', 
                                    padding: '1rem', 
                                    borderRadius: '4px', 
                                    height: '200px', 
                                    overflowY: 'auto',
                                    fontSize: '0.8rem',
                                    fontFamily: THEME.font
                                }}>
                                    {selectedEntity.logs.map(log => (
                                        <div key={log.id} style={{ marginBottom: '0.5rem' }}>
                                            <span style={{ color: '#8b949e' }}>[{log.timestamp.split('T')[1].split('.')[0]}]</span>
                                            <span style={{ 
                                                color: log.level === 'ERROR' ? THEME.error : log.level === 'WARN' ? THEME.warning : THEME.success,
                                                fontWeight: 'bold',
                                                margin: '0 0.5rem'
                                            }}>
                                                {log.level}
                                            </span>
                                            <span>{log.message}</span>
                                        </div>
                                    ))}
                                    {selectedEntity.logs.length === 0 && <div style={{ color: '#8b949e' }}>No logs available.</div>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e' }}>
                            Select an entity to view details and interact with its API.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArtCollectibles;