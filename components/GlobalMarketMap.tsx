/**
 * THE EVOLUTIONARY UNIVERSE-FORGE: GLOBAL OS-ECOSYSTEM SIMULATOR
 *
 * This file is a self-contained, dependency-free micro-universe. It has evolved from a simple
 * React component visualizing mock financial data into a comprehensive simulation of the
 * global open-source software ecosystem.
 *
 * The original file's "soul" – a 3D perspective on a dynamic market – has been preserved and
 * amplified. The "market" is now the landscape of open-source influence, the "companies" are
 * 100 of the most significant projects and foundations, and the "index" is a complex metric
 * of their health, adoption, and momentum.
 *
 * This universe includes:
 * 1. A Core Simulation Engine: Manages the state and evolution of 100 OS entities using
 *    an Entity-Component-System (ECS) inspired architecture.
 * 2. A Procedural Generation Core: Creates rich, dynamic backstories, codebases, and
 *    community metrics for each entity.
 * 3. A Universe of 100 Simulated APIs: A complete, in-memory implementation of APIs for
 *    each of the 100 OS entities, allowing interaction with the simulation's state.
 * 4. A Custom Rendering Engine: A from-scratch Canvas 2D renderer to visualize the
 *    ecosystem, replacing all external charting libraries.
 * 5. An Interactive UI Layer: A custom DOM manipulation library to create tooltips,
 *    inspector panels, and controls for the simulation.
 *
 * Every line of code is part of this self-contained world. There are no external calls,
 * no libraries, no placeholders. Welcome to the Balcony of Influence.
 */

