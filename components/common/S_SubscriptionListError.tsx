import React from 'react';

interface S_SubscriptionListErrorProps {
  message: string;
}

const S_SubscriptionListError: React.FC<S_SubscriptionListErrorProps> = ({ message }) => {
  return (
    <div className="flex items-center justify-center p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-sm">
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <span className="font-medium">Error:</span> {message}
    </div>
  );
};

export default S_SubscriptionListError;