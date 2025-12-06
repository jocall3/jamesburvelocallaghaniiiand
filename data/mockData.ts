

import type { Transaction, Asset, BudgetCategory, Subscription, CreditScore, UpcomingBill, SavingsGoal, MarketMover, FinancialGoal, CryptoAsset, PaymentOperation, CorporateCard, CorporateTransaction, RewardPoints, Notification, RewardItem, APIStatus, CreditFactor, PaymentOrder, Invoice, ComplianceCase, FinancialAnomaly, User, Post, Comment, LendingPoolStats, AppIntegration, Counterparty, ExternalAccount, BiometricData, LoginAttempt, AIAgent, SynapticVault, MarqetaUser, MarqetaCardProduct, MarqetaCard, ComplianceRule, Business } from '../types';
import { View } from '../types';
import React from 'react';

// Define a type for the navigation items
export interface NavItem {
  title: string;
  path: string;
  icon?: any; // Placeholder for potential icon component
}

// Function to generate a URL-friendly path from a title
const toPath = (title: string): string => {
  return '/' + title
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[()&]/g, '')    // Remove parentheses and ampersands
    .replace(/-+/g, '-');     // Replace multiple hyphens with a single one
};

// Ungrouped, primary navigation items
export const primaryNavItems: NavItem[] = [
  { title: 'Dashboard', path: toPath('Dashboard') },
  { title: 'Transactions', path: toPath('Transactions') },
  { title: 'Send Money', path: toPath('Send Money') },
  { title: 'Budgets', path: toPath('Budgets') },
  { title: 'Financial Goals', path: toPath('Financial Goals') },
  { title: 'Credit Health', path: toPath('Credit Health') },
];

// Grouped navigation items for more complex sections
export const groupedNavItems: { group: string; items: NavItem[] }[] = [
  {
    group: 'Markets & Investments',
    items: [
      { title: 'Investments', path: toPath('Investments') },
      { title: 'Crypto & Web3', path: toPath('Crypto & Web3') },
      { title: 'Algo-Trading Lab', path: toPath('Algo-Trading Lab') },
      { title: 'Forex Arena', path: toPath('Forex Arena') },
      { title: 'Commodities Exchange', path: toPath('Commodities Exchange') },
      { title: 'Real Estate Empire', path: toPath('Real Estate Empire') },
      { title: 'Art & Collectibles', path: toPath('Art & Collectibles') },
      { title: 'Derivatives Desk', path: toPath('Derivatives Desk') },
      { title: 'Venture Capital Desk', path: toPath('Venture Capital Desk') },
      { title: 'Private Equity Lounge', path: toPath('Private Equity Lounge') },
    ],
  },
  {
    group: 'Wealth & Corporate',
    items: [
      { title: 'Tax Optimization', path: toPath('Tax Optimization') },
      { title: 'Legacy Builder', path: toPath('Legacy Builder') },
      { title: 'Corporate Command', path: toPath('Corporate Command') },
      { title: 'Modern Treasury', path: toPath('Modern Treasury') },
    ],
  },
  {
    group: 'Platform & Integrations',
    items: [
      { title: 'Card Programs (Marqeta)', path: toPath('Card Programs (Marqeta)') },
      { title: 'Data Network (Plaid)', path: toPath('Data Network (Plaid)') },
      { title: 'Payments (Stripe)', path: toPath('Payments (Stripe)') },
      { title: 'Single Sign-On (SSO)', path: toPath('Single Sign-On (SSO)') },
      { title: 'Open Banking', path: toPath('Open Banking') },
      { title: 'API Status', path: toPath('API Status') },
    ],
  },
  {
    group: 'Artificial Intelligence',
    items: [
      { title: 'AI Financial Advisor', path: toPath('AI Financial Advisor') },
      { title: 'Quantum Weaver AI', path: toPath('Quantum Weaver AI') },
      { title: 'Agent Marketplace', path: toPath('Agent Marketplace') },
      { title: 'AI Ad Studio', path: toPath('AI Ad Studio') },
    ],
  },
  {
    group: 'Services & Features',
    items: [
      { title: 'Card Customization', path: toPath('Card Customization') },
      { title: 'Financial Democracy', path: toPath('Financial Democracy') },
      { title: 'Concierge Service', path: toPath('Concierge Service') },
      { title: 'Philanthropy Hub', path: toPath('Philanthropy Hub') },
      { title: 'Sovereign Wealth Sim', path: toPath('Sovereign Wealth Sim') },
    ],
  },
  {
    group: 'System & Vision',
    items: [
      { title: 'Security Center', path: toPath('Security Center') },
      { title: 'Personalization', path: toPath('Personalization') },
      { title: 'The Vision', path: toPath('The Vision') },
    ],
  },
];

