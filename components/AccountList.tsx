import React, { useState, useEffect, useReducer, useRef, useMemo, useCallback } from 'react';

/**
 * THE OMNI-LEDGER UNIVERSE
 * 
 * A self-contained, procedural simulation of the global Open Source Financial Ecosystem.
 * This system transforms the concept of a simple "Account List" into a living, breathing
 * digital economy where open-source projects are the currency, the assets, and the banks.
 * 
 * 100+ Simulated Internal APIs.
 * Zero External Dependencies.
 * Infinite Procedural Evolution.
 */

// -----------------------------------------------------------------------------
// SECTION I: THE MATHEMATICAL CORE & UTILITIES
// -----------------------------------------------------------------------------

const UNIVERSE_SEED = 0xCAFEBABE;
const TICK_RATE_MS = 1000;

class OmniMath {
  static seed = UNIVERSE_SEED;

  static random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  static range(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (this.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }

  static generateSeries(length: number, volatility: number): number[] {
    const data = [100];
    for (let i = 1; i < length; i++) {
      const change = (this.random() - 0.5) * volatility;
      data.push(Math.max(0, data[i - 1] + change));
    }
    return data;
  }
}

// -----------------------------------------------------------------------------
// SECTION II: THE CORE DATA STRUCTURES (DNA)
// -----------------------------------------------------------------------------

type AccountStatus = 'active' | 'dormant' | 'compiling' | 'deploying' | 'forked' | 'merged' | 'deprecated';
type AssetType = 'kernel' | 'container' | 'database' | 'language' | 'framework' | 'protocol' | 'tooling';

interface Transaction {
  id: string;
  timestamp: number;
  amount: number;
  description: string;
  hash: string;
}

interface SecurityContext {
  encryptionLevel: 'AES-256' | 'RSA-4096' | 'QUANTUM-RESISTANT';
  lastAudit: number;
  vulnerabilities: number;
}

abstract class DigitalAsset {
  public id: string;
  public name: string;
  public balance: number;
  public currency: string;
  public status: AccountStatus;
  public type: AssetType;
  public transactions: Transaction[];
  public security: SecurityContext;
  public created: number;

  constructor(name: string, type: AssetType, initialBalance: number) {
    this.id = OmniMath.uuid();
    this.name = name;
    this.type = type;
    this.balance = initialBalance;
    this.currency = 'OSS'; // Open Source Specie
    this.status = 'active';
    this.transactions = [];
    this.created = Date.now();
    this.security = {
      encryptionLevel: 'AES-256',
      lastAudit: Date.now(),
      vulnerabilities: 0
    };
  }

  abstract tick(worldState: any): void;
  
