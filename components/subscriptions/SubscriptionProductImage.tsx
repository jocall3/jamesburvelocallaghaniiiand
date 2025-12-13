import React from 'react';

interface SubscriptionProductImageProps {
  imageUrl: string;
  altText: string;
  className?: string;
}

const SubscriptionProductImage: React.FC<SubscriptionProductImageProps> = ({
  imageUrl,
  altText,
  className,
}) => {
  return (
    <div className={`relative ${className}`}>
      <img
        src={imageUrl}
        alt={altText}
        className="w-full h-auto object-cover rounded-lg shadow-md"
        loading="lazy"
      />
      {/* You can add overlays or badges here if needed for subscription status or promotions */}
    </div>
  );
};

export default SubscriptionProductImage;