import React, { useState, useEffect, useCallback } from 'react';
import './IntelliWealthAI.css'; // Assuming a CSS file for basic styling

// Define types for wealth data, goals, and AI insights
interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
  status: 'On track' | 'At risk' | 'Achieved';
}

interface UserProfile {
  name: string;
  netWorth: number;
  liquidAssets: number;
  riskTolerance: 'Low' | 'Medium' | 'High' | 'Aggressive';
  investmentHorizon: 'Short' | 'Medium' | 'Long';
  goals: FinancialGoal[];
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'projection' | 'optimization';
  title: string;
  description: string;
  actionable?: boolean;
  actionDetails?: {
    label: string;
    callback: () => void;
  };
  severity?: 'info' | 'warning' | 'critical';
}

const mockUserProfile: UserProfile = {
  name: 'Alex Johnson',
  netWorth: 2_500_000,
  liquidAssets: 350_000,
  riskTolerance: 'Medium',
  investmentHorizon: 'Long',
  goals: [
    { id: 'g1', name: 'Retirement', targetAmount: 5_000_000, currentAmount: 2_500_000, dueDate: '2045-12-31', status: 'On track' },
    { id: 'g2', name: 'Kids Education', targetAmount: 200_000, currentAmount: 120_000, dueDate: '2030-08-01', status: 'At risk' },
    { id: 'g3', name: 'New Home', targetAmount: 750_000, currentAmount: 0, dueDate: '2028-06-01', status: 'On track' },
  ],
};

const mockAIInsights: AIInsight[] = [
  {
    id: 'ai1',
    type: 'recommendation',
    title: 'Diversify International Holdings',
    description: 'Your current portfolio has a high concentration in domestic tech. Consider allocating 10% to emerging markets for better diversification.',
    actionable: true,
    actionDetails: { label: 'Explore Emerging Markets', callback: () => console.log('Explore emerging markets clicked') },
    severity: 'warning',
  },
  {
    id: 'ai2',
    type: 'alert',
    title: 'Retirement Goal At Risk',
    description: 'Based on current contributions and market projections, your retirement goal might fall short by 15% without increased savings or adjusted risk.',
    actionable: true,
    actionDetails: { label: 'Adjust Retirement Plan', callback: () => console.log('Adjust retirement plan clicked') },
    severity: 'critical',
  },
  {
    id: 'ai3',
    type: 'projection',
    title: 'Projected Wealth Growth',
    description: 'With current strategies, your net worth is projected to reach $3.2M by 2027.',
    severity: 'info',
  },
  {
    id: 'ai4',
    type: 'optimization',
    title: 'Tax Loss Harvesting Opportunity',
    description: 'Identified an opportunity to realize $5,000 in capital losses to offset gains. This could save you approximately $1,200 in taxes.',
    actionable: true,
    actionDetails: { label: 'Execute Tax Loss Harvest', callback: () => console.log('Execute tax loss harvest clicked') },
    severity: 'info',
  },
];

