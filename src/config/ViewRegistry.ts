import { ComponentType, LazyExoticComponent, lazy } from 'react';
import {
  LayoutDashboard,
  Settings,
  Info,
  FileText,
  TerminalSquare,
  Globe,
  LucideIcon,
  BookUser,
  Calendar,
} from 'lucide-react';

/**
 * Defines the type of a view.
 * - 'core': A fundamental part of the shell UI (e.g., Dashboard, Settings).
 * - 'app': A standalone application that can be launched.
 */
export type ViewType = 'core' | 'app';

/**
 * Represents the registration for a single view or application.
 * This metadata is used for routing, menu generation, and dynamic loading.
 */
export interface ViewRegistration {
  /**
   * A unique identifier for the view (e.g., 'dashboard', 'app-notepad').
   * Used as the key in the registry and for routing.
   */
  id: string;

  /**
   * The human-readable name of the view (e.g., 'Dashboard', 'Notepad').
   * Used for display in menus, tabs, and titles.
   */
  name: string;

  /**
   * The type of the view, categorizing its role in the system.
   */
  type: ViewType;

  /**
   * A dynamically imported React component using React.lazy.
   * This enables code-splitting, so views are only loaded when needed.
   */
  component: LazyExoticComponent<ComponentType<any>>;

  /**
   * An optional icon component (from lucide-react) to represent the view.
   */
  icon?: LucideIcon;

  /**
   * If true, this view is considered the default view to open on startup.
   * Only one view should have this flag set to true.
   */
  isDefault?: boolean;

  /**
   * If true, this view will be permanently shown in a primary navigation area,
   * like a sidebar.
   */
  isPinned?: boolean;
}

/**
 * The master list of all available views and applications in the system.
 * This array is the single source of truth for view registration.
 */
