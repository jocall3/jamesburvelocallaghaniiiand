import React, { useState, useMemo, useEffect, useCallback } from 'react';

// --- DATA MODELS AND INTERFACES ---

interface Stakeholder {
    id: number;
    name: string;
    shares: number;
    type: 'Founder' | 'Investor' | 'Employee' | 'Option Pool' | 'Advisor';
    equityPercentage: number;
    basis: number;
    vested: number;
    votingRights: boolean;
    antiDilution: 'None' | 'Full Ratchet' | 'Weighted Average';
    liquidationPreference: number;
    lastActivity: string;
}

interface FinancialMetric {
    label: string;
    value: number;
    delta: number;
    trend: 'up' | 'down' | 'flat';
    prefix?: string;
    suffix?: string;
    aiProjection: number;
}

interface AIInsight {
    id: number;
    category: 'Risk' | 'Opportunity' | 'Compliance' | 'Strategy' | 'Market';
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    message: string;
    timestamp: string;
    actionable: boolean;
}

interface Document {
    id: number;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    status: 'Verified' | 'Pending' | 'Flagged' | 'Archived';
    accessLevel: 'Admin' | 'Board' | 'Public' | 'Restricted';
    version: string;
    lastAccessed: string;
    aiSummary: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    keyClauses: string[];
}

interface ChatMessage {
    id: number;
    sender: 'User' | 'System_AI';
    text: string;
    timestamp: Date;
    isThinking?: boolean;
}

interface PortfolioCompany {
    id: number;
    name: string;
    sector: string;
    valuation: number;
    revenue: number;
    ebitda: number;
    ownership: number;
    health: 'Healthy' | 'Concern' | 'Critical';
    trendData: number[];
    burnRate: number;
    cac: number;
    esgScore: number;
}

interface Deal {
    id: number;
    name: string;
    stage: 'Sourcing' | 'Diligence' | 'Term Sheet' | 'Closing' | 'Passed';
    potential: number; // in millions
    lead: string;
    aiFitScore: number;
    source: string;
}

interface ComplianceTask {
    id: number;
    title: string;
    dueDate: string;
    status: 'Completed' | 'In Progress' | 'Pending' | 'Overdue';
    priority: 'High' | 'Medium' | 'Low';
    owner: string;
    automationStatus: 'Automated' | 'Manual' | 'Hybrid';
}

interface MarketSignal {
    id: number;
    source: string;
    headline: string;
    impact: 'Positive' | 'Negative' | 'Neutral';
    relevance: number;
    timestamp: string;
}

interface RiskFactor {
    id: number;
    category: 'Market' | 'Operational' | 'Geopolitical' | 'Regulatory';
    description: string;
    probability: number;
    impact: number;
    mitigationPlan: string;
}

interface ESGMetric {
    companyId: number;
    environmental: { score: number; details: string; };
    social: { score: number; details: string; };
    governance: { score: number; details: string; };
    overallScore: number;
}

interface FundMetric {
    name: string;
    value: string;
    description: string;
}

// --- MOCK DATA ---

const mockStakeholders: Stakeholder[] = [
    { id: 1, name: "Prosperity Fund A (PFS)", shares: 4500000, type: 'Investor', equityPercentage: 45.00, basis: 50000000, vested: 100, votingRights: true, antiDilution: 'Weighted Average', liquidationPreference: 1.5, lastActivity: '2 weeks ago' },
    { id: 2, name: "Alice Founder", shares: 2500000, type: 'Founder', equityPercentage: 25.00, basis: 10000, vested: 85, votingRights: true, antiDilution: 'None', liquidationPreference: 1.0, lastActivity: '3 hours ago' },
    { id: 3, name: "Bob Co-Founder", shares: 1500000, type: 'Founder', equityPercentage: 15.00, basis: 10000, vested: 85, votingRights: true, antiDilution: 'None', liquidationPreference: 1.0, lastActivity: '1 day ago' },
    { id: 4, name: "Employee Pool (Vested)", shares: 1000000, type: 'Employee', equityPercentage: 10.00, basis: 0, vested: 100, votingRights: false, antiDilution: 'None', liquidationPreference: 1.0, lastActivity: 'N/A' },
    { id: 5, name: "Future Options Pool", shares: 500000, type: 'Option Pool', equityPercentage: 5.00, basis: 0, vested: 0, votingRights: false, antiDilution: 'None', liquidationPreference: 1.0, lastActivity: 'N/A' },
    { id: 6, name: "Strategic Advisor Group", shares: 100000, type: 'Advisor', equityPercentage: 1.00, basis: 0, vested: 50, votingRights: false, antiDilution: 'None', liquidationPreference: 1.0, lastActivity: '1 month ago' },
];

const initialDocuments: Document[] = [
    { id: 1, name: "Series A Term Sheet.pdf", type: "PDF", size: "2.4 MB", uploadDate: "2023-10-15", status: "Verified", accessLevel: "Board", version: "v3.1 Final", lastAccessed: "2024-03-10 by A. Smith", aiSummary: "Outlines a $50M raise at a $100M pre-money valuation, with 1x liquidation preference and standard protective provisions.", sentiment: 'Neutral', keyClauses: ['Liquidation Preference: 1.0x', 'Anti-Dilution: Weighted Average', 'Board Seat: 1 for Series A lead'] },
    { id: 2, name: "Q3 Financial Audit.xlsx", type: "XLSX", size: "4.1 MB", uploadDate: "2023-11-02", status: "Verified", accessLevel: "Admin", version: "v1.0", lastAccessed: "2024-03-11 by C. Lee", aiSummary: "Presents audited financials for Q3 2023, showing 8.2% QoQ revenue growth and a slight increase in burn rate.", sentiment: 'Positive', keyClauses: ['Revenue Growth: 8.2% QoQ', 'Net Loss: $1.2M', 'Cash on Hand: $21M'] },
    { id: 3, name: "IP Assignment Agreements.zip", type: "ZIP", size: "15.0 MB", uploadDate: "2023-09-01", status: "Flagged", accessLevel: "Admin", version: "v1.2", lastAccessed: "2024-02-28 by AI Scanner", aiSummary: "AI Flag: Missing signature from a key engineer on one of the core IP assignment documents. Requires immediate review.", sentiment: 'Negative', keyClauses: ['Missing Signature: J. Doe', 'Core IP: "Quantum Core" algorithm'] },
    { id: 4, name: "Board Meeting Minutes Oct.docx", type: "DOCX", size: "1.2 MB", uploadDate: "2023-10-28", status: "Pending", accessLevel: "Board", version: "v0.9 Draft", lastAccessed: "2024-03-09 by B. Co-Founder", aiSummary: "Draft minutes awaiting board approval. Key topics include market expansion strategy and Q4 budget allocation.", sentiment: 'Neutral', keyClauses: ['Topic: APAC Expansion', 'Budget Approval: Q4 Marketing Spend'] },
    { id: 5, name: "Competitor Analysis Q4.pdf", type: "PDF", size: "5.8 MB", uploadDate: "2024-01-15", status: "Archived", accessLevel: "Restricted", version: "v2.0", lastAccessed: "2024-02-15 by AI Analyst", aiSummary: "Deep dive into competitor landscape, highlighting market share shifts and emerging threats from 'InnovateNext'.", sentiment: 'Negative', keyClauses: ['Market Share Loss: 2%', 'New Threat: InnovateNext Series B raise'] },
];

const initialInsights: AIInsight[] = [
    { id: 1, category: 'Opportunity', severity: 'High', message: "Market analysis suggests a 15% valuation premium if IPO is delayed to Q3 2025 due to sector rotation.", timestamp: "10:42 AM", actionable: true },
    { id: 2, category: 'Risk', severity: 'Medium', message: "Burn rate has increased by 8% month-over-month. Recommended review of marketing spend efficiency.", timestamp: "09:15 AM", actionable: true },
    { id: 3, category: 'Compliance', severity: 'Critical', message: "Annual 409A valuation update required within 45 days. Failure to comply may result in tax penalties.", timestamp: "Yesterday", actionable: true },
    { id: 4, category: 'Market', severity: 'Low', message: "Federal Reserve interest rate hold is likely to stabilize SaaS multiples for the upcoming quarter.", timestamp: "11:30 AM", actionable: false },
];

const initialPortfolio: PortfolioCompany[] = [
    { id: 1, name: "Innovate Inc.", sector: "SaaS", valuation: 120, revenue: 15, ebitda: -2, ownership: 25, health: 'Healthy', trendData: [3, 4, 5, 4, 6, 7, 9], burnRate: 250000, cac: 5200, esgScore: 85 },
    { id: 2, name: "QuantumLeap", sector: "Deep Tech", valuation: 300, revenue: 5, ebitda: -15, ownership: 18, health: 'Healthy', trendData: [2, 3, 3, 5, 6, 8, 7], burnRate: 1200000, cac: 150000, esgScore: 72 },
    { id: 3, name: "BioSynth", sector: "Biotech", valuation: 80, revenue: 1, ebitda: -8, ownership: 40, health: 'Concern', trendData: [9, 8, 6, 7, 5, 4, 3], burnRate: 700000, cac: 250000, esgScore: 65 },
    { id: 4, name: "ConnectSphere", sector: "Social Media", valuation: 50, revenue: 12, ebitda: 1, ownership: 60, health: 'Critical', trendData: [5, 6, 4, 3, 2, 3, 1], burnRate: 50000, cac: 15, esgScore: 45 },
];

const initialDeals: Deal[] = [
    { id: 1, name: "Project Titan", stage: 'Diligence', potential: 250, lead: "A. Smith", aiFitScore: 88, source: "Proprietary Network" },
    { id: 2, name: "Fusion Grid", stage: 'Sourcing', potential: 500, lead: "C. Lee", aiFitScore: 75, source: "Inbound" },
    { id: 3, name: "AeroDynamics", stage: 'Term Sheet', potential: 150, lead: "A. Smith", aiFitScore: 92, source: "Banker Intro" },
    { id: 4, name: "HealthChain", stage: 'Diligence', potential: 300, lead: "J. Doe", aiFitScore: 81, source: "Proprietary Network" },
    { id: 5, name: "Quantum Core", stage: 'Closing', potential: 400, lead: "A. Smith", aiFitScore: 95, source: "Follow-on" },
    { id: 6, name: "EcoSolutions", stage: 'Passed', potential: 100, lead: "C. Lee", aiFitScore: 60, source: "Inbound" },
];

const initialComplianceTasks: ComplianceTask[] = [
    { id: 1, title: "409A Valuation Update", dueDate: "2024-04-30", status: 'In Progress', priority: 'High', owner: "CFO Office", automationStatus: 'Hybrid' },
    { id: 2, title: "Quarterly Investor Report", dueDate: "2024-04-15", status: 'Pending', priority: 'High', owner: "IR Team", automationStatus: 'Automated' },
    { id: 3, title: "AML/KYC Refresh", dueDate: "2024-05-20", status: 'Pending', priority: 'Medium', owner: "Compliance Dept.", automationStatus: 'Manual' },
    { id: 4, title: "GDPR Audit", dueDate: "2024-06-01", status: 'Completed', priority: 'Medium', owner: "Legal Team", automationStatus: 'Hybrid' },
    { id: 5, title: "SEC Form PF Filing", dueDate: "2024-03-30", status: 'Overdue', priority: 'High', owner: "Compliance Dept.", automationStatus: 'Manual' },
];

const mockMarketSignals: MarketSignal[] = [
    { id: 1, source: "Bloomberg", headline: "Global SaaS multiples compress by 5% amid rising interest rates.", impact: 'Negative', relevance: 95, timestamp: "2h ago" },
    { id: 2, source: "TechCrunch", headline: "QuantumLeap competitor 'Photon Systems' raises $200M Series C.", impact: 'Negative', relevance: 88, timestamp: "8h ago" },
    { id: 3, source: "Reuters", headline: "New legislation provides tax credits for domestic biotech manufacturing.", impact: 'Positive', relevance: 92, timestamp: "1d ago" },
    { id: 4, source: "WSJ", headline: "Consumer spending on social media apps shows signs of slowing.", impact: 'Neutral', relevance: 70, timestamp: "2d ago" },
];

const mockRiskFactors: RiskFactor[] = [
    { id: 1, category: 'Market', description: "Sustained high interest rates depressing valuations", probability: 0.7, impact: 4, mitigationPlan: "Focus on profitability and extend runway." },
    { id: 2, category: 'Geopolitical', description: "Supply chain disruptions for hardware components from APAC", probability: 0.4, impact: 5, mitigationPlan: "Diversify suppliers and increase domestic inventory." },
    { id: 3, category: 'Operational', description: "Key person dependency on founders at Innovate Inc.", probability: 0.6, impact: 3, mitigationPlan: "Implement succession planning and knowledge transfer protocols." },
    { id: 4, category: 'Regulatory', description: "Increased data privacy scrutiny impacting ConnectSphere's ad model", probability: 0.8, impact: 4, mitigationPlan: "Proactively adopt stricter privacy standards and diversify revenue streams." },
];

const mockEsgMetrics: ESGMetric[] = [
    { companyId: 1, environmental: { score: 90, details: "Carbon neutral operations." }, social: { score: 85, details: "High employee satisfaction." }, governance: { score: 80, details: "Independent board majority." }, overallScore: 85 },
    { companyId: 2, environmental: { score: 60, details: "High energy consumption." }, social: { score: 75, details: "Strong community outreach." }, governance: { score: 80, details: "Transparent reporting." }, overallScore: 72 },
    { companyId: 3, environmental: { score: 70, details: "Waste reduction program in place." }, social: { score: 60, details: "Concerns over clinical trial diversity." }, governance: { score: 65, details: "Founder-controlled board." }, overallScore: 65 },
    { companyId: 4, environmental: { score: 50, details: "Minimal environmental policy." }, social: { score: 30, details: "Content moderation issues." }, governance: { score: 55, details: "Dual-class share structure." }, overallScore: 45 },
];

const mockFundMetrics: FundMetric[] = [
    { name: "TVPI", value: "3.2x", description: "Total Value to Paid-In Capital" },
    { name: "DPI", value: "1.1x", description: "Distributions to Paid-In Capital" },
    { name: "Fund IRR", value: "28.5%", description: "Internal Rate of Return (Net)" },
    { name: "Committed Capital", value: "$500M", description: "Total capital committed by LPs" },
    { name: "Called Capital", value: "$350M", description: "Capital called from LPs to date" },
    { name: "Dry Powder", value: "$150M", description: "Uncalled capital available for investment" },
];

type ActiveTab = 'Dashboard' | 'FundPerformance' | 'Portfolio' | 'CapTable' | 'Liquidity' | 'DealFlow' | 'DataRoom' | 'Compliance' | 'MarketIntel' | 'RiskMatrix' | 'ESG' | 'AI_Advisor' | 'Settings';

// --- COMPONENT DEFINITION ---

