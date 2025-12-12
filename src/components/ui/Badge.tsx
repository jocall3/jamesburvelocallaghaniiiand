import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'critical' | 'info' | 'high' | 'neutral';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    critical: 'bg-red-900/40 text-red-200 border border-red-500/50 font-bold animate-pulse',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    neutral: 'bg-gray-600/20 text-gray-400 border border-gray-600/30',
};

/**
 * Helper function to automatically determine the badge color based on common status text.
 * This allows the Badge to be used with just text content and still look correct.
 */
const getVariantFromText = (text: string): BadgeVariant => {
    const lower = text.toLowerCase();
    
    // Success / Good
    if (['active', 'completed', 'implemented', 'low', 'open', 'valid'].includes(lower)) return 'success';
    
    // Warning / Caution
    if (['pending', 'pending renewal', 'under review', 'medium', 'draft', 'impact assessed', 'suspended'].includes(lower)) return 'warning';
    
    // Error / Bad
    if (['expired', 'revoked', 'blocked', 'rejected', 'failed'].includes(lower)) return 'error';
    
    // Critical / Severe
    if (['critical', 'severe'].includes(lower)) return 'critical';
    
    // High Priority / Risk
    if (['high'].includes(lower)) return 'high';
    
    // Info / Neutral
    if (['new', 'in progress', 'application', 'certificate', 'renewal', 'amendment'].includes(lower)) return 'info';
    
    return 'neutral';
};

const Badge: React.FC<BadgeProps> = ({ children, variant, className = '' }) => {
    let appliedVariant = variant;

    // Auto-detect variant if not provided and children is a string
    if (!appliedVariant && typeof children === 'string') {
        appliedVariant = getVariantFromText(children);
    }

    // Fallback to neutral if still undefined
    const styles = variantStyles[appliedVariant || 'neutral'];

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap ${styles} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;