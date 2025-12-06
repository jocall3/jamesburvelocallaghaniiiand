import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

// Layouts
import RootLayout from './layouts/RootLayout';
import AuthLayout from './layouts/AuthLayout';

// Providers
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages / Views
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TransactionsView from './components/TransactionsView';
import SendMoneyView from './components/SendMoneyView';
import InvestmentsView from './components/InvestmentsView';
import AIAdvisorView from './components/AIAdvisorView';
import SecurityView from './components/SecurityView';
import BudgetsView from './components/BudgetsView';
import QuantumWeaverView from './components/QuantumWeaverView';
import MarketplaceView from './components/MarketplaceView';
import CorporateCommandView from './components/CorporateCommandView';
import ModernTreasuryView from './components/ModernTreasuryView';
import OpenBankingView from './components/OpenBankingView';
import FinancialDemocracyView from './components/FinancialDemocracyView';
import AIAdStudioView from './components/AIAdStudioView';
import CryptoView from './components/CryptoView';
import FinancialGoalsView from './components/FinancialGoalsView';
import CreditHealthView from './components/CreditHealthView';
import AlgoTradingLab from './components/AlgoTradingLab';
import ForexArena from './components/ForexArena';
import CommoditiesExchange from './components/CommoditiesExchange';
import RealEstateEmpire from './components/RealEstateEmpire';
import ArtCollectibles from './components/ArtCollectibles';
import ConciergeService from './components/ConciergeService';
import DerivativesDesk from './components/DerivativesDesk';
import VentureCapitalDesk from './components/VentureCapitalDesk';
import PrivateEquityLounge from './components/PrivateEquityLounge';
import TaxOptimizationChamber from './components/TaxOptimizationChamber';
import LegacyBuilder from './components/LegacyBuilder';
import SovereignWealth from './components/SovereignWealth';
import PhilanthropyHub from './components/PhilanthropyHub';
import APIIntegrationView from './components/APIIntegrationView';
import SettingsView from './components/SettingsView';
import PlaidDashboardView from './components/PlaidDashboardView';
import StripeDashboardView from './components/StripeDashboardView';
import MarqetaDashboardView from './components/MarqetaDashboardView';
import SSOView from './components/SSOView';
import PersonalizationView from './components/PersonalizationView';
import TheVisionView from './components/TheVisionView';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'transactions', element: <TransactionsView /> },
      { path: 'send-money', element: <SendMoneyView /> },
      { path: 'budgets', element: <BudgetsView /> },
      { path: 'financial-goals', element: <FinancialGoalsView /> },
      { path: 'credit-health', element: <CreditHealthView /> },
      { path: 'investments', element: <InvestmentsView /> },
      { path: 'crypto-web3', element: <CryptoView /> },
      { path: 'algo-trading-lab', element: <AlgoTradingLab /> },
      { path: 'forex-arena', element: <ForexArena /> },
      { path: 'commodities-exchange', element: <CommoditiesExchange /> },
      { path: 'real-estate-empire', element: <RealEstateEmpire /> },
      { path: 'art-collectibles', element: <ArtCollectibles /> },
      { path: 'derivatives-desk', element: <DerivativesDesk /> },
      { path: 'venture-capital', element: <VentureCapitalDesk /> },
      { path: 'private-equity', element: <PrivateEquityLounge /> },
      { path: 'tax-optimization', element: <TaxOptimizationChamber /> },
      { path: 'legacy-builder', element: <LegacyBuilder /> },
      { path: 'corporate-command', element: <CorporateCommandView /> },
      { path: 'modern-treasury', element: <ModernTreasuryView /> },
      { path: 'open-banking', element: <OpenBankingView /> },
      { path: 'financial-democracy', element: <FinancialDemocracyView /> },
      { path: 'ai-ad-studio', element: <AIAdStudioView /> },
      { path: 'quantum-weaver', element: <QuantumWeaverView /> },
      { path: 'agent-marketplace', element: <MarketplaceView /> },
      { path: 'api-status', element: <APIIntegrationView /> },
      { path: 'settings', element: <SettingsView /> },
      { path: 'data-network', element: <PlaidDashboardView /> },
      { path: 'payments', element: <StripeDashboardView /> },
      { path: 'card-programs', element: <MarqetaDashboardView /> },
      { path: 'sso', element: <SSOView /> },
      { path: 'concierge-service', element: <ConciergeService /> },
      { path: 'sovereign-wealth', element: <SovereignWealth /> },
      { path: 'philanthropy', element: <PhilanthropyHub /> },
      { path: 'personalization', element: <PersonalizationView /> },
      { path: 'the-vision', element: <TheVisionView /> },
      { path: 'ai-advisor', element: <AIAdvisorView /> },
      { path: 'security-center', element: <SecurityView /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default function SApp() {
  return (
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  );
}