const PrivateEquityLounge: React.FC = () => {
    // State Management
    const [activeTab, setActiveTab] = useState<ActiveTab>('Dashboard');
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>(mockStakeholders);
    const [documents] = useState<Document[]>(initialDocuments);
    const [insights] = useState<AIInsight[]>(initialInsights);
    const [portfolio, setPortfolio] = useState<PortfolioCompany[]>(initialPortfolio);
    const [deals] = useState<Deal[]>(initialDeals);
    const [complianceTasks] = useState<ComplianceTask[]>(initialComplianceTasks);
    const [marketSignals] = useState<MarketSignal[]>(mockMarketSignals);
    const [riskFactors] = useState<RiskFactor[]>(mockRiskFactors);
    const [esgMetrics] = useState<ESGMetric[]>(mockEsgMetrics);
    const [fundMetrics] = useState<FundMetric[]>(mockFundMetrics);
    
    // Financial State
    const [valuation, setValuation] = useState<number>(100000000);
    const [revenue, setRevenue] = useState<number>(12500000);
    const [ebitda, setEbitda] = useState<number>(-2500000);
    const [cashOnHand, setCashOnHand] = useState<number>(18000000);
    
    // Scenario State
    const [exitValuation, setExitValuation] = useState<number>(250000000);
    const [exitDate, setExitDate] = useState<number>(36);
    
    // Chat State
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { id: 1, sender: 'System_AI', text: "Welcome to the Executive Suite. I have analyzed your real-time financial data. How can I assist with your strategic planning today?", timestamp: new Date() }
    ]);

    // Modal State
    const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);

    // HFT Simulation Effect
    useEffect(() => {
        const interval = setInterval(() => {
            setPortfolio(prevPortfolio =>
                prevPortfolio.map(company => {
                    const change = (Math.random() - 0.5) * 0.02; // +/- 1% change
                    const newTrend = [...company.trendData.slice(1), Math.max(1, company.trendData[company.trendData.length - 1] + (Math.random() * 4 - 2))];
                    return {
                        ...company,
                        valuation: Math.round(company.valuation * (1 + change)),
                        trendData: newTrend,
                    };
                })
            );
        }, 1500); // Update every 1.5 seconds
        return () => clearInterval(interval);
    }, []);

    // Computed Metrics
    const totalShares = useMemo(() => stakeholders.reduce((sum, s) => sum + s.shares, 0), [stakeholders]);
    
    const kpis: FinancialMetric[] = useMemo(() => [
        { label: "Current Valuation", value: valuation, delta: 12.5, trend: 'up', prefix: "$", aiProjection: 120000000 },
        { label: "ARR (Annual Recurring)", value: revenue, delta: 8.2, trend: 'up', prefix: "$", aiProjection: 13500000 },
        { label: "EBITDA", value: ebitda, delta: -2.1, trend: 'down', prefix: "$", aiProjection: -2000000 },
        { label: "Runway (Months)", value: cashOnHand / Math.abs(ebitda / 12), delta: 0, trend: 'flat', suffix: " Mo", aiProjection: 8.5 },
    ], [valuation, revenue, ebitda, cashOnHand]);

    const exitScenarios = useMemo(() => {
        const grossReturn = exitValuation;
        const investor = stakeholders.find(s => s.type === 'Investor');
        if (!investor) return null;
        
        const investorReturn = grossReturn * (investor.equityPercentage / 100);
        const multiple = investorReturn / investor.basis;
        const irr = (Math.pow(multiple, 1 / (exitDate / 12)) - 1) * 100;
        
        return { grossReturn, investorReturn, multiple, irr };
    }, [exitValuation, exitDate, stakeholders]);

    // Event Handlers
    const handleSendMessage = useCallback(() => {
        if (!chatInput.trim()) return;
        
        const userMsg: ChatMessage = { id: Date.now(), sender: 'User', text: chatInput, timestamp: new Date() };
        setChatHistory(prev => [...prev, userMsg]);
        setChatInput('');

        const thinkingMsg: ChatMessage = { id: Date.now() + 1, sender: 'System_AI', text: "Thinking...", timestamp: new Date(), isThinking: true };
        setChatHistory(prev => [...prev, thinkingMsg]);

        setTimeout(() => {
            let responseText = "I am processing that request against our global market database and proprietary fund data.";
            if (userMsg.text.toLowerCase().includes('valuation')) {
                responseText = `Based on current SaaS multiples of 8x-12x, a valuation of $${(revenue * 10).toLocaleString()} is defensible. Your current valuation of $${valuation.toLocaleString()} is conservative. My analysis suggests a potential upside to $120M in the next 6 months based on market signals.`;
            } else if (userMsg.text.toLowerCase().includes('risk')) {
                responseText = "Primary risk factors identified: 1. Customer concentration in Tech sector (mitigation: diversify into healthcare). 2. Rising CAC due to ad market saturation (mitigation: focus on organic growth channels). 3. Key person dependency on Alice Founder (mitigation: formalize succession plan).";
            } else if (userMsg.text.toLowerCase().includes('exit')) {
                responseText = `Modeling a $${exitValuation.toLocaleString()} exit in ${exitDate} months yields a ${exitScenarios?.multiple.toFixed(2)}x multiple for primary investors. This exceeds the fund's hurdle rate of 3.0x. The probability of achieving this valuation is currently 62%, contingent on hitting revenue growth targets.`;
            }

            const aiMsg: ChatMessage = { id: Date.now() + 1, sender: 'System_AI', text: responseText, timestamp: new Date() };
            setChatHistory(prev => {
                const newHistory = prev.filter(m => !m.isThinking);
                return [...newHistory, aiMsg];
            });
        }, 1500);
    }, [chatInput, revenue, valuation, exitValuation, exitDate, exitScenarios]);

    const handleIssueOptions = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const grantee = (form.elements.namedItem('grantee') as HTMLInputElement).value;
        const shares = parseInt((form.elements.namedItem('shares') as HTMLInputElement).value, 10);
        
        if (grantee && shares > 0) {
            const newStakeholder: Stakeholder = {
                id: Date.now(),
                name: grantee,
                shares: shares,
                type: 'Employee',
                equityPercentage: (shares / (totalShares + shares)) * 100,
                basis: 0,
                vested: 0,
                votingRights: false,
                antiDilution: 'None',
                liquidationPreference: 1.0,
                lastActivity: 'Just now'
            };
            // This is a simplified update, a real one would re-calculate all percentages
            setStakeholders(prev => [...prev, newStakeholder]);
            setIsOptionModalOpen(false);
        }
    }, [totalShares]);

    // --- RENDER FUNCTIONS ---

    const renderSidebar = () => (
        <div style={styles.sidebar}>
            <div style={styles.logoArea}>
                <div style={styles.logoCircle}>PE</div>
                <h2 style={styles.logoText}>NEXUS<span style={{color: '#00aaff'}}>OS</span></h2>
            </div>
            <nav style={styles.nav}>
                {['Dashboard', 'FundPerformance', 'Portfolio', 'CapTable', 'Liquidity', 'DealFlow', 'DataRoom', 'Compliance', 'MarketIntel', 'RiskMatrix', 'ESG', 'AI_Advisor', 'Settings'].map((tab) => (
                    <button 
                        key={tab} 
                        style={activeTab === tab ? styles.navButtonActive : styles.navButton}
                        onClick={() => setActiveTab(tab as any)}
                    >
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </nav>
            <div style={styles.sidebarFooter}>
                <div style={styles.statusIndicator}>
                    <span style={styles.statusDot}></span> System Operational
                </div>
                <div style={styles.userProfile}>
                    <div style={styles.avatar}>AS</div>
                    <div style={styles.userInfo}>
                        <span style={styles.userName}>Alex Smith</span>
                        <span style={styles.userRole}>Managing Partner</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDashboard = () => (
        <div style={styles.contentFadeIn}>
            <header style={styles.pageHeader}>
                <div>
                    <h1 style={styles.pageTitle}>Executive Command Center</h1>
                    <p style={styles.pageSubtitle}>Real-time enterprise telemetry and strategic oversight.</p>
                </div>
                <div style={styles.headerActions}>
                    <button style={styles.actionButton}>Generate Report</button>
                    <button style={styles.primaryButton}>Invite Stakeholder</button>
                </div>
            </header>
            <div style={styles.kpiGrid}>{kpis.map((kpi, idx) => <div key={idx} style={styles.kpiCard}><span style={styles.kpiLabel}>{kpi.label}</span><div style={styles.kpiValueRow}><span style={styles.kpiValue}>{kpi.prefix}{kpi.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}{kpi.suffix}</span><span style={{ ...styles.kpiDelta, color: kpi.trend === 'up' ? '#00ff9d' : kpi.trend === 'down' ? '#ff4d4d' : '#aaa' }}>{kpi.delta > 0 ? '+' : ''}{kpi.delta}%</span></div><div style={styles.miniChart}><div style={{ ...styles.chartBar, height: '40%' }}></div><div style={{ ...styles.chartBar, height: '60%' }}></div><div style={{ ...styles.chartBar, height: '50%' }}></div><div style={{ ...styles.chartBar, height: '80%' }}></div><div style={{ ...styles.chartBar, height: '100%', backgroundColor: '#00aaff' }}></div></div></div>)}</div>
            <div style={styles.dashboardGrid}><div style={styles.dashboardPanel}><h3 style={styles.panelTitle}>AI Strategic Insights</h3><div style={styles.insightList}>{insights.map(insight => <div key={insight.id} style={styles.insightItem}><div style={{...styles.severityIndicator, backgroundColor: insight.severity === 'Critical' ? '#ff0000' : insight.severity === 'High' ? '#ff4d4d' : insight.severity === 'Medium' ? '#ffaa00' : '#00aaff'}}></div><div style={styles.insightContent}><div style={styles.insightHeader}><span style={styles.insightCategory}>{insight.category}</span><span style={styles.insightTime}>{insight.timestamp}</span></div><p style={styles.insightMessage}>{insight.message}</p></div></div>)}</div></div><div style={styles.dashboardPanel}><h3 style={styles.panelTitle}>Market Performance vs Peers</h3><div style={styles.chartPlaceholder}><div style={styles.chartGridLines}>{[1,2,3,4,5].map(i => <div key={i} style={styles.gridLine}></div>)}</div><div style={styles.chartBarsContainer}><div style={{...styles.chartBarLarge, height: '40%', left: '10%'}}></div><div style={{...styles.chartBarLarge, height: '55%', left: '30%'}}></div><div style={{...styles.chartBarLarge, height: '45%', left: '50%'}}></div><div style={{...styles.chartBarLarge, height: '70%', left: '70%'}}></div><div style={{...styles.chartBarLarge, height: '85%', left: '90%', backgroundColor: '#00aaff', boxShadow: '0 0 15px rgba(0,170,255,0.5)'}}></div></div><div style={styles.chartLabels}><span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span><span>Current</span></div></div></div></div>
        </div>
    );

    const renderFundPerformance = () => (
        <div style={styles.contentFadeIn}>
            <header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Fund Performance Overview</h1><p style={styles.pageSubtitle}>Key metrics for Prosperity Fund A.</p></div></header>
            <div style={styles.fundPerfGrid}>
                {fundMetrics.map(metric => (
                    <div key={metric.name} style={styles.fundPerfCard}>
                        <span style={styles.kpiLabel}>{metric.name}</span>
                        <span style={styles.fundPerfValue}>{metric.value}</span>
                        <p style={styles.fundPerfDesc}>{metric.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPortfolio = () => (
        <div style={styles.contentFadeIn}>
            <header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Portfolio Monitoring</h1><p style={styles.pageSubtitle}>Live performance tracking of fund assets.</p></div></header>
            <div style={styles.portfolioGrid}>
                {portfolio.map(p => (
                    <div key={p.id} style={styles.portfolioCard}>
                        <div style={styles.portfolioCardHeader}>
                            <h3 style={styles.portfolioCardTitle}>{p.name}</h3>
                            <span style={{...styles.healthIndicator, backgroundColor: p.health === 'Healthy' ? '#00ff9d' : p.health === 'Concern' ? '#ffaa00' : '#ff4d4d'}}>{p.health}</span>
                        </div>
                        <p style={styles.portfolioCardSector}>{p.sector}</p>
                        <div style={styles.portfolioMetricGrid}>
                            <div><span style={styles.portfolioMetricLabel}>Valuation</span><span style={styles.portfolioMetricValue}>${p.valuation}M</span></div>
                            <div><span style={styles.portfolioMetricLabel}>Revenue</span><span style={styles.portfolioMetricValue}>${p.revenue}M</span></div>
                            <div><span style={styles.portfolioMetricLabel}>EBITDA</span><span style={styles.portfolioMetricValue}>${p.ebitda}M</span></div>
                            <div><span style={styles.portfolioMetricLabel}>Ownership</span><span style={styles.portfolioMetricValue}>{p.ownership}%</span></div>
                            <div><span style={styles.portfolioMetricLabel}>Burn Rate</span><span style={styles.portfolioMetricValue}>${(p.burnRate/1000).toFixed(0)}k/mo</span></div>
                            <div><span style={styles.portfolioMetricLabel}>CAC</span><span style={styles.portfolioMetricValue}>${p.cac.toLocaleString()}</span></div>
                        </div>
                        <div style={styles.sparkline}>
                            {p.trendData.map((d, i) => <div key={i} style={{...styles.sparklineBar, height: `${d * 10}%`}}></div>)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCapTable = () => (
        <div style={styles.contentFadeIn}>
            <header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Capitalization Table</h1><p style={styles.pageSubtitle}>Immutable ledger of equity ownership and dilution modeling.</p></div><div style={styles.headerActions}><button style={styles.actionButton}>Export CSV</button><button style={styles.primaryButton} onClick={() => setIsOptionModalOpen(true)}>Issue New Options</button></div></header>
            <div style={styles.tableContainer}><div style={styles.tableHeader}><div style={{ flex: 3 }}>Stakeholder Entity</div><div style={{ flex: 1 }}>Class</div><div style={{ flex: 1, textAlign: 'right' }}>Shares</div><div style={{ flex: 1, textAlign: 'right' }}>Ownership</div><div style={{ flex: 1, textAlign: 'right' }}>Vested</div><div style={{ flex: 1, textAlign: 'center' }}>Voting</div><div style={{ flex: 2, textAlign: 'right' }}>Cost Basis</div></div>{stakeholders.map(s => <div key={s.id} style={styles.tableRow}><div style={{ flex: 3, fontWeight: 600, color: '#fff' }}>{s.name}</div><div style={{ flex: 1 }}><span style={{...styles.badge, backgroundColor: s.type === 'Investor' ? 'rgba(0, 170, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: s.type === 'Investor' ? '#00aaff' : '#ccc'}}>{s.type}</span></div><div style={{ flex: 1, textAlign: 'right', fontFamily: 'monospace' }}>{s.shares.toLocaleString()}</div><div style={{ flex: 1, textAlign: 'right', fontFamily: 'monospace', color: '#00ff9d' }}>{s.equityPercentage.toFixed(2)}%</div><div style={{ flex: 1, textAlign: 'right' }}><div style={styles.progressBar}><div style={{ ...styles.progressFill, width: `${s.vested}%` }}></div></div><span style={{ fontSize: 10, color: '#777' }}>{s.vested}%</span></div><div style={{ flex: 1, textAlign: 'center' }}>{s.votingRights ? '✓' : '-'}</div><div style={{ flex: 2, textAlign: 'right', fontFamily: 'monospace' }}>${s.basis.toLocaleString()}</div></div>)}<div style={styles.tableFooter}><div style={{ flex: 3 }}>TOTAL OUTSTANDING</div><div style={{ flex: 1 }}></div><div style={{ flex: 1, textAlign: 'right' }}>{totalShares.toLocaleString()}</div><div style={{ flex: 1, textAlign: 'right' }}>100.00%</div><div style={{ flex: 4 }}></div></div></div>
            {isOptionModalOpen && <div style={styles.modalBackdrop}><div style={styles.modalContent}><h2 style={styles.modalTitle}>Issue New Equity Grant</h2><form onSubmit={handleIssueOptions}><div style={styles.inputGroup}><label style={styles.label}>Grantee Name</label><input name="grantee" type="text" style={styles.modalInput} required /></div><div style={styles.inputGroup}><label style={styles.label}>Number of Shares</label><input name="shares" type="number" style={styles.modalInput} required /></div><div style={styles.modalActions}><button type="button" style={styles.actionButton} onClick={() => setIsOptionModalOpen(false)}>Cancel</button><button type="submit" style={styles.primaryButton}>Confirm Grant</button></div></form></div></div>}
        </div>
    );

    const renderLiquidity = () => (
        <div style={styles.contentFadeIn}><header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Liquidity & Waterfall Analysis</h1><p style={styles.pageSubtitle}>Advanced exit scenario modeling and distribution logic.</p></div></header><div style={styles.splitLayout}><div style={styles.controlPanel}><h3 style={styles.panelTitle}>Scenario Parameters</h3><div style={styles.inputGroup}><label style={styles.label}>Target Exit Valuation</label><div style={styles.inputWrapper}><span style={styles.inputPrefix}>$</span><input type="number" value={exitValuation} onChange={(e) => setExitValuation(Number(e.target.value))} style={styles.input} /></div><input type="range" min="10000000" max="1000000000" step="1000000" value={exitValuation} onChange={(e) => setExitValuation(Number(e.target.value))} style={styles.rangeInput}/></div><div style={styles.inputGroup}><label style={styles.label}>Time to Exit (Months)</label><div style={styles.inputWrapper}><input type="number" value={exitDate} onChange={(e) => setExitDate(Number(e.target.value))} style={styles.input} /><span style={styles.inputSuffix}>Months</span></div><input type="range" min="6" max="120" value={exitDate} onChange={(e) => setExitDate(Number(e.target.value))} style={styles.rangeInput}/></div><div style={styles.infoBox}><h4 style={{margin: '0 0 10px 0', color: '#00aaff'}}>AI Projection</h4><p style={{fontSize: 13, lineHeight: 1.5, color: '#ccc'}}>Based on current burn rate and market conditions, an exit in {exitDate} months requires a CAGR of 45% to justify a ${exitValuation.toLocaleString()} valuation. Probability: 62%.</p></div></div><div style={styles.resultsPanel}><h3 style={styles.panelTitle}>Distribution Waterfall</h3>{exitScenarios && (<div style={styles.waterfallGrid}><div style={styles.waterfallCard}><div style={styles.waterfallLabel}>Gross Exit Value</div><div style={styles.waterfallValue}>${exitScenarios.grossReturn.toLocaleString()}</div></div><div style={styles.waterfallCard}><div style={styles.waterfallLabel}>Investor Proceeds</div><div style={styles.waterfallValue}>${exitScenarios.investorReturn.toLocaleString(undefined, {maximumFractionDigits: 0})}</div><div style={styles.waterfallSub}>45% Ownership</div></div><div style={styles.waterfallCard}><div style={styles.waterfallLabel}>Net Multiple (MOIC)</div><div style={{...styles.waterfallValue, color: exitScenarios.multiple > 3 ? '#00ff9d' : '#fff'}}>{exitScenarios.multiple.toFixed(2)}x</div></div><div style={styles.waterfallCard}><div style={styles.waterfallLabel}>Internal Rate of Return (IRR)</div><div style={{...styles.waterfallValue, color: exitScenarios.irr > 25 ? '#00ff9d' : '#fff'}}>{exitScenarios.irr.toFixed(1)}%</div></div></div>)}<div style={styles.chartPlaceholder}><div style={{display: 'flex', alignItems: 'flex-end', height: '100%', gap: 20, padding: '0 20px'}}><div style={{width: '20%', height: '30%', backgroundColor: '#333', borderRadius: '4px 4px 0 0', position: 'relative'}}><span style={styles.barLabel}>Pref</span></div><div style={{width: '20%', height: '50%', backgroundColor: '#444', borderRadius: '4px 4px 0 0', position: 'relative'}}><span style={styles.barLabel}>Debt</span></div><div style={{width: '20%', height: '80%', backgroundColor: '#00aaff', borderRadius: '4px 4px 0 0', position: 'relative'}}><span style={styles.barLabel}>Common</span></div><div style={{width: '20%', height: '100%', backgroundColor: '#00ff9d', borderRadius: '4px 4px 0 0', position: 'relative'}}><span style={styles.barLabel}>Total</span></div></div></div></div></div></div>
    );

    const renderDealFlow = () => {
        const stages: Deal['stage'][] = ['Sourcing', 'Diligence', 'Term Sheet', 'Closing', 'Passed'];
        return (
            <div style={styles.contentFadeIn}>
                <header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Deal Flow Pipeline</h1><p style={styles.pageSubtitle}>Manage and track investment opportunities.</p></div><div style={styles.headerActions}><button style={styles.primaryButton}>Add New Deal</button></div></header>
                <div style={styles.kanbanBoard}>
                    {stages.map(stage => (
                        <div key={stage} style={styles.kanbanColumn}>
                            <h3 style={styles.kanbanColumnTitle}>{stage}</h3>
                            <div style={styles.kanbanColumnContent}>
                                {deals.filter(d => d.stage === stage).map(deal => (
                                    <div key={deal.id} style={styles.kanbanCard}>
                                        <div style={styles.kanbanCardHeader}>
                                            <h4 style={styles.kanbanCardTitle}>{deal.name}</h4>
                                            <span style={styles.aiFitScore}>{deal.aiFitScore}% Fit</span>
                                        </div>
                                        <p style={styles.kanbanCardDetail}>Potential: ${deal.potential}M</p>
                                        <div style={styles.kanbanCardFooter}><span style={styles.kanbanCardLead}>{deal.lead}</span><span style={styles.tag}>{deal.source}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDataRoom = () => (
        <div style={styles.contentFadeIn}>
            <header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Secure Data Room</h1><p style={styles.pageSubtitle}>Encrypted repository for due diligence and governance.</p></div><div style={styles.headerActions}><button style={styles.primaryButton}>Upload Document</button></div></header>
            <div style={styles.dataRoomContainer}>
                {documents.map(doc => (
                    <div key={doc.id} style={styles.docCard}>
                        <div style={styles.docCardHeader}>
                            <div style={styles.docIcon}>📄</div>
                            <h4 style={styles.docName}>{doc.name}</h4>
                            <span style={{...styles.statusBadge, backgroundColor: doc.status === 'Verified' ? 'rgba(0, 255, 157, 0.1)' : doc.status === 'Flagged' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(255, 170, 0, 0.1)', color: doc.status === 'Verified' ? '#00ff9d' : doc.status === 'Flagged' ? '#ff4d4d' : '#ffaa00'}}>{doc.status}</span>
                        </div>
                        <div style={styles.docDetailsGrid}>
                            <span>Type: {doc.type}</span><span>Size: {doc.size}</span><span>Version: {doc.version}</span><span>Access: <span style={styles.tag}>{doc.accessLevel}</span></span>
                        </div>
                        <p style={styles.docAiSummary}><strong>AI Summary:</strong> {doc.aiSummary}</p>
                        <div style={styles.keyClauses}><p><strong>Key Clauses:</strong></p><ul>{doc.keyClauses.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                        <div style={styles.docFooter}>
                            <span>Uploaded: {doc.uploadDate}</span><span>Last Accessed: {doc.lastAccessed}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCompliance = () => (
        <div style={styles.contentFadeIn}>
            <header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Compliance & Governance</h1><p style={styles.pageSubtitle}>Automated tracking of regulatory and reporting obligations.</p></div></header>
            <div style={styles.tableContainer}><div style={styles.tableHeader}><div style={{ flex: 3 }}>Task</div><div style={{ flex: 1 }}>Due Date</div><div style={{ flex: 1 }}>Priority</div><div style={{ flex: 1 }}>Owner</div><div style={{ flex: 1, textAlign: 'right' }}>Status</div></div>{complianceTasks.map(task => <div key={task.id} style={styles.tableRow}><div style={{ flex: 3, color: '#fff' }}>{task.title}</div><div style={{ flex: 1, color: task.status === 'Overdue' ? '#ff4d4d' : '#ddd' }}>{task.dueDate}</div><div style={{ flex: 1 }}><span style={{...styles.badge, backgroundColor: task.priority === 'High' ? 'rgba(255,77,77,0.2)' : 'rgba(255,170,0,0.2)', color: task.priority === 'High' ? '#ff4d4d' : '#ffaa00'}}>{task.priority}</span></div><div style={{ flex: 1 }}>{task.owner}</div><div style={{ flex: 1, textAlign: 'right' }}><span style={{...styles.statusBadge, backgroundColor: task.status === 'Completed' ? 'rgba(0, 255, 157, 0.1)' : task.status === 'In Progress' ? 'rgba(0, 170, 255, 0.1)' : task.status === 'Overdue' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(255, 255, 255, 0.1)', color: task.status === 'Completed' ? '#00ff9d' : task.status === 'In Progress' ? '#00aaff' : task.status === 'Overdue' ? '#ff4d4d' : '#ccc'}}>{task.status}</span></div></div>)}</div>
        </div>
    );

    const renderMarketIntel = () => (
        <div style={styles.contentFadeIn}>
            <header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Market Intelligence</h1><p style={styles.pageSubtitle}>Real-time signals and analysis from global markets.</p></div></header>
            <div style={styles.marketIntelContainer}>
                {marketSignals.map(signal => (
                    <div key={signal.id} style={styles.signalCard}>
                        <div style={{...styles.signalImpact, backgroundColor: signal.impact === 'Positive' ? '#00ff9d' : signal.impact === 'Negative' ? '#ff4d4d' : '#888'}}></div>
                        <div style={styles.signalContent}>
                            <div style={styles.signalHeader}>
                                <span style={styles.signalSource}>{signal.source}</span>
                                <span style={styles.signalTime}>{signal.timestamp}</span>
                            </div>
                            <p style={styles.signalHeadline}>{signal.headline}</p>
                        </div>
                        <div style={styles.signalRelevance}>
                            <span>{signal.relevance}%</span>
                            <small>Relevance</small>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderRiskMatrix = () => (
        <div style={styles.contentFadeIn}>
            <header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Global Risk Matrix</h1><p style={styles.pageSubtitle}>Probabilistic assessment of portfolio-wide risks.</p></div></header>
            <div style={styles.riskMatrixContainer}>
                <div style={styles.riskMatrix}>
                    {riskFactors.map(risk => {
                        const color = `rgba(255, 77, 77, ${risk.probability * (risk.impact / 5)})`;
                        return (
                            <div key={risk.id} style={{...styles.riskCell, left: `${risk.probability * 100}%`, bottom: `${(risk.impact - 1) * 25}%`, backgroundColor: color}} title={`${risk.category}: ${risk.description}`}></div>
                        );
                    })}
                </div>
                <div style={styles.riskAxisY}><span>High Impact</span><span>Low Impact</span></div>
                <div style={styles.riskAxisX}><span>Low Probability</span><span>High Probability</span></div>
            </div>
        </div>
    );

    const renderESG = () => (
        <div style={styles.contentFadeIn}>
            <header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>ESG Overview</h1><p style={styles.pageSubtitle}>Environmental, Social, and Governance performance.</p></div></header>
            <div style={styles.esgGrid}>
                {portfolio.map(p => {
                    const esg = esgMetrics.find(e => e.companyId === p.id);
                    if (!esg) return null;
                    return (
                        <div key={p.id} style={styles.esgCard}>
                            <h3 style={styles.portfolioCardTitle}>{p.name}</h3>
                            <div style={styles.esgScores}>
                                <div style={styles.esgScoreItem}>
                                    <span style={styles.esgScoreValue}>{esg.environmental.score}</span>
                                    <span style={styles.esgScoreLabel}>Environmental</span>
                                </div>
                                <div style={styles.esgScoreItem}>
                                    <span style={styles.esgScoreValue}>{esg.social.score}</span>
                                    <span style={styles.esgScoreLabel}>Social</span>
                                </div>
                                <div style={styles.esgScoreItem}>
                                    <span style={styles.esgScoreValue}>{esg.governance.score}</span>
                                    <span style={styles.esgScoreLabel}>Governance</span>
                                </div>
                            </div>
                            <p style={styles.esgSummary}><strong>Overall Score: {esg.overallScore}</strong>. {esg.environmental.details} {esg.social.details}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderAIAdvisor = () => (
        <div style={styles.contentFadeIn}><div style={styles.chatContainer}><div style={styles.chatSidebar}><h3 style={styles.panelTitle}>Active Agents</h3><div style={styles.agentCard}><div style={styles.agentAvatar}>FN</div><div><div style={styles.agentName}>Financial Analyst</div><div style={styles.agentStatus}>Online • Processing</div></div></div><div style={{...styles.agentCard, opacity: 0.5}}><div style={styles.agentAvatar}>LG</div><div><div style={styles.agentName}>Legal Compliance</div><div style={styles.agentStatus}>Idle</div></div></div><div style={{...styles.agentCard, opacity: 0.5}}><div style={styles.agentAvatar}>MK</div><div><div style={styles.agentName}>Market Sentiment</div><div style={styles.agentStatus}>Idle</div></div></div></div><div style={styles.chatMain}><div style={styles.chatHeader}><h3>NEXUS Strategic Advisor</h3><span style={styles.chatSubtitle}>Powered by Gemini 2.5 Pro</span></div><div style={styles.chatHistory}>{chatHistory.map(msg => <div key={msg.id} style={msg.sender === 'User' ? styles.msgUser : styles.msgSystem}><div style={msg.isThinking ? styles.msgThinking : styles.msgBubble}>{msg.text}</div><div style={styles.msgTime}>{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div></div>)}</div><div style={styles.chatInputArea}><input type="text" placeholder="Ask about valuation, risks, or exit scenarios..." style={styles.chatInput} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} /><button style={styles.sendButton} onClick={handleSendMessage}>SEND COMMAND</button></div></div></div></div>
    );

    const renderSettings = () => (
        <div style={styles.contentFadeIn}>
            <header style={styles.pageHeader}><div><h1 style={styles.pageTitle}>Settings</h1><p style={styles.pageSubtitle}>Configure your NEXUS OS environment.</p></div></header>
            <div style={styles.settingsGrid}>
                <div style={styles.dashboardPanel}><h3 style={styles.panelTitle}>Notifications</h3><div style={styles.settingRow}><label>Email Alerts for Critical Insights</label><div style={styles.toggleSwitch}><input type="checkbox" id="toggle1" defaultChecked /><label htmlFor="toggle1"></label></div></div><div style={styles.settingRow}><label>Push Notifications for Deal Flow</label><div style={styles.toggleSwitch}><input type="checkbox" id="toggle2" /><label htmlFor="toggle2"></label></div></div></div>
                <div style={styles.dashboardPanel}><h3 style={styles.panelTitle}>Theme</h3><div style={styles.settingRow}><label>Interface Mode</label><div style={styles.themeSelector}><button style={styles.themeButtonActive}>Dark</button><button style={styles.themeButton}>Light</button></div></div></div>
            </div>
        </div>
    );

    return (
        <div style={styles.appContainer}>
            {renderSidebar()}
            <main style={styles.mainContent}>
                {activeTab === 'Dashboard' && renderDashboard()}
                {activeTab === 'FundPerformance' && renderFundPerformance()}
                {activeTab === 'Portfolio' && renderPortfolio()}
                {activeTab === 'CapTable' && renderCapTable()}
                {activeTab === 'Liquidity' && renderLiquidity()}
                {activeTab === 'DealFlow' && renderDealFlow()}
                {activeTab === 'DataRoom' && renderDataRoom()}
                {activeTab === 'Compliance' && renderCompliance()}
                {activeTab === 'MarketIntel' && renderMarketIntel()}
                {activeTab === 'RiskMatrix' && renderRiskMatrix()}
                {activeTab === 'ESG' && renderESG()}
                {activeTab === 'AI_Advisor' && renderAIAdvisor()}
                {activeTab === 'Settings' && renderSettings()}
            </main>
        </div>
    );
};

// --- STYLES ---

const styles: { [key: string]: React.CSSProperties } = {
    appContainer: { display: 'flex', minHeight: '100vh', backgroundColor: '#05050a', color: '#e0e0e0', fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif', overflow: 'hidden' },
    sidebar: { width: '260px', backgroundColor: '#0a0a12', borderRight: '1px solid #1f1f2e', display: 'flex', flexDirection: 'column', padding: '20px', zIndex: 10 },
    logoArea: { display: 'flex', alignItems: 'center', marginBottom: 40, gap: 12 },
    logoCircle: { width: 36, height: 36, borderRadius: '50%', backgroundColor: '#00aaff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14, boxShadow: '0 0 15px rgba(0, 170, 255, 0.4)' },
    logoText: { fontSize: 20, fontWeight: 700, letterSpacing: '1px', margin: 0, color: '#fff' },
    nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' },
    navButton: { textAlign: 'left', padding: '10px 16px', backgroundColor: 'transparent', border: 'none', color: '#888', cursor: 'pointer', borderRadius: 6, fontSize: 14, fontWeight: 500, transition: 'all 0.2s' },
    navButtonActive: { textAlign: 'left', padding: '10px 16px', backgroundColor: 'rgba(0, 170, 255, 0.1)', border: 'none', color: '#00aaff', cursor: 'pointer', borderRadius: 6, fontSize: 14, fontWeight: 600, borderLeft: '3px solid #00aaff' },
    sidebarFooter: { borderTop: '1px solid #1f1f2e', paddingTop: 20 },
    statusIndicator: { fontSize: 11, color: '#00ff9d', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 15, textTransform: 'uppercase', letterSpacing: '0.5px' },
    statusDot: { width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00ff9d', boxShadow: '0 0 8px #00ff9d' },
    userProfile: { display: 'flex', alignItems: 'center', gap: 10 },
    avatar: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' },
    userInfo: { display: 'flex', flexDirection: 'column' },
    userName: { fontSize: 13, fontWeight: 600, color: '#fff' },
    userRole: { fontSize: 11, color: '#666' },
    mainContent: { flex: 1, padding: '40px', overflowY: 'auto', backgroundColor: '#05050a', backgroundImage: 'radial-gradient(circle at 50% 0%, #111122 0%, #05050a 60%)' },
    contentFadeIn: { animation: 'fadeIn 0.4s ease-out' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
    pageTitle: { fontSize: 28, fontWeight: 700, margin: '0 0 8px 0', color: '#fff' },
    pageSubtitle: { fontSize: 14, color: '#888', margin: 0 },
    headerActions: { display: 'flex', gap: 12 },
    primaryButton: { backgroundColor: '#00aaff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 4px 12px rgba(0, 170, 255, 0.3)' },
    actionButton: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #333', padding: '10px 20px', borderRadius: 6, fontWeight: 500, cursor: 'pointer', fontSize: 13 },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 },
    kpiCard: { backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' },
    kpiLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
    kpiValueRow: { display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 },
    kpiValue: { fontSize: 24, fontWeight: 700, color: '#fff' },
    kpiDelta: { fontSize: 12, fontWeight: 600 },
    miniChart: { display: 'flex', alignItems: 'flex-end', gap: 4, height: 30, marginTop: 15, opacity: 0.5 },
    chartBar: { flex: 1, backgroundColor: '#333', borderRadius: '2px 2px 0 0' },
    dashboardGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 },
    dashboardPanel: { backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, padding: 25, minHeight: 300 },
    panelTitle: { fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 20, borderBottom: '1px solid #222', paddingBottom: 15 },
    insightList: { display: 'flex', flexDirection: 'column', gap: 15 },
    insightItem: { display: 'flex', gap: 15, padding: 15, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '1px solid #333' },
    severityIndicator: { width: 4, borderRadius: 4, backgroundColor: '#00aaff' },
    insightContent: { flex: 1 },
    insightHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
    insightCategory: { fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' },
    insightTime: { fontSize: 11, color: '#666' },
    insightMessage: { fontSize: 13, color: '#ccc', margin: 0, lineHeight: 1.4 },
    chartPlaceholder: { height: 200, position: 'relative', marginTop: 20 },
    chartGridLines: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    gridLine: { height: 1, backgroundColor: '#222', width: '100%' },
    chartBarsContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    chartBarLarge: { position: 'absolute', bottom: 0, width: '12%', backgroundColor: '#333', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' },
    chartLabels: { position: 'absolute', bottom: -25, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 10%', fontSize: 11, color: '#666' },
    tableContainer: { backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' },
    tableHeader: { display: 'flex', padding: '15px 20px', backgroundColor: '#161624', borderBottom: '1px solid #222', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase' },
    tableRow: { display: 'flex', padding: '15px 20px', borderBottom: '1px solid #1f1f2e', alignItems: 'center', fontSize: 13, color: '#ddd', transition: 'background-color 0.1s' },
    tableFooter: { display: 'flex', padding: '15px 20px', backgroundColor: '#161624', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '1px' },
    badge: { padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' },
    progressBar: { height: 4, backgroundColor: '#333', borderRadius: 2, width: '100%', marginBottom: 4 },
    progressFill: { height: '100%', backgroundColor: '#00ff9d', borderRadius: 2 },
    splitLayout: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 },
    controlPanel: { backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, padding: 25 },
    resultsPanel: { backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, padding: 25 },
    inputGroup: { marginBottom: 25 },
    label: { display: 'block', fontSize: 12, color: '#888', marginBottom: 8 },
    inputWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#0a0a12', border: '1px solid #333', borderRadius: 6, padding: '0 12px', marginBottom: 10 },
    input: { backgroundColor: 'transparent', border: 'none', color: '#fff', padding: '12px 0', fontSize: 16, width: '100%', outline: 'none', fontWeight: 600 },
    inputPrefix: { color: '#666', marginRight: 5 },
    inputSuffix: { color: '#666', fontSize: 12 },
    rangeInput: { width: '100%', accentColor: '#00aaff' },
    infoBox: { backgroundColor: 'rgba(0, 170, 255, 0.05)', border: '1px solid rgba(0, 170, 255, 0.1)', borderRadius: 8, padding: 15, marginTop: 20 },
    waterfallGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginBottom: 30 },
    waterfallCard: { backgroundColor: '#1a1a26', padding: 15, borderRadius: 8, textAlign: 'center' },
    waterfallLabel: { fontSize: 11, color: '#888', marginBottom: 5 },
    waterfallValue: { fontSize: 18, fontWeight: 700, color: '#fff' },
    waterfallSub: { fontSize: 10, color: '#666', marginTop: 4 },
    barLabel: { position: 'absolute', bottom: -25, width: '100%', textAlign: 'center', fontSize: 11, color: '#888' },
    docIcon: { fontSize: 18 },
    tag: { backgroundColor: '#222', color: '#aaa', padding: '2px 8px', borderRadius: 4, fontSize: 11 },
    statusBadge: { padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 },
    chatContainer: { display: 'flex', height: 'calc(100vh - 140px)', backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' },
    chatSidebar: { width: 250, backgroundColor: '#161624', borderRight: '1px solid #222', padding: 20 },
    agentCard: { display: 'flex', alignItems: 'center', gap: 10, padding: 10, backgroundColor: '#1f1f2e', borderRadius: 8, marginBottom: 10, cursor: 'pointer' },
    agentAvatar: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#00aaff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' },
    agentName: { fontSize: 12, fontWeight: 600, color: '#fff' },
    agentStatus: { fontSize: 10, color: '#00ff9d' },
    chatMain: { flex: 1, display: 'flex', flexDirection: 'column' },
    chatHeader: { padding: '15px 20px', borderBottom: '1px solid #222', backgroundColor: '#161624' },
    chatSubtitle: { fontSize: 11, color: '#00aaff', textTransform: 'uppercase', letterSpacing: '0.5px' },
    chatHistory: { flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 15 },
    msgUser: { alignSelf: 'flex-end', maxWidth: '70%' },
    msgSystem: { alignSelf: 'flex-start', maxWidth: '70%' },
    msgBubble: { padding: '12px 16px', borderRadius: 8, backgroundColor: '#222', color: '#ddd', fontSize: 14, lineHeight: 1.5, border: '1px solid #333' },
    msgThinking: { padding: '12px 16px', borderRadius: 8, backgroundColor: 'transparent', color: '#888', fontSize: 14, fontStyle: 'italic', border: '1px solid #222' },
    msgTime: { fontSize: 10, color: '#555', marginTop: 4, textAlign: 'right' },
    chatInputArea: { padding: 20, borderTop: '1px solid #222', display: 'flex', gap: 10, backgroundColor: '#161624' },
    chatInput: { flex: 1, backgroundColor: '#0a0a12', border: '1px solid #333', borderRadius: 6, padding: '12px', color: '#fff', outline: 'none' },
    sendButton: { backgroundColor: '#00aaff', color: '#000', border: 'none', borderRadius: 6, padding: '0 20px', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
    portfolioGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 },
    portfolioCard: { backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, padding: 20 },
    portfolioCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    portfolioCardTitle: { margin: 0, fontSize: 16, color: '#fff' },
    healthIndicator: { padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, color: '#000' },
    portfolioCardSector: { margin: '0 0 15px 0', fontSize: 12, color: '#888' },
    portfolioMetricGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 15 },
    portfolioMetricLabel: { fontSize: 11, color: '#888', display: 'block' },
    portfolioMetricValue: { fontSize: 14, color: '#fff', fontWeight: 600 },
    sparkline: { height: 40, display: 'flex', alignItems: 'flex-end', gap: 2 },
    sparklineBar: { flex: 1, backgroundColor: 'rgba(0, 170, 255, 0.5)', borderRadius: '1px 1px 0 0', transition: 'height 0.5s ease' },
    modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#11111a', padding: 30, borderRadius: 12, border: '1px solid #222', width: 400 },
    modalTitle: { marginTop: 0, color: '#fff' },
    modalInput: { width: '100%', backgroundColor: '#0a0a12', border: '1px solid #333', borderRadius: 6, padding: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 30 },
    kanbanBoard: { display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 10 },
    kanbanColumn: { flex: '0 0 280px', backgroundColor: '#0a0a12', borderRadius: 8, padding: 10 },
    kanbanColumnTitle: { fontSize: 14, color: '#888', textTransform: 'uppercase', padding: '0 10px 10px', borderBottom: '1px solid #222', margin: '0 0 10px 0' },
    kanbanColumnContent: { display: 'flex', flexDirection: 'column', gap: 10, height: 'calc(100vh - 300px)', overflowY: 'auto' },
    kanbanCard: { backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 6, padding: 15 },
    kanbanCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    kanbanCardTitle: { margin: 0, fontSize: 14, color: '#fff' },
    aiFitScore: { fontSize: 11, color: '#00ff9d', fontWeight: 600 },
    kanbanCardDetail: { margin: '8px 0', fontSize: 12, color: '#ccc' },
    kanbanCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    kanbanCardLead: { fontSize: 10, backgroundColor: '#333', padding: '2px 6px', borderRadius: 4, color: '#aaa' },
    dataRoomContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
    docCard: { backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, padding: 20 },
    docCardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 },
    docName: { margin: 0, flex: 1, color: '#fff', fontSize: 14 },
    docDetailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#888', marginBottom: 15 },
    docAiSummary: { fontSize: 13, color: '#ccc', margin: '0 0 15px 0', padding: 10, backgroundColor: 'rgba(0,170,255,0.05)', borderRadius: 4, borderLeft: '2px solid #00aaff' },
    keyClauses: { fontSize: 12, color: '#aaa' },
    docFooter: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', borderTop: '1px solid #222', paddingTop: 10, marginTop: 15 },
    settingsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
    settingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #222' },
    toggleSwitch: { position: 'relative', display: 'inline-block', width: 40, height: 20 },
    themeSelector: { display: 'flex', border: '1px solid #333', borderRadius: 6, overflow: 'hidden' },
    themeButton: { padding: '6px 12px', backgroundColor: 'transparent', border: 'none', color: '#888', cursor: 'pointer' },
    themeButtonActive: { padding: '6px 12px', backgroundColor: '#333', border: 'none', color: '#fff', cursor: 'pointer' },
    fundPerfGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
    fundPerfCard: { backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, padding: 25 },
    fundPerfValue: { fontSize: 32, fontWeight: 700, color: '#00aaff', margin: '10px 0' },
    fundPerfDesc: { fontSize: 13, color: '#888', margin: 0 },
    marketIntelContainer: { display: 'flex', flexDirection: 'column', gap: 15 },
    signalCard: { display: 'flex', backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 8, overflow: 'hidden' },
    signalImpact: { width: 5 },
    signalContent: { flex: 1, padding: 15 },
    signalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
    signalSource: { fontSize: 12, fontWeight: 600, color: '#fff' },
    signalTime: { fontSize: 11, color: '#666' },
    signalHeadline: { margin: 0, fontSize: 14, color: '#ccc' },
    signalRelevance: { width: 80, backgroundColor: '#161624', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#00aaff' },
    riskMatrixContainer: { height: 500, backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, position: 'relative', padding: '40px' },
    riskMatrix: { position: 'absolute', top: 40, right: 40, bottom: 40, left: 40, backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(to right, #222 1px, transparent 1px)', backgroundSize: '25% 25%' },
    riskCell: { position: 'absolute', width: 20, height: 20, borderRadius: '50%', transform: 'translate(-50%, 50%)', border: '2px solid rgba(255,255,255,0.5)' },
    riskAxisY: { position: 'absolute', top: 40, left: 5, bottom: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 11, color: '#666' },
    riskAxisX: { position: 'absolute', bottom: 5, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666' },
    esgGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 },
    esgCard: { backgroundColor: '#11111a', border: '1px solid #222', borderRadius: 12, padding: 20 },
    esgScores: { display: 'flex', justifyContent: 'space-around', margin: '20px 0' },
    esgScoreItem: { textAlign: 'center' },
    esgScoreValue: { fontSize: 24, fontWeight: 700, color: '#00ff9d' },
    esgScoreLabel: { fontSize: 11, color: '#888' },
    esgSummary: { fontSize: 13, color: '#ccc', lineHeight: 1.5 },
};

export default PrivateEquityLounge;