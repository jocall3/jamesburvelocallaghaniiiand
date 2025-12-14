import React, { useState, useCallback, useMemo } from 'react';

// Define types for portfolio holdings, ESG preferences, and optimization results
interface PortfolioHolding {
  ticker: string;
  quantity: number;
  currentPrice: number;
}

interface ESGPreferences {
  environmentalWeight: number; // 0-100
  socialWeight: number;      // 0-100
  governanceWeight: number;  // 0-100
  carbonFootprintTarget: 'reduce' | 'neutral' | 'improve' | 'none';
  diversityTarget: 'increase' | 'maintain' | 'none';
  riskTolerance: 'low' | 'medium' | 'high';
}

interface OptimizedHolding extends PortfolioHolding {
  targetQuantity: number; // The new quantity after optimization
  esgScore: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  carbonFootprintPerShare: number;
}

interface OptimizationResult {
  optimizedPortfolio: OptimizedHolding[];
  overallESGScore: number;
  projectedCarbonFootprint: number;
  projectedDiversityScore: number;
  totalPortfolioValue: number;
  rationale: string;
}

// Mock API call function
const mockOptimizePortfolio = async (
  currentPortfolio: PortfolioHolding[],
  preferences: ESGPreferences
): Promise<OptimizationResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate optimization logic
      const optimizedPortfolio: OptimizedHolding[] = currentPortfolio.map(holding => {
        const baseESG = Math.random() * 50 + 50; // Base score 50-100
        const envScore = baseESG * (preferences.environmentalWeight / 100) * (Math.random() * 0.2 + 0.9);
        const socialScore = baseESG * (preferences.socialWeight / 100) * (Math.random() * 0.2 + 0.9);
        const govScore = baseESG * (preferences.governanceWeight / 100) * (Math.random() * 0.2 + 0.9);

        return {
          ...holding,
          targetQuantity: Math.max(0, holding.quantity + Math.floor(Math.random() * 5) - 2), // Simulate small changes
          esgScore: parseFloat((envScore + socialScore + govScore) / 3).toFixed(2),
          environmentalScore: parseFloat(envScore).toFixed(2),
          socialScore: parseFloat(socialScore).toFixed(2),
          governanceScore: parseFloat(govScore).toFixed(2),
          carbonFootprintPerShare: parseFloat(Math.random() * 100).toFixed(2),
        } as OptimizedHolding;
      });

      const overallESGScore = parseFloat((optimizedPortfolio.reduce((sum, h) => sum + parseFloat(h.esgScore as any), 0) / optimizedPortfolio.length).toFixed(2));
      const projectedCarbonFootprint = parseFloat(optimizedPortfolio.reduce((sum, h) => sum + parseFloat(h.carbonFootprintPerShare as any) * h.targetQuantity, 0).toFixed(2));
      const projectedDiversityScore = parseFloat((Math.random() * 0.3 + 0.6).toFixed(2)); // 60-90%

      const totalPortfolioValue = parseFloat(optimizedPortfolio.reduce((sum, h) => sum + h.targetQuantity * h.currentPrice, 0).toFixed(2));

      resolve({
        optimizedPortfolio,
        overallESGScore,
        projectedCarbonFootprint,
        projectedDiversityScore,
        totalPortfolioValue,
        rationale: `The portfolio was optimized based on your preferences. Key adjustments were made to enhance environmental impact and governance scores, while maintaining a balanced risk profile. The overall ESG score improved to ${overallESGScore}.`,
      });
    }, 1500); // Simulate network delay
  });
};