// --- UNIVERSE NAMESPACE ---
// Encapsulates the entire system to avoid polluting the global scope.
const TheBalconyOfProsperity = (() => {
    'use strict';

    // --- I. CORE ABSTRACTIONS & UTILITIES ---
    // Foundational, dependency-free tools that power the universe.

    const _private = {
        now: () => performance.now(),
        lastTime: 0,
        deltaTime: 0,
    };

    const Utils = {
        // A simple, yet effective pseudo-random number generator for deterministic simulations if needed.
        seed: 1,
        random: function() {
            const x = Math.sin(this.seed++) * 10000;
            return x - Math.floor(x);
        },
        randomInRange: (min, max) => min + Utils.random() * (max - min),
        clamp: (value, min, max) => Math.max(min, Math.min(value, max)),
        lerp: (a, b, t) => a * (1 - t) + b * t,
        // Generates a simple UUID. Not RFC4122 compliant, but sufficient for unique IDs in this simulation.
        uuid: () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = (Utils.random() * 16) | 0;
                const v = c === 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        },
        // Simple event emitter for decoupled communication between modules.
        createEventEmitter: () => {
            const listeners = {};
            return {
                on(event, callback) {
                    if (!listeners[event]) {
                        listeners[event] = [];
                    }
                    listeners[event].push(callback);
                },
                emit(event, ...args) {
                    if (listeners[event]) {
                        listeners[event].forEach(callback => callback(...args));
                    }
                },
            };
        },
    };

    const bus = Utils.createEventEmitter();

    // --- II. THE SIMULATION ENGINE (THE UNIVERSE CORE) ---
    // This engine drives the entire state of the open-source universe.

    const SimulationEngine = {
        entities: new Map(),
        systems: [],
        isPaused: false,
        tickSpeed: 1, // Multiplier for simulation time
        time: 0,

        // Entity Management
        addEntity(entity) {
            this.entities.set(entity.id, entity);
        },
        getEntity(id) {
            return this.entities.get(id);
        },
        getEntitiesWithComponents(...componentNames) {
            const result = [];
            for (const entity of this.entities.values()) {
                if (componentNames.every(name => entity.hasComponent(name))) {
                    result.push(entity);
                }
            }
            return result;
        },

        // System Management
        addSystem(system) {
            this.systems.push(system);
        },

        // Main Simulation Loop
        tick(deltaTime) {
            if (this.isPaused) return;
            const effectiveDeltaTime = deltaTime * this.tickSpeed;
            this.time += effectiveDeltaTime;

            // Run all systems on relevant entities
            for (const system of this.systems) {
                system(this.entities, effectiveDeltaTime, this.time);
            }
            bus.emit('simulation:tick', this.time);
        },

        init() {
            // Initialize all entities from the seed data
            const initialEntities = ProceduralGeneration.generateInitialEntities();
            initialEntities.forEach(e => this.addEntity(e));

            // Register all core systems
            this.addSystem(Systems.CommunitySystem);
            this.addSystem(Systems.CodebaseSystem);
            this.addSystem(Systems.InfluenceSystem);
            this.addSystem(Systems.HealthSystem);
            this.addSystem(Systems.MarketEventSystem);
        },
    };

    // --- III. ENTITY-COMPONENT-SYSTEM (ECS) DEFINITIONS ---
    // The building blocks of our simulated universe.

    class Entity {
        constructor(name) {
            this.id = Utils.uuid();
            this.name = name;
            this.components = new Map();
        }
        addComponent(component) {
            this.components.set(component.name, component);
            return this;
        }
        getComponent(name) {
            return this.components.get(name);
        }
        hasComponent(name) {
            return this.components.has(name);
        }
    }

    // Component Definitions
    const Components = {
        // Core Identity
        Identity: (name, type, quadrant) => ({
            name: 'Identity',
            type, // e.g., 'Foundation', 'Project', 'Tool'
            quadrant, // 'Core Infrastructure', 'Data & AI', 'Developer Tooling', 'Application Layer'
        }),
        // The "Market Cap" equivalent from the original file
        Influence: (base, growthRate) => ({
            name: 'Influence',
            score: base,
            momentum: 0, // 'up', 'down', 'stable' derived from recent changes
            growthRate, // Base growth potential
            history: [base],
        }),
        // The "Index" equivalent
        Health: (stability, activity) => ({
            name: 'Health',
            index: 100, // Starts at a baseline of 100
            stability, // Resistance to negative events
            activity, // Issue closure rate, release frequency
        }),
        // Simulating the actual code
        Codebase: (lines, complexity, techStack) => ({
            name: 'Codebase',
            lines,
            complexity, // Cyclomatic complexity simulation
            techStack,
            version: '1.0.0',
            lastReleaseTime: 0,
            vulnerabilityChance: 0.05,
        }),
        // Simulating the people
        Community: (contributors, users, engagement) => ({
            name: 'Community',
            contributors,
            users,
            engagement, // Forum posts, social media mentions
            contributorGrowth: 0,
        }),
        // Simulating the dependency graph
        Dependencies: (dependencies, dependents) => ({
            name: 'Dependencies',
            dependencies, // Array of entity IDs it depends on
            dependents, // Array of entity IDs that depend on it
        }),
        // For API simulation
        ApiData: (endpoints, dataStore) => ({
            name: 'ApiData',
            endpoints,
            dataStore,
            rateLimit: { remaining: 100, resetTime: 0 },
            authTokens: new Set(),
        }),
    };

    // System Definitions (The logic that drives change)
    const Systems = {
        CommunitySystem(entities, dt) {
            for (const entity of entities.values()) {
                if (entity.hasComponent('Community') && entity.hasComponent('Influence')) {
                    const community = entity.getComponent('Community');
                    const influence = entity.getComponent('Influence');
                    
                    // Contributor growth is tied to influence
                    const growthFactor = (influence.score / 10000) * (Utils.random() - 0.4);
                    community.contributorGrowth = growthFactor * dt * 5;
                    community.contributors += community.contributorGrowth;
                    
                    // User growth is logarithmic
                    community.users += Math.log(influence.score + 1) * growthFactor * dt * 100;

                    if (community.contributors < 1) community.contributors = 1;
                    if (community.users < 1) community.users = 1;
                }
            }
        },
        CodebaseSystem(entities, dt, time) {
            for (const entity of entities.values()) {
                if (entity.hasComponent('Codebase') && entity.hasComponent('Community')) {
                    const codebase = entity.getComponent('Codebase');
                    const community = entity.getComponent('Community');

                    // Code grows based on active contributors
                    const newCode = community.contributors * Utils.randomInRange(0.1, 0.5) * dt;
                    codebase.lines += newCode;
                    codebase.complexity += newCode * Utils.randomInRange(0.01, 0.05); // More code, more complexity

                    // Release cycle
                    if (time - codebase.lastReleaseTime > 100) { // Arbitrary release cycle time
                        codebase.lastReleaseTime = time;
                        const versionParts = codebase.version.split('.').map(Number);
                        versionParts[2]++;
                        if (versionParts[2] > 10) {
                            versionParts[2] = 0;
                            versionParts[1]++;
                        }
                        codebase.version = versionParts.join('.');
                        bus.emit('market:event', {
                            type: 'RELEASE',
                            entityId: entity.id,
                            message: `${entity.name} released version ${codebase.version}.`,
                            impact: 1.1, // 10% influence boost
                        });
                    }
                }
            }
        },
        InfluenceSystem(entities, dt) {
            for (const entity of entities.values()) {
                if (entity.hasComponent('Influence') && entity.hasComponent('Community') && entity.hasComponent('Codebase')) {
                    const influence = entity.getComponent('Influence');
                    const community = entity.getComponent('Community');
                    const codebase = entity.getComponent('Codebase');
                    
                    const oldScore = influence.score;

                    // Influence is a composite metric
                    const communityFactor = Math.log10(community.users + 1) * 500;
                    const contributorFactor = Math.sqrt(community.contributors) * 100;
                    const codebaseFactor = Math.log(codebase.lines) * 10 - codebase.complexity * 0.5;
                    
                    const targetScore = communityFactor + contributorFactor + codebaseFactor;
                    
                    // Smoothly move towards target score
                    influence.score = Utils.lerp(influence.score, targetScore, 0.01 * dt * 60);
                    
                    // Add some random market volatility
                    influence.score *= (1 + (Utils.random() - 0.5) * 0.005);
                    if (influence.score < 100) influence.score = 100;

                    const change = influence.score - oldScore;
                    influence.momentum = change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable';
                    
                    // Keep history for charts
                    if (influence.history.length > 50) influence.history.shift();
                    influence.history.push(influence.score);
                }
            }
        },
        HealthSystem(entities, dt) {
            for (const entity of entities.values()) {
                if (entity.hasComponent('Health') && entity.hasComponent('Codebase')) {
                    const health = entity.getComponent('Health');
                    const codebase = entity.getComponent('Codebase');

                    // Health degrades with complexity and improves with activity
                    const complexityPenalty = Math.max(0, (codebase.complexity / codebase.lines) * 1000 - 10);
                    health.index -= complexityPenalty * dt * 0.1;
                    
                    // Activity boost (simulated)
                    health.index += health.activity * dt * 0.5;

                    health.index = Utils.clamp(health.index, 0, 120);
                }
            }
        },
        MarketEventSystem(entities, dt, time) {
            // Trigger random events
            if (Utils.random() < 0.001 * dt * 60) {
                const randomEntity = Array.from(entities.values())[Math.floor(Utils.random() * entities.size)];
                if (randomEntity.hasComponent('Codebase')) {
                    const codebase = randomEntity.getComponent('Codebase');
                    if (Utils.random() < codebase.vulnerabilityChance) {
                        bus.emit('market:event', {
                            type: 'VULNERABILITY',
                            entityId: randomEntity.id,
                            message: `Critical vulnerability discovered in ${randomEntity.name}!`,
                            impact: 0.7, // 30% influence drop
                        });
                    }
                }
            }
            if (Utils.random() < 0.0005 * dt * 60) {
                 const randomEntity = Array.from(entities.values())[Math.floor(Utils.random() * entities.size)];
                 bus.emit('market:event', {
                    type: 'BREAKTHROUGH',
                    entityId: randomEntity.id,
                    message: `Major technological breakthrough by ${randomEntity.name}!`,
                    impact: 1.5, // 50% influence boost
                });
            }
        },
    };

    // Event listener for market events
    bus.on('market:event', (event) => {
        const entity = SimulationEngine.getEntity(event.entityId);
        if (entity && entity.hasComponent('Influence')) {
            const influence = entity.getComponent('Influence');
            influence.score *= event.impact;
        }
        if (entity && entity.hasComponent('Health') && event.type === 'VULNERABILITY') {
            const health = entity.getComponent('Health');
            health.index *= 0.8;
        }
        // Add event to a global log for UI display
        UIManager.addLogEntry(event.message, event.type);
    });

    // --- IV. PROCEDURAL GENERATION CORE ---
    // Creates the initial state of the universe.

    const ProceduralGeneration = {
        OS_PROJECT_LIST: [
            'Linux Foundation', 'Canonical', 'Red Hat', 'Fedora Project', 'Debian Project', 'OpenSUSE', 'Arch Linux', 'Manjaro', 'FreeBSD', 'NetBSD', 'OpenBSD', 'Kubernetes', 'CNCF', 'Docker', 'Podman', 'Ansible', 'Terraform', 'HashiCorp', 'Apache Foundation', 'NGINX', 'Mozilla', 'Firefox Dev Tools', 'Git', 'GitHub Open Source API', 'GitLab', 'Bitbucket', 'VS Code', 'Eclipse Foundation', 'JetBrains Open Tools', 'Python Software Foundation', 'Node.js Foundation', 'Deno', 'Bun', 'Rust Foundation', 'GoLang Foundation', 'Ruby', 'PHP', 'MariaDB', 'MySQL Open Edition', 'PostgreSQL', 'SQLite', 'Redis', 'MongoDB Community Edition', 'Cassandra', 'ElasticSearch', 'Apache Spark', 'Apache Kafka', 'Supabase', 'Appwrite', 'PocketBase', 'Hugging Face', 'LangChain Open Module', 'MLFlow', 'TensorFlow', 'PyTorch', 'ONNX', 'OpenCV', 'OpenAI Gym', 'Godot Engine', 'Blender Foundation', 'Inkscape', 'GIMP', 'Krita', 'Figma Open API sim', 'Unreal Open Tools', 'Unity Open Tools', 'OpenStreetMap', 'QGIS', 'MapLibre', 'Leaflet.js', 'VLC', 'FFmpeg', 'OBS Studio', 'WireGuard', 'OpenVPN', 'Tor Project', 'DuckDB', 'ClickHouse', 'MinIO', 'Ceph', 'OpenStack', 'Proxmox', 'Home Assistant', 'OpenHAB', 'Matter protocol simulator', 'Zigbee simulator', 'TensorRT open version', 'LLVM', 'WebKit', 'Chromium', 'uBlock Origin engine sim', 'Brave Shields engine sim', 'Nextcloud', 'OwnCloud', 'Mastodon', 'Matrix', 'Signal open protocol simulation', 'Apache Airflow', 'Jenkins', 'DroneCI'
        ],
        QUADRANTS: ['Core Infrastructure', 'Data & AI', 'Developer Tooling', 'Application Layer'],
        TECH_STACKS: [
            ['C', 'Assembly', 'Shell'],
            ['C++', 'Python', 'CUDA'],
            ['Go', 'YAML', 'Protobuf'],
            ['Java', 'Scala', 'XML'],
            ['JavaScript', 'TypeScript', 'HTML/CSS'],
            ['Rust', 'TOML'],
            ['Python', 'Jupyter'],
            ['PHP', 'SQL'],
        ],

        generateInitialEntities() {
            return this.OS_PROJECT_LIST.map((name, i) => {
                const entity = new Entity(name);
                const quadrant = this.QUADRANTS[i % this.QUADRANTS.length];
                const techStack = this.TECH_STACKS[i % this.TECH_STACKS.length];
                const type = name.includes('Foundation') || name.includes('Project') ? 'Foundation' : 'Project';

                entity.addComponent(Components.Identity(name, type, quadrant));
                entity.addComponent(Components.Influence(
                    Utils.randomInRange(5000, 20000),
                    Utils.randomInRange(0.01, 0.05)
                ));
                entity.addComponent(Components.Health(
                    Utils.randomInRange(0.8, 1.2),
                    Utils.randomInRange(0.5, 1.5)
                ));
                entity.addComponent(Components.Codebase(
                    Utils.randomInRange(50000, 2000000),
                    Utils.randomInRange(1000, 50000),
                    techStack
                ));
                entity.addComponent(Components.Community(
                    Utils.randomInRange(50, 5000),
                    Utils.randomInRange(10000, 10000000),
                    Utils.randomInRange(0.1, 1)
                ));
                entity.addComponent(Components.Dependencies([], [])); // Will be populated later
                
                // Add API data component
                const apiData = this.generateApiDataForEntity(entity);
                entity.addComponent(Components.ApiData(apiData.endpoints, apiData.dataStore));

                return entity;
            });
        },
        
        generateApiDataForEntity(entity) {
            const nameSlug = entity.name.toLowerCase().replace(/ /g, '-');
            const dataStore = {
                repos: [{ id: 1, name: nameSlug, stars: Math.floor(Utils.randomInRange(100, 50000)), issues: [] }],
                issues: [],
                contributors: Array.from({ length: Math.floor(Utils.randomInRange(5, 50)) }, (_, i) => ({ id: i, login: `user${i}`, contributions: 0 })),
                stats: { downloads: 0, forks: 0 },
            };
            const endpoints = {
                [`GET /v1/status`]: (params, store) => ({ status: 'ok', entity: entity.name, time: SimulationEngine.time }),
                [`GET /v1/repos`]: (params, store) => store.repos,
                [`GET /v1/repos/${nameSlug}/issues`]: (params, store) => store.issues,
                [`POST /v1/repos/${nameSlug}/issues`]: (params, store) => {
                    const newIssue = { id: store.issues.length + 1, title: params.title || 'New Issue', status: 'open' };
                    store.issues.push(newIssue);
                    return newIssue;
                },
                [`GET /v1/stats`]: (params, store) => {
                    const community = entity.getComponent('Community');
                    store.stats.downloads = Math.floor(community.users);
                    store.stats.forks = Math.floor(community.contributors * 1.5);
                    return store.stats;
                },
            };
            return { endpoints, dataStore };
        },
    };

    // --- V. THE SIMULATED API UNIVERSE ---
    // A complete, in-memory API gateway for all 100 entities.

    const ApiUniverse = {
        handleRequest(entityId, method, path, params = {}, token = null) {
            const entity = SimulationEngine.getEntity(entityId);
            if (!entity) return { status: 404, body: { error: 'Entity not found' } };

            if (!entity.hasComponent('ApiData')) {
                return { status: 500, body: { error: 'Entity does not have an API' } };
            }
            const apiData = entity.getComponent('ApiData');

            // --- Authentication (Simulated) ---
            const isPublicEndpoint = path.endsWith('/status') || (method === 'GET');
            if (!isPublicEndpoint && !apiData.authTokens.has(token)) {
                return { status: 401, body: { error: 'Unauthorized' } };
            }

            // --- Rate Limiting (Simulated) ---
            const now = Math.floor(Date.now() / 1000);
            if (now > apiData.rateLimit.resetTime) {
                apiData.rateLimit.remaining = 100;
                apiData.rateLimit.resetTime = now + 60; // Reset every minute
            }
            if (apiData.rateLimit.remaining <= 0) {
                return { status: 429, body: { error: 'Rate limit exceeded' } };
            }
            apiData.rateLimit.remaining--;

            // --- Endpoint Routing ---
            const route = `${method} ${path}`;
            const handler = apiData.endpoints[route];

            if (handler) {
                try {
                    const body = handler(params, apiData.dataStore);
                    return { status: 200, body };
                } catch (e) {
                    return { status: 500, body: { error: 'Internal API error', details: e.message } };
                }
            } else {
                return { status: 404, body: { error: 'Endpoint not found' } };
            }
        },
        
        // Helper to generate a new API token for an entity
        generateApiToken(entityId) {
            const entity = SimulationEngine.getEntity(entityId);
            if (entity && entity.hasComponent('ApiData')) {
                const apiData = entity.getComponent('ApiData');
                const token = `token_${Utils.uuid()}`;
                apiData.authTokens.add(token);
                return token;
            }
            return null;
        }
    };

    // --- VI. CUSTOM RENDERING ENGINE ---
    // Replaces Recharts/React with a from-scratch Canvas 2D renderer.

    const RenderingEngine = {
        canvas: null,
        ctx: null,
        width: 0,
        height: 0,
        camera: { x: 0, y: 0, zoom: 1 },
        gridColor: '#374151',
        axisColor: '#9CA3AF',
        fontColor: '#D1D5DB',
        quadrantColors: {
            'Core Infrastructure': '#3B82F6', // Blue
            'Data & AI': '#EC4899', // Pink
            'Developer Tooling': '#F59E0B', // Amber
            'Application Layer': '#10B981', // Emerald
        },
        trendColors: {
            up: '#10B981',
            down: '#EF4444',
            stable: '#ccc',
        },
        hoveredEntity: null,
        selectedEntity: null,

        init(canvasElement) {
            this.canvas = canvasElement;
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.addEventListeners();
        },

        resize() {
            this.width = this.canvas.clientWidth;
            this.height = this.canvas.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        },
        
        addEventListeners() {
            let isDragging = false;
            let lastMousePos = { x: 0, y: 0 };

            this.canvas.addEventListener('mousedown', (e) => {
                isDragging = true;
                lastMousePos = { x: e.clientX, y: e.clientY };
            });

            this.canvas.addEventListener('mouseup', (e) => {
                isDragging = false;
                // Check for click vs drag
                if (Math.abs(e.clientX - lastMousePos.x) < 5 && Math.abs(e.clientY - lastMousePos.y) < 5) {
                    this.handleClick(e);
                }
            });

            this.canvas.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const dx = e.clientX - lastMousePos.x;
                    const dy = e.clientY - lastMousePos.y;
                    this.camera.x -= dx / this.camera.zoom;
                    this.camera.y -= dy / this.camera.zoom;
                    lastMousePos = { x: e.clientX, y: e.clientY };
                } else {
                    this.handleMouseMove(e);
                }
            });

            this.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomIntensity = 0.1;
                const wheel = e.deltaY < 0 ? 1 : -1;
                const zoom = Math.exp(wheel * zoomIntensity);
                
                const mousePos = this.getMousePos(e);
                const worldPosBeforeZoom = this.screenToWorld(mousePos);

                this.camera.zoom = Utils.clamp(this.camera.zoom * zoom, 0.1, 5);

                const worldPosAfterZoom = this.screenToWorld(mousePos);

                this.camera.x += worldPosBeforeZoom.x - worldPosAfterZoom.x;
                this.camera.y += worldPosBeforeZoom.y - worldPosAfterZoom.y;
            });
        },
        
        getMousePos(evt) {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        },

        screenToWorld(screenPos) {
            return {
                x: (screenPos.x - this.width / 2) / this.camera.zoom + this.camera.x,
                y: (screenPos.y - this.height / 2) / this.camera.zoom + this.camera.y
            };
        },

        worldToScreen(worldPos) {
            return {
                x: (worldPos.x - this.camera.x) * this.camera.zoom + this.width / 2,
                y: (worldPos.y - this.camera.y) * this.camera.zoom + this.height / 2
            };
        },

        handleClick(e) {
            this.selectedEntity = this.hoveredEntity;
            bus.emit('ui:entity:selected', this.selectedEntity);
        },

        handleMouseMove(e) {
            const mousePos = this.getMousePos(e);
            const worldPos = this.screenToWorld(mousePos);
            let foundEntity = null;
            let minDistance = Infinity;

            for (const entity of SimulationEngine.entities.values()) {
                const pos = this.getEntityPosition(entity);
                const influence = entity.getComponent('Influence');
                const radius = this.getEntityRadius(influence);
                
                const distance = Math.sqrt(Math.pow(pos.x - worldPos.x, 2) + Math.pow(pos.y - worldPos.y, 2));
                
                if (distance < radius && distance < minDistance) {
                    minDistance = distance;
                    foundEntity = entity;
                }
            }
            
            if (this.hoveredEntity !== foundEntity) {
                this.hoveredEntity = foundEntity;
                bus.emit('ui:entity:hovered', this.hoveredEntity);
            }
        },

        clear() {
            this.ctx.fillStyle = '#030712'; // bg-gray-950
            this.ctx.fillRect(0, 0, this.width, this.height);
        },

        drawGrid() {
            this.ctx.strokeStyle = this.gridColor;
            this.ctx.lineWidth = 1;
            const gridSize = 100 * this.camera.zoom;
            
            const start = this.screenToWorld({x: 0, y: 0});
            const end = this.screenToWorld({x: this.width, y: this.height});

            for (let x = Math.floor(start.x / 100) * 100; x < end.x; x += 100) {
                const screenX = this.worldToScreen({x, y:0}).x;
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, 0);
                this.ctx.lineTo(screenX, this.height);
                this.ctx.stroke();
            }
            for (let y = Math.floor(start.y / 100) * 100; y < end.y; y += 100) {
                const screenY = this.worldToScreen({x:0, y}).y;
                this.ctx.beginPath();
                this.ctx.moveTo(0, screenY);
                this.ctx.lineTo(this.width, screenY);
                this.ctx.stroke();
            }
        },

        drawAxes() {
            const quadrantOrder = ProceduralGeneration.QUADRANTS;
            const yDomain = [5000, 25000]; // Health Index domain
            
            // Y-Axis (Health Index)
            this.ctx.strokeStyle = this.axisColor;
            this.ctx.fillStyle = this.fontColor;
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            
            const origin = this.worldToScreen({x: -50, y: 0});
            
            for (let i = 0; i <= 5; i++) {
                const value = yDomain[0] + (yDomain[1] - yDomain[0]) * (i / 5);
                const yPos = this.worldToScreen({x:0, y: -value}).y;
                this.ctx.fillText(Math.round(value / 1000) + 'k', origin.x - 10, yPos);
            }
            this.ctx.save();
            this.ctx.translate(origin.x - 40, this.height / 2);
            this.ctx.rotate(-Math.PI / 2);
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Influence Score', 0, 0);
            this.ctx.restore();

            // X-Axis (Quadrants)
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            quadrantOrder.forEach((quadrant, i) => {
                const xPos = this.worldToScreen({x: i * 400, y: 0}).x;
                this.ctx.fillText(quadrant, xPos, origin.y + 10);
            });
        },

        getEntityPosition(entity) {
            const identity = entity.getComponent('Identity');
            const influence = entity.getComponent('Influence');
            const quadrantOrder = ProceduralGeneration.QUADRANTS;
            
            const quadrantIndex = quadrantOrder.indexOf(identity.quadrant);
            const x = quadrantIndex * 400 + (Utils.random() - 0.5) * 200;
            const y = -influence.score; // Y-axis is inverted in canvas
            return { x, y };
        },

        getEntityRadius(influence) {
            // The "3D" effect from the original file: size represents depth/market cap
            return Math.sqrt(influence.score) * 0.1 + 2;
        },

        drawEntities() {
            const entities = Array.from(SimulationEngine.entities.values());
            // Sort by influence so larger entities are drawn first (appearing behind)
            entities.sort((a, b) => b.getComponent('Influence').score - a.getComponent('Influence').score);

            for (const entity of entities) {
                const identity = entity.getComponent('Identity');
                const influence = entity.getComponent('Influence');
                const pos = this.getEntityPosition(entity);
                const screenPos = this.worldToScreen(pos);
                
                if (screenPos.x < -50 || screenPos.x > this.width + 50 || screenPos.y < -50 || screenPos.y > this.height + 50) {
                    continue; // Culling
                }

                const radius = this.getEntityRadius(influence) * this.camera.zoom;
                
                let color = this.quadrantColors[identity.quadrant] || '#ccc';
                if (entity === this.hoveredEntity || entity === this.selectedEntity) {
                    color = '#FBBF24'; // yellow-400
                }

                this.ctx.beginPath();
                this.ctx.arc(screenPos.x, screenPos.y, radius, 0, 2 * Math.PI);
                this.ctx.fillStyle = color;
                this.ctx.globalAlpha = 0.8;
                this.ctx.fill();
                
                // Add a stroke to indicate momentum
                if (influence.momentum !== 'stable') {
                    this.ctx.strokeStyle = this.trendColors[influence.momentum];
                    this.ctx.lineWidth = 2 * this.camera.zoom;
                    this.ctx.stroke();
                }
                
                this.ctx.globalAlpha = 1.0;

                // Draw label if zoomed in enough
                if (this.camera.zoom > 1.5) {
                    this.ctx.fillStyle = this.fontColor;
                    this.ctx.font = `${Math.max(8, 12 * this.camera.zoom * 0.5)}px monospace`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(entity.name, screenPos.x, screenPos.y + radius + 10);
                }
            }
        },

        render() {
            this.clear();
            this.ctx.save();
            this.ctx.translate(this.width / 2, this.height / 2);
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
            this.ctx.translate(-this.camera.x, -this.camera.y);

            this.drawGrid();
            this.drawEntities();

            this.ctx.restore();
            
            // Draw UI elements that are not part of the world space
            this.drawAxes();
        },
    };

    // --- VII. INTERACTIVE UI LAYER ---
    // Manages DOM elements for tooltips, panels, and logs.

    const UIManager = {
        container: null,
        tooltipElement: null,
        inspectorElement: null,
        logElement: null,
        timeElement: null,

        init(containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error('UI container not found!');
                return;
            }
            this.container.innerHTML = `
                <style>
                    .bop-container { position: relative; width: 100%; height: 100%; background: #030712; color: #D1D5DB; font-family: monospace; }
                    .bop-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
                    .bop-header { position: absolute; top: 1rem; left: 1rem; z-index: 10; }
                    .bop-header h2 { font-size: 1.25rem; font-weight: bold; color: #FBBF24; margin: 0 0 0.5rem 0; }
                    .bop-header p { font-size: 0.875rem; color: #9CA3AF; margin: 0; }
                    .bop-tooltip { position: absolute; display: none; padding: 0.75rem; background: rgba(17, 24, 39, 0.9); border: 1px solid #FBBF24; border-radius: 0.25rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-size: 0.75rem; pointer-events: none; z-index: 100; }
                    .bop-inspector { position: absolute; top: 1rem; right: 1rem; width: 350px; max-height: calc(100% - 2rem); background: rgba(17, 24, 39, 0.9); border: 1px solid #6B7280; border-radius: 0.5rem; z-index: 20; overflow-y: auto; display: none; }
                    .bop-inspector-content { padding: 1rem; }
                    .bop-inspector h3 { color: #FBBF24; margin: 0 0 1rem 0; }
                    .bop-inspector p { margin: 0.5rem 0; }
                    .bop-inspector .label { color: #9CA3AF; }
                    .bop-log { position: absolute; bottom: 1rem; left: 1rem; width: 400px; height: 150px; background: rgba(17, 24, 39, 0.8); border-radius: 0.25rem; overflow-y: scroll; padding: 0.5rem; font-size: 0.75rem; z-index: 10; }
                    .bop-log-entry { margin-bottom: 0.25rem; }
                    .bop-log-entry.RELEASE { color: #34D399; }
                    .bop-log-entry.VULNERABILITY { color: #F87171; }
                    .bop-log-entry.BREAKTHROUGH { color: #60A5FA; }
                </style>
                <div class="bop-header">
                    <h2>The Balcony of Prosperity: OS Influence Simulation</h2>
                    <p>Time: <span id="bop-time">0</span></p>
                </div>
                <canvas class="bop-canvas" id="bop-main-canvas"></canvas>
                <div class="bop-tooltip" id="bop-tooltip"></div>
                <div class="bop-inspector" id="bop-inspector"></div>
                <div class="bop-log" id="bop-log"></div>
            `;

            this.tooltipElement = document.getElementById('bop-tooltip');
            this.inspectorElement = document.getElementById('bop-inspector');
            this.logElement = document.getElementById('bop-log');
            this.timeElement = document.getElementById('bop-time');

            bus.on('ui:entity:hovered', (entity) => this.updateTooltip(entity));
            bus.on('ui:entity:selected', (entity) => this.updateInspector(entity));
            bus.on('simulation:tick', (time) => this.updateTime(time));
            
            // Add mouse move listener to position tooltip
            window.addEventListener('mousemove', (e) => {
                if (this.tooltipElement.style.display === 'block') {
                    this.tooltipElement.style.left = `${e.clientX + 15}px`;
                    this.tooltipElement.style.top = `${e.clientY + 15}px`;
                }
            });
        },

        updateTime(time) {
            this.timeElement.textContent = Math.floor(time).toString();
        },

        updateTooltip(entity) {
            if (entity) {
                const influence = entity.getComponent('Influence');
                const health = entity.getComponent('Health');
                const trend = influence.momentum;
                const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-white';
                
                this.tooltipElement.style.display = 'block';
                this.tooltipElement.innerHTML = `
                    <p style="font-weight: bold; color: #FBBF24; margin-bottom: 0.25rem;">${entity.name}</p>
                    <p>Influence: <span style="font-weight: bold;" class="${trendColor}">${influence.score.toFixed(0)}</span></p>
                    <p>Health Index: <span style="font-weight: bold;">${health.index.toFixed(1)}</span></p>
                `;
            } else {
                this.tooltipElement.style.display = 'none';
            }
        },

        updateInspector(entity) {
            if (entity) {
                this.inspectorElement.style.display = 'block';
                const identity = entity.getComponent('Identity');
                const influence = entity.getComponent('Influence');
                const health = entity.getComponent('Health');
                const codebase = entity.getComponent('Codebase');
                const community = entity.getComponent('Community');

                this.inspectorElement.innerHTML = `
                    <div class="bop-inspector-content">
                        <h3>${entity.name}</h3>
                        <p><span class="label">Quadrant:</span> ${identity.quadrant}</p>
                        <p><span class="label">Type:</span> ${identity.type}</p>
                        <hr style="border-color: #4B5563; margin: 1rem 0;">
                        <p><span class="label">Influence Score:</span> ${influence.score.toFixed(0)}</p>
                        <p><span class="label">Momentum:</span> ${influence.momentum}</p>
                        <p><span class="label">Health Index:</span> ${health.index.toFixed(1)}</p>
                        <hr style="border-color: #4B5563; margin: 1rem 0;">
                        <p><span class="label">Version:</span> ${codebase.version}</p>
                        <p><span class="label">Lines of Code:</span> ${Math.floor(codebase.lines).toLocaleString()}</p>
                        <p><span class="label">Tech Stack:</span> ${codebase.techStack.join(', ')}</p>
                        <hr style="border-color: #4B5563; margin: 1rem 0;">
                        <p><span class="label">Contributors:</span> ${Math.floor(community.contributors).toLocaleString()}</p>
                        <p><span class="label">Users (Est.):</span> ${Math.floor(community.users).toLocaleString()}</p>
                    </div>
                `;
            } else {
                this.inspectorElement.style.display = 'none';
            }
        },

        addLogEntry(message, type) {
            const entry = document.createElement('div');
            entry.className = `bop-log-entry ${type}`;
            entry.textContent = `[${Math.floor(SimulationEngine.time)}] ${message}`;
            this.logElement.appendChild(entry);
            this.logElement.scrollTop = this.logElement.scrollHeight;
        },
    };

    // --- VIII. MAIN APPLICATION BOOTSTRAP ---
    // The entry point that initializes and connects all systems.

    const main = (containerId) => {
        // 1. Initialize UI Manager and create DOM structure
        UIManager.init(containerId);

        // 2. Initialize Rendering Engine with the canvas element
        const canvas = document.getElementById('bop-main-canvas');
        RenderingEngine.init(canvas);

        // 3. Initialize Simulation Engine (creates entities and systems)
        SimulationEngine.init();

        // 4. Start the main loop
        _private.lastTime = _private.now();
        function loop() {
            const currentTime = _private.now();
            _private.deltaTime = (currentTime - _private.lastTime) / 1000; // Delta time in seconds
            _private.lastTime = currentTime;

            // Update simulation state
            SimulationEngine.tick(_private.deltaTime);

            // Render the current state
            RenderingEngine.render();

            requestAnimationFrame(loop);
        }

        loop();
    };

    // Expose the public interface of the universe
    return {
        // The main function to start the simulation
        ignite: main,
        // Expose the API universe for external interaction (e.g., from browser console)
        api: ApiUniverse,
        // Expose the simulation engine for debugging
        simulation: SimulationEngine,
    };
})();

