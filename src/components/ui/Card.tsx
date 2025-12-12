import React from 'react';

interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', action }) => {
    return (
        <div className={`bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden ${className}`}>
            {(title || action) && (
                <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                    {title && (
                        <h3 className="text-lg font-semibold text-white tracking-wide">
                            {title}
                        </h3>
                    )}
                    {action && (
                        <div className="ml-4">
                            {action}
                        </div>
                    )}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;