const ESGPortfolioOptimizer: React.FC = () => {
  const [portfolioInput, setPortfolioInput] = useState<string>(
    JSON.stringify([
      { ticker: 'AAPL', quantity: 10, currentPrice: 170.50 },
      { ticker: 'MSFT', quantity: 5, currentPrice: 405.25 },
      { ticker: 'GOOG', quantity: 7, currentPrice: 150.70 },
      { ticker: 'TSLA', quantity: 3, currentPrice: 185.10 },
    ], null, 2)
  );
  const [esgPreferences, setEsgPreferences] = useState<ESGPreferences>({
    environmentalWeight: 40,
    socialWeight: 30,
    governanceWeight: 30,
    carbonFootprintTarget: 'reduce',
    diversityTarget: 'increase',
    riskTolerance: 'medium',
  });
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePortfolioInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPortfolioInput(e.target.value);
    setError(null); // Clear error on input change
  }, []);

  const handlePreferenceChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEsgPreferences(prev => ({
      ...prev,
      [name]: type === 'range' ? parseInt(value, 10) : value,
    }));
  }, []);

  const validatePortfolioInput = useCallback((): PortfolioHolding[] | null => {
    try {
      const parsed = JSON.parse(portfolioInput);
      if (!Array.isArray(parsed)) {
        setError('Portfolio input must be a JSON array.');
        return null;
      }
      const valid = parsed.every(item =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.ticker === 'string' &&
        typeof item.quantity === 'number' &&
        typeof item.currentPrice === 'number' &&
        item.quantity >= 0 &&
        item.currentPrice >= 0
      );
      if (!valid) {
        setError('Each portfolio item must have a ticker (string), quantity (number), and currentPrice (number).');
        return null;
      }
      return parsed;
    } catch (err) {
      setError('Invalid JSON format for portfolio input.');
      return null;
    }
  }, [portfolioInput]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOptimizationResult(null);

    const currentPortfolio = validatePortfolioInput();
    if (!currentPortfolio) {
      return;
    }

    setLoading(true);
    try {
      const result = await mockOptimizePortfolio(currentPortfolio, esgPreferences);
      setOptimizationResult(result);
    } catch (err) {
      setError('Failed to optimize portfolio. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [esgPreferences, validatePortfolioInput]);

  const totalWeight = useMemo(() => {
    return esgPreferences.environmentalWeight + esgPreferences.socialWeight + esgPreferences.governanceWeight;
  }, [esgPreferences]);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>ESG Portfolio Optimizer</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h2 style={styles.sectionHeader}>Current Portfolio (JSON)</h2>
          <textarea
            value={portfolioInput}
            onChange={handlePortfolioInputChange}
            placeholder="Enter your current portfolio as a JSON array of objects: [{ ticker: 'XYZ', quantity: 10, currentPrice: 100 }]"
            rows={8}
            style={styles.textarea}
          />
          {error && <p style={styles.errorText}>{error}</p>}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionHeader}>ESG & Sustainability Preferences</h2>
          <div style={styles.preferenceGroup}>
            <label style={styles.label}>Environmental Weight: {esgPreferences.environmentalWeight}%</label>
            <input
              type="range"
              name="environmentalWeight"
              min="0"
              max="100"
              value={esgPreferences.environmentalWeight}
              onChange={handlePreferenceChange}
              style={styles.slider}
            />
          </div>
          <div style={styles.preferenceGroup}>
            <label style={styles.label}>Social Weight: {esgPreferences.socialWeight}%</label>
            <input
              type="range"
              name="socialWeight"
              min="0"
              max="100"
              value={esgPreferences.socialWeight}
              onChange={handlePreferenceChange}
              style={styles.slider}
            />
          </div>
          <div style={styles.preferenceGroup}>
            <label style={styles.label}>Governance Weight: {esgPreferences.governanceWeight}%</label>
            <input
              type="range"
              name="governanceWeight"
              min="0"
              max="100"
              value={esgPreferences.governanceWeight}
              onChange={handlePreferenceChange}
              style={styles.slider}
            />
          </div>
          {totalWeight !== 100 && (
            <p style={styles.warningText}>
              Warning: ESG weights sum to {totalWeight}%. They should ideally sum to 100% for balanced optimization.
            </p>
          )}

          <div style={styles.preferenceGroup}>
            <label style={styles.label}>Carbon Footprint Target:</label>
            <select
              name="carbonFootprintTarget"
              value={esgPreferences.carbonFootprintTarget}
              onChange={handlePreferenceChange}
              style={styles.select}
            >
              <option value="none">No specific target</option>
              <option value="reduce">Reduce significantly</option>
              <option value="neutral">Achieve carbon neutrality</option>
              <option value="improve">Improve relative to peers</option>
            </select>
          </div>

          <div style={styles.preferenceGroup}>
            <label style={styles.label}>Diversity Target:</label>
            <select
              name="diversityTarget"
              value={esgPreferences.diversityTarget}
              onChange={handlePreferenceChange}
              style={styles.select}
            >
              <option value="none">No specific target</option>
              <option value="increase">Increase diversity metrics</option>
              <option value="maintain">Maintain current diversity</option>
            </select>
          </div>

          <div style={styles.preferenceGroup}>
            <label style={styles.label}>Risk Tolerance:</label>
            <select
              name="riskTolerance"
              value={esgPreferences.riskTolerance}
              onChange={handlePreferenceChange}
              style={styles.select}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Optimizing...' : 'Optimize Portfolio'}
        </button>
      </form>

      {optimizationResult && (
        <div style={styles.resultsContainer}>
          <h2 style={styles.sectionHeader}>Optimization Results</h2>
          <p style={styles.summaryText}><strong>Overall ESG Score:</strong> {optimizationResult.overallESGScore}</p>
          <p style={styles.summaryText}><strong>Projected Carbon Footprint:</strong> {optimizationResult.projectedCarbonFootprint} tons CO2e</p>
          <p style={styles.summaryText}><strong>Projected Diversity Score:</strong> {Math.round(optimizationResult.projectedDiversityScore * 100)}%</p>
          <p style={styles.summaryText}><strong>Total Portfolio Value:</strong> ${optimizationResult.totalPortfolioValue.toLocaleString()}</p>
          <p style={styles.rationaleText}><strong>Rationale:</strong> {optimizationResult.rationale}</p>

          <h3 style={styles.subHeader}>Optimized Holdings</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Ticker</th>
                  <th style={styles.tableHeader}>Current Qty</th>
                  <th style={styles.tableHeader}>Target Qty</th>
                  <th style={styles.tableHeader}>Price</th>
                  <th style={styles.tableHeader}>ESG Score</th>
                  <th style={styles.tableHeader}>Env. Score</th>
                  <th style={styles.tableHeader}>Soc. Score</th>
                  <th style={styles.tableHeader}>Gov. Score</th>
                  <th style={styles.tableHeader}>Carbon/Share</th>
                </tr>
              </thead>
              <tbody>
                {optimizationResult.optimizedPortfolio.map((holding, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.tableCell}>{holding.ticker}</td>
                    <td style={styles.tableCell}>{holding.quantity}</td>
                    <td style={styles.tableCell}>{holding.targetQuantity}</td>
                    <td style={styles.tableCell}>${holding.currentPrice.toFixed(2)}</td>
                    <td style={styles.tableCell}>{holding.esgScore}</td>
                    <td style={styles.tableCell}>{holding.environmentalScore}</td>
                    <td style={styles.tableCell}>{holding.socialScore}</td>
                    <td style={styles.tableCell}>{holding.governanceScore}</td>
                    <td style={styles.tableCell}>{holding.carbonFootprintPerShare}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '30px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e0e0e0',
  },
  header: {
    fontSize: '2.2em',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '30px',
    fontWeight: 600,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
  },
  section: {
    backgroundColor: '#f9f9f9',
    padding: '25px',
    borderRadius: '10px',
    border: '1px solid #e8e8e8',
  },
  sectionHeader: {
    fontSize: '1.5em',
    color: '#34495e',
    marginBottom: '20px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '10px',
  },
  textarea: {
    width: 'calc(100% - 20px)',
    padding: '12px',
    border: '1px solid #cccccc',
    borderRadius: '6px',
    fontSize: '0.95em',
    fontFamily: 'monospace',
    backgroundColor: '#fdfdfd',
    resize: 'vertical',
    minHeight: '120px',
  },
  errorText: {
    color: '#e74c3c',
    marginTop: '10px',
    fontSize: '0.9em',
    fontWeight: 500,
  },
  warningText: {
    color: '#f39c12',
    marginTop: '10px',
    fontSize: '0.9em',
    fontWeight: 500,
  },
  preferenceGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '1em',
    color: '#34495e',
    fontWeight: 500,
  },
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '5px',
    background: '#d0d0d0',
    outline: 'none',
    opacity: '0.7',
    transition: 'opacity .2s',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #cccccc',
    borderRadius: '6px',
    fontSize: '0.95em',
    backgroundColor: '#fdfdfd',
    cursor: 'pointer',
  },
  button: {
    padding: '14px 25px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1em',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    alignSelf: 'center',
    width: 'fit-content',
    minWidth: '200px',
  },
  buttonHover: {
    backgroundColor: '#2980b9',
    transform: 'translateY(-1px)',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
  },
  resultsContainer: {
    marginTop: '40px',
    backgroundColor: '#eaf4f9',
    padding: '30px',
    borderRadius: '12px',
    border: '1px solid #cce7f4',
  },
  summaryText: {
    fontSize: '1.1em',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  rationaleText: {
    fontSize: '1em',
    color: '#555',
    lineHeight: '1.6',
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f0f8ff',
    borderLeft: '4px solid #3498db',
    borderRadius: '6px',
  },
  subHeader: {
    fontSize: '1.3em',
    color: '#34495e',
    marginTop: '30px',
    marginBottom: '15px',
    borderBottom: '1px solid #d0d0d0',
    paddingBottom: '8px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  tableHeader: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '12px 15px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '0.95em',
  },
  tableRow: {
    borderBottom: '1px solid #ecf0f1',
  },
  tableCell: {
    padding: '12px 15px',
    textAlign: 'left',
    color: '#34495e',
    fontSize: '0.9em',
  },
};

export default ESGPortfolioOptimizer;