const viewList: Readonly<ViewRegistration[]> = [
  // --- Core Views ---
  {
    id: 'dashboard',
    name: 'Dashboard',
    type: 'core',
    component: lazy(() => import('../views/DashboardView')),
    icon: LayoutDashboard,
    isDefault: true,
    isPinned: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    type: 'core',
    component: lazy(() => import('../views/SettingsView')),
    icon: Settings,
    isPinned: true,
  },
  {
    id: 'about',
    name: 'About',
    type: 'core',
    component: lazy(() => import('../views/AboutView')),
    icon: Info,
  },

  // --- Applications ---
  {
    id: 'app-notepad',
    name: 'Notepad',
    type: 'app',
    component: lazy(() => import('../apps/Notepad/NotepadApp')),
    icon: FileText,
  },
  {
    id: 'app-terminal',
    name: 'Terminal',
    type: 'app',
    component: lazy(() => import('../apps/Terminal/TerminalApp')),
    icon: TerminalSquare,
  },
  {
    id: 'app-browser',
    name: 'Web Browser',
    type: 'app',
    component: lazy(() => import('../apps/Browser/BrowserApp')),
    icon: Globe,
  },
  {
    id: 'app-contacts',
    name: 'Contacts',
    type: 'app',
    component: lazy(() => import('../apps/Contacts/ContactsApp')),
    icon: BookUser,
  },
  {
    id: 'app-calendar',
    name: 'Calendar',
    type: 'app',
    component: lazy(() => import('../apps/Calendar/CalendarApp')),
    icon: Calendar,
  },

  // --- Citibankdemobusinessinc Applications ---
  {
    id: 'Citibankdemobusinessinc.creditrisk.modelvalidation',
    name: 'Credit Risk Model Validation',
    type: 'app',
    component: lazy(() => import('../apps/Citibankdemobusinessinc/CreditRiskModelValidationApp')),
    icon: FileText,
  },
  {
    id: 'Citibankdemobusinessinc.marketrisk.realtimeanalytics',
    name: 'Market Risk Real-time Analytics',
    type: 'app',
    component: lazy(() => import('../apps/Citibankdemobusinessinc/MarketRiskAnalyticsApp')),
    icon: TerminalSquare,
  },
  {
    id: 'Citibankdemobusinessinc.fraud.detectionai',
    name: 'Fraud Detection AI',
    type: 'app',
    component: lazy(() => import('../apps/Citibankdemobusinessinc/FraudDetectionApp')),
    icon: Globe,
  },
  {
    id: 'Citibankdemobusinessinc.compliance.regulatoryreporting',
    name: 'Regulatory Reporting Automation',
    type: 'app',
    component: lazy(() => import('../apps/Citibankdemobusinessinc/RegulatoryReportingApp')),
    icon: BookUser,
  },
  {
    id: 'Citibankdemobusinessinc.liquidity.stressTesting',
    name: 'Liquidity Stress Testing',
    type: 'app',
    component: lazy(() => import('../apps/Citibankdemobusinessinc/LiquidityStressTestingApp')),
    icon: Calendar,
  },
  {
    id: 'Citibankdemobusinessinc.cybersecurity.threatintel',
    name: 'Cybersecurity Threat Intelligence',
    type: 'app',
    component: lazy(() => import('../apps/Citibankdemobusinessinc/ThreatIntelligenceApp')),
    icon: Globe,
  },
  {
    id: 'Citibankdemobusinessinc.wealth.personalizedadvice',
    name: 'Personalized Wealth Advice',
    type: 'app',
    component: lazy(() => import('../apps/Citibankdemobusinessinc/WealthAdviceApp')),
    icon: BookUser,
  },
  {
    id: 'Citibankdemobusinessinc.investment.portfoliomanagement',
    name: 'AI Portfolio Management',
    type: 'app',
    component: lazy(() => import('../apps/Citibankdemobusinessinc/PortfolioManagementApp')),
    icon: Calendar,
  },
  {
    id: 'Citibankdemobusinessinc.retail.customeroffers',
    name: 'Personalized Customer Offers',
    type: 'app',
    component: lazy(() => import('../apps/Citibankdemobusinessinc/CustomerOffersApp')),
    icon: Globe,
  },
  {
    id: 'Citibankdemobusinessinc.operations.processautomation',
    name: 'Operations Process Automation',
    type: 'app',
    component: lazy(() => import('../apps/Citibankdemobusinessinc/ProcessAutomationApp')),
    icon: BookUser,
  },
];

/**
 * A Map for efficient O(1) lookup of views by their ID.
 * This is derived from the `viewList`.
 */
export const ViewRegistry = new Map<string, ViewRegistration>(
  viewList.map((view) => [view.id, view])
);

/**
 * Retrieves a view registration by its unique ID.
 * @param id The ID of the view to retrieve.
 * @returns The ViewRegistration object, or undefined if not found.
 */
export const getViewById = (id: string): ViewRegistration | undefined => {
  return ViewRegistry.get(id);
};

/**
 * Returns a list of all registered views and apps.
 * @returns An array of all ViewRegistration objects.
 */
export const getAllViews = (): Readonly<ViewRegistration[]> => {
  return viewList;
};

/**
 * Returns the default view registration.
 * Falls back to the first registered view if no default is explicitly set.
 * @returns The default ViewRegistration object.
 */
export const getDefaultView = (): ViewRegistration => {
  return viewList.find((v) => v.isDefault) ?? viewList[0];
};

/**
 * Returns all registered applications.
 * @returns An array of ViewRegistration objects where type is 'app'.
 */
export const getApps = (): ViewRegistration[] => {
  return viewList.filter((v) => v.type === 'app');
};

/**
 * Returns all core views.
 * @returns An array of ViewRegistration objects where type is 'core'.
 */
export const getCoreViews = (): ViewRegistration[] => {
  return viewList.filter((v) => v.type === 'core');
};

/**
 * Returns all views that are pinned to the main navigation.
 * @returns An array of pinned ViewRegistration objects.
 */
export const getPinnedViews = (): ViewRegistration[] => {
  return viewList.filter((v) => v.isPinned);
};