export interface Account {
    id: string;
    name: string;
    institution: string;
    currency: string;
    balance: number;
    accountNumber: string;
    type: 'Checking' | 'Savings' | 'Investment' | 'Credit' | 'Loan' | 'Merchant';
    status: 'Active' | 'Inactive' | 'Frozen' | 'Pending';
    lastUpdated: string;
    ownerId: string;
}

export interface CreateAccountDTO {
    name: string;
    institution: string;
    currency: string;
    type: Account['type'];
    ownerId: string;
    initialBalance?: number;
}

// --- Mock Data ---

let mockAccounts: Account[] = [
    {
        id: 'acc_101',
        name: 'Primary Corporate Operating',
        institution: 'Chase Bank',
        currency: 'USD',
        balance: 1250450.00,
        accountNumber: '**** 4589',
        type: 'Checking',
        status: 'Active',
        lastUpdated: new Date().toISOString(),
        ownerId: 'user_1'
    },
    {
        id: 'acc_102',
        name: 'EU Settlement Fund',
        institution: 'Barclays',
        currency: 'EUR',
        balance: 450000.50,
        accountNumber: '**** 9921',
        type: 'Merchant',
        status: 'Active',
        lastUpdated: new Date(Date.now() - 86400000).toISOString(),
        ownerId: 'user_1'
    },
    {
        id: 'acc_103',
        name: 'High Yield Reserves',
        institution: 'Goldman Sachs',
        currency: 'USD',
        balance: 5000000.00,
        accountNumber: '**** 1122',
        type: 'Savings',
        status: 'Active',
        lastUpdated: new Date(Date.now() - 172800000).toISOString(),
        ownerId: 'user_1'
    },
    {
        id: 'acc_104',
        name: 'APAC Expansion Line',
        institution: 'HSBC',
        currency: 'SGD',
        balance: 0.00,
        accountNumber: '**** 7744',
        type: 'Credit',
        status: 'Frozen',
        lastUpdated: new Date(Date.now() - 604800000).toISOString(),
        ownerId: 'user_2'
    }
];

const SIMULATED_DELAY_MS = 600;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Service Implementation ---

export const AccountService = {
    /**
     * Fetch all accounts.
     */
    getAccounts: async (): Promise<Account[]> => {
        await delay(SIMULATED_DELAY_MS);
        return [...mockAccounts];
    },

    /**
     * Fetch a single account by ID.
     */
    getAccountById: async (id: string): Promise<Account | undefined> => {
        await delay(SIMULATED_DELAY_MS);
        return mockAccounts.find(acc => acc.id === id);
    },

    /**
     * Create a new account.
     */
    createAccount: async (data: CreateAccountDTO): Promise<Account> => {
        await delay(SIMULATED_DELAY_MS);
        
        const newAccount: Account = {
            id: `acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: data.name,
            institution: data.institution,
            currency: data.currency,
            balance: data.initialBalance || 0,
            accountNumber: `**** ${Math.floor(1000 + Math.random() * 9000)}`,
            type: data.type,
            status: 'Active',
            lastUpdated: new Date().toISOString(),
            ownerId: data.ownerId
        };

        mockAccounts = [newAccount, ...mockAccounts];
        return newAccount;
    },

    /**
     * Update an existing account.
     */
    updateAccount: async (id: string, updates: Partial<Omit<Account, 'id' | 'accountNumber'>>): Promise<Account> => {
        await delay(SIMULATED_DELAY_MS);
        
        const index = mockAccounts.findIndex(acc => acc.id === id);
        if (index === -1) {
            throw new Error(`Account with ID ${id} not found.`);
        }

        const updatedAccount = {
            ...mockAccounts[index],
            ...updates,
            lastUpdated: new Date().toISOString()
        };

        mockAccounts[index] = updatedAccount;
        return updatedAccount;
    },

    /**
     * Delete (or archive) an account.
     */
    deleteAccount: async (id: string): Promise<void> => {
        await delay(SIMULATED_DELAY_MS);
        
        const initialLength = mockAccounts.length;
        mockAccounts = mockAccounts.filter(acc => acc.id !== id);
        
        if (mockAccounts.length === initialLength) {
            throw new Error(`Account with ID ${id} not found.`);
        }
    },

    /**
     * Search accounts by name or institution.
     */
    searchAccounts: async (query: string): Promise<Account[]> => {
        await delay(SIMULATED_DELAY_MS);
        const lowerQuery = query.toLowerCase();
        return mockAccounts.filter(acc => 
            acc.name.toLowerCase().includes(lowerQuery) || 
            acc.institution.toLowerCase().includes(lowerQuery) ||
            acc.currency.toLowerCase().includes(lowerQuery)
        );
    }
};