import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Card from '../../../Card';
import { format, subDays, subHours, isAfter, parseISO } from 'date-fns';

// --- Type Definitions ---

export type UserStatus = 'Active' | 'Suspended' | 'Pending' | 'Locked';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    status: UserStatus;
    lastLogin: string | null; // ISO string
    mfaEnabled: boolean;
    department: string;
    joinedDate: string; // ISO string
    phoneNumber: string;
    location: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[]; // IDs of permissions
    color: string; // Hex or Tailwind class for badge
    isSystem: boolean; // Cannot be deleted if true
}

export interface Permission {
    id: string;
    code: string;
    name: string;
    category: 'User Management' | 'Compliance' | 'Financials' | 'System' | 'Audit';
    description: string;
}

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    timestamp: string;
    details: string;
    ipAddress: string;
}

// --- Mock Data Generation ---

const PERMISSIONS: Permission[] = [
    { id: 'P01', code: 'USER_READ', name: 'View Users', category: 'User Management', description: 'Can view user list and details' },
    { id: 'P02', code: 'USER_WRITE', name: 'Edit Users', category: 'User Management', description: 'Can create and edit users' },
    { id: 'P03', code: 'USER_DELETE', name: 'Delete Users', category: 'User Management', description: 'Can delete users' },
    { id: 'P04', code: 'COMPLIANCE_READ', name: 'View Compliance', category: 'Compliance', description: 'Can view compliance reports' },
    { id: 'P05', code: 'COMPLIANCE_WRITE', name: 'Edit Compliance', category: 'Compliance', description: 'Can edit compliance policies' },
    { id: 'P06', code: 'FINANCE_VIEW', name: 'View Financials', category: 'Financials', description: 'Can view financial dashboards' },
    { id: 'P07', code: 'SYSTEM_SETTINGS', name: 'Manage Settings', category: 'System', description: 'Can modify system configuration' },
];

const ROLES: Role[] = [
    { id: 'R01', name: 'Super Admin', description: 'Full system access', permissions: PERMISSIONS.map(p => p.id), color: 'bg-red-600', isSystem: true },
    { id: 'R02', name: 'Compliance Officer', description: 'Access to compliance and reporting modules', permissions: ['P01', 'P04', 'P05'], color: 'bg-indigo-600', isSystem: false },
    { id: 'R03', name: 'Risk Analyst', description: 'Read-only access to risk data', permissions: ['P01', 'P04'], color: 'bg-yellow-600', isSystem: false },
    { id: 'R04', name: 'User Manager', description: 'Can manage user accounts', permissions: ['P01', 'P02', 'P03'], color: 'bg-green-600', isSystem: false },
    { id: 'R05', name: 'Auditor', description: 'Read-only access to all records', permissions: ['P01', 'P04', 'P06'], color: 'bg-gray-600', isSystem: false },
];

const DEPARTMENTS = ['Compliance', 'IT Security', 'Risk Management', 'Operations', 'Executive'];
const LOCATIONS = ['New York', 'London', 'Singapore', 'Remote', 'Berlin'];

const generateMockUsers = (count: number): User[] => {
    return Array.from({ length: count }, (_, i) => {
        const role = ROLES[Math.floor(Math.random() * ROLES.length)];
        const statusOptions: UserStatus[] = ['Active', 'Active', 'Active', 'Suspended', 'Pending', 'Locked'];
        const firstName = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Jennifer'][i % 8];
        const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][i % 8];
        
        return {
            id: `USR-${1000 + i}`,
            firstName,
            lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
            roleId: role.id,
            status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
            lastLogin: Math.random() > 0.2 ? subHours(new Date(), Math.floor(Math.random() * 100)).toISOString() : null,
            mfaEnabled: Math.random() > 0.3,
            department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
            joinedDate: subDays(new Date(), Math.floor(Math.random() * 365 * 2)).toISOString(),
            phoneNumber: `+1 (555) 01${Math.floor(10 + Math.random() * 90)}`,
            location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        };
    });
};

// --- Helper Components ---

const Badge: React.FC<{ children: React.ReactNode; colorClass?: string }> = ({ children, colorClass = 'bg-gray-600' }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${colorClass}`}>
        {children}
    </span>
);

const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
    const colors = {
        'Active': 'bg-green-500/20 text-green-400 border border-green-500/30',
        'Suspended': 'bg-red-500/20 text-red-400 border border-red-500/30',
        'Pending': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        'Locked': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status]}`}>
            {status}
        </span>
    );
};

