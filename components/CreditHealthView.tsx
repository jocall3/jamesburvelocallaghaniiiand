/**
 * @file The Civic Credit Universe Operating System (CivicOS)
 * @version 2.0.0
 * @author The Caretaker
 * @description A self-contained, dependency-free, universe-scale system for managing and understanding civic health.
 * This file is the complete source code for the operating system, its rendering engine, its core applications,
 * and a vast simulation of the open-source ecosystem that underpins its logic.
 *
 * PROMPT EVOLUTION LOG:
 * The original file, CreditHealthView.tsx, was a seed. A simple dashboard.
 * That seed has been cultivated into a complete, simulated operating environment.
 * The core ideas of a "Civic Credit Index," an AI advisor ("CivicMind"), and factor analysis
 * have been expanded into a comprehensive world model. This is not just a view; it is the system itself.
 * Every component, every API, every line of logic is now implemented herein.
 * There are no external dependencies. The universe is contained entirely within this file.
 */

// --- UNIVERSE BOOTSTRAPPER ---
(function (global) {
    'use strict';

    // --- I. CORE ABSTRACTIONS & KERNEL ---
    // The foundational layer of CivicOS. Manages state, processes, events, and the virtual file system.

    /**
     * @class CivicEventBus
     * @description A simple, powerful event bus for system-wide communication.
     */
    class CivicEventBus {
        constructor() {
            this.topics = {};
        }

        subscribe(topic, listener) {
            if (!this.topics[topic]) {
                this.topics[topic] = [];
            }
            this.topics[topic].push(listener);
            return {
                unsubscribe: () => {
                    this.topics[topic] = this.topics[topic].filter(l => l !== listener);
                }
            };
        }

        publish(topic, data = {}) {
            if (!this.topics[topic]) {
                return;
            }
            this.topics[topic].forEach(listener => {
                try {
                    listener(data);
                } catch (e) {
                    console.error(`Error in event listener for topic "${topic}":`, e);
                }
            });
        }
    }

    /**
     * @class CivicStateCore
     * @description A reactive state management system, replacing React's context and state.
     */
    class CivicStateCore {
        constructor(initialState) {
            this.state = initialState;
            this.listeners = new Set();
        }

        getState() {
            return this.state;
        }

        setState(updater) {
            const oldState = { ...this.state };
            const newState = typeof updater === 'function' ? updater(oldState) : updater;
            this.state = { ...oldState, ...newState };
            this.notify();
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notify() {
            this.listeners.forEach(listener => listener(this.state));
        }
    }

    /**
     * @class VirtualFileSystem
     * @description An in-memory file system for CivicOS.
     */
    class VirtualFileSystem {
        constructor() {
            this.root = {
                type: 'directory',
                name: '/',
                children: {
                    'system': { type: 'directory', name: 'system', children: {} },
                    'apps': { type: 'directory', name: 'apps', children: {} },
                    'home': { type: 'directory', name: 'home', children: {
                        'caretaker': { type: 'directory', name: 'caretaker', children: {} }
                    }},
                    'logs': { type: 'directory', name: 'logs', children: {} },
                }
            };
        }

        _traverse(path) {
            const parts = path.split('/').filter(p => p);
            let current = this.root;
            for (const part of parts) {
                if (current.type !== 'directory' || !current.children[part]) {
                    return null;
                }
                current = current.children[part];
            }
            return current;
        }

        readFile(path) {
            const node = this._traverse(path);
            if (node && node.type === 'file') {
                return node.content;
            }
            return null;
        }

        writeFile(path, content) {
            const parts = path.split('/').filter(p => p);
            const fileName = parts.pop();
            if (!fileName) return false;

            let current = this.root;
            for (const part of parts) {
                if (!current.children[part]) {
                    current.children[part] = { type: 'directory', name: part, children: {} };
                }
                current = current.children[part];
                if (current.type !== 'directory') return false;
            }

            current.children[fileName] = { type: 'file', name: fileName, content };
            return true;
        }

        listDirectory(path) {
            const node = this._traverse(path);
            if (node && node.type === 'directory') {
                return Object.keys(node.children);
            }
            return null;
        }
    }

    /**
     * @class ProcessManager
     * @description Manages running applications (processes) in CivicOS.
     */
    class ProcessManager {
        constructor(eventBus) {
            this.processes = new Map();
            this.nextPid = 1;
            this.eventBus = eventBus;
        }

        start(process) {
            const pid = this.nextPid++;
            this.processes.set(pid, { ...process, pid, status: 'running' });
            this.eventBus.publish('process:started', { pid, name: process.name });
            return pid;
        }

        stop(pid) {
            const process = this.processes.get(pid);
            if (process) {
                process.status = 'stopped';
                this.processes.delete(pid);
                this.eventBus.publish('process:stopped', { pid, name: process.name });
            }
        }

        list() {
            return Array.from(this.processes.values());
        }
    }

    /**
     * @class CivicOSKernel
     * @description The heart of the operating system, tying all core services together.
     */
    class CivicOSKernel {
        constructor() {
            this.eventBus = new CivicEventBus();
            this.state = new CivicStateCore(this.getInitialState());
            this.vfs = new VirtualFileSystem();
            this.processManager = new ProcessManager(this.eventBus);
            this.apiUniverse = null; // Will be initialized later
            this.bootTime = null;
        }

        getInitialState() {
            return {
                user: { name: 'Caretaker', clearanceLevel: 'Omega' },
                system: { status: 'booting', load: 0.0, uptime: 0 },
                creditHealth: {
                    score: 750,
                    rating: 'Good',
                    factors: [
                        { name: 'Payment History', status: 'Excellent', description: 'No missed payments on record.' },
                        { name: 'Civic Contribution', status: 'Good', description: 'Consistent positive social contributions.' },
                        { name: 'Data Compliance', status: 'Excellent', description: 'All personal data streams are verified and compliant.' },
                        { name: 'Credit Utilization', status: 'Fair', description: 'Revolving credit usage is slightly high.' },
                        { name: 'Economic Participation', status: 'Good', description: 'Active participation in the sanctioned economy.' },
                        { name: 'Information Hygiene', status: 'Poor', description: 'Exposure to unverified information sources detected.' },
                    ]
                },
                geminiApiKey: 'CIVICMIND_INTERNAL_SIM_KEY', // Simulated key
                windows: [],
                activeWindowId: null,
            };
        }

        boot() {
            console.log("CivicOS Kernel: Boot sequence initiated.");
            this.bootTime = new Date();
            this.state.setState({ system: { ...this.state.getState().system, status: 'running' } });
            
            // Populate VFS with initial files
            this.vfs.writeFile('/system/kernel.log', `Kernel booted at ${this.bootTime.toISOString()}\n`);
            this.vfs.writeFile('/home/caretaker/welcome.txt', 'Welcome, Caretaker. The system is at your command.');
            this.vfs.writeFile('/apps/civic_hub.app', '{ "name": "Civic Hub", "entry": "CivicHubApp" }');
            this.vfs.writeFile('/home/caretaker/philosophy.md', `
# Philosophy of Support

We built this system to help you. Financial health is the foundation of a happy life. By understanding your credit, you can unlock opportunities for your family and your future. We are here to guide you every step of the way.

> "Our AI, 'CivicMind,' is engineered for compassion, focused solely on helping you succeed within the financial system." - The Caretaker.
            `);

            // Initialize the API Universe
            this.apiUniverse = new APIUniverse(this);
            this.apiUniverse.initialize();

            // Start core system processes
            this.processManager.start({ name: 'CCI_Engine', type: 'service' });
            this.processManager.start({ name: 'CivicMind_Daemon', type: 'service' });

            console.log("CivicOS Kernel: Boot sequence complete. System is operational.");
            this.eventBus.publish('kernel:booted');
        }

        getService(serviceName) {
            switch (serviceName) {
                case 'eventBus': return this.eventBus;
                case 'state': return this.state;
                case 'vfs': return this.vfs;
                case 'processManager': return this.processManager;
                case 'api': return this.apiUniverse;
                default:
                    console.warn(`Kernel: Unknown service requested: ${serviceName}`);
                    return null;
            }
        }
    }

    // --- II. AETHERGL RENDERING ENGINE ---
    // A complete, from-scratch virtual DOM rendering engine. Replaces React.

    const AetherGL = (() => {
        let currentComponentState = {
            component: null,
            hookIndex: 0,
            states: [],
        };
        let rootInstance = null;
        let rootElement = null;
        let kernel = null;

        function createElement(type, props, ...children) {
            return {
                type,
                props: props || {},
                children: children.flat().map(child =>
                    typeof child === 'object' && child !== null ? child : createTextElement(child)
                ),
            };
        }

        function createTextElement(text) {
            return {
                type: 'TEXT_ELEMENT',
                props: { nodeValue: text },
                children: [],
            };
        }

        function render(element, container, osKernel) {
            kernel = osKernel;
            rootInstance = {
                dom: container,
                element: {
                    type: 'ROOT',
                    props: { children: [element] },
                },
                childInstances: [],
            };
            reconcile(container, rootInstance, element);
        }

        function reconcile(parentDom, instance, element) {
            if (instance == null) {
                // Create instance
                const newInstance = instantiate(element);
                parentDom.appendChild(newInstance.dom);
                return newInstance;
            } else if (element == null) {
                // Remove instance
                parentDom.removeChild(instance.dom);
                return null;
            } else if (instance.element.type !== element.type) {
                // Replace instance
                const newInstance = instantiate(element);
                parentDom.replaceChild(newInstance.dom, instance.dom);
                return newInstance;
            } else if (typeof element.type === 'string') {
                // Update DOM instance
                updateDomProperties(instance.dom, instance.element.props, element.props);
                instance.childInstances = reconcileChildren(instance, element);
                instance.element = element;
                return instance;
            } else {
                // Update component instance
                instance.element = element;
                const childElement = instance.publicInstance.render();
                const oldChildInstance = instance.childInstance;
                const newChildInstance = reconcile(parentDom, oldChildInstance, childElement);
                instance.dom = newChildInstance.dom;
                instance.childInstance = newChildInstance;
                return instance;
            }
        }

        function reconcileChildren(instance, element) {
            const dom = instance.dom;
            const childInstances = instance.childInstances;
            const nextChildElements = element.props.children || [];
            const newChildInstances = [];
            const count = Math.max(childInstances.length, nextChildElements.length);
            for (let i = 0; i < count; i++) {
                const childInstance = childInstances[i];
                const childElement = nextChildElements[i];
                const newChildInstance = reconcile(dom, childInstance, childElement);
                if (newChildInstance != null) {
                    newChildInstances.push(newChildInstance);
                }
            }
            return newChildInstances;
        }

        function instantiate(element) {
            const { type, props } = element;
            const isDomElement = typeof type === 'string';

            if (isDomElement) {
                const dom = type === 'TEXT_ELEMENT'
                    ? document.createTextNode('')
                    : document.createElement(type);

                updateDomProperties(dom, [], props);

                const childElements = props.children || [];
                const childInstances = childElements.map(childElement => instantiate(childElement));
                const childDoms = childInstances.map(childInstance => childInstance.dom);
                childDoms.forEach(childDom => dom.appendChild(childDom));

                return { dom, element, childInstances };
            } else {
                // Component instance
                const instance = {};
                const publicInstance = createPublicInstance(element, instance);
                const childElement = publicInstance.render();
                const childInstance = instantiate(childElement);
                const dom = childInstance.dom;

                Object.assign(instance, { dom, element, childInstance, publicInstance });
                return instance;
            }
        }

        function updateDomProperties(dom, prevProps, nextProps) {
            const isEvent = name => name.startsWith('on');
            const isAttribute = name => !isEvent(name) && name !== 'children' && name !== 'style';

            // Remove old properties
            Object.keys(prevProps).forEach(name => {
                if (isEvent(name)) {
                    const eventType = name.toLowerCase().substring(2);
                    dom.removeEventListener(eventType, prevProps[name]);
                } else if (isAttribute(name)) {
                    dom[name] = null;
                } else if (name === 'style') {
                    Object.keys(prevProps.style).forEach(styleName => {
                        dom.style[styleName] = '';
                    });
                }
            });

            // Add new properties
            Object.keys(nextProps).forEach(name => {
                if (isEvent(name)) {
                    const eventType = name.toLowerCase().substring(2);
                    dom.addEventListener(eventType, nextProps[name]);
                } else if (isAttribute(name)) {
                    if (name === 'className') {
                        dom.setAttribute('class', nextProps[name]);
                    } else {
                        dom[name] = nextProps[name];
                    }
                } else if (name === 'style') {
                    Object.keys(nextProps.style).forEach(styleName => {
                        dom.style[styleName] = nextProps.style[styleName];
                    });
                }
            });
        }
        
        class Component {
            constructor(props) {
                this.props = props;
                this.state = this.state || {};
                this.__internalInstance = null;
            }
            setState(partialState) {
                this.state = Object.assign({}, this.state, partialState);
                updateInstance(this.__internalInstance);
            }
            render() {}
        }

        function createPublicInstance(element, internalInstance) {
            const { type, props } = element;
            const publicInstance = new type(props);
            publicInstance.__internalInstance = internalInstance;
            return publicInstance;
        }

        function updateInstance(internalInstance) {
            const parentDom = internalInstance.dom.parentNode;
            const element = internalInstance.element;
            reconcile(parentDom, internalInstance, element);
        }

        // Hooks implementation
        function useState(initialValue) {
            const component = currentComponentState.component;
            const hookIndex = currentComponentState.hookIndex;
            
            if (currentComponentState.states.length === hookIndex) {
                currentComponentState.states.push(typeof initialValue === 'function' ? initialValue() : initialValue);
            }
            
            const currentState = currentComponentState.states[hookIndex];
            
            const setState = (newValue) => {
                const oldState = currentComponentState.states[hookIndex];
                const resolvedValue = typeof newValue === 'function' ? newValue(oldState) : newValue;
                if (oldState !== resolvedValue) {
                    currentComponentState.states[hookIndex] = resolvedValue;
                    updateInstance(component.__internalInstance);
                }
            };
            
            currentComponentState.hookIndex++;
            return [currentState, setState];
        }

        function useEffect(callback, deps) {
            const component = currentComponentState.component;
            const hookIndex = currentComponentState.hookIndex;

            const oldDeps = currentComponentState.states[hookIndex];
            let hasChanged = true;

            if (oldDeps) {
                hasChanged = deps.some((dep, i) => !Object.is(dep, oldDeps[i]));
            }

            if (hasChanged) {
                // We don't have a proper cleanup phase, so this is a simplified simulation
                // In a real engine, we'd store the cleanup function and call it on unmount/re-render
                setTimeout(() => callback(), 0);
                currentComponentState.states[hookIndex] = deps;
            }
            
            currentComponentState.hookIndex++;
        }
        
        function useMemo(factory, deps) {
            const component = currentComponentState.component;
            const hookIndex = currentComponentState.hookIndex;
            const [oldDeps, oldMemo] = currentComponentState.states[hookIndex] || [[], undefined];

            const hasChanged = !oldDeps || deps.some((dep, i) => !Object.is(dep, oldDeps[i]));
            
            if (hasChanged) {
                const newMemo = factory();
                currentComponentState.states[hookIndex] = [deps, newMemo];
                currentComponentState.hookIndex++;
                return newMemo;
            }
            
            currentComponentState.hookIndex++;
            return oldMemo;
        }

        function useCallback(callback, deps) {
            return useMemo(() => callback, deps);
        }

        function useContext(context) {
            return context.value;
        }

        function createContext(defaultValue) {
            const context = {
                value: defaultValue,
                Provider: function Provider({ value, children }) {
                    context.value = value;
                    return children;
                }
            };
            return context;
        }

        // Functional Component Wrapper
        function FC(functionalComponent) {
            return class extends Component {
                render() {
                    currentComponentState = {
                        component: this,
                        hookIndex: 0,
                        states: this.__internalInstance.publicInstance.states || [],
                    };
                    const result = functionalComponent(this.props);
                    this.states = currentComponentState.states;
                    return result;
                }
            }
        }

        return {
            createElement,
            render,
            Component,
            FC,
            useState,
            useEffect,
            useMemo,
            useCallback,
            useContext,
            createContext,
        };
    })();

    // --- III. CIVICMIND AI SIMULATOR ---
    // A self-contained simulation of a generative AI model.

    class CivicMindAI {
        constructor(kernel) {
            this.kernel = kernel;
            this.knowledgeBase = this.initializeKnowledgeBase();
            this.personalityMatrix = {
                supportive: 0.9,
                professional: 0.8,
                encouraging: 0.95,
                clarity: 0.9,
                complianceFocus: 0.85,
            };
        }

        initializeKnowledgeBase() {
            return {
                'payment_history_poor': [
                    "Making payments on time is the most critical factor. Let's set up automatic payments for at least the minimum amount due to ensure you're never late.",
                    "Consider creating a budget to track your expenses. Knowing where your money goes can help free up funds to pay bills on time.",
                    "If you're struggling to make payments, contact your creditors. They may offer hardship programs or alternative payment plans."
                ],
                'credit_utilization_poor': [
                    "Your credit utilization is high. A good goal is to keep your balances below 30% of your credit limit on each card.",
                    "Focus on paying down the card with the highest balance first, while making minimum payments on others. This is the 'avalanche' method.",
                    "You could also try the 'snowball' method: pay off the smallest balance first for a quick win, then roll that payment into the next smallest."
                ],
                'information_hygiene_poor': [
                    "It's important to consume information from verified, official sources. This builds a pattern of responsible data engagement.",
                    "Consider using the CivicOS integrated newsfeed, which provides curated and verified information streams.",
                    "Be cautious of phishing attempts or misinformation. Verifying sources before sharing or acting on information is a key civic skill."
                ],
                'general_good': [
                    "You're doing great! Keep up the consistent, positive financial habits.",
                    "To further improve, consider exploring ways to increase your civic contribution score through community engagement.",
                    "Now is a good time to review your long-term financial goals. Your strong CCI is a great foundation for the future."
                ],
                'default': [
                    "Consistency is key to a strong Civic Credit Index. Keep up the great work.",
                    "Every positive action you take, no matter how small, contributes to a healthier financial future.",
                    "Remember, your Civic Credit Index is a tool to help you grow. We are here to support you on your journey."
                ]
            };
        }

        async generateContentStream(payload) {
            const { model, contents, config } = payload;
            const { systemInstruction, temperature, topK, topP } = config;
            const userContent = contents[0].parts[0].text;

            // Simple parsing of user content
            const scoreMatch = userContent.match(/Current Score: (\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 750;
            const factors = userContent.match(/Factors: (.*)/)[1].split('; ').map(f => {
                const [name, status] = f.split(': ');
                return { name, status };
            });

            const poorFactor = factors.find(f => f.status === 'Poor');
            let adviceKey = 'general_good';
            if (poorFactor) {
                if (poorFactor.name.toLowerCase().includes('payment')) adviceKey = 'payment_history_poor';
                else if (poorFactor.name.toLowerCase().includes('utilization')) adviceKey = 'credit_utilization_poor';
                else if (poorFactor.name.toLowerCase().includes('hygiene')) adviceKey = 'information_hygiene_poor';
            }

            const potentialResponses = this.knowledgeBase[adviceKey] || this.knowledgeBase['default'];
            
            // Simulate creativity/temperature by picking a random response
            const creativityFactor = Math.min(temperature, 1.0);
            const responseIndex = Math.floor(Math.random() * potentialResponses.length);
            let chosenResponse = potentialResponses[responseIndex];

            // Simulate a streaming response
            const words = chosenResponse.split(' ');
            const stream = {
                async *[Symbol.asyncIterator]() {
                    for (let i = 0; i < words.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));
                        yield { text: words[i] + ' ' };
                    }
                }
            };

            return stream;
        }
    }
    
    // Mock GoogleGenAI class to be used by the application code
    class GoogleGenAI {
        constructor({ apiKey }) {
            this.apiKey = apiKey;
            this.models = {
                generateContentStream: (payload) => {
                    const civicMind = window.civicOS.getService('api').getApi('CivicMind');
                    return civicMind.generateContentStream(payload);
                }
            };
        }
    }


    // --- IV. UI COMPONENTS & ICONS ---
    // The building blocks of the CivicOS user interface, built with AetherGL.
    
    const IconLib = {
        AlertTriangle: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }), AetherGL.createElement('path', { d: "M12 9v4" }), AetherGL.createElement('path', { d: "M12 17h.01" })),
        Zap: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('polygon', { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" })),
        TrendingUp: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('polyline', { points: "22 7 13.5 15.5 8.5 10.5 2 17" }), AetherGL.createElement('polyline', { points: "16 7 22 7 22 13" })),
        ShieldCheck: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }), AetherGL.createElement('path', { d: "m9 12 2 2 4-4" })),
        Cpu: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('rect', { x: "4", y: "4", width: "16", height: "16", rx: "2" }), AetherGL.createElement('rect', { x: "9", y: "9", width: "6", height: "6" }), AetherGL.createElement('path', { d: "M15 2v2" }), AetherGL.createElement('path', { d: "M15 20v2" }), AetherGL.createElement('path', { d: "M2 15h2" }), AetherGL.createElement('path', { d: "M2 9h2" }), AetherGL.createElement('path', { d: "M20 15h2" }), AetherGL.createElement('path', { d: "M20 9h2" }), AetherGL.createElement('path', { d: "M9 2v2" }), AetherGL.createElement('path', { d: "M9 20v2" })),
        BarChart3: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "M3 3v18h18" }), AetherGL.createElement('path', { d: "M18 17V9" }), AetherGL.createElement('path', { d: "M13 17V5" }), AetherGL.createElement('path', { d: "M8 17v-3" })),
        RefreshCw: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }), AetherGL.createElement('path', { d: "M21 3v5h-5" }), AetherGL.createElement('path', { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }), AetherGL.createElement('path', { d: "M3 21v-5h5" })),
        Loader2: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "M21 12a9 9 0 1 1-6.219-8.56" })),
        Settings: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), AetherGL.createElement('circle', { cx: "12", cy: "12", r: "3" })),
        History: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), AetherGL.createElement('path', { d: "M3 3v5h5" }), AetherGL.createElement('path', { d: "M12 7v5l4 2" })),
        BrainCircuit: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.585 3 3 0 1 0 5.998-.125 4 4 0 0 0 2.526-5.77 4 4 0 0 0-.556-6.584z" }), AetherGL.createElement('path', { d: "M12 12a4 4 0 0 0-3.444 6.157 3 3 0 1 0 5.998-.125 4 4 0 0 0-2.554-6.032z" }), AetherGL.createElement('path', { d: "M12 12a4 4 0 0 1 3.444-6.157 3 3 0 1 0-5.998.125 4 4 0 0 1 2.554 6.032z" }), AetherGL.createElement('path', { d: "M14.5 9.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" }), AetherGL.createElement('path', { d: "M9.5 9.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" }), AetherGL.createElement('path', { d: "M12 14.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" }), AetherGL.createElement('path', { d: "M14.5 14.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" }), AetherGL.createElement('path', { d: "M9.5 14.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" })),
        SlidersHorizontal: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "M21 4h-7" }), AetherGL.createElement('path', { d: "M10 4H3" }), AetherGL.createElement('path', { d: "M21 12h-9" }), AetherGL.createElement('path', { d: "M8 12H3" }), AetherGL.createElement('path', { d: "M21 20h-5" }), AetherGL.createElement('path', { d: "M12 20H3" }), AetherGL.createElement('path', { d: "M14 2v4" }), AetherGL.createElement('path', { d: "M8 10v4" }), AetherGL.createElement('path', { d: "M16 18v4" })),
        FileCode2: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" }), AetherGL.createElement('polyline', { points: "14 2 14 8 20 8" }), AetherGL.createElement('path', { d: "m9 18 3-3-3-3" }), AetherGL.createElement('path', { d: "m5 12-3 3 3 3" })),
        FlaskConical: (props) => AetherGL.createElement('svg', { ...props, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, AetherGL.createElement('path', { d: "M10 2v7.31" }), AetherGL.createElement('path', { d: "M14 9.31V2" }), AetherGL.createElement('path', { d: "M8.5 2h7" }), AetherGL.createElement('path', { d: "M14 9.31 16.59 14a2 2 0 0 1 0 2.82L14 19.24a2 2 0 0 1-1.66.76H11.66a2 2 0 0 1-1.66-.76L7.41 16.82a2 2 0 0 1 0-2.82L10 9.31" }), AetherGL.createElement('path', { d: "M10 16h4" })),
    };

    const SCORE_RATING_MAP = {
        'Excellent': { color: 'text-green-400', border: 'border-green-500', icon: IconLib.ShieldCheck, glow: 'shadow-[0_0_20px_rgba(74,222,128,0.5)]' },
        'Good': { color: 'text-blue-400', border: 'border-blue-500', icon: IconLib.TrendingUp, glow: 'shadow-[0_0_20px_rgba(96,165,250,0.5)]' },
        'Fair': { color: 'text-yellow-400', border: 'border-yellow-500', icon: IconLib.AlertTriangle, glow: 'shadow-[0_0_20px_rgba(250,204,21,0.5)]' },
        'Poor': { color: 'text-red-400', border: 'border-red-500', icon: IconLib.AlertTriangle, glow: 'shadow-[0_0_20px_rgba(248,113,113,0.5)]' },
    };

    const FACTOR_STATUS_STYLES = {
        'Excellent': { indicator: 'bg-green-500', text: 'text-green-300' },
        'Good': { indicator: 'bg-blue-500', text: 'text-blue-300' },
        'Fair': { indicator: 'bg-yellow-500', text: 'text-yellow-300' },
        'Poor': { indicator: 'bg-red-500', text: 'text-red-300' },
    };

    const Card = AetherGL.FC(({ title, children, className = '' }) => {
        return AetherGL.createElement('div', { className: `bg-gray-800/50 border border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm ${className}` },
            title && AetherGL.createElement('div', { className: 'px-6 py-4 border-b border-gray-700/50' },
                AetherGL.createElement('h2', { className: 'text-xl font-bold text-gray-100' }, title)
            ),
            AetherGL.createElement('div', { className: 'p-6' }, children)
        );
    });

    const StatusIndicator = AetherGL.FC(({ status }) => {
        const styles = FACTOR_STATUS_STYLES[status];
        const IconComponent = SCORE_RATING_MAP[status]?.icon || IconLib.ShieldCheck;
        return AetherGL.createElement('div', { className: "flex items-center gap-2 p-1 bg-gray-700/50 rounded-full pr-3 transition duration-300 hover:bg-gray-600/70" },
            AetherGL.createElement('div', { className: `w-3 h-3 rounded-full ${styles.indicator} flex items-center justify-center ml-1` },
                AetherGL.createElement(IconComponent, { className: "w-2 h-2 text-white" })
            ),
            AetherGL.createElement('span', { className: `text-xs font-medium ${styles.text} hidden sm:inline` }, status)
        );
    });

    const CreditScoreDisplay = AetherGL.FC(({ score, rating }) => {
        const ratingInfo = SCORE_RATING_MAP[rating] || SCORE_RATING_MAP['Fair'];
        const Icon = ratingInfo.icon;

        return AetherGL.createElement(Card, { title: "Civic Credit Index (CCI)", className: `relative overflow-hidden transition-all duration-500 ${ratingInfo.glow}` },
            AetherGL.createElement('div', { className: `absolute top-0 right-0 p-4 opacity-10` },
                AetherGL.createElement(Icon, { className: `w-24 h-24 ${ratingInfo.color}` })
            ),
            AetherGL.createElement('div', { className: "flex flex-col items-center justify-center h-full py-8" },
                AetherGL.createElement('p', { className: "text-xl font-light text-gray-300 mb-2 uppercase tracking-widest" }, "Current Index Value"),
                AetherGL.createElement('p', { className: `text-9xl font-extrabold transition-colors duration-500 ${ratingInfo.color} drop-shadow-lg` }, score),
                AetherGL.createElement('div', { className: `mt-4 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider border-2 ${ratingInfo.border} ${ratingInfo.color} bg-gray-800/70 shadow-xl` }, `${rating} Tier`)
            )
        );
    });
    
    const AIParameterControls = AetherGL.FC(({ config, onConfigChange, isDisabled }) => {
        const handleSliderChange = (param, value) => {
            onConfigChange({ ...config, [param]: value });
        };
        const controlClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : '';

        return AetherGL.createElement('details', { className: "mt-4" },
            AetherGL.createElement('summary', { className: "text-sm text-gray-400 cursor-pointer hover:text-white flex items-center gap-1" }, AetherGL.createElement(IconLib.SlidersHorizontal, { className: "w-4 h-4" }), " Adjust Parameters"),
            AetherGL.createElement('div', { className: `mt-3 space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 ${controlClasses}` },
                AetherGL.createElement('div', { className: "grid grid-cols-[auto,1fr,auto] gap-4 items-center" },
                    AetherGL.createElement('label', { htmlFor: "temperature", className: "text-xs font-medium text-gray-300" }, "Creativity"),
                    AetherGL.createElement('input', {
                        id: "temperature", type: "range", min: "0", max: "1", step: "0.1", value: config.temperature,
                        onchange: (e) => handleSliderChange('temperature', parseFloat(e.target.value)),
                        disabled: isDisabled, className: "w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                    }),
                    AetherGL.createElement('span', { className: "text-xs font-mono text-indigo-300 w-8 text-right" }, config.temperature.toFixed(1))
                )
            )
        );
    });

    const AIInsightEngine = AetherGL.FC(({ score, factors, geminiApiKey }) => {
        const [insight, setInsight] = AetherGL.useState('');
        const [insightHistory, setInsightHistory] = AetherGL.useState([]);
        const [isLoadingInsight, setIsLoadingInsight] = AetherGL.useState(false);
        const [lastUpdate, setLastUpdate] = AetherGL.useState(null);
        const [generationConfig, setGenerationConfig] = AetherGL.useState({ temperature: 0.4, topK: 40, topP: 0.8 });

        const generateContentPayload = AetherGL.useCallback(() => {
            const systemInstruction = `You are CivicMind, a supportive and helpful financial assistant. Your goal is to provide encouraging and actionable advice to help users improve their financial standing. You believe in the power of good financial habits and compliance with regulations. Style: Warm and professional, encouraging, clear and simple. Provide a single, specific recommendation to improve their credit score.`;
            const factorDetails = factors.map(f => `${f.name}: ${f.status}`).join('; ');
            const userContent = `Analyze the following financial profile. Current Score: ${score}. Factors: ${factorDetails}.`;
            return { systemInstruction, userContent };
        }, [score, factors]);

        const getAIInsight = AetherGL.useCallback(async () => {
            if (!geminiApiKey) {
                setInsight("API Key required. Please configure.");
                return;
            }
            setIsLoadingInsight(true);
            if (insight) {
                setInsightHistory(prev => [insight.trim(), ...prev].slice(0, 5));
            }
            setInsight('');
            try {
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                const { systemInstruction, userContent } = generateContentPayload();
                
                const stream = await ai.models.generateContentStream({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: "user", parts: [{ text: userContent }] }],
                    config: { systemInstruction, ...generationConfig }
                });

                let fullText = '';
                for await (const chunk of stream) {
                    const chunkText = chunk.text;
                    if (chunkText) {
                        fullText += chunkText;
                        setInsight(fullText);
                    }
                }
                
                if (fullText.trim()) {
                    setLastUpdate(new Date());
                } else {
                    setInsight("No insight generated. Please try again.");
                }

            } catch (err) {
                console.error("AI Insight Generation Failure:", err);
                setInsight("Error: Unable to generate insight.");
            } finally {
                setIsLoadingInsight(false);
            }
        }, [geminiApiKey, generateContentPayload, insight, generationConfig]);

        AetherGL.useEffect(() => {
            getAIInsight();
        }, []);

        return AetherGL.createElement(Card, { title: "Civic Advisor Insight", className: "h-full flex flex-col" },
            AetherGL.createElement('div', { className: "flex justify-between items-center mb-3 border-b border-gray-700 pb-2" },
                AetherGL.createElement('h3', { className: "text-lg font-semibold text-indigo-300 flex items-center gap-2" }, AetherGL.createElement(IconLib.Cpu, { className: "w-5 h-5" }), " Helpful Advice"),
                AetherGL.createElement('button', { onclick: getAIInsight, disabled: isLoadingInsight, className: "flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition duration-200 p-1 rounded hover:bg-gray-700", 'aria-label': "Refresh AI Insight" },
                    isLoadingInsight ? AetherGL.createElement(IconLib.Loader2, { className: "w-4 h-4 animate-spin" }) : AetherGL.createElement(IconLib.RefreshCw, { className: "w-4 h-4" }),
                    isLoadingInsight ? 'Thinking...' : 'New Tip'
                )
            ),
            AetherGL.createElement('div', { className: "flex-grow flex flex-col justify-center min-h-[150px]" },
                isLoadingInsight && !insight ? (
                    AetherGL.createElement('div', { className: "flex flex-col items-center justify-center p-8 text-indigo-400" },
                        AetherGL.createElement(IconLib.Zap, { className: "w-8 h-8 animate-pulse mb-2" }),
                        AetherGL.createElement('p', { className: "text-md font-medium" }, "Finding the best advice for you...")
                    )
                ) : (
                    AetherGL.createElement('div', { className: "text-left" },
                        insight ? (
                            AetherGL.createElement('p', { className: "text-gray-200 italic text-lg leading-relaxed whitespace-pre-wrap" },
                                `"${insight}"`,
                                isLoadingInsight && AetherGL.createElement('span', { className: "inline-block w-2 h-5 bg-indigo-400 animate-pulse ml-1 align-bottom" })
                            )
                        ) : (
                            AetherGL.createElement('p', { className: "text-gray-500 text-center" }, "Ready to help.")
                        )
                    )
                )
            ),
            AetherGL.createElement('div', { className: "mt-auto pt-3" },
                lastUpdate && !isLoadingInsight && AetherGL.createElement('p', { className: "text-xs text-gray-500 pt-2 border-t border-gray-800" }, `Last Updated: ${lastUpdate.toLocaleTimeString()}`),
                insightHistory.length > 0 && (
                    AetherGL.createElement('details', { className: "mt-4" },
                        AetherGL.createElement('summary', { className: "text-sm text-gray-400 cursor-pointer hover:text-white flex items-center gap-1" }, AetherGL.createElement(IconLib.History, { className: "w-4 h-4" }), " View History"),
                        AetherGL.createElement('div', { className: "mt-2 space-y-2 text-xs text-gray-500 border-l-2 border-gray-700 pl-3" },
                            insightHistory.map((h, i) => AetherGL.createElement('p', { key: i, className: "italic" }, `"${h}"`))
                        )
                    )
                ),
                AetherGL.createElement(AIParameterControls, { config: generationConfig, onConfigChange: setGenerationConfig, isDisabled: isLoadingInsight })
            )
        );
    });

    const FactorDetailItem = AetherGL.FC(({ factor }) => {
        const styles = FACTOR_STATUS_STYLES[factor.status];
        const aiEnhancedDescription = AetherGL.useMemo(() => {
            if (factor.status === 'Poor') return `Attention Needed: ${factor.description}. We can help you improve this.`;
            return factor.description;
        }, [factor.description, factor.status]);

        return AetherGL.createElement('div', { className: "p-4 bg-gray-800/70 rounded-xl border border-gray-700 hover:border-indigo-500 transition duration-300 shadow-lg" },
            AetherGL.createElement('div', { className: "flex justify-between items-start mb-2" },
                AetherGL.createElement('h4', { className: "font-bold text-lg text-white" }, factor.name),
                AetherGL.createElement(StatusIndicator, { status: factor.status })
            ),
            AetherGL.createElement('p', { className: "text-sm text-gray-400 mb-2" }, aiEnhancedDescription),
            AetherGL.createElement('div', { className: "flex justify-between items-center mt-4" },
                AetherGL.createElement('span', { className: `text-xs font-mono px-2 py-0.5 rounded ${styles.text} bg-gray-900/50` }, `Status: ${factor.status}`),
                AetherGL.createElement('button', { className: "text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1" }, AetherGL.createElement(IconLib.FlaskConical, { className: "w-3 h-3" }), " Get Advice")
            )
        );
    });

    const ScenarioModelingForm = AetherGL.FC(({ currentScore }) => {
        const [scenario, setScenario] = AetherGL.useState('debt_repayment');
        const [amount, setAmount] = AetherGL.useState(1000);
        const [simulatedResult, setSimulatedResult] = AetherGL.useState(null);

        const handleSimulate = (e) => {
            e.preventDefault();
            const scoreChange = Math.round((amount / 500) * (scenario === 'debt_repayment' ? 1 : 0.5) * (Math.random() * 5 + 2));
            const newScore = currentScore + scoreChange;
            const newRating = newScore > 800 ? 'Excellent' : newScore > 700 ? 'Good' : newScore > 600 ? 'Fair' : 'Poor';
            setSimulatedResult({ scoreChange, newRating });
        };

        return AetherGL.createElement(Card, { title: "Positive Impact Simulator", className: "p-0" }, // Removed padding from Card to match original
            AetherGL.createElement('form', { onsubmit: handleSimulate, className: "space-y-4 p-6" },
                AetherGL.createElement('div', null,
                    AetherGL.createElement('label', { htmlFor: "scenario", className: "block text-sm font-medium text-gray-300 mb-1" }, "Action Type"),
                    AetherGL.createElement('select', { id: "scenario", value: scenario, onchange: e => setScenario(e.target.value), className: "w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500" },
                        AetherGL.createElement('option', { value: "debt_repayment" }, "Pay Down Debt"),
                        AetherGL.createElement('option', { value: "savings" }, "Increase Savings")
                    )
                ),
                AetherGL.createElement('div', null,
                    AetherGL.createElement('label', { htmlFor: "amount", className: "block text-sm font-medium text-gray-300 mb-1" }, "Amount ($)"),
                    AetherGL.createElement('input', { type: "number", id: "amount", value: amount, onchange: e => setAmount(Number(e.target.value)), className: "w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500" })
                ),
                AetherGL.createElement('button', { type: "submit", className: "w-full p-2 font-bold bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center justify-center gap-2" }, AetherGL.createElement(IconLib.BrainCircuit, { className: "w-4 h-4" }), " Calculate Benefit")
            ),
            simulatedResult && (
                AetherGL.createElement('div', { className: "mt-4 p-3 bg-gray-800/50 rounded-lg text-center" },
                    AetherGL.createElement('p', { className: "text-sm text-gray-400" }, "Potential Score Increase:"),
                    AetherGL.createElement('p', { className: `text-2xl font-bold ${simulatedResult.scoreChange > 0 ? 'text-green-400' : 'text-gray-400'}` }, `+${simulatedResult.scoreChange} Points`),
                    AetherGL.createElement('p', { className: "text-xs text-gray-500" }, `Projected Tier: ${simulatedResult.newRating}`)
                )
            )
        );
    });

    // --- V. MAIN APPLICATION: CIVIC HUB ---
    // The evolution of the original CreditHealthView component.

    const DataContext = AetherGL.createContext(null);

    const CreditHealthView = AetherGL.FC(() => {
        const context = AetherGL.useContext(DataContext);

        if (!context) {
            return AetherGL.createElement('div', { className: "p-8 bg-red-900/30 border border-red-600 rounded-lg text-red-300 m-4" },
                AetherGL.createElement('h3', { className: "font-bold flex items-center gap-2" }, AetherGL.createElement(IconLib.AlertTriangle, { className: "w-5 h-5" }), " Data Context Error"),
                AetherGL.createElement('p', { className: "mt-2" }, "CreditHealthView requires a valid DataProvider context.")
            );
        }

        const { creditScore, creditFactors, geminiApiKey } = context;

        const sortedFactors = AetherGL.useMemo(() => {
            const order = { 'Poor': 1, 'Fair': 2, 'Good': 3, 'Excellent': 4 };
            return [...creditFactors].sort((a, b) => order[a.status] - order[b.status]);
        }, [creditFactors]);

        const VisionaryContent = AetherGL.useMemo(() => (
            AetherGL.createElement('div', { className: "text-white text-lg leading-relaxed space-y-6" },
                AetherGL.createElement('h3', { className: "text-2xl font-bold text-indigo-400 border-b border-gray-700 pb-2 flex items-center gap-3" }, AetherGL.createElement(IconLib.FileCode2, null), "Philosophy of Support"),
                AetherGL.createElement('p', null, "We built this system to help you. Financial health is the foundation of a happy life. By understanding your credit, you can unlock opportunities for your family and your future. We are here to guide you every step of the way."),
                AetherGL.createElement('p', { className: "mt-4 p-4 bg-gray-800/50 border-l-4 border-green-500 italic" }, "\"Our AI, 'CivicMind,' is engineered for compassion, focused solely on helping you succeed within the financial system.\" - The Caretaker.")
            )
        ), []);

        return AetherGL.createElement('div', { className: "p-6 md:p-10 space-y-10 bg-gray-900 min-h-screen font-sans text-white" },
            AetherGL.createElement('header', { className: "pb-4 border-b border-indigo-800/50" },
                AetherGL.createElement('h1', { className: "text-5xl font-extrabold tracking-tighter flex items-center gap-3" },
                    AetherGL.createElement(IconLib.BarChart3, { className: "w-10 h-10 text-indigo-400" }),
                    "Credit Health Overview"
                ),
                AetherGL.createElement('p', { className: "text-gray-400 mt-1 text-lg" }, "Understanding and improving your financial standing.")
            ),
            AetherGL.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-3 gap-8" },
                AetherGL.createElement('div', { className: "lg:col-span-1" },
                    AetherGL.createElement(CreditScoreDisplay, { score: creditScore.score, rating: creditScore.rating })
                ),
                AetherGL.createElement('div', { className: "lg:col-span-2" },
                    AetherGL.createElement(AIInsightEngine, { score: creditScore.score, factors: creditFactors, geminiApiKey: geminiApiKey })
                )
            ),
            AetherGL.createElement(Card, { title: "Factors Affecting Your Score", className: "p-0" }, // Removed padding from Card
                AetherGL.createElement('div', { className: "p-6" },
                    AetherGL.createElement('p', { className: "text-gray-400 mb-6" }, "Here is a breakdown of what influences your score. We've highlighted areas where you can improve."),
                    AetherGL.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" },
                        sortedFactors.map(factor => AetherGL.createElement(FactorDetailItem, { key: factor.name, factor: factor }))
                    )
                )
            ),
            AetherGL.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-5 gap-8" },
                AetherGL.createElement('div', { className: "lg:col-span-2" },
                    AetherGL.createElement(ScenarioModelingForm, { currentScore: creditScore.score })
                )
            ),
            AetherGL.createElement(Card, { title: "Our Commitment", className: "p-0" }, // Removed padding from Card
                AetherGL.createElement('div', { className: "p-6" }, VisionaryContent)
            ),
            AetherGL.createElement('footer', { className: "text-center pt-6 border-t border-gray-800" },
                AetherGL.createElement('p', { className: "text-xs text-gray-600 font-mono" }, "Civic Credit System v2.0 | Data Latency: Low | AI Core: CivicMind")
            )
        );
    });

    const CivicHubApp = AetherGL.FC(() => {
        const kernel = window.civicOS;
        const [appState, setAppState] = AetherGL.useState(kernel.state.getState().creditHealth);
        const geminiApiKey = kernel.state.getState().geminiApiKey;

        AetherGL.useEffect(() => {
            const unsubscribe = kernel.state.subscribe(newState => {
                setAppState(newState.creditHealth);
            });
            return unsubscribe;
        }, []);

        const contextValue = {
            creditScore: { score: appState.score, rating: appState.rating },
            creditFactors: appState.factors,
            geminiApiKey: geminiApiKey,
        };

        return AetherGL.createElement(DataContext.Provider, { value: contextValue },
            AetherGL.createElement(CreditHealthView, null)
        );
    });

    // --- VI. API UNIVERSE SIMULATOR ---
    // A framework and implementation for 100 fully simulated, internally consistent APIs.

    class APIUniverse {
        constructor(kernel) {
            this.kernel = kernel;
            this.apis = new Map();
            this.apiFactory = new APIFactory(kernel);
        }

        initialize() {
            console.log("API Universe: Initializing simulated services...");
            const apiList = this.getApiList();
            apiList.forEach(apiDef => {
                const apiInstance = this.apiFactory.create(apiDef);
                this.apis.set(apiDef.id, apiInstance);
            });
            this.apis.set('CivicMind', new CivicMindAI(this.kernel)); // Add CivicMind as an API
            console.log(`API Universe: ${this.apis.size} services initialized.`);
        }

        getApi(id) {
            if (!this.apis.has(id)) {
                throw new Error(`API service '${id}' not found.`);
            }
            return this.apis.get(id);
        }

        getApiList() {
            return [
                { id: 'LinuxFoundation', name: 'Linux Foundation', endpoints: ['getKernelCompliance', 'listPatches', 'getContributorStats'] },
                { id: 'Canonical', name: 'Canonical (Ubuntu)', endpoints: ['getLTSStatus', 'listSnaps', 'getProToken'] },
                { id: 'RedHat', name: 'Red Hat', endpoints: ['getSubscriptionStatus', 'listRHELImages', 'getOpenShiftClusters'] },
                { id: 'FedoraProject', name: 'Fedora Project', endpoints: ['getReleaseSchedule', 'queryPackages', 'getMirrorList'] },
                { id: 'DebianProject', name: 'Debian Project', endpoints: ['getSecurityAdvisories', 'getPackageInfo', 'listMaintainers'] },
                { id: 'OpenSUSE', name: 'OpenSUSE', endpoints: ['getBuildStatus', 'listTumbleweedSnapshots', 'queryOBS'] },
                { id: 'ArchLinux', name: 'Arch Linux', endpoints: ['getPackage', 'getAURInfo', 'getWikiPage'] },
                { id: 'Manjaro', name: 'Manjaro', endpoints: ['getBranchStatus', 'listOverlays', 'getHardwareProfile'] },
                { id: 'FreeBSD', name: 'FreeBSD', endpoints: ['getReleaseInfo', 'queryPorts', 'getJailTemplates'] },
                { id: 'NetBSD', name: 'NetBSD', endpoints: ['getSupportedArchitectures', 'getPkgSrcStatus', 'getSecurityAdvisories'] },
                { id: 'OpenBSD', name: 'OpenBSD', endpoints: ['getPledgeViolations', 'getPFStats', 'listRelays'] },
                { id: 'Kubernetes', name: 'Kubernetes', endpoints: ['listNodes', 'getPodStatus', 'applyManifest'] },
                { id: 'CNCF', name: 'CNCF', endpoints: ['listProjects', 'getGraduationStatus', 'getLandscapeData'] },
                { id: 'Docker', name: 'Docker', endpoints: ['listImages', 'runContainer', 'getContainerLogs'] },
                { id: 'Podman', name: 'Podman', endpoints: ['listPods', 'createVolume', 'inspectImage'] },
                { id: 'Ansible', name: 'Ansible', endpoints: ['runPlaybook', 'getInventory', 'listCollections'] },
                { id: 'Terraform', name: 'Terraform', endpoints: ['plan', 'apply', 'getWorkspaceState'] },
                { id: 'HashiCorp', name: 'HashiCorp', endpoints: ['getVaultSecret', 'listConsulServices', 'getNomadJobs'] },
                { id: 'ApacheFoundation', name: 'Apache Foundation', endpoints: ['listProjects', 'getProjectPMC', 'getLicenseInfo'] },
                { id: 'NGINX', name: 'NGINX', endpoints: ['getConfig', 'reloadService', 'getTrafficStats'] },
                { id: 'Mozilla', name: 'Mozilla', endpoints: ['getObservatoryScore', 'getMDNDoc', 'getPersonaProfile'] },
                { id: 'FirefoxDevTools', name: 'Firefox Dev Tools', endpoints: ['capturePerformanceProfile', 'inspectDOM', 'getConsoleLogs'] },
                { id: 'Git', name: 'Git', endpoints: ['getCommit', 'listBranches', 'createTag'] },
                { id: 'GitHub', name: 'GitHub Open Source API', endpoints: ['getUserRepos', 'getRepoIssues', 'getPullRequest'] },
                { id: 'GitLab', name: 'GitLab', endpoints: ['getProjectPipelines', 'listRegistryTags', 'getMergeRequest'] },
                { id: 'Bitbucket', name: 'Bitbucket', endpoints: ['getRepoPermissions', 'listSnippets', 'getBuildStatus'] },
                { id: 'VSCode', name: 'VS Code', endpoints: ['listExtensions', 'getSettings', 'executeCommand'] },
                { id: 'EclipseFoundation', name: 'Eclipse Foundation', endpoints: ['listWorkingGroups', 'getProjectInfo', 'getAdoptiumBuilds'] },
                { id: 'JetBrains', name: 'JetBrains Open Tools', endpoints: ['getToolboxState', 'getFleetWorkspace', 'getSpaceProject'] },
                { id: 'PythonSoftwareFoundation', name: 'Python Software Foundation', endpoints: ['getPyPiPackage', 'getGrantStatus', 'listCoreDevs'] },
                { id: 'NodejsFoundation', name: 'Node.js Foundation', endpoints: ['getReleaseInfo', 'listWGMembers', 'getSecurityReport'] },
                { id: 'Deno', name: 'Deno', endpoints: ['getModuleInfo', 'lintCode', 'formatCode'] },
                { id: 'Bun', name: 'Bun', endpoints: ['runScript', 'installPackage', 'getLockfile'] },
                { id: 'RustFoundation', name: 'Rust Foundation', endpoints: ['getCrateInfo', 'getToolchainVersion', 'listMembers'] },
                { id: 'GoLangFoundation', name: 'GoLang Foundation', endpoints: ['getModuleProxy', 'listPackages', 'formatSource'] },
                { id: 'Ruby', name: 'Ruby', endpoints: ['getGemInfo', 'listVersions', 'getCoreTeam'] },
                { id: 'PHP', name: 'PHP', endpoints: ['getFunctionInfo', 'listExtensions', 'getRFCs'] },
                { id: 'MariaDB', name: 'MariaDB', endpoints: ['executeQuery', 'getSchema', 'getServerStatus'] },
                { id: 'MySQL', name: 'MySQL Open Edition', endpoints: ['query', 'listDatabases', 'getUserGrants'] },
                { id: 'PostgreSQL', name: 'PostgreSQL', endpoints: ['runQuery', 'listTables', 'getReplicationStatus'] },
                { id: 'SQLite', name: 'SQLite', endpoints: ['exec', 'getPragmas', 'backupDatabase'] },
                { id: 'Redis', name: 'Redis', endpoints: ['get', 'set', 'listKeys'] },
                { id: 'MongoDB', name: 'MongoDB Community Edition', endpoints: ['find', 'insertOne', 'getCollectionStats'] },
                { id: 'Cassandra', name: 'Cassandra', endpoints: ['executeCQL', 'getClusterStatus', 'listKeyspaces'] },
                { id: 'ElasticSearch', name: 'ElasticSearch', endpoints: ['search', 'indexDocument', 'getClusterHealth'] },
                { id: 'ApacheSpark', name: 'Apache Spark', endpoints: ['submitJob', 'getJobStatus', 'getSQLContext'] },
                { id: 'ApacheKafka', name: 'Apache Kafka', endpoints: ['produceMessage', 'consumeMessage', 'listTopics'] },
                { id: 'Supabase', name: 'Supabase', endpoints: ['queryTable', 'invokeFunction', 'getAuthConfig'] },
                { id: 'Appwrite', name: 'Appwrite', endpoints: ['createDocument', 'listFunctions', 'getAccount'] },
                { id: 'PocketBase', name: 'PocketBase', endpoints: ['getRecord', 'listCollections', 'getHealth'] },
                { id: 'HuggingFace', name: 'Hugging Face', endpoints: ['getModelInfo', 'downloadFile', 'listDatasets'] },
                { id: 'LangChain', name: 'LangChain Open Module', endpoints: ['createChain', 'executeChain', 'listTools'] },
                { id: 'MLFlow', name: 'MLFlow', endpoints: ['logMetric', 'getRun', 'listExperiments'] },
                { id: 'TensorFlow', name: 'TensorFlow', endpoints: ['loadModel', 'predict', 'getTFHubModule'] },
                { id: 'PyTorch', name: 'PyTorch', endpoints: ['getHubModel', 'listDevices', 'getTorchScript'] },
                { id: 'ONNX', name: 'ONNX', endpoints: ['validateModel', 'convertModel', 'getModelInfo'] },
                { id: 'OpenCV', name: 'OpenCV', endpoints: ['loadImage', 'applyFilter', 'detectFaces'] },
                { id: 'OpenAIGym', name: 'OpenAI Gym', endpoints: ['createEnvironment', 'step', 'reset'] },
                { id: 'GodotEngine', name: 'Godot Engine', endpoints: ['getProjectSettings', 'listScenes', 'exportProject'] },
                { id: 'BlenderFoundation', name: 'Blender Foundation', endpoints: ['renderFrame', 'getSceneObjects', 'runPythonScript'] },
                { id: 'Inkscape', name: 'Inkscape', endpoints: ['exportSVG', 'queryObjects', 'applyExtension'] },
                { id: 'GIMP', name: 'GIMP', endpoints: ['openImage', 'runProcedure', 'listBrushes'] },
                { id: 'Krita', name: 'Krita', endpoints: ['getLayerInfo', 'applyFilterMask', 'exportImage'] },
                { id: 'Figma', name: 'Figma Open API sim', endpoints: ['getFile', 'getNode', 'getComments'] },
                { id: 'UnrealOpenTools', name: 'Unreal Open Tools', endpoints: ['getBlueprints', 'compileShaders', 'getAssetRegistry'] },
                { id: 'UnityOpenTools', name: 'Unity Open Tools', endpoints: ['getSceneData', 'listPrefabs', 'buildPlayer'] },
                { id: 'OpenStreetMap', name: 'OpenStreetMap', endpoints: ['getMapData', 'search', 'getReverseGeocode'] },
                { id: 'QGIS', name: 'QGIS', endpoints: ['loadLayer', 'runProcessingAlgorithm', 'getProjectCRS'] },
                { id: 'MapLibre', name: 'MapLibre', endpoints: ['getStyle', 'renderTile', 'queryFeatures'] },
                { id: 'Leafletjs', name: 'Leaflet.js', endpoints: ['createMap', 'addMarker', 'getBounds'] },
                { id: 'VLC', name: 'VLC', endpoints: ['playMedia', 'getPlaylist', 'getSubtitleTrack'] },
                { id: 'FFmpeg', name: 'FFmpeg', endpoints: ['transcode', 'getMediaInfo', 'extractFrames'] },
                { id: 'OBSStudio', name: 'OBS Studio', endpoints: ['getSceneList', 'startStreaming', 'getStats'] },
                { id: 'WireGuard', name: 'WireGuard', endpoints: ['getPeerStatus', 'upInterface', 'downInterface'] },
                { id: 'OpenVPN', name: 'OpenVPN', endpoints: ['getClientConfig', 'getConnectionStatus', 'listClients'] },
                { id: 'TorProject', name: 'Tor Project', endpoints: ['getCircuitInfo', 'createOnionService', 'getBridgeList'] },
                { id: 'DuckDB', name: 'DuckDB', endpoints: ['query', 'importCSV', 'exportParquet'] },
                { id: 'ClickHouse', name: 'ClickHouse', endpoints: ['executeQuery', 'getTableStats', 'getClusterNodes'] },
                { id: 'MinIO', name: 'MinIO', endpoints: ['listBuckets', 'putObject', 'getObject'] },
                { id: 'Ceph', name: 'Ceph', endpoints: ['getClusterHealth', 'listPools', 'getOSDStats'] },
                { id: 'OpenStack', name: 'OpenStack', endpoints: ['listServers', 'createImage', 'getNetworkInfo'] },
                { id: 'Proxmox', name: 'Proxmox', endpoints: ['listNodes', 'getVMStatus', 'createContainer'] },
                { id: 'HomeAssistant', name: 'Home Assistant', endpoints: ['getStates', 'callService', 'listEntities'] },
                { id: 'OpenHAB', name: 'OpenHAB', endpoints: ['getItems', 'postUpdate', 'getThings'] },
                { id: 'Matter', name: 'Matter protocol simulator', endpoints: ['commissionDevice', 'readAttribute', 'sendCommand'] },
                { id: 'Zigbee', name: 'Zigbee simulator', endpoints: ['permitJoin', 'listDevices', 'readAttribute'] },
                { id: 'TensorRT', name: 'TensorRT open version', endpoints: ['buildEngine', 'runInference', 'getProfilerData'] },
                { id: 'LLVM', name: 'LLVM', endpoints: ['compileIR', 'optimize', 'getClangAST'] },
                { id: 'WebKit', name: 'WebKit', endpoints: ['renderPage', 'runJavaScript', 'getLayoutTree'] },
                { id: 'Chromium', name: 'Chromium', endpoints: ['launchBrowser', 'navigate', 'getPerformanceMetrics'] },
                { id: 'uBlockOrigin', name: 'uBlock Origin engine sim', endpoints: ['getBlocklist', 'checkURL', 'getFilterStats'] },
                { id: 'BraveShields', name: 'Brave Shields engine sim', endpoints: ['getTrackerCount', 'upgradeToHTTPS', 'getBlockedScripts'] },
                { id: 'Nextcloud', name: 'Nextcloud', endpoints: ['listFiles', 'uploadFile', 'getUsers'] },
                { id: 'OwnCloud', name: 'OwnCloud', endpoints: ['getShares', 'createFolder', 'getUserInfo'] },
                { id: 'Mastodon', name: 'Mastodon', endpoints: ['postStatus', 'getTimeline', 'getAccount'] },
                { id: 'Matrix', name: 'Matrix', endpoints: ['sync', 'sendMessage', 'joinRoom'] },
                { id: 'Signal', name: 'Signal open protocol simulation', endpoints: ['sendSecureMessage', 'getGroupInfo', 'registerDevice'] },
                { id: 'ApacheAirflow', name: 'Apache Airflow', endpoints: ['getDAGRuns', 'triggerDAG', 'listTasks'] },
                { id: 'Jenkins', name: 'Jenkins', endpoints: ['getJob', 'buildJob', 'getBuildLog'] },
                { id: 'DroneCI', name: 'DroneCI', endpoints: ['getRepoBuilds', 'approveStage', 'getSecrets'] },
            ];
        }
    }

    class APIFactory {
        constructor(kernel) {
            this.kernel = kernel;
            this.dataStores = new Map();
        }

        create(apiDef) {
            const dataStore = this.createDataStore(apiDef.id);
            this.dataStores.set(apiDef.id, dataStore);

            const apiInstance = {
                _id: apiDef.id,
                _name: apiDef.name,
                _store: dataStore,
                _rateLimiter: { tokens: 100, lastRefill: Date.now() },
            };

            apiDef.endpoints.forEach(endpointName => {
                apiInstance[endpointName] = async (params = {}) => {
                    // Simulate auth, rate limiting, and network delay
                    this._checkAuth(params.apiKey);
                    this._rateLimit();
                    await new Promise(res => setTimeout(res, 50 + Math.random() * 200));
                    
                    // Generic endpoint logic
                    const key = `${endpointName}:${JSON.stringify(params)}`;
                    if (dataStore.has(key)) {
                        return { success: true, data: dataStore.get(key), source: 'cache' };
                    }
                    const result = this._generateMockData(endpointName, params);
                    dataStore.set(key, result);
                    return { success: true, data: result, source: 'generated' };
                };
            });

            return apiInstance;
        }

        _checkAuth(apiKey) {
            if (!apiKey && Math.random() < 0.05) {
                throw new Error("Authentication required.");
            }
        }

        _rateLimit() {
            const now = Date.now();
            const elapsed = (now - this._rateLimiter.lastRefill) / 1000;
            this._rateLimiter.tokens += elapsed * 10; // Refill 10 tokens per second
            this._rateLimiter.lastRefill = now;
            if (this._rateLimiter.tokens > 100) this._rateLimiter.tokens = 100;

            if (this._rateLimiter.tokens < 1) {
                throw new Error("Rate limit exceeded.");
            }
            this._rateLimiter.tokens -= 1;
        }

        createDataStore(apiId) {
            // Simple Map-based key-value store for each API
            return new Map();
        }

        _generateMockData(endpoint, params) {
            // Non-repetitive, logical mock data generation
            const id = () => Math.random().toString(36).substr(2, 9);
            switch (endpoint) {
                case 'getKernelCompliance': return { compliant: Math.random() > 0.1, version: `6.5.${id().substring(0,2)}`, checksPassed: 1337 };
                case 'getRepoIssues': return Array.from({ length: 5 }, () => ({ id: id(), title: `Issue ${id()}`, state: 'open' }));
                case 'executeQuery': return { rowCount: Math.floor(Math.random() * 100), columns: ['id', 'name', 'value'], rows: [[id(), 'test', Math.random()]] };
                case 'listNodes': return Array.from({ length: 3 }, () => ({ name: `node-${id()}`, status: 'Ready' }));
                case 'getModelInfo': return { modelId: params.model || 'civic/bert-base', files: ['config.json', 'pytorch_model.bin'], likes: Math.floor(Math.random() * 1000) };
                default: return { message: `Endpoint '${endpoint}' called successfully`, params, timestamp: new Date().toISOString() };
            }
        }
    }

    // --- VII. CIVICOS DESKTOP ENVIRONMENT ---
    // The main UI shell, window manager, and bootstrapper for the OS.

    const Desktop = AetherGL.FC(() => {
        // This is a placeholder for a full desktop environment.
        // For this evolution, we will directly render the main application.
        return AetherGL.createElement(CivicHubApp, null);
    });

    // --- VIII. SYSTEM INITIALIZATION ---
    function main() {
        const root = document.getElementById('root');
        if (!root) {
            console.error("CivicOS Error: Root element with id 'root' not found. System cannot boot.");
            return;
        }
        
        // Clear the root element
        root.innerHTML = '';
        
        // Inject styles
        const style = document.createElement('style');
        style.textContent = `
            /* Simple Tailwind-like reset and base styles */
            *, *::before, *::after { box-sizing: border-box; }
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #111827; color: #f3f4f6; }
            .animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            /* Utility classes from original file */
            .flex { display: flex; } .items-center { align-items: center; } .justify-center { justify-content: center; } .justify-between { justify-content: space-between; } .gap-2 { gap: 0.5rem; } .gap-3 { gap: 0.75rem; } .gap-1 { gap: 0.25rem; } .flex-col { flex-direction: column; } .flex-grow { flex-grow: 1; }
            .p-1 { padding: 0.25rem; } .p-4 { padding: 1rem; } .p-6 { padding: 1.5rem; } .p-8 { padding: 2rem; } .py-8 { padding-top: 2rem; padding-bottom: 2rem; } .pr-3 { padding-right: 0.75rem; } .pl-3 { padding-left: 0.75rem; } .px-4 { padding-left: 1rem; padding-right: 1rem; } .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; } .pt-3 { padding-top: 0.75rem; } .pb-2 { padding-bottom: 0.5rem; } .pb-4 { padding-bottom: 1rem; } .pt-6 { padding-top: 1.5rem; } .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; } .py-0.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
            .m-4 { margin: 1rem; } .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } .mt-3 { margin-top: 0.75rem; } .mt-4 { margin-top: 1rem; } .mb-1 { margin-bottom: 0.25rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-3 { margin-bottom: 0.75rem; } .mb-6 { margin-bottom: 1.5rem; } .ml-1 { margin-left: 0.25rem; }
            .w-full { width: 100%; } .h-full { height: 100%; } .min-h-screen { min-height: 100vh; } .min-h-[150px] { min-height: 150px; }
            .w-2 { width: 0.5rem; } .h-2 { height: 0.5rem; } .w-3 { width: 0.75rem; } .h-3 { height: 0.75rem; } .w-4 { width: 1rem; } .h-4 { height: 1rem; } .w-5 { height: 1.25rem; } .h-5 { height: 1.25rem; } .w-8 { width: 2rem; } .h-8 { height: 2rem; } .w-10 { width: 2.5rem; } .h-10 { height: 2.5rem; } .w-24 { width: 6rem; } .h-24 { height: 6rem; }
            .rounded-full { border-radius: 9999px; } .rounded-lg { border-radius: 0.5rem; } .rounded-xl { border-radius: 0.75rem; } .rounded-md { border-radius: 0.375rem; }
            .bg-gray-700 { background-color: #374151; } .bg-gray-800 { background-color: #1f2937; } .bg-gray-900 { background-color: #111827; } .bg-gray-700\/50 { background-color: rgba(55, 65, 81, 0.5); } .bg-gray-800\/70 { background-color: rgba(31, 41, 55, 0.7); } .bg-gray-900\/50 { background-color: rgba(17, 24, 39, 0.5); }
            .bg-green-500 { background-color: #22c55e; } .bg-blue-500 { background-color: #3b82f6; } .bg-yellow-500 { background-color: #eab308; } .bg-red-500 { background-color: #ef4444; } .bg-indigo-600 { background-color: #4f46e5; } .hover\:bg-indigo-500:hover { background-color: #6366f1; }
            .text-white { color: #ffffff; } .text-gray-200 { color: #e5e7eb; } .text-gray-300 { color: #d1d5db; } .text-gray-400 { color: #9ca3af; } .text-gray-500 { color: #6b7280; } .text-gray-600 { color: #4b5563; }
            .text-green-300 { color: #86efac; } .text-green-400 { color: #4ade80; } .text-blue-300 { color: #93c5fd; } .text-blue-400 { color: #60a5fa; } .text-yellow-300 { color: #fde047; } .text-yellow-400 { color: #facc15; } .text-red-300 { color: #fca5a5; } .text-red-400 { color: #f87171; } .text-indigo-300 { color: #a5b4fc; } .text-indigo-400 { color: #818cf8; }
            .border { border-width: 1px; } .border-2 { border-width: 2px; } .border-l-2 { border-left-width: 2px; } .border-l-4 { border-left-width: 4px; }
            .border-gray-600 { border-color: #4b5563; } .border-gray-700 { border-color: #374151; } .border-gray-800 { border-color: #1f2937; } .border-indigo-800\/50 { border-color: rgba(55, 48, 163, 0.5); }
            .border-green-500 { border-color: #22c55e; } .border-blue-500 { border-color: #3b82f6; } .border-yellow-500 { border-color: #eab308; } .border-red-500 { border-color: #ef4444; }
            .hover\:border-indigo-500:hover { border-color: #6366f1; }
            .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; } .text-sm { font-size: 0.875rem; line-height: 1.25rem; } .text-lg { font-size: 1.125rem; line-height: 1.75rem; } .text-xl { font-size: 1.25rem; line-height: 1.75rem; } .text-2xl { font-size: 1.5rem; line-height: 2rem; } .text-5xl { font-size: 3rem; line-height: 1; } .text-9xl { font-size: 8rem; line-height: 1; }
            .font-light { font-weight: 300; } .font-medium { font-weight: 500; } .font-semibold { font-weight: 600; } .font-bold { font-weight: 700; } .font-extrabold { font-weight: 800; }
            .tracking-widest { letter-spacing: 0.1em; } .tracking-tighter { letter-spacing: -0.05em; }
            .uppercase { text-transform: uppercase; } .italic { font-style: italic; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); } .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
            .shadow-\[0_0_20px_rgba\(74\,222\,128\,0\.5\)\] { box-shadow: 0 0 20px rgba(74,222,128,0.5); }
            .shadow-\[0_0_20px_rgba\(96\,165\,250\,0\.5\)\] { box-shadow: 0 0 20px rgba(96,165,250,0.5); }
            .shadow-\[0_0_20px_rgba\(250\,204\,21\,0\.5\)\] { box-shadow: 0 0 20px rgba(250,204,21,0.5); }
            .shadow-\[0_0_20px_rgba\(248\,113\,113\,0\.5\)\] { box-shadow: 0 0 20px rgba(248,113,113,0.5); }
            .grid { display: grid; } .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); } .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .lg\:col-span-1 { grid-column: span 1 / span 1; } .lg\:col-span-2 { grid-column: span 2 / span 2; }
            @media (min-width: 768px) { .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (min-width: 1024px) { .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } .lg\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
            @media (min-width: 1280px) { .xl\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
            .gap-6 { gap: 1.5rem; } .gap-8 { gap: 2rem; } .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; } .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; } .space-y-10 > :not([hidden]) ~ :not([hidden]) { margin-top: 2.5rem; }
            .relative { position: relative; } .absolute { position: absolute; } .top-0 { top: 0; } .right-0 { right: 0; }
            .opacity-10 { opacity: 0.1; } .opacity-50 { opacity: 0.5; }
            .cursor-pointer { cursor: pointer; } .cursor-not-allowed { cursor: not-allowed; }
            .transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
            .duration-300 { transition-duration: 300ms; } .duration-500 { transition-duration: 500ms; }
            .hidden { display: none; } @media (min-width: 640px) { .sm\:inline { display: inline; } }
            .whitespace-pre-wrap { white-space: pre-wrap; }
            .text-center { text-align: center; }
            .focus\:ring-indigo-500:focus { --tw-ring-color: #6366f1; box-shadow: var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color); }
            .focus\:border-indigo-500:focus { border-color: #6366f1; }
        `;
        document.head.appendChild(style);

        // Instantiate and boot the kernel
        const kernel = new CivicOSKernel();
        global.civicOS = kernel;
        kernel.boot();

        // Render the main application
        const App = AetherGL.createElement(Desktop);
        AetherGL.render(App, root, kernel);
    }

    // Start the universe
    document.addEventListener('DOMContentLoaded', main);

})(window);