
/**
 * SOVEREIGN DATABASE ENGINE
 * A local, persistent simulation of a high-security ledger.
 * Stores audit logs, user sessions, and system events.
 */

export interface AuditLog {
    id: string;
    timestamp: string;
    eventType: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGOUT' | 'SECURITY_BREACH' | 'SYSTEM_INIT' | 'USER_REGISTERED';
    userId?: string;
    ipAddress: string;
    metadata: any;
}

export interface UserRecord {
    id: string;
    name: string; // Added name field
    email: string;
    passwordHash: string; // Simulated hash
    role: string;
    clearanceLevel: number;
    lastLogin: string | null;
}

const STORAGE_KEYS = {
    USERS: 'sov_db_users',
    LOGS: 'sov_db_audit_logs',
    SYSTEM_STATE: 'sov_db_system_state'
};

class SovereignDatabase {
    private logs: AuditLog[] = [];
    private users: UserRecord[] = [];

    constructor() {
        this.initialize();
    }

    private initialize() {
        // Load from local storage or seed
        const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);

        if (storedUsers) {
            this.users = JSON.parse(storedUsers);
        } else {
            this.seedUsers();
        }

        if (storedLogs) {
            this.logs = JSON.parse(storedLogs);
        } else {
            this.logEvent('SYSTEM_INIT', 'system', { message: 'Database initialized zero-state.' });
        }
    }

    private seedUsers() {
        const admin: UserRecord = {
            id: 'u_genesis',
            name: 'The Visionary',
            email: 'visionary@sovereign-ai-nexus.io',
            passwordHash: 'password', // In a real app, this would be bcrypt
            role: 'ARCHITECT',
            clearanceLevel: 5,
            lastLogin: null
        };
        this.users.push(admin);
        this.saveUsers();
    }

    private saveUsers() {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    }

    private saveLogs() {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs));
    }

    private generateId(): string {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getMockIP(): string {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    public logEvent(type: AuditLog['eventType'], userId: string = 'anonymous', metadata: any = {}) {
        const log: AuditLog = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            eventType: type,
            userId,
            ipAddress: this.getMockIP(),
            metadata
        };
        this.logs.unshift(log); // Add to beginning
        // Keep log size manageable in local storage
        if (this.logs.length > 1000) this.logs = this.logs.slice(0, 1000);
        this.saveLogs();
        console.log(`[DB AUDIT] ${type}:`, log);
    }

    public authenticateUser(email: string, password: string): UserRecord | null {
        const user = this.users.find(u => u.email === email);
        if (user && user.passwordHash === password) {
            this.logEvent('LOGIN_SUCCESS', user.id, { email });
            user.lastLogin = new Date().toISOString();
            this.saveUsers();
            return user;
        }
        this.logEvent('LOGIN_ATTEMPT', 'anonymous', { email, status: 'FAILED' });
        return null;
    }

    public registerUser(name: string, email: string, password: string): UserRecord {
        // Check if user already exists
        const existingUser = this.users.find(u => u.email === email);
        if (existingUser) {
            throw new Error("User already exists");
        }

        const newUser: UserRecord = {
            id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: name,
            email: email,
            passwordHash: password, // In production, hash this!
            role: 'CITIZEN', // Default role
            clearanceLevel: 1,
            lastLogin: null
        };

        this.users.push(newUser);
        this.saveUsers();
        this.logEvent('USER_REGISTERED', newUser.id, { email });
        
        return newUser;
    }

    public getRecentLogs(limit: number = 20): AuditLog[] {
        return this.logs.slice(0, limit);
    }

    public getUser(id: string): UserRecord | undefined {
        return this.users.find(u => u.id === id);
    }
}

export const db = new SovereignDatabase();
