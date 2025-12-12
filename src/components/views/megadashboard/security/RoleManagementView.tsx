import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Search, 
  Check, 
  X, 
  Brain, 
  Lock, 
  Edit3, 
  Trash2, 
  AlertCircle,
  Terminal
} from 'lucide-react';

// --- Types ---

type PermissionLevel = 'none' | 'read' | 'write' | 'full';

interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  isSystem: boolean; // Cannot be deleted
  permissions: Record<string, PermissionLevel>; // e.g., 'users': 'read'
}

const RESOURCES = [
  'Users',
  'Financials',
  'Audit Logs',
  'System Settings',
  'API Keys',
  'Content',
  'Marketing',
  'Risk Management',
  'Compliance',
  'Customer Data',
];

const PERMISSION_LEVELS: PermissionLevel[] = ['none', 'read', 'write', 'full'];

// --- Utility Functions ---

const generateId = (): string => `role-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const generateRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomDescription = (): string => {
    const descriptions = [
        "Manages user accounts and permissions.",
        "Oversees financial transactions and reporting.",
        "Monitors system logs for security breaches.",
        "Configures system settings and parameters.",
        "Generates and manages API keys.",
        "Creates and publishes marketing content.",
        "Analyzes market trends and customer behavior.",
        "Identifies and mitigates potential risks.",
        "Ensures compliance with regulatory requirements.",
        "Maintains customer data privacy and security.",
        "Handles legal matters and contracts.",
        "Develops and maintains software applications.",
        "Provides technical support to users.",
        "Manages projects and timelines.",
        "Conducts research and development activities."
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
};

// --- Citibankdemobusinessinc Namespace ---

namespace Citibankdemobusinessinc {
    export namespace OpenBanking {
        export interface RoleManagementInterface {
            roles: Role[];
            selectedRole: Role | null;
            addRole: (role: Role) => void;
            updateRole: (role: Role) => void;
            deleteRole: (roleId: string) => void;
            selectRole: (roleId: string) => void;
            searchRoles: (query: string) => Role[];
        }

        export class RoleManagement implements RoleManagementInterface {
            public roles: Role[] = [];
            public selectedRole: Role | null = null;

            constructor(initialRoles: Role[] = []) {
                this.roles = initialRoles;
                if (initialRoles.length > 0) {
                    this.selectedRole = initialRoles[0];
                }
            }

            addRole(role: Role): void {
                this.roles = [...this.roles, role];
                this.selectedRole = role;
            }

            updateRole(role: Role): void {
                this.roles = this.roles.map(r => (r.id === role.id ? role : r));
                this.selectedRole = role;
            }

            deleteRole(roleId: string): void {
                this.roles = this.roles.filter(r => r.id !== roleId);
                this.selectedRole = this.roles.length > 0 ? this.roles[0] : null;
            }

            selectRole(roleId: string): void {
                this.selectedRole = this.roles.find(r => r.id === roleId) || null;
            }

            searchRoles(query: string): Role[] {
                const lowerQuery = query.toLowerCase();
                return this.roles.filter(r => r.name.toLowerCase().includes(lowerQuery));
            }
        }
    }

    export namespace Viewit {
        export namespace MoviePlayform {
            export function generateMovieRole(): Role {
                const roleName = `Movie Buff ${generateRandomInt(1, 100)}`;
                return {
                    id: generateId(),
                    name: roleName,
                    description: "Enjoys watching movies and providing reviews.",
                    usersCount: generateRandomInt(10, 50),
                    isSystem: false,
                    permissions: {
                        'Users': 'none',
                        'Financials': 'none',
                        'Audit Logs': 'none',
                        'System Settings': 'none',
                        'API Keys': 'none',
                        'Content': 'read',
                        'Marketing': 'none',
                        'Risk Management': 'none',
                        'Compliance': 'none',
                        'Customer Data': 'none',
                    },
                };
            }
        }
    }

    export namespace Lendfast {
        export namespace LoanApproval {
            export function generateLoanOfficerRole(): Role {
                const roleName = `Loan Officer ${generateRandomInt(1, 100)}`;
                return {
                    id: generateId(),
                    name: roleName,
                    description: "Approves or denies loan applications.",
                    usersCount: generateRandomInt(5, 20),
                    isSystem: false,
                    permissions: {
                        'Users': 'read',
                        'Financials': 'read',
                        'Audit Logs': 'read',
                        'System Settings': 'none',
                        'API Keys': 'none',
                        'Content': 'none',
                        'Marketing': 'none',
                        'Risk Management': 'read',
                        'Compliance': 'read',
                        'Customer Data': 'read',
                    },
                };
            }
        }
    }

    export namespace Investwise {
        export namespace PortfolioManagement {
            export function generatePortfolioManagerRole(): Role {
                const roleName = `Portfolio Manager ${generateRandomInt(1, 100)}`;
                return {
                    id: generateId(),
                    name: roleName,
                    description: "Manages investment portfolios for clients.",
                    usersCount: generateRandomInt(3, 15),
                    isSystem: false,
                    permissions: {
                        'Users': 'read',
                        'Financials': 'write',
                        'Audit Logs': 'read',
                        'System Settings': 'none',
                        'API Keys': 'none',
                        'Content': 'none',
                        'Marketing': 'none',
                        'Risk Management': 'read',
                        'Compliance': 'read',
                        'Customer Data': 'read',
                    },
                };
            }
        }
    }

    export namespace Securepay {
        export namespace PaymentProcessing {
            export function generateSecurityAnalystRole(): Role {
                const roleName = `Security Analyst ${generateRandomInt(1, 100)}`;
                return {
                    id: generateId(),
                    name: roleName,
                    description: "Monitors payment systems for fraud and security breaches.",
                    usersCount: generateRandomInt(2, 10),
                    isSystem: false,
                    permissions: {
                        'Users': 'read',
                        'Financials': 'read',
                        'Audit Logs': 'full',
                        'System Settings': 'none',
                        'API Keys': 'none',
                        'Content': 'none',
                        'Marketing': 'none',
                        'Risk Management': 'read',
                        'Compliance': 'read',
                        'Customer Data': 'read',
                    },
                };
            }
        }
    }

    export namespace Smartbudget {
        export namespace BudgetPlanning {
            export function generateBudgetAnalystRole(): Role {
                const roleName = `Budget Analyst ${generateRandomInt(1, 100)}`;
                return {
                    id: generateId(),
                    name: roleName,
                    description: "Creates and manages budgets for various departments.",
                    usersCount: generateRandomInt(4, 12),
                    isSystem: false,
                    permissions: {
                        'Users': 'read',
                        'Financials': 'write',
                        'Audit Logs': 'read',
                        'System Settings': 'none',
                        'API Keys': 'none',
                        'Content': 'none',
                        'Marketing': 'none',
                        'Risk Management': 'read',
                        'Compliance': 'read',
                        'Customer Data': 'read',
                    },
                };
            }
        }
    }

    export namespace Globaltrade {
        export namespace TradeFinance {
            export function generateTradeFinanceSpecialistRole(): Role {
                const roleName = `Trade Finance Specialist ${generateRandomInt(1, 100)}`;
                return {
                    id: generateId(),
                    name: roleName,
                    description: "Facilitates international trade transactions.",
                    usersCount: generateRandomInt(3, 10),
                    isSystem: false,
                    permissions: {
                        'Users': 'read',
                        'Financials': 'write',
                        'Audit Logs': 'read',
                        'System Settings': 'none',
                        'API Keys': 'none',
                        'Content': 'none',
                        'Marketing': 'none',
                        'Risk Management': 'read',
                        'Compliance': 'read',
                        'Customer Data': 'read',
                    },
                };
            }
        }
    }

    export namespace Insuretech {
        export namespace ClaimsProcessing {
            export function generateClaimsAdjusterRole(): Role {
                const roleName = `Claims Adjuster ${generateRandomInt(1, 100)}`;
                return {
                    id: generateId(),
                    name: roleName,
                    description: "Processes insurance claims and determines payouts.",
                    usersCount: generateRandomInt(5, 15),
                    isSystem: false,
                    permissions: {
                        'Users': 'read',
                        'Financials': 'read',
                        'Audit Logs': 'read',
                        'System Settings': 'none',
                        'API Keys': 'none',
                        'Content': 'none',
                        'Marketing': 'none',
                        'Risk Management': 'read',
                        'Compliance': 'read',
                        'Customer Data': 'read',
                    },
                };
            }
        }
    }

    export namespace Healthfinance {
        export namespace MedicalBilling {
            export function generateBillingSpecialistRole(): Role {
                const roleName = `Billing Specialist ${generateRandomInt(1, 100)}`;
                return {
                    id: generateId(),
                    name: roleName,
                    description: "Handles medical billing and coding.",
                    usersCount: generateRandomInt(4, 12),
                    isSystem: false,
                    permissions: {
                        'Users': 'read',
                        'Financials': 'write',
                        'Audit Logs': 'read',
                        'System Settings': 'none',
                        'API Keys': 'none',
                        'Content': 'none',
                        'Marketing': 'none',
                        'Risk Management': 'read',
                        'Compliance': 'read',
                        'Customer Data': 'read',
                    },
                };
            }
        }
    }

    export namespace Edutechloan {
        export namespace StudentLoan {
            export function generateLoanCounselorRole(): Role {
                const roleName = `Loan Counselor ${generateRandomInt(1, 100)}`;
                return {
                    id: generateId(),
                    name: roleName,
                    description: "Provides guidance to students on loan options.",
                    usersCount: generateRandomInt(3, 10),
                    isSystem: false,
                    permissions: {
                        'Users': 'read',
                        'Financials': 'read',
                        'Audit Logs': 'read',
                        'System Settings': 'none',
                        'API Keys': 'none',
                        'Content': 'none',
                        'Marketing': 'none',
                        'Risk Management': 'read',
                        'Compliance': 'read',
                        'Customer Data': 'read',
                    },
                };
            }
        }
    }

    export namespace Greentechfund {
        export namespace GreenInvestment {
            export function generateInvestmentAnalystRole(): Role {
                const roleName = `Investment Analyst ${generateRandomInt(1, 100)}`;
                return {
                    id: generateId(),
                    name: roleName,
                    description: "Analyzes green investment opportunities.",
                    usersCount: generateRandomInt(2, 8),
                    isSystem: false,
                    permissions: {
                        'Users': 'read',
                        'Financials': 'write',
                        'Audit Logs': 'read',
                        'System Settings': 'none',
                        'API Keys': 'none',
                        'Content': 'none',
                        'Marketing': 'none',
                        'Risk Management': 'read',
                        'Compliance': 'read',
                        'Customer Data': 'read',
                    },
                };
            }
        }
    }
}

// --- Mock Data ---

const INITIAL_ROLES: Role[] = [
  {
    id: 'role-1',
    name: 'Super Admin',
    description: 'Full access to all system resources and settings.',
    usersCount: 3,
    isSystem: true,
    permissions: RESOURCES.reduce((acc, res) => ({ ...acc, [res]: 'full' }), {}),
  },
  {
    id: 'role-2',
    name: 'Compliance Officer',
    description: 'Read-only access to sensitive data for audit purposes.',
    usersCount: 5,
    isSystem: false,
    permissions: {
      'Users': 'read',
      'Financials': 'read',
      'Audit Logs': 'full',
      'System Settings': 'read',
      'API Keys': 'none',
      'Content': 'read',
      'Marketing': 'none',
      'Risk Management': 'read',
      'Compliance': 'full',
      'Customer Data': 'read',
    },
  },
  {
    id: 'role-3',
    name: 'Content Manager',
    description: 'Access to manage marketing content and campaigns.',
    usersCount: 12,
    isSystem: false,
    permissions: {
      'Users': 'none',
      'Financials': 'none',
      'Audit Logs': 'none',
      'System Settings': 'none',
      'API Keys': 'none',
      'Content': 'full',
      'Marketing': 'full',
      'Risk Management': 'none',
      'Compliance': 'none',
      'Customer Data': 'none',
    },
  },
];

// --- Components ---

export default function RoleManagementView() {
  const [roleManagement, setRoleManagement] = useState<Citibankdemobusinessinc.OpenBanking.RoleManagement>(
    new Citibankdemobusinessinc.OpenBanking.RoleManagement(INITIAL_ROLES)
  );
  const [selectedRole, setSelectedRole] = useState<Role | null>(roleManagement.selectedRole);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Modal State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<Role | null>(null);

  useEffect(() => {
    setSelectedRole(roleManagement.selectedRole);
  }, [roleManagement]);

  const handleUpdatePermission = (resource: string, level: PermissionLevel) => {
    if (!selectedRole) return;
    if (selectedRole.isSystem && selectedRole.name === 'Super Admin') return; // Protect super admin

    const updatedRole = {
      ...selectedRole,
      permissions: {
        ...selectedRole.permissions,
        [resource]: level,
      },
    };

    const newRoleManagement = new Citibankdemobusinessinc.OpenBanking.RoleManagement(roleManagement.roles);
    newRoleManagement.updateRole(updatedRole);
    setRoleManagement(newRoleManagement);
  };

  const simulateAiGeneration = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);

    // Simulate network delay
    setTimeout(() => {
      const promptLower = aiPrompt.toLowerCase();
      let newPermissions: Record<string, PermissionLevel> = {};
      let roleName = 'Custom Role';
      let roleDesc = 'Generated by AI based on prompt.';

      // Basic "AI" logic for demonstration
      RESOURCES.forEach(res => newPermissions[res] = 'none');

      if (promptLower.includes('marketing') || promptLower.includes('social')) {
        roleName = 'Marketing Specialist';
        roleDesc = 'Focuses on content creation and campaign management.';
        newPermissions['Content'] = 'write';
        newPermissions['Marketing'] = 'full';
        newPermissions['Users'] = 'read';
      } else if (promptLower.includes('finance') || promptLower.includes('accountant')) {
        roleName = 'Junior Accountant';
        roleDesc = 'Access to financial records for reconciliation.';
        newPermissions['Financials'] = 'read';
        newPermissions['Audit Logs'] = 'read';
      } else if (promptLower.includes('developer') || promptLower.includes('engineer')) {
        roleName = 'DevOps Engineer';
        roleDesc = 'Manages system configurations and API integrations.';
        newPermissions['System Settings'] = 'write';
        newPermissions['API Keys'] = 'full';
        newPermissions['Audit Logs'] = 'read';
      } else {
        roleName = 'General Staff';
        newPermissions['Content'] = 'read';
      }

      // "Junior" modifier restricts to read-only mostly
      if (promptLower.includes('junior') || promptLower.includes('intern')) {
         Object.keys(newPermissions).forEach(key => {
             if (newPermissions[key] === 'full' || newPermissions[key] === 'write') {
                 newPermissions[key] = 'read';
             }
         });
         roleName = `Junior ${roleName}`;
      }

      const newRole: Role = {
        id: generateId(),
        name: roleName,
        description: roleDesc,
        usersCount: 0,
        isSystem: false,
        permissions: newPermissions,
      };

      setAiSuggestion(newRole);
      setIsGenerating(false);
    }, 1500);
  };

  const acceptAiSuggestion = () => {
    if (aiSuggestion) {
      const newRoleManagement = new Citibankdemobusinessinc.OpenBanking.RoleManagement(roleManagement.roles);
      newRoleManagement.addRole(aiSuggestion);
      setRoleManagement(newRoleManagement);
      setAiSuggestion(null);
      setAiPrompt('');
      setIsAiModalOpen(false);
    }
  };

  const filteredRoles = roleManagement.searchRoles(searchQuery);

  const handleDeleteRole = (roleId: string) => {
    const newRoleManagement = new Citibankdemobusinessinc.OpenBanking.RoleManagement(roleManagement.roles);
    newRoleManagement.deleteRole(roleId);
    setRoleManagement(newRoleManagement);
  };

  const handleSelectRole = (roleId: string) => {
    const newRoleManagement = new Citibankdemobusinessinc.OpenBanking.RoleManagement(roleManagement.roles);
    newRoleManagement.selectRole(roleId);
    setRoleManagement(newRoleManagement);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100 p-6 overflow-hidden">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-500" />
            Role Management
          </h1>
          <p className="text-gray-400 mt-1">The Table of Ranks: Visualizing authority and access control.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-300 text-sm">Total Roles:</span>
            <span className="text-white font-bold">{roleManagement.roles.length}</span>
          </div>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Brain className="w-4 h-4" />
            AI Create Role
          </button>
        </div>
      </header>

      {/* Main Content Area - Split View */}
      <div className="flex flex-1 gap-6 min-h-0">
        
        {/* Left Panel: Role List */}
        <div className="w-1/3 flex flex-col bg-gray-900/50 border border-gray-800 rounded-xl backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search roles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-gray-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-emerald-500/50 placeholder-gray-600"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredRoles.map(role => (
              <motion.button
                key={role.id}
                onClick={() => handleSelectRole(role.id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group ${
                  selectedRole?.id === role.id 
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'bg-transparent border-transparent hover:bg-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-semibold ${selectedRole?.id === role.id ? 'text-emerald-400' : 'text-gray-200'}`}>
                    {role.name}
                  </span>
                  {role.isSystem && <Lock className="w-3 h-3 text-gray-500 mt-1" />}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{role.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Users className="w-3 h-3" />
                  {role.usersCount} users assigned
                </div>
              </motion.button>
            ))}
            
            {filteredRoles.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No roles found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Permission Matrix */}
        <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Role Header */}
          <div className="p-6 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedRole?.name}</h2>
                <p className="text-gray-400 text-sm max-w-xl">{selectedRole?.description}</p>
              </div>
              {selectedRole && !selectedRole.isSystem && (
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                    onClick={() => {
                        if (selectedRole) {
                            handleDeleteRole(selectedRole.id);
                        }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Resource Access Controls</h3>
            
            <div className="space-y-1">
              {/* Header Row */}
              <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-800 mb-2">
                <div className="col-span-1">RESOURCE</div>
                <div className="text-center">NONE</div>
                <div className="text-center">READ</div>
                <div className="text-center">WRITE</div>
                <div className="text-center">FULL CONTROL</div>
              </div>

              {/* Resource Rows */}
              {RESOURCES.map((resource) => (
                <div key={resource} className="grid grid-cols-5 gap-4 px-4 py-3 rounded-lg hover:bg-gray-800/50 transition-colors items-center group">
                  <div className="col-span-1 font-medium text-gray-300 flex items-center gap-2">
                    {resource}
                    {selectedRole?.permissions[resource] === 'full' && (
                       <AlertCircle className="w-3 h-3 text-red-500 opacity-50" />
                    )}
                  </div>
                  
                  {PERMISSION_LEVELS.map((level) => {
                    const isSelected = selectedRole?.permissions[resource] === level;
                    const isSystemRole = selectedRole?.isSystem && selectedRole?.name === 'Super Admin';
                    
                    let activeColor = 'bg-gray-700';
                    let activeText = 'text-gray-400';
                    
                    if (isSelected) {
                        if (level === 'none') { activeColor = 'bg-gray-700 text-gray-300'; }
                        if (level === 'read') { activeColor = 'bg-blue-900/30 text-blue-400 border border-blue-800'; }
                        if (level === 'write') { activeColor = 'bg-amber-900/30 text-amber-400 border border-amber-800'; }
                        if (level === 'full') { activeColor = 'bg-red-900/30 text-red-400 border border-red-800'; }
                    }

                    return (
                      <div key={level} className="flex justify-center">
                        <button
                          disabled={isSystemRole}
                          onClick={() => handleUpdatePermission(resource, level)}
                          className={`
                            relative w-full h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200
                            ${isSelected ? activeColor : 'text-gray-600 hover:bg-gray-800'}
                            ${isSystemRole ? 'cursor-not-allowed opacity-50' : ''}
                          `}
                        >
                          {isSelected && (
                            <motion.span 
                                layoutId={`check-${resource}`}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                {level === 'none' ? <Lock className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            </motion.span>
                          )}
                          {!isSelected && <span className="w-2 h-2 rounded-full bg-gray-800 group-hover:bg-gray-700" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Role Creation Modal */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-900/40 to-gray-900 p-6 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Brain className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Role Architect</h3>
                    <p className="text-emerald-400/80 text-xs font-mono">POWERED BY GEMINI</p>
                  </div>
                </div>
                <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {!aiSuggestion ? (
                  <div className="space-y-4">
                    <p className="text-gray-300">Describe the job function or persona for this new role. The AI will adhere to the principle of <span className="text-emerald-400 font-semibold">Least Privilege</span>.</p>
                    <div className="relative">
                      <Terminal className="absolute top-3 left-3 w-5 h-5 text-gray-500" />
                      <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder='e.g., "A junior marketing analyst who needs to post content but shouldn&apos;t be able to delete anything or access financial data."'
                        className="w-full h-32 bg-gray-950 border border-gray-800 rounded-xl p-4 pl-10 text-gray-200 focus:outline-none focus:border-emerald-500 resize-none font-mono text-sm"
                      />
                    </div>
                    
                    <div className="flex justify-end pt-2">
                       <button 
                         onClick={simulateAiGeneration}
                         disabled={!aiPrompt.trim() || isGenerating}
                         className={`
                           flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                           ${!aiPrompt.trim() || isGenerating ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'}
                         `}
                       >
                         {isGenerating ? (
                           <>
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             Architecting...
                           </>
                         ) : (
                           <>
                             <Brain className="w-4 h-4" />
                             Generate Role
                           </>
                         )}
                       </button>
                    </div>
                  </div>
                ) : (
                  // Suggestion View
                  <div className="space-y-6">
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-white flex items-center gap-2">
                             {aiSuggestion.name}
                             <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">AI Generated</span>
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">{aiSuggestion.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
                          {Object.entries(aiSuggestion.permissions).map(([res, level]) => (
                            <div key={res} className="flex justify-between items-center text-sm border-b border-gray-800/50 py-1 last:border-0">
                                <span className="text-gray-400">{res}</span>
                                <span className={`
                                    font-mono uppercase text-xs font-bold
                                    ${level === 'none' ? 'text-gray-600' : ''