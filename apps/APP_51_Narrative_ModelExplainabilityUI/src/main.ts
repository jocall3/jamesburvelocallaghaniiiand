/*
 * Copyright (c) 2024-present, Autonomous Principal Software Architect & Systems Integrator
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// LEGAL DEFENSIBILITY NOTE:
// This application provides tools for visualizing AI model explanations. It does not generate
// financial, legal, or medical advice. The explanations are based on underlying algorithms
// (e.g., SHAP, LIME, Attention) and are approximations of model behavior. They should not be
// considered ground truth. All outputs should be reviewed by a qualified human expert.
// Feature flags for jurisdictional controls are managed via the Core SDK configuration.

// ========================================================================================
// APP_51_Narrative_ModelExplainabilityUI: Main Application Entry Point
// ========================================================================================

// --- Core Framework Imports ---
import { createApp, h, App as VueApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

// --- Application Shell and Views ---
import App from './App.vue';
import DashboardView from './views/DashboardView.vue';
import ExplanationDetailView from './views/ExplanationDetailView.vue';
import ComparisonView from './views/ComparisonView.vue';
import SettingsView from './views/SettingsView.vue';
import NotFoundView from './views/NotFoundView.vue';
import IntrospectionView from './views/meta/IntrospectionView.vue';

// --- Shared Ecosystem SDK ---
// This is the central integration point with the 75-app ecosystem.
import {
    CoreSDK,
    AuthService,
    ApiClient,
    EventBus,
    Logger,
    FeatureFlagService,
    CoreSDKOptions,
    IAuthService,
    IApiClient,
    IEventBus,
    ILogger,
    IFeatureFlagService
} from '@ecosystem/core-sdk';

// --- UI Components & Styling ---
import 'normalize.css';
import './assets/styles/main.css';
// In a real app, we'd import a component library like:
// import ElementPlus from 'element-plus';
// import 'element-plus/dist/index.css';

// ========================================================================================
// AGENT METADATA (for self-querying and ecosystem awareness)
// ========================================================================================
const agentMetadata = {
    appName: 'APP_51_Narrative_ModelExplainabilityUI',
    purpose: "Provides an interactive web UI for visualizing and exploring model explainability data, such as feature importance (SHAP, LIME) and attention weights, for decisions made by various AI models integrated into the ecosystem.",
    dependencies: [
        "APP_03_Inference_Gateway",       // To get model predictions to explain.
        "APP_37_Governance_AuditTrailEngine", // To log explanation access and retrieve prediction metadata.
        "APP_42_Evaluation_ExplainabilityService", // A dedicated backend service that generates the actual explanation data (e.g., runs SHAP, LIME).
        "core-sdk",                       // For auth, event bus, and API communication.
    ],
    invalidation_conditions: [
        "Major breaking changes in the Core SDK's Auth or API contract.",
        "Deprecation of underlying explainability data formats (e.g., SHAP v1 -> v2).",
        "Significant UI/UX framework update requiring a full rewrite (e.g., Vue 3 to Vue 5).",
        "Underlying AI provider APIs for fetching model internals (logprobs, attentions) are removed or changed, breaking APP_42.",
    ],
    adjacent_apps: [
        "APP_14_Agents_MultiModelOrchestrator", // Users of this orchestrator would want to explain its decisions.
        "APP_38_Governance_PolicyEnforcementEngine", // Policies might be based on model explanations, and this UI could be used to audit policy triggers.
        "APP_25_DataLifecycle_BiasDetector", // Explanations can help identify and understand biases detected by this app.
        "APP_58_Narrative_ModelExplainabilityUI", // A more advanced version or competitor app focusing on causal inference.
    ],
    revenue_surface: [
        "SaaS subscription tiers (Basic, Pro, Enterprise) based on number of users, models analyzed, and explanation jobs per month.",
        "Pay-per-explanation for high-compute methods (e.g., full kernel SHAP).",
        "Enterprise upsell: On-premise deployment, SSO integration, dedicated support, custom explanation method integration.",
        "Marketplace fee for third-party explainability plugins.",
    ],
    cost_drivers: [
        "Frontend hosting and CDN (e.g., Vercel, Netlify, AWS S3/CloudFront).",
        "API calls to backend services (APP_42_Evaluation_ExplainabilityService), which incurs significant compute cost.",
        "Data storage for cached explanations.",
        "Third-party data visualization library licenses.",
    ],
    failure_modes: [
        "Backend explainability service (APP_42) is down or slow, preventing UI from loading data.",
        "Inaccurate or misleading visualizations due to bugs in data processing or rendering.",
        "Authentication failure with Core SDK, locking users out.",
        "Large explanation payloads cause browser performance degradation or crashes.",
        "Misinterpretation of explanations by users leading to incorrect business decisions.",
    ],
    architectural_tension: "Scale vs. Explainability. The UI must balance providing deep, computationally expensive explanations with a responsive, scalable user experience. This is managed through user-selectable explanation 'depths', caching strategies, and asynchronous job patterns for intensive analyses."
};

// Expose metadata for introspection endpoints
(window as any).__AGENT_METADATA__ = agentMetadata;

// ========================================================================================
// CORE SDK INITIALIZATION
// ========================================================================================

const getEnv = (key: string, defaultValue: string): string => {
    const value = (import.meta.env as any)[`VITE_${key}`];
    if (!value) {
        console.warn(`Environment variable ${key} is not set. Using default value: ${defaultValue}`);
        return defaultValue;
    }
    return value;
};

const sdkOptions: CoreSDKOptions = {
    apiGatewayUrl: getEnv('API_GATEWAY_URL', 'http://localhost:8080/api'),
    auth: {
        provider: getEnv('AUTH_PROVIDER', 'cognito'), // or 'okta', 'auth0'
        clientId: getEnv('AUTH_CLIENT_ID', 'default-client-id'),
        domain: getEnv('AUTH_DOMAIN', 'http://localhost:9000'),
    },
    eventBus: {
        connectionString: getEnv('EVENT_BUS_WS_URL', 'ws://localhost:8082'),
        protocol: 'websockets',
    },
    logger: {
        level: getEnv('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
        remoteLoggingEndpoint: getEnv('REMOTE_LOGGING_ENDPOINT', '/logs'),
    },
    // TENSION: Scale vs. Explainability.
    // We configure the API client with different timeouts. A quick timeout for metadata,
    // a long timeout for potentially slow, deep explanation data fetching.
    apiClientConfig: {
        timeout: 30000, // Default timeout
        headers: { 'X-App-Name': agentMetadata.appName },
        retries: 2,
    }
};

// Initialize the singletons from the Core SDK
const coreSDK = new CoreSDK(sdkOptions);
const authService: IAuthService = coreSDK.getAuthService();
const apiClient: IApiClient = coreSDK.getApiClient();
const eventBus: IEventBus = coreSDK.getEventBus();
const logger: ILogger = coreSDK.getLogger();
const featureFlags: IFeatureFlagService = coreSDK.getFeatureFlagService();

logger.info('APP_51_Narrative_ModelExplainabilityUI starting up...');
logger.debug('Core SDK initialized with options:', sdkOptions);

// ========================================================================================
// ROUTER CONFIGURATION
// ========================================================================================

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Dashboard',
        component: DashboardView,
        meta: { requiresAuth: true, title: 'Model Dashboard' },
    },
    {
        path: '/explain/:predictionId',
        name: 'ExplanationDetail',
        component: ExplanationDetailView,
        props: true,
        meta: { requiresAuth: true, title: 'Explanation Detail' },
    },
    {
        path: '/compare',
        name: 'Comparison',
        component: ComparisonView,
        meta: { requiresAuth: true, title: 'Compare Explanations' },
    },
    {
        path: '/settings',
        name: 'Settings',
        component: SettingsView,
        meta: { requiresAuth: true, title: 'Settings' },
    },
    // --- Self-Querying / Meta Endpoints ---
    {
        path: '/introspect',
        name: 'Introspection',
        component: IntrospectionView,
        meta: { requiresAuth: false, title: 'System Introspection' },
        props: { metadata: agentMetadata }
    },
    {
        path: '/assumptions',
        redirect: '/introspect' // Assumptions are part of the introspection view
    },
    {
        path: '/failure-modes',
        redirect: '/introspect' // Failure modes are part of the introspection view
    },
    // --- Catch-all for 404 ---
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFoundView,
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

// --- Navigation Guard for Authentication ---
router.beforeEach(async (to, from, next) => {
    const isAuthenticated = await authService.isAuthenticated();
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

    if (requiresAuth && !isAuthenticated) {
        logger.warn(`Unauthenticated access attempt to ${to.path}. Redirecting to login.`);
        authService.loginWithRedirect({ appState: { targetUrl: to.fullPath } });
    } else {
        next();
    }
});

router.afterEach((to) => {
    // Update page title
    document.title = `Explainability | ${to.meta.title || agentMetadata.appName}`;
    // Log navigation event for auditing
    apiClient.post('/v1/audit/navigation', {
        path: to.path,
        user: authService.getUser()?.sub,
        timestamp: new Date().toISOString(),
    }).catch(err => logger.error('Failed to log navigation audit event', err));
});


// ========================================================================================
// VUE APPLICATION SETUP
// ========================================================================================

const initializeApp = async () => {
    const app: VueApp = createApp({
        // Using a render function to handle async setup if needed
        setup() {
            // Provide SDK services to all components
            app.provide<IAuthService>('auth', authService);
            app.provide<IApiClient>('api', apiClient);
            app.provide<IEventBus>('events', eventBus);
            app.provide<ILogger>('logger', logger);
            app.provide<IFeatureFlagService>('features', featureFlags);
        },
        render: () => h(App),
    });

    // --- Install Plugins ---
    app.use(createPinia());
    app.use(router);
    // app.use(ElementPlus); // Example of a UI library

    // --- Global Error Handling ---
    app.config.errorHandler = (err, instance, info) => {
        logger.error('Unhandled Vue error:', {
            error: (err as Error).message,
            stack: (err as Error).stack,
            component: instance?.$options.name || 'UnknownComponent',
            info,
        });
        // Optionally, send to a remote error tracking service
    };

    // --- Global Properties ---
    // For easier access in templates, though provide/inject is preferred
    app.config.globalProperties.$auth = authService;
    app.config.globalProperties.$api = apiClient;
    app.config.globalProperties.$logger = logger;
    app.config.globalProperties.$features = featureFlags;

    // --- Custom Directives ---
    // Example: A directive to handle jurisdiction-specific feature visibility
    app.directive('feature-flag', {
        mounted(el, binding) {
            const flagName = binding.value;
            if (!featureFlags.isEnabled(flagName)) {
                el.style.display = 'none';
                // Or remove it completely
                // el.parentNode?.removeChild(el);
            }
        }
    });

    // --- Wait for router to be ready before mounting ---
    await router.isReady();

    // --- Mount Application ---
    app.mount('#app');

    // --- Connect to Ecosystem Event Bus ---
    eventBus.connect();
    eventBus.on('connect', () => {
        logger.info('Connected to ecosystem event bus.');
        // Subscribe to relevant events, e.g., new models being registered
        eventBus.subscribe('model.registry.new', (data) => {
            logger.info('New model registered in the ecosystem:', data);
            // Here we would trigger a state update in a Pinia store
        });
    });
    eventBus.on('disconnect', () => {
        logger.warn('Disconnected from ecosystem event bus. Attempting to reconnect...');
    });
};

// --- Handle Auth Redirect Callback ---
// This is crucial for SPAs using OAuth/OIDC redirects.
if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
    authService.handleRedirectCallback().then(() => {
        initializeApp();
    }).catch(err => {
        logger.error('Error handling auth redirect callback', err);
        // Show an error message to the user
        document.getElementById('app')!.innerHTML = `
            <div class="auth-error">
                <h1>Authentication Failed</h1>
                <p>There was an error during the login process. Please try again.</p>
                <pre>${(err as Error).message}</pre>
            </div>
        `;
    });
} else {
    initializeApp();
}