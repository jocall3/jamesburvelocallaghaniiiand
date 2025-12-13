import React from 'react';
import { Button } from '@/components/ui/button';

interface SubscriptionActionsProps {
  subscriptionId: string;
  plan: string; // e.g., 'AD11', 'AD12', 'AD17', 'AD25', 'AD26'
  onCancel: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onUpgrade: (id: string, newPlan: string) => void;
  onDowngrade: (id: string, newPlan: string) => void;
}

const SubscriptionActions: React.FC<SubscriptionActionsProps> = ({
  subscriptionId,
  plan,
  onCancel,
  onPause,
  onResume,
  onUpgrade,
  onDowngrade,
}) => {
  const availablePlans = ['AD11', 'AD12', 'AD17', 'AD25', 'AD26'];

  const handleCancel = () => {
    if (window.confirm(`Are you sure you want to cancel subscription ${subscriptionId}?`)) {
      onCancel(subscriptionId);
    }
  };

  const handlePause = () => {
    if (window.confirm(`Are you sure you want to pause subscription ${subscriptionId}?`)) {
      onPause(subscriptionId);
    }
  };

  const handleResume = () => {
    if (window.confirm(`Are you sure you want to resume subscription ${subscriptionId}?`)) {
      onResume(subscriptionId);
    }
  };

  const handleUpgrade = (newPlan: string) => {
    if (window.confirm(`Are you sure you want to upgrade subscription ${subscriptionId} to ${newPlan}?`)) {
      onUpgrade(subscriptionId, newPlan);
    }
  };

  const handleDowngrade = (newPlan: string) => {
    if (window.confirm(`Are you sure you want to downgrade subscription ${subscriptionId} to ${newPlan}?`)) {
      onDowngrade(subscriptionId, newPlan);
    }
  };

  const renderPlanChangeButtons = () => {
    const currentPlanIndex = availablePlans.indexOf(plan);
    if (currentPlanIndex === -1) return null; // Plan not recognized

    return (
      <>
        {/* Upgrade Options */}
        {availablePlans.slice(currentPlanIndex + 1).map((nextPlan) => (
          <Button key={`upgrade-${nextPlan}`} onClick={() => handleUpgrade(nextPlan)} variant="outline" className="ml-2">
            Upgrade to {nextPlan}
          </Button>
        ))}

        {/* Downgrade Options */}
        {availablePlans.slice(0, currentPlanIndex).map((prevPlan) => (
          <Button key={`downgrade-${prevPlan}`} onClick={() => handleDowngrade(prevPlan)} variant="outline" className="ml-2">
            Downgrade to {prevPlan}
          </Button>
        ))}
      </>
    );
  };

  return (
    <div className="flex items-center space-x-2">
      <Button onClick={handleCancel} variant="destructive">
        Cancel Subscription
      </Button>
      <Button onClick={handlePause} variant="outline">
        Pause Subscription
      </Button>
      <Button onClick={handleResume} variant="default">
        Resume Subscription
      </Button>
      {renderPlanChangeButtons()}
    </div>
  );
};

export default SubscriptionActions;