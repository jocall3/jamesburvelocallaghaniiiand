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
    const { isAuthenticated } = useContext(AuthContext)!;

    const features = [
        {
            icon: <Cpu className="w-8 h-8 text-cyan-400" />,
            title: "Wisdom-Guided Quests",
            description: "Use our friendly guide to navigate life's challenges and discover paths to providing for your family.",
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
            title: "Your Family's Sanctuary",
            description: "Your progress and dreams are kept safe and sound, just for you and your family.",
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M2 8c0-2.2.7-4.3 2-6"></path><path d="M22 8c0-2.2-.7-4.3-2-6"></path></svg>,
            title: "Learn from Everyone",
            description: "Connect your real-life progress to learn from the shared wisdom of families everywhere.",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center relative overflow-hidden p-4">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                backgroundSize: '2rem 2rem',
            }}></div>
            
            {/* Animated Gradient Blobs */}
            <div className="absolute top-0 -left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-1/4 w-96 h-96 bg-cyan-600 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="z-10 text-center max-w-5xl flex flex-col items-center">
                <Cpu className="w-20 h-20 md:w-24 md:h-24 text-cyan-400 mb-6 animate-pulse" />
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                    The Provider's Journey
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl">
                    Boundless Wisdom. Family Prosperity. The game that teaches you how to provide.
                </p>
                
                {isAuthenticated ? (
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white text-lg font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
                    >
                        Enter Dashboard
                    </button>
                ) : (
                    <button 
                        onClick={() => navigate('/login')}
                        className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white text-lg font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
                    >
                        Start Your Journey
                    </button>
                )}

                {/* Feature Highlights */}
                <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 flex flex-col items-center text-center transform transition-all hover:scale-105 hover:border-cyan-400/50">
                            <div className="mb-4 p-3 bg-gray-800 rounded-full">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: -2s;
                }
                .animation-delay-4000 {
                    animation-delay: -4s;
                }
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
            `}</style>
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
            <h1 className="text-2xl font-bold tracking-wider">AWAKENING ANCIENT WISDOM...</h1>
            <p className="text-gray-400 font-mono">Preparing Your Journey...</p>
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