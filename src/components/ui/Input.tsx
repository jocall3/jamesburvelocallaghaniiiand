import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  error?: string | boolean;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, className, wrapperClassName, ...props }, ref) => {
    const baseInputClasses =
      'w-full bg-gray-700/50 p-2 rounded text-white border border-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed';
    
    const errorInputClasses = 'border-red-500 focus:border-red-500 focus:ring-red-500';

    return (
      <div className={`w-full ${wrapperClassName || ''}`}>
        {label && (
          <label htmlFor={id} className="block text-gray-300 text-sm font-bold mb-2">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`${baseInputClasses} ${error ? errorInputClasses : ''} ${className || ''}`}
          {...props}
        />
        {error && typeof error === 'string' && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;