import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Options } from 'k6/options';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Load Test Configuration: Simulating a Market Crash Event
// Scenario: A sudden spike in traffic as users panic-check their brokerage accounts and seek liquidity.
export const options: Options = {
    scenarios: {
        market_crash_panic: {
            executor: 'ramping-arrival-rate',
            startRate: 10,
            timeUnit: '1s',
            preAllocatedVUs: 50,
            maxVUs: 2000,
            stages: [
                { target: 20, duration: '30s' },   // Normal baseline
                { target: 200, duration: '1m' },   // News breaks: Rapid ramp up
                { target: 500, duration: '2m' },   // Peak panic: High concurrency on read endpoints
                { target: 100, duration: '1m' },   // Recovery phase
                { target: 0, duration: '30s' },    // Cooldown
            ],
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<1500'], // 95% of requests should be below 1.5s
        http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    },
};

// Configuration Constants
const ACCOUNTS_API_BASE = 'https://localhost/api/accounts/account-transactions/partner/v1';
const LOANS_API_BASE = 'https://127.0.0.1/openapi/v1/accounts/loans/balanceTransfers';
const CLIENT_ID = 'simulation-client-id-001';
const MOCK_AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_payload';

// Header Generator
const getCommonHeaders = () => ({
    'Authorization': MOCK_AUTH_TOKEN,
    'uuid': uuidv4(),
    'Accept': 'application/json',
    'client_id': CLIENT_ID,
});

// Helper to format dates YYYY-MM-DD
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export default function () {
    const headers = getCommonHeaders();

    group('Phase 1: Portfolio Assessment', () => {
        // 1. Retrieve all account details to assess exposure
        // Simulates users logging in to see their dashboard immediately
        const accountsRes = http.get(`${ACCOUNTS_API_BASE}/accounts/details`, { headers });
        
        const accountsSuccess = check(accountsRes, {
            'Accounts Details Status 200': (r) => r.status === 200,
            'Response is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
        });

        if (accountsSuccess) {
            const body = accountsRes.json() as any;
            
            // Extract Brokerage accounts (Primary target during market crash)
            const accountGroups = body.accountGroupDetails || [];
            let targetAccounts: string[] = [];

            accountGroups.forEach((group: any) => {
                if (group.brokerageAccountsDetails) {
                    group.brokerageAccountsDetails.forEach((acc: any) => targetAccounts.push(acc.accountId));
                }
            });

            // If no brokerage, fallback to checking/savings for liquidity check
            if (targetAccounts.length === 0) {
                accountGroups.forEach((group: any) => {
                    if (group.checkingAccountsDetails) {
                        group.checkingAccountsDetails.forEach((acc: any) => targetAccounts.push(acc.accountId));
                    }
                });
            }

            // 2. Deep Dive: Check Transactions for specific accounts
            // Simulates users verifying if sell orders executed or checking recent losses
            if (targetAccounts.length > 0) {
                const accountId = targetAccounts[0]; // Pick primary account
                const now = new Date();
                const past = new Date();
                past.setDate(now.getDate() - 30); // Last 30 days

                const queryParams = `?transactionFromDate=${formatDate(past)}&transactionToDate=${formatDate(now)}`;
                
                const txnRes = http.get(
                    `${ACCOUNTS_API_BASE}/accounts/${accountId}/transactions${queryParams}`,
                    { headers }
                );

                check(txnRes, {
                    'Transactions Status 200': (r) => r.status === 200,
                    'Transaction Integrity': (r) => r.json() !== undefined,
                });
            }
        }
    });

    sleep(1); // User thinking time

    group('Phase 2: Liquidity Seeking (Advice Logic Trigger)', () => {
        // 3. Check Balance Transfer Eligibility
        // Simulates users needing cash flow or consolidation advice during market downturns
        
        // Add specific client details for fraud/risk engine checks implied in advice logic
        const btHeaders = {
            ...headers,
            'clientDetails': 'devicePrint=simulation_device;userIpAddress=192.168.1.1;geolocation=US',
        };

        const btRes = http.get(`${LOANS_API_BASE}/`, { headers: btHeaders });

        check(btRes, {
            'BT Eligibility Handled': (r) => [200, 204, 422].includes(r.status),
        });

        // 422 implies Business Validation Failed (e.g., Credit Score drop), which is a valid business scenario in a crash
        if (btRes.status === 200) {
             const btBody = btRes.json() as any;
             check(btBody, {
                 'Offers Available': (b: any) => b.balanceTransferEligibilityDetails && b.balanceTransferEligibilityDetails.length > 0
             });
        }
    });

    sleep(Math.random() * 2 + 1); // Random sleep 1-3s
}