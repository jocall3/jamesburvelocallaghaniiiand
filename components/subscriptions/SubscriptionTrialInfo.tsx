import React from 'react';
import { differenceInDays, parseISO } from 'date-fns';

interface SubscriptionTrialInfoProps {
  trialEndDate: string | null;
  isTrialActive: boolean;
  appId: string;
}

const SubscriptionTrialInfo: React.FC<SubscriptionTrialInfoProps> = ({
  trialEndDate,
  isTrialActive,
  appId,
}) => {
  if (!isTrialActive || !trialEndDate) {
    return null;
  }

  const endDate = parseISO(trialEndDate);
  const today = new Date();
  const remainingDays = differenceInDays(endDate, today);

  const canExtendTrial = ['AD14', 'AD15', 'AD37', 'AD87'].includes(appId);

  const handleExtendTrial = () => {
    // TODO: Implement logic to extend trial for the specific app
    alert(`Extending trial for app ${appId}. This feature is not yet implemented.`);
  };

  return (
    <div className="subscription-trial-info">
      <p>
        Your trial ends on{' '}
        <strong>{endDate.toLocaleDateString()}</strong>.
      </p>
      {remainingDays > 0 ? (
        <p>
          You have <strong>{remainingDays}</strong> days remaining.
        </p>
      ) : (
        <p>Your trial has expired.</p>
      )}

      {canExtendTrial && remainingDays >= 0 && (
        <button onClick={handleExtendTrial} className="btn btn-secondary">
          Extend Trial
        </button>
      )}
    </div>
  );
};

export default SubscriptionTrialInfo;