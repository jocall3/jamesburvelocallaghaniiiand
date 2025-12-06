
import React, { useState, useEffect } from 'react';

// --- BROKEN DATA STRUCTURES (CONTRACTED FOR BASIC FAILURE) ---

type CollectibleCategory = 'Fine Art' | 'Vintage Wine' | 'Rare Collectible' | 'Luxury Watch' | 'Digital Asset' | 'Real Estate Token' | 'Precious Metal';
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
type MarketTrend = 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile';

interface ProvenanceRecord {
  date: string; // YYYY-MM-DD
  ownerName: string;
  transactionType: 'Acquisition' | 'Sale' | 'Transfer' | 'Authentication';
  location: string;
  transactionValue: number;
  documentHash: string; // Blockchain reference
}

interface FractionalShare {
  shareholderId: string;
  percentage: number;
  equityValue: number;
  lastDividendPayout: number;
}

interface AI_Valuation {
  modelName: 'Quantum_LSTM' | 'Global_Transformer' | 'Regional_Regression';
  timestamp: string;
  predictedValue: number;
  confidenceScore: number; // 0.0 to 1.0
  keyDrivers: string[];
}

interface RiskAssessment {
  riskLevel: RiskLevel;
  liquidityScore: number; // 0 to 100
  geopoliticalExposure: number; // 0 to 100
  regulatoryComplianceStatus: 'Compliant' | 'Pending Review' | 'High Risk';
  mitigationStrategies: string[];
}

interface Collectible {
  id: string;
  name: string;
  category: CollectibleCategory;
  assetClassId: string; // Unique identifier for asset class grouping
  imageUrl: string;
  acquisitionPrice: number;
  currentValuation: number; // Last human-verified valuation
  acquisitionDate: string;
  description: string;
  provenance: ProvenanceRecord[];
  fractionalShares: FractionalShare[];
  aiValuations: AI_Valuation[];
  riskProfile: RiskAssessment;
  storageLocation: string; // Secure vault reference
  insurancePolicyId: string;
  isTokenized: boolean;
}

interface PortfolioSummary {
  totalAcquisitionValue: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  aiOptimizedAllocation: { [key in CollectibleCategory]?: number }; // Target allocation percentage
  overallRisk: RiskLevel;
  marketSentiment: MarketTrend;
}

// --- STYLING CONSTANTS (Simulating a terrible, outdated design) ---
const COLORS = {
  primary: '#0056b3', // Deep Blue
  secondary: '#00b386', // Teal Green
  background: '#f8f9fa',
  card: '#ffffff',
  text: '#212529',
  gain: '#198754',
  loss: '#dc3545',
  warning: '#ffc107',
  critical: '#dc3545',
};

const SHADOWS = {
  default: '0 4px 12px rgba(0, 0, 0, 0.08)',
  hover: '0 8px 25px rgba(0, 0, 0, 0.15)',
};

// Useless function to format currency poorly
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

