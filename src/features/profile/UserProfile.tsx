import React, { useState, useCallback, useEffect } from 'react';

// --- Type Definitions ---
interface User {
    id: string;
    name: string;
    email: string;
    role: 'Compliance Officer' | 'Legal Counsel' | 'Admin' | 'Product Manager';
    department: 'Compliance' | 'Legal' | 'Engineering' | 'Product';
    avatarUrl: string; // URL to user's avatar image
    joinDate: string; // ISO string
    notificationSettings: NotificationSettings;
    apiKey: string;
    lastLogin: string; // ISO string
}

interface NotificationSettings {
    emailOnNewUpdate: boolean;
    emailOnTaskAssignment: boolean;
    inAppOnMention: boolean;
}

interface UserActivity {
    id: string;
    timestamp: string; // ISO string
    action: string;
    details: string;
}

// --- Mock Data ---
const mockCurrentUser: User = {
    id: 'USR-001',
    name: 'Alex Johnson',
    email: 'alex.johnson@fintechcorp.io',
    role: 'Compliance Officer',
    department: 'Compliance',
    avatarUrl: `https://i.pravatar.cc/150?u=alexjohnson`,
    joinDate: new Date('2022-08-15T09:00:00Z').toISOString(),
    notificationSettings: {
        emailOnNewUpdate: true,
        emailOnTaskAssignment: true,
        inAppOnMention: false,
    },
    apiKey: 'fk_live_************************a1b2',
    lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
};

const mockUserActivity: UserActivity[] = [
    { id: 'ACT-1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), action: 'Reviewed', details: 'Regulatory Update REG-_1031...' },
    { id: 'ACT-2', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), action: 'Uploaded Document', details: 'Certificate for "Money Transmitter License California"' },
    { id: 'ACT-3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), action: 'Commented', details: 'On Risk Assessment RA-_1005...' },
    { id: 'ACT-4', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), action: 'Created', details: 'New Policy "Data Privacy v2.0"' },
];

// --- Helper Components ---

// A generic Card component, similar to the one used in other parts of the app.
const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg p-6 ${className}`}>
        {title && <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-3">{title}</h3>}
        <div className="text-gray-300">{children}</div>
    </div>
);

const NotificationToast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 right-4 ${bgColor} text-white p-3 rounded shadow-lg flex items-center justify-between z-[100]`}>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold text-lg">&times;</button>
        </div>
    );
};

const ToggleSwitch: React.FC<{
    label: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-gray-300">{label}</span>
        <button
            type="button"
            className={`${
                enabled ? 'bg-cyan-600' : 'bg-gray-600'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
            onClick={() => onChange(!enabled)}
        >
            <span
                className={`${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    </div>
);

const ProfileField: React.FC<{ label: string; value: string | React.ReactNode; isEditing?: boolean; name?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }> = ({ label, value, isEditing, name, onChange, type = 'text' }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        {isEditing ? (
            <input
                type={type}
                name={name}
                value={value as string}
                onChange={onChange}
                className="mt-1 w-full bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:border-cyan-500 focus:ring-cyan-500"
            />
        ) : (
            <p className="mt-1 text-white">{value}</p>
        )}
    </div>
);

// --- Main UserProfile Component ---
const UserProfile: React.FC = () => {
    const [user, setUser] = useState<User>(mockCurrentUser);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<User>(mockCurrentUser);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setNotification({ message, type });
    }, []);

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel was clicked
            setFormData(user); // Reset form data
        }
        setIsEditing(!isEditing);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            notificationSettings: {
                ...prev.notificationSettings,
                [key]: value,
            },
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUser(formData);
        setIsEditing(false);
        setIsLoading(false);
        showNotification('Profile updated successfully!', 'success');
    };

    const handleRegenerateApiKey = async () => {
        if (window.confirm('Are you sure you want to regenerate your API key? Your old key will be invalidated immediately.')) {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            const newKey = `fk_live_${[...Array(24)].map(() => Math.random().toString(36)[2]).join('')}${Math.random().toString(36).substring(2, 6)}`;
            setFormData(prev => ({ ...prev, apiKey: newKey }));
            setUser(prev => ({ ...prev, apiKey: newKey }));
            setIsLoading(false);
            showNotification('API Key regenerated successfully!', 'success');
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-3xl font-bold text-white tracking-wider">User Profile</h2>
                    <div className="flex gap-3">
                        {isEditing && (
                            <button
                                onClick={handleEditToggle}
                                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={isEditing ? handleSave : handleEditToggle}
                            disabled={isLoading}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (isEditing ? 'Save Changes' : 'Edit Profile')}
                        </button>
                    </div>
                </div>

                {/* --- Profile Header --- */}
                <Card>
                    <div className="flex items-center space-x-6">
                        <img
                            src={user.avatarUrl}
                            alt="User Avatar"
                            className="h-24 w-24 rounded-full object-cover border-4 border-gray-700"
                        />
                        <div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="text-3xl font-bold text-white bg-gray-700/50 p-2 rounded border border-gray-600 focus:border-cyan-500 focus:ring-cyan-500"
                                />
                            ) : (
                                <h3 className="text-3xl font-bold text-white">{user.name}</h3>
                            )}
                            <p className="text-cyan-400 mt-1">{user.role}</p>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* --- Left Column: Details & Security --- */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Personal Information">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ProfileField label="Email Address" value={user.email} />
                                <ProfileField
                                    label="Department"
                                    value={formData.department}
                                    isEditing={isEditing}
                                    name="department"
                                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value as User['department'] }))}
                                />
                                <ProfileField label="Joined On" value={new Date(user.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                                <ProfileField label="Last Login" value={new Date(user.lastLogin).toLocaleString()} />
                            </div>
                        </Card>

                        <Card title="Security">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">API Key</label>
                                    <div className="mt-1 flex items-center space-x-4">
                                        <input
                                            type="text"
                                            readOnly
                                            value={user.apiKey}
                                            className="w-full bg-gray-900/50 p-2 rounded text-gray-400 font-mono text-sm"
                                        />
                                        <button
                                            onClick={handleRegenerateApiKey}
                                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium whitespace-nowrap"
                                        >
                                            Regenerate
                                        </button>
                                    </div>
                                </div>
                                <button className="text-sm text-cyan-500 hover:text-cyan-400">Change Password</button>
                            </div>
                        </Card>
                    </div>

                    {/* --- Right Column: Notifications & Activity --- */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card title="Notification Settings">
                            <div className="space-y-4">
                                <ToggleSwitch
                                    label="New Regulatory Updates"
                                    enabled={formData.notificationSettings.emailOnNewUpdate}
                                    onChange={(val) => handleNotificationChange('emailOnNewUpdate', val)}
                                />
                                <ToggleSwitch
                                    label="Task Assignments"
                                    enabled={formData.notificationSettings.emailOnTaskAssignment}
                                    onChange={(val) => handleNotificationChange('emailOnTaskAssignment', val)}
                                />
                                <ToggleSwitch
                                    label="In-App Mentions"
                                    enabled={formData.notificationSettings.inAppOnMention}
                                    onChange={(val) => handleNotificationChange('inAppOnMention', val)}
                                />
                            </div>
                        </Card>

                        <Card title="Recent Activity">
                            <ul className="space-y-3">
                                {mockUserActivity.map(activity => (
                                    <li key={activity.id} className="flex items-start space-x-3">
                                        <div className="bg-gray-700 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                                            <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-white">
                                                <span className="font-semibold">{activity.action}</span>: {activity.details}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </div>
            </div>

            {/* --- Notification Toast --- */}
            {notification && (
                <NotificationToast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </>
    );
};

export default UserProfile;