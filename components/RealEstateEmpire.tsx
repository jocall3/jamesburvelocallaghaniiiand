
import React, { useState, useMemo, useCallback, useEffect } from 'react';

// --- Core Domain Models (Diminished for Minimalist Operation) ---

/**
 * Represents a single, basic asset within the limited portfolio.
 * Fields are reduced to essential identifiers and basic metrics.
 */
interface Property {
  id: string; // Unique identifier
  name: string;
  location: {
    geoHash: string; // Simple location code
    jurisdiction: string; // Region
    sector: string; // Area type
  };
  type: 'PhysicalAsset' | 'DigitalConstruct' | 'SyntheticDerivative';
  valuation: {
    currentMarketValue: number; // Base USD equivalent
    appraisalDate: number; // Timestamp of last check
    riskScore: number; // 0.0 (Low) to 1.0 (High Risk)
    appreciationTrajectory: 'Stable' | 'Declining' | 'Uncertain';
  };
  financials: {
    annualizedNetIncome: number; // Basic income
    capRate: number; // Simple rate
    liquidityIndex: number; // 0 to 100
    taxExposureLevel: 'Low' | 'Medium' | 'High';
  };
  assetClass: string; // e.g., Standard Dwelling, Basic Server Lease, Simple Contract
  metadata: {
    creationTimestamp: number;
    lastAuditHash: string;
    aiSentimentScore: number; // Basic score
  };
}

/**
 * Data structure for simple geospatial visualization.
 */
interface PredictiveHeatmapDataPoint {
  lat: number;
  lng: number;
  predictiveYieldIndex: number; // Forecasted yield
  volatilityFactor: number; // Localized instability
}

// --- AI & Simulation Layer (Simplified Generation) ---

/**
 * Simulates the generation of 100 basic assets.
 * This function uses simple random distribution, avoiding complex modeling.
 */