// Mock user profile data to make the profile section interactive
export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  accountProvider: 'Google' | 'Email';
  profilePath: string;
}

export const userProfileData: UserProfile = {
  name: "James B. O'Callaghan III",
  email: "jbo3@idgaf.ai",
  // Using a placeholder avatar service that generates initials
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=James%20O'Callaghan",
  accountProvider: 'Google',
  profilePath: '/profile/settings', // A clickable path to user settings
}
// Logos for App Integrations
const SalesforceLogo: React.FC<{className?: string}> = ({className}) => React.createElement('svg', {className, viewBox:"0 0 24 24"}, React.createElement('path', {fill:"#00A1E0", d:"M11.7,3.4c2.8-0.3,5.1,1.9,4.8,4.7c-0.3,2.8-2.6,5-5.4,5.2c-2.8,0.3-5.1-1.9-4.8-4.7C6.6,5.8,8.9,3.6,11.7,3.4z M11.7,14.8c-2.8,0.3-5-1.9-4.8-4.7c0.2-1.3,0.8-2.4,1.7-3.2c-2.3,1.3-3.5,4-2.8,6.6c0.8,2.9,3.5,4.8,6.4,4.2c2.6-0.6,4.4-2.9,4.6-5.6c0.1-1.3-0.3-2.6-1-3.6C14.7,13.8,13.4,14.6,11.7,14.8z"}));
const OracleLogo: React.FC<{className?: string}> = ({className}) => React.createElement('svg', {className, viewBox:"0 0 24 24"}, React.createElement('path', {fill:"#F80000", d:"M14.5,4h-5C8.7,4,8,4.7,8,5.5v13c0,0.8,0.7,1.5,1.5,1.5h5c0.8,0,1.5-0.7,1.5-1.5V5.5C16,4.7,15.3,4,14.5,4z M12,18 c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,18,12,18z M15,11H9V9h6V11z"}));
const AzureLogo: React.FC<{className?: string}> = ({className}) => React.createElement('svg', {className, viewBox:"0 0 24 24"}, React.createElement('path', {fill:"#0072C6", d:"M12.4,3.3l-8,5.1v6.2l8,5.1l8-5.1V8.4L12.4,3.3z M11.6,17.8V9.1l6.3-4l-0.1,6.8L11.6,17.8z"}));
const CashAppLogo: React.FC<{className?: string}> = ({className}) => React.createElement('svg', {className, viewBox:"0 0 24 24"}, React.createElement('path', {fill:"#00D632", d:"M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z M15.3,16.7c-0.4,0.4-1,0.4-1.4,0L12,14.8l-1.9,1.9 c-0.4,0.4-1,0.4-1.4,0s-0.4-1,0-1.4l1.9-1.9l-1.9-1.9c-0.4-0.4-0.4-1,0-1.4s1-0.4,1.4,0l1.9,1.9l1.9-1.9c0.4-0.4,1-0.4,1.4,0 s0.4,1,0,1.4L13.4,12l1.9,1.9C15.7,14.3,15.7,14.7,15.3,16.7z"}));

export const MOCK_APP_INTEGRATIONS: AppIntegration[] = [
    { id: 'app1', name: 'Salesforce', logo: SalesforceLogo, status: 'connected' },
    { id: 'app2', name: 'Oracle NetSuite', logo: OracleLogo, status: 'connected' },
    { id: 'app3', name: 'Microsoft Azure', logo: AzureLogo, status: 'issue' },
    { id: 'app4', name: 'Cash App', logo: CashAppLogo, status: 'connected' },
    { id: 'app5', name: 'LinkedIn Ads', logo: ({ className }) => React.createElement(React.Fragment), status: 'disconnected' },
    { id: 'app6', name: 'Google Cloud', logo: ({ className }) => React.createElement(React.Fragment), status: 'connected' },
    { id: 'app7', name: 'Square', logo: ({ className }) => React.createElement(React.Fragment), status: 'connected' },
    { id: 'app8', name: 'TikTok Ads', logo: ({ className }) => React.createElement(React.Fragment), status: 'issue' },
];

export const MOCK_BIOMETRIC_DATA: BiometricData[] = [{
    id: 'bio_1',
    type: 'Fingerprint',
    publicKey: '04:A3:B1:C2:D3:E4:F5:A6:B7:C8:D9:E0:F1:A2:B3:C4',
    enrolledDate: '2024-01-15'
}];


export const MOCK_TRANSACTIONS: Transaction[] = [
  // July
  { id: '1', type: 'expense', category: 'Dining', description: 'Coffee Shop', amount: 12.50, date: '2024-07-21', carbonFootprint: 1.2 },
  { id: '2', type: 'income', category: 'Salary', description: 'Paycheck', amount: 2500.00, date: '2024-07-20' },
  { id: '3', type: 'expense', category: 'Shopping', description: 'Online Store', amount: 89.99, date: '2024-07-19', carbonFootprint: 8.5 },
  { id: '4', type: 'expense', category: 'Utilities', description: 'Electricity Bill', amount: 75.30, date: '2024-07-18', carbonFootprint: 15.3 },
  { id: '5', type: 'expense', category: 'Transport', description: 'Gas Station', amount: 55.00, date: '2024-07-18', carbonFootprint: 25.1 },
  { id: '6', type: 'income', category: 'Freelance', description: 'Project ABC', amount: 500.00, date: '2024-07-17' },
  { id: '7', type: 'expense', category: 'Groceries', description: 'Supermarket', amount: 124.50, date: '2024-07-16', carbonFootprint: 12.8 },
  { id: '8', type: 'expense', category: 'Entertainment', description: 'Movie Tickets', amount: 30.00, date: '2024-07-15', carbonFootprint: 3.5 },
  // June
  { id: '9', type: 'income', category: 'Salary', description: 'Paycheck', amount: 2500.00, date: '2024-06-20' },
  { id: '10', type: 'expense', category: 'Rent', description: 'Monthly Rent', amount: 1200.00, date: '2024-06-01', carbonFootprint: 5.0 },
  { id: '11', type: 'expense', category: 'Shopping', description: 'New Tech Gadget', amount: 299.99, date: '2024-06-15', carbonFootprint: 14.2 },
  { id: '12', type: 'expense', category: 'Dining', description: 'Fancy Dinner', amount: 150.00, date: '2024-06-10', carbonFootprint: 8.1 },
  // May
  { id: '13', type: 'income', category: 'Salary', description: 'Paycheck', amount: 2500.00, date: '2024-05-20' },
  { id: '14', type: 'expense', category: 'Travel', description: 'Flight Tickets', amount: 450.00, date: '2024-05-12', carbonFootprint: 200.5 },
  { id: '15', type: 'expense', category: 'Rent', description: 'Monthly Rent', amount: 1200.00, date: '2024-05-01', carbonFootprint: 5.0 },
  // April
  { id: '16', type: 'income', category: 'Salary', description: 'Paycheck', amount: 2500.00, date: '2024-04-20' },
  { id: '17', type: 'expense', category: 'Rent', description: 'Monthly Rent', amount: 1200.00, date: '2024-04-01', carbonFootprint: 5.0 },
];

export const MOCK_ASSETS: Asset[] = [
  { name: 'Stocks', value: 40000, color: '#06b6d4', performanceYTD: 15.2 },
  { name: 'Bonds', value: 25000, color: '#6366f1', performanceYTD: 4.1 },
  { name: 'Crypto', value: 15000, color: '#f59e0b', performanceYTD: 45.8 },
  { name: 'Real Estate', value: 20000, color: '#10b981', performanceYTD: 8.5 },
];

export const MOCK_IMPACT_INVESTMENTS: Asset[] = [
    { name: 'TerraCycle', value: 0, color: '', esgRating: 5, description: 'Innovator in recycling and circular economy.' },
    { name: 'Patagonia Works', value: 0, color: '', esgRating: 5, description: 'Sustainable apparel and environmental activism.'},
    { name: 'Beyond Meat', value: 0, color: '', esgRating: 4, description: 'Plant-based foods to reduce climate impact.'},
    { name: 'Tesla, Inc.', value: 0, color: '', esgRating: 3, description: 'Accelerating the world\'s transition to sustainable energy.'}
];

export const MOCK_BUDGETS: BudgetCategory[] = [
  { id: 'dining', name: 'Dining', limit: 400, spent: 280, color: '#f59e0b' },
  { id: 'shopping', name: 'Shopping', limit: 600, spent: 410.50, color: '#6366f1' },
  { id: 'transport', name: 'Transport', limit: 200, spent: 95.20, color: '#10b981' },
  { id: 'utilities', name: 'Utilities', limit: 250, spent: 185.70, color: '#06b6d4' },
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
    { id: 'sub1', name: 'QuantumFlix', amount: 15.99, nextPayment: '2024-08-01', iconName: 'video' },
    { id: 'sub2', name: 'SynthWave Music', amount: 9.99, nextPayment: '2024-08-05', iconName: 'music' },
    { id: 'sub3', name: 'CyberCloud Pro', amount: 24.99, nextPayment: '2024-08-10', iconName: 'cloud' },
];

export const MOCK_CREDIT_SCORE: CreditScore = {
    score: 780,
    change: 5,
    rating: 'Excellent',
};

