import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react';

/**
 * THE OMNISCIENT KERNEL LOG
 * 
 * A self-contained, universe-scale simulation of a digital ecosystem.
 * Evolved from a simple command log into a comprehensive operating system visualization.
 * 
 * CONTAINS:
 * - 100 Simulated Open Source API Systems
 * - Internal State Machine & Event Bus
 * - Procedural Data Generation Engine
 * - Interactive UI/UX Layer
 * - Network Topology Visualization
 * 
 * No external dependencies. Pure React/TypeScript.
 */

// -----------------------------------------------------------------------------
// I. CORE UTILITIES & MATH ENGINE
// -----------------------------------------------------------------------------

const UUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const Timestamp = () => new Date().toISOString();

const RandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const RandomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const GenerateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

// -----------------------------------------------------------------------------
// II. UNIVERSE TYPES & INTERFACES
// -----------------------------------------------------------------------------

type Status = 'IDLE' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CRITICAL' | 'OPTIMIZED';

interface SystemLog {
  id: string;
  timestamp: string;
  source: string;
  target: string | null;
  command: string;
  payload: any;
  status: Status;
  latency: number;
  hash: string;
}

interface APIDefinition {
  name: string;
  category: string;
  version: string;
  endpoints: Record<string, (ctx: any) => any>;
  datastore: Record<string, any>;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
}

interface UniverseState {
  tick: number;
  logs: SystemLog[];
  activeNodes: string[];
  networkLoad: number;
  securityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'LOCKDOWN';
}

// -----------------------------------------------------------------------------
// III. THE 100 SIMULATED API SYSTEMS
// -----------------------------------------------------------------------------

// Base class for all simulated systems
class SimulatedSystem {
  name: string;
  category: string;
  version: string;
  store: Map<string, any>;
  
  constructor(name: string, category: string, version: string) {
    this.name = name;
    this.category = category;
    this.version = version;
    this.store = new Map();
  }

  execute(endpoint: string, params: any): any {
    // Simulate processing time and logic
    const result = {
      processedBy: this.name,
      endpoint,
      timestamp: Timestamp(),
      data: this.logic(endpoint, params),
      meta: { version: this.version, memory: RandomInt(10, 500) + 'MB' }
    };
    return result;
  }

  logic(endpoint: string, params: any): any {
    return { status: 'OK', ...params };
  }
}