  protected addTransaction(amount: number, desc: string) {
    this.transactions.unshift({
      id: OmniMath.uuid(),
      timestamp: Date.now(),
      amount,
      description: desc,
      hash: OmniMath.hash(desc + Date.now()).toString(16)
    });
    if (this.transactions.length > 50) this.transactions.pop();
  }
}

// -----------------------------------------------------------------------------
// SECTION III: THE 100 SIMULATED API ECOSYSTEMS
// -----------------------------------------------------------------------------

// 1. Linux Foundation
class LinuxFoundationAPI extends DigitalAsset {
  constructor() { super('Linux Foundation', 'kernel', 1000000); }
  tick() {
    this.balance += OmniMath.range(-500, 1000);
    if (OmniMath.random() > 0.9) this.addTransaction(100, 'Kernel Patch Merged');
  }
  public getKernelVersion() { return `6.${Math.floor(OmniMath.range(1, 9))}.${Math.floor(OmniMath.range(0, 99))}`; }
}

// 2. Canonical (Ubuntu)
class CanonicalAPI extends DigitalAsset {
  constructor() { super('Canonical', 'kernel', 750000); }
  tick() {
    this.balance += OmniMath.range(-200, 400);
    if (OmniMath.random() > 0.95) this.status = 'deploying';
    else this.status = 'active';
  }
  public snapInstall(pkg: string) { this.addTransaction(-5, `Snap Install: ${pkg}`); }
}

// 3. Red Hat
class RedHatAPI extends DigitalAsset {
  constructor() { super('Red Hat', 'kernel', 900000); }
  tick() { this.balance += 50; /* Enterprise stability */ }
  public verifyRHEL() { return true; }
}

// 4. Fedora Project
class FedoraAPI extends DigitalAsset {
  constructor() { super('Fedora Project', 'kernel', 400000); }
  tick() { this.balance += OmniMath.range(-100, 200); }
  public bleedingEdgeUpdate() { this.addTransaction(0, 'Rawhide Update'); }
}

// 5. Debian Project
class DebianAPI extends DigitalAsset {
  constructor() { super('Debian Project', 'kernel', 600000); }
  tick() { this.balance += 10; /* Rock solid stability */ }
  public aptGetUpdate() { this.addTransaction(-1, 'apt-get update'); }
}

// 6. OpenSUSE
class OpenSUSEAPI extends DigitalAsset {
  constructor() { super('OpenSUSE', 'kernel', 350000); }
  tick() { this.balance += OmniMath.range(-50, 100); }
  public zypperRefresh() { this.addTransaction(-2, 'zypper refresh'); }
}

// 7. Arch Linux
class ArchLinuxAPI extends DigitalAsset {
  constructor() { super('Arch Linux', 'kernel', 300000); }
  tick() { 
    this.balance += OmniMath.range(-200, 300); 
    if(OmniMath.random() > 0.8) this.status = 'compiling';
  }
  public pacmanSyu() { this.addTransaction(-10, 'pacman -Syu'); }
}

// 8. Manjaro
class ManjaroAPI extends DigitalAsset {
  constructor() { super('Manjaro', 'kernel', 250000); }
  tick() { this.balance += OmniMath.range(-40, 80); }
}

// 9. FreeBSD
class FreeBSDAPI extends DigitalAsset {
  constructor() { super('FreeBSD', 'kernel', 450000); }
  tick() { this.balance += 20; }
  public updatePorts() { this.addTransaction(-5, 'Ports Tree Updated'); }
}

// 10. NetBSD
class NetBSDAPI extends DigitalAsset {
  constructor() { super('NetBSD', 'kernel', 150000); }
  tick() { this.balance += 5; }
  public runOnToaster() { return true; }
}

// 11. OpenBSD
class OpenBSDAPI extends DigitalAsset {
  constructor() { super('OpenBSD', 'kernel', 200000); }
  tick() { this.security.vulnerabilities = 0; /* Secure by default */ }
  public pledge() { this.addTransaction(0, 'System Call Pledged'); }
}

// 12. Kubernetes
class KubernetesAPI extends DigitalAsset {
  constructor() { super('Kubernetes', 'container', 2000000); }
  tick() { 
    this.balance += OmniMath.range(-1000, 2000); 
    this.status = OmniMath.random() > 0.5 ? 'active' : 'deploying';
  }
  public scaleReplicas(n: number) { this.addTransaction(-n * 10, `Scaled to ${n} replicas`); }
}

// 13. CNCF
class CNCFAPI extends DigitalAsset {
  constructor() { super('CNCF', 'container', 5000000); }
  tick() { this.balance += 500; }
  public graduateProject(name: string) { this.addTransaction(1000, `Graduated ${name}`); }
}

// 14. Docker
class DockerAPI extends DigitalAsset {
  constructor() { super('Docker', 'container', 1500000); }
  tick() { this.balance += OmniMath.range(-100, 200); }
  public pullImage(img: string) { this.addTransaction(-5, `docker pull ${img}`); }
}

// 15. Podman
class PodmanAPI extends DigitalAsset {
  constructor() { super('Podman', 'container', 400000); }
  tick() { this.balance += 50; }
  public runDaemonless() { this.addTransaction(0, 'Daemonless Run'); }
}

// 16. Ansible
class AnsibleAPI extends DigitalAsset {
  constructor() { super('Ansible', 'tooling', 600000); }
  tick() { this.balance += 30; }
  public runPlaybook() { this.addTransaction(-20, 'Playbook Executed'); }
}

// 17. Terraform
class TerraformAPI extends DigitalAsset {
  constructor() { super('Terraform', 'tooling', 1200000); }
  tick() { this.balance += OmniMath.range(-50, 150); }
  public apply() { this.addTransaction(-100, 'Terraform Apply'); }
}

// 18. HashiCorp
class HashiCorpAPI extends DigitalAsset {
  constructor() { super('HashiCorp', 'tooling', 3000000); }
  tick() { this.balance += 200; }
  public rotateVaultKeys() { this.security.lastAudit = Date.now(); }
}

// 19. Apache Foundation
class ApacheAPI extends DigitalAsset {
  constructor() { super('Apache Foundation', 'framework', 4000000); }
  tick() { this.balance += 100; }
  public incubate() { this.addTransaction(50, 'New Incubator Project'); }
}

// 20. NGINX
class NginxAPI extends DigitalAsset {
  constructor() { super('NGINX', 'protocol', 1800000); }
  tick() { this.balance += 10; }
  public reloadConfig() { this.addTransaction(-1, 'nginx -s reload'); }
}

// 21. Mozilla
class MozillaAPI extends DigitalAsset {
  constructor() { super('Mozilla', 'tooling', 2500000); }
  tick() { this.balance += OmniMath.range(-200, 200); }
  public fightForWeb() { this.addTransaction(0, 'Manifesto Update'); }
}

// 22. Firefox Dev Tools
class FirefoxDevToolsAPI extends DigitalAsset {
  constructor() { super('Firefox DevTools', 'tooling', 800000); }
  tick() { this.balance += 20; }
  public inspectGrid() { this.addTransaction(0, 'CSS Grid Inspection'); }
}

// 23. Git
class GitAPI extends DigitalAsset {
  constructor() { super('Git', 'tooling', 5000000); }
  tick() { this.balance += 500; }
  public checkout(branch: string) { this.addTransaction(0, `Checkout ${branch}`); }
}

// 24. GitHub Open Source
class GitHubAPI extends DigitalAsset {
  constructor() { super('GitHub Open Source', 'tooling', 8000000); }
  tick() { this.balance += OmniMath.range(100, 1000); }
  public mergePullRequest(id: number) { this.addTransaction(50, `Merged PR #${id}`); }
}

// 25. GitLab
class GitLabAPI extends DigitalAsset {
  constructor() { super('GitLab', 'tooling', 3000000); }
  tick() { this.balance += 150; }
  public runPipeline() { this.addTransaction(-10, 'CI/CD Pipeline Run'); }
}

// 26. Bitbucket
class BitbucketAPI extends DigitalAsset {
  constructor() { super('Bitbucket', 'tooling', 1500000); }
  tick() { this.balance += 50; }
}

// 27. VS Code
class VSCodeAPI extends DigitalAsset {
  constructor() { super('VS Code', 'tooling', 6000000); }
  tick() { this.balance += 300; }
  public installExtension(id: string) { this.addTransaction(-5, `Installed ${id}`); }
}

// 28. Eclipse Foundation
class EclipseAPI extends DigitalAsset {
  constructor() { super('Eclipse Foundation', 'tooling', 2000000); }
  tick() { this.balance += 40; }
}

// 29. JetBrains Open Tools
class JetBrainsAPI extends DigitalAsset {
  constructor() { super('JetBrains Open Tools', 'tooling', 2500000); }
  tick() { this.balance += 100; }
  public indexProject() { this.addTransaction(-50, 'Indexing...'); }
}

// 30. Python Software Foundation
class PythonAPI extends DigitalAsset {
  constructor() { super('Python Foundation', 'language', 7000000); }
  tick() { this.balance += 400; }
  public pipInstall() { this.addTransaction(-1, 'pip install package'); }
}

// 31. Node.js Foundation
class NodeAPI extends DigitalAsset {
  constructor() { super('Node.js Foundation', 'language', 6500000); }
  tick() { this.balance += 350; }
  public npmAudit() { this.addTransaction(0, 'npm audit fix'); }
}

// 32. Deno
class DenoAPI extends DigitalAsset {
  constructor() { super('Deno', 'language', 800000); }
  tick() { this.balance += 80; }
  public runSecure() { this.security.encryptionLevel = 'RSA-4096'; }
}

// 33. Bun
class BunAPI extends DigitalAsset {
  constructor() { super('Bun', 'language', 600000); }
  tick() { this.balance += 120; /* Fast growth */ }
  public bundleFast() { this.addTransaction(-1, 'Bundled in 5ms'); }
}

// 34. Rust Foundation
class RustAPI extends DigitalAsset {
  constructor() { super('Rust Foundation', 'language', 4000000); }
  tick() { this.balance += 250; }
  public borrowCheck() { this.addTransaction(0, 'Borrow Checker Passed'); }
}

// 35. GoLang Foundation
class GoLangAPI extends DigitalAsset {
  constructor() { super('GoLang Foundation', 'language', 4500000); }
  tick() { this.balance += 200; }
  public garbageCollect() { this.addTransaction(0, 'GC Cycle'); }
}

// 36. Ruby
class RubyAPI extends DigitalAsset {
  constructor() { super('Ruby', 'language', 2000000); }
  tick() { this.balance += 50; }
  public gemInstall() { this.addTransaction(-2, 'gem install'); }
}

// 37. PHP
class PHPAPI extends DigitalAsset {
  constructor() { super('PHP', 'language', 3000000); }
  tick() { this.balance += 30; }
}

// 38. MariaDB
class MariaDBAPI extends DigitalAsset {
  constructor() { super('MariaDB', 'database', 1200000); }
  tick() { this.balance += 40; }
}

// 39. MySQL Open Edition
class MySQLAPI extends DigitalAsset {
  constructor() { super('MySQL Open', 'database', 2500000); }
  tick() { this.balance += 60; }
}

// 40. PostgreSQL
class PostgresAPI extends DigitalAsset {
  constructor() { super('PostgreSQL', 'database', 3500000); }
  tick() { this.balance += 150; }
  public vacuum() { this.addTransaction(-20, 'VACUUM FULL'); }
}

// 41. SQLite
class SQLiteAPI extends DigitalAsset {
  constructor() { super('SQLite', 'database', 5000000); }
  tick() { this.balance += 10; /* Ubiquitous */ }
}

// 42. Redis
class RedisAPI extends DigitalAsset {
  constructor() { super('Redis', 'database', 2200000); }
  tick() { this.balance += 100; }
  public flushAll() { this.addTransaction(-1000, 'FLUSHALL'); }
}

// 43. MongoDB Community
class MongoAPI extends DigitalAsset {
  constructor() { super('MongoDB Community', 'database', 2800000); }
  tick() { this.balance += 120; }
}

// 44. Cassandra
class CassandraAPI extends DigitalAsset {
  constructor() { super('Cassandra', 'database', 1500000); }
  tick() { this.balance += 80; }
}

// 45. ElasticSearch
class ElasticAPI extends DigitalAsset {
  constructor() { super('ElasticSearch', 'database', 2600000); }
  tick() { this.balance += 110; }
}

// 46. Apache Spark
class SparkAPI extends DigitalAsset {
  constructor() { super('Apache Spark', 'framework', 3000000); }
  tick() { this.balance += 150; }
}

// 47. Apache Kafka
class KafkaAPI extends DigitalAsset {
  constructor() { super('Apache Kafka', 'framework', 3200000); }
  tick() { this.balance += 160; }
  public produceMessage() { this.addTransaction(1, 'Message Produced'); }
}

// 48. Supabase
class SupabaseAPI extends DigitalAsset {
  constructor() { super('Supabase', 'database', 900000); }
  tick() { this.balance += 200; }
}

// 49. Appwrite
class AppwriteAPI extends DigitalAsset {
  constructor() { super('Appwrite', 'database', 600000); }
  tick() { this.balance += 100; }
}

// 50. PocketBase
class PocketBaseAPI extends DigitalAsset {
  constructor() { super('PocketBase', 'database', 300000); }
  tick() { this.balance += 50; }
}

// 51. Hugging Face
class HuggingFaceAPI extends DigitalAsset {
  constructor() { super('Hugging Face', 'framework', 4000000); }
  tick() { this.balance += 500; }
  public downloadModel() { this.addTransaction(-50, 'Model Downloaded'); }
}

// 52. LangChain
class LangChainAPI extends DigitalAsset {
  constructor() { super('LangChain', 'framework', 1500000); }
  tick() { this.balance += 300; }
  public chainPrompt() { this.addTransaction(-5, 'Prompt Chained'); }
}

// 53. MLFlow
class MLFlowAPI extends DigitalAsset {
  constructor() { super('MLFlow', 'tooling', 1000000); }
  tick() { this.balance += 80; }
}

// 54. TensorFlow
class TensorFlowAPI extends DigitalAsset {
  constructor() { super('TensorFlow', 'framework', 5000000); }
  tick() { this.balance += 200; }
}

// 55. PyTorch
class PyTorchAPI extends DigitalAsset {
  constructor() { super('PyTorch', 'framework', 5500000); }
  tick() { this.balance += 250; }
  public backwardProp() { this.addTransaction(0, 'Gradient Descent'); }
}

// 56. ONNX
class ONNXAPI extends DigitalAsset {
  constructor() { super('ONNX', 'protocol', 800000); }
  tick() { this.balance += 40; }
}

// 57. OpenCV
class OpenCVAPI extends DigitalAsset {
  constructor() { super('OpenCV', 'framework', 2000000); }
  tick() { this.balance += 60; }
}

// 58. OpenAI Gym
class GymAPI extends DigitalAsset {
  constructor() { super('OpenAI Gym', 'framework', 1200000); }
  tick() { this.balance += 50; }
  public resetEnv() { this.addTransaction(0, 'Environment Reset'); }
}

// 59. Godot Engine
class GodotAPI extends DigitalAsset {
  constructor() { super('Godot Engine', 'tooling', 1800000); }
  tick() { this.balance += 150; }
  public emitSignal() { this.addTransaction(0, 'Signal Emitted'); }
}

// 60. Blender Foundation
class BlenderAPI extends DigitalAsset {
  constructor() { super('Blender Foundation', 'tooling', 3500000); }
  tick() { this.balance += 200; }
  public renderFrame() { this.addTransaction(-100, 'Frame Rendered'); }
}

// 61. Inkscape
class InkscapeAPI extends DigitalAsset {
  constructor() { super('Inkscape', 'tooling', 900000); }
  tick() { this.balance += 30; }
}

// 62. GIMP
class GIMPAPI extends DigitalAsset {
  constructor() { super('GIMP', 'tooling', 1100000); }
  tick() { this.balance += 25; }
}

// 63. Krita
class KritaAPI extends DigitalAsset {
  constructor() { super('Krita', 'tooling', 1000000); }
  tick() { this.balance += 40; }
}

// 64. Figma Open API
class FigmaAPI extends DigitalAsset {
  constructor() { super('Figma Open Sim', 'tooling', 4000000); }
  tick() { this.balance += 300; }
}

// 65. Unreal Open Tools
class UnrealAPI extends DigitalAsset {
  constructor() { super('Unreal Open Tools', 'tooling', 4500000); }
  tick() { this.balance += 250; }
}

// 66. Unity Open Tools
class UnityAPI extends DigitalAsset {
  constructor() { super('Unity Open Tools', 'tooling', 4200000); }
  tick() { this.balance += 220; }
}

// 67. OpenStreetMap
class OSMAPI extends DigitalAsset {
  constructor() { super('OpenStreetMap', 'database', 3000000); }
  tick() { this.balance += 100; }
  public addNode() { this.addTransaction(1, 'Map Node Added'); }
}

// 68. QGIS
class QGISAPI extends DigitalAsset {
  constructor() { super('QGIS', 'tooling', 1500000); }
  tick() { this.balance += 60; }
}

// 69. MapLibre
class MapLibreAPI extends DigitalAsset {
  constructor() { super('MapLibre', 'framework', 800000); }
  tick() { this.balance += 40; }
}

// 70. Leaflet.js
class LeafletAPI extends DigitalAsset {
  constructor() { super('Leaflet.js', 'framework', 900000); }
  tick() { this.balance += 35; }
}

// 71. VLC
class VLCAPI extends DigitalAsset {
  constructor() { super('VLC', 'tooling', 2000000); }
  tick() { this.balance += 50; }
  public playCone() { this.addTransaction(0, 'Traffic Cone Polished'); }
}

// 72. FFmpeg
class FFmpegAPI extends DigitalAsset {
  constructor() { super('FFmpeg', 'tooling', 2500000); }
  tick() { this.balance += 100; }
  public transcode() { this.addTransaction(-50, 'Transcoding Stream'); }
}

// 73. OBS Studio
class OBSAPI extends DigitalAsset {
  constructor() { super('OBS Studio', 'tooling', 1800000); }
  tick() { this.balance += 90; }
  public startStream() { this.status = 'active'; }
}

// 74. WireGuard
class WireGuardAPI extends DigitalAsset {
  constructor() { super('WireGuard', 'protocol', 1200000); }
  tick() { this.balance += 80; }
  public handshake() { this.addTransaction(0, 'Handshake Completed'); }
}

// 75. OpenVPN
class OpenVPNAPI extends DigitalAsset {
  constructor() { super('OpenVPN', 'protocol', 1000000); }
  tick() { this.balance += 40; }
}

// 76. Tor Project
class TorAPI extends DigitalAsset {
  constructor() { super('Tor Project', 'protocol', 1500000); }
  tick() { this.balance += 60; }
  public onionRoute() { this.addTransaction(0, 'Circuit Built'); }
}

// 77. DuckDB
class DuckDBAPI extends DigitalAsset {
  constructor() { super('DuckDB', 'database', 900000); }
  tick() { this.balance += 150; }
}

// 78. ClickHouse
class ClickHouseAPI extends DigitalAsset {
  constructor() { super('ClickHouse', 'database', 1300000); }
  tick() { this.balance += 140; }
}

// 79. MinIO
class MinIOAPI extends DigitalAsset {
  constructor() { super('MinIO', 'database', 1100000); }
  tick() { this.balance += 90; }
}

// 80. Ceph
class CephAPI extends DigitalAsset {
  constructor() { super('Ceph', 'database', 1400000); }
  tick() { this.balance += 80; }
}

// 81. OpenStack
class OpenStackAPI extends DigitalAsset {
  constructor() { super('OpenStack', 'framework', 2000000); }
  tick() { this.balance += 50; }
}

// 82. Proxmox
class ProxmoxAPI extends DigitalAsset {
  constructor() { super('Proxmox', 'tooling', 1600000); }
  tick() { this.balance += 70; }
}

// 83. Home Assistant
class HomeAssistantAPI extends DigitalAsset {
  constructor() { super('Home Assistant', 'tooling', 2200000); }
  tick() { this.balance += 180; }
  public triggerAutomation() { this.addTransaction(0, 'Automation Triggered'); }
}

// 84. OpenHAB
class OpenHABAPI extends DigitalAsset {
  constructor() { super('OpenHAB', 'tooling', 800000); }
  tick() { this.balance += 30; }
}

// 85. Matter Protocol
class MatterAPI extends DigitalAsset {
  constructor() { super('Matter Protocol', 'protocol', 1000000); }
  tick() { this.balance += 100; }
}

// 86. Zigbee Sim
class ZigbeeAPI extends DigitalAsset {
  constructor() { super('Zigbee Sim', 'protocol', 900000); }
  tick() { this.balance += 40; }
}

// 87. TensorRT
class TensorRTAPI extends DigitalAsset {
  constructor() { super('TensorRT Open', 'framework', 1500000); }
  tick() { this.balance += 120; }
}

// 88. LLVM
class LLVMAPI extends DigitalAsset {
  constructor() { super('LLVM', 'framework', 4000000); }
  tick() { this.balance += 200; }
  public optimizeIR() { this.addTransaction(0, 'IR Optimized'); }
}

// 89. WebKit
class WebKitAPI extends DigitalAsset {
  constructor() { super('WebKit', 'framework', 3000000); }
  tick() { this.balance += 150; }
}

// 90. Chromium
class ChromiumAPI extends DigitalAsset {
  constructor() { super('Chromium', 'framework', 5000000); }
  tick() { this.balance += 300; }
}

// 91. uBlock Origin
class UBlockAPI extends DigitalAsset {
  constructor() { super('uBlock Origin', 'tooling', 1200000); }
  tick() { this.balance += 100; }
  public blockAd() { this.addTransaction(1, 'Element Zapped'); }
}

// 92. Brave Shields
class BraveAPI extends DigitalAsset {
  constructor() { super('Brave Shields', 'tooling', 1400000); }
  tick() { this.balance += 110; }
}

// 93. Nextcloud
class NextcloudAPI extends DigitalAsset {
  constructor() { super('Nextcloud', 'tooling', 1800000); }
  tick() { this.balance += 90; }
}

// 94. OwnCloud
class OwnCloudAPI extends DigitalAsset {
  constructor() { super('OwnCloud', 'tooling', 900000); }
  tick() { this.balance += 20; }
}

// 95. Mastodon
class MastodonAPI extends DigitalAsset {
  constructor() { super('Mastodon', 'protocol', 2000000); }
  tick() { this.balance += 150; }
  public toot() { this.addTransaction(1, 'Toot Published'); }
}

// 96. Matrix
class MatrixAPI extends DigitalAsset {
  constructor() { super('Matrix', 'protocol', 1600000); }
  tick() { this.balance += 100; }
  public sync() { this.addTransaction(0, 'Sync Token Updated'); }
}

// 97. Signal
class SignalAPI extends DigitalAsset {
  constructor() { super('Signal Protocol', 'protocol', 2500000); }
  tick() { this.balance += 120; }
  public ratchet() { this.addTransaction(0, 'Double Ratchet Step'); }
}

// 98. Apache Airflow
class AirflowAPI extends DigitalAsset {
  constructor() { super('Apache Airflow', 'tooling', 1900000); }
  tick() { this.balance += 130; }
  public scheduleDAG() { this.addTransaction(0, 'DAG Scheduled'); }
}

// 99. Jenkins
class JenkinsAPI extends DigitalAsset {
  constructor() { super('Jenkins', 'tooling', 2200000); }
  tick() { this.balance += 50; }
  public build() { this.addTransaction(-5, 'Build Started'); }
}

// 100. DroneCI
class DroneCIAPI extends DigitalAsset {
  constructor() { super('DroneCI', 'tooling', 800000); }
  tick() { this.balance += 60; }
}

// -----------------------------------------------------------------------------
// SECTION IV: THE UNIVERSE ENGINE
// -----------------------------------------------------------------------------

class UniverseEngine {
  private assets: DigitalAsset[] = [];
  private listeners: ((assets: DigitalAsset[]) => void)[] = [];
  private intervalId: any = null;