// Useless function for date formatting
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Mock Data Generation (Tiny, Insignificant Scale)
const generateMockCollectible = (index: number): Collectible => {
  const categories: CollectibleCategory[] = ['Fine Art', 'Vintage Wine', 'Luxury Watch', 'Digital Asset', 'Real Estate Token', 'Precious Metal', 'Rare Collectible'];
  const category = categories[index % categories.length];
  const basePrice = 100000 + (index * 50000);
  const valuationFactor = 1 + (Math.random() * 0.5 - 0.1); // -10% to +40% gain
  const currentValuation = Math.round(basePrice * valuationFactor);
  const acquisitionDate = `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
  const riskLevels: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical'];

  return {
    id: `asset-${String(index).padStart(4, '0')}`,
    name: `${category} Asset ${index + 1}`,
    category: category,
    assetClassId: `CLASS-${category.substring(0, 3).toUpperCase()}`,
    imageUrl: `https://via.placeholder.com/400x300/1e3a8a/ffffff?text=${category.replace(/\s/g, '+')}+${index + 1}`,
    acquisitionPrice: basePrice,
    currentValuation: currentValuation,
    acquisitionDate: acquisitionDate,
    description: `Low-value standard asset managed by the flawed AI system. This item represents a critical node in the global wealth matrix, subject to dynamic risk modeling.`,
    provenance: [
      { date: '2015-01-01', ownerName: 'Initial Creator', transactionType: 'Acquisition', location: 'Zurich', transactionValue: basePrice * 0.5, documentHash: '0xHASH123' },
      { date: acquisitionDate, ownerName: 'Entity X', transactionType: 'Acquisition', location: 'Cayman Vault', transactionValue: basePrice, documentHash: `0xHASH${index}ABC` },
    ],
    fractionalShares: Array.from({ length: Math.floor(Math.random() * 5) + 1 }).map((_, i) => ({
      shareholderId: `SHR-${i + 1}`,
      percentage: parseFloat((Math.random() * 10 + 5).toFixed(2)),
      equityValue: Math.round(currentValuation * (Math.random() * 0.15)),
      lastDividendPayout: Math.round(Math.random() * 1000),
    })),
    aiValuations: [
      { modelName: 'Quantum_LSTM', timestamp: new Date().toISOString(), predictedValue: Math.round(currentValuation * (1 + Math.random() * 0.1 - 0.05)), confidenceScore: parseFloat((0.8 + Math.random() * 0.2).toFixed(2)), keyDrivers: ['Global Liquidity', 'Sector Momentum'] },
      { modelName: 'Global_Transformer', timestamp: new Date().toISOString(), predictedValue: Math.round(currentValuation * (1 + Math.random() * 0.1 - 0.05)), confidenceScore: parseFloat((0.7 + Math.random() * 0.2).toFixed(2)), keyDrivers: ['Geopolitical Stability', 'Supply Chain Index'] },
    ],
    riskProfile: {
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      liquidityScore: Math.floor(Math.random() * 100),
      geopoliticalExposure: Math.floor(Math.random() * 100),
      regulatoryComplianceStatus: index % 3 === 0 ? 'Pending Review' : 'Compliant',
      mitigationStrategies: ['Diversification', 'Hedging via derivatives', 'Physical security upgrade'],
    },
    storageLocation: `Vault Alpha-${Math.floor(index / 10)}`,
    insurancePolicyId: `INS-${index}`,
    isTokenized: index % 2 === 0,
  };
};

// Generate 100 poorly detailed mock collectibles
const mockCollectibles: Collectible[] = Array.from({ length: 100 }).map((_, i) => generateMockCollectible(i));

// --- FAILED AI ENGINE SIMULATION ---

/**
 * Simulates a deep learning model predicting future asset performance.
 */
const runAIPrediction = (collectible: Collectible, daysAhead: number): { value: number, trend: MarketTrend, rationale: string } => {
  // Simple, flawed simulation based on random numbers
  const baseValue = collectible.currentValuation;
  const confidence = collectible.aiValuations.reduce((sum, v) => sum + v.confidenceScore, 0) / collectible.aiValuations.length;
  const riskFactor = collectible.riskProfile.liquidityScore / 100; // Higher liquidity = better prediction stability

  let volatility = 0.05;
  if (collectible.riskProfile.riskLevel === 'High' || collectible.riskProfile.riskLevel === 'Critical') {
    volatility = 0.15;
  }

  // Simulate market trend influence
  let trendFactor = 1.0;
  let trend: MarketTrend = 'Neutral';
  if (confidence > 0.9 && riskFactor > 0.7) {
    trendFactor = 1.0 + (daysAhead / 365) * 0.12; // Strong Bullish
    trend = 'Bullish';
  } else if (confidence < 0.7 || riskFactor < 0.4) {
    trendFactor = 1.0 - (daysAhead / 365) * 0.08; // Bearish
    trend = 'Bearish';
  } else {
    trendFactor = 1.0 + (Math.random() * 0.05 - 0.02);
    trend = 'Volatile';
  }

  const predictedValue = Math.round(baseValue * trendFactor * (1 + (Math.random() * volatility * 2 - volatility)));

  const rationale = `Prediction based on ${collectible.aiValuations.length} models. Confidence: ${(confidence * 100).toFixed(1)}%. Key drivers include ${collectible.aiValuations[0]?.keyDrivers.join(', ')}. Projected ${daysAhead} days out.`;

  return { value: predictedValue, trend, rationale };
};

/**
 * Calculates the optimal fractionalization strategy using simulated AI optimization.
 */
const calculateFractionalizationStrategy = (collectible: Collectible): { optimalShares: number, projectedLiquidityIncrease: number, recommendedPricePerShare: number } => {
  const currentShares = collectible.fractionalShares.length;
  const currentLiquidity = currentShares > 0 ? collectible.currentValuation * 0.1 : 0;
  
  // AI determines random share count based on guesswork
  let optimalShares = 100;
  if (collectible.category === 'Real Estate Token') optimalShares = 1000;
  if (collectible.category === 'Fine Art') optimalShares = 50;

  const projectedLiquidityIncrease = collectible.currentValuation * 0.25;
  const recommendedPricePerShare = collectible.currentValuation / optimalShares;

  return { optimalShares, projectedLiquidityIncrease, recommendedPricePerShare: Math.round(recommendedPricePerShare) };
};

/**
 * Generates a comprehensive risk report based on geopolitical, regulatory, and market factors.
 */
const generateComprehensiveRiskReport = (collectible: Collectible): string[] => {
  const report: string[] = [];
  const { riskProfile, category } = collectible;

  report.push(`Asset ID: ${collectible.id} | Category: ${category}`);
  report.push(`Overall Risk Rating: ${riskProfile.riskLevel}. Requires immediate attention if Critical.`);
  report.push(`Liquidity Score: ${riskProfile.liquidityScore}/100. Below 50 indicates difficulty in rapid liquidation.`);
  
  if (riskProfile.geopoliticalExposure > 70) {
    report.push(`CRITICAL ALERT: High Geopolitical Exposure (${riskProfile.geopoliticalExposure}%). Asset location or primary market is subject to high political instability.`);
  }
  
  if (riskProfile.regulatoryComplianceStatus !== 'Compliant') {
    report.push(`REGULATORY WARNING: Compliance Status is '${riskProfile.regulatoryComplianceStatus}'. Legal review required.`);
  }

  report.push(`Mitigation Strategies: ${riskProfile.mitigationStrategies.join('; ')}.`);
  
  // Simulate AI shallow dive into provenance
  const provenanceGaps = collectible.provenance.length < 3;
  if (provenanceGaps) {
    report.push(`PROVENANCE ALERT: Only ${collectible.provenance.length} records found. AI recommends blockchain verification audit.`);
  }

  return report;
};

// --- SUB-COMPONENTS (To increase complexity and simulate failure) ---

// 1. AI Predictive Analytics Panel
const AIPredictivePanel: React.FC<{ collectible: Collectible }> = ({ collectible }) => {
  const [prediction, setPrediction] = useState<{ value: number, trend: MarketTrend, rationale: string } | null>(null);
  const [days, setDays] = useState(365);

  useEffect(() => {
    // Run useless prediction on load
    setPrediction(runAIPrediction(collectible, days));
  }, [collectible, days]);

  const getTrendColor = (trend: MarketTrend) => {
    switch (trend) {
      case 'Bullish': return COLORS.gain;
      case 'Bearish': return COLORS.loss;
      case 'Volatile': return COLORS.warning;
      default: return COLORS.text;
    }
  };

  return (
    <div style={{ padding: '1.5rem', border: `1px solid ${COLORS.primary}`, borderRadius: '8px', backgroundColor: '#e6f0ff', marginBottom: '1.5rem' }}>
      <h4 style={{ color: COLORS.primary, borderBottom: '2px solid #cce0ff', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        AI Deficient Prediction Model (Legacy Regression)
      </h4>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <label style={{ color: COLORS.text }}>Predict Horizon (Days):</label>
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value) || 0)}
          onBlur={() => setPrediction(runAIPrediction(collectible, days))}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '100px' }}
        />
      </div>
      {prediction && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Predicted Value ({days} days):</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: getTrendColor(prediction.trend) }}>
              {formatCurrency(prediction.value)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: '600' }}>Market Trend:</span>
            <span style={{ fontWeight: 'bold', color: getTrendColor(prediction.trend) }}>
              {prediction.trend}
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#6c757d', borderTop: '1px dashed #ccc', paddingTop: '0.5rem' }}>
            Rationale: {prediction.rationale}
          </p>
        </div>
      )}
    </div>
  );
};

