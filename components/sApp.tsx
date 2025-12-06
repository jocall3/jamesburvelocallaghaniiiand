
import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Cpu, AlertTriangle } from 'lucide-react';

// Contexts
import { AuthProvider } from '../context/AuthContext';
import { DataProvider, DataContext } from '../context/DataContext';

// Layout
import Sidebar from './Sidebar';
import Header from './Header';
import { View } from '../types';
import { StripeDataProvider } from './StripeDataContext';
import { PlaidClient } from '../lib/plaidClient';


// --- ALL VIEW COMPONENTS ---
import AccountDetails from './AccountDetails';
import AccountList from './AccountList';
import AccountsDashboardView from './AccountsDashboardView';
import AccountStatementGrid from './AccountStatementGrid';
import AccountsView from './AccountsView';
import { AccountVerificationModal } from './AccountVerificationModal';
import ACHDetailsDisplay from './ACHDetailsDisplay';
import AIAdStudioView from './AIAdStudioView';
import AIAdvisorView from './AIAdvisorView';
import AICommandLog from './AICommandLog';
import { AIInsights } from './AIInsights';
import AIPredictionWidget from './AIPredictionWidget';
import AlgoTradingLab from './AlgoTradingLab';
import APIIntegrationView from './APIIntegrationView';
import ApiPlaygroundView from './ApiPlaygroundView';
import ArtCollectibles from './ArtCollectibles';
import AssetCatalog from './AssetCatalog';
import AutomatedSweepRules from './AutomatedSweepRules';
import BalanceReportChart from './BalanceReportChart';
import BalanceTransactionTable from './BalanceTransactionTable';
import BudgetsView from './BudgetsView';
import CardDesignVisualizer from './CardDesignVisualizer';
import CardholderManagement from './CardholderManagement';
import { ChargeDetailModal } from './ChargeDetailModal';
import ChargeList from './ChargeList';
import CitibankAccountProxyView from './CitibankAccountProxyView';
import CitibankAccountsView from './CitibankAccountsView';
import CitibankBillPayView from './CitibankBillPayView';
import CitibankCrossBorderView from './CitibankCrossBorderView';
import CitibankDeveloperToolsView from './CitibankDeveloperToolsView';
import CitibankEligibilityView from './CitibankEligibilityView';
import CitibankPayeeManagementView from './CitibankPayeeManagementView';
import CitibankStandingInstructionsView from './CitibankStandingInstructionsView';
import CitibankUnmaskedDataView from './CitibankUnmaskedDataView';
import CommoditiesExchange from './CommoditiesExchange';
import ComplianceAlertCard from './ComplianceAlertCard';
import { ComplianceOracleView } from './ComplianceOracleView';
import ConciergeService from './ConciergeService';
import ConductorConfigurationView from './ConductorConfigurationView';
import CorporateActionsNexusView from './CorporateActionsNexusView';
import CorporateCommandView from './CorporateCommandView';
import CounterpartyDashboardView from './CounterpartyDashboardView';
import CounterpartyDetails from './CounterpartyDetails';
import { CounterpartyForm } from './CounterpartyForm';
import CounterpartyList from './CounterpartyList';
import CreditHealthView from './CreditHealthView';
import { CreditNoteLedger } from './CreditNoteLedger';
import CryptoView from './CryptoView';
import CustomerDashboard from './CustomerDashboard';
import Dashboard from './Dashboard';
import { DealFlow } from './DealFlow';
import DerivativesDesk from './DerivativesDesk';
import DeveloperHubView from './DeveloperHubView';
import DisruptionIndexMeter from './DisruptionIndexMeter';
import DocumentUploader from './DocumentUploader';
import { DownloadLink } from './DownloadLink';
import EarlyFraudWarningFeed from './EarlyFraudWarningFeed';
import ElectionChoiceForm from './ElectionChoiceForm';
import EventNotificationCard from './EventNotificationCard';
import ExpectedPaymentsTable from './ExpectedPaymentsTable';
import ExternalAccountCard from './ExternalAccountCard';
import ExternalAccountForm from './ExternalAccountForm';
import ExternalAccountsTable from './ExternalAccountsTable';
import { FinancialAccountCard } from './FinancialAccountCard';
import FinancialDemocracyView from './FinancialDemocracyView';
import FinancialGoalsView from './FinancialGoalsView';
import FinancialReportingView from './FinancialReportingView';
import ForexArena from './ForexArena';
import GEIN_DashboardView from './GEIN_DashboardView';
import GlobalMarketMap from './GlobalMarketMap';
import GlobalPositionMap from './GlobalPositionMap';
import GlobalSsiHubView from './GlobalSsiHubView';
import IdentityView from './IdentityView';
import ImpactTracker from './ImpactTracker';
import IncomingPaymentDetailList from './IncomingPaymentDetailList';
import { InvestmentForm } from './InvestmentForm';
import InvestmentPortfolio from './InvestmentPortfolio';
import InvestmentsView from './InvestmentsView';
import InvoiceFinancingRequest from './InvoiceFinancingRequest';
import LegacyBuilder from './LegacyBuilder';
import LoginView from './LoginView';
import MarketplaceView from './MarketplaceView';
import MarqetaDashboardView from './MarqetaDashboardView';
import ModernTreasuryView from './ModernTreasuryView';
import OpenBankingView from './OpenBankingView';
import PaymentInitiationForm from './PaymentInitiationForm';
import PaymentMethodDetails from './PaymentMethodDetails';
import PaymentOrderForm from './PaymentOrderForm';
import PayoutsDashboard from './PayoutsDashboard';
import PersonalizationView from './PersonalizationView';
import PhilanthropyHub from './PhilanthropyHub';
import PlaidCRAMonitoringView from './PlaidCRAMonitoringView';
import PlaidDashboardView from './PlaidDashboardView';
import PlaidIdentityView from './PlaidIdentityView';
import { PlaidInstitutionsExplorer } from './PlaidInstitutionsExplorer';
import { PlaidItemManagementView } from './PlaidItemManagementView';
import PlaidMainDashboard from './PlaidMainDashboard';
import PnLChart from './PnLChart';
import { PortfolioCompanyDetails } from './PortfolioCompanyDetails';
import { PortfolioCompanyList } from './PortfolioCompanyList';
import PrivateEquityLounge from './PrivateEquityLounge';
import QuantumAssets from './QuantumAssets';
import QuantumWeaverView from './QuantumWeaverView';
import RealEstateEmpire from './RealEstateEmpire';
import RecentTransactions from './RecentTransactions';
import ReconciliationHubView from './ReconciliationHubView';
import RefundForm from './RefundForm';
import RemittanceInfoEditor from './RemittanceInfoEditor';
import ReportingView from './ReportingView';
import { ReportRunGenerator } from './ReportRunGenerator';
import ReportStatusIndicator from './ReportStatusIndicator';
import ResourceGraphView from './ResourceGraphView';
import SchemaExplorer from './SchemaExplorer';
import SecurityComplianceView from './SecurityComplianceView';
import SecurityView from './SecurityView';
import SendMoneyView from './SendMoneyView';
import SettingsView from './SettingsView';
import SovereignWealth from './SovereignWealth';
import SpendingAnalysisChart from './SpendingAnalysisChart';
import SsiEditorForm from './SsiEditorForm';
import SSOView from './SSOView';
import StrategyEditor from './StrategyEditor';
import StripeDashboardView from './StripeDashboardView';
import StripeNexusDashboard from './StripeNexusDashboard';
import StripeNexusView from './StripeNexusView';
import StripeStatusBadge from './StripeStatusBadge';
import StructuredPurposeInput from './StructuredPurposeInput';
import SubscriptionList from './SubscriptionList';
import TaxOptimizationChamber from './TaxOptimizationChamber';
import TheVisionView from './TheVisionView';
import TimeSeriesChart from './TimeSeriesChart';
import TradeConfirmationModal from './TradeConfirmationModal';
import TransactionFilter from './TransactionFilter';
import TransactionList from './TransactionList';
import TransactionsView from './TransactionsView';
import { TreasuryTransactionList } from './TreasuryTransactionList';
import TreasuryView from './TreasuryView';
import UniversalObjectInspector from './UniversalObjectInspector';
import VentureCapitalDesk from './VentureCapitalDesk';
import VentureCapitalDeskView from './VentureCapitalDeskView';
import VerificationReportsView from './VerificationReportsView';
import VirtualAccountForm from './VirtualAccountForm';
import VirtualAccountsDashboard from './VirtualAccountsDashboard';
import VirtualAccountsTable from './VirtualAccountsTable';
import VoiceControl from './VoiceControl';
import WealthTimeline from './WealthTimeline';
import WebhookSimulator from './WebhookSimulator';