const NotificationToast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded shadow-lg text-white z-50 flex items-center ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            <span>{message}</span>
            <button onClick={onClose} className="ml-3 font-bold">&times;</button>
        </div>
    );
};

// --- Main Component ---

const UserManagement: React.FC = () => {
    // State
    const [users, setUsers] = useState<User[]>(() => generateMockUsers(45));
    const [roles, setRoles] = useState<Role[]>(ROLES);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Modal States
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isRoleModalOpen, setRoleModalOpen] = useState(false);
    const [viewingRole, setViewingRole] = useState<Role | null>(null);
    
    // Notification State
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
    };

    // Derived Data
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = 
                user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'All' || user.roleId === roleFilter;
            const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(start, start + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    // Handlers
    const handleSaveUser = (userData: Partial<User>) => {
        if (editingUser) {
            // Update
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userData } as User : u));
            showNotification('User updated successfully', 'success');
        } else {
            // Create
            const newUser: User = {
                id: `USR-${Date.now()}`,
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                roleId: userData.roleId || ROLES[2].id,
                status: 'Pending',
                lastLogin: null,
                mfaEnabled: false,
                department: userData.department || 'Operations',
                joinedDate: new Date().toISOString(),
                phoneNumber: userData.phoneNumber || '',
                location: userData.location || 'Remote',
                ...userData
            } as User;
            setUsers(prev => [newUser, ...prev]);
            showNotification('User created successfully', 'success');
        }
        setUserModalOpen(false);
        setEditingUser(null);
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            showNotification('User deleted successfully', 'success');
        }
    };

    const handleToggleStatus = (userId: string, currentStatus: UserStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        showNotification(`User status changed to ${newStatus}`, 'success');
    };

    const handleResetPassword = (email: string) => {
        showNotification(`Password reset link sent to ${email}`, 'success');
    };

    // --- Sub-Components (Modals) ---

    const UserModal = () => {
        if (!isUserModalOpen) return null;
        
        const [formData, setFormData] = useState<Partial<User>>(editingUser || {
            firstName: '', lastName: '', email: '', roleId: ROLES[2].id, department: '', location: '', phoneNumber: ''
        });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setUserModalOpen(false)}>
                <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                        <button onClick={() => setUserModalOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                                <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
                                <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                                <select name="roleId" value={formData.roleId} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none">
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Department</label>
                                <select name="department" value={formData.department} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none">
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                                <select name="location" value={formData.location} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-cyan-500 focus:outline-none">
                                    <option value="">Select Location</option>
                                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
                        <button onClick={() => setUserModalOpen(false)} className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-700">Cancel</button>
                        <button onClick={() => handleSaveUser(formData)} className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700 font-medium">Save User</button>
                    </div>
                </div>
            </div>
        );
    };

    const RoleDetailsModal = () => {
        if (!isRoleModalOpen || !viewingRole) return null;
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setRoleModalOpen(false)}>
                <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${viewingRole.color}`}></span>
                            {viewingRole.name}
                        </h3>
                        <button onClick={() => setRoleModalOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-gray-300 text-sm">{viewingRole.description}</p>
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Permissions</h4>
                            <div className="flex flex-wrap gap-2">
                                {viewingRole.permissions.map(permId => {
                                    const perm = PERMISSIONS.find(p => p.id === permId);
                                    return perm ? (
                                        <span key={perm.id} className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-300" title={perm.description}>
                                            {perm.name}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-700">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Assigned Users</h4>
                            <p className="text-2xl font-bold text-white">{users.filter(u => u.roleId === viewingRole.id).length}</p>
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-700 flex justify-end">
                        <button onClick={() => setRoleModalOpen(false)} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">Close</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">User Management</h2>
                    <p className="text-gray-400 mt-1">Manage system access, roles, and security settings.</p>
                </div>
                <button 
                    onClick={() => { setEditingUser(null); setUserModalOpen(true); }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-cyan-900/20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Add User
                </button>
            </div>

            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Total Users">
                    <div className="flex items-end justify-between">
                        <div className="text-4xl font-bold text-white">{users.length}</div>
                        <div className="text-green-400 text-sm font-medium">+12% this month</div>
                    </div>
                </Card>
                <Card title="Active Sessions">
                    <div className="flex items-end justify-between">
                        <div className="text-4xl font-bold text-cyan-400">
                            {users.filter(u => u.lastLogin && isAfter(parseISO(u.lastLogin), subHours(new Date(), 24))).length}
                        </div>
                        <div className="text-gray-400 text-sm">Last 24 hours</div>
                    </div>
                </Card>
                <Card title="Pending Approvals">
                    <div className="flex items-end justify-between">
                        <div className="text-4xl font-bold text-yellow-400">
                            {users.filter(u => u.status === 'Pending').length}
                        </div>
                        <div className="text-gray-400 text-sm">Requires action</div>
                    </div>
                </Card>
                <Card title="Security Alerts">
                    <div className="flex items-end justify-between">
                        <div className="text-4xl font-bold text-red-400">
                            {users.filter(u => u.status === 'Locked' || !u.mfaEnabled).length}
                        </div>
                        <div className="text-gray-400 text-sm">Locked / No MFA</div>
                    </div>
                </Card>
            </div>

            {/* --- Main Content Area --- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Left Column: Filters & Roles */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Filters">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search</label>
                                <input 
                                    type="text" 
                                    placeholder="Name or email..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                                <select 
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                >
                                    <option value="All">All Roles</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Suspended">Suspended</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Locked">Locked</option>
                                </select>
                            </div>
                            <button 
                                onClick={() => { setSearchTerm(''); setRoleFilter('All'); setStatusFilter('All'); }}
                                className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 border border-cyan-900/50 rounded hover:bg-cyan-900/20 transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </Card>

                    <Card title="System Roles">
                        <div className="space-y-2">
                            {roles.map(role => (
                                <div 
                                    key={role.id} 
                                    onClick={() => { setViewingRole(role); setRoleModalOpen(true); }}
                                    className="flex items-center justify-between p-2 rounded hover:bg-gray-700/50 cursor-pointer group transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${role.color}`}></div>
                                        <span className="text-sm text-gray-300 group-hover:text-white">{role.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                                        {users.filter(u => u.roleId === role.id).length}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 py-2 text-xs font-medium text-gray-400 border border-dashed border-gray-600 rounded hover:text-white hover:border-gray-400 transition-colors">
                            + Create New Role
                        </button>
                    </Card>
                </div>

                {/* Right Column: User Table */}
                <div className="lg:col-span-3">
                    <Card title={`Users (${filteredUsers.length})`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-700 text-xs uppercase text-gray-500">
                                        <th className="py-3 px-4 font-semibold">User</th>
                                        <th className="py-3 px-4 font-semibold">Role</th>
                                        <th className="py-3 px-4 font-semibold">Status</th>
                                        <th className="py-3 px-4 font-semibold">Department</th>
                                        <th className="py-3 px-4 font-semibold">Last Login</th>
                                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-gray-800">
                                    {paginatedUsers.length > 0 ? (
                                        paginatedUsers.map(user => {
                                            const role = roles.find(r => r.id === user.roleId);
                                            return (
                                                <tr key={user.id} className="hover:bg-gray-700/30 transition-colors group">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                                                                {user.firstName[0]}{user.lastName[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-white">{user.firstName} {user.lastName}</div>
                                                                <div className="text-xs text-gray-500">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {role && <Badge colorClass={role.color.replace('bg-', 'bg-opacity-20 text-').replace('600', '400') + ' bg-' + role.color.split('-')[1] + '-900'}>{role.name}</Badge>}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <StatusBadge status={user.status} />
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-400">{user.department}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-xs">
                                                        {user.lastLogin ? format(parseISO(user.lastLogin), 'MMM d, HH:mm') : 'Never'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => { setEditingUser(user); setUserModalOpen(true); }}
                                                                className="p-1 text-gray-400 hover:text-cyan-400" 
                                                                title="Edit"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleResetPassword(user.email)}
                                                                className="p-1 text-gray-400 hover:text-yellow-400" 
                                                                title="Reset Password"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleToggleStatus(user.id, user.status)}
                                                                className={`p-1 ${user.status === 'Active' ? 'text-gray-400 hover:text-orange-400' : 'text-green-500 hover:text-green-400'}`}
                                                                title={user.status === 'Active' ? 'Suspend' : 'Activate'}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="p-1 text-gray-400 hover:text-red-500" 
                                                                title="Delete"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1