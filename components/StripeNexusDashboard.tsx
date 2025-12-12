import React from 'react';

// --- Generative Data Functions ---

const generateRandomString = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const generateRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomFloat = (min: number, max: number, decimals: number = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
};

const generateDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - generateRandomNumber(0, daysAgo));
    return date.toISOString().split('T')[0];
};

const generateCurrency = () => {
    const currencies = ['usd', 'eur', 'gbp', 'jpy'];
    return currencies[generateRandomNumber(0, currencies.length - 1)];
};

const generateStatus = () => {
    const statuses = ['succeeded', 'failed', 'pending'];
    return statuses[generateRandomNumber(0, statuses.length - 1)];
};

const generateCustomerName = () => {
    const firstNames = ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 'William', 'Sophia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return `${firstNames[generateRandomNumber(0, firstNames.length - 1)]} ${lastNames[generateRandomNumber(0, lastNames.length - 1)]}`;
};

const generateRequirement = () => {
    const requirements = [
        'business_profile.url',
        'external_account',
        'tos_acceptance.date',
        'tos_acceptance.ip',
        'identity.verification.document',
        'legal_entity.address',
        'payouts.schedule',
    ];
    return requirements[generateRandomNumber(0, requirements.length - 1)];
};

// --- Internal Data Generation ---

const generateMetrics = () => ({
    grossVolume: { value: generateRandomNumber(50000, 100000), change: generateRandomFloat(-5, 20) },
    netVolume: { value: generateRandomNumber(45000, 90000), change: generateRandomFloat(-5, 20) },
    newCustomers: { value: generateRandomNumber(100, 500), change: generateRandomFloat(-10, 15) },
    activeSubscriptions: { value: generateRandomNumber(500, 1500), change: generateRandomFloat(-5, 5) },
});

const generateBalance = () => ({
    available: [{ amount: generateRandomNumber(1000000, 5000000), currency: generateCurrency() }],
    pending: [{ amount: generateRandomNumber(100000, 1000000), currency: generateCurrency() }],
});

const generateAccount = () => {
    const requirementsDue = Array.from({ length: generateRandomNumber(0, 5) }, () => generateRequirement());
    const requirementsPastDue = Array.from({ length: generateRandomNumber(0, 2) }, () => generateRequirement());
    const chargesEnabled = requirementsDue.length === 0 && requirementsPastDue.length === 0 && generateRandomNumber(0, 1) === 1;
    const payoutsEnabled = chargesEnabled && generateRandomNumber(0, 1) === 1;
    const detailsSubmitted = generateRandomNumber(0, 1) === 1;

    return {
        details_submitted: detailsSubmitted,
        payouts_enabled: payoutsEnabled,
        charges_enabled: chargesEnabled,
        requirements: {
            currently_due: requirementsDue,
            past_due: requirementsPastDue,
        },
    };
};

const generateRecentPayments = (count: number) => {
    const payments = [];
    for (let i = 0; i < count; i++) {
        const amount = generateRandomNumber(1000, 20000);
        const currency = generateCurrency();
        const status = generateStatus();
        payments.push({
            id: `ch_${generateRandomString(10)}`,
            amount: amount,
            currency: currency,
            customer: generateCustomerName(),
            status: status,
        });
    }
    return payments;
};

const generateChartData = (length: number) => {
    const data = [];
    let currentValue = generateRandomNumber(50, 150);
    for (let i = 0; i < length; i++) {
        const change = generateRandomFloat(-10, 10);
        currentValue += change;
        data.push(Math.max(0, Math.round(currentValue)));
    }
    return data;
};

// --- Mock Data based on Stripe Resources (now using generative functions) ---

const METRICS = generateMetrics();
const BALANCE = generateBalance();
const ACCOUNT = generateAccount();
const RECENT_PAYMENTS = generateRecentPayments(5);
const CHART_DATA = generateChartData(12);

// --- Helper Functions ---

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    } catch (error) {
        console.error("Error formatting currency:", error);
        return `${amount / 100} ${currency.toUpperCase()}`;
    }
};

// --- SVG Icon Components ---

const DollarSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

const CreditCardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
);

const ActivityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);

const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);


// --- UI Components ---

type CardProps = {
    children: React.ReactNode;
    className?: string;
};

const Card: React.FC<CardProps> = ({ children, className }) => (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        {children}
    </div>
);