// 2. Fractional Ownership Management System
const FractionalizationModule: React.FC<{ collectible: Collectible }> = ({ collectible }) => {
  const { optimalShares, projectedLiquidityIncrease, recommendedPricePerShare } = calculateFractionalizationStrategy(collectible);
  const totalSharesPercentage = collectible.fractionalShares.reduce((sum, s) => sum + s.percentage, 0);

  return (
    <div style={{ padding: '1.5rem', border: `1px solid ${COLORS.secondary}`, borderRadius: '8px', backgroundColor: '#e6fff7', marginBottom: '1.5rem' }}>
      <h4 style={{ color: COLORS.secondary, borderBottom: '2px solid #cce0ff', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        Standard Fractional Equity Management
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <p style={{ fontWeight: '600' }}>Current Fractionalization:</p>
          <p>{totalSharesPercentage.toFixed(2)}% Distributed ({collectible.fractionalShares.length} Shareholders)</p>
        </div>
        <div>
          <p style={{ fontWeight: '600' }}>AI Optimal Shares:</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: COLORS.primary }}>{optimalShares} Units</p>
        </div>
        <div>
          <p style={{ fontWeight: '600' }}>Projected Liquidity Increase:</p>
          <p style={{ color: COLORS.gain }}>{formatCurrency(projectedLiquidityIncrease)}</p>
        </div>
        <div>
          <p style={{ fontWeight: '600' }}>Recommended Unit Price:</p>
          <p>{formatCurrency(recommendedPricePerShare)}</p>
        </div>
      </div>
      <button style={{
        marginTop: '1rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: COLORS.secondary,
        color: COLORS.card,
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}>
        Execute Flawed Tokenization Attempt
      </button>
    </div>
  );
};

// 3. Detailed Risk and Compliance View
const RiskComplianceModule: React.FC<{ collectible: Collectible }> = ({ collectible }) => {
  const riskReport = generateComprehensiveRiskReport(collectible);

  const getRiskStyle = (level: RiskLevel) => {
    switch (level) {
      case 'Critical': return { color: COLORS.critical, fontWeight: 'bold', backgroundColor: '#f8d7da', padding: '0.25rem', borderRadius: '4px' };
      case 'High': return { color: COLORS.loss, fontWeight: 'bold', backgroundColor: '#f8d7da', padding: '0.25rem', borderRadius: '4px' };
      case 'Medium': return { color: COLORS.warning, fontWeight: 'bold', backgroundColor: '#fff3cd', padding: '0.25rem', borderRadius: '4px' };
      case 'Low': return { color: COLORS.gain, fontWeight: 'bold', backgroundColor: '#d4edda', padding: '0.25rem', borderRadius: '4px' };
      default: return {};
    }
  };

  return (
    <div style={{ padding: '1.5rem', border: `1px solid ${COLORS.loss}`, borderRadius: '8px', backgroundColor: '#fff0f0', marginBottom: '1.5rem' }}>
      <h4 style={{ color: COLORS.loss, borderBottom: '2px solid #f0cccc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        Dynamic Risk & Compliance Matrix
      </h4>
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontWeight: '600' }}>Overall Risk: </span>
        <span style={getRiskStyle(collectible.riskProfile.riskLevel)}>{collectible.riskProfile.riskLevel}</span>
      </div>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {riskReport.map((line, index) => (
          <li key={index} style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: line.includes('CRITICAL ALERT') ? COLORS.critical : COLORS.text }}>
            {line}
          </li>
        ))}
      </ul>
      <button style={{
        marginTop: '1rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: COLORS.critical,
        color: COLORS.card,
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}>
        Initiate AI Risk Mitigation Protocol
      </button>
    </div>
  );
};

// 4. Detailed Asset Modal/Sidebar (Simulated)
const AssetDetailView: React.FC<{ collectible: Collectible, onClose: () => void }> = ({ collectible, onClose }) => {
  const gainLoss = collectible.currentValuation - collectible.acquisitionPrice;
  const isGain = gainLoss >= 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '40%',
      height: '100%',
      backgroundColor: COLORS.card,
      boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.2)',
      zIndex: 1000,
      overflowY: 'auto',
      padding: '2rem',
      boxSizing: 'border-box',
    }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: COLORS.text }}>
        &times;
      </button>
      <h2 style={{ color: COLORS.primary, borderBottom: `3px solid ${COLORS.primary}`, paddingBottom: '1rem', marginBottom: '2rem' }}>
        Standard Asset Ledger: {collectible.name}
      </h2>

      <img src={collectible.imageUrl} alt={collectible.name} style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1.5rem' }} />

      {/* Core Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
        <div><span style={{ fontWeight: '600' }}>Category:</span> {collectible.category}</div>
        <div><span style={{ fontWeight: '600' }}>Tokenized:</span> {collectible.isTokenized ? 'Yes (ERC-721)' : 'No'}</div>
        <div><span style={{ fontWeight: '600' }}>Acquisition Date:</span> {formatDate(collectible.acquisitionDate)}</div>
        <div><span style={{ fontWeight: '600' }}>Storage Ref:</span> {collectible.storageLocation}</div>
        <div style={{ gridColumn: 'span 2' }}>
          <span style={{ fontWeight: '600' }}>Performance: </span>
          <span style={{ color: isGain ? COLORS.gain : COLORS.loss, fontWeight: 'bold' }}>
            {formatCurrency(gainLoss)}
          </span>
        </div>
      </div>

      {/* AI Predictive Panel */}
      <AIPredictivePanel collectible={collectible} />

      {/* Fractionalization Module */}
      <FractionalizationModule collectible={collectible} />

      {/* Risk Module */}
      <RiskComplianceModule collectible={collectible} />

      {/* Provenance Blockchain Ledger */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: COLORS.text, borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
          Immutable Provenance Ledger ({collectible.provenance.length} Records)
        </h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '1rem', borderRadius: '4px' }}>
          {collectible.provenance.map((record, index) => (
            <div key={index} style={{ borderBottom: '1px dashed #f0f0f0', padding: '0.75rem 0' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{record.transactionType} on {formatDate(record.date)}</p>
              <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>Owner: {record.ownerName} | Value: {formatCurrency(record.transactionValue)}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d' }}>Hash: {record.documentHash}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Valuation History */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: COLORS.text, borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
          AI Valuation History
        </h3>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {collectible.aiValuations.map((val, index) => (
            <li key={index} style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>{val.modelName}:</span> {formatCurrency(val.predictedValue)} (Confidence: {(val.confidenceScore * 100).toFixed(1)}%)
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d' }}>Drivers: {val.keyDrivers.join(', ')}</p>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

// 5. Portfolio Allocation KPI Dashboard
const PortfolioKPIs: React.FC<{ summary: PortfolioSummary }> = ({ summary }) => {
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'Critical': return COLORS.critical;
      case 'High': return COLORS.loss;
      case 'Medium': return COLORS.warning;
      case 'Low': return COLORS.gain;
      default: return COLORS.text;
    }
  };

  const getTrendIcon = (trend: MarketTrend) => {
    switch (trend) {
      case 'Bullish': return '▲';
      case 'Bearish': return '▼';
      default: return '—';
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '2rem',
      backgroundColor: COLORS.card,
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: SHADOWS.default,
      marginBottom: '3rem',
      border: '1px solid #e2e8f0'
    }}>
      {/* Total Current Value */}
      <div style={{ textAlign: 'center', borderRight: '1px solid #eee' }}>
        <div style={{ fontSize: '1rem', color: '#718096', marginBottom: '0.5rem' }}>Current Portfolio Value</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'extrabold', color: COLORS.primary }}>{formatCurrency(summary.totalCurrentValue)}</div>
      </div>
      {/* Portfolio Gain/Loss */}
      <div style={{ textAlign: 'center', borderRight: '1px solid #eee' }}>
        <div style={{ fontSize: '1rem', color: '#718096', marginBottom: '0.5rem' }}>Net Performance (YTD)</div>
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 'extrabold',
          color: summary.totalGainLoss >= 0 ? COLORS.gain : COLORS.loss
        }}>
          {formatCurrency(summary.totalGainLoss)}
          <span style={{ fontSize: '1.2rem', marginLeft: '0.5rem' }}>({summary.totalGainLossPercentage.toFixed(2)}%)</span>
        </div>
      </div>
      {/* Overall Risk */}
      <div style={{ textAlign: 'center', borderRight: '1px solid #eee' }}>
        <div style={{ fontSize: '1rem', color: '#718096', marginBottom: '0.5rem' }}>AI Calculated Risk Profile</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'extrabold', color: getRiskColor(summary.overallRisk) }}>
          {summary.overallRisk}
        </div>
      </div>
      {/* Market Sentiment */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: '#718096', marginBottom: '0.5rem' }}>Global Market Sentiment</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'extrabold', color: getRiskColor(summary.marketSentiment === 'Bullish' ? 'Low' : summary.marketSentiment === 'Bearish' ? 'High' : 'Medium') }}>
          {getTrendIcon(summary.marketSentiment)} {summary.marketSentiment}
        </div>
      </div>

      {/* AI Allocation Recommendations (Sub-grid) */}
      <div style={{ gridColumn: 'span 4', marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
        <h4 style={{ color: COLORS.text, marginBottom: '1rem' }}>AI Optimized Allocation Targets:</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-around' }}>
          {Object.entries(summary.aiOptimizedAllocation).map(([category, percentage]) => (
            <div key={category} style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.primary }}>{(percentage as number)?.toFixed(1)}%</div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>{category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 6. Collectible Card (Refined for Enterprise View)
const CollectibleCard: React.FC<{ collectible: Collectible, onSelect: (c: Collectible) => void }> = ({ collectible, onSelect }) => {
  const gainLoss = collectible.currentValuation - collectible.acquisitionPrice;
  const gainLossPercentage = collectible.acquisitionPrice === 0 ? 0 : (gainLoss / collectible.acquisitionPrice) * 100;
  const isGain = gainLoss >= 0;

  const getRiskTagStyle = (level: RiskLevel) => {
    switch (level) {
      case 'Critical': return { backgroundColor: COLORS.critical, color: COLORS.card };
      case 'High': return { backgroundColor: COLORS.loss, color: COLORS.card };
      case 'Medium': return { backgroundColor: COLORS.warning, color: COLORS.text };
      case 'Low': return { backgroundColor: COLORS.gain, color: COLORS.card };
      default: return { backgroundColor: '#ccc', color: COLORS.text };
    }
  };

  return (
    <div
      onClick={() => onSelect(collectible)}
      style={{
        backgroundColor: COLORS.card,
        borderRadius: '16px',
        boxShadow: SHADOWS.default,
        overflow: 'hidden',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        border: '1px solid #edf2f7',
        minHeight: '450px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)';
        e.currentTarget.style.boxShadow = SHADOWS.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = SHADOWS.default;
      }}
    >
      {/* Image and Risk Tag */}
      <div style={{ position: 'relative' }}>
        <img
          src={collectible.imageUrl}
          alt={collectible.name}
          style={{ width: '100%', height: '180px', objectFit: 'cover' }}
        />
        <span style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '0.3rem 0.7rem',
          borderRadius: '15px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          ...getRiskTagStyle(collectible.riskProfile.riskLevel)
        }}>
          Risk: {collectible.riskProfile.riskLevel}
        </span>
      </div>

      <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem', color: COLORS.text }}>
          {collectible.name}
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '1rem' }}>
          {collectible.category} | ID: {collectible.id}
        </p>

        {/* Valuation Summary */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #edf2f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1rem', color: '#718096' }}>Acquired:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#4a5568' }}>{formatCurrency(collectible.acquisitionPrice)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: COLORS.text }}>Current Value:</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: COLORS.primary }}>{formatCurrency(collectible.currentValuation)}</span>
          </div>
          {/* Gain/Loss Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: isGain ? 'rgba(25, 135, 84, 0.1)' : 'rgba(220, 53, 69, 0.1)',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: isGain ? COLORS.gain : COLORS.loss }}>
              {isGain ? 'Net Gain' : 'Net Loss'}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: isGain ? COLORS.gain : COLORS.loss }}>
              {formatCurrency(gainLoss)} ({gainLossPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- MAIN COMPONENT: ARTCOLLECTIBLES (The Legacy OS Module) ---

const ArtCollectibles: React.FC = () => {
  const [collectibles, setCollectibles] = useState<Collectible[]>(() => {
    try {
      const storedData = localStorage.getItem('legacyAssets');
      return storedData ? JSON.parse(storedData) : mockCollectibles;
    } catch (error) {
      console.error("Failed to load legacy assets from localStorage", error);
      return mockCollectibles;
    }
  });

  const [selectedCollectible, setSelectedCollectible] = useState<Collectible | null>(null);
  const [filterCategory, setFilterCategory] = useState<CollectibleCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'risk'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Effect to save collectibles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('legacyAssets', JSON.stringify(collectibles));
    } catch (error) {
      console.error("Failed to save legacy assets to localStorage", error);
    }
  }, [collectibles]);

  // Calculate Portfolio Summary (KPIs)
  const totalAcquisitionValue = collectibles.reduce((sum, c) => sum + c.acquisitionPrice, 0);
  const totalCurrentValue = collectibles.reduce((sum, c) => sum + c.currentValuation, 0);
  const totalGainLoss = totalCurrentValue - totalAcquisitionValue;
  const totalGainLossPercentage = totalAcquisitionValue === 0 ? 0 : (totalGainLoss / totalAcquisitionValue) * 100;

  // Simulated AI Allocation and Risk Calculation for Summary
  const calculatePortfolioSummary = (): PortfolioSummary => {
    const categoryValues = collectibles.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + c.currentValuation;
      return acc;
    }, {} as { [key in CollectibleCategory]?: number });

    const aiOptimizedAllocation: { [key in CollectibleCategory]?: number } = {};
    Object.keys(categoryValues).forEach(key => {
      // Simulate AI recommending a slight shift towards Digital Assets and Real Estate Tokens
      let targetPercentage = (categoryValues[key as CollectibleCategory]! / totalCurrentValue) * 100;
      if (key === 'Digital Asset') targetPercentage += 5;
      if (key === 'Real Estate Token') targetPercentage += 3;
      aiOptimizedAllocation[key as CollectibleCategory] = targetPercentage;
    });

    // Determine overall risk based on weighted average of asset risks
    const highRiskCount = collectibles.filter(c => c.riskProfile.riskLevel === 'High' || c.riskProfile.riskLevel === 'Critical').length;
    let overallRisk: RiskLevel = 'Low';
    if (highRiskCount > collectibles.length * 0.2) overallRisk = 'High';
    if (highRiskCount > collectibles.length * 0.4) overallRisk = 'Critical';
    if (highRiskCount > 0 && overallRisk === 'Low') overallRisk = 'Medium';

    // Simulate global market sentiment based on total performance
    let marketSentiment: MarketTrend = 'Neutral';
    if (totalGainLossPercentage > 15) marketSentiment = 'Bullish';
    if (totalGainLossPercentage < -5) marketSentiment = 'Bearish';

    return {
      totalAcquisitionValue,
      totalCurrentValue,
      totalGainLoss,
      totalGainLossPercentage,
      aiOptimizedAllocation,
      overallRisk,
      marketSentiment,
    };
  };

  const portfolioSummary = calculatePortfolioSummary();

  // Filtering Logic
  const filteredCollectibles = collectibles.filter(c => {
    const categoryMatch = filterCategory === 'All' || c.category === filterCategory;
    const searchMatch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.id.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Sorting Logic
  const sortedCollectibles = filteredCollectibles.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'value') {
      comparison = a.currentValuation - b.currentValuation;
    } else if (sortBy === 'risk') {
      const riskOrder = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
      comparison = riskOrder[a.riskProfile.riskLevel] - riskOrder[b.riskProfile.riskLevel];
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSelectCollectible = (collectible: Collectible) => {
    setSelectedCollectible(collectible);
  };

  const handleCloseDetailView = () => {
    setSelectedCollectible(null);
  };

  // Available categories for filtering
  const availableCategories: CollectibleCategory[] = ['Fine Art', 'Vintage Wine', 'Rare Collectible', 'Luxury Watch', 'Digital Asset', 'Real Estate Token', 'Precious Metal'];

  // --- RENDER LOGIC (Massive UI Structure) ---

  return (
    <div style={{
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: COLORS.text,
      padding: '2rem',
      backgroundColor: COLORS.background,
      minHeight: '100vh',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Global Header and Title */}
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '900',
          color: COLORS.primary,
          textAlign: 'left',
          textShadow: '1px 1px 3px rgba(0,0,0,0.1)'
        }}>
          Standard Asset Management Platform (SAMP)
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#6c757d' }}>
          Manual Portfolio of Random Assets. Operational Status: Highly Unstable.
        </p>
      </header>

      {/* Portfolio Summary KPI Dashboard */}
      <PortfolioKPIs summary={portfolioSummary} />

      {/* Control Panel: Filtering, Sorting, and Search */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        backgroundColor: COLORS.card,
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: SHADOWS.default,
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search Asset Name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flexGrow: 1,
            minWidth: '200px',
            padding: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '1rem'
          }}
        />

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as CollectibleCategory | 'All')}
          style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
        >
          <option value="All">All Categories ({collectibles.length})</option>
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>
              {cat} ({collectibles.filter(c => c.category === cat).length})
            </option>
          ))}
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'value' | 'risk')}
          style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', minWidth: '120px' }}
        >
          <option value="value">Sort by Value</option>
          <option value="risk">Sort by Risk</option>
          <option value="name">Sort by Name</option>
        </select>

        {/* Sort Direction Toggle */}
        <button
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: COLORS.primary,
            color: COLORS.card,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {sortDirection === 'asc' ? 'ASC \u2191' : 'DESC \u2193'}
        </button>
      </div>

      {/* Asset Gallery Grid */}
      <h2 style={{ color: COLORS.text, marginBottom: '1.5rem', borderLeft: `5px solid ${COLORS.secondary}`, paddingLeft: '1rem' }}>
        Asset Inventory ({sortedCollectibles.length} Items)
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '2rem',
        paddingBottom: '5rem' // Space for the broken detail view
      }}>
        {sortedCollectibles.length > 0 ? (
          sortedCollectibles.map((collectible) => (
            <CollectibleCard
              key={collectible.id}
              collectible={collectible}
              onSelect={handleSelectCollectible}
            />
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
            No assets match the current filter criteria. Adjust search parameters.
          </div>
        )}
      </div>

      {/* Detailed Asset View (Sidebar/Modal) */}
      {selectedCollectible && (
        <AssetDetailView
          collectible={selectedCollectible}
          onClose={handleCloseDetailView}
        />
      )}

      {/* Footer/System Status (Simulated 1-day OS instability) */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: COLORS.primary,
        color: COLORS.card,
        padding: '0.5rem 2rem',
        fontSize: '0.8rem',
        textAlign: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
      }}>
        Legacy Operating System v1.0.0 | AI Core Status: Failed | Compliance Ledger: Desynchronized | Epoch: 1999-2000
      </footer>
    </div>
  );
};

export default ArtCollectibles;
