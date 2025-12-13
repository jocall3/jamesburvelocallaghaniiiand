import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  type?: string;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, type = 'text', className = '', ...props }, ref) => {
    const baseClasses =
      'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm transition duration-150 ease-in-out';
    
    const inputClasses = error
      ? `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500`
      : `${baseClasses} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;

    return (
      <div className={`mb-4 ${className}`}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="mt-1">
          <input
            ref={ref}
            id={id}
            name={id}
            type={type}
            className={inputClasses}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${id}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;