export const MOCK_UPCOMING_BILLS: UpcomingBill[] = [
    { id: 'bill1', name: 'Credit Card', amount: 345.80, dueDate: '2024-08-15' },
    { id: 'bill2', name: 'Internet', amount: 80.00, dueDate: '2024-08-20' },
    { id: 'bill3', name: 'Car Payment', amount: 450.00, dueDate: '2024-08-25' },
];

export const MOCK_SAVINGS_GOALS: SavingsGoal[] = [
    { id: 'goal1', name: 'Cyberpunk Vacation', target: 5000, saved: 3250, iconName: 'plane' },
    { id: 'goal2', name: 'New Hoverboard', target: 2500, saved: 800, iconName: 'rocket' },
];

export const MOCK_MARKET_MOVERS: MarketMover[] = [
    { ticker: 'QNTM', name: 'Quantum Corp', price: 450.75, change: 12.55 },
    { ticker: 'CYBR', name: 'Cyberdyne Systems', price: 1024.10, change: 50.12 },
    { ticker: 'NRLNK', name: 'NeuroLink Inc.', price: 875.30, change: -5.60 },
];

export const MOCK_FINANCIAL_GOALS: FinancialGoal[] = [
// FIX: Added missing properties to conform to FinancialGoal interface
    {
        id: 'goal_house_1',
        name: 'Down Payment for a Condo',
        targetAmount: 75000,
        targetDate: '2029-12-31',
        currentAmount: 12500,
        iconName: 'home',
        plan: null,
        startDate: '2024-01-01',
        status: 'on_track',
        linkedGoals: [],
        recurringContributions: [],
        contributions: []
    },
// FIX: Added missing properties to conform to FinancialGoal interface
    {
        id: 'goal_trip_1',
        name: 'Trip to Neo-Tokyo',
        targetAmount: 15000,
        targetDate: '2026-06-01',
        currentAmount: 8000,
        iconName: 'plane',
        plan: {
            feasibilitySummary: "Highly achievable! You are already on a great track to reach this goal ahead of schedule.",
            monthlyContribution: 450,
            steps: [
                { title: "Automate Savings", description: "Set up an automatic monthly transfer of $450 to your 'Trip to Neo-Tokyo' savings goal.", category: 'Savings' },
                { title: "Review Subscriptions", description: "Analyze your recurring subscriptions. Cancelling one or two could accelerate your goal.", category: 'Budgeting' },
                { title: "Explore Travel ETFs", description: "Consider investing a small portion of your savings in a travel and tourism focused ETF for potential growth.", category: 'Investing' }
            ]
        },
        startDate: '2023-06-01',
        status: 'on_track',
        linkedGoals: [],
        recurringContributions: [],
        contributions: []
    }
];

export const MOCK_CRYPTO_ASSETS: CryptoAsset[] = [
  { ticker: 'BTC', name: 'Bitcoin', value: 34500, amount: 0.5, color: '#f7931a' },
  { ticker: 'ETH', name: 'Ethereum', value: 12000, amount: 4, color: '#627eea' },
  { ticker: 'SOL', name: 'Solana', value: 3500, amount: 25, color: '#00ffa3' },
];

export const MOCK_PAYMENT_OPERATIONS: PaymentOperation[] = [
    { id: 'po_1', description: 'Stripe On-Ramp Batch #A42', amount: 25000, status: 'Completed', type: 'ACH', date: '2024-07-22' },
    { id: 'po_2', description: 'Crypto Payout to 0x...b4A2', amount: 5000, status: 'Completed', type: 'Crypto', date: '2024-07-22' },
    { id: 'po_3', description: 'Marqeta Card Funding', amount: 10000, status: 'Processing', type: 'Wire', date: '2024-07-23' },
    { id: 'po_4', description: 'Coinbase Withdrawal', amount: 12000, status: 'Initiated', type: 'ACH', date: '2024-07-23' },
    { id: 'po_5', description: 'Manual Adjustment', amount: -500, status: 'Failed', type: 'ACH', date: '2024-07-21' },
];

export const MOCK_REWARD_POINTS: RewardPoints = {
    balance: 85250,
    lastEarned: 320,
    lastRedeemed: 5000,
    currency: 'Points',
};

export const MOCK_CORPORATE_CARDS: CorporateCard[] = [
    { id: 'corp1', holderName: 'Alex Chen (Engineer)', cardNumberMask: '8431', status: 'Active', frozen: false, controls: { atm: true, contactless: true, online: true, monthlyLimit: 5000 }, biometricLockEnabled: true },
    { id: 'corp2', holderName: 'Brenda Rodriguez (Sales)', cardNumberMask: '5549', status: 'Active', frozen: false, controls: { atm: false, contactless: true, online: true, monthlyLimit: 10000 }, biometricLockEnabled: false },
    { id: 'corp3', holderName: 'Charles Davis (Marketing)', cardNumberMask: '1127', status: 'Suspended', frozen: true, controls: { atm: false, contactless: false, online: false, monthlyLimit: 2500 }, biometricLockEnabled: false },
    { id: 'corp4', holderName: 'Diana Wells (Operations)', cardNumberMask: '9882', status: 'Active', frozen: false, controls: { atm: true, contactless: true, online: false, monthlyLimit: 7500 }, biometricLockEnabled: false },
    { id: 'corp5', holderName: 'Ethan Gonzalez (HR)', cardNumberMask: '3019', status: 'Active', frozen: false, controls: { atm: true, contactless: true, online: true, monthlyLimit: 4000 }, biometricLockEnabled: false },
];

