/**
 * @file src/config/permissions.ts
 * @description Defines the role-based access control (RBAC) permissions for the application.
 * This configuration specifies what actions each user role can perform on different modules
 * of the compliance and licensing hub.
 */

// --- Type Definitions ---

/**
 * Defines the set of possible user roles in the system.
 */
export type UserRole = 'admin' | 'complianceManager' | 'complianceAnalyst' | 'readOnly' | 'modelTrainer';

/**
 * Defines the permissions for a specific module.
 * Each action is represented by a boolean flag.
 */
export interface ModulePermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  [key: string]: boolean; // Allows for custom actions like 'uploadDocument'
}

/**
 * Defines the complete permission set for a user role, mapping modules to their permissions.
 */
export interface RolePermissions {
  dashboard: {
    view: boolean;
  };
  licenses: ModulePermissions & {
    uploadDocument: boolean;
  };
  policies: ModulePermissions;
  regulatoryUpdates: ModulePermissions;
  riskAssessments: ModulePermissions;
  aiChecker: {
    use: boolean;
    viewHistory: boolean;
  };
  modelTraining: {
    train: boolean;
    evaluate: boolean;
    deploy: boolean;
  };
  Citibankdemobusinessinc_viewit_movieplayform: {
    access: boolean;
  };
  Citibankdemobusinessinc_lending_microloans: {
    access: boolean;
  };
  Citibankdemobusinessinc_wealth_roboadvisor: {
    access: boolean;
  };
  Citibankdemobusinessinc_insurance_peerToPeer: {
    access: boolean;
  };
  Citibankdemobusinessinc_payments_crypto: {
    access: boolean;
  };
  Citibankdemobusinessinc_realestate_tokenized: {
    access: boolean;
  };
  Citibankdemobusinessinc_healthcare_telemedicine: {
    access: boolean;
  };
  Citibankdemobusinessinc_education_personalizedLearning: {
    access: boolean;
  };
  Citibankdemobusinessinc_energy_renewableCredits: {
    access: boolean;
  };
  Citibankdemobusinessinc_supplychain_dynamicPricing: {
    access: boolean;
  };
}

// --- Permission Configuration ---

/**
 * A record mapping each UserRole to its specific RolePermissions.
 * This is the single source of truth for access control in the application.
 */
