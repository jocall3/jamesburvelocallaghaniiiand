```typescript
import React, { useState, useEffect, useMemo } from 'react';

// --- Type Definitions ---
type InsightType = 'ANOMALY' | 'PREDICTION' | 'RECOMMENDATION';

interface Insight {
  id: number;
  type: InsightType;
  timestamp: string;
  message: string;
}

// --- SVG Icons as React Components ---

const AnomalyIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </svg>
);

const PredictionIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M8 0a.5.5 0 0 1 .5.5V3h1.5a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V4H6a.5.5 0 0 1 0-1h1.5V.5A.5.5 0 0 1 8 0zM3.5 4a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V4.5a.5.5 0 0 0-.5-.5zM8 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM6.354 7.646a.5.5 0 0 1-.708 0l-1-1a.5.5 0 1 1 .708-.708l1 1a.5.5 0 0 1 0 .708zm4.354.708a.5.5 0 0 1 0-.708l1-1a.5.5 0 0 1 .708.708l-1 1a.5.5 0 0 1-.708 0z"/>
  </svg>
);

const RecommendationIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A6 6 0 0 1 2 6zM6 16s-1.5-2-1.5-5.5A4.5 4.5 0 0 1 9 1.5a.5.5 0 0 0 1 0A5.5 5.5 0 0 0 5.5 6.5C5.5 9.5 4 16 4 16z"/>
  </svg>
);

// --- Mock Data Generation ---

const MOCK_MESSAGES: Record<InsightType, string[]> = {
  ANOMALY: [
    "Unusual login attempt detected from new device for account ending in 7899.",
    "High-risk transaction of $5,230.14 flagged for manual review on account ...93f6.",
    "Multiple failed password attempts on customer profile ...5f9. Account locked.",
    "Potential credential stuffing attack detected. Monitoring initiated.",
    "Anomalous API usage pattern from client_id 'partner-fintech-app'. Rate limit temporarily tightened.",
  ],
  PREDICTION: [
    "Predicting high credit card reward redemption volume in the next 72 hours.",
    "Customer ...d5f9 likely to churn. Proactive retention offer recommended.",
    "Forecast indicates a 15% increase in 'Shop with Points' linkage requests this quarter.",
    "High probability of successful cross-sell for 'Citi Savings Account' to user ...3ee0.",
    "AI model predicts seasonal spending surge in travel-related categories starting next week.",
  ],
  RECOMMENDATION: [
    "Recommend offering Citi Rewards+℠ Card to customer ...d5f9 based on spending habits.",
    "Activate real-time fraud alerts for account ...7899 due to recent travel patterns.",
    "System suggests consolidating multiple small savings accounts for customer ...93f6 to maximize interest.",
    "Automated system health check recommended for the '/oauth2/token' endpoint due to rising latency.",
    "Engage customer ...3ee0 with a targeted marketing campaign for investment products.",
  ],
};

let insightIdCounter = 0;
const generateRandomInsight = (): Insight => {
  const types: InsightType[] = ['ANOMALY', 'PREDICTION', 'RECOMMENDATION'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  const messagesForType = MOCK_MESSAGES[randomType];
  const randomMessage = messagesForType[Math.floor(Math.random() * messagesForType.length)];

  return {
    id: insightIdCounter++,
    type: randomType,
    timestamp: new Date().toLocaleTimeString('en-US'),
    message: randomMessage,
  };
};

// --- Helper Functions ---
const getInsightConfig = (type: InsightType) => {
    switch (type) {
        case 'ANOMALY':
            return {
                Icon: AnomalyIcon,
                color: '#ff4d4f', // Red
            };
        case 'PREDICTION':
            return {
                Icon: PredictionIcon,
                color: '#722ed1', // Purple
            };
        case 'RECOMMENDATION':
            return {
                Icon: RecommendationIcon,
                color: '#52c41a', // Green
            };
    }
}

// --- Main Component ---

const InsightStream: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    const initialInsights = Array.from({ length: 15 }, () => generateRandomInsight());
    setInsights(initialInsights);

    const intervalId = setInterval(() => {
      setInsights(prevInsights => {
        const newInsight = generateRandomInsight();
        return [...prevInsights.slice(1), newInsight];
      });
    }, 4000); // Add a new insight every 4 seconds

    return () => clearInterval(intervalId);
  }, []);
  
  const animationDuration = useMemo(() => insights.length * 8, [insights.length]);

  const keyframes = `
    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `;
  
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#1c1c1e',
    color: '#e0e0e0',
    borderTop: '1px solid #444',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    fontFamily: 'monospace',
    fontSize: '14px',
    padding: '8px 0',
  };

  const contentContainerStyle: React.CSSProperties = {
    width: 'fit-content',
    display: 'flex',
    animation: `scroll ${animationDuration}s linear infinite`,
  };
  
  const renderInsights = (isDuplicate = false) => {
      return insights.map((insight, index) => {
        const { Icon, color } = getInsightConfig(insight.type);
        const itemStyle: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 24px',
            color: color,
        };
        const timeStyle: React.CSSProperties = {
            color: '#888',
            marginRight: '10px',
        };

        return (
          <div key={isDuplicate ? `dup-${insight.id}` : insight.id} style={itemStyle}>
            <Icon />
            <span style={timeStyle}>[{insight.timestamp}]</span>
            <span>{insight.message}</span>
          </div>
        );
      });
  }

  return (
    <>
      <style>{keyframes}</style>
      <div style={containerStyle}>
        <div style={contentContainerStyle}>
          {renderInsights()}
          {renderInsights(true)}
        </div>
      </div>
    </>
  );
};

export default InsightStream;
```