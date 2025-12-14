import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

// 1. Define Interfaces

/**
 * Represents a single compliance policy within the ecosystem.
 */
interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft' | 'deprecated';
  rules: string[]; // e.g., ["GDPR_DATA_RETENTION_PERIOD", "PCI_DSS_ENCRYPTION_STANDARD"]
  lastUpdated: string; // ISO string timestamp of last modification
  effectiveDate: string; // ISO string timestamp when the policy became/becomes effective
  owner: string; // Department or team responsible for the policy
}

/**
 * Represents a compliance alert, indicating a potential issue or required action.
 */
interface ComplianceAlert {
  id: string;
  type: 'policy_violation' | 'data_breach_risk' | 'regulatory_change' | 'audit_flag' | 'system_anomaly';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string; // ISO string timestamp when the alert was generated
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  associatedPolicyId?: string; // Optional: ID of the policy related to the alert
  entityId?: string; // Optional: ID of the entity (e.g., user, system, data record) involved
  details?: Record<string, any>; // Additional contextual details about the alert
}

/**
 * Represents an entry in the immutable audit trail, tracking actions and changes.
 */
interface AuditTrailEntry {
  id: string;
  timestamp: string; // ISO string timestamp of the action
  userId: string; // ID of the user or system performing the action
  action: string; // e.g., "POLICY_UPDATED", "DATA_ACCESSED", "ALERT_RESOLVED"
  entityType: string; // e.g., "POLICY", "ALERT", "USER", "DATA_RECORD"
  entityId: string; // ID of the entity affected by the action
  details: Record<string, any>; // Old value, new value, IP address, specific parameters, etc.
  status: 'success' | 'failure'; // Outcome of the action
}

/**
 * Defines the shape of the ComplianceContext value.
 */
interface ComplianceContextType {
  policies: CompliancePolicy[];
  alerts: ComplianceAlert[];
  auditTrail: AuditTrailEntry[];
  isComplianceInitialized: boolean; // Indicates if initial data has been loaded

  // Policy management functions
  addPolicy: (policy: Omit<CompliancePolicy, 'id' | 'lastUpdated'>) => CompliancePolicy;
  updatePolicy: (policyId: string, updates: Partial<Omit<CompliancePolicy, 'id' | 'lastUpdated'>>) => void;
  removePolicy: (policyId: string) => void;
  getPoliciesByStatus: (status: CompliancePolicy['status']) => CompliancePolicy[];

  // Alert management functions
  addAlert: (alert: Omit<ComplianceAlert, 'id' | 'timestamp' | 'status'>) => ComplianceAlert;
  updateAlert: (alertId: string, updates: Partial<Omit<ComplianceAlert, 'id' | 'timestamp'>>) => void;
  resolveAlert: (alertId: string, userId: string, resolutionDetails?: Record<string, any>) => void;
  getAlertsBySeverity: (severity: ComplianceAlert['severity']) => ComplianceAlert[];

  // Audit trail functions
  addAuditEntry: (entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>) => AuditTrailEntry;
  getAuditTrailForEntity: (entityId: string) => AuditTrailEntry[];
}

// 2. Initial State for the Context (used before provider is mounted)
const initialComplianceState: ComplianceContextType = {
  policies: [],
  alerts: [],
  auditTrail: [],
  isComplianceInitialized: false,
  addPolicy: () => { throw new Error('ComplianceProvider not found'); },
  updatePolicy: () => { throw new Error('ComplianceProvider not found'); },
  removePolicy: () => { throw new Error('ComplianceProvider not found'); },
  getPoliciesByStatus: () => { throw new Error('ComplianceProvider not found'); },
  addAlert: () => { throw new Error('ComplianceProvider not found'); },
  updateAlert: () => { throw new Error('ComplianceProvider not found'); },
  resolveAlert: () => { throw new Error('ComplianceProvider not found'); },
  getAlertsBySeverity: () => { throw new Error('ComplianceProvider not found'); },
  addAuditEntry: () => { throw new Error('ComplianceProvider not found'); },
  getAuditTrailForEntity: () => { throw new Error('ComplianceProvider not found'); },
};

// 3. Create the React Context
const ComplianceContext = createContext<ComplianceContextType>(initialComplianceState);

