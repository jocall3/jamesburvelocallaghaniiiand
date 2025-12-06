
import React, { useContext, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionsView from './components/TransactionsView';
import SendMoneyView from './components/SendMoneyView';
import InvestmentsView from './components/InvestmentsView';
import AIAdvisorView from './components/AIAdvisorView';
import SecurityView from './components/SecurityView';
import BudgetsView from './components/BudgetsView';
import VoiceControl from './components/VoiceControl';
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
import { DataContext } from './context/DataContext';
import { View } from './types';

export default function App() {
  const { activeView, setActiveView } = useContext(DataContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white font-sans">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-center text-cyan-400">Citibank demo business inc</h1>
          <p className="text-gray-400 mb-6 text-center">
            welcome the next generation of coders we will create the best coders in the world that solve humanity's most troubling problems with grace and humility and a funny ass way of looking at things always in good faith at arms length
          </p>
          <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="you@example.com"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password"className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                id="password"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
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
        </main>
      </div>
      
      <VoiceControl setActiveView={setActiveView} />
    </div>
  );
}