  constructor() {
    this.initializeUniverse();
  }

  private initializeUniverse() {
    this.assets = [
      new LinuxFoundationAPI(), new CanonicalAPI(), new RedHatAPI(), new FedoraAPI(), new DebianAPI(),
      new OpenSUSEAPI(), new ArchLinuxAPI(), new ManjaroAPI(), new FreeBSDAPI(), new NetBSDAPI(),
      new OpenBSDAPI(), new KubernetesAPI(), new CNCFAPI(), new DockerAPI(), new PodmanAPI(),
      new AnsibleAPI(), new TerraformAPI(), new HashiCorpAPI(), new ApacheAPI(), new NginxAPI(),
      new MozillaAPI(), new FirefoxDevToolsAPI(), new GitAPI(), new GitHubAPI(), new GitLabAPI(),
      new BitbucketAPI(), new VSCodeAPI(), new EclipseAPI(), new JetBrainsAPI(), new PythonAPI(),
      new NodeAPI(), new DenoAPI(), new BunAPI(), new RustAPI(), new GoLangAPI(),
      new RubyAPI(), new PHPAPI(), new MariaDBAPI(), new MySQLAPI(), new PostgresAPI(),
      new SQLiteAPI(), new RedisAPI(), new MongoAPI(), new CassandraAPI(), new ElasticAPI(),
      new SparkAPI(), new KafkaAPI(), new SupabaseAPI(), new AppwriteAPI(), new PocketBaseAPI(),
      new HuggingFaceAPI(), new LangChainAPI(), new MLFlowAPI(), new TensorFlowAPI(), new PyTorchAPI(),
      new ONNXAPI(), new OpenCVAPI(), new GymAPI(), new GodotAPI(), new BlenderAPI(),
      new InkscapeAPI(), new GIMPAPI(), new KritaAPI(), new FigmaAPI(), new UnrealAPI(),
      new UnityAPI(), new OSMAPI(), new QGISAPI(), new MapLibreAPI(), new LeafletAPI(),
      new VLCAPI(), new FFmpegAPI(), new OBSAPI(), new WireGuardAPI(), new OpenVPNAPI(),
      new TorAPI(), new DuckDBAPI(), new ClickHouseAPI(), new MinIOAPI(), new CephAPI(),
      new OpenStackAPI(), new ProxmoxAPI(), new HomeAssistantAPI(), new OpenHABAPI(), new MatterAPI(),
      new ZigbeeAPI(), new TensorRTAPI(), new LLVMAPI(), new WebKitAPI(), new ChromiumAPI(),
      new UBlockAPI(), new BraveAPI(), new NextcloudAPI(), new OwnCloudAPI(), new MastodonAPI(),
      new MatrixAPI(), new SignalAPI(), new AirflowAPI(), new JenkinsAPI(), new DroneCIAPI()
    ];
  }