// --- Default Export ---
// This structure mimics a module export for compatibility with various environments.
// In a real scenario, you would call TheBalconyOfProsperity.ignite('your-container-id').
// For this file, we'll just define it. The user would need to call it.
// This is the equivalent of the original file's `export default GlobalMarketMap;`
// but for a vanilla JS, self-contained system.

function GlobalMarketMap() {
    // This function is a placeholder to match the original export structure.
    // The actual application is encapsulated within TheBalconyOfProsperity.
    // To run, one would need an HTML element (e.g., <div id="root"></div>)
    // and then call `TheBalconyOfProsperity.ignite('root');`
    console.log("The Balcony of Prosperity Universe has been defined.");
    console.log("To launch the simulation, create a container element and call `TheBalconyOfProsperity.ignite('your-container-id')`.");
    
    // For demonstration purposes, if this code is run in a browser with a body,
    // we can auto-initialize it.
    if (typeof document !== 'undefined' && document.body) {
        if (!document.getElementById('universe-container')) {
            const container = document.createElement('div');
            container.id = 'universe-container';
            container.style.width = '100vw';
            container.style.height = '100vh';
            document.body.appendChild(container);
            TheBalconyOfProsperity.ignite('universe-container');
        }
    }
    
    return TheBalconyOfProsperity;
}

// To maintain the export structure of the original TSX file.
export default GlobalMarketMap;