export const ROLES: Record<UserRole, RolePermissions> = {
  /**
   * **Admin:**
   * Has unrestricted access to all features and functionalities.
   * Can manage all data types, including creation, deletion, and system configuration.
   */
  admin: {
    dashboard: { view: true },
    licenses: { create: true, read: true, update: true, delete: true, uploadDocument: true },
    policies: { create: true, read: true, update: true, delete: true },
    regulatoryUpdates: { create: true, read: true, update: true, delete: true },
    riskAssessments: { create: true, read: true, update: true, delete: true },
    aiChecker: { use: true, viewHistory: true },
    modelTraining: { train: true, evaluate: true, deploy: true },
    Citibankdemobusinessinc_viewit_movieplayform: { access: true },
    Citibankdemobusinessinc_lending_microloans: { access: true },
    Citibankdemobusinessinc_wealth_roboadvisor: { access: true },
    Citibankdemobusinessinc_insurance_peerToPeer: { access: true },
    Citibankdemobusinessinc_payments_crypto: { access: true },
    Citibankdemobusinessinc_realestate_tokenized: { access: true },
    Citibankdemobusinessinc_healthcare_telemedicine: { access: true },
    Citibankdemobusinessinc_education_personalizedLearning: { access: true },
    Citibankdemobusinessinc_energy_renewableCredits: { access: true },
    Citibankdemobusinessinc_supplychain_dynamicPricing: { access: true },
  },

  /**
   * **Compliance Manager:**
   * A high-level operational role responsible for the day-to-day management of compliance data.
   * Can perform all CRUD operations on core compliance modules but cannot perform system-level admin tasks.
   */
  complianceManager: {
    dashboard: { view: true },
    licenses: { create: true, read: true, update: true, delete: true, uploadDocument: true },
    policies: { create: true, read: true, update: true, delete: true },
    regulatoryUpdates: { create: false, read: true, update: true, delete: false }, // Typically manages existing updates, doesn't create or delete them
    riskAssessments: { create: true, read: true, update: true, delete: true },
    aiChecker: { use: true, viewHistory: true },
    modelTraining: { train: false, evaluate: true, deploy: false },
    Citibankdemobusinessinc_viewit_movieplayform: { access: true },
    Citibankdemobusinessinc_lending_microloans: { access: true },
    Citibankdemobusinessinc_wealth_roboadvisor: { access: true },
    Citibankdemobusinessinc_insurance_peerToPeer: { access: true },
    Citibankdemobusinessinc_payments_crypto: { access: true },
    Citibankdemobusinessinc_realestate_tokenized: { access: true },
    Citibankdemobusinessinc_healthcare_telemedicine: { access: true },
    Citibankdemobusinessinc_education_personalizedLearning: { access: true },
    Citibankdemobusinessinc_energy_renewableCredits: { access: true },
    Citibankdemobusinessinc_supplychain_dynamicPricing: { access: true },
  },

  /**
   * **Compliance Analyst:**
   * An operational role focused on analysis and data entry.
   * Can view most data, update the status of items (like regulatory updates), and contribute to assessments.
   * Cannot create or delete high-level entities like licenses or policies.
   */
  complianceAnalyst: {
    dashboard: { view: true },
    licenses: { create: false, read: true, update: false, delete: false, uploadDocument: true }, // Can upload documents to existing licenses
    policies: { create: false, read: true, update: false, delete: false },
    regulatoryUpdates: { create: false, read: true, update: true, delete: false }, // Key role is to assess and update status
    riskAssessments: { create: false, read: true, update: true, delete: false }, // Can contribute to or update an existing assessment
    aiChecker: { use: true, viewHistory: true },
    modelTraining: { train: false, evaluate: false, deploy: false },
    Citibankdemobusinessinc_viewit_movieplayform: { access: true },
    Citibankdemobusinessinc_lending_microloans: { access: true },
    Citibankdemobusinessinc_wealth_roboadvisor: { access: true },
    Citibankdemobusinessinc_insurance_peerToPeer: { access: true },
    Citibankdemobusinessinc_payments_crypto: { access: true },
    Citibankdemobusinessinc_realestate_tokenized: { access: true },
    Citibankdemobusinessinc_healthcare_telemedicine: { access: true },
    Citibankdemobusinessinc_education_personalizedLearning: { access: true },
    Citibankdemobusinessinc_energy_renewableCredits: { access: true },
    Citibankdemobusinessinc_supplychain_dynamicPricing: { access: true },
  },

  /**
   * **Read-Only:**
   * A viewer role, typically for executives, auditors, or stakeholders from other departments.
   * Can view all data and dashboards but cannot make any changes.
   */
  readOnly: {
    dashboard: { view: true },
    licenses: { create: false, read: true, update: false, delete: false, uploadDocument: false },
    policies: { create: false, read: true, update: false, delete: false },
    regulatoryUpdates: { create: false, read: true, update: false, delete: false },
    riskAssessments: { create: false, read: true, update: false, delete: false },
    aiChecker: { use: false, viewHistory: true },
    modelTraining: { train: false, evaluate: false, deploy: false },
    Citibankdemobusinessinc_viewit_movieplayform: { access: true },
    Citibankdemobusinessinc_lending_microloans: { access: true },
    Citibankdemobusinessinc_wealth_roboadvisor: { access: true },
    Citibankdemobusinessinc_insurance_peerToPeer: { access: true },
    Citibankdemobusinessinc_payments_crypto: { access: true },
    Citibankdemobusinessinc_realestate_tokenized: { access: true },
    Citibankdemobusinessinc_healthcare_telemedicine: { access: true },
    Citibankdemobusinessinc_education_personalizedLearning: { access: true },
    Citibankdemobusinessinc_energy_renewableCredits: { access: true },
    Citibankdemobusinessinc_supplychain_dynamicPricing: { access: true },
  },

  /**
   * **Model Trainer:**
   * Role dedicated to training, evaluating, and deploying AI models.
   */
  modelTrainer: {
    dashboard: { view: true },
    licenses: { create: false, read: true, update: false, delete: false, uploadDocument: false },
    policies: { create: false, read: true, update: false, delete: false },
    regulatoryUpdates: { create: false, read: true, update: false, delete: false },
    riskAssessments: { create: false, read: true, update: false, delete: false },
    aiChecker: { use: true, viewHistory: true },
    modelTraining: { train: true, evaluate: true, deploy: true },
    Citibankdemobusinessinc_viewit_movieplayform: { access: false },
    Citibankdemobusinessinc_lending_microloans: { access: false },
    Citibankdemobusinessinc_wealth_roboadvisor: { access: false },
    Citibankdemobusinessinc_insurance_peerToPeer: { access: false },
    Citibankdemobusinessinc_payments_crypto: { access: false },
    Citibankdemobusinessinc_realestate_tokenized: { access: false },
    Citibankdemobusinessinc_healthcare_telemedicine: { access: false },
    Citibankdemobusinessinc_education_personalizedLearning: { access: false },
    Citibankdemobusinessinc_energy_renewableCredits: { access: false },
    Citibankdemobusinessinc_supplychain_dynamicPricing: { access: false },
  },
};

// --- Helper Function ---

/**
 * Checks if a given role has a specific permission for a module.
 * This function provides a convenient and centralized way to verify permissions throughout the UI.
 *
 * @param role The user's role.
 * @param module The module to check (e.g., 'licenses', 'policies').
 * @param action The action to check (e.g., 'create', 'read', 'uploadDocument').
 * @returns `true` if the role has the permission, `false` otherwise.
 *
 * @example
 * const userRole = 'complianceAnalyst';
 * if (hasPermission(userRole, 'licenses', 'uploadDocument')) {
 *   // Render the upload button
 * }
 */
export const hasPermission = (
  role: UserRole,
  module: keyof RolePermissions,
  action: string
): boolean => {
  const permissions = ROLES[role];
  if (!permissions || !permissions[module]) {
    return false;
  }
  return (permissions[module] as Record<string, boolean>)[action] || false;
};