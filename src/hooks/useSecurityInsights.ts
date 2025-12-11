import { useMemo } from 'react';

// Types representing the data structure provided in the project goal
export interface AppData {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType: string;
  accountEnabled: boolean;
  applicationVisibility: string;
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

export interface SecurityAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedAppId: string;
  affectedAppName: string;
  detectedAt: string;
}

/**
 * Heuristic engine: Detects suspicious keywords in application names.
 * Targets: 'stupid', 'test', 'demo', '666', known anomalous strings like 'gongo'.
 */
const detectSuspiciousNames = (apps: AppData[]): SecurityAlert[] => {
  const alerts: SecurityAlert[] = [];
  const SUSPICIOUS_PATTERN = /(stupid|gongo|billgates|666|hacker|malware|phznk|mew2|owners|jocall3|sicks)/i;

  apps.forEach((app) => {
    if (SUSPICIOUS_PATTERN.test(app.displayName)) {
      alerts.push({
        id: `suspicious-name-${app.id}`,
        severity: 'high',
        title: 'Suspicious Application Name',
        description: `The application "${app.displayName}" contains keywords often associated with testing, junk data, or unauthorized entities.`,
        affectedAppId: app.id,
        affectedAppName: app.displayName,
        detectedAt: new Date().toISOString(),
      });
    }
  });

  return alerts;
};

/**
 * Heuristic engine: Detects obfuscation attempts using non-ASCII characters.
 * Targets: Emojis, unusual unicode characters.
 */
const detectObfuscation = (apps: AppData[]): SecurityAlert[] => {
  const alerts: SecurityAlert[] = [];
  // Matches characters outside standard ASCII range (0-127)
  const NON_ASCII_REGEX = /[^\x00-\x7F]+/;

  apps.forEach((app) => {
    if (NON_ASCII_REGEX.test(app.displayName)) {
      alerts.push({
        id: `obfuscation-${app.id}`,
        severity: 'medium',
        title: 'Potential Obfuscation Detected',
        description: `The application name "${app.displayName}" contains non-standard characters or emojis. This technique is often used to mask malicious apps.`,
        affectedAppId: app.id,
        affectedAppName: app.displayName,
        detectedAt: new Date().toISOString(),
      });
    }
  });

  return alerts;
};

/**
 * Heuristic engine: Detects hidden Enterprise Applications.
 * Targets: Apps marked as 'Hidden' that are not standard Microsoft infrastructure.
 */
const detectHiddenPersistence = (apps: AppData[]): SecurityAlert[] => {
  const alerts: SecurityAlert[] = [];

  apps.forEach((app) => {
    // We check for Enterprise Applications specifically, as hiding them is a common persistence tactic
    if (
      app.applicationType === 'Enterprise Application' &&
      app.applicationVisibility === 'Hidden'
    ) {
      alerts.push({
        id: `hidden-app-${app.id}`,
        severity: 'medium',
        title: 'Hidden Enterprise Application',
        description: `The application "${app.displayName}" is marked as 'Hidden'. Verify if this is a legitimate administrative tool or an attempt to conceal access.`,
        affectedAppId: app.id,
        affectedAppName: app.displayName,
        detectedAt: new Date().toISOString(),
      });
    }
  });

  return alerts;
};

/**
 * Heuristic engine: Detects recent creation of sensitive entity types.
 * Targets: Managed Identities created in the last 7 days (relative to dataset context).
 */
const detectRecentPrivilegedEntities = (apps: AppData[]): SecurityAlert[] => {
  const alerts: SecurityAlert[] = [];
  // Based on dataset, we assume 'current' time is roughly May 2022. 
  // In a real app, this would be Date.now().
  // Using a static date slightly ahead of the dataset to simulate the "current" analysis window.
  const REFERENCE_DATE = new Date('2022-05-05').getTime();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  apps.forEach((app) => {
    const createdTime = new Date(app.createdDateTime).getTime();
    const isRecent = (REFERENCE_DATE - createdTime) < ONE_WEEK_MS;

    if (isRecent && app.applicationType === 'Managed Identity') {
      alerts.push({
        id: `recent-identity-${app.id}`,
        severity: 'low',
        title: 'New Managed Identity Created',
        description: `A new Managed Identity "${app.displayName}" was created recently. Ensure this resource creation was authorized.`,
        affectedAppId: app.id,
        affectedAppName: app.displayName,
        detectedAt: new Date().toISOString(),
      });
    }
  });

  return alerts;
};

/**
 * Main Hook: useSecurityInsights
 * Orchestrates the analysis of the application dataset.
 */
export const useSecurityInsights = (data: AppData[]) => {
  const insights = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        alerts: [],
        stats: { high: 0, medium: 0, low: 0, total: 0 }
      };
    }

    // Run AI Engines
    const nameAlerts = detectSuspiciousNames(data);
    const obfuscationAlerts = detectObfuscation(data);
    const hiddenAlerts = detectHiddenPersistence(data);
    const recentAlerts = detectRecentPrivilegedEntities(data);

    const allAlerts = [
      ...nameAlerts,
      ...obfuscationAlerts,
      ...hiddenAlerts,
      ...recentAlerts,
    ];

    // Sort by severity (High -> Medium -> Low)
    const severityWeight = { high: 3, medium: 2, low: 1 };
    allAlerts.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

    // Calculate stats
    const stats = allAlerts.reduce(
      (acc, alert) => {
        acc[alert.severity]++;
        acc.total++;
        return acc;
      },
      { high: 0, medium: 0, low: 0, total: 0 }
    );

    return { alerts: allAlerts, stats };
  }, [data]);

  return insights;
};