type StatCardProps = {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon }) => (
    <Card>
        <div className="p-4">
            <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-md mr-4">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
                </div>
            </div>
             <div className="mt-2 text-sm">
                <span className={`${change >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                    {change >= 0 ? '+' : ''}{change}%
                </span>
                <span className="text-gray-500"> vs. last month</span>
            </div>
        </div>
    </Card>
);

const VolumeChart = () => {
    const maxVal = Math.max(...CHART_DATA);
    const points = CHART_DATA.map((val, i) => `${(i / (CHART_DATA.length - 1)) * 100},${100 - (val / maxVal) * 80}`).join(' ');

    return (
        <Card className="p-4">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Volume Over Time</h3>
             <div className="h-64">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline fill="rgba(99, 102, 241, 0.1)" stroke="rgb(99, 102, 241)" strokeWidth="0.5" points={`0,100 ${points} 100,100`} />
                    <line x1="0" y1="99.5" x2="100" y2="99.5" stroke="#e5e7eb" strokeWidth="0.5" />
                    {/* Y-axis labels would go here */}
                </svg>
            </div>
        </Card>
    );
};

const BalanceCard = () => (
    <Card>
        <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">Balance</h3>
            <div className="mt-4 space-y-4">
                <div>
                    <p className="text-sm text-gray-500">Available to pay out</p>
                    <p className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(BALANCE.available[0].amount, BALANCE.available[0].currency)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Expected to become available</p>
                    <p className="text-xl font-medium text-gray-700">
                         {formatCurrency(BALANCE.pending[0].amount, BALANCE.pending[0].currency)}
                    </p>
                </div>
            </div>
            <div className="mt-6">
                <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Create Payout
                </button>
            </div>
        </div>
    </Card>
);

const AccountStatusCard = () => (
    <Card>
        <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
            {ACCOUNT.requirements.currently_due.length > 0 ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Your account has outstanding verification requirements.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                     <div className="flex">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">
                                Your account is fully verified and active.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-600">Required actions:</h4>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700">
                    {ACCOUNT.requirements.currently_due.length > 0 ? (
                        ACCOUNT.requirements.currently_due.map(req => <li key={req}>{req.replace(/_/g, ' ').replace(/\./g, ' > ')}</li>)
                    ) : (
                        <li>None</li>
                    )}
                </ul>
            </div>
            <div className="mt-4">
                 <button className="w-full bg-white text-gray-700 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm font-medium">
                    Update Account Information
                </button>
            </div>
        </div>
    </Card>
);

const RecentPaymentsCard = () => (
    <Card className="col-span-1 lg:col-span-2">
        <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {RECENT_PAYMENTS.map((payment) => (
                        <tr key={payment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.customer}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(payment.amount, payment.currency)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'succeeded' ? 'bg-green-100 text-green-800' : payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                    {payment.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);


// --- Main Dashboard Component ---

const StripeNexusDashboard = () => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold leading-tight">Stripe Nexus Dashboard</h1>
                        <p className="mt-1 text-md text-gray-500">Welcome back, here's your business overview.</p>
                    </header>
                    
                    {/* Stat Cards Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard 
                            title="Gross Volume" 
                            value={formatCurrency(METRICS.grossVolume.value * 100, 'usd')} 
                            change={METRICS.grossVolume.change}
                            icon={<DollarSignIcon className="h-6 w-6 text-gray-500" />} 
                        />
                         <StatCard 
                            title="Net Volume" 
                            value={formatCurrency(METRICS.netVolume.value * 100, 'usd')}
                            change={METRICS.netVolume.change}
                            icon={<ActivityIcon className="h-6 w-6 text-gray-500" />} 
                        />
                        <StatCard 
                            title="New Customers" 
                            value={METRICS.newCustomers.value.toString()} 
                            change={METRICS.newCustomers.change}
                            icon={<UsersIcon className="h-6 w-6 text-gray-500" />} 
                        />
                         <StatCard 
                            title="Active Subscriptions" 
                            value={METRICS.activeSubscriptions.value.toString()} 
                            change={METRICS.activeSubscriptions.change}
                            icon={<CreditCardIcon className="h-6 w-6 text-gray-500" />} 
                        />
                    </div>

                    {/* Main Content Grid */}
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                       <div className="lg:col-span-2 space-y-8">
                           <VolumeChart />
                           <RecentPaymentsCard />
                       </div>
                       <div className="space-y-8">
                           <BalanceCard />
                           <AccountStatusCard />
                       </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StripeNexusDashboard;