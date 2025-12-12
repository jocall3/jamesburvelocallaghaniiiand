import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Cpu, AlertTriangle } from 'lucide-react';

// Contexts
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { DataProvider, DataContext } from '../context/DataContext';
import { StripeDataProvider } from './StripeDataContext';

// Layout
import Sidebar from './Sidebar';
import Header from './Header';
import { View } from '../types';
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
import { LoginView } from './LoginView';
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
import LandingPage from './LandingPage';
import TheBookView from './TheBookView';
import KnowledgeBaseView from './KnowledgeBaseView';

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
  const { isAuthenticated } = useContext(AuthContext)!;

  if (!dataContext) {
    return <div>Error: DataContext not found.</div>;
  }

  const { isLoading, error, activeView, setActiveView } = dataContext;

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
  
  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="w-full flex-grow p-6">
            {/* 
              This section conditionally renders the 'Active View' from DataContext.
              This mimics a single-page app dashboard where the sidebar controls the content area.
            */}
            {activeView === View.Dashboard && <Dashboard />}
            {activeView === View.Transactions && <TransactionsView />}
            {activeView === View.SendMoney && <SendMoneyView setActiveView={setActiveView} />}
            {activeView === View.Budgets && <BudgetsView />}
            {activeView === View.FinancialGoals && <FinancialGoalsView />}
            {activeView === View.CreditHealth && <CreditHealthView />}
            {activeView === View.Investments && <InvestmentsView />}
            {activeView === View.CryptoWeb3 && <CryptoView />}
            {activeView === View.AlgoTradingLab && <AlgoTradingLab />}
            {activeView === View.ForexArena && <ForexArena />}
            {activeView === View.CommoditiesExchange && <CommoditiesExchange />}
            {activeView === View.RealEstateEmpire && <RealEstateEmpire />}
            {activeView === View.ArtCollectibles && <ArtCollectibles />}
            {activeView === View.DerivativesDesk && <DerivativesDesk />}
            {activeView === View.VentureCapital && <VentureCapitalDesk />}
            {activeView === View.PrivateEquity && <PrivateEquityLounge />}
            {activeView === View.TaxOptimization && <TaxOptimizationChamber />}
            {activeView === View.LegacyBuilder && <LegacyBuilder />}
            {activeView === View.CorporateCommand && <CorporateCommandView setActiveView={setActiveView} />}
            {activeView === View.ModernTreasury && <ModernTreasuryView />}
            {activeView === View.OpenBanking && <OpenBankingView />}
            {activeView === View.FinancialDemocracy && <FinancialDemocracyView />}
            {activeView === View.AIAdStudio && <AIAdStudioView />}
            {activeView === View.QuantumWeaver && <QuantumWeaverView />}
            {activeView === View.AgentMarketplace && <MarketplaceView />}
            {activeView === View.APIStatus && <APIIntegrationView />}
            {activeView === View.Settings && <SettingsView />}
            {activeView === View.DataNetwork && <PlaidDashboardView />}
            {activeView === View.Payments && <StripeDashboardView />}
            {activeView === View.CardPrograms && <MarqetaDashboardView />}
            {activeView === View.SSO && <SSOView />}
            {activeView === View.ConciergeService && <ConciergeService />}
            {activeView === View.SovereignWealth && <SovereignWealth />}
            {activeView === View.Philanthropy && <PhilanthropyHub />}
            {activeView === View.Personalization && <PersonalizationView />}
            {activeView === View.TheVision && <TheVisionView />}
            {activeView === View.AIAdvisor && <AIAdvisorView />}
            {activeView === View.SecurityCenter && <SecurityView />}
            
            {/* New Educational Views */}
            {activeView === View.TheBook && <TheBookView />}
            {activeView === View.KnowledgeBase && <KnowledgeBaseView />}
            
            {/* Render component based on route if not covered by activeView switch (fallback) */}
            <Outlet />
        </main>
      </div>
      
      <VoiceControl setActiveView={setActiveView} />
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

// --- Protected Route Helper ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useContext(AuthContext)!;
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

// --- Main App Component ---
function SApp() {
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
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginView />} />
                  <Route path="/sso" element={<SSOView />} />
                  
                  {/* Protected Routes Wrapper */}
                  <Route element={
                      <ProtectedRoute>
                          <SAppLayout />
                      </ProtectedRoute>
                  }>
                    {/* The Dashboard is the default view for the app layout */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Dynamically Generated Routes */}
                    <Route path="/account-details" element={Wrapper(AccountDetails, { accountId: '1', customerId: 'c1' })} />
                    <Route path="/account-list" element={Wrapper(AccountList, { accounts: [] })} />
                    <Route path="/accounts-dashboard" element={<AccountsDashboardView />} />
                    
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

export default SApp;