// 4. Compliance Provider Component
interface ComplianceProviderProps {
  children: ReactNode;
}

/**
 * `ComplianceProvider` is a React Context Provider that manages global compliance-related state.
 * It provides policies, alerts, and an audit trail, along with functions to interact with them.
 * This ensures regulatory adherence throughout the ecosystem.
 */
export const ComplianceProvider: React.FC<ComplianceProviderProps> = ({ children }) => {
  const [policies, setPolicies] = useState<CompliancePolicy[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [isComplianceInitialized, setIsComplianceInitialized] = useState<boolean>(false);

  // Simulate initial data loading (e.g., from an API or configuration)
  // In a real application, this useEffect would fetch data from a backend.
  useEffect(() => {
    // Example initial policies
    const initialPolicies: CompliancePolicy[] = [
      {
        id: uuidv4(),
        name: 'GDPR Data Retention Policy',
        description: 'Policy for retaining personal data in compliance with GDPR.',
        status: 'active',
        rules: ['MAX_RETENTION_PERIOD_5_YEARS', 'DATA_MINIMIZATION_PRINCIPLE'],
        lastUpdated: new Date().toISOString(),
        effectiveDate: '2018-05-25T00:00:00Z',
        owner: 'Legal Department',
      },
      {
        id: uuidv4(),
        name: 'PCI DSS Compliance Policy',
        description: 'Policy for handling credit card data securely.',
        status: 'active',
        rules: ['ENCRYPT_CARDHOLDER_DATA', 'REGULAR_SECURITY_TESTING'],
        lastUpdated: new Date().toISOString(),
        effectiveDate: '2020-01-01T00:00:00Z',
        owner: 'Security Team',
      },
    ];
    setPolicies(initialPolicies);
    setIsComplianceInitialized(true);

    // Add an initial audit entry for system startup
    addAuditEntry({
      userId: 'SYSTEM',
      action: 'COMPLIANCE_SERVICE_INITIALIZED',
      entityType: 'SYSTEM',
      entityId: 'COMPLIANCE_MODULE',
      details: { initialPoliciesLoaded: initialPolicies.length },
      status: 'success',
    });
  }, []); // Empty dependency array ensures this runs only once on mount

  // Audit Trail Management (internal helper, not exposed directly via context)
  const addAuditEntry = useCallback((entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): AuditTrailEntry => {
    const newEntry: AuditTrailEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    setAuditTrail((prev) => [...prev, newEntry]);
    return newEntry;
  }, []);

  // Policy Management Functions
  const addPolicy = useCallback((policy: Omit<CompliancePolicy, 'id' | 'lastUpdated'>): CompliancePolicy => {
    const newPolicy: CompliancePolicy = {
      ...policy,
      id: uuidv4(),
      lastUpdated: new Date().toISOString(),
    };
    setPolicies((prev) => [...prev, newPolicy]);
    addAuditEntry({
      userId: 'SYSTEM', // In a real app, get from AuthContext
      action: 'POLICY_CREATED',
      entityType: 'POLICY',
      entityId: newPolicy.id,
      details: { policyName: newPolicy.name, status: newPolicy.status },
      status: 'success',
    });
    return newPolicy;
  }, [addAuditEntry]);

  const updatePolicy = useCallback((policyId: string, updates: Partial<Omit<CompliancePolicy, 'id' | 'lastUpdated'>>) => {
    setPolicies((prev) => {
      const oldPolicy = prev.find(p => p.id === policyId);
      if (!oldPolicy) return prev;

      const updatedPolicy = { ...oldPolicy, ...updates, lastUpdated: new Date().toISOString() };
      addAuditEntry({
        userId: 'SYSTEM', // In a real app, get from AuthContext
        action: 'POLICY_UPDATED',
        entityType: 'POLICY',
        entityId: policyId,
        details: { old: oldPolicy, new: updatedPolicy },
        status: 'success',
      });
      return prev.map((p) => (p.id === policyId ? updatedPolicy : p));
    });
  }, [addAuditEntry]);

  const removePolicy = useCallback((policyId: string) => {
    setPolicies((prev) => {
      const removedPolicy = prev.find(p => p.id === policyId);
      if (!removedPolicy) return prev;

      addAuditEntry({
        userId: 'SYSTEM', // In a real app, get from AuthContext
        action: 'POLICY_REMOVED',
        entityType: 'POLICY',
        entityId: policyId,
        details: { policyName: removedPolicy.name },
        status: 'success',
      });
      return prev.filter((p) => p.id !== policyId);
    });
  }, [addAuditEntry]);

  const getPoliciesByStatus = useCallback((status: CompliancePolicy['status']) => {
    return policies.filter(p => p.status === status);
  }, [policies]);

  // Alert Management Functions
  const addAlert = useCallback((alert: Omit<ComplianceAlert, 'id' | 'timestamp' | 'status'>): ComplianceAlert => {
    const newAlert: ComplianceAlert = {
      ...alert,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: 'open', // New alerts are always 'open'
    };
    setAlerts((prev) => [...prev, newAlert]);
    addAuditEntry({
      userId: 'SYSTEM', // Alerts can be system-generated
      action: 'ALERT_CREATED',
      entityType: 'ALERT',
      entityId: newAlert.id,
      details: { type: newAlert.type, severity: newAlert.severity, message: newAlert.message },
      status: 'success',
    });
    return newAlert;
  }, [addAuditEntry]);

  const updateAlert = useCallback((alertId: string, updates: Partial<Omit<ComplianceAlert, 'id' | 'timestamp'>>) => {
    setAlerts((prev) => {
      const oldAlert = prev.find(a => a.id === alertId);
      if (!oldAlert) return prev;

      const updatedAlert = { ...oldAlert, ...updates };
      addAuditEntry({
        userId: 'SYSTEM', // Or user who updated it
        action: 'ALERT_UPDATED',
        entityType: 'ALERT',
        entityId: alertId,
        details: { old: oldAlert, new: updatedAlert },
        status: 'success',
      });
      return prev.map((a) => (a.id === alertId ? updatedAlert : a));
    });
  }, [addAuditEntry]);

  const resolveAlert = useCallback((alertId: string, userId: string, resolutionDetails?: Record<string, any>) => {
    setAlerts((prev) => {
      const oldAlert = prev.find(a => a.id === alertId);
      if (!oldAlert) return prev;

      const resolvedAlert = { ...oldAlert, status: 'resolved', details: { ...oldAlert.details, resolutionDetails, resolvedBy: userId, resolvedAt: new Date().toISOString() } };
      addAuditEntry({
        userId: userId,
        action: 'ALERT_RESOLVED',
        entityType: 'ALERT',
        entityId: alertId,
        details: { resolutionDetails },
        status: 'success',
      });
      return prev.map((a) => (a.id === alertId ? resolvedAlert : a));
    });
  }, [addAuditEntry]);

  const getAlertsBySeverity = useCallback((severity: ComplianceAlert['severity']) => {
    return alerts.filter(a => a.severity === severity);
  }, [alerts]);

  // Audit Trail Query Functions
  const getAuditTrailForEntity = useCallback((entityId: string) => {
    return auditTrail.filter(entry => entry.entityId === entityId);
  }, [auditTrail]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      policies,
      alerts,
      auditTrail,
      isComplianceInitialized,
      addPolicy,
      updatePolicy,
      removePolicy,
      getPoliciesByStatus,
      addAlert,
      updateAlert,
      resolveAlert,
      addAuditEntry, // Exposed for direct audit logging from components if needed
      getAuditTrailForEntity,
      getAlertsBySeverity,
    }),
    [
      policies,
      alerts,
      auditTrail,
      isComplianceInitialized,
      addPolicy,
      updatePolicy,
      removePolicy,
      getPoliciesByStatus,
      addAlert,
      updateAlert,
      resolveAlert,
      addAuditEntry,
      getAuditTrailForEntity,
      getAlertsBySeverity,
    ]
  );

  return (
    <ComplianceContext.Provider value={contextValue}>
      {children}
    </ComplianceContext.Provider>
  );
};

// 5. Custom Hook for easy consumption of the context
/**
 * `useCompliance` is a custom hook that provides access to the compliance context.
 * It should be used within a component wrapped by `ComplianceProvider`.
 * @returns The compliance context value (policies, alerts, audit trail, and related functions).
 * @throws Error if used outside of a `ComplianceProvider`.
 */
export const useCompliance = () => {
  const context = useContext(ComplianceContext);
  if (context === initialComplianceState) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};