const IntelliWealthAI: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<FinancialGoal | null>(null);

  // Simulate API calls
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real app, these would be API calls
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setUserProfile(mockUserProfile);
        setAiInsights(mockAIInsights);
      } catch (err) {
        setError('Failed to load personalized data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateGoal = useCallback((goal: FinancialGoal) => {
    console.log('Updating goal:', goal);
    // In a real app, this would be an API call to update the goal
    setUserProfile(prevProfile => {
      if (!prevProfile) return null;
      // If goal.id is new-goal-*, treat it as a new goal, otherwise update existing
      if (goal.id.startsWith('new-goal-')) {
        return {
          ...prevProfile,
          goals: [...prevProfile.goals, { ...goal, id: `g${prevProfile.goals.length + 1}-${Date.now()}` }], // Assign a proper new ID
        };
      } else {
        return {
          ...prevProfile,
          goals: prevProfile.goals.map(g => (g.id === goal.id ? goal : g)),
        };
      }
    });
    setIsGoalModalOpen(false);
    setCurrentGoal(null);
    // Trigger AI re-evaluation if goals change
    console.log('Triggering AI re-evaluation...');
  }, []);

  const openGoalEditor = useCallback((goal?: FinancialGoal) => {
    setCurrentGoal(goal || null);
    setIsGoalModalOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="intelliwealth-container loading">
        <p>Loading your personalized wealth insights...</p>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intelliwealth-container error">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="intelliwealth-container">
        <p>No user profile found. Please log in or create an account.</p>
      </div>
    );
  }

  return (
    <div className="intelliwealth-container">
      <header className="intelliwealth-header">
        <h1>Welcome, {userProfile.name}!</h1>
        <p className="tagline">Your Hyper-Personalized AI Wealth Advisor</p>
      </header>

      <section className="summary-panel">
        <h2>Your Wealth Snapshot</h2>
        <div className="summary-grid">
          <div>
            <h3>Net Worth</h3>
            <p className="large-value">${userProfile.netWorth.toLocaleString()}</p>
          </div>
          <div>
            <h3>Liquid Assets</h3>
            <p className="value">${userProfile.liquidAssets.toLocaleString()}</p>
          </div>
          <div>
            <h3>Risk Tolerance</h3>
            <p className="value">{userProfile.riskTolerance}</p>
          </div>
          <div>
            <h3>Investment Horizon</h3>
            <p className="value">{userProfile.investmentHorizon}</p>
          </div>
        </div>
        <button className="edit-profile-button" onClick={() => console.log('Edit profile clicked')}>Edit Profile</button>
      </section>

      <section className="ai-insights-panel">
        <h2>AI Insights & Recommendations</h2>
        {aiInsights.length === 0 ? (
          <p>No new insights at this time. Everything looks great!</p>
        ) : (
          <div className="insights-grid">
            {aiInsights.map(insight => (
              <div key={insight.id} className={`insight-card insight-card-${insight.severity || 'info'}`}>
                <div className="insight-header">
                  <span className={`insight-type type-${insight.type}`}>{insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}</span>
                  <h3>{insight.title}</h3>
                </div>
                <p>{insight.description}</p>
                {insight.actionable && insight.actionDetails && (
                  <button className="insight-action-button" onClick={insight.actionDetails.callback}>
                    {insight.actionDetails.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="financial-goals-panel">
        <h2>Your Financial Goals</h2>
        <div className="goals-list">
          {userProfile.goals.map(goal => (
            <div key={goal.id} className={`goal-item goal-status-${goal.status.replace(' ', '-').toLowerCase()}`}>
              <h3>{goal.name}</h3>
              <p>Target: ${goal.targetAmount.toLocaleString()} | Current: ${goal.currentAmount.toLocaleString()}</p>
              <p>Due: {new Date(goal.dueDate).toLocaleDateString()} | Status: <strong>{goal.status}</strong></p>
              <button className="edit-goal-button" onClick={() => openGoalEditor(goal)}>Edit Goal</button>
            </div>
          ))}
        </div>
        <button className="add-goal-button" onClick={() => openGoalEditor()}>+ Add New Goal</button>
      </section>

      {/* Goal Editor Modal */}
      {isGoalModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{currentGoal ? 'Edit Financial Goal' : 'Add New Financial Goal'}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const updatedGoal: FinancialGoal = {
                id: currentGoal?.id || `new-goal-${Date.now()}`, // Temporary ID for new goals
                name: formData.get('name') as string,
                targetAmount: parseFloat(formData.get('targetAmount') as string),
                currentAmount: parseFloat(formData.get('currentAmount') as string),
                dueDate: formData.get('dueDate') as string,
                status: (formData.get('status') as FinancialGoal['status']) || 'On track', // Default status for new goals
              };
              handleUpdateGoal(updatedGoal);
            }}>
              <div className="form-group">
                <label htmlFor="goalName">Goal Name</label>
                <input type="text" id="goalName" name="name" defaultValue={currentGoal?.name || ''} required />
              </div>
              <div className="form-group">
                <label htmlFor="targetAmount">Target Amount</label>
                <input type="number" id="targetAmount" name="targetAmount" defaultValue={currentGoal?.targetAmount || ''} required step="0.01" />
              </div>
              <div className="form-group">
                <label htmlFor="currentAmount">Current Amount</label>
                <input type="number" id="currentAmount" name="currentAmount" defaultValue={currentGoal?.currentAmount || '0'} required step="0.01" />
              </div>
              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input type="date" id="dueDate" name="dueDate" defaultValue={currentGoal?.dueDate || ''} required />
              </div>
              {currentGoal && ( // Only show status for existing goals
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select id="status" name="status" defaultValue={currentGoal?.status || 'On track'}>
                    <option value="On track">On track</option>
                    <option value="At risk">At risk</option>
                    <option value="Achieved">Achieved</option>
                  </select>
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="primary-button">Save Goal</button>
                <button type="button" className="secondary-button" onClick={() => setIsGoalModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelliWealthAI;