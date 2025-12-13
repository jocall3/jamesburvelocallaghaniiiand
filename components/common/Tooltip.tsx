import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  contentClassName?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  className = '',
  contentClassName = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) {
      setTooltipStyle({});
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 5;
        left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + 5;
        left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - 5;
        break;
      case 'right':
        top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + scrollX + 5;
        break;
      default:
        break;
    }

    // Adjust position to stay within viewport
    if (top < scrollY) {
      top = scrollY + 5;
    }
    if (left < scrollX) {
      left = scrollX + 5;
    }
    if (top + tooltipRect.height > window.innerHeight + scrollY) {
      top = window.innerHeight + scrollY - tooltipRect.height - 5;
    }
    if (left + tooltipRect.width > window.innerWidth + scrollX) {
      left = window.innerWidth + scrollX - tooltipRect.width - 5;
    }

    setTooltipStyle({ top, left });
  }, [isVisible, position, content]);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 p-2 rounded shadow-lg bg-gray-800 text-white text-xs whitespace-nowrap transition-opacity duration-200 ${contentClassName}`}
          style={tooltipStyle}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;