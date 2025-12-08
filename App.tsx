import React, { useState, useContext, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Cpu, AlertTriangle } from 'lucide-react';

// Contexts
import { AuthProvider, AuthContext } from './context/AuthContext';
import { DataProvider, DataContext } from './context/DataContext';
import { StripeDataProvider } from './components/StripeDataContext';
import { MoneyMovementProvider } from './components/MoneyMovementContext';

// Layout
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { View } from './types';
import { PlaidClient } from './lib/plaidClient';

// --- ALL VIEW COMPONENTS ---
import AccountDetails from './components/AccountDetails';
import AccountList from './components/AccountList';
import AccountsDashboardView from './components/AccountsDashboardView';
import Dashboard from './components/Dashboard';
import { LoginView } from './components/LoginView';
import SSOView from './components/SSOView';
import CitiAuthGate from './components/CitiAuthGate';

// --- Component Registry & Dynamic Loading ---
const modules = import.meta.glob('./components/*.tsx', { eager: true });

const getComponentForView = (view: string) => {
    // 1. Manual Overrides
    const overrides: Record<string, string> = {
        [View.CardPrograms]: 'MarqetaDashboardView',
        [View.Payments]: 'StripeDashboardView',
        [View.StripeNexus]: 'StripeNexusView',
        [View.VentureCapital]: 'VentureCapitalDesk',
        [View.PrivateEquity]: 'PrivateEquityLounge',
        [View.TaxOptimization]: 'TaxOptimizationChamber',
        [View.CryptoWeb3]: 'CryptoView',
        [View.Crypto]: 'CryptoView',
        [View.AgentMarketplace]: 'MarketplaceView',
        [View.APIStatus]: 'APIIntegrationView',
        [View.Philanthropy]: 'PhilanthropyHub',
        [View.Personalization]: 'PersonalizationView',
        [View.TheVision]: 'TheVisionView',
        [View.SecurityCenter]: 'SecurityView',
        [View.Security]: 'SecurityView',
        [View.GlobalPositionMap]: 'GlobalPositionMap',
        [View.GlobalSsiHub]: 'GlobalSsiHubView',
        [View.PlaidMainDashboard]: 'PlaidDashboardView',
        [View.DataNetwork]: 'PlaidDashboardView',
        [View.CorporateActions]: 'CorporateActionsNexusView',
        [View.GEINDashboard]: 'GEIN_DashboardView',
        [View.PlaidInstitutions]: 'PlaidInstitutionsExplorer',
        [View.PlaidItemManagement]: 'PlaidItemManagementView',
        [View.VerificationReports]: 'VerificationReportsView',
        [View.CitibankUnmaskedData]: 'CitibankUnmaskedDataView',
        [View.SchemaExplorer]: 'SchemaExplorer',
        [View.KnowledgeBase]: 'KnowledgeBaseView',
        [View.TheBook]: 'TheBookView',
        [View.FinancialReporting]: 'FinancialReportingView',
        [View.StripeNexusDashboard]: 'StripeNexusDashboard',
        [View.CustomerDashboard]: 'CustomerDashboard',
        [View.OpenBanking]: 'OpenBankingView',
        [View.FinancialDemocracy]: 'FinancialDemocracyView',
        [View.ComplianceOracle]: 'ComplianceOracleView',
        [View.ApiPlayground]: 'ApiPlaygroundView',
        [View.ResourceGraph]: 'ResourceGraphView',
        [View.DeveloperHub]: 'DeveloperHubView',
        [View.SecurityCompliance]: 'SecurityComplianceView',
        [View.AIInsights]: 'AIInsights',
        [View.AIAdvisor]: 'AIAdvisorView',
        [View.ConciergeService]: 'ConciergeService',
        [View.QuantumWeaver]: 'QuantumWeaverView',
        [View.AIAdStudio]: 'AIAdStudioView',
        [View.VentureCapitalDeskView]: 'VentureCapitalDeskView',
        [View.CardholderManagement]: 'CardholderManagement',
        [View.ReconciliationHub]: 'ReconciliationHubView',
        [View.CreditNoteLedger]: 'CreditNoteLedger',
        [View.VirtualAccounts]: 'VirtualAccountsDashboard',
        [View.CounterpartyDashboard]: 'CounterpartyDashboardView',
        [View.ModernTreasury]: 'ModernTreasuryView',
        [View.Treasury]: 'TreasuryView',
        [View.CorporateCommand]: 'CorporateCommandView',
        [View.PlaidCRAMonitoring]: 'PlaidCRAMonitoringView',
        [View.PlaidIdentity]: 'PlaidIdentityView',
        [View.CitibankEligibility]: 'CitibankEligibilityView',
        [View.CitibankDeveloperTools]: 'CitibankDeveloperToolsView',
        [View.CitibankStandingInstructions]: 'CitibankStandingInstructionsView',
        [View.CitibankPayeeManagement]: 'CitibankPayeeManagementView',
        [View.CitibankCrossBorder]: 'CitibankCrossBorderView',
        [View.CitibankBillPay]: 'CitibankBillPayView',
        [View.CitibankAccountProxy]: 'CitibankAccountProxyView',
        [View.CitibankAccounts]: 'CitibankAccountsView',
        [View.QuantumAssets]: 'QuantumAssets',
        [View.SovereignWealth]: 'SovereignWealth',
        [View.LegacyBuilder]: 'LegacyBuilder',
        [View.DerivativesDesk]: 'DerivativesDesk',
        [View.ArtCollectibles]: 'ArtCollectibles',
        [View.RealEstateEmpire]: 'RealEstateEmpire',
        [View.CommoditiesExchange]: 'CommoditiesExchange',
        [View.ForexArena]: 'ForexArena',
        [View.AlgoTradingLab]: 'AlgoTradingLab',
        [View.Investments]: 'InvestmentsView',
        [View.CreditHealth]: 'CreditHealthView',
        [View.FinancialGoals]: 'FinancialGoalsView',
        [View.Budgets]: 'BudgetsView',
        [View.SendMoney]: 'SendMoneyView',
        [View.Transactions]: 'TransactionsView',
        [View.Accounts]: 'AccountsView',
        [View.Dashboard]: 'Dashboard',
        [View.AccountDetails]: 'AccountDetails',
        [View.AccountList]: 'AccountList',
        [View.AccountsDashboardView]: 'AccountsDashboardView',
    };

    const componentName = overrides[view] || view;

    // 2. Auto-Resolution
    const candidates = [
        `./components/${componentName}.tsx`,
        `./components/${componentName}View.tsx`,
        `./components/${componentName}Dashboard.tsx`,
        `./components/${componentName}DashboardView.tsx`,
    ];

    let Component = null;
    for (const path of candidates) {
        if (modules[path]) {
            Component = (modules[path] as any).default;
            break;
        }
    }

    // 3. Props Injection
    let props: any = {};
    if (view === View.PlaidInstitutions) props = { client: new PlaidClient() };
    if (view === View.VerificationReports) props = { customerId: "cust_1" };
    if (view === View.PlaidItemManagement) props = { accessToken: 'access-sandbox-xxx' };
    if (view === View.CitibankUnmaskedData) props = { accountIdsToUnmask: [] };
    if (view === View.SchemaExplorer) props = { schemaData: { definitions: {}, properties: {} } };

    return { Component, props };
};