export const MOCK_CORPORATE_TRANSACTIONS: CorporateTransaction[] = [
    { id: 'ctx1', cardId: 'corp1', holderName: 'Alex Chen', merchant: 'Cloud Services Inc.', amount: 199.99, status: 'Approved', timestamp: '2m ago', date: new Date().toISOString() },
    { id: 'ctx2', cardId: 'corp2', holderName: 'Brenda Rodriguez', merchant: 'Steakhouse Prime', amount: 345.50, status: 'Approved', timestamp: '5m ago', date: new Date().toISOString() },
    { id: 'ctx3', cardId: 'corp4', holderName: 'Diana Wells', merchant: 'Office Supplies Co.', amount: 89.20, status: 'Pending', timestamp: '8m ago', date: new Date().toISOString() },
    { id: 'ctx4', cardId: 'corp1', holderName: 'Alex Chen', merchant: 'CodeEditor Pro', amount: 49.00, status: 'Approved', timestamp: '1h ago', date: new Date().toISOString() },
    { id: 'ctx5', cardId: 'corp2', holderName: 'Brenda Rodriguez', merchant: 'Airport Taxi', amount: 75.00, status: 'Approved', timestamp: '3h ago', date: new Date().toISOString() },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', message: 'Your credit score has increased by 5 points!', timestamp: '2h ago', read: false, view: View.CreditHealth },
  { id: '2', message: 'A large purchase of $299.99 at "New Tech Gadget" was detected.', timestamp: '1d ago', read: false, view: View.Transactions },
  { id: '3', message: 'You have earned 150 reward points from your recent spending.', timestamp: '3d ago', read: true, view: View.Rewards },
  { id: '4', message: 'Your "Dining" budget is at 85% capacity.', timestamp: '4d ago', read: true, view: View.Budgets },
];

export const MOCK_REWARD_ITEMS: RewardItem[] = [
    { id: 'rew1', name: '$25 Statement Credit', cost: 25000, type: 'cashback', description: 'Redeem points for a direct credit to your account balance.', iconName: 'cash' },
    { id: 'rew2', name: '$50 Tech Store Gift Card', cost: 45000, type: 'giftcard', description: 'Get a gift card for your favorite electronics retailer.', iconName: 'gift' },
    { id: 'rew3', name: 'Plant 5 Trees', cost: 10000, type: 'impact', description: 'Use your points to make a positive environmental impact.', iconName: 'leaf' },
];

export const MOCK_API_STATUS: APIStatus[] = [
    { provider: 'Plaid', status: 'Operational', responseTime: 120 },
    { provider: 'Stripe', status: 'Operational', responseTime: 85 },
    { provider: 'Marqeta', status: 'Operational', responseTime: 150 },
    { provider: 'Modern Treasury', status: 'Operational', responseTime: 110 },
    { provider: 'Google Gemini', status: 'Degraded Performance', responseTime: 450 },
];

export const MOCK_CREDIT_FACTORS: CreditFactor[] = [
    { name: 'Payment History', status: 'Excellent', description: 'You have no missed payments on record. Keep up the great work!' },
    { name: 'Credit Utilization', status: 'Good', description: 'Your credit utilization is 22%, which is good. Aim to keep it below 30%.' },
    { name: 'Credit Age', status: 'Good', description: 'Your average credit account age is 6 years. The longer, the better.' },
    { name: 'New Credit', status: 'Excellent', description: 'You have not opened any new credit lines recently, which is positive.' },
    { name: 'Credit Mix', status: 'Fair', description: 'Your credit mix could be improved with different types of loans, such as a mortgage.' },
];

const MOCK_EXTERNAL_ACCOUNTS: ExternalAccount[] = [
  { id: 'ext_1', bankName: 'Chase', mask: '1111', balance: 54023.11, type: 'checking' },
  { id: 'ext_2', bankName: 'Bank of America', mask: '2222', balance: 102500.50, type: 'savings' },
];

