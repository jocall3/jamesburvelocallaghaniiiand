
import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Cpu, AlertTriangle } from 'lucide-react';

// Contexts
import { AuthProvider, AuthContext } from './context/AuthContext';
import { DataProvider, DataContext } from './context/DataContext';
import { StripeDataProvider } from './components/StripeDataContext';

// Layout
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { View } from './types';
import { PlaidClient } from './lib/plaidClient';


// --- ALL VIEW COMPONENTS ---
import AccountDetails from './components/AccountDetails';
import AccountList from './components/AccountList';
import AccountsDashboardView from './components/AccountsDashboardView';
import AccountStatementGrid from './components/AccountStatementGrid';
import AccountsView from './components/AccountsView';
import { AccountVerificationModal } from './components/AccountVerificationModal';
import ACHDetailsDisplay from './components/ACHDetailsDisplay';
import AIAdStudioView from './components/AIAdStudioView';
import AIAdvisorView from './components/AIAdvisorView';
import AICommandLog from './components/AICommandLog';
import { AIInsights } from './components/AIInsights';
import AIPredictionWidget from './components/AIPredictionWidget';
import AlgoTradingLab from './components/AlgoTradingLab';
import APIIntegrationView from './components/APIIntegrationView';
import ApiPlaygroundView from './components/ApiPlaygroundView';
import ArtCollectibles from './components/ArtCollectibles';
import AssetCatalog from './components/AssetCatalog';
import AutomatedSweepRules from './components/AutomatedSweepRules';
import BalanceReportChart from './components/BalanceReportChart';
import BalanceTransactionTable from './components/BalanceTransactionTable';
import BudgetsView from './components/BudgetsView';
import CardDesignVisualizer from './components/CardDesignVisualizer';
import CardholderManagement from './components/CardholderManagement';
import { ChargeDetailModal } from './components/ChargeDetailModal';
import ChargeList from './components/ChargeList';
import CitibankAccountProxyView from './components/CitibankAccountProxyView';
import CitibankAccountsView from './components/CitibankAccountsView';
import CitibankBillPayView from './components/CitibankBillPayView';
import CitibankCrossBorderView from './components/CitibankCrossBorderView';
import CitibankDeveloperToolsView from './components/CitibankDeveloperToolsView';
import CitibankEligibilityView from './components/CitibankEligibilityView';
import CitibankPayeeManagementView from './components/CitibankPayeeManagementView';
import CitibankStandingInstructionsView from './components/CitibankStandingInstructionsView';
import CitibankUnmaskedDataView from './components/CitibankUnmaskedDataView';
import CommoditiesExchange from './components/CommoditiesExchange';
import ComplianceAlertCard from './components/ComplianceAlertCard';
import { ComplianceOracleView } from './components/ComplianceOracleView';
import ConciergeService from './components/ConciergeService';
import ConductorConfigurationView from './components/ConductorConfigurationView';
import CorporateActionsNexusView from './components/CorporateActionsNexusView';
import CorporateCommandView from './components/CorporateCommandView';
import CounterpartyDashboardView from './components/CounterpartyDashboardView';
import CounterpartyDetails from './components/CounterpartyDetails';
import { CounterpartyForm } from './components/CounterpartyForm';
import CounterpartyList from './components/CounterpartyList';
import CreditHealthView from './components/CreditHealthView';
import { CreditNoteLedger } from './components/CreditNoteLedger';
import CryptoView from './components/CryptoView';
import CustomerDashboard from './components/CustomerDashboard';
import Dashboard from './components/Dashboard';
import { DealFlow } from './components/DealFlow';
import DerivativesDesk from './components/DerivativesDesk';
import DeveloperHubView from './components/DeveloperHubView';
import DisruptionIndexMeter from './components/DisruptionIndexMeter';
import DocumentUploader from './components/DocumentUploader';
import { DownloadLink } from './components/DownloadLink';
import EarlyFraudWarningFeed from './components/EarlyFraudWarningFeed';
import ElectionChoiceForm from './components/ElectionChoiceForm';
import EventNotificationCard from './components/EventNotificationCard';
import ExpectedPaymentsTable from './components/ExpectedPaymentsTable';
import ExternalAccountCard from './components/ExternalAccountCard';
import ExternalAccountForm from './components/ExternalAccountForm';
import ExternalAccountsTable from './components/ExternalAccountsTable';
import { FinancialAccountCard } from './components/FinancialAccountCard';
import FinancialDemocracyView from './components/FinancialDemocracyView';
import FinancialGoalsView from './components/FinancialGoalsView';
import FinancialReportingView from './components/FinancialReportingView';
import ForexArena from './components/ForexArena';
import GEIN_DashboardView from './components/GEIN_DashboardView';
import GlobalMarketMap from './components/GlobalMarketMap';
import GlobalPositionMap from './components/GlobalPositionMap';
import GlobalSsiHubView from './components/GlobalSsiHubView';
import IdentityView from './components/IdentityView';
import ImpactTracker from './components/ImpactTracker';
import IncomingPaymentDetailList from './components/IncomingPaymentDetailList';
import { InvestmentForm } from './components/InvestmentForm';
import InvestmentPortfolio from './components/InvestmentPortfolio';
import InvestmentsView from './components/InvestmentsView';
import InvoiceFinancingRequest from './components/InvoiceFinancingRequest';
import LegacyBuilder from './components/LegacyBuilder';
import { LoginView } from './components/LoginView';
import MarketplaceView from './components/MarketplaceView';
import MarqetaDashboardView from './components/MarqetaDashboardView';
import ModernTreasuryView from './components/ModernTreasuryView';
import OpenBankingView from './components/OpenBankingView';
import PaymentInitiationForm from './components/PaymentInitiationForm';
import PaymentMethodDetails from './components/PaymentMethodDetails';
import PaymentOrderForm from './components/PaymentOrderForm';
import PayoutsDashboard from './components/PayoutsDashboard';
import PersonalizationView from './components/PersonalizationView';
import PhilanthropyHub from './components/PhilanthropyHub';
import PlaidCRAMonitoringView from './components/PlaidCRAMonitoringView';
import PlaidDashboardView from './components/PlaidDashboardView';
import PlaidIdentityView from './components/PlaidIdentityView';
import { PlaidInstitutionsExplorer } from './components/PlaidInstitutionsExplorer';
import { PlaidItemManagementView } from './components/PlaidItemManagementView';
import PlaidMainDashboard from './components/PlaidMainDashboard';
import PnLChart from './components/PnLChart';
import { PortfolioCompanyDetails } from './components/PortfolioCompanyDetails';
import { PortfolioCompanyList } from './components/PortfolioCompanyList';
import PrivateEquityLounge from './components/PrivateEquityLounge';
import QuantumAssets from './components/QuantumAssets';
import QuantumWeaverView from './components/QuantumWeaverView';
import RealEstateEmpire from './components/RealEstateEmpire';
import RecentTransactions from './components/RecentTransactions';
import ReconciliationHubView from './components/ReconciliationHubView';
import RefundForm from './components/RefundForm';
import RemittanceInfoEditor from './components/RemittanceInfoEditor';
import ReportingView from './components/ReportingView';
import { ReportRunGenerator } from './components/ReportRunGenerator';
import ReportStatusIndicator from './components/ReportStatusIndicator';
import ResourceGraphView from './components/ResourceGraphView';
import SchemaExplorer from './components/SchemaExplorer';
import SecurityComplianceView from './components/SecurityComplianceView';
import SecurityView from './components/SecurityView';
import SendMoneyView from './components/SendMoneyView';
import SettingsView from './components/SettingsView';
import SovereignWealth from './components/SovereignWealth';
import SpendingAnalysisChart from './components/SpendingAnalysisChart';
import SsiEditorForm from './components/SsiEditorForm';
import SSOView from './components/SSOView';
import StrategyEditor from './components/StrategyEditor';
import StripeDashboardView from './components/StripeDashboardView';
import StripeNexusDashboard from './components/StripeNexusDashboard';
import StripeNexusView from './components/StripeNexusView';
import StripeStatusBadge from './components/StripeStatusBadge';
import StructuredPurposeInput from './components/StructuredPurposeInput';
import SubscriptionList from './components/SubscriptionList';
import TaxOptimizationChamber from './components/TaxOptimizationChamber';
import TheVisionView from './components/TheVisionView';
import TimeSeriesChart from './components/TimeSeriesChart';
import TradeConfirmationModal from './components/TradeConfirmationModal';
import TransactionFilter from './components/TransactionFilter';
import TransactionList from './components/TransactionList';
import TransactionsView from './components/TransactionsView';
import { TreasuryTransactionList } from './components/TreasuryTransactionList';
import TreasuryView from './components/TreasuryView';
import UniversalObjectInspector from './components/UniversalObjectInspector';
import VentureCapitalDesk from './components/VentureCapitalDesk';
import VentureCapitalDeskView from './components/VentureCapitalDeskView';
import VerificationReportsView from './components/VerificationReportsView';
import VirtualAccountForm from './components/VirtualAccountForm';
import VirtualAccountsDashboard from './components/VirtualAccountsDashboard';
import VirtualAccountsTable from './components/VirtualAccountsTable';
import VoiceControl from './components/VoiceControl';
import WealthTimeline from './components/WealthTimeline';
import WebhookSimulator from './components/WebhookSimulator';
import LandingPage from './components/LandingPage';
import TheBookView from './components/TheBookView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import CitiAuthGate from './components/CitiAuthGate';

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
            {activeView === View.AIInsights && <AIInsights />}
            {activeView === View.SecurityCenter && <SecurityView />}
            {activeView === View.SecurityCompliance && <SecurityComplianceView />}
            {activeView === View.DeveloperHub && <DeveloperHubView />}
            {activeView === View.SchemaExplorer && <SchemaExplorer schemaData={{ definitions: {}, properties: {} }} />}
            {activeView === View.ResourceGraph && <ResourceGraphView />}
            {activeView === View.ApiPlayground && <ApiPlaygroundView />}
            {activeView === View.ComplianceOracle && <ComplianceOracleView />}
            {activeView === View.OpenBanking && <OpenBankingView />}
            {activeView === View.FinancialDemocracy && <FinancialDemocracyView />}
            {activeView === View.GlobalPositionMap && <GlobalPositionMap />}
            {activeView === View.GlobalSsiHub && <GlobalSsiHubView />}
            {activeView === View.Security && <SecurityView />}

            
            {/* --- ADMIN & TOOLS --- */}
            {activeView === View.CustomerDashboard && <CustomerDashboard />}
            {activeView === View.VerificationReports && <VerificationReportsView customerId="cust_1" />}
            {activeView === View.FinancialReporting && <FinancialReportingView />}
            {activeView === View.StripeNexusDashboard && <StripeNexusDashboard />}
            
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
          <MoneyMovementProvider>
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
          </MoneyMovementProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default SApp;
