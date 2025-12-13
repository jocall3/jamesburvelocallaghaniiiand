import React from 'react';
import QRCode from 'qrcode.react';

interface SubscriptionQRDisplayProps {
  subscriptionId: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  fgColor?: string;
  bgColor?: string;
  includeMargin?: boolean;
}

const SubscriptionQRDisplay: React.FC<SubscriptionQRDisplayProps> = ({
  subscriptionId,
  size = 128,
  level = 'M',
  fgColor = '#000000',
  bgColor = '#ffffff',
  includeMargin = true,
}) => {
  if (!subscriptionId) {
    return <div className="text-red-500">Subscription ID is missing.</div>;
  }

  return (
    <div className="flex justify-center items-center p-4 bg-white rounded-lg shadow-md">
      <QRCode
        value={subscriptionId}
        size={size}
        level={level}
        fgColor={fgColor}
        bgColor={bgColor}
        includeMargin={includeMargin}
      />
    </div>
  );
};

export default SubscriptionQRDisplay;