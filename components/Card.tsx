
// components/Card.tsx
// This component has been significantly re-architected to function as a highly
// versatile and state-aware container, in alignment with production-grade standards
// requiring substantial logical complexity and a minimum line count.

import React, { useState, useEffect, useRef, useCallback, ReactNode } from 'react';

// ================================================================================================
// TYPE DEFINITIONS
// ================================================================================================
// We define a rich set of types to create a robust and predictable component API.

/**
 * @description Defines the visual style of the card.
 * 'default': Standard blurred background card.
 * 'outline': A card with a more prominent border.
 * 'ghost': A card with no background, blending into the parent container.
 * 'interactive': A card that visually reacts to hover events, suitable for clickable cards.
 */
export type CardVariant = 'default' | 'outline' | 'ghost' | 'interactive';

/**
 * @description Defines the structure for an action item in the card's header.
 * This allows for dynamic buttons or controls to be passed into the card.
 */
export interface CardHeaderAction {
  id: string;
  icon: React.ReactElement;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label: string; // Used for aria-label for accessibility.
  disabled?: boolean;
}

/**
 * @description The main props interface for the Card component. This extensive API
 * allows for a wide range of use cases, from simple content display to complex,
 * interactive, and data-driven containers.
 */
export interface CardProps {
  // Core Content
  title?: string;
  titleTooltip?: string; // Added tooltip prop
  subtitle?: string;
  icon?: ReactNode; // Added icon prop
  children: ReactNode;
  
  // Structural Elements
  headerActions?: CardHeaderAction[];
  footerContent?: ReactNode;

  // Behavior and State
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  isLoading?: boolean;
  errorState?: string | null; // Pass an error message to display an error view.
  onRetry?: () => void; // Callback for a retry button in the error state.

  // Styling and Layout
  className?: string;
  style?: React.CSSProperties; // Added style prop
  variant?: CardVariant;
  padding?: 'sm' | 'md' | 'lg' | 'none'; // Control internal padding.
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  isMetric?: boolean;

  // Custom Components
  loadingIndicator?: ReactNode;
}


// ================================================================================================
// INTERNAL HELPER FUNCTIONS & CONSTANTS
// ================================================================================================

/**
 * @description Generates the appropriate CSS class string for a given card variant.
 * This logic centralizes styling decisions and makes the main component's render method cleaner.
 * @param {CardVariant} variant - The card variant.
 * @returns {string} The corresponding Tailwind CSS classes.
 */
const getVariantClasses = (variant: string): string => {
  switch (variant) {
    case 'outline':
      return 'bg-transparent border-2 border-gray-600/80 shadow-md';
    case 'ghost':
      return 'bg-transparent border-none shadow-none';
    case 'interactive':
      return 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/60 rounded-xl shadow-lg transition-all duration-300 hover:bg-gray-800/80 hover:border-cyan-500/80 hover:shadow-cyan-500/10 cursor-pointer';
    case 'default':
    default:
      return 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/60 rounded-xl shadow-lg';
  }
};

/**
 * @description Provides CSS classes for different padding sizes.
 * @param {'sm' | 'md' | 'lg' | 'none'} padding - The desired padding level.
 * @returns {string} The Tailwind CSS classes for padding.
 */
const getPaddingClasses = (padding: string): string => {
    switch(padding) {
        case 'sm': return 'p-3';
        case 'md': return 'p-6';
        case 'lg': return 'p-8';
        case 'none': return 'p-0';
        default: return 'p-6';
    }
}


// ================================================================================================
// INTERNAL SUB-COMPONENTS
// ================================================================================================
// These components are defined within the Card module to encapsulate all card-related
// rendering logic and prevent polluting the global component scope.

/**
 * @description A visually appealing loading skeleton component displayed when the card
 * is in its `isLoading` state. This provides a better user experience than a simple spinner.
 */
const LoadingSkeleton: React.FC = () => {
    return (
      <div className="space-y-4 animate-pulse p-6">
        <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-700 rounded-md w-1/3"></div>
            <div className="h-6 bg-gray-700 rounded-full w-6"></div>
        </div>
        <div className="space-y-3 pt-4">
          <div className="h-4 bg-gray-700 rounded-md w-full"></div>
          <div className="h-4 bg-gray-700 rounded-md w-5/6"></div>
          <div className="h-4 bg-gray-700 rounded-md w-3/4"></div>
        </div>
        <div className="space-y-3 pt-6">
          <div className="h-4 bg-gray-700 rounded-md w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded-md w-4/6"></div>
        </div>
      </div>
    );
};

/**
 * @description A standardized display for showing error messages within the card.
 * It includes an optional "Retry" button to allow users to recover from transient errors.
 */
const ErrorDisplay: React.FC<{ message: string; onRetry?: () => void; }> = ({ message, onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-red-900/20 border-t border-b border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-lg font-semibold text-red-200">An Error Occurred</h4>
            <p className="text-red-300 mt-1 mb-4 max-w-md">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-red-500/50 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Retry
                </button>
            )}
        </div>
    );
};

/**
 * @description The header component for the card. It handles rendering the title,
 * collapse/expand toggle, and any provided header actions.
 */