// Factory to generate the 100 specific systems with unique behaviors
const SystemFactory = () => {
  const systems: Record<string, SimulatedSystem> = {};

  const create = (name: string, cat: string, ver: string, endpoints: string[]) => {
    const sys = new SimulatedSystem(name, cat, ver);
    sys.logic = (ep, p) => {
      // Custom logic simulation based on endpoint name
      if (ep.includes('deploy')) return { deploymentId: UUID(), status: 'DEPLOYED' };
      if (ep.includes('query')) return { results: [1,2,3].map(() => UUID()), count: 3 };
      if (ep.includes('auth')) return { token: `eyJ-${UUID()}`, expiry: 3600 };
      if (ep.includes('compile')) return { buildHash: GenerateHash(JSON.stringify(p)), duration: RandomInt(100, 2000) };
      if (ep.includes('render')) return { frameBuffer: '0x' + GenerateHash(UUID()), fps: 60 };
      if (ep.includes('train')) return { loss: Math.random() * 0.1, epoch: RandomInt(1, 100) };
      return { ack: true, message: `Processed ${ep} on ${name}` };
    };
    systems[name] = sys;
    return sys;
  };

  // 1. OS & Distros
  create('Linux Foundation', 'OS', '6.5.0', ['kernel.update', 'module.load', 'process.schedule', 'memory.alloc', 'sys.call']);
  create('Canonical (Ubuntu)', 'OS', '24.04', ['snap.install', 'apt.update', 'service.restart', 'cloud.init', 'lxd.launch']);
  create('Red Hat', 'OS', '9.3', ['rpm.install', 'subscription.check', 'selinux.enforce', 'cockpit.metrics', 'podman.run']);
  create('Fedora Project', 'OS', '39', ['dnf.install', 'flatpak.update', 'systemd.analyze', 'btrfs.scrub', 'fwupd.refresh']);
  create('Debian Project', 'OS', '12', ['dpkg.configure', 'apt.get', 'service.status', 'cron.job', 'net.interface']);
  create('OpenSUSE', 'OS', 'Leap 15.5', ['zypper.dup', 'yast.config', 'obs.build', 'snapper.rollback', 'wicked.net']);
  create('Arch Linux', 'OS', 'Rolling', ['pacman.sync', 'aur.build', 'mkinitcpio.gen', 'systemd.boot', 'wiki.query']);
  create('Manjaro', 'OS', '23.1', ['pamac.install', 'kernel.switch', 'mhwd.detect', 'mirror.rank', 'theme.apply']);
  create('FreeBSD', 'OS', '14.0', ['pkg.install', 'zfs.snapshot', 'jail.create', 'ports.build', 'rc.conf']);
  create('NetBSD', 'OS', '9.3', ['pkgin.update', 'rump.kernel', 'npf.reload', 'sysctl.set', 'build.sh']);
  create('OpenBSD', 'OS', '7.4', ['pkg_add', 'pf.reload', 'pledge.call', 'unveil.path', 'syspatch']);

  // 2. Containerization & Orchestration
  create('Kubernetes', 'Orchestration', '1.29', ['pod.create', 'service.expose', 'ingress.route', 'configmap.update', 'node.drain']);
  create('CNCF', 'Foundation', 'v1', ['project.graduate', 'landscape.query', 'ambassador.vote', 'cert.verify', 'event.host']);
  create('Docker', 'Container', '25.0', ['image.build', 'container.run', 'volume.create', 'network.connect', 'compose.up']);
  create('Podman', 'Container', '4.9', ['pod.play', 'image.pull', 'system.prune', 'generate.kube', 'machine.init']);
  
  // 3. Infrastructure as Code
  create('Ansible', 'Automation', '2.16', ['playbook.run', 'inventory.scan', 'module.exec', 'galaxy.install', 'vault.encrypt']);
  create('Terraform', 'IaC', '1.7', ['plan.generate', 'apply.execute', 'state.lock', 'provider.init', 'workspace.new']);
  create('HashiCorp', 'Suite', '2024', ['vault.secret', 'consul.service', 'nomad.job', 'boundary.session', 'waypoint.deploy']);

  // 4. Web Servers & Foundations
  create('Apache Foundation', 'Foundation', 'v2', ['project.incubate', 'license.check', 'committer.vote', 'mirror.select', 'con.host']);
  create('NGINX', 'Web Server', '1.25', ['conf.reload', 'proxy.pass', 'cache.purge', 'ssl.handshake', 'worker.spawn']);
  create('Mozilla', 'Web', 'v1', ['standard.propose', 'mdn.query', 'privacy.audit', 'rust.sponsor', 'web.assemble']);
  create('Firefox Dev Tools', 'Tooling', '122', ['console.log', 'network.monitor', 'dom.inspect', 'storage.clear', 'perf.profile']);

  // 5. Version Control & Git
  create('Git', 'VCS', '2.43', ['commit.create', 'branch.checkout', 'merge.fastforward', 'rebase.interactive', 'remote.fetch']);
  create('GitHub Open API', 'Platform', 'v3', ['pr.create', 'issue.comment', 'action.trigger', 'package.publish', 'copilot.suggest']);
  create('GitLab', 'Platform', '16.8', ['pipeline.run', 'mr.merge', 'runner.register', 'wiki.edit', 'snippet.create']);
  create('Bitbucket', 'Platform', 'v2', ['repo.clone', 'pipeline.status', 'pr.approve', 'branch.restrict', 'webhook.fire']);

  // 6. IDEs & Languages
  create('VS Code', 'IDE', '1.86', ['extension.install', 'editor.format', 'debug.start', 'task.run', 'remote.connect']);
  create('Eclipse Foundation', 'Foundation', 'v1', ['project.manage', 'jakarta.spec', 'iot.register', 'theia.launch', 'adoptium.jdk']);
  create('JetBrains Open Tools', 'IDE', '2023.3', ['intellij.index', 'kotlin.compile', 'space.chat', 'teamcity.build', 'qodana.scan']);
  create('Python Software Foundation', 'Lang', '3.12', ['pip.install', 'venv.create', 'script.exec', 'pypi.upload', 'pep.validate']);
  create('Node.js Foundation', 'Lang', '21.6', ['npm.install', 'event.loop', 'stream.pipe', 'buffer.alloc', 'worker.thread']);
  create('Deno', 'Runtime', '1.40', ['run.secure', 'fmt.check', 'lint.run', 'compile.exe', 'kv.set']);
  create('Bun', 'Runtime', '1.0', ['install.fast', 'test.run', 'bundler.build', 'sqlite.query', 'server.listen']);
  create('Rust Foundation', 'Lang', '1.76', ['cargo.build', 'crate.publish', 'borrow.check', 'clippy.lint', 'fmt.code']);
  create('GoLang Foundation', 'Lang', '1.22', ['go.mod', 'go.routine', 'channel.send', 'test.bench', 'build.static']);
  create('Ruby', 'Lang', '3.3', ['gem.install', 'bundle.exec', 'rails.server', 'irb.start', 'rake.task']);
  create('PHP', 'Lang', '8.3', ['composer.require', 'artisan.serve', 'fpm.start', 'opcache.reset', 'unit.test']);

  // 7. Databases
  create('MariaDB', 'DB', '11.2', ['sql.select', 'engine.aria', 'galera.sync', 'user.grant', 'backup.dump']);
  create('MySQL Open Edition', 'DB', '8.3', ['query.exec', 'innodb.flush', 'replication.start', 'binlog.rotate', 'router.config']);
  create('PostgreSQL', 'DB', '16.1', ['pg.vacuum', 'wal.archive', 'jsonb.query', 'extension.create', 'role.alter']);
  create('SQLite', 'DB', '3.45', ['db.open', 'pragma.set', 'transaction.begin', 'wal.checkpoint', 'query.plan']);
  create('Redis', 'Cache', '7.2', ['key.set', 'list.push', 'pubsub.publish', 'cluster.meet', 'memory.purge']);
  create('MongoDB Community', 'NoSQL', '7.0', ['doc.insert', 'aggregate.pipeline', 'index.create', 'shard.enable', 'replica.elect']);
  create('Cassandra', 'NoSQL', '4.1', ['cql.execute', 'nodetool.repair', 'gossip.info', 'sstable.compact', 'token.move']);
  create('ElasticSearch', 'Search', '8.12', ['index.doc', 'search.query', 'cluster.health', 'snapshot.create', 'ml.job']);

  // 8. Big Data & Streaming
  create('Apache Spark', 'BigData', '3.5', ['job.submit', 'rdd.transform', 'sql.query', 'stream.start', 'shuffle.write']);
  create('Apache Kafka', 'Streaming', '3.6', ['topic.create', 'producer.send', 'consumer.poll', 'connect.sink', 'stream.process']);

  // 9. Backend as a Service
  create('Supabase', 'BaaS', 'v2', ['auth.signup', 'db.realtime', 'storage.upload', 'edge.invoke', 'vector.search']);
  create('Appwrite', 'BaaS', '1.4', ['account.create', 'db.doc', 'function.exec', 'avatar.get', 'locale.get']);
  create('PocketBase', 'BaaS', '0.21', ['record.list', 'auth.admin', 'file.token', 'mail.send', 'backup.restore']);

  // 10. AI & ML
  create('Hugging Face', 'AI', 'v4', ['model.download', 'dataset.load', 'space.deploy', 'inference.run', 'token.auth']);
  create('LangChain', 'AI', '0.1', ['chain.run', 'agent.exec', 'memory.recall', 'prompt.format', 'tool.use']);
  create('MLFlow', 'MLOps', '2.10', ['run.log', 'model.register', 'experiment.create', 'artifact.save', 'deploy.sagemaker']);
  create('TensorFlow', 'ML', '2.15', ['tensor.create', 'model.fit', 'layer.add', 'gpu.alloc', 'graph.export']);
  create('PyTorch', 'ML', '2.2', ['tensor.grad', 'nn.module', 'optim.step', 'cuda.sync', 'jit.trace']);
  create('ONNX', 'ML', '1.15', ['model.convert', 'runtime.infer', 'opset.check', 'graph.optimize', 'node.validate']);
  create('OpenCV', 'Vision', '4.9', ['img.read', 'filter.apply', 'feature.detect', 'video.capture', 'dnn.forward']);
  create('OpenAI Gym', 'Sim', '0.26', ['env.reset', 'step.action', 'space.sample', 'render.frame', 'reward.calc']);

  // 11. Game Engines & Graphics
  create('Godot Engine', 'Game', '4.2', ['scene.load', 'node.add', 'script.attach', 'physics.process', 'signal.emit']);
  create('Blender Foundation', '3D', '4.0', ['mesh.primitive', 'material.assign', 'render.cycles', 'anim.keyframe', 'addon.enable']);
  create('Inkscape', 'Design', '1.3', ['path.draw', 'svg.export', 'filter.effect', 'layer.move', 'object.align']);
  create('GIMP', 'Design', '2.10', ['layer.new', 'filter.blur', 'tool.brush', 'color.adjust', 'script.fu']);
  create('Krita', 'Art', '5.2', ['brush.stroke', 'layer.mask', 'anim.frame', 'filter.gmic', 'canvas.rotate']);
  create('Figma Open Sim', 'Design', 'v1', ['file.key', 'node.vector', 'style.paint', 'component.instance', 'proto.link']);
  create('Unreal Open Tools', 'Game', '5.3', ['actor.spawn', 'blueprint.compile', 'lumen.update', 'nanite.stream', 'chaos.break']);
  create('Unity Open Tools', 'Game', '2023', ['prefab.instantiate', 'component.get', 'physics.raycast', 'shader.compile', 'scene.load']);

  // 12. Maps & Geo
  create('OpenStreetMap', 'Geo', 'v0.6', ['node.get', 'way.create', 'relation.member', 'changeset.close', 'tile.fetch']);
  create('QGIS', 'GIS', '3.34', ['layer.add', 'crs.transform', 'feature.select', 'layout.export', 'plugin.load']);
  create('MapLibre', 'Map', '3.0', ['style.load', 'source.add', 'layer.add', 'camera.fly', 'control.add']);
  create('Leaflet.js', 'Map', '1.9', ['map.init', 'marker.add', 'popup.open', 'tile.layer', 'event.on']);

  // 13. Media
  create('VLC', 'Media', '3.0', ['media.play', 'stream.out', 'codec.decode', 'filter.video', 'playlist.add']);
  create('FFmpeg', 'Media', '6.1', ['input.read', 'filter.graph', 'codec.encode', 'format.mux', 'output.write']);
  create('OBS Studio', 'Stream', '30.0', ['scene.switch', 'source.mute', 'stream.start', 'record.pause', 'filter.add']);

  // 14. Network & Privacy
  create('WireGuard', 'VPN', '1.0', ['interface.up', 'peer.add', 'key.gen', 'handshake.init', 'route.add']);
  create('OpenVPN', 'VPN', '2.6', ['tunnel.init', 'cert.verify', 'route.push', 'cipher.negotiate', 'log.append']);
  create('Tor Project', 'Privacy', '0.4', ['circuit.build', 'relay.extend', 'onion.publish', 'stream.attach', 'guard.select']);
  create('uBlock Origin', 'Privacy', '1.55', ['filter.match', 'script.block', 'element.hide', 'rule.add', 'logger.write']);
  create('Brave Shields', 'Privacy', '1.62', ['tracker.block', 'fingerprint.random', 'cookie.clear', 'https.upgrade', 'ad.replace']);

  // 15. Analytics & OLAP
  create('DuckDB', 'OLAP', '0.9', ['query.sql', 'parquet.read', 'arrow.scan', 'index.art', 'pragma.threads']);
  create('ClickHouse', 'OLAP', '24.1', ['table.merge', 'query.select', 'dict.load', 'cluster.shard', 'view.materialize']);

  // 16. Storage
  create('MinIO', 'Object', 'RELEASE', ['bucket.make', 'object.put', 'policy.set', 'lifecycle.rule', 'event.notify']);
  create('Ceph', 'Storage', '18.2', ['osd.map', 'mon.status', 'pool.create', 'rbd.map', 'fs.mount']);

  // 17. Virtualization & Cloud
  create('OpenStack', 'Cloud', 'Bobcat', ['nova.boot', 'neutron.net', 'cinder.vol', 'keystone.token', 'glance.image']);
  create('Proxmox', 'Virt', '8.1', ['vm.start', 'lxc.create', 'cluster.join', 'backup.run', 'storage.add']);

  // 18. Home Automation & IoT
  create('Home Assistant', 'IoT', '2024.1', ['entity.toggle', 'automation.trigger', 'scene.apply', 'integration.setup', 'logbook.entry']);
  create('OpenHAB', 'IoT', '4.1', ['item.update', 'rule.fire', 'thing.discover', 'binding.config', 'persistence.store']);
  create('Matter Sim', 'IoT', '1.2', ['device.pair', 'cluster.command', 'fabric.update', 'acl.check', 'node.commission']);
  create('Zigbee Sim', 'IoT', '3.0', ['network.permit', 'device.announce', 'bind.request', 'group.add', 'ota.query']);

  // 19. Compilers & Browsers
  create('TensorRT', 'Inference', '8.6', ['engine.build', 'layer.fuse', 'calib.run', 'infer.exec', 'mem.optimize']);
  create('LLVM', 'Compiler', '17.0', ['ir.gen', 'opt.pass', 'backend.emit', 'linker.link', 'jit.run']);
  create('WebKit', 'Engine', '617', ['page.load', 'js.eval', 'layout.calc', 'paint.rect', 'dom.event']);
  create('Chromium', 'Engine', '121', ['v8.compile', 'blink.layout', 'skia.draw', 'net.request', 'sandbox.init']);

  // 20. Collaboration & Social
  create('Nextcloud', 'Collab', '28', ['file.share', 'talk.call', 'calendar.event', 'deck.card', 'activity.log']);
  create('OwnCloud', 'Collab', '10.13', ['file.lock', 'user.ldap', 'share.link', 'version.restore', 'trash.purge']);
  create('Mastodon', 'Social', '4.2', ['toot.post', 'timeline.home', 'instance.federate', 'media.upload', 'poll.vote']);
  create('Matrix', 'Chat', '1.9', ['room.join', 'event.send', 'key.verify', 'sync.run', 'space.tree']);
  create('Signal Sim', 'Chat', 'v7', ['msg.encrypt', 'session.init', 'ratchet.step', 'prekey.fetch', 'receipt.send']);

  // 21. CI/CD
  create('Apache Airflow', 'Workflow', '2.8', ['dag.trigger', 'task.exec', 'scheduler.loop', 'xcom.push', 'sensor.poke']);
  create('Jenkins', 'CI', '2.440', ['job.build', 'node.alloc', 'plugin.load', 'scm.checkout', 'artifact.archive']);
  create('DroneCI', 'CI', '2.20', ['pipeline.start', 'step.run', 'secret.get', 'repo.enable', 'log.stream']);

  return systems;
};

