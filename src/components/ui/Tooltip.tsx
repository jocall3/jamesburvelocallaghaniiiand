import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
    /** The content to display inside the tooltip */
    content: ReactNode;
    /** The element that triggers the tooltip */
    children: ReactNode;
    /** Position of the tooltip relative to the child */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Delay in milliseconds before showing the tooltip */
    delay?: number;
    /** Additional classes for the tooltip container */
    className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 200,
    className = '',
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent',
        bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent',
        left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent',
        right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent',
    };

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
            role="tooltip"
        >
            {children}
            {isVisible && (
                <div
                    className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg w-max max-w-xs pointer-events-none ${positionClasses[position]} ${className}`}
                >
                    {content}
                    <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
                </div>
            )}
        </div>
    );
};

export default Tooltip;