// --- Error Boundary ---
interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  constructor(props: ErrorBoundaryProps) { super(props); }
  static getDerivedStateFromError(error: Error) { console.error("ErrorBoundary caught:", error); return { hasError: true }; }
  render() { return this.state.hasError ? <h1>Something went wrong.</h1> : this.props.children; }
}

// --- Layout ---
const SAppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dataContext = useContext(DataContext);

  if (!dataContext) {
    return <div>Error: DataContext not found.</div>;
  }

  const { isLoading, error } = dataContext;

  if (isLoading) {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-950 text-white gap-4">
            <Cpu className="w-16 h-16 text-cyan-400 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-wider">INITIALIZING SOVEREIGN AI NEXUS...</h1>
            <p className="text-gray-400 font-mono">Generating financial universe from quantum foam...</p>
            <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
                <div className="h-2 bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse-fast-x"></div>
            </div>
            <style>{`
                .animate-pulse-fast-x {
                    animation: pulse-x 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse-x {
                    0%, 100% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
  }

  if (error) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-950 text-red-300 gap-4 p-8">
            <AlertTriangle className="w-16 h-16 text-red-500" />
            <h1 className="text-3xl font-bold">SYSTEM INITIALIZATION FAILURE</h1>
            <p className="text-red-400 max-w-md text-center bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                A critical error occurred while generating the initial simulation state from the AI core.
            </p>
            <p className="text-sm font-mono text-gray-500 max-w-xl text-center break-words">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">REINITIALIZE</button>
        </div>
      );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#121212', color: 'white' }}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// --- Wrapper Components for Props ---
const Wrapper = (Component: React.FC<any>, props: any = {}) => {
  const WrappedComponent = () => <Component {...props} />;
  return <WrappedComponent />;
};
const ModalWrapper = (Component: React.FC<any>, props: any = {}) => {
    const [isOpen, setIsOpen] = useState(true);
    const WrappedComponent = () => <Component isOpen={isOpen} onClose={() => setIsOpen(false)} {...props} />;
    return <WrappedComponent />;
};
const DataContextWrapper = (Component: React.FC<any>, extraProps: any = {}) => {
    const dataContext = useContext(DataContext);
    const mockContext = { 
        setActiveView: () => {}, 
        impactData: { treesPlanted: 0, progressToNextTree: 0 },
    };
    const props = { ...(dataContext || mockContext), ...extraProps };
    const WrappedComponent = () => <Component {...props} />;
    return <WrappedComponent />;
};

const theme = createTheme({ palette: { mode: 'dark' } });

// --- Main App Component ---
export function SApp() {
  const mockPlaidClient = new PlaidClient();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <StripeDataProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Router>
                <Routes>
                  <Route path="/login" element={<LoginView />} />
                  <Route path="/sso" element={<SSOView />} />
                  <Route element={<SAppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    
                    {/* Dynamically Generated Routes */}
                    <Route path="/account-details" element={Wrapper(AccountDetails, { accountId: '1', customerId: 'c1' })} />
                    <Route path="/account-list" element={Wrapper(AccountList, { accounts: [] })} />
                    <Route path="/accounts-dashboard" element={<AccountsDashboardView />} />
                    <Route path="/account-statement-grid" element={Wrapper(AccountStatementGrid, { statementLines: [] })} />
                    <Route path="/accounts-view" element={<AccountsView />} />
                    <Route path="/account-verification-modal" element={ModalWrapper(AccountVerificationModal, { externalAccount: {id: '1', verification_status: 'unverified' }, onSuccess: () => {}})} />
                    <Route path="/ach-details-display" element={Wrapper(ACHDetailsDisplay, { details: { routingNumber: '123', realAccountNumber: '456' } })} />
                    <Route path="/ai-ad-studio" element={<AIAdStudioView />} />
                    <Route path="/ai-advisor" element={<AIAdvisorView />} />
                    <Route path="/ai-command-log" element={<AICommandLog />} />
                    <Route path="/ai-insights" element={<AIInsights />} />
                    <Route path="/ai-prediction-widget" element={<AIPredictionWidget />} />
                    <Route path="/algo-trading-lab" element={<AlgoTradingLab />} />
                    <Route path="/api-integration" element={<APIIntegrationView />} />
                    <Route path="/api-playground" element={<ApiPlaygroundView />} />
                    <Route path="/art-collectibles" element={<ArtCollectibles />} />
                    <Route path="/asset-catalog" element={Wrapper(AssetCatalog, { assets: [], onAssetSelected: () => {}, getAssetDetails: async () => ({}) })} />
                    <Route path="/automated-sweep-rules" element={<AutomatedSweepRules />} />
                    <Route path="/balance-report-chart" element={Wrapper(BalanceReportChart, { data: [] })} />
                    <Route path="/balance-transaction-table" element={Wrapper(BalanceTransactionTable, { balanceTransactions: [] })} />
                    <Route path="/budgets" element={<BudgetsView />} />
                    <Route path="/card-design-visualizer" element={Wrapper(CardDesignVisualizer, { design: { id: 'd_1', physical_bundle: { features: {} } } })} />
                    <Route path="/cardholder-management" element={<CardholderManagement />} />
                    <Route path="/charge-detail-modal" element={ModalWrapper(ChargeDetailModal, { charge: {id: 'ch_1'}, onClose: () => {}})} />
                    <Route path="/charge-list" element={<ChargeList />} />
                    <Route path="/citibank/account-proxy" element={<CitibankAccountProxyView />} />
                    <Route path="/citibank/accounts" element={<CitibankAccountsView />} />
                    <Route path="/citibank/bill-pay" element={<CitibankBillPayView />} />
                    <Route path="/citibank/cross-border" element={<CitibankCrossBorderView />} />
                    <Route path="/citibank/developer-tools" element={<CitibankDeveloperToolsView />} />
                    <Route path="/citibank/eligibility" element={<CitibankEligibilityView />} />
                    <Route path="/citibank/payees" element={Wrapper(CitibankPayeeManagementView, { onSelectPayee: () => {}, onAddPayee: () => {} })} />
                    <Route path="/citibank/standing-instructions" element={<CitibankStandingInstructionsView />} />
                    <Route path="/citibank/unmasked-data" element={Wrapper(CitibankUnmaskedDataView, { accountIdsToUnmask: ['acc_1'] })} />
                    <Route path="/commodities-exchange" element={<CommoditiesExchange />} />
                    <Route path="/compliance-alert-card" element={Wrapper(ComplianceAlertCard, { alertId: '1', transactionDetails: {debtor: {}, creditor: {}}})} />
                    <Route path="/compliance-oracle" element={<ComplianceOracleView />} />
                    <Route path="/concierge-service" element={<ConciergeService />} />
                    <Route path="/conductor-configuration-view" element={<ConductorConfigurationView />} />
                    <Route path="/corporate-actions" element={<CorporateActionsNexusView />} />
                    <Route path="/corporate-command" element={DataContextWrapper(CorporateCommandView)} />
                    <Route path="/counterparty-dashboard" element={<CounterpartyDashboardView />} />
                    <Route path="/counterparty-details" element={Wrapper(CounterpartyDetails, { counterpartyId: 'cp_1' })} />
                    <Route path="/counterparty-form" element={Wrapper(CounterpartyForm, { counterparties: [], onSubmit: () => {}, onCancel: () => {} })} />
                    <Route path="/counterparty-list" element={<CounterpartyList />} />
                    <Route path="/credit-health" element={<CreditHealthView />} />
                    <Route path="/credit-notes" element={<CreditNoteLedger />} />
                    <Route path="/crypto" element={<CryptoView />} />
                    <Route path="/customer-dashboard" element={<CustomerDashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/deal-flow" element={<DealFlow />} />
                    <Route path="/derivatives-desk" element={<DerivativesDesk />} />
                    <Route path="/developer-hub" element={<DeveloperHubView />} />
                    <Route path="/disruption-index-meter" element={Wrapper(DisruptionIndexMeter, { indexValue: 50 })} />
                    <Route path="/document-uploader" element={Wrapper(DocumentUploader, { documentableType: 'test', documentableId: '1' })} />
                    <Route path="/download-link" element={Wrapper(DownloadLink, { url: '#', filename: 'test.pdf' })} />
                    <Route path="/early-fraud-warning-feed" element={<EarlyFraudWarningFeed />} />
                    <Route path="/election-choice-form" element={Wrapper(ElectionChoiceForm, { availableChoices: {}, onSubmit: () => {}, onCancel: () => {} })} />
                    <Route path="/event-notification-card" element={Wrapper(EventNotificationCard, { event: {} })} />
                    <Route path="/expected-payments-table" element={<ExpectedPaymentsTable />} />
                    <Route path="/external-account-card" element={Wrapper(ExternalAccountCard, { account: {id: '1', account_details: [], routing_details: []}})} />
                    <Route path="/external-account-form" element={Wrapper(ExternalAccountForm, { counterparties: [], onSubmit: () => {}, onCancel: () => {} })} />
                    <Route path="/external-accounts-table" element={Wrapper(ExternalAccountsTable, { accounts: [] })} />
                    <Route path="/financial-account-card" element={Wrapper(FinancialAccountCard, { financialAccount: {id: 'fa_1', balance: { cash: {}}, supported_currencies: []}})} />
                    <Route path="/financial-democracy" element={<FinancialDemocracyView />} />
                    <Route path="/financial-goals" element={<FinancialGoalsView />} />
                    <Route path="/financial-reporting" element={<FinancialReportingView />} />
                    <Route path="/forex-arena" element={<ForexArena />} />
                    <Route path="/gein-dashboard" element={<GEIN_DashboardView />} />
                    <Route path="/global-market-map" element={<GlobalMarketMap />} />
                    <Route path="/global-position-map" element={<GlobalPositionMap />} />
                    <Route path="/global-ssi-hub" element={<GlobalSsiHubView />} />
                    <Route path="/identity" element={<IdentityView />} />
                    <Route path="/impact-tracker" element={DataContextWrapper(ImpactTracker, { treesPlanted: 123, progress: 50 })} />
                    <Route path="/incoming-payment-detail-list" element={<IncomingPaymentDetailList />} />
                    <Route path="/investment-form" element={<InvestmentForm />} />
                    <Route path="/investment-portfolio" element={<InvestmentPortfolio />} />
                    <Route path="/investments" element={<InvestmentsView />} />
                    <Route path="/invoice-financing-request" element={Wrapper(InvoiceFinancingRequest, { onSubmit: () => {} })} />
                    <Route path="/legacy-builder" element={<LegacyBuilder />} />
                    <Route path="/marketplace" element={<MarketplaceView />} />
                    <Route path="/marqeta-dashboard" element={<MarqetaDashboardView />} />
                    <Route path="/modern-treasury" element={<ModernTreasuryView />} />
                    <Route path="/open-banking" element={<OpenBankingView />} />
                    <Route path="/payment-initiation-form" element={<PaymentInitiationForm />} />
                    <Route path="/payment-method-details" element={Wrapper(PaymentMethodDetails, { details: { type: 'card', card: {} }})} />
                    <Route path="/payment-order-form" element={Wrapper(PaymentOrderForm, { internalAccounts: [], externalAccounts: [], onSubmit: () => {}, onCancel: () => {} })} />
                    <Route path="/payouts-dashboard" element={<PayoutsDashboard />} />
                    <Route path="/personalization" element={<PersonalizationView />} />
                    <Route path="/philanthropy-hub" element={<PhilanthropyHub />} />
                    <Route path="/plaid/cra-monitoring" element={<PlaidCRAMonitoringView />} />
                    <Route path="/plaid-dashboard" element={<PlaidDashboardView />} />
                    <Route path="/plaid/identity" element={<PlaidIdentityView />} />
                    <Route path="/plaid/institutions" element={Wrapper(PlaidInstitutionsExplorer, { client: mockPlaidClient })} />
                    <Route path="/plaid/item-management" element={Wrapper(PlaidItemManagementView, { accessToken: 'test-token' })} />
                    <Route path="/plaid/main-dashboard" element={<PlaidMainDashboard />} />
                    <Route path="/pnl-chart" element={Wrapper(PnLChart, { data: [], algorithmName: 'Test' })} />
                    <Route path="/portfolio-company-details" element={Wrapper(PortfolioCompanyDetails, { companyId: 'comp_1' })} />
                    <Route path="/portfolio-company-list" element={Wrapper(PortfolioCompanyList, { onSelectCompany: () => {} })} />
                    <Route path="/private-equity-lounge" element={<PrivateEquityLounge />} />
                    <Route path="/quantum-assets" element={<QuantumAssets />} />
                    <Route path="/quantum-weaver" element={<QuantumWeaverView />} />
                    <Route path="/real-estate-empire" element={<RealEstateEmpire />} />
                    <Route path="/recent-transactions" element={DataContextWrapper(RecentTransactions, { transactions: []})} />
                    <Route path="/reconciliation-hub" element={<ReconciliationHubView />} />
                    <Route path="/refund-form" element={<RefundForm />} />
                    <Route path="/remittance-info-editor" element={Wrapper(RemittanceInfoEditor, { onChange: () => {} })} />
                    <Route path="/reporting-view" element={<ReportingView />} />
                    <Route path="/report-run-generator" element={<ReportRunGenerator />} />
                    <Route path="/report-status-indicator" element={Wrapper(ReportStatusIndicator, { status: 'success' })} />
                    <Route path="/resource-graph" element={<ResourceGraphView />} />
                    <Route path="/schema-explorer" element={Wrapper(SchemaExplorer, { schemaData: { definitions: {}, properties: {} } })} />
                    <Route path="/security-compliance" element={<SecurityComplianceView />} />
                    <Route path="/security" element={<SecurityView />} />
                    <Route path="/send-money" element={DataContextWrapper(SendMoneyView)} />
                    <Route path="/settings" element={<SettingsView />} />
                    <Route path="/sovereign-wealth" element={<SovereignWealth />} />
                    <Route path="/spending-analysis-chart" element={Wrapper(SpendingAnalysisChart, { transactions: [] })} />
                    <Route path="/ssi-editor-form" element={Wrapper(SsiEditorForm, { onSubmit: () => {}, onCancel: () => {} })} />
                    <Route path="/strategy-editor" element={<StrategyEditor />} />
                    <Route path="/stripe-dashboard" element={<StripeDashboardView />} />
                    <Route path="/stripe-nexus-dashboard" element={<StripeNexusDashboard />} />
                    <Route path="/stripe-nexus-view" element={<StripeNexusView />} />
                    <Route path="/stripe-status-badge" element={Wrapper(StripeStatusBadge, { status: 'succeeded', objectType: 'charge' })} />
                    <Route path="/structured-purpose-input" element={Wrapper(StructuredPurposeInput, { onChange: () => {}, value: null })} />
                    <Route path="/subscription-list" element={Wrapper(SubscriptionList, { subscriptions: [] })} />
                    <Route path="/tax-optimization-chamber" element={<TaxOptimizationChamber />} />
                    <Route path="/the-vision" element={<TheVisionView />} />
                    <Route path="/time-series-chart" element={Wrapper(TimeSeriesChart, { data: { labels: [], datasets: [] } })} />
                    <Route path="/trade-confirmation-modal" element={ModalWrapper(TradeConfirmationModal, { settlementInstruction: { messageId: '1' } })} />
                    <Route path="/transaction-filter" element={Wrapper(TransactionFilter, { onApplyFilters: () => {} })} />
                    <Route path="/transaction-list" element={Wrapper(TransactionList, { transactions: [] })} />
                    <Route path="/transactions" element={<TransactionsView />} />
                    <Route path="/treasury-transaction-list" element={Wrapper(TreasuryTransactionList, { transactions: [] })} />
                    <Route path="/treasury" element={<TreasuryView />} />
                    <Route path="/universal-object-inspector" element={Wrapper(UniversalObjectInspector, { data: { sample: 'data' } })} />
                    <Route path="/venture-capital-desk" element={<VentureCapitalDesk />} />
                    <Route path="/vc-desk-view" element={<VentureCapitalDeskView />} />
                    <Route path="/verification-reports" element={Wrapper(VerificationReportsView, { customerId: 'cust_1' })} />
                    <Route path="/virtual-account-form" element={Wrapper(VirtualAccountForm, { onSubmit: () => {}, isSubmitting: false })} />
                    <Route path="/virtual-accounts-dashboard" element={<VirtualAccountsDashboard />} />
                    <Route path="/virtual-accounts-table" element={Wrapper(VirtualAccountsTable, { onEdit: () => {}, onDelete: () => {} })} />
                    <Route path="/voice-control" element={DataContextWrapper(VoiceControl)} />
                    <Route path="/wealth-timeline" element={<WealthTimeline />} />
                    <Route path="/webhook-simulator" element={Wrapper(WebhookSimulator, { stripeAccountId: 'acct_mock' })} />

                    <Route path="*" element={<Dashboard />} />
                  </Route>
                </Routes>
              </Router>
            </ThemeProvider>
          </StripeDataProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