export const MOCK_COUNTERPARTIES: Counterparty[] = [
    { id: 'cp_1', name: 'Cloud Services Inc.', type: 'business', riskLevel: 'Low', createdDate: '2023-01-15', accounts: [MOCK_EXTERNAL_ACCOUNTS[0]], virtualAccounts: [] },
    { id: 'cp_2', name: 'Office Supplies Co.', type: 'business', riskLevel: 'Low', createdDate: '2023-02-20', accounts: [MOCK_EXTERNAL_ACCOUNTS[1]], virtualAccounts: [] },
    { id: 'cp_3', name: 'Stripe, Inc.', type: 'business', riskLevel: 'Low', createdDate: '2022-11-10', accounts: [], virtualAccounts: [] },
    { id: 'cp_4', name: 'Client Alpha', type: 'individual', riskLevel: 'Medium', createdDate: '2024-05-01', accounts: [], virtualAccounts: [] },
];

export const MOCK_PAYMENT_ORDERS: PaymentOrder[] = [
  { id: 'po_001', counterpartyId: 'cp_1', counterpartyName: 'Cloud Services Inc.', accountId: 'ext_1', amount: 199.99, currency: 'USD', direction: 'debit', status: 'needs_approval', date: '2024-07-23', type: 'ACH' },
  { id: 'po_002', counterpartyId: 'cp_2', counterpartyName: 'Office Supplies Co.', accountId: 'ext_2', amount: 89.20, currency: 'USD', direction: 'debit', status: 'approved', date: '2024-07-22', type: 'ACH' },
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv_1', invoiceNumber: 'INV-2024-07-001', counterpartyName: 'Client Bravo', dueDate: '2024-07-15', amount: 7500, status: 'overdue' },
  { id: 'inv_2', invoiceNumber: 'INV-2024-08-002', counterpartyName: 'Client Charlie', dueDate: '2024-08-10', amount: 12000, status: 'unpaid' },
  { id: 'inv_3', invoiceNumber: 'INV-2024-06-003', counterpartyName: 'Client Delta', dueDate: '2024-06-25', amount: 2500, status: 'paid' },
];

export const MOCK_COMPLIANCE_RULES: ComplianceRule[] = [
    { id: 'rule_1', name: 'High-Value Transaction Monitoring', description: 'Flag any transaction over $10,000 for manual review.', action: 'flag_for_review', active: true },
    { id: 'rule_2', name: 'Sanctioned Country Blocker', description: 'Automatically block payments to or from sanctioned jurisdictions.', action: 'block', active: true },
    { id: 'rule_3', name: 'Rapid Velocity Check', description: 'Flag accounts with more than 5 outgoing transfers in a 1-hour period.', action: 'flag_for_review', active: false },
];

export const MOCK_COMPLIANCE_CASES: ComplianceCase[] = [
  { id: 'case_1', reason: 'Transaction over $10,000', entityType: 'PaymentOrder', entityId: 'po_003', status: 'open', openedDate: '2024-07-21' },
];

export const MOCK_ANOMALIES: FinancialAnomaly[] = [
  {
    id: 'anom_1',
    description: 'Unusually Large Payment to New Counterparty',
    details: 'A payment of $15,000 was made to "QuantumLeap Marketing", a counterparty with no prior transaction history. The amount is 5x larger than the average initial payment to a new vendor.',
    severity: 'High',
    status: 'New',
    entityType: 'PaymentOrder',
    entityId: 'po_005',
    entityDescription: 'PO #po_005 to QuantumLeap Marketing',
    timestamp: '2024-07-23 10:45 AM',
    riskScore: 85,
  },
  {
    id: 'anom_2',
    description: 'High-Frequency Spending on Corporate Card',
    details: 'Corporate card ending in 8431 (Alex Chen) was used 12 times in a 2-hour window. This pattern is anomalous compared to the typical usage of 2-3 transactions per day.',
    severity: 'Medium',
    status: 'New',
    entityType: 'CorporateCard',
    entityId: 'corp1',
    entityDescription: 'Card **** 8431 (Alex Chen)',
    timestamp: '2024-07-23 09:30 AM',
    riskScore: 62,
  },
];

