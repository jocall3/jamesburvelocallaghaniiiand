export interface AppRoute {
    path: string;
    name: string;
    exact?: boolean;
    icon?: string; // For potential sidebar/navigation icons
    component?: string; // Placeholder for component name, actual import happens in router setup
}

export const routes: AppRoute[] = [
    {
        path: '/',
        name: 'Dashboard',
        exact: true,
        icon: 'dashboard',
        component: 'DashboardView' // Assuming a DashboardView component exists
    },
    {
        path: '/licensing',
        name: 'Licensing & Compliance',
        icon: 'license',
        component: 'LicensingView'
    },
    {
        path: '/compliance-policies',
        name: 'Compliance Policies',
        icon: 'policy',
        component: 'CompliancePoliciesView' // Assuming a dedicated view for policies
    },
    {
        path: '/regulatory-updates',
        name: 'Regulatory Updates',
        icon: 'update',
        component: 'RegulatoryUpdatesView' // Assuming a dedicated view for regulatory updates
    },
    {
        path: '/risk-assessments',
        name: 'Risk Assessments',
        icon: 'risk',
        component: 'RiskAssessmentsView' // Assuming a dedicated view for risk assessments
    },
    // Potentially more specific routes or sub-routes
    {
        path: '/settings',
        name: 'Settings',
        icon: 'settings',
        component: 'SettingsView' // Assuming a SettingsView component
    },
    {
        path: '/users',
        name: 'User Management',
        icon: 'users',
        component: 'UserManagementView' // Assuming a UserManagementView component
    },
];

// You might also export specific route groups or constants
export const DASHBOARD_ROUTE = routes[0];
export const LICENSING_ROUTE = routes[1];
export const COMPLIANCE_POLICIES_ROUTE = routes[2];
export const REGULATORY_UPDATES_ROUTE = routes[3];
export const RISK_ASSESSMENTS_ROUTE = routes[4];