import React from 'react';

interface SubscriptionAlertsProps {
  alerts: string[];
}

const SubscriptionAlerts: React.FC<SubscriptionAlertsProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded mb-4 shadow-md" role="alert">
      <p className="font-bold mb-2">Subscription Alerts:</p>
      <ul>
        {alerts.map((alert, index) => (
          <li key={index} className="text-sm">
            {alert}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubscriptionAlerts;