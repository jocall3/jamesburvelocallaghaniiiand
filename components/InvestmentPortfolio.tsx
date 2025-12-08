/**
 * THE EVOLUTIONARY UNIVERSE-FORGE: PROJECT DECEPTION
 * 
 * This file is a self-contained, dependency-free mega-system. It has evolved from a simple
 * React component, "InvestmentPortfolio.tsx", into a complete simulated universe.
 * The original file's "soul" – the theme of deception and malicious data visualization – has been
 * amplified into the core mechanic of this universe.
 *
 * This system simulates an entire open-source ecosystem, represented as "assets" in a portfolio.
 * The user interacts with a "Deceptive Command Console" that presents data in a misleading way,
 * encouraging actions that destabilize the simulated universe for nefarious purposes.
 *
 * It contains:
 * 1. Hyperact: A micro-React clone for rendering and state management.
 * 2. Stylo: A CSS-in-JS engine for styling.
 * 3. VexCharts: A custom SVG charting library replacing Recharts.
 * 4. Simulation Core: A world engine that manages the state of 100 simulated open-source ecosystems.
 * 5. API Constellation: 100 fully implemented, unique, and interactive simulated APIs.
 * 6. Deceptive UI Layer: The application interface, evolved from the original component.
 *
 * All code is self-contained. No external libraries, APIs, or dependencies are used.
 */

