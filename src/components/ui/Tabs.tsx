import React, { useState, useEffect } from 'react';

export interface Tab {
    id: string;
    label: string;
    content?: React.ReactNode;
    icon?: React.ReactNode;
    disabled?: boolean;
}

interface TabsProps {
    /** Array of tab definitions */
    tabs: Tab[];
    /** ID of the currently active tab (for controlled mode) */
    activeTab?: string;
    /** ID of the initially active tab (for uncontrolled mode) */
    defaultTab?: string;
    /** Callback fired when a tab is selected */
    onTabChange?: (id: string) => void;
    /** Additional CSS classes for the container */
    className?: string;
    /** Visual style variant of the tabs */
    variant?: 'default' | 'pills' | 'underline' | 'cards';
    /** Whether tabs should stretch to fill the container width */
    fullWidth?: boolean;
}

/**
 * A reusable Tabs component supporting controlled and uncontrolled modes.
 * Designed with Tailwind CSS for dark mode dashboards.
 */
const Tabs: React.FC<TabsProps> = ({
    tabs,
    activeTab: controlledActiveTab,
    defaultTab,
    onTabChange,
    className = '',
    variant = 'underline',
    fullWidth = false,
}) => {
    // State for uncontrolled mode
    const [internalActiveTab, setInternalActiveTab] = useState<string>(
        defaultTab || (tabs.length > 0 ? tabs[0].id : '')
    );

    // Determine if the component is controlled
    const isControlled = controlledActiveTab !== undefined;
    const currentTabId = isControlled ? controlledActiveTab : internalActiveTab;

    // Handle tab switching
    const handleTabClick = (id: string, disabled?: boolean) => {
        if (disabled) return;
        
        if (!isControlled) {
            setInternalActiveTab(id);
        }
        
        if (onTabChange) {
            onTabChange(id);
        }
    };

    // Ensure internal state updates if defaultTab changes in uncontrolled mode
    useEffect(() => {
        if (!isControlled && defaultTab) {
            setInternalActiveTab(defaultTab);
        }
    }, [defaultTab, isControlled]);

    // Container styles based on variant
    const getTabListClasses = () => {
        const base = "flex flex-wrap";
        switch (variant) {
            case 'pills':
                return `${base} gap-2`;
            case 'cards':
                return `${base} border-b border-gray-700`;
            case 'underline':
            default:
                return `${base} border-b border-gray-700`;
        }
    };

    // Individual tab button styles
    const getTabItemClasses = (isActive: boolean, disabled: boolean) => {
        const base = `
            group inline-flex items-center justify-center py-3 px-4 text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none
            ${fullWidth ? 'flex-1' : ''}
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `;

        if (variant === 'pills') {
            return `
                ${base} rounded-lg
                ${isActive 
                    ? 'bg-cyan-600 text-white shadow-md' 
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}
            `;
        }

        if (variant === 'cards') {
            return `
                ${base} rounded-t-lg border-b-2 border-x border-t
                ${isActive 
                    ? 'bg-gray-800 text-cyan-400 border-gray-700 border-b-gray-800' 
                    : 'bg-transparent text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-800/50'}
            `;
        }

        // Default / Underline
        return `
            ${base} border-b-2 -mb-px
            ${isActive 
                ? 'border-cyan-500 text-cyan-500' 
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'}
        `;
    };

    return (
        <div className={`w-full ${className}`}>
            <div className={getTabListClasses()} role="tablist">
                {tabs.map((tab) => {
                    const isActive = currentTabId === tab.id;
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`tab-panel-${tab.id}`}
                            id={`tab-${tab.id}`}
                            disabled={tab.disabled}
                            onClick={() => handleTabClick(tab.id, tab.disabled)}
                            className={getTabItemClasses(isActive, !!tab.disabled)}
                        >
                            {tab.icon && (
                                <span className={`mr-2 ${isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                                    {tab.icon}
                                </span>
                            )}
                            {tab.label}
                        </button>
                    );
                })}
            </div>
            <div className="mt-4">
                {tabs.map((tab) => {
                    if (currentTabId !== tab.id) return null;
                    return (
                        <div
                            key={tab.id}
                            role="tabpanel"
                            id={`tab-panel-${tab.id}`}
                            aria-labelledby={`tab-${tab.id}`}
                            className="animate-in fade-in duration-300"
                        >
                            {tab.content}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Tabs;