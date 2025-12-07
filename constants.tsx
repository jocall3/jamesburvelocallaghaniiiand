
import React from 'react';
import { Bot, FileText, Shuffle, PiggyBank, Target, Shield, TrendingUp, Gem, Code, Globe, Cuboid, Home, Palette, Percent, Rocket, Briefcase, Calculator, Scroll, Building, Landmark, Link, Users, Megaphone, Network, ShoppingBag, User, FileCog, Settings, Eye, CreditCard, Lock, Leaf, Activity, Cpu, AlertTriangle, Gift, Layers, Zap, Database, Server, Clipboard, Atom, Repeat, DollarSign, Sparkles, Terminal, BarChart2, PieChart, Box as BoxIcon, LifeBuoy, Grid, CheckCircle, Scale, LayoutDashboard, Mic, Book, Library } from 'lucide-react';
import { View } from './types';


export const banks = [
    { name: 'Chase', logo: <Building className="w-6 h-6 text-blue-600" />, institution_id: 'ins_1' },
    { name: 'Bank of America', logo: <Landmark className="w-6 h-6 text-red-600" />, institution_id: 'ins_2' },
    { name: 'Wells Fargo', logo: <Shield className="w-6 h-6 text-yellow-600" />, institution_id: 'ins_3' },
    { name: 'Citi', logo: <Globe className="w-6 h-6 text-blue-400" />, institution_id: 'ins_4' },
    { name: 'Capital One', logo: <CreditCard className="w-6 h-6 text-blue-800" />, institution_id: 'ins_5' },
];