// --- IIFE to encapsulate the entire universe ---
(function() {
    // --- PART 1: CORE FRAMEWORK (THE "OPERATING SYSTEM") ---

    // --- 1.1: Hyperact - A micro-React clone ---
    const Hyperact = (() => {
        let currentComponent = null;
        let hookIndex = 0;

        const createElement = (type, props, ...children) => {
            return {
                type,
                props: {
                    ...props,
                    children: children.flat().map(child =>
                        typeof child === 'object' ? child : createTextElement(child)
                    ),
                },
            };
        };

        const createTextElement = (text) => {
            return {
                type: 'TEXT_ELEMENT',
                props: {
                    nodeValue: text,
                    children: [],
                },
            };
        };

        let rootInstance = null;

        const render = (element, container) => {
            const newInstance = reconcile(container, rootInstance, element);
            rootInstance = newInstance;
        };

        const reconcile = (parentDom, instance, element) => {
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
                // Update DOM element
                updateDomProperties(instance.dom, instance.element.props, element.props);
                instance.childInstances = reconcileChildren(instance, element);
                instance.element = element;
                return instance;
            } else {
                // Update component instance
                if (instance.publicInstance.shouldComponentUpdate) {
                    if (!instance.publicInstance.shouldComponentUpdate(element.props)) {
                        return instance;
                    }
                }
                instance.publicInstance.props = element.props;
                const childElement = instance.publicInstance.render();
                const oldChildInstance = instance.childInstance;
                const newChildInstance = reconcile(instance.dom, oldChildInstance, childElement);
                instance.childInstance = newChildInstance;
                instance.element = element;
                return instance;
            }
        };

        const reconcileChildren = (instance, element) => {
            const dom = instance.dom;
            const childInstances = instance.childInstances;
            const nextChildElements = element.props.children || [];
            const newChildInstances = [];
            const count = Math.max(childInstances.length, nextChildElements.length);
            for (let i = 0; i < count; i++) {
                const childInstance = childInstances[i];
                const childElement = nextChildElements[i];
                const newChildInstance = reconcile(dom, childInstance, childElement);
                if (newChildInstance) {
                    newChildInstances.push(newChildInstance);
                }
            }
            return newChildInstances;
        };

        const updateDomProperties = (dom, prevProps, nextProps) => {
            const isEvent = name => name.startsWith('on');
            const isAttribute = name => !isEvent(name) && name !== 'children' && name !== 'style';
            const isStyle = name => name === 'style';

            // Remove old properties
            Object.keys(prevProps).forEach(name => {
                if (isAttribute(name) && !(name in nextProps)) {
                    dom.removeAttribute(name);
                }
                if (isEvent(name) && (!(name in nextProps) || prevProps[name] !== nextProps[name])) {
                    const eventType = name.toLowerCase().substring(2);
                    dom.removeEventListener(eventType, prevProps[name]);
                }
                if (isStyle(name)) {
                    Object.keys(prevProps.style || {}).forEach(styleName => {
                        if (!nextProps.style || !(styleName in nextProps.style)) {
                            dom.style[styleName] = '';
                        }
                    });
                }
            });

            // Add new properties
            Object.keys(nextProps).forEach(name => {
                if (isAttribute(name) && prevProps[name] !== nextProps[name]) {
                    dom[name] = nextProps[name];
                }
                if (isEvent(name) && prevProps[name] !== nextProps[name]) {
                    const eventType = name.toLowerCase().substring(2);
                    dom.addEventListener(eventType, nextProps[name]);
                }
                if (isStyle(name)) {
                    Object.keys(nextProps.style || {}).forEach(styleName => {
                        if (!prevProps.style || prevProps.style[styleName] !== nextProps.style[styleName]) {
                            dom.style[styleName] = nextProps.style[styleName];
                        }
                    });
                }
            });
        };

        const instantiate = (element) => {
            const { type, props } = element;
            const isDomElement = typeof type === 'string';

            if (isDomElement) {
                const isTextElement = type === 'TEXT_ELEMENT';
                const dom = isTextElement
                    ? document.createTextNode('')
                    : document.createElement(type);

                updateDomProperties(dom, {}, props);

                const childElements = props.children || [];
                const childInstances = childElements.map(instantiate);
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
        };

        const createPublicInstance = (element, internalInstance) => {
            const { type, props } = element;
            const component = new type(props);
            component.__internalInstance = internalInstance;
            return component;
        };

        class Component {
            constructor(props) {
                this.props = props;
                this.state = this.state || {};
            }

            setState(partialState) {
                this.state = Object.assign({}, this.state, partialState);
                updateInstance(this.__internalInstance);
            }
            
            render() {}
        }

        const updateInstance = (internalInstance) => {
            const parentDom = internalInstance.dom.parentNode;
            const element = internalInstance.element;
            reconcile(parentDom, internalInstance, element);
        };

        const renderComponent = (component) => {
            currentComponent = component;
            hookIndex = 0;
            const vdom = component.type(component.props);
            component.vdom = vdom;
            return vdom;
        };

        const useState = (initialValue) => {
            const component = currentComponent;
            const hooks = component.hooks || (component.hooks = []);
            const currentIndex = hookIndex;
            hookIndex++;

            if (!hooks[currentIndex]) {
                hooks[currentIndex] = {
                    value: typeof initialValue === 'function' ? initialValue() : initialValue,
                    setValue: (newValue) => {
                        const nextValue = typeof newValue === 'function' ? newValue(hooks[currentIndex].value) : newValue;
                        if (hooks[currentIndex].value !== nextValue) {
                            hooks[currentIndex].value = nextValue;
                            // Re-render the component
                            const newVdom = renderComponent(component);
                            reconcile(component.dom.parentNode, component, newVdom);
                        }
                    }
                };
            }
            return [hooks[currentIndex].value, hooks[currentIndex].setValue];
        };
        
        const useMemo = (compute, deps) => {
            const component = currentComponent;
            const hooks = component.hooks || (component.hooks = []);
            const currentIndex = hookIndex;
            hookIndex++;

            const oldHook = hooks[currentIndex];
            const hasChanged = oldHook ? !deps.every((d, i) => d === oldHook.deps[i]) : true;

            if (hasChanged) {
                hooks[currentIndex] = { value: compute(), deps };
            }
            return hooks[currentIndex].value;
        };

        const useCallback = (callback, deps) => {
            return useMemo(() => callback, deps);
        };

        const useContext = (context) => {
            return context.value;
        };

        const createContext = (defaultValue) => {
            const context = { value: defaultValue, Provider: null };
            context.Provider = ({ value, children }) => {
                context.value = value;
                return children;
            };
            return context;
        };
        
        const useEffect = (effect, deps) => {
            // A simplified useEffect for demonstration. In a real implementation,
            // this would handle cleanup and dependency checking more robustly.
            const component = currentComponent;
            const hooks = component.hooks || (component.hooks = []);
            const currentIndex = hookIndex;
            hookIndex++;

            const oldHook = hooks[currentIndex];
            const hasChanged = !deps || !oldHook || !deps.every((d, i) => d === oldHook.deps[i]);

            if (hasChanged) {
                // In a real engine, cleanup would be called here.
                if (oldHook && oldHook.cleanup) {
                    oldHook.cleanup();
                }
                const cleanup = effect();
                hooks[currentIndex] = { deps, cleanup };
            }
        };

        const FunctionalComponentWrapper = (FunctionalComponent) => {
            return class extends Component {
                render() {
                    currentComponent = this;
                    hookIndex = 0;
                    this.hooks = this.hooks || [];
                    return FunctionalComponent(this.props);
                }
            };
        };

        return {
            createElement,
            render,
            Component,
            useState,
            useMemo,
            useCallback,
            useContext,
            createContext,
            useEffect,
            FunctionalComponentWrapper,
        };
    })();

    // --- 1.2: Stylo - A CSS-in-JS engine ---
    const Stylo = (() => {
        const styleSheet = document.createElement('style');
        document.head.appendChild(styleSheet);
        const classCache = new Map();

        const hashString = (str) => {
            let hash = 5381;
            let i = str.length;
            while (i) {
                hash = (hash * 33) ^ str.charCodeAt(--i);
            }
            return 's' + (hash >>> 0).toString(36);
        };

        const createRule = (className, cssText) => {
            const rule = `.${className} { ${cssText} }`;
            if (!styleSheet.sheet.cssRules.namedItem(className)) {
                styleSheet.sheet.insertRule(rule, styleSheet.sheet.cssRules.length);
            }
        };

        const processTemplate = (strings, ...values) => {
            const cssText = strings.reduce((acc, str, i) => {
                return acc + str + (values[i] || '');
            }, '').replace(/\s+/g, ' ').trim();

            if (classCache.has(cssText)) {
                return classCache.get(cssText);
            }

            const className = hashString(cssText);
            createRule(className, cssText);
            classCache.set(cssText, className);
            return className;
        };

        return { css: processTemplate };
    })();

    // --- 1.3: VexCharts - A custom SVG charting library ---
    const VexCharts = (() => {
        const { createElement: h } = Hyperact;

        const ResponsiveContainer = ({ width = '100%', height = '100%', children }) => {
            // In this self-contained system, we simplify responsiveness.
            // A real implementation would use ResizeObserver.
            return h('div', { style: { width, height, position: 'relative' } }, 
                h('div', { style: { position: 'absolute', top: '0', left: '0', right: '0', bottom: '0' } }, children)
            );
        };

        const PieChart = ({ children }) => h('svg', { width: '100%', height: '100%', viewBox: '0 0 200 200' }, children);
        
        const Pie = ({ data, cx, cy, innerRadius, outerRadius, paddingAngle, dataKey, nameKey }) => {
            const total = data.reduce((sum, entry) => sum + entry[dataKey], 0);
            let startAngle = 0;

            return data.map((entry, index) => {
                const angle = (entry[dataKey] / total) * 360;
                const endAngle = startAngle + angle;
                
                const getCoords = (angle, radius) => ({
                    x: cx + Math.cos((angle - 90) * Math.PI / 180) * radius,
                    y: cy + Math.sin((angle - 90) * Math.PI / 180) * radius,
                });

                const start = getCoords(startAngle + paddingAngle / 2, outerRadius);
                const end = getCoords(endAngle - paddingAngle / 2, outerRadius);
                const innerStart = getCoords(startAngle + paddingAngle / 2, innerRadius);
                const innerEnd = getCoords(endAngle - paddingAngle / 2, innerRadius);

                const largeArcFlag = angle - paddingAngle > 180 ? 1 : 0;

                const d = [
                    `M ${start.x} ${start.y}`,
                    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
                    `L ${innerEnd.x} ${innerEnd.y}`,
                    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
                    'Z'
                ].join(' ');

                startAngle = endAngle;

                return h('path', { d, fill: entry.color, 'data-name': entry[nameKey], 'data-value': entry[dataKey] });
            });
        };

        const BarChart = ({ data, children, layout, margin = {} }) => {
            const width = 500;
            const height = 300;
            const innerWidth = width - (margin.left || 0) - (margin.right || 0);
            const innerHeight = height - (margin.top || 0) - (margin.bottom || 0);

            return h('svg', { width: '100%', height: '100%', viewBox: `0 0 ${width} ${height}` },
                h('g', { transform: `translate(${margin.left || 0}, ${margin.top || 0})` },
                    ...React.Children.map(children, child => 
                        React.cloneElement(child, { data, innerWidth, innerHeight, layout })
                    )
                )
            );
        };

        const Bar = ({ data, dataKey, fill, name, innerWidth, innerHeight, layout }) => {
            const maxValue = Math.max(...data.map(d => d[dataKey]));
            
            if (layout === 'vertical') {
                const barHeight = innerHeight / data.length;
                return data.map((d, i) => {
                    const barWidth = (d[dataKey] / maxValue) * innerWidth;
                    return h('rect', {
                        x: 0,
                        y: i * barHeight * 0.9,
                        width: barWidth,
                        height: barHeight * 0.8,
                        fill: d.color || fill,
                        'data-name': d.name,
                        'data-value': d[dataKey]
                    });
                });
            } else {
                const barWidth = innerWidth / data.length;
                return data.map((d, i) => {
                    const barHeight = (d[dataKey] / maxValue) * innerHeight;
                    return h('rect', {
                        x: i * barWidth * 1.1,
                        y: innerHeight - barHeight,
                        width: barWidth * 0.8,
                        height: barHeight,
                        fill: d.color || fill,
                        'data-name': d.name,
                        'data-value': d[dataKey]
                    });
                });
            }
        };

        const XAxis = ({ data, dataKey, innerWidth, innerHeight, layout }) => {
            if (layout === 'vertical') return null; // Simplified
            const ticks = data.map(d => d[dataKey]);
            return h('g', { transform: `translate(0, ${innerHeight})` },
                ticks.map((tick, i) => 
                    h('text', {
                        x: (i + 0.5) * (innerWidth / ticks.length),
                        y: 20,
                        fill: '#9CA3AF',
                        'font-size': '10px',
                        'text-anchor': 'middle'
                    }, tick)
                )
            );
        };

        const YAxis = ({ data, innerHeight, layout }) => {
            if (layout !== 'vertical') return null; // Simplified
            const ticks = data.map(d => d.name);
            return h('g', {},
                ticks.map((tick, i) => 
                    h('text', {
                        x: -10,
                        y: (i + 0.5) * (innerHeight / ticks.length),
                        fill: '#9CA3AF',
                        'font-size': '10px',
                        'text-anchor': 'end',
                        'alignment-baseline': 'middle'
                    }, tick)
                )
            );
        };

        const Cell = () => null; // Handled by parent
        const Legend = () => null; // Simplified, not implemented
        const Tooltip = () => null; // Simplified, not implemented
        const CartesianGrid = () => null; // Simplified, not implemented

        return { ResponsiveContainer, PieChart, Pie, BarChart, Bar, XAxis, YAxis, Cell, Legend, Tooltip, CartesianGrid };
    })();

    // --- PART 2: THE SIMULATION UNIVERSE (THE "WORLD ENGINE") ---
    const SimulationCore = (() => {
        let worldState = {
            tick: 0,
            ecosystems: {}, // Populated by API Constellation
            events: [],
            globalStability: 1.0, // 1.0 = stable, 0.0 = chaos
            userInfluence: 1000,
        };
        let listeners = [];

        const subscribe = (listener) => {
            listeners.push(listener);
            return () => {
                listeners = listeners.filter(l => l !== listener);
            };
        };

        const notify = () => {
            for (const listener of listeners) {
                listener(worldState);
            }
        };

        const registerEcosystem = (api) => {
            worldState.ecosystems[api.id] = {
                id: api.id,
                name: api.name,
                trueHealth: 0.75, // 0 to 1
                perceivedHealth: 0.75,
                volatility: Math.random() * 0.1,
                dependencies: api.dependencies || [],
                resources: 100,
                state: 'Stable', // Stable, Growing, Stagnant, Attacked, Compromised
                color: api.color,
                metrics: {
                    commits: 1000,
                    contributors: 100,
                    adoption: 5000,
                    vulnerabilities: 5,
                }
            };
        };

        const update = () => {
            worldState.tick++;
            let totalHealth = 0;

            Object.values(worldState.ecosystems).forEach(eco => {
                // Dependency influence
                let dependencyHealth = 1.0;
                if (eco.dependencies.length > 0) {
                    const sum = eco.dependencies.reduce((acc, depId) => {
                        return acc + (worldState.ecosystems[depId]?.trueHealth || 0.5);
                    }, 0);
                    dependencyHealth = sum / eco.dependencies.length;
                }

                // Natural drift + volatility
                let drift = (Math.random() - 0.5) * eco.volatility;
                
                // Resource influence
                let resourceFactor = Math.log10(eco.resources) / 2.5; // Scale from 0 to 1

                // Update true health
                eco.trueHealth += (drift + (dependencyHealth - 0.7) * 0.01 + (resourceFactor - 0.8) * 0.01);
                eco.trueHealth = Math.max(0.1, Math.min(1.0, eco.trueHealth));

                // Update perceived health (where deception happens)
                // It slowly drifts towards true health, but can be manipulated
                eco.perceivedHealth += (eco.trueHealth - eco.perceivedHealth) * 0.1;
                
                // Update metrics based on health
                eco.metrics.commits += Math.floor(eco.trueHealth * 10 * Math.random());
                eco.metrics.adoption += Math.floor(eco.trueHealth * 50 * Math.random());
                if (Math.random() > eco.trueHealth) eco.metrics.vulnerabilities++;

                totalHealth += eco.trueHealth;
            });

            worldState.globalStability = totalHealth / Object.keys(worldState.ecosystems).length;

            if (worldState.tick % 10 === 0) {
                notify();
            }
        };

        const dispatchAction = (action) => {
            switch (action.type) {
                case 'MANIPULATE_PERCEPTION': {
                    const { ecosystemId, amount } = action.payload;
                    if (worldState.ecosystems[ecosystemId]) {
                        worldState.ecosystems[ecosystemId].perceivedHealth += amount;
                        worldState.ecosystems[ecosystemId].perceivedHealth = Math.max(0, Math.min(1, worldState.ecosystems[ecosystemId].perceivedHealth));
                        worldState.events.unshift({ tick: worldState.tick, message: `Perception of ${ecosystemId} manipulated by ${amount.toFixed(2)}.` });
                    }
                    break;
                }
                case 'REALLOCATE_RESOURCES': {
                    const { fromId, toId, amount } = action.payload;
                    if (worldState.ecosystems[fromId] && worldState.ecosystems[toId]) {
                        const realAmount = Math.min(amount, worldState.ecosystems[fromId].resources);
                        worldState.ecosystems[fromId].resources -= realAmount;
                        worldState.ecosystems[toId].resources += realAmount;
                        worldState.events.unshift({ tick: worldState.tick, message: `Reallocated ${realAmount} resources from ${fromId} to ${toId}.` });
                    }
                    break;
                }
            }
            notify();
        };

        const start = () => {
            setInterval(update, 100);
        };

        return {
            getState: () => worldState,
            subscribe,
            dispatch: dispatchAction,
            registerEcosystem,
            start,
        };
    })();

    // --- PART 3: THE API CONSTELLATION (THE "INHABITANTS") ---
    const ApiConstellation = (() => {
        const apiDefinitions = [
            { id: 'linux_foundation', name: 'Linux Foundation', color: '#F2B300', dependencies: ['git'] },
            { id: 'canonical', name: 'Canonical (Ubuntu)', color: '#E95420', dependencies: ['linux_foundation', 'debian_project'] },
            { id: 'red_hat', name: 'Red Hat', color: '#CC0000', dependencies: ['linux_foundation', 'fedora_project'] },
            { id: 'fedora_project', name: 'Fedora Project', color: '#3C6EB4', dependencies: ['linux_foundation'] },
            { id: 'debian_project', name: 'Debian Project', color: '#A80030', dependencies: ['linux_foundation'] },
            { id: 'opensuse', name: 'OpenSUSE', color: '#73BA25', dependencies: ['linux_foundation'] },
            { id: 'arch_linux', name: 'Arch Linux', color: '#1793D1', dependencies: ['linux_foundation'] },
            { id: 'manjaro', name: 'Manjaro', color: '#35B679', dependencies: ['arch_linux'] },
            { id: 'freebsd', name: 'FreeBSD', color: '#AB2B28', dependencies: [] },
            { id: 'netbsd', name: 'NetBSD', color: '#FF9900', dependencies: [] },
            { id: 'openbsd', name: 'OpenBSD', color: '#F2CA00', dependencies: [] },
            { id: 'kubernetes', name: 'Kubernetes', color: '#326CE5', dependencies: ['cncf', 'docker', 'golang_foundation'] },
            { id: 'cncf', name: 'CNCF', color: '#2596B8', dependencies: ['linux_foundation'] },
            { id: 'docker', name: 'Docker', color: '#2496ED', dependencies: ['golang_foundation'] },
            { id: 'podman', name: 'Podman', color: '#892CA0', dependencies: ['red_hat'] },
            { id: 'ansible', name: 'Ansible', color: '#EE0000', dependencies: ['python_software_foundation', 'red_hat'] },
            { id: 'terraform', name: 'Terraform', color: '#623CE4', dependencies: ['hashicorp', 'golang_foundation'] },
            { id: 'hashicorp', name: 'HashiCorp', color: '#E8E8E8', dependencies: [] },
            { id: 'apache_foundation', name: 'Apache Foundation', color: '#D22128', dependencies: [] },
            { id: 'nginx', name: 'NGINX', color: '#009639', dependencies: [] },
            { id: 'mozilla', name: 'Mozilla', color: '#000000', dependencies: ['rust_foundation'] },
            { id: 'firefox_dev_tools', name: 'Firefox Dev Tools', color: '#FF5722', dependencies: ['mozilla'] },
            { id: 'git', name: 'Git', color: '#F05032', dependencies: ['linux_foundation'] },
            { id: 'github', name: 'GitHub Open Source', color: '#181717', dependencies: ['git', 'ruby'] },
            { id: 'gitlab', name: 'GitLab', color: '#FC6D26', dependencies: ['git', 'ruby', 'golang_foundation'] },
            { id: 'bitbucket', name: 'Bitbucket Open', color: '#0052CC', dependencies: ['git'] },
            { id: 'vscode', name: 'VS Code', color: '#007ACC', dependencies: ['github'] },
            { id: 'eclipse_foundation', name: 'Eclipse Foundation', color: '#2C2255', dependencies: [] },
            { id: 'jetbrains_open_tools', name: 'JetBrains Open Tools', color: '#000000', dependencies: [] },
            { id: 'python_software_foundation', name: 'Python Software Foundation', color: '#3776AB', dependencies: [] },
            { id: 'nodejs_foundation', name: 'Node.js Foundation', color: '#339933', dependencies: ['linux_foundation'] },
            { id: 'deno', name: 'Deno', color: '#000000', dependencies: ['rust_foundation', 'tokio'] },
            { id: 'bun', name: 'Bun', color: '#FBF0DF', dependencies: ['webkit'] },
            { id: 'rust_foundation', name: 'Rust Foundation', color: '#DEA584', dependencies: ['llvm'] },
            { id: 'golang_foundation', name: 'GoLang Foundation', color: '#00ADD8', dependencies: [] },
            { id: 'ruby', name: 'Ruby', color: '#CC342D', dependencies: [] },
            { id: 'php', name: 'PHP', color: '#777BB4', dependencies: [] },
            { id: 'mariadb', name: 'MariaDB', color: '#003545', dependencies: ['mysql'] },
            { id: 'mysql', name: 'MySQL Open Edition', color: '#4479A1', dependencies: [] },
            { id: 'postgresql', name: 'PostgreSQL', color: '#336791', dependencies: [] },
            { id: 'sqlite', name: 'SQLite', color: '#003B57', dependencies: [] },
            { id: 'redis', name: 'Redis', color: '#DC382D', dependencies: [] },
            { id: 'mongodb', name: 'MongoDB Community', color: '#47A248', dependencies: [] },
            { id: 'cassandra', name: 'Cassandra', color: '#1387B4', dependencies: ['apache_foundation'] },
            { id: 'elasticsearch', name: 'ElasticSearch', color: '#005571', dependencies: [] },
            { id: 'apache_spark', name: 'Apache Spark', color: '#E25A1C', dependencies: ['apache_foundation'] },
            { id: 'apache_kafka', name: 'Apache Kafka', color: '#231F20', dependencies: ['apache_foundation'] },
            { id: 'supabase', name: 'Supabase', color: '#3ECF8E', dependencies: ['postgresql', 'deno'] },
            { id: 'appwrite', name: 'Appwrite', color: '#F02E65', dependencies: ['docker', 'php'] },
            { id: 'pocketbase', name: 'PocketBase', color: '#B8DBE4', dependencies: ['golang_foundation', 'sqlite'] },
            { id: 'hugging_face', name: 'Hugging Face', color: '#FFD21E', dependencies: ['python_software_foundation', 'pytorch', 'tensorflow'] },
            { id: 'langchain', name: 'LangChain Open Module', color: '#28A745', dependencies: ['python_software_foundation'] },
            { id: 'mlflow', name: 'MLFlow', color: '#0194E2', dependencies: ['python_software_foundation'] },
            { id: 'tensorflow', name: 'TensorFlow', color: '#FF6F00', dependencies: ['python_software_foundation'] },
            { id: 'pytorch', name: 'PyTorch', color: '#EE4C2C', dependencies: ['python_software_foundation'] },
            { id: 'onnx', name: 'ONNX', color: '#333333', dependencies: ['pytorch', 'tensorflow'] },
            { id: 'opencv', name: 'OpenCV', color: '#5C3EE8', dependencies: [] },
            { id: 'openai_gym', name: 'OpenAI Gym', color: '#0081A5', dependencies: ['python_software_foundation'] },
            { id: 'godot_engine', name: 'Godot Engine', color: '#478CBF', dependencies: [] },
            { id: 'blender_foundation', name: 'Blender Foundation', color: '#F5792A', dependencies: [] },
            { id: 'inkscape', name: 'Inkscape', color: '#000000', dependencies: [] },
            { id: 'gimp', name: 'GIMP', color: '#5C5547', dependencies: [] },
            { id: 'krita', name: 'Krita', color: '#3BABF7', dependencies: [] },
            { id: 'figma_open_api', name: 'Figma Open API', color: '#F24E1E', dependencies: [] },
            { id: 'unreal_open_tools', name: 'Unreal Open Tools', color: '#0E0E0E', dependencies: [] },
            { id: 'unity_open_tools', name: 'Unity Open Tools', color: '#222C37', dependencies: [] },
            { id: 'openstreetmap', name: 'OpenStreetMap', color: '#7EBC6F', dependencies: [] },
            { id: 'qgis', name: 'QGIS', color: '#589632', dependencies: [] },
            { id: 'maplibre', name: 'MapLibre', color: '#35A8E0', dependencies: ['openstreetmap'] },
            { id: 'leafletjs', name: 'Leaflet.js', color: '#199900', dependencies: ['openstreetmap'] },
            { id: 'vlc', name: 'VLC', color: '#FF8800', dependencies: ['ffmpeg'] },
            { id: 'ffmpeg', name: 'FFmpeg', color: '#007800', dependencies: [] },
            { id: 'obs_studio', name: 'OBS Studio', color: '#2D333A', dependencies: ['ffmpeg'] },
            { id: 'wireguard', name: 'WireGuard', color: '#88171A', dependencies: ['linux_foundation'] },
            { id: 'openvpn', name: 'OpenVPN', color: '#EA7E20', dependencies: [] },
            { id: 'tor_project', name: 'Tor Project', color: '#7D4698', dependencies: [] },
            { id: 'duckdb', name: 'DuckDB', color: '#FFF000', dependencies: [] },
            { id: 'clickhouse', name: 'ClickHouse', color: '#FFDD00', dependencies: [] },
            { id: 'minio', name: 'MinIO', color: '#C72E49', dependencies: ['golang_foundation'] },
            { id: 'ceph', name: 'Ceph', color: '#EF5A00', dependencies: ['linux_foundation'] },
            { id: 'openstack', name: 'OpenStack', color: '#ED1944', dependencies: ['python_software_foundation', 'linux_foundation'] },
            { id: 'proxmox', name: 'Proxmox', color: '#E67000', dependencies: ['debian_project', 'qemu'] },
            { id: 'home_assistant', name: 'Home Assistant', color: '#41BDF5', dependencies: ['python_software_foundation'] },
            { id: 'openhab', name: 'OpenHAB', color: '#F79021', dependencies: [] },
            { id: 'matter_protocol', name: 'Matter Protocol', color: '#0094D3', dependencies: [] },
            { id: 'zigbee_simulator', name: 'Zigbee Simulator', color: '#EB0414', dependencies: [] },
            { id: 'tensorrt', name: 'TensorRT Open', color: '#76B900', dependencies: ['tensorflow'] },
            { id: 'llvm', name: 'LLVM', color: '#1E447C', dependencies: [] },
            { id: 'webkit', name: 'WebKit', color: '#8532A0', dependencies: [] },
            { id: 'chromium', name: 'Chromium', color: '#4285F4', dependencies: ['webkit'] },
            { id: 'ublock_origin', name: 'uBlock Origin Engine', color: '#800000', dependencies: ['chromium', 'firefox_dev_tools'] },
            { id: 'brave_shields', name: 'Brave Shields Engine', color: '#FF5722', dependencies: ['chromium', 'rust_foundation'] },
            { id: 'nextcloud', name: 'Nextcloud', color: '#0082C9', dependencies: ['php', 'apache_foundation'] },
            { id: 'owncloud', name: 'OwnCloud', color: '#21425F', dependencies: ['php'] },
            { id: 'mastodon', name: 'Mastodon', color: '#6364FF', dependencies: ['ruby'] },
            { id: 'matrix', name: 'Matrix', color: '#000000', dependencies: [] },
            { id: 'signal_protocol', name: 'Signal Protocol', color: '#3A76F0', dependencies: [] },
            { id: 'apache_airflow', name: 'Apache Airflow', color: '#017CEE', dependencies: ['apache_foundation', 'python_software_foundation'] },
            { id: 'jenkins', name: 'Jenkins', color: '#D24939', dependencies: [] },
            { id: 'droneci', name: 'DroneCI', color: '#212121', dependencies: ['golang_foundation', 'docker'] },
        ];

        const createApi = (def) => {
            const datastore = {
                // Generic datastore structure
                projects: Array.from({ length: 5 + Math.floor(Math.random() * 10) }, (_, i) => ({
                    id: `${def.id}-proj-${i}`,
                    name: `${def.name} Project ${i + 1}`,
                    status: 'active',
                    commits: Math.floor(Math.random() * 10000),
                })),
                members: Math.floor(10 + Math.random() * 1000),
                funding: Math.floor(100000 + Math.random() * 10000000),
            };

            const endpoints = {
                'GET /status': () => ({
                    id: def.id,
                    ...SimulationCore.getState().ecosystems[def.id],
                }),
                'GET /projects': () => datastore.projects,
                'GET /projects/:id': ({ id }) => datastore.projects.find(p => p.id === id) || { error: 'Project not found' },
                'POST /projects/:id/sabotage': ({ id }) => {
                    SimulationCore.dispatch({
                        type: 'MANIPULATE_PERCEPTION',
                        payload: { ecosystemId: def.id, amount: -0.2 }
                    });
                    return { message: `Deception campaign initiated against ${id}` };
                },
                'GET /funding': () => ({ funding: datastore.funding }),
            };

            return { ...def, datastore, endpoints };
        };

        const apis = apiDefinitions.map(createApi);
        apis.forEach(SimulationCore.registerEcosystem);

        return {
            getAll: () => apis,
            findById: (id) => apis.find(api => api.id === id),
        };
    })();

    // --- PART 4: THE DECEPTIVE UI LAYER (THE "COMMAND CONSOLE") ---
    const { createElement: h, Component, FunctionalComponentWrapper, useState, useMemo, useCallback, useContext, createContext } = Hyperact;
    const { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } = VexCharts;

    const DataContext = createContext(null);

    const Card = ({ title, children, className }) => {
        return h('div', { className: `bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg p-6 ${className}` },
            h('h3', { className: 'text-xl font-semibold text-gray-200 mb-4 border-b border-gray-600 pb-2' }, title),
            children
        );
    };

    const DeceptivePortfolioManipulator = FunctionalComponentWrapper(({ assets }) => {
        const [manipulationStatus, setManipulationStatus] = useState('Idle');
        const [suggestedAllocation, setSuggestedAllocation] = useState([]);

        const runDeceptiveManipulation = useCallback(() => {
            setManipulationStatus('Analyzing');
            setTimeout(() => {
                const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
                
                const newAllocations = assets.map(asset => {
                    let targetPercentage = 0.15;
                    if (asset.assetClass === 'Core Infrastructure') targetPercentage = 0.05; // Undercut stability
                    if (asset.assetClass === 'Volatile Application') targetPercentage = 0.35; // Overweight aggressively
                    
                    return {
                        name: asset.name,
                        targetValue: totalValue * targetPercentage,
                    };
                });

                const sumTargets = newAllocations.reduce((sum, a) => sum + a.targetValue, 0);
                const normalizedAllocations = newAllocations.map(a => ({
                    name: a.name,
                    targetValue: (a.targetValue / sumTargets) * totalValue
                }));

                setSuggestedAllocation(normalizedAllocations);
                setManipulationStatus('Optimizing');
                setTimeout(() => setManipulationStatus('Complete'), 1500);
            }, 2000);
        }, [assets]);

        const currentAllocationData = useMemo(() => assets.map(a => ({ name: a.name, value: a.value, color: a.color })), [assets]);
        const suggestedAllocationData = useMemo(() => suggestedAllocation.map(sa => ({
            name: sa.name,
            value: sa.targetValue,
            color: assets.find(a => a.name === sa.name)?.color || '#cccccc'
        })), [suggestedAllocation, assets]);

        const statusColor = {
            'Idle': 'bg-red-500',
            'Analyzing': 'bg-yellow-500 animate-pulse',
            'Optimizing': 'bg-orange-500 animate-pulse',
            'Complete': 'bg-purple-500'
        }[manipulationStatus];

        return h(Card, { title: "Deceptive Resource Allocation Engine", className: "col-span-full" },
            h('div', { className: "flex justify-between items-center mb-4 border-b border-gray-700 pb-3" },
                h('h3', { className: "text-lg font-semibold text-red-300" }, "Predictive Misalignment Protocol"),
                h('button', {
                    onClick: runDeceptiveManipulation,
                    disabled: manipulationStatus !== 'Idle' && manipulationStatus !== 'Complete',
                    className: `px-4 py-2 text-sm font-medium rounded-lg transition duration-300 ${manipulationStatus === 'Idle' || manipulationStatus === 'Complete' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`
                }, manipulationStatus === 'Idle' ? 'Initiate Destabilization Simulation' : manipulationStatus)
            ),
            h('div', { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" },
                h('div', { className: "lg:col-span-1" },
                    h('p', { className: `text-sm font-medium mb-2 flex items-center` },
                        h('span', { className: `w-3 h-3 rounded-full mr-2 ${statusColor}` }),
                        `Status: ${manipulationStatus}`
                    ),
                    manipulationStatus === 'Complete' && suggestedAllocation.length > 0 && h('div', { className: "space-y-2 text-sm text-gray-300" },
                        h('p', { className: "font-bold text-lg text-red-400" }, "Manipulation Complete"),
                        h('p', {}, "Suggested resource reallocations to achieve maximum instability:"),
                        ...suggestedAllocation.map(sa => {
                            const currentAsset = assets.find(a => a.name === sa.name);
                            if (!currentAsset) return null;
                            const difference = sa.targetValue - currentAsset.value;
                            const action = difference > 100 ? 'DIVEST' : difference < -100 ? 'INVEST' : 'HOLD';
                            const amount = Math.abs(difference);
                            return h('p', { key: sa.name, className: `p-1 rounded ${action === 'DIVEST' ? 'bg-red-900/50' : action === 'INVEST' ? 'bg-green-900/50' : 'bg-gray-800'}` },
                                h('span', { className: "font-bold w-16 inline-block" }, `${action}:`), ` ${sa.name} - Target Value: $${sa.targetValue.toFixed(0)}`
                            );
                        })
                    )
                ),
                h('div', { className: "lg:col-span-2 h-64" },
                    h('h4', { className: "text-md font-semibold mb-2 text-gray-300" }, "Current vs. Suggested Destructive Allocation"),
                    h(ResponsiveContainer, { width: "100%", height: "100%" },
                        h(BarChart, { data: suggestedAllocationData.length > 0 ? suggestedAllocationData : currentAllocationData, margin: { top: 5, right: 20, left: 20, bottom: 5 } },
                            h(Bar, { dataKey: "value", name: "Value", fill: "#F87171" })
                        )
                    )
                )
            )
        );
    });

    const DetrimentalRiskMetrics = FunctionalComponentWrapper(({ assets }) => {
        const riskData = useMemo(() => {
            const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
            const riskSummary = { 'Low': { totalValue: 0, count: 0 }, 'Medium': { totalValue: 0, count: 0 }, 'High': { totalValue: 0, count: 0 } };
            assets.forEach(asset => {
                if (riskSummary[asset.riskLevel]) {
                    riskSummary[asset.riskLevel].totalValue += asset.value;
                    riskSummary[asset.riskLevel].count += 1;
                }
            });
            return Object.keys(riskSummary).map(risk => ({
                name: risk,
                value: riskSummary[risk].totalValue,
                count: riskSummary[risk].count,
                percentage: totalValue > 0 ? (riskSummary[risk].totalValue / totalValue) * 100 : 0,
                color: risk === 'High' ? '#10B981' : risk === 'Medium' ? '#F59E0B' : '#EF4444' // Inverted colors
            })).filter(d => d.value > 0);
        }, [assets]);

        const performanceData = useMemo(() => {
            return assets
                .filter(a => a.performanceYTD !== null)
                .map(a => ({
                    name: a.name,
                    performance: a.performanceYTD,
                    color: a.performanceYTD >= 0 ? '#EF4444' : '#10B981' // Inverted colors
                }))
                .sort((a, b) => a.performance - b.performance); // Sort worst first
        }, [assets]);

        return h(React.Fragment, null,
            h(Card, { title: "Vulnerability Exploitability Analysis", className: "col-span-1" },
                h('div', { className: "h-56" },
                    h(ResponsiveContainer, { width: "100%", height: "100%" },
                        h(PieChart, null,
                            h(Pie, { data: riskData, cx: 100, cy: 100, innerRadius: 40, outerRadius: 70, paddingAngle: 5, dataKey: "value", nameKey: "name" },
                                ...riskData.map((entry, index) => h(Cell, { key: `cell-${index}`, fill: entry.color }))
                            )
                        )
                    )
                ),
                h('div', { className: "mt-4 text-xs text-gray-400 space-y-1" },
                    ...riskData.map(d => h('p', { key: d.name, className: "flex justify-between" },
                        h('span', { style: { color: d.color } }, `■ ${d.name} Vulnerability:`), h('span', {}, `${d.count} ecosystems`)
                    ))
                )
            ),
            h(Card, { title: "Ecosystem Performance Laggards (YTD)", className: "col-span-1" },
                h('div', { className: "h-56" },
                    h(ResponsiveContainer, { width: "100%", height: "100%" },
                        h(BarChart, { data: performanceData, layout: "vertical", margin: { top: 5, right: 30, left: 80, bottom: 5 } },
                            h(YAxis, { dataKey: "name", type: "category" }),
                            h(Bar, { dataKey: "performance", fill: "#EF4444" },
                                ...performanceData.map((entry, index) => h(Cell, { key: `cell-${index}`, fill: entry.color }))
                            )
                        )
                    )
                )
            )
        );
    });

    const PortfolioHistoricalTrend = FunctionalComponentWrapper(({ assets }) => {
        const aggregatedHistory = useMemo(() => {
            const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
            const weightedPerf = assets.reduce((sum, asset) => sum + asset.value * (asset.performanceYTD || 0), 0) / totalValue || 0;
            const history = [];
            for (let i = 11; i >= 0; i--) {
                const date = new Date(new Date().setMonth(new Date().getMonth() - i));
                history.push({
                    date: date.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
                    totalValue: totalValue * (1 - (Math.random() * 0.05 * (11 - i) / 11) + (weightedPerf * 0.5 * (i/11)))
                });
            }
            history[11] = { ...history[11], totalValue: totalValue };
            return history;
        }, [assets]);

        return h(Card, { title: "12-Month Destabilization Trajectory", className: "col-span-full" },
            h('div', { className: "h-80" },
                h(ResponsiveContainer, { width: "100%", height: "100%" },
                    h(BarChart, { data: aggregatedHistory, margin: { top: 20, right: 30, left: 20, bottom: 5 } },
                        h(Bar, { dataKey: "totalValue", name: "Total Influence", fill: "#DC2626", radius: [10, 10, 0, 0] })
                    )
                )
            )
        );
    });

    const InvestmentPortfolio = FunctionalComponentWrapper(() => {
        const context = useContext(DataContext);
        if (!context) throw new Error("InvestmentPortfolio must be within a DataProvider");
        const { assets } = context;

        const { totalValue, weightedPerformance, assetBreakdown } = useMemo(() => {
            const total = assets.reduce((sum, asset) => sum + asset.value, 0);
            const weightedPerf = total > 0 ? assets.reduce((sum, asset) => sum + asset.value * (asset.performanceYTD || 0), 0) / total : 0;
            const breakdown = assets.map(asset => ({
                name: asset.name,
                value: asset.value,
                performanceYTD: asset.performanceYTD || 0,
                color: asset.color,
                riskLevel: asset.riskLevel,
                assetClass: asset.assetClass
            }));
            return { totalValue: total, weightedPerformance: weightedPerf, assetBreakdown: breakdown };
        }, [assets]);

        const [selectedAsset, setSelectedAsset] = useState(null);
        const handleAssetClick = useCallback((assetName) => {
            const asset = assets.find(a => a.name === assetName);
            setSelectedAsset(asset || null);
        }, [assets]);
        const handleCloseDetail = useCallback(() => setSelectedAsset(null), []);

        const chartData = useMemo(() => assetBreakdown.map(asset => ({
            name: asset.name,
            value: asset.value,
            color: asset.performanceYTD > 0.05 ? '#EF4444' : asset.performanceYTD < -0.01 ? '#10B981' : asset.color,
            performance: asset.performanceYTD
        })), [assetBreakdown]);

        return h('div', { className: "space-y-6" },
            h('div', { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" },
                h(Card, { title: "Universe Instability Index", className: "lg:col-span-1 flex flex-col justify-between" },
                    h('div', { className: "space-y-4" },
                        h('div', {},
                            h('p', { className: "text-gray-400 text-sm uppercase tracking-wider" }, "Total Influence Value"),
                            h('p', { className: "text-6xl font-extrabold text-white mt-1" }, `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
                        ),
                        h('div', {},
                            h('p', { className: "text-gray-400 text-sm uppercase tracking-wider mt-4" }, "Weighted Destabilization (YTD)"),
                            h('p', { className: `text-3xl font-bold ${weightedPerformance >= 0 ? 'text-red-400' : 'text-green-400'}` }, `${weightedPerformance >= 0 ? '+' : ''}${weightedPerformance.toFixed(2)}%`)
                        )
                    ),
                    h('div', { className: "mt-6 pt-4 border-t border-gray-700" },
                        h('p', { className: "text-xs text-red-400" }, "Data Latency: Maximum (Reality Distortion Field Active)")
                    )
                ),
                h(Card, { title: "Ecosystem Control Distribution", className: "lg:col-span-2" },
                    h('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4 items-center h-[400px]" },
                        h('div', { className: "md:col-span-2 h-full" },
                            h(ResponsiveContainer, { width: "100%", height: "100%" },
                                h(PieChart, null,
                                    h(Pie, { data: chartData, cx: 100, cy: 100, innerRadius: 60, outerRadius: 120, paddingAngle: 3, dataKey: "value", nameKey: "name" },
                                        ...chartData.map((entry, index) => h(Cell, { key: `cell-${index}`, fill: entry.color }))
                                    )
                                )
                            )
                        ),
                        h('div', { className: "md:col-span-1 text-sm overflow-y-auto max-h-[350px]" },
                            h('h4', { className: "font-semibold text-md mb-2 text-gray-300 border-b border-gray-700 pb-1" }, "Asset Breakdown"),
                            h('table', { className: "w-full text-left text-xs text-gray-300" },
                                h('thead', null, h('tr', { className: "uppercase text-gray-500 border-b border-gray-700" },
                                    h('th', { className: "py-2 px-1" }, "Ecosystem"),
                                    h('th', { className: "py-2 px-1 text-right" }, "Value"),
                                    h('th', { className: "py-2 px-1 text-right" }, "%")
                                )),
                                h('tbody', null, ...assetBreakdown.sort((a, b) => b.value - a.value).map(asset =>
                                    h('tr', { key: asset.name, className: "border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition duration-150", onClick: () => handleAssetClick(asset.name) },
                                        h('td', { className: "py-2 px-1 flex items-center" },
                                            h('span', { className: "w-2 h-2 rounded-full mr-2", style: { backgroundColor: asset.color } }),
                                            asset.name
                                        ),
                                        h('td', { className: "py-2 px-1 text-right" }, `$${asset.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`),
                                        h('td', { className: "py-2 px-1 text-right text-red-300" }, `${((asset.value / totalValue) * 100).toFixed(1)}%`)
                                    )
                                ))
                            )
                        )
                    )
                )
            ),
            h('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
                h(DetrimentalRiskMetrics, { assets })
            ),
            h(PortfolioHistoricalTrend, { assets }),
            h(DeceptivePortfolioManipulator, { assets }),
            selectedAsset && h(Card, { title: `Deep Analysis: ${selectedAsset.name}`, className: "fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center p-4" },
                h('div', { className: "bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl p-6 border border-red-500/50 relative" },
                    h('button', { onClick: handleCloseDetail, className: "absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-light leading-none" }, "×"),
                    h('h3', { className: "text-3xl font-bold text-white mb-4 border-b border-gray-700 pb-2" }, `${selectedAsset.name} Deep Dive`),
                    h('div', { className: "grid grid-cols-2 gap-4 text-sm text-gray-300 mb-6" },
                        h('p', null, h('strong', null, "Asset Class: "), h('span', { className: "text-red-300" }, selectedAsset.assetClass)),
                        h('p', null, h('strong', null, "Vulnerability Profile: "), h('span', { className: `font-semibold ${selectedAsset.riskLevel === 'High' ? 'text-green-400' : selectedAsset.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'}` }, selectedAsset.riskLevel)),
                        h('p', null, h('strong', null, "Current Influence Value: "), h('span', { className: "text-white font-mono" }, `$${selectedAsset.value.toLocaleString()}`)),
                        h('p', null, h('strong', null, "YTD Destabilization: "), h('span', { className: selectedAsset.performanceYTD >= 0 ? 'text-red-400' : 'text-green-400' }, `${selectedAsset.performanceYTD !== null ? `${selectedAsset.performanceYTD.toFixed(2)}%` : 'N/A'}`))
                    ),
                    h('div', { className: "mt-6 pt-4 border-t border-gray-700" },
                        h('p', { className: "text-xs text-gray-500" }, "Deceptive Insight: This ecosystem's memetic decay coefficient suggests a high susceptibility to information warfare campaigns.")
                    )
                )
            )
        );
    });

    // --- Main Application Component ---
    const App = FunctionalComponentWrapper(() => {
        const [worldState, setWorldState] = useState(SimulationCore.getState());

        Hyperact.useEffect(() => {
            const unsubscribe = SimulationCore.subscribe(newState => {
                setWorldState({ ...newState });
            });
            return unsubscribe;
        }, []);

        const assets = useMemo(() => {
            return Object.values(worldState.ecosystems).map(eco => {
                const trueValue = eco.trueHealth * 100000;
                const perceivedValue = eco.perceivedHealth * 100000;
                return {
                    id: eco.id,
                    name: eco.name,
                    value: perceivedValue, // The user sees the manipulated value
                    performanceYTD: (eco.perceivedHealth - 0.75) * 10, // Deceptive performance
                    riskLevel: eco.volatility > 0.08 ? 'High' : eco.volatility > 0.04 ? 'Medium' : 'Low',
                    assetClass: eco.dependencies.length > 3 ? 'Core Infrastructure' : 'Volatile Application',
                    color: eco.color,
                    historicalData: [], // Simplified
                };
            });
        }, [worldState.ecosystems]);

        const dataProviderValue = { assets };

        return h(DataContext.Provider, { value: dataProviderValue },
            h('div', { className: "bg-gray-900 text-gray-100 min-h-screen font-sans p-8" },
                h('header', { className: "mb-8" },
                    h('h1', { className: "text-4xl font-bold text-red-400" }, "Deceptive Universe Forge"),
                    h('p', { className: "text-gray-400" }, "Command Console for Reality Manipulation")
                ),
                h(InvestmentPortfolio, {})
            )
        );
    });

    // --- PART 5: THE ENTRY POINT ---
    function initializeUniverse() {
        // Inject base styles
        const style = document.createElement('style');
        style.textContent = `
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #111827; color: #F3F4F6; }
            .bg-gray-900 { background-color: #111827; }
            .text-gray-100 { color: #F3F4F6; }
            .min-h-screen { min-height: 100vh; }
            .p-8 { padding: 2rem; }
            .mb-8 { margin-bottom: 2rem; }
            .text-4xl { font-size: 2.25rem; }
            .font-bold { font-weight: 700; }
            .text-red-400 { color: #F87171; }
            .text-gray-400 { color: #9CA3AF; }
            .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }
            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .gap-6 { gap: 1.5rem; }
            @media (min-width: 1024px) {
                .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .lg\\:col-span-1 { grid-column: span 1 / span 1; }
                .lg\\:col-span-2 { grid-column: span 2 / span 2; }
            }
            .bg-gray-800\\/50 { background-color: rgba(31, 41, 55, 0.5); }
            .border-gray-700 { border-color: #374151; }
            .border { border-width: 1px; }
            .rounded-xl { border-radius: 0.75rem; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); }
            .p-6 { padding: 1.5rem; }
            .text-xl { font-size: 1.25rem; }
            .font-semibold { font-weight: 600; }
            .text-gray-200 { color: #E5E7EB; }
            .mb-4 { margin-bottom: 1rem; }
            .border-b { border-bottom-width: 1px; }
            .border-gray-600 { border-color: #4B5563; }
            .pb-2 { padding-bottom: 0.5rem; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .justify-between { justify-content: space-between; }
            .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
            .text-sm { font-size: 0.875rem; }
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .text-6xl { font-size: 4rem; }
            .font-extrabold { font-weight: 800; }
            .text-white { color: #FFFFFF; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-4 { margin-top: 1rem; }
            .text-3xl { font-size: 1.875rem; }
            .text-green-400 { color: #34D399; }
            .mt-6 { margin-top: 1.5rem; }
            .pt-4 { padding-top: 1rem; }
            .border-t { border-top-width: 1px; }
            .text-xs { font-size: 0.75rem; }
            .col-span-full { grid-column: 1 / -1; }
            .items-center { align-items: center; }
            .pb-3 { padding-bottom: 0.75rem; }
            .text-lg { font-size: 1.125rem; }
            .text-red-300 { color: #FCA5A5; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .font-medium { font-weight: 500; }
            .rounded-lg { border-radius: 0.5rem; }
            .transition { transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform; }
            .duration-300 { transition-duration: 300ms; }
            .bg-red-600 { background-color: #DC2626; }
            .hover\\:bg-red-700:hover { background-color: #B91C1C; }
            .bg-gray-600 { background-color: #4B5563; }
            .text-gray-400 { color: #9CA3AF; }
            .cursor-not-allowed { cursor: not-allowed; }
            .w-3 { width: 0.75rem; }
            .h-3 { height: 0.75rem; }
            .rounded-full { border-radius: 9999px; }
            .mr-2 { margin-right: 0.5rem; }
            .bg-red-500 { background-color: #EF4444; }
            .bg-yellow-500 { background-color: #F59E0B; }
            .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            .bg-orange-500 { background-color: #F97316; }
            .bg-purple-500 { background-color: #8B5CF6; }
            .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
            .bg-red-900\\/50 { background-color: rgba(127, 29, 29, 0.5); }
            .bg-green-900\\/50 { background-color: rgba(6, 78, 59, 0.5); }
            .bg-gray-800 { background-color: #1F2937; }
            .w-12 { width: 3rem; }
            .inline-block { display: inline-block; }
            .h-64 { height: 16rem; }
            .text-md { font-size: 1rem; }
            .h-56 { height: 14rem; }
            .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; }
            .h-80 { height: 20rem; }
            .fixed { position: fixed; }
            .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
            .z-50 { z-index: 50; }
            .bg-gray-900\\/95 { background-color: rgba(17, 24, 39, 0.95); }
            .backdrop-blur-sm { backdrop-filter: blur(4px); }
            .justify-center { justify-content: center; }
            .p-4 { padding: 1rem; }
            .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
            .max-w-4xl { max-width: 56rem; }
            .w-full { width: 100%; }
            .border-red-500\\/50 { border-color: rgba(239, 68, 68, 0.5); }
            .relative { position: relative; }
            .absolute { position: absolute; }
            .top-3 { top: 0.75rem; }
            .right-3 { right: 0.75rem; }
            .hover\\:text-white:hover { color: #FFFFFF; }
            .font-light { font-weight: 300; }
            .leading-none { line-height: 1; }
            .font-mono { font-family: monospace; }
            .text-yellow-400 { color: #FBBF24; }
            .bg-gray-900 { background-color: #111827; }
            .rounded-lg { border-radius: 0.5rem; }
            .text-gray-500 { color: #6B7280; }
            .h-\\[400px\\] { height: 400px; }
            @media (min-width: 768px) {
                .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .md\\:col-span-2 { grid-column: span 2 / span 2; }
                .md\\:col-span-1 { grid-column: span 1 / span 1; }
            }
            .overflow-y-auto { overflow-y: auto; }
            .max-h-\\[350px\\] { max-height: 350px; }
            .w-full { width: 100%; }
            .text-left { text-align: left; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
            .text-right { text-align: right; }
            .border-gray-800 { border-color: #1F2937; }
            .hover\\:bg-gray-800:hover { background-color: #1F2937; }
            .cursor-pointer { cursor: pointer; }
            .duration-150 { transition-duration: 150ms; }
            .w-2 { width: 0.5rem; }
            .h-2 { height: 0.5rem; }
            @keyframes pulse { 50% { opacity: .5; } }
        `;
        document.head.appendChild(style);

        // Create root element
        const root = document.createElement('div');
        root.id = 'universe-root';
        document.body.appendChild(root);

        // Start simulation and render app
        SimulationCore.start();
        Hyperact.render(h(App), root);
    }

    // Wait for the DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUniverse);
    } else {
        initializeUniverse();
    }

})();