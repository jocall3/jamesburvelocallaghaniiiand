import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'success' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed";

    const sizeStyles = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    const variantStyles = {
        primary: "bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500 border border-transparent",
        secondary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 border border-transparent",
        success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 border border-transparent",
        warning: "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500 border border-transparent",
        danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-transparent",
        outline: "bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-gray-500",
        ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-gray-800 focus:ring-gray-500 border border-transparent",
    };

    const combinedClassName = `
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
        <button
            className={combinedClassName}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {!isLoading && leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
        </button>
    );
};

export default Button;