export const NAV_ITEMS = [
    {
        group: 'Intelligence Command',
        items: [
            { view: View.Dashboard, title: 'Foundation Dashboard', icon: Bot },
            { view: View.Transactions, title: 'FlowMatrix (Transactions)', icon: FileText },
            { view: View.SendMoney, title: 'Quantum Pay', icon: Shuffle },
            { view: View.Budgets, title: 'Capital Allocation', icon: PiggyBank },
            { view: View.FinancialGoals, title: 'Strategic Goals', icon: Target },
            { view: View.CreditHealth, title: 'Credit Resonance', icon: Shield },
            { view: View.Personalization, title: 'Interface Will', icon: Settings },
            { view: View.Accounts, title: 'Accounts Overview', icon: Briefcase },
        ]
    },
    {
        group: 'The 527 Protocol',
        items: [
            { view: View.TheBook, title: 'The Blueprint (527 Pages)', icon: Book },
            { view: View.KnowledgeBase, title: 'The Academy', icon: Library },
        ]
    },
    {
        group: 'Infinite Wealth',
        items: [
            { view: View.Investments, title: 'Portfolio Overview', icon: TrendingUp },
            { view: View.Crypto, title: 'Web3 & Crypto', icon: Gem },
            { view: View.AlgoTradingLab, title: 'Algo-Trading Lab', icon: Code },
            { view: View.ForexArena, title: 'Forex Arena', icon: Globe },
            { view: View.CommoditiesExchange, title: 'Commodities', icon: Cuboid },
            { view: View.RealEstateEmpire, title: 'Real Estate', icon: Home },
            { view: View.ArtCollectibles, title: 'Art & Collectibles', icon: Palette },
            { view: View.DerivativesDesk, title: 'Derivatives', icon: Percent },
            { view: View.VentureCapital, title: 'Venture Capital', icon: Rocket },
            { view: View.PrivateEquity, title: 'Private Equity', icon: Briefcase },
            { view: View.TaxOptimization, title: 'Civic Contribution', icon: Calculator },
            { view: View.LegacyBuilder, title: 'Legacy Architect', icon: Scroll },
            { view: View.SovereignWealth, title: 'Wealth Simulation', icon: Landmark },
            { view: View.QuantumAssets, title: 'Quantum Assets', icon: Atom },
        ]
    },
    {
        group: 'Citi Connect Core',
        items: [
            { view: View.CitibankAccounts, title: 'Citi Accounts', icon: Building },
            { view: View.CitibankAccountProxy, title: 'Account Proxy', icon: Shuffle },
            { view: View.CitibankBillPay, title: 'Bill Payment', icon: FileText },
            { view: View.CitibankCrossBorder, title: 'Cross Border', icon: Globe },
            { view: View.CitibankPayeeManagement, title: 'Payee Mgmt', icon: Users },
            { view: View.CitibankStandingInstructions, title: 'Standing Instructions', icon: Repeat },
            { view: View.CitibankDeveloperTools, title: 'Citi Dev Tools', icon: Code },
            { view: View.CitibankEligibility, title: 'Eligibility Check', icon: CheckCircle },
            { view: View.CitibankUnmaskedData, title: 'Secure Data View', icon: Eye },
        ]
    },
    {
        group: 'Plaid Nexus',
        items: [
            { view: View.PlaidMainDashboard, title: 'Plaid Overview', icon: Activity },
            { view: View.PlaidIdentity, title: 'Identity Verification', icon: User },
            { view: View.PlaidCRAMonitoring, title: 'CRA Monitoring', icon: Eye },
            { view: View.PlaidInstitutions, title: 'Institutions Explorer', icon: Building },
            { view: View.PlaidItemManagement, title: 'Item Management', icon: Settings },
        ]
    },
    {
        group: 'Enterprise Operations',
        items: [
            { view: View.CorporateCommand, title: 'Corporate Command', icon: Building },
            { view: View.ModernTreasury, title: 'Modern Treasury', icon: Landmark },
            { view: View.Treasury, title: 'Treasury & Capital', icon: DollarSign },
            { view: View.CardPrograms, title: 'Marqeta Cards', icon: CreditCard },
            { view: View.Payments, title: 'Stripe Payments', icon: Zap },
            { view: View.StripeNexus, title: 'Stripe Nexus', icon: Link },
            { view: View.CounterpartyDashboard, title: 'Counterparties', icon: Users },
            { view: View.VirtualAccounts, title: 'Virtual Accounts', icon: Layers },
            { view: View.CorporateActions, title: 'Corporate Actions', icon: FileText },
            { view: View.CreditNoteLedger, title: 'Credit Notes', icon: FileText },
            { view: View.ReconciliationHub, title: 'Reconciliation Hub', icon: Shuffle },
            { view: View.GEINDashboard, title: 'GEIN Dashboard', icon: Network },
            { view: View.CardholderManagement, title: 'Cardholder Mgmt', icon: User },
             { view: View.VentureCapitalDeskView, title: 'VC Desk View', icon: Rocket },
        ]
    },
    {
        group: 'System & Intelligence',
        items: [
            { view: View.AIAdvisor, title: 'AI Advisor', icon: Bot },
            { view: View.AIInsights, title: 'Predictive Insights', icon: Sparkles },
            { view: View.QuantumWeaver, title: 'Quantum Weaver', icon: Network },
            { view: View.AgentMarketplace, title: 'Agent Marketplace', icon: ShoppingBag },
            { view: View.AIAdStudio, title: 'AI Ad Studio', icon: Megaphone },
            { view: View.GlobalPositionMap, title: 'Global Position Map', icon: Globe },
            { view: View.GlobalSsiHub, title: 'Global SSI Hub', icon: Database },
            { view: View.SecurityCompliance, title: 'Security & Compliance', icon: Shield },
            { view: View.DeveloperHub, title: 'Developer Hub', icon: Code },
            { view: View.SchemaExplorer, title: 'ISO 20022 Explorer', icon: FileCog },
            { view: View.ResourceGraph, title: 'Resource Graph', icon: Network },
            { view: View.TheVision, title: 'The Vision', icon: Eye },
            { view: View.ApiPlayground, title: 'API Playground', icon: Terminal },
            { view: View.ComplianceOracle, title: 'Compliance Oracle', icon: Scale },
        ]
    },
    {
        group: 'Admin & Tools',
        items: [
            { view: View.CustomerDashboard, title: 'Customer Dashboard', icon: Users },
            { view: View.VerificationReports, title: 'Verification Reports', icon: Clipboard },
            { view: View.FinancialReporting, title: 'Financial Reporting', icon: BarChart2 },
             { view: View.StripeNexusDashboard, title: 'Stripe Nexus Admin', icon: LayoutDashboard },
        ]
    },
    {
        group: 'All Components',
        items: [
            { view: View.AccountDetails, title: 'Account Details', icon: FileText },
            { view: View.AccountList, title: 'Account List', icon: FileText },
            { view: View.AccountStatementGrid, title: 'Account Statement Grid', icon: Grid },
            { view: View.AccountsView, title: 'Accounts View', icon: Briefcase },
            { view: View.AccountVerificationModal, title: 'Acct Verification Modal', icon: Shield },
            { view: View.ACHDetailsDisplay, title: 'ACH Details Display', icon: FileText },
            { view: View.AICommandLog, title: 'AI Command Log', icon: Terminal },
            { view: View.AIPredictionWidget, title: 'AI Prediction Widget', icon: Sparkles },
            { view: View.AssetCatalog, title: 'Asset Catalog', icon: BoxIcon },
            { view: View.AutomatedSweepRules, title: 'Automated Sweep Rules', icon: Repeat },
            { view: View.BalanceReportChart, title: 'Balance Report Chart', icon: BarChart2 },
            { view: View.BalanceTransactionTable, title: 'Balance Txn Table', icon: FileText },
            { view: View.CardDesignVisualizer, title: 'Card Design Visualizer', icon: Palette },
            { view: View.ChargeDetailModal, title: 'Charge Detail Modal', icon: FileText },
            { view: View.ChargeList, title: 'Charge List', icon: FileText },
            { view: View.ConductorConfigurationView, title: 'Conductor Config', icon: Settings },
            { view: View.CounterpartyDetails, title: 'Counterparty Details', icon: User },
            { view: View.CounterpartyForm, title: 'Counterparty Form', icon: FileCog },
            { view: View.DisruptionIndexMeter, title: 'Disruption Index Meter', icon: Activity },
            { view: View.DocumentUploader, title: 'Document Uploader', icon: FileCog },
            { view: View.DownloadLink, title: 'Download Link', icon: Link },
            { view: View.EarlyFraudWarningFeed, title: 'Fraud Warning Feed', icon: AlertTriangle },
            { view: View.ElectionChoiceForm, title: 'Election Choice Form', icon: FileCog },
            { view: View.EventNotificationCard, title: 'Event Notification Card', icon: Megaphone },
            { view: View.ExpectedPaymentsTable, title: 'Expected Payments Table', icon: FileText },
            { view: View.ExternalAccountCard, title: 'External Account Card', icon: CreditCard },
            { view: View.ExternalAccountForm, title: 'External Account Form', icon: FileCog },
            { view: View.ExternalAccountsTable, title: 'External Accounts Table', icon: FileText },
            { view: View.FinancialAccountCard, title: 'Financial Account Card', icon: CreditCard },
            { view: View.IncomingPaymentDetailList, title: 'Incoming Pmt Detail', icon: FileText },
            { view: View.InvoiceFinancingRequest, title: 'Invoice Financing Req', icon: FileCog },
            { view: View.PaymentInitiationForm, title: 'Payment Initiation Form', icon: FileCog },
            { view: View.PaymentMethodDetails, title: 'Pmt Method Details', icon: FileText },
            { view: View.PaymentOrderForm, title: 'Payment Order Form', icon: FileCog },
            { view: View.PayoutsDashboard, title: 'Payouts Dashboard', icon: DollarSign },
            { view: View.PnLChart, title: 'PnL Chart', icon: PieChart },
            { view: View.RefundForm, title: 'Refund Form', icon: FileCog },
            { view: View.RemittanceInfoEditor, title: 'Remittance Info Editor', icon: FileCog },
            { view: View.ReportingView, title: 'Reporting View', icon: BarChart2 },
            { view: View.ReportRunGenerator, title: 'Report Run Generator', icon: FileCog },
            { view: View.ReportStatusIndicator, title: 'Report Status Indicator', icon: Activity },
            { view: View.SsiEditorForm, title: 'SSI Editor Form', icon: FileCog },
            { view: View.StripeNexusView, title: 'Stripe Nexus View', icon: Link },
            { view: View.StripeStatusBadge, title: 'Stripe Status Badge', icon: Shield },
            { view: View.StructuredPurposeInput, title: 'Structured Purpose Input', icon: FileCog },
            { view: View.SubscriptionList, title: 'Subscription List', icon: FileText },
            { view: View.TimeSeriesChart, title: 'Time Series Chart', icon: BarChart2 },
            { view: View.TradeConfirmationModal, title: 'Trade Confirm Modal', icon: FileText },
            { view: View.TransactionFilter, title: 'Transaction Filter', icon: FileCog },
            { view: View.TransactionList, title: 'Transaction List', icon: FileText },
            { view: View.TreasuryTransactionList, title: 'Treasury Txn List', icon: FileText },
            { view: View.UniversalObjectInspector, title: 'Object Inspector', icon: Eye },
            { view: View.VirtualAccountForm, title: 'Virtual Acct Form', icon: FileCog },
            { view: View.VirtualAccountsTable, title: 'Virtual Accts Table', icon: FileText },
            { view: View.VoiceControl, title: 'Voice Control', icon: Mic },
            { view: View.WebhookSimulator, title: 'Webhook Simulator', icon: Terminal },
        ]
    }
];

export const AppTheme = {
    colors: {
        primary: {
            DEFAULT: '#06b6d4',
            light: '#67e8f9',
            dark: '#0e7490',
        },
        secondary: {
            DEFAULT: '#6366f1',
            light: '#a5b4fc',
            dark: '#4338ca',
        },
        background: {
            main: '#111827',
            card: 'rgba(31, 41, 55, 0.5)',
            interactive: '#374151',
        },
        text: {
            main: '#f9fafb',
            headings: '#ffffff',
            muted: '#9ca3af',
            accent: '#e5e7eb',
        },
        status: {
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
        },
        border: {
            DEFAULT: 'rgba(75, 85, 99, 0.6)',
            interactive: 'rgba(6, 182, 212, 0.5)',
        },
    },
};