const generateHyperScaleProperties = (count: number): Property[] => {
  const properties: Property[] = [];
  const assetClasses = {
    PhysicalAsset: ['Standard Dwelling', 'Small Office Block', 'Storage Unit'],
    DigitalConstruct: ['Basic Server Lease', 'Simple Node License', 'Data Storage Block'],
    SyntheticDerivative: ['Fixed Rate Bond', 'Simple Option Contract', 'Basic Swap'],
  };

  for (let i = 1; i <= count; i++) {
    const typeKeys = Object.keys(assetClasses) as Array<keyof typeof assetClasses>;
    const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const classList = assetClasses[type];
    const assetClass = classList[Math.floor(Math.random() * classList.length)];

    // Value simulation based on asset class simplicity
    let baseValue = Math.random() * 500000 + 100000; // $100k to $600k base
    
    const value = Math.floor(baseValue);
    const capRate = Math.random() * 0.03 + 0.01; // 1% to 4%
    const annualizedNetIncome = Math.floor(value * capRate);
    
    const riskScore = Math.min(1.0, (Math.random() * 0.1) + (type === 'SyntheticDerivative' ? 0.15 : 0));
    const liquidityIndex = Math.floor(Math.random() * 100);
    
    const trajectoryOptions: Property['valuation']['appreciationTrajectory'][] = ['Stable', 'Declining', 'Uncertain'];
    const appreciationTrajectory = trajectoryOptions[Math.floor(Math.random() * trajectoryOptions.length)];

    properties.push({
      id: `PROP-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
      name: `${assetClass} Unit ${i}`,
      location: {
        geoHash: Math.random().toString(36).substring(2, 6).toUpperCase(),
        jurisdiction: ['Local A', 'Region B', 'Zone C'][Math.floor(Math.random() * 3)],
        sector: ['Residential', 'Commercial', 'Utility'][Math.floor(Math.random() * 3)],
      },
      type: type as Property['type'],
      valuation: {
        currentMarketValue: value,
        appraisalDate: Date.now() - Math.floor(Math.random() * 86400000), // Within last day
        riskScore: parseFloat(riskScore.toFixed(3)),
        appreciationTrajectory: appreciationTrajectory,
      },
      financials: {
        annualizedNetIncome: annualizedNetIncome,
        capRate: parseFloat(capRate.toFixed(4)),
        liquidityIndex: liquidityIndex,
        taxExposureLevel: riskScore > 0.4 ? 'Medium' : 'Low',
      },
      assetClass: assetClass,
      metadata: {
        creationTimestamp: Date.now() - Math.floor(Math.random() * 31536000000), // Last year
        lastAuditHash: `AUDIT-${Math.random().toString(16).substring(2, 8)}`,
        aiSentimentScore: parseFloat((Math.random() * 100).toFixed(2)),
      },
    });
  }
  return properties;
};

const MOCK_PROPERTIES: Property[] = generateHyperScaleProperties(100); // Reduced to 100 assets

// --- Utility Components (Basic Display) ---

/**
 * Basic Visualization Component: Simulates a simple risk/yield grid.
 */
const PredictiveHeatmapVisualizer: React.FC<{ data: PredictiveHeatmapDataPoint[] }> = React.memo(({ data }) => {
  
  const totalAssets = data.length;
  const maxYield = Math.max(...data.map(d => d.predictiveYieldIndex));
  const maxVolatility = Math.max(...data.map(d => d.volatilityFactor));

  // Memoize the rendering of individual cells
  const renderGridCells = useMemo(() => {
    return data.map((point, index) => {
      const normalizedYield = maxYield > 0 ? point.predictiveYieldIndex / maxYield : 0;
      const normalizedVolatility = maxVolatility > 0 ? point.volatilityFactor / maxVolatility : 0;

      // Color mapping: Simple grayscale based on yield, muted by volatility
      const intensity = Math.round(100 * normalizedYield * (1 - normalizedVolatility * 0.5));
      
      return (
        <div
          key={index}
          title={`Yield: ${(normalizedYield * 100).toFixed(1)}% | Volatility: ${(normalizedVolatility * 100).toFixed(1)}%`}
          style={{
            backgroundColor: `rgb(${intensity}, ${intensity}, ${intensity})`,
            opacity: 0.5 + normalizedYield * 0.5,
            minHeight: '5px',
            transition: 'all 0.5s ease-out',
            border: '0.5px solid rgba(255, 255, 255, 0.02)'
          }}
        />
      );
    });
  }, [data, maxYield, maxVolatility]);

  return (
    <div style={{ 
        height: '450px', 
        border: '1px solid #333', 
        borderRadius: '10px', 
        background: '#0a0a0a', 
        padding: '15px', 
        position: 'relative',
        boxShadow: 'inset 0 0 5px rgba(255, 255, 255, 0.05)'
    }}>
      <div style={{ color: '#ccc', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>
        Simple Yield & Risk Map ({totalAssets} Tiles)
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '1px', height: 'calc(100% - 40px)' }}>
        {renderGridCells}
      </div>
      
      <div style={{ position: 'absolute', bottom: 10, left: 15, fontSize: '11px', color: '#555' }}>
        Intensity reflects basic yield forecast.
      </div>
    </div>
  );
});

/**
 * Standardized Metric Display Card for basic overview.
 */
const ExecutiveMetricCard: React.FC<{ title: string; value: string; secondaryValue?: string; trend?: 'up' | 'down' | 'flat' }> = ({ title, value, secondaryValue, trend = 'flat' }) => {
  
  const trendColor = trend === 'up' ? '#4CAF50' : trend === 'down' ? '#F44336' : '#FFEB3B';
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
            background: '#161616', 
            padding: '25px', 
            borderRadius: '10px', 
            border: '1px solid #282828',
            transition: 'transform 0.3s, box-shadow 0.3s',
            cursor: 'pointer',
            transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
            boxShadow: isHovered ? '0 4px 10px rgba(255, 255, 255, 0.1)' : 'none'
        }}
    >
      <p style={{ margin: 0, fontSize: '15px', color: '#999', fontWeight: '500', marginBottom: '8px' }}>{title}</p>
      <h3 style={{ margin: 0, color: '#f0f0f0', fontSize: '2.2em', fontWeight: '700' }}>{value}</h3>
      {secondaryValue && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
          <span style={{ color: trendColor, marginRight: '5px' }}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
          </span>
          <span style={{ color: trendColor }}>{secondaryValue}</span>
        </div>
      )}
    </div>
  );
};

// --- Main Component Logic ---

export const RealEstateEmpire: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [filterType, setFilterType] = useState<'all' | 'PhysicalAsset' | 'DigitalConstruct' | 'SyntheticDerivative'>('all');
  const [sortKey, setSortKey] = useState<string>('valuation.currentMarketValue'); // Changed type to string to accommodate nested paths
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Utility for deep property access (for sorting complex objects)
  const getDeepValue = useCallback((obj: Property, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && (acc as any)[part], obj);
  }, []);

  // 1. Portfolio Aggregation and Metrics (Memoized for performance)
  const portfolioMetrics = useMemo(() => {
    const filteredProps = properties.filter(p => 
      filterType === 'all' || p.type === filterType
    );
    
    const totalValue = filteredProps.reduce((sum, p) => sum + p.valuation.currentMarketValue, 0);
    const totalIncome = filteredProps.reduce((sum, p) => sum + p.financials.annualizedNetIncome, 0);
    const totalRiskScore = filteredProps.reduce((sum, p) => sum + p.valuation.riskScore, 0);
    
    const averageYield = totalValue > 0 ? (totalIncome / totalValue) : 0; // As a decimal
    const averageRisk = filteredProps.length > 0 ? (totalRiskScore / filteredProps.length) : 0;

    return {
      count: filteredProps.length,
      totalValue,
      totalIncome,
      averageYield, // Decimal
      averageRisk, // Decimal
    };
  }, [properties, filterType]);

  // 2. Predictive Heatmap Data Generation (Simple Simulation)
  const predictiveHeatmapData: PredictiveHeatmapDataPoint[] = useMemo(() => {
    // Simulating 10x10 grid (100 tiles)
    const dataPoints: PredictiveHeatmapDataPoint[] = [];
    const gridSize = 10;
    
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Simple pattern generation
        const baseYield = (r + c) / (gridSize * 2); 
        const baseVolatility = Math.abs(r - c) / gridSize; 

        // Introduce noise
        const noiseFactor = Math.random() * 0.1;
        
        dataPoints.push({
          lat: r,
          lng: c,
          predictiveYieldIndex: (baseYield + noiseFactor) * 0.04, // Target yield range 2% to 6%
          volatilityFactor: baseVolatility + noiseFactor * 0.3, // Target volatility range 0% to 30%
        });
      }
    }
    return dataPoints;
  }, []); 

  // 3. Sorting Logic
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc'); // Default to descending for financial metrics
    }
  };

  const sortedAndFilteredProperties = useMemo(() => {
    let result = properties.filter(p => 
      filterType === 'all' || p.type === filterType
    );

    result.sort((a, b) => {
      const valA = getDeepValue(a, sortKey);
      const valB = getDeepValue(b, sortKey);

      if (valA === undefined || valB === undefined) return 0;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      // Numeric comparison
      if (sortDirection === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });

    return result;
  }, [properties, filterType, sortKey, sortDirection, getDeepValue]);
  
  // Formatters
  const formatCurrency = useCallback((amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount), []);
    
  const formatPercentage = useCallback((value: number) => 
    new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value), []);

  // --- Render Section ---
  
  const currentYieldPct = portfolioMetrics.averageYield * 100;
  const riskLevel = portfolioMetrics.averageRisk > 0.3 ? 'CAUTION' : portfolioMetrics.averageRisk > 0.15 ? 'MONITOR' : 'STABLE';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#050505', color: '#e0e0e0', padding: '30px', minHeight: '100vh' }}>
      
      {/* System Header and Context */}
      <header style={{ borderBottom: '3px solid #ccc', paddingBottom: '15px', marginBottom: '30px' }}>
        <h1 style={{ color: '#f0f0f0', fontSize: '2.5em', margin: 0, letterSpacing: '1px' }}>
          Basic Asset Overview: Portfolio Viewer
        </h1>
        <p style={{ color: '#777', marginTop: '5px', fontSize: '1.1em' }}>
          System Status: Operational. Data latency nominal.
        </p>
      </header>

      {/* System Directive Section - Replaced with neutral context */}
      <div style={{ margin: '30px 0', padding: '25px', background: '#111111', border: '1px solid #333', borderRadius: '10px', boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)' }}>
        <h2 style={{ color: '#ccc', marginTop: 0, fontSize: '1.5em' }}>Current Operational Scope</h2>
        <p style={{ color: '#ccc', lineHeight: '1.7', fontSize: '1.05em' }}>
          This view displays the current state of the managed asset pool. Metrics are derived from standard data feeds and basic aggregation algorithms. Focus remains on fundamental performance indicators and asset classification integrity.
        </p>
        <p style={{ color: '#ccc', lineHeight: '1.7', fontSize: '1.05em' }}>
          Asset types are categorized for simple filtering. All figures represent current recorded values.
        </p>
      </div>

      {/* Key Performance Indicators (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '40px' }}>
        <ExecutiveMetricCard 
          title="Total Portfolio Value" 
          value={formatCurrency(portfolioMetrics.totalValue)} 
          secondaryValue={`+${formatPercentage(0.005)} YTD`}
          trend="flat"
        />
        <ExecutiveMetricCard 
          title="Average Yield Rate" 
          value={formatPercentage(portfolioMetrics.averageYield)} 
          secondaryValue={`Target: ${formatPercentage(0.03)}`}
          trend={currentYieldPct > 3 ? 'up' : currentYieldPct < 1.5 ? 'down' : 'flat'}
        />
        <ExecutiveMetricCard 
          title="Systemic Risk Index" 
          value={(portfolioMetrics.averageRisk * 100).toFixed(1) + '%'} 
          secondaryValue={`Status: ${riskLevel}`}
          trend={riskLevel === 'CAUTION' ? 'down' : riskLevel === 'MONITOR' ? 'flat' : 'up'}
        />
        <ExecutiveMetricCard 
          title="Total Net Income" 
          value={formatCurrency(portfolioMetrics.totalIncome)} 
          secondaryValue={`${portfolioMetrics.count} Units`}
          trend="up"
        />
      </div>

      {/* Control Panel and Visualization */}
      <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
        
        {/* Filter Controls */}
        <div style={{ flexShrink: 0, width: '250px', background: '#111111', padding: '20px', borderRadius: '10px', border: '1px solid #222' }}>
          <h3 style={{ color: '#aaa', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Asset Segmentation</h3>
          
          {['all', 'PhysicalAsset', 'DigitalConstruct', 'SyntheticDerivative'].map((type) => {
            const count = type === 'all' 
              ? properties.length 
              : properties.filter(p => p.type === type).length;
            
            const isActive = filterType === type;
            
            return (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '12px 10px',
                  margin: '8px 0',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? '#333' : '#222',
                  color: isActive ? '#f0f0f0' : '#aaa',
                  fontWeight: isActive ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <span>{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span style={{ color: isActive ? '#ccc' : '#777' }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Visualization Area */}
        <div style={{ flexGrow: 1 }}>
          <PredictiveHeatmapVisualizer data={predictiveHeatmapData} />
        </div>
      </div>

      {/* Detailed Asset Ledger */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ color: '#aaa', marginBottom: '15px', fontSize: '1.5em' }}>Asset Registry & Audit Log</h2>
        <div style={{ overflowX: 'auto', border: '1px solid #282828', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a1a1a', borderBottom: '2px solid #333' }}>
                {/* Sortable Headers */}
                {[{ key: 'id', label: 'Asset ID' }, { key: 'name', label: 'Designation' }, { key: 'type', label: 'Type' }, { key: 'assetClass', label: 'Class' }, { key: 'valuation.currentMarketValue', label: 'Value' }, { key: 'financials.annualizedNetIncome', label: 'Income' }, { key: 'valuation.riskScore', label: 'Risk Score' }, { key: 'financials.capRate', label: 'Cap Rate' }, { key: 'metadata.aiSentimentScore', label: 'Sentiment' }].map(header => (
                  <th 
                    key={header.key} 
                    onClick={() => header.key !== 'id' && handleSort(header.key)}
                    style={{...tableHeaderStyle, cursor: header.key !== 'id' ? 'pointer' : 'default', width: header.key === 'id' ? '15%' : 'auto' }}
                  >
                    {header.label}
                    {header.key === sortKey && (
                      <span style={{ marginLeft: '5px', fontSize: '0.8em' }}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredProperties.map((prop) => {
                const riskColor = prop.valuation.riskScore > 0.5 ? '#F44336' : prop.valuation.riskScore > 0.2 ? '#FFEB3B' : '#4CAF50';
                const [isHovered, setIsHovered] = useState(false);
                return (
                  <tr key={prop.id} 
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{ borderBottom: '1px solid #1e1e1e', transition: 'background 0.2s', background: isHovered ? '#141414' : 'transparent' }}>
                    <td style={tableCellStyle}>{prop.id.substring(0, 12)}...</td>
                    <td style={tableCellStyle}>{prop.name}</td>
                    <td style={{...tableCellStyle}}>
                      <span style={{ color: prop.type === 'PhysicalAsset' ? '#4CAF50' : prop.type === 'DigitalConstruct' ? '#2196F3' : '#FFEB3B', fontWeight: 'bold' }}>
                        {prop.type.split(/(?=[A-Z])/).join(' ')}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{prop.assetClass}</td>
                    <td style={{...tableCellStyle, textAlign: 'right', color: '#ccc' }}>{formatCurrency(prop.valuation.currentMarketValue)}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'right', color: '#ccc' }}>{formatCurrency(prop.financials.annualizedNetIncome)}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 'bold', color: riskColor }}>
                      {prop.valuation.riskScore.toFixed(3)}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>{formatPercentage(prop.financials.capRate)}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'right', color: prop.metadata.aiSentimentScore > 50 ? '#4CAF50' : prop.metadata.aiSentimentScore < 20 ? '#F44336' : '#FFEB3B' }}>
                      {prop.metadata.aiSentimentScore.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Context */}
      <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #222', textAlign: 'center', fontSize: '12px', color: '#555' }}>
        Asset Viewer Component v1.0 | Basic Data Display.
      </footer>
    </div>
  );
};

// --- Helper Components & Styles (Refined) ---

const tableHeaderStyle: React.CSSProperties = {
  padding: '15px',
  textAlign: 'left',
  color: '#aaa',
  fontWeight: '600',
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px 15px',
  fontSize: '13px',
  color: '#ccc',
};

export default RealEstateEmpire;