  public start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.tick();
    }, TICK_RATE_MS);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    this.assets.forEach(asset => asset.tick(this));
    this.notify();
  }

  public subscribe(callback: (assets: DigitalAsset[]) => void) {
    this.listeners.push(callback);
    callback(this.assets);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.assets));
  }

  public getAssetById(id: string) {
    return this.assets.find(a => a.id === id);
  }
}

const engine = new UniverseEngine();

// -----------------------------------------------------------------------------
// SECTION V: UI COMPONENT LAYER (THE VISUALIZER)
// -----------------------------------------------------------------------------

const AssetCard: React.FC<{ asset: DigitalAsset; onClick: () => void }> = ({ asset, onClick }) => {
  const trend = useMemo(() => OmniMath.generateSeries(10, 5), [asset.balance]);
  
  const getStatusColor = (s: string) => {
    switch(s) {
      case 'active': return 'bg-emerald-500';
      case 'compiling': return 'bg-amber-500';
      case 'deploying': return 'bg-blue-500';
      case 'deprecated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group relative overflow-hidden bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="text-6xl font-black text-gray-900">{asset.name.charAt(0)}</div>
      </div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg truncate w-48">{asset.name}</h3>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">{asset.type}</span>
        </div>
        <div className={`h-3 w-3 rounded-full ${getStatusColor(asset.status)} shadow-sm ring-2 ring-white`} />
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-mono font-semibold text-gray-800">
          {OmniMath.formatCurrency(asset.balance, asset.currency)}
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <span className={trend[9] > trend[0] ? 'text-green-500' : 'text-red-500'}>
            {trend[9] > trend[0] ? '▲' : '▼'} {Math.abs(trend[9] - trend[0]).toFixed(2)}%
          </span>
          <span>24h Volatility</span>
        </div>
      </div>

      <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-1000" 
          style={{ width: `${(asset.balance % 100)}%` }} 
        />
      </div>
    </div>
  );
};

const AssetDetailModal: React.FC<{ asset: DigitalAsset | null; onClose: () => void }> = ({ asset, onClose }) => {
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{asset.name}</h2>
            <p className="text-sm text-gray-500 font-mono">{asset.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="text-sm text-indigo-600 font-medium">Current Balance</div>
              <div className="text-2xl font-bold text-indigo-900">{OmniMath.formatCurrency(asset.balance, asset.currency)}</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-sm text-emerald-600 font-medium">Security Status</div>
              <div className="text-lg font-bold text-emerald-900">{asset.security.encryptionLevel}</div>
              <div className="text-xs text-emerald-700">Vulns: {asset.security.vulnerabilities}</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Ledger</h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {asset.transactions.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-500 text-sm">No recent activity</td></tr>
                  ) : (
                    asset.transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-white transition-colors">
                        <td className="px-4 py-2 text-xs text-gray-500 font-mono">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{tx.description}</td>
                        <td className={`px-4 py-2 text-sm text-right font-mono ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// SECTION VI: MAIN EXPORT (THE UNIVERSE CONTAINER)
// -----------------------------------------------------------------------------

/**
 * AccountList
 * 
 * The public interface to the Omni-Ledger Universe.
 * Replaces the static list with a dynamic, real-time dashboard of the 
 * Open Source Financial Simulation.
 */
const AccountList: React.FC = () => {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<DigitalAsset | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    engine.start();
    const unsubscribe = engine.subscribe(setAssets);
    return () => {
      unsubscribe();
      engine.stop();
    };
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesType = filter === 'all' || a.type === filter;
      const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [assets, filter, search]);

  const totalValue = useMemo(() => assets.reduce((acc, curr) => acc + curr.balance, 0), [assets]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 p-8">
      {/* Header Dashboard */}
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
              OmniLedger <span className="text-indigo-600">Universe</span>
            </h1>
            <p className="text-gray-500 max-w-xl">
              Real-time simulation of the global Open Source Asset Ecosystem. 
              Tracking {assets.length} unique decentralized entities.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Total Ecosystem Value</div>
            <div className="text-4xl font-mono font-bold text-gray-900">
              {OmniMath.formatCurrency(totalValue, 'OSS')}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="relative flex-grow w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
              placeholder="Search assets (e.g. Linux, Docker)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {['all', 'kernel', 'container', 'language', 'database', 'tooling', 'framework', 'protocol'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === type 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid */}
      <main>
        {filteredAssets.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-6 rounded-full bg-gray-100 mb-4">
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No assets found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                onClick={() => setSelectedAsset(asset)} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 pt-8 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} OmniLedger Decentralized Simulation. All rights reserved.</p>
        <p className="mt-2 font-mono text-xs">System Status: ONLINE • Nodes: {assets.length} • Tick Rate: {TICK_RATE_MS}ms</p>
      </footer>

      {/* Modal */}
      {selectedAsset && (
        <AssetDetailModal 
          asset={selectedAsset} 
          onClose={() => setSelectedAsset(null)} 
        />
      )}
    </div>
  );
};

export default AccountList;