// --- Error Boundary ---
interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  
  constructor(props: ErrorBoundaryProps) {
      super(props);
      this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) { console.error("ErrorBoundary caught:", error); return { hasError: true }; }
  
  render() { return this.state.hasError ? <h1>Something went wrong.</h1> : this.props.children; }
}

// --- Protected Route ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useContext(AuthContext)!;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// --- Enhanced Landing Page ---
const EnhancedLandingPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0"></div>
            <div className="z-10 text-center px-4 max-w-4xl flex flex-col items-center">
                <Cpu className="w-24 h-24 text-cyan-400 mb-8 animate-pulse" />
                <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
                    The 527 Protocol
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl">
                    Infinite Intelligence. Sovereign Wealth. The future of financial orchestration.
                </p>
                <button 
                    onClick={() => navigate('/login')}
                    className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white text-lg font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
                >
                    Get Started
                </button>
            </div>
        </div>
    );
};

// --- Layout ---
const SAppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dataContext = useContext(DataContext);
  const { isAuthenticated, logout } = useContext(AuthContext)!;

  if (!dataContext) {
    return <div>Error: DataContext not found.</div>;
  }

  const { isLoading, error, activeView, setActiveView } = dataContext;

  if (isLoading) {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-950 text-white gap-4">
            <Cpu className="w-16 h-16 text-cyan-400 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-wider">INITIALIZING INFINITE INTELLIGENCE...</h1>
            <p className="text-gray-400 font-mono">Loading The 527 Protocol...</p>
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

  const { Component, props } = getComponentForView(activeView);
  const finalProps = { setActiveView, ...props };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden font-sans">
      <button 
        onClick={logout} 
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-lg transition-colors"
      >
        Log Out
      </button>

      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="w-full flex-grow p-6">
            {Component ? (
                (typeof activeView === 'string' && activeView.startsWith('Citibank')) ? (
                    <CitiAuthGate>
                        <Component {...finalProps} />
                    </CitiAuthGate>
                ) : (
                    <Component {...finalProps} />
                )
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <AlertTriangle className="w-12 h-12 mb-4" />
                    <p>Component not found for view: {activeView}</p>
                </div>
            )}
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

const theme = createTheme({ palette: { mode: 'dark' } });

// --- Main App Component ---
function SApp() {
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
                    <Route path="/" element={<EnhancedLandingPage />} />
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