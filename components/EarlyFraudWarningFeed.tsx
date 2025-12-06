
import React, { useState, useEffect } from 'react';

interface EarlyFraudWarning {
  id: string;
  charge: string;
  fraud_type: string;
  created: number;
}

const EarlyFraudWarningFeed: React.FC = () => {
  const [warnings, setWarnings] = useState<EarlyFraudWarning[]>([]);

  useEffect(() => {
    // Simulate fetching new early fraud warnings.  In a real
    // application, this would likely be a websocket connection
    // or long-polling to a server.
    const fetchNewWarnings = () => {
      // Mock data for testing.  Replace with actual API call.
      const newWarnings: EarlyFraudWarning[] = [
        {
          id: `issfr_${Date.now()}`,
          charge: 'ch_1234',
          fraud_type: 'card_testing',
          created: Date.now(),
        },
      ];

      setWarnings((prevWarnings) => [...newWarnings, ...prevWarnings]);
    };

    // Fetch initial warnings (if any)
    // fetchInitialWarnings();  // Replace with actual API call

    // Simulate new warnings arriving every 5 seconds
    const intervalId = setInterval(fetchNewWarnings, 5000);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div>
      <h3>Early Fraud Warnings</h3>
      <ul>
        {warnings.map((warning) => (
          <li key={warning.id}>
            Charge: {warning.charge}, Fraud Type: {warning.fraud_type}, Created:{' '}
            {new Date(warning.created).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EarlyFraudWarningFeed;