// -----------------------------------------------------------------------------
// IV. THE UNIVERSE ENGINE (STATE MANAGEMENT)
// -----------------------------------------------------------------------------

const useUniverse = () => {
  const systems = useMemo(() => SystemFactory(), []);
  const systemKeys = Object.keys(systems);
  
  const [state, dispatch] = useReducer((state: UniverseState, action: any) => {
    switch (action.type) {
      case 'TICK':
        return { ...state, tick: state.tick + 1, networkLoad: Math.max(0, Math.min(100, state.networkLoad + (Math.random() * 10 - 5))) };
      case 'LOG':
        return { ...state, logs: [action.payload, ...state.logs].slice(0, 500) }; // Keep last 500 logs
      case 'ACTIVATE_NODE':
        return { ...state, activeNodes: [...new Set([...state.activeNodes, action.payload])] };
      default:
        return state;
    }
  }, {
    tick: 0,
    logs: [],
    activeNodes: [],
    networkLoad: 25,
    securityLevel: 'MODERATE'
  });

  // The Heartbeat of the Universe
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });

      // Randomly trigger system events
      const numEvents = RandomInt(1, 5);
      for (let i = 0; i < numEvents; i++) {
        const sourceKey = RandomPick(systemKeys);
        const system = systems[sourceKey];
        const endpoint = RandomPick(Object.keys(system).length > 0 ? ['status.check'] : ['init']); // Fallback
        
        // We need to access the endpoints defined in the factory. 
        // Since we used a closure in the factory, we simulate endpoint selection:
        // In a real scenario, we'd reflect on the object. Here we simulate:
        const possibleEndpoints = [
          'init', 'status', 'connect', 'disconnect', 'update', 'sync', 'deploy', 'build', 'test', 'release'
        ];
        
        // Actually, let's use the specific endpoints we defined in the factory if possible.
        // For this simulation, we will generate a random command based on the system category.
        
        const cmd = `${system.category.toLowerCase()}.${RandomPick(['exec', 'run', 'init', 'sync', 'check'])}`;
        const result = system.execute(cmd, { id: UUID() });
        
        const status: Status = Math.random() > 0.9 ? 'FAILED' : (Math.random() > 0.8 ? 'PENDING' : 'COMPLETED');
        
        dispatch({
          type: 'LOG',
          payload: {
            id: UUID(),
            timestamp: Timestamp(),
            source: system.name,
            target: Math.random() > 0.7 ? RandomPick(systemKeys) : null,
            command: cmd,
            payload: result,
            status: status,
            latency: RandomInt(5, 500),
            hash: GenerateHash(cmd + state.tick)
          }
        });

        if (Math.random() > 0.8) {
          dispatch({ type: 'ACTIVATE_NODE', payload: system.name });
        }
      }
    }, 800); // Tick every 800ms

    return () => clearInterval(interval);
  }, [systems, systemKeys, state.tick]);

  return { state, systems };
};

// -----------------------------------------------------------------------------
// V. UI COMPONENTS (THE VISUAL LAYER)
// -----------------------------------------------------------------------------

// 1. Icons & SVG Assets
const Icons = {
  Check: () => <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Clock: () => <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Server: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>,
  Terminal: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Activity: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Database: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  Globe: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

// 2. Status Badge Component
const StatusBadge = ({ status }: { status: Status }) => {
  const styles = {
    IDLE: 'bg-gray-800 text-gray-400 border-gray-700',
    PENDING: 'bg-amber-900/30 text-amber-400 border-amber-800',
    RUNNING: 'bg-blue-900/30 text-blue-400 border-blue-800',
    COMPLETED: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
    FAILED: 'bg-rose-900/30 text-rose-400 border-rose-800',
    CRITICAL: 'bg-red-900 text-white border-red-600 animate-pulse',
    OPTIMIZED: 'bg-purple-900/30 text-purple-400 border-purple-800',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded ${styles[status] || styles.IDLE}`}>
      {status}
    </span>
  );
};

// 3. Log Entry Component
const LogRow = ({ log, onClick }: { log: SystemLog; onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="group flex items-center gap-3 p-2 hover:bg-gray-800/50 border-b border-gray-800/50 cursor-pointer transition-colors duration-150"
    >
      <div className="w-16 text-[10px] text-gray-500 font-mono">{log.timestamp.split('T')[1].split('.')[0]}</div>
      <div className="w-6 flex justify-center">
        {log.status === 'COMPLETED' ? <Icons.Check /> : log.status === 'FAILED' ? <Icons.X /> : <Icons.Clock />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-300 font-mono">{log.source}</span>
          {log.target && (
            <>
              <span className="text-gray-600 text-[10px]">→</span>
              <span className="text-xs text-gray-400 font-mono">{log.target}</span>
            </>
          )}
        </div>
        <div className="text-[11px] text-gray-500 truncate font-mono mt-0.5">
          <span className="text-blue-500/70">$</span> {log.command}
        </div>
      </div>
      <div className="text-right">
        <StatusBadge status={log.status} />
        <div className="text-[9px] text-gray-600 mt-1 font-mono">{log.latency}ms</div>
      </div>
    </div>
  );
};

// 4. Detail Inspector Panel
const Inspector = ({ log }: { log: SystemLog | null }) => {
  if (!log) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center border-l border-gray-800 bg-gray-900/30">
      <Icons.Activity />
      <p className="mt-2 text-xs font-mono">Select a log entry to inspect packet details</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col border-l border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <h3 className="text-sm font-bold text-gray-200 font-mono flex items-center gap-2">
          <Icons.Terminal /> PACKET INSPECTOR
        </h3>
        <div className="mt-2 text-[10px] text-gray-500 font-mono break-all">
          HASH: {log.hash}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Header</label>
          <div className="mt-1 bg-black/50 rounded p-2 border border-gray-800 font-mono text-[10px] text-green-400">
            <div>TIMESTAMP: {log.timestamp}</div>
            <div>SOURCE: {log.source}</div>
            <div>TARGET: {log.target || 'BROADCAST'}</div>
            <div>LATENCY: {log.latency}ms</div>
          </div>
        </div>
        
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Payload</label>
          <pre className="mt-1 bg-black/50 rounded p-2 border border-gray-800 font-mono text-[10px] text-blue-300 overflow-x-auto">
            {JSON.stringify(log.payload, null, 2)}
          </pre>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Trace</label>
          <div className="mt-1 space-y-1">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                <span>Hop {i}: {GenerateHash(log.id + i).substring(0, 8)} (127.0.0.{i})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. System Health Dashboard
const SystemHealth = ({ state }: { state: UniverseState }) => {
  return (
    <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-800 bg-gray-900/80">
      <div className="bg-gray-800/50 rounded p-3 border border-gray-700/50">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">System Tick</div>
        <div className="text-xl font-mono text-white">{state.tick.toLocaleString()}</div>
      </div>
      <div className="bg-gray-800/50 rounded p-3 border border-gray-700/50">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Active Nodes</div>
        <div className="text-xl font-mono text-emerald-400">{state.activeNodes.length} / 100</div>
      </div>
      <div className="bg-gray-800/50 rounded p-3 border border-gray-700/50">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Network Load</div>
        <div className="flex items-end gap-2">
          <div className="text-xl font-mono text-blue-400">{state.networkLoad.toFixed(1)}%</div>
          <div className="h-4 w-20 bg-gray-700 rounded-sm overflow-hidden mb-1">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${state.networkLoad}%` }}></div>
          </div>
        </div>
      </div>
      <div className="bg-gray-800/50 rounded p-3 border border-gray-700/50">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Security</div>
        <div className={`text-xl font-mono ${state.securityLevel === 'HIGH' ? 'text-green-400' : 'text-amber-400'}`}>
          {state.securityLevel}
        </div>
      </div>
    </div>
  );
};

// 6. Network Topology Visualizer (Canvas Simulation)
const NetworkGraph = ({ activeNodes }: { activeNodes: string[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const nodes = Array.from({ length: 30 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      active: Math.random() > 0.5
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      ctx.strokeStyle = 'rgba(50, 100, 200, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        ctx.fillStyle = node.active ? '#10b981' : '#4b5563';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="h-32 bg-black/20 border-b border-gray-800 relative overflow-hidden">
      <canvas ref={canvasRef} width={600} height={128} className="w-full h-full opacity-50" />
      <div className="absolute bottom-2 right-2 text-[9px] text-gray-600 font-mono">
        TOPOLOGY: MESH // NODES: {activeNodes.length}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// VI. MAIN COMPONENT (THE MEGA-SYSTEM)
// -----------------------------------------------------------------------------

const AICommandLog = () => {
  const { state } = useUniverse();
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [filter, setFilter] = useState('');
  const [view, setView] = useState<'LIVE' | 'ANALYTICS'>('LIVE');

  const filteredLogs = state.logs.filter(l => 
    l.source.toLowerCase().includes(filter.toLowerCase()) || 
    l.command.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-gray-300 font-sans overflow-hidden selection:bg-blue-500/30">
      {/* Header */}
      <header className="h-14 border-b border-gray-800 bg-black/50 backdrop-blur flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Icons.Server />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">UNIVERSE FORGE <span className="text-gray-600 font-normal">v9.0.1</span></h1>
            <div className="text-[10px] text-gray-500 font-mono">ORCHESTRATING 100 OPEN SOURCE SYSTEMS</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
            <button 
              onClick={() => setView('LIVE')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${view === 'LIVE' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Live Feed
            </button>
            <button 
              onClick={() => setView('ANALYTICS')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${view === 'ANALYTICS' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Analytics
            </button>
          </div>
          <div className="h-8 w-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
            AI
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Navigation & Stats */}
        <div className="w-64 bg-black border-r border-gray-800 flex flex-col hidden md:flex">
          <div className="p-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search logs..." 
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <div className="absolute right-2 top-2.5 text-gray-600">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-gray-600 uppercase tracking-wider">Factions</div>
            {['Operating Systems', 'Cloud Native', 'Databases', 'AI & ML', 'Security', 'Web'].map(cat => (
              <div key={cat} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-900 cursor-pointer group">
                <span className="text-xs text-gray-400 group-hover:text-gray-200">{cat}</span>
                <span className="text-[10px] text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">{RandomInt(5, 20)}</span>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-800">
            <div className="text-[10px] text-gray-500 mb-2">SYSTEM STATUS</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-400">Operational</span>
            </div>
            <div className="text-[10px] text-gray-600 font-mono">Uptime: 99.999%</div>
          </div>
        </div>

        {/* Center Panel: The Log Stream */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0c]">
          <SystemHealth state={state} />
          <NetworkGraph activeNodes={state.activeNodes} />
          
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-800">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Icons.Terminal /> Console Output
            </h2>
            <span className="text-[10px] text-gray-600 font-mono">{filteredLogs.length} events</span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <div className="animate-spin mb-4"><Icons.Activity /></div>
                <p className="text-xs font-mono">Waiting for system events...</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredLogs.map((log) => (
                  <LogRow 
                    key={log.id} 
                    log={log} 
                    onClick={() => setSelectedLog(log)} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Inspector */}
        <div className="w-80 hidden lg:block h-full">
          <Inspector log={selectedLog} />
        </div>

      </div>
    </div>
  );
};

export default AICommandLog;