export const MOCK_USERS: User[] = [
    { id: 'user_0', name: 'The Visionary', email: 'visionary@demobank.com', display_name: 'The Visionary', handle: '@visionary', role: 'Founder', businessId: 'b_01', profilePictureUrl: '/avatars/p1.webp', bio: 'Building the future of finance, one line of code at a time. #FinTech #AI', profile: { interests: ['AI', 'FinTech', 'Decentralization'], skills: ['TypeScript', 'Solidity', 'System Design'] }, wallet: { balance: 125000, currency: 'USD' }, businesses: ['b_01'], memberships: [], followers: ['user_1', 'user_2', 'user_3'], following: ['user_1', 'user_2'], state: { mood: 'excited', activity: 'Coding Genesis Engine', last_active_tick: 100 }, netWorth: 12500000 },
    { id: 'user_1', name: 'Dr. Aris Thorne', email: 'aris@aether.corp', display_name: 'Dr. Aris Thorne', handle: '@aris.thorne', role: 'Investor', businessId: 'b_02', profilePictureUrl: '/avatars/p2.webp', bio: 'PhD in Quantum Economics. Investing in world-changing ideas. Aether Corp.', profile: { interests: ['Quantum Computing', 'Economics', 'VC'], skills: ['Financial Modeling', 'Risk Analysis'] }, wallet: { balance: 5400000, currency: 'USD' }, businesses: ['b_02'], memberships: [], followers: ['user_0', 'user_2'], following: ['user_0', 'user_3'], state: { mood: 'neutral', activity: 'Reviewing pitch decks', last_active_tick: 98 }, netWorth: 75000000 },
    { id: 'user_2', name: 'Jia Li', email: 'jia.li@sentinel.io', display_name: 'Jia Li', handle: '@jia.li', role: 'Founder', businessId: 'b_03', profilePictureUrl: '/avatars/p3.webp', bio: 'CEO @ Sentinel.io - AI-powered cybersecurity. Protecting the new digital frontier.', profile: { interests: ['Cybersecurity', 'AI', 'Startups'], skills: ['Go', 'Cryptography', 'Leadership'] }, wallet: { balance: 89000, currency: 'USD' }, businesses: ['b_03'], memberships: [], followers: ['user_0', 'user_1', 'user_3'], following: ['user_0', 'user_1'], state: { mood: 'stressed', activity: 'Closing Series B', last_active_tick: 100 }, netWorth: 25000000 },
    { id: 'user_3', name: 'Ben Carter', email: 'bencarter@velocity.com', display_name: 'Ben Carter', handle: '@bencarter', role: 'Manager', businessId: 'b_04', profilePictureUrl: '/avatars/p4.webp', bio: 'Operations lead for Velocity Logistics. Making drone delivery a reality.', profile: { interests: ['Logistics', 'Drones', 'Efficiency'], skills: ['Operations', 'Project Management'] }, wallet: { balance: 45000, currency: 'USD' }, businesses: ['b_04'], memberships: [], followers: ['user_2'], following: ['user_0', 'user_1', 'user_2'], state: { mood: 'happy', activity: 'Optimizing flight paths', last_active_tick: 99 }, netWorth: 850000 },
];

const MOCK_COMMENTS: Comment[] = [
    { id: 'c1', userId: 'user_1', userName: 'Dr. Aris Thorne', userProfilePic: '/avatars/p2.webp', text: 'Fascinating projection. The market volatility model needs to be stress-tested against black swan events.', timestamp: '2h ago' },
    { id: 'c2', userId: 'user_2', userName: 'Jia Li', userProfilePic: '/avatars/p3.webp', text: 'Agreed. Also, have you factored in the new quantum encryption standards for data security?', timestamp: '1h ago' },
];

export const MOCK_POSTS: Post[] = [
    { id: 'post_1', author_id: 'user_1', userName: 'Dr. Aris Thorne', userProfilePic: '/avatars/p2.webp', created_tick: 95,
      content: { text: 'Finalizing my quarterly thesis on decentralized autonomous organizations (DAOs). The potential for frictionless governance is immense, but the regulatory hurdles remain significant. Attached is the preliminary data model for community review.' },
      type: 'text',
      tags: ['DAO', 'governance', 'blockchain'],
      metrics: { likes: 128, comments: 2, shares: 15, reach: 5500 },
      visibility: 'public',
      comments: MOCK_COMMENTS
    },
    { id: 'post_2', author_id: 'user_2', userName: 'Jia Li', userProfilePic: '/avatars/p3.webp', created_tick: 80,
      content: { text: 'Sentinel.io just closed our Series B funding round, led by Aether Corp! This capital will help us scale our AI-driven threat detection network globally. The future is secure.', imageUrl: '/post_img_1.webp' },
      type: 'image',
      tags: ['funding', 'cybersecurity', 'AI'],
      metrics: { likes: 452, comments: 0, shares: 62, reach: 12000 },
      visibility: 'public',
      comments: []
    },
    { id: 'post_3', author_id: 'user_0', userName: 'The Visionary', userProfilePic: '/avatars/p1.webp', created_tick: 50,
      content: { text: 'The community lending pool is showing incredible growth. Total capital has surpassed our EOY projections by 15%. This is the power of a transparent, aligned financial ecosystem.' },
      type: 'text',
      tags: ['DeFi', 'community', 'finance'],
      metrics: { likes: 210, comments: 0, shares: 30, reach: 8000 },
      visibility: 'public',
      comments: []
    }
];

export const MOCK_BUSINESSES: Business[] = [
    { id: 'b_01', owner_id: 'user_0', name: 'Demo Bank R&D', type: 'platform', monthly_revenue: 1000000, expenses: 450000, employees: ['user_0'], status: 'active', marketing_factor: 0.8, businessPlan: 'Plan for Demo Bank...', valuation: 500000000, cashBalance: 12000000, hqLocation: 'Virtual' },
    { id: 'b_02', owner_id: 'user_1', name: 'Aether Corp', type: 'service', monthly_revenue: 5000000, expenses: 2000000, employees: ['user_1'], status: 'active', marketing_factor: 0.9, businessPlan: 'Investing in world-changing ideas.', valuation: 2000000000, cashBalance: 50000000, hqLocation: 'Geneva' },
    { id: 'b_03', owner_id: 'user_2', name: 'Sentinel.io', type: 'platform', monthly_revenue: 800000, expenses: 300000, employees: ['user_2'], status: 'active', marketing_factor: 0.85, businessPlan: 'AI-powered cybersecurity.', valuation: 150000000, cashBalance: 8000000, hqLocation: 'Palo Alto' },
    { id: 'b_04', owner_id: 'user_3', name: 'Velocity Logistics', type: 'service', monthly_revenue: 400000, expenses: 350000, employees: ['user_3'], status: 'active', marketing_factor: 0.7, businessPlan: 'Drone delivery logistics.', valuation: 50000000, cashBalance: 2000000, hqLocation: 'Austin' },
];

export const MOCK_LENDING_POOL: LendingPoolStats = {
    totalCapital: 150000,
    interestRate: 8.5,
    activeLoans: 12,
    defaultRate: 1.2,
    totalInterestEarned: 12500,
};

export const MOCK_LOGIN_ATTEMPTS: LoginAttempt[] = [
    { id: 'la_1', userId: 'user_0', userName: 'The Visionary', timestamp: '2m ago', ipAddress: '192.168.1.1', success: true },
    { id: 'la_2', userId: 'user_1', userName: 'Dr. Aris Thorne', timestamp: '15m ago', ipAddress: '203.0.113.24', success: true },
    { id: 'la_3', userId: 'user_x', userName: 'Unknown', timestamp: '1h ago', ipAddress: '198.51.100.5', success: false },
    { id: 'la_4', userId: 'user_2', userName: 'Jia Li', timestamp: '3h ago', ipAddress: '198.51.100.55', success: true },
];

export const MOCK_AI_AGENTS: AIAgent[] = [
    { id: 'agent_risk', name: 'Risk-Arbiter-7', status: 'online', specialization: 'Risk', traffic: 1204 },
    { id: 'agent_comp', name: 'Compliance-Oracle-3', status: 'online', specialization: 'Compliance', traffic: 850 },
    { id: 'agent_fx', name: 'FX-Weaver-9', status: 'online', specialization: 'FX', traffic: 2103 },
    { id: 'agent_ledg', name: 'Ledger-Scribe-4', status: 'error', specialization: 'Ledgering', traffic: 430 },
    { id: 'agent_liq', name: 'Liquidity-Pulse-1', status: 'online', specialization: 'Liquidity', traffic: 3500 },
];

export const MOCK_SYNAPTIC_VAULTS: SynapticVault[] = [
    { id: 'sv_1', ownerIds: ['user_0', 'user_1'], ownerNames: ['The Visionary', 'Dr. Aris Thorne'], status: 'active', masterPrivateKeyFragment: '...a4b2', creationDate: '2024-06-15' },
];

export const MOCK_MARQETA_USERS: MarqetaUser[] = [
    {
        token: 'user-token-visionary',
        first_name: 'The',
        last_name: 'Visionary',
        email: 'visionary@demobank.com',
        active: true,
        created_time: '2024-01-01T12:00:00Z',
        last_modified_time: '2024-07-20T10:30:00Z',
    },
    {
        token: 'user-token-aris',
        first_name: 'Aris',
        last_name: 'Thorne',
        email: 'aris@aether.corp',
        active: true,
        created_time: '2024-02-15T09:00:00Z',
        last_modified_time: '2024-07-18T15:45:00Z',
    },
];

export const MOCK_MARQETA_CARD_PRODUCTS: MarqetaCardProduct[] = [
    {
        token: 'cp-token-standard',
        name: 'Standard Issue Debit',
        active: true,
        start_date: '2023-01-01',
        config: {}, // Added missing config property
    },
    {
        token: 'cp-token-corporate',
        name: 'Corporate T&E Card',
        active: true,
        start_date: '2023-06-01',
        config: {}, // Added missing config property
    },
];

export const MOCK_MARQETA_CARDS: MarqetaCard[] = [];