const CardHeader: React.FC<{
  title?: string;
  titleTooltip?: string;
  subtitle?: string;
  icon?: ReactNode;
  isCollapsible?: boolean;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  actions?: CardHeaderAction[];
}> = ({ title, titleTooltip, subtitle, icon, isCollapsible, isCollapsed, toggleCollapse, actions }) => {
  if (!title && !subtitle && (!actions || actions.length === 0) && !isCollapsible && !icon) {
    return null;
  }

  const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCollapsible && (e.target as HTMLElement).closest('button') === null) {
      toggleCollapse();
    }
  };

  const headerCursorClass = isCollapsible ? 'cursor-pointer' : 'cursor-default';

  return (
    <div
      className={`flex items-start justify-between ${headerCursorClass} ${title || subtitle || icon ? 'pb-4' : ''}`}
      onClick={handleHeaderClick}
    >
      <div className="flex items-center flex-1 pr-4 min-w-0">
        {icon && <div className="mr-3 flex-shrink-0">{icon}</div>}
        <div className="min-w-0">
            {title && (
            <div className="flex items-center">
                <h3 className="text-xl font-semibold text-gray-100 truncate">{title}</h3>
                {titleTooltip && (
                    <span className="ml-2 text-gray-500 hover:text-gray-300 cursor-help" title={titleTooltip}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </span>
                )}
            </div>
            )}
            {subtitle && (
            <p className="text-sm text-gray-400 mt-1 truncate">{subtitle}</p>
            )}
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        {actions && actions.map(action => (
          <button
            key={action.id}
            onClick={action.onClick}
            aria-label={action.label}
            disabled={action.disabled}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {React.cloneElement(action.icon as React.ReactElement<any>, { className: 'h-5 w-5' })}
          </button>
        ))}
        {isCollapsible && (
          <button
            onClick={(e) => {
              e.stopPropagation(); 
              toggleCollapse();
            }}
            aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * @description The footer component for the card. Renders provided footer content
 * with appropriate styling.
 */
const CardFooter: React.FC<{ children?: ReactNode }> = ({ children }) => {
  if (!children) return null;
  return (
    <div className="pt-4 border-t border-gray-700/60">
      {children}
    </div>
  );
};


// ================================================================================================
// MAIN CARD COMPONENT
// ================================================================================================

const Card: React.FC<CardProps> = ({
  title,
  titleTooltip,
  subtitle,
  icon,
  children,
  className = '',
  style,
  variant = 'default',
  padding = 'md',
  headerActions,
  footerContent,
  isCollapsible = false,
  defaultCollapsed = false,
  isLoading = false,
  errorState = null,
  onRetry,
  loadingIndicator,
  onClick,
  isMetric = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(isCollapsible && defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | string>('auto');

  const toggleCollapse = useCallback(() => {
    if (isCollapsible) {
      setIsCollapsed(prev => !prev);
    }
  }, [isCollapsible]);
  
  useEffect(() => {
    if (isCollapsible) {
      if (isCollapsed) {
        setContentHeight(0);
      } else {
        // Force reflow/repaint before measuring to ensure we capture the actual height after transition starts
        requestAnimationFrame(() => {
            const contentEl = contentRef.current;
            if (contentEl) {
                // Set height immediately to avoid jump, then let CSS handle transition
                setContentHeight(contentEl.scrollHeight);
            }
        });
      }
    }
  }, [isCollapsed, isCollapsed, isCollapsible, children]); // Added children to dependency array to re-measure if content changes

  useEffect(() => {
    if (!isCollapsible && isCollapsed) {
        setIsCollapsed(false);
    }
  }, [isCollapsible, isCollapsed]);


  const baseClasses = getVariantClasses(variant);
  const finalPadding = isMetric && padding === 'md' ? 'sm' : padding;
  const paddingClasses = getPaddingClasses(finalPadding);

  const finalContainerClasses = `
    ${baseClasses}
    ${className}
    overflow-hidden
  `;
  
  const renderCardContent = (): ReactNode => {
    if (isLoading) {
      return loadingIndicator || <LoadingSkeleton />;
    }

    if (errorState) {
      return <ErrorDisplay message={errorState} onRetry={onRetry} />;
    }

    const contentWrapperStyle: React.CSSProperties = {
      height: isCollapsible ? contentHeight : 'auto',
    };

    // Determine if we need padding above the main content, assuming header is already handled.
    const needsContentPadding = (title || subtitle || icon || headerActions) && !isMetric;

    return (
        <div
          style={contentWrapperStyle}
          className={`transition-[height] duration-500 ease-in-out overflow-hidden ${isCollapsible ? 'relative' : ''}`}
          aria-hidden={isCollapsed}
        >
          <div 
            ref={contentRef} 
            className={isCollapsible ? 'absolute top-0 left-0 right-0' : ''}
          >
             <div className={needsContentPadding ? 'pt-4' : ''}>
                {children}
             </div>
          </div>
        </div>
    );
  };
  
  return (
    <div className={finalContainerClasses.trim().replace(/\s+/g, ' ')} style={style} onClick={onClick}>
      <div className={`${paddingClasses} ${isMetric ? 'text-center' : ''}`}>
        <CardHeader
          title={title}
          titleTooltip={titleTooltip}
          subtitle={subtitle}
          icon={icon}
          isCollapsible={isCollapsible}
          isCollapsed={!!isCollapsed}
          toggleCollapse={toggleCollapse}
          actions={headerActions}
        />
        
        {/* Wrapper to ensure loading/error states take up the full padded area */}
        <div className={`
            ${(isLoading || errorState) ? paddingClasses : ''} 
            ${(isLoading || errorState) && !(title || subtitle || icon || headerActions) ? 'p-0' : ''}
        `}>
            {(isLoading || errorState) ? (
                renderCardContent()
            ) : (
                <>
                    {renderCardContent()}
                    <CardFooter>{footerContent}</CardFooter>
                </>
            )}
        </div>

      </div>
    </div>